import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, signOut, updatePassword } from "../../../lib/supabase/auth";
import {
  getPasswordPolicyError,
  PASSWORD_POLICY_HINT,
} from "../../../lib/passwordPolicy";
import {
  buildRecoveryPath,
  clearStoredRecoveryState,
  getRecoveryEmail,
  InlineStatus,
  isRecoveryVerified,
  PasswordRecoveryShell,
  RecoveryButton,
  useRecoveryLinkBridge,
} from "./password_recovery_shared";
import "./password_recovery.css";

export default function PasswordRecoveryReset() {
  const location = useLocation();
  const navigate = useNavigate();
  const bridge = useRecoveryLinkBridge("/recover-password/reset");
  const email = useMemo(() => getRecoveryEmail(location.search), [location.search]);

  const [values, setValues] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [sessionReady, setSessionReady] = useState(false);
  const [status, setStatus] = useState({
    pending: false,
    error: "",
    success: "",
  });

  const validatePasswordFields = (nextValues) => ({
    newPassword: getPasswordPolicyError(
      nextValues.newPassword,
      "Enter a new password."
    ),
    confirmPassword:
      !nextValues.confirmPassword
        ? "Confirm your new password."
        : String(nextValues.confirmPassword) !== String(nextValues.newPassword)
        ? "Your new passwords don't match."
        : "",
  });

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (bridge.pending || bridge.error) return;

      try {
        const session = await getSession();
        const ready = Boolean(session?.user?.email) || isRecoveryVerified();

        if (!active) return;

        if (!ready) {
          navigate(buildRecoveryPath("/recover-password/verify", email), {
            replace: true,
          });
          return;
        }

        setSessionReady(true);
      } catch {
        if (!active) return;
        navigate(buildRecoveryPath("/recover-password/verify", email), {
          replace: true,
        });
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [bridge.error, bridge.pending, email, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validatePasswordFields(values);
    const nextErrors = Object.fromEntries(
      Object.entries(validation).filter(([, message]) => Boolean(message))
    );

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setStatus({
        pending: true,
        error: "",
        success: "",
      });

      await updatePassword(values.newPassword);
      await signOut();
      clearStoredRecoveryState();

      setStatus({
        pending: false,
        error: "",
        success: "Your password has been updated.",
      });

      window.setTimeout(() => {
        navigate("/sign-in?reset=success", { replace: true });
      }, 900);
    } catch (error) {
      setStatus({
        pending: false,
        error: error.message || "We couldn't update your password.",
        success: "",
      });
    }
  };

  return (
    <PasswordRecoveryShell title="Set a new password">
      {({ inView }) => (
        <motion.form
          className="passwordRecoveryForm"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.18 }}
        >
          <div className="passwordRecoveryForm__row">
            <label className="passwordRecoveryField">
              <span className="passwordRecoveryField__label">New password</span>
              <input
                className="passwordRecoveryField__control"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={values.newPassword}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const nextValues = {
                    ...values,
                    newPassword: nextValue,
                  };
                  setValues((prev) => ({
                    ...prev,
                    newPassword: nextValue,
                  }));
                  const validation = validatePasswordFields(nextValues);
                  setFieldErrors((prev) => ({
                    ...prev,
                    newPassword: validation.newPassword,
                    confirmPassword:
                      fieldErrors.confirmPassword || nextValues.confirmPassword
                        ? validation.confirmPassword
                        : prev.confirmPassword,
                  }));
                }}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    newPassword: validatePasswordFields({
                      ...values,
                      newPassword: event.target.value,
                    }).newPassword,
                  }))
                }
                aria-invalid={fieldErrors.newPassword ? "true" : "false"}
                aria-describedby={
                  fieldErrors.newPassword
                    ? "password-recovery-password-error"
                    : "password-recovery-password-hint"
                }
              />
              {fieldErrors.newPassword ? (
                <span
                  className="passwordRecoveryField__error"
                  id="password-recovery-password-error"
                >
                  {fieldErrors.newPassword}
                </span>
              ) : (
                <span
                  className="passwordRecoveryField__meta"
                  id="password-recovery-password-hint"
                >
                  {PASSWORD_POLICY_HINT}
                </span>
              )}
            </label>

            <label className="passwordRecoveryField">
              <span className="passwordRecoveryField__label">Confirm password</span>
              <input
                className="passwordRecoveryField__control"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const nextValues = {
                    ...values,
                    confirmPassword: nextValue,
                  };
                  setValues((prev) => ({
                    ...prev,
                    confirmPassword: nextValue,
                  }));
                  const validation = validatePasswordFields(nextValues);
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      fieldErrors.confirmPassword || nextValue
                        ? validation.confirmPassword
                        : prev.confirmPassword,
                  }));
                }}
                onBlur={(event) =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validatePasswordFields({
                      ...values,
                      confirmPassword: event.target.value,
                    }).confirmPassword,
                  }))
                }
                aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
              />
              {fieldErrors.confirmPassword ? (
                <span className="passwordRecoveryField__error">
                  {fieldErrors.confirmPassword}
                </span>
              ) : null}
            </label>
          </div>

          <AnimatePresence mode="wait">
            {status.success ? (
              <InlineStatus key="reset-success" tone="success" message={status.success} />
            ) : status.error ? (
              <InlineStatus key="reset-error" tone="danger" message={status.error} />
            ) : bridge.error ? (
              <InlineStatus key="reset-link-error" tone="danger" message={bridge.error} />
            ) : bridge.pending || !sessionReady ? (
              <InlineStatus
                key="reset-ready"
                message="Getting your reset ready..."
              />
            ) : null}
          </AnimatePresence>

          <div className="passwordRecoveryActions">
            <RecoveryButton
              type="button"
              variant="ghost"
              onClick={() => navigate(buildRecoveryPath("/recover-password/verify", email))}
              disabled={status.pending || bridge.pending || !sessionReady}
            >
              Back
            </RecoveryButton>

            <RecoveryButton
              type="submit"
              loading={status.pending}
              disabled={bridge.pending || !sessionReady}
            >
              Save new password
            </RecoveryButton>
          </div>
        </motion.form>
      )}
    </PasswordRecoveryShell>
  );
}
