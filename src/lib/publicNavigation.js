function resolveBehavior(reduceMotion, behavior) {
  if (behavior) return behavior;
  return reduceMotion ? "auto" : "smooth";
}

export function scrollWindowToTop(options = {}) {
  if (typeof window === "undefined") {
    return false;
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: options.behavior || "auto",
  });

  return true;
}

export function scrollToSectionId(targetId, options = {}) {
  const normalizedTarget = String(targetId || "").trim();

  if (!normalizedTarget || typeof document === "undefined") {
    return false;
  }

  const element = document.getElementById(normalizedTarget);
  if (!element) {
    return false;
  }

  element.scrollIntoView({
    behavior: options.behavior || "smooth",
    block: "start",
  });

  return true;
}

export function navigateToPublicRoute({
  navigate,
  location,
  pathname,
  reduceMotion = false,
}) {
  const normalizedPathname = String(pathname || "").trim();
  if (!normalizedPathname || typeof navigate !== "function") {
    return;
  }

  if (location?.pathname === normalizedPathname && !location?.hash) {
    scrollWindowToTop({
      behavior: resolveBehavior(reduceMotion, "auto"),
    });
    return;
  }

  navigate(normalizedPathname);
}

export function navigateToHomeSection({
  navigate,
  location,
  targetId,
  reduceMotion = false,
}) {
  const normalizedTarget = String(targetId || "").trim();
  if (!normalizedTarget || typeof navigate !== "function") {
    return;
  }

  if (location?.pathname === "/") {
    const didScroll = scrollToSectionId(normalizedTarget, {
      behavior: resolveBehavior(reduceMotion),
    });

    if (didScroll) {
      return;
    }
  }

  navigate(`/#${normalizedTarget}`);
}
