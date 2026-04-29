import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import "./home_four.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";
const WHEEL_SENSITIVITY = 0.00115;
const TOUCH_SENSITIVITY = 0.006;

const STORY_STEPS = [
  {
    id: "find",
    number: "01",
    title: "Find real services",
    text: "Open the marketplace and get straight to work you can inspect: categories, profiles, media, and clear listing details.",
  },
  {
    id: "book",
    number: "02",
    title: "Book with trust",
    text: "Reviews, badges, order details, and payment status stay close to the decision, so both sides know what is happening.",
  },
  {
    id: "next",
    number: "03",
    title: "See what comes next",
    text: "We are shaping Carvver around practical marketplace updates, cleaner trust tools, and smoother service flows.",
  },
];

const ROTATING_PHRASES = [
  "cleaner discovery",
  "trusted bookings",
  "sharper listings",
  "better service flow",
];

function clampProgress(value) {
  return Math.min(Math.max(value, 0), 1);
}

function resolveChapterIndex(progress) {
  if (progress >= 0.72) return 2;
  if (progress >= 0.38) return 1;
  return 0;
}

function isSectionActive(element) {
  if (!element || typeof window === "undefined") return false;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const rootStyles = window.getComputedStyle(document.documentElement);
  const navHeight = Number.parseFloat(rootStyles.getPropertyValue("--nav-h")) || 66;

  return rect.top <= navHeight + 32 && rect.bottom >= viewportHeight * 0.72;
}

function getNavHeight() {
  if (typeof window === "undefined") return 66;

  const rootStyles = window.getComputedStyle(document.documentElement);
  return Number.parseFloat(rootStyles.getPropertyValue("--nav-h")) || 66;
}

function getSectionLockTop(element) {
  if (!element || typeof window === "undefined") return 0;

  const rect = element.getBoundingClientRect();
  return Math.max(0, Math.round(window.scrollY + rect.top - getNavHeight()));
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("input, textarea, select, button, a, [contenteditable='true']")
  );
}

function EmailInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  status,
  message,
}) {
  return (
    <form
      className="homeFourForm"
      onSubmit={onSubmit}
      aria-label="Subscribe for updates"
      aria-busy={isSubmitting}
      noValidate
    >
      <div
        className={`homeFourInput ${
          status === "error"
            ? "homeFourInput--error"
            : status === "success"
            ? "homeFourInput--success"
            : ""
        }`}
      >
        <label className="homeFourInput__label" htmlFor="home-four-email">
          Email address
        </label>

        <input
          id="home-four-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="homeFourInput__control"
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          disabled={isSubmitting}
        />

        <Motion.button
          type="submit"
          className={`homeFourInput__submit ${
            status === "success" ? "homeFourInput__submit--success" : ""
          } ${isSubmitting ? "homeFourInput__submit--loading" : ""}`}
          aria-label={
            isSubmitting
              ? "Submitting email"
              : status === "success"
              ? "Subscribed"
              : "Submit email"
          }
          disabled={isSubmitting}
          whileHover={isSubmitting ? undefined : { y: -1 }}
          whileTap={isSubmitting ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSubmitting ? (
              <Motion.span
                key="loader"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.72 }}
                transition={{ duration: 0.18 }}
                className="homeFourInput__iconWrap"
              >
                <LoaderCircle className="homeFourInput__submitIcon homeFourInput__submitIcon--loading" />
              </Motion.span>
            ) : status === "success" ? (
              <Motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.72 }}
                transition={{ duration: 0.18 }}
                className="homeFourInput__iconWrap"
              >
                <Check className="homeFourInput__submitIcon" />
              </Motion.span>
            ) : (
              <Motion.span
                key="arrow"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.72 }}
                transition={{ duration: 0.18 }}
                className="homeFourInput__iconWrap"
              >
                <ArrowRight className="homeFourInput__submitIcon" />
              </Motion.span>
            )}
          </AnimatePresence>
        </Motion.button>
      </div>

      <div className="homeFourFeedback" aria-live="polite">
        <AnimatePresence mode="wait">
          {message ? (
            <Motion.p
              key={`${status}-${message}`}
              className={`homeFourFeedback__text ${
                status === "error"
                  ? "homeFourFeedback__text--error"
                  : status === "success"
                  ? "homeFourFeedback__text--success"
                  : ""
              }`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {message}
            </Motion.p>
          ) : (
            <p className="homeFourFeedback__spacer">&nbsp;</p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

function MarketplacePanel() {
  return (
    <div className="homeFourBrowser">
      <div className="homeFourBrowser__top">
        <span />
        <span />
        <span />
      </div>
      <div className="homeFourSearch">
        <span>Search handmade cakes</span>
        <strong>24 nearby services</strong>
      </div>
      <div className="homeFourServiceList">
        <article>
          <div />
          <span>
            <strong>Custom celebration cake</strong>
            <small>Makati, NCR</small>
          </span>
          <b>PHP 1,800</b>
        </article>
        <article>
          <div />
          <span>
            <strong>Gift-ready crochet bouquet</strong>
            <small>Quezon City, NCR</small>
          </span>
          <b>PHP 950</b>
        </article>
      </div>
    </div>
  );
}

function TrustPanel() {
  return (
    <div className="homeFourTrust">
      <div className="homeFourTrustCard homeFourTrustCard--payment">
        <span>Payment held</span>
        <strong>Order #2048</strong>
        <div className="homeFourTrustCard__meter">
          <i />
        </div>
      </div>
      <div className="homeFourTrustCard homeFourTrustCard--review">
        <span>Provider rating</span>
        <strong>4.9 from completed orders</strong>
      </div>
      <div className="homeFourTrustCard homeFourTrustCard--badge">
        <span>Profile signals</span>
        <strong>Verified, reviewed, badge earned</strong>
      </div>
    </div>
  );
}

function UpdatePanel() {
  return (
    <div className="homeFourUpdatePanel">
      <span>Next on Carvver</span>
      <strong>Cleaner sharing, better listings, stronger trust flows.</strong>
    </div>
  );
}

function RotatingPhrase({ visible, reduceMotion }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible || reduceMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_PHRASES.length);
    }, 1900);

    return () => window.clearInterval(intervalId);
  }, [visible, reduceMotion]);

  if (!visible) return null;

  return (
    <div className="homeFourRotate" aria-live="polite">
      <span>Building toward</span>
      <AnimatePresence mode="wait" initial={false}>
        <Motion.strong
          key={reduceMotion ? ROTATING_PHRASES[0] : ROTATING_PHRASES[index]}
          initial={reduceMotion ? false : { y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "-110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {reduceMotion ? ROTATING_PHRASES[0] : ROTATING_PHRASES[index]}
        </Motion.strong>
      </AnimatePresence>
    </div>
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getSubscribeErrorMessage(error) {
  if (!error) return "We couldn't save your email. Please try again.";

  if (error.code === "42P01" || error.code === "42501") {
    return "We couldn't save your email. Please try again in a moment.";
  }

  return "We couldn't save your email. Please try again.";
}

export default function HomeFour() {
  const ref = useRef(null);
  const touchStartYRef = useRef(null);
  const progressRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const isCompactRef = useRef(false);
  const isLockedRef = useRef(false);
  const lockedTopRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const [isCompact, setIsCompact] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const progress = reduceMotion || isCompact ? 1 : scrollProgress;
  const activeChapter = resolveChapterIndex(progress);
  const activeStep = STORY_STEPS[activeChapter] || STORY_STEPS[0];
  const isExpanded = progress >= 0.78;
  const titleShift = Math.round(progress * 38);
  const visualStyle = {
    "--home-four-progress": progress,
    "--home-four-visual-width": `${58 + progress * 42}%`,
    "--home-four-visual-height": `${360 + progress * 230}px`,
    "--home-four-visual-radius": `${18 + progress * 10}px`,
    "--home-four-visual-y": `${(1 - progress) * 18}px`,
    "--home-four-shadow-alpha": 0.07 + progress * 0.06,
    "--home-four-grid-opacity": 0.32 + progress * 0.3,
    "--home-four-market-opacity": 1 - progress * 0.34,
    "--home-four-market-x": `${progress * -8}%`,
    "--home-four-market-y": `${progress * -7}%`,
    "--home-four-market-scale": 0.94 + progress * 0.06,
    "--home-four-trust-opacity": clampProgress((progress - 0.2) * 2.6),
    "--home-four-trust-x": `${(1 - progress) * 12}%`,
    "--home-four-trust-y": `${(1 - progress) * 14}%`,
    "--home-four-updates-opacity": clampProgress((progress - 0.64) * 3.2),
    "--home-four-updates-y": `${(1 - progress) * 18}%`,
    "--home-four-updates-scale": 0.92 + progress * 0.08,
  };

  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    reduceMotionRef.current = Boolean(reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    isCompactRef.current = isCompact;

    if (isCompact) {
      isLockedRef.current = false;
      touchStartYRef.current = null;
    }
  }, [isCompact]);

  useEffect(() => {
    if (reduceMotion) {
      isLockedRef.current = false;
      touchStartYRef.current = null;
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const syncCompactState = () => {
      setIsCompact(mediaQuery.matches);
    };

    syncCompactState();
    mediaQuery.addEventListener("change", syncCompactState);

    return () => {
      mediaQuery.removeEventListener("change", syncCompactState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const canControlScroll = () =>
      !reduceMotionRef.current &&
      !isCompactRef.current &&
      ref.current &&
      (isLockedRef.current || isSectionActive(ref.current));

    const lockToSection = () => {
      if (!ref.current) return;

      const nextTop = getSectionLockTop(ref.current);
      lockedTopRef.current = nextTop;
      isLockedRef.current = true;

      if (Math.abs(window.scrollY - nextTop) > 1) {
        window.scrollTo({ top: nextTop, behavior: "auto" });
      }
    };

    const holdLockedPosition = () => {
      if (!isLockedRef.current) return;

      const lockedTop = lockedTopRef.current;

      if (Math.abs(window.scrollY - lockedTop) > 1) {
        window.scrollTo({ top: lockedTop, behavior: "auto" });
      }
    };

    const releaseLock = () => {
      isLockedRef.current = false;
    };

    const preventNativeScroll = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }

      event.stopPropagation();
    };

    const applyControlledDelta = (event, deltaY, sensitivity) => {
      if (!deltaY || !canControlScroll() || isEditableTarget(event.target)) return false;

      const currentProgress = progressRef.current;
      const atStart = currentProgress <= 0.002;
      const atEnd = currentProgress >= 0.998;

      if ((deltaY > 0 && atEnd) || (deltaY < 0 && atStart)) {
        releaseLock();
        return false;
      }

      preventNativeScroll(event);
      lockToSection();

      const nextProgress = clampProgress(currentProgress + deltaY * sensitivity);
      progressRef.current = nextProgress;
      setScrollProgress(nextProgress);
      holdLockedPosition();

      return true;
    };

    const handleWheel = (event) => {
      applyControlledDelta(event, event.deltaY, WHEEL_SENSITIVITY);
    };

    const handleTouchStart = (event) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      const previousY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;

      if (previousY == null || currentY == null) return;

      const deltaY = previousY - currentY;
      const wasControlled = applyControlledDelta(event, deltaY, TOUCH_SENSITIVITY);
      touchStartYRef.current = currentY;

      if (!wasControlled && !isLockedRef.current) {
        releaseLock();
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    const handleKeyDown = (event) => {
      const keyDeltas = {
        ArrowDown: 90,
        PageDown: 260,
        " ": 260,
        ArrowUp: -90,
        PageUp: -260,
      };
      const deltaY = keyDeltas[event.key];

      if (!deltaY) return;

      applyControlledDelta(event, deltaY, WHEEL_SENSITIVITY);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      isLockedRef.current = false;
      touchStartYRef.current = null;
    };
  }, []);

  const handleChange = (nextValue) => {
    setEmail(nextValue);

    if (status !== "idle" || message) {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmed = email.trim();

    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    const normalizedEmail = trimmed.toLowerCase();

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const { error } = await supabase.from(NEWSLETTER_TABLE).insert({
        email: normalizedEmail,
        source: "home_four",
      });

      if (error?.code === "23505") {
        setEmail("");
        setStatus("success");
        setMessage("You're already on the list. We'll keep you posted.");
        return;
      }

      if (error) throw error;

      setEmail("");
      setStatus("success");
      setMessage("Thanks! You're on the list.");
    } catch (error) {
      setStatus("error");
      setMessage(getSubscribeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={`homeFour ${isExpanded ? "homeFour--expanded" : ""}`}
      ref={ref}
      aria-labelledby="homeFour-title"
      style={visualStyle}
    >
      <div className="homeFour__stage">
        <Motion.div
          className="homeFour__background"
          aria-hidden="true"
          animate={{ opacity: 1 - progress * 0.52 }}
          transition={{ duration: 0.18 }}
        />

        <div className="homeFour__inner">
          <div className="homeFour__copy">
            <h2 id="homeFour-title" className="homeFour__title">
              <span style={{ transform: `translateX(-${titleShift}px)` }}>
                The marketplace
              </span>
              <span style={{ transform: `translateX(${titleShift}px)` }}>
                keeps moving.
              </span>
            </h2>

            <div className="homeFourStory" aria-label="Carvver marketplace story">
              <AnimatePresence mode="wait" initial={false}>
                <Motion.article
                  key={activeStep.id}
                  className="homeFourStory__item"
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.95, 0.2, 1] }}
                >
                  <span className="homeFourStory__number">{activeStep.number}</span>
                  <h3>{activeStep.title}</h3>
                  <p>{activeStep.text}</p>
                </Motion.article>
              </AnimatePresence>
            </div>

            <div className="homeFourStoryList" aria-label="Carvver marketplace story">
              {STORY_STEPS.map((step) => (
                <article key={step.id} className="homeFourStoryList__item">
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>

            <div className="homeFourProgress" aria-hidden="true">
              <span />
            </div>

            <div className="homeFourChapterRail" aria-label="Scroll chapters">
              {STORY_STEPS.map((step, index) => (
                <span
                  key={step.id}
                  className={`homeFourChapterRail__item ${
                    index === activeChapter ? "homeFourChapterRail__item--active" : ""
                  }`}
                >
                  <b>{step.number}</b>
                  <span>{step.title}</span>
                </span>
              ))}
            </div>

            <RotatingPhrase visible={isExpanded} reduceMotion={reduceMotion} />

            <Motion.div
              className="homeFour__inputWrap"
              animate={{
                opacity: isExpanded || reduceMotion ? 1 : 0,
                y: isExpanded || reduceMotion ? 0 : 14,
              }}
              transition={{ duration: 0.28, ease: [0.2, 0.95, 0.2, 1] }}
            >
              <EmailInput
                value={email}
                onChange={handleChange}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                status={status}
                message={message}
              />
            </Motion.div>
          </div>

          <div className="homeFourVisual" aria-hidden="true">
            <div className="homeFourVisual__grid" />
            <div className="homeFourVisual__layer homeFourVisual__layer--market">
              <MarketplacePanel />
            </div>
            <div className="homeFourVisual__layer homeFourVisual__layer--trust">
              <TrustPanel />
            </div>
            <div className="homeFourVisual__layer homeFourVisual__layer--updates">
              <UpdatePanel />
            </div>
          </div>
        </div>

        <p className="homeFourScrollHint">
          {isExpanded ? "Scroll again to continue" : "Scroll to expand the marketplace"}
        </p>
      </div>
    </section>
  );
}
