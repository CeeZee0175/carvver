import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getSession,
  verifyPasswordRecoveryTokenHash,
} from "../../../lib/supabase/auth";

const RECOVERY_STATE_KEY = "carvver-password-recovery";
export const RECOVERY_OTP_LENGTH = 8;

function isBrowser() {
  return typeof window !== "undefined";
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getStoredRecoveryState() {
  if (!isBrowser()) return null;

  const raw = window.sessionStorage.getItem(RECOVERY_STATE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.sessionStorage.removeItem(RECOVERY_STATE_KEY);
    return null;
  }
}

export function setStoredRecoveryState(nextState) {
  if (!isBrowser()) return;

  const current = getStoredRecoveryState() || {};
  window.sessionStorage.setItem(
    RECOVERY_STATE_KEY,
    JSON.stringify({
      ...current,
      ...nextState,
    })
  );
}

export function clearStoredRecoveryState() {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(RECOVERY_STATE_KEY);
}

export function getRecoveryEmail(search = "") {
  const params = new URLSearchParams(search);
  const queryEmail = String(params.get("email") || "").trim();
  if (queryEmail) return queryEmail;
  return String(getStoredRecoveryState()?.email || "").trim();
}

export function isRecoveryVerified() {
  return Boolean(getStoredRecoveryState()?.verified);
}

export function buildRecoveryPath(pathname, email = "") {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) return pathname;
  return `${pathname}?email=${encodeURIComponent(normalizedEmail)}`;
}

function TypewriterText({
  text,
  active,
  speed = 72,
  initialDelay = 100,
  className = "",
}) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;

    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    setDisplayText("");
    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);
    return () => clearTimeout(timeoutId);
  }, [active, initialDelay, reduceMotion, speed, text]);

  return (
    <span className={className}>
      {displayText}
      {!reduceMotion && displayText.length < text.length ? (
        <motion.span
          className="passwordRecoveryCard__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      ) : null}
    </span>
  );
}

export function InlineStatus({ tone = "neutral", message, className = "" }) {
  if (!message) return null;

  return (
    <motion.div
      className={`passwordRecoveryStatus passwordRecoveryStatus--${tone} ${className}`.trim()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </motion.div>
  );
}

export function PasswordRecoveryShell({ title, children, className = "" }) {
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });

  return (
    <div className="passwordRecoveryPage">
      <div className="passwordRecoveryPage__base" />
      <div className="passwordRecoveryPage__bg" aria-hidden="true" />

      <main className="passwordRecoveryPage__center" ref={rootRef}>
        <motion.section
          className={`passwordRecoveryCard ${className}`.trim()}
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.65, ease: [0.2, 0.95, 0.2, 1] }}
        >
          <header className="passwordRecoveryCard__header">
            <div className="passwordRecoveryCard__titleWrap passwordRecoveryCard__titleWrap--tight">
              <h1 className="passwordRecoveryCard__title">
                <TypewriterText
                  text={title}
                  active={inView}
                  speed={60}
                  initialDelay={100}
                />
              </h1>
              <motion.svg
                className="passwordRecoveryCard__line passwordRecoveryCard__line--tight"
                viewBox="0 0 250 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 62,0 125,10 Q 188,20 250,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                />
              </motion.svg>
            </div>
          </header>

          {typeof children === "function" ? children({ inView }) : children}
        </motion.section>
      </main>
    </div>
  );
}

export function RecoveryButton({
  type = "button",
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  onClick,
  className = "",
}) {
  return (
    <motion.button
      type={type}
      className={`passwordRecoveryBtn passwordRecoveryBtn--${variant} ${className}`.trim()}
      whileHover={loading ? {} : { y: -1.5 }}
      whileTap={loading ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <LoaderCircle className="passwordRecoveryBtn__spinner" /> : children}
    </motion.button>
  );
}

export function OTPInputGroup({
  value,
  onChange,
  onComplete,
  error = "",
  disabled = false,
}) {
  const refs = useRef([]);
  const digits = useMemo(() => {
    const chars = String(value || "").slice(0, RECOVERY_OTP_LENGTH).split("");
    return Array.from({ length: RECOVERY_OTP_LENGTH }, (_, index) => chars[index] || "");
  }, [value]);

  useEffect(() => {
    refs.current = refs.current.slice(0, RECOVERY_OTP_LENGTH);
  }, []);

  const updateValue = (nextDigits) => {
    const nextValue = nextDigits.join("").slice(0, RECOVERY_OTP_LENGTH);
    onChange(nextValue);
    if (nextValue.length === RECOVERY_OTP_LENGTH && !nextDigits.includes("")) {
      onComplete?.(nextValue);
    }
  };

  const handleDigitChange = (index, rawValue) => {
    const sanitized = String(rawValue || "").replace(/\D/g, "");
    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateValue(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    const incoming = sanitized.slice(0, RECOVERY_OTP_LENGTH);

    if (incoming.length > 1) {
      incoming.split("").forEach((digit, offset) => {
        if (index + offset < RECOVERY_OTP_LENGTH) {
          nextDigits[index + offset] = digit;
        }
      });

      updateValue(nextDigits);

      const focusIndex = Math.min(index + incoming.length, RECOVERY_OTP_LENGTH - 1);
      refs.current[focusIndex]?.focus();
      refs.current[focusIndex]?.select();
      return;
    }

    nextDigits[index] = incoming;
    updateValue(nextDigits);

    if (index < RECOVERY_OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
      refs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      refs.current[index - 1]?.select();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      refs.current[index - 1]?.select();
      return;
    }

    if (event.key === "ArrowRight" && index < RECOVERY_OTP_LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
      refs.current[index + 1]?.select();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    updateValue(pasted.slice(0, RECOVERY_OTP_LENGTH).split(""));
    const focusIndex = Math.min(pasted.length, RECOVERY_OTP_LENGTH) - 1;
    if (focusIndex >= 0) {
      refs.current[focusIndex]?.focus();
      refs.current[focusIndex]?.select();
    }
  };

  return (
    <div className="passwordRecoveryOtp">
      <div
        className={`passwordRecoveryOtp__grid ${
          error ? "passwordRecoveryOtp__grid--error" : ""
        }`.trim()}
        onPaste={handlePaste}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className="passwordRecoveryOtp__digit"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={RECOVERY_OTP_LENGTH}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error ? <span className="passwordRecoveryField__error">{error}</span> : null}
    </div>
  );
}

export function useRecoveryLinkBridge(targetPath = "/recover-password/reset") {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({
    pending: false,
    error: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenHash = String(params.get("token_hash") || "").trim();
    const type = String(params.get("type") || "").trim();
    const hash = isBrowser() ? window.location.hash || "" : "";
    const hasRecoveryHash =
      hash.includes("type=recovery") || hash.includes("access_token=");

    if (!tokenHash && !hasRecoveryHash) {
      return;
    }

    let active = true;

    async function resolveRecoverySession() {
      setState({
        pending: true,
        error: "",
      });

      try {
        let nextEmail = getRecoveryEmail(location.search);

        if (tokenHash && type === "recovery") {
          const { data } = await verifyPasswordRecoveryTokenHash(tokenHash);
          nextEmail = data?.user?.email || nextEmail;
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 180));
          const session = await getSession();
          nextEmail = session?.user?.email || nextEmail;

          if (!nextEmail) {
            throw new Error("That recovery link is no longer valid.");
          }
        }

        if (!active) return;

        setStoredRecoveryState({
          email: nextEmail,
          verified: true,
        });

        navigate(buildRecoveryPath(targetPath, nextEmail), {
          replace: true,
        });
      } catch (error) {
        if (!active) return;
        setState({
          pending: false,
          error: error.message || "That recovery link is no longer valid.",
        });
      }
    }

    resolveRecoverySession();

    return () => {
      active = false;
    };
  }, [location.search, navigate, targetPath]);

  return state;
}
