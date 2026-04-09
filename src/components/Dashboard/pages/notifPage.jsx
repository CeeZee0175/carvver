import React, { startTransition, useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./notifPage.css";
import DashBar from "../layout/dashbar";
import HomeFooter from "../../Homepage/layout/home_footer";
import { Component as EtheralShadow } from "../../StartUp/shared/etheral-shadow";
import {
  formatNotificationTime,
  NOTIFICATION_FILTERS,
  NOTIFICATIONS_PER_PAGE,
  useNotifications,
} from "../hooks/useNotifications";

const SPRING = { type: "spring", stiffness: 340, damping: 26 };

function TypewriterHeading({ text = "Notifications" }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = setTimeout(tick, 65);
    };

    timeoutId = setTimeout(tick, 80);
    return () => clearTimeout(timeoutId);
  }, [text, reduceMotion]);

  return (
    <h1 className="notifPage__title">
      {displayText}
      {!reduceMotion && displayText.length < text.length && (
        <motion.span
          className="notifPage__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </h1>
  );
}

function NotificationRow({ item, index, onToggleRead, onOpen }) {
  const reduceMotion = useReducedMotion();
  const Icon = item.Icon;

  return (
    <motion.article
      layout
      className={`notifRow ${item.isRead ? "notifRow--read" : "notifRow--unread"}`}
      style={{
        "--notif-accent": item.accent,
        "--notif-accent-soft": item.accentSoft,
      }}
      initial={
        reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, filter: "blur(8px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={
        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(8px)" }
      }
      transition={{
        layout: SPRING,
        duration: 0.36,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -2, x: 2 }}
    >
      <div className="notifRow__inner">
        <div className="notifRow__main">
          <span className="notifRow__iconWrap" aria-hidden="true">
            <Icon className="notifRow__icon" />
          </span>

          <div className="notifRow__content">
            <div className="notifRow__meta">
              <span className="notifRow__badge">{item.label}</span>
              <span className="notifRow__time">
                {formatNotificationTime(item.createdAt)}
              </span>
              {!item.isRead && <span className="notifRow__dot" aria-hidden="true" />}
            </div>

            <h3 className="notifRow__title">{item.title}</h3>
            <p className="notifRow__body">{item.body}</p>
          </div>
        </div>

        <div className="notifRow__actions">
          <motion.button
            type="button"
            className="notifRow__action"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            onClick={() => onToggleRead(item)}
          >
            {item.isRead ? "Mark unread" : "Mark as read"}
          </motion.button>

          <motion.button
            type="button"
            className="notifRow__action notifRow__action--primary"
            whileHover={{ x: 1 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            onClick={() => onOpen(item)}
          >
            <span>{item.ctaLabel}</span>
            <ArrowRight className="notifRow__actionIcon" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function FeedSkeleton({ index }) {
  return (
    <div className="notifRow notifRow--skeleton" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="notifRow__inner">
        <div className="notifRow__main">
          <div className="notifSkeleton notifSkeleton--icon" />
          <div className="notifRow__content">
            <div className="notifRow__meta">
              <div className="notifSkeleton notifSkeleton--chip" />
              <div className="notifSkeleton notifSkeleton--time" />
            </div>
            <div className="notifSkeleton notifSkeleton--title" />
            <div className="notifSkeleton notifSkeleton--body" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ activeFilter, onShowAll }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="notifEmpty"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="notifEmpty__halo"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <h3 className="notifEmpty__title">You&apos;re all caught up.</h3>
      <p className="notifEmpty__desc">
        {activeFilter === "unread"
          ? "There are no unread notifications."
          : "New activity will appear here once creators, orders, or saved services give you something new to check."}
      </p>

      {activeFilter !== "all" && (
        <motion.button
          type="button"
          className="notifEmpty__action"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING}
          onClick={onShowAll}
        >
          Show all notifications
        </motion.button>
      )}
    </motion.div>
  );
}

export default function NotifPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const {
    loading,
    notifications,
    unreadCount,
    hasUnread,
    toggleRead,
    markRead,
    markAllRead,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((item) => !item.isRead).length,
      activity: notifications.filter((item) => item.group === "activity").length,
      system: notifications.filter((item) => item.group === "system").length,
    }),
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }

    if (activeFilter === "activity") {
      return notifications.filter((item) => item.group === "activity");
    }

    if (activeFilter === "system") {
      return notifications.filter((item) => item.group === "system");
    }

    return notifications;
  }, [activeFilter, notifications]);

  useEffect(() => {
    startTransition(() => setCurrentPage(1));
  }, [activeFilter, filteredNotifications.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * NOTIFICATIONS_PER_PAGE;
    return filteredNotifications.slice(start, start + NOTIFICATIONS_PER_PAGE);
  }, [currentPage, filteredNotifications]);

  const handleMarkAllRead = async () => {
    if (!hasUnread) return;

    try {
      await markAllRead();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("We couldn't update notifications. Please try again.");
    }
  };

  const handleToggleRead = async (item) => {
    try {
      await toggleRead(item.id);
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

    navigate(item.path);
  };

  const handlePageChange = (page) => {
    startTransition(() => setCurrentPage(page));
  };

  return (
    <div className="notifPage">
      <Toaster position="top-center" />

      <div className="notifPage__base" />
      <div className="notifPage__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="notifPage__bg" aria-hidden="true" />

      <DashBar />

      <main className="notifPage__main">
        <motion.section
          className="notifPage__header"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="notifCrumbs">
            <motion.button
              type="button"
              className="notifCrumbs__home"
              whileHover={{ x: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              onClick={() => navigate("/dashboard/customer")}
            >
              <Home className="notifCrumbs__icon" />
              <span>Home</span>
            </motion.button>

            <span className="notifCrumbs__sep">/</span>
            <span className="notifCrumbs__current">Notifications</span>
          </section>

          <div className="notifPage__hero">
            <div>
              <div className="notifPage__titleWrap">
                <TypewriterHeading />
                <motion.svg
                  className="notifPage__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.1 }}
                  />
                </motion.svg>
              </div>

              <p className="notifPage__sub">
                See your latest updates in one place, keep track of what you
                have already read, and jump straight to what needs your attention.
              </p>
            </div>

            <div className="notifPage__heroMeta">
              <AnimatePresence mode="wait">
                <motion.p
                  key={hasUnread ? "unread" : "clear"}
                  className="notifPage__status"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {hasUnread
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "No unread notifications"}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="notifToolbar">
            <div className="notifToolbar__filters">
              {NOTIFICATION_FILTERS.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  className={`notifChip ${
                    activeFilter === option.value ? "notifChip--active" : ""
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING}
                  onClick={() => startTransition(() => setActiveFilter(option.value))}
                >
                  <span>{option.label}</span>
                  <span className="notifChip__count">{counts[option.value]}</span>
                </motion.button>
              ))}
            </div>

            <motion.button
              type="button"
              className={`notifToolbar__action ${
                !hasUnread ? "notifToolbar__action--disabled" : ""
              }`}
              whileHover={hasUnread ? { y: -1 } : undefined}
              whileTap={hasUnread ? { scale: 0.98 } : undefined}
              transition={SPRING}
              onClick={handleMarkAllRead}
              disabled={!hasUnread}
            >
              <CheckCheck className="notifToolbar__actionIcon" />
              <span>Mark all read</span>
            </motion.button>
          </div>
        </motion.section>

        <section className="notifFeed">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <FeedSkeleton key={index} index={index} />
            ))
          ) : paginatedNotifications.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFilter}-${currentPage}`}
                className="notifFeed__page"
                initial={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 16, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -16, filter: "blur(8px)" }
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {paginatedNotifications.map((item, index) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    index={index}
                    onToggleRead={handleToggleRead}
                    onOpen={handleOpenNotification}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <EmptyState
              activeFilter={activeFilter}
              onShowAll={() => startTransition(() => setActiveFilter("all"))}
            />
          )}
        </section>

        {!loading && totalPages > 1 && (
          <LayoutGroup>
            <motion.nav
              className="notifPagination"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32 }}
            >
              <motion.button
                type="button"
                className="notifPagination__arrow"
                whileHover={currentPage > 1 ? { x: -1 } : undefined}
                whileTap={currentPage > 1 ? { scale: 0.98 } : undefined}
                transition={SPRING}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="notifPagination__arrowIcon" />
              </motion.button>

              <div className="notifPagination__list">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  const active = currentPage === page;

                  return (
                    <motion.button
                      key={page}
                      type="button"
                      className={`notifPagination__btn ${
                        active ? "notifPagination__btn--active" : ""
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING}
                      onClick={() => handlePageChange(page)}
                    >
                      {active && (
                        <motion.span
                          layoutId="notifPaginationActive"
                          className="notifPagination__activeBg"
                          transition={SPRING}
                        />
                      )}
                      <span className="notifPagination__label">{page}</span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                type="button"
                className="notifPagination__arrow"
                whileHover={currentPage < totalPages ? { x: 1 } : undefined}
                whileTap={currentPage < totalPages ? { scale: 0.98 } : undefined}
                transition={SPRING}
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="notifPagination__arrowIcon" />
              </motion.button>
            </motion.nav>
          </LayoutGroup>
        )}
      </main>

      <section className="notifPage__footerSection">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}
