import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import "./features_page.css";

const AUTO_PLAY_INTERVAL = 3600;
const CHIP_HEIGHT = 68;

const FEATURE_SPOTLIGHTS = [
  {
    id: "escrow",
    label: "Escrow-backed transactions",
    imageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1400&auto=format&fit=crop",
    description:
      "Payments are held first so customers can confirm delivery before money is released.",
  },
  {
    id: "posting",
    label: "Few-click posting",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1400&auto=format&fit=crop",
    description:
      "Creators can push one listing outward instead of rebuilding the same promotion across multiple social platforms.",
  },
  {
    id: "verified",
    label: "Verified badges",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1400&auto=format&fit=crop",
    description:
      "Providers can earn a stronger trust signal after legitimacy review.",
  },
  {
    id: "badges",
    label: "Achievements and badges",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop",
    description:
      "Progress feels rewarding without turning the platform into a leaderboard race.",
  },
  {
    id: "location",
    label: "Location-based discovery",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
    description:
      "Customers can look for nearby providers when distance and on-site work matter.",
  },
  {
    id: "portfolio",
    label: "Portfolio-rich listings",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop",
    description:
      "Profiles and listings support samples, teasers, and clearer proof of work.",
  },
  {
    id: "messaging",
    label: "Direct messaging",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1400&auto=format&fit=crop",
    description:
      "Customers and providers can clarify scope in one place instead of scattered social DMs.",
  },
  {
    id: "requests",
    label: "Customer requests",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop",
    description:
      "Customers can post what they need and let providers respond with interest.",
  },
];

const DIFFERENCE_ITEMS = [
  {
    id: "01",
    title: "Safer payments",
    text:
      "Carvver holds payment first, adds clearer confirmation points, and gives both sides a steadier path when something needs review or refund handling.",
  },
  {
    id: "02",
    title: "Trust that reads faster",
    text:
      "Verified badges, reviews, visible proof, and profile signals help customers understand credibility without digging through several apps first.",
  },
  {
    id: "03",
    title: "Better local discovery",
    text:
      "Categories and location-aware browsing help people find nearby providers faster, especially for on-site work or orders where distance matters.",
  },
  {
    id: "04",
    title: "A calmer growth model",
    text:
      "Achievements and badges make progress feel visible and rewarding without turning the platform into a noisy ranking contest.",
  },
  {
    id: "05",
    title: "Promotion that travels",
    text:
      "Few-click posting helps creators extend one listing outward instead of rebuilding the same pitch again and again across social channels.",
  },
  {
    id: "06",
    title: "One place for the real workflow",
    text:
      "Listings, chat, customer requests, and transactions live together in one clearer product surface instead of being split across posts, comments, and DMs.",
  },
];

function getSignedOffset(index, activeIndex, total) {
  const raw = index - activeIndex;
  const alt = raw > 0 ? raw - total : raw + total;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
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
    <div className="featuresSectionHead">
      <div className="featuresSectionHead__titleWrap">
        <h2 className="featuresSectionHead__title">{title}</h2>
        <AccentLine className="featuresSectionHead__line" />
      </div>
    </div>
  );
}

function FeatureSpotlight({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (reduceMotion || isPaused || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, AUTO_PLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused, items.length, reduceMotion]);

  return (
    <div className="featuresSpotlight">
      <div className="featuresSpotlight__shell">
        <div
          className="featuresSpotlight__rail"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="featuresSpotlight__railFade featuresSpotlight__railFade--top" aria-hidden="true" />
          <div className="featuresSpotlight__railFade featuresSpotlight__railFade--bottom" aria-hidden="true" />
          <div className="featuresSpotlight__railTrack">
            {items.map((item, index) => {
              const offset = getSignedOffset(index, activeIndex, items.length);
              const isActive = offset === 0;

              return (
                <Motion.div
                  key={item.id}
                  className="featuresSpotlight__chipWrap"
                  style={{ height: CHIP_HEIGHT }}
                  animate={{
                    y: offset * CHIP_HEIGHT,
                    opacity: 1 - Math.min(Math.abs(offset) * 0.2, 0.72),
                    scale: isActive ? 1 : 0.94,
                  }}
                  transition={{ type: "spring", stiffness: 92, damping: 24, mass: 1 }}
                >
                  <button
                    type="button"
                    className={`featuresSpotlight__chip ${
                      isActive ? "featuresSpotlight__chip--active" : ""
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="featuresSpotlight__chipLabel">{item.label}</span>
                  </button>
                </Motion.div>
              );
            })}
          </div>
        </div>

        <div
          className="featuresSpotlight__stage"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <Motion.article
              key={activeItem.id}
              className="featuresSpotlight__card"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 1.01 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={activeItem.imageUrl}
                alt={activeItem.label}
                className="featuresSpotlight__image"
                loading="lazy"
              />
              <div className="featuresSpotlight__veil" aria-hidden="true" />
              <div className="featuresSpotlight__copy">
                <p className="featuresSpotlight__counter">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </p>
                <h3 className="featuresSpotlight__title">{activeItem.label}</h3>
                <p className="featuresSpotlight__text">{activeItem.description}</p>
              </div>
            </Motion.article>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ item, open, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <Motion.article
      layout
      className={`featuresAccordion__item ${open ? "featuresAccordion__item--open" : ""}`}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <button type="button" className="featuresAccordion__trigger" onClick={() => onToggle(item.id)}>
        <span className="featuresAccordion__index" aria-hidden="true">
          {item.id}
        </span>
        <span className="featuresAccordion__title">{item.title}</span>
        <ChevronDown
          className={`featuresAccordion__chevron ${open ? "featuresAccordion__chevron--open" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <Motion.div
            key="content"
            className="featuresAccordion__content"
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="featuresAccordion__body">{item.text}</p>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </Motion.article>
  );
}

export default function FeaturesPage() {
  const [openItem, setOpenItem] = useState("01");

  return (
    <>
      <div className="featuresPage__base" aria-hidden="true" />
      <div className="featuresPage__bg" aria-hidden="true" />

      <main className="featuresPage">
        <div className="featuresPage__decor featuresPage__decor--a" aria-hidden="true" />
        <div className="featuresPage__decor featuresPage__decor--b" aria-hidden="true" />
        <div className="featuresPage__decor featuresPage__decor--c" aria-hidden="true" />

        <section className="featuresHero featuresBand">
          <div className="featuresWrap featuresHero__layout">
            <Reveal className="featuresHero__copy" amount={0.3}>
              <>
                <div className="featuresHero__titleWrap">
                  <h1 className="featuresHero__title">Features</h1>
                  <AccentLine className="featuresHero__line" />
                </div>
                <p className="featuresHero__sub">
                  See how Carvver helps creators get discovered, build trust faster, and move
                  real work from listing to payout in one clearer flow.
                </p>
              </>
            </Reveal>
          </div>
        </section>

        <section className="featuresBand featuresSection">
          <div className="featuresWrap">
            <Reveal>
              <SectionHeading title="What Carvver Gives You" />
            </Reveal>
            <Reveal delay={0.06}>
              <FeatureSpotlight items={FEATURE_SPOTLIGHTS} />
            </Reveal>
          </div>
        </section>

        <section className="featuresBand featuresSection">
          <div className="featuresWrap">
            <Reveal>
              <SectionHeading title="Why It Feels Different" />
            </Reveal>
            <div className="featuresAccordion">
              {DIFFERENCE_ITEMS.map((item, index) => (
                <Reveal key={item.id} delay={0.05 * index}>
                  <AccordionItem
                    item={item}
                    open={openItem === item.id}
                    onToggle={(id) => setOpenItem((current) => (current === id ? "" : id))}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
