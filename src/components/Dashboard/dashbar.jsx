import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Compass,
  MessageCircle,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import "./dashbar.css";

export default function DashBar() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openExplore, setOpenExplore] = useState(false);

  const rootRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpenExplore(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpenExplore(false);
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Dashboard search:", query);
  };

  const toggleExplore = () => {
    setOpenExplore((prev) => !prev);
  };

  const handleMenuClick = (label) => {
    setOpenExplore(false);

    if (label === "Browse Services") {
      navigate("/dashboard/customer/browse-services");
      return;
    }

    console.log(`${label} clicked`);
  };

  return (
    <header className={`dashbarShell ${ready ? "dashbarShell--ready" : ""}`} ref={rootRef}>
      <div className="dashbar">
        <div className="dashbar__bg" aria-hidden="true" />

        <div className="dashbar__inner">
          <div className="dashbar__left dashbarEnter dashbarEnter--1">
            <button
              type="button"
              className="dashbar__brand"
              onClick={() => navigate("/dashboard/customer")}
            >
              Carvver
            </button>
          </div>

          <motion.form
            className="dashbar__searchWrap dashbarEnter dashbarEnter--2"
            onSubmit={handleSearchSubmit}
            initial={false}
          >
            <label className="dashbarSearch" aria-label="Search dashboard">
              <span className="dashbarSearch__iconWrap" aria-hidden="true">
                <Search className="dashbarSearch__icon" />
              </span>

              <input
                className="dashbarSearch__input"
                type="text"
                placeholder="Search services, listings, creators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </motion.form>

          <div className="dashbar__right dashbarEnter dashbarEnter--3">
            <div className="dashbarExplore">
              <motion.button
                type="button"
                className={`dashbarPill dashbarPill--explore ${openExplore ? "dashbarPill--open" : ""}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                onClick={toggleExplore}
                aria-expanded={openExplore}
                aria-haspopup="menu"
              >
                <Compass className="dashbarPill__icon" />
                <span className="dashbarPill__text">Explore</span>
                <ChevronDown
                  className={`dashbarPill__chevron ${openExplore ? "dashbarPill__chevron--open" : ""}`}
                />
              </motion.button>

              <div className={`dashbarMenu ${openExplore ? "dashbarMenu--open" : ""}`} role="menu">
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("Browse Services")}
                >
                  Browse Services
                </button>

                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("About Us")}
                >
                  About Us
                </button>

                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("Community")}
                >
                  Community
                </button>

                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("Features")}
                >
                  Features
                </button>

                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("Pricing")}
                >
                  Pricing
                </button>

                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleMenuClick("FAQ")}
                >
                  FAQ
                </button>
              </div>
            </div>

            <motion.button
              type="button"
              className="dashbarIconBtn"
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              aria-label="Messages"
              onClick={() => console.log("Messages clicked")}
            >
              <MessageCircle className="dashbarIconBtn__icon" />
            </motion.button>

            <motion.button
              type="button"
              className="dashbarIconBtn"
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              aria-label="Cart"
              onClick={() => console.log("Cart clicked")}
            >
              <ShoppingCart className="dashbarIconBtn__icon" />
            </motion.button>

            <motion.button
              type="button"
              className="dashbarIconBtn dashbarIconBtn--notify"
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              aria-label="Notifications"
              onClick={() => console.log("Notifications clicked")}
            >
              <Bell className="dashbarIconBtn__icon" />
              <span className="dashbarIconBtn__dot" aria-hidden="true" />
            </motion.button>

            <motion.button
              type="button"
              className="dashbarProfile"
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              aria-label="Profile"
              onClick={() => console.log("Profile clicked")}
            >
              <UserRound className="dashbarProfile__icon" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}