import { createClient } from "./client";
import { PHILIPPINES_COUNTRY } from "../phLocations";
import {
  buildOAuthCallbackUrl,
  buildPasswordRecoveryUrl,
} from "../authFlowIntent";

const supabase = createClient();

function toTitleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveProfileNames(user, intent = {}) {
  const intentFirstName = String(intent.firstName || "").trim();
  const intentLastName = String(intent.lastName || "").trim();

  if (intentFirstName || intentLastName) {
    return {
      firstName: intentFirstName || "Carvver",
      lastName: intentLastName || "User",
    };
  }

  const metadata = user?.user_metadata || {};
  const directFirstName = String(
    metadata.first_name || metadata.given_name || metadata.preferred_username || ""
  ).trim();
  const directLastName = String(metadata.last_name || metadata.family_name || "").trim();
  const fullName = String(metadata.full_name || metadata.name || "").trim();

  if (directFirstName || directLastName) {
    return {
      firstName: directFirstName || "Carvver",
      lastName: directLastName || "User",
    };
  }

  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      firstName: toTitleCase(parts[0] || "Carvver"),
      lastName: toTitleCase(parts.slice(1).join(" ") || "User"),
    };
  }

  const emailStem = String(user?.email || "carvver user")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  const emailParts = emailStem.split(/\s+/).filter(Boolean);

  return {
    firstName: toTitleCase(emailParts[0] || "Carvver"),
    lastName: toTitleCase(emailParts.slice(1).join(" ") || "User"),
  };
}

function getAvatarUrl(user) {
  const metadata = user?.user_metadata || {};
  return metadata.avatar_url || metadata.picture || metadata.avatar || null;
}

export async function signUp({ firstName, lastName, email, password, role, region }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        region: region || null,
        country: region ? PHILIPPINES_COUNTRY : null,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn({ email, password, remember }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // If remember me is unchecked, move the session to sessionStorage
  // so it clears when the browser is closed
  if (!remember && data.session) {
    const key = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    const session = localStorage.getItem(key);
    if (session) {
      sessionStorage.setItem(key, session);
      localStorage.removeItem(key);
    }
  }

  return data;
}

export async function requestPasswordRecovery(email, options = {}) {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    throw new Error("Enter your email first.");
  }

  const redirectTo =
    options.redirectTo ||
    buildPasswordRecoveryUrl({
      email: normalizedEmail,
    });

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    normalizedEmail,
    {
      redirectTo,
    }
  );

  if (error) throw error;
  return data;
}

export async function verifyPasswordRecoveryOtp({ email, token }) {
  const normalizedEmail = String(email || "").trim();
  const normalizedToken = String(token || "").trim();

  if (!normalizedEmail) {
    throw new Error("Enter your email.");
  }

  if (!normalizedToken) {
    throw new Error("Enter the code from your email.");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: "recovery",
  });

  if (error) throw error;
  return data;
}

export async function verifyPasswordRecoveryTokenHash(tokenHash) {
  const normalizedTokenHash = String(tokenHash || "").trim();

  if (!normalizedTokenHash) {
    throw new Error("That recovery link is incomplete.");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: normalizedTokenHash,
    type: "recovery",
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(password) {
  const normalizedPassword = String(password || "");

  if (!normalizedPassword) {
    throw new Error("Enter a new password.");
  }

  const { data, error } = await supabase.auth.updateUser({
    password: normalizedPassword,
  });

  if (error) throw error;
  return data;
}

export async function requestEmailChange(email) {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    throw new Error("Enter a new email address.");
  }

  const { data, error } = await supabase.auth.updateUser(
    {
      email: normalizedEmail,
    },
    {
      emailRedirectTo: buildOAuthCallbackUrl("email-change"),
    }
  );

  if (error) throw error;
  return data;
}

export async function exchangeCodeForSession(code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return { ...data, email: session.user.email };
}

export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if (error) throw error;
  return profile;
}

export async function ensureProfileForSession(session, intent = {}) {
  if (!session?.user?.id) return null;

  const user = session.user;
  let profile = await getProfileById(user.id);

  if (!profile) {
    const names = deriveProfileNames(user, intent);
    const nextProfile = {
      id: user.id,
      first_name: names.firstName,
      last_name: names.lastName,
      role: intent.role || user.user_metadata?.role || "customer",
      region: intent.region || user.user_metadata?.region || null,
      country:
        intent.region || user.user_metadata?.region
          ? PHILIPPINES_COUNTRY
          : intent.country || user.user_metadata?.country || null,
      avatar_url: getAvatarUrl(user),
    };

    await upsertProfile(nextProfile);
    profile = nextProfile;
  } else {
    const updates = { id: profile.id };
    let shouldUpdate = false;

    if (!profile.first_name || !profile.last_name) {
      const names = deriveProfileNames(user, intent);

      if (!profile.first_name) {
        updates.first_name = names.firstName;
        shouldUpdate = true;
      }

      if (!profile.last_name) {
        updates.last_name = names.lastName;
        shouldUpdate = true;
      }
    }

    if (!profile.region && intent.region) {
      updates.region = intent.region;
      updates.country = PHILIPPINES_COUNTRY;
      shouldUpdate = true;
    }

    if (!profile.country && intent.country) {
      updates.country = intent.country;
      shouldUpdate = true;
    }

    if (!profile.avatar_url) {
      const avatarUrl = getAvatarUrl(user);
      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
        shouldUpdate = true;
      }
    }

    if (!profile.role && intent.role) {
      updates.role = intent.role;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      profile = { ...profile, ...updates };
      await upsertProfile(profile);
    }
  }

  return {
    ...profile,
    email: user.email || "",
  };
}
