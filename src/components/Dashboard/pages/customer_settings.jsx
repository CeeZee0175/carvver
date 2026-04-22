import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { PASSWORD_POLICY_HINT } from "../../../lib/passwordPolicy";
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

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;

  return (
    <Motion.div
      className={`customerSettingsStatus customerSettingsStatus--${tone}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </Motion.div>
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
    billingHistory,
    billingAvailable,
    billingHistorySummary,
    changePassword,
    sendPasswordRecovery,
    updateEmailAddress,
    deleteAccount,
  } = useCustomerAccountSettings();

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailValue, setEmailValue] = useState("");
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteState, setDeleteState] = useState({
    pending: false,
    error: "",
  });

  useEffect(() => {
    if (location.search.includes("emailChange=success")) {
      queueMicrotask(() => {
        setEmailState({
          pending: false,
          error: "",
          success: "Your email change was confirmed.",
        });
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

  const resetPasswordState = () =>
    setPasswordState({ pending: false, error: "", success: "" });
  const resetRecoveryState = () =>
    setRecoveryState({ pending: false, error: "", success: "" });
  const resetEmailState = () =>
    setEmailState({ pending: false, error: "", success: "" });
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
              <Motion.svg
                className="customerSettingsHero__line"
                viewBox="0 0 248 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M 0,10 L 248,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </Motion.svg>
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
              <Motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.32, delay: index * 0.04 }}
              >
                <OverviewItem label={item.label} value={item.value} />
              </Motion.div>
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
                {PASSWORD_POLICY_HINT}
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
              <Motion.button
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
              </Motion.button>

              <Motion.button
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
              </Motion.button>
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
                <Motion.button
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
                </Motion.button>

                <Motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={cancelEmailEdit}
                  disabled={emailState.pending}
                >
                  Cancel
                </Motion.button>
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

                <Motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={startEmailEdit}
                >
                  Change email
                </Motion.button>
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
                Review completed checkout activity and payment references in one place.
              </p>
            </div>
          </div>

          {billingAvailable ? (
            <div className="customerSettingsBillingLayout customerSettingsBillingLayout--historyOnly">
              <div className="customerSettingsBillingBlock customerSettingsBillingBlock--historyOnly">
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
                        <Motion.article
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
                        </Motion.article>
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
                <Motion.button
                  type="button"
                  className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={handleSignOut}
                >
                  Sign out
                </Motion.button>
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
                <Motion.button
                  type="button"
                  className="profileEditor__btn customerSettingsAction customerSettingsAction--dangerSolid"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Delete account
                </Motion.button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <AnimatePresence>
        {deleteModalOpen ? (
          <Motion.div
            className="customerSettingsModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteModal}
          >
            <Motion.div
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
                  <Motion.button
                    type="button"
                    className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={closeDeleteModal}
                    disabled={deleteState.pending}
                  >
                    Cancel
                  </Motion.button>

                  <Motion.button
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
                  </Motion.button>
                </div>
              </form>
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </CustomerDashboardFrame>
  );
}
