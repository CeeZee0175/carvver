import { createClient } from "../../lib/supabase/client";
import { ensureProfileForSession, signOut } from "../../lib/supabase/auth";
import { resolveProfileRole } from "../../lib/customerOnboarding";

const supabase = createClient();

export const AUTH_ROUTE_STATUS = {
  SIGNED_OUT: "signedOut",
  INVALID_SESSION: "invalidSession",
  CUSTOMER: "customer",
  FREELANCER: "freelancer",
  ADMIN: "admin",
};

export function getAuthRouteMessage(result) {
  if (result?.status === AUTH_ROUTE_STATUS.INVALID_SESSION) {
    return (
      result.message ||
      "Your previous session could not be verified. Please sign in again."
    );
  }

  return "";
}

async function clearInvalidSession() {
  try {
    await signOut();
  } catch {
    // Local cleanup still prevents stale browser auth state from causing loops.
  }
}

export async function resolveAuthenticatedProfile() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    if (sessionError) await clearInvalidSession();
    return {
      status: sessionError
        ? AUTH_ROUTE_STATUS.INVALID_SESSION
        : AUTH_ROUTE_STATUS.SIGNED_OUT,
      session: null,
      user: null,
      profile: null,
      reason: sessionError ? "session" : "",
      message: sessionError?.message || "",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id || user.id !== session.user.id) {
    await clearInvalidSession();
    return {
      status: AUTH_ROUTE_STATUS.INVALID_SESSION,
      session: null,
      user: null,
      profile: null,
      reason: "session",
      message:
        userError?.message ||
        "Your previous session is no longer available. Please sign in again.",
    };
  }

  try {
    const verifiedSession = {
      ...session,
      user,
    };
    const profile = await ensureProfileForSession(verifiedSession);

    if (!profile?.id) {
      throw new Error("We could not prepare your Carvver profile.");
    }

    const role = resolveProfileRole(profile, verifiedSession);

    if (role === "admin") {
      return {
        status: AUTH_ROUTE_STATUS.ADMIN,
        session,
        user,
        profile,
      };
    }

    if (role === "freelancer") {
      return {
        status: AUTH_ROUTE_STATUS.FREELANCER,
        session,
        user,
        profile,
      };
    }

    return {
      status: AUTH_ROUTE_STATUS.CUSTOMER,
      session,
      user,
      profile,
    };
  } catch (error) {
    await clearInvalidSession();
    return {
      status: AUTH_ROUTE_STATUS.INVALID_SESSION,
      session: null,
      user: null,
      profile: null,
      reason: "profile",
      message:
        error?.message ||
        "We could not verify your account. Please sign in again.",
    };
  }
}
