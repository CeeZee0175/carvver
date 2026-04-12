import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  LoaderCircle,
  MapPin,
  Megaphone,
  Palette,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import "./pricing_page.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";

const heroSignals = [
  {
    label: "Start free",
    value: "Core access is ready",
    note: "Browse, save, post, and manage your customer flow without a monthly fee.",
  },
  {
    label: "Upgrade when needed",
    value: "More reach with Pro",
    note: "Carvver Pro is for extra visibility, stronger presentation, and added convenience.",
  },
  {
    label: "Built to grow",
    value: "Made for both sides",
    note: "Keep customer tools simple now and grow into more polished freelancer-facing perks over time.",
  },
];

const freeFeatures = [
  { label: "Browse public pages and the community page", audience: "Both", Icon: Sparkles },
  { label: "Create an account and sign in", audience: "Both", Icon: UserRound },
  { label: "Browse service listings with trust signals", audience: "Customers", Icon: ShoppingBag },
  { label: "Save listings and build a cart", audience: "Customers", Icon: ShieldCheck },
  { label: "Orders, notifications, and customer profile tools", audience: "Customers", Icon: BadgeCheck },
  { label: "Achievements and badge display", audience: "Customers", Icon: Sparkles },
  { label: "Verified and Pro signals across the platform", audience: "Both", Icon: ShieldCheck },
];

const proFeatures = [
  {
    label: "Service listing advertisement or featured placement",
    audience: "Freelancers",
    Icon: Megaphone,
    note: "For stronger visibility inside Carvver Pro.",
  },
  {
    label: "Few-click posting to social platforms",
    audience: "Freelancers",
    Icon: Share2,
    note: "Included in the Carvver Pro plan for easier promotion.",
  },
  {
    label: "More theme customization",
    audience: "Both",
    Icon: Palette,
    note: "For people who want more control over how their presence looks.",
  },
  {
    label: "No commission fee",
    audience: "Freelancers",
    Icon: Crown,
    note: "Included in the Carvver Pro plan.",
  },
  {
    label: "Advanced location-based discovery tools",
    audience: "Customers",
    Icon: MapPin,
    note: "A stronger local-search layer for finding nearby work and providers.",
  },
  {
    label: "Ad-free experience if ad placements are added",
    audience: "Both",
    Icon: ShieldCheck,
    note: "A cleaner premium experience if ad placements are added.",
  },
  {
    label: "Stronger profile presentation and personalization",
    audience: "Both",
    Icon: Users,
    note: "Extra profile polish for people who want more presence inside the platform.",
  },
];

const comparisonRows = [
  { feature: "Public pages and community access", audience: "Both", free: "Included now", pro: "Included" },
  { feature: "Account creation and sign in", audience: "Both", free: "Included now", pro: "Included" },
  {
    feature: "Browse listings, save items, and build a cart",
    audience: "Customers",
    free: "Included now",
    pro: "Included",
  },
  {
    feature: "Orders, notifications, profile, and achievements",
    audience: "Customers",
    free: "Included now",
    pro: "Included",
  },
  {
    feature: "Featured listing promotion",
    audience: "Freelancers",
    free: "Not part of Free",
    pro: "Planned for Carvver Pro",
  },
  {
    feature: "Few-click posting to social platforms",
    audience: "Freelancers",
    free: "Not part of Free",
    pro: "Planned for Carvver Pro",
  },
  {
    feature: "Theme and profile customization",
    audience: "Both",
    free: "Basic experience",
    pro: "Extended personalization",
  },
  {
    feature: "Advanced location-based discovery",
    audience: "Customers",
    free: "Core discovery first",
    pro: "Planned for Carvver Pro",
  },
  {
    feature: "Commission-free freelancer tier",
    audience: "Freelancers",
    free: "Standard platform rules",
    pro: "Planned for Carvver Pro",
  },
];

const rolloutNotes = [
  {
    title: "What already feels solid",
    text:
      "The current build is already strongest on customer-side browsing, saved listings, cart flow, orders, notifications, and profile progress.",
  },
  {
    title: "What Carvver Pro includes",
    text:
      "Some freelancer-heavy tools are part of the Carvver Pro plan, so this page shows them clearly while the full membership experience is still being rolled out.",
  },
  {
    title: "How this page works",
    text:
      "You can compare the plans here and join the Carvver Pro waitlist for updates.",
  },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getWaitlistErrorMessage(error) {
  if (!error) return "We couldn't save your email. Please try again.";
  if (error.code === "42P01") return "We couldn't save your email. Please try again in a moment.";
  if (error.code === "42501") {
    return "We couldn't save your email. Please try again in a moment.";
  }
  return "We couldn't save your email. Please try again.";
}

function Reveal({ children, className = "", delay = 0, amount = 0.24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const active = inView || reduceMotion;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof children === "function" ? children(active) : children}
    </motion.div>
  );
}

function TypewriterTitle({ text, active, speed = 72, initialDelay = 120 }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    let timeoutId = null;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = window.setTimeout(tick, speed);
    };

    timeoutId = window.setTimeout(tick, initialDelay);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [active, initialDelay, reduceMotion, speed, text]);

  return (
    <span>
      {displayText}
      {!reduceMotion && displayText.length < text.length && (
        <motion.span
          className="pricingPage__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div className="pricingSectionHead">
      <p className="pricingSectionHead__eyebrow">{eyebrow}</p>
      <div className="pricingSectionHead__titleWrap">
        <h2 className="pricingSectionHead__title">{title}</h2>
        <motion.svg className="pricingSectionHead__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.75 }}
            transition={{ duration: 0.95, ease: "easeInOut" }}
          />
        </motion.svg>
      </div>
      <p className="pricingSectionHead__sub">{sub}</p>
    </div>
  );
}

function AudienceChip({ audience }) {
  return <span className={`pricingAudienceChip pricingAudienceChip--${audience.toLowerCase()}`}>{audience}</span>;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const scrollToId = (id, shouldFocusInput = false) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    if (shouldFocusInput) {
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, reduceMotion ? 0 : 420);
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
        source: "pricing_page_pro_waitlist",
      });

      if (error?.code === "23505") {
        setEmail("");
        setStatus("success");
        setMessage("You're already on the Carvver Pro waitlist. We'll keep you posted.");
        return;
      }

      if (error) throw error;

      setEmail("");
      setStatus("success");
      setMessage("You're in. We'll reach out when Carvver Pro updates are ready.");
    } catch (error) {
      setStatus("error");
      setMessage(getWaitlistErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
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
              {(active) => (
                <>
                  <p className="pricingHero__eyebrow">Pricing</p>
                  <div className="pricingHero__titleWrap">
                    <h1 className="pricingHero__title">
                      <TypewriterTitle text="Start free. Grow with Pro." active={active} />
                    </h1>
                    <motion.svg className="pricingHero__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                      <motion.path
                        d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.02, ease: "easeInOut", delay: 0.2 }}
                      />
                    </motion.svg>
                  </div>

                  <p className="pricingHero__sub">
                    Use Carvver for free today, then step into Carvver Pro when you want more reach,
                    stronger presentation, and a more polished platform experience.
                  </p>

                  <div className="pricingHero__actions">
                    <motion.button
                      type="button"
                      className="pricingBtn pricingBtn--primary"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => scrollToId("pricing-plans")}
                    >
                      <span>See the plans</span>
                      <ArrowRight className="pricingBtn__icon" />
                    </motion.button>

                    <motion.button
                      type="button"
                      className="pricingBtn pricingBtn--ghost"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => scrollToId("pricing-cta", true)}
                    >
                      Join Carvver Pro waitlist
                    </motion.button>
                  </div>
                </>
              )}
            </Reveal>

            <Reveal className="pricingHero__panel" delay={0.08}>
              <div className="pricingHero__signalStack">
                {heroSignals.map((signal, index) => (
                  <motion.article
                    key={signal.label}
                    className="pricingSignal pricingSignal--hero"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ y: -3 }}
                  >
                    <p className="pricingSignal__label">{signal.label}</p>
                    <h2 className="pricingSignal__value">{signal.value}</h2>
                    <p className="pricingSignal__note">{signal.note}</p>
                  </motion.article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="pricingBand pricingSection" id="pricing-plans">
          <div className="pricingWrap">
            <Reveal>
              <SectionHeading
                eyebrow="Plans"
                title="Two tiers, kept simple"
                sub="Free is the starting point for using Carvver today. Carvver Pro is the paid layer for people who want more reach, more control, and more room to grow with the platform."
              />
            </Reveal>

            <div className="pricingPlans">
              <Reveal delay={0.02}>
                <motion.article className="pricingPlan pricingPlan--free" whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 240, damping: 22 }}>
                  <div className="pricingPlan__top">
                    <div>
                      <p className="pricingPlan__eyebrow">Free tier</p>
                      <h3 className="pricingPlan__title">Start with the core platform</h3>
                    </div>
                    <span className="pricingPlan__flag">Available now</span>
                  </div>

                  <div className="pricingPlan__priceRow">
                    <div>
                      <p className="pricingPlan__price">PHP 0</p>
                      <p className="pricingPlan__period">No monthly fee</p>
                    </div>
                    <p className="pricingPlan__note">
                      Best for customers and first-time users who want to experience Carvver first.
                    </p>
                  </div>

                  <div className="pricingPlan__featureList">
                    {freeFeatures.map(({ label, audience, Icon }) => (
                      <div className="pricingPlan__feature" key={`${label}-${audience}`}>
                        <div className="pricingPlan__featureMain">
                          <span className="pricingPlan__iconWrap" aria-hidden="true">
                            <Icon className="pricingPlan__icon" />
                          </span>
                          <span className="pricingPlan__featureText">{label}</span>
                        </div>
                        <AudienceChip audience={audience} />
                      </div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    className="pricingBtn pricingBtn--ghost pricingBtn--freeAction"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    onClick={() => navigate("/sign-up")}
                  >
                    Get started for free
                  </motion.button>
                </motion.article>
              </Reveal>

              <Reveal delay={0.08}>
                <motion.article className="pricingPlan pricingPlan--pro" whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 240, damping: 22 }}>
                  <div className="pricingPlan__top">
                    <div>
                      <p className="pricingPlan__eyebrow">Carvver Pro</p>
                      <h3 className="pricingPlan__title">For more visibility and added convenience</h3>
                    </div>
                    <span className="pricingPlan__flag pricingPlan__flag--pro">PHP 450 / month</span>
                  </div>

                  <div className="pricingPlan__priceRow">
                    <div>
                      <p className="pricingPlan__price">PHP 450</p>
                      <p className="pricingPlan__period">per month</p>
                    </div>
                    <p className="pricingPlan__note">
                      Best for freelancers, makers, and users who want stronger growth tools and more
                      control over their presence.
                    </p>
                  </div>

                  <div className="pricingPlan__featureList">
                    {proFeatures.map(({ label, audience, Icon, note }) => (
                      <div className="pricingPlan__feature pricingPlan__feature--stacked" key={`${label}-${audience}`}>
                        <div className="pricingPlan__featureMain">
                          <span className="pricingPlan__iconWrap pricingPlan__iconWrap--pro" aria-hidden="true">
                            <Icon className="pricingPlan__icon" />
                          </span>
                          <div className="pricingPlan__featureCopy">
                            <span className="pricingPlan__featureText">{label}</span>
                            <span className="pricingPlan__featureNote">{note}</span>
                          </div>
                        </div>
                        <AudienceChip audience={audience} />
                      </div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    className="pricingBtn pricingBtn--primary pricingBtn--wide"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    onClick={() => scrollToId("pricing-cta", true)}
                  >
                    <span>Join Carvver Pro waitlist</span>
                    <ArrowRight className="pricingBtn__icon" />
                  </motion.button>
                </motion.article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="pricingBand pricingSection">
          <div className="pricingWrap">
            <Reveal>
              <SectionHeading
                eyebrow="Feature breakdown"
                title="A clearer view of what sits where"
                sub="Free already covers the starting experience. Carvver Pro is where the extra reach, premium presentation, and added convenience tools are being placed."
              />
            </Reveal>

            <Reveal delay={0.04}>
              <div className="pricingCompare">
                <div className="pricingCompare__note">
                  The current build is already stronger on customer flows. Some Pro items below are
                  part of the Carvver Pro plan, especially for freelancer growth.
                </div>

                <div className="pricingCompare__header">
                  <span className="pricingCompare__col pricingCompare__col--feature">Feature</span>
                  <span className="pricingCompare__col">Free</span>
                  <span className="pricingCompare__col">Carvver Pro</span>
                </div>

                <div className="pricingCompare__rows">
                  {comparisonRows.map((row, index) => (
                    <motion.article
                      key={row.feature}
                      className="pricingCompare__row"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.44, delay: index * 0.04 }}
                    >
                      <div className="pricingCompare__featureCell">
                        <p className="pricingCompare__feature">{row.feature}</p>
                        <AudienceChip audience={row.audience} />
                      </div>
                      <div className="pricingCompare__value">
                        <Check className="pricingCompare__valueIcon" aria-hidden="true" />
                        <span>{row.free}</span>
                      </div>
                      <div className="pricingCompare__value pricingCompare__value--pro">
                        <Check className="pricingCompare__valueIcon" aria-hidden="true" />
                        <span>{row.pro}</span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="pricingBand pricingSection">
          <div className="pricingWrap">
            <Reveal>
              <SectionHeading
                eyebrow="Current rollout"
                title="Kept honest on purpose"
                sub="This page explains the plan without pretending every premium tool is already fully wired into the current build."
              />
            </Reveal>

            <div className="pricingNotes">
              {rolloutNotes.map((note, index) => (
                <Reveal key={note.title} delay={0.05 * index}>
                  <article className="pricingNote">
                    <span className="pricingNote__index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="pricingNote__copy">
                      <h3 className="pricingNote__title">{note.title}</h3>
                      <p className="pricingNote__text">{note.text}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="pricingBand pricingSection pricingSection--cta" id="pricing-cta">
          <div className="pricingWrap">
            <Reveal>
              <div className="pricingCta">
                <div className="pricingCta__copy">
                  <p className="pricingSectionHead__eyebrow">Carvver Pro waitlist</p>
                  <div className="pricingSectionHead__titleWrap">
                    <h2 className="pricingSectionHead__title">Join early if Carvver Pro fits what you need</h2>
                    <motion.svg className="pricingSectionHead__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                      <motion.path
                        d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true, amount: 0.7 }}
                        transition={{ duration: 0.95, ease: "easeInOut" }}
                      />
                    </motion.svg>
                  </div>
                  <p className="pricingCta__text">
                    Join the waitlist if you want updates around featured placement, few-click posting,
                    profile upgrades, and the rest of the Carvver Pro rollout.
                  </p>
                </div>

                <form className="pricingCta__form" onSubmit={handleSubmit} noValidate>
                  <label className="pricingCta__label" htmlFor="pricing-pro-email">
                    Email address
                  </label>

                  <div
                    className={`pricingCta__field ${
                      status === "error"
                        ? "pricingCta__field--error"
                        : status === "success"
                        ? "pricingCta__field--success"
                        : ""
                    }`}
                  >
                    <input
                      ref={inputRef}
                      id="pricing-pro-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      className="pricingCta__input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status !== "idle" || message) {
                          setStatus("idle");
                          setMessage("");
                        }
                      }}
                      disabled={isSubmitting}
                      aria-invalid={status === "error"}
                    />

                    <motion.button
                      type="submit"
                      className="pricingBtn pricingBtn--primary pricingBtn--submit"
                      whileHover={isSubmitting ? {} : { y: -2, scale: 1.01 }}
                      whileTap={isSubmitting ? {} : { scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? "Joining..." : "Join Carvver Pro waitlist"}</span>
                      {isSubmitting ? (
                        <LoaderCircle className="pricingBtn__icon pricingBtn__icon--spin" />
                      ) : status === "success" ? (
                        <Check className="pricingBtn__icon" />
                      ) : (
                        <ArrowRight className="pricingBtn__icon" />
                      )}
                    </motion.button>
                  </div>

                  <p
                    className={`pricingCta__feedback ${
                      status === "error"
                        ? "pricingCta__feedback--error"
                        : status === "success"
                        ? "pricingCta__feedback--success"
                        : ""
                    }`}
                    aria-live="polite"
                  >
                    {message || "We will only use this for Carvver Pro updates and rollout news."}
                  </p>
                </form>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
