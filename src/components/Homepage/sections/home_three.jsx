import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  BadgeCheck,
  CreditCard,
  Image,
  Search,
  Share2,
  ShieldCheck,
} from "lucide-react";
import "./home_three.css";

const CUSTOMER_CARDS = [
  {
    id: "customer-1",
    step: "01",
    title: "Discover services faster",
    description:
      "Browse categories, filter by location, and find service providers without jumping across multiple social media platforms.",
    Icon: Search,
    accent: "rgba(124,58,237,0.92)",
    glow: "rgba(124,58,237,0.12)",
  },
  {
    id: "customer-2",
    step: "02",
    title: "Choose with more confidence",
    description:
      "Check profiles, reviews, badges, and verified providers to better understand who you are hiring.",
    Icon: ShieldCheck,
    accent: "rgba(42,20,80,0.92)",
    glow: "rgba(42,20,80,0.10)",
  },
  {
    id: "customer-3",
    step: "03",
    title: "Pay securely and receive your service",
    description:
      "Payments are held securely first, helping reduce scams and making refunds easier when issues are proven.",
    Icon: CreditCard,
    accent: "rgba(242,193,78,0.98)",
    glow: "rgba(242,193,78,0.14)",
  },
];

const PROVIDER_CARDS = [
  {
    id: "provider-1",
    step: "01",
    title: "Create your listing and showcase your work",
    description:
      "Set up your profile, describe your service, and upload samples, screenshots, or teasers to attract customers.",
    Icon: Image,
    accent: "rgba(124,58,237,0.92)",
    glow: "rgba(124,58,237,0.12)",
  },
  {
    id: "provider-2",
    step: "02",
    title: "Build trust and get discovered",
    description:
      "Earn achievements, badges, and even a verified badge to strengthen your credibility within the platform.",
    Icon: BadgeCheck,
    accent: "rgba(42,20,80,0.92)",
    glow: "rgba(42,20,80,0.10)",
  },
  {
    id: "provider-3",
    step: "03",
    title: "Share, communicate, and grow",
    description:
      "Promote your listing inside Carvver and across social media, talk directly with customers, and manage your service requests more easily.",
    Icon: Share2,
    accent: "rgba(242,193,78,0.98)",
    glow: "rgba(242,193,78,0.14)",
  },
];

const SWIPE_THRESHOLD = 70;

function TypewriterTitle({ id, text = "How It Works", active }) {
  const [displayText, setDisplayText] = useState("");
  const startedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, 88);
      }
    };

    timeoutId = setTimeout(tick, 140);

    return () => clearTimeout(timeoutId);
  }, [active, reduceMotion, text]);

  return (
    <div className="homeThreeTitle">
      <div className="homeThreeTitle__wrap">
        <h2 id={id} className="homeThree__title">
          <span>{displayText}</span>

          {!reduceMotion && (
            <motion.span
              className="homeThree__cursor"
              aria-hidden="true"
              animate={{ opacity: [1, 0, 1] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              |
            </motion.span>
          )}
        </h2>

        <motion.svg
          className="homeThree__underline"
          viewBox="0 0 300 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            d="M 0,10 L 300,10"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              active
                ? {
                    pathLength: 1,
                    opacity: 1,
                  }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              pathLength: { duration: 1.1, ease: "easeInOut" },
              opacity: { duration: 0.35 },
            }}
          />
        </motion.svg>
      </div>
    </div>
  );
}

function RoleToggle({ value, onChange }) {
  return (
    <div className="homeThreeToggle" role="tablist" aria-label="How it works audience">
      <div className="homeThreeToggle__inner">
        <div className="homeThreeToggle__slot">
          {value === "customer" && (
            <motion.span
              layoutId="homeThreeToggleLine"
              className="homeThreeToggle__line"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}

          <motion.button
            type="button"
            role="tab"
            aria-selected={value === "customer"}
            className={`homeThreeToggle__btn ${value === "customer" ? "homeThreeToggle__btn--active" : ""}`}
            onClick={() => onChange("customer")}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
          >
            Customer
          </motion.button>
        </div>

        <span className="homeThreeToggle__sep" aria-hidden="true">
          |
        </span>

        <div className="homeThreeToggle__slot">
          {value === "provider" && (
            <motion.span
              layoutId="homeThreeToggleLine"
              className="homeThreeToggle__line"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}

          <motion.button
            type="button"
            role="tab"
            aria-selected={value === "provider"}
            className={`homeThreeToggle__btn ${value === "provider" ? "homeThreeToggle__btn--active" : ""}`}
            onClick={() => onChange("provider")}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
          >
            Service Providers
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function VerticalCardStack({ cards, stackKey, inView }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragReady, setDragReady] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [stackKey]);

  useEffect(() => {
    if (!inView) return;

    setDragReady(false);

    const timer = setTimeout(() => {
      setDragReady(true);
    }, reduceMotion ? 0 : 420);

    return () => clearTimeout(timer);
  }, [inView, stackKey, reduceMotion]);

  const displayCards = useMemo(() => {
    const reordered = [];

    for (let i = 0; i < cards.length; i += 1) {
      const index = (activeIndex + i) % cards.length;
      reordered.push({ ...cards[index], stackPosition: i });
    }

    return reordered.reverse();
  }, [cards, activeIndex]);

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.y) * velocity.y;

    if (offset.y < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % cards.length);
      return;
    }

    if (offset.y > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
  };

  return (
    <div className="homeThreeStack">
      <motion.div
        className="homeThreeStack__stage"
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.14 }}
      >
        <LayoutGroup id={`homeThreeStack-${stackKey}`}>
          <AnimatePresence initial={false} mode="popLayout">
            {displayCards.map((card) => {
              const isTopCard = card.stackPosition === 0;
              const Icon = card.Icon;

              return (
                <motion.article
                  key={`${stackKey}-${card.id}`}
                  layout="position"
                  className={`homeThreeCard ${isTopCard ? "homeThreeCard--top" : ""}`}
                  style={{
                    zIndex: cards.length - card.stackPosition,
                    "--card-accent": card.accent,
                    "--card-glow": card.glow,
                  }}
                  initial={false}
                  animate={{
                    opacity: 1 - card.stackPosition * 0.12,
                    scale: 1 - card.stackPosition * 0.045,
                    y: card.stackPosition * 22,
                  }}
                  exit={{ opacity: 0, scale: 0.96, y: -26 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 30,
                  }}
                  drag={isTopCard && dragReady && !reduceMotion ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.14}
                  dragMomentum={false}
                  dragSnapToOrigin
                  onDragEnd={handleDragEnd}
                  whileDrag={
                    reduceMotion
                      ? undefined
                      : {
                          scale: 1.015,
                          boxShadow: "0 30px 100px rgba(12,7,18,0.18)",
                        }
                  }
                  whileTap={reduceMotion ? undefined : { scale: isTopCard ? 0.992 : 1 }}
                >
                  <div className="homeThreeCard__top">
                    <span className="homeThreeCard__step">Step {card.step}</span>

                    <span className="homeThreeCard__iconWrap" aria-hidden="true">
                      <Icon className="homeThreeCard__icon" />
                    </span>
                  </div>

                  <div className="homeThreeCard__bar" aria-hidden="true" />

                  <h3 className="homeThreeCard__title">{card.title}</h3>

                  <p className="homeThreeCard__desc">{card.description}</p>

                  {isTopCard && dragReady && (
                    <div className="homeThreeCard__hint">Drag up or down</div>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>

      <div className="homeThreeDots" aria-label="Stack navigation">
        {cards.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`homeThreeDots__btn ${index === activeIndex ? "homeThreeDots__btn--active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomeThree() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.42, once: true });
  const [role, setRole] = useState("customer");

  const cards = role === "customer" ? CUSTOMER_CARDS : PROVIDER_CARDS;

  return (
    <section className="homeThree" ref={ref} aria-labelledby="homeThree-title">
      <div className="homeThree__inner">
        <TypewriterTitle id="homeThree-title" text="How It Works" active={inView} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.18 }}
        >
          <RoleToggle value={role} onChange={setRole} />
        </motion.div>

        <VerticalCardStack cards={cards} stackKey={role} inView={inView} />
      </div>
    </section>
  );
}
