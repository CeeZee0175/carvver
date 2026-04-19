import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import "./navbar.css";

const supabase = createClient();

function ChevronIcon({ open }) {
  return (
    <svg
      className={`nav__chevron ${open ? "nav__chevron--open" : ""}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M7 10l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="nav__arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg className="nav__menuIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20c.8-3.8 4-6.5 7.5-6.5s6.7 2.7 7.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="nav__menuIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M3 12h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10 12v1a2 2 0 0 0 4 0v-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openStart, setOpenStart] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openFaqNotice, setOpenFaqNotice] = useState(false);
  const [ready, setReady] = useState(false);

  const rootRef = useRef(null);

  const closeAll = () => {
    setOpenStart(false);
    setOpenMobile(false);
    setOpenFaqNotice(false);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) closeAll();
    };

    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleStart = () => {
    setOpenStart((v) => {
      const next = !v;
      if (next) setOpenFaqNotice(false);
      return next;
    });
  };

  const handleSignInClick = () => {
    closeAll();
    navigate("/sign-in");
  };

  const handleSignUpClick = () => {
    closeAll();
    navigate("/sign-up");
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    closeAll();
    navigate("/");
  };

  const handleFeatureClick = () => {
    closeAll();
    if (location.pathname !== "/") {
      navigate("/#home-how");
      return;
    }

    const element = document.getElementById("home-how");
    if (!element) {
      navigate("/#home-how");
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleFaqClick = () => {
    setOpenStart(false);
    setOpenMobile(false);
    setOpenFaqNotice(true);
  };

  const handleClientStart = async () => {
    closeAll();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard/customer/browse-services");
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate("/sign-up");
  };

  const handleFreelancerStart = async () => {
    closeAll();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard/freelancer");
        return;
      }
    } catch {
      // Fall through to sign-up.
    }

    navigate("/sign-up");
  };

  return (
    <header className={`navShell ${ready ? "navShell--ready" : ""}`} ref={rootRef}>
      <div className="navBar">
        <div className="navBg" aria-hidden="true" />

        <div className="navInner">
          <div className="navLeft navEnter navEnter--1">
            <a className="navBrand" href="/" onClick={handleBrandClick}>
              Carvver
            </a>

            <nav className="navLinks" aria-label="Primary">
              <div className="navGroup">
                <button
                  className={`navPill ${openStart ? "navPill--open" : ""}`}
                  type="button"
                  onClick={toggleStart}
                  aria-expanded={openStart}
                  aria-haspopup="menu"
                >
                  Get Started <ChevronIcon open={openStart} />
                </button>

                <div className={`navMenu navMenu--wide ${openStart ? "navMenu--open" : ""}`} role="menu">
                  <button className="navStartRow" type="button" role="menuitem" onClick={handleClientStart}>
                    <span className="navStartRow__icon"><PeopleIcon /></span>
                    <div className="navStartRow__text">
                      <div className="navStartRow__title">Client? Browse Now!</div>
                      <div className="navStartRow__desc">
                        Browse through service provider listings to find what you need.
                      </div>
                    </div>
                  </button>

                  <button className="navStartRow" type="button" role="menuitem" onClick={handleFreelancerStart}>
                    <span className="navStartRow__icon"><BriefcaseIcon /></span>
                    <div className="navStartRow__text">
                      <div className="navStartRow__title">Freelancer? Start Now!</div>
                      <div className="navStartRow__desc">
                        Register now to start selling your services.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="navInlineLinks">
                <button
                  className="navLinkPill"
                  type="button"
                  onClick={() => {
                    closeAll();
                    navigate("/about-us");
                  }}
                >
                  About Us
                </button>
                <button
                  className="navLinkPill"
                  type="button"
                  onClick={() => {
                    closeAll();
                    navigate("/community");
                  }}
                >
                  Community
                </button>
                <button className="navLinkPill" type="button" onClick={handleFeatureClick}>
                  Features
                </button>
                <button
                  className="navLinkPill"
                  type="button"
                  onClick={() => {
                    closeAll();
                    navigate("/pricing");
                  }}
                >
                  Pricing
                </button>
                <button className="navLinkPill" type="button" onClick={handleFaqClick}>
                  FAQ
                </button>
              </div>
            </nav>
          </div>

          <div className="navActions navEnter navEnter--2">
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="btn btn--ghost"
              type="button"
              onClick={handleSignInClick}
            >
              Sign In
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.93 }}
              className="btn btn--primary"
              type="button"
              onClick={handleSignUpClick}
            >
              <span className="btn__text">Sign Up</span>
              <span className="btn__arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            </motion.button>

            <button
              className={`burger ${openMobile ? "burger--open" : ""}`}
              type="button"
              aria-label="Open menu"
              aria-expanded={openMobile}
              onClick={() => setOpenMobile((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      <AnimateFaqPopup open={openFaqNotice} onClose={() => setOpenFaqNotice(false)} />

      <div className={`mobilePanel ${openMobile ? "mobilePanel--open" : ""}`}>
        <div className="mobilePrimaryLinks">
          <button
            className="mobileLinkBtn"
            type="button"
            onClick={() => {
              closeAll();
              navigate("/about-us");
            }}
          >
            About Us
          </button>
          <button
            className="mobileLinkBtn"
            type="button"
            onClick={() => {
              closeAll();
              navigate("/community");
            }}
          >
            Community
          </button>
          <button className="mobileLinkBtn" type="button" onClick={handleFeatureClick}>
            Features
          </button>
          <button
            className="mobileLinkBtn"
            type="button"
            onClick={() => {
              closeAll();
              navigate("/pricing");
            }}
          >
            Pricing
          </button>
          <button className="mobileLinkBtn" type="button" onClick={handleFaqClick}>
            FAQ
          </button>
        </div>

        <button className="mobileLinkBtn" type="button" onClick={toggleStart}>
          Get Started <ChevronIcon open={openStart} />
        </button>

        {openStart && (
          <div className="mobileSub">
            <button className="navStartRow navStartRow--mobile" type="button" onClick={handleClientStart}>
              <span className="navStartRow__icon"><PeopleIcon /></span>
              <div className="navStartRow__text">
                <div className="navStartRow__title">Client? Browse Now!</div>
                <div className="navStartRow__desc">
                  Browse through service provider listings to find what you need.
                </div>
              </div>
            </button>

            <button className="navStartRow navStartRow--mobile" type="button" onClick={handleFreelancerStart}>
              <span className="navStartRow__icon"><BriefcaseIcon /></span>
              <div className="navStartRow__text">
                <div className="navStartRow__title">Freelancer? Start Now!</div>
                <div className="navStartRow__desc">
                  Register now to start selling your services.
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="mobileActions">
          <motion.button
            whileTap={{ scale: 0.93 }}
            className="btn btn--ghost"
            type="button"
            onClick={handleSignInClick}
          >
            Sign In
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            className="btn btn--primary"
            type="button"
            onClick={handleSignUpClick}
          >
            <span className="btn__text">Sign Up</span>
            <span className="btn__arrow" aria-hidden="true">
              <ArrowIcon />
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function AnimateFaqPopup({ open, onClose }) {
  if (!open) return null;

  return (
    <motion.div
      className="navNotice"
      role="dialog"
      aria-modal="false"
      aria-labelledby="nav-faq-title"
      initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(8px)" }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <strong id="nav-faq-title" className="navNotice__title">
        FAQ is still under work
      </strong>
      <p className="navNotice__copy">
        We are still building the FAQ section for Carvver. It will be available soon.
      </p>
      <button className="navNotice__button" type="button" onClick={onClose}>
        Close
      </button>
    </motion.div>
  );
}
