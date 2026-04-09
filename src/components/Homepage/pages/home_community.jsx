import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Compass,
  Handshake,
  LoaderCircle,
  MapPin,
  Megaphone,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import "./home_community.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";

const heroSignals = [
  {
    label: "Built for",
    value: "Filipino creators still growing",
    note: "Hobbyists, handmade-product makers, and casual freelancers.",
  },
  {
    label: "Center of gravity",
    value: "Trust, visibility, and calmer transactions",
    note: "Badges, reviews, verification, and escrow-backed checkout.",
  },
  {
    label: "Community mode",
    value: "Early and collaborative",
    note: "We are building this with customer and creator feedback, not around fake activity.",
  },
];

const activeNowCards = [
  {
    title: "Community waitlist",
    text:
      "People who join early help shape how Carvver grows, what gets prioritized next, and how community touchpoints should work in practice.",
    Icon: Sparkles,
  },
  {
    title: "Product updates worth following",
    text:
      "We are sharing progress around few-click posting, badges, verification signals, and safer transaction handling as the product sharpens.",
    Icon: Megaphone,
  },
  {
    title: "Early feedback invites",
    text:
      "Creators and customers both have a place here. The goal is not just to launch features, but to keep learning what actually reduces friction on both sides.",
    Icon: MessageSquare,
  },
  {
    title: "Creator spotlights in progress",
    text:
      "We want Carvver to make discovery feel more intentional, especially for Filipino makers and service providers who are still building visibility.",
    Icon: Compass,
  },
];

const participationLanes = [
  {
    title: "Creators",
    text:
      "Join if you make handmade products, offer services, or want a cleaner home for your work than a scattered social feed.",
    Icon: Share2,
  },
  {
    title: "Customers",
    text:
      "Join if you want a better way to discover trustworthy providers, compare clearer signals, and help shape a safer service marketplace.",
    Icon: Users,
  },
  {
    title: "Early contributors",
    text:
      "Join if you like giving grounded feedback, testing early ideas, and helping a startup decide what is actually useful before it scales.",
    Icon: Handshake,
  },
];

const standards = [
  {
    title: "Useful over noisy",
    text:
      "Community participation should help someone make a better decision, improve a listing, or understand the product more clearly.",
  },
  {
    title: "Trust is earned visibly",
    text:
      "Badges, reviews, verified signals, and respectful communication matter more here than empty hype or inflated status.",
  },
  {
    title: "Respect the people still growing",
    text:
      "Carvver is for people building momentum. That means we keep the tone welcoming to beginners without lowering the bar on honesty or quality.",
  },
  {
    title: "Safer transactions stay central",
    text:
      "Escrow-backed handling, clearer expectations, and good communication are part of the culture, not just the checkout flow.",
  },
];

const roadmapNotes = [
  {
    title: "Feedback circles",
    text:
      "Small, direct product conversations with early creators and customers as the platform matures.",
  },
  {
    title: "Creator spotlights",
    text:
      "More intentional ways to surface promising makers and service providers without turning the platform into a leaderboard race.",
  },
  {
    title: "Lightweight sessions",
    text:
      "Practical sharing around profile building, posting strategy, trust signals, and making the most of Carvver's tools.",
  },
  {
    title: "Future showcases",
    text:
      "A clearer place to celebrate progress, featured work, and community milestones once the foundation is ready for it.",
  },
];

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

      if (index < text.length) {
        timeoutId = window.setTimeout(tick, speed);
      }
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
          className="communityPage__cursor"
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
    <div className="communitySectionHead">
      <p className="communitySectionHead__eyebrow">{eyebrow}</p>
      <div className="communitySectionHead__titleWrap">
        <h2 className="communitySectionHead__title">{title}</h2>
        <motion.svg
          className="communitySectionHead__line"
          viewBox="0 0 300 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
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
      <p className="communitySectionHead__sub">{sub}</p>
    </div>
  );
}

export default function HomeCommunity() {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
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
        source: "community_waitlist",
      });

      if (error?.code === "23505") {
        setEmail("");
        setStatus("success");
        setMessage("You're already on the community list. We'll keep you posted.");
        return;
      }

      if (error) throw error;

      setEmail("");
      setStatus("success");
      setMessage("You're in. We'll reach out as community updates open up.");
    } catch (error) {
      setStatus("error");
      setMessage(getSubscribeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="communityPage__base" aria-hidden="true" />
      <div className="communityPage__bg" aria-hidden="true" />

      <main className="communityPage">
        <div className="communityPage__decor communityPage__decor--a" aria-hidden="true" />
        <div className="communityPage__decor communityPage__decor--b" aria-hidden="true" />
        <div className="communityPage__decor communityPage__decor--c" aria-hidden="true" />

        <section className="communityHero communityBand">
          <div className="communityWrap communityHero__layout">
            <Reveal className="communityHero__copy" amount={0.3}>
              {(active) => (
                <>
                  <p className="communityHero__eyebrow">Community</p>
                  <div className="communityHero__titleWrap">
                    <h1 className="communityHero__title">
                      <TypewriterTitle text="Community" active={active} />
                    </h1>
                    <motion.svg
                      className="communityHero__line"
                      viewBox="0 0 300 20"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
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

                  <p className="communityHero__sub">
                    Carvver community is being built for Filipino hobbyists,
                    handmade-product makers, casual freelancers, and the
                    customers who want a clearer and safer place to work with them.
                  </p>
                  <p className="communityHero__support">
                    This is not a fake finished ecosystem. It is an early,
                    real community effort around creator visibility, better trust
                    signals, achievements over leaderboards, and calmer
                    escrow-backed transactions.
                  </p>

                  <div className="communityHero__actions">
                    <motion.button
                      type="button"
                      className="communityBtn communityBtn--primary"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => handleScrollTo("community-cta")}
                    >
                      <span>Join the waitlist</span>
                      <ArrowRight className="communityBtn__icon" />
                    </motion.button>

                    <motion.button
                      type="button"
                      className="communityBtn communityBtn--ghost"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      onClick={() => handleScrollTo("community-active")}
                    >
                      What's active now
                    </motion.button>
                  </div>
                </>
              )}
            </Reveal>

            <Reveal className="communityHero__panel" delay={0.08}>
              <div className="communityHero__signalStack">
                {heroSignals.map((signal, index) => (
                  <motion.article
                    key={signal.label}
                    className="communitySignal"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ y: -3 }}
                  >
                    <p className="communitySignal__label">{signal.label}</p>
                    <h2 className="communitySignal__value">{signal.value}</h2>
                    <p className="communitySignal__note">{signal.note}</p>
                  </motion.article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="communityBand communitySection" id="community-active">
          <div className="communityWrap">
            <Reveal>
              <SectionHeading
                eyebrow="What's active now"
                title="How the community starts in a grounded way"
                sub="Right now the focus is simple: gather the right people early, keep feedback loops open, and make Carvver feel more useful with every iteration."
              />
            </Reveal>

            <div className="communityCards">
              {activeNowCards.map(({ title, text, Icon }, index) => (
                <Reveal key={title} delay={0.05 * index}>
                  <motion.article
                    className="communityCard"
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  >
                    <div className="communityCard__iconWrap" aria-hidden="true">
                      <Icon className="communityCard__icon" />
                    </div>
                    <h3 className="communityCard__title">{title}</h3>
                    <p className="communityCard__text">{text}</p>
                  </motion.article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityMeaning">
            <Reveal>
              <SectionHeading
                eyebrow="What community means here"
                title="A shared layer around trust, visibility, and learning"
                sub="Carvver community is not just a place to announce things. It should help creators get seen more clearly, help customers understand the product better, and help the platform keep improving."
              />
            </Reveal>

            <div className="communityMeaning__grid">
              <Reveal delay={0.04}>
                <article className="communityMeaning__feature">
                  <div className="communityMeaning__iconWrap" aria-hidden="true">
                    <BadgeCheck className="communityMeaning__icon" />
                  </div>
                  <div>
                    <h3 className="communityMeaning__title">
                      Achievements over leaderboard pressure
                    </h3>
                    <p className="communityMeaning__text">
                      Carvver favors badges, milestones, and credibility
                      signals that feel rewarding without turning
                      growth into a constant public ranking contest.
                    </p>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.1}>
                <article className="communityMeaning__feature">
                  <div className="communityMeaning__iconWrap" aria-hidden="true">
                    <MapPin className="communityMeaning__icon" />
                  </div>
                  <div>
                    <h3 className="communityMeaning__title">
                      Discovery that feels more local and more human
                    </h3>
                    <p className="communityMeaning__text">
                      Location-aware browsing, clearer profiles, verified badges,
                      and better feedback loops help both sides make calmer,
                      more informed decisions.
                    </p>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.16}>
                <article className="communityMeaning__feature">
                  <div className="communityMeaning__iconWrap" aria-hidden="true">
                    <ShieldCheck className="communityMeaning__icon" />
                  </div>
                  <div>
                    <h3 className="communityMeaning__title">
                      Safer transactions stay part of the culture
                    </h3>
                    <p className="communityMeaning__text">
                      Few-click posting and community growth matter, but the
                      platform still has to protect trust at checkout through
                      clearer expectations and escrow-backed handling.
                    </p>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap">
            <Reveal>
              <SectionHeading
                eyebrow="Participation lanes"
                title="Who can shape this early"
                sub="We want community to serve the people offering work, the people buying work, and the people willing to help a young startup make sharper decisions."
              />
            </Reveal>

            <div className="communityLanes">
              {participationLanes.map(({ title, text, Icon }, index) => (
                <Reveal key={title} delay={0.06 * index}>
                  <article className="communityLane">
                    <div className="communityLane__labelRow">
                      <span className="communityLane__iconWrap" aria-hidden="true">
                        <Icon className="communityLane__icon" />
                      </span>
                      <h3 className="communityLane__title">{title}</h3>
                    </div>
                    <p className="communityLane__text">{text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityStandards">
            <Reveal>
              <SectionHeading
                eyebrow="Community standards"
                title="The tone should stay respectful, useful, and real"
                sub="Community should feel supportive without becoming vague, and honest without becoming hostile. That is especially important while the product is still early."
              />
            </Reveal>

            <div className="communityStandards__grid">
              {standards.map((item, index) => (
                <Reveal key={item.title} delay={0.05 * index}>
                  <article className="communityStandard">
                    <div className="communityStandard__top">
                      <span className="communityStandard__dot" aria-hidden="true" />
                      <h3 className="communityStandard__title">{item.title}</h3>
                    </div>
                    <p className="communityStandard__text">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityRoadmap">
            <Reveal>
              <SectionHeading
                eyebrow="What comes next"
                title="A light roadmap, not overclaimed activity"
                sub="We are keeping the roadmap honest. These are the kinds of community touchpoints that make sense as Carvver earns more traction."
              />
            </Reveal>

            <div className="communityRoadmap__list">
              {roadmapNotes.map((item, index) => (
                <Reveal key={item.title} delay={0.05 * index}>
                  <article className="communityRoadmap__item">
                    <span className="communityRoadmap__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="communityRoadmap__copy">
                      <h3 className="communityRoadmap__title">{item.title}</h3>
                      <p className="communityRoadmap__text">{item.text}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="communityBand communitySection communitySection--cta" id="community-cta">
          <div className="communityWrap">
            <Reveal>
              <div className="communityCta">
                <div className="communityCta__copy">
                  <p className="communitySectionHead__eyebrow">Join early</p>
                  <div className="communitySectionHead__titleWrap">
                    <h2 className="communitySectionHead__title">
                      Be part of the community while it is still taking shape
                    </h2>
                    <motion.svg
                      className="communitySectionHead__line"
                      viewBox="0 0 300 20"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
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
                  <p className="communityCta__text">
                    Join the waitlist if you want early updates, future feedback
                    invites, and a closer view of how Carvver grows.
                  </p>
                </div>

                <form className="communityCta__form" onSubmit={handleSubmit} noValidate>
                  <label className="communityCta__label" htmlFor="community-email">
                    Email address
                  </label>

                  <div
                    className={`communityCta__field ${
                      status === "error"
                        ? "communityCta__field--error"
                        : status === "success"
                        ? "communityCta__field--success"
                        : ""
                    }`}
                  >
                    <input
                      id="community-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      className="communityCta__input"
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
                      className="communityBtn communityBtn--primary communityBtn--submit"
                      whileHover={isSubmitting ? {} : { y: -2, scale: 1.01 }}
                      whileTap={isSubmitting ? {} : { scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      disabled={isSubmitting}
                    >
                      <span>
                        {isSubmitting ? "Joining..." : "Join the waitlist"}
                      </span>
                      {isSubmitting ? (
                        <LoaderCircle className="communityBtn__icon communityBtn__icon--spin" />
                      ) : status === "success" ? (
                        <Check className="communityBtn__icon" />
                      ) : (
                        <ArrowRight className="communityBtn__icon" />
                      )}
                    </motion.button>
                  </div>

                  <p
                    className={`communityCta__feedback ${
                      status === "error"
                        ? "communityCta__feedback--error"
                        : status === "success"
                        ? "communityCta__feedback--success"
                        : ""
                    }`}
                    aria-live="polite"
                  >
                    {message || "We will only use this to send community and product updates."}
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
