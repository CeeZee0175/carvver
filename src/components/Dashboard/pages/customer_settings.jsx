import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../../lib/supabase/auth";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useCustomerAccountSettings } from "../hooks/useCustomerAccountSettings";
import "./profile.css";
import "./customer_settings.css";

function StatMiniCard({ label, value, className = "" }) {
  return (
    <div className={`profileMiniStat profileMiniStat--open ${className}`.trim()}>
      <span className="profileMiniStat__label">{label}</span>
      <strong className="profileMiniStat__value">{value}</strong>
    </div>
  );
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

function renderQrMarkup(qrCode) {
  const normalized = String(qrCode || "").trim();
  if (!normalized) return null;

  if (normalized.startsWith("<svg")) {
    return (
      <div
        className="customerSettingsQr__svg"
        dangerouslySetInnerHTML={{ __html: normalized }}
      />
    );
  }

  return <img src={normalized} alt="Authenticator QR code" className="customerSettingsQr__image" />;
}

export default function CustomerSettings() {
  const navigate = useNavigate();
  const {
    loading,
    email,
    providerLabel,
    hasPasswordProvider,
    mfaEnabled,
    verifiedFactor,
    enrollment,
    changePassword,
    startTotpEnrollment,
    verifyTotpEnrollment,
    cancelTotpEnrollment,
    disableTotp,
    deleteAccount,
  } = useCustomerAccountSettings();

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordState, setPasswordState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [twoFactorState, setTwoFactorState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteState, setDeleteState] = useState({
    pending: false,
    error: "",
  });

  const passwordModeLabel = hasPasswordProvider ? "Password" : "Add password";
  const twoFactorLabel = mfaEnabled ? "On" : enrollment ? "Setting up" : "Off";
  const signInLabel = useMemo(() => providerLabel || "Password", [providerLabel]);

  const resetPasswordState = () =>
    setPasswordState({
      pending: false,
      error: "",
      success: "",
    });

  const resetTwoFactorState = () =>
    setTwoFactorState({
      pending: false,
      error: "",
      success: "",
    });

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

  const handleStartTwoFactor = async () => {
    resetTwoFactorState();
    setTwoFactorState((prev) => ({ ...prev, pending: true }));

    try {
      await startTotpEnrollment();
      setSetupCode("");
      setTwoFactorState({
        pending: false,
        error: "",
        success: "",
      });
    } catch (error) {
      setTwoFactorState({
        pending: false,
        error: error.message || "We couldn't start two-factor setup.",
        success: "",
      });
    }
  };

  const handleVerifyTwoFactor = async (event) => {
    event.preventDefault();
    resetTwoFactorState();
    setTwoFactorState((prev) => ({ ...prev, pending: true }));

    try {
      await verifyTotpEnrollment(setupCode);
      setSetupCode("");
      setTwoFactorState({
        pending: false,
        error: "",
        success: "Two-factor authentication is now on.",
      });
    } catch (error) {
      setTwoFactorState({
        pending: false,
        error: error.message || "We couldn't confirm that code.",
        success: "",
      });
    }
  };

  const handleDisableTwoFactor = async (event) => {
    event.preventDefault();
    resetTwoFactorState();
    setTwoFactorState((prev) => ({ ...prev, pending: true }));

    try {
      await disableTotp(disableCode);
      setDisableCode("");
      setTwoFactorState({
        pending: false,
        error: "",
        success: "Two-factor authentication has been turned off.",
      });
    } catch (error) {
      setTwoFactorState({
        pending: false,
        error: error.message || "We couldn't turn off two-factor authentication.",
        success: "",
      });
    }
  };

  const handleCopySecret = async () => {
    if (!enrollment?.secret) return;

    try {
      await navigator.clipboard.writeText(enrollment.secret);
      toast.success("Setup key copied.");
    } catch {
      toast.error("We couldn't copy that key.");
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
    setDeleteState({
      pending: false,
      error: "",
    });
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteState({
      pending: true,
      error: "",
    });

    try {
      await deleteAccount(deleteConfirmation);
      navigate("/", {
        replace: true,
        state: { accountDeleted: true },
      });
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
        <section className="profileHero customerSettingsHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap customerSettingsHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Settings" />
              </h1>
              <motion.svg
                className="profileHero__line customerSettingsHero__line"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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
          </div>

          <div className="profileHero__stats profileHero__stats--open customerSettingsHero__stats">
            <StatMiniCard label="Sign-in" value={loading ? "--" : signInLabel} />
            <StatMiniCard label="Password" value={loading ? "--" : passwordModeLabel} />
            <StatMiniCard label="2FA" value={loading ? "--" : twoFactorLabel} />
            <StatMiniCard label="Email" value={loading ? "--" : email || "Not available"} />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Security</h2>
            </div>
          </div>

          <div className="customerSettingsGrid">
            <article className="customerSettingsPanel">
              <div className="customerSettingsPanel__head">
                <div className="customerSettingsPanel__titleWrap">
                  <span className="customerSettingsPanel__iconWrap" aria-hidden="true">
                    <KeyRound className="customerSettingsPanel__icon" />
                  </span>
                  <div>
                    <h3 className="customerSettingsPanel__title">Password</h3>
                    <p className="customerSettingsPanel__meta">{passwordModeLabel}</p>
                  </div>
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
                  <span className="customerSettingsField__label">Confirm new password</span>
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

                <AnimatePresence mode="wait">
                  {passwordState.error ? (
                    <InlineStatus key="password-error" tone="danger" message={passwordState.error} />
                  ) : passwordState.success ? (
                    <InlineStatus
                      key="password-success"
                      tone="success"
                      message={passwordState.success}
                    />
                  ) : null}
                </AnimatePresence>

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
              </form>
            </article>

            <article className="customerSettingsPanel">
              <div className="customerSettingsPanel__head">
                <div className="customerSettingsPanel__titleWrap">
                  <span className="customerSettingsPanel__iconWrap" aria-hidden="true">
                    <ShieldCheck className="customerSettingsPanel__icon" />
                  </span>
                  <div>
                    <h3 className="customerSettingsPanel__title">Two-factor authentication</h3>
                    <p className="customerSettingsPanel__meta">{twoFactorLabel}</p>
                  </div>
                </div>

                {!mfaEnabled && !enrollment ? (
                  <motion.button
                    type="button"
                    className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleStartTwoFactor}
                    disabled={twoFactorState.pending}
                  >
                    {twoFactorState.pending ? (
                      <LoaderCircle className="customerSettingsAction__spinner" />
                    ) : null}
                    <span>Set up 2FA</span>
                  </motion.button>
                ) : null}
              </div>

              <AnimatePresence mode="wait">
                {twoFactorState.error ? (
                  <InlineStatus key="twofactor-error" tone="danger" message={twoFactorState.error} />
                ) : twoFactorState.success ? (
                  <InlineStatus
                    key="twofactor-success"
                    tone="success"
                    message={twoFactorState.success}
                  />
                ) : null}
              </AnimatePresence>

              {enrollment ? (
                <motion.div
                  className="customerSettingsTotp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="customerSettingsQr">
                    {renderQrMarkup(enrollment.qrCode)}
                  </div>

                  <div className="customerSettingsTotp__keyRow">
                    <code className="customerSettingsTotp__key">{enrollment.secret || "No key available"}</code>
                    {enrollment.secret ? (
                      <motion.button
                        type="button"
                        className="customerSettingsIconAction"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        transition={PROFILE_SPRING}
                        onClick={handleCopySecret}
                        aria-label="Copy setup key"
                      >
                        <Copy className="customerSettingsIconAction__icon" />
                      </motion.button>
                    ) : null}
                  </div>

                  <form className="customerSettingsInlineForm" onSubmit={handleVerifyTwoFactor}>
                    <label className="customerSettingsField">
                      <span className="customerSettingsField__label">Verification code</span>
                      <input
                        className="customerSettingsField__control"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={setupCode}
                        onChange={(event) => setSetupCode(event.target.value.replace(/\D+/g, ""))}
                      />
                    </label>

                    <div className="customerSettingsInlineForm__actions">
                      <motion.button
                        type="submit"
                        className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        disabled={twoFactorState.pending}
                      >
                        {twoFactorState.pending ? (
                          <LoaderCircle className="customerSettingsAction__spinner" />
                        ) : null}
                        <span>Confirm code</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={cancelTotpEnrollment}
                        disabled={twoFactorState.pending}
                      >
                        <span>Cancel</span>
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              ) : null}

              {mfaEnabled && verifiedFactor ? (
                <form className="customerSettingsInlineForm" onSubmit={handleDisableTwoFactor}>
                  <div className="customerSettingsVerified">
                    <div className="customerSettingsVerified__copy">
                      <span className="customerSettingsVerified__iconWrap" aria-hidden="true">
                        <Smartphone className="customerSettingsVerified__icon" />
                      </span>
                      <div>
                        <strong className="customerSettingsVerified__title">Authenticator app</strong>
                        <span className="customerSettingsVerified__meta">
                          {verifiedFactor.friendly_name || "Connected"}
                        </span>
                      </div>
                    </div>

                    <span className="customerSettingsVerified__pill">
                      <CheckCircle2 className="customerSettingsVerified__pillIcon" />
                      Enabled
                    </span>
                  </div>

                  <label className="customerSettingsField">
                    <span className="customerSettingsField__label">Code to turn it off</span>
                    <input
                      className="customerSettingsField__control"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={disableCode}
                      onChange={(event) =>
                        setDisableCode(event.target.value.replace(/\D+/g, ""))
                      }
                    />
                  </label>

                  <motion.button
                    type="submit"
                    className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--danger"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    disabled={twoFactorState.pending}
                  >
                    {twoFactorState.pending ? (
                      <LoaderCircle className="customerSettingsAction__spinner" />
                    ) : null}
                    <span>Turn off 2FA</span>
                  </motion.button>
                </form>
              ) : null}
            </article>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection customerSettingsSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Account</h2>
            </div>
          </div>

          <div className="customerSettingsGrid customerSettingsGrid--account">
            <article className="customerSettingsPanel">
              <div className="customerSettingsPanel__head">
                <div className="customerSettingsPanel__titleWrap">
                  <span className="customerSettingsPanel__iconWrap" aria-hidden="true">
                    <LogOut className="customerSettingsPanel__icon" />
                  </span>
                  <div>
                    <h3 className="customerSettingsPanel__title">Session</h3>
                    <p className="customerSettingsPanel__meta">{email || "Signed in"}</p>
                  </div>
                </div>
              </div>

              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleSignOut}
              >
                <LogOut className="profileEditor__btnIcon" />
                <span>Sign out</span>
              </motion.button>
            </article>

            <article className="customerSettingsPanel customerSettingsPanel--danger">
              <div className="customerSettingsPanel__head">
                <div className="customerSettingsPanel__titleWrap">
                  <span
                    className="customerSettingsPanel__iconWrap customerSettingsPanel__iconWrap--danger"
                    aria-hidden="true"
                  >
                    <Trash2 className="customerSettingsPanel__icon customerSettingsPanel__icon--danger" />
                  </span>
                  <div>
                    <h3 className="customerSettingsPanel__title">Delete account</h3>
                    <p className="customerSettingsPanel__meta">Permanent</p>
                  </div>
                </div>
              </div>

              <motion.button
                type="button"
                className="profileEditor__btn customerSettingsAction customerSettingsAction--dangerSolid"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="profileEditor__btnIcon" />
                <span>Delete account</span>
              </motion.button>
            </article>
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
                  className="customerSettingsModal__close"
                  onClick={closeDeleteModal}
                  aria-label="Close delete account dialog"
                >
                  <X className="customerSettingsModal__closeIcon" />
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

                <div className="customerSettingsModal__actions">
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
