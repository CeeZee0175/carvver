import React, { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";
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
import DashboardPagination from "../shared/dashboard_pagination";
import { usePagedItems } from "../shared/dashboard_pagination_hooks";
import SearchableCombobox from "../../Shared/searchable_combobox";
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
    <Motion.article
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

          <Motion.button
            type="button"
            className="freelancerRequestCard__btn"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            View request
          </Motion.button>
        </div>
      </div>
    </Motion.article>
  );
}

export default function FreelancerBrowseRequests() {
  const navigate = useNavigate();
  const { loading, requests, error, reload } = useFreelancerRequestMarketplace();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  const categoryOptions = useMemo(
    () => {
      const requestCategories = Array.from(
        new Set(requests.map((item) => item.category).filter(Boolean))
      );
      return [
        "All",
        ...ALL_SERVICE_CATEGORIES,
        ...requestCategories.filter(
          (item) => !ALL_SERVICE_CATEGORIES.includes(item)
        ),
      ];
    },
    [requests]
  );
  const filteredRequests = useFreelancerRequestFilters(requests, {
    search,
    category,
    sort,
  });
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pagedItems: pagedRequests,
  } = usePagedItems(filteredRequests, 9, [search, category, sort]);

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
                <Motion.svg
                  className="freelancerMarketplaceHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <Motion.path
                    d="M 0,10 L 300,10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.14 }}
                  />
                </Motion.svg>
              </div>

              <p className="freelancerMarketplaceHero__sub">
                Review recent customer briefs, scan attached references, and open the conversations that fit your work best.
              </p>
            </div>

            <div className="freelancerMarketplaceHero__actions">
              <Motion.button
                type="button"
                className="freelancerMarketplaceHero__action"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/post-listing")}
              >
                Post a listing
              </Motion.button>

              <Motion.button
                type="button"
                className="freelancerMarketplaceHero__ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/messages")}
              >
                Open messages
              </Motion.button>
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

            <SearchableCombobox
              value={category}
              onSelect={(nextValue) => setCategory(nextValue || "All")}
              options={categoryOptions}
              placeholder="Filter category"
              searchHint="Browse categories"
              noResultsText="No category matches"
              ariaLabel="Filter requests by category"
              showAllOptionsOnOpen
            />

            <SearchableCombobox
              value={SORT_OPTIONS.find((option) => option.value === sort)?.label || "Newest"}
              onSelect={(nextValue) => {
                const matched = SORT_OPTIONS.find((option) => option.label === nextValue);
                setSort(matched?.value || "newest");
              }}
              options={SORT_OPTIONS.map((option) => option.label)}
              placeholder="Sort requests"
              searchHint="Choose sorting"
              noResultsText="No sort options"
              ariaLabel="Sort request listings"
              showAllOptionsOnOpen
            />
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
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Request listings</h2>
              <p className="profileSection__sub">
                Browse the customer briefs that are currently visible after your filters.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="freelancerRequestGrid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="freelancerRequestCard" style={{ minHeight: 330 }} />
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
              {pagedRequests.map((request, index) => (
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

          {!loading && filteredRequests.length > 0 ? (
            <DashboardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              label="Request listings pagination"
            />
          ) : null}
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
