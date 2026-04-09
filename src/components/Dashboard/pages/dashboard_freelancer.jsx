import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link as LinkIcon,
  MessageCircle,
  Search,
  Settings,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "./freelancer_pages.css";
import "./dashboard_freelancer.css";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useFreelancerProfileData } from "../hooks/useFreelancerProfileData";

const SURFACE_MOTION = {
  whileHover: { y: -4, scale: 1.012 },
  whileTap: { scale: 0.986 },
  transition: { type: "spring", stiffness: 320, damping: 19, mass: 0.74 },
};

export default function DashboardFreelancer() {
  const navigate = useNavigate();
  const {
    loading,
    profile,
    warning,
    displayName,
    locationLabel,
    tasks,
    completion,
    reload,
  } = useFreelancerProfileData();

  const headline = String(profile?.freelancer_headline || "").trim();
  const primaryCategory = String(profile?.freelancer_primary_category || "").trim();
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];
  const experienceLevel = String(
    profile?.freelancer_experience_level || ""
  ).trim();
  const portfolioUrl = String(profile?.freelancer_portfolio_url || "").trim();

  const readinessLabel =
    completion.percent >= 100
      ? "Ready to share"
      : completion.percent >= 70
      ? "Looking strong"
      : "Still building";

  const summaryCards = [
    {
      label: "Profile readiness",
      value: loading ? "..." : `${completion.percent}%`,
      hint: `${completion.completed} of ${completion.total} key details saved`,
    },
    {
      label: "Main category",
      value: loading ? "..." : primaryCategory || "Not set yet",
      hint: primaryCategory
        ? "How people place your work quickly"
        : "Choose your main service area",
    },
    {
      label: "Specialties",
      value: loading ? "..." : specialties.length ? String(specialties.length) : "0",
      hint:
        specialties.length > 0
          ? specialties.slice(0, 2).join(" / ")
          : "Add up to five specialties",
    },
    {
      label: "Location",
      value:
        loading || locationLabel === "No location added yet"
          ? loading
            ? "..."
            : "Missing"
          : "Set",
      hint:
        locationLabel === "No location added yet"
          ? "Add your region, city, and barangay"
          : locationLabel,
    },
  ];

  const quickActions = [
    {
      label: "Profile",
      desc: "Update the details people will see first.",
      Icon: UserRound,
      action: () => navigate("/dashboard/freelancer/profile"),
    },
    {
      label: "Settings",
      desc: "Review account details and session actions.",
      Icon: Settings,
      action: () => navigate("/dashboard/freelancer/settings"),
    },
    {
      label: "Messages",
      desc: "Keep your inbox close once conversations begin.",
      Icon: MessageCircle,
      action: () => navigate("/dashboard/freelancer/messages"),
    },
  ];

  const toolTeasers = [
    {
      title: "Browse customer requests",
      description: "A dedicated place to review customer briefs.",
      Icon: Search,
    },
    {
      title: "Social media posting",
      description: "A simpler place to prepare your service posts and promotions.",
      Icon: Share2,
    },
  ];

  const exploreCards = [
    {
      title: "Community",
      description: "See updates, stories, and the people around Carvver.",
      to: "/community",
    },
    {
      title: "Pricing",
      description: "Review Carvver Pro and what comes with it.",
      to: "/pricing",
    },
    {
      title: "About Us",
      description: "Learn more about the team and the platform itself.",
      to: "/about-us",
    },
  ];

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Freelancer Dashboard" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <p className="profileHero__eyebrow">Freelancer Dashboard</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Welcome Back!" />
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
              Review your profile, keep your details updated, and keep the main
              freelancer pages close.
            </p>

            <div className="profileEditor__actions freelancerDashboard__heroActions">
              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--primary"
                {...SURFACE_MOTION}
                onClick={() => navigate("/dashboard/freelancer/profile")}
              >
                <UserRound className="profileEditor__btnIcon" />
                <span>View profile</span>
              </motion.button>

              <motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost"
                {...SURFACE_MOTION}
                onClick={() => navigate("/dashboard/freelancer/messages")}
              >
                <MessageCircle className="profileEditor__btnIcon" />
                <span>Open messages</span>
              </motion.button>
            </div>
          </div>

          <div className="freelancerHero__stats">
            {summaryCards.map((card) => (
              <motion.article
                key={card.label}
                className="profileMiniStat"
                {...SURFACE_MOTION}
              >
                <span className="profileMiniStat__label">{card.label}</span>
                <strong className="profileMiniStat__value">{card.value}</strong>
                <span className="profileMiniStat__hint">{card.hint}</span>
              </motion.article>
            ))}
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
            <section className="profileNavBand">
              {quickActions.map((item) => {
                const Icon = item.Icon;

                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    className="profileNavBand__item"
                    {...SURFACE_MOTION}
                    onClick={item.action}
                  >
                    <Icon className="profileNavBand__icon" />
                    <span className="profileNavBand__label">{item.label}</span>
                    <span className="profileNavBand__desc">{item.desc}</span>
                  </motion.button>
                );
              })}
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="profileSection">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">At a glance</p>
                  <h2 className="profileSection__title">What people will see first</h2>
                </div>
                <span className="freelancerPill freelancerPill--gold">
                  <Sparkles className="profileIdentity__chipIcon" />
                  {readinessLabel}
                </span>
              </div>

              <div className="freelancerDataGrid">
                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Display name</span>
                  <p className="freelancerDataValue freelancerDataValue--strong">
                    {displayName}
                  </p>
                </article>

                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Professional headline</span>
                  <p className="freelancerDataValue">
                    {headline || "No headline added yet"}
                  </p>
                </article>

                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Main category</span>
                  <p className="freelancerDataValue">
                    {primaryCategory || "No main category added yet"}
                  </p>
                </article>

                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Experience level</span>
                  <p className="freelancerDataValue">
                    {experienceLevel || "No experience level added yet"}
                  </p>
                </article>

                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Portfolio</span>
                  {portfolioUrl ? (
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="freelancerDataValue freelancerDataValue--link"
                    >
                      <LinkIcon className="profileEditor__btnIcon" />
                      <span>Open portfolio</span>
                    </a>
                  ) : (
                    <p className="freelancerDataValue">No portfolio link added yet</p>
                  )}
                </article>

                <article className="freelancerDataItem">
                  <span className="freelancerDataLabel">Location</span>
                  <p className="freelancerDataValue">{locationLabel}</p>
                </article>

                <article className="freelancerDataItem" style={{ gridColumn: "1 / -1" }}>
                  <span className="freelancerDataLabel">Specialties</span>
                  {specialties.length > 0 ? (
                    <div className="freelancerChipRow">
                      {specialties.map((specialty) => (
                        <span key={specialty} className="freelancerChip">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="freelancerDataValue">No specialties added yet</p>
                  )}
                </article>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.16}>
            <section className="profileSection">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">Profile readiness</p>
                  <h2 className="profileSection__title">What still strengthens your page</h2>
                </div>
                <div className="profileProgress__meta">
                  <strong>{completion.completed}</strong>
                  <span>/ {completion.total} complete</span>
                </div>
              </div>

              <div className="profileProgress">
                <div className="profileProgress__bar">
                  <span
                    className="profileProgress__barFill"
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>

                <div className="profileProgress__grid">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`profileTask ${task.complete ? "profileTask--complete" : ""}`}
                    >
                      <span className="profileTask__status" aria-hidden="true" />
                      <div className="profileTask__copy">
                        <strong className="profileTask__label">{task.label}</strong>
                        <p className="profileTask__detail">{task.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.2}>
            <section className="profileSection">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">Freelancer tools</p>
                  <h2 className="profileSection__title">Tools that will live here</h2>
                  <p className="freelancerInfoNote">
                    These tools are listed here, but they are not open yet.
                  </p>
                </div>
              </div>

              <div className="freelancerTeaserGrid">
                {toolTeasers.map((tool) => {
                  const Icon = tool.Icon;

                  return (
                    <article key={tool.title} className="freelancerTeaserCard">
                      <div className="freelancerTeaserCard__top">
                        <span className="freelancerTeaserCard__iconWrap" aria-hidden="true">
                          <Icon className="freelancerTeaserCard__icon" />
                        </span>
                        <span className="freelancerTeaserBadge">Not available yet</span>
                      </div>

                      <div className="freelancerTeaserCard__copy">
                        <strong className="freelancerTeaserCard__title">
                          {tool.title}
                        </strong>
                        <p className="freelancerTeaserCard__desc">
                          {tool.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.24}>
            <section className="profileSection">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">Around Carvver</p>
                  <h2 className="profileSection__title">More pages worth checking</h2>
                </div>
              </div>

              <div className="freelancerExploreGrid">
                {exploreCards.map((card) => (
                  <motion.button
                    key={card.title}
                    type="button"
                    className="freelancerExploreCard"
                    {...SURFACE_MOTION}
                    onClick={() => navigate(card.to)}
                  >
                    <div className="freelancerExploreCard__copy">
                      <strong className="freelancerExploreCard__title">
                        {card.title}
                      </strong>
                      <p className="freelancerExploreCard__desc">
                        {card.description}
                      </p>
                    </div>
                    <span className="freelancerExploreCard__iconWrap" aria-hidden="true">
                      <ArrowRight className="freelancerExploreCard__arrow" />
                    </span>
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
