import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { verifyPaymongoSignature } from "../_shared/paymongo.ts";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function unixToIso(value: number | null | undefined) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function extractCardMetadata(payment: any) {
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

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = getEnv("PAYMONGO_WEBHOOK_SECRET");

    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const livemode = Boolean(payload?.data?.attributes?.livemode);

    const signatureIsValid = await verifyPaymongoSignature({
      rawBody,
      signatureHeader: request.headers.get("Paymongo-Signature"),
      webhookSecret,
      livemode,
    });

    if (!signatureIsValid) {
      return jsonResponse({ error: "Invalid PayMongo signature." }, 401);
    }

    const eventType = payload?.data?.attributes?.type;
    if (eventType !== "checkout_session.payment.paid") {
      return jsonResponse({ received: true, ignored: true });
    }

    const checkoutPayload = payload?.data?.attributes?.data;
    const checkoutAttributes = checkoutPayload?.attributes || {};
    const payment = checkoutAttributes?.payments?.[0];
    const paymentReference =
      payment?.id ||
      payment?.attributes?.payment_intent_id ||
      checkoutAttributes?.payment_intent?.id ||
      null;
    const paidAt =
      unixToIso(payment?.attributes?.paid_at) ||
      unixToIso(checkoutAttributes?.paid_at) ||
      new Date().toISOString();
    const cardMetadata = extractCardMetadata(payment);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: checkoutSession, error: checkoutSessionError } = await supabase
      .from("customer_checkout_sessions")
      .select("id, user_id, status")
      .eq("paymongo_checkout_id", checkoutPayload?.id)
      .maybeSingle();

    if (checkoutSessionError) {
      throw checkoutSessionError;
    }

    if (!checkoutSession) {
      return jsonResponse({ received: true, missing: true }, 202);
    }

    if (checkoutSession.status === "paid") {
      return jsonResponse({ received: true, duplicate: true });
    }

    const { data: checkoutItems, error: checkoutItemsError } = await supabase
      .from("customer_checkout_items")
      .select(
        `
        service_id,
        freelancer_id,
        unit_price,
        platform_fee,
        freelancer_net
      `
      )
      .eq("checkout_session_id", checkoutSession.id);

    if (checkoutItemsError || !checkoutItems || checkoutItems.length === 0) {
      throw checkoutItemsError || new Error("Checkout items are missing.");
    }

    const orderRows = checkoutItems.map((item) => ({
      checkout_session_id: checkoutSession.id,
      service_id: item.service_id,
      customer_id: checkoutSession.user_id,
      freelancer_id: item.freelancer_id,
      status: "pending",
      total_price: item.unit_price,
      gross_amount: item.unit_price,
      platform_fee: item.platform_fee,
      freelancer_net: item.freelancer_net,
      payment_provider: "paymongo",
      payment_reference: paymentReference,
      escrow_status: "held",
      paid_at: paidAt,
    }));

    const { error: orderInsertError } = await supabase
      .from("orders")
      .upsert(orderRows, {
        onConflict: "checkout_session_id,service_id,customer_id",
      });

    if (orderInsertError) {
      throw orderInsertError;
    }

    const { error: sessionUpdateError } = await supabase
      .from("customer_checkout_sessions")
      .update({
        status: "paid",
        payment_reference: paymentReference,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutSession.id);

    if (sessionUpdateError) {
      throw sessionUpdateError;
    }

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

    const serviceIds = checkoutItems.map((item) => item.service_id);

    const { error: cartDeleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", checkoutSession.user_id)
      .in("service_id", serviceIds);

    if (cartDeleteError) {
      throw cartDeleteError;
    }

    return jsonResponse({ received: true, processed: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't process the PayMongo webhook.",
      },
      500
    );
  }
});
