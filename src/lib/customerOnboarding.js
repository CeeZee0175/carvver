const CUSTOMER_WELCOME_DESTINATION_KEY = "carvver-customer-welcome-destination";

export const CUSTOMER_WELCOME_PATH = "/welcome/customer";
export const DEFAULT_CUSTOMER_DESTINATION = "/dashboard/customer";

function isBrowser() {
  return typeof window !== "undefined";
}

function hasOnboardingField(profile) {
  return Boolean(
    profile &&
      Object.prototype.hasOwnProperty.call(
        profile,
        "customer_onboarding_completed_at"
      )
  );
}

export function resolveProfileRole(profile, session) {
  return String(
    profile?.role || session?.user?.user_metadata?.role || "customer"
  ).toLowerCase();
}

export function isCustomerOnboardingComplete(profile) {
  if (!profile) return false;
  if (!hasOnboardingField(profile)) return true;

  return Boolean(profile.customer_onboarding_completed_at);
}

export function setCustomerWelcomeDestination(path) {
  if (!isBrowser()) return;

  const normalizedPath = String(path || DEFAULT_CUSTOMER_DESTINATION).trim();
  if (!normalizedPath || normalizedPath.startsWith(CUSTOMER_WELCOME_PATH)) {
    window.sessionStorage.setItem(
      CUSTOMER_WELCOME_DESTINATION_KEY,
      DEFAULT_CUSTOMER_DESTINATION
    );
    return;
  }

  window.sessionStorage.setItem(
    CUSTOMER_WELCOME_DESTINATION_KEY,
    normalizedPath
  );
}

export function getCustomerWelcomeDestination() {
  if (!isBrowser()) return DEFAULT_CUSTOMER_DESTINATION;

  const raw = String(
    window.sessionStorage.getItem(CUSTOMER_WELCOME_DESTINATION_KEY) ||
      DEFAULT_CUSTOMER_DESTINATION
  ).trim();

  if (!raw || raw.startsWith(CUSTOMER_WELCOME_PATH)) {
    return DEFAULT_CUSTOMER_DESTINATION;
  }

  return raw;
}

export function clearCustomerWelcomeDestination() {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(CUSTOMER_WELCOME_DESTINATION_KEY);
}
