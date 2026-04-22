import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, User, LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./sign-up.css";
import SearchableCombobox from "../../Shared/searchable_combobox";
import { signOut, signUp } from "../../../lib/supabase/auth";
import {
  getPasswordPolicyError,
  PASSWORD_POLICY_HINT,
} from "../../../lib/passwordPolicy";
import { PH_REGION_OPTIONS } from "../../../lib/phLocations";
import {
  buildCategoryPath,
  persistFeaturedCategoryFromSearch,
  resolveFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TypewriterText({ text, active, speed = 85, initialDelay = 120, className = "", showCursor = true }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setDisplayText("");

    if (!active) return undefined;

    if (reduceMotion) {
      setDisplayText(text);
      return undefined;
    }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = setTimeout(tick, speed);
    };

    timeoutId = setTimeout(tick, initialDelay);
    return () => clearTimeout(timeoutId);
  }, [active, text, speed, initialDelay, reduceMotion]);

  return (
    <span className={className}>
      {displayText}
      {!reduceMotion && showCursor && displayText.length < text.length && (
        <motion.span
          className="signUpType__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >|</motion.span>
      )}
    </span>
  );
}

function BrandTitle({ active }) {
  return (
    <div className="signUpBrand">
      <div className="signUpBrand__wrap">
        <h1 className="signUpBrand__title">
          <TypewriterText text="Carvver" active={active} speed={95} initialDelay={120} />
        </h1>
        <motion.svg className="signUpBrand__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.05, ease: "easeInOut", delay: 0.22 }}
          />
        </motion.svg>
      </div>
    </div>
  );
}

function RoleToggle({ value, onChange }) {
  return (
    <div className="signUpToggle" role="tablist" aria-label="Choose account type">
      <div className="signUpToggle__inner">
        <div className="signUpToggle__slot">
          {value === "customer" && (
            <motion.span layoutId="signUpToggleLine" className="signUpToggle__line"
              transition={{ type: "spring", stiffness: 420, damping: 34 }} />
          )}
          <motion.button type="button" role="tab" aria-selected={value === "customer"}
            className={`signUpToggle__btn ${value === "customer" ? "signUpToggle__btn--active" : ""}`}
            onClick={() => onChange("customer")} whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
            Customer
          </motion.button>
        </div>

        <span className="signUpToggle__sep" aria-hidden="true">|</span>

        <div className="signUpToggle__slot">
          {value === "freelancer" && (
            <motion.span layoutId="signUpToggleLine" className="signUpToggle__line"
              transition={{ type: "spring", stiffness: 420, damping: 34 }} />
          )}
          <motion.button type="button" role="tab" aria-selected={value === "freelancer"}
            className={`signUpToggle__btn ${value === "freelancer" ? "signUpToggle__btn--active" : ""}`}
            onClick={() => onChange("freelancer")} whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
            Freelancer
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function validateSignUpField(name, values, role) {
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const region = values.region.trim();
  const email = values.email.trim();

  switch (name) {
    case "firstName":
      return firstName ? "" : "First name is required.";
    case "lastName":
      return lastName ? "" : "Last name is required.";
    case "region":
      if (role === "freelancer" && !region) {
        return "Region is required for freelancer accounts.";
      }
      return "";
    case "email":
      if (!email) return "Email is required.";
      if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
      return "";
    case "password":
      return getPasswordPolicyError(values.password, "Password is required.");
    case "confirmPassword":
      if (!values.confirmPassword) return "Please confirm your password.";
      if (values.password !== values.confirmPassword) return "Passwords do not match.";
      return "";
    case "agreeTerms":
      return values.agreeTerms
        ? ""
        : "You need to accept the Terms and Privacy Policy.";
    default:
      return "";
  }
}

function getSignUpErrors(values, role) {
  const nextErrors = {};

  [
    "firstName",
    "lastName",
    "region",
    "email",
    "password",
    "confirmPassword",
    "agreeTerms",
  ].forEach((fieldName) => {
    const error = validateSignUpField(fieldName, values, role);
    if (error) {
      nextErrors[fieldName] = error;
    }
  });

  return nextErrors;
}

export default function SignUp() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    region: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    subscribe: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const categoryIntent = resolveFeaturedCategoryIntent(location.search);

  useEffect(() => {
    persistFeaturedCategoryFromSearch(location.search);
  }, [location.search]);

  const setFieldError = (name, message) => {
    setFieldErrors((prev) => {
      if (!message) {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [name]: message,
      };
    });
  };

  const handleFieldChange = (e) => {
    const { name, type, value, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    const nextValues = {
      ...formValues,
      [name]: nextValue,
    };

    setFormValues(nextValues);

    if (fieldErrors[name]) {
      setFieldError(name, validateSignUpField(name, nextValues, role));
    }

    if (name === "password" && (fieldErrors.confirmPassword || nextValues.confirmPassword)) {
      setFieldError(
        "confirmPassword",
        validateSignUpField("confirmPassword", nextValues, role)
      );
    }

    if (formError) setFormError("");
  };

  const handleFieldBlur = (e) => {
    const { name, type, value, checked } = e.target;
    const nextValues = {
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    };

    setFieldError(name, validateSignUpField(name, nextValues, role));
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);

    if (nextRole !== "freelancer") {
      setFieldError("region", "");
    } else if (fieldErrors.region) {
      setFieldError("region", validateSignUpField("region", formValues, nextRole));
    }

    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = getSignUpErrors(formValues, role);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("");
      return;
    }

    try {
      setFormError("");
      setIsLoading(true);
      await signUp({
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        role,
        region: formValues.region.trim(),
      });

      await signOut().catch(() => {});

      navigate(buildCategoryPath("/sign-up/success", categoryIntent), { replace: true });
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signUpPage">
      <div className="signUpPage__base" />
      <div className="signUpPage__bg" aria-hidden="true" />
      <div className="signUpPage__ambient" aria-hidden="true" />

      <main className="signUpPage__center" ref={ref}>
        <motion.section
          className="signUpCard"
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.7, ease: [0.2, 0.95, 0.2, 1] }}
        >
          <div className="signUpCard__shine" aria-hidden="true" />

          <div className="signUpCard__header">
            <BrandTitle active={inView} />

            <motion.h2 className="signUpCard__title"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.3 }}>
              Create Account
            </motion.h2>

            <p className="signUpCard__sub">
              <TypewriterText
                key={role}
                text={role === "customer"
                  ? "Enter your details below to create your customer account."
                  : "Enter your details below to create your freelancer account."}
                active={inView} speed={24} initialDelay={420} className="signUpCard__subText"
              />
            </p>
          </div>

          <motion.div className="signUpCard__toggleWrap"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.42 }}>
            <RoleToggle value={role} onChange={handleRoleChange} />
          </motion.div>

          <motion.form className="signUpForm" onSubmit={handleSubmit} noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.54 }}>

            <div className="signUpRow signUpRow--two">
              <label className="signUpFieldBlock">
                <span className="signUpFieldBlock__label">First Name</span>
                <div className={`signUpField ${fieldErrors.firstName ? "signUpField--error" : ""}`}>
                  <span className="signUpField__iconWrap" aria-hidden="true"><User className="signUpField__icon" /></span>
                  <input className="signUpField__control" type="text" name="firstName"
                    placeholder="John" autoComplete="given-name"
                    value={formValues.firstName}
                    onChange={handleFieldChange}
                    onBlur={handleFieldBlur}
                    aria-invalid={fieldErrors.firstName ? "true" : "false"}
                    aria-describedby={fieldErrors.firstName ? "sign-up-first-name-error" : undefined} />
                </div>
                {fieldErrors.firstName && (
                  <span className="signUpFieldBlock__error" id="sign-up-first-name-error">
                    {fieldErrors.firstName}
                  </span>
                )}
              </label>

              <label className="signUpFieldBlock">
                <span className="signUpFieldBlock__label">Last Name</span>
                <div className={`signUpField ${fieldErrors.lastName ? "signUpField--error" : ""}`}>
                  <span className="signUpField__iconWrap" aria-hidden="true"><User className="signUpField__icon" /></span>
                  <input className="signUpField__control" type="text" name="lastName"
                    placeholder="Doe" autoComplete="family-name"
                    value={formValues.lastName}
                    onChange={handleFieldChange}
                    onBlur={handleFieldBlur}
                    aria-invalid={fieldErrors.lastName ? "true" : "false"}
                    aria-describedby={fieldErrors.lastName ? "sign-up-last-name-error" : undefined} />
                </div>
                {fieldErrors.lastName && (
                  <span className="signUpFieldBlock__error" id="sign-up-last-name-error">
                    {fieldErrors.lastName}
                  </span>
                )}
              </label>
            </div>

            <AnimatePresence initial={false}>
              {role === "freelancer" && (
                <motion.div key="region-field"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="signUpReveal">
                  <label className="signUpFieldBlock">
                    <span className="signUpFieldBlock__label">Region</span>
                    <SearchableCombobox
                      value={formValues.region}
                      onSelect={(nextValue) => {
                        const nextValues = { ...formValues, region: nextValue };
                        setFormValues(nextValues);
                        if (fieldErrors.region) {
                          setFieldError(
                            "region",
                            validateSignUpField("region", nextValues, role)
                          );
                        }
                        if (formError) setFormError("");
                      }}
                      options={PH_REGION_OPTIONS}
                      placeholder="Choose your region"
                      ariaLabel="Choose your region"
                      error={Boolean(fieldErrors.region)}
                    />
                    {fieldErrors.region && (
                      <span className="signUpFieldBlock__error" id="sign-up-region-error">
                        {fieldErrors.region}
                      </span>
                    )}
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Email</span>
              <div className={`signUpField ${fieldErrors.email ? "signUpField--error" : ""}`}>
                <span className="signUpField__iconWrap" aria-hidden="true"><Mail className="signUpField__icon" /></span>
                <input className="signUpField__control" type="email" name="email"
                  placeholder="m@example.com" autoComplete="email"
                  value={formValues.email}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  aria-invalid={fieldErrors.email ? "true" : "false"}
                  aria-describedby={fieldErrors.email ? "sign-up-email-error" : undefined} />
              </div>
              {fieldErrors.email && (
                <span className="signUpFieldBlock__error" id="sign-up-email-error">
                  {fieldErrors.email}
                </span>
              )}
            </label>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Password</span>
              <div className={`signUpField signUpField--password ${fieldErrors.password ? "signUpField--error" : ""}`}>
                <span className="signUpField__iconWrap" aria-hidden="true"><Lock className="signUpField__icon" /></span>
                <input className="signUpField__control signUpField__control--password"
                  type={showPassword ? "text" : "password"} name="password"
                  placeholder="Password" autoComplete="new-password"
                  value={formValues.password}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  aria-invalid={fieldErrors.password ? "true" : "false"}
                  aria-describedby={fieldErrors.password ? "sign-up-password-error" : "sign-up-password-hint"} />
                <button type="button" className="signUpField__toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="signUpField__toggleIcon" /> : <Eye className="signUpField__toggleIcon" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <span className="signUpFieldBlock__error" id="sign-up-password-error">
                  {fieldErrors.password}
                </span>
              ) : (
                <span className="signUpFieldBlock__hint" id="sign-up-password-hint">
                  {PASSWORD_POLICY_HINT}
                </span>
              )}
            </label>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Confirm Password</span>
              <div className={`signUpField signUpField--password ${fieldErrors.confirmPassword ? "signUpField--error" : ""}`}>
                <span className="signUpField__iconWrap" aria-hidden="true"><Lock className="signUpField__icon" /></span>
                <input className="signUpField__control signUpField__control--password"
                  type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                  placeholder="Confirm Password" autoComplete="new-password"
                  value={formValues.confirmPassword}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
                  aria-describedby={fieldErrors.confirmPassword ? "sign-up-confirm-password-error" : undefined} />
                <button type="button" className="signUpField__toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff className="signUpField__toggleIcon" /> : <Eye className="signUpField__toggleIcon" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="signUpFieldBlock__error" id="sign-up-confirm-password-error">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </label>

            <div className={`signUpChecks ${fieldErrors.agreeTerms ? "signUpChecks--error" : ""}`}>
              <label className={`signUpCheck signUpCheck--top ${fieldErrors.agreeTerms ? "signUpCheck--error" : ""}`}>
                <input type="checkbox" className="signUpCheck__input" name="agreeTerms"
                  checked={formValues.agreeTerms}
                  onChange={handleFieldChange} />
                <span className="signUpCheck__box" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    className="signUpCheck__mark"
                    focusable="false"
                  >
                    <path
                      d="M3.3 8.35 6.45 11.4 12.7 4.95"
                      className="signUpCheck__markPath"
                    />
                  </svg>
                </span>
                <span className="signUpCheck__text">
                  I agree to the{" "}
                  <button type="button" className="signUpCheck__linkBtn">Terms and Conditions</button>
                  {" "}and{" "}
                  <button type="button" className="signUpCheck__linkBtn">Privacy Policy</button>.
                </span>
              </label>

              <label className="signUpCheck">
                <input type="checkbox" className="signUpCheck__input" name="subscribe"
                  checked={formValues.subscribe}
                  onChange={handleFieldChange} />
                <span className="signUpCheck__box" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    className="signUpCheck__mark"
                    focusable="false"
                  >
                    <path
                      d="M3.3 8.35 6.45 11.4 12.7 4.95"
                      className="signUpCheck__markPath"
                    />
                  </svg>
                </span>
                <span className="signUpCheck__text">
                  Subscribe to our newsletter to never miss out on anything.
                </span>
              </label>
            </div>
            {fieldErrors.agreeTerms && (
              <p className="signUpForm__error">{fieldErrors.agreeTerms}</p>
            )}
            {formError && <p className="signUpForm__error">{formError}</p>}

            <motion.button type="submit" className={`signUpPrimaryBtn ${isLoading ? "signUpPrimaryBtn--loading" : ""}`}
              disabled={isLoading}
              whileHover={isLoading ? {} : { y: -1.5 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}>
              {isLoading ? (
                <LoaderCircle className="signUpPrimaryBtn__spinner" aria-hidden="true" />
              ) : (
                <>
                  <span className="signUpPrimaryBtn__text">Create Account</span>
                  <span className="signUpPrimaryBtn__arrowWrap" aria-hidden="true">
                    <ArrowRight className="signUpPrimaryBtn__arrow" />
                  </span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div className="signUpBottomPrompt"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.84 }}>
            <span className="signUpBottomPrompt__text">Already have an account?</span>
            <button
              type="button"
              className="signUpBottomPrompt__link"
              onClick={() => navigate(buildCategoryPath("/sign-in", categoryIntent))}
            >
              Sign In
            </button>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
