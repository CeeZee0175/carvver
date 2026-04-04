import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  PenTool,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  SHOWCASE_SLOT_LIMIT,
  getCustomerDisplayName,
  getCustomerInitials,
} from "./customerAchievements";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  useCustomerProfileData,
} from "./useCustomerProfileData";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "./customerProfileShared";
import { PROFILE_SPRING } from "./customerProfileConfig";
import "./profile.css";

function formatCompactDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function ReviewStars({ rating }) {
  return (
    <div className="profileReview__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`profileReview__star ${
            index < Number(rating || 0) ? "profileReview__star--filled" : ""
          }`}
        />
      ))}
    </div>
  );
}

function StatMiniCard({ label, value, hint }) {
  return (
    <div className="profileMiniStat">
      <span className="profileMiniStat__label">{label}</span>
      <strong className="profileMiniStat__value">{value}</strong>
      <span className="profileMiniStat__hint">{hint}</span>
    </div>
  );
}

function BadgeSlot({
  achievement,
  index,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onRemove,
  disabled,
}) {
  if (!achievement) {
    return (
      <div className="profileBadgeSlot profileBadgeSlot--empty">
        <span className="profileBadgeSlot__index">0{index + 1}</span>
        <p className="profileBadgeSlot__emptyTitle">Open badge slot</p>
        <p className="profileBadgeSlot__emptyDesc">
          Feature an earned badge to make your profile feel more complete.
        </p>
      </div>
    );
  }

  const Icon = achievement.badge.Icon;

  return (
    <div
      className={`profileBadgeSlot ${
        achievement.legendary ? "profileBadgeSlot--legendary" : ""
      }`}
      style={{
        "--badge-bg": achievement.badge.bg,
        "--badge-border": achievement.badge.border,
        "--badge-color": achievement.badge.color,
      }}
    >
      <span className="profileBadgeSlot__index">0{index + 1}</span>
      <div className="profileBadgeSlot__content">
        <span className="profileBadgeSlot__iconWrap" aria-hidden="true">
          <Icon className="profileBadgeSlot__icon" />
        </span>
        <div className="profileBadgeSlot__copy">
          <span className="profileBadgeSlot__tier">
            {achievement.legendary ? "Legendary badge" : `${achievement.category} badge`}
          </span>
          <strong className="profileBadgeSlot__title">{achievement.badge.label}</strong>
          <span className="profileBadgeSlot__desc">{achievement.title}</span>
        </div>
      </div>
      <div className="profileBadgeSlot__actions">
        <button
          type="button"
          className="profileBadgeSlot__action"
          onClick={onMoveLeft}
          disabled={!canMoveLeft || disabled}
          aria-label={`Move ${achievement.title} left`}
        >
          <ChevronLeft className="profileBadgeSlot__actionIcon" />
        </button>
        <button
          type="button"
          className="profileBadgeSlot__action"
          onClick={onMoveRight}
          disabled={!canMoveRight || disabled}
          aria-label={`Move ${achievement.title} right`}
        >
          <ChevronRight className="profileBadgeSlot__actionIcon" />
        </button>
        <button
          type="button"
          className="profileBadgeSlot__action profileBadgeSlot__action--danger"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${achievement.title} from showcase`}
        >
          <X className="profileBadgeSlot__actionIcon" />
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const {
    loading,
    profile,
    reviews,
    warnings,
    metrics,
    progressTasks,
    earnedAchievements,
    achievementStates,
    showcasedBadges,
    showcaseIds,
    capabilities,
    saveProfile,
    saveBadgeShowcase,
  } = useCustomerProfileData();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showcaseSaving, setShowcaseSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    displayName: "",
    bio: "",
    country: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    if (!profile || editing) return;
    setFormValues({
      displayName: profile.display_name || "",
      bio: profile.bio || "",
      country: profile.country || "",
    });
  }, [editing, profile]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const displayName = getCustomerDisplayName(profile);
  const initials = getCustomerInitials(profile);
  const profileCompletion = useMemo(() => {
    const completed = progressTasks.filter((task) => task.complete).length;
    const total = progressTasks.length;
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [progressTasks]);
  const earnedBadgeCount = earnedAchievements.length;
  const earnedLegendaryCount = earnedAchievements.filter(
    (achievement) => achievement.legendary
  ).length;
  const averageRating =
    metrics.reviewCount > 0 ? metrics.averageRating.toFixed(1) : "—";
  const avatarSrc = removeAvatar
    ? ""
    : avatarPreview || String(profile?.avatar_url || "").trim();
  const topAchievements = earnedAchievements.slice(0, 8);

  const resetEditor = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(false);
    setFormValues({
      displayName: profile?.display_name || "",
      bio: profile?.bio || "",
      country: profile?.country || "",
    });
  };

  const handleEditToggle = () => {
    if (editing) {
      resetEditor();
      setEditing(false);
      return;
    }
    setEditing(true);
  };

  const handleAvatarPick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, or WEBP image for your profile photo.");
      event.target.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Profile photos must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setAvatarFile(file);
    setAvatarPreview(nextPreviewUrl);
    setRemoveAvatar(false);
  };

  const handleAvatarRemove = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await saveProfile({
        displayName: formValues.displayName,
        bio: formValues.bio,
        country: formValues.country,
        avatarFile,
        removeAvatar,
      });
      toast.success("Your customer profile is up to date.");
      setEditing(false);
      resetEditor();
    } catch (error) {
      toast.error(error.message || "Couldn't save your profile just yet.");
    } finally {
      setSaving(false);
    }
  };

  const updateShowcase = async (nextIds, successMessage) => {
    try {
      setShowcaseSaving(true);
      await saveBadgeShowcase(nextIds);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Couldn't update your badge showcase.");
    } finally {
      setShowcaseSaving(false);
    }
  };

  const handleFeatureBadge = (achievementId) => {
    if (showcaseIds.includes(achievementId)) {
      toast("That badge is already on display.");
      return;
    }
    if (showcaseIds.length >= SHOWCASE_SLOT_LIMIT) {
      toast.error("Your badge wall is full. Remove one before adding another.");
      return;
    }
    updateShowcase([...showcaseIds, achievementId], "Badge featured on your profile.");
  };

  const handleRemoveBadge = (achievementId) => {
    updateShowcase(
      showcaseIds.filter((id) => id !== achievementId),
      "Badge removed from your profile wall."
    );
  };

  const handleMoveBadge = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= showcaseIds.length) return;
    const nextIds = [...showcaseIds];
    [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
    updateShowcase(nextIds, "Badge order updated.");
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Profile" }]} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <p className="profileHero__eyebrow">Customer Profile</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Profile" />
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </motion.svg>
            </div>
            <p className="profileHero__sub">
              Keep your customer profile grounded in real activity, clearer trust
              signals, and the badges you have genuinely earned inside Carvver.
            </p>
          </div>

          <div className="profileHero__stats">
            <StatMiniCard
              label="Saved"
              value={loading ? "—" : metrics.savedCount}
              hint="Listings on your shortlist"
            />
            <StatMiniCard
              label="Orders"
              value={loading ? "—" : metrics.totalOrders}
              hint="Placed through Carvver"
            />
            <StatMiniCard
              label="Reviews"
              value={loading ? "—" : metrics.reviewCount}
              hint={metrics.reviewCount > 0 ? `${averageRating} average` : "No reviews yet"}
            />
            <StatMiniCard
              label="Earned"
              value={loading ? "—" : earnedBadgeCount}
              hint={`${earnedLegendaryCount} legendary`}
            />
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
                A few profile systems still need Supabase support
              </h2>
              <p className="profileNotice__desc">{warnings[0]}</p>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <section className="profileEditorBand">
          <div className="profileIdentity">
            <div className="profileIdentity__avatarWrap">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="profileIdentity__avatarImage"
                />
              ) : (
                <div className="profileIdentity__avatarFallback" aria-hidden="true">
                  {initials}
                </div>
              )}

              {editing && (
                <div className="profileIdentity__avatarActions">
                  <button
                    type="button"
                    className="profileIdentity__avatarBtn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="profileIdentity__avatarBtnIcon" />
                    <span>{avatarSrc ? "Replace photo" : "Add photo"}</span>
                  </button>
                  {(avatarSrc || avatarFile) && (
                    <button
                      type="button"
                      className="profileIdentity__avatarBtn profileIdentity__avatarBtn--ghost"
                      onClick={handleAvatarRemove}
                    >
                      <X className="profileIdentity__avatarBtnIcon" />
                      <span>Remove</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="profileIdentity__avatarInput"
                    onChange={handleAvatarPick}
                  />
                </div>
              )}
            </div>

            <div className="profileIdentity__copy">
              <p className="profileIdentity__eyebrow">Customer-facing profile</p>
              <h2 className="profileIdentity__name">{displayName}</h2>
              <p className="profileIdentity__email">
                {profile?.email || "Signed-in customer"}
              </p>
              <div className="profileIdentity__chips">
                <span className="profileIdentity__chip">
                  <BadgeCheck className="profileIdentity__chipIcon" />
                  {profileCompletion.percent}% complete
                </span>
                <span className="profileIdentity__chip">
                  <Sparkles className="profileIdentity__chipIcon" />
                  {earnedBadgeCount} earned badges
                </span>
              </div>
            </div>
          </div>

          <form className="profileEditor" onSubmit={handleSaveProfile}>
            <div className="profileEditor__head">
              <div>
                <p className="profileEditor__eyebrow">Editable profile details</p>
                <h3 className="profileEditor__title">Shape how creators see you</h3>
              </div>

              <div className="profileEditor__actions">
                {!editing ? (
                  <motion.button
                    type="button"
                    className="profileEditor__btn profileEditor__btn--primary"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleEditToggle}
                  >
                    <PenTool className="profileEditor__btnIcon" />
                    <span>Edit profile</span>
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      className="profileEditor__btn profileEditor__btn--ghost"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      onClick={handleEditToggle}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="profileEditor__btn profileEditor__btn--primary"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            <div className="profileEditor__grid">
              <label className="profileField">
                <span className="profileField__label">Display name</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="text"
                    value={formValues.displayName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        displayName: event.target.value,
                      }))
                    }
                    placeholder="How you want creators to know you"
                  />
                ) : (
                  <div className="profileField__value">
                    {formValues.displayName || "No display name yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Country / location</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="text"
                    value={formValues.country}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        country: event.target.value,
                      }))
                    }
                    placeholder="Philippines"
                  />
                ) : (
                  <div className="profileField__value">
                    {formValues.country || "No location added yet"}
                  </div>
                )}
              </label>

              <label className="profileField profileField--wide">
                <span className="profileField__label">Bio</span>
                {editing ? (
                  <textarea
                    className="profileField__control profileField__control--textarea"
                    value={formValues.bio}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        bio: event.target.value,
                      }))
                    }
                    placeholder="Tell creators the kind of customer you are, how you like to collaborate, or what you usually need."
                  />
                ) : (
                  <div className="profileField__value profileField__value--textarea">
                    {formValues.bio ||
                      "No bio yet. A short note here helps creators understand your tone and expectations before they reply."}
                  </div>
                )}
              </label>
            </div>
          </form>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileNavBand">
          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/customer/orders")}
          >
            <ShoppingBag className="profileNavBand__icon" />
            <span className="profileNavBand__label">Orders</span>
            <span className="profileNavBand__desc">Track every request and status</span>
          </motion.button>

          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/customer/saved")}
          >
            <Bookmark className="profileNavBand__icon" />
            <span className="profileNavBand__label">Favorites</span>
            <span className="profileNavBand__desc">Revisit your saved listings</span>
          </motion.button>

          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/customer/profile/achievements")}
          >
            <Trophy className="profileNavBand__icon" />
            <span className="profileNavBand__label">Achievements</span>
            <span className="profileNavBand__desc">Browse every possible badge</span>
          </motion.button>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Account Progress</p>
              <h2 className="profileSection__title">What still makes the profile stronger</h2>
            </div>
            <div className="profileProgress__meta">
              <strong>{profileCompletion.completed}</strong>
              <span>/ {profileCompletion.total} complete</span>
            </div>
          </div>

          <div className="profileProgress">
            <div className="profileProgress__bar">
              <span
                className="profileProgress__barFill"
                style={{ width: `${profileCompletion.percent}%` }}
              />
            </div>

            <div className="profileProgress__grid">
              {progressTasks.map((task) => (
                <div
                  key={task.id}
                  className={`profileTask ${task.complete ? "profileTask--complete" : ""}`}
                >
                  <span className="profileTask__status" aria-hidden="true">
                    {task.complete ? <Check className="profileTask__statusIcon" /> : null}
                  </span>
                  <div className="profileTask__copy">
                    <strong className="profileTask__label">{task.label}</strong>
                    <p className="profileTask__detail">{task.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Freelancer Reviews</p>
              <h2 className="profileSection__title">What creators have said so far</h2>
            </div>
            {metrics.reviewCount > 0 && (
              <div className="profileReviewSummary">
                <span className="profileReviewSummary__score">{averageRating}</span>
                <span className="profileReviewSummary__meta">
                  from {metrics.reviewCount} review{metrics.reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="profileReviewGrid profileReviewGrid--skeleton">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="profileReview profileReview--skeleton" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptySurface
              icon={MessageCircle}
              title="No freelancer reviews yet"
              description="Once a creator leaves feedback about working with you, it will appear here without any fake filler."
            />
          ) : (
            <div className="profileReviewGrid">
              {reviews.map((review) => {
                const reviewerName = getCustomerDisplayName(review.reviewer);
                const reviewerInitials = getCustomerInitials(review.reviewer);

                return (
                  <article key={review.id} className="profileReview">
                    <div className="profileReview__head">
                      <div className="profileReview__identity">
                        {review.reviewer?.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt={reviewerName}
                            className="profileReview__avatarImage"
                          />
                        ) : (
                          <div className="profileReview__avatarFallback" aria-hidden="true">
                            {reviewerInitials}
                          </div>
                        )}

                        <div>
                          <strong className="profileReview__name">{reviewerName}</strong>
                          <span className="profileReview__role">Freelancer review</span>
                        </div>
                      </div>

                      <span className="profileReview__date">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>

                    <ReviewStars rating={review.rating} />

                    <p className="profileReview__text">
                      {String(review.comment || "").trim() ||
                        "This creator left a rating without written notes."}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Featured Badges</p>
              <h2 className="profileSection__title">What you want visible first</h2>
            </div>
            <div className="profileSection__sideNote">
              {showcaseIds.length} / {SHOWCASE_SLOT_LIMIT} slots used
            </div>
          </div>

          {earnedAchievements.length === 0 ? (
            <EmptySurface
              icon={BadgeCheck}
              title="No badges to feature yet"
              description="As soon as you earn achievements, their paired badges can be pinned here."
            />
          ) : (
            <div className="profileBadgeSlots">
              {Array.from({ length: SHOWCASE_SLOT_LIMIT }).map((_, index) => (
                <BadgeSlot
                  key={index}
                  index={index}
                  achievement={showcasedBadges[index]}
                  canMoveLeft={index > 0 && index < showcasedBadges.length}
                  canMoveRight={index < showcasedBadges.length - 1}
                  disabled={showcaseSaving}
                  onMoveLeft={() => handleMoveBadge(index, -1)}
                  onMoveRight={() => handleMoveBadge(index, 1)}
                  onRemove={() =>
                    showcasedBadges[index]
                      ? handleRemoveBadge(showcasedBadges[index].id)
                      : null
                  }
                />
              ))}
            </div>
          )}

          {!capabilities.canPersistShowcase && (
            <p className="profileSection__footnote">
              Run the Supabase SQL for the badge showcase table before these slots can persist.
            </p>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Earned Achievements</p>
              <h2 className="profileSection__title">Reward signals backed by real activity</h2>
            </div>
            <motion.button
              type="button"
              className="profileSection__linkBtn"
              whileHover={{ x: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/profile/achievements")}
            >
              <span>View all achievements</span>
              <ArrowRight className="profileSection__linkIcon" />
            </motion.button>
          </div>

          {loading ? (
            <div className="profileAchievementGrid profileAchievementGrid--skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="profileAchievement profileAchievement--skeleton" />
              ))}
            </div>
          ) : topAchievements.length === 0 ? (
            <EmptySurface
              icon={Trophy}
              title="No achievements earned yet"
              description="Your achievements wall will grow from real profile completion, saved listings, orders, reviews, and badge curation."
            />
          ) : (
            <div className="profileAchievementGrid">
              {topAchievements.map((achievement) => {
                const Icon = achievement.badge.Icon;
                const isDisplayed = showcaseIds.includes(achievement.id);

                return (
                  <article
                    key={achievement.id}
                    className={`profileAchievement ${
                      achievement.legendary ? "profileAchievement--legendary" : ""
                    }`}
                    style={{
                      "--achievement-badge-bg": achievement.badge.bg,
                      "--achievement-badge-border": achievement.badge.border,
                      "--achievement-badge-color": achievement.badge.color,
                    }}
                  >
                    <div className="profileAchievement__top">
                      <span className="profileAchievement__badgePreview" aria-hidden="true">
                        <Icon className="profileAchievement__badgeIcon" />
                      </span>
                      <div>
                        <span className="profileAchievement__category">{achievement.category}</span>
                        <h3 className="profileAchievement__title">{achievement.title}</h3>
                      </div>
                    </div>

                    <p className="profileAchievement__desc">{achievement.description}</p>

                    <div className="profileAchievement__bottom">
                      <span className="profileAchievement__tier">
                        {achievement.legendary ? "Legendary" : "Earned"}
                      </span>

                      <button
                        type="button"
                        className={`profileAchievement__action ${
                          isDisplayed ? "profileAchievement__action--active" : ""
                        }`}
                        onClick={() =>
                          isDisplayed
                            ? handleRemoveBadge(achievement.id)
                            : handleFeatureBadge(achievement.id)
                        }
                        disabled={showcaseSaving}
                      >
                        {isDisplayed ? "Displayed" : "Display badge"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Badge Wall</p>
              <h2 className="profileSection__title">Every badge you have actually earned</h2>
            </div>
            <div className="profileSection__sideNote">{earnedAchievements.length} total</div>
          </div>

          {loading ? (
            <div className="profileBadgeWall profileBadgeWall--skeleton">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="profileBadgeChip profileBadgeChip--skeleton" />
              ))}
            </div>
          ) : earnedAchievements.length === 0 ? (
            <EmptySurface
              icon={Sparkles}
              title="Your badge wall is still empty"
              description="Real signals only: once you unlock achievements, their paired badges will show up here."
            />
          ) : (
            <div className="profileBadgeWall">
              {achievementStates
                .filter((achievement) => achievement.earned)
                .map((achievement) => {
                  const Icon = achievement.badge.Icon;
                  const isDisplayed = showcaseIds.includes(achievement.id);

                  return (
                    <article
                      key={achievement.id}
                      className={`profileBadgeChip ${
                        achievement.legendary ? "profileBadgeChip--legendary" : ""
                      } ${isDisplayed ? "profileBadgeChip--displayed" : ""}`}
                      style={{
                        "--badge-chip-bg": achievement.badge.bg,
                        "--badge-chip-border": achievement.badge.border,
                        "--badge-chip-color": achievement.badge.color,
                      }}
                    >
                      <span className="profileBadgeChip__iconWrap" aria-hidden="true">
                        <Icon className="profileBadgeChip__icon" />
                      </span>
                      <div className="profileBadgeChip__copy">
                        <strong className="profileBadgeChip__label">{achievement.badge.label}</strong>
                        <span className="profileBadgeChip__title">{achievement.title}</span>
                        <span className="profileBadgeChip__date">
                          {achievement.unlockedAt
                            ? `Unlocked ${formatCompactDate(achievement.unlockedAt)}`
                            : "Freshly earned"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`profileBadgeChip__toggle ${
                          isDisplayed ? "profileBadgeChip__toggle--active" : ""
                        }`}
                        onClick={() =>
                          isDisplayed
                            ? handleRemoveBadge(achievement.id)
                            : handleFeatureBadge(achievement.id)
                        }
                        disabled={showcaseSaving}
                      >
                        {isDisplayed ? "On profile" : "Feature"}
                      </button>
                    </article>
                  );
                })}
            </div>
          )}
        </section>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
