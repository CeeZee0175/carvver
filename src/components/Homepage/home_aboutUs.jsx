import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  Compass,
  Search,
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
    title: "Built for creators at any pace",
    text:
      "Carvver is for skilled hobbyists, independent makers, and casual freelancers who need a place to be taken seriously without pretending to be a large studio.",
  },
  {
    title: "Designed to work beyond one feed",
    text:
      "We do not want creators trapped inside one platform. Listings should be shareable, portable, and useful wherever a creator already has momentum.",
  },
  {
    title: "Focused on trust without the stiffness",
    text:
      "Customers still need clarity. That means better signals around verification, safer transactions, and profiles that feel honest instead of over-produced.",
  },
];

const pillars = [
  {
    title: "Discoverability",
    text:
      "Clear categories, location-aware browsing, and thoughtful filtering help customers find relevant creators faster.",
    Icon: Search,
  },
  {
    title: "Credibility",
    text:
      "Profiles, badges, and proof of consistency should make trust easier to read without making creators feel boxed in.",
    Icon: BadgeCheck,
  },
  {
    title: "Freedom to Promote",
    text:
      "Carvver should help creators grow outside the platform too, not just keep them dependent on it.",
    Icon: Share2,
  },
  {
    title: "Safer Transactions",
    text:
      "Better payment and refund handling creates a calmer experience for both customers and service providers.",
    Icon: ShieldCheck,
  },
];

const audienceLanes = [
  {
    title: "For creators",
    text:
      "A place to package work cleanly, explain what you offer, and promote yourself without acting like a full agency.",
  },
  {
    title: "For customers",
    text:
      "A calmer way to compare people, understand trust signals, and hire someone without bouncing across scattered social posts.",
  },
];

const flowSteps = [
  "Create a clean listing once.",
  "Share it across the places your audience already uses.",
  "Keep Carvver as the organized home for trust, details, and discovery.",
];

const accordionItems = [
  {
    id: "why-now",
    title: "Why this platform needs to exist now",
    body:
      "A lot of talented people already create valuable work, but their discovery still depends on fragmented posts, inconsistent visibility, and platforms that reward noise over clarity. Carvver is meant to reduce that friction.",
  },
  {
    id: "missing-middle",
    title: "What felt missing in the current experience",
    body:
      "There is a big gap between casual social posting and rigid freelance marketplaces. Carvver can own that middle ground: serious enough to build trust, flexible enough to still feel human.",
  },
  {
    id: "trust-design",
    title: "How trust should feel here",
    body:
      "Trust should not come from sterile corporate polish. It should come from understandable profiles, consistent signals, proof of activity, transparent pricing, and safer transactions.",
  },
  {
    id: "growth-direction",
    title: "Where the product should keep growing",
    body:
      "The strongest next layers are better creator credibility signals, stronger request-and-response workflows, clearer buyer guidance, and more seamless cross-platform promotion.",
  },
];

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

function AccordionItem({ item, open, onToggle, active }) {
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
            <TextScramble
              as="p"
              text={item.body}
              className="aboutUsAccordion__body"
              trigger={open && active}
              startDelay={40}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function HomeAboutUs() {
  const reduceMotion = useReducedMotion();
  const [openAccordion, setOpenAccordion] = useState("why-now");

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
                    text="Carvver is a freelancing platform shaped for skilled hobbyists, independent makers, and casual service providers who deserve a clearer way to be discovered."
                    className="aboutUsHero__sub"
                    trigger={active}
                    startDelay={120}
                  />
                  <TextScramble
                    as="p"
                    text="We want customers to find trustworthy people more easily, and we want creators to grow without being forced into a rigid, over-commercial version of themselves."
                    className="aboutUsHero__support"
                    trigger={active}
                    startDelay={260}
                  />
                </>
              )}
            </Reveal>

            <Reveal className="aboutUsHero__metrics" delay={0.08}>
              {[
                { label: "Creator-first", value: "Flexible growth" },
                { label: "Customer-first", value: "Clearer trust" },
                { label: "Platform-first", value: "Less friction" },
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
                  sub="The platform should feel like a middle ground between scattered social posting and overly rigid marketplaces."
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
                    title="We do not want creators to stay confined"
                    sub="Carvver should help someone build a stronger home for their work while still letting that work travel."
                    trigger={active}
                  />
                  <TextScramble
                    as="p"
                    text="One of the clearest opportunities here is cross-platform promotion. A listing should not become trapped inside one app when the creator already has an audience somewhere else."
                    className="aboutUsFeature__text"
                    trigger={active}
                    startDelay={100}
                  />
                  <TextScramble
                    as="p"
                    text="That means Carvver can become the clean, trustworthy source of truth while social channels stay useful for reach, discovery, and momentum."
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
                        text="A simpler loop between listing, sharing, and discovery."
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
                  title="What the product should keep protecting"
                  sub="These are the parts that make Carvver feel different for both customers and creators."
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
                  title="The experience has to work for both sides"
                  sub="Carvver gets stronger when creators feel supported and customers feel informed at the same time."
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
          <div className="aboutUsWrap aboutUsAccordionWrap">
            <Reveal>
              {(active) => (
                <SectionHeading
                  eyebrow="What Was Missing"
                  title="A few ideas the page needed to say more clearly"
                  sub="These are the product principles that feel implied in Carvver, but deserved to be stated directly."
                  trigger={active}
                />
              )}
            </Reveal>
            <div className="aboutUsAccordion">
              {accordionItems.map((item, index) => (
                <Reveal key={item.id} delay={0.04 * index}>
                  {(active) => (
                    <AccordionItem
                      item={item}
                      open={openAccordion === item.id}
                      onToggle={(id) => setOpenAccordion((prev) => (prev === id ? "" : id))}
                      active={active}
                    />
                  )}
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
                    text="That line is the point of the whole platform: help people build around the work they genuinely care about, not just around whatever makes them look the most commercial."
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
                    A platform shaped around clarity, growth, and a more human kind of freelance work.
                  </h2>
                  <TextScramble
                    as="p"
                    text="Carvver should not feel like a rigid system people have to fit into. It should feel like a better surface for discovery, trust, and progress, especially for people who are talented enough to be hired but do not want to build themselves like a giant brand."
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
