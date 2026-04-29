import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion as Motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import "./home_three.css";

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
    title: "Create a listing people can understand",
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

function RevealTitle({ id, text = "How It Works", active }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="homeThreeTitle">
      <div className="homeThreeTitle__wrap">
        <Motion.h2
          id={id}
          className="homeThree__title"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={active || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1] }}
        >
          {text}
        </Motion.h2>

        <Motion.svg
          className="homeThree__underline"
          viewBox="0 0 300 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <Motion.path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            d="M 0,10 L 300,10"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={
              active || reduceMotion
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              pathLength: { duration: 0.72, ease: [0.2, 0.95, 0.2, 1], delay: 0.12 },
              opacity: { duration: 0.22, delay: 0.08 },
            }}
          />
        </Motion.svg>
      </div>
    </div>
  );
}

function RoleToggle({ value, onChange }) {
  return (
    <LayoutGroup id="home-three-role-toggle">
      <div className="homeThreeToggle" role="tablist" aria-label="How it works audience">
        <button
          type="button"
          role="tab"
          aria-selected={value === "customer"}
          className={`homeThreeToggle__btn ${
            value === "customer" ? "homeThreeToggle__btn--active" : ""
          }`}
          onClick={() => onChange("customer")}
        >
          {value === "customer" ? (
            <Motion.span
              layoutId="homeThreeToggleIndicator"
              className="homeThreeToggle__indicator"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          ) : null}
          <span className="homeThreeToggle__text">Customer</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={value === "provider"}
          className={`homeThreeToggle__btn ${
            value === "provider" ? "homeThreeToggle__btn--active" : ""
          }`}
          onClick={() => onChange("provider")}
        >
          {value === "provider" ? (
            <Motion.span
              layoutId="homeThreeToggleIndicator"
              className="homeThreeToggle__indicator"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          ) : null}
          <span className="homeThreeToggle__text">Service Providers</span>
        </button>
      </div>
    </LayoutGroup>
  );
}

function ProcessLayout({ steps, role, inView }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex] || steps[0];

  useEffect(() => {
    queueMicrotask(() => setActiveIndex(0));
  }, [role]);

  return (
    <Motion.div
      className="homeThreeProcess"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.16 }}
    >
      <div className="homeThreeRail" aria-label={`${role} steps`}>
        {steps.map((step, index) => {
          const active = index === activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              className={`homeThreeRail__item ${active ? "homeThreeRail__item--active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-current={active ? "step" : undefined}
            >
              <span className="homeThreeRail__number">{step.step}</span>
              <span className="homeThreeRail__copy">
                <strong>{step.title}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="homeThreeDetail" aria-live="polite">
        <AnimatePresence mode="wait">
          <Motion.article
            key={`${role}-${activeStep.id}`}
            className="homeThreeDetail__card"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.2, 0.95, 0.2, 1] }}
          >
            <span className="homeThreeDetail__number">{activeStep.step}</span>
            <h3 className="homeThreeDetail__title">{activeStep.title}</h3>
            <p className="homeThreeDetail__desc">{activeStep.description}</p>
            <div className="homeThreeDetail__line" aria-hidden="true" />
            <p className="homeThreeDetail__note">{activeStep.detail}</p>
          </Motion.article>
        </AnimatePresence>
      </div>
    </Motion.div>
  );
}

export default function HomeThree() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.42, once: true });
  const [role, setRole] = useState("customer");

  const steps = role === "customer" ? CUSTOMER_STEPS : PROVIDER_STEPS;

  return (
    <section className="homeThree" ref={ref} aria-labelledby="homeThree-title">
      <div className="homeThree__inner">
        <div className="homeThree__head">
          <RevealTitle id="homeThree-title" text="How It Works" active={inView} />
          <p className="homeThree__intro">
            A clearer path for hiring and selling, with the important decisions kept in one place.
          </p>
          <RoleToggle value={role} onChange={setRole} />
        </div>

        <ProcessLayout steps={steps} role={role} inView={inView} />
      </div>
    </section>
  );
}
