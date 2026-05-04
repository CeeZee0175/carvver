import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  extractBearerToken,
  jsonResponse,
  serializeError,
} from "../_shared/http.ts";
import {
  attachPaymentIntent,
  createPaymentIntent,
  createPaymentMethod,
  toCentavos,
} from "../_shared/paymongo.ts";

const PLAN_CODE = "carvver_pro";
const PLAN_PRICE = 149;
const QR_LIFETIME_MS = 30 * 60 * 1000;

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildSessionResponse(session: any, extras: Record<string, unknown> = {}) {
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
    ...extras,
  };
}

async function loadProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.role !== "freelancer") {
    throw new Error("Only freelancer accounts can start Carvver Pro billing.");
  }

  return data;
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

    const body = await request.json().catch(() => ({}));
    const forceNew = body?.forceNew === true;
    const profile = await loadProfile(supabase, user.id);
    const membership = await loadMembership(supabase, user.id);
    const now = Date.now();

    if (!forceNew) {
      const { data: activeSessions, error: activeSessionsError } = await supabase
        .from("freelancer_plan_checkout_sessions")
        .select("*")
        .eq("freelancer_id", user.id)
        .eq("plan_code", PLAN_CODE)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (activeSessionsError) throw activeSessionsError;

      const existingSession = activeSessions?.[0] || null;
      if (
        existingSession?.qr_image_url &&
        existingSession?.qr_expires_at &&
        new Date(existingSession.qr_expires_at).getTime() > now
      ) {
        return jsonResponse(
          buildSessionResponse(existingSession, {
            resumed: true,
            membership,
          })
        );
      }
    }

    await supabase
      .from("freelancer_plan_checkout_sessions")
      .update({ status: "superseded" })
      .eq("freelancer_id", user.id)
      .eq("plan_code", PLAN_CODE)
      .in("status", ["draft", "pending"]);

    const { data: checkoutSession, error: checkoutSessionError } = await supabase
      .from("freelancer_plan_checkout_sessions")
      .insert({
        freelancer_id: user.id,
        plan_code: PLAN_CODE,
        status: "draft",
        subtotal: PLAN_PRICE,
        currency: "PHP",
      })
      .select("*")
      .single();

    if (checkoutSessionError || !checkoutSession) {
      throw checkoutSessionError || new Error("Couldn't create Pro billing session.");
    }

    const displayName =
      profile.display_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      user.email ||
      "Carvver freelancer";
    const qrExpiresAt = new Date(now + QR_LIFETIME_MS).toISOString();

    const paymentIntent = await createPaymentIntent({
      secretKey: paymongoSecretKey,
      payload: {
        data: {
          attributes: {
            amount: toCentavos(PLAN_PRICE),
            currency: "PHP",
            capture_type: "automatic",
            payment_method_allowed: ["qrph"],
            description: "Carvver Pro monthly billing",
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
              name: displayName,
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

    const { data: nextSession, error: updateError } = await supabase
      .from("freelancer_plan_checkout_sessions")
      .update({
        status: "pending",
        paymongo_payment_intent_id: paymentIntent.id,
        qr_image_url: qrImageUrl,
        qr_expires_at: qrExpiresAt,
      })
      .eq("id", checkoutSession.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return jsonResponse(
      buildSessionResponse(nextSession, {
        resumed: false,
        membership,
      })
    );
  } catch (error) {
    const serialized = serializeError(error, "Couldn't create a Carvver Pro billing QR.");
    console.error(JSON.stringify({
      scope: "create-freelancer-pro-checkout",
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
