export const CART_UPDATED_EVENT = "carvver:cart-updated";

export function emitCartUpdated(detail = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail,
    })
  );
}
