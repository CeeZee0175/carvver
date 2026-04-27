import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import "./profile.css";
import "./freelancer_pages.css";
import "./freelancer_marketplace.css";
import "./service_listing_detail.css";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { fetchFreelancerListingForEdit } from "../hooks/useFreelancerServiceListings";

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

export default function FreelancerListingPreview() {
  const navigate = useNavigate();
  const { listingId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listing, setListing] = useState(null);
  const [activeMediaId, setActiveMediaId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadListing() {
      setLoading(true);
      setError("");

      try {
        const nextListing = await fetchFreelancerListingForEdit(listingId);
        if (!active) return;
        setListing(nextListing);
      } catch (nextError) {
        if (!active) return;
        setListing(null);
        setError(
          String(nextError?.message || "We couldn't load this listing right now.")
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadListing();

    return () => {
      active = false;
    };
  }, [listingId]);

  useEffect(() => {
    if (!listing?.media?.length) {
      setActiveMediaId("");
      return;
    }

    setActiveMediaId((prev) => {
      const current = listing.media.find((item) => item.id === prev);
      if (current) return prev;
      return listing.media[0]?.id || "";
    });
  }, [listing]);

  const activeMedia = useMemo(() => {
    if (!listing?.media?.length) return null;
    return listing.media.find((item) => item.id === activeMediaId) || listing.media[0];
  }, [activeMediaId, listing]);

  const highlights = useMemo(() => {
    if (Array.isArray(listing?.listing_highlights)) {
      return listing.listing_highlights.filter(Boolean);
    }

    if (Array.isArray(listing?.packages?.[0]?.includedItems)) {
      return listing.packages[0].includedItems.filter(Boolean);
    }

    return [];
  }, [listing]);

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerMarketplacePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "My Listings", to: "/dashboard/freelancer/listings" },
            { label: listing?.title || "Preview" },
          ]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="freelancerMarketplaceHero">
          <div className="freelancerMarketplaceHero__top">
            <div className="freelancerMarketplaceHero__copy">
              <div className="freelancerMarketplaceHero__titleWrap">
                <h1 className="freelancerMarketplaceHero__title">
                  <TypewriterHeading text={listing?.title || "Listing preview"} />
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
                Review the marketplace version of your listing before you send customers into it.
              </p>
            </div>

            <div className="freelancerListingActions">
              <Motion.button
                type="button"
                className="freelancerListingActionBtn"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() =>
                  navigate(`/dashboard/freelancer/listings/${listingId}/edit`)
                }
              >
                Edit listing
              </Motion.button>
            </div>
          </div>

          {listing ? (
            <div className="freelancerMarketplaceHero__meta">
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Category</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {listing.category}
                </strong>
              </div>
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Location</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {listing.location || "Location not set"}
                </strong>
              </div>
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Starting price</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {formatPeso(listing.startingPrice)}
                </strong>
              </div>
            </div>
          ) : null}
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="freelancerRequestDetailCard" style={{ minHeight: 360 }} />
          </section>
        </Reveal>
      ) : error || !listing ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't open this listing"
              description={error || "Please try again."}
              actionLabel="Back to listings"
              onAction={() => navigate("/dashboard/freelancer/listings")}
              className="freelancerListingEmpty"
            />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <section className="profileSection freelancerRequestDetailLayout">
            <div className="freelancerRequestDetailMain">
              <article className="freelancerRequestDetailCard">
                <h2 className="freelancerRequestDetail__title">Gallery</h2>
                <p className="profileSection__sub">
                  Review the media sequence customers will see on this published listing.
                </p>

                <div className="freelancerRequestDetail__media">
                  {activeMedia ? (
                    activeMedia.media_kind === "video" ? (
                      <video src={activeMedia.publicUrl} controls playsInline />
                    ) : (
                      <img src={activeMedia.publicUrl} alt={listing.title} />
                    )
                  ) : (
                    <div className="freelancerListingCard__mediaFallback">
                      No media added yet
                    </div>
                  )}
                </div>

                {listing.media?.length > 1 ? (
                  <div className="serviceDetailMediaGrid">
                    {listing.media.map((item) => (
                      <Motion.button
                        key={item.id}
                        type="button"
                        className={`serviceDetailMediaThumb ${
                          item.id === activeMedia?.id ? "serviceDetailMediaThumb--active" : ""
                        }`.trim()}
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={() => setActiveMediaId(item.id)}
                      >
                        <div className="serviceDetailMediaThumb__preview">
                          {item.media_kind === "video" ? (
                            <video src={item.publicUrl} muted playsInline />
                          ) : (
                            <img src={item.publicUrl} alt={listing.title} />
                          )}
                        </div>
                        <div className="serviceDetailMediaThumb__body">
                          <strong className="serviceDetailCard__label">
                            {item.is_cover ? "Cover media" : "Gallery media"}
                          </strong>
                          <span className="serviceDetailMediaThumb__meta">
                            {item.original_name}
                          </span>
                        </div>
                      </Motion.button>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="freelancerRequestDetailCard">
                <h2 className="freelancerRequestDetail__title">What customers will see</h2>
                <p className="profileSection__sub">
                  Check the overview and highlights before you return to editing.
                </p>
                <p className="freelancerRequestDetail__desc">
                  {listing.listing_overview || listing.description}
                </p>

                {highlights.length > 0 ? (
                  <div className="freelancerRequestDetail__facts">
                    {highlights.map((item) => (
                      <span key={item} className="freelancerRequestDetail__chip">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>

            <aside className="freelancerRequestDetailSide">
              <article className="freelancerRequestDetailCard">
                <h2 className="freelancerRequestDetail__title">Current package lineup</h2>
                <p className="profileSection__sub">
                  Compare the package structure customers can choose from right now.
                </p>
                <div className="freelancerPreviewPackages">
                  {listing.packages.map((item) => (
                    <div key={item.id || item.name} className="freelancerPreviewPackage">
                      <div className="freelancerPreviewPackage__top">
                        <strong className="freelancerRequestCard__title">{item.name}</strong>
                        <span className="freelancerRequestCard__chip">
                          {formatPeso(item.price)}
                        </span>
                      </div>
                      {item.summary ? (
                        <p className="freelancerRequestCard__desc">{item.summary}</p>
                      ) : null}
                      <div className="freelancerListingCard__facts">
                        <span>
                          {item.deliveryTimeDays > 0
                            ? `${item.deliveryTimeDays} day${
                                item.deliveryTimeDays === 1 ? "" : "s"
                              } delivery`
                            : "Flexible delivery"}
                        </span>
                      </div>
                      {item.includedItems?.length > 0 ? (
                        <div className="freelancerRequestDetail__facts">
                          {item.includedItems.map((entry) => (
                            <span key={entry} className="freelancerRequestDetail__chip">
                              {entry}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
