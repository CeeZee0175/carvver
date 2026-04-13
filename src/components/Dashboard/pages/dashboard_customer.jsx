import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Heart,
  MapPin,
  PackageSearch,
  PlusCircle,
  ShoppingBag,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import "./profile.css";
import "./dashboard_customer.css";
import { createClient } from "../../../lib/supabase/client";
import { buildCategoryPath } from "../../../lib/featuredCategoryIntent";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import {
  DASHBOARD_CATEGORY_HIGHLIGHTS,
  getCategoryIcon,
} from "../../../lib/serviceCategories";
import {
  getCustomerDisplayName,
  getCustomerInitials,
} from "../shared/customerIdentity";
import {
  CustomerDashboardFrame,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useCustomerRequests } from "../hooks/useCustomerRequests";
import { useCustomerFavoriteFreelancers } from "../hooks/useCustomerFavoriteFreelancers";

const supabase = createClient();

const quickBoardItems = [
  {
    label: "Post a Request",
    Icon: PlusCircle,
    action: (navigate) => navigate("/dashboard/customer/post-request"),
  },
  {
    label: "Saved Listings",
    Icon: Bookmark,
    action: (navigate) => navigate("/dashboard/customer/saved"),
  },
  {
    label: "My Orders",
    Icon: ShoppingBag,
    action: (navigate) => navigate("/dashboard/customer/orders"),
  },
  {
    label: "Notifications",
    Icon: Bell,
    action: (navigate) => navigate("/dashboard/customer/notifications"),
  },
];

const HERO_BUTTON_MOTION = {
  whileHover: { y: -6, scale: 1.024 },
  whileTap: { y: -1, scale: 0.982 },
  transition: { type: "spring", stiffness: 330, damping: 18, mass: 0.7 },
};

const SURFACE_BUTTON_MOTION = {
  whileHover: { y: -5, scale: 1.016 },
  whileTap: { scale: 0.986 },
  transition: { type: "spring", stiffness: 320, damping: 19, mass: 0.74 },
};

const LINK_BUTTON_MOTION = {
  whileHover: { x: 4, y: -1.5 },
  whileTap: { scale: 0.984 },
  transition: { type: "spring", stiffness: 330, damping: 19, mass: 0.76 },
};

function normalizeRelation(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

function formatRequestDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }) {
  return (
    <EmptySurface
      icon={Icon}
      title={title}
      description={desc}
      actionLabel={actionLabel}
      onAction={onAction}
      className="dashLandingEmpty"
    />
  );
}

function QuietEmptyState({ title, desc, actionLabel, onAction }) {
  return (
    <EmptySurface
      title={title}
      description={desc}
      actionLabel={actionLabel}
      onAction={onAction}
      className="dashLandingEmpty dashLandingEmpty--quiet"
      hideIcon
    />
  );
}

export default function DashboardCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [statsLoading, setStatsLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const {
    loading: requestsLoading,
    requests,
    openCount,
    error: requestsError,
    reload: reloadRequests,
  } = useCustomerRequests({ limit: 4 });
  const {
    loading: favoritesLoading,
    error: favoritesError,
    favoriteIds,
    favoriteFreelancers,
    toggleFavoriteFreelancer,
  } = useCustomerFavoriteFreelancers({ includeProfiles: true, limit: 4 });

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          setSavedCount(0);
          setActiveOrdersCount(0);
          return;
        }

        const [savedResult, ordersResult] = await Promise.all([
          supabase
            .from("saved_services")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", session.user.id)
            .in("status", ["pending", "active"]),
        ]);

        setSavedCount(Number(savedResult.count || 0));
        setActiveOrdersCount(Number(ordersResult.count || 0));
      } catch {
        setSavedCount(0);
        setActiveOrdersCount(0);
      } finally {
        setStatsLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  useEffect(() => {
    async function loadRecommendedServices() {
      try {
        const { data } = await supabase
          .from("services")
          .select(
            "id, title, category, price, location, freelancer_id, profiles(display_name, first_name, last_name, avatar_url, bio, region, city, barangay, freelancer_headline)"
          )
          .eq("is_published", true)
          .limit(4);

        setServices(data || []);
      } catch {
        setServices([]);
      } finally {
        setServicesLoading(false);
      }
    }

    loadRecommendedServices();
  }, []);

  useEffect(() => {
    if (!location.state?.requestCreated) return;

    reloadRequests();
    toast.success(
      location.state.requestCreatedTitle
        ? `"${location.state.requestCreatedTitle}" is now posted.`
        : "Your request is now posted."
    );

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, reloadRequests]);

  const quickStats = [
    {
      label: "Saved Listings",
      value: statsLoading ? "..." : savedCount,
    },
    {
      label: "Open Requests",
      value: requestsLoading ? "..." : openCount,
    },
    {
      label: "Active Orders",
      value: statsLoading ? "..." : activeOrdersCount,
    },
    {
      label: "Favorite Freelancers",
      value: favoritesLoading ? "..." : favoriteFreelancers.length,
    },
  ];

  const handleFavoriteToggle = async (freelancerId, snapshot) => {
    try {
      const result = await toggleFavoriteFreelancer(freelancerId, snapshot);
      toast.success(
        result.favorite
          ? `${getCustomerDisplayName(snapshot)} is now in your favorites.`
          : `${getCustomerDisplayName(snapshot)} was removed from your favorites.`
      );
    } catch (error) {
      toast.error(error.message || "We couldn't update your favorites.");
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage dashLandingPage">
      <Reveal>
        <section className="profileHero dashLandingHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Welcome Back!" />
              </h1>
              <motion.svg
                className="profileHero__line"
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

            <p className="profileHero__sub">
              Pick up where you left off, revisit saved work, or post something new.
            </p>

            <div className="dashLandingHero__actions">
              <motion.button
                type="button"
                className="dashLandingAction dashLandingAction--primary"
                {...HERO_BUTTON_MOTION}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span>Browse Services</span>
                <ArrowRight className="dashLandingAction__icon" />
              </motion.button>

              <motion.button
                type="button"
                className="dashLandingAction dashLandingAction--secondary"
                {...HERO_BUTTON_MOTION}
                onClick={() => navigate("/dashboard/customer/post-request")}
              >
                <PlusCircle className="dashLandingAction__icon" />
                <span>Post a Request</span>
              </motion.button>
            </div>
          </div>

          <div className="profileHero__stats dashLandingStats">
            {quickStats.map((item, index) => (
              <motion.article
                key={item.label}
                className="dashLandingStat"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, filter: "blur(0px)" }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.58,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.18 + index * 0.08,
                      }
                }
                whileHover={reduceMotion ? undefined : { y: -3 }}
              >
                <span className="profileMiniStat__label">{item.label}</span>
                <strong className="profileMiniStat__value">{item.value}</strong>
                {item.hint ? (
                  <span className="profileMiniStat__hint">{item.hint}</span>
                ) : null}
              </motion.article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.04}>
        <section className="dashLandingSection dashLandingSection--quick">
          <div className="dashLandingSection__head">
            <div>
              <h2 className="dashLandingSection__title">Quick board</h2>
              <p className="dashLandingSection__desc">
                Keep your main customer actions within reach.
              </p>
            </div>
          </div>

          <div className="dashLandingQuickBoard">
            {quickBoardItems.map((item, index) => {
              const Icon = item.Icon;
              return (
                <motion.button
                  key={item.label}
                  type="button"
                  className="dashLandingQuickCard"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.42, delay: index * 0.05 }}
                  {...SURFACE_BUTTON_MOTION}
                  onClick={() => item.action(navigate)}
                >
                  <span className="dashLandingQuickCard__iconWrap" aria-hidden="true">
                    <Icon className="dashLandingQuickCard__icon" />
                  </span>
                  <span className="dashLandingQuickCard__copy">
                    <span className="dashLandingQuickCard__title">{item.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="dashLandingSection">
          <div className="dashLandingSection__head">
            <div>
              <h2 className="dashLandingSection__title">Recent requests</h2>
              <p className="dashLandingSection__desc">
                Track the briefs you posted and reopen the ones still moving.
              </p>
            </div>

            <motion.button
              type="button"
              className="dashLandingGhostLink"
              {...LINK_BUTTON_MOTION}
              onClick={() => navigate("/dashboard/customer/post-request")}
            >
              <span>Post a request</span>
              <ArrowRight className="dashLandingGhostLink__icon" />
            </motion.button>
          </div>

          {requestsLoading ? (
            <div className="dashLandingRequestGrid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="dashLandingRequestCard dashLandingRequestCard--skeleton" />
              ))}
            </div>
          ) : requestsError ? (
            <EmptyState
              icon={PackageSearch}
              title="We couldn't load your recent requests"
              desc={requestsError || "Please try again."}
              actionLabel="Open the request page"
              onAction={() => navigate("/dashboard/customer/post-request")}
            />
          ) : requests.length === 0 ? (
            <QuietEmptyState
              title="You have not posted a request yet"
              actionLabel="Post your first request"
              onAction={() => navigate("/dashboard/customer/post-request")}
            />
          ) : (
            <div className="dashLandingRequestGrid">
              {requests.map((request) => (
                <motion.article
                  key={request.id}
                  className="dashLandingRequestCard"
                  {...SURFACE_BUTTON_MOTION}
                  onClick={() =>
                    navigate(`/dashboard/customer/requests/${request.id}`)
                  }
                >
                  <div className="dashLandingRequestCard__top">
                    <div className="dashLandingRequestCard__meta">
                      <span className="dashLandingRequestCard__chip">{request.category}</span>
                      <span className="dashLandingRequestCard__chip dashLandingRequestCard__chip--soft">
                        {request.timeline}
                      </span>
                    </div>
                    <span className="dashLandingRequestCard__status">{request.status}</span>
                  </div>

                  <h3 className="dashLandingRequestCard__title">{request.title}</h3>
                  <p className="dashLandingRequestCard__desc">{request.description}</p>

                  <div className="dashLandingRequestCard__footer">
                    <span className="dashLandingRequestCard__signal">
                      {request.budget_amount ? formatPeso(request.budget_amount) : "Budget not set"}
                    </span>
                    <span className="dashLandingRequestCard__signal">
                      {request.location || "Location not set"}
                    </span>
                    <span className="dashLandingRequestCard__signal">
                      {formatRequestDate(request.created_at)}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="dashLandingSection">
          <div className="dashLandingSection__head">
            <div>
              <h2 className="dashLandingSection__title">Recommended picks</h2>
              <p className="dashLandingSection__desc">
                Browse published listings that are ready for your next project.
              </p>
            </div>

            <motion.button
              type="button"
              className="dashLandingGhostLink"
              {...LINK_BUTTON_MOTION}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              <span>Browse all</span>
              <ArrowRight className="dashLandingGhostLink__icon" />
            </motion.button>
          </div>

          {servicesLoading ? (
            <div className="dashLandingListingGrid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="dashLandingListingCard dashLandingListingCard--skeleton" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <QuietEmptyState
              title="No published services yet"
              actionLabel="Browse services"
              onAction={() => navigate("/dashboard/customer/browse-services")}
            />
          ) : (
            <div className="dashLandingListingGrid">
              {services.map((item) => {
                const creator = normalizeRelation(item.profiles);
                const isFavoriteFreelancer = favoriteIds.includes(item.freelancer_id);
                return (
                  <motion.article
                    key={item.id}
                    className="dashLandingListingCard"
                    {...SURFACE_BUTTON_MOTION}
                  >
                    <div className="dashLandingListingCard__cover">
                      <div className="dashLandingListingCard__coverTop">
                        <span className="dashLandingListingCard__badge">{item.category}</span>
                        {item.freelancer_id ? (
                          <motion.button
                            type="button"
                            className={`dashLandingFavoriteToggle ${
                              isFavoriteFreelancer ? "dashLandingFavoriteToggle--active" : ""
                            }`}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.94 }}
                            transition={LINK_BUTTON_MOTION.transition}
                            onClick={() =>
                              handleFavoriteToggle(item.freelancer_id, {
                                id: item.freelancer_id,
                                ...creator,
                              })
                            }
                            aria-label={
                              isFavoriteFreelancer
                                ? "Remove freelancer from favorites"
                                : "Add freelancer to favorites"
                            }
                          >
                            <Heart
                              className="dashLandingFavoriteToggle__icon"
                              fill={isFavoriteFreelancer ? "currentColor" : "none"}
                            />
                          </motion.button>
                        ) : null}
                      </div>
                    </div>

                    <div className="dashLandingListingCard__body">
                      <h3 className="dashLandingListingCard__title">{item.title}</h3>
                      <p className="dashLandingListingCard__creator">
                        {creator ? getCustomerDisplayName(creator) : "Freelancer"}
                      </p>

                      <div className="dashLandingListingCard__meta">
                        {item.location && (
                          <span className="dashLandingListingCard__metaItem">
                            <MapPin className="dashLandingListingCard__metaIcon" />
                            {item.location}
                          </span>
                        )}
                      </div>

                      <div className="dashLandingListingCard__footer">
                        <strong className="dashLandingListingCard__price">
                          {formatPeso(item.price)}
                        </strong>
                        <motion.button
                          type="button"
                          className="dashLandingMiniBtn"
                          {...LINK_BUTTON_MOTION}
                          onClick={() =>
                            navigate(`/dashboard/customer/freelancers/${item.freelancer_id}`)
                          }
                        >
                          View freelancer
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="dashLandingSection">
          <div className="dashLandingSection__head">
            <div>
              <h2 className="dashLandingSection__title">Categories</h2>
              <p className="dashLandingSection__desc">
                Jump into the service areas you browse most often.
              </p>
            </div>
          </div>

          <div className="dashLandingCategoryGrid">
            {DASHBOARD_CATEGORY_HIGHLIGHTS.map((label, index) => {
              const Icon = getCategoryIcon(label);
              return (
                <motion.button
                  key={label}
                  type="button"
                  className="dashLandingCategoryCard"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.42, delay: index * 0.04 }}
                  {...SURFACE_BUTTON_MOTION}
                  onClick={() =>
                    navigate(
                      buildCategoryPath("/dashboard/customer/browse-services", label)
                    )
                  }
                >
                  <span className="dashLandingCategoryCard__iconWrap" aria-hidden="true">
                    <Icon className="dashLandingCategoryCard__icon" />
                  </span>
                  <span className="dashLandingCategoryCard__label">{label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="dashLandingSection">
          <div className="dashLandingSection__head">
            <div>
              <h2 className="dashLandingSection__title">Favorite freelancers</h2>
              <p className="dashLandingSection__desc">
                Revisit the freelancers you chose to keep close for future work.
              </p>
            </div>
          </div>

          {favoritesLoading ? (
            <div className="dashLandingFavoritesGrid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="dashLandingFavoriteCard dashLandingFavoriteCard--skeleton" />
              ))}
            </div>
          ) : favoritesError ? (
            <EmptyState
              icon={Users}
              title="We couldn't load your favorite freelancers"
              desc={favoritesError || "Please try again."}
              actionLabel="Browse services"
              onAction={() => navigate("/dashboard/customer/browse-services")}
            />
          ) : favoriteFreelancers.length === 0 ? (
            <QuietEmptyState
              title="No favorite freelancers yet"
              actionLabel="Browse services"
              onAction={() => navigate("/dashboard/customer/browse-services")}
            />
          ) : (
            <div className="dashLandingFavoritesGrid">
              {favoriteFreelancers.map((freelancer) => {
                const locationLabel =
                  buildPhilippinesLocationLabel({
                    region: freelancer.region,
                    city: freelancer.city,
                    barangay: freelancer.barangay,
                  }) || "Location not set";

                return (
                  <motion.article
                    key={freelancer.id}
                    className="dashLandingFavoriteCard"
                    {...SURFACE_BUTTON_MOTION}
                    onClick={() =>
                      navigate(`/dashboard/customer/freelancers/${freelancer.id}`)
                    }
                  >
                    <div className="dashLandingFavoriteCard__top">
                      <div className="dashLandingFavoriteCard__profile">
                        <span className="dashLandingFavoriteCard__avatar" aria-hidden="true">
                          {freelancer.avatar_url ? (
                            <img
                              src={freelancer.avatar_url}
                              alt={getCustomerDisplayName(freelancer)}
                              className="dashLandingFavoriteCard__avatarImage"
                            />
                          ) : (
                            getCustomerInitials(freelancer)
                          )}
                        </span>

                        <div className="dashLandingFavoriteCard__identity">
                          <h3 className="dashLandingFavoriteCard__name">
                            {getCustomerDisplayName(freelancer)}
                          </h3>
                          <p className="dashLandingFavoriteCard__reason">
                            {freelancer.freelancer_headline || "Favorited freelancer"}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        className="dashLandingFavoriteToggle dashLandingFavoriteToggle--active"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.94 }}
                        transition={LINK_BUTTON_MOTION.transition}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleFavoriteToggle(freelancer.id, freelancer);
                        }}
                        aria-label="Remove freelancer from favorites"
                      >
                        <Heart
                          className="dashLandingFavoriteToggle__icon"
                          fill="currentColor"
                        />
                      </motion.button>
                    </div>

                    <p className="dashLandingFavoriteCard__bio">
                      {freelancer.bio || "Open this profile to look through their details and published work."}
                    </p>

                    <div className="dashLandingFavoriteCard__meta">
                      <span className="dashLandingFavoriteCard__metaItem">
                        <MapPin className="dashLandingFavoriteCard__metaIcon" />
                        {locationLabel}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
