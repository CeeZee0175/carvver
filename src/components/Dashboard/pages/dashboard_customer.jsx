import React, { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  MapPin,
  PackageSearch,
  PlusCircle,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import "./profile.css";
import "./browse_categories.css";
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
import VerifiedBadge from "../shared/VerifiedBadge";

const supabase = createClient();
const SERVICE_MEDIA_BUCKET = "service-media";

const ACCENT_COLORS = [
  { a: "rgba(124,58,237,0.22)", b: "rgba(242,193,78,0.14)" },
  { a: "rgba(42,20,80,0.20)", b: "rgba(124,58,237,0.14)" },
  { a: "rgba(242,193,78,0.22)", b: "rgba(124,58,237,0.12)" },
  { a: "rgba(124,58,237,0.18)", b: "rgba(42,20,80,0.12)" },
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

function getPublicServiceMediaUrl(path) {
  if (!path) return "";
  const { data } = supabase.storage
    .from(SERVICE_MEDIA_BUCKET)
    .getPublicUrl(path);
  return data?.publicUrl || "";
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

function RecommendedServiceCard({
  service,
  index,
  favoriteIds,
  onFavoriteToggle,
  onOpenListing,
  onOpenMessage,
  onViewFreelancer,
}) {
  const creator = normalizeRelation(service.profiles);
  const creatorName = creator ? getCustomerDisplayName(creator) : "Freelancer";
  const creatorVerified = Boolean(creator?.freelancer_verified_at || service.is_verified);
  const favoriteFreelancer = favoriteIds.includes(service.freelancer_id);
  const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const summaryText = String(service.description || "").trim()
    || "Review packages, delivery time, and listing details.";
  const packageLabel =
    service.packageCount > 0
      ? `${service.packageCount} package${service.packageCount === 1 ? "" : "s"} available`
      : "Custom pricing";
  const initials = getCustomerInitials({
    first_name: creator?.first_name,
    last_name: creator?.last_name,
    display_name: creator?.display_name,
  });

  return (
    <Motion.article
      className="browseServiceCard dashLandingBrowseServiceCard"
      style={{ "--card-accent-a": colors.a, "--card-accent-b": colors.b }}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOpenListing(service.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenListing(service.id);
        }
      }}
    >
      <div className="browseServiceCard__media">
        {service.previewMedia?.publicUrl ? (
          service.previewMedia.media_kind === "video" ? (
            <video
              className="browseServiceCard__mediaAsset"
              src={service.previewMedia.publicUrl}
              muted
              playsInline
            />
          ) : (
            <img
              className="browseServiceCard__mediaAsset"
              src={service.previewMedia.publicUrl}
              alt={service.title}
            />
          )
        ) : (
          <div className="browseServiceCard__mediaBg">
            <span className="browseServiceCard__mediaIconWrap" aria-hidden="true">
              <PackageSearch className="browseServiceCard__mediaIcon" />
            </span>
            {service.packageCount > 0 ? (
              <span className="browseServiceCard__mediaMeta">
                {service.packageCount} package{service.packageCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        )}

        <div className="browseServiceCard__mediaTop">
          <span className="browseServiceCard__tag">{service.category}</span>
          {service.freelancer_id ? (
            <Motion.button
              type="button"
              className={`browseServiceCard__favorite ${
                favoriteFreelancer ? "browseServiceCard__favorite--active" : ""
              }`}
              aria-label={
                favoriteFreelancer
                  ? "Remove freelancer from favorites"
                  : "Add freelancer to favorites"
              }
              whileTap={{ scale: 0.82 }}
              onClick={(event) => {
                event.stopPropagation();
                onFavoriteToggle(service.freelancer_id, {
                  id: service.freelancer_id,
                  ...creator,
                });
              }}
            >
              <Heart
                style={{ width: 15, height: 15 }}
                fill={favoriteFreelancer ? "currentColor" : "none"}
              />
            </Motion.button>
          ) : null}
        </div>

        {service.is_pro ? <div className="browseServiceCard__proBadge">Pro</div> : null}
      </div>

      <div className="browseServiceCard__body">
        <div className="browseServiceCard__creatorRow">
          <div className="browseServiceCard__creatorMain">
            <div className="browseServiceCard__avatar">{initials}</div>
            <div className="browseServiceCard__creatorBlock">
              <span className="browseServiceCard__creator">
                <span>{creatorName}</span>
                <VerifiedBadge
                  verified={creatorVerified}
                  className="verifiedBadge--sm"
                />
              </span>
              {service.is_verified ? (
                <div className="browseServiceCard__trustRow">
                  <span className="browseServiceCard__trustChip browseServiceCard__trustChip--verified">
                    Verified creator
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <h3 className="browseServiceCard__title">{service.title}</h3>
        <p className="browseServiceCard__summary">{summaryText}</p>

        <div className="browseServiceCard__metaStack">
          <div className="browseServiceCard__ratingRow">
            <span className="browseServiceCard__rating">
              {service.average_rating
                ? Number(service.average_rating).toFixed(1)
                : "New"}
            </span>
            <span className="browseServiceCard__reviewCount">
              {service.review_count
                ? `(${Number(service.review_count)} review${
                    Number(service.review_count) === 1 ? "" : "s"
                  })`
                : "(No reviews yet)"}
            </span>
          </div>

          {service.location ? (
            <div className="browseServiceCard__locationRow">
              <MapPin className="dashLandingListingCard__metaIcon" />
              <span className="browseServiceCard__locationText">{service.location}</span>
            </div>
          ) : null}
        </div>

        <div className="browseServiceCard__bottom">
          <div className="browseServiceCard__offerRow">
            <div className="browseServiceCard__priceWrap">
              <span className="browseServiceCard__priceFrom">Starting at</span>
              <span className="browseServiceCard__price">
                {formatPeso(service.startingPrice ?? service.price)}
              </span>
            </div>
            <span className="browseServiceCard__packageMeta">{packageLabel}</span>
          </div>

          <div className="browseServiceCard__actions">
            <Motion.button
              type="button"
              className="browseServiceCard__cartBtn"
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={LINK_BUTTON_MOTION.transition}
              onClick={(event) => {
                event.stopPropagation();
                onOpenListing(service.id);
              }}
            >
              <span>View listing</span>
            </Motion.button>

            <Motion.button
              type="button"
              className="browseServiceCard__btn browseServiceCard__btn--subtle"
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={LINK_BUTTON_MOTION.transition}
              onClick={(event) => {
                event.stopPropagation();
                onOpenMessage(service.freelancer_id, {
                  serviceTitle: service.title,
                });
              }}
            >
              Message
            </Motion.button>

            <Motion.button
              type="button"
              className="browseServiceCard__btn browseServiceCard__btn--ghost"
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={LINK_BUTTON_MOTION.transition}
              onClick={(event) => {
                event.stopPropagation();
                onViewFreelancer(service.freelancer_id);
              }}
            >
              Freelancer
            </Motion.button>
          </div>
        </div>
      </div>
    </Motion.article>
  );
}

export default function DashboardCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const {
    loading: requestsLoading,
    requests,
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
    async function loadRecommendedServices() {
      try {
        const { data, error } = await supabase
          .from("services")
          .select(
            "id, title, category, price, location, description, created_at, freelancer_id, is_pro, is_verified, average_rating, review_count, profiles(display_name, first_name, last_name, avatar_url, bio, region, city, barangay, freelancer_headline, freelancer_verified_at)"
          )
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;

        const nextServices = data || [];
        const serviceIds = nextServices.map((item) => item.id).filter(Boolean);

        if (serviceIds.length === 0) {
          setServices(nextServices);
          return;
        }

        const [
          { data: mediaRows, error: mediaError },
          { data: packageRows, error: packageError },
        ] = await Promise.all([
          supabase
            .from("service_media")
            .select("service_id, bucket_path, media_kind, is_cover, sort_order")
            .in("service_id", serviceIds)
            .order("is_cover", { ascending: false })
            .order("sort_order", { ascending: true }),
          supabase
            .from("service_packages")
            .select("service_id, price")
            .in("service_id", serviceIds),
        ]);

        if (mediaError) throw mediaError;
        if (packageError) throw packageError;

        const previewMap = new Map();
        (mediaRows || []).forEach((item) => {
          if (!previewMap.has(item.service_id)) {
            previewMap.set(item.service_id, {
              ...item,
              publicUrl: getPublicServiceMediaUrl(item.bucket_path),
            });
          }
        });

        const packageMap = new Map();
        (packageRows || []).forEach((item) => {
          const existing = packageMap.get(item.service_id) || [];
          existing.push(Number(item.price || 0));
          packageMap.set(item.service_id, existing);
        });

        setServices(
          nextServices.map((item) => {
            const prices = (packageMap.get(item.id) || []).filter(
              (value) => value > 0
            );
            const startingPrice =
              prices.length > 0 ? Math.min(...prices) : Number(item.price || 0);

            return {
              ...item,
              price: startingPrice,
              startingPrice,
              packageCount: (packageMap.get(item.id) || []).length,
              previewMedia: previewMap.get(item.id) || null,
            };
          })
        );
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
              <Motion.svg
                className="profileHero__line"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M 0,10 L 300,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                />
              </Motion.svg>
            </div>

            <p className="profileHero__sub">
              Pick up where you left off, revisit saved work, or post something new.
            </p>

            <div className="dashLandingHero__actions">
              <Motion.button
                type="button"
                className="dashLandingAction dashLandingAction--primary"
                {...HERO_BUTTON_MOTION}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span>Browse Services</span>
                <ArrowRight className="dashLandingAction__icon" />
              </Motion.button>

              <Motion.button
                type="button"
                className="dashLandingAction dashLandingAction--secondary"
                {...HERO_BUTTON_MOTION}
                onClick={() => navigate("/dashboard/customer/post-request")}
              >
                <PlusCircle className="dashLandingAction__icon" />
                <span>Post a Request</span>
              </Motion.button>
            </div>
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

            <Motion.button
              type="button"
              className="dashLandingGhostLink"
              {...LINK_BUTTON_MOTION}
              onClick={() => navigate("/dashboard/customer/post-request")}
            >
              <span>Post a request</span>
              <ArrowRight className="dashLandingGhostLink__icon" />
            </Motion.button>
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
                <Motion.article
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
                </Motion.article>
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

            <Motion.button
              type="button"
              className="dashLandingGhostLink"
              {...LINK_BUTTON_MOTION}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              <span>Browse all</span>
              <ArrowRight className="dashLandingGhostLink__icon" />
            </Motion.button>
          </div>

          {servicesLoading ? (
            <div className="dashLandingListingGrid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="browseServiceCard browseServiceCard--skeleton">
                  <div className="browseServiceCard__media browseServiceCard__media--skeleton" />
                  <div className="browseServiceCard__body">
                    <div className="browseServiceCard__creatorRow">
                      <div className="browseSkel browseSkel--avatar" />
                      <div className="browseSkel browseSkel--name" />
                    </div>
                    <div className="browseSkel browseSkel--title" />
                    <div className="browseSkel browseSkel--subtitle" />
                  </div>
                </div>
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
              {services.map((item, index) => (
                <RecommendedServiceCard
                  key={item.id}
                  service={item}
                  index={index}
                  favoriteIds={favoriteIds}
                  onFavoriteToggle={handleFavoriteToggle}
                  onOpenListing={(serviceId) =>
                    navigate(`/dashboard/customer/browse-services/${serviceId}`)
                  }
                  onOpenMessage={(freelancerId, params = {}) => {
                    const search = new URLSearchParams({
                      freelancer: freelancerId,
                      ...params,
                    });
                    navigate(`/dashboard/customer/messages?${search.toString()}`);
                  }}
                  onViewFreelancer={(freelancerId) =>
                    navigate(`/dashboard/customer/freelancers/${freelancerId}`)
                  }
                />
              ))}
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
                <Motion.button
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
                </Motion.button>
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
                  <Motion.article
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
                            <span>{getCustomerDisplayName(freelancer)}</span>
                            <VerifiedBadge
                              verified={Boolean(freelancer.freelancer_verified_at)}
                              className="verifiedBadge--sm"
                            />
                          </h3>
                          <p className="dashLandingFavoriteCard__reason">
                            {freelancer.freelancer_headline || "Favorited freelancer"}
                          </p>
                        </div>
                      </div>

                      <Motion.button
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
                      </Motion.button>
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
                  </Motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
