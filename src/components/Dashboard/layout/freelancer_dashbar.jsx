import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./dashbar.css";
import { getProfile, signOut } from "../../../lib/supabase/auth";
import { PROFILE_UPDATED_EVENT } from "../../../lib/profileSync";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "../shared/profileIdentity";

const SPRING = { type: "spring", stiffness: 340, damping: 24 };

export default function FreelancerDashBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openProfile, setOpenProfile] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    initials: "F",
    avatarUrl: "",
  });

  useEffect(() => {
    const syncUser = (profile) => {
      if (!profile) return;

      setUser({
        fullName: getProfileDisplayName(profile, "Freelancer"),
        email: profile.email || "",
        initials: getProfileInitials(profile, "F"),
        avatarUrl: profile.avatar_url || "",
      });
    };

    getProfile().then(syncUser).catch(() => {});

    const handleProfileUpdated = (event) => {
      syncUser(event.detail?.profile);
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpenProfile(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
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

  useEffect(() => {
    setOpenProfile(false);
  }, [location.pathname]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    toast("Search isn't available yet.");
  };

  const handleSignOut = async () => {
    setOpenProfile(false);

    try {
      await signOut();
      navigate("/sign-in");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const onMessagesPage = location.pathname === "/dashboard/freelancer/messages";
  const onSettingsPage = location.pathname === "/dashboard/freelancer/settings";

  return (
    <header
      className={`dashbarShell ${ready ? "dashbarShell--ready" : ""}`}
      ref={rootRef}
    >
      <Toaster position="top-center" />
      <div className="dashbar">
        <div className="dashbar__bg" aria-hidden="true" />

        <div className="dashbar__inner">
          <div className="dashbar__left dashbarEnter dashbarEnter--1">
            <button
              type="button"
              className="dashbar__brand"
              onClick={() => navigate("/dashboard/freelancer")}
            >
              Carvver
            </button>
          </div>

          <motion.form
            className="dashbar__searchWrap dashbarEnter dashbarEnter--2"
            onSubmit={handleSearchSubmit}
            initial={false}
          >
            <label className="dashbarSearch" aria-label="Search freelancer dashboard">
              <span className="dashbarSearch__iconWrap" aria-hidden="true">
                <Search className="dashbarSearch__icon" />
              </span>
              <input
                className="dashbarSearch__input"
                type="text"
                placeholder="Search your profile, tools, and pages..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </motion.form>

          <div className="dashbar__right dashbarEnter dashbarEnter--3">
            <motion.button
              type="button"
              className="dashbarPill dashbarPill--pro"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              onClick={() => navigate("/pricing")}
              aria-label="View Carvver Pro pricing"
            >
              <span className="dashbarPill__glow" aria-hidden="true" />
              <Sparkles className="dashbarPill__icon" />
              <span className="dashbarPill__text dashbarPill__text--pro">
                Join Carvver Pro
              </span>
            </motion.button>

            <motion.button
              type="button"
              className={`dashbarIconBtn ${
                onMessagesPage ? "dashbarIconBtn--active" : ""
              }`}
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              aria-label="Messages"
              aria-current={onMessagesPage ? "page" : undefined}
              onClick={() => navigate("/dashboard/freelancer/messages")}
            >
              <MessageCircle className="dashbarIconBtn__icon" />
            </motion.button>

            <motion.button
              type="button"
              className={`dashbarIconBtn ${
                onSettingsPage ? "dashbarIconBtn--active" : ""
              }`}
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              aria-label="Settings"
              aria-current={onSettingsPage ? "page" : undefined}
              onClick={() => navigate("/dashboard/freelancer/settings")}
            >
              <Settings className="dashbarIconBtn__icon" />
            </motion.button>

            <div className="dashbarProfileWrap">
              <motion.button
                type="button"
                className={`dashbarProfile ${
                  openProfile ? "dashbarProfile--open" : ""
                }`}
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                aria-label="Profile"
                aria-expanded={openProfile}
                aria-haspopup="menu"
                onClick={() => setOpenProfile((prev) => !prev)}
              >
                <span className="dashbarProfile__avatar" aria-hidden="true">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || "Profile"}
                      className="dashbarProfile__avatarImage"
                    />
                  ) : (
                    user.initials
                  )}
                </span>
              </motion.button>

              <div
                className={`dashbarProfileMenu ${
                  openProfile ? "dashbarProfileMenu--open" : ""
                }`}
                role="menu"
              >
                <div className="dashbarProfileMenu__header">
                  <div className="dashbarProfileMenu__avatar" aria-hidden="true">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || "Profile"}
                        className="dashbarProfileMenu__avatarImage"
                      />
                    ) : (
                      user.initials
                    )}
                  </div>
                  <div className="dashbarProfileMenu__identity">
                    <p className="dashbarProfileMenu__name">
                      {user.fullName || "Freelancer"}
                    </p>
                    <p className="dashbarProfileMenu__email">{user.email}</p>
                  </div>
                </div>

                <div className="dashbarProfileMenu__group">
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer");
                    }}
                  >
                    <Home className="dashbarProfileMenu__itemIcon" />
                    <span>Dashboard Home</span>
                  </button>

                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer/profile");
                    }}
                  >
                    <UserRound className="dashbarProfileMenu__itemIcon" />
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer/settings");
                    }}
                  >
                    <Settings className="dashbarProfileMenu__itemIcon" />
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="dashbarProfileMenu__group dashbarProfileMenu__group--danger">
                  <button
                    type="button"
                    className="dashbarProfileMenu__item dashbarProfileMenu__item--danger"
                    role="menuitem"
                    onClick={handleSignOut}
                  >
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
