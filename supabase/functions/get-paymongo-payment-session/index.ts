import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  extractBearerToken,
  jsonResponse,
  serializeError,
} from "../_shared/http.ts";
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

function logStage(stage: string, payload: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    scope: "get-paymongo-payment-session",
    stage,
    ...payload,
  }));
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    logStage("request.start", {
      method: request.method,
    });

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const paymongoSecretKey = getEnv("PAYMONGO_SECRET_KEY");

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

    logStage("auth.resolved", {
      userId: user.id,
    });

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

    logStage("session.loaded", {
      sessionId: checkoutSession.id,
      status: checkoutSession.status,
      method: checkoutSession.local_payment_method,
      hasPaymentIntentId: Boolean(checkoutSession.paymongo_payment_intent_id),
    });

    if (
      markCancelled &&
      checkoutSession.local_payment_method === "card" &&
      normalizePaymentStatus(checkoutSession.status) === "pending"
    ) {
      logStage("session.mark-cancelled", {
        sessionId: checkoutSession.id,
      });
      checkoutSession = await updateCheckoutSession(supabase, checkoutSession.id, {
        status: "cancelled",
      });
    }

    if (
      checkoutSession.local_payment_method === "qrph" &&
      normalizePaymentStatus(checkoutSession.status) === "pending" &&
      checkoutSession.paymongo_payment_intent_id
    ) {
      logStage("qr.reconcile.start", {
        sessionId: checkoutSession.id,
        paymentIntentId: checkoutSession.paymongo_payment_intent_id,
      });

      const paymentIntent = await retrievePaymentIntent({
        secretKey: paymongoSecretKey,
        paymentIntentId: checkoutSession.paymongo_payment_intent_id,
      });

      const paymentIntentAttributes = paymentIntent?.attributes || {};
      const paymentIntentStatus = String(paymentIntentAttributes?.status || "").toLowerCase();
      const payment =
        Array.isArray(paymentIntentAttributes?.payments) &&
        paymentIntentAttributes.payments.length > 0
          ? paymentIntentAttributes.payments[0]
          : null;

      logStage("qr.reconcile.fetched-intent", {
        sessionId: checkoutSession.id,
        paymentIntentId: paymentIntent?.id || checkoutSession.paymongo_payment_intent_id,
        paymentIntentStatus,
        hasPayment: Boolean(payment),
      });

      const paidAt = payment?.attributes?.paid_at
        ? new Date(payment.attributes.paid_at * 1000).toISOString()
        : new Date().toISOString();
      const paymentReference =
        payment?.id || payment?.attributes?.payment_intent_id || paymentIntent.id || null;

      if (paymentIntentStatus === "succeeded" && payment) {
        logStage("qr.reconcile.finalize-paid", {
          sessionId: checkoutSession.id,
          paymentReference,
        });
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
        logStage("qr.reconcile.mark-terminal", {
          sessionId: checkoutSession.id,
          nextStatus: paymentIntentStatus === "awaiting_payment_method" ? "expired" : "failed",
        });
        checkoutSession = await updateCheckoutSession(supabase, checkoutSession.id, {
          status: paymentIntentStatus === "awaiting_payment_method" ? "expired" : "failed",
          expired_at: paymentIntentStatus === "awaiting_payment_method"
            ? new Date().toISOString()
            : checkoutSession.expired_at,
          failed_at: paymentIntentStatus !== "awaiting_payment_method"
            ? new Date().toISOString()
            : checkoutSession.failed_at,
        });
      } else {
        logStage("qr.reconcile.pending", {
          sessionId: checkoutSession.id,
          paymentIntentStatus: paymentIntentStatus || "unknown",
        });
      }
    }

    logStage("request.success", {
      sessionId: checkoutSession.id,
      status: checkoutSession.status,
    });
    return jsonResponse(buildSessionResponse(checkoutSession));
  } catch (error) {
    const serialized = serializeError(error, "Couldn't load the PayMongo payment session.");
    console.error(JSON.stringify({
      scope: "get-paymongo-payment-session",
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
