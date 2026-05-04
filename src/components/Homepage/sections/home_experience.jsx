import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion as Motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import {
  buildCategoryPath,
  setFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";
import BeamsBackground from "./BeamsBackground";
import HomeFooter from "../layout/home_footer";
import "./home_experience.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";
const SECTION_IDS = ["home-hero", "home-categories", "home-how", "home-updates", "home-footer"];
const UPDATES_INDEX = 3;
const WHEEL_THRESHOLD = 34;
const SNAP_COOLDOWN = 760;
const FOUR_PROGRESS_SENSITIVITY = 0.00108;
const TOUCH_PROGRESS_SENSITIVITY = 0.006;

const FEATURED_CATEGORIES = [
  {
    id: 1,
    title: "Art & Illustration",
    description:
      "Commission portraits, posters, merch visuals, and stylized work from independent creators.",
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Photography",
    description:
      "Book portraits, product shoots, events, and polished edits that feel ready to publish.",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Video Editing",
    description:
      "Turn raw clips into reels, explainers, cinematic edits, and clean content packages.",
    imageUrl:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Voice Over",
    description:
      "Find voice talent for ads, narration, character reads, and studio-style audio.",
    imageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Social Media",
    description:
      "Get help with post concepts, calendars, short-form strategy, and visual assets.",
    imageUrl:
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Web Development",
    description:
      "Launch landing pages, portfolios, and lightweight web builds that look credible fast.",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Tutoring",
    description:
      "Connect with tutors for academic support, creative coaching, and one-on-one learning.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1400&auto=format&fit=crop",
  },
];

const CUSTOMER_STEPS = [
  {
    id: "customer-1",
    step: "01",
    title: "Discover services faster",
    description:
      "Browse categories, compare providers, and find work that fits without chasing scattered social posts.",
    detail: "Search, location, profiles, and service previews stay in one flow.",
  },
  {
    id: "customer-2",
    step: "02",
    title: "Choose with more confidence",
    description:
      "Read reviews, check badges, and understand the provider before starting the order.",
    detail: "Trust signals sit close to the listing, where decisions actually happen.",
  },
  {
    id: "customer-3",
    step: "03",
    title: "Pay securely and receive the work",
    description:
      "Carvver keeps the order structured from payment to delivery, so the handoff feels clearer for both sides.",
    detail: "Payment, messages, delivery notes, and completion stay connected.",
  },
];

const PROVIDER_STEPS = [
  {
    id: "provider-1",
    step: "01",
    title: "Create a listing people understand",
    description:
      "Set the category, service details, packages, and media so customers can judge your work quickly.",
    detail: "Your listing becomes the place people inspect, book, and share.",
  },
  {
    id: "provider-2",
    step: "02",
    title: "Build trust while you grow",
    description:
      "Profile progress, badges, reviews, and verification help your work look credible inside the marketplace.",
    detail: "The strongest trust signals show up where customers are deciding.",
  },
  {
    id: "provider-3",
    step: "03",
    title: "Share, talk, and manage orders",
    description:
      "Promote your listing, answer customers, and keep request or order details organized in one platform.",
    detail: "Discovery, messages, and order updates keep momentum in the same place.",
  },
];

const ROTATING_PHRASES = [
  "service pages that travel",
  "clearer booking decisions",
  "trust signals people can read",
  "a marketplace that keeps moving",
];

const STOCK_VIDEO =
  "https://videos.pexels.com/video-files/6773859/6773859-hd_1920_1080_25fps.mp4";
const STOCK_POSTER =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1800&auto=format&fit=crop";
const STOCK_BACKGROUND =
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1800&auto=format&fit=crop";

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function wrap(min, max, value) {
  const rangeSize = max - min;
  return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

function getNavHeight() {
  if (typeof window === "undefined") return 66;
  const rootStyles = window.getComputedStyle(document.documentElement);
  return Number.parseFloat(rootStyles.getPropertyValue("--nav-h")) || 66;
}

function isEditableTarget(target) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true']"))
    : false;
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

function MatrixTitle({ id, text = "Categories", active = true }) {
  const reduce = useReducedMotion();
  const startedRef = useRef(false);
  const [letters, setLetters] = useState(() =>
    text.split("").map((char) => ({ char, isMatrix: false, isSpace: char === " " }))
  );

  useEffect(() => {
    if (!active || startedRef.current) return undefined;
    startedRef.current = true;

    if (reduce) {
      return undefined;
    }

    const timers = [];
    text.split("").forEach((char, index) => {
      timers.push(
        window.setTimeout(() => {
          if (char === " ") return;
          setLetters((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], char: Math.random() > 0.5 ? "1" : "0", isMatrix: true };
            return next;
          });
        }, 180 + index * 70)
      );
      timers.push(
        window.setTimeout(() => {
          setLetters((prev) => {
            const next = [...prev];
            next[index] = { char, isMatrix: false, isSpace: char === " " };
            return next;
          });
        }, 500 + index * 70)
      );
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, reduce, text]);

  return (
    <h2 id={id} className="homeExperienceTitle homeExperienceTitle--script">
      <span className="homeExperienceMatrix" aria-label={text}>
        {letters.map((letter, index) => (
          <Motion.span
            key={`${index}-${letter.char}`}
            className="homeExperienceMatrix__letter"
            animate={{
              color: letter.isMatrix ? "rgba(242,193,78,0.98)" : "rgba(27,16,46,0.96)",
            }}
            transition={{ duration: 0.12 }}
            aria-hidden="true"
          >
            {letter.isSpace ? "\u00A0" : letter.char}
          </Motion.span>
        ))}
      </span>
    </h2>
  );
}

function HeroSection({ onBrowse, onStart }) {
  return (
    <section className="homeHero" aria-labelledby="homeHero-title">
      <BeamsBackground className="homeHero__beams" intensity="medium" />
      <div className="homeHero__wash" aria-hidden="true" />

      <div className="homeHero__inner">
        <div className="homeHero__copy">
          <Motion.h1
            id="homeHero-title"
            className="homeHero__title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            Book creative services without the guesswork.
          </Motion.h1>
          <Motion.p
            className="homeHero__text"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Browse local listings, compare packages, message providers, and check out in one place.
          </Motion.p>

          <Motion.div
            className="homeHero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <button type="button" className="homeHero__primary" onClick={onBrowse}>
              <Search className="homeHero__buttonIcon" />
              Browse services
            </button>
            <button type="button" className="homeHero__secondary" onClick={onStart}>
              Start selling
              <ArrowRight className="homeHero__buttonIcon" />
            </button>
          </Motion.div>
        </div>

        <Motion.div
          className="homeHeroPreview"
          aria-hidden="true"
          initial={{ opacity: 0, y: 26, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="homeHeroPreview__media">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1300&auto=format&fit=crop"
              alt=""
            />
          </div>
          <div className="homeHeroPreview__panel">
            <div>
              <span>Service listing</span>
              <strong>Brand content sprint</strong>
            </div>
            <p>Portfolio media, package choices, messages, and payment flow stay close to the booking.</p>
          </div>
          <div className="homeHeroPreview__flow">
            <span>Browse</span>
            <span>Message</span>
            <span>Book</span>
          </div>
        </Motion.div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [active, setActive] = useState(2);
  const count = FEATURED_CATEGORIES.length;
  const activeIndex = wrap(0, count, active);
  const activeItem = FEATURED_CATEGORIES[activeIndex];
  const visibleOffsets = [-2, -1, 0, 1, 2];

  const handleExplore = useCallback(async () => {
    const category = activeItem.title;
    setFeaturedCategoryIntent(category);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate(buildCategoryPath("/dashboard/customer/browse-services", category));
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate(buildCategoryPath("/sign-up", category));
  }, [activeItem.title, navigate]);

  return (
    <section className="homeCategories" ref={ref} aria-labelledby="homeCategories-title">
      <div className="homeExperienceSection__head">
        <MatrixTitle id="homeCategories-title" text="Categories" active={inView} />
        <p>Start with the kind of work you need, then inspect the person behind it.</p>
      </div>

      <div className="homeCategoryRail" aria-label="Featured categories" tabIndex={0}>
        <div className="homeCategoryRail__ambience" aria-hidden="true">
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeItem.id}
              className="homeCategoryRail__bgFrame"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={activeItem.imageUrl} alt="" />
            </Motion.div>
          </AnimatePresence>
        </div>

        <div className="homeCategoryRail__stageWrap">
          <Motion.div
            className="homeCategoryRail__stage"
            drag={reduceMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_event, info) => {
              const swipe = Math.abs(info.offset.x) * info.velocity.x;
              if (swipe < -10000) setActive((prev) => prev + 1);
              if (swipe > 10000) setActive((prev) => prev - 1);
            }}
          >
            {visibleOffsets.map((offset) => {
              const absoluteIndex = active + offset;
              const item = FEATURED_CATEGORIES[wrap(0, count, absoluteIndex)];
              const isCenter = offset === 0;
              const distance = Math.abs(offset);

              return (
                <Motion.button
                  key={`${item.id}-${absoluteIndex}`}
                  type="button"
                  className={`homeCategoryCard ${isCenter ? "homeCategoryCard--center" : ""}`}
                  animate={{
                    x: offset * 228,
                    z: -distance * 156,
                    scale: isCenter ? 1 : 0.86,
                    rotateY: offset * -16,
                    opacity: isCenter ? 1 : Math.max(0.18, 1 - distance * 0.35),
                    filter: `blur(${isCenter ? 0 : distance * 3.8}px) brightness(${isCenter ? 1 : 0.76})`,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={() => {
                    if (!isCenter) setActive((prev) => prev + offset);
                  }}
                  aria-label={isCenter ? `${item.title} selected` : `View ${item.title}`}
                >
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  <span className="homeCategoryCard__shade" />
                  <span className="homeCategoryCard__label">
                    <strong>{item.title}</strong>
                  </span>
                </Motion.button>
              );
            })}
          </Motion.div>
        </div>

        <div className="homeCategoryRail__footer">
          <AnimatePresence mode="wait">
            <Motion.div
              key={activeItem.id}
              className="homeCategoryRail__copy"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h3>{activeItem.title}</h3>
              <p>{activeItem.description}</p>
            </Motion.div>
          </AnimatePresence>

          <div className="homeCategoryRail__actions">
            <div className="homeCategoryRail__pager">
              <button type="button" onClick={() => setActive((prev) => prev - 1)} aria-label="Previous category">
                <ChevronLeft />
              </button>
              <span>{String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
              <button type="button" onClick={() => setActive((prev) => prev + 1)} aria-label="Next category">
                <ChevronRight />
              </button>
            </div>
            <button type="button" className="homeCategoryRail__explore" onClick={handleExplore}>
              Explore category
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleToggle({ value, onChange }) {
  return (
    <LayoutGroup id="home-experience-role-toggle">
      <div className="homeHowToggle" role="tablist" aria-label="How it works audience">
        {[
          ["customer", "Customer"],
          ["provider", "Service Providers"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={value === id}
            className={`homeHowToggle__btn ${value === id ? "homeHowToggle__btn--active" : ""}`}
            onClick={() => onChange(id)}
          >
            {value === id ? (
              <Motion.span layoutId="homeHowToggleIndicator" className="homeHowToggle__indicator" />
            ) : null}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

function HowSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.42, once: true });
  const reduceMotion = useReducedMotion();
  const [role, setRole] = useState("customer");
  const [activeIndex, setActiveIndex] = useState(0);
  const steps = role === "customer" ? CUSTOMER_STEPS : PROVIDER_STEPS;
  const activeStep = steps[activeIndex] || steps[0];

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setActiveIndex(0);
  };

  return (
    <section className="homeHow" ref={ref} aria-labelledby="homeHow-title">
      <div className="homeExperienceSection__head">
        <div className="homeHowTitle">
          <Motion.h2
            id="homeHow-title"
            className="homeExperienceTitle homeExperienceTitle--script"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1] }}
          >
            How It Works
          </Motion.h2>
          <Motion.svg className="homeHowTitle__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
            <Motion.path
              d="M 0,10 L 300,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={inView || reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.72, delay: 0.12 }}
            />
          </Motion.svg>
        </div>
        <p>A clearer path for hiring and selling, with decisions kept in one place.</p>
        <RoleToggle value={role} onChange={handleRoleChange} />
      </div>

      <Motion.div
        className="homeHowProcess"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.16 }}
      >
        <div className="homeHowRail">
          {steps.map((step, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                className={`homeHowRail__item ${active ? "homeHowRail__item--active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-current={active ? "step" : undefined}
              >
                <span>{step.step}</span>
                <strong>{step.title}</strong>
              </button>
            );
          })}
        </div>

        <div className="homeHowDetail" aria-live="polite">
          <AnimatePresence mode="wait">
            <Motion.article
              key={`${role}-${activeStep.id}`}
              className="homeHowDetail__panel"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
            >
              <span>{activeStep.step}</span>
              <h3>{activeStep.title}</h3>
              <p>{activeStep.description}</p>
              <div aria-hidden="true" />
              <p>{activeStep.detail}</p>
            </Motion.article>
          </AnimatePresence>
        </div>
      </Motion.div>
    </section>
  );
}

function EmailInput({ value, onChange, onSubmit, isSubmitting, status, message }) {
  return (
    <form className="homeExpandForm" onSubmit={onSubmit} aria-label="Subscribe for updates" noValidate>
      <label className={`homeExpandInput homeExpandInput--${status}`} htmlFor="home-expand-email">
        <span>Email address</span>
        <input
          id="home-expand-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={status === "error"}
        />
        <button type="submit" aria-label="Submit email" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="homeExpandInput__spin" /> : status === "success" ? <Check /> : <ArrowRight />}
        </button>
      </label>
      <div className="homeExpandFeedback" aria-live="polite">
        {message ? <p className={`homeExpandFeedback--${status}`}>{message}</p> : <p>&nbsp;</p>}
      </div>
    </form>
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
    <div className="homeExpandRotate" aria-live="polite">
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

function UpdatesSection({ progress }) {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const resolvedProgress = reduceMotion ? 1 : progress;
  const showContent = resolvedProgress >= 0.78;
  const titleTranslate = resolvedProgress * 150;
  const mediaWidth = `min(${300 + resolvedProgress * 1120}px, 94vw)`;
  const mediaHeight = `min(${390 + resolvedProgress * 300}px, 78vh)`;

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

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const { error } = await supabase.from(NEWSLETTER_TABLE).insert({
        email: trimmed.toLowerCase(),
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
    <section className={`homeExpand ${showContent ? "homeExpand--open" : ""}`} aria-labelledby="homeExpand-title">
      <Motion.div
        className="homeExpand__backdrop"
        style={{ opacity: 1 - resolvedProgress * 0.78 }}
        aria-hidden="true"
      >
        <img src={STOCK_BACKGROUND} alt="" />
      </Motion.div>

      <div className="homeExpand__stage">
        <Motion.div
          className="homeExpandMedia"
          style={{
            width: mediaWidth,
            height: mediaHeight,
            boxShadow: `0 0 ${34 + resolvedProgress * 44}px rgba(12,7,18,${0.18 + resolvedProgress * 0.16})`,
          }}
          aria-hidden="true"
        >
          <video src={STOCK_VIDEO} poster={STOCK_POSTER} autoPlay muted loop playsInline preload="metadata" />
          <img src={STOCK_POSTER} alt="" />
          <span />
        </Motion.div>

        <div className="homeExpand__titleLayer">
          <h2 id="homeExpand-title">
            <span style={{ transform: `translateX(-${titleTranslate}vw)` }}>Carvver</span>
            <span style={{ transform: `translateX(${titleTranslate}vw)` }}>keeps moving</span>
          </h2>
        </div>

        <p
          className="homeExpand__scrollHint"
          style={{ transform: `translate(-50%, ${resolvedProgress * 10}px)`, opacity: 1 - resolvedProgress * 1.1 }}
        >
          Scroll to expand what comes next.
        </p>

        <Motion.div
          className="homeExpandContent"
          initial={false}
          animate={{
            opacity: showContent || reduceMotion ? 1 : 0,
            y: showContent || reduceMotion ? 0 : 22,
            pointerEvents: showContent || reduceMotion ? "auto" : "none",
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="homeExpandContent__copy">
            <h3>Stay close to what launches next.</h3>
            <p>
              Cleaner sharing, sharper service pages, and practical marketplace updates are moving through Carvver.
            </p>
            <RotatingPhrase visible={showContent || reduceMotion} reduceMotion={reduceMotion} />
          </div>
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
    </section>
  );
}

export default function HomeExperience() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const sectionRefs = useRef([]);
  const lastSnapAtRef = useRef(0);
  const touchStartYRef = useRef(null);
  const reduceMotionRef = useRef(false);
  const compactRef = useRef(false);
  const updatesProgressRef = useRef(0);
  const [updatesProgress, setUpdatesProgress] = useState(0);

  const setSectionRef = useCallback(
    (index) => (node) => {
      sectionRefs.current[index] = node;
    },
    []
  );

  useEffect(() => {
    reduceMotionRef.current = Boolean(reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    updatesProgressRef.current = updatesProgress;
  }, [updatesProgress]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const sync = () => {
      compactRef.current = mediaQuery.matches;
    };
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const scrollToIndex = useCallback((index, options = {}) => {
    const nextIndex = clamp(index, 0, SECTION_IDS.length - 1);
    const element = sectionRefs.current[nextIndex];
    if (!element) return;

    if (options.updatesProgress != null) {
      updatesProgressRef.current = options.updatesProgress;
      setUpdatesProgress(options.updatesProgress);
    }

    element.scrollIntoView({
      behavior: reduceMotionRef.current ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const getActiveIndex = useCallback(() => {
    const navHeight = getNavHeight();
    let activeIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    sectionRefs.current.forEach((element, index) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top - navHeight);
      if (distance < bestDistance && rect.bottom > navHeight + 80) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    return activeIndex;
  }, []);

  const controlUpdatesProgress = useCallback((event, deltaY, sensitivity) => {
    const current = updatesProgressRef.current;
    const atStart = current <= 0.002;
    const atEnd = current >= 0.998;

    if ((deltaY > 0 && atEnd) || (deltaY < 0 && atStart)) return false;

    event.preventDefault();
    const element = sectionRefs.current[UPDATES_INDEX];
    if (element && Math.abs(element.getBoundingClientRect().top - getNavHeight()) > 2) {
      element.scrollIntoView({ behavior: "auto", block: "start" });
    }

    const next = clamp(current + deltaY * sensitivity);
    updatesProgressRef.current = next;
    setUpdatesProgress(next);
    return true;
  }, []);

  const applySnapDelta = useCallback(
    (event, deltaY, sensitivity = FOUR_PROGRESS_SENSITIVITY) => {
      if (
        !deltaY ||
        reduceMotionRef.current ||
        compactRef.current ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const activeIndex = getActiveIndex();

      if (activeIndex === UPDATES_INDEX && controlUpdatesProgress(event, deltaY, sensitivity)) {
        return;
      }

      if (Math.abs(deltaY) < WHEEL_THRESHOLD) return;

      const now = Date.now();
      if (now - lastSnapAtRef.current < SNAP_COOLDOWN) {
        event.preventDefault();
        return;
      }

      const direction = deltaY > 0 ? 1 : -1;
      const nextIndex = clamp(activeIndex + direction, 0, SECTION_IDS.length - 1);
      if (nextIndex === activeIndex) return;

      event.preventDefault();
      lastSnapAtRef.current = now;
      scrollToIndex(nextIndex, {
        updatesProgress:
          nextIndex === UPDATES_INDEX && direction < 0
            ? 1
            : activeIndex === UPDATES_INDEX && direction < 0
              ? 0
              : undefined,
      });
    },
    [controlUpdatesProgress, getActiveIndex, scrollToIndex]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleWheel = (event) => {
      applySnapDelta(event, event.deltaY);
    };

    const handleTouchStart = (event) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      const previousY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (previousY == null || currentY == null) return;

      const deltaY = previousY - currentY;
      touchStartYRef.current = currentY;
      if (Math.abs(deltaY) > 12) {
        applySnapDelta(event, deltaY, TOUCH_PROGRESS_SENSITIVITY);
      }
    };

    const handleKeyDown = (event) => {
      const keyDeltas = {
        ArrowDown: 90,
        PageDown: 260,
        " ": 260,
        ArrowUp: -90,
        PageUp: -260,
      };
      if (!keyDeltas[event.key]) return;
      applySnapDelta(event, keyDeltas[event.key]);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [applySnapDelta]);

  useEffect(() => {
    if (!location.hash) return undefined;
    const targetId = location.hash.replace(/^#/, "");
    const targetIndex = SECTION_IDS.indexOf(targetId);
    if (targetIndex < 0) return undefined;

    const timerId = window.setTimeout(() => {
      scrollToIndex(targetIndex);
    }, 60);

    return () => window.clearTimeout(timerId);
  }, [location.hash, scrollToIndex]);

  const handleBrowse = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard/customer/browse-services");
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate("/sign-up");
  };

  const handleStartSelling = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard/freelancer");
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate("/sign-up");
  };

  const sectionProps = useMemo(
    () => [
      { id: "home-hero", className: "homeExperienceSnap homeExperienceSnap--hero" },
      { id: "home-categories", className: "homeExperienceSnap" },
      { id: "home-how", className: "homeExperienceSnap" },
      { id: "home-updates", className: "homeExperienceSnap homeExperienceSnap--updates" },
      { id: "home-footer", className: "homeExperienceFooter" },
    ],
    []
  );

  return (
    <main className="homeExperience">
      <section {...sectionProps[0]} ref={setSectionRef(0)} data-home-section>
        <HeroSection onBrowse={handleBrowse} onStart={handleStartSelling} />
      </section>

      <section {...sectionProps[1]} ref={setSectionRef(1)} data-home-section>
        <CategoriesSection />
      </section>

      <section {...sectionProps[2]} ref={setSectionRef(2)} data-home-section>
        <HowSection />
      </section>

      <section {...sectionProps[3]} ref={setSectionRef(3)} data-home-section>
        <UpdatesSection progress={updatesProgress} />
      </section>

      <section {...sectionProps[4]} ref={setSectionRef(4)} data-home-section>
        <HomeFooter />
      </section>
    </main>
  );
}
