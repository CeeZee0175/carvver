import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  fetchFreelancerPayoutMethod,
  saveFreelancerPayoutMethod,
} from "../hooks/useMarketplaceWorkflow";
import "./profile.css";
import "./freelancer_pages.css";
import "./customer_settings.css";

export default function FreelancerSettings() {
  const navigate = useNavigate();
  const { profile, displayName, locationLabel, warning } = useFreelancerProfileData();
  const [payoutValues, setPayoutValues] = useState({
    payoutMethod: "",
    accountName: "",
    accountReference: "",
  });
  const [payoutState, setPayoutState] = useState({
    pending: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    fetchFreelancerPayoutMethod()
      .then((next) => {
        setPayoutValues({
          payoutMethod: next.payoutMethod || "",
          accountName: next.accountName || "",
          accountReference: next.accountReference || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handlePayoutSave = async (event) => {
    event.preventDefault();
    setPayoutState({ pending: true, error: "", success: "" });

    try {
      const saved = await saveFreelancerPayoutMethod(payoutValues);
      setPayoutValues({
        payoutMethod: saved.payoutMethod,
        accountName: saved.accountName,
        accountReference: saved.accountReference,
      });
      setPayoutState({
        pending: false,
        error: "",
        success: "Payout destination saved.",
      });
    } catch (error) {
      setPayoutState({
        pending: false,
        error: error.message || "We couldn't save your payout destination.",
        success: "",
      });
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
            </div>

            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Location</span>
              <strong className="profileMiniStat__value" style={{ fontSize: "24px" }}>
                {locationLabel === "No location added yet" ? "Missing" : "Set"}
              </strong>
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
              <h2 className="profileSection__title">Account details</h2>
              <p className="profileSection__sub">
                Review the freelancer account details that are already saved here.
              </p>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Email</span>
              <strong className="freelancerDataValue--strong">
                {profile?.email || "No email available"}
              </strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Role</span>
              <strong className="freelancerDataValue--strong">Freelancer</strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Profile status</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_onboarding_completed_at ? "Completed" : "Incomplete"}
              </strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Main category</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_primary_category || "Not set yet"}
              </strong>
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
          </motion.button>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Payout destination</h2>
              <p className="profileSection__sub">
                After the customer confirms completion, payout is queued for ops release using these saved details. New listings also need this destination before they can be published.
              </p>
            </div>
          </div>

          <form className="customerSettingsForm" onSubmit={handlePayoutSave}>
            <div className="customerSettingsForm__row">
              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Payout method</span>
                <input
                  className="customerSettingsField__control"
                  type="text"
                  placeholder="gcash, maya, or bank_transfer"
                  value={payoutValues.payoutMethod}
                  onChange={(event) =>
                    setPayoutValues((prev) => ({
                      ...prev,
                      payoutMethod: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Account name</span>
                <input
                  className="customerSettingsField__control"
                  type="text"
                  placeholder="Name on the payout account"
                  value={payoutValues.accountName}
                  onChange={(event) =>
                    setPayoutValues((prev) => ({
                      ...prev,
                      accountName: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="customerSettingsField">
              <span className="customerSettingsField__label">Account reference</span>
              <input
                className="customerSettingsField__control"
                type="text"
                placeholder="Account number, wallet number, or bank reference"
                value={payoutValues.accountReference}
                onChange={(event) =>
                  setPayoutValues((prev) => ({
                    ...prev,
                    accountReference: event.target.value,
                  }))
                }
              />
            </label>

            <AnimatePresence mode="wait">
              {payoutState.error ? (
                <motion.div
                  className="customerSettingsStatus customerSettingsStatus--danger"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {payoutState.error}
                </motion.div>
              ) : payoutState.success ? (
                <motion.div
                  className="customerSettingsStatus customerSettingsStatus--success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {payoutState.success}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="customerSettingsActionsRow">
              <motion.button
                type="submit"
                className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                disabled={payoutState.pending}
              >
                <span>{payoutState.pending ? "Saving..." : "Save payout method"}</span>
              </motion.button>

              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/orders")}
              >
                Open orders
              </motion.button>
            </div>
          </form>
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Account actions</h2>
              <p className="profileSection__sub">
                Sign out when you are done working on this device.
              </p>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Sign out</span>
              <strong className="freelancerDataValue--strong">End this session</strong>
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
