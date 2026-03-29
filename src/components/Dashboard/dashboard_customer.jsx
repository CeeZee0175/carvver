import HomeFooter from "../Homepage/home_footer";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Camera,
  Compass,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Mic2,
  Palette,
  PenTool,
  PlusCircle,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Video,
  PackageSearch,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./dashboard_customer.css";
import DashBar from "./dashbar";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { getProfile } from "../../lib/supabase/auth";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

const categories = [
  { label: "Art & Illustration", Icon: Palette },
  { label: "Photography", Icon: Camera },
  { label: "Video Editing", Icon: Video },
  { label: "Graphic Design", Icon: PenTool },
  { label: "Voice Over", Icon: Mic2 },
  { label: "Social Media", Icon: Share2 },
  { label: "Tutoring", Icon: GraduationCap },
  { label: "Handmade Products", Icon: ShoppingBag },
];

const quickBoardItems = [
  { label: "Saved listings", Icon: Bookmark },
  { label: "Messages", Icon: MessageCircle },
  { label: "Requests & orders", Icon: ShoppingBag },
  { label: "Fresh recommendations", Icon: Sparkles },
];

// Empty state component for sections with no data yet
function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="dashEmptyState">
      <div className="dashEmptyState__iconWrap" aria-hidden="true">
        <Icon className="dashEmptyState__icon" />
      </div>
      <p className="dashEmptyState__title">{title}</p>
      <p className="dashEmptyState__desc">{desc}</p>
    </div>
  );
}

// Skeleton loader for stat cards while loading
function StatCardSkeleton() {
  return (
    <div className="dashStatCard dashStatCard--skeleton">
      <div className="dashSkeleton dashSkeleton--value" />
      <div className="dashSkeleton dashSkeleton--label" />
      <div className="dashSkeleton dashSkeleton--hint" />
    </div>
  );
}

export default function DashboardCustomer() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [stats, setStats] = useState({
    savedListings: null,
    openRequests: null,
    unreadMessages: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);

  // Load profile
  useEffect(() => {
    getProfile()
      .then((p) => setProfile(p))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Load real stats from Supabase
  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        const [savedRes, ordersRes] = await Promise.all([
          supabase
            .from("saved_services")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", userId)
            .eq("status", "pending"),
        ]);

        setStats({
          savedListings: savedRes.count ?? 0,
          openRequests: ordersRes.count ?? 0,
          unreadMessages: 0, // will wire up when Firebase chat is ready
        });
      } catch {
        // Silently fail — stats just show 0
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, []);

  // Load published services for recommendations
  useEffect(() => {
    supabase
      .from("services")
      .select("id, title, category, price, location, freelancer_id, profiles(first_name, last_name)")
      .eq("is_published", true)
      .limit(3)
      .then(({ data }) => setServices(data || []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  // Load freelancer profiles for nearby creators
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, first_name, last_name, bio, country")
      .eq("role", "freelancer")
      .limit(4)
      .then(({ data }) => setCreators(data || []))
      .catch(() => setCreators([]))
      .finally(() => setCreatorsLoading(false));
  }, []);

  const firstName = profile?.first_name || "";

  const quickStats = [
    {
      label: "Saved Listings",
      value: stats.savedListings,
      hint: stats.savedListings === 0 ? "Browse and save services" : "Ready to revisit",
    },
    {
      label: "Open Requests",
      value: stats.openRequests,
      hint: stats.openRequests === 0 ? "No active requests yet" : "Waiting for replies",
    },
    {
      label: "Unread Messages",
      value: stats.unreadMessages,
      hint: stats.unreadMessages === 0 ? "All caught up!" : "Replies from creators",
    },
    {
      label: "Nearby Matches",
      value: creators.length,
      hint: creators.length === 0 ? "No creators found yet" : "Based on your area",
    },
  ];

  const actionTransition = useMemo(
    () => ({ type: "spring", stiffness: 340, damping: 24 }),
    []
  );

  const accentColors = [
    { a: "rgba(124,58,237,0.20)", b: "rgba(242,193,78,0.14)" },
    { a: "rgba(42,20,80,0.16)", b: "rgba(124,58,237,0.14)" },
    { a: "rgba(242,193,78,0.18)", b: "rgba(42,20,80,0.14)" },
  ];

  const creatorAccents = [
    "rgba(124,58,237,0.10)",
    "rgba(242,193,78,0.12)",
    "rgba(42,20,80,0.08)",
    "rgba(124,58,237,0.08)",
  ];

  return (
    <div className="dashboardCustomer">
      <Toaster position="top-center" />
      <div className="dashboardCustomer__base" />
      <div className="dashboardCustomer__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="dashboardCustomer__bg" aria-hidden="true" />

      <DashBar />

      <main className="dashboardCustomer__main">

        {/* ── Hero ── */}
        <section className="dashHero">
          <div className="dashHero__left">
            <motion.div
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.2, 0.95, 0.2, 1] }}
            >
              <div className="dashHero__titleWrap">
                <h1 className="dashHero__title">
                  {profileLoading
                    ? "Welcome!"
                    : `Welcome, ${firstName}`}
                </h1>

                <motion.svg
                  className="dashHero__line"
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
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                  />
                </motion.svg>
              </div>

              <p className="dashHero__sub">
                Explore creative services, connect with trusted creators, or post a request and let
                the right people find you.
              </p>
            </motion.div>

            <motion.div
              className="dashHero__actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.2, 0.95, 0.2, 1] }}
            >
              <motion.button
                type="button"
                className="dashActionBtn dashActionBtn--primary"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span className="dashActionBtn__text">Browse Services</span>
                <span className="dashActionBtn__arrowWrap" aria-hidden="true">
                  <ArrowRight className="dashActionBtn__arrow" />
                </span>
              </motion.button>

              <motion.button
                type="button"
                className="dashActionBtn dashActionBtn--secondary"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => toast("Post a Request coming soon!")}
              >
                <PlusCircle className="dashActionBtn__icon" />
                <span>Post a Request</span>
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            className="dashHero__right"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.2, 0.95, 0.2, 1] }}
          >
            <div className="dashStats">
              {statsLoading
                ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                : quickStats.map((item) => (
                    <motion.article
                      key={item.label}
                      className="dashStatCard"
                      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      transition={actionTransition}
                    >
                      <div className="dashStatCard__value">{item.value ?? "—"}</div>
                      <div className="dashStatCard__label">{item.label}</div>
                      <div className="dashStatCard__hint">{item.hint}</div>
                    </motion.article>
                  ))}
            </div>
          </motion.div>
        </section>

        {/* ── Categories ── */}
        <section className="dashSection">
          <div className="dashSection__head">
            <div>
              <h2 className="dashSection__title">Popular Categories</h2>
              <p className="dashSection__desc">
                Jump into the services customers often explore first.
              </p>
            </div>

            <motion.button
              type="button"
              className="dashGhostLink"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={actionTransition}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              See all
            </motion.button>
          </div>

          <div className="dashCategoryGrid">
            {categories.map(({ label, Icon }) => (
              <motion.button
                key={label}
                type="button"
                className="dashCategoryCard"
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={actionTransition}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span className="dashCategoryCard__iconWrap" aria-hidden="true">
                  <Icon className="dashCategoryCard__icon" />
                </span>
                <span className="dashCategoryCard__label">{label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── Recommendations + Sidebar ── */}
        <section className="dashSplit">
          <div className="dashSplit__main">
            <div className="dashSection dashSection--embedded">
              <div className="dashSection__head">
                <div>
                  <h2 className="dashSection__title">Recommended For You</h2>
                  <p className="dashSection__desc">
                    {services.length > 0
                      ? "Curated picks from published services on the platform."
                      : "Services will appear here once creators start publishing."}
                  </p>
                </div>

                {services.length > 0 && (
                  <motion.button
                    type="button"
                    className="dashGhostLink"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={actionTransition}
                    onClick={() => navigate("/dashboard/customer/browse-services")}
                  >
                    See all
                  </motion.button>
                )}
              </div>

              {servicesLoading ? (
                <div className="dashListingGrid">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="dashListingCard dashListingCard--skeleton">
                      <div className="dashSkeleton dashSkeleton--cover" />
                      <div className="dashListingCard__body">
                        <div className="dashSkeleton dashSkeleton--title" />
                        <div className="dashSkeleton dashSkeleton--subtitle" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <EmptyState
                  icon={PackageSearch}
                  title="No services yet"
                  desc="Once freelancers start publishing their services, they'll show up here for you to explore."
                />
              ) : (
                <div className="dashListingGrid">
                  {services.map((item, index) => {
                    const colors = accentColors[index % accentColors.length];
                    const creatorName = item.profiles
                      ? `${item.profiles.first_name} ${item.profiles.last_name}`
                      : "Unknown Creator";

                    return (
                      <motion.article
                        key={item.id}
                        className="dashListingCard"
                        whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                        transition={actionTransition}
                        style={{
                          "--listing-cover-a": colors.a,
                          "--listing-cover-b": colors.b,
                        }}
                      >
                        <div className="dashListingCard__cover">
                          <span className="dashListingCard__badge">{item.category}</span>
                          <span className="dashListingCard__coverIconWrap" aria-hidden="true">
                            <PenTool className="dashListingCard__coverIcon" />
                          </span>
                        </div>

                        <div className="dashListingCard__body">
                          <div className="dashListingCard__top">
                            <div>
                              <h3 className="dashListingCard__title">{item.title}</h3>
                              <p className="dashListingCard__creator">{creatorName}</p>
                            </div>

                            <button
                              type="button"
                              className="dashListingCard__save"
                              onClick={() => toast("Save listings coming soon!")}
                              aria-label="Save listing"
                            >
                              <Heart className="dashListingCard__saveIcon" />
                            </button>
                          </div>

                          <div className="dashListingCard__meta">
                            {item.location && (
                              <span className="dashMetaPill">
                                <MapPin className="dashMetaPill__icon" />
                                {item.location}
                              </span>
                            )}
                          </div>

                          <div className="dashListingCard__bottom">
                            <div className="dashListingCard__price">
                              ₱{Number(item.price).toLocaleString()}
                            </div>

                            <motion.button
                              type="button"
                              className="dashMiniBtn"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              transition={actionTransition}
                              onClick={() => toast("Service detail page coming soon!")}
                            >
                              View Listing
                            </motion.button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="dashSplit__side">
            <motion.article
              className="dashRequestCard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              <div className="dashRequestCard__iconWrap" aria-hidden="true">
                <Compass className="dashRequestCard__icon" />
              </div>

              <h3 className="dashRequestCard__title">Need something specific?</h3>
              <p className="dashRequestCard__desc">
                Post a request and let creators respond with offers that match what you need.
              </p>

              <ul className="dashRequestCard__list">
                <li>Receive interest from service providers</li>
                <li>Compare replies in one place</li>
                <li>Choose the best fit for your request</li>
              </ul>

              <motion.button
                type="button"
                className="dashRequestCard__btn"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => toast("Post a Request coming soon!")}
              >
                Post a Request
              </motion.button>
            </motion.article>

            <motion.article
              className="dashBoardCard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
            >
              <h3 className="dashBoardCard__title">Your Quick Board</h3>

              <div className="dashQuickList">
                {quickBoardItems.map(({ label, Icon }) => (
                  <motion.button
                    key={label}
                    type="button"
                    className="dashQuickList__item"
                    whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01, x: 2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={actionTransition}
                    onClick={() => toast(`${label} coming soon!`)}
                  >
                    <Icon className="dashQuickList__icon" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.article>
          </aside>
        </section>

        {/* ── Nearby Creators ── */}
        <section className="dashSection">
          <div className="dashSection__head">
            <div>
              <h2 className="dashSection__title">Nearby & Trusted</h2>
              <p className="dashSection__desc">
                {creators.length > 0
                  ? "Helpful creators around you, especially for location-based services."
                  : "Freelancers who join the platform will appear here."}
              </p>
            </div>

            {creators.length > 0 && (
              <motion.button
                type="button"
                className="dashGhostLink"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => toast("Explore nearby coming soon!")}
              >
                Explore nearby
              </motion.button>
            )}
          </div>

          {creatorsLoading ? (
            <div className="dashCreatorRow">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="dashCreatorCard dashCreatorCard--skeleton">
                  <div className="dashSkeleton dashSkeleton--avatar" />
                  <div className="dashSkeleton dashSkeleton--label" />
                  <div className="dashSkeleton dashSkeleton--hint" />
                </div>
              ))}
            </div>
          ) : creators.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No creators yet"
              desc="Once freelancers sign up and complete their profiles, they'll appear here."
            />
          ) : (
            <div className="dashCreatorRow">
              {creators.map((creator, index) => {
                const accent = creatorAccents[index % creatorAccents.length];
                const name = `${creator.first_name} ${creator.last_name}`;

                return (
                  <motion.article
                    key={creator.id}
                    className="dashCreatorCard"
                    whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={actionTransition}
                    style={{ "--creator-accent": accent }}
                  >
                    <div className="dashCreatorCard__avatar" aria-hidden="true">
                      {creator.first_name?.charAt(0) || "?"}
                    </div>

                    <div className="dashCreatorCard__body">
                      <div className="dashCreatorCard__nameRow">
                        <h3 className="dashCreatorCard__name">{name}</h3>
                      </div>

                      {creator.bio && (
                        <p className="dashCreatorCard__specialty">{creator.bio}</p>
                      )}

                      {creator.country && (
                        <div className="dashCreatorCard__meta">
                          <span className="dashCreatorCard__location">
                            <MapPin className="dashCreatorCard__metaIcon" />
                            {creator.country}
                          </span>
                        </div>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      className="dashCreatorCard__btn"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={actionTransition}
                      onClick={() => toast("Creator profiles coming soon!")}
                    >
                      View Profile
                    </motion.button>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <section className="dashboardCustomer__footerSection">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}