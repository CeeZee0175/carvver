import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Settings, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DashboardBreadcrumbs,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./profile.css";
import "./freelancer_pages.css";

export default function FreelancerMessages() {
  const navigate = useNavigate();

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Messages" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <p className="profileHero__eyebrow">Freelancer Messages</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Messages" />
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
              This is where your conversations will stay in one place.
            </p>
          </div>

          <div className="freelancerHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Inbox</span>
              <strong className="profileMiniStat__value">0</strong>
              <span className="profileMiniStat__hint">No conversations yet</span>
            </div>

            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Unread</span>
              <strong className="profileMiniStat__value">0</strong>
              <span className="profileMiniStat__hint">Nothing waiting on you</span>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="profileSection">
          <div className="freelancerMessageEmpty">
            <h2 className="freelancerMessageEmpty__title">Your inbox is empty</h2>
            <p className="freelancerMessageEmpty__desc">
              When conversations arrive, they will appear here in one clean place.
            </p>

            <div className="freelancerMessageEmpty__actions">
              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--primary"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/profile")}
              >
                <UserRound className="profileEditor__btnIcon" />
                <span>View profile</span>
              </motion.button>

              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/settings")}
              >
                <Settings className="profileEditor__btnIcon" />
                <span>Open settings</span>
              </motion.button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <p className="profileSection__eyebrow">Quick links</p>
              <h2 className="profileSection__title">Keep the next steps close</h2>
            </div>
          </div>

          <div className="freelancerExploreGrid">
            {[
              {
                title: "Back to dashboard",
                desc: "Return to your freelancer overview.",
                to: "/dashboard/freelancer",
              },
              {
                title: "Profile",
                desc: "Review the details clients will see first.",
                to: "/dashboard/freelancer/profile",
              },
              {
                title: "Pricing",
                desc: "Look through Carvver Pro pricing.",
                to: "/pricing",
              },
            ].map((item) => (
              <motion.button
                key={item.title}
                type="button"
                className="freelancerExploreCard"
                whileHover={{ y: -4, scale: 1.012 }}
                whileTap={{ scale: 0.986 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate(item.to)}
              >
                <div className="freelancerExploreCard__copy">
                  <strong className="freelancerExploreCard__title">{item.title}</strong>
                  <p className="freelancerExploreCard__desc">{item.desc}</p>
                </div>
                <span className="freelancerExploreCard__iconWrap" aria-hidden="true">
                  <ArrowRight className="freelancerExploreCard__arrow" />
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
