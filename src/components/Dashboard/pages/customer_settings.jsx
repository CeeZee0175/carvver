import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../../../lib/supabase/auth";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useCustomerAccountSettings } from "../hooks/useCustomerAccountSettings";
import "./profile.css";
import "./customer_settings.css";

function formatBillingDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getBillingStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    case "refunded":
      return "Refunded";
    case "draft":
      return "Draft";
    default:
      return "Pending";
  }
}

function formatCardSummary(profile) {
  if (
    !profile?.defaultCardBrand ||
    !profile?.defaultCardLast4 ||
    !profile?.defaultCardExpMonth ||
    !profile?.defaultCardExpYear
  ) {
    return "";
  }

  const brand = String(profile.defaultCardBrand || "")
    .replace(/_/g, " ")
    .trim();

  return `${brand} ending in ${profile.defaultCardLast4} · ${String(
    profile.defaultCardExpMonth
  ).padStart(2, "0")}/${profile.defaultCardExpYear}`;
}

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;

  return (
    <motion.div
      className={`customerSettingsStatus customerSettingsStatus--${tone}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </motion.div>
  );
}

function OverviewItem({ label, value }) {
  return (
    <article className="customerSettingsOverviewItem">
      <span className="customerSettingsOverviewItem__label">{label}</span>
      <strong className="customerSettingsOverviewItem__value">{value}</strong>
    </article>
  );
}

function DetailRow({ label, value, wrap = false }) {
  return (
    <div className="customerSettingsDetails__row">
      <span className="customerSettingsDetails__label">{label}</span>
      <span
        className={`customerSettingsDetails__value ${
          wrap ? "customerSettingsDetails__value--wrap" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CustomerSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    email,
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
  } = useCustomerAccountSettings();

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [billingEditing, setBillingEditing] = useState(false);
  const [billingValues, setBillingValues] = useState({
    preferredPaymentMethod: "",
    walletProvider: "",
    walletPhoneNumber: "",
  });
  const [passwordState, setPasswordState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [recoveryState, setRecoveryState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [emailState, setEmailState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [billingState, setBillingState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteState, setDeleteState] = useState({
    pending: false,
    error: "",
  });

  useEffect(() => {
    if (location.search.includes("emailChange=success")) {
      setEmailState({
        pending: false,
        error: "",
        success: "Your email change was confirmed.",
      });
    }
  }, [location.search]);

  const overviewItems = useMemo(
    () => [
      {
        label: "Email",
        value: loading ? "--" : email || "Not available",
      },
      {
        label: "Sign-in method",
        value: loading ? "--" : providerLabel,
      },
      {
        label: "Account status",
        value: loading ? "--" : "Active",
      },
    ],
    [email, loading, providerLabel]
  );

  const cardSummary = useMemo(
    () => formatCardSummary(billingProfile),
    [billingProfile]
  );

  const hasBillingSetup = useMemo(
    () =>
      Boolean(
        billingProfile.preferredPaymentMethod || hasSavedWallet || hasSavedCard
      ),
    [billingProfile.preferredPaymentMethod, hasSavedCard, hasSavedWallet]
  );

  const resetPasswordState = () =>
    setPasswordState({ pending: false, error: "", success: "" });
  const resetRecoveryState = () =>
    setRecoveryState({ pending: false, error: "", success: "" });
  const resetEmailState = () =>
    setEmailState({ pending: false, error: "", success: "" });
  const resetBillingState = () =>
    setBillingState({ pending: false, error: "", success: "" });

  const startEmailEdit = () => {
    setEmailValue(email || "");
    resetEmailState();
    setEmailEditing(true);
  };

  const cancelEmailEdit = () => {
    setEmailEditing(false);
    setEmailValue("");
    resetEmailState();
  };

  const startBillingEdit = () => {
    setBillingValues({
      preferredPaymentMethod:
        billingProfile.preferredPaymentMethod ||
        (billingProfile.walletProvider ? "wallet" : hasSavedCard ? "card" : ""),
      walletProvider: billingProfile.walletProvider || "",
      walletPhoneNumber: billingProfile.walletPhoneNumber || "",
    });
    resetBillingState();
    setBillingEditing(true);
  };

  const cancelBillingEdit = () => {
    setBillingEditing(false);
    setBillingValues({
      preferredPaymentMethod: "",
      walletProvider: "",
      walletPhoneNumber: "",
    });
    resetBillingState();
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    resetPasswordState();
    setPasswordState((prev) => ({ ...prev, pending: true }));

    try {
      await changePassword(passwordValues);
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordState({
        pending: false,
        error: "",
        success: hasPasswordProvider
          ? "Your password has been updated."
          : "A password was added to your account.",
      });
    } catch (error) {
      setPasswordState({
        pending: false,
        error: error.message || "We couldn't update your password.",
        success: "",
      });
    }
  };

  const handleForgotPassword = async () => {
    resetRecoveryState();
    setRecoveryState((prev) => ({ ...prev, pending: true }));

    try {
      const recoveryEmail = await sendPasswordRecovery();
      setRecoveryState({
        pending: false,
        error: "",
        success: `A recovery code was sent to ${recoveryEmail}.`,
      });
    } catch (error) {
      setRecoveryState({
        pending: false,
        error: error.message || "We couldn't send a recovery email.",
        success: "",
      });
    }
  };

  const handleEmailSave = async (event) => {
    event.preventDefault();
    resetEmailState();
    setEmailState((prev) => ({ ...prev, pending: true }));

    try {
      const nextEmail = await updateEmailAddress(emailValue);
      setEmailState({
        pending: false,
        error: "",
        success: `Check ${nextEmail} to confirm your new email.`,
      });
      setEmailEditing(false);
    } catch (error) {
      setEmailState({
        pending: false,
        error: error.message || "We couldn't start your email change.",
        success: "",
      });
    }
  };

  const handleBillingSave = async (event) => {
    event.preventDefault();
    resetBillingState();
    setBillingState((prev) => ({ ...prev, pending: true }));

    try {
      await saveBillingProfile(billingValues);
      setBillingEditing(false);
      setBillingState({
        pending: false,
        error: "",
        success: "Your payment preferences were saved.",
      });
    } catch (error) {
      setBillingState({
        pending: false,
        error: error.message || "We couldn't save your payment preferences.",
        success: "",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      toast.error("We couldn't sign you out. Please try again.");
    }
  };

  const closeDeleteModal = () => {
    if (deleteState.pending) return;
    setDeleteModalOpen(false);
    setDeleteConfirmation("");
    setDeleteState({ pending: false, error: "" });
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteState({ pending: true, error: "" });

    try {
      await deleteAccount(deleteConfirmation);
      navigate("/", { replace: true, state: { accountDeleted: true } });
    } catch (error) {
      setDeleteState({
        pending: false,
        error: error.message || "We couldn't delete your account.",
      });
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details customerSettingsPage">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Settings" }]} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="customerSettingsHero">
          <div className="customerSettingsHero__heading">
            <div className="customerSettingsHero__titleWrap">
              <h1 className="customerSettingsHero__title">
                <TypewriterHeading text="Settings" />
              </h1>
              <motion.svg
                className="customerSettingsHero__line"
                viewBox="0 0 248 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 62,0 124,10 Q 186,20 248,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </motion.svg>
            </div>

            <p className="profileHero__sub">
              Manage account details, billing preferences, and customer-side security from one place.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head customerSettingsSection__head">
            <div className="customerSettingsSectionIntro">
              <h2 className="profileSection__title">Account Overview</h2>
              <p className="customerSettingsSectionIntro__copy">
                Review the core details attached to your customer account.
              </p>
            </div>
          </div>

          <div className="customerSettingsOverview">
            {overviewItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.32, delay: index * 0.04 }}
              >
                <OverviewItem label={item.label} value={item.value} />
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head customerSettingsSection__head">
            <div className="customerSettingsSectionIntro">
              <h2 className="profileSection__title">Security</h2>
              <p className="customerSettingsSectionIntro__copy">
                Use at least 8 characters for your next password.
              </p>
            </div>
          </div>

          <form className="customerSettingsForm" onSubmit={handlePasswordChange}>
            {hasPasswordProvider ? (
              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Current password</span>
                <input
                  className="customerSettingsField__control"
                  type="password"
                  autoComplete="current-password"
                  value={passwordValues.currentPassword}
                  onChange={(event) =>
                    setPasswordValues((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <div className="customerSettingsForm__row">
              <label className="customerSettingsField">
                <span className="customerSettingsField__label">New password</span>
                <input
                  className="customerSettingsField__control"
                  type="password"
                  autoComplete="new-password"
                  value={passwordValues.newPassword}
                  onChange={(event) =>
                    setPasswordValues((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Confirm password</span>
                <input
                  className="customerSettingsField__control"
                  type="password"
                  autoComplete="new-password"
                  value={passwordValues.confirmPassword}
                  onChange={(event) =>
                    setPasswordValues((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <AnimatePresence mode="wait">
              {passwordState.error ? (
                <InlineStatus key="password-error" tone="danger" message={passwordState.error} />
              ) : passwordState.success ? (
                <InlineStatus
                  key="password-success"
                  tone="success"
                  message={passwordState.success}
                />
              ) : recoveryState.error ? (
                <InlineStatus key="recovery-error" tone="danger" message={recoveryState.error} />
              ) : recoveryState.success ? (
                <InlineStatus
                  key="recovery-success"
                  tone="success"
                  message={recoveryState.success}
                />
              ) : null}
            </AnimatePresence>

            <div className="customerSettingsActionsRow customerSettingsActionsRow--split">
              <motion.button
                type="submit"
                className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                disabled={passwordState.pending}
              >
                {passwordState.pending ? (
                  <LoaderCircle className="customerSettingsAction__spinner" />
                ) : null}
                <span>{hasPasswordProvider ? "Update password" : "Add password"}</span>
              </motion.button>

              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleForgotPassword}
                disabled={recoveryState.pending}
              >
                {recoveryState.pending ? (
                  <LoaderCircle className="customerSettingsAction__spinner" />
                ) : null}
                <span>Forgot password</span>
              </motion.button>
            </div>
          </form>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head customerSettingsSection__head">
            <div className="customerSettingsSectionIntro">
              <h2 className="profileSection__title">Email</h2>
              <p className="customerSettingsSectionIntro__copy">
                Keep your sign-in address current and confirm changes through email.
              </p>
            </div>
          </div>

          {emailEditing ? (
            <form className="customerSettingsForm" onSubmit={handleEmailSave}>
              <div className="customerSettingsDetails customerSettingsDetails--single">
                <DetailRow label="Current email" value={email || "Not available"} wrap />
              </div>

              <label className="customerSettingsField">
                <span className="customerSettingsField__label">New email</span>
                <input
                  className="customerSettingsField__control"
                  type="email"
                  autoComplete="email"
                  value={emailValue}
                  onChange={(event) => setEmailValue(event.target.value)}
                />
              </label>

              <AnimatePresence mode="wait">
                {emailState.error ? (
                  <InlineStatus key="email-error" tone="danger" message={emailState.error} />
                ) : emailState.success ? (
                  <InlineStatus key="email-success" tone="success" message={emailState.success} />
                ) : null}
              </AnimatePresence>

              <div className="customerSettingsActionsRow">
                <motion.button
                  type="submit"
                  className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  disabled={emailState.pending}
                >
                  {emailState.pending ? (
                    <LoaderCircle className="customerSettingsAction__spinner" />
                  ) : null}
                  <span>Save email</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={cancelEmailEdit}
                  disabled={emailState.pending}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="customerSettingsAccountSurface">
              <div className="customerSettingsAccountAction">
                <div className="customerSettingsAccountAction__copy">
                  <span className="customerSettingsDetails__label">Current email</span>
                  <span className="customerSettingsDetails__value customerSettingsDetails__value--wrap">
                    {email || "Not available"}
                  </span>
                </div>

                <motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={startEmailEdit}
                >
                  Change email
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {emailState.error ? (
                  <InlineStatus key="email-error-view" tone="danger" message={emailState.error} />
                ) : emailState.success ? (
                  <InlineStatus
                    key="email-success-view"
                    tone="success"
                    message={emailState.success}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head customerSettingsSection__head">
            <div className="customerSettingsSectionIntro">
              <h2 className="profileSection__title">Billing</h2>
              <p className="customerSettingsSectionIntro__copy">
                Manage payment preferences and review your recent charges in one place.
              </p>
            </div>
          </div>

          {billingAvailable ? (
            <div className="customerSettingsBillingLayout">
              <div className="customerSettingsBillingBlock">
                <div className="customerSettingsBillingBlock__head">
                  <h3 className="customerSettingsSubheading">Payment methods</h3>
                  {hasBillingSetup && !billingEditing ? (
                    <motion.button
                      type="button"
                      className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      onClick={startBillingEdit}
                    >
                      Edit
                    </motion.button>
                  ) : null}
                </div>

                {billingEditing ? (
                  <form className="customerSettingsForm" onSubmit={handleBillingSave}>
                    <div className="customerSettingsChoiceGroup">
                      <button
                        type="button"
                        className={`customerSettingsChoice ${
                          billingValues.preferredPaymentMethod === "card"
                            ? "customerSettingsChoice--active"
                            : ""
                        }`}
                        onClick={() =>
                          setBillingValues((prev) => ({
                            ...prev,
                            preferredPaymentMethod: "card",
                          }))
                        }
                      >
                        Card
                      </button>
                      <button
                        type="button"
                        className={`customerSettingsChoice ${
                          billingValues.preferredPaymentMethod === "wallet"
                            ? "customerSettingsChoice--active"
                            : ""
                        }`}
                        onClick={() =>
                          setBillingValues((prev) => ({
                            ...prev,
                            preferredPaymentMethod: "wallet",
                          }))
                        }
                      >
                        GCash or Maya
                      </button>
                    </div>

                    {billingValues.preferredPaymentMethod === "wallet" ? (
                      <>
                        <div className="customerSettingsChoiceGroup">
                          {["GCash", "Maya"].map((provider) => (
                            <button
                              key={provider}
                              type="button"
                              className={`customerSettingsChoice ${
                                billingValues.walletProvider === provider
                                  ? "customerSettingsChoice--active"
                                  : ""
                              }`}
                              onClick={() =>
                                setBillingValues((prev) => ({
                                  ...prev,
                                  walletProvider: provider,
                                }))
                              }
                            >
                              {provider}
                            </button>
                          ))}
                        </div>

                        <label className="customerSettingsField">
                          <span className="customerSettingsField__label">
                            Wallet phone number
                          </span>
                          <input
                            className="customerSettingsField__control"
                            type="tel"
                            inputMode="tel"
                            value={billingValues.walletPhoneNumber}
                            onChange={(event) =>
                              setBillingValues((prev) => ({
                                ...prev,
                                walletPhoneNumber: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </>
                    ) : billingValues.preferredPaymentMethod === "card" ? (
                      <div className="customerSettingsCompactNote">
                        {hasSavedCard
                          ? "Your saved card will stay available as your default method."
                          : "Use a card during checkout and it will appear here once PayMongo returns its saved details."}
                      </div>
                    ) : null}

                    <AnimatePresence mode="wait">
                      {billingState.error ? (
                        <InlineStatus key="billing-error" tone="danger" message={billingState.error} />
                      ) : billingState.success ? (
                        <InlineStatus
                          key="billing-success"
                          tone="success"
                          message={billingState.success}
                        />
                      ) : null}
                    </AnimatePresence>

                    <div className="customerSettingsActionsRow">
                      <motion.button
                        type="submit"
                        className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        disabled={billingState.pending}
                      >
                        {billingState.pending ? (
                          <LoaderCircle className="customerSettingsAction__spinner" />
                        ) : null}
                        <span>Save billing</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={cancelBillingEdit}
                        disabled={billingState.pending}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                ) : hasBillingSetup ? (
                  <div className="customerSettingsDetails">
                    <DetailRow
                      label="Preferred method"
                      value={
                        billingProfile.preferredPaymentMethod === "wallet"
                          ? "GCash or Maya"
                          : billingProfile.preferredPaymentMethod === "card"
                            ? "Card"
                            : "Not set"
                      }
                    />
                    {hasSavedCard ? (
                      <DetailRow label="Saved card" value={cardSummary} wrap />
                    ) : null}
                    {hasSavedWallet ? (
                      <>
                        <DetailRow label="Wallet" value={billingProfile.walletProvider} />
                        <DetailRow
                          label="Wallet phone"
                          value={billingProfile.walletPhoneNumber}
                          wrap
                        />
                      </>
                    ) : null}
                  </div>
                ) : (
                  <EmptySurface
                    hideIcon
                    title="No payment method saved yet"
                    actionLabel="Add payment method"
                    onAction={startBillingEdit}
                    className="customerSettingsBillingEmpty"
                    actionButtonClassName="customerSettingsBillingEmpty__btn"
                  />
                )}
              </div>

              <div className="customerSettingsBillingBlock">
                <div className="customerSettingsBillingBlock__head">
                  <h3 className="customerSettingsSubheading">Billing history</h3>
                </div>

                {billingHistory.length > 0 ? (
                  <>
                    <div className="customerSettingsHistory__summary">
                      <OverviewItem
                        label="Entries"
                        value={loading ? "--" : billingHistorySummary.count}
                      />
                      <OverviewItem
                        label="Paid"
                        value={loading ? "--" : billingHistorySummary.paidCount}
                      />
                      <OverviewItem
                        label="Paid total"
                        value={loading ? "--" : billingHistorySummary.paidTotalLabel}
                      />
                    </div>

                    <div className="customerSettingsHistoryList">
                      {billingHistory.map((entry, index) => (
                        <motion.article
                          key={entry.id}
                          className="customerSettingsHistoryItem"
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.3 }}
                          transition={{ duration: 0.34, delay: index * 0.04 }}
                          whileHover={{ y: -2 }}
                        >
                          <div className="customerSettingsHistoryItem__top">
                            <h3 className="customerSettingsHistoryItem__amount">
                              {entry.currency}{" "}
                              {entry.subtotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </h3>
                            <span
                              className={`customerSettingsHistoryItem__status customerSettingsHistoryItem__status--${String(
                                entry.status || ""
                              ).toLowerCase()}`}
                            >
                              {getBillingStatusLabel(entry.status)}
                            </span>
                          </div>

                          <div className="customerSettingsHistoryItem__meta">
                            <span>{formatBillingDate(entry.paidAt || entry.createdAt)}</span>
                            <span>{entry.itemCount} item{entry.itemCount === 1 ? "" : "s"}</span>
                            {entry.paymentReference ? (
                              <span className="customerSettingsHistoryItem__reference">
                                {entry.paymentReference}
                              </span>
                            ) : null}
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptySurface
                    hideIcon
                    title="No billing history yet"
                    className="customerSettingsHistory__empty"
                  />
                )}
              </div>
            </div>
          ) : (
            <EmptySurface
              hideIcon
              title="Billing information is unavailable right now"
              className="customerSettingsHistory__empty"
            />
          )}
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head customerSettingsSection__head">
            <div className="customerSettingsSectionIntro">
              <h2 className="profileSection__title">Account Actions</h2>
              <p className="customerSettingsSectionIntro__copy">
                Sign out when you are done. Deleting your account removes your profile, saved
                activity, and customer history.
              </p>
            </div>
          </div>

          <div className="customerSettingsAccount">
            <div className="customerSettingsAccount__row">
              <div className="customerSettingsAccountAction">
                <div className="customerSettingsAccountAction__copy">
                  <span className="customerSettingsDetails__label">Session</span>
                  <span className="customerSettingsDetails__value customerSettingsDetails__value--wrap">
                    {email || "Signed in"}
                  </span>
                </div>
                <motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={handleSignOut}
                >
                  Sign out
                </motion.button>
              </div>
            </div>

            <div className="customerSettingsAccount__row customerSettingsAccount__row--danger">
              <div className="customerSettingsAccountAction">
                <div className="customerSettingsAccountAction__copy">
                  <span className="customerSettingsDetails__label">Delete account</span>
                  <span className="customerSettingsAccountAction__warning">
                    This permanently removes your account and cannot be undone.
                  </span>
                </div>
                <motion.button
                  type="button"
                  className="profileEditor__btn customerSettingsAction customerSettingsAction--dangerSolid"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Delete account
                </motion.button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <AnimatePresence>
        {deleteModalOpen ? (
          <motion.div
            className="customerSettingsModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteModal}
          >
            <motion.div
              className="customerSettingsModal__dialog"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-settings-delete-title"
            >
              <div className="customerSettingsModal__head">
                <h2 id="customer-settings-delete-title" className="customerSettingsModal__title">
                  Delete account
                </h2>
                <button
                  type="button"
                  className="customerSettingsModal__textBtn"
                  onClick={closeDeleteModal}
                  aria-label="Close delete account dialog"
                >
                  Close
                </button>
              </div>

              <form className="customerSettingsModal__body" onSubmit={handleDeleteAccount}>
                <label className="customerSettingsField">
                  <span className="customerSettingsField__label">Type DELETE MY ACCOUNT</span>
                  <input
                    className="customerSettingsField__control"
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                  />
                </label>

                <AnimatePresence>
                  {deleteState.error ? (
                    <InlineStatus tone="danger" message={deleteState.error} />
                  ) : null}
                </AnimatePresence>

                <div className="customerSettingsActionsRow">
                  <motion.button
                    type="button"
                    className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={closeDeleteModal}
                    disabled={deleteState.pending}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    type="submit"
                    className="profileEditor__btn customerSettingsAction customerSettingsAction--dangerSolid"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    disabled={deleteState.pending}
                  >
                    {deleteState.pending ? (
                      <LoaderCircle className="customerSettingsAction__spinner" />
                    ) : null}
                    <span>Delete account</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CustomerDashboardFrame>
  );
}
