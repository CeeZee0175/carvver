import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, User, MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "./sign-up.css";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { signUp } from "../../lib/supabase/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signUpSocial__icon">
      <path d="M21.8 12.23c0-.76-.07-1.49-.2-2.18H12v4.13h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.59Z" fill="#4285F4" />
      <path d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.91-1.8-5.72-4.21H2.87v2.64A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.28 13.74A5.99 5.99 0 0 1 6 12c0-.61.1-1.2.28-1.74V7.62H2.87A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.38l3.21-2.64Z" fill="#FBBC05" />
      <path d="M12 6.05c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.06 2.99 14.75 2 12 2a10 10 0 0 0-9.13 5.62l3.41 2.64C7.09 7.85 9.34 6.05 12 6.05Z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signUpSocial__icon">
      <path fill="currentColor" d="M13.5 21v-7h2.35l.4-3h-2.75V9.13c0-.87.24-1.47 1.49-1.47H16.4V5a19.2 19.2 0 0 0-2.04-.1c-2.02 0-3.4 1.23-3.4 3.5V11H8.7v3h2.26v7h2.54Z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signUpSocial__icon">
      <path fill="currentColor" d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.77-6.23L6.7 22H3.58l7.24-8.28L1 2h6.25l4.31 5.68L18.9 2Zm-1.07 18h1.69L6.32 3.9H4.5L17.83 20Z" />
    </svg>
  );
}

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

function SocialButton({ icon, label, onClick }) {
  return (
    <motion.button type="button" className="signUpSocial"
      whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }} onClick={onClick}>
      <span className="signUpSocial__iconWrap" aria-hidden="true">{icon}</span>
      <span className="signUpSocial__text">{label}</span>
    </motion.button>
  );
}

export default function SignUp() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();
    const country = String(formData.get("country") || "").trim();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);
      await signUp({ firstName, lastName, email, password, role, country });
      toast.success("Account created! Please check your email to verify.");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signUpPage">
      <Toaster position="top-center" />
      <div className="signUpPage__base" />
      <div className="signUpPage__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="signUpPage__bg" aria-hidden="true" />

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
            <RoleToggle value={role} onChange={setRole} />
          </motion.div>

          <motion.form className="signUpForm" onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.54 }}>

            <div className="signUpRow signUpRow--two">
              <label className="signUpFieldBlock">
                <span className="signUpFieldBlock__label">First Name</span>
                <div className="signUpField">
                  <span className="signUpField__iconWrap" aria-hidden="true"><User className="signUpField__icon" /></span>
                  <input className="signUpField__control" type="text" name="firstName"
                    placeholder="John" autoComplete="given-name" required />
                </div>
              </label>

              <label className="signUpFieldBlock">
                <span className="signUpFieldBlock__label">Last Name</span>
                <div className="signUpField">
                  <span className="signUpField__iconWrap" aria-hidden="true"><User className="signUpField__icon" /></span>
                  <input className="signUpField__control" type="text" name="lastName"
                    placeholder="Doe" autoComplete="family-name" required />
                </div>
              </label>
            </div>

            <AnimatePresence initial={false}>
              {role === "freelancer" && (
                <motion.div key="country-field"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="signUpReveal">
                  <label className="signUpFieldBlock">
                    <span className="signUpFieldBlock__label">Country</span>
                    <div className="signUpField">
                      <span className="signUpField__iconWrap" aria-hidden="true"><MapPinned className="signUpField__icon" /></span>
                      <input className="signUpField__control" type="text" name="country"
                        placeholder="Philippines" autoComplete="country-name" required={role === "freelancer"} />
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Email</span>
              <div className="signUpField">
                <span className="signUpField__iconWrap" aria-hidden="true"><Mail className="signUpField__icon" /></span>
                <input className="signUpField__control" type="email" name="email"
                  placeholder="m@example.com" autoComplete="email" required />
              </div>
            </label>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Password</span>
              <div className="signUpField signUpField--password">
                <span className="signUpField__iconWrap" aria-hidden="true"><Lock className="signUpField__icon" /></span>
                <input className="signUpField__control signUpField__control--password"
                  type={showPassword ? "text" : "password"} name="password"
                  placeholder="Password" autoComplete="new-password" required />
                <button type="button" className="signUpField__toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="signUpField__toggleIcon" /> : <Eye className="signUpField__toggleIcon" />}
                </button>
              </div>
            </label>

            <label className="signUpFieldBlock">
              <span className="signUpFieldBlock__label">Confirm Password</span>
              <div className="signUpField signUpField--password">
                <span className="signUpField__iconWrap" aria-hidden="true"><Lock className="signUpField__icon" /></span>
                <input className="signUpField__control signUpField__control--password"
                  type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                  placeholder="Confirm Password" autoComplete="new-password" required />
                <button type="button" className="signUpField__toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff className="signUpField__toggleIcon" /> : <Eye className="signUpField__toggleIcon" />}
                </button>
              </div>
            </label>

            <div className="signUpChecks">
              <label className="signUpCheck signUpCheck--top">
                <input type="checkbox" className="signUpCheck__input" required />
                <span className="signUpCheck__box" aria-hidden="true" />
                <span className="signUpCheck__text">
                  I agree to the{" "}
                  <button type="button" className="signUpCheck__linkBtn">Terms and Conditions</button>
                  {" "}and{" "}
                  <button type="button" className="signUpCheck__linkBtn">Privacy Policy</button>.
                </span>
              </label>

              <label className="signUpCheck">
                <input type="checkbox" className="signUpCheck__input" />
                <span className="signUpCheck__box" aria-hidden="true" />
                <span className="signUpCheck__text">
                  Subscribe to our newsletter to never miss out on anything.
                </span>
              </label>
            </div>

            <motion.button type="submit" className="signUpPrimaryBtn"
              disabled={isLoading}
              whileHover={isLoading ? {} : { y: -1.5 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}>
              <span className="signUpPrimaryBtn__text">
                {isLoading ? "Creating Account..." : "Create Account"}
              </span>
              {!isLoading && (
                <span className="signUpPrimaryBtn__arrowWrap" aria-hidden="true">
                  <ArrowRight className="signUpPrimaryBtn__arrow" />
                </span>
              )}
            </motion.button>
          </motion.form>

          <motion.div className="signUpDivider"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.78 }}>
            <span className="signUpDivider__text">Or continue with</span>
          </motion.div>

          <motion.div className="signUpSocials"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.86 }}>
            <SocialButton icon={<GoogleIcon />} label="Google" onClick={() => toast("Google sign-up coming soon!")} />
            <SocialButton icon={<FacebookIcon />} label="Facebook" onClick={() => toast("Facebook sign-up coming soon!")} />
            <SocialButton icon={<TwitterIcon />} label="Twitter" onClick={() => toast("Twitter sign-up coming soon!")} />
          </motion.div>

          <motion.div className="signUpBottomPrompt"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.94 }}>
            <span className="signUpBottomPrompt__text">Already have an account?</span>
            <button type="button" className="signUpBottomPrompt__link" onClick={() => navigate("/sign-in")}>
              Sign In
            </button>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}