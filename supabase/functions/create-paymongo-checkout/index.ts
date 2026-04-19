import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  extractBearerToken,
  jsonResponse,
  serializeError,
} from "../_shared/http.ts";
import {
  attachPaymentIntent,
  createCheckoutSession,
  createPaymentIntent,
  createPaymentMethod,
  toCentavos,
} from "../_shared/paymongo.ts";
import { updateCheckoutSession } from "../_shared/checkoutSessions.ts";

const COMMISSION_RATE = 0.05;
const QR_LIFETIME_MS = 30 * 60 * 1000;

type PaymentMethod = "qrph" | "card";

type CartService = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fulfillment_type: string | null;
  price: number | string;
  is_published: boolean | null;
  freelancer_id: string;
};

type CartItemRow = {
  service_id: string;
  selected_package_id: string | null;
  selected_package_name: string | null;
  selected_package_summary: string | null;
  selected_package_price: number | string | null;
  selected_package_delivery_time_days: number | null;
  selected_package_revisions: number | null;
  selected_package_included_items: string[] | null;
  services: CartService | CartService[] | null;
};

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function roundCurrency(value: number) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeService(service: CartService | CartService[] | null | undefined) {
  if (Array.isArray(service)) {
    return service[0] ?? null;
  }

  return service ?? null;
}

function normalizeCartItem(row: CartItemRow) {
  const service = normalizeService(row.services);
  if (!service) return null;

  const selectedPrice = Number(row.selected_package_price ?? service.price ?? 0);
  const unitPrice = roundCurrency(selectedPrice);

  return {
    service,
    packageSnapshot: {
      id: row.selected_package_id || null,
      name: row.selected_package_name || null,
      summary: row.selected_package_summary || null,
      deliveryTimeDays: row.selected_package_delivery_time_days ?? null,
      revisions: row.selected_package_revisions ?? null,
      includedItems: row.selected_package_included_items || [],
    },
    unitPrice,
  };
}

function resolveReturnUrl(baseUrl: string, candidate: unknown, fallback: string) {
  const nextPath =
    typeof candidate === "string" && candidate.startsWith("/") ? candidate : fallback;
  return new URL(nextPath, baseUrl).toString();
}

function assertPaymentMethod(value: unknown): PaymentMethod {
  if (value === "card") return "card";
  return "qrph";
}

async function createCartSnapshotHash(items: any[]) {
  const encoder = new TextEncoder();
  const payload = JSON.stringify(
    items.map((item) => ({
      serviceId: item.service.id,
      packageId: item.packageSnapshot.id,
      packageName: item.packageSnapshot.name,
      price: item.unitPrice,
    }))
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(payload));

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildSessionResponse(checkoutSession: any, extras: Record<string, unknown> = {}) {
  return {
    sessionId: checkoutSession.id,
    method: checkoutSession.local_payment_method,
    status: checkoutSession.status,
    subtotal: Number(checkoutSession.subtotal || 0),
    currency: checkoutSession.currency || "PHP",
    checkoutUrl: checkoutSession.checkout_url || null,
    qrImageUrl: checkoutSession.qr_image_url || null,
    qrExpiresAt: checkoutSession.qr_expires_at || null,
    resumed: false,
    ...extras,
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
    const paymongoSecretKey = getEnv("PAYMONGO_SECRET_KEY");
    const appBaseUrl = getEnv("APP_BASE_URL");

    const authHeader = request.headers.get("Authorization");
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const method = assertPaymentMethod(body?.method);

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        `
        service_id,
        selected_package_id,
        selected_package_name,
        selected_package_summary,
        selected_package_price,
        selected_package_delivery_time_days,
        selected_package_revisions,
        selected_package_included_items,
        services (
          id,
          title,
          description,
          category,
          fulfillment_type,
          price,
          is_published,
          freelancer_id
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (cartError) {
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      return jsonResponse({ error: "Your cart is empty." }, 400);
    }

    const validItems = (cartItems || [])
      .map((row) => normalizeCartItem(row as CartItemRow))
      .filter(
        (
          item
        ): item is NonNullable<ReturnType<typeof normalizeCartItem>> =>
          Boolean(item?.service?.is_published)
      );

    if (validItems.length === 0) {
      return jsonResponse(
        { error: "Your cart only contains unavailable listings." },
        400
      );
    }

    const subtotal = roundCurrency(
      validItems.reduce((total, item) => total + Number(item.unitPrice || 0), 0)
    );
    const cartSnapshotHash = await createCartSnapshotHash(validItems);
    const now = Date.now();

    const { data: activeSessions, error: activeSessionsError } = await supabase
      .from("customer_checkout_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("cart_snapshot_hash", cartSnapshotHash)
      .eq("local_payment_method", method)
      .in("status", ["draft", "pending"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeSessionsError) {
      throw activeSessionsError;
    }

    const existingSession = activeSessions?.[0] || null;

    if (
      method === "qrph" &&
      existingSession?.qr_image_url &&
      existingSession?.qr_expires_at &&
      new Date(existingSession.qr_expires_at).getTime() > now
    ) {
      return jsonResponse({
        ...buildSessionResponse(existingSession, {
          resumed: true,
          itemCount: validItems.length,
        }),
      });
    }

    if (method === "card" && existingSession?.checkout_url) {
      return jsonResponse({
        ...buildSessionResponse(existingSession, {
          resumed: true,
          itemCount: validItems.length,
        }),
      });
    }

    await supabase
      .from("customer_checkout_sessions")
      .update({
        status: "superseded",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .in("status", ["draft", "pending"]);

    const { data: checkoutSession, error: checkoutSessionError } = await supabase
      .from("customer_checkout_sessions")
      .insert({
        user_id: user.id,
        paymongo_checkout_id: null,
        status: "draft",
        subtotal,
        currency: "PHP",
        local_payment_method: method,
        cart_snapshot_hash: cartSnapshotHash,
      })
      .select("*")
      .single();

    if (checkoutSessionError || !checkoutSession) {
      throw checkoutSessionError || new Error("Couldn't create a payment session.");
    }

    const checkoutRows = validItems.map((item) => {
      const service = item.service;
      const unitPrice = roundCurrency(Number(item.unitPrice || 0));
      const platformFee = roundCurrency(unitPrice * COMMISSION_RATE);
      const freelancerNet = roundCurrency(unitPrice - platformFee);

      return {
        checkout_session_id: checkoutSession.id,
        service_id: service.id,
        freelancer_id: service.freelancer_id,
        fulfillment_type:
          String(service.fulfillment_type || "").trim().toLowerCase() === "physical"
            ? "physical"
            : "digital",
        title: service.title,
        category: service.category || null,
        description: service.description || null,
        selected_package_id: item.packageSnapshot.id,
        selected_package_name: item.packageSnapshot.name,
        selected_package_summary: item.packageSnapshot.summary,
        selected_package_delivery_time_days: item.packageSnapshot.deliveryTimeDays,
        selected_package_revisions: item.packageSnapshot.revisions,
        selected_package_included_items: item.packageSnapshot.includedItems,
        unit_price: unitPrice,
        platform_fee: platformFee,
        freelancer_net: freelancerNet,
      };
    });

    const { error: checkoutItemsError } = await supabase
      .from("customer_checkout_items")
      .insert(checkoutRows);

    if (checkoutItemsError) {
      throw checkoutItemsError;
    }

    const customerName =
      user.user_metadata?.full_name || user.email || "Carvver customer";

    if (method === "qrph") {
      const qrExpiresAt = new Date(now + QR_LIFETIME_MS).toISOString();

      const paymentIntent = await createPaymentIntent({
        secretKey: paymongoSecretKey,
        payload: {
          data: {
            attributes: {
              amount: toCentavos(subtotal),
              currency: "PHP",
              capture_type: "automatic",
              payment_method_allowed: ["qrph"],
              description: `Carvver service payment (${validItems.length} listing${
                validItems.length === 1 ? "" : "s"
              })`,
              statement_descriptor: "CARVVER",
            },
          },
        },
      });

      const paymentMethod = await createPaymentMethod({
        secretKey: paymongoSecretKey,
        payload: {
          data: {
            attributes: {
              type: "qrph",
              billing: {
                email: user.email,
                name: customerName,
              },
            },
          },
        },
      });

      const attachedIntent = await attachPaymentIntent({
        secretKey: paymongoSecretKey,
        paymentIntentId: paymentIntent.id,
        payload: {
          data: {
            attributes: {
              payment_method: paymentMethod.id,
            },
          },
        },
      });

      const qrImageUrl =
        attachedIntent?.attributes?.next_action?.code?.image_url ||
        attachedIntent?.attributes?.next_action?.display_qr_code?.image_url ||
        null;

      const nextSession = await updateCheckoutSession(supabase, checkoutSession.id, {
        status: "pending",
        paymongo_payment_intent_id: paymentIntent.id,
        qr_image_url: qrImageUrl,
        qr_expires_at: qrExpiresAt,
      });

      return jsonResponse({
        ...buildSessionResponse(nextSession, {
          itemCount: validItems.length,
        }),
      });
    }

    const successUrl = resolveReturnUrl(
      appBaseUrl,
      body?.successPath,
      `/dashboard/customer/payment?method=card&state=success&session=${checkoutSession.id}`
    );
    const cancelUrl = resolveReturnUrl(
      appBaseUrl,
      body?.cancelPath,
      `/dashboard/customer/payment?method=card&state=cancelled&session=${checkoutSession.id}`
    );

    const paymongoCheckout = await createCheckoutSession({
      secretKey: paymongoSecretKey,
      payload: {
        data: {
          attributes: {
            billing: {
              email: user.email,
              name: customerName,
            },
            description: `Carvver service checkout (${validItems.length} listing${
              validItems.length === 1 ? "" : "s"
            })`,
            line_items: validItems.map((item) => ({
              currency: "PHP",
              amount: toCentavos(Number(item.unitPrice || 0)),
              name: item.packageSnapshot.name
                ? `${item.service.title} - ${item.packageSnapshot.name}`
                : item.service.title,
              quantity: 1,
              description:
                item.packageSnapshot.summary ||
                item.service.category ||
                item.service.description ||
                "Carvver service listing",
            })),
            payment_method_types: ["card"],
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            success_url: successUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    });

    const nextSession = await updateCheckoutSession(supabase, checkoutSession.id, {
      status: "pending",
      paymongo_checkout_id: paymongoCheckout.id,
      checkout_url: paymongoCheckout.attributes?.checkout_url || null,
      redirect_success_url: successUrl,
      redirect_cancel_url: cancelUrl,
    });

    return jsonResponse({
      ...buildSessionResponse(nextSession, {
        itemCount: validItems.length,
      }),
    });
  } catch (error) {
    const serialized = serializeError(error, "Couldn't create a PayMongo payment session.");
    console.error(JSON.stringify({
      scope: "create-paymongo-checkout",
      stage: "request.error",
      error: serialized,
    }));

    return jsonResponse(
      {
        error: serialized.message,
        debug: serialized.kind === "object" ? serialized.details : undefined,
      },
      500
    );
  }
});
