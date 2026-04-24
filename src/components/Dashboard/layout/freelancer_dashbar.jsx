import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCheck,
  Home,
  LogOut,
  MessageCircle,
  Newspaper,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./dashbar.css";
import { getProfile, signOut } from "../../../lib/supabase/auth";
import { PROFILE_UPDATED_EVENT } from "../../../lib/profileSync";
import {
  formatNotificationTime,
  useNotifications,
} from "../hooks/useNotifications";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "../shared/profileIdentity";
import VerifiedBadge from "../shared/VerifiedBadge";

const SPRING = { type: "spring", stiffness: 340, damping: 24 };

function NotificationPreviewItem({ item, index, onOpen }) {
  const Icon = item.Icon;

  return (
    <Motion.button
      type="button"
      className="dashbarNotifyItem"
      initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.28,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOpen(item)}
    >
      <span
        className="dashbarNotifyItem__iconWrap"
        style={{
          "--notify-accent": item.accent,
          "--notify-accent-soft": item.accentSoft,
        }}
        aria-hidden="true"
      >
        <Icon className="dashbarNotifyItem__icon" />
      </span>

      <span className="dashbarNotifyItem__copy">
        <span className="dashbarNotifyItem__meta">
          <span className="dashbarNotifyItem__tag">{item.label}</span>
          <span className="dashbarNotifyItem__time">
            {formatNotificationTime(item.createdAt)}
          </span>
        </span>
        <span className="dashbarNotifyItem__title">{item.title}</span>
      </span>
    </Motion.button>
  );
}

export default function FreelancerDashBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading: notificationsLoading,
    unreadNotifications,
    hasUnread,
    markAllRead,
    markRead,
  } = useNotifications();
  const rootRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    initials: "F",
    avatarUrl: "",
    verified: false,
  });

  useEffect(() => {
    const syncUser = (profile) => {
      if (!profile) return;

      setUser({
        fullName: getProfileDisplayName(profile, "Freelancer"),
        email: profile.email || "",
        initials: getProfileInitials(profile, "F"),
        avatarUrl: profile.avatar_url || "",
        verified: Boolean(profile.freelancer_verified_at),
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
        setOpenNotifications(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpenProfile(false);
        setOpenNotifications(false);
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
    queueMicrotask(() => {
      setOpenProfile(false);
      setOpenNotifications(false);
    });
  }, [location.pathname]);

  useEffect(() => {
    queueMicrotask(() => {
      if (location.pathname === "/dashboard/freelancer/search") {
        const params = new URLSearchParams(location.search);
        setQuery(params.get("q") || "");
        return;
      }

      setQuery("");
    });
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    navigate(
      normalizedQuery
        ? `/dashboard/freelancer/search?q=${encodeURIComponent(normalizedQuery)}`
        : "/dashboard/freelancer/search"
    );
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

  const handleOpenNotification = async (item) => {
    try {
      await markRead(item.id);
    } catch {
      toast.error("We couldn't update notifications. Please try again.");
    }

    setOpenNotifications(false);
    navigate(item.path);
  };

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;

    try {
      await markAllRead();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("We couldn't update notifications. Please try again.");
    }
  };

  const toggleProfile = () => {
    setOpenProfile((prev) => {
      const next = !prev;
      if (next) {
        setOpenNotifications(false);
      }
      return next;
    });
  };

  const toggleNotifications = () => {
    setOpenNotifications((prev) => {
      const next = !prev;
      if (next) {
        setOpenProfile(false);
      }
      return next;
    });
  };

  const handleOpenNotificationsPage = () => {
    setOpenNotifications(false);
    navigate("/dashboard/freelancer/notifications");
  };

  const previewNotifications = unreadNotifications.slice(0, 4);
  const onNotificationsPage =
    location.pathname === "/dashboard/freelancer/notifications";

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

          <Motion.form
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
                placeholder="Search request listings or your listings..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </Motion.form>

          <div className="dashbar__right dashbarEnter dashbarEnter--3">
            <Motion.button
              type="button"
              className="dashbarPill dashbarPill--pro"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              onClick={() => navigate("/pricing")}
              aria-label="View Carvver Pro pricing"
            >
              <span className="dashbarPill__glow" aria-hidden="true" />
              <span className="dashbarPill__text dashbarPill__text--pro">
                Join Carvver Pro
              </span>
            </Motion.button>

            <div className="dashbarNotifyWrap">
              <Motion.button
                type="button"
                className={`dashbarIconBtn dashbarIconBtn--notify ${
                  openNotifications ? "dashbarIconBtn--active" : ""
                } ${onNotificationsPage ? "dashbarIconBtn--active" : ""}`}
                whileHover={{ y: -1.5, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                aria-label="Notifications"
                aria-current={onNotificationsPage ? "page" : undefined}
                aria-expanded={openNotifications}
                aria-haspopup="menu"
                onClick={toggleNotifications}
              >
                <Bell className="dashbarIconBtn__icon" />
                {hasUnread ? (
                  <span className="dashbarIconBtn__dot" aria-hidden="true" />
                ) : null}
              </Motion.button>

              <AnimatePresence>
                {openNotifications ? (
                  <Motion.div
                    className="dashbarNotifyMenu"
                    role="menu"
                    initial={{
                      opacity: 0,
                      y: 12,
                      scale: 0.98,
                      filter: "blur(8px)",
                    }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="dashbarNotifyMenu__header">
                      <div>
                        <h3 className="dashbarNotifyMenu__title">
                          Freelancer updates
                        </h3>
                      </div>

                      {hasUnread ? (
                        <Motion.button
                          type="button"
                          className="dashbarNotifyMenu__markAll"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING}
                          onClick={handleMarkAllRead}
                        >
                          <CheckCheck className="dashbarNotifyMenu__markAllIcon" />
                          <span>Mark all read</span>
                        </Motion.button>
                      ) : null}
                    </div>

                    <div className="dashbarNotifyMenu__body">
                      {notificationsLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="dashbarNotifySkeleton">
                            <div className="dashbarNotifySkeleton__icon" />
                            <div className="dashbarNotifySkeleton__copy">
                              <div className="dashbarNotifySkeleton__line dashbarNotifySkeleton__line--small" />
                              <div className="dashbarNotifySkeleton__line" />
                            </div>
                          </div>
                        ))
                      ) : previewNotifications.length > 0 ? (
                        previewNotifications.map((item, index) => (
                          <NotificationPreviewItem
                            key={item.id}
                            item={item}
                            index={index}
                            onOpen={handleOpenNotification}
                          />
                        ))
                      ) : (
                        <div className="dashbarNotifyEmpty">
                          <p className="dashbarNotifyEmpty__title">
                            No recent notification
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="dashbarNotifyMenu__footer">
                      <Motion.button
                        type="button"
                        className="dashbarNotifyMenu__seeMore"
                        whileHover={{ x: 1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING}
                        onClick={handleOpenNotificationsPage}
                      >
                        <span>See more</span>
                        <ArrowRight className="dashbarNotifyMenu__seeMoreIcon" />
                      </Motion.button>
                    </div>
                  </Motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <Motion.button
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
            </Motion.button>

            <Motion.button
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
            </Motion.button>

            <div className="dashbarProfileWrap">
              <Motion.button
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
                onClick={toggleProfile}
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
              </Motion.button>

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
                      <VerifiedBadge
                        verified={user.verified}
                        className="verifiedBadge--sm"
                      />
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
                      navigate("/dashboard/freelancer/news-feed");
                    }}
                  >
                    <Newspaper className="dashbarProfileMenu__itemIcon" />
                    <span>News Feed</span>
                  </button>

                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer/profile/achievements");
                    }}
                  >
                    <BadgeCheck className="dashbarProfileMenu__itemIcon" />
                    <span>Achievements</span>
                  </button>

                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer/profile/verification");
                    }}
                  >
                    <ShieldCheck className="dashbarProfileMenu__itemIcon" />
                    <span>{user.verified ? "Verification" : "Get Verified"}</span>
                  </button>

                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/freelancer/listings");
                    }}
                  >
                    <Home className="dashbarProfileMenu__itemIcon" />
                    <span>My Listings</span>
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
