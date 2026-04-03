import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
} from "lucide-react";
import "./home_footer.css";

const exploreLinks = [
  { label: "Home", target: "home-hero" },
  { label: "About Us", routeKey: "about-us" },
  { label: "Categories", target: "home-categories" },
  { label: "How It Works", target: "home-how" },
  { label: "Stay Tuned", target: "home-updates" },
  { label: "Community", target: null },
];

const platformLinks = [
  { label: "Achievements and Badges", Icon: Award, target: null },
  { label: "Verified Badges", Icon: BadgeCheck, target: null },
  { label: "Few-click Posting", Icon: Share2, target: null },
  { label: "Secured Transactions", Icon: ShieldCheck, target: null },
  { label: "Location Services", Icon: MapPin, target: "home-categories" },
];

const supportLinks = [
  { label: "Contact Us", target: null },
  { label: "Help Center", target: null },
  { label: "FAQs", target: null },
  { label: "Terms", target: null },
  { label: "Privacy Policy", target: null },
];

const socials = [
  { label: "Facebook", Icon: Facebook },
  { label: "Instagram", Icon: Instagram },
  { label: "Email", Icon: Mail },
  { label: "Website", Icon: Globe },
];

function TypewriterMotto({ text, active, speed = 42, initialDelay = 220 }) {
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
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [active, text, speed, initialDelay, reduceMotion]);

  return (
    <div className="homeFooter__mottoWrap">
      <span className="homeFooter__motto">{displayText}</span>
      {!reduceMotion && displayText.length < text.length && (
        <motion.span
          className="homeFooter__mottoCursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </div>
  );
}

function FooterHeading({ children, active }) {
  return (
    <div className="homeFooter__headingWrap">
      <motion.h3
        className="homeFooter__heading"
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1] }}
      >
        {children}
      </motion.h3>

      <motion.svg
        className="homeFooter__headingLine"
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: "easeInOut", delay: 0.08 }}
        />
      </motion.svg>
    </div>
  );
}

function FooterLinkItem({ item, index, onNavigate, onRouteNavigate, active }) {
  const Icon = item.Icon;

  return (
    <motion.button
      type="button"
      className="homeFooter__link"
      initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
      animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{
        duration: 0.48,
        ease: [0.2, 0.95, 0.2, 1],
        delay: 0.08 + index * 0.06,
      }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => {
        if (item.route) {
          onRouteNavigate(item.route);
          return;
        }
        if (item.target) {
          onNavigate(item.target);
        }
      }}
      title={item.label}
    >
      <span className="homeFooter__linkMain">
        {Icon && (
          <span className="homeFooter__linkIconWrap" aria-hidden="true">
            <Icon className="homeFooter__linkIcon" />
          </span>
        )}
        <span className="homeFooter__linkText">{item.label}</span>
      </span>

      <ChevronRight className="homeFooter__linkChevron" aria-hidden="true" />
    </motion.button>
  );
}

export default function HomeFooter({ fullBleed = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.14, once: true });
  const reduceMotion = useReducedMotion();
  const aboutUsRoute = location.pathname.startsWith("/dashboard/customer")
    ? "/dashboard/customer/about-us"
    : "/about-us";

  const resolvedExploreLinks = exploreLinks.map((item) =>
    item.routeKey === "about-us"
      ? { ...item, route: aboutUsRoute }
      : item
  );

  const scrollToTarget = (id) => {
    if (!id) return;
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <footer className={`homeFooter ${fullBleed ? "homeFooter--fullBleed" : ""}`} ref={ref}>
      <div className="homeFooter__wash homeFooter__wash--a" aria-hidden="true" />
      <div className="homeFooter__wash homeFooter__wash--b" aria-hidden="true" />
      <div className="homeFooter__goldLine" aria-hidden="true" />

      <motion.div
        className="homeFooter__inner"
        initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.65, ease: [0.2, 0.95, 0.2, 1] }}
      >
        <div className="homeFooter__top">
          <motion.div
            className="homeFooter__brandBlock"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.08 }}
          >
            <div className="homeFooter__brandWrap">
              <h2 className="homeFooter__brand">Carvver</h2>

              <motion.svg
                className="homeFooter__brandLine"
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
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.1, ease: "easeInOut", delay: 0.22 }}
                />
              </motion.svg>
            </div>

            <p className="homeFooter__desc">
              Built for hobbyists or casual freelancers who are keen on creating and sharing their
              handmade products or services to get discovered more easily.
            </p>

            <div className="homeFooter__socials" aria-label="Social links">
              {socials.map(({ label, Icon }, index) => (
                <motion.button
                  key={label}
                  type="button"
                  className="homeFooter__socialBtn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.45,
                    ease: [0.2, 0.95, 0.2, 1],
                    delay: 0.18 + index * 0.06,
                  }}
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label={label}
                >
                  <Icon className="homeFooter__socialIcon" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="homeFooter__cols">
            <div className="homeFooter__col">
              <FooterHeading active={inView}>Explore</FooterHeading>
              <div className="homeFooter__links">
                {resolvedExploreLinks.map((item, index) => (
                  <FooterLinkItem
                    key={item.label}
                    item={item}
                    index={index}
                    onNavigate={scrollToTarget}
                    onRouteNavigate={navigate}
                    active={inView}
                  />
                ))}
              </div>
            </div>

            <div className="homeFooter__col">
              <FooterHeading active={inView}>Platform</FooterHeading>
              <div className="homeFooter__links">
                {platformLinks.map((item, index) => (
                  <FooterLinkItem
                    key={item.label}
                    item={item}
                    index={index}
                    onNavigate={scrollToTarget}
                    onRouteNavigate={navigate}
                    active={inView}
                  />
                ))}
              </div>
            </div>

            <div className="homeFooter__col">
              <FooterHeading active={inView}>Support</FooterHeading>
              <div className="homeFooter__links">
                {supportLinks.map((item, index) => (
                  <FooterLinkItem
                    key={item.label}
                    item={item}
                    index={index}
                    onNavigate={scrollToTarget}
                    onRouteNavigate={navigate}
                    active={inView}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="homeFooter__bottom"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.24 }}
        >
          <TypewriterMotto active={inView} text="Carve with what you love" />

          <p className="homeFooter__copy">
            © {new Date().getFullYear()} Carvver. All rights reserved.
          </p>

        </motion.div>
      </motion.div>
    </footer>
  );
}
