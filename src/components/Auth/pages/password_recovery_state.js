import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getSession,
  verifyPasswordRecoveryTokenHash,
} from "../../../lib/supabase/auth";

const RECOVERY_STATE_KEY = "carvver-password-recovery";

export const RECOVERY_OTP_LENGTH = 8;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBrowser() {
  return typeof window !== "undefined";
}

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
      return undefined;
    }

    let active = true;

    async function resolveRecoverySession() {
      queueMicrotask(() => {
        if (!active) return;
        setState({
          pending: true,
          error: "",
        });
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
