import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import welcomeAnimation from "../../../assets/welcome_lottie_animation.lottie?url";
import SearchableCombobox from "../../Shared/searchable_combobox";
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";
import {
  buildPhilippinesLocationLabel,
  coercePhilippinesLocation,
  getCitiesByRegion,
  PHILIPPINES_COUNTRY,
  PH_REGION_OPTIONS,
} from "../../../lib/phLocations";
import {
  FREELANCER_EXPERIENCE_OPTIONS,
  FREELANCER_SPECIALTY_OPTIONS,
  validateFreelancerIdentity,
  validateFreelancerLocation,
  validateFreelancerWork,
} from "../shared/freelancerProfileFields";
import {
  clearFreelancerWelcomeDestination,
  getFreelancerWelcomeDestination,
} from "../../../lib/customerOnboarding";
import {
  getProfileById,
  getSession,
  upsertProfile,
} from "../../../lib/supabase/auth";
import "./customer_welcome.css";
import "./freelancer_welcome.css";

const TOTAL_STEPS = 4;
const SPRING = { type: "spring", stiffness: 300, damping: 24 };

function TypewriterText({
  text,
  active = true,
  speed = 52,
  initialDelay = 80,
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(reduceMotion ? text : "");

  useEffect(() => {
    if (reduceMotion) {
      queueMicrotask(() => setDisplayText(text));
      return undefined;
    }

    if (!active) {
      queueMicrotask(() => setDisplayText(""));
      return undefined;
    }

    let timeoutId = null;
    let cancelled = false;
    let index = 0;

    queueMicrotask(() => setDisplayText(""));

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setDisplayText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(tick, speed);
      }
    };

    timeoutId = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active, initialDelay, reduceMotion, speed, text]);

  return (
    <span className={className}>
      {displayText}
      {!reduceMotion && active && displayText.length < text.length && (
        <Motion.span
          className="customerWelcome__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </Motion.span>
      )}
    </span>
  );
}

function WelcomePager({ page, total, onChange }) {
  return (
    <div className="customerWelcomePager">
      <button
        type="button"
        className="customerWelcomePager__arrow"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous step"
      >
        <ChevronLeft className="customerWelcomePager__arrowIcon" />
      </button>

      <div className="customerWelcomePager__dots">
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index === page;

          return (
            <Motion.button
              key={index}
              type="button"
              className={`customerWelcomePager__dot ${
                isActive ? "customerWelcomePager__dot--active" : ""
              }`}
              onClick={() => onChange(index)}
              animate={{
                width: isActive ? 30 : 10,
                height: 10,
                borderRadius: 999,
              }}
              transition={SPRING}
              aria-label={`Go to step ${index + 1}`}
              aria-pressed={isActive}
            >
              {isActive ? (
                <Motion.span
                  className="customerWelcomePager__dotRipple"
                  initial={{ scale: 0.8, opacity: 0.55 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              ) : null}
            </Motion.button>
          );
        })}
      </div>

      <button
        type="button"
        className="customerWelcomePager__arrow"
        onClick={() => onChange(page + 1)}
        disabled={page === total - 1}
        aria-label="Next step"
      >
        <ChevronRight className="customerWelcomePager__arrowIcon" />
      </button>
    </div>
  );
}

function Panel({ children, panelKey }) {
  const reduceMotion = useReducedMotion();

  return (
    <Motion.section
      key={panelKey}
      className="customerWelcome__panel"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(8px)" }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Motion.section>
  );
}

function getFriendlyErrorMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied|violates row-level security/i.test(message)) {
    return "We couldn't save your details. Please try again.";
  }

  if (/freelancer_|region|city|barangay/i.test(message)) {
    return "A few details could not be saved. Please try again.";
  }

  return fallback;
}

function deriveInitialValues(profile, user) {
  const metadata = user?.user_metadata || {};
  const firstName = String(
    profile?.first_name || metadata.first_name || metadata.given_name || ""
  ).trim();
  const lastName = String(
    profile?.last_name || metadata.last_name || metadata.family_name || ""
  ).trim();

  return {
    firstName,
    lastName,
    displayName: String(
      profile?.display_name ||
        metadata.preferred_username ||
        `${firstName} ${lastName}`.trim()
    ).trim(),
    bio: String(profile?.bio || "").trim(),
    headline: String(profile?.freelancer_headline || "").trim(),
    primaryCategory: String(profile?.freelancer_primary_category || "").trim(),
    specialties: Array.isArray(profile?.freelancer_specialties)
      ? profile.freelancer_specialties.filter(Boolean)
      : [],
    experienceLevel: String(profile?.freelancer_experience_level || "").trim(),
    portfolioUrl: String(profile?.freelancer_portfolio_url || "").trim(),
    ...coercePhilippinesLocation({
      region: String(profile?.region || metadata.region || "").trim(),
      city: String(profile?.city || "").trim(),
    }),
  };
}

export default function FreelancerWelcome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
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
  });

  const cityOptions = useMemo(
    () => getCitiesByRegion(formValues.region),
    [formValues.region]
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError("");

      try {
        const session = await getSession();

        if (!session?.user) {
          navigate("/sign-in", { replace: true });
          return;
        }

        const nextProfile = await getProfileById(session.user.id);
        if (!active) return;

        setSessionUser(session.user);
        setProfile(nextProfile);
        setFormValues(deriveInitialValues(nextProfile, session.user));
      } catch (error) {
        if (!active) return;
        setLoadError(
          getFriendlyErrorMessage(
            error,
            "We couldn't load this page. Please try again."
          )
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!saving || currentStep !== 4) return undefined;

    const timeoutId = window.setTimeout(() => {
      const destination = getFreelancerWelcomeDestination();
      clearFreelancerWelcomeDestination();
      navigate(destination, { replace: true });
    }, reduceMotion ? 260 : 850);

    return () => window.clearTimeout(timeoutId);
  }, [currentStep, navigate, reduceMotion, saving]);

  const updateField = (fieldName, nextValue) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: nextValue }));

    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }

    if (saveError) setSaveError("");
  };

  const updateRegion = (nextRegion) => {
    setFormValues((prev) => ({
      ...prev,
      region: nextRegion,
      city: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      region: "",
      city: "",
    }));
    if (saveError) setSaveError("");
  };

  const updateCity = (nextCity) => {
    setFormValues((prev) => ({
      ...prev,
      city: nextCity,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      city: "",
    }));
    if (saveError) setSaveError("");
  };

  const goToStep = (nextStep) => {
    if (saving || nextStep < 0 || nextStep >= TOTAL_STEPS) return;
    setSaveError("");
    setCurrentStep(nextStep);
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
        setFieldErrors((errors) => ({
          ...errors,
          specialties: "Choose up to five specialties only.",
        }));
        return prev;
      }

      return {
        ...prev,
        specialties: [...prev.specialties, specialty],
      };
    });

    if (saveError) setSaveError("");
  };

  const handleIdentityContinue = () => {
    const errors = validateFreelancerIdentity(formValues);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      displayName: "",
    }));
    setCurrentStep(2);
  };

  const handleWorkContinue = () => {
    const errors = validateFreelancerWork(formValues);

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      headline: "",
      primaryCategory: "",
      specialties: "",
      experienceLevel: "",
      portfolioUrl: "",
    }));
    setCurrentStep(3);
  };

  const handleFinish = async () => {
    const nextErrors = {
      ...validateFreelancerIdentity(formValues),
      ...validateFreelancerWork(formValues),
      ...validateFreelancerLocation(formValues),
    };

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);

      if (nextErrors.firstName || nextErrors.lastName || nextErrors.displayName) {
        setCurrentStep(1);
        return;
      }

      if (
        nextErrors.headline ||
        nextErrors.primaryCategory ||
        nextErrors.specialties ||
        nextErrors.experienceLevel ||
        nextErrors.portfolioUrl
      ) {
        setCurrentStep(2);
        return;
      }

      setCurrentStep(3);
      return;
    }

    if (!sessionUser?.id) {
      setSaveError("Your session expired. Please sign in again.");
      return;
    }

    try {
      setSaveError("");
      setFieldErrors({});
      setSaving(true);
      const normalizedLocation = coercePhilippinesLocation({
        region: String(formValues.region || "").trim(),
        city: String(formValues.city || "").trim(),
      });

      await upsertProfile({
        id: sessionUser.id,
        role: profile?.role || sessionUser.user_metadata?.role || "freelancer",
        first_name: String(formValues.firstName || "").trim(),
        last_name: String(formValues.lastName || "").trim(),
        display_name: String(formValues.displayName || "").trim(),
        bio: String(formValues.bio || "").trim() || null,
        country: PHILIPPINES_COUNTRY,
        region: normalizedLocation.region,
        city: normalizedLocation.city,
        address: buildPhilippinesLocationLabel(normalizedLocation),
        freelancer_headline: String(formValues.headline || "").trim(),
        freelancer_primary_category: String(formValues.primaryCategory || "").trim(),
        freelancer_specialties: formValues.specialties,
        freelancer_experience_level: String(formValues.experienceLevel || "").trim(),
        freelancer_portfolio_url:
          String(formValues.portfolioUrl || "").trim() || null,
        freelancer_onboarding_completed_at: new Date().toISOString(),
      });

      setCurrentStep(4);
    } catch (error) {
      setSaving(false);
      setSaveError(
        getFriendlyErrorMessage(
          error,
          "We couldn't finish your setup. Please try again."
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="customerWelcomePage freelancerWelcomePage customerWelcomePage--loading">
        <div className="customerWelcomePage__bg" aria-hidden="true" />
        <div className="customerWelcomeLoading">
          <span className="customerWelcomeLoading__eyebrow">Carvver</span>
          <h1 className="customerWelcomeLoading__title">
            Getting your welcome page ready
          </h1>
          <div className="customerWelcomeLoading__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="customerWelcomePage freelancerWelcomePage">
        <div className="customerWelcomePage__bg" aria-hidden="true" />
        <main className="customerWelcomeShell">
          <section className="customerWelcomeError">
            <span className="customerWelcomeLoading__eyebrow">Freelancer welcome</span>
            <h1 className="customerWelcomeError__title">
              We couldn&apos;t open this page
            </h1>
            <p className="customerWelcomeError__text">{loadError}</p>
            <Motion.button
              type="button"
              className="customerWelcomeButton customerWelcomeButton--primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={SPRING}
              onClick={() => window.location.reload()}
            >
              Try again
            </Motion.button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="customerWelcomePage freelancerWelcomePage">
      <div className="customerWelcomePage__bg" aria-hidden="true" />
      <div
        className="customerWelcomePage__orb customerWelcomePage__orb--violet"
        aria-hidden="true"
      />
      <div
        className="customerWelcomePage__orb customerWelcomePage__orb--gold"
        aria-hidden="true"
      />

      <main className="customerWelcomeShell">
        <div className="customerWelcomeCard">
          <header className="customerWelcomeCard__head">
            <span className="customerWelcomeCard__eyebrow">Carvver</span>
          </header>

          <AnimatePresence mode="wait">
            {currentStep === 0 ? (
              <Panel panelKey="intro">
                <div className="customerWelcomeIntro">
                  <div className="customerWelcomeIntro__copy">
                    <h1 className="customerWelcomeIntro__title">
                      <TypewriterText text="Welcome to Carvver" />
                    </h1>
                    <p className="customerWelcomeIntro__text">
                      Let&apos;s set up the details people will use to understand
                      your work.
                    </p>

                    <div className="customerWelcomeIntro__list">
                      <div className="customerWelcomeIntro__item">
                        <span className="customerWelcomeIntro__number">01</span>
                        <div>
                          <strong>Add your profile details</strong>
                          <span>
                            Use your real name for your account and choose the
                            display name people will remember.
                          </span>
                        </div>
                      </div>

                      <div className="customerWelcomeIntro__item">
                        <span className="customerWelcomeIntro__number">02</span>
                        <div>
                          <strong>Show what you offer</strong>
                          <span>
                            Add your headline, main category, specialties, and
                            experience level.
                          </span>
                        </div>
                      </div>

                      <div className="customerWelcomeIntro__item">
                        <span className="customerWelcomeIntro__number">03</span>
                        <div>
                          <strong>Set your location</strong>
                          <span>
                            Choose the region and city you want shown with your profile.
                          </span>
                        </div>
                      </div>
                    </div>

                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => setCurrentStep(1)}
                    >
                      Start setup
                    </Motion.button>
                  </div>

                  <div className="customerWelcomeIntro__visual">
                    <div className="customerWelcomeLottie">
                      <DotLottieReact
                        src={welcomeAnimation}
                        autoplay
                        loop
                        className="customerWelcomeLottie__canvas"
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            ) : null}

            {currentStep === 1 ? (
              <Panel panelKey="identity">
                <section className="customerWelcomeFormSection">
                  <div className="customerWelcomeForm__head">
                    <p className="customerWelcomeForm__eyebrow">Step 1</p>
                    <h2 className="customerWelcomeForm__title">
                      <TypewriterText text="Tell people who you are" />
                    </h2>
                    <p className="customerWelcomeForm__text">
                      Use your real name for your account, then choose the
                      display name you want clients to see.
                    </p>
                  </div>

                  <div className="customerWelcomeFieldGrid">
                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">First name</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.firstName
                            ? "customerWelcomeField__control--error"
                            : ""
                        }`}
                        type="text"
                        value={formValues.firstName}
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                        placeholder="Your first name"
                      />
                      {fieldErrors.firstName ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.firstName}
                        </span>
                      ) : null}
                    </label>

                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">Last name</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.lastName
                            ? "customerWelcomeField__control--error"
                            : ""
                        }`}
                        type="text"
                        value={formValues.lastName}
                        onChange={(event) =>
                          updateField("lastName", event.target.value)
                        }
                        placeholder="Your last name"
                      />
                      {fieldErrors.lastName ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.lastName}
                        </span>
                      ) : null}
                    </label>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">Display name</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.displayName
                            ? "customerWelcomeField__control--error"
                            : ""
                        }`}
                        type="text"
                        value={formValues.displayName}
                        onChange={(event) =>
                          updateField("displayName", event.target.value)
                        }
                        placeholder="How you want your name to appear"
                      />
                      {fieldErrors.displayName ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.displayName}
                        </span>
                      ) : null}
                    </label>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Short bio (optional)
                      </span>
                      <textarea
                        className="customerWelcomeField__control customerWelcomeField__control--textarea"
                        value={formValues.bio}
                        onChange={(event) => updateField("bio", event.target.value)}
                        placeholder="Share a short note about the kind of work you do."
                      />
                    </label>
                  </div>

                  <div className="customerWelcomeActions">
                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--ghost"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => goToStep(0)}
                    >
                      Back
                    </Motion.button>

                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={handleIdentityContinue}
                    >
                      Continue
                    </Motion.button>
                  </div>
                </section>
              </Panel>
            ) : null}

            {currentStep === 2 ? (
              <Panel panelKey="work">
                <section className="customerWelcomeFormSection freelancerWelcomeFormSection--wide">
                  <div className="customerWelcomeForm__head">
                    <p className="customerWelcomeForm__eyebrow">Step 2</p>
                    <h2 className="customerWelcomeForm__title">
                      <TypewriterText text="Show what you do best" />
                    </h2>
                    <p className="customerWelcomeForm__text">
                      Add the details that help people understand your work at a
                      glance.
                    </p>
                  </div>

                  <div className="customerWelcomeFieldGrid freelancerWelcomeWorkGrid">
                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Professional headline
                      </span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.headline
                            ? "customerWelcomeField__control--error"
                            : ""
                        }`}
                        type="text"
                        value={formValues.headline}
                        onChange={(event) =>
                          updateField("headline", event.target.value)
                        }
                        placeholder="Example: Brand designer for local businesses"
                      />
                      {fieldErrors.headline ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.headline}
                        </span>
                      ) : null}
                    </label>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Primary category
                      </span>
                      <SearchableCombobox
                        value={formValues.primaryCategory}
                        onSelect={(nextValue) =>
                          updateField("primaryCategory", nextValue)
                        }
                        options={ALL_SERVICE_CATEGORIES}
                        placeholder="Choose your main category"
                        ariaLabel="Choose your main category"
                        error={Boolean(fieldErrors.primaryCategory)}
                      />
                      {fieldErrors.primaryCategory ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.primaryCategory}
                        </span>
                      ) : null}
                    </label>

                    <div className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Experience level
                      </span>
                      <div className="freelancerWelcomeChoices">
                        {FREELANCER_EXPERIENCE_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`freelancerWelcomeChoice ${
                              formValues.experienceLevel === option
                                ? "freelancerWelcomeChoice--active"
                                : ""
                            }`}
                            onClick={() => updateField("experienceLevel", option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.experienceLevel ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.experienceLevel}
                        </span>
                      ) : null}
                    </div>

                    <div className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Specialties
                        <span className="freelancerWelcomeField__meta">
                          {formValues.specialties.length}/5
                        </span>
                      </span>
                      <div className="freelancerWelcomeSpecialties">
                        {FREELANCER_SPECIALTY_OPTIONS.map((specialty) => (
                          <button
                            key={specialty}
                            type="button"
                            className={`freelancerWelcomeSpecialty ${
                              formValues.specialties.includes(specialty)
                                ? "freelancerWelcomeSpecialty--active"
                                : ""
                            }`}
                            onClick={() => toggleSpecialty(specialty)}
                          >
                            {specialty}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.specialties ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.specialties}
                        </span>
                      ) : null}
                    </div>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">
                        Portfolio link (optional)
                      </span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.portfolioUrl
                            ? "customerWelcomeField__control--error"
                            : ""
                        }`}
                        type="url"
                        value={formValues.portfolioUrl}
                        onChange={(event) =>
                          updateField("portfolioUrl", event.target.value)
                        }
                        placeholder="https://your-portfolio-link.com"
                      />
                      {fieldErrors.portfolioUrl ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.portfolioUrl}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  <div className="customerWelcomeActions">
                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--ghost"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => goToStep(1)}
                    >
                      Back
                    </Motion.button>

                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={handleWorkContinue}
                    >
                      Continue
                    </Motion.button>
                  </div>
                </section>
              </Panel>
            ) : null}

            {currentStep === 3 ? (
              <Panel panelKey="location">
                <section className="customerWelcomeFormSection">
                  <div className="customerWelcomeForm__head">
                    <p className="customerWelcomeForm__eyebrow">Step 3</p>
                    <h2 className="customerWelcomeForm__title">
                      <TypewriterText text="Where are you based?" />
                    </h2>
                    <p className="customerWelcomeForm__text">
                      Choose the location you want shown with your profile.
                    </p>
                  </div>

                  <div className="customerWelcomeFieldGrid">
                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">Region</span>
                      <SearchableCombobox
                        value={formValues.region}
                        onSelect={updateRegion}
                        options={PH_REGION_OPTIONS}
                        placeholder="Choose your region"
                        ariaLabel="Choose your region"
                        error={Boolean(fieldErrors.region)}
                      />
                      {fieldErrors.region ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.region}
                        </span>
                      ) : null}
                    </label>

                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">City</span>
                      <SearchableCombobox
                        value={formValues.city}
                        onSelect={updateCity}
                        options={cityOptions}
                        placeholder={
                          formValues.region ? "Choose your city" : "Choose a region first"
                        }
                        ariaLabel="Choose your city"
                        error={Boolean(fieldErrors.city)}
                        disabled={!formValues.region}
                      />
                      {fieldErrors.city ? (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.city}
                        </span>
                      ) : null}
                    </label>

                  </div>

                  {saveError ? (
                    <div className="customerWelcomeInlineError">{saveError}</div>
                  ) : null}

                  <div className="customerWelcomeActions">
                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--ghost"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => goToStep(2)}
                      disabled={saving}
                    >
                      Back
                    </Motion.button>

                    <Motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={saving ? {} : { y: -2 }}
                      whileTap={saving ? {} : { scale: 0.985 }}
                      transition={SPRING}
                      onClick={handleFinish}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Finish setup"}
                    </Motion.button>
                  </div>
                </section>
              </Panel>
            ) : null}

            {currentStep === 4 ? (
              <Panel panelKey="complete">
                <div className="customerWelcomeComplete">
                  <CheckCircle2 className="customerWelcomeComplete__icon" />
                  <h2 className="customerWelcomeComplete__title">You&apos;re all set</h2>
                  <p className="customerWelcomeComplete__text">
                    Opening your dashboard...
                  </p>
                  <div className="customerWelcomeComplete__progress" aria-hidden="true" />
                </div>
              </Panel>
            ) : null}
          </AnimatePresence>

          {currentStep < TOTAL_STEPS ? (
            <WelcomePager
              page={currentStep}
              total={TOTAL_STEPS}
              onChange={goToStep}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
