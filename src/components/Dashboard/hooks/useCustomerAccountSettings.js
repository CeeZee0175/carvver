import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile, signOut } from "../../../lib/supabase/auth";
import { emitProfileUpdated } from "../../../lib/profileSync";

const supabase = createClient();

function friendlySettingsMessage(error, fallback) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid_grant")
  ) {
    return "Your current password doesn't match this account.";
  }

  if (
    message.includes("same password") ||
    message.includes("should be different") ||
    message.includes("new password should be different")
  ) {
    return "Choose a new password that isn't the same as your current one.";
  }

  if (
    message.includes("password") &&
    (message.includes("weak") ||
      message.includes("security") ||
      message.includes("length") ||
      message.includes("characters"))
  ) {
    return "Use a stronger password with at least 8 characters.";
  }

  if (
    message.includes("mfa") ||
    message.includes("factor") ||
    message.includes("verification code")
  ) {
    return "That verification code didn't work. Try again with a fresh code.";
  }

  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "That account action isn't available at the moment.";
  }

  if (message.includes("function") || message.includes("delete account")) {
    return "We couldn't complete that account action. Please try again.";
  }

  return fallback;
}

async function parseFunctionError(error) {
  if (!error) return null;

  if (typeof error.context?.json === "function") {
    try {
      const payload = await error.context.json();
      return payload?.error || payload?.message || error.message;
    } catch {
      return error.message;
    }
  }

  return error.message;
}

function getIdentityProviders(user) {
  const providerSet = new Set();

  (user?.identities || []).forEach((identity) => {
    if (identity?.provider) {
      providerSet.add(String(identity.provider).toLowerCase());
    }
  });

  if (user?.app_metadata?.provider) {
    providerSet.add(String(user.app_metadata.provider).toLowerCase());
  }

  if (providerSet.size === 0 && user?.email) {
    providerSet.add("email");
  }

  return Array.from(providerSet);
}

function formatProviderLabel(provider) {
  switch (provider) {
    case "google":
      return "Google";
    case "github":
      return "GitHub";
    case "facebook":
      return "Facebook";
    case "email":
      return "Password";
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

async function getMfaSnapshot() {
  const [{ data: factorData, error: factorError }, { data: aalData, error: aalError }] =
    await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

  if (factorError) throw factorError;
  if (aalError) throw aalError;

  const allFactors = factorData?.all || [];
  const verifiedFactor =
    allFactors.find(
      (factor) => factor.factor_type === "totp" && factor.status === "verified"
    ) || null;
  const pendingFactor =
    allFactors.find(
      (factor) => factor.factor_type === "totp" && factor.status !== "verified"
    ) || null;

  return {
    allFactors,
    verifiedFactor,
    pendingFactor,
    enabled: Boolean(verifiedFactor) || aalData?.currentLevel === "aal2",
    assuranceLevel: aalData?.currentLevel || null,
  };
}

export function useCustomerAccountSettings() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [providers, setProviders] = useState([]);
  const [mfa, setMfa] = useState({
    enabled: false,
    verifiedFactor: null,
    pendingFactor: null,
    assuranceLevel: null,
  });
  const [enrollment, setEnrollment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [
        {
          data: { user },
        },
        nextProfile,
        mfaSnapshot,
      ] = await Promise.all([supabase.auth.getUser(), getProfile(), getMfaSnapshot()]);

      setProfile(nextProfile);
      setProviders(getIdentityProviders(user));
      setMfa(mfaSnapshot);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      setLoading(false);
    });
  }, [load]);

  const hasPasswordProvider = useMemo(
    () => providers.includes("email"),
    [providers]
  );

  const providerLabel = useMemo(() => {
    if (providers.length === 0) return "Password";
    return providers.map(formatProviderLabel).join(" + ");
  }, [providers]);

  const changePassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) => {
      const trimmedCurrentPassword = String(currentPassword || "");
      const trimmedNewPassword = String(newPassword || "");
      const trimmedConfirmPassword = String(confirmPassword || "");

      if (hasPasswordProvider && !trimmedCurrentPassword) {
        throw new Error("Enter your current password.");
      }

      if (!trimmedNewPassword) {
        throw new Error("Enter a new password.");
      }

      if (trimmedNewPassword.length < 8) {
        throw new Error("Use a password with at least 8 characters.");
      }

      if (trimmedNewPassword !== trimmedConfirmPassword) {
        throw new Error("Your new passwords don't match.");
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          throw new Error("We couldn't verify this account.");
        }

        if (hasPasswordProvider) {
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: trimmedCurrentPassword,
          });

          if (verifyError) throw verifyError;
        }

        const { error } = await supabase.auth.updateUser({
          password: trimmedNewPassword,
        });

        if (error) throw error;

        await load();
      } catch (error) {
        throw new Error(
          friendlySettingsMessage(error, "We couldn't update your password.")
        );
      }
    },
    [hasPasswordProvider, load]
  );

  const startTotpEnrollment = useCallback(async () => {
    try {
      const snapshot = await getMfaSnapshot();

      if (snapshot.verifiedFactor) {
        setMfa(snapshot);
        throw new Error("Two-factor authentication is already turned on.");
      }

      if (snapshot.pendingFactor?.id) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: snapshot.pendingFactor.id,
        });

        if (unenrollError) throw unenrollError;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Carvver Authenticator",
      });

      if (error) throw error;

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp?.qr_code || "",
        secret: data.totp?.secret || "",
        uri: data.totp?.uri || "",
        friendlyName: data.friendly_name || "Authenticator app",
      });

      await load();
      return data;
    } catch (error) {
      throw new Error(
        friendlySettingsMessage(
          error,
          "We couldn't start two-factor setup. Please try again."
        )
      );
    }
  }, [load]);

  const verifyTotpEnrollment = useCallback(
    async (code) => {
      const normalizedCode = String(code || "").trim();

      if (!enrollment?.factorId) {
        throw new Error("Start setup again before entering a code.");
      }

      if (!normalizedCode) {
        throw new Error("Enter the 6-digit code from your authenticator app.");
      }

      try {
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: enrollment.factorId,
          code: normalizedCode,
        });

        if (error) throw error;

        setEnrollment(null);
        await load();
      } catch (error) {
        throw new Error(
          friendlySettingsMessage(
            error,
            "We couldn't confirm that code. Please try again."
          )
        );
      }
    },
    [enrollment, load]
  );

  const cancelTotpEnrollment = useCallback(async () => {
    if (!enrollment?.factorId) {
      setEnrollment(null);
      return;
    }

    try {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    } catch {
      // Ignore cleanup errors here and refresh state below.
    } finally {
      setEnrollment(null);
      await load();
    }
  }, [enrollment, load]);

  const disableTotp = useCallback(
    async (code) => {
      const normalizedCode = String(code || "").trim();

      if (!mfa.verifiedFactor?.id) {
        throw new Error("Two-factor authentication is already off.");
      }

      if (!normalizedCode) {
        throw new Error("Enter the code from your authenticator app.");
      }

      try {
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId: mfa.verifiedFactor.id,
          code: normalizedCode,
        });

        if (verifyError) throw verifyError;

        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: mfa.verifiedFactor.id,
        });

        if (unenrollError) throw unenrollError;

        await load();
      } catch (error) {
        throw new Error(
          friendlySettingsMessage(
            error,
            "We couldn't turn off two-factor authentication."
          )
        );
      }
    },
    [load, mfa.verifiedFactor]
  );

  const deleteAccount = useCallback(async (confirmation) => {
    const normalizedConfirmation = String(confirmation || "").trim();

    if (normalizedConfirmation !== "DELETE MY ACCOUNT") {
      throw new Error("Type DELETE MY ACCOUNT to continue.");
    }

    try {
      const { data, error } = await supabase.functions.invoke("delete-customer-account", {
        body: {
          confirmation: normalizedConfirmation,
        },
      });

      if (error) {
        const nextMessage = await parseFunctionError(error);
        throw new Error(nextMessage || error.message);
      }

      await signOut();
      emitProfileUpdated(null);
      return data;
    } catch (error) {
      throw new Error(
        friendlySettingsMessage(error, "We couldn't delete your account.")
      );
    }
  }, []);

  return {
    loading,
    profile,
    email: String(profile?.email || "").trim(),
    providers,
    providerLabel,
    hasPasswordProvider,
    mfaEnabled: mfa.enabled,
    verifiedFactor: mfa.verifiedFactor,
    pendingFactor: mfa.pendingFactor,
    enrollment,
    changePassword,
    startTotpEnrollment,
    verifyTotpEnrollment,
    cancelTotpEnrollment,
    disableTotp,
    deleteAccount,
    reload: load,
  };
}
