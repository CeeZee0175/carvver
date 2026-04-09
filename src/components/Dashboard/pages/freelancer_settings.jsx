import React from "react";
import { motion } from "framer-motion";
import { LogOut, MessageCircle, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../../lib/supabase/auth";
import {
  DashboardBreadcrumbs,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { useFreelancerProfileData } from "../hooks/useFreelancerProfileData";
import "./profile.css";
import "./freelancer_pages.css";

export default function FreelancerSettings() {
  const navigate = useNavigate();
  const { profile, displayName, locationLabel, warning } = useFreelancerProfileData();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Settings" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <p className="profileHero__eyebrow">Account Settings</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Settings" />
              </h1>
              <motion.svg
                className="profileHero__line"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </motion.svg>
            </div>
            <p className="profileHero__sub">
              Review the details tied to your freelancer profile and keep your main
              account actions close.
            </p>
          </div>

          <div className="freelancerHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Display name</span>
              <strong className="profileMiniStat__value" style={{ fontSize: "24px" }}>
                {displayName}
              </strong>
              <span className="profileMiniStat__hint">Your public freelancer name</span>
            </div>

            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Location</span>
              <strong className="profileMiniStat__value" style={{ fontSize: "24px" }}>
                {locationLabel === "No location added yet" ? "Missing" : "Set"}
              </strong>
              <span className="profileMiniStat__hint">{locationLabel}</span>
            </div>
          </div>
        </section>
      </Reveal>

      {warning ? (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">Some account details couldn't be loaded</h2>
              <p className="profileNotice__desc">{warning}</p>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Account details</p>
              <h2 className="profileSection__title">What is already saved</h2>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Email</span>
              <strong className="freelancerDataValue--strong">
                {profile?.email || "No email available"}
              </strong>
              <p className="freelancerSettingsCard__desc">
                This is the email connected to your current account.
              </p>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Role</span>
              <strong className="freelancerDataValue--strong">Freelancer</strong>
              <p className="freelancerSettingsCard__desc">
                This account is set up as a freelancer account.
              </p>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Profile status</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_onboarding_completed_at ? "Completed" : "Incomplete"}
              </strong>
              <p className="freelancerSettingsCard__desc">
                Your onboarding details are already saved to your profile.
              </p>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Main category</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_primary_category || "Not set yet"}
              </strong>
              <p className="freelancerSettingsCard__desc">
                Keep this updated so people can place your work quickly.
              </p>
            </article>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="profileNavBand">
          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/profile")}
          >
            <UserRound className="profileNavBand__icon" />
            <span className="profileNavBand__label">Profile</span>
            <span className="profileNavBand__desc">Edit your freelancer details</span>
          </motion.button>

          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/messages")}
          >
            <MessageCircle className="profileNavBand__icon" />
            <span className="profileNavBand__label">Messages</span>
            <span className="profileNavBand__desc">Open your inbox view</span>
          </motion.button>

          <motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/pricing")}
          >
            <Sparkles className="profileNavBand__icon" />
            <span className="profileNavBand__label">Carvver Pro</span>
            <span className="profileNavBand__desc">Review pricing and platform extras</span>
          </motion.button>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Session</p>
              <h2 className="profileSection__title">Account actions</h2>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Sign out</span>
              <strong className="freelancerDataValue--strong">End this session</strong>
              <p className="freelancerSettingsCard__desc">
                Sign out of your account when you are finished using this device.
              </p>
              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--primary"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleSignOut}
              >
                <LogOut className="profileEditor__btnIcon" />
                <span>Sign out</span>
              </motion.button>
            </article>
          </div>
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
