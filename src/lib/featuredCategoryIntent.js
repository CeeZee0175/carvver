const FEATURED_CATEGORY_INTENT_KEY = "carvver:featured-category-intent";

export function normalizeFeaturedCategory(category) {
  return typeof category === "string" ? category.trim() : "";
}

function getIntentStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function setFeaturedCategoryIntent(category) {
  const normalized = normalizeFeaturedCategory(category);
  if (!normalized) return;

  try {
    getIntentStorage()?.setItem(FEATURED_CATEGORY_INTENT_KEY, normalized);
  } catch {
    // Ignore storage failures and fall back to query params.
  }
}

export function getFeaturedCategoryIntent() {
  try {
    return normalizeFeaturedCategory(
      getIntentStorage()?.getItem(FEATURED_CATEGORY_INTENT_KEY)
    );
  } catch {
    return "";
  }
}

export function clearFeaturedCategoryIntent() {
  try {
    getIntentStorage()?.removeItem(FEATURED_CATEGORY_INTENT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getFeaturedCategoryFromSearch(search = "") {
  const params = new URLSearchParams(search);
  return normalizeFeaturedCategory(params.get("category"));
}

export function persistFeaturedCategoryFromSearch(search = "") {
  const category = getFeaturedCategoryFromSearch(search);
  if (category) setFeaturedCategoryIntent(category);
  return category;
}

export function resolveFeaturedCategoryIntent(search = "") {
  return getFeaturedCategoryFromSearch(search) || getFeaturedCategoryIntent();
}

export function buildCategoryPath(path, category) {
  const normalized = normalizeFeaturedCategory(category);
  if (!normalized) return path;

  const params = new URLSearchParams({ category: normalized });
  return `${path}?${params.toString()}`;
}
