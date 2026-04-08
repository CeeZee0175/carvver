import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import {
  buildCategoryPath,
  setFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";
import "./home_two.css";

const supabase = createClient();

function MatrixTitle({
  id,
  text = "Categories",
  active = true,
  initialDelay = 200,
  letterAnimationDuration = 420,
  letterInterval = 90,
}) {
  const reduce = useReducedMotion();
  const startedRef = useRef(false);

  const [letters, setLetters] = useState(() =>
    text.split("").map((char) => ({
      char,
      isMatrix: false,
      isSpace: char === " ",
    }))
  );

  const getRandomChar = useCallback(() => (Math.random() > 0.5 ? "1" : "0"), []);

  const animateLetter = useCallback(
    (index) => {
      if (index >= text.length) return;

      requestAnimationFrame(() => {
        setLetters((prev) => {
          const next = [...prev];
          if (!next[index].isSpace) {
            next[index] = { ...next[index], char: getRandomChar(), isMatrix: true };
          }
          return next;
        });

        setTimeout(() => {
          setLetters((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], char: text[index], isMatrix: false };
            return next;
          });
        }, letterAnimationDuration);
      });
    },
    [getRandomChar, text, letterAnimationDuration]
  );

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (reduce) {
      setLetters(
        text.split("").map((char) => ({
          char,
          isMatrix: false,
          isSpace: char === " ",
        }))
      );
      return;
    }

    let i = 0;
    const tick = () => {
      if (i >= text.length) return;
      animateLetter(i);
      i += 1;
      setTimeout(tick, letterInterval);
    };
    tick();
  }, [animateLetter, letterInterval, reduce, text]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(start, initialDelay);
    return () => clearTimeout(timer);
  }, [active, initialDelay, start]);

  const variants = useMemo(
    () => ({
      matrix: {
        color: "rgba(242,193,78,0.98)",
        textShadow: "0 8px 18px rgba(242,193,78,0.22)",
      },
      normal: {
        color: "rgba(27,16,46,0.96)",
        textShadow: "none",
      },
    }),
    []
  );

  return (
    <h2 id={id} className="homeTwo__title">
      <span className="homeTwo__matrix" aria-label={text}>
        {letters.map((letter, index) => (
          <motion.span
            key={`${index}-${letter.char}`}
            className="homeTwo__letter"
            initial={false}
            animate={letter.isMatrix ? "matrix" : "normal"}
            variants={variants}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            style={{ fontVariantNumeric: "tabular-nums" }}
            aria-hidden="true"
          >
            {letter.isSpace ? "\u00A0" : letter.char}
          </motion.span>
        ))}
      </span>
    </h2>
  );
}

const FEATURED_CATEGORIES = [
  {
    id: 1,
    title: "Art & Illustration",
    meta: "Featured Category",
    description:
      "Commission custom portraits, posters, digital art, merch visuals, and stylized illustration work from independent creators.",
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Photography",
    meta: "Featured Category",
    description:
      "Book photographers for portraits, product shoots, events, and polished image editing that feels ready to publish.",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Video Editing",
    meta: "Featured Category",
    description:
      "Turn raw clips into scroll-stopping reels, explainers, cinematic edits, and clean content packages for your brand.",
    imageUrl:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Voice Over",
    meta: "Featured Category",
    description:
      "Find voice talent for ads, narration, character reads, social content, and studio-style audio with a human touch.",
    imageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Social Media",
    meta: "Featured Category",
    description:
      "Get help with post concepts, content calendars, short-form strategy, and visual assets that keep your feed moving.",
    imageUrl:
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Web Development",
    meta: "Featured Category",
    description:
      "Launch landing pages, portfolio sites, and lightweight web builds that help your service or side project look credible fast.",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Tutoring",
    meta: "Featured Category",
    description:
      "Connect with tutors for academic support, creative coaching, language practice, and one-on-one learning sessions.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1400&auto=format&fit=crop",
  },
];

const BASE_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const TAP_SPRING = {
  type: "spring",
  stiffness: 450,
  damping: 18,
  mass: 1,
};

function wrap(min, max, value) {
  const rangeSize = max - min;
  return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

export default function HomeTwo() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const lastWheelTime = useRef(0);

  const [active, setActive] = useState(2);
  const [isHovering, setIsHovering] = useState(false);

  const count = FEATURED_CATEGORIES.length;
  const activeIndex = wrap(0, count, active);
  const activeItem = FEATURED_CATEGORIES[activeIndex];

  const handlePrev = useCallback(() => {
    setActive((prev) => prev - 1);
  }, []);

  const handleNext = useCallback(() => {
    setActive((prev) => prev + 1);
  }, []);

  const handleExplore = useCallback(async () => {
    const category = activeItem.title;
    setFeaturedCategoryIntent(category);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate(buildCategoryPath("/dashboard/customer/browse-services", category));
        return;
      }
    } catch {
      // Fall back to the sign-up path below.
    }

    navigate(buildCategoryPath("/sign-up", category));
  }, [activeItem.title, navigate]);

  const onWheel = useCallback(
    (e) => {
      const now = Date.now();

      if (now - lastWheelTime.current < 400) return;

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontal ? e.deltaX : e.deltaY;

      if (Math.abs(delta) <= 20) return;

      e.preventDefault();

      if (delta > 0) {
        handleNext();
      } else {
        handlePrev();
      }

      lastWheelTime.current = now;
    },
    [handleNext, handlePrev]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext, handlePrev]
  );

  const onDragEnd = useCallback(
    (_event, info) => {
      const swipe = Math.abs(info.offset.x) * info.velocity.x;

      if (swipe < -10000) {
        handleNext();
      } else if (swipe > 10000) {
        handlePrev();
      }
    },
    [handleNext, handlePrev]
  );

  const visibleOffsets = [-2, -1, 0, 1, 2];

  return (
    <section className="homeTwo" ref={ref} aria-labelledby="homeTwo-title">
      <div className="homeTwo__inner">
        <div className="homeTwo__head">
          <MatrixTitle id="homeTwo-title" text="Categories" active={inView} />

          <p className="homeTwo__desc">
            Browse through some of our categories to find what you need.
          </p>
        </div>

        <div
          className="homeTwoRail"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
          aria-label="Featured categories"
        >
          <div className="homeTwoRail__ambience" aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                className="homeTwoRail__bgFrame"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                <img
                  src={activeItem.imageUrl}
                  alt=""
                  className="homeTwoRail__bgImage"
                />
                <span className="homeTwoRail__bgWash" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="homeTwoRail__stageWrap">
            <motion.div
              className={`homeTwoRail__stage ${isHovering ? "homeTwoRail__stage--hovering" : ""}`}
              drag={reduceMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
            >
              {visibleOffsets.map((offset) => {
                const absoluteIndex = active + offset;
                const index = wrap(0, count, absoluteIndex);
                const item = FEATURED_CATEGORIES[index];
                const isCenter = offset === 0;
                const distance = Math.abs(offset);

                const xOffset = offset * 228;
                const zOffset = -distance * 156;
                const scale = isCenter ? 1 : 0.86;
                const rotateY = offset * -16;
                const opacity = isCenter ? 1 : Math.max(0.18, 1 - distance * 0.35);
                const blur = isCenter ? 0 : distance * 3.8;
                const brightness = isCenter ? 1 : 0.76;

                return (
                  <motion.button
                    key={`${item.id}-${absoluteIndex}`}
                    type="button"
                    className={`homeTwoRail__card ${isCenter ? "homeTwoRail__card--center" : ""}`}
                    initial={false}
                    animate={{
                      x: xOffset,
                      z: zOffset,
                      scale,
                      rotateY,
                      opacity,
                      filter: `blur(${blur}px) brightness(${brightness})`,
                    }}
                    transition={(value) => (value === "scale" ? TAP_SPRING : BASE_SPRING)}
                    style={{ transformStyle: "preserve-3d" }}
                    onClick={() => {
                      if (!isCenter) setActive((prev) => prev + offset);
                    }}
                    aria-label={isCenter ? `${item.title} selected` : `View ${item.title}`}
                    aria-pressed={isCenter}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="homeTwoRail__cardImage"
                      loading="lazy"
                    />
                    <span className="homeTwoRail__cardLight" aria-hidden="true" />
                    <span className="homeTwoRail__cardShade" aria-hidden="true" />

                    <span className="homeTwoRail__cardLabel">
                      <span className="homeTwoRail__cardMeta">{item.meta}</span>
                      <strong className="homeTwoRail__cardTitle">{item.title}</strong>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <div className="homeTwoRail__footer">
            <div className="homeTwoRail__copy">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.id}
                  className="homeTwoRail__copyInner"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <span className="homeTwoRail__eyebrow">{activeItem.meta}</span>
                  <h3 className="homeTwoRail__activeTitle">{activeItem.title}</h3>
                  <p className="homeTwoRail__activeDesc">{activeItem.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="homeTwoRail__actions">
              <div className="homeTwoRail__pager">
                <button
                  type="button"
                  className="homeTwoRail__navBtn"
                  onClick={handlePrev}
                  aria-label="Previous category"
                >
                  <ChevronLeft className="homeTwoRail__navIcon" />
                </button>

                <span className="homeTwoRail__count">
                  {activeIndex + 1} / {count}
                </span>

                <button
                  type="button"
                  className="homeTwoRail__navBtn"
                  onClick={handleNext}
                  aria-label="Next category"
                >
                  <ChevronRight className="homeTwoRail__navIcon" />
                </button>
              </div>

              <motion.button
                type="button"
                className="homeTwoRail__explore"
                whileHover={reduceMotion ? undefined : { y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
                onClick={handleExplore}
              >
                <span>Explore</span>
                <ArrowUpRight className="homeTwoRail__exploreIcon" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
