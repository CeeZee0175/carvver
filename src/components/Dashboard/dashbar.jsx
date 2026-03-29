import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Compass,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  Bookmark,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./dashbar.css";
import { signOut, getProfile } from "../../lib/supabase/auth";

export default function DashBar() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openExplore, setOpenExplore] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    initials: "",
  });

  const rootRef = useRef(null);

  // Load real user data from Supabase on mount
  useEffect(() => {
    getProfile()
      .then((profile) => {
        if (!profile) return;
        const first = profile.first_name || "";
        const last = profile.last_name || "";
        setUser({
          fullName: `${first} ${last}`.trim(),
          email: profile.email || "",
          initials: `${first.charAt(0)}${last.charAt(0)}`.toUpperCase(),
        });
      })
      .catch(() => {
        // Silently fail — ProtectedRoute will handle unauthenticated users
      });
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpenExplore(false);
        setOpenProfile(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenExplore(false);
        setOpenProfile(false);
      }
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
    toast("Search coming soon!");
  };

  const toggleExplore = () => {
    setOpenExplore((prev) => {
      const next = !prev;
      if (next) setOpenProfile(false);
      return next;
    });
  };

  const toggleProfile = () => {
    setOpenProfile((prev) => {
      const next = !prev;
      if (next) setOpenExplore(false);
      return next;
    });
  };

  const handleExploreMenuClick = (label) => {
    setOpenExplore(false);

    if (label === "Browse Services") {
      navigate("/dashboard/customer/browse-services");
      return;
    }

    if (label === "About Us") {
      navigate("/about-us");
      return;
    }

    toast("Coming soon!");
  };

  const handleProfileMenuClick = (label) => {
    setOpenProfile(false);
    toast(`${label} coming soon!`);
  };

  const handleSignOut = async () => {
    setOpenProfile(false);
    try {
      await signOut();
      navigate("/sign-in");
    } catch (err) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <header className={`dashbarShell ${ready ? "dashbarShell--ready" : ""}`} ref={rootRef}>
      <Toaster position="top-center" />
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
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("Browse Services")}>
                  Browse Services
                </button>
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("About Us")}>
                  About Us
                </button>
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("Community")}>
                  Community
                </button>
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("Features")}>
                  Features
                </button>
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("Pricing")}>
                  Pricing
                </button>
                <button type="button" className="dashbarMenu__item" role="menuitem"
                  onClick={() => handleExploreMenuClick("FAQ")}>
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
              onClick={() => toast("Messages coming soon!")}
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
              onClick={() => toast("Cart coming soon!")}
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
              onClick={() => toast("Notifications coming soon!")}
            >
              <Bell className="dashbarIconBtn__icon" />
              <span className="dashbarIconBtn__dot" aria-hidden="true" />
            </motion.button>

            <div className="dashbarProfileWrap">
              <motion.button
                type="button"
                className={`dashbarProfile ${openProfile ? "dashbarProfile--open" : ""}`}
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                aria-label="Profile"
                aria-expanded={openProfile}
                aria-haspopup="menu"
                onClick={toggleProfile}
              >
                <span className="dashbarProfile__avatar" aria-hidden="true">
                  {user.initials}
                </span>
              </motion.button>

              <div className={`dashbarProfileMenu ${openProfile ? "dashbarProfileMenu--open" : ""}`} role="menu">
                <div className="dashbarProfileMenu__header">
                  <div className="dashbarProfileMenu__avatar" aria-hidden="true">
                    {user.initials}
                  </div>
                  <div className="dashbarProfileMenu__identity">
                    <p className="dashbarProfileMenu__name">{user.fullName || "Loading..."}</p>
                    <p className="dashbarProfileMenu__email">{user.email}</p>
                  </div>
                </div>

                <div className="dashbarProfileMenu__group">
                  <button type="button" className="dashbarProfileMenu__item" role="menuitem"
                    onClick={() => handleProfileMenuClick("View Profile")}>
                    <UserRound className="dashbarProfileMenu__itemIcon" />
                    <span>View Profile</span>
                  </button>
                  <button type="button" className="dashbarProfileMenu__item" role="menuitem"
                    onClick={() => handleProfileMenuClick("Account Settings")}>
                    <Settings className="dashbarProfileMenu__itemIcon" />
                    <span>Account Settings</span>
                  </button>
                  <button type="button" className="dashbarProfileMenu__item" role="menuitem"
                    onClick={() => handleProfileMenuClick("My Orders")}>
                    <ShoppingBag className="dashbarProfileMenu__itemIcon" />
                    <span>My Orders</span>
                  </button>
                  <button type="button" className="dashbarProfileMenu__item" role="menuitem"
                    onClick={() => handleProfileMenuClick("Saved Listings")}>
                    <Bookmark className="dashbarProfileMenu__itemIcon" />
                    <span>Saved Listings</span>
                  </button>
                </div>

                <div className="dashbarProfileMenu__group dashbarProfileMenu__group--danger">
                  <button type="button" className="dashbarProfileMenu__item dashbarProfileMenu__item--danger"
                    role="menuitem" onClick={handleSignOut}>
                    <LogOut className="dashbarProfileMenu__itemIcon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}