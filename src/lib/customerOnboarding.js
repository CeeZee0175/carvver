const CUSTOMER_WELCOME_DESTINATION_KEY = "carvver-customer-welcome-destination";
const FREELANCER_WELCOME_DESTINATION_KEY =
  "carvver-freelancer-welcome-destination";

export const CUSTOMER_WELCOME_PATH = "/welcome/customer";
export const FREELANCER_WELCOME_PATH = "/welcome/freelancer";
export const DEFAULT_CUSTOMER_DESTINATION = "/dashboard/customer";
export const DEFAULT_FREELANCER_DESTINATION = "/dashboard/freelancer";

function isBrowser() {
  return typeof window !== "undefined";
}

function hasOwn(profile, fieldName) {
  return Boolean(profile && Object.prototype.hasOwnProperty.call(profile, fieldName));
}

function normalizePath(path, blockedPath, fallbackPath) {
  const normalizedPath = String(path || fallbackPath).trim();

  if (!normalizedPath || normalizedPath.startsWith(blockedPath)) {
    return fallbackPath;
  }

  return normalizedPath;
}

function setDestination(storageKey, path, blockedPath, fallbackPath) {
  if (!isBrowser()) return;

  window.sessionStorage.setItem(
    storageKey,
    normalizePath(path, blockedPath, fallbackPath)
  );
}

function getDestination(storageKey, blockedPath, fallbackPath) {
  if (!isBrowser()) return fallbackPath;

  return normalizePath(
    window.sessionStorage.getItem(storageKey) || fallbackPath,
    blockedPath,
    fallbackPath
  );
}

function clearDestination(storageKey) {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(storageKey);
}

export function resolveProfileRole(profile, session) {
  return String(
    profile?.role || session?.user?.user_metadata?.role || "customer"
  ).toLowerCase();
}

export function isCustomerOnboardingComplete(profile) {
  if (!profile) return false;
  if (!hasOwn(profile, "customer_onboarding_completed_at")) return true;
  return Boolean(profile.customer_onboarding_completed_at);
}

export function isFreelancerOnboardingComplete(profile) {
  if (!profile) return false;
  if (!hasOwn(profile, "freelancer_onboarding_completed_at")) return true;
  return Boolean(profile.freelancer_onboarding_completed_at);
}

export function setCustomerWelcomeDestination(path) {
  setDestination(
    CUSTOMER_WELCOME_DESTINATION_KEY,
    path,
    CUSTOMER_WELCOME_PATH,
    DEFAULT_CUSTOMER_DESTINATION
  );
}

export function getCustomerWelcomeDestination() {
  return getDestination(
    CUSTOMER_WELCOME_DESTINATION_KEY,
    CUSTOMER_WELCOME_PATH,
    DEFAULT_CUSTOMER_DESTINATION
  );
}

export function clearCustomerWelcomeDestination() {
  clearDestination(CUSTOMER_WELCOME_DESTINATION_KEY);
}

export function setFreelancerWelcomeDestination(path) {
  setDestination(
    FREELANCER_WELCOME_DESTINATION_KEY,
    path,
    FREELANCER_WELCOME_PATH,
    DEFAULT_FREELANCER_DESTINATION
  );
}

export function getFreelancerWelcomeDestination() {
  return getDestination(
    FREELANCER_WELCOME_DESTINATION_KEY,
    FREELANCER_WELCOME_PATH,
    DEFAULT_FREELANCER_DESTINATION
  );
}

export function clearFreelancerWelcomeDestination() {
  clearDestination(FREELANCER_WELCOME_DESTINATION_KEY);
}
