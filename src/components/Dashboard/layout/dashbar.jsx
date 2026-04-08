import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  LogOut,
  LoaderCircle,
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
import { signOut, getProfile } from "../../../lib/supabase/auth";
import { createClient } from "../../../lib/supabase/client";
import { PROFILE_UPDATED_EVENT } from "../../../lib/profileSync";
import { formatNotificationTime, useNotifications } from "../hooks/useNotifications";
import { getCustomerDisplayName, getCustomerInitials } from "../shared/customerAchievements";
import { useCart } from "../hooks/useCart";

const SPRING = { type: "spring", stiffness: 340, damping: 24 };
const WAITLIST_SOURCE = "dashbar_pro_waitlist";
const supabase = createClient();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getWaitlistErrorMessage(error) {
  if (!error) return "Couldn't join the Carvver Pro waitlist right now.";

  if (error.code === "42P01") {
    return "The newsletter_signups table is missing. Run the Supabase SQL first.";
  }

  if (error.code === "42501") {
    return "Supabase blocked the waitlist insert. Check the newsletter policies first.";
  }

  return "Couldn't join the Carvver Pro waitlist right now.";
}

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
  const { count: cartCount } = useCart();

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openPro, setOpenPro] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [proEmail, setProEmail] = useState("");
  const [proSubmitting, setProSubmitting] = useState(false);
  const [proStatus, setProStatus] = useState("idle");
  const [proMessage, setProMessage] = useState("");
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    initials: "",
    avatarUrl: "",
  });

  const rootRef = useRef(null);

  useEffect(() => {
    const syncUser = (profile) => {
      if (!profile) return;

      setUser({
        fullName: getCustomerDisplayName(profile),
        email: profile.email || "",
        initials: getCustomerInitials(profile),
        avatarUrl: profile.avatar_url || "",
      });
    };

    getProfile()
      .then(syncUser)
      .catch(() => {
        // Silently fail — ProtectedRoute will handle unauthenticated users
      });

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
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpenPro(false);
        setOpenProfile(false);
        setOpenNotifications(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenPro(false);
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
    setOpenPro(false);
    setOpenProfile(false);
    setOpenNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!openPro) return;
    if (proEmail || !user.email) return;

    setProEmail(user.email);
  }, [openPro, proEmail, user.email]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    toast("Search coming soon!");
  };

  const togglePro = () => {
    setOpenPro((prev) => {
      const next = !prev;
      if (next) {
        setOpenProfile(false);
        setOpenNotifications(false);
        setProStatus("idle");
        setProMessage("");
      }
      return next;
    });
  };

  const toggleProfile = () => {
    setOpenProfile((prev) => {
      const next = !prev;
      if (next) {
        setOpenPro(false);
        setOpenNotifications(false);
      }
      return next;
    });
  };

  const toggleNotifications = () => {
    setOpenNotifications((prev) => {
      const next = !prev;
      if (next) {
        setOpenPro(false);
        setOpenProfile(false);
      }
      return next;
    });
  };

  const handleProfileMenuClick = (label) => {
    setOpenProfile(false);

    if (label === "View Profile") {
      navigate("/dashboard/customer/profile");
      return;
    }

    if (label === "My Orders") {
      navigate("/dashboard/customer/orders");
      return;
    }

    toast(`${label} coming soon!`);
  };

  const handleSignOut = async () => {
    setOpenPro(false);
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

  const handleSubmitProWaitlist = async (e) => {
    e.preventDefault();

    const normalizedEmail = proEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setProStatus("error");
      setProMessage("Please enter your email first.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setProStatus("error");
      setProMessage("Please use a valid email address.");
      return;
    }

    try {
      setProSubmitting(true);
      setProStatus("idle");
      setProMessage("");

      const { error } = await supabase.from("newsletter_signups").insert({
        email: normalizedEmail,
        source: WAITLIST_SOURCE,
      });

      if (error?.code === "23505") {
        setProStatus("success");
        setProMessage("You're already on the Carvver Pro waitlist.");
        return;
      }

      if (error) throw error;

      setProStatus("success");
      setProMessage("You're in. We'll send Carvver Pro updates here.");
    } catch (error) {
      setProStatus("error");
      setProMessage(getWaitlistErrorMessage(error));
    } finally {
      setProSubmitting(false);
    }
  };

  const previewNotifications = unreadNotifications.slice(0, 4);
  const onNotificationsPage =
    location.pathname === "/dashboard/customer/notifications";
  const onCartPage = location.pathname === "/dashboard/customer/cart";
  const cartBadgeLabel = cartCount > 99 ? "99+" : String(cartCount);

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
            <motion.button
              type="button"
              className={`dashbarPill dashbarPill--pro ${
                openPro ? "dashbarPill--open" : ""
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              onClick={togglePro}
              aria-expanded={openPro}
              aria-haspopup="dialog"
            >
              <span className="dashbarPill__glow" aria-hidden="true" />
              <Sparkles className="dashbarPill__icon" />
              <span className="dashbarPill__text dashbarPill__text--pro">
                Join Carvver Pro
              </span>
            </motion.button>

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
              className={`dashbarIconBtn ${onCartPage ? "dashbarIconBtn--active" : ""}`}
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              aria-label="Cart"
              aria-current={onCartPage ? "page" : undefined}
              onClick={() => navigate("/dashboard/customer/cart")}
            >
              <ShoppingCart className="dashbarIconBtn__icon" />
              <AnimatePresence initial={false}>
                {cartCount > 0 && (
                  <motion.span
                    key={cartBadgeLabel}
                    className="dashbarIconBtn__count"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.6, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {cartBadgeLabel}
                  </motion.span>
                )}
              </AnimatePresence>
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

      <AnimatePresence>
        {openPro && (
          <>
            <motion.button
              type="button"
              className="dashbarProModal__backdrop"
              aria-label="Close Carvver Pro waitlist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpenPro(false)}
            />

            <motion.div
              className="dashbarProModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashbar-pro-title"
              initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(10px)" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="dashbarProModal__shine" aria-hidden="true" />

              <div className="dashbarProModal__header">
                <p className="dashbarProModal__eyebrow">Waitlist</p>
                <h2 className="dashbarProModal__title" id="dashbar-pro-title">
                  Join Carvver Pro
                </h2>
                <p className="dashbarProModal__desc">
                  Get first access to Pro trust signals, stronger creator
                  placement, and future buyer perks before the wider rollout.
                </p>
              </div>

              <form className="dashbarProModal__form" onSubmit={handleSubmitProWaitlist}>
                <label className="dashbarProModal__label" htmlFor="dashbar-pro-email">
                  Email
                </label>
                <div
                  className={`dashbarProModal__inputWrap ${
                    proStatus === "error" ? "dashbarProModal__inputWrap--error" : ""
                  }`}
                >
                  <input
                    id="dashbar-pro-email"
                    className="dashbarProModal__input"
                    type="email"
                    autoComplete="email"
                    value={proEmail}
                    onChange={(e) => {
                      setProEmail(e.target.value);
                      if (proStatus !== "idle" || proMessage) {
                        setProStatus("idle");
                        setProMessage("");
                      }
                    }}
                    placeholder="you@example.com"
                    disabled={proSubmitting}
                  />
                </div>

                <div className="dashbarProModal__actions">
                  <motion.button
                    type="submit"
                    className="dashbarProModal__submit"
                    whileHover={proSubmitting ? {} : { y: -1 }}
                    whileTap={proSubmitting ? {} : { scale: 0.98 }}
                    transition={SPRING}
                    disabled={proSubmitting}
                  >
                    {proSubmitting ? (
                      <>
                        <LoaderCircle className="dashbarProModal__submitIcon dashbarProModal__submitIcon--spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="dashbarProModal__submitIcon" />
                        <span>Join the waitlist</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    className="dashbarProModal__cancel"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    onClick={() => setOpenPro(false)}
                  >
                    Maybe later
                  </motion.button>
                </div>
              </form>

              <div className="dashbarProModal__footer">
                <p
                  className={`dashbarProModal__message ${
                    proStatus === "success" ? "dashbarProModal__message--success" : ""
                  } ${proStatus === "error" ? "dashbarProModal__message--error" : ""}`}
                >
                  {proMessage || "No spam. Just Pro updates when the next step is ready."}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
