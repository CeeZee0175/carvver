import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "./freelancer_pages.css";
import "./dashboard_freelancer.css";
import "./freelancer_marketplace.css";
import {
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useFreelancerProfileData } from "../hooks/useFreelancerProfileData";
import { useFreelancerRequestPreview } from "../hooks/useFreelancerRequestMarketplace";

const SURFACE_MOTION = {
  whileHover: { y: -3, scale: 1.006 },
  whileTap: { scale: 0.988 },
  transition: { type: "spring", stiffness: 320, damping: 22, mass: 0.76 },
};

export default function DashboardFreelancer() {
  const navigate = useNavigate();
  const { profile, warning, displayName, locationLabel, reload } =
    useFreelancerProfileData();
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useFreelancerRequestPreview(3);

  const primaryCategory = String(profile?.freelancer_primary_category || "").trim();

  const quickLinks = [
    {
      label: "Profile",
      description: "Update the way customers see your name, bio, and location.",
      action: () => navigate("/dashboard/freelancer/profile"),
    },
    {
      label: "Settings",
      description: "Manage your account details, billing, and sign-in controls.",
      action: () => navigate("/dashboard/freelancer/settings"),
    },
    {
      label: "Messages",
      description: "Pick up customer conversations and reply without losing context.",
      action: () => navigate("/dashboard/freelancer/messages"),
    },
  ];

  const workspaceItems = [
    {
      title: "Browse request listings",
      description: "Review customer briefs, references, and budgets in one marketplace view.",
      action: () => navigate("/dashboard/freelancer/browse-requests"),
      cta: "Open requests",
    },
    {
      title: "My listings",
      description: "Manage drafts, published work, and the marketplace pages customers already see.",
      action: () => navigate("/dashboard/freelancer/listings"),
      cta: "Manage listings",
    },
    {
      title: "Post a listing",
      description: "Build packages, add media, and publish new work customers can browse.",
      action: () => navigate("/dashboard/freelancer/post-listing"),
      cta: "Create listing",
    },
    {
      title: "Open messages",
      description: "Jump straight into customer conversations without leaving your workspace.",
      action: () => navigate("/dashboard/freelancer/messages"),
      cta: "Open inbox",
    },
    {
      title: "Orders",
      description: "Track held and released earnings while keeping customer work moving.",
      action: () => navigate("/dashboard/freelancer/orders"),
      cta: "View orders",
    },
  ];

  const exploreCards = [
    {
      title: "Community",
      description: "See updates, stories, and the people growing with Carvver.",
      to: "/community",
    },
    {
      title: "Pricing",
      description: "Review Carvver Pro and the platform options around it.",
      to: "/pricing",
    },
    {
      title: "About Us",
      description: "Learn more about the team and the platform behind your work.",
      to: "/about-us",
    },
  ];

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage freelancerDashboardPage">
      <Reveal delay={0.04}>
        <section className="profileHero freelancerDashboardHero">
          <div className="profileHero__heading freelancerDashboardHero__heading">
            <div className="profileHero__titleWrap freelancerDashboardHero__titleWrap">
              <h1 className="profileHero__title">
                <span className="freelancerDashboardHero__titleText">
                  <TypewriterHeading text="Welcome Back!" />
                </span>
              </h1>
              <motion.svg
                className="profileHero__line freelancerDashboardHero__line"
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

            <p className="profileHero__sub freelancerDashboardHero__sub">
              Keep your listings moving, stay close to customer requests, and open the conversations that turn into work.
            </p>

            <div className="profileEditor__actions freelancerDashboard__heroActions">
              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--primary freelancerDashboardHero__primary"
                {...SURFACE_MOTION}
                onClick={() => navigate("/dashboard/freelancer/post-listing")}
              >
                Post a listing
              </motion.button>
              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost"
                {...SURFACE_MOTION}
                onClick={() => navigate("/dashboard/freelancer/messages")}
              >
                Open messages
              </motion.button>
            </div>

            <div className="freelancerDashboardHero__facts">
              <div className="freelancerDashboardHero__fact">
                <span className="freelancerDashboardHero__factLabel">Display name</span>
                <strong className="freelancerDashboardHero__factValue">{displayName}</strong>
              </div>
              <div className="freelancerDashboardHero__fact">
                <span className="freelancerDashboardHero__factLabel">Main category</span>
                <strong className="freelancerDashboardHero__factValue">
                  {primaryCategory || "Choose your main category"}
                </strong>
              </div>
              <div className="freelancerDashboardHero__fact">
                <span className="freelancerDashboardHero__factLabel">Location</span>
                <strong className="freelancerDashboardHero__factValue">
                  {locationLabel === "No location added yet"
                    ? "Add your location"
                    : locationLabel}
                </strong>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {warning && !profile ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              title="We couldn't load your freelancer dashboard"
              description={warning}
              actionLabel="Try again"
              onAction={reload}
              className="profileEmpty--iconless"
              hideIcon
            />
          </section>
        </Reveal>
      ) : null}

      {profile ? (
        <>
          <Reveal delay={0.08}>
            <section className="profileSection freelancerDashboardQuickLinks">
              <div className="profileSection__head freelancerDashboardSection__head">
                <div>
                  <h2 className="profileSection__title">Quick access</h2>
                  <p className="profileSection__sub">
                    Move between the freelancer pages you open most often.
                  </p>
                </div>
              </div>

              <div className="freelancerDashboardQuickLinks__grid">
                {quickLinks.map((item) => (
                  <motion.button
                    key={item.label}
                    type="button"
                    className="freelancerDashboardQuickLinks__item"
                    {...SURFACE_MOTION}
                    onClick={item.action}
                  >
                    <span className="freelancerDashboardQuickLinks__label">{item.label}</span>
                    <p className="freelancerDashboardQuickLinks__desc">{item.description}</p>
                  </motion.button>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="profileSection freelancerDashboardSection">
              <div className="profileSection__head freelancerDashboardSection__head">
                <div>
                  <h2 className="profileSection__title">Your workspace</h2>
                  <p className="profileSection__sub">
                    Keep your listings, request browsing, and inbox connected in one place.
                  </p>
                </div>
              </div>

              <div className="freelancerDashboardWorkspace">
                {workspaceItems.map((item) => (
                  <motion.button
                    key={item.title}
                    type="button"
                    className="freelancerDashboardWorkspace__item"
                    {...SURFACE_MOTION}
                    onClick={item.action}
                  >
                    <strong className="freelancerDashboardWorkspace__title">
                      {item.title}
                    </strong>
                    <p className="freelancerDashboardWorkspace__desc">
                      {item.description}
                    </p>
                    <span className="freelancerDashboardWorkspace__cta">{item.cta}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.16}>
            <section className="profileSection freelancerDashboardSection">
              <div className="profileSection__head freelancerDashboardSection__head">
                <div>
                  <h2 className="profileSection__title">Browse request listings</h2>
                  <p className="profileSection__sub">
                    Review recent customer briefs and open the ones that fit your work.
                  </p>
                </div>

                <motion.button
                  type="button"
                  className="profileSection__linkBtn"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SURFACE_MOTION.transition}
                  onClick={() => navigate("/dashboard/freelancer/browse-requests")}
                >
                  Browse all
                </motion.button>
              </div>

              {requestsError ? (
                <EmptySurface
                  hideIcon
                  title="We couldn't load request listings"
                  description={requestsError}
                  actionLabel="Try again"
                  onAction={reloadRequests}
                  className="freelancerRequestEmpty"
                />
              ) : requestsLoading ? (
                <div className="freelancerRequestGrid freelancerRequestGrid--preview">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="freelancerRequestCard" style={{ minHeight: 400 }} />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No request listings yet"
                  actionLabel="Open request marketplace"
                  onAction={() => navigate("/dashboard/freelancer/browse-requests")}
                  className="freelancerRequestEmpty"
                />
              ) : (
                <div className="freelancerRequestGrid freelancerRequestGrid--preview">
                  {requests.map((request, index) => (
                    <motion.article
                      key={request.id}
                      className="freelancerRequestCard"
                      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.34, delay: index * 0.05 }}
                    >
                      <div className="freelancerRequestCard__media">
                        {request.previewMedia?.publicUrl ? (
                          request.previewMedia.media_kind === "video" ? (
                            <video src={request.previewMedia.publicUrl} muted playsInline />
                          ) : (
                            <img src={request.previewMedia.publicUrl} alt={request.title} />
                          )
                        ) : (
                          <div className="freelancerRequestCard__mediaFallback">
                            Customer references will show here when media is attached.
                          </div>
                        )}
                      </div>

                      <div className="freelancerRequestCard__body">
                        <div className="freelancerRequestCard__meta">
                          <span className="freelancerRequestCard__chip">{request.category}</span>
                          <span className="freelancerRequestCard__chip">{request.budgetLabel}</span>
                        </div>

                        <span className="freelancerRequestCard__label">Recent request</span>
                        <h3 className="freelancerRequestCard__title">{request.title}</h3>
                        <p className="freelancerRequestCard__desc">{request.description}</p>

                        <div className="freelancerRequestCard__footer">
                          <div className="freelancerRequestCard__customer">
                            <strong className="freelancerRequestCard__customerName">
                              {request.customer.displayName}
                            </strong>
                            <span className="freelancerRequestCard__customerMetaText">
                              {request.locationLabel}
                            </span>
                          </div>

                          <motion.button
                            type="button"
                            className="freelancerRequestCard__btn"
                            whileHover={{ y: -1.5 }}
                            whileTap={{ scale: 0.98 }}
                            transition={SURFACE_MOTION.transition}
                            onClick={() =>
                              navigate(`/dashboard/freelancer/browse-requests/${request.id}`)
                            }
                          >
                            View request
                          </motion.button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal delay={0.2}>
            <section className="profileSection freelancerDashboardSection">
              <div className="profileSection__head freelancerDashboardSection__head">
                <div>
                  <h2 className="profileSection__title">Explore Carvver</h2>
                  <p className="profileSection__sub">
                    Keep the wider platform pages close while you work inside the dashboard.
                  </p>
                </div>
              </div>

              <div className="freelancerExploreGrid freelancerDashboardExploreGrid">
                {exploreCards.map((card) => (
                  <motion.button
                    key={card.title}
                    type="button"
                    className="freelancerExploreCard freelancerDashboardExploreCard"
                    {...SURFACE_MOTION}
                    onClick={() => navigate(card.to)}
                  >
                    <div className="freelancerExploreCard__copy">
                      <strong className="freelancerExploreCard__title">{card.title}</strong>
                      <p className="freelancerExploreCard__desc">{card.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          </Reveal>
        </>
      ) : null}
    </FreelancerDashboardFrame>
  );
}
