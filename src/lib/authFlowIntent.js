const AUTH_FLOW_INTENT_KEY = "carvver-auth-flow-intent";

function isBrowser() {
  return typeof window !== "undefined";
}

export function setAuthFlowIntent(intent) {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(AUTH_FLOW_INTENT_KEY, JSON.stringify(intent));
}

export function getAuthFlowIntent() {
  if (!isBrowser()) return null;

  const raw = window.sessionStorage.getItem(AUTH_FLOW_INTENT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.sessionStorage.removeItem(AUTH_FLOW_INTENT_KEY);
    return null;
  }
}

export function clearAuthFlowIntent() {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(AUTH_FLOW_INTENT_KEY);
}

export function buildOAuthCallbackUrl(mode) {
  if (!isBrowser()) return "/auth/callback";

  const url = new URL("/auth/callback", window.location.origin);
  if (mode) {
    url.searchParams.set("mode", mode);
  }

  return url.toString();
}
