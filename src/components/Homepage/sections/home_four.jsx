import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import "./home_four.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";

const labelContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.035,
    },
  },
};

const labelLetterVariants = {
  initial: {
    y: 0,
    opacity: 1,
    color: "rgba(27,16,46,0.62)",
  },
  animate: {
    y: -22,
    opacity: 0.92,
    color: "rgba(27,16,46,0.46)",
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 20,
    },
  },
};

function FlipText({
  word,
  active,
  duration = 0.5,
  delayMultiple = 0.08,
}) {
  return (
    <span className="homeFour__flip">
      {word.split("").map((char, i) => (
        <Motion.span
          key={`${char}-${i}`}
          className={`homeFour__char ${char === " " ? "homeFour__char--space" : ""}`}
          initial={false}
          animate={active ? { rotateX: 0, opacity: 1 } : { rotateX: -90, opacity: 0 }}
          transition={{
            duration,
            delay: i * delayMultiple,
            ease: [0.2, 0.95, 0.2, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </Motion.span>
      ))}
    </span>
  );
}

function TypewriterDescription({
  text,
  active,
  speed = 18,
  initialDelay = 720,
}) {
  const [displayText, setDisplayText] = useState("");
  const startedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (reduceMotion) {
      queueMicrotask(() => setDisplayText(text));
      return undefined;
    }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [active, text, speed, initialDelay, reduceMotion]);

  return (
    <p className="homeFour__desc">
      <span>{displayText}</span>
      {!reduceMotion && displayText.length < text.length && (
        <Motion.span
          className="homeFour__descCursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </Motion.span>
      )}
    </p>
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
  const [isFocused, setIsFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const showLabel = isFocused || value.length > 0;

  return (
    <form
      className="homeFourForm"
      onSubmit={onSubmit}
      aria-label="Subscribe for updates"
      aria-busy={isSubmitting}
      noValidate
    >
      <Motion.div
        className={`homeFourInput ${
          status === "error"
            ? "homeFourInput--error"
            : status === "success"
            ? "homeFourInput--success"
            : ""
        }`}
        animate={
          reduceMotion
            ? {}
            : status === "error"
            ? { x: [0, -5, 5, -3, 3, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.3 }}
      >
        <Motion.div
          className="homeFourInput__label"
          variants={labelContainerVariants}
          initial="initial"
          animate={showLabel ? "animate" : "initial"}
          aria-hidden="true"
        >
          {"Enter your email".split("").map((char, index) => (
            <Motion.span
              key={index}
              className="homeFourInput__labelChar"
              variants={labelLetterVariants}
            >
              {char === " " ? "\u00A0" : char}
            </Motion.span>
          ))}
        </Motion.div>

        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="homeFourInput__control"
          placeholder="Enter your email"
          aria-label="Email address"
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
          whileHover={isSubmitting ? undefined : { y: -1.5, scale: 1.03 }}
          whileTap={isSubmitting ? undefined : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSubmitting ? (
              <Motion.span
                key="loader"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.72 }}
                transition={{ duration: 0.2 }}
                className="homeFourInput__iconWrap"
              >
                <LoaderCircle className="homeFourInput__submitIcon homeFourInput__submitIcon--loading" />
              </Motion.span>
            ) : status === "success" ? (
              <Motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 12 }}
                transition={{ duration: 0.22 }}
                className="homeFourInput__iconWrap"
              >
                <Check className="homeFourInput__submitIcon" />
              </Motion.span>
            ) : (
              <Motion.span
                key="arrow"
                initial={{ opacity: 0, scale: 0.7, rotate: 12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: -12 }}
                transition={{ duration: 0.22 }}
                className="homeFourInput__iconWrap"
              >
                <ArrowRight className="homeFourInput__submitIcon" />
              </Motion.span>
            )}
          </AnimatePresence>
        </Motion.button>
      </Motion.div>

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
              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
              transition={{ duration: 0.22 }}
            >
              {message}
            </Motion.p>
          ) : (
            <Motion.p
              key="empty"
              className="homeFourFeedback__spacer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              &nbsp;
            </Motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

const DECORATIONS = [
  { id: "plane-a", kind: "plane", className: "homeFour__decor--planeA", float: { y: [0, -8, 0], rotate: [0, -4, 0] }, duration: 5.6 },
  { id: "plane-b", kind: "plane", className: "homeFour__decor--planeB", float: { y: [0, 10, 0], rotate: [0, 5, 0] }, duration: 6.2 },
  { id: "star-a", kind: "star", className: "homeFour__decor--star", float: { rotate: [0, 10, 0], scale: [1, 1.04, 1] }, duration: 4.8 },
  { id: "ring-a", kind: "ring", className: "homeFour__decor--ring", float: { rotate: [0, 360] }, duration: 14, ease: "linear" },
  { id: "scribble-a", kind: "scribbleA", className: "homeFour__decor--scribbleA", float: { x: [0, 8, 0], y: [0, -4, 0] }, duration: 5.4 },
  { id: "scribble-b", kind: "scribbleB", className: "homeFour__decor--scribbleB", float: { x: [0, -6, 0], y: [0, 5, 0] }, duration: 6.1 },
  { id: "spark-a", kind: "spark", className: "homeFour__decor--sparkA", float: { y: [0, -7, 0], rotate: [0, 8, 0] }, duration: 4.2 },
  { id: "spark-b", kind: "spark", className: "homeFour__decor--sparkB", float: { y: [0, 6, 0], rotate: [0, -10, 0] }, duration: 4.7 },
  { id: "spark-c", kind: "spark", className: "homeFour__decor--sparkC", float: { scale: [1, 1.1, 1], rotate: [0, 6, 0] }, duration: 5.1 },
  { id: "dash-a", kind: "dash", className: "homeFour__decor--dashA", float: { x: [0, 6, 0] }, duration: 5 },
  { id: "dash-b", kind: "dash", className: "homeFour__decor--dashB", float: { x: [0, -5, 0] }, duration: 5.5 },
  { id: "dash-c", kind: "dash", className: "homeFour__decor--dashC", float: { y: [0, -5, 0] }, duration: 4.6 },
  { id: "dot-a", kind: "dot", className: "homeFour__decor--dotA", float: { scale: [1, 1.18, 1] }, duration: 3.9 },
  { id: "dot-b", kind: "dot", className: "homeFour__decor--dotB", float: { scale: [1, 1.16, 1] }, duration: 4.4 },
  { id: "burst-a", kind: "burst", className: "homeFour__decor--burstA", float: { rotate: [0, 14, 0], scale: [1, 1.06, 1] }, duration: 5.2 },
  { id: "burst-b", kind: "burst", className: "homeFour__decor--burstB", float: { rotate: [0, -12, 0], scale: [1, 1.05, 1] }, duration: 5.8 },
];

function DecorationShape({ kind }) {
  if (kind === "plane") {
    return (
      <svg viewBox="0 0 120 120">
        <path
          d="M18 60L98 24L70 96L55 68L18 60Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M55 68L98 24" fill="none" stroke="currentColor" strokeWidth="4" />
      </svg>
    );
  }

  if (kind === "star") {
    return (
      <svg viewBox="0 0 100 100">
        <path
          d="M50 10L58 38L88 50L58 62L50 90L42 62L12 50L42 38L50 10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "ring") {
    return (
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="7 7" />
      </svg>
    );
  }

  if (kind === "scribbleA") {
    return (
      <svg viewBox="0 0 220 80">
        <path
          d="M8 48C28 22 54 18 74 38C94 58 118 60 140 38C162 16 188 18 210 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "scribbleB") {
    return (
      <svg viewBox="0 0 220 80">
        <path
          d="M10 34C35 58 56 58 82 36C108 14 132 14 156 36C180 58 198 58 212 46"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg viewBox="0 0 80 80">
        <path d="M40 8V72M8 40H72M18 18L62 62M62 18L18 62" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "dash") {
    return (
      <svg viewBox="0 0 120 40">
        <path d="M10 20H110" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "burst") {
    return (
      <svg viewBox="0 0 100 100">
        <path d="M50 8L56 36L84 22L66 48L94 58L64 62L72 92L50 70L28 92L36 62L6 58L34 48L16 22L44 36L50 8Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="14" fill="currentColor" />
    </svg>
  );
}

function Decorations({ active }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="homeFour__decorLayer" aria-hidden="true">
      {DECORATIONS.map((decor, index) => (
        <Motion.div
          key={decor.id}
          className={`homeFour__decor ${decor.className}`}
          initial={
            reduceMotion
              ? false
              : { x: "-50%", y: "-50%", scale: 0.12, rotate: -18, opacity: 0 }
          }
          animate={
            reduceMotion || active
              ? {
                  x: "calc(-50% + var(--pop-x))",
                  y: "calc(-50% + var(--pop-y))",
                  scale: 1,
                  rotate: "var(--pop-rotate)",
                  opacity: 1,
                }
              : {}
          }
          transition={{
            duration: 0.72,
            delay: index * 0.035,
            ease: [0.18, 0.92, 0.28, 1],
          }}
        >
          <Motion.div
            className="homeFour__decorFloat"
            animate={reduceMotion ? {} : decor.float}
            transition={{
              duration: decor.duration,
              repeat: Infinity,
              ease: decor.ease || "easeInOut",
              delay: index * 0.08,
            }}
          >
            <DecorationShape kind={decor.kind} />
          </Motion.div>
        </Motion.div>
      ))}
    </div>
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getSubscribeErrorMessage(error) {
  if (!error) return "We couldn't save your email. Please try again.";

  if (error.code === "42P01") {
    return "We couldn't save your email. Please try again in a moment.";
  }

  if (error.code === "42501") {
    return "We couldn't save your email. Please try again in a moment.";
  }

  return "We couldn't save your email. Please try again.";
}

export default function HomeFour() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.46, once: true });

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleChange = (nextValue) => {
    setEmail(nextValue);

    if (status !== "idle" || message) {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      if (error) {
        throw error;
      }

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
    <section className="homeFour" ref={ref} aria-labelledby="homeFour-title">
      <Decorations active={inView} />

      <div className="homeFour__inner">
        <h2 id="homeFour-title" className="homeFour__title">
          <FlipText word="Stay Tuned!" active={inView} />
        </h2>

        <TypewriterDescription
          active={inView}
          text="Be the first to hear about new features, platform updates, and everything we're building at Carvver."
        />

        <Motion.div
          className="homeFour__inputWrap"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 1.05 }}
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
    </section>
  );
}
