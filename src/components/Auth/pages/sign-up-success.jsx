import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import "./sign-up-success.css";
import {
  buildCategoryPath,
  persistFeaturedCategoryFromSearch,
  resolveFeaturedCategoryIntent,
} from "../../../lib/featuredCategoryIntent";

const REDIRECT_DELAY_SECONDS = 5;

export default function SignUpSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [secondsRemaining, setSecondsRemaining] = useState(REDIRECT_DELAY_SECONDS);
  const categoryIntent = resolveFeaturedCategoryIntent(location.search);
  const targetPath = useMemo(
    () => buildCategoryPath("/sign-in", categoryIntent),
    [categoryIntent]
  );

  useEffect(() => {
    persistFeaturedCategoryFromSearch(location.search);
  }, [location.search]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      navigate(targetPath, { replace: true });
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setSecondsRemaining((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [navigate, secondsRemaining, targetPath]);

  return (
    <div className="signUpSuccessPage">
      <div className="signUpSuccessPage__base" />
      <div className="signUpSuccessPage__bg" aria-hidden="true" />
      <div className="signUpSuccessPage__ambient" aria-hidden="true" />

      <main className="signUpSuccessPage__center">
        <Motion.section
          className="signUpSuccessCard"
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.95, 0.2, 1] }}
        >
          <div className="signUpSuccessCard__shine" aria-hidden="true" />

          <div className="signUpSuccessCard__content">
            <span className="signUpSuccessCard__eyebrow">Registration Complete</span>

            <Motion.div
              className="signUpSuccessCard__badge"
              initial={reduceMotion ? false : { scale: 0.84, opacity: 0 }}
              animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.2, 0.95, 0.2, 1], delay: 0.08 }}
              aria-hidden="true"
            >
              <svg
                className="signUpSuccessCard__checkmark"
                viewBox="0 0 96 96"
                role="presentation"
              >
                <Motion.circle
                  className="signUpSuccessCard__ring"
                  cx="48"
                  cy="48"
                  r="34"
                  fill="none"
                  strokeWidth="6"
                  initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.65, ease: "easeInOut", delay: 0.18 }}
                />
                <Motion.path
                  className="signUpSuccessCard__tick"
                  d="M31 49.5 42.5 61 66 37.5"
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, ease: "easeInOut", delay: 0.48 }}
                />
              </svg>
            </Motion.div>

            <h1 className="signUpSuccessCard__title">You&apos;re successfully registered.</h1>

            <p className="signUpSuccessCard__message">
              Please check your email and confirm your account before signing in.
            </p>

            <p className="signUpSuccessCard__countdown">
              Redirecting to sign in in <strong>{secondsRemaining}</strong>{" "}
              {secondsRemaining === 1 ? "second" : "seconds"}.
            </p>

            <button
              type="button"
              className="signUpSuccessCard__link"
              onClick={() => navigate(targetPath, { replace: true })}
            >
              Click here if you are not redirected.
            </button>
          </div>
        </Motion.section>
      </main>
    </div>
  );
}
