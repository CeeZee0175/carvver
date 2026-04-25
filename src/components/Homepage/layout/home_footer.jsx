import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion as Motion, useInView, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  Mail,
} from "lucide-react";
import "./home_footer.css";
import { createClient } from "../../../lib/supabase/client";
import {
  buildCategoryPath,
  setFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";
import {
  navigateToHomeSection,
  navigateToPublicRoute,
} from "../../../lib/publicNavigation";
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";

const supabase = createClient();

const exploreLinks = [
  { label: "Home", target: "home-hero" },
  { label: "About Us", routeKey: "about-us" },
  { label: "Features", routeKey: "features" },
  { label: "Stay Tuned", target: "home-updates" },
  { label: "Community", routeKey: "community" },
  { label: "Pricing", routeKey: "pricing" },
];

const supportLinks = [
  { label: "Contact Us", routeKey: "contact-us" },
  { label: "Help Center", routeKey: "help-center" },
  { label: "FAQs", routeKey: "faq" },
  { label: "Terms", routeKey: "terms" },
  { label: "Privacy Policy", routeKey: "privacy-policy" },
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
      queueMicrotask(() => setDisplayText(text));
      return undefined;
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
        <Motion.span
          className="homeFooter__mottoCursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </Motion.span>
      )}
    </div>
  );
}

function FooterHeading({ children, active }) {
  return (
    <div className="homeFooter__headingWrap">
      <Motion.h3
        className="homeFooter__heading"
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1] }}
      >
        {children}
      </Motion.h3>

      <Motion.svg
        className="homeFooter__headingLine"
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <Motion.path
          d="M 0,10 L 300,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: "easeInOut", delay: 0.08 }}
        />
      </Motion.svg>
    </div>
  );
}

function FooterLinkItem({ item, index, onNavigate, onRouteNavigate, active }) {
  const Icon = item.Icon;

  return (
    <Motion.button
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
        if (item.onClick) {
          item.onClick();
          return;
        }
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
    </Motion.button>
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

  const resolvedExploreLinks = exploreLinks.map((item) => {
    if (item.routeKey === "about-us") {
      return { ...item, route: aboutUsRoute };
    }

    if (item.routeKey === "community") {
      return { ...item, route: "/community" };
    }

    if (item.routeKey === "features") {
      return { ...item, route: "/features" };
    }

    if (item.routeKey === "pricing") {
      return { ...item, route: "/pricing" };
    }

    return item;
  });

  const resolvedSupportLinks = supportLinks.map((item) => {
    if (item.routeKey === "faq") {
      return { ...item, route: "/faq" };
    }

    if (item.routeKey === "contact-us") {
      return { ...item, route: "/contact-us" };
    }

    if (item.routeKey === "help-center") {
      return { ...item, route: "/help-center" };
    }

    if (item.routeKey === "terms") {
      return { ...item, route: "/terms" };
    }

    if (item.routeKey === "privacy-policy") {
      return { ...item, route: "/privacy-policy" };
    }

    return item;
  });

  const handleCategoryNavigate = async (category) => {
    const normalized = String(category || "").trim();
    if (!normalized) return;

    setFeaturedCategoryIntent(normalized);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate(buildCategoryPath("/dashboard/customer/browse-services", normalized));
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate(buildCategoryPath("/sign-up", normalized));
  };

  const categoryLinks = ALL_SERVICE_CATEGORIES.map((label) => ({
    label,
    onClick: () => {
      handleCategoryNavigate(label);
    },
  }));

  const scrollToTarget = (id) => {
    if (!id) return;
    navigateToHomeSection({
      navigate,
      location,
      targetId: id,
      reduceMotion,
    });
  };

  const routeToTarget = (pathname) => {
    navigateToPublicRoute({
      navigate,
      location,
      pathname,
      reduceMotion,
    });
  };

  return (
    <footer className={`homeFooter ${fullBleed ? "homeFooter--fullBleed" : ""}`} ref={ref}>
      <div className="homeFooter__wash homeFooter__wash--a" aria-hidden="true" />
      <div className="homeFooter__wash homeFooter__wash--b" aria-hidden="true" />
      <div className="homeFooter__goldLine" aria-hidden="true" />

      <Motion.div
        className="homeFooter__inner"
        initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.65, ease: [0.2, 0.95, 0.2, 1] }}
      >
        <div className="homeFooter__top">
          <Motion.div
            className="homeFooter__brandBlock"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.08 }}
          >
            <div className="homeFooter__brandWrap">
              <h2 className="homeFooter__brand">Carvver</h2>

              <Motion.svg
                className="homeFooter__brandLine"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M 0,10 L 300,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.1, ease: "easeInOut", delay: 0.22 }}
                />
              </Motion.svg>
            </div>

            <p className="homeFooter__desc">
              Creative services and handmade work, all in one place.
            </p>

            <div className="homeFooter__socials" aria-label="Social links">
              {socials.map(({ label, Icon }, index) => (
                <Motion.button
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
                  {React.createElement(Icon, {
                    className: "homeFooter__socialIcon",
                  })}
                </Motion.button>
              ))}
            </div>
          </Motion.div>

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
                    onRouteNavigate={routeToTarget}
                    active={inView}
                  />
                ))}
              </div>
            </div>

            <div className="homeFooter__col">
              <FooterHeading active={inView}>Categories</FooterHeading>
              <div className="homeFooter__links homeFooter__links--categories">
                {categoryLinks.map((item, index) => (
                  <FooterLinkItem
                    key={item.label}
                    item={item}
                    index={index}
                    onNavigate={scrollToTarget}
                    onRouteNavigate={routeToTarget}
                    active={inView}
                  />
                ))}
              </div>
            </div>

            <div className="homeFooter__col">
              <FooterHeading active={inView}>Support</FooterHeading>
              <div className="homeFooter__links">
                {resolvedSupportLinks.map((item, index) => (
                  <FooterLinkItem
                    key={item.label}
                    item={item}
                    index={index}
                    onNavigate={scrollToTarget}
                    onRouteNavigate={routeToTarget}
                    active={inView}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Motion.div
          className="homeFooter__bottom"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.24 }}
        >
          <TypewriterMotto active={inView} text="Carve with what you love" />

          <p className="homeFooter__copy">
            Copyright {new Date().getFullYear()} Carvver. All rights reserved.
          </p>

        </Motion.div>
      </Motion.div>
    </footer>
  );
}
