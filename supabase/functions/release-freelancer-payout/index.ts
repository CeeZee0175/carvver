import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, serializeError } from "../_shared/http.ts";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizeAction(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["release", "block", "fail"].includes(normalized)) {
    return normalized as "release" | "block" | "fail";
  }
  throw new Error("Use action release, block, or fail.");
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
    const opsSecret = getEnv("OPS_RELEASE_SECRET");

    const suppliedSecret = request.headers.get("x-ops-secret");
    if (!suppliedSecret || suppliedSecret !== opsSecret) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const payoutRequestId = String(body?.payoutRequestId || "").trim();
    const action = normalizeAction(body?.action);
    const providerReference = String(body?.providerReference || "").trim();
    const note = String(body?.note || "").trim();

    if (!payoutRequestId) {
      return jsonResponse({ error: "A payout request id is required." }, 400);
    }

    if (action === "release" && !providerReference) {
      return jsonResponse(
        { error: "A provider reference is required when marking a payout as released." },
        400
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: payoutRequest,
      error: payoutError,
    } = await supabase
      .from("payout_release_requests")
      .select("id, order_id, status, amount, destination_method, destination_account_reference")
      .eq("id", payoutRequestId)
      .maybeSingle();

    if (payoutError) throw payoutError;
    if (!payoutRequest) {
      return jsonResponse({ error: "Payout request not found." }, 404);
    }

    const now = new Date().toISOString();

    const nextRequestPatch =
      action === "release"
        ? {
            status: "released",
            provider_reference: providerReference,
            ops_note: note || "Released manually by ops.",
            processed_at: now,
            released_at: now,
            updated_at: now,
          }
        : action === "block"
          ? {
              status: "blocked",
              provider_reference: providerReference || null,
              ops_note: note || "Blocked by ops for follow-up.",
              processed_at: now,
              released_at: null,
              updated_at: now,
            }
          : {
              status: "failed",
              provider_reference: providerReference || null,
              ops_note: note || "Marked failed by ops.",
              processed_at: now,
              released_at: null,
              updated_at: now,
            };

    const nextOrderPatch =
      action === "release"
        ? {
            escrow_status: "released",
            released_at: now,
          }
        : action === "block"
          ? {
              escrow_status: "blocked",
              released_at: null,
            }
          : {
              escrow_status: "failed",
              released_at: null,
            };

    const { data: updatedRequest, error: updateRequestError } = await supabase
      .from("payout_release_requests")
      .update(nextRequestPatch)
      .eq("id", payoutRequestId)
      .select(
        "id, order_id, status, provider_reference, ops_note, requested_at, processed_at, released_at"
      )
      .single();

    if (updateRequestError) throw updateRequestError;

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update(nextOrderPatch)
      .eq("id", payoutRequest.order_id);

    if (updateOrderError) throw updateOrderError;

    return jsonResponse({
      success: true,
      payoutRequest: updatedRequest,
      order: {
        id: payoutRequest.order_id,
        ...nextOrderPatch,
      },
    });
  } catch (error) {
    const serialized = serializeError(error, "Couldn't process the payout release action.");
    console.error(
      JSON.stringify({
        scope: "release-freelancer-payout",
        stage: "request.error",
        error: serialized,
      })
    );

    return jsonResponse(
      {
        error: serialized.message,
        debug: serialized.kind === "object" ? serialized.details : undefined,
      },
      500
    );
  }
});
