import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  deleteFreelancerDraft,
  listFreelancerServiceListings,
  setFreelancerListingPublished,
} from "../hooks/useFreelancerServiceListings";

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const TABS = [
  { label: "Drafts", value: "drafts" },
  { label: "Published", value: "published" },
];

export default function FreelancerListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState("drafts");
  const [busyKey, setBusyKey] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextListings = await listFreelancerServiceListings();
      setListings(nextListings);
    } catch (nextError) {
      setListings([]);
      setError(
        String(nextError?.message || "We couldn't load your listings right now.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    const state = location.state || {};
    if (state.listingSavedTitle) {
      toast.success(`${state.listingSavedTitle} is ready in My Listings.`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const drafts = useMemo(
    () => listings.filter((item) => !item.is_published),
    [listings]
  );
  const published = useMemo(
    () => listings.filter((item) => item.is_published),
    [listings]
  );

  const visibleListings = activeTab === "published" ? published : drafts;

  const handlePublish = async (listingId) => {
    try {
      setBusyKey(`publish:${listingId}`);
      await setFreelancerListingPublished(listingId, true);
      toast.success("Listing published.");
      await loadListings();
      setActiveTab("published");
    } catch (nextError) {
      toast.error(
        nextError?.message || "We couldn't publish this listing right now."
      );
    } finally {
      setBusyKey("");
    }
  };

  const handleDeleteDraft = async (listingId) => {
    try {
      setBusyKey(`delete:${listingId}`);
      await deleteFreelancerDraft(listingId);
      toast.success("Draft deleted.");
      await loadListings();
    } catch (nextError) {
      toast.error(
        nextError?.message || "We couldn't delete this draft right now."
      );
    } finally {
      setBusyKey("");
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerMarketplacePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "My Listings" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="freelancerMarketplaceHero">
          <div className="freelancerMarketplaceHero__top">
            <div className="freelancerMarketplaceHero__copy">
              <div className="freelancerMarketplaceHero__titleWrap">
                <h1 className="freelancerMarketplaceHero__title">
                  <TypewriterHeading text="My Listings" />
                </h1>
                <Motion.svg
                  className="freelancerMarketplaceHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <Motion.path
                    d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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
                Keep drafts moving, review published listings, and jump back into edits without losing your package setup.
              </p>
            </div>

            <div className="freelancerListingActions">
              <Motion.button
                type="button"
                className="freelancerListingActionBtn"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/post-listing")}
              >
                Create listing
              </Motion.button>
            </div>
          </div>

          <div className="freelancerMarketplaceHero__meta">
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">Drafts</span>
              <strong className="freelancerMarketplaceHero__metaValue">{drafts.length}</strong>
            </div>
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">Published</span>
              <strong className="freelancerMarketplaceHero__metaValue">{published.length}</strong>
            </div>
            <div className="freelancerMarketplaceHero__metaItem">
              <span className="freelancerMarketplaceHero__metaLabel">Total listings</span>
              <strong className="freelancerMarketplaceHero__metaValue">{listings.length}</strong>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="profileSection freelancerDashboardSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Listing views</h2>
              <p className="profileSection__sub">
                Switch between drafts and published listings without leaving the page.
              </p>
            </div>
          </div>

          <div className="profileFilterGroup">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`profileFilterChip ${
                  activeTab === tab.value ? "profileFilterChip--active" : ""
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection freelancerDashboardSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">
                {activeTab === "published" ? "Published listings" : "Draft listings"}
              </h2>
              <p className="profileSection__sub">
                {activeTab === "published"
                  ? "Review the listings customers can already open in the marketplace."
                  : "Pick up unfinished listings and move them toward publish-ready work."}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="freelancerListingsGrid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="freelancerListingCard freelancerListingCard--skeleton" />
              ))}
            </div>
          ) : error ? (
            <EmptySurface
              hideIcon
              title="We couldn't load your listings"
              description={error}
              actionLabel="Try again"
              onAction={loadListings}
              className="freelancerListingEmpty"
            />
          ) : visibleListings.length === 0 ? (
            <EmptySurface
              hideIcon
              title={
                activeTab === "published"
                  ? "No published listings yet"
                  : "No drafts yet"
              }
              actionLabel="Create listing"
              onAction={() => navigate("/dashboard/freelancer/post-listing")}
              className="freelancerListingEmpty"
            />
          ) : (
            <div className="freelancerListingsGrid">
              {visibleListings.map((listing, index) => {
                const cover = listing.previewMedia?.publicUrl || "";
                const publishBusy = busyKey === `publish:${listing.id}`;
                const deleteBusy = busyKey === `delete:${listing.id}`;
                const actionsLocked = Boolean(busyKey);

                return (
                  <Motion.article
                    key={listing.id}
                    className="freelancerListingCard"
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.18 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <div className="freelancerListingCard__media">
                      {cover ? (
                        listing.previewMedia?.media_kind === "video" ? (
                          <video src={cover} muted playsInline />
                        ) : (
                          <img src={cover} alt={listing.title} />
                        )
                      ) : (
                        <div className="freelancerListingCard__mediaFallback">
                          {listing.category || "Listing preview"}
                        </div>
                      )}
                    </div>

                    <div className="freelancerListingCard__body">
                      <div className="freelancerRequestCard__meta">
                        <span className="freelancerRequestCard__chip">
                          {listing.category}
                        </span>
                        <span className="freelancerRequestCard__chip">
                          {listing.is_published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <h3 className="freelancerRequestCard__title">{listing.title}</h3>

                      <div className="freelancerListingCard__facts">
                        <span>{formatPeso(listing.startingPrice)}</span>
                        <span>
                          {listing.packageCount || 0} package
                          {listing.packageCount === 1 ? "" : "s"}
                        </span>
                        <span>{formatDate(listing.updated_at || listing.created_at)}</span>
                      </div>

                      <div className="freelancerListingCard__actions">
                        <Motion.button
                          type="button"
                          className="freelancerListingActionBtn--ghost"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() =>
                            navigate(`/dashboard/freelancer/listings/${listing.id}/edit`)
                          }
                          disabled={actionsLocked}
                        >
                          Edit
                        </Motion.button>

                        {listing.is_published ? (
                          <Motion.button
                            type="button"
                            className="freelancerListingActionBtn"
                            whileHover={{ y: -1.5 }}
                            whileTap={{ scale: 0.98 }}
                            transition={PROFILE_SPRING}
                            onClick={() =>
                              navigate(`/dashboard/freelancer/listings/${listing.id}`)
                            }
                            disabled={actionsLocked}
                          >
                            View listing
                          </Motion.button>
                        ) : (
                          <>
                            <Motion.button
                              type="button"
                              className="freelancerListingActionBtn"
                              whileHover={{ y: -1.5 }}
                              whileTap={{ scale: 0.98 }}
                              transition={PROFILE_SPRING}
                              onClick={() => handlePublish(listing.id)}
                              disabled={actionsLocked}
                            >
                              {publishBusy ? "Publishing..." : "Publish"}
                            </Motion.button>

                            <Motion.button
                              type="button"
                              className="freelancerListingActionBtn--ghost"
                              whileHover={{ y: -1.5 }}
                              whileTap={{ scale: 0.98 }}
                              transition={PROFILE_SPRING}
                              onClick={() => handleDeleteDraft(listing.id)}
                              disabled={actionsLocked}
                            >
                              {deleteBusy ? "Deleting..." : "Delete draft"}
                            </Motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </Motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
