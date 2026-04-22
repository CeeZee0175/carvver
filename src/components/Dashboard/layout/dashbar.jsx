import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCheck,
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
import { signOut, getProfile } from "../../../lib/supabase/auth";
import { PROFILE_UPDATED_EVENT } from "../../../lib/profileSync";
import { formatNotificationTime, useNotifications } from "../hooks/useNotifications";
import { getCustomerDisplayName, getCustomerInitials } from "../shared/customerIdentity";
import { useCart } from "../hooks/useCart";

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

export default function DashBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading: notificationsLoading,
    unreadNotifications,
    hasUnread,
    markAllRead,
    markRead,
  } = useNotifications();
  const { count: cartCount } = useCart();

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
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
        setOpenProfile(false);
        setOpenNotifications(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
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
      if (location.pathname === "/dashboard/customer/search") {
        const params = new URLSearchParams(location.search);
        setQuery(params.get("q") || "");
        return;
      }

      setQuery("");
    });
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const normalizedQuery = query.trim();
    navigate(
      normalizedQuery
        ? `/dashboard/customer/search?q=${encodeURIComponent(normalizedQuery)}`
        : "/dashboard/customer/search"
    );
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

  const handleProfileMenuNavigate = (path) => {
    setOpenProfile(false);
    navigate(path);
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
      toast.error("We couldn't update notifications. Please try again.");
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

  const handleOpenNotificationsPage = () => {
    setOpenNotifications(false);
    navigate("/dashboard/customer/notifications");
  };

  const previewNotifications = unreadNotifications.slice(0, 4);
  const onNotificationsPage =
    location.pathname === "/dashboard/customer/notifications";
  const onCartPage = location.pathname === "/dashboard/customer/cart";
  const onMessagesPage = location.pathname === "/dashboard/customer/messages";
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

          <Motion.form
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
                placeholder="Search services or freelancers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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

            <Motion.button
              type="button"
              className={`dashbarIconBtn ${onMessagesPage ? "dashbarIconBtn--active" : ""}`}
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING}
              aria-label="Messages"
              aria-current={onMessagesPage ? "page" : undefined}
              onClick={() => navigate("/dashboard/customer/messages")}
            >
              <MessageCircle className="dashbarIconBtn__icon" />
            </Motion.button>

            <Motion.button
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
                  <Motion.span
                    key={cartBadgeLabel}
                    className="dashbarIconBtn__count"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.6, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {cartBadgeLabel}
                  </Motion.span>
                )}
              </AnimatePresence>
            </Motion.button>

            <div className="dashbarNotifyWrap">
              <Motion.button
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
              </Motion.button>

              <AnimatePresence>
                {openNotifications && (
                  <Motion.div
                    className="dashbarNotifyMenu"
                    role="menu"
                    initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="dashbarNotifyMenu__header">
                      <div>
                        <h3 className="dashbarNotifyMenu__title">Notifications</h3>
                      </div>

                      {hasUnread && (
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
                )}
              </AnimatePresence>
            </div>

            <div className="dashbarProfileWrap">
              <Motion.button
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
                    onClick={() => handleProfileMenuNavigate("/dashboard/customer/profile")}
                  >
                    <UserRound className="dashbarProfileMenu__itemIcon" />
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuNavigate("/dashboard/customer/settings")}
                  >
                    <Settings className="dashbarProfileMenu__itemIcon" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuNavigate("/dashboard/customer/orders")}
                  >
                    <ShoppingBag className="dashbarProfileMenu__itemIcon" />
                    <span>My Orders</span>
                  </button>
                  <button
                    type="button"
                    className="dashbarProfileMenu__item"
                    role="menuitem"
                    onClick={() => handleProfileMenuNavigate("/dashboard/customer/saved")}
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
