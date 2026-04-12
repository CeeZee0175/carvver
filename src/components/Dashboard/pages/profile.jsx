import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  MessageCircle,
  Minus,
  PenTool,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableCombobox from "../../Shared/searchable_combobox";
import {
  buildPhilippinesLocationLabel,
  coercePhilippinesLocation,
  getBarangaysByRegionCity,
  getCitiesByRegion,
  PH_REGION_OPTIONS,
} from "../../../lib/phLocations";
import {
  SHOWCASE_SLOT_LIMIT,
} from "../shared/customerAchievements";
import {
  getCustomerDisplayName,
  getCustomerInitials,
  getCustomerRealName,
} from "../shared/customerIdentity";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  useCustomerProfileData,
} from "../hooks/useCustomerProfileData";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
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

function StatMiniCard({ label, value, hint, className = "" }) {
  return (
    <div className={`profileMiniStat ${className}`.trim()}>
      <span className="profileMiniStat__label">{label}</span>
      <strong className="profileMiniStat__value">{value}</strong>
      {hint ? <span className="profileMiniStat__hint">{hint}</span> : null}
    </div>
  );
}

function AchievementBadgeMedia({ achievement, className = "", alt = "" }) {
  const mediaSrc = achievement?.badge?.media || "";
  const badgeLabel = achievement?.badge?.label || achievement?.title || "Badge";

  if (mediaSrc) {
    return <img src={mediaSrc} alt={alt || badgeLabel} className={className} />;
  }

  const Icon = achievement?.badge?.Icon;
  return Icon ? <Icon className={className} aria-hidden={alt ? undefined : "true"} /> : null;
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
    showcasedBadges,
    showcaseIds,
    capabilities,
    saveProfile,
    saveBadgeShowcase,
  } = useCustomerProfileData();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showcaseSaving, setShowcaseSaving] = useState(false);
  const [badgePickerOpen, setBadgePickerOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    bio: "",
    region: "",
    city: "",
    barangay: "",
    age: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const cityOptions = useMemo(
    () => getCitiesByRegion(formValues.region),
    [formValues.region]
  );
  const barangayOptions = useMemo(
    () => getBarangaysByRegionCity(formValues.region, formValues.city),
    [formValues.city, formValues.region]
  );

  useEffect(() => {
    if (!profile || editing) return;
    const normalizedLocation = coercePhilippinesLocation({
      region: profile.region || "",
      city: profile.city || "",
      barangay: profile.barangay || "",
    });

    setFormValues({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      displayName: profile.display_name || "",
      bio: profile.bio || "",
      region: normalizedLocation.region,
      city: normalizedLocation.city,
      barangay: normalizedLocation.barangay,
      age: profile.age == null ? "" : String(profile.age),
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
  const realName = getCustomerRealName(profile);
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
  const averageRatingLabel =
    metrics.reviewCount > 0 ? metrics.averageRating.toFixed(1) : "--";
  const avatarSrc = removeAvatar
    ? ""
    : avatarPreview || String(profile?.avatar_url || "").trim();
  const locationLabel =
    buildPhilippinesLocationLabel({
      region: String(profile?.region || "").trim(),
      city: String(profile?.city || "").trim(),
      barangay: String(profile?.barangay || "").trim(),
    }) ||
    String(profile?.address || profile?.country || "").trim();
  const ageLabel = profile?.age == null ? "" : String(profile.age);
  const displayedBadges = useMemo(
    () => showcasedBadges.slice(0, SHOWCASE_SLOT_LIMIT),
    [showcasedBadges]
  );
  const previewAchievements = earnedAchievements.slice(0, 6);
  const hasSelectableBadges = earnedAchievements.length > 0;
  const canEditDisplayedBadges =
    editing &&
    capabilities.canPersistShowcase &&
    showcaseIds.length < SHOWCASE_SLOT_LIMIT &&
    earnedAchievements.some((achievement) => !showcaseIds.includes(achievement.id));

  const handleShowcaseUpdate = async (nextIds, successMessage) => {
    try {
      setShowcaseSaving(true);
      await saveBadgeShowcase(nextIds);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error(error.message || "We couldn't update your displayed badges.");
    } finally {
      setShowcaseSaving(false);
    }
  };

  const handleRemoveDisplayedBadge = async (achievementId) => {
    if (!editing || showcaseSaving) return;

    await handleShowcaseUpdate(
      showcaseIds.filter((id) => id !== achievementId),
      "Badge removed from your profile."
    );
  };

  const handleAddDisplayedBadge = async (achievementId) => {
    if (!editing || showcaseSaving || showcaseIds.includes(achievementId)) return;
    if (showcaseIds.length >= SHOWCASE_SLOT_LIMIT) {
      toast.error(`You can display up to ${SHOWCASE_SLOT_LIMIT} badges.`);
      return;
    }

    await handleShowcaseUpdate(
      [...showcaseIds, achievementId],
      "Badge added to your profile."
    );
    setBadgePickerOpen(false);
  };

  const resetEditor = () => {
    const normalizedLocation = coercePhilippinesLocation({
      region: profile?.region || "",
      city: profile?.city || "",
      barangay: profile?.barangay || "",
    });

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(false);
    setFormValues({
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      displayName: profile?.display_name || "",
      bio: profile?.bio || "",
      region: normalizedLocation.region,
      city: normalizedLocation.city,
      barangay: normalizedLocation.barangay,
      age: profile?.age == null ? "" : String(profile.age),
    });
  };

  const handleEditToggle = () => {
    if (editing) {
      resetEditor();
      setBadgePickerOpen(false);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await saveProfile({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        displayName: formValues.displayName,
        bio: formValues.bio,
        region: formValues.region,
        city: formValues.city,
        barangay: formValues.barangay,
        age: formValues.age,
        avatarFile,
        removeAvatar,
      });
      toast.success("Your customer profile is up to date.");
      setBadgePickerOpen(false);
      setEditing(false);
      resetEditor();
    } catch (error) {
      toast.error(error.message || "We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Profile" }]} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
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
              Keep your identity, progress, and earned trust signals together in one place.
            </p>
          </div>

          <div className="profileHero__stats profileHero__stats--open">
            <StatMiniCard
              className="profileMiniStat--open"
              label="Saved"
              value={loading ? "--" : metrics.savedCount}
            />
            <StatMiniCard
              className="profileMiniStat--open"
              label="Orders"
              value={loading ? "--" : metrics.totalOrders}
            />
            <StatMiniCard
              className="profileMiniStat--open"
              label="Reviews"
              value={loading ? "--" : metrics.reviewCount}
            />
            <StatMiniCard
              className="profileMiniStat--open"
              label="Earned"
              value={loading ? "--" : earnedBadgeCount}
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
                Some profile details couldn't be loaded
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
              <h2 className="profileIdentity__name">{displayName}</h2>
              <p className="profileIdentity__email">
                {profile?.email || "Signed-in customer"}
              </p>

              {displayedBadges.length > 0 || (editing && hasSelectableBadges) ? (
                <motion.div
                  className="profileIdentity__badges"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.42, delay: 0.08 }}
                >
                  {displayedBadges.map((achievement, index) => (
                    <motion.span
                      key={achievement.id}
                      className={`profileIdentity__badge ${
                        editing ? "profileIdentity__badge--editable" : ""
                      }`}
                      title={achievement.badge.label}
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.34, delay: 0.1 + index * 0.04 }}
                      whileHover={{ y: -3, scale: 1.04 }}
                    >
                      <AchievementBadgeMedia
                        achievement={achievement}
                        className="profileIdentity__badgeImage"
                        alt={achievement.badge.label}
                      />
                      {editing && capabilities.canPersistShowcase ? (
                        <button
                          type="button"
                          className="profileIdentity__badgeControl"
                          onClick={() => handleRemoveDisplayedBadge(achievement.id)}
                          disabled={showcaseSaving}
                          aria-label={`Remove ${achievement.badge.label} from your profile`}
                        >
                          <Minus className="profileIdentity__badgeControlIcon" />
                        </button>
                      ) : null}
                    </motion.span>
                  ))}

                  {canEditDisplayedBadges ? (
                    <motion.button
                      type="button"
                      className="profileIdentity__badgeAdder"
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{
                        duration: 0.34,
                        delay: 0.1 + displayedBadges.length * 0.04,
                      }}
                      whileHover={{ y: -3, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setBadgePickerOpen(true)}
                      disabled={showcaseSaving}
                      aria-label="Add a badge to your profile"
                    >
                      <Plus className="profileIdentity__badgeAdderIcon" />
                    </motion.button>
                  ) : null}
                </motion.div>
              ) : null}

              <div className="profileIdentity__facts">
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Real name</span>
                  <span className="profileIdentity__factValue">{realName}</span>
                </div>
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Location</span>
                  <span className="profileIdentity__factValue">
                    {locationLabel || "No location added yet"}
                  </span>
                </div>
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Age</span>
                  <span className="profileIdentity__factValue">
                    {ageLabel || "No age added yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form
            className={`profileEditor ${editing ? "profileEditor--editing" : "profileEditor--viewing"}`}
            onSubmit={handleSaveProfile}
          >
            <div className="profileEditor__head">
              <div>
                <h3 className="profileEditor__title">Profile details</h3>
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
                <span className="profileField__label">First name</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="text"
                    value={formValues.firstName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Your first name"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.firstName || "No first name added yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Last name</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="text"
                    value={formValues.lastName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Your last name"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.lastName || "No last name added yet"}
                  </div>
                )}
              </label>

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
                  <div className="profileField__display">
                    {formValues.displayName || "No display name yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Region</span>
                {editing ? (
                  <SearchableCombobox
                    value={formValues.region}
                    onSelect={(nextValue) =>
                      setFormValues((prev) => ({
                        ...prev,
                        region: nextValue,
                        city: "",
                        barangay: "",
                      }))
                    }
                    options={PH_REGION_OPTIONS}
                    placeholder="Choose your region"
                    ariaLabel="Choose your region"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.region || "No region added yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">City</span>
                {editing ? (
                  <SearchableCombobox
                    value={formValues.city}
                    onSelect={(nextValue) =>
                      setFormValues((prev) => ({
                        ...prev,
                        city: nextValue,
                        barangay: "",
                      }))
                    }
                    options={cityOptions}
                    placeholder={
                      formValues.region ? "Choose your city" : "Choose a region first"
                    }
                    ariaLabel="Choose your city"
                    disabled={!formValues.region}
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.city || "No city added yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Barangay / area</span>
                {editing ? (
                  <SearchableCombobox
                    value={formValues.barangay}
                    onSelect={(nextValue) =>
                      setFormValues((prev) => ({
                        ...prev,
                        barangay: nextValue,
                      }))
                    }
                    options={barangayOptions}
                    placeholder={
                      formValues.city
                        ? "Choose your barangay or type your area"
                        : "Choose a city first"
                    }
                    ariaLabel="Choose your barangay or area"
                    disabled={!formValues.city}
                    allowCustomValue
                    customValueLabel="Use"
                    noResultsText="No barangays found. Type your area and press Enter."
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.barangay || "No barangay or area added yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Age</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="number"
                    min="1"
                    step="1"
                    value={formValues.age}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        age: event.target.value,
                      }))
                    }
                    placeholder="Your age"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.age || "No age added yet"}
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
                  <div className="profileField__display profileField__display--textarea">
                    {formValues.bio || "No bio added yet"}
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
          </motion.button>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Account progress</h2>
              <p className="profileSection__sub">
                See which customer details are already complete and what still strengthens the page.
              </p>
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
              <h2 className="profileSection__title">Freelancer reviews</h2>
              <p className="profileSection__sub">
                Read the feedback freelancers left after working with you.
              </p>
            </div>
            {metrics.reviewCount > 0 && (
              <div className="profileReviewSummary">
                <span className="profileReviewSummary__score">{averageRatingLabel}</span>
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
            <EmptySurface icon={MessageCircle} title="No freelancer reviews yet" />
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
              <h2 className="profileSection__title">Achievements</h2>
              <p className="profileSection__sub">
                Review the badges you earned and jump into the full catalog when needed.
              </p>
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
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="profileAchievement profileAchievement--skeleton" />
              ))}
            </div>
          ) : previewAchievements.length === 0 ? (
            <EmptySurface icon={Trophy} title="No achievements earned yet" />
          ) : (
            <div className="profileAchievementGrid">
              {previewAchievements.map((achievement, index) => (
                <motion.article
                  key={achievement.id}
                  className={`profileAchievement ${
                    achievement.legendary ? "profileAchievement--legendary" : ""
                  }`}
                  style={{
                    "--achievement-badge-bg": achievement.badge.bg,
                    "--achievement-badge-border": achievement.badge.border,
                    "--achievement-badge-color": achievement.badge.color,
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.42, delay: index * 0.04 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  <div className="profileAchievement__top">
                    <div className="profileAchievement__headline">
                      <span className="profileAchievement__badgeMediaWrap" aria-hidden="true">
                        <AchievementBadgeMedia
                          achievement={achievement}
                          className="profileAchievement__badgeMedia"
                        />
                      </span>
                      <div className="profileAchievement__copy">
                        <span className="profileAchievement__category">
                          {achievement.category}
                        </span>
                        <h3 className="profileAchievement__title">{achievement.title}</h3>
                      </div>
                    </div>
                    <span className="profileAchievement__tier">
                      {achievement.legendary ? "Legendary" : "Earned"}
                    </span>
                  </div>

                  <p className="profileAchievement__desc">{achievement.description}</p>

                  <div className="profileAchievement__meta">
                    <span className="profileAchievement__date">
                      {achievement.unlockedAt
                        ? `Unlocked ${formatCompactDate(achievement.unlockedAt)}`
                        : "Earned through your activity"}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      <AnimatePresence>
        {badgePickerOpen && editing ? (
          <motion.div
            className="profileBadgePicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBadgePickerOpen(false)}
          >
            <motion.div
              className="profileBadgePicker__dialog"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-badge-picker-title"
            >
              <div className="profileBadgePicker__head">
                <h2 id="profile-badge-picker-title" className="profileBadgePicker__title">
                  Display badges
                </h2>
                <button
                  type="button"
                  className="profileBadgePicker__close"
                  onClick={() => setBadgePickerOpen(false)}
                  aria-label="Close badge picker"
                >
                  <X className="profileBadgePicker__closeIcon" />
                </button>
              </div>

              <div className="profileBadgePicker__grid">
                {earnedAchievements.map((achievement, index) => {
                  const isDisplayed = showcaseIds.includes(achievement.id);

                  return (
                    <motion.button
                      key={achievement.id}
                      type="button"
                      className={`profileBadgePicker__option ${
                        isDisplayed ? "profileBadgePicker__option--selected" : ""
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: index * 0.012 }}
                      onClick={() => handleAddDisplayedBadge(achievement.id)}
                      disabled={isDisplayed || showcaseSaving}
                      aria-label={
                        isDisplayed
                          ? `${achievement.badge.label} is already displayed`
                          : `Display ${achievement.badge.label}`
                      }
                      title={achievement.badge.label}
                    >
                      <AchievementBadgeMedia
                        achievement={achievement}
                        className="profileBadgePicker__image"
                        alt={achievement.badge.label}
                      />
                      {isDisplayed ? (
                        <span className="profileBadgePicker__selectedMark" aria-hidden="true">
                          <Check className="profileBadgePicker__selectedIcon" />
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CustomerDashboardFrame>
  );
}
