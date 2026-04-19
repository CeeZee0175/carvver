import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import "./home_community.css";

const supabase = createClient();
const NEWSLETTER_TABLE = "newsletter_signups";

const meaningItems = [
  {
    id: "01",
    title: "Achievements over leaderboard pressure",
    text:
      "Carvver favors badges, milestones, and credibility signals that feel rewarding without turning growth into a constant public ranking contest.",
  },
  {
    id: "02",
    title: "Discovery that feels more local and more human",
    text:
      "Location-aware browsing, clearer profiles, verified badges, and better feedback loops help both sides make calmer, more informed decisions.",
  },
  {
    id: "03",
    title: "Safer transactions stay part of the culture",
    text:
      "Few-click posting and community growth matter, but the platform still has to protect trust at checkout through clearer expectations and escrow-backed handling.",
  },
];

const participationLanes = [
  {
    id: "lane-1",
    title: "Creators",
    text:
      "Join if you make handmade products, offer services, or want a cleaner home for your work than a scattered social feed.",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "lane-2",
    title: "Customers",
    text:
      "Join if you want a better way to discover trustworthy providers, compare clearer signals, and help shape a safer service marketplace.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "lane-3",
    title: "Early contributors",
    text:
      "Join if you like giving grounded feedback, testing early ideas, and helping a startup decide what is actually useful before it scales.",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop",
  },
];

const standards = [
  {
    id: "standard-1",
    title: "Useful over noisy",
    text:
      "Community participation should help someone make a better decision, improve a listing, or understand the product more clearly.",
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "standard-2",
    title: "Trust is earned visibly",
    text:
      "Badges, reviews, verified signals, and respectful communication matter more here than empty hype or inflated status.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "standard-3",
    title: "Respect the people still growing",
    text:
      "Carvver is for people building momentum. That means we keep the tone welcoming to beginners without lowering the bar on honesty or quality.",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "standard-4",
    title: "Safer transactions stay central",
    text:
      "Escrow-backed handling, clearer expectations, and good communication are part of the culture, not just the checkout flow.",
    imageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1400&auto=format&fit=crop",
  },
];

const roadmapNotes = [
  {
    id: "01",
    title: "Feedback circles",
    text:
      "Small, direct product conversations with early creators and customers as the platform matures.",
  },
  {
    id: "02",
    title: "Creator spotlights",
    text:
      "More intentional ways to surface promising makers and service providers without turning the platform into a leaderboard race.",
  },
  {
    id: "03",
    title: "Lightweight sessions",
    text:
      "Practical sharing around profile building, posting strategy, trust signals, and making the most of Carvver's tools.",
  },
  {
    id: "04",
    title: "Future showcases",
    text:
      "A clearer place to celebrate progress, featured work, and community milestones once the foundation is ready for it.",
  },
];

function wrapIndex(total, value) {
  if (total <= 0) return 0;
  return ((value % total) + total) % total;
}

function getSignedOffset(index, activeIndex, total) {
  const raw = index - activeIndex;
  const alt = raw > 0 ? raw - total : raw + total;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
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

function SectionHeading({ title }) {
  return (
    <div className="communitySectionHead">
      <div className="communitySectionHead__titleWrap">
        <h2 className="communitySectionHead__title">{title}</h2>
        <AccentLine className="communitySectionHead__line" />
      </div>
    </div>
  );
}

function AccordionItem({ item, open, onToggle, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <Motion.article
      layout
      className={`communityAccordion__item ${open ? "communityAccordion__item--open" : ""} ${className}`}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <button type="button" className="communityAccordion__trigger" onClick={() => onToggle(item.id)}>
        <span className="communityAccordion__index" aria-hidden="true">
          {item.id}
        </span>
        <span className="communityAccordion__title">{item.title}</span>
        <ChevronDown
          className={`communityAccordion__chevron ${
            open ? "communityAccordion__chevron--open" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <Motion.div
            key="content"
            className="communityAccordion__content"
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="communityAccordion__body">{item.text}</p>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </Motion.article>
  );
}

function ParticipationStack({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(items.length, current + 1));
    }, 4800);

    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  return (
    <div className="communityStack">
      <div className="communityStack__stage">
        {items.map((item, index) => {
          const offset = getSignedOffset(index, activeIndex, items.length);
          const absOffset = Math.abs(offset);
          if (absOffset > 1) return null;

          const isActive = offset === 0;

          return (
            <Motion.button
              key={item.id}
              type="button"
              className={`communityStack__card ${
                isActive ? "communityStack__card--active" : "communityStack__card--side"
              }`}
              onClick={() => setActiveIndex(index)}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              animate={{
                x: offset * 160,
                y: isActive ? 0 : 20,
                rotate: offset * 8,
                scale: isActive ? 1 : 0.9,
                opacity: isActive ? 1 : 0.66,
                zIndex: isActive ? 3 : 2 - absOffset,
              }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
            >
              <img src={item.imageUrl} alt={item.title} className="communityStack__image" loading="lazy" />
              <div className="communityStack__veil" aria-hidden="true" />
              <div className="communityStack__content">
                <h3 className="communityStack__title">{item.title}</h3>
                <p className="communityStack__text">{item.text}</p>
              </div>
            </Motion.button>
          );
        })}
      </div>

      <div className="communityStack__footer">
        <div className="communityStack__meta">
          <p className="communityStack__activeLabel">{activeItem?.title}</p>
          <div className="communityStack__dots communityStack__dots--panel">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`communityStack__dot ${
                  index === activeIndex ? "communityStack__dot--active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.title}`}
              />
            ))}
          </div>
        </div>

        <div className="communityStack__arrowRow">
          <button
            type="button"
            className="communityStack__arrow"
            onClick={() => setActiveIndex((current) => wrapIndex(items.length, current - 1))}
            aria-label="Previous lane"
          >
            <ArrowLeft className="communityStack__arrowIcon" />
          </button>

          <button
            type="button"
            className="communityStack__arrow"
            onClick={() => setActiveIndex((current) => wrapIndex(items.length, current + 1))}
            aria-label="Next lane"
          >
            <ArrowRight className="communityStack__arrowIcon" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StandardsSpotlight({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  const showPrevious = () => {
    setActiveIndex((current) => wrapIndex(items.length, current - 1));
  };

  const showNext = () => {
    setActiveIndex((current) => wrapIndex(items.length, current + 1));
  };

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(items.length, current + 1));
    }, 5200);

    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  return (
    <div className="communityStandardsSpotlight">
      <AnimatePresence mode="wait">
        <Motion.article
          key={activeItem.id}
          className="communityStandardsSpotlight__panel"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01, y: -8 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={activeItem.imageUrl}
            alt={activeItem.title}
            className="communityStandardsSpotlight__image"
            loading="lazy"
          />
          <div className="communityStandardsSpotlight__veil" aria-hidden="true" />
          <div className="communityStandardsSpotlight__content">
            <p className="communityStandardsSpotlight__counter">
              {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </p>
            <h3 className="communityStandardsSpotlight__title">{activeItem.title}</h3>
            <p className="communityStandardsSpotlight__text">{activeItem.text}</p>
          </div>
          <button
            type="button"
            className="communityStandardsSpotlight__arrow communityStandardsSpotlight__arrow--left"
            onClick={showPrevious}
            aria-label="Previous community standard"
          >
            <ArrowLeft className="communityStandardsSpotlight__arrowIcon" />
          </button>
          <button
            type="button"
            className="communityStandardsSpotlight__arrow communityStandardsSpotlight__arrow--right"
            onClick={showNext}
            aria-label="Next community standard"
          >
            <ArrowRight className="communityStandardsSpotlight__arrowIcon" />
          </button>
          <div className="communityStandardsSpotlight__pager" aria-label="Community standards navigation">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`communityStandardsSpotlight__dot ${
                  index === activeIndex ? "communityStandardsSpotlight__dot--active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.title}`}
              />
            ))}
          </div>
        </Motion.article>
      </AnimatePresence>
    </div>
  );
}

export default function HomeCommunity() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [openMeaning, setOpenMeaning] = useState("01");
  const [openRoadmap, setOpenRoadmap] = useState("01");

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
              <>
                <div className="communityHero__titleWrap">
                  <h1 className="communityHero__title">Community</h1>
                  <AccentLine className="communityHero__line" />
                </div>
                <p className="communityHero__sub">
                  Follow the people, updates, and conversations helping Carvver grow into a more
                  trustworthy place for creators and customers to work together.
                </p>
              </>
            </Reveal>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityMeaning">
            <Reveal>
              <SectionHeading title="What community means here" />
            </Reveal>

            <div className="communityAccordion">
              {meaningItems.map((item, index) => (
                <Reveal key={item.id} delay={0.05 * index}>
                  <AccordionItem
                    item={item}
                    open={openMeaning === item.id}
                    onToggle={(id) => setOpenMeaning((current) => (current === id ? "" : id))}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityParticipation">
            <Reveal>
              <SectionHeading title="Where You Fit In" />
            </Reveal>
            <Reveal delay={0.06}>
              <ParticipationStack items={participationLanes} />
            </Reveal>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityStandards">
            <Reveal>
              <SectionHeading title="Community standards" />
            </Reveal>
            <Reveal delay={0.06}>
              <StandardsSpotlight items={standards} />
            </Reveal>
          </div>
        </section>

        <section className="communityBand communitySection">
          <div className="communityWrap communityRoadmap">
            <Reveal>
              <SectionHeading title="What comes next" />
            </Reveal>

            <div className="communityAccordion communityAccordion--roadmap">
              {roadmapNotes.map((item, index) => (
                <Reveal key={item.id} delay={0.05 * index}>
                  <AccordionItem
                    item={item}
                    open={openRoadmap === item.id}
                    onToggle={(id) => setOpenRoadmap((current) => (current === id ? "" : id))}
                    className="communityAccordion__item--soft"
                  />
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
                  <div className="communityCta__titleWrap">
                    <h2 className="communityCta__title">Be part of the community while it is still taking shape</h2>
                    <AccentLine className="communityCta__line" />
                  </div>
                  <p className="communityCta__text">
                    Join the waitlist if you want early updates, future feedback invites, and a
                    closer view of how Carvver grows.
                  </p>
                </div>

                <form className="communityCta__form" onSubmit={handleSubmit} noValidate>
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
                      placeholder="Email address"
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

                    <Motion.button
                      type="submit"
                      className="communityBtn communityBtn--primary communityBtn--submit"
                      whileHover={isSubmitting ? {} : { y: -2, scale: 1.01 }}
                      whileTap={isSubmitting ? {} : { scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? "Joining..." : "Join the waitlist"}</span>
                      {isSubmitting ? (
                        <LoaderCircle className="communityBtn__icon communityBtn__icon--spin" />
                      ) : status === "success" ? (
                        <Check className="communityBtn__icon" />
                      ) : (
                        <ArrowRight className="communityBtn__icon" />
                      )}
                    </Motion.button>
                  </div>

                  <div className="communityCta__feedbackWrap" aria-live="polite">
                    {message ? (
                      <p
                        className={`communityCta__feedback ${
                          status === "error"
                            ? "communityCta__feedback--error"
                            : status === "success"
                            ? "communityCta__feedback--success"
                            : ""
                        }`}
                      >
                        {message}
                      </p>
                    ) : null}
                  </div>
                </form>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
