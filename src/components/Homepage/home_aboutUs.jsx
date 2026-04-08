import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Compass,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import "./home_aboutUs.css";

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const storyCards = [
  {
    title: "Built for Filipino creators still growing",
    text:
      "Carvver was shaped for skilled hobbyists, handmade-product makers, and casual freelancers who are good enough to be hired, but often get overshadowed on larger global marketplaces.",
  },
  {
    title: "A calmer home than scattered social feeds",
    text:
      "Instead of forcing creators and customers to bounce across several platforms, Carvver keeps listings, profiles, proof, reviews, and communication in one clearer place.",
  },
  {
    title: "Progress should feel rewarding, not punishing",
    text:
      "The platform favors achievements and badges over leaderboards so users can build credibility over time without feeling pushed into a constant public competition.",
  },
];

const pillars = [
  {
    title: "Few-click posting",
    text:
      "Service providers can publish a listing once, then push that same offer outward to social platforms where their audience already pays attention.",
    Icon: Share2,
  },
  {
    title: "Verified badges",
    text:
      "Verification gives customers a quicker way to read legitimacy while helping honest providers earn trust without overexplaining themselves every time.",
    Icon: BadgeCheck,
  },
  {
    title: "Location services",
    text:
      "Customers can narrow discovery around nearby providers, which matters especially for on-site work and any service where time and distance affect the experience.",
    Icon: MapPin,
  },
  {
    title: "Escrow-backed safety",
    text:
      "Payments are held first, then released after the work is completed and confirmed, which lowers scam risk and makes refunds easier to handle when something goes wrong.",
    Icon: ShieldCheck,
  },
];

const audienceLanes = [
  {
    title: "For service providers",
    text:
      "Carvver gives skilled hobbyists and casual freelancers a dedicated place to showcase work, manage customers, build credibility, and promote themselves more efficiently.",
  },
  {
    title: "For customers",
    text:
      "Customers get a simpler way to discover trustworthy people, compare real signals, read reviews, narrow by location, and pay through a safer escrow-style flow.",
  },
];

const flowSteps = [
  "Create a service listing once inside Carvver.",
  "Push that same listing outward in a few clicks to the social platforms that already bring attention.",
  "Bring customers back to one trusted home for reviews, chat, proof of work, and safer payment handling.",
];

const accordionItems = [
  {
    id: "01",
    title: "Why beginners need a fairer starting point",
    body:
      "Carvver gives skilled hobbyists and casual freelancers a place to begin seriously without needing to compete head-to-head with large agencies or already established global sellers.",
  },
  {
    id: "02",
    title: "How trust becomes easier to read here",
    body:
      "Verified badges, visible achievements, clearer profiles, honest reviews, and proof-backed escrow handling help customers understand who feels credible before they commit.",
  },
  {
    id: "03",
    title: "Why promotion should take fewer steps",
    body:
      "Few-click posting exists because creators should not have to rewrite the same offer across multiple social platforms just to reach enough people to be discovered.",
  },
  {
    id: "04",
    title: "What customers gain more clearly",
    body:
      "Customers get quicker discovery, easier comparison, location-aware browsing, customer-side support, and a safer transaction flow that does not immediately release payment before the work is confirmed.",
  },
];

const founders = [
  {
    name: "Carl Edray N. Cardinal",
    role: "Founder & CEO",
    quote:
      "Carvver should be the place where talented hobbyists and casual freelancers feel taken seriously before the market expects them to look like a full studio.",
    bio:
      "Carl anchors the vision of Carvver around creator opportunity, clearer trust, and a platform that helps Filipino providers grow without being buried by larger marketplaces.",
    imageSrc: "",
  },
  {
    name: "Shaira Brillantes",
    role: "Co-founder & Chief Product Officer",
    quote:
      "The product should feel welcoming from the first listing, but still structured enough that customers can trust what they are seeing.",
    bio:
      "Shaira focuses on how the platform feels in use, making sure discovery, profile clarity, and milestone-driven credibility work together as one coherent customer and provider experience.",
    imageSrc: "",
  },
  {
    name: "Geoff Montua",
    role: "Co-founder & Chief Technology Officer",
    quote:
      "A creator-first platform only works if the foundation is stable enough to support safer transactions, clearer proof, and smoother day-to-day use.",
    bio:
      "Geoff helps shape the technical backbone behind Carvver, from the web experience itself to the features that make few-click posting and escrow-backed workflows viable at scale.",
    imageSrc: "",
  },
  {
    name: "Angelo Nollano",
    role: "Co-founder & Chief Operations Officer",
    quote:
      "Trust cannot live in the interface alone; it also has to show up in how the platform is reviewed, moderated, and supported behind the scenes.",
    bio:
      "Angelo represents the operational side of Carvver, helping define how moderation, verification flow, and smoother platform support can make the marketplace feel safer for both sides.",
    imageSrc: "",
  },
  {
    name: "Jhoanis Paulo Zuñiga",
    role: "Co-founder & Chief Growth & Marketing Officer",
    quote:
      "Growth should not depend on creators shouting louder than everyone else. The platform should help them travel further without losing clarity.",
    bio:
      "Jhoanis Paulo shapes how Carvver reaches people, tying together social visibility, creator promotion, and the few-click posting direction that expands discovery beyond one platform.",
    imageSrc: "",
  },
  {
    name: "Mark Caraballe",
    role: "Co-founder & Community Partnerships Lead",
    quote:
      "A community-driven platform gets stronger when the people using it feel heard early, especially while the product is still learning what the market needs most.",
    bio:
      "Mark brings the community and partnership lens, reinforcing Carvver's early-adopter energy through local outreach, user feedback, and the collaborative direction described in the concept paper.",
    imageSrc: "",
  },
];

function wrapIndex(total, value) {
  if (total <= 0) return 0;
  return ((value % total) + total) % total;
}

function getFounderInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function calculateFounderGap(width) {
  const minWidth = 320;
  const maxWidth = 820;
  const minGap = 110;
  const maxGap = 250;

  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return maxGap;

  return minGap + ((maxGap - minGap) * (width - minWidth)) / (maxWidth - minWidth);
}

function TypewriterText({
  text,
  speed = 80,
  initialDelay = 120,
  className = "",
  showCursor = true,
}) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    setDisplayText("");

    let timeoutId = null;
    let index = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, speed, initialDelay, reduceMotion]);

  return (
    <span className={className}>
      {displayText}
      {!reduceMotion && showCursor && displayText.length < text.length && (
        <motion.span
          className="aboutUs__cursor"
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

function TextScramble({
  text,
  duration = 0.82,
  speed = 0.04,
  characterSet = SCRAMBLE_CHARS,
  className = "",
  as: Component = "p",
  trigger = true,
  startDelay = 0,
}) {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      hasCompletedRef.current = true;
      return;
    }

    if (!trigger || hasCompletedRef.current) return;

    let intervalId = null;
    let timeoutId = null;
    let cancelled = false;
    const totalSteps = Math.max(1, Math.ceil(duration / speed));

    const start = () => {
      let step = 0;

      intervalId = setInterval(() => {
        if (cancelled) return;

        const progress = step / totalSteps;
        let scrambled = "";

        for (let i = 0; i < text.length; i += 1) {
          if (text[i] === " ") {
            scrambled += " ";
            continue;
          }

          if (progress * text.length > i) {
            scrambled += text[i];
          } else {
            scrambled += characterSet[Math.floor(Math.random() * characterSet.length)];
          }
        }

        setDisplayText(scrambled);
        step += 1;

        if (step > totalSteps) {
          clearInterval(intervalId);
          intervalId = null;
          setDisplayText(text);
          hasCompletedRef.current = true;
        }
      }, speed * 1000);
    };

    setDisplayText(text);
    timeoutId = setTimeout(start, startDelay);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [characterSet, duration, reduceMotion, speed, startDelay, text, trigger]);

  return <Component className={className}>{displayText}</Component>;
}

function Reveal({ children, className = "", delay = 0, amount = 0.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const isActive = inView || reduceMotion;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={isActive ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof children === "function" ? children(isActive) : children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, sub, trigger = true }) {
  return (
    <div className="aboutUsSectionHead">
      {eyebrow && <p className="aboutUsSectionHead__eyebrow">{eyebrow}</p>}
      <div className="aboutUsSectionHead__titleWrap">
        <h2 className="aboutUsSectionHead__title">{title}</h2>
        <motion.svg
          className="aboutUsSectionHead__line"
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
      {sub && (
        <TextScramble
          as="p"
          text={sub}
          className="aboutUsSectionHead__sub"
          trigger={trigger}
          startDelay={90}
        />
      )}
    </div>
  );
}

function AccordionItem({ item, open, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout
      className={`aboutUsAccordion__item ${open ? "aboutUsAccordion__item--open" : ""}`}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.button
        type="button"
        className="aboutUsAccordion__trigger"
        onClick={() => onToggle(item.id)}
        whileHover={reduceMotion ? undefined : { x: 1.5 }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      >
        <span className="aboutUsAccordion__index" aria-hidden="true">
          {item.id}
        </span>
        <span className="aboutUsAccordion__title">{item.title}</span>
        <ChevronDown
          className={`aboutUsAccordion__chevron ${open ? "aboutUsAccordion__chevron--open" : ""}`}
        />
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            className="aboutUsAccordion__content"
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="aboutUsAccordion__body">{item.body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function FounderQuote({ text }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.p
      className="aboutUsFounders__quote"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(10px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="aboutUsFounders__quoteWord"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(8px)" }}
          transition={{
            duration: 0.22,
            delay: reduceMotion ? 0 : index * 0.02,
            ease: "easeOut",
          }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.p>
  );
}

function FoundersBand() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stageWidth, setStageWidth] = useState(620);
  const [imageFailures, setImageFailures] = useState({});

  const totalFounders = founders.length;
  const activeFounder = useMemo(() => founders[activeIndex], [activeIndex]);
  const previousIndex = wrapIndex(totalFounders, activeIndex - 1);
  const nextIndex = wrapIndex(totalFounders, activeIndex + 1);
  const gap = useMemo(() => calculateFounderGap(stageWidth), [stageWidth]);
  const lift = Math.round(Math.min(58, gap * 0.18));

  useEffect(() => {
    const updateWidth = () => {
      if (!stageRef.current) return;
      setStageWidth(stageRef.current.offsetWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const goToIndex = useCallback(
    (index) => {
      setActiveIndex(wrapIndex(totalFounders, index));
    },
    [totalFounders]
  );

  const handlePrev = useCallback(() => {
    setActiveIndex((current) => wrapIndex(totalFounders, current - 1));
  }, [totalFounders]);

  const handleNext = useCallback(() => {
    setActiveIndex((current) => wrapIndex(totalFounders, current + 1));
  }, [totalFounders]);

  useEffect(() => {
    if (reduceMotion || totalFounders <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(totalFounders, current + 1));
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, reduceMotion, totalFounders]);

  const handleCardKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handlePrev();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNext();
    }
  };

  const markImageFailed = useCallback((name) => {
    setImageFailures((current) => {
      if (current[name]) return current;
      return { ...current, [name]: true };
    });
  }, []);

  return (
    <div className="aboutUsFounders">
      <Reveal>
        {(active) => (
          <SectionHeading
            eyebrow="Founding Team"
            title="The people shaping Carvver"
            sub="This section puts the founders behind Carvver in focus: the team turning creator trust, safer transactions, and better discoverability into a real product."
            trigger={active}
          />
        )}
      </Reveal>

      <div className="aboutUsFounders__layout">
        <Reveal className="aboutUsFounders__media" delay={0.06}>
          <div
            className="aboutUsFounders__stage"
            ref={stageRef}
            tabIndex={0}
            aria-label="Founders carousel"
            onKeyDown={handleCardKeyDown}
          >
            {founders.map((founder, index) => {
              const isActive = index === activeIndex;
              const isPrevious = index === previousIndex;
              const isNext = index === nextIndex;
              const isVisible = isActive || isPrevious || isNext;
              const showImage = Boolean(founder.imageSrc) && !imageFailures[founder.name];

              return (
                <motion.button
                  key={founder.name}
                  type="button"
                  className={`aboutUsFounderCard ${
                    isActive ? "aboutUsFounderCard--active" : ""
                  }`}
                  aria-label={`Open ${founder.name}`}
                  aria-pressed={isActive}
                  onClick={() => goToIndex(index)}
                  whileHover={reduceMotion ? undefined : { scale: isActive ? 1.01 : 0.87 }}
                  whileTap={reduceMotion ? undefined : { scale: isActive ? 0.99 : 0.84 }}
                  animate={{
                    x: isActive ? 0 : isPrevious ? -gap : isNext ? gap : 0,
                    y: isActive ? 0 : -lift,
                    scale: isActive ? 1 : 0.84,
                    rotateY: isPrevious ? 16 : isNext ? -16 : 0,
                    opacity: isVisible ? 1 : 0,
                    filter: isActive
                      ? "blur(0px) brightness(1)"
                      : isVisible
                      ? "blur(0px) brightness(0.92)"
                      : "blur(12px) brightness(0.72)",
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  style={{
                    zIndex: isActive ? 3 : isVisible ? 2 : 1,
                    pointerEvents: isVisible ? "auto" : "none",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <span className="aboutUsFounderCard__surface">
                    {showImage ? (
                      <img
                        src={founder.imageSrc}
                        alt={founder.name}
                        className="aboutUsFounderCard__image"
                        onError={() => markImageFailed(founder.name)}
                      />
                    ) : (
                      <span className="aboutUsFounderCard__fallback" aria-hidden="true">
                        <span className="aboutUsFounderCard__monogram">
                          {getFounderInitials(founder.name)}
                        </span>
                        <span className="aboutUsFounderCard__pill">Founding team</span>
                      </span>
                    )}

                    <span className="aboutUsFounderCard__veil" aria-hidden="true" />

                    <span className="aboutUsFounderCard__meta">
                      <span className="aboutUsFounderCard__name">{founder.name}</span>
                      <span className="aboutUsFounderCard__role">{founder.role}</span>
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="aboutUsFounders__copy" delay={0.1}>
          <div className="aboutUsFounders__copyWrap">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFounder.name}
                className="aboutUsFounders__copyCard"
                initial={
                  reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(10px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(10px)" }
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="aboutUsFounders__copyTop">
                  <p className="aboutUsFounders__eyebrow">Founder spotlight</p>
                  <p className="aboutUsFounders__counter">
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(totalFounders).padStart(2, "0")}
                  </p>
                </div>

                <h3 className="aboutUsFounders__name">{activeFounder.name}</h3>
                <p className="aboutUsFounders__role">{activeFounder.role}</p>
                <FounderQuote text={activeFounder.quote} />
                <p className="aboutUsFounders__bio">{activeFounder.bio}</p>
              </motion.div>
            </AnimatePresence>

            <div className="aboutUsFounders__controls">
              <div className="aboutUsFounders__arrowRow">
                <motion.button
                  type="button"
                  className="aboutUsFounders__arrow"
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  onClick={handlePrev}
                  aria-label="Previous founder"
                >
                  <ArrowLeft className="aboutUsFounders__arrowIcon" />
                </motion.button>

                <motion.button
                  type="button"
                  className="aboutUsFounders__arrow"
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  onClick={handleNext}
                  aria-label="Next founder"
                >
                  <ArrowRight className="aboutUsFounders__arrowIcon" />
                </motion.button>
              </div>

              <div className="aboutUsFounders__roster">
                {founders.map((founder, index) => (
                  <button
                    key={founder.name}
                    type="button"
                    className={`aboutUsFounders__rosterBtn ${
                      activeIndex === index ? "aboutUsFounders__rosterBtn--active" : ""
                    }`}
                    onClick={() => goToIndex(index)}
                  >
                    {founder.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function HomeAboutUs() {
  const reduceMotion = useReducedMotion();
  const [openAccordion, setOpenAccordion] = useState("01");

  return (
    <>
      <div className="aboutUsPage__base" aria-hidden="true" />
      <div className="aboutUsPage__bg" aria-hidden="true" />

      <main className="aboutUsPage">
        <div className="aboutUsPage__decor aboutUsPage__decor--a" aria-hidden="true" />
        <div className="aboutUsPage__decor aboutUsPage__decor--b" aria-hidden="true" />
        <div className="aboutUsPage__decor aboutUsPage__decor--c" aria-hidden="true" />

        <section className="aboutUsHero aboutUsBand">
          <div className="aboutUsHero__inner aboutUsWrap">
            <Reveal className="aboutUsHero__content" amount={0.3}>
              {(active) => (
                <>
                  <p className="aboutUsHero__eyebrow">About Carvver</p>
                  <div className="aboutUsHero__titleWrap">
                    <h1 className="aboutUsHero__title">
                      <TypewriterText text="About Us" speed={82} initialDelay={120} />
                    </h1>
                    <motion.svg
                      className="aboutUsHero__line"
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
                        transition={{ duration: 1.05, ease: "easeInOut", delay: 0.22 }}
                      />
                    </motion.svg>
                  </div>
                  <TextScramble
                    as="p"
                    text="Carvver is a platform for Filipino skilled hobbyists, handmade-product makers, and casual freelancers who need a clearer way to be discovered, trusted, and paid more safely."
                    className="aboutUsHero__sub"
                    trigger={active}
                    startDelay={120}
                  />
                  <TextScramble
                    as="p"
                    text="Instead of making people juggle discovery, proof, and customer conversations across several social feeds, Carvver gives both service providers and customers one dedicated place to work with more confidence."
                    className="aboutUsHero__support"
                    trigger={active}
                    startDelay={260}
                  />
                </>
              )}
            </Reveal>

            <Reveal className="aboutUsHero__metrics" delay={0.08}>
              {[
                { label: "For providers", value: "Credibility + reach" },
                { label: "For customers", value: "Faster trust" },
                { label: "Transactions", value: "Escrow-backed safety" },
              ].map((item) => (
                <div key={item.label} className="aboutUsMetric">
                  <span className="aboutUsMetric__label">{item.label}</span>
                  <strong className="aboutUsMetric__value">{item.value}</strong>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              {(active) => (
                <SectionHeading
                  eyebrow="Our Story"
                  title="Why Carvver exists"
                  sub="The platform exists to give emerging creators a fairer starting point while helping customers discover trustworthy services without relying on scattered platforms."
                  trigger={active}
                />
              )}
            </Reveal>
            <div className="aboutUsStory__grid">
              {storyCards.map((card, index) => (
                <Reveal key={card.title} delay={0.06 * index}>
                  {(active) => (
                    <article className="aboutUsStoryCard">
                      <h3 className="aboutUsStoryCard__title">{card.title}</h3>
                      <TextScramble
                        as="p"
                        text={card.text}
                        className="aboutUsStoryCard__text"
                        trigger={active}
                        startDelay={80}
                      />
                    </article>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap aboutUsFeature">
            <Reveal className="aboutUsFeature__copy">
              {(active) => (
                <>
                <SectionHeading
                  eyebrow="What Makes Us Different"
                  title="Carvver keeps growth portable"
                  sub="The platform is meant to be the trusted home for listings and proof, while still helping creators reach people outside of one closed ecosystem."
                  trigger={active}
                />
                  <TextScramble
                    as="p"
                    text="Few-click posting matters because creators should not have to rebuild the same offer every time they want to promote themselves elsewhere. Carvver should organize the work once, then let that work travel."
                    className="aboutUsFeature__text"
                    trigger={active}
                    startDelay={100}
                  />
                  <TextScramble
                    as="p"
                    text="That makes the platform useful in two directions at once: creators get wider reach, while customers still return to one cleaner place for profiles, reviews, trust signals, and safer payment handling."
                    className="aboutUsFeature__text aboutUsFeature__text--muted"
                    trigger={active}
                    startDelay={220}
                  />
                </>
              )}
            </Reveal>

            <Reveal className="aboutUsFeature__flowWrap" delay={0.1}>
              {(active) => (
                <div className="aboutUsFlow">
                  <div className="aboutUsFlow__head">
                    <span className="aboutUsFlow__iconWrap" aria-hidden="true">
                      <Share2 className="aboutUsFlow__icon" />
                    </span>
                    <div>
                      <h3 className="aboutUsFlow__title">Few-click posting direction</h3>
                      <TextScramble
                        as="p"
                        text="One listing, wider reach, and a stronger source of truth."
                        className="aboutUsFlow__sub"
                        trigger={active}
                        startDelay={80}
                      />
                    </div>
                  </div>
                  <div className="aboutUsFlow__steps">
                    {flowSteps.map((step, index) => (
                      <motion.div
                        key={step}
                        className="aboutUsFlow__step"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.65 }}
                        transition={{ duration: 0.4, delay: index * 0.07 }}
                      >
                        <span className="aboutUsFlow__stepIndex">0{index + 1}</span>
                        <span className="aboutUsFlow__stepText">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              {(active) => (
                <SectionHeading
                  eyebrow="Core Pillars"
                  title="What the platform should protect"
                  sub="These are the parts of Carvver that make the concept paper feel distinct instead of interchangeable with a typical freelance marketplace."
                  trigger={active}
                />
              )}
            </Reveal>
            <div className="aboutUsPillars__grid">
              {pillars.map(({ title, text, Icon }, index) => (
                <Reveal key={title} delay={0.05 * index}>
                  {(active) => (
                    <article className="aboutUsPillar">
                      <span className="aboutUsPillar__iconWrap" aria-hidden="true">
                        <Icon className="aboutUsPillar__icon" />
                      </span>
                      <div className="aboutUsPillar__copy">
                        <h3 className="aboutUsPillar__title">{title}</h3>
                        <TextScramble
                          as="p"
                          text={text}
                          className="aboutUsPillar__text"
                          trigger={active}
                          startDelay={70}
                        />
                      </div>
                    </article>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap aboutUsAudience">
            <Reveal>
              {(active) => (
                <SectionHeading
                  eyebrow="Who It Serves"
                  title="The experience has to work on both sides"
                  sub="Carvver grows stronger when service providers feel supported and customers feel informed enough to trust what they are seeing."
                  trigger={active}
                />
              )}
            </Reveal>
            <div className="aboutUsAudience__grid">
              {audienceLanes.map((lane, index) => (
                <Reveal key={lane.title} delay={0.06 * index}>
                  {(active) => (
                    <article className="aboutUsAudience__lane">
                      <div className="aboutUsAudience__labelRow">
                        <span className="aboutUsAudience__iconWrap" aria-hidden="true">
                          {index === 0 ? <Sparkles className="aboutUsAudience__icon" /> : <Users className="aboutUsAudience__icon" />}
                        </span>
                        <h3 className="aboutUsAudience__title">{lane.title}</h3>
                      </div>
                      <TextScramble
                        as="p"
                        text={lane.text}
                        className="aboutUsAudience__text"
                        trigger={active}
                        startDelay={80}
                      />
                    </article>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <FoundersBand />
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap aboutUsAccordionWrap">
            <Reveal>
              {(active) => (
                <SectionHeading
                  eyebrow="What Was Missing"
                  title="A few ideas the platform needed to say more clearly"
                  sub="These are the product principles that matter in the concept paper and deserved to be stated directly on the page."
                  trigger={active}
                />
              )}
            </Reveal>
            <div className="aboutUsAccordion">
              {accordionItems.map((item, index) => (
                <Reveal key={item.id} delay={0.04 * index}>
                  <AccordionItem
                    item={item}
                    open={openAccordion === item.id}
                    onToggle={(id) => setOpenAccordion((prev) => (prev === id ? "" : id))}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="aboutUsBand aboutUsQuote">
          <div className="aboutUsWrap aboutUsQuote__inner">
            <Reveal>
              {(active) => (
                <>
                  <p className="aboutUsQuote__eyebrow">Our Quote</p>
                  <div className="aboutUsQuote__titleWrap">
                    <h2 className="aboutUsQuote__title">
                      <TypewriterText text="Carve with what you love" speed={58} initialDelay={180} />
                    </h2>
                    <motion.svg
                      className="aboutUsQuote__line"
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
                        transition={{ duration: 1.05, ease: "easeInOut", delay: 0.12 }}
                      />
                    </motion.svg>
                  </div>
                  <TextScramble
                    as="p"
                    text="That motto reflects the center of the concept paper: help creators turn the work they genuinely care about into something more discoverable, more trusted, and more sustainable over time."
                    className="aboutUsQuote__text"
                    trigger={active}
                    startDelay={90}
                  />
                </>
              )}
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsClosing">
          <div className="aboutUsWrap">
            <Reveal className="aboutUsClosing__content">
              {(active) => (
                <>
                  <span className="aboutUsClosing__iconWrap" aria-hidden="true">
                    <Compass className="aboutUsClosing__icon" />
                  </span>
                  <h2 className="aboutUsClosing__title">
                    A creator-first platform shaped around trust, visibility, and safer growth.
                  </h2>
                  <TextScramble
                    as="p"
                    text="Carvver is meant to be more than a listing page. It is a dedicated home where emerging providers can earn credibility, where customers can make better decisions, and where the platform itself grows stronger through clearer signals, stronger support, and a more human marketplace rhythm."
                    className="aboutUsClosing__text"
                    trigger={active}
                    startDelay={100}
                  />
                </>
              )}
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
