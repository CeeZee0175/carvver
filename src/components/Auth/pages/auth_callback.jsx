import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import "./auth-callback.css";
import {
  ensureProfileForSession,
  exchangeCodeForSession,
  getSession,
} from "../../../lib/supabase/auth";
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
} from "../../../lib/featuredCategoryIntent";
import {
  clearAuthFlowIntent,
  getAuthFlowIntent,
} from "../../../lib/authFlowIntent";

function getFriendlyErrorMessage(error) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied|violates row-level security/i.test(message)) {
    return "Authentication finished, but we couldn't finish setting up your account.";
  }

  return message || "We couldn't finish signing you in. Please try again.";
}

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Completing your secure sign-in...");
  const [errorMessage, setErrorMessage] = useState("");

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    let isMounted = true;

    async function finishAuthentication() {
      const intent = getAuthFlowIntent() || {};
      const mode = searchParams.get("mode") || intent.mode || "sign-in";

      try {
        const code = searchParams.get("code");

        if (code) {
          setStatus(
            mode === "sign-up"
              ? "Connecting your account and verifying your session..."
              : "Completing your secure sign-in..."
          );
          await exchangeCodeForSession(code);
        }

        const session = await getSession();
        if (!session?.user) {
          throw new Error("We couldn't find your session after authentication.");
        }

        if (mode === "email-change") {
          setStatus("Confirming your new email...");
          const profile = await ensureProfileForSession(session, intent);
          clearAuthFlowIntent();

          navigate(
            profile?.role === "freelancer"
              ? "/dashboard/freelancer/settings?emailChange=success"
              : "/dashboard/customer/settings?emailChange=success",
            { replace: true }
          );
          return;
        }

        setStatus("Setting up your Carvver profile...");

        const profile = await ensureProfileForSession(session, intent);
        const customerDestination = intent.categoryIntent
          ? buildCategoryPath(
              "/dashboard/customer/browse-services",
              intent.categoryIntent
            )
          : DEFAULT_CUSTOMER_DESTINATION;

        clearAuthFlowIntent();
        if (intent.categoryIntent) clearFeaturedCategoryIntent();

        if (profile?.role === "customer" && !isCustomerOnboardingComplete(profile)) {
          setCustomerWelcomeDestination(customerDestination);
          navigate(CUSTOMER_WELCOME_PATH, { replace: true });
          return;
        }

        if (
          profile?.role === "freelancer" &&
          !isFreelancerOnboardingComplete(profile)
        ) {
          setFreelancerWelcomeDestination("/dashboard/freelancer");
          navigate(FREELANCER_WELCOME_PATH, { replace: true });
          return;
        }

        navigate(
          profile?.role === "freelancer"
            ? "/dashboard/freelancer"
            : customerDestination,
          { replace: true }
        );
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(getFriendlyErrorMessage(error));
      }
    }

    finishAuthentication();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="authCallbackPage">
      <div className="authCallbackPage__base" />
      <div className="authCallbackPage__bg" aria-hidden="true" />
      <div className="authCallbackPage__ambient" aria-hidden="true" />

      <main className="authCallbackPage__center">
        <Motion.section
          className="authCallbackCard"
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.2, 0.95, 0.2, 1] }}
        >
          <div className="authCallbackCard__shine" aria-hidden="true" />

          <div className="authCallbackCard__content">
            <span className="authCallbackCard__eyebrow">Carvver Auth</span>
            <h1 className="authCallbackCard__title">
              {errorMessage ? "We hit a snag" : "Finishing your sign-in"}
            </h1>
            <p className="authCallbackCard__message">
              {errorMessage || status}
            </p>

            {errorMessage ? (
              <div className="authCallbackCard__actions">
                <button
                  type="button"
                  className="authCallbackCard__btn authCallbackCard__btn--primary"
                  onClick={() => navigate("/sign-in", { replace: true })}
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  className="authCallbackCard__btn"
                  onClick={() => navigate("/sign-up", { replace: true })}
                >
                  Go to Sign Up
                </button>
              </div>
            ) : (
              <div className="authCallbackCard__progress" aria-hidden="true">
                <span className="authCallbackCard__dot" />
                <span className="authCallbackCard__dot" />
                <span className="authCallbackCard__dot" />
              </div>
            )}
          </div>
        </Motion.section>
      </main>
    </div>
  );
}
