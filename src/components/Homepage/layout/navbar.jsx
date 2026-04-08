import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

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

  const [openExplore, setOpenExplore] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [ready, setReady] = useState(false);

  const rootRef = useRef(null);

  const closeAll = () => {
    setOpenExplore(false);
    setOpenStart(false);
    setOpenMobile(false);
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

  const toggleExplore = () => {
    setOpenExplore((v) => {
      const next = !v;
      if (next) setOpenStart(false);
      return next;
    });
  };

  const toggleStart = () => {
    setOpenStart((v) => {
      const next = !v;
      if (next) setOpenExplore(false);
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
                  className={`navPill ${openExplore ? "navPill--open" : ""}`}
                  type="button"
                  onClick={toggleExplore}
                  aria-expanded={openExplore}
                  aria-haspopup="menu"
                >
                  Explore <ChevronIcon open={openExplore} />
                </button>

                <div className={`navMenu ${openExplore ? "navMenu--open" : ""}`} role="menu">
                  <button
                    className="navMenu__item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeAll();
                      navigate("/about-us");
                    }}
                  >
                    About Us
                  </button>
                  <button
                    className="navMenu__item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeAll();
                      navigate("/community");
                    }}
                  >
                    Community
                  </button>
                  <a className="navMenu__item" href="#" role="menuitem" onClick={closeAll}>
                    Features
                  </a>
                  <button
                    className="navMenu__item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeAll();
                      navigate("/pricing");
                    }}
                  >
                    Pricing
                  </button>
                  <a className="navMenu__item" href="#" role="menuitem" onClick={closeAll}>
                    FAQ
                  </a>
                </div>
              </div>

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
                  <button className="navStartRow" type="button" role="menuitem" onClick={closeAll}>
                    <span className="navStartRow__icon"><PeopleIcon /></span>
                    <div className="navStartRow__text">
                      <div className="navStartRow__title">Client? Browse Now!</div>
                      <div className="navStartRow__desc">
                        Browse through service provider listings to find what you need.
                      </div>
                    </div>
                  </button>

                  <button className="navStartRow" type="button" role="menuitem" onClick={closeAll}>
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

      <div className={`mobilePanel ${openMobile ? "mobilePanel--open" : ""}`}>
        <button className="mobileLinkBtn" type="button" onClick={toggleExplore}>
          Explore <ChevronIcon open={openExplore} />
        </button>

        {openExplore && (
          <div className="mobileSub">
            <button
              className="mobileSub__item"
              type="button"
              onClick={() => {
                closeAll();
                navigate("/about-us");
              }}
            >
              About Us
            </button>
            <button
              className="mobileSub__item"
              type="button"
              onClick={() => {
                closeAll();
                navigate("/community");
              }}
            >
              Community
            </button>
            <a className="mobileSub__item" href="#" onClick={closeAll}>Features</a>
            <button
              className="mobileSub__item"
              type="button"
              onClick={() => {
                closeAll();
                navigate("/pricing");
              }}
            >
              Pricing
            </button>
            <a className="mobileSub__item" href="#" onClick={closeAll}>FAQ</a>
          </div>
        )}

        <button className="mobileLinkBtn" type="button" onClick={toggleStart}>
          Get Started <ChevronIcon open={openStart} />
        </button>

        {openStart && (
          <div className="mobileSub">
            <button className="navStartRow navStartRow--mobile" type="button" onClick={closeAll}>
              <span className="navStartRow__icon"><PeopleIcon /></span>
              <div className="navStartRow__text">
                <div className="navStartRow__title">Client? Browse Now!</div>
                <div className="navStartRow__desc">
                  Browse through service provider listings to find what you need.
                </div>
              </div>
            </button>

            <button className="navStartRow navStartRow--mobile" type="button" onClick={closeAll}>
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
