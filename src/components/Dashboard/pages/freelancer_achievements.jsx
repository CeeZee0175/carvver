import React, { useMemo, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FREELANCER_ACHIEVEMENT_CATEGORIES,
  FREELANCER_SHOWCASE_SLOT_LIMIT,
} from "../shared/freelancerAchievements";
import { useFreelancerTrustData } from "../hooks/useFreelancerTrustData";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./profile.css";
import "./freelancer_trust.css";

const STATE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Earned", value: "earned" },
  { label: "Locked", value: "locked" },
  { label: "Legendary", value: "legendary" },
];

function BadgeMedia({ achievement, className = "", alt = "" }) {
  const mediaSrc = achievement?.badge?.media || "";
  if (mediaSrc) {
    return <img src={mediaSrc} alt={alt || achievement.badge.label} className={className} />;
  }

  const Icon = achievement?.badge?.Icon || Trophy;
  return <Icon className={className} />;
}

export default function FreelancerAchievements() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const {
    loading,
    warnings,
    achievementStates,
    earnedAchievements,
    showcaseIds,
    capabilities,
    saveBadgeShowcase,
  } = useFreelancerTrustData();
  const [stateFilter, setStateFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showcaseSaving, setShowcaseSaving] = useState(false);

  const filteredAchievements = useMemo(() => {
    return achievementStates.filter((achievement) => {
      if (stateFilter === "earned" && !achievement.earned) return false;
      if (stateFilter === "locked" && achievement.earned) return false;
      if (stateFilter === "legendary" && !achievement.legendary) return false;
      if (categoryFilter !== "all" && achievement.category !== categoryFilter) return false;
      return true;
    });
  }, [achievementStates, categoryFilter, stateFilter]);

  const updateShowcase = async (nextIds, successMessage) => {
    try {
      setShowcaseSaving(true);
      await saveBadgeShowcase(nextIds);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Couldn't update your displayed badges.");
    } finally {
      setShowcaseSaving(false);
    }
  };

  const handleToggleFeature = (achievementId) => {
    if (showcaseIds.includes(achievementId)) {
      updateShowcase(
        showcaseIds.filter((id) => id !== achievementId),
        "Badge removed from your profile."
      );
      return;
    }

    if (showcaseIds.length >= FREELANCER_SHOWCASE_SLOT_LIMIT) {
      toast.error(`You can display up to ${FREELANCER_SHOWCASE_SLOT_LIMIT} badges.`);
      return;
    }

    updateShowcase([...showcaseIds, achievementId], "Badge added to your profile.");
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage freelancerTrustPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Profile", to: "/dashboard/freelancer/profile" },
            { label: "Achievements" },
          ]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero freelancerTrustHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Achievements" />
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
              Track the signals customers care about and choose which earned badges appear on your freelancer profile.
            </p>
          </div>

          <div className="profileHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Catalog</span>
              <strong className="profileMiniStat__value">{achievementStates.length}</strong>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Earned</span>
              <strong className="profileMiniStat__value">{earnedAchievements.length}</strong>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Legendary</span>
              <strong className="profileMiniStat__value">
                {achievementStates.filter((achievement) => achievement.legendary).length}
              </strong>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Displayed</span>
              <strong className="profileMiniStat__value">{showcaseIds.length}</strong>
            </div>
          </div>
        </section>
      </Reveal>

      {warnings.length > 0 ? (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">Some achievement details couldn't be loaded</h2>
              <p className="profileNotice__desc">{warnings[0]}</p>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <section className="profileSection freelancerTrustSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Browse the reward map</h2>
              <p className="profileSection__sub">
                Filter the catalog and keep your public badge shelf current.
              </p>
            </div>
            <Motion.button
              type="button"
              className="profileSection__linkBtn"
              whileHover={{ x: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/freelancer/profile")}
            >
              <span>Back to profile</span>
              <ArrowRight className="profileSection__linkIcon" />
            </Motion.button>
          </div>

          <div className="freelancerTrustFilters">
            <div className="freelancerTrustFilters__group">
              {STATE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`freelancerTrustFilterButton ${
                    stateFilter === filter.value ? "freelancerTrustFilterButton--active" : ""
                  }`}
                  onClick={() => setStateFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="freelancerTrustFilters__group freelancerTrustFilters__group--scroll">
              <button
                type="button"
                className={`freelancerTrustFilterButton ${
                  categoryFilter === "all" ? "freelancerTrustFilterButton--active" : ""
                }`}
                onClick={() => setCategoryFilter("all")}
              >
                All categories
              </button>
              {FREELANCER_ACHIEVEMENT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`freelancerTrustFilterButton ${
                    categoryFilter === category ? "freelancerTrustFilterButton--active" : ""
                  }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection freelancerTrustSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">All freelancer achievements</h2>
              <p className="profileSection__sub">
                Earn badges through profile strength, listings, orders, reviews, and trust checks.
              </p>
            </div>
            <div className="profileSection__sideNote">{filteredAchievements.length} shown</div>
          </div>

          {loading ? (
            <div className="freelancerAchievementGrid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="freelancerAchievementCard freelancerAchievementCard--skeleton" />
              ))}
            </div>
          ) : filteredAchievements.length === 0 ? (
            <EmptySurface
              icon={Trophy}
              title="No achievements match this filter"
              description="Try earned, locked, or all categories."
            />
          ) : (
            <div className="freelancerAchievementGrid">
              {filteredAchievements.map((achievement, index) => {
                const isDisplayed = showcaseIds.includes(achievement.id);

                return (
                  <Motion.article
                    key={achievement.id}
                    className={`freelancerAchievementCard ${
                      achievement.earned ? "freelancerAchievementCard--earned" : ""
                    } ${achievement.legendary ? "freelancerAchievementCard--legendary" : ""}`}
                    style={{
                      "--freelancer-badge-bg": achievement.badge.bg,
                      "--freelancer-badge-border": achievement.badge.border,
                      "--freelancer-badge-color": achievement.badge.color,
                    }}
                    initial={reduceMotion ? false : { opacity: 0, y: 18, rotateX: -8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.42, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={reduceMotion ? undefined : { y: achievement.earned ? -6 : -2 }}
                  >
                    <div className="freelancerAchievementCard__top">
                      <span className="freelancerAchievementCard__state">
                        {achievement.earned ? "Earned" : "Locked"}
                      </span>
                      <span className="freelancerAchievementCard__tier">
                        {achievement.legendary ? (
                          <>
                            <Star className="freelancerAchievementCard__tierIcon" />
                            Legendary
                          </>
                        ) : (
                          achievement.category
                        )}
                      </span>
                    </div>

                    <div className="freelancerAchievementCard__body">
                      <Motion.span
                        className="freelancerAchievementCard__badge"
                        aria-hidden="true"
                        animate={
                          achievement.earned && !reduceMotion
                            ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
                            : undefined
                        }
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <BadgeMedia
                          achievement={achievement}
                          className="freelancerAchievementCard__badgeImage"
                          alt={achievement.badge.label}
                        />
                      </Motion.span>
                      <div>
                        <h3 className="freelancerAchievementCard__title">{achievement.title}</h3>
                        <p className="freelancerAchievementCard__desc">{achievement.description}</p>
                      </div>
                    </div>

                    <div className="freelancerAchievementCard__meta">
                      <div>
                        <span className="freelancerAchievementCard__metaLabel">Badge</span>
                        <strong>{achievement.badge.label}</strong>
                      </div>
                      <div>
                        <span className="freelancerAchievementCard__metaLabel">Category</span>
                        <strong>{achievement.category}</strong>
                      </div>
                    </div>

                    <div className="freelancerAchievementCard__footer">
                      {achievement.earned ? (
                        <button
                          type="button"
                          className={`freelancerAchievementCard__action ${
                            isDisplayed ? "freelancerAchievementCard__action--active" : ""
                          }`}
                          onClick={() => handleToggleFeature(achievement.id)}
                          disabled={showcaseSaving || !capabilities.canPersistShowcase}
                        >
                          <BadgeCheck className="freelancerAchievementCard__actionIcon" />
                          {isDisplayed ? "Displayed" : "Display badge"}
                        </button>
                      ) : (
                        <span className="freelancerAchievementCard__lockedNote">
                          Unlock through real freelancer activity.
                        </span>
                      )}
                    </div>
                  </Motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
