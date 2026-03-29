import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "./sign-in.css";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { signIn, getProfile } from "../../lib/supabase/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signInSocial__icon">
      <path d="M21.8 12.23c0-.76-.07-1.49-.2-2.18H12v4.13h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.59Z" fill="#4285F4" />
      <path d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.91-1.8-5.72-4.21H2.87v2.64A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.28 13.74A5.99 5.99 0 0 1 6 12c0-.61.1-1.2.28-1.74V7.62H2.87A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.38l3.21-2.64Z" fill="#FBBC05" />
      <path d="M12 6.05c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.06 2.99 14.75 2 12 2a10 10 0 0 0-9.13 5.62l3.41 2.64C7.09 7.85 9.34 6.05 12 6.05Z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signInSocial__icon">
      <path fill="currentColor" d="M13.5 21v-7h2.35l.4-3h-2.75V9.13c0-.87.24-1.47 1.49-1.47H16.4V5a19.2 19.2 0 0 0-2.04-.1c-2.02 0-3.4 1.23-3.4 3.5V11H8.7v3h2.26v7h2.54Z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signInSocial__icon">
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

function SocialButton({ icon, label, onClick }) {
  return (
    <motion.button
      type="button"
      className="signInSocial"
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
      onClick={onClick}
    >
      <span className="signInSocial__iconWrap" aria-hidden="true">{icon}</span>
      <span className="signInSocial__text">{label}</span>
    </motion.button>
  );
}

export default function SignIn() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      await signIn({ email, password });

      // Fetch profile to determine role and redirect accordingly
      const profile = await getProfile();

      toast.success(`Welcome back, ${profile.first_name}!`);

      if (profile.role === "customer") {
        navigate("/dashboard/customer");
      } else if (profile.role === "freelancer") {
        navigate("/dashboard/freelancer");
      } else {
        navigate("/dashboard/customer");
      }
    } catch (err) {
      toast.error(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signInPage">
      <Toaster position="top-center" />
      <div className="signInPage__base" />
      <div className="signInPage__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="signInPage__bg" aria-hidden="true" />

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

          <motion.form className="signInForm" onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.2, 0.95, 0.2, 1], delay: 0.54 }}>

            <label className="signFieldBlock">
              <span className="signFieldBlock__label">Email</span>
              <div className="signField">
                <span className="signField__iconWrap" aria-hidden="true">
                  <Mail className="signField__icon" />
                </span>
                <input
                  className="signField__control"
                  type="email" name="email"
                  placeholder="m@example.com"
                  autoComplete="email" required
                />
              </div>
            </label>

            <label className="signFieldBlock">
              <span className="signFieldBlock__label">Password</span>
              <div className="signField signField--password">
                <span className="signField__iconWrap" aria-hidden="true">
                  <Lock className="signField__icon" />
                </span>
                <input
                  className="signField__control signField__control--password"
                  type={showPassword ? "text" : "password"}
                  name="password" placeholder="Password"
                  autoComplete="current-password" required
                />
                <button type="button" className="signField__toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword
                    ? <EyeOff className="signField__toggleIcon" />
                    : <Eye className="signField__toggleIcon" />}
                </button>
              </div>
            </label>

            <div className="signInForm__row">
              <label className="signCheckbox">
                <input type="checkbox" className="signCheckbox__input" />
                <span className="signCheckbox__box" aria-hidden="true" />
                <span className="signCheckbox__text">Remember me</span>
              </label>

              <button type="button" className="signInForm__linkBtn"
                onClick={() => toast("Password reset coming soon!")}>
                Forgot password?
              </button>
            </div>

            <motion.button type="submit" className="signPrimaryBtn"
              disabled={isLoading}
              whileHover={isLoading ? {} : { y: -1.5 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}>
              <span className="signPrimaryBtn__text">
                {isLoading ? "Signing In..." : "Sign In"}
              </span>
              {!isLoading && (
                <span className="signPrimaryBtn__arrowWrap" aria-hidden="true">
                  <ArrowRight className="signPrimaryBtn__arrow" />
                </span>
              )}
            </motion.button>
          </motion.form>

          <motion.div className="signInDivider"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.72 }}>
            <span className="signInDivider__text">Or continue with</span>
          </motion.div>

          <motion.div className="signInSocials"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.2, 0.95, 0.2, 1], delay: 0.8 }}>
            <SocialButton icon={<GoogleIcon />} label="Google" onClick={() => toast("Google sign-in coming soon!")} />
            <SocialButton icon={<FacebookIcon />} label="Facebook" onClick={() => toast("Facebook sign-in coming soon!")} />
            <SocialButton icon={<TwitterIcon />} label="Twitter" onClick={() => toast("Twitter sign-in coming soon!")} />
          </motion.div>

          <motion.div className="signInBottomPrompt"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.9 }}>
            <span className="signInBottomPrompt__text">New to our platform?</span>
            <button type="button" className="signInBottomPrompt__link"
              onClick={() => navigate("/sign-up")}>
              Create Account
            </button>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}