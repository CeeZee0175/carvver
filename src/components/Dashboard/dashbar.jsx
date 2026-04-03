import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronDown,
  Compass,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserRound,
  Bookmark,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./dashbar.css";
import { signOut, getProfile } from "../../lib/supabase/auth";
import { formatNotificationTime, useNotifications } from "./useNotifications";

const SPRING = { type: "spring", stiffness: 340, damping: 24 };

function NotificationPreviewItem({ item, index, onOpen }) {
  const Icon = item.Icon;

  return (
    <motion.button
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
    </motion.button>
  );
}

export default function DashBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading: notificationsLoading,
    unreadNotifications,
    unreadCount,
    hasUnread,
    markAllRead,
    markRead,
  } = useNotifications();

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openExplore, setOpenExplore] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    initials: "",
  });

  const rootRef = useRef(null);

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
        setOpenNotifications(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenExplore(false);
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
    setOpenExplore(false);
    setOpenProfile(false);
    setOpenNotifications(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    toast("Search coming soon!");
  };

  const toggleExplore = () => {
    setOpenExplore((prev) => {
      const next = !prev;
      if (next) {
        setOpenProfile(false);
        setOpenNotifications(false);
      }
      return next;
    });
  };

  const toggleProfile = () => {
    setOpenProfile((prev) => {
      const next = !prev;
      if (next) {
        setOpenExplore(false);
        setOpenNotifications(false);
      }
      return next;
    });
  };

  const toggleNotifications = () => {
    setOpenNotifications((prev) => {
      const next = !prev;
      if (next) {
        setOpenExplore(false);
        setOpenProfile(false);
      }
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
      navigate("/dashboard/customer/about-us");
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
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;

    try {
      await markAllRead();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Couldn't update notifications. Check Supabase first.");
    }
  };

  const handleOpenNotification = async (item) => {
    try {
      await markRead(item.id);
    } catch {
      toast.error("Couldn't update notifications. Check Supabase first.");
    }

    setOpenNotifications(false);
    navigate(item.path);
  };

  const handleOpenNotificationsPage = () => {
    setOpenNotifications(false);
    navigate("/dashboard/customer/notifications");
  };

  const previewNotifications = unreadNotifications.slice(0, 4);
  const onNotificationsPage =
    location.pathname === "/dashboard/customer/notifications";

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
                className={`dashbarPill dashbarPill--explore ${
                  openExplore ? "dashbarPill--open" : ""
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                onClick={toggleExplore}
                aria-expanded={openExplore}
                aria-haspopup="menu"
              >
                <Compass className="dashbarPill__icon" />
                <span className="dashbarPill__text">Explore</span>
                <ChevronDown
                  className={`dashbarPill__chevron ${
                    openExplore ? "dashbarPill__chevron--open" : ""
                  }`}
                />
              </motion.button>

              <div
                className={`dashbarMenu ${openExplore ? "dashbarMenu--open" : ""}`}
                role="menu"
              >
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("Browse Services")}
                >
                  Browse Services
                </button>
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("About Us")}
                >
                  About Us
                </button>
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("Community")}
                >
                  Community
                </button>
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("Features")}
                >
                  Features
                </button>
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("Pricing")}
                >
                  Pricing
                </button>
                <button
                  type="button"
                  className="dashbarMenu__item"
                  role="menuitem"
                  onClick={() => handleExploreMenuClick("FAQ")}
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
              transition={SPRING}
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
              transition={SPRING}
              aria-label="Cart"
              onClick={() => toast("Cart coming soon!")}
            >
              <ShoppingCart className="dashbarIconBtn__icon" />
            </motion.button>

            <div className="dashbarNotifyWrap">
              <motion.button
                type="button"
                className={`dashbarIconBtn dashbarIconBtn--notify ${
                  openNotifications || onNotificationsPage
                    ? "dashbarIconBtn--active"
                    : ""
                }`}
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
                {hasUnread && (
                  <span className="dashbarIconBtn__dot" aria-hidden="true" />
                )}
              </motion.button>

              <AnimatePresence>
                {openNotifications && (
                  <motion.div
                    className="dashbarNotifyMenu"
                    role="menu"
                    initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="dashbarNotifyMenu__header">
                      <div>
                        <p className="dashbarNotifyMenu__eyebrow">Notifications</p>
                        <h3 className="dashbarNotifyMenu__title">
                          {hasUnread
                            ? `${unreadCount} unread update${
                                unreadCount === 1 ? "" : "s"
                              }`
                            : "You are all caught up"}
                        </h3>
                      </div>

                      {hasUnread && (
                        <motion.button
                          type="button"
                          className="dashbarNotifyMenu__markAll"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING}
                          onClick={handleMarkAllRead}
                        >
                          <CheckCheck className="dashbarNotifyMenu__markAllIcon" />
                          <span>Mark all read</span>
                        </motion.button>
                      )}
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
                          <div
                            className="dashbarNotifyEmpty__iconWrap"
                            aria-hidden="true"
                          >
                            <Sparkles className="dashbarNotifyEmpty__icon" />
                          </div>
                          <p className="dashbarNotifyEmpty__title">
                            Nothing unread right now.
                          </p>
                          <p className="dashbarNotifyEmpty__desc">
                            New activity will appear here the moment something needs your attention.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="dashbarNotifyMenu__footer">
                      <motion.button
                        type="button"
                        className="dashbarNotifyMenu__seeMore"
                        whileHover={{ x: 1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING}
                        onClick={handleOpenNotificationsPage}
                      >
                        <span>See more</span>
                        <ArrowRight className="dashbarNotifyMenu__seeMoreIcon" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="dashbarProfileWrap">
              <motion.button
                type="button"
                className={`dashbarProfile ${openProfile ? "dashbarProfile--open" : ""}`}
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                aria-label="Profile"
                aria-expanded={openProfile}
                aria-haspopup="menu"
                onClick={toggleProfile}
              >
                <span className="dashbarProfile__avatar" aria-hidden="true">
                  {user.initials}
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
                    {user.initials}
                  </div>
                  <div className="dashbarProfileMenu__identity">
                    <p className="dashbarProfileMenu__name">
                      {user.fullName || "Loading..."}
                    </p>
                    <p className="dashbarProfileMenu__email">{user.email}</p>
                  </div>
                </div>

                <div className="dashbarProfileMenu__group">
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuClick("View Profile")}
                  >
                    <UserRound className="dashbarProfileMenu__itemIcon" />
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuClick("Account Settings")}
                  >
                    <Settings className="dashbarProfileMenu__itemIcon" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuClick("My Orders")}
                  >
                    <ShoppingBag className="dashbarProfileMenu__itemIcon" />
                    <span>My Orders</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/dashboard/customer/saved");
                    }}
                  >
                    <Bookmark className="dashbarProfileMenu__itemIcon" />
                    <span>Saved Listings</span>
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
