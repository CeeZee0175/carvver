import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, serializeError } from "../_shared/http.ts";

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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await request.json().catch(() => ({}));
    const adminUsername = String(body?.adminUsername || "")
      .trim()
      .toLowerCase();

    if (!adminUsername) {
      return jsonResponse({ error: "Enter your admin username." }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, admin_username")
      .eq("role", "admin")
      .ilike("admin_username", adminUsername)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.id) {
      return jsonResponse({ error: "Invalid admin username or password." }, 404);
    }

    const { data: userResult, error: userError } =
      await supabase.auth.admin.getUserById(profile.id);

    if (userError) throw userError;

    const email = String(userResult?.user?.email || "").trim();
    if (!email) {
      return jsonResponse(
        { error: "This admin account is missing an email address." },
        400
      );
    }

    return jsonResponse({
      success: true,
      email,
      adminUsername: String(profile.admin_username || "").trim().toLowerCase(),
    });
  } catch (error) {
    const serialized = serializeError(
      error,
      "Couldn't resolve the admin account."
    );

    console.error(
      JSON.stringify({
        scope: "resolve-admin-login",
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
