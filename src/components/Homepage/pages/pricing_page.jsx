import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { scrollWindowToTop } from "../../../lib/publicNavigation";
import "./pricing_page.css";

const BUSINESS_CONTACT_URL =
  "mailto:contact@carvver.com?subject=Carvver%20Business%20Inquiry";

const PRICING_AUDIENCES = {
  freelancer: {
    label: "Freelancer",
    plans: [
      {
        name: "Basic",
        badge: "Start here",
        price: "Free",
        period: "No monthly fee",
        summary: "For first-time freelancers building their presence on Carvver.",
        features: [
          "Create a public profile and service listings",
          "Upload portfolio media and service details",
          "Use chat, order management, and status updates",
          "Earn achievements and badges",
          "Standard platform commission applies",
        ],
        ctaLabel: "Get Started",
        ctaKind: "signup",
      },
      {
        name: "Carvver Pro",
        badge: "Most popular",
        price: "P500",
        period: "per month",
        summary: "For creators who want more reach, better margins, and stronger presentation.",
        features: [
          "Everything in Basic",
          "0% platform commission",
          "Few-click posting to social platforms",
          "Priority listing visibility inside Carvver",
          "Enhanced profile customization and portfolio presentation",
          "Advanced listing insights and performance visibility",
          "Faster support handling",
        ],
        ctaLabel: "Choose Pro",
        ctaKind: "signup",
        featured: true,
      },
      {
        name: "Business",
        badge: "For teams",
        price: "P1,500",
        period: "per month",
        summary: "For studios, collectives, and growing service brands that need more support.",
        features: [
          "Everything in Pro",
          "Built for studios, collectives, and growing service brands",
          "Featured business profile support",
          "Priority verification and account review",
          "Priority support and issue handling",
          "Assisted onboarding and promotional guidance",
        ],
        ctaLabel: "Contact Sales",
        ctaKind: "contact",
      },
    ],
  },
  customer: {
    label: "Customer",
    plans: [
      {
        name: "Basic",
        badge: "Start here",
        price: "Free",
        period: "No monthly fee",
        summary: "For browsing, saving, and booking with confidence on the platform.",
        features: [
          "Browse categories and nearby providers",
          "Save favorites and build a cart",
          "Post customer requests",
          "View reviews, badges, and verified signals",
          "Use escrow-backed checkout and standard order tracking",
        ],
        ctaLabel: "Get Started",
        ctaKind: "signup",
      },
      {
        name: "Carvver Pro",
        badge: "Most popular",
        price: "P500",
        period: "per month",
        summary: "For buyers who want faster discovery, cleaner browsing, and stronger support.",
        features: [
          "Everything in Basic",
          "Advanced location-based discovery",
          "Smarter shortlist and saved-search convenience",
          "Ad-free browsing",
          "Faster support for order concerns and disputes",
          "Stronger order visibility and priority help",
        ],
        ctaLabel: "Choose Pro",
        ctaKind: "signup",
        featured: true,
      },
      {
        name: "Business",
        badge: "For teams",
        price: "P1,500",
        period: "per month",
        summary: "For teams, event organizers, and repeat buyers coordinating more work.",
        features: [
          "Everything in Pro",
          "Built for teams, event organizers, and repeat buyers",
          "Priority sourcing assistance",
          "Help coordinating multiple requests",
          "Faster issue resolution and account support",
          "More hands-on purchasing support",
        ],
        ctaLabel: "Contact Sales",
        ctaKind: "contact",
      },
    ],
  },
};

function Reveal({ children, className = "", delay = 0, amount = 0.24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const active = inView || reduceMotion;

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof children === "function" ? children(active) : children}
    </Motion.div>
  );
}

function AccentLine({ className }) {
  return <span className={className} aria-hidden="true" />;
}

function SectionHeading({ title, sub }) {
  return (
    <div className="pricingSectionHead">
      <div className="pricingSectionHead__titleWrap">
        <h2 className="pricingSectionHead__title">{title}</h2>
        <AccentLine className="pricingSectionHead__line" />
      </div>
      <p className="pricingSectionHead__sub">{sub}</p>
    </div>
  );
}

function AudienceToggle({ audience, onChange }) {
  return (
    <div className="pricingToggle" role="tablist" aria-label="Pricing audience">
      {Object.entries(PRICING_AUDIENCES).map(([key, value]) => {
        const active = key === audience;

        return (
          <button
            key={key}
            type="button"
            className={`pricingToggle__button ${active ? "pricingToggle__button--active" : ""}`}
            onClick={() => onChange(key)}
            role="tab"
            aria-selected={active}
          >
            <span className="pricingToggle__label">{value.label}</span>
            {active ? <Motion.span layoutId="pricing-audience" className="pricingToggle__pill" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function PricingCard({ plan, onAction }) {
  return (
    <Motion.article
      className={`pricingCard ${plan.featured ? "pricingCard--featured" : ""}`}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
    >
      <div className="pricingCard__top">
        <span className={`pricingCard__badge ${plan.featured ? "pricingCard__badge--featured" : ""}`}>
          {plan.badge}
        </span>
        <h3 className="pricingCard__title">{plan.name}</h3>
        <p className="pricingCard__summary">{plan.summary}</p>
      </div>

      <div className="pricingCard__priceBlock">
        <p className="pricingCard__price">{plan.price}</p>
        <p className="pricingCard__period">{plan.period}</p>
      </div>

      <div className="pricingCard__features">
        {plan.features.map((feature) => (
          <div className="pricingCard__feature" key={`${plan.name}-${feature}`}>
            <span className="pricingCard__checkWrap" aria-hidden="true">
              <Check className="pricingCard__check" />
            </span>
            <span className="pricingCard__featureText">{feature}</span>
          </div>
        ))}
      </div>

      <Motion.button
        type="button"
        className={`pricingBtn ${plan.featured ? "pricingBtn--primary" : "pricingBtn--ghost"} pricingBtn--wide`}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={() => onAction(plan)}
      >
        <span>{plan.ctaLabel}</span>
        <ArrowRight className="pricingBtn__icon" />
      </Motion.button>
    </Motion.article>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState("freelancer");

  useEffect(() => {
    scrollWindowToTop({ behavior: "auto" });
  }, []);

  const plans = PRICING_AUDIENCES[audience]?.plans || PRICING_AUDIENCES.freelancer.plans;

  const handleAction = (plan) => {
    if (plan.ctaKind === "contact") {
      if (typeof window !== "undefined") {
        window.location.href = BUSINESS_CONTACT_URL;
      }
      return;
    }

    navigate("/sign-up");
  };

  return (
    <>
      <div className="pricingPage__base" aria-hidden="true" />
      <div className="pricingPage__bg" aria-hidden="true" />

      <main className="pricingPage">
        <div className="pricingPage__decor pricingPage__decor--a" aria-hidden="true" />
        <div className="pricingPage__decor pricingPage__decor--b" aria-hidden="true" />
        <div className="pricingPage__decor pricingPage__decor--c" aria-hidden="true" />

        <section className="pricingHero pricingBand">
          <div className="pricingWrap pricingHero__layout">
            <Reveal className="pricingHero__copy" amount={0.3}>
              <div className="pricingHero__titleWrap">
                <h1 className="pricingHero__title">Pricing</h1>
                <AccentLine className="pricingHero__line" />
              </div>
              <p className="pricingHero__sub">
                Simple plans for the way Carvver works today, with room to grow for creators,
                customers, and teams that need more support.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="pricingBand pricingSection" id="pricing-plans">
          <div className="pricingWrap pricingPlansSection">
            <Reveal>
              <SectionHeading
                title="Plans"
                sub="Choose the setup that fits how you use Carvver today, whether you're hiring or offering work."
              />
            </Reveal>

            <Reveal delay={0.05} className="pricingPlansSection__controls">
              <AudienceToggle audience={audience} onChange={setAudience} />
            </Reveal>

            <div className="pricingGrid">
              {plans.map((plan, index) => (
                <Reveal key={`${audience}-${plan.name}`} delay={0.04 * index}>
                  <PricingCard plan={plan} onAction={handleAction} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
