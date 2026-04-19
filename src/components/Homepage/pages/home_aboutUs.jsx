import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import founderCarl from "../../../assets/Carl Cardinal.jpg";
import founderShaira from "../../../assets/Shaira Brillantes.jpg";
import founderGeoff from "../../../assets/Geoff Montua.jpg";
import founderAngelo from "../../../assets/Angelo Nollano.jpg";
import founderJhoanis from "../../../assets/Jhoanis Zuniga.jpg";
import founderMark from "../../../assets/Mark Caraballe.jpg";
import "./home_aboutUs.css";

const keepMotionReference = motion;
void keepMotionReference;

const storySlides = [
  {
    id: "story-1",
    title: "Built for Filipino creators still growing",
    text:
      "Carvver is designed for hobbyists, handmade sellers, and early freelancers who need a clearer place to be seen before they look like a full studio.",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "story-2",
    title: "A calmer home than scattered social feeds",
    text:
      "Listings, proof, reviews, and conversations live in one place so customers do not have to piece trust together across several apps.",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "story-3",
    title: "Progress should feel rewarding, not punishing",
    text:
      "Badges and visible progress help creators earn credibility over time without turning growth into a noisy public competition.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop",
  },
];

const differenceItems = [
  {
    id: "01",
    title: "Portable visibility",
    body:
      "Carvver is meant to be the trusted home for a creator's offer, while still helping that offer travel outward through social channels instead of staying trapped in one closed feed.",
  },
  {
    id: "02",
    title: "Few-click posting",
    body:
      "Creators should set up a listing once, then reuse that work across the places where people already pay attention. Promotion should feel faster, not repetitive.",
  },
  {
    id: "03",
    title: "Trust people can read faster",
    body:
      "Profiles, proof, badges, reviews, and safer payment handling are meant to make credibility easier to understand before either side commits.",
  },
  {
    id: "04",
    title: "One clearer source of truth",
    body:
      "Instead of splitting the experience between social DMs, random posts, and separate payment chats, Carvver keeps the important parts of the transaction in one place.",
  },
];

const pillars = [
  {
    id: "pillar-1",
    title: "Few-click posting",
    text:
      "Creators can publish once, then extend that same offer outward to the channels where discovery already happens.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "pillar-2",
    title: "Verified badges",
    text:
      "Trust signals should help honest providers feel more legible without forcing them to over-explain themselves every time.",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "pillar-3",
    title: "Location services",
    text:
      "Local discovery matters for on-site work, handmade delivery, and any service where distance changes the experience.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "pillar-4",
    title: "Escrow-backed safety",
    text:
      "Payments are held first so customers and creators move through the work with more protection and clearer review points.",
    imageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1400&auto=format&fit=crop",
  },
];

const audienceLanes = [
  {
    title: "For service providers",
    text:
      "A clearer place to showcase work, manage customers, and build credibility without getting buried under larger marketplaces.",
  },
  {
    title: "For customers",
    text:
      "A faster way to discover trustworthy people, compare real signals, and pay through a safer workflow that feels easier to understand.",
  },
];

const founders = [
  {
    name: "Carl Edray N. Cardinal",
    role: "Founder & CEO",
    bio:
      "Carl anchors the vision around creator opportunity, clearer trust, and a marketplace that helps Filipino providers grow without being buried by larger platforms.",
    imageSrc: founderCarl,
    imagePosition: "center center",
  },
  {
    name: "Shaira Brillantes",
    role: "Co-founder & Chief Product Officer",
    bio:
      "Shaira focuses on making discovery, profile clarity, and marketplace trust work together as one coherent experience.",
    imageSrc: founderShaira,
    imagePosition: "center center",
  },
  {
    name: "Geoff Montua",
    role: "Co-founder & Chief Technology Officer",
    bio:
      "Geoff helps shape the technical backbone behind Carvver, from the web experience itself to the product systems that make trust and payout flow possible.",
    imageSrc: founderGeoff,
    imagePosition: "center 18%",
  },
  {
    name: "Angelo Nollano",
    role: "Co-founder & Chief Operations Officer",
    bio:
      "Angelo brings the operational lens that helps moderation, verification, and platform support feel steadier on both sides of the marketplace.",
    imageSrc: founderAngelo,
    imagePosition: "center center",
  },
  {
    name: "Jhoanis Paulo Zuniga",
    role: "Co-founder & Chief Growth & Marketing Officer",
    bio:
      "Jhoanis Paulo connects social visibility, creator promotion, and the few-click posting vision that helps discovery move beyond one platform.",
    imageSrc: founderJhoanis,
    imagePosition: "center center",
  },
  {
    name: "Mark Caraballe",
    role: "Co-founder & Community Partnerships Lead",
    bio:
      "Mark carries the community and partnership perspective, keeping feedback, outreach, and early-adopter energy close to the product direction.",
    imageSrc: founderMark,
    imagePosition: "center center",
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

function AccentLine({ className, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={className}
      aria-hidden="true"
      initial={reduceMotion ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.2 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.75 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "center" }}
    />
  );
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
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={isActive ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof children === "function" ? children(isActive) : children}
    </motion.div>
  );
}

function SectionHeading({ title }) {
  return (
    <div className="aboutUsSectionHead">
      <div className="aboutUsSectionHead__titleWrap">
        <h2 className="aboutUsSectionHead__title">{title}</h2>
        <AccentLine className="aboutUsSectionHead__line" />
      </div>
    </div>
  );
}

function StoryProgressSlider({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;

    let frame = 0;
    let startTime = performance.now();
    const duration = 5200;

    const animate = (now) => {
      const elapsed = now - startTime;
      const nextProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setActiveIndex((current) => (current + 1) % items.length);
        setProgress(0);
        startTime = now;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeIndex, items.length, reduceMotion]);

  const activeSlide = items[activeIndex];

  return (
    <div className="aboutUsStorySlider">
      <div className="aboutUsStorySlider__frame">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            className="aboutUsStorySlider__media"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={activeSlide.imageUrl}
              alt={activeSlide.title}
              className="aboutUsStorySlider__image"
              loading="lazy"
            />
            <div className="aboutUsStorySlider__veil" aria-hidden="true" />
            <div className="aboutUsStorySlider__content">
              <h3 className="aboutUsStorySlider__title">{activeSlide.title}</h3>
              <p className="aboutUsStorySlider__text">{activeSlide.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="aboutUsStorySlider__nav" role="tablist" aria-label="Our story">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={`aboutUsStorySlider__tab ${
              index === activeIndex ? "aboutUsStorySlider__tab--active" : ""
            }`}
            onClick={() => {
              setActiveIndex(index);
              setProgress(0);
            }}
          >
            <span className="aboutUsStorySlider__tabNumber">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="aboutUsStorySlider__tabLine" aria-hidden="true">
              <motion.span
                className="aboutUsStorySlider__tabFill"
                animate={{
                  width:
                    index === activeIndex
                      ? reduceMotion
                        ? "100%"
                        : `${progress}%`
                      : "0%",
                }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: "linear" }}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AccordionItem({ item, open, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout
      className={`aboutUsAccordion__item ${open ? "aboutUsAccordion__item--open" : ""}`}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <button type="button" className="aboutUsAccordion__trigger" onClick={() => onToggle(item.id)}>
        <span className="aboutUsAccordion__index" aria-hidden="true">
          {item.id}
        </span>
        <span className="aboutUsAccordion__title">{item.title}</span>
        <ChevronDown
          className={`aboutUsAccordion__chevron ${
            open ? "aboutUsAccordion__chevron--open" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
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
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function PillarsSpotlight({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5600);

    return () => {
      window.clearInterval(timer);
    };
  }, [items.length, reduceMotion]);

  return (
    <div className="aboutUsPillars">
      <AnimatePresence mode="wait">
        <motion.article
          key={activeItem.id}
          className="aboutUsPillars__panel"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(10px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={activeItem.imageUrl}
            alt=""
            className="aboutUsPillars__image"
            loading="lazy"
          />
          <div className="aboutUsPillars__imageVeil" aria-hidden="true" />
          <div className="aboutUsPillars__content">
          <p className="aboutUsPillars__eyebrow">
            {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </p>
          <h3 className="aboutUsPillars__title">{activeItem.title}</h3>
          <p className="aboutUsPillars__text">{activeItem.text}</p>
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="aboutUsPillars__pager" aria-label="Core pillars navigation">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`aboutUsPillars__dot ${
              index === activeIndex ? "aboutUsPillars__dot--active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${item.title}`}
          />
        ))}
      </div>
    </div>
  );
}

function FoundersBand() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailures, setImageFailures] = useState({});
  const activeFounder = useMemo(() => founders[activeIndex], [activeIndex]);

  useEffect(() => {
    if (reduceMotion || founders.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(founders.length, current + 1));
    }, 5600);

    return () => {
      window.clearInterval(timer);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const images = founders
      .map((founder) => founder.imageSrc)
      .filter(Boolean)
      .map((src) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
        return image;
      });

    return () => {
      images.forEach((image) => {
        image.src = "";
      });
    };
  }, []);

  const showImage = Boolean(activeFounder.imageSrc) && !imageFailures[activeFounder.name];

  return (
    <div className="aboutUsFounders">
      <Reveal>
        <SectionHeading title="Founding Team" />
      </Reveal>

      <Reveal className="aboutUsFounders__stageWrap" delay={0.04}>
        <div className="aboutUsFounders__stage">
          <button
            type="button"
            className="aboutUsFounders__arrow aboutUsFounders__arrow--left"
            onClick={() => setActiveIndex((current) => wrapIndex(founders.length, current - 1))}
            aria-label="Previous founder"
          >
            <ArrowLeft className="aboutUsFounders__arrowIcon" />
          </button>

          <AnimatePresence mode="wait">
            <motion.article
              key={activeFounder.name}
              className="aboutUsFounders__portrait"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01, y: -8 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              {showImage ? (
                <>
                  <img
                    src={activeFounder.imageSrc}
                    alt=""
                    className="aboutUsFounders__portraitBackdrop"
                    loading="eager"
                    decoding="sync"
                    fetchPriority={activeIndex === 0 ? "high" : "auto"}
                    style={{ objectPosition: activeFounder.imagePosition || "center center" }}
                    onError={() =>
                      setImageFailures((current) => ({ ...current, [activeFounder.name]: true }))
                    }
                  />
                  <div className="aboutUsFounders__portraitSubjectWrap">
                    <img
                      src={activeFounder.imageSrc}
                      alt={activeFounder.name}
                      className="aboutUsFounders__portraitImage"
                      loading="eager"
                      decoding="sync"
                      fetchPriority={activeIndex === 0 ? "high" : "auto"}
                      style={{ objectPosition: activeFounder.imagePosition || "center center" }}
                    />
                  </div>
                </>
              ) : (
                <div className="aboutUsFounders__portraitFallback" aria-hidden="true">
                  <span className="aboutUsFounders__portraitInitials">
                    {getFounderInitials(activeFounder.name)}
                  </span>
                </div>
              )}
              <div className="aboutUsFounders__portraitVeil" aria-hidden="true" />
              <div className="aboutUsFounders__portraitMeta">
                <p className="aboutUsFounders__counter">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(founders.length).padStart(2, "0")}
                </p>
                <h3 className="aboutUsFounders__portraitName">{activeFounder.name}</h3>
                <p className="aboutUsFounders__portraitRole">{activeFounder.role}</p>
                <p className="aboutUsFounders__portraitBio">{activeFounder.bio}</p>
              </div>
            </motion.article>
          </AnimatePresence>

          <button
            type="button"
            className="aboutUsFounders__arrow aboutUsFounders__arrow--right"
            onClick={() => setActiveIndex((current) => wrapIndex(founders.length, current + 1))}
            aria-label="Next founder"
          >
            <ArrowRight className="aboutUsFounders__arrowIcon" />
          </button>
        </div>

        <div className="aboutUsFounders__roster">
          {founders.map((founder, index) => (
            <button
              key={founder.name}
              type="button"
              className={`aboutUsFounders__rosterBtn ${
                activeIndex === index ? "aboutUsFounders__rosterBtn--active" : ""
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {founder.name}
            </button>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export default function HomeAboutUs() {
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
              <>
                <div className="aboutUsHero__titleWrap">
                  <h1 className="aboutUsHero__title">About Carvver</h1>
                  <AccentLine className="aboutUsHero__line" delay={0.16} />
                </div>
                <p className="aboutUsHero__sub">
                  Carvver gives Filipino creators and customers one clearer place to discover work,
                  build trust, and move through services more confidently.
                </p>
              </>
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              <SectionHeading title="Our Story" />
            </Reveal>
            <Reveal delay={0.06}>
              <StoryProgressSlider items={storySlides} />
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              <SectionHeading title="What Makes Us Different" />
            </Reveal>
            <Reveal className="aboutUsIntro" delay={0.04}>
              <p>
                Carvver is built to keep growth portable while keeping trust signals, proof, and
                transaction clarity in one dependable home.
              </p>
            </Reveal>
            <div className="aboutUsAccordion">
              {differenceItems.map((item, index) => (
                <Reveal key={item.id} delay={0.04 * index}>
                  <AccordionItem
                    item={item}
                    open={openAccordion === item.id}
                    onToggle={(id) => setOpenAccordion((current) => (current === id ? "" : id))}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              <SectionHeading title="Core Pillars" />
            </Reveal>
            <Reveal delay={0.06}>
              <PillarsSpotlight items={pillars} />
            </Reveal>
          </div>
        </section>

        <section className="aboutUsBand aboutUsSection">
          <div className="aboutUsWrap">
            <Reveal>
              <SectionHeading title="Who It Serves" />
            </Reveal>
            <div className="aboutUsAudience__grid">
              {audienceLanes.map((lane, index) => (
                <Reveal key={lane.title} delay={0.06 * index}>
                  <article className="aboutUsAudience__lane">
                    <h3 className="aboutUsAudience__title">{lane.title}</h3>
                    <p className="aboutUsAudience__text">{lane.text}</p>
                  </article>
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

        <section className="aboutUsBand aboutUsQuote">
          <div className="aboutUsWrap aboutUsQuote__inner">
            <Reveal>
              <>
                <p className="aboutUsQuote__eyebrow">Our Quote</p>
                <div className="aboutUsQuote__titleWrap">
                  <h2 className="aboutUsQuote__title">
                    <span className="aboutUsQuote__mark">"</span>
                    <span>Carve with what you love</span>
                    <span className="aboutUsQuote__mark">"</span>
                  </h2>
                  <AccentLine className="aboutUsQuote__line" delay={0.12} />
                </div>
                <p className="aboutUsQuote__text">
                  That motto reflects the center of Carvver: help creators turn the work they care
                  about into something more discoverable, more trusted, and more sustainable.
                </p>
              </>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
