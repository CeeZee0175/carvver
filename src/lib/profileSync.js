export const PROFILE_UPDATED_EVENT = "carvver:profile-updated";

export function emitProfileUpdated(profile) {
  if (typeof window === "undefined" || !profile) return;

  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED_EVENT, {
      detail: { profile },
    })
  );
}

