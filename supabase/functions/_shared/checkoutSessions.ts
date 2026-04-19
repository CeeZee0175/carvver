export function unixToIso(value: number | null | undefined) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

export function normalizePaymentStatus(status: unknown) {
  const value = String(status || "").trim().toLowerCase();

  if (["draft", "pending", "paid", "failed", "expired", "cancelled", "superseded", "refunded"].includes(value)) {
    return value;
  }

  return "pending";
}

export function extractCardMetadata(payment: any) {
  const source = payment?.attributes?.source || {};
  const paymentMethodDetails =
    payment?.attributes?.payment_method_details ||
    payment?.attributes?.payment_method?.details ||
    source?.details ||
    {};
  const card =
    paymentMethodDetails?.card ||
    source?.card ||
    source?.details?.card ||
    payment?.attributes?.card ||
    {};
  const brand = card?.brand || paymentMethodDetails?.brand || null;
  const last4 = card?.last4 || paymentMethodDetails?.last4 || null;
  const expMonth = card?.exp_month || paymentMethodDetails?.exp_month || null;
  const expYear = card?.exp_year || paymentMethodDetails?.exp_year || null;
  const paymentMethodId =
    payment?.attributes?.payment_method_id ||
    payment?.attributes?.payment_method?.id ||
    null;
  const customerId =
    payment?.attributes?.customer_id ||
    payment?.attributes?.payment_method?.customer_id ||
    null;

  if (!brand || !last4 || !expMonth || !expYear) {
    return null;
  }

  return {
    default_card_payment_method_id: paymentMethodId,
    default_card_brand: String(brand),
    default_card_last4: String(last4),
    default_card_exp_month: Number(expMonth),
    default_card_exp_year: Number(expYear),
    paymongo_customer_id: customerId ? String(customerId) : null,
    preferred_payment_method: "card",
  };
}

export async function loadCheckoutSessionByLocalId(supabase: any, sessionId: string) {
  const { data, error } = await supabase
    .from("customer_checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function loadCheckoutSessionByRemoteReference(
  supabase: any,
  {
    paymongoCheckoutId,
    paymongoPaymentIntentId,
  }: { paymongoCheckoutId?: string | null; paymongoPaymentIntentId?: string | null }
) {
  if (paymongoCheckoutId) {
    const { data, error } = await supabase
      .from("customer_checkout_sessions")
      .select("*")
      .eq("paymongo_checkout_id", paymongoCheckoutId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  if (paymongoPaymentIntentId) {
    const { data, error } = await supabase
      .from("customer_checkout_sessions")
      .select("*")
      .eq("paymongo_payment_intent_id", paymongoPaymentIntentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  return null;
}

export async function updateCheckoutSession(
  supabase: any,
  sessionId: string,
  patch: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("customer_checkout_sessions")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function finalizeSuccessfulCheckoutSession({
  supabase,
  checkoutSession,
  paymentReference,
  paidAt,
  cardMetadata,
}: {
  supabase: any;
  checkoutSession: any;
  paymentReference: string | null;
  paidAt: string;
  cardMetadata?: Record<string, unknown> | null;
}) {
  if (!checkoutSession) {
    throw new Error("Checkout session is missing.");
  }

  if (String(checkoutSession.status || "").toLowerCase() === "paid") {
    return checkoutSession;
  }

  const { data: checkoutItems, error: checkoutItemsError } = await supabase
    .from("customer_checkout_items")
    .select(
      `
      service_id,
      freelancer_id,
      fulfillment_type,
      selected_package_id,
      selected_package_name,
      selected_package_summary,
      selected_package_delivery_time_days,
      selected_package_revisions,
      selected_package_included_items,
      unit_price,
      platform_fee,
      freelancer_net
    `
    )
    .eq("checkout_session_id", checkoutSession.id);

  if (checkoutItemsError || !checkoutItems || checkoutItems.length === 0) {
    throw checkoutItemsError || new Error("Checkout items are missing.");
  }

  const orderRows = checkoutItems.map((item: any) => ({
    checkout_session_id: checkoutSession.id,
    service_id: item.service_id,
    customer_id: checkoutSession.user_id,
    freelancer_id: item.freelancer_id,
    fulfillment_type:
      String(item.fulfillment_type || "").trim().toLowerCase() === "physical"
        ? "physical"
        : "digital",
    status: "pending",
    total_price: item.unit_price,
    selected_package_id: item.selected_package_id,
    selected_package_name: item.selected_package_name,
    selected_package_summary: item.selected_package_summary,
    selected_package_delivery_time_days: item.selected_package_delivery_time_days,
    selected_package_revisions: item.selected_package_revisions,
    selected_package_included_items: item.selected_package_included_items,
    gross_amount: item.unit_price,
    platform_fee: item.platform_fee,
    freelancer_net: item.freelancer_net,
    payment_provider: "paymongo",
    payment_reference: paymentReference,
    escrow_status: "held",
    paid_at: paidAt,
  }));

  const { error: orderInsertError } = await supabase.from("orders").upsert(orderRows, {
    onConflict: "checkout_session_id,service_id,customer_id",
  });

  if (orderInsertError) {
    throw orderInsertError;
  }

  const nextSession = await updateCheckoutSession(supabase, checkoutSession.id, {
    status: "paid",
    payment_reference: paymentReference,
    paid_at: paidAt,
  });

  if (cardMetadata) {
    const { error: billingProfileError } = await supabase
      .from("customer_billing_profiles")
      .upsert(
        {
          customer_id: checkoutSession.user_id,
          ...cardMetadata,
        },
        { onConflict: "customer_id" }
      );

    if (billingProfileError) {
      throw billingProfileError;
    }
  }

  const serviceIds = checkoutItems.map((item: any) => item.service_id);

  const { error: cartDeleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", checkoutSession.user_id)
    .in("service_id", serviceIds);

  if (cartDeleteError) {
    throw cartDeleteError;
  }

  return nextSession;
}
