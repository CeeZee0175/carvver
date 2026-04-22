import React, { useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ACHIEVEMENT_CATEGORIES,
  SHOWCASE_SLOT_LIMIT,
} from "../shared/customerAchievements";
import { useCustomerProfileData } from "../hooks/useCustomerProfileData";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./profile.css";

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Earned", value: "earned" },
  { label: "Locked", value: "locked" },
  { label: "Legendary", value: "legendary" },
];

export default function ProfileAchievements() {
  const navigate = useNavigate();
  const {
    loading,
    warnings,
    achievementStates,
    earnedAchievements,
    showcaseIds,
    capabilities,
    saveBadgeShowcase,
  } = useCustomerProfileData();

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

    if (showcaseIds.length >= SHOWCASE_SLOT_LIMIT) {
      toast.error(`You can display up to ${SHOWCASE_SLOT_LIMIT} badges.`);
      return;
    }

    updateShowcase([...showcaseIds, achievementId], "Badge added to your profile.");
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Profile", to: "/dashboard/customer/profile" },
            { label: "Achievements" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
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
                  d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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
              Browse every customer achievement and choose which earned badges you
              want to display on your profile.
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

      {warnings.length > 0 && (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__iconWrap" aria-hidden="true">
              <ShieldCheck className="profileNotice__icon" />
            </div>
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">
                Some achievement details couldn't be loaded
              </h2>
              <p className="profileNotice__desc">{warnings[0]}</p>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Browse the full reward map</h2>
              <p className="profileSection__sub">
                Filter the catalog and keep track of which earned badges you display.
              </p>
            </div>
            <Motion.button
              type="button"
              className="profileSection__linkBtn"
              whileHover={{ x: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/profile")}
            >
              <span>Back to profile</span>
              <ArrowRight className="profileSection__linkIcon" />
            </Motion.button>
          </div>

          <div className="profileFilterRow">
            <div className="profileFilterGroup">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`profileFilterChip ${
                    stateFilter === filter.value ? "profileFilterChip--active" : ""
                  }`}
                  onClick={() => setStateFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="profileFilterGroup profileFilterGroup--scroll">
              <button
                type="button"
                className={`profileFilterChip ${
                  categoryFilter === "all" ? "profileFilterChip--active" : ""
                }`}
                onClick={() => setCategoryFilter("all")}
              >
                All categories
              </button>
              {ACHIEVEMENT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`profileFilterChip ${
                    categoryFilter === category ? "profileFilterChip--active" : ""
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
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">All possible achievements</h2>
              <p className="profileSection__sub">
                Every achievement in the customer catalog and the badge it maps to.
              </p>
            </div>
            <div className="profileSection__sideNote">
              {filteredAchievements.length} shown
            </div>
          </div>

          {loading ? (
            <div className="profileCatalogGrid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="profileCatalogCard profileCatalogCard--skeleton" />
              ))}
            </div>
          ) : filteredAchievements.length === 0 ? (
            <EmptySurface
              icon={Trophy}
              title="No achievements match this filter"
              description="Try a broader category or switch back to all rewards."
            />
          ) : (
            <div className="profileCatalogGrid">
              {filteredAchievements.map((achievement) => {
                const Icon = achievement.badge.Icon;
                const isDisplayed = showcaseIds.includes(achievement.id);

                return (
                  <article
                    key={achievement.id}
                    className={`profileCatalogCard ${
                      achievement.legendary ? "profileCatalogCard--legendary" : ""
                    } ${achievement.earned ? "profileCatalogCard--earned" : ""}`}
                    style={{
                      "--catalog-badge-bg": achievement.badge.bg,
                      "--catalog-badge-border": achievement.badge.border,
                      "--catalog-badge-color": achievement.badge.color,
                    }}
                  >
                    <div className="profileCatalogCard__top">
                      <span className="profileCatalogCard__state">
                        {achievement.earned ? "Earned" : "Locked"}
                      </span>
                      <span className="profileCatalogCard__tier">
                        {achievement.legendary ? (
                          <>
                            <Star className="profileCatalogCard__tierIcon" />
                            Legendary
                          </>
                        ) : (
                          achievement.category
                        )}
                      </span>
                    </div>

                    <div className="profileCatalogCard__body">
                      <span className="profileCatalogCard__badge" aria-hidden="true">
                        <Icon className="profileCatalogCard__badgeIcon" />
                      </span>
                      <div>
                        <h3 className="profileCatalogCard__title">{achievement.title}</h3>
                        <p className="profileCatalogCard__desc">{achievement.description}</p>
                      </div>
                    </div>

                    <div className="profileCatalogCard__badgeMeta">
                      <div>
                        <span className="profileCatalogCard__metaLabel">Badge</span>
                        <strong className="profileCatalogCard__metaValue">
                          {achievement.badge.label}
                        </strong>
                      </div>
                      <div>
                        <span className="profileCatalogCard__metaLabel">Category</span>
                        <strong className="profileCatalogCard__metaValue">
                          {achievement.category}
                        </strong>
                      </div>
                    </div>

                    <div className="profileCatalogCard__footer">
                      {achievement.earned ? (
                        <button
                          type="button"
                          className={`profileCatalogCard__action ${
                            isDisplayed ? "profileCatalogCard__action--active" : ""
                          }`}
                          onClick={() => handleToggleFeature(achievement.id)}
                          disabled={showcaseSaving || !capabilities.canPersistShowcase}
                        >
                          {isDisplayed ? "Displayed" : "Display badge"}
                        </button>
                      ) : (
                        <span className="profileCatalogCard__lockedNote">
                          {achievement.legendary
                            ? "Unlock this through deeper customer activity."
                            : "Unlock this through real customer activity."}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      {!capabilities.canPersistShowcase && (
        <Reveal delay={0.14}>
          <section className="profileSection">
            <EmptySurface
              icon={BadgeCheck}
              title="Badge updates are unavailable at the moment"
              description="You can still browse your achievements, but badge changes cannot be saved right now."
            />
          </section>
        </Reveal>
      )}
    </CustomerDashboardFrame>
  );
}
