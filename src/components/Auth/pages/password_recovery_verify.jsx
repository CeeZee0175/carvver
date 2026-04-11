import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  requestPasswordRecovery,
  verifyPasswordRecoveryOtp,
} from "../../../lib/supabase/auth";
import {
  buildRecoveryPath,
  EMAIL_PATTERN,
  getRecoveryEmail,
  InlineStatus,
  OTPInputGroup,
  PasswordRecoveryShell,
  RecoveryButton,
  setStoredRecoveryState,
  useRecoveryLinkBridge,
} from "./password_recovery_shared";
import "./password_recovery.css";

export default function PasswordRecoveryVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const bridge = useRecoveryLinkBridge("/recover-password/reset");
  const email = useMemo(() => getRecoveryEmail(location.search), [location.search]);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [status, setStatus] = useState({
    pending: false,
    resendPending: false,
    success: "",
    error: "",
  });

  useEffect(() => {
    if (!bridge.pending && !bridge.error && !email) {
      navigate("/recover-password", { replace: true });
    }
  }, [bridge.error, bridge.pending, email, navigate]);

  const validateOtp = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "Enter the 6-digit code from your email.";
    if (!/^\d{6}$/.test(normalized)) return "Enter the 6-digit code from your email.";
    return "";
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    const nextError = validateOtp(otp);
    setOtpError(nextError);

    if (nextError || !email) return;

    try {
      setStatus({
        pending: true,
        resendPending: false,
        success: "",
        error: "",
      });

      await verifyPasswordRecoveryOtp({
        email,
        token: otp.trim(),
      });

      setStoredRecoveryState({
        email,
        verified: true,
      });

      navigate(buildRecoveryPath("/recover-password/reset", email), {
        replace: true,
      });
    } catch (error) {
      setStatus({
        pending: false,
        resendPending: false,
        success: "",
        error: error.message || "We couldn't verify that code.",
      });
    }
  };

  const handleResend = async () => {
    const emailError = !email
      ? "Enter your email first."
      : !EMAIL_PATTERN.test(email)
      ? "Enter a valid email address."
      : "";

    if (emailError) {
      setStatus((prev) => ({
        ...prev,
        error: emailError,
        success: "",
      }));
      return;
    }

    try {
      setStatus({
        pending: false,
        resendPending: true,
        success: "",
        error: "",
      });

      await requestPasswordRecovery(email);
      setStatus({
        pending: false,
        resendPending: false,
        success: "A fresh code is on the way.",
        error: "",
      });
    } catch (error) {
      setStatus({
        pending: false,
        resendPending: false,
        success: "",
        error: error.message || "We couldn't send another code.",
      });
    }
  };

  return (
    <PasswordRecoveryShell title="Enter the code">
      {({ inView }) => (
        <motion.form
          className="passwordRecoveryForm"
          onSubmit={handleVerify}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.18 }}
        >
          <div className="passwordRecoveryField">
            <span className="passwordRecoveryField__label">Code</span>
            <OTPInputGroup
              value={otp}
              onChange={(nextValue) => {
                setOtp(nextValue);
                if (otpError) {
                  setOtpError(validateOtp(nextValue));
                }
                if (status.error || status.success) {
                  setStatus((prev) => ({
                    ...prev,
                    error: "",
                    success: "",
                  }));
                }
              }}
              onComplete={(completeValue) => {
                if (!validateOtp(completeValue)) {
                  setOtpError("");
                }
              }}
              error={otpError}
              disabled={status.pending || status.resendPending || bridge.pending}
            />
            <p className="passwordRecoveryField__meta">
              {email || "Check your email for the code."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {status.success ? (
              <InlineStatus key="verify-success" tone="success" message={status.success} />
            ) : status.error ? (
              <InlineStatus key="verify-error" tone="danger" message={status.error} />
            ) : bridge.pending ? (
              <InlineStatus key="verify-link" message="Checking your recovery link..." />
            ) : bridge.error ? (
              <InlineStatus key="verify-link-error" tone="danger" message={bridge.error} />
            ) : null}
          </AnimatePresence>

          <div className="passwordRecoveryActions passwordRecoveryActions--spread">
            <div className="passwordRecoveryActions__left">
              <RecoveryButton
                type="button"
                variant="ghost"
                onClick={() => navigate(buildRecoveryPath("/recover-password", email))}
                disabled={status.pending || status.resendPending || bridge.pending}
              >
                Back
              </RecoveryButton>
            </div>

            <div className="passwordRecoveryActions__right">
              <RecoveryButton
                type="button"
                variant="ghost"
                onClick={handleResend}
                loading={status.resendPending}
                disabled={status.pending || bridge.pending}
              >
                Resend code
              </RecoveryButton>
              <RecoveryButton
                type="submit"
                loading={status.pending}
                disabled={status.resendPending || bridge.pending}
              >
                Verify code
              </RecoveryButton>
            </div>
          </div>
        </motion.form>
      )}
    </PasswordRecoveryShell>
  );
}
