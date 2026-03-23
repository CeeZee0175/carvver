import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import "./home_aboutUs.css";
import HomeBackdrop from "./home_backdrop";

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

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => clearTimeout(timeoutId);
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

function SectionHeading({ eyebrow, title, delay = 0 }) {
  return (
    <div className="aboutUsSectionHead">
      {eyebrow && (
        <motion.p
          className="aboutUsSectionHead__eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay }}
        >
          {eyebrow}
        </motion.p>
      )}

      <div className="aboutUsSectionHead__titleWrap">
        <motion.h2
          className="aboutUsSectionHead__title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: delay + 0.08 }}
        >
          {title}
        </motion.h2>

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
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut", delay: delay + 0.14 }}
          />
        </motion.svg>
      </div>
    </div>
  );
}

const storyCards = [
  {
    title: "Built for creators at any pace",
    text:
      "Carvver is made for skilled hobbyists and casual freelancers who want a place where their handmade products or services can be discovered without needing to look like a large agency or full-time professional.",
  },
  {
    title: "Made to work beyond one platform",
    text:
      "We do not want creators to feel trapped inside our platform. Instead, we encourage growth through tools that help service providers share their listings across multiple social media platforms with ease.",
  },
  {
    title: "Focused on trust and clarity",
    text:
      "From verified badges to more secure transactions, Carvver is designed to make customers feel more confident while giving creators better ways to build credibility over time.",
  },
];

const pillars = [
  {
    title: "Discoverability",
    text:
      "We organize services into categories and location-aware discovery so customers can find relevant creators more easily.",
    Icon: Search,
  },
  {
    title: "Credibility",
    text:
      "Achievements, badges, and verified profiles help providers show progress, authenticity, and trustworthiness.",
    Icon: BadgeCheck,
  },
  {
    title: "Freedom to Promote",
    text:
      "Our few-click posting tool helps creators share listings outside the platform instead of forcing them to stay confined in one space.",
    Icon: Share2,
  },
  {
    title: "Safer Transactions",
    text:
      "With secured payment handling and easier refund support, customers and creators can interact with more confidence.",
    Icon: ShieldCheck,
  },
];

const platformTags = ["Facebook", "Instagram", "Twitter / X", "TikTok"];

export default function HomeAboutUs() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <HomeBackdrop />

      <main className="aboutUsPage">
        <div className="aboutUsPage__decor aboutUsPage__decor--a" aria-hidden="true" />
        <div className="aboutUsPage__decor aboutUsPage__decor--b" aria-hidden="true" />
        <div className="aboutUsPage__decor aboutUsPage__decor--c" aria-hidden="true" />

        <section className="aboutUsHero">
          <motion.p
            className="aboutUsHero__eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            About Carvver
          </motion.p>

          <div className="aboutUsHero__titleWrap">
            <h1 className="aboutUsHero__title">
              <TypewriterText text="About Us" speed={85} initialDelay={120} />
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

          <motion.p
            className="aboutUsHero__sub"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.2, 0.95, 0.2, 1] }}
          >
            Carvver is a freelancing platform built for skilled hobbyists who love creating handmade
            products and casual freelancers who offer creative or practical services.
          </motion.p>

          <motion.p
            className="aboutUsHero__support"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.2, 0.95, 0.2, 1] }}
          >
            We created Carvver to give these individuals a dedicated space where customers can
            discover them more easily—without forcing them to rely entirely on scattered social
            media posts or highly competitive platform systems.
          </motion.p>

          <motion.div
            className="aboutUsHero__actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.38, ease: [0.2, 0.95, 0.2, 1] }}
          >
            <motion.button
              type="button"
              className="aboutUsBtn aboutUsBtn--primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
            >
              <span className="aboutUsBtn__text">Explore Carvver</span>
              <span className="aboutUsBtn__arrowWrap" aria-hidden="true">
                <ArrowRight className="aboutUsBtn__arrow" />
              </span>
            </motion.button>

            <motion.button
              type="button"
              className="aboutUsBtn aboutUsBtn--secondary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </section>

        <section className="aboutUsStory">
          <SectionHeading eyebrow="Our Story" title="Why Carvver Exists" />

          <div className="aboutUsStory__grid">
            {storyCards.map((card, index) => (
              <motion.article
                key={card.title}
                className="aboutUsStoryCard"
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.6,
                  delay: 0.12 + index * 0.1,
                  ease: [0.2, 0.95, 0.2, 1],
                }}
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              >
                <h3 className="aboutUsStoryCard__title">{card.title}</h3>
                <p className="aboutUsStoryCard__text">{card.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="aboutUsFeature">
          <div className="aboutUsFeature__left">
            <SectionHeading eyebrow="What Makes Us Different" title="We don’t want creators to stay confined." />

            <p className="aboutUsFeature__text">
              One of Carvver’s unique ideas is that we do not want service providers to feel limited
              to our platform alone. Through our specially made sharing tool, creators can post their
              listings across multiple social media platforms in only a few clicks.
            </p>

            <p className="aboutUsFeature__text aboutUsFeature__text--muted">
              This helps them advertise themselves more freely, reach more customers, and grow their
              visibility while still keeping Carvver as their organized hub.
            </p>
          </div>

          <motion.div
            className="aboutUsFeature__right"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.18 }}
          >
            <div className="aboutUsFeaturePanel">
              <div className="aboutUsFeaturePanel__top">
                <div className="aboutUsFeaturePanel__iconWrap" aria-hidden="true">
                  <Share2 className="aboutUsFeaturePanel__icon" />
                </div>

                <div>
                  <h3 className="aboutUsFeaturePanel__title">Few-click Posting Tool</h3>
                  <p className="aboutUsFeaturePanel__sub">
                    Share listings where your audience already is.
                  </p>
                </div>
              </div>

              <div className="aboutUsFeaturePanel__tags">
                {platformTags.map((tag) => (
                  <span key={tag} className="aboutUsFeaturePanel__tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="aboutUsFeaturePanel__flow">
                <div className="aboutUsFeaturePanel__step">Create listing</div>
                <div className="aboutUsFeaturePanel__step">Select platforms</div>
                <div className="aboutUsFeaturePanel__step">Share in a few clicks</div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="aboutUsPillars">
          <SectionHeading eyebrow="Our Core Pillars" title="What We Intend to Raise" />

          <div className="aboutUsPillars__grid">
            {pillars.map(({ title, text, Icon }, index) => (
              <motion.article
                key={title}
                className="aboutUsPillarCard"
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.6,
                  delay: 0.12 + index * 0.08,
                  ease: [0.2, 0.95, 0.2, 1],
                }}
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              >
                <span className="aboutUsPillarCard__iconWrap" aria-hidden="true">
                  <Icon className="aboutUsPillarCard__icon" />
                </span>

                <h3 className="aboutUsPillarCard__title">{title}</h3>
                <p className="aboutUsPillarCard__text">{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="aboutUsQuote">
          <motion.p
            className="aboutUsQuote__eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            Our Quote
          </motion.p>

          <div className="aboutUsQuote__titleWrap">
            <h2 className="aboutUsQuote__title">
              <TypewriterText text='“Carve with what you love”' speed={56} initialDelay={180} />
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
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
              />
            </motion.svg>
          </div>

          <p className="aboutUsQuote__text">
            This line reflects the heart of Carvver: we want people to be able to create, offer, and
            grow using the things they genuinely enjoy doing.
          </p>
        </section>

        <section className="aboutUsClosing">
          <motion.div
            className="aboutUsClosing__card"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.16 }}
          >
            <div className="aboutUsClosing__iconWrap" aria-hidden="true">
              <Users className="aboutUsClosing__icon" />
            </div>

            <h2 className="aboutUsClosing__title">A platform shaped around creators and customers.</h2>

            <p className="aboutUsClosing__text">
              Carvver is not built to force people into a rigid, highly competitive freelance
              environment. Instead, it is designed to help customers discover services more easily
              while giving hobbyists and casual freelancers a better, safer, and more rewarding space
              to grow.
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}