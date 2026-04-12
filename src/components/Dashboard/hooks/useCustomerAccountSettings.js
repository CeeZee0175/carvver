import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import {
  getProfile,
  requestEmailChange,
  requestPasswordRecovery,
  signOut,
} from "../../../lib/supabase/auth";
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
    /customer_billing_profiles|column .*billing_|preferred_payment_method|wallet_|default_card_|paymongo_customer_id/i.test(
      message
    )
  ) {
    return "Billing information is unavailable right now.";
  }

  if (message.includes("email") && message.includes("already")) {
    return "That email is already in use.";
  }

  if (message.includes("email") && message.includes("invalid")) {
    return "Enter a valid email address.";
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

function formatMoney(value, currency = "PHP") {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return currency === "PHP" ? "PHP 0.00" : `${currency} 0.00`;
  }

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeBillingProfile(row) {
  return {
    billingName: String(row?.billing_name || "").trim(),
    billingEmail: String(row?.billing_email || "").trim(),
    billingAddress: String(row?.billing_address || "").trim(),
    preferredPaymentMethod: String(row?.preferred_payment_method || "").trim(),
    walletProvider: String(row?.wallet_provider || "").trim(),
    walletPhoneNumber: String(row?.wallet_phone_number || "").trim(),
    paymongoCustomerId: String(row?.paymongo_customer_id || "").trim(),
    defaultCardPaymentMethodId: String(row?.default_card_payment_method_id || "").trim(),
    defaultCardBrand: String(row?.default_card_brand || "").trim(),
    defaultCardLast4: String(row?.default_card_last4 || "").trim(),
    defaultCardExpMonth: Number.isFinite(Number(row?.default_card_exp_month))
      ? Number(row?.default_card_exp_month)
      : null,
    defaultCardExpYear: Number.isFinite(Number(row?.default_card_exp_year))
      ? Number(row?.default_card_exp_year)
      : null,
  };
}

function normalizeBillingHistory(rows = []) {
  return rows.map((row) => ({
    id: row.id,
    status: String(row.status || "").trim() || "pending",
    subtotal: Number(row.subtotal || 0),
    currency: String(row.currency || "PHP").trim() || "PHP",
    paymentReference: String(row.payment_reference || "").trim(),
    createdAt: row.created_at || null,
    paidAt: row.paid_at || null,
    itemCount: Array.isArray(row.customer_checkout_items)
      ? row.customer_checkout_items.length
      : 0,
  }));
}

async function fetchBillingProfile(userId) {
  const { data, error } = await supabase
    .from("customer_billing_profiles")
    .select("*")
    .eq("customer_id", userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeBillingProfile(data);
}

async function fetchBillingHistory(userId) {
  const { data, error } = await supabase
    .from("customer_checkout_sessions")
    .select(
      `
      id,
      status,
      subtotal,
      currency,
      payment_reference,
      created_at,
      paid_at,
      customer_checkout_items (
        id
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw error;
  return normalizeBillingHistory(data || []);
}

export function useCustomerAccountSettings() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [providers, setProviders] = useState([]);
  const [billingProfile, setBillingProfile] = useState(
    normalizeBillingProfile(null)
  );
  const [billingHistory, setBillingHistory] = useState([]);
  const [billingAvailable, setBillingAvailable] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const nextProfile = await getProfile();
      setProfile(nextProfile);
      setProviders(getIdentityProviders(user));

      if (user?.id) {
        try {
          const [nextBillingProfile, nextBillingHistory] = await Promise.all([
            fetchBillingProfile(user.id),
            fetchBillingHistory(user.id),
          ]);

          setBillingProfile(nextBillingProfile);
          setBillingHistory(nextBillingHistory);
          setBillingAvailable(true);
        } catch (error) {
          setBillingAvailable(false);
          setBillingProfile(normalizeBillingProfile(null));
          setBillingHistory([]);

          if (
            !/customer_billing_profiles|column .*billing_|preferred_payment_method|wallet_|default_card_|paymongo_customer_id/i.test(
              String(error?.message || "")
            )
          ) {
            throw error;
          }
        }
      }
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

  const billingHistorySummary = useMemo(() => {
    const paidSessions = billingHistory.filter((entry) => entry.status === "paid");
    const paidTotal = paidSessions.reduce((sum, entry) => sum + Number(entry.subtotal || 0), 0);

    return {
      count: billingHistory.length,
      paidCount: paidSessions.length,
      paidTotalLabel: formatMoney(paidTotal),
    };
  }, [billingHistory]);

  const hasSavedWallet = useMemo(
    () =>
      billingProfile.preferredPaymentMethod === "qrph" ||
      billingProfile.walletProvider === "QRPh",
    [billingProfile]
  );

  const hasSavedCard = useMemo(
    () =>
      Boolean(
        billingProfile.defaultCardBrand &&
          billingProfile.defaultCardLast4 &&
          billingProfile.defaultCardExpMonth &&
          billingProfile.defaultCardExpYear
      ),
    [billingProfile]
  );

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

  const sendPasswordRecovery = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error("We couldn't find your email for this account.");
      }

      await requestPasswordRecovery(user.email);
      return user.email;
    } catch (error) {
      throw new Error(
        friendlySettingsMessage(error, "We couldn't send a password recovery email.")
      );
    }
  }, []);

  const updateEmailAddress = useCallback(async (nextEmail) => {
    const normalizedEmail = String(nextEmail || "").trim();

    if (!normalizedEmail) {
      throw new Error("Enter a new email address.");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }

    try {
      await requestEmailChange(normalizedEmail);
      return normalizedEmail;
    } catch (error) {
      throw new Error(
        friendlySettingsMessage(error, "We couldn't start your email change.")
      );
    }
  }, []);

  const saveBillingProfile = useCallback(async (values) => {
    const preferredPaymentMethod = String(
      values?.preferredPaymentMethod || ""
    ).trim();

    if (!preferredPaymentMethod) {
      throw new Error("Choose QRPh to continue.");
    }

    if (preferredPaymentMethod !== "qrph") {
      throw new Error("Choose QRPh to continue.");
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error("You need to be signed in to update billing information.");
      }

      const payload = {
        customer_id: session.user.id,
        preferred_payment_method: preferredPaymentMethod,
        wallet_provider: "QRPh",
        wallet_phone_number: null,
      };

      const { data, error } = await supabase
        .from("customer_billing_profiles")
        .upsert(payload, { onConflict: "customer_id" })
        .select("*")
        .single();

      if (error) throw error;

      const nextProfile = normalizeBillingProfile(data);
      setBillingProfile(nextProfile);
      setBillingAvailable(true);
      return nextProfile;
    } catch (error) {
      throw new Error(
        friendlySettingsMessage(error, "We couldn't save your billing information.")
      );
    }
  }, []);

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
    providerLabel,
    hasPasswordProvider,
    billingProfile,
    billingHistory,
    billingAvailable,
    billingHistorySummary,
    hasSavedWallet,
    hasSavedCard,
    changePassword,
    sendPasswordRecovery,
    updateEmailAddress,
    saveBillingProfile,
    deleteAccount,
    reload: load,
  };
}
