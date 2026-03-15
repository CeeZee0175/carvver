import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import "./home_two.css";

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
    const t = setTimeout(start, initialDelay);
    return () => clearTimeout(t);
  }, [active, start, initialDelay]);

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
        {letters.map((l, idx) => (
          <motion.span
            key={`${idx}-${l.char}`}
            className="homeTwo__letter"
            initial={false}
            animate={l.isMatrix ? "matrix" : "normal"}
            variants={variants}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            style={{ fontVariantNumeric: "tabular-nums" }}
            aria-hidden="true"
          >
            {l.isSpace ? "\u00A0" : l.char}
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
    imageUrl:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Photography",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Video Editing",
    imageUrl:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Voice Over",
    imageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Social Media",
    imageUrl:
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Web Development",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Tutoring",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
  },
];

function AccordionItem({ item, isActive, onActivate, reduceMotion }) {
  return (
    <motion.button
      type="button"
      className={`accordionItem ${isActive ? "accordionItem--active" : ""}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      aria-label={item.title}
      aria-pressed={isActive}
      whileTap={reduceMotion ? undefined : { scale: 0.985, y: 2 }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className="accordionItem__image"
        loading="lazy"
      />
      <span className="accordionItem__overlay" aria-hidden="true" />
      <span className="accordionItem__title">{item.title}</span>
    </motion.button>
  );
}

export default function HomeTwo() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(6);

  return (
    <section className="homeTwo" ref={ref} aria-labelledby="homeTwo-title">
      <div className="homeTwo__inner">
        <div className="homeTwo__head">
          <MatrixTitle id="homeTwo-title" text="Categories" active={inView} />

          <p className="homeTwo__desc">
            Browse through some of our categories to find what you need.
          </p>
        </div>

        <div className="categoryAccordion" role="list" aria-label="Featured categories">
          {FEATURED_CATEGORIES.map((item, index) => (
            <AccordionItem
              key={item.id}
              item={item}
              isActive={index === activeIndex}
              onActivate={() => setActiveIndex(index)}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}