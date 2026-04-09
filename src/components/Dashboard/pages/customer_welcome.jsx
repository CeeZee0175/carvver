import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import welcomeAnimation from "../../../assets/welcome_lottie_animation.lottie?url";
import { filterCountries } from "../../../lib/countries";
import {
  clearCustomerWelcomeDestination,
  getCustomerWelcomeDestination,
} from "../../../lib/customerOnboarding";
import {
  getProfileById,
  getSession,
  upsertProfile,
} from "../../../lib/supabase/auth";
import "./customer_welcome.css";

const TOTAL_STEPS = 3;
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
      setDisplayText(text);
      return;
    }

    if (!active) {
      setDisplayText("");
      return;
    }

    let timeoutId = null;
    let cancelled = false;
    let index = 0;

    setDisplayText("");

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
        <motion.span
          className="customerWelcome__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
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
            <motion.button
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
              {isActive && (
                <AnimatePresence>
                  <motion.span
                    key="ripple"
                    className="customerWelcomePager__dotRipple"
                    initial={{ scale: 0.8, opacity: 0.55 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </AnimatePresence>
              )}
            </motion.button>
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

function getFriendlyErrorMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied|violates row-level security/i.test(message)) {
    return "We couldn't save your welcome details just yet.";
  }

  if (/customer_onboarding_completed_at/i.test(message)) {
    return "Your welcome setup is not ready to save yet.";
  }

  return fallback;
}

function deriveInitialValues(profile, user) {
  const metadata = user?.user_metadata || {};
  const firstName =
    String(profile?.first_name || metadata.first_name || metadata.given_name || "").trim();
  const lastName =
    String(profile?.last_name || metadata.last_name || metadata.family_name || "").trim();
  const fallbackDisplayName = String(
    profile?.display_name || metadata.preferred_username || `${firstName} ${lastName}`.trim()
  ).trim();

  return {
    firstName,
    lastName,
    displayName: fallbackDisplayName,
    bio: String(profile?.bio || "").trim(),
    country: String(profile?.country || metadata.country || "").trim(),
    address: String(profile?.address || "").trim(),
  };
}

function validateIdentity(values) {
  const errors = {};

  if (!String(values.firstName || "").trim()) {
    errors.firstName = "Please add your first name.";
  }

  if (!String(values.lastName || "").trim()) {
    errors.lastName = "Please add your last name.";
  }

  if (!String(values.displayName || "").trim()) {
    errors.displayName = "Please choose a display name.";
  }

  return errors;
}

function validateLocation(values) {
  const errors = {};

  if (!String(values.country || "").trim()) {
    errors.country = "Please choose your country.";
  }

  if (!String(values.address || "").trim()) {
    errors.address = "Please add your address or area.";
  }

  return errors;
}

function SearchableCountryCombobox({
  value,
  onSelect,
  error,
}) {
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const filteredCountries = useMemo(() => filterCountries(query), [query]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setQuery(value || "");
    }
  }, [isOpen, value]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery(value || "");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const nextIndex = filteredCountries.length === 0 ? -1 : 0;
    setHighlightedIndex(nextIndex);
  }, [filteredCountries.length, isOpen, query]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) return;

    const activeOption = listRef.current.querySelector(
      `[data-country-index="${highlightedIndex}"]`
    );

    if (activeOption) {
      activeOption.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const selectCountry = (country) => {
    onSelect(country);
    setQuery(country);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        Math.min(current + 1, filteredCountries.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();

      if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
        selectCountry(filteredCountries[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(value || "");
    }
  };

  return (
    <div className="customerWelcomeCountry" ref={wrapperRef}>
      <div
        className={`customerWelcomeCountry__controlWrap ${
          error ? "customerWelcomeCountry__controlWrap--error" : ""
        }`}
      >
        <input
          className="customerWelcomeCountry__control"
          type="text"
          value={isOpen ? query : value || query}
          onFocus={() => {
            setQuery(value || "");
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Choose your country"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="customer-country-options"
        />
        <button
          type="button"
          className="customerWelcomeCountry__toggle"
          onClick={() => {
            setQuery(value || "");
            setIsOpen((current) => !current);
          }}
          aria-label={isOpen ? "Close country list" : "Open country list"}
        >
          <ChevronDown
            className={`customerWelcomeCountry__toggleIcon ${
              isOpen ? "customerWelcomeCountry__toggleIcon--open" : ""
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="customerWelcomeCountry__menu"
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 4, filter: "blur(6px)" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="customerWelcomeCountry__searchLabel">
              Type to search
            </div>
            <div
              id="customer-country-options"
              className="customerWelcomeCountry__options"
              ref={listRef}
              role="listbox"
            >
              {filteredCountries.length === 0 ? (
                <div className="customerWelcomeCountry__empty">No countries found</div>
              ) : (
                filteredCountries.map((country, index) => (
                  <button
                    key={country}
                    type="button"
                    className={`customerWelcomeCountry__option ${
                      index === highlightedIndex
                        ? "customerWelcomeCountry__option--highlighted"
                        : ""
                    } ${country === value ? "customerWelcomeCountry__option--selected" : ""}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectCountry(country);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    data-country-index={index}
                    role="option"
                    aria-selected={country === value}
                  >
                    {country}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({ children, panelKey }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      key={panelKey}
      className="customerWelcome__panel"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(8px)" }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export default function CustomerWelcome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    bio: "",
    country: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

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
            "We couldn't load your welcome details right now."
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
    if (!saving || currentStep !== 3) return undefined;

    const destination = getCustomerWelcomeDestination();
    const timeoutId = window.setTimeout(() => {
      clearCustomerWelcomeDestination();
      navigate(destination, { replace: true });
    }, reduceMotion ? 260 : 850);

    return () => window.clearTimeout(timeoutId);
  }, [currentStep, navigate, reduceMotion, saving]);

  const handleChange = (fieldName, nextValue) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: nextValue,
    }));

    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }

    if (saveError) setSaveError("");
  };

  const goToStep = (nextStep) => {
    if (saving || nextStep < 0 || nextStep >= TOTAL_STEPS) return;
    setSaveError("");
    setCurrentStep(nextStep);
  };

  const handleIdentityContinue = () => {
    const identityErrors = validateIdentity(formValues);

    if (Object.keys(identityErrors).length > 0) {
      setFieldErrors(identityErrors);
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

  const handleFinish = async () => {
    const identityErrors = validateIdentity(formValues);
    const locationErrors = validateLocation(formValues);
    const nextErrors = { ...identityErrors, ...locationErrors };

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setCurrentStep(Object.keys(identityErrors).length > 0 ? 1 : 2);
      return;
    }

    if (!sessionUser?.id) {
      setSaveError("We couldn't finish setup because your session is missing.");
      return;
    }

    try {
      setSaveError("");
      setFieldErrors({});
      setSaving(true);

      await upsertProfile({
        id: sessionUser.id,
        role: profile?.role || sessionUser.user_metadata?.role || "customer",
        first_name: String(formValues.firstName || "").trim(),
        last_name: String(formValues.lastName || "").trim(),
        display_name: String(formValues.displayName || "").trim(),
        bio: String(formValues.bio || "").trim() || null,
        country: String(formValues.country || "").trim(),
        address: String(formValues.address || "").trim(),
        customer_onboarding_completed_at: new Date().toISOString(),
      });

      setCurrentStep(3);
    } catch (error) {
      setSaving(false);
      setSaveError(
        getFriendlyErrorMessage(
          error,
          "We couldn't finish your welcome setup just yet."
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="customerWelcomePage customerWelcomePage--loading">
        <div className="customerWelcomePage__bg" aria-hidden="true" />
        <div className="customerWelcomeLoading">
          <span className="customerWelcomeLoading__eyebrow">Carvver</span>
          <h1 className="customerWelcomeLoading__title">Preparing your welcome page</h1>
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
      <div className="customerWelcomePage">
        <div className="customerWelcomePage__bg" aria-hidden="true" />
        <main className="customerWelcomeShell">
          <section className="customerWelcomeError">
            <span className="customerWelcomeLoading__eyebrow">Customer welcome</span>
            <h1 className="customerWelcomeError__title">
              This welcome page is unavailable right now
            </h1>
            <p className="customerWelcomeError__text">{loadError}</p>
            <motion.button
              type="button"
              className="customerWelcomeButton customerWelcomeButton--primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={SPRING}
              onClick={() => window.location.reload()}
            >
              Try again
            </motion.button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="customerWelcomePage">
      <div className="customerWelcomePage__bg" aria-hidden="true" />
      <div className="customerWelcomePage__orb customerWelcomePage__orb--violet" aria-hidden="true" />
      <div className="customerWelcomePage__orb customerWelcomePage__orb--gold" aria-hidden="true" />

      <main className="customerWelcomeShell">
        <div className="customerWelcomeCard">
          <header className="customerWelcomeCard__head">
            <span className="customerWelcomeCard__eyebrow">Carvver</span>
          </header>

          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <Panel panelKey="intro">
                <div className="customerWelcomeIntro">
                  <div className="customerWelcomeIntro__copy">
                    <h1 className="customerWelcomeIntro__title">
                      <TypewriterText text="Welcome to Carvver" />
                    </h1>
                    <p className="customerWelcomeIntro__text">
                      Before you start browsing, let&apos;s set up a few details for your customer profile.
                    </p>

                    <div className="customerWelcomeIntro__list">
                      <div className="customerWelcomeIntro__item">
                        <span className="customerWelcomeIntro__number">01</span>
                        <div>
                          <strong>Set your customer identity</strong>
                          <span>Choose the name and display name you want to use here.</span>
                        </div>
                      </div>
                      <div className="customerWelcomeIntro__item">
                        <span className="customerWelcomeIntro__number">02</span>
                        <div>
                          <strong>Add your location</strong>
                          <span>Pick your country and enter the area you want shown on your profile.</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => setCurrentStep(1)}
                    >
                      Start
                    </motion.button>
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
            )}

            {currentStep === 1 && (
              <Panel panelKey="identity">
                <section className="customerWelcomeFormSection">
                  <div className="customerWelcomeForm__head">
                    <p className="customerWelcomeForm__eyebrow">Step 2</p>
                    <h2 className="customerWelcomeForm__title">
                      <TypewriterText text="Tell us who you are" />
                    </h2>
                    <p className="customerWelcomeForm__text">
                      Use your real name for the account, then choose the display name you want people to see on Carvver.
                    </p>
                  </div>

                  <div className="customerWelcomeFieldGrid">
                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">First name</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.firstName ? "customerWelcomeField__control--error" : ""
                        }`}
                        type="text"
                        value={formValues.firstName}
                        onChange={(event) => handleChange("firstName", event.target.value)}
                        placeholder="Your first name"
                      />
                      {fieldErrors.firstName && (
                        <span className="customerWelcomeField__error">{fieldErrors.firstName}</span>
                      )}
                    </label>

                    <label className="customerWelcomeField">
                      <span className="customerWelcomeField__label">Last name</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.lastName ? "customerWelcomeField__control--error" : ""
                        }`}
                        type="text"
                        value={formValues.lastName}
                        onChange={(event) => handleChange("lastName", event.target.value)}
                        placeholder="Your last name"
                      />
                      {fieldErrors.lastName && (
                        <span className="customerWelcomeField__error">{fieldErrors.lastName}</span>
                      )}
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
                        onChange={(event) => handleChange("displayName", event.target.value)}
                        placeholder="How you want to appear on Carvver"
                      />
                      {fieldErrors.displayName && (
                        <span className="customerWelcomeField__error">
                          {fieldErrors.displayName}
                        </span>
                      )}
                    </label>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">Short bio (optional)</span>
                      <textarea
                        className="customerWelcomeField__control customerWelcomeField__control--textarea"
                        value={formValues.bio}
                        onChange={(event) => handleChange("bio", event.target.value)}
                        placeholder="A short note about how you like to work with freelancers."
                      />
                    </label>
                  </div>

                  <div className="customerWelcomeActions">
                    <motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--ghost"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => goToStep(0)}
                    >
                      Back
                    </motion.button>

                    <motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={handleIdentityContinue}
                    >
                      Continue
                    </motion.button>
                  </div>
                </section>
              </Panel>
            )}

            {currentStep === 2 && (
              <Panel panelKey="location">
                <section className="customerWelcomeFormSection">
                  <div className="customerWelcomeForm__head">
                    <p className="customerWelcomeForm__eyebrow">Step 3</p>
                    <h2 className="customerWelcomeForm__title">
                      <TypewriterText text="Where are you based?" />
                    </h2>
                    <p className="customerWelcomeForm__text">
                      Pick your country and enter the location you want shown on your customer profile.
                    </p>
                  </div>

                  <div className="customerWelcomeFieldGrid">
                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">Country</span>
                      <SearchableCountryCombobox
                        value={formValues.country}
                        onSelect={(country) => handleChange("country", country)}
                        error={fieldErrors.country}
                      />
                      {fieldErrors.country && (
                        <span className="customerWelcomeField__error">{fieldErrors.country}</span>
                      )}
                    </label>

                    <label className="customerWelcomeField customerWelcomeField--wide">
                      <span className="customerWelcomeField__label">Address / area</span>
                      <input
                        className={`customerWelcomeField__control ${
                          fieldErrors.address ? "customerWelcomeField__control--error" : ""
                        }`}
                        type="text"
                        value={formValues.address}
                        onChange={(event) => handleChange("address", event.target.value)}
                        placeholder="City, barangay, district, or general area"
                      />
                      {fieldErrors.address && (
                        <span className="customerWelcomeField__error">{fieldErrors.address}</span>
                      )}
                    </label>
                  </div>

                  {saveError && (
                    <div className="customerWelcomeInlineError">{saveError}</div>
                  )}

                  <div className="customerWelcomeActions">
                    <motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--ghost"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={SPRING}
                      onClick={() => goToStep(1)}
                      disabled={saving}
                    >
                      Back
                    </motion.button>

                    <motion.button
                      type="button"
                      className="customerWelcomeButton customerWelcomeButton--primary"
                      whileHover={saving ? {} : { y: -2 }}
                      whileTap={saving ? {} : { scale: 0.985 }}
                      transition={SPRING}
                      onClick={handleFinish}
                      disabled={saving}
                    >
                      {saving ? "Finishing..." : "Finish"}
                    </motion.button>
                  </div>
                </section>
              </Panel>
            )}

            {currentStep === 3 && (
              <Panel panelKey="complete">
                <div className="customerWelcomeComplete">
                  <CheckCircle2 className="customerWelcomeComplete__icon" />
                  <h2 className="customerWelcomeComplete__title">
                    You&apos;re all set
                  </h2>
                  <p className="customerWelcomeComplete__text">
                    We&apos;re taking you to your dashboard now.
                  </p>
                  <div className="customerWelcomeComplete__progress" aria-hidden="true" />
                </div>
              </Panel>
            )}
          </AnimatePresence>

          {currentStep < TOTAL_STEPS && (
            <WelcomePager page={currentStep} total={TOTAL_STEPS} onChange={goToStep} />
          )}
        </div>
      </main>
    </div>
  );
}
