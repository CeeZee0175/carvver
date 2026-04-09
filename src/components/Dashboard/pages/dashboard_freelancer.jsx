import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Link as LinkIcon,
  LogOut,
  MapPin,
  Search,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import HomeFooter from "../../Homepage/layout/home_footer";
import { Component as EtheralShadow } from "../../StartUp/shared/etheral-shadow";
import { getProfile, signOut } from "../../../lib/supabase/auth";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import "./dashboard_freelancer.css";

const SPRING = { type: "spring", stiffness: 320, damping: 26 };

function TypewriterHeading({ text }) {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(reduceMotion ? text : "");

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    let timeoutId;
    let index = 0;

    setDisplayText("");

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = setTimeout(tick, 58);
    };

    timeoutId = setTimeout(tick, 90);
    return () => clearTimeout(timeoutId);
  }, [reduceMotion, text]);

  return (
    <span>
      {displayText}
      {!reduceMotion && displayText.length < text.length ? (
        <motion.span
          className="freelancerDash__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      ) : null}
    </span>
  );
}

function SummaryCard({ label, value, hint }) {
  return (
    <article className="freelancerDash__summaryCard">
      <span className="freelancerDash__summaryLabel">{label}</span>
      <strong className="freelancerDash__summaryValue">{value}</strong>
      <span className="freelancerDash__summaryHint">{hint}</span>
    </article>
  );
}

function DetailItem({ label, value, wide = false, children }) {
  return (
    <article
      className={`freelancerDash__detailItem ${
        wide ? "freelancerDash__detailItem--wide" : ""
      }`}
    >
      <span className="freelancerDash__detailLabel">{label}</span>
      {children || <p className="freelancerDash__detailValue">{value}</p>}
    </article>
  );
}

export default function DashboardFreelancer() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const nextProfile = await getProfile();
        if (!active) return;
        setProfile(nextProfile);
      } catch {
        if (!active) return;
        setError("We couldn't load your freelancer dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const rawDisplayName = String(profile?.display_name || "").trim();
  const displayName =
    rawDisplayName || String(profile?.first_name || "").trim() || "Freelancer";
  const headline = String(profile?.freelancer_headline || "").trim();
  const primaryCategory = String(profile?.freelancer_primary_category || "").trim();
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];
  const experienceLevel = String(
    profile?.freelancer_experience_level || ""
  ).trim();
  const portfolioUrl = String(profile?.freelancer_portfolio_url || "").trim();
  const locationLabel =
    buildPhilippinesLocationLabel({
      region: String(profile?.region || "").trim(),
      city: String(profile?.city || "").trim(),
      barangay: String(profile?.barangay || "").trim(),
    }) ||
    String(profile?.address || "").trim() ||
    "No location added yet";

  const readinessItems = useMemo(
    () => [
      { label: "Display name", complete: Boolean(rawDisplayName) },
      { label: "Headline", complete: Boolean(headline) },
      { label: "Main category", complete: Boolean(primaryCategory) },
      { label: "Specialties", complete: specialties.length > 0 },
      { label: "Experience level", complete: Boolean(experienceLevel) },
      { label: "Portfolio link", complete: Boolean(portfolioUrl) },
      { label: "Location", complete: locationLabel !== "No location added yet" },
    ],
    [
      experienceLevel,
      headline,
      locationLabel,
      portfolioUrl,
      primaryCategory,
      rawDisplayName,
      specialties.length,
    ]
  );

  const readinessCompleted = readinessItems.filter((item) => item.complete).length;
  const readinessPercent = Math.round(
    (readinessCompleted / readinessItems.length) * 100
  );
  const readinessLabel =
    readinessPercent >= 100
      ? "Profile ready"
      : readinessPercent >= 60
      ? "Strong start"
      : "Getting started";

  const summary = useMemo(
    () => [
      {
        label: "Profile readiness",
        value: `${readinessPercent}%`,
        hint: `${readinessCompleted} of ${readinessItems.length} profile details saved`,
      },
      {
        label: "Main category",
        value: primaryCategory || "Not set yet",
        hint: "Your main service category",
      },
      {
        label: "Specialties",
        value: specialties.length > 0 ? String(specialties.length) : "0",
        hint:
          specialties.length > 0
            ? specialties.slice(0, 2).join(" / ")
            : "Choose up to five specialties",
      },
      {
        label: "Experience",
        value: experienceLevel || "Not set yet",
        hint: "How you present your current level",
      },
    ],
    [
      experienceLevel,
      primaryCategory,
      readinessCompleted,
      readinessItems.length,
      readinessPercent,
      specialties,
    ]
  );

  const freelancerTools = [
    {
      title: "Browse customer requests",
      description:
        "A dedicated place to review customer briefs when request browsing opens for freelancers.",
      Icon: Search,
    },
    {
      title: "Social media posting",
      description:
        "A faster way to share your service across platforms from one organized place.",
      Icon: Share2,
    },
  ];

  const exploreCards = [
    {
      title: "Community",
      description:
        "See highlights, updates, and the people helping shape Carvver.",
      to: "/community",
    },
    {
      title: "Pricing",
      description:
        "Review Carvver Pro and see how added visibility tools fit your work.",
      to: "/pricing",
    },
    {
      title: "About Us",
      description:
        "Learn more about the people and ideas behind the platform.",
      to: "/about-us",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      navigate("/sign-in", { replace: true });
    }
  };

  return (
    <div className="freelancerDash">
      <div className="freelancerDash__base" />
      <div className="freelancerDash__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="freelancerDash__bg" aria-hidden="true" />

      <header className="freelancerDash__bar">
        <div className="freelancerDash__barInner">
          <Link to="/" className="freelancerDash__brand">
            Carvver
          </Link>

          <nav className="freelancerDash__nav">
            <Link to="/about-us">About Us</Link>
            <Link to="/community">Community</Link>
            <Link to="/pricing">Pricing</Link>
          </nav>

          <motion.button
            type="button"
            className="freelancerDash__signOut"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            onClick={handleSignOut}
          >
            <LogOut className="freelancerDash__signOutIcon" />
            <span>Sign out</span>
          </motion.button>
        </div>
      </header>

      <main className="freelancerDash__main">
        <section className="freelancerDash__hero">
          <div className="freelancerDash__heroGrid">
            <div className="freelancerDash__heroCopy">
              <span className="freelancerDash__eyebrow">Freelancer Dashboard</span>
              <h1 className="freelancerDash__title">
                <TypewriterHeading text={`Welcome, ${displayName}`} />
              </h1>
              <p className="freelancerDash__sub">
                Keep your freelancer details in one place, review how your work
                is presented, and stay ready for the tools built around your
                profile.
              </p>

              <div className="freelancerDash__heroActions">
                <motion.button
                  type="button"
                  className="freelancerDash__action freelancerDash__action--primary"
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  transition={SPRING}
                  onClick={() => navigate("/community")}
                >
                  <span>View community</span>
                  <ArrowRight className="freelancerDash__actionIcon" />
                </motion.button>

                <motion.button
                  type="button"
                  className="freelancerDash__action freelancerDash__action--ghost"
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  transition={SPRING}
                  onClick={() => navigate("/pricing")}
                >
                  See Carvver Pro
                </motion.button>
              </div>
            </div>

            <div className="freelancerDash__heroSignal">
              <span className="freelancerDash__heroBadge">
                <Sparkles className="freelancerDash__heroBadgeIcon" />
                {readinessLabel}
              </span>
              <strong className="freelancerDash__heroSignalValue">
                {readinessPercent}%
              </strong>
              <p className="freelancerDash__heroSignalText">
                {readinessCompleted} of {readinessItems.length} profile details
                are already saved from your welcome flow.
              </p>
            </div>
          </div>
        </section>

        <section className="freelancerDash__band">
          <div className="freelancerDash__sectionHead">
            <div>
              <span className="freelancerDash__sectionEyebrow">Overview</span>
              <h2 className="freelancerDash__sectionTitle">
                Your freelancer snapshot
              </h2>
            </div>
          </div>

          {loading ? (
            <p className="freelancerDash__sectionText">
              Loading your dashboard...
            </p>
          ) : error ? (
            <div className="freelancerDash__messageBlock">
              <h3 className="freelancerDash__messageTitle">
                We couldn&apos;t load this page
              </h3>
              <p className="freelancerDash__sectionText">{error}</p>
              <motion.button
                type="button"
                className="freelancerDash__retry"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={SPRING}
                onClick={() => window.location.reload()}
              >
                Try again
              </motion.button>
            </div>
          ) : (
            <div className="freelancerDash__summaryGrid">
              {summary.map((item) => (
                <SummaryCard key={item.label} {...item} />
              ))}
            </div>
          )}
        </section>

        {!loading && !error ? (
          <>
            <section className="freelancerDash__band">
              <div className="freelancerDash__sectionHead">
                <div>
                  <span className="freelancerDash__sectionEyebrow">
                    What you offer
                  </span>
                  <h2 className="freelancerDash__sectionTitle">
                    The details saved on your profile
                  </h2>
                  <p className="freelancerDash__sectionText">
                    This view brings together the headline, specialties, and
                    location people will use to understand your work.
                  </p>
                </div>
              </div>

              <div className="freelancerDash__detailGrid">
                <DetailItem
                  label="Display name"
                  value={rawDisplayName || "No display name added yet."}
                />
                <DetailItem
                  label="Professional headline"
                  value={headline || "No headline added yet."}
                />
                <DetailItem
                  label="Main category"
                  value={primaryCategory || "No main category added yet."}
                />
                <DetailItem
                  label="Experience level"
                  value={experienceLevel || "No experience level added yet."}
                />
                <DetailItem label="Portfolio link">
                  {portfolioUrl ? (
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="freelancerDash__detailLink"
                    >
                      <LinkIcon className="freelancerDash__detailLinkIcon" />
                      <span>Open portfolio</span>
                    </a>
                  ) : (
                    <p className="freelancerDash__detailValue">
                      No portfolio link added yet.
                    </p>
                  )}
                </DetailItem>
                <DetailItem label="Location" value={locationLabel} />
                <DetailItem label="Specialties" wide>
                  {specialties.length > 0 ? (
                    <div className="freelancerDash__chips">
                      {specialties.map((specialty) => (
                        <span key={specialty} className="freelancerDash__chip">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="freelancerDash__detailValue">
                      No specialties added yet.
                    </p>
                  )}
                </DetailItem>
              </div>
            </section>

            <section className="freelancerDash__band">
              <div className="freelancerDash__sectionHead">
                <div>
                  <span className="freelancerDash__sectionEyebrow">
                    Freelancer tools
                  </span>
                  <h2 className="freelancerDash__sectionTitle">
                    A quick look at what is being prepared
                  </h2>
                  <p className="freelancerDash__sectionText">
                    These tools belong here, but they are not available to open
                    yet.
                  </p>
                </div>
              </div>

              <div className="freelancerDash__toolGrid">
                {freelancerTools.map((tool) => {
                  const Icon = tool.Icon;
                  return (
                    <article key={tool.title} className="freelancerDash__toolCard">
                      <div className="freelancerDash__toolTop">
                        <span
                          className="freelancerDash__toolIconWrap"
                          aria-hidden="true"
                        >
                          <Icon className="freelancerDash__toolIcon" />
                        </span>
                        <span className="freelancerDash__toolBadge">
                          Not available yet
                        </span>
                      </div>
                      <h3 className="freelancerDash__toolTitle">{tool.title}</h3>
                      <p className="freelancerDash__sectionText">
                        {tool.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="freelancerDash__band">
              <div className="freelancerDash__sectionHead">
                <div>
                  <span className="freelancerDash__sectionEyebrow">
                    Profile readiness
                  </span>
                  <h2 className="freelancerDash__sectionTitle">
                    A simple view of what is already in place
                  </h2>
                </div>
              </div>

              <div className="freelancerDash__readiness">
                <div className="freelancerDash__readinessTop">
                  <div>
                    <strong className="freelancerDash__readinessValue">
                      {readinessPercent}%
                    </strong>
                    <p className="freelancerDash__sectionText">
                      {readinessLabel} based on the profile details already
                      saved.
                    </p>
                  </div>

                  <span className="freelancerDash__readinessPill">
                    <Star className="freelancerDash__readinessPillIcon" />
                    {readinessCompleted} complete
                  </span>
                </div>

                <div className="freelancerDash__progressTrack" aria-hidden="true">
                  <motion.span
                    className="freelancerDash__progressFill"
                    initial={{ width: 0 }}
                    animate={{ width: `${readinessPercent}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="freelancerDash__readinessGrid">
                  {readinessItems.map((item) => (
                    <div
                      key={item.label}
                      className={`freelancerDash__readinessItem ${
                        item.complete ? "freelancerDash__readinessItem--done" : ""
                      }`}
                    >
                      <span className="freelancerDash__readinessDot" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="freelancerDash__band">
              <div className="freelancerDash__sectionHead">
                <div>
                  <span className="freelancerDash__sectionEyebrow">Explore</span>
                  <h2 className="freelancerDash__sectionTitle">
                    More pages around Carvver
                  </h2>
                </div>
              </div>

              <div className="freelancerDash__exploreGrid">
                {exploreCards.map((card, index) => (
                  <motion.button
                    key={card.title}
                    type="button"
                    className="freelancerDash__exploreCard"
                    whileHover={reduceMotion ? undefined : { y: -3, x: 1 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ ...SPRING, delay: index * 0.04 }}
                    onClick={() => navigate(card.to)}
                  >
                    <div className="freelancerDash__exploreCopy">
                      <span className="freelancerDash__sectionEyebrow">
                        Explore
                      </span>
                      <strong className="freelancerDash__exploreTitle">
                        {card.title}
                      </strong>
                      <p className="freelancerDash__sectionText">
                        {card.description}
                      </p>
                    </div>
                    <span className="freelancerDash__exploreArrowWrap">
                      <ArrowRight className="freelancerDash__exploreArrow" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>

      <section className="freelancerDash__footer">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}
