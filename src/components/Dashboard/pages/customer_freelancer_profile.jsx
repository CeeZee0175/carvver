import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Link as LinkIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "../../../lib/supabase/client";
import {
  buildPhilippinesLocationLabel,
  PHILIPPINES_COUNTRY,
} from "../../../lib/phLocations";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import {
  getProfileDisplayName,
  getProfileInitials,
  getProfileRealName,
} from "../shared/profileIdentity";
import { useCustomerFavoriteFreelancers } from "../hooks/useCustomerFavoriteFreelancers";
import VerifiedBadge from "../shared/VerifiedBadge";
import { getFreelancerAchievementById } from "../shared/freelancerAchievements";
import "./customer_freelancer_profile.css";

const supabase = createClient();

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

export default function CustomerFreelancerProfile() {
  const navigate = useNavigate();
  const { freelancerId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [showcasedBadges, setShowcasedBadges] = useState([]);
  const {
    favoriteIds,
    toggleFavoriteFreelancer,
  } = useCustomerFavoriteFreelancers({ includeProfiles: false });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, role, display_name, first_name, last_name, bio, avatar_url, country, region, city, barangay, freelancer_headline, freelancer_primary_category, freelancer_specialties, freelancer_experience_level, freelancer_portfolio_url, freelancer_verified_at"
          )
          .eq("id", freelancerId)
          .eq("role", "freelancer")
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          throw new Error("Profile not found.");
        }

        const [serviceResult, showcaseResult] = await Promise.all([
          supabase
            .from("services")
            .select(
              "id, title, category, price, location, description, is_pro, is_verified, is_published, created_at"
            )
            .eq("freelancer_id", freelancerId)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("freelancer_badge_showcase")
            .select("slot, achievement_id")
            .eq("user_id", freelancerId)
            .order("slot", { ascending: true }),
        ]);

        if (serviceResult.error) throw serviceResult.error;
        if (!active) return;

        setProfile(profileData);
        setServices(serviceResult.data || []);
        setShowcasedBadges(
          showcaseResult.error
            ? []
            : (showcaseResult.data || [])
                .map((row) => getFreelancerAchievementById(row.achievement_id))
                .filter(Boolean)
        );
      } catch {
        if (!active) return;
        setProfile(null);
        setServices([]);
        setShowcasedBadges([]);
        setError("We couldn't load this freelancer right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (freelancerId) {
      loadProfile();
    } else {
      setLoading(false);
      setError("We couldn't open this freelancer right now.");
    }

    return () => {
      active = false;
    };
  }, [freelancerId]);

  const displayName = getProfileDisplayName(profile, "Freelancer");
  const realName = getProfileRealName(profile, "");
  const initials = getProfileInitials(profile, "F");
  const locationLabel =
    buildPhilippinesLocationLabel({
      region: profile?.region,
      city: profile?.city,
    }) ||
    String(profile?.country || PHILIPPINES_COUNTRY);
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];
  const isFavorite = favoriteIds.includes(freelancerId);

  const summaryItems = useMemo(
    () => [
      {
        label: "Main category",
        value: profile?.freelancer_primary_category || "Not added yet",
      },
      {
        label: "Experience",
        value: profile?.freelancer_experience_level || "Not added yet",
      },
      {
        label: "Specialties",
        value: specialties.length > 0 ? `${specialties.length} selected` : "Not added yet",
      },
      {
        label: "Published work",
        value: String(services.length || 0),
      },
    ],
    [profile?.freelancer_experience_level, profile?.freelancer_primary_category, services.length, specialties.length]
  );

  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavoriteFreelancer(freelancerId, profile);
      toast.success(
        result.favorite
          ? `${displayName} is now in your favorites.`
          : `${displayName} was removed from your favorites.`
      );
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't update your favorites.");
    }
  };

  const handleOpenMessage = () => {
    if (!freelancerId) {
      toast.error("We couldn't open this conversation right now.");
      return;
    }

    navigate(
      `/dashboard/customer/messages?freelancer=${encodeURIComponent(freelancerId)}`
    );
  };

  return (
    <CustomerDashboardFrame mainClassName="customerFreelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Browse Services", to: "/dashboard/customer/browse-services" },
            { label: displayName },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="customerFreelancerHero">
          <div className="customerFreelancerHero__identity">
            <div className="customerFreelancerHero__titleWrap">
              <div className="customerFreelancerHero__avatar" aria-hidden="true">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="customerFreelancerHero__avatarImage"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="customerFreelancerHero__titleBlock">
                <h1 className="customerFreelancerHero__title">
                  <TypewriterHeading text={displayName} />
                  <VerifiedBadge
                    verified={Boolean(profile?.freelancer_verified_at)}
                    className="verifiedBadge--lg"
                  />
                </h1>
                {realName ? (
                  <p className="customerFreelancerHero__realName">{realName}</p>
                ) : null}
              </div>
            </div>
            <p className="customerFreelancerHero__sub">
              {profile?.freelancer_headline ||
                profile?.bio ||
                "Take a closer look at this freelancer before you decide who to work with."}
            </p>

            <div className="customerFreelancerHero__chips">
              {profile?.freelancer_primary_category ? (
                <span className="customerFreelancerHero__chip">
                  <Sparkles className="customerFreelancerHero__chipIcon" />
                  {profile.freelancer_primary_category}
                </span>
              ) : null}
              <span className="customerFreelancerHero__chip">
                <MapPin className="customerFreelancerHero__chipIcon" />
                {locationLabel}
              </span>
              {profile?.freelancer_portfolio_url ? (
                <a
                  href={profile.freelancer_portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="customerFreelancerHero__chip customerFreelancerHero__chip--link"
                >
                  <LinkIcon className="customerFreelancerHero__chipIcon" />
                  Portfolio
                </a>
              ) : null}
            </div>

            {showcasedBadges.length > 0 ? (
              <div className="customerFreelancerHero__badges" aria-label="Displayed freelancer badges">
                {showcasedBadges.map((achievement) => (
                  <span
                    key={achievement.id}
                    className="customerFreelancerHero__badge"
                    title={achievement.badge.label}
                  >
                    <img src={achievement.badge.media} alt={achievement.badge.label} />
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="customerFreelancerHero__actions">
            <Motion.button
              type="button"
              className="customerFreelancerHero__primaryBtn"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={handleOpenMessage}
            >
              <span>Message</span>
              <ArrowRight className="customerFreelancerHero__ghostIcon" />
            </Motion.button>

            <Motion.button
              type="button"
              className={`customerFreelancerHero__favoriteBtn ${
                isFavorite ? "customerFreelancerHero__favoriteBtn--active" : ""
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={handleToggleFavorite}
            >
              <Heart
                className="customerFreelancerHero__favoriteIcon"
                fill={isFavorite ? "currentColor" : "none"}
              />
              <span>{isFavorite ? "Favorited" : "Add to favorites"}</span>
            </Motion.button>

            <Motion.button
              type="button"
              className="customerFreelancerHero__ghostBtn"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              <span>Browse services</span>
              <ArrowRight className="customerFreelancerHero__ghostIcon" />
            </Motion.button>
          </div>
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="customerFreelancerSection">
            <div className="customerFreelancerSkeletonGrid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="customerFreelancerSkeletonCard" />
              ))}
            </div>
          </section>
        </Reveal>
      ) : error || !profile ? (
        <Reveal delay={0.08}>
          <EmptySurface
            title="We couldn't open this freelancer"
            description={error || "Please try again."}
            actionLabel="Back to services"
            onAction={() => navigate("/dashboard/customer/browse-services")}
            className="customerFreelancerEmpty"
          />
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.08}>
            <section className="customerFreelancerSection">
              <div className="customerFreelancerSection__head">
                <div>
                  <h2 className="customerFreelancerSection__title">At a glance</h2>
                  <p className="customerFreelancerSection__sub">
                    The key details this freelancer already shared with customers.
                  </p>
                </div>
              </div>

              <div className="customerFreelancerSummaryGrid">
                {summaryItems.map((item) => (
                  <Motion.article
                    key={item.label}
                    className="customerFreelancerSummaryCard"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    transition={PROFILE_SPRING}
                  >
                    <span className="customerFreelancerSummaryCard__label">{item.label}</span>
                    <strong className="customerFreelancerSummaryCard__value">{item.value}</strong>
                  </Motion.article>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="customerFreelancerSection">
              <div className="customerFreelancerSection__head">
                <div>
                  <h2 className="customerFreelancerSection__title">About</h2>
                  <p className="customerFreelancerSection__sub">
                    A quick look at how this freelancer describes their work and specialties.
                  </p>
                </div>
              </div>

              <div className="customerFreelancerInfoGrid">
                <article className="customerFreelancerInfoCard">
                  <span className="customerFreelancerInfoCard__label">About this freelancer</span>
                  <p className="customerFreelancerInfoCard__value">
                    {profile.bio || "No bio added yet."}
                  </p>
                </article>

                <article className="customerFreelancerInfoCard">
                  <span className="customerFreelancerInfoCard__label">Specialties</span>
                  {specialties.length > 0 ? (
                    <div className="customerFreelancerTagRow">
                      {specialties.map((specialty) => (
                        <span key={specialty} className="customerFreelancerTag">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="customerFreelancerInfoCard__value">No specialties added yet.</p>
                  )}
                </article>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.16}>
            <section className="customerFreelancerSection">
              <div className="customerFreelancerSection__head">
                <div>
                  <h2 className="customerFreelancerSection__title">Published work</h2>
                  <p className="customerFreelancerSection__sub">
                    Browse the listings this freelancer already has live for customers.
                  </p>
                </div>
              </div>

              {services.length === 0 ? (
                <EmptySurface
                  title="No published services yet"
                  actionLabel="Back to services"
                  onAction={() => navigate("/dashboard/customer/browse-services")}
                  className="customerFreelancerEmpty"
                />
              ) : (
                <div className="customerFreelancerServiceGrid">
                  {services.map((service) => (
                    <Motion.article
                      key={service.id}
                      className="customerFreelancerServiceCard"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.99 }}
                      transition={PROFILE_SPRING}
                    >
                      <div className="customerFreelancerServiceCard__top">
                        <span className="customerFreelancerServiceCard__chip">
                          {service.category}
                        </span>
                        <div className="customerFreelancerServiceCard__badges">
                          {service.is_verified ? (
                            <span className="customerFreelancerServiceCard__meta">
                              <ShieldCheck className="customerFreelancerServiceCard__metaIcon" />
                              Verified
                            </span>
                          ) : null}
                          {service.is_pro ? (
                            <span className="customerFreelancerServiceCard__meta customerFreelancerServiceCard__meta--gold">
                              Pro
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <h3 className="customerFreelancerServiceCard__title">{service.title}</h3>
                      <p className="customerFreelancerServiceCard__desc">
                        {service.description || "This service is ready to browse from the listing page."}
                      </p>

                      <div className="customerFreelancerServiceCard__footer">
                        <strong className="customerFreelancerServiceCard__price">
                          {formatPeso(service.price)}
                        </strong>
                        <Motion.button
                          type="button"
                          className="customerFreelancerServiceCard__link"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() =>
                            navigate(`/dashboard/customer/browse-services/${service.id}`)
                          }
                        >
                          View listing
                          <ArrowRight className="customerFreelancerServiceCard__linkIcon" />
                        </Motion.button>
                      </div>
                    </Motion.article>
                  ))}
                </div>
              )}
            </section>
          </Reveal>
        </>
      )}
    </CustomerDashboardFrame>
  );
}
