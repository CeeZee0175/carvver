import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion} from "framer-motion";
import {
  MessageCircle,
  Settings,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchableCombobox from "../../Shared/searchable_combobox";
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";
import {
  coercePhilippinesLocation,
  getBarangaysByRegionCity,
  getCitiesByRegion,
  PH_REGION_OPTIONS,
} from "../../../lib/phLocations";
import {
  DashboardBreadcrumbs,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  FREELANCER_EXPERIENCE_OPTIONS,
  FREELANCER_SPECIALTY_OPTIONS,
} from "../shared/freelancerProfileFields";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
} from "../hooks/useCustomerProfileData";
import { useFreelancerProfileData } from "../hooks/useFreelancerProfileData";
import "./profile.css";
import "./freelancer_pages.css";

export default function FreelancerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const {
    loading,
    profile,
    warning,
    displayName,
    realName,
    initials,
    locationLabel,
    tasks,
    completion,
    saveProfile,
  } = useFreelancerProfileData();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    bio: "",
    headline: "",
    primaryCategory: "",
    specialties: [],
    experienceLevel: "",
    portfolioUrl: "",
    region: "",
    city: "",
    barangay: "",
  });

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
      headline: profile.freelancer_headline || "",
      primaryCategory: profile.freelancer_primary_category || "",
      specialties: Array.isArray(profile.freelancer_specialties)
        ? profile.freelancer_specialties.filter(Boolean)
        : [],
      experienceLevel: profile.freelancer_experience_level || "",
      portfolioUrl: profile.freelancer_portfolio_url || "",
      region: normalizedLocation.region,
      city: normalizedLocation.city,
      barangay: normalizedLocation.barangay,
    });
  }, [editing, profile]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const cityOptions = useMemo(
    () => getCitiesByRegion(formValues.region),
    [formValues.region]
  );
  const barangayOptions = useMemo(
    () => getBarangaysByRegionCity(formValues.region, formValues.city),
    [formValues.city, formValues.region]
  );

  const avatarSrc = removeAvatar
    ? ""
    : avatarPreview || String(profile?.avatar_url || "").trim();
  const headline = String(profile?.freelancer_headline || "").trim();
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];
  const showProfileProgress = !loading && completion.completed < completion.total;

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
      headline: profile?.freelancer_headline || "",
      primaryCategory: profile?.freelancer_primary_category || "",
      specialties: Array.isArray(profile?.freelancer_specialties)
        ? profile.freelancer_specialties.filter(Boolean)
        : [],
      experienceLevel: profile?.freelancer_experience_level || "",
      portfolioUrl: profile?.freelancer_portfolio_url || "",
      region: normalizedLocation.region,
      city: normalizedLocation.city,
      barangay: normalizedLocation.barangay,
    });
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

  const toggleSpecialty = (specialty) => {
    setFormValues((prev) => {
      if (prev.specialties.includes(specialty)) {
        return {
          ...prev,
          specialties: prev.specialties.filter((item) => item !== specialty),
        };
      }

      if (prev.specialties.length >= 5) {
        toast.error("Choose up to five specialties only.");
        return prev;
      }

      return {
        ...prev,
        specialties: [...prev.specialties, specialty],
      };
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await saveProfile({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        displayName: formValues.displayName,
        bio: formValues.bio,
        headline: formValues.headline,
        primaryCategory: formValues.primaryCategory,
        specialties: formValues.specialties,
        experienceLevel: formValues.experienceLevel,
        portfolioUrl: formValues.portfolioUrl,
        region: formValues.region,
        city: formValues.city,
        barangay: formValues.barangay,
        avatarFile,
        removeAvatar,
      });

      toast.success("Your freelancer profile is up to date.");
      setEditing(false);
      resetEditor();
    } catch (error) {
      toast.error(error.message || "We couldn't save your freelancer profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Profile" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Profile" />
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </Motion.svg>
            </div>
            <p className="profileHero__sub">
              Keep your name, work, and location in one place so people can understand
              your profile without guessing.
            </p>
          </div>
        </section>
      </Reveal>

      {warning ? (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">Some profile details couldn't be loaded</h2>
              <p className="profileNotice__desc">{warning}</p>
            </div>
          </section>
        </Reveal>
      ) : null}

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

              {editing ? (
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
              ) : null}
            </div>

            <div className="profileIdentity__copy">
              <h2 className="profileIdentity__name">{displayName}</h2>
              <p className="profileIdentity__email">
                {profile?.email || "Signed-in freelancer"}
              </p>
              <div className="profileIdentity__facts">
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Real name</span>
                  <span className="profileIdentity__factValue">{realName}</span>
                </div>
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Headline</span>
                  <span className="profileIdentity__factValue">
                    {headline || "No headline added yet"}
                  </span>
                </div>
                <div className="profileIdentity__fact">
                  <span className="profileIdentity__factLabel">Location</span>
                  <span className="profileIdentity__factValue">{locationLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <form className="profileEditor" onSubmit={handleSave}>
            <div className="profileEditor__head">
              <div>
                <h3 className="profileEditor__title">Keep your work easy to read</h3>
              </div>

              <div className="profileEditor__actions">
                {!editing ? (
                  <Motion.button
                    type="button"
                    className="profileEditor__btn profileEditor__btn--primary"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={() => setEditing(true)}
                  >
                    <UserRound className="profileEditor__btnIcon" />
                    <span>Edit profile</span>
                  </Motion.button>
                ) : (
                  <>
                    <Motion.button
                      type="button"
                      className="profileEditor__btn profileEditor__btn--ghost"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      onClick={() => {
                        resetEditor();
                        setEditing(false);
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Motion.button>
                    <Motion.button
                      type="submit"
                      className="profileEditor__btn profileEditor__btn--primary"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={saving}
                    >
                      <span>{saving ? "Saving..." : "Save changes"}</span>
                    </Motion.button>
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

              <label className="profileField profileField--wide">
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
                    placeholder="How you want your name to appear"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.displayName || "No display name added yet"}
                  </div>
                )}
              </label>

              <label className="profileField profileField--wide">
                <span className="profileField__label">Professional headline</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="text"
                    value={formValues.headline}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        headline: event.target.value,
                      }))
                    }
                    placeholder="Example: Brand designer for local businesses"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.headline || "No headline added yet"}
                  </div>
                )}
              </label>

              <label className="profileField">
                <span className="profileField__label">Primary category</span>
                {editing ? (
                  <SearchableCombobox
                    value={formValues.primaryCategory}
                    onSelect={(nextValue) =>
                      setFormValues((prev) => ({
                        ...prev,
                        primaryCategory: nextValue,
                      }))
                    }
                    options={ALL_SERVICE_CATEGORIES}
                    placeholder="Choose your main category"
                    ariaLabel="Choose your main category"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.primaryCategory || "No main category added yet"}
                  </div>
                )}
              </label>

              <div className="profileField">
                <span className="profileField__label">Experience level</span>
                {editing ? (
                  <div className="freelancerChoiceGrid">
                    {FREELANCER_EXPERIENCE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`freelancerChoice ${
                          formValues.experienceLevel === option
                            ? "freelancerChoice--active"
                            : ""
                        }`}
                        onClick={() =>
                          setFormValues((prev) => ({
                            ...prev,
                            experienceLevel: option,
                          }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="profileField__display">
                    {formValues.experienceLevel || "No experience level added yet"}
                  </div>
                )}
              </div>

              <div className="profileField profileField--wide">
                <span className="profileField__label">Specialties</span>
                {editing ? (
                  <div className="freelancerSpecialtyGrid">
                    {FREELANCER_SPECIALTY_OPTIONS.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        className={`freelancerSpecialty ${
                          formValues.specialties.includes(specialty)
                            ? "freelancerSpecialty--active"
                            : ""
                        }`}
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                ) : specialties.length > 0 ? (
                  <div className="profileField__display">
                    {specialties.join(", ")}
                  </div>
                ) : (
                  <div className="profileField__display">No specialties added yet</div>
                )}
              </div>

              <label className="profileField profileField--wide">
                <span className="profileField__label">Portfolio link</span>
                {editing ? (
                  <input
                    className="profileField__control"
                    type="url"
                    value={formValues.portfolioUrl}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        portfolioUrl: event.target.value,
                      }))
                    }
                    placeholder="https://your-portfolio-link.com"
                  />
                ) : (
                  <div className="profileField__display">
                    {formValues.portfolioUrl || "No portfolio link added yet"}
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

              <label className="profileField profileField--wide">
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
                    placeholder="Share a short note about how you work or what people can expect."
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

      <Reveal delay={0.14}>
        <section className="profileNavBand">
          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer")}
          >
            <UserRound className="profileNavBand__icon" />
            <span className="profileNavBand__label">Dashboard</span>
          </Motion.button>

          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/messages")}
          >
            <MessageCircle className="profileNavBand__icon" />
            <span className="profileNavBand__label">Messages</span>
          </Motion.button>

          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/settings")}
          >
            <Settings className="profileNavBand__icon" />
            <span className="profileNavBand__label">Settings</span>
          </Motion.button>
        </section>
      </Reveal>

      {showProfileProgress ? (
        <Reveal delay={0.18}>
          <section className="profileSection">
            <div className="profileSection__head">
              <div>
                <h2 className="profileSection__title">Profile progress</h2>
                <p className="profileSection__sub">
                  Check which freelancer details are already in place and what still strengthens the page.
                </p>
              </div>
              <div className="profileProgress__meta">
                <strong>{completion.completed}</strong>
                <span>/ {completion.total} complete</span>
              </div>
            </div>

            <div className="profileProgress">
              <div className="profileProgress__bar">
                <span
                  className="profileProgress__barFill"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>

              <div className="profileProgress__grid">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`profileTask ${task.complete ? "profileTask--complete" : ""}`}
                  >
                    <span className="profileTask__status" aria-hidden="true" />
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
      ) : null}
    </FreelancerDashboardFrame>
  );
}
