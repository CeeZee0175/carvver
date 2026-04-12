import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { verifyPaymongoSignature } from "../_shared/paymongo.ts";
import {
  extractCardMetadata,
  finalizeSuccessfulCheckoutSession,
  loadCheckoutSessionByRemoteReference,
  unixToIso,
  updateCheckoutSession,
} from "../_shared/checkoutSessions.ts";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
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
    const eventData = payload?.data?.attributes?.data;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (eventType === "checkout_session.payment.paid") {
      const checkoutPayload = eventData;
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
      const checkoutSession = await loadCheckoutSessionByRemoteReference(supabase, {
        paymongoCheckoutId: checkoutPayload?.id,
      });

      if (!checkoutSession) {
        return jsonResponse({ received: true, missing: true }, 202);
      }

      if (String(checkoutSession.status || "").toLowerCase() === "paid") {
        return jsonResponse({ received: true, duplicate: true });
      }

      await finalizeSuccessfulCheckoutSession({
        supabase,
        checkoutSession,
        paymentReference,
        paidAt,
        cardMetadata: extractCardMetadata(payment),
      });

      return jsonResponse({ received: true, processed: true });
    }

    if (eventType === "payment.paid") {
      const payment = eventData;
      const paymentIntentId =
        payment?.attributes?.payment_intent_id ||
        payment?.attributes?.payment_intent?.id ||
        null;
      const checkoutSession = await loadCheckoutSessionByRemoteReference(supabase, {
        paymongoPaymentIntentId: paymentIntentId,
      });

      if (!checkoutSession) {
        return jsonResponse({ received: true, missing: true }, 202);
      }

      if (String(checkoutSession.status || "").toLowerCase() === "paid") {
        return jsonResponse({ received: true, duplicate: true });
      }

      await finalizeSuccessfulCheckoutSession({
        supabase,
        checkoutSession,
        paymentReference: payment?.id || paymentIntentId || null,
        paidAt: unixToIso(payment?.attributes?.paid_at) || new Date().toISOString(),
        cardMetadata: extractCardMetadata(payment),
      });

      return jsonResponse({ received: true, processed: true });
    }

    if (eventType === "payment.failed") {
      const payment = eventData;
      const paymentIntentId =
        payment?.attributes?.payment_intent_id ||
        payment?.attributes?.payment_intent?.id ||
        null;
      const checkoutSession = await loadCheckoutSessionByRemoteReference(supabase, {
        paymongoPaymentIntentId: paymentIntentId,
      });

      if (!checkoutSession) {
        return jsonResponse({ received: true, missing: true }, 202);
      }

      await updateCheckoutSession(supabase, checkoutSession.id, {
        status: "failed",
        failed_at: new Date().toISOString(),
      });

      return jsonResponse({ received: true, processed: true });
    }

    if (eventType === "qrph.expired") {
      const qrPayload = eventData;
      const paymentIntentId =
        qrPayload?.attributes?.payment_intent_id ||
        qrPayload?.attributes?.payment_intent?.id ||
        qrPayload?.attributes?.payment?.payment_intent_id ||
        null;
      const checkoutSession = await loadCheckoutSessionByRemoteReference(supabase, {
        paymongoPaymentIntentId: paymentIntentId,
      });

      if (!checkoutSession) {
        return jsonResponse({ received: true, missing: true }, 202);
      }

      await updateCheckoutSession(supabase, checkoutSession.id, {
        status: "expired",
        expired_at: new Date().toISOString(),
      });

      return jsonResponse({ received: true, processed: true });
    }

    return jsonResponse({ received: true, ignored: true });
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
