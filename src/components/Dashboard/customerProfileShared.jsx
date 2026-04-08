import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import DashBar from "./dashbar";
import HomeFooter from "../Homepage/home_footer";
import { PROFILE_SPRING } from "./customerProfileConfig";

export function CustomerDashboardFrame({ children, mainClassName = "" }) {
  return (
    <div className="profileHubShell">
      <div className="profileHubShell__base" />
      <div className="profileHubShell__bg" aria-hidden="true" />

      <DashBar />

      <main className={cn("profileHubMain", mainClassName)}>{children}</main>

      <section className="profileHubFooter">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  amount = 0.16,
  y = 20,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={
        reduceMotion ? { opacity: 1 } : { opacity: 0, y, filter: "blur(10px)" }
      }
      animate={
        inView || reduceMotion
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(10px)" }
      }
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function TypewriterHeading({
  text,
  className = "",
  speed = 72,
  initialDelay = 120,
}) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    let timeoutId = null;
    let cancelled = false;
    let index = 0;

    setDisplayText("");

    const tick = () => {
      if (cancelled) return;

      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialDelay, reduceMotion, speed, text]);

  const resolvedText = reduceMotion ? text : displayText;

  return (
    <span className={className}>
      {resolvedText}
      {!reduceMotion && resolvedText.length < text.length && (
        <motion.span
          className="profileHero__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.88, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

export function DashboardBreadcrumbs({ items }) {
  const navigate = useNavigate();

  return (
    <nav className="profileCrumbs" aria-label="Breadcrumb">
      <button
        type="button"
        className="profileCrumbs__home"
        onClick={() => navigate("/dashboard/customer")}
      >
        <Home className="profileCrumbs__icon" />
        <span>Home</span>
      </button>

      {(items || []).map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight className="profileCrumbs__sep" />
            {item.to && !isLast ? (
              <button
                type="button"
                className="profileCrumbs__link"
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </button>
            ) : (
              <span className="profileCrumbs__current">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function EmptySurface({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  actionButtonClassName = "",
  actionMotion = null,
}) {
  return (
    <div className={cn("profileEmpty", className)}>
      <div className="profileEmpty__iconWrap" aria-hidden="true">
        <Icon className="profileEmpty__icon" />
      </div>
      <h3 className="profileEmpty__title">{title}</h3>
      <p className="profileEmpty__desc">{description}</p>
      {actionLabel && onAction && (
        <motion.button
          type="button"
          className={cn("profileEmpty__btn", actionButtonClassName)}
          whileHover={actionMotion?.whileHover || { y: -1 }}
          whileTap={actionMotion?.whileTap || { scale: 0.98 }}
          transition={actionMotion?.transition || PROFILE_SPRING}
          onClick={onAction}
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}
