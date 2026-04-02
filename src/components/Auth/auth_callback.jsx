import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import "./auth-callback.css";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import {
  exchangeCodeForSession,
  getProfileById,
  getSession,
  upsertProfile,
} from "../../lib/supabase/auth";
import {
  buildCategoryPath,
  clearFeaturedCategoryIntent,
} from "../../lib/featuredCategoryIntent";
import {
  clearAuthFlowIntent,
  getAuthFlowIntent,
} from "../../lib/authFlowIntent";

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveProfileNames(user, intent = {}) {
  const intentFirstName = String(intent.firstName || "").trim();
  const intentLastName = String(intent.lastName || "").trim();

  if (intentFirstName || intentLastName) {
    return {
      firstName: intentFirstName || "Carvver",
      lastName: intentLastName || "User",
    };
  }

  const metadata = user.user_metadata || {};
  const directFirstName = String(
    metadata.first_name || metadata.given_name || metadata.preferred_username || ""
  ).trim();
  const directLastName = String(metadata.last_name || metadata.family_name || "").trim();
  const fullName = String(metadata.full_name || metadata.name || "").trim();

  if (directFirstName || directLastName) {
    return {
      firstName: directFirstName || "Carvver",
      lastName: directLastName || "User",
    };
  }

  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      firstName: toTitleCase(parts[0] || "Carvver"),
      lastName: toTitleCase(parts.slice(1).join(" ") || "User"),
    };
  }

  const emailStem = String(user.email || "carvver user")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  const emailParts = emailStem.split(/\s+/).filter(Boolean);

  return {
    firstName: toTitleCase(emailParts[0] || "Carvver"),
    lastName: toTitleCase(emailParts.slice(1).join(" ") || "User"),
  };
}

function getAvatarUrl(user) {
  const metadata = user.user_metadata || {};
  return metadata.avatar_url || metadata.picture || metadata.avatar || null;
}

function getFriendlyErrorMessage(error) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied|violates row-level security/i.test(message)) {
    return "Authentication finished, but Carvver could not save the profile yet. Add a profile insert policy or keep the existing profile trigger enabled in Supabase.";
  }

  return message || "We couldn't finish authentication. Please try again.";
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

        const user = session.user;
        let profile = await getProfileById(user.id);

        if (!profile) {
          setStatus("Setting up your Carvver profile...");

          const names = deriveProfileNames(user, intent);
          const nextProfile = {
            id: user.id,
            first_name: names.firstName,
            last_name: names.lastName,
            role: intent.role || user.user_metadata?.role || "customer",
            country: intent.country || user.user_metadata?.country || null,
            avatar_url: getAvatarUrl(user),
          };

          await upsertProfile(nextProfile);
          profile = nextProfile;
        } else {
          const updates = { id: profile.id };
          let shouldUpdate = false;

          if (!profile.first_name || !profile.last_name) {
            const names = deriveProfileNames(user, intent);

            if (!profile.first_name) {
              updates.first_name = names.firstName;
              shouldUpdate = true;
            }

            if (!profile.last_name) {
              updates.last_name = names.lastName;
              shouldUpdate = true;
            }
          }

          if (!profile.country && intent.country) {
            updates.country = intent.country;
            shouldUpdate = true;
          }

          if (!profile.avatar_url) {
            const avatarUrl = getAvatarUrl(user);
            if (avatarUrl) {
              updates.avatar_url = avatarUrl;
              shouldUpdate = true;
            }
          }

          if (!profile.role && intent.role) {
            updates.role = intent.role;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await upsertProfile({ ...profile, ...updates });
            profile = { ...profile, ...updates };
          }
        }

        clearAuthFlowIntent();

        if (intent.categoryIntent) {
          clearFeaturedCategoryIntent();
          navigate(
            buildCategoryPath("/dashboard/customer/browse-services", intent.categoryIntent),
            { replace: true }
          );
          return;
        }

        navigate(
          profile?.role === "freelancer" ? "/dashboard/freelancer" : "/dashboard/customer",
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
      <div className="authCallbackPage__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="authCallbackPage__bg" aria-hidden="true" />

      <main className="authCallbackPage__center">
        <motion.section
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
        </motion.section>
      </main>
    </div>
  );
}
