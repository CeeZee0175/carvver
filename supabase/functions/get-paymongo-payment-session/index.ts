import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { retrievePaymentIntent } from "../_shared/paymongo.ts";
import {
  extractCardMetadata,
  finalizeSuccessfulCheckoutSession,
  loadCheckoutSessionByLocalId,
  normalizePaymentStatus,
  updateCheckoutSession,
} from "../_shared/checkoutSessions.ts";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildSessionResponse(checkoutSession: any) {
  return {
    sessionId: checkoutSession.id,
    method: checkoutSession.local_payment_method,
    status: checkoutSession.status,
    subtotal: Number(checkoutSession.subtotal || 0),
    currency: checkoutSession.currency || "PHP",
    checkoutUrl: checkoutSession.checkout_url || null,
    qrImageUrl: checkoutSession.qr_image_url || null,
    qrExpiresAt: checkoutSession.qr_expires_at || null,
    paymentReference: checkoutSession.payment_reference || null,
    paidAt: checkoutSession.paid_at || null,
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

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "").trim();
    const markCancelled = Boolean(body?.markCancelled);

    if (!sessionId) {
      return jsonResponse({ error: "A payment session is required." }, 400);
    }

    let checkoutSession = await loadCheckoutSessionByLocalId(supabase, sessionId);

    if (!checkoutSession || checkoutSession.user_id !== user.id) {
      return jsonResponse({ error: "Payment session not found." }, 404);
    }

    if (
      markCancelled &&
      checkoutSession.local_payment_method === "card" &&
      normalizePaymentStatus(checkoutSession.status) === "pending"
    ) {
      checkoutSession = await updateCheckoutSession(supabase, checkoutSession.id, {
        status: "cancelled",
      });
    }

    if (
      checkoutSession.local_payment_method === "qrph" &&
      normalizePaymentStatus(checkoutSession.status) === "pending" &&
      checkoutSession.paymongo_payment_intent_id
    ) {
      const paymentIntent = await retrievePaymentIntent({
        secretKey: paymongoSecretKey,
        paymentIntentId: checkoutSession.paymongo_payment_intent_id,
      });

      const paymentIntentStatus = String(paymentIntent?.attributes?.status || "").toLowerCase();
      const payment = paymentIntent?.attributes?.payments?.[0] || null;
      const paidAt = payment?.attributes?.paid_at
        ? new Date(payment.attributes.paid_at * 1000).toISOString()
        : new Date().toISOString();
      const paymentReference =
        payment?.id || payment?.attributes?.payment_intent_id || paymentIntent.id || null;

      if (paymentIntentStatus === "succeeded" && payment) {
        checkoutSession = await finalizeSuccessfulCheckoutSession({
          supabase,
          checkoutSession,
          paymentReference,
          paidAt,
          cardMetadata: extractCardMetadata(payment),
        });
      } else if (
        checkoutSession.qr_expires_at &&
        new Date(checkoutSession.qr_expires_at).getTime() <= Date.now()
      ) {
        checkoutSession = await updateCheckoutSession(supabase, checkoutSession.id, {
          status: paymentIntentStatus === "awaiting_payment_method" ? "expired" : "failed",
          expired_at: paymentIntentStatus === "awaiting_payment_method"
            ? new Date().toISOString()
            : checkoutSession.expired_at,
          failed_at: paymentIntentStatus !== "awaiting_payment_method"
            ? new Date().toISOString()
            : checkoutSession.failed_at,
        });
      }
    }

    return jsonResponse(buildSessionResponse(checkoutSession));
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't load the PayMongo payment session.",
      },
      500
    );
  }
});
