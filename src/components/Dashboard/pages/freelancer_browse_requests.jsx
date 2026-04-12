import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "./freelancer_pages.css";
import "./freelancer_marketplace.css";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  useFreelancerRequestFilters,
  useFreelancerRequestMarketplace,
} from "../hooks/useFreelancerRequestMarketplace";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Nearest deadline", value: "deadline" },
  { label: "Highest budget", value: "budget_desc" },
  { label: "Lowest budget", value: "budget_asc" },
];

function RequestCard({ request, onOpen, index = 0 }) {
  return (
    <motion.article
      className="freelancerRequestCard"
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.34, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
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
          <span className="freelancerRequestCard__chip">{request.deadlineLabel}</span>
        </div>

        <span className="freelancerRequestCard__label">Request listing</span>
        <h2 className="freelancerRequestCard__title">{request.title}</h2>
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
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            View request
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default function FreelancerBrowseRequests() {
  const navigate = useNavigate();
  const { loading, requests, error, reload } = useFreelancerRequestMarketplace();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  const categoryOptions = useMemo(
    () => ["All", ...Array.from(new Set(requests.map((item) => item.category).filter(Boolean)))],
    [requests]
  );
  const filteredRequests = useFreelancerRequestFilters(requests, {
    search,
    category,
    sort,
  });

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerMarketplacePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Browse request listings" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="freelancerMarketplaceHero">
          <div className="freelancerMarketplaceHero__top">
            <div className="freelancerMarketplaceHero__copy">
              <div className="freelancerMarketplaceHero__titleWrap">
                <h1 className="freelancerMarketplaceHero__title">
                  <TypewriterHeading text="Browse request listings" />
                </h1>
                <motion.svg
                  className="freelancerMarketplaceHero__line"
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
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.14 }}
                  />
                </motion.svg>
              </div>

              <p className="freelancerMarketplaceHero__sub">
                Review recent customer briefs, scan attached references, and open the conversations that fit your work best.
              </p>
            </div>

            <div className="freelancerMarketplaceHero__actions">
              <motion.button
                type="button"
                className="freelancerMarketplaceHero__action"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/post-listing")}
              >
                Post a listing
              </motion.button>

              <motion.button
                type="button"
                className="freelancerMarketplaceHero__ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/messages")}
              >
                Open messages
              </motion.button>
            </div>
          </div>

          <div className="freelancerMarketplaceHero__meta">
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">Open requests</span>
              <strong className="freelancerMarketplaceHero__metaValue">{requests.length}</strong>
            </div>
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">With media</span>
              <strong className="freelancerMarketplaceHero__metaValue">
                {requests.filter((item) => item.previewMedia).length}
              </strong>
            </div>
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">Visible after filters</span>
              <strong className="freelancerMarketplaceHero__metaValue">
                {filteredRequests.length}
              </strong>
            </div>
          </div>
        </section>
      </Reveal>

      {error ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't load request listings"
              description={error}
              actionLabel="Try again"
              onAction={reload}
              className="freelancerRequestEmpty"
            />
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.08}>
        <section className="profileSection freelancerMarketplaceControls">
          <div className="freelancerMarketplaceFilters">
            <input
              className="freelancerMarketplaceInput"
              type="search"
              placeholder="Search titles, customers, categories, or locations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="freelancerMarketplaceSelect"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              className="freelancerMarketplaceSelect"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="freelancerMarketplaceCount">
            {loading
              ? "Loading request listings..."
              : `${filteredRequests.length} request listing${filteredRequests.length === 1 ? "" : "s"} visible`}
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection">
          {loading ? (
            <div className="freelancerRequestGrid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="freelancerRequestCard" style={{ minHeight: 420 }} />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptySurface
              hideIcon
              title="No request listings match this view"
              actionLabel={requests.length === 0 ? "Back to dashboard" : "Clear search"}
              onAction={() => {
                if (requests.length === 0) {
                  navigate("/dashboard/freelancer");
                  return;
                }

                setSearch("");
                setCategory("All");
                setSort("newest");
              }}
              className="freelancerRequestEmpty"
            />
          ) : (
            <div className="freelancerRequestGrid">
              {filteredRequests.map((request, index) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  index={index}
                  onOpen={() =>
                    navigate(`/dashboard/freelancer/browse-requests/${request.id}`)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
