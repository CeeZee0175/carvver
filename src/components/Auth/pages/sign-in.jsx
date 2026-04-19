import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "./sign-in.css";
import {
  ensureProfileForSession,
  signIn,
} from "../../../lib/supabase/auth";
import { PASSWORD_POLICY_NOTICE } from "../../../lib/passwordPolicy";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
  setCustomerWelcomeDestination,
  setFreelancerWelcomeDestination,
} from "../../../lib/customerOnboarding";
import {
  buildCategoryPath,
  clearFeaturedCategoryIntent,
  persistFeaturedCategoryFromSearch,
  resolveFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TypewriterText({ text, active, speed = 85, initialDelay = 120, className = "", showCursor = true }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (reduceMotion) { setDisplayText(text); return; }

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
          className="signInType__cursor"
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
    <div className="signInBrand">
      <div className="signInBrand__wrap">
        <h1 className="signInBrand__title">
          <TypewriterText text="Carvver" active={active} speed={95} initialDelay={120} />
        </h1>
        <motion.svg className="signInBrand__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
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

function validateSignInField(name, value) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (name === "email") {
    if (!normalizedValue) return "Email is required.";
    if (!EMAIL_PATTERN.test(normalizedValue)) return "Enter a valid email address.";
  }

  if (name === "password" && !value) {
    return "Password is required.";
  }

  return "";
}

function getSignInErrors(values) {
  return {
    ...(validateSignInField("email", values.email)
      ? { email: validateSignInField("email", values.email) }
      : {}),
    ...(validateSignInField("password", values.password)
      ? { password: validateSignInField("password", values.password) }
      : {}),
  };
}

export default function SignIn() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const location = useLocation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const categoryIntent = resolveFeaturedCategoryIntent(location.search);

  useEffect(() => {
    persistFeaturedCategoryFromSearch(location.search);
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("reset") === "success") {
      toast.success("Your password has been updated. You can sign in now.");
      params.delete("reset");
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

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

    setFormValues((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (fieldErrors[name]) {
      setFieldError(name, validateSignInField(name, nextValue));
    }

    if (formError) setFormError("");
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    setFieldError(name, validateSignInField(name, value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = getSignInErrors(formValues);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("");
      return;
    }

    try {
      setFormError("");
      setIsLoading(true);
      const authResult = await signIn({
        email: formValues.email.trim(),
        password: formValues.password,
        remember: formValues.remember,
      });

      const profile = await ensureProfileForSession(authResult.session);
      const customerDestination = categoryIntent
        ? buildCategoryPath("/dashboard/customer/browse-services", categoryIntent)
        : DEFAULT_CUSTOMER_DESTINATION;

      if (profile?.role === "customer" && !isCustomerOnboardingComplete(profile)) {
        setCustomerWelcomeDestination(customerDestination);
        if (categoryIntent) clearFeaturedCategoryIntent();
        navigate(CUSTOMER_WELCOME_PATH, { replace: true });
        return;
      }

      if (profile?.role === "freelancer" && !isFreelancerOnboardingComplete(profile)) {
        setFreelancerWelcomeDestination("/dashboard/freelancer");
        if (categoryIntent) clearFeaturedCategoryIntent();
        navigate(FREELANCER_WELCOME_PATH, { replace: true });
        return;
      }

      toast.success(`Welcome back, ${profile.first_name}!`);

      if (categoryIntent) {
        clearFeaturedCategoryIntent();
        navigate(customerDestination);
      } else if (profile.role === "customer") {
        navigate(DEFAULT_CUSTOMER_DESTINATION);
      } else if (profile.role === "freelancer") {
        navigate("/dashboard/freelancer");
      } else {
        navigate(DEFAULT_CUSTOMER_DESTINATION);
      }
    } catch (err) {
      setFormError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setFormError("");
    const normalizedEmail = formValues.email.trim();
    navigate(
      normalizedEmail
        ? `/recover-password?email=${encodeURIComponent(normalizedEmail)}`
        : "/recover-password"
    );
  };

  return (
    <div className="signInPage">
      <Toaster position="top-center" />
      <div className="signInPage__base" />
      <div className="signInPage__bg" aria-hidden="true" />
      <div className="signInPage__ambient" aria-hidden="true" />

      <main className="signInPage__center" ref={ref}>
        <motion.section
          className="signInCard"
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.7, ease: [0.2, 0.95, 0.2, 1] }}
        >
          <div className="signInCard__shine" aria-hidden="true" />

          <div className="signInCard__header">
            <BrandTitle active={inView} />

            <motion.h2 className="signInCard__title"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.3 }}>
              Welcome
            </motion.h2>

            <p className="signInCard__sub">
              <TypewriterText
                text="Enter your email below to sign in."
                active={inView} speed={26} initialDelay={420}
                className="signInCard__subText"
              />
            </p>
          </div>

          <motion.form className="signInForm" onSubmit={handleSubmit} noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.54 }}>

            <label className="signFieldBlock">
              <span className="signFieldBlock__label">Email</span>
              <div className={`signField ${fieldErrors.email ? "signField--error" : ""}`}>
                <span className="signField__iconWrap" aria-hidden="true">
                  <Mail className="signField__icon" />
                </span>
                <input
                  className="signField__control"
                  type="email" name="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={formValues.email}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  aria-invalid={fieldErrors.email ? "true" : "false"}
                  aria-describedby={fieldErrors.email ? "sign-in-email-error" : undefined}
                />
              </div>
              {fieldErrors.email && (
                <span className="signFieldBlock__error" id="sign-in-email-error">
                  {fieldErrors.email}
                </span>
              )}
            </label>

            <label className="signFieldBlock">
              <span className="signFieldBlock__label">Password</span>
              <div className={`signField signField--password ${fieldErrors.password ? "signField--error" : ""}`}>
                <span className="signField__iconWrap" aria-hidden="true">
                  <Lock className="signField__icon" />
                </span>
                <input
                  className="signField__control signField__control--password"
                  type={showPassword ? "text" : "password"}
                  name="password" placeholder="Password"
                  autoComplete="current-password"
                  value={formValues.password}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  aria-invalid={fieldErrors.password ? "true" : "false"}
                  aria-describedby={fieldErrors.password ? "sign-in-password-error" : undefined}
                />
                <button type="button" className="signField__toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword
                    ? <EyeOff className="signField__toggleIcon" />
                    : <Eye className="signField__toggleIcon" />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="signFieldBlock__error" id="sign-in-password-error">
                  {fieldErrors.password}
                </span>
              )}
            </label>

            <div className="signInForm__row">
              <label className="signCheckbox">
                {/* name="remember" lets formData read it, defaultChecked ticks it by default */}
                <input
                  type="checkbox"
                  className="signCheckbox__input"
                  name="remember"
                  checked={formValues.remember}
                  onChange={handleFieldChange}
                />
                <span className="signCheckbox__box" aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    className="signCheckbox__mark"
                    focusable="false"
                  >
                    <path
                      d="M3.3 8.35 6.45 11.4 12.7 4.95"
                      className="signCheckbox__markPath"
                    />
                  </svg>
                </span>
                <span className="signCheckbox__text">Remember me</span>
              </label>

              <button type="button" className="signInForm__linkBtn"
                onClick={handleForgotPassword}
                disabled={isLoading}>
                Forgot password?
              </button>
            </div>

            <p className="signInForm__notice">{PASSWORD_POLICY_NOTICE}</p>
            {formError && <p className="signInForm__error">{formError}</p>}

            <motion.button type="submit" className={`signPrimaryBtn ${isLoading ? "signPrimaryBtn--loading" : ""}`}
              disabled={isLoading}
              whileHover={isLoading ? {} : { y: -1.5 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}>
              {isLoading ? (
                <LoaderCircle className="signPrimaryBtn__spinner" aria-hidden="true" />
              ) : (
                <>
                  <span className="signPrimaryBtn__text">Sign In</span>
                  <span className="signPrimaryBtn__arrowWrap" aria-hidden="true">
                    <ArrowRight className="signPrimaryBtn__arrow" />
                  </span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div className="signInBottomPrompt"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.8 }}>
            <span className="signInBottomPrompt__text">New to our platform?</span>
            <button
              type="button"
              className="signInBottomPrompt__link"
              onClick={() => navigate(buildCategoryPath("/sign-up", categoryIntent))}
            >
              Create Account
            </button>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
