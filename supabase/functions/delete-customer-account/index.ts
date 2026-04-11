import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function extractAvatarPath(avatarUrl: string | null | undefined, bucket: string) {
  const normalized = String(avatarUrl || "").trim();
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
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
    const confirmation = String(body?.confirmation || "").trim();

    if (confirmation !== "DELETE MY ACCOUNT") {
      return jsonResponse({ error: "Type DELETE MY ACCOUNT to continue." }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile || profile.role !== "customer") {
      return jsonResponse({ error: "This account can't use this action." }, 403);
    }

    const { data: requestMediaRows, error: mediaError } = await supabase
      .from("customer_request_media")
      .select("bucket_path")
      .eq("customer_id", user.id);

    if (mediaError) {
      throw mediaError;
    }

    const requestMediaPaths = (requestMediaRows || [])
      .map((row) => String(row.bucket_path || "").trim())
      .filter(Boolean);

    if (requestMediaPaths.length > 0) {
      const { error: removeMediaError } = await supabase.storage
        .from("customer-request-media")
        .remove(requestMediaPaths);

      if (removeMediaError) {
        throw removeMediaError;
      }
    }

    const avatarPath = extractAvatarPath(profile.avatar_url, "profile-avatars");

    if (avatarPath) {
      await supabase.storage.from("profile-avatars").remove([avatarPath]);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "We couldn't delete this account.",
      },
      500
    );
  }
});
