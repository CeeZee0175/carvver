import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  extractBearerToken,
  jsonResponse,
  serializeError,
} from "../_shared/http.ts";
import { retrievePaymentIntent } from "../_shared/paymongo.ts";

const PLAN_CODE = "carvver_pro";
const PLAN_PRICE = 149;

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function addOneMonth(value: string) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function buildSessionResponse(session: any, membership: any = null) {
  return {
    sessionId: session?.id || null,
    planCode: session?.plan_code || PLAN_CODE,
    status: session?.status || null,
    subtotal: Number(session?.subtotal || PLAN_PRICE),
    currency: session?.currency || "PHP",
    qrImageUrl: session?.qr_image_url || null,
    qrExpiresAt: session?.qr_expires_at || null,
    paymentReference: session?.payment_reference || null,
    paidAt: session?.paid_at || null,
    membership,
  };
}

async function loadProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.role !== "freelancer") {
    throw new Error("Only freelancer accounts can load Carvver Pro billing.");
  }
}

async function loadMembership(supabase: any, freelancerId: string) {
  const { data, error } = await supabase
    .from("freelancer_plan_memberships")
    .select("*")
    .eq("freelancer_id", freelancerId)
    .maybeSingle();

  if (error) throw error;

  if (
    data &&
    data.status === "active" &&
    new Date(data.current_period_end).getTime() <= Date.now()
  ) {
    const { error: serviceFlagError } = await supabase
      .from("services")
      .update({ is_pro: false })
      .eq("freelancer_id", freelancerId);

    if (serviceFlagError) throw serviceFlagError;

    const { data: expired, error: expireError } = await supabase
      .from("freelancer_plan_memberships")
      .update({ status: "expired" })
      .eq("freelancer_id", freelancerId)
      .select("*")
      .single();

    if (expireError) throw expireError;
    return expired;
  }

  return data;
}

async function loadLatestSession(supabase: any, freelancerId: string) {
  const { data, error } = await supabase
    .from("freelancer_plan_checkout_sessions")
    .select("*")
    .eq("freelancer_id", freelancerId)
    .eq("plan_code", PLAN_CODE)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function finalizePaidSession({
  supabase,
  session,
  paymentReference,
  paidAt,
}: {
  supabase: any;
  session: any;
  paymentReference: string | null;
  paidAt: string;
}) {
  if (String(session?.status || "").toLowerCase() === "paid") {
    return session;
  }

  const periodEnd = addOneMonth(paidAt);

  const { data: nextSession, error: sessionError } = await supabase
    .from("freelancer_plan_checkout_sessions")
    .update({
      status: "paid",
      payment_reference: paymentReference,
      paid_at: paidAt,
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (sessionError) throw sessionError;

  const { error: membershipError } = await supabase
    .from("freelancer_plan_memberships")
    .upsert(
      {
        freelancer_id: session.freelancer_id,
        plan_code: PLAN_CODE,
        status: "active",
        starts_at: paidAt,
        current_period_end: periodEnd,
        last_checkout_session_id: session.id,
      },
      { onConflict: "freelancer_id" }
    );

  if (membershipError) throw membershipError;

  const { error: serviceFlagError } = await supabase
    .from("services")
    .update({ is_pro: true })
    .eq("freelancer_id", session.freelancer_id);

  if (serviceFlagError) throw serviceFlagError;

  return nextSession;
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
    const accessToken = extractBearerToken(request.headers.get("Authorization"));

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

    await loadProfile(supabase, user.id);

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "").trim();

    let session = null;

    if (sessionId) {
      const { data, error } = await supabase
        .from("freelancer_plan_checkout_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("freelancer_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return jsonResponse({ error: "Carvver Pro billing session not found." }, 404);
      }
      session = data;
    } else {
      session = await loadLatestSession(supabase, user.id);
    }

    if (
      session?.status === "pending" &&
      session.paymongo_payment_intent_id
    ) {
      const paymentIntent = await retrievePaymentIntent({
        secretKey: paymongoSecretKey,
        paymentIntentId: session.paymongo_payment_intent_id,
      });
      const paymentIntentAttributes = paymentIntent?.attributes || {};
      const paymentIntentStatus = String(paymentIntentAttributes?.status || "").toLowerCase();
      const payment =
        Array.isArray(paymentIntentAttributes?.payments) &&
        paymentIntentAttributes.payments.length > 0
          ? paymentIntentAttributes.payments[0]
          : null;

      if (paymentIntentStatus === "succeeded" && payment) {
        const paidAt = payment?.attributes?.paid_at
          ? new Date(payment.attributes.paid_at * 1000).toISOString()
          : new Date().toISOString();
        const paymentReference =
          payment?.id || payment?.attributes?.payment_intent_id || paymentIntent.id || null;

        session = await finalizePaidSession({
          supabase,
          session,
          paymentReference,
          paidAt,
        });
      } else if (
        session.qr_expires_at &&
        new Date(session.qr_expires_at).getTime() <= Date.now()
      ) {
        const nextStatus = paymentIntentStatus === "awaiting_payment_method" ? "expired" : "failed";
        const { data: terminal, error: terminalError } = await supabase
          .from("freelancer_plan_checkout_sessions")
          .update({
            status: nextStatus,
            expired_at: nextStatus === "expired" ? new Date().toISOString() : session.expired_at,
            failed_at: nextStatus !== "expired" ? new Date().toISOString() : session.failed_at,
          })
          .eq("id", session.id)
          .select("*")
          .single();

        if (terminalError) throw terminalError;
        session = terminal;
      }
    }

    const membership = await loadMembership(supabase, user.id);
    return jsonResponse(buildSessionResponse(session, membership));
  } catch (error) {
    const serialized = serializeError(error, "Couldn't load Carvver Pro billing.");
    console.error(JSON.stringify({
      scope: "get-freelancer-pro-session",
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
