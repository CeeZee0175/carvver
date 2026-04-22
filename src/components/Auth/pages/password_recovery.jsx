import React, { useMemo, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { requestPasswordRecovery } from "../../../lib/supabase/auth";
import {
  InlineStatus,
  PasswordRecoveryShell,
  RecoveryButton,
} from "./password_recovery_shared";
import {
  buildRecoveryPath,
  EMAIL_PATTERN,
  setStoredRecoveryState,
  useRecoveryLinkBridge,
} from "./password_recovery_state";
import "./password_recovery.css";

export default function PasswordRecovery() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefilledEmail = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return String(params.get("email") || "").trim();
  }, [location.search]);
  const bridge = useRecoveryLinkBridge("/recover-password/reset");

  const [email, setEmail] = useState(prefilledEmail);
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState({
    pending: false,
    success: "",
    error: "",
  });

  const validateEmail = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "Enter your email.";
    if (!EMAIL_PATTERN.test(normalized)) return "Enter a valid email address.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextError = validateEmail(email);
    setEmailError(nextError);

    if (nextError) {
      setStatus((prev) => ({
        ...prev,
        error: "",
        success: "",
      }));
      return;
    }

    try {
      setStatus({
        pending: true,
        success: "",
        error: "",
      });

      const normalizedEmail = email.trim();
      await requestPasswordRecovery(normalizedEmail);

      setStoredRecoveryState({
        email: normalizedEmail,
        verified: false,
      });

      setStatus({
        pending: false,
        success: "We sent your code to this email.",
        error: "",
      });

      window.setTimeout(() => {
        navigate(buildRecoveryPath("/recover-password/verify", normalizedEmail));
      }, 650);
    } catch (error) {
      setStatus({
        pending: false,
        success: "",
        error: error.message || "We couldn't send your recovery code.",
      });
    }
  };

  return (
    <PasswordRecoveryShell title="Recover password">
      {({ inView }) => (
        <Motion.form
          className="passwordRecoveryForm"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.18 }}
        >
          <label className="passwordRecoveryField">
            <span className="passwordRecoveryField__label">Email</span>
            <input
              className="passwordRecoveryField__control"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) {
                  setEmailError(validateEmail(event.target.value));
                }
                if (status.error || status.success) {
                  setStatus((prev) => ({
                    ...prev,
                    error: "",
                    success: "",
                  }));
                }
              }}
              onBlur={(event) => setEmailError(validateEmail(event.target.value))}
              aria-invalid={emailError ? "true" : "false"}
            />
            {emailError ? (
              <span className="passwordRecoveryField__error">{emailError}</span>
            ) : null}
            <AnimatePresence mode="wait">
              {status.success ? (
                <InlineStatus
                  key="email-success"
                  tone="success"
                  message={status.success}
                  className="passwordRecoveryField__status"
                />
              ) : status.error ? (
                <InlineStatus
                  key="email-error"
                  tone="danger"
                  message={status.error}
                  className="passwordRecoveryField__status"
                />
              ) : bridge.pending ? (
                <InlineStatus
                  key="link-check"
                  message="Checking your recovery link..."
                  className="passwordRecoveryField__status"
                />
              ) : bridge.error ? (
                <InlineStatus
                  key="link-error"
                  tone="danger"
                  message={bridge.error}
                  className="passwordRecoveryField__status"
                />
              ) : null}
            </AnimatePresence>
          </label>

          <div className="passwordRecoveryActions">
            <RecoveryButton
              type="button"
              variant="ghost"
              onClick={() => navigate("/sign-in")}
              disabled={status.pending || bridge.pending}
            >
              Back to sign in
            </RecoveryButton>

            <RecoveryButton
              type="submit"
              loading={status.pending}
              disabled={bridge.pending}
            >
              Continue
            </RecoveryButton>
          </div>
        </Motion.form>
      )}
    </PasswordRecoveryShell>
  );
}
