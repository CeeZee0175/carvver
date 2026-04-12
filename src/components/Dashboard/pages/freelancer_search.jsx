import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { REQUEST_MEDIA_BUCKET } from "../hooks/useCustomerRequests";
import { SERVICE_MEDIA_BUCKET } from "../hooks/useFreelancerServiceListings";
import {
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "../shared/profileIdentity";
import "./profile.css";
import "./dashboard_search.css";

const supabase = createClient();

function sanitizeSearchTerm(value) {
  return String(value || "")
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPeso(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Budget not set";
  return `PHP ${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Recently updated";

  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently updated";
  }
}

function formatDeadline(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "No deadline yet";

  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${normalized}T00:00:00`));
  } catch {
    return normalized;
  }
}

function getPublicUrl(bucket, path) {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

function groupRows(rows, key, transform) {
  const map = new Map();

  (rows || []).forEach((row) => {
    const existing = map.get(row[key]) || [];
    existing.push(transform ? transform(row) : row);
    map.set(row[key], existing);
  });

  return map;
}

function RequestResultCard({ item, index, onOpen }) {
  return (
    <motion.article
      className="dashboardSearchCard"
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="dashboardSearchCard__media">
        {item.previewMedia?.publicUrl ? (
          item.previewMedia.media_kind === "video" ? (
            <video src={item.previewMedia.publicUrl} muted playsInline />
          ) : (
            <img src={item.previewMedia.publicUrl} alt={item.title} />
          )
        ) : (
          <div className="dashboardSearchCard__mediaFallback">
            Customer references will show here when media is attached.
          </div>
        )}
      </div>

      <div className="dashboardSearchCard__body">
        <div className="dashboardSearchCard__meta">
          <span className="dashboardSearchCard__chip">{item.category}</span>
          <span className="dashboardSearchCard__chip">{item.budgetLabel}</span>
        </div>

        <span className="dashboardSearchCard__eyebrow">Request listing</span>
        <h2 className="dashboardSearchCard__title">{item.title}</h2>
        <p className="dashboardSearchCard__subtitle">{item.customerName}</p>
        <p className="dashboardSearchCard__desc">{item.description}</p>

        <div className="dashboardSearchCard__facts">
          <div className="dashboardSearchCard__fact">
            <span className="dashboardSearchCard__factLabel">Deadline</span>
            <span className="dashboardSearchCard__factValue">{item.deadlineLabel}</span>
          </div>
          <div className="dashboardSearchCard__fact">
            <span className="dashboardSearchCard__factLabel">Location</span>
            <span className="dashboardSearchCard__factValue">{item.locationLabel}</span>
          </div>
        </div>

        <div className="dashboardSearchCard__footer">
          <div className="dashboardSearchCard__secondaryText">Open customer brief</div>

          <motion.button
            type="button"
            className="dashboardSearchCard__action"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            <span>View request</span>
            <ArrowRight className="dashboardSearchCard__actionIcon" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function ListingResultCard({ item, index, onOpen }) {
  const statusClassName = item.is_published
    ? "dashboardSearchCard__status dashboardSearchCard__status--published"
    : "dashboardSearchCard__status dashboardSearchCard__status--draft";

  return (
    <motion.article
      className="dashboardSearchCard"
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="dashboardSearchCard__media">
        {item.previewMedia?.publicUrl ? (
          item.previewMedia.media_kind === "video" ? (
            <video src={item.previewMedia.publicUrl} muted playsInline />
          ) : (
            <img src={item.previewMedia.publicUrl} alt={item.title} />
          )
        ) : (
          <div className="dashboardSearchCard__mediaFallback">
            Listing cover media will appear here after upload.
          </div>
        )}
      </div>

      <div className="dashboardSearchCard__body">
        <div className="dashboardSearchCard__meta">
          <span className="dashboardSearchCard__chip">{item.category || "Listing"}</span>
          <span className={statusClassName}>
            {item.is_published ? "Published" : "Draft"}
          </span>
        </div>

        <span className="dashboardSearchCard__eyebrow">My listing</span>
        <h2 className="dashboardSearchCard__title">{item.title}</h2>
        <p className="dashboardSearchCard__desc">{item.summary}</p>

        <div className="dashboardSearchCard__facts">
          <div className="dashboardSearchCard__fact">
            <span className="dashboardSearchCard__factLabel">Starting at</span>
            <span className="dashboardSearchCard__factValue">
              {formatPeso(item.startingPrice)}
            </span>
          </div>
          <div className="dashboardSearchCard__fact">
            <span className="dashboardSearchCard__factLabel">Packages</span>
            <span className="dashboardSearchCard__factValue">
              {item.packageCount || 0}
            </span>
          </div>
        </div>

        <div className="dashboardSearchCard__footer">
          <div className="dashboardSearchCard__secondaryText">
            Updated {item.updatedLabel}
          </div>

          <motion.button
            type="button"
            className="dashboardSearchCard__action dashboardSearchCard__action--ghost"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            <span>{item.is_published ? "View listing" : "Edit draft"}</span>
            <ArrowRight className="dashboardSearchCard__actionIcon" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default function FreelancerSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");

  const query = useMemo(
    () => sanitizeSearchTerm(searchParams.get("q") || ""),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    async function loadResults() {
      if (!query) {
        if (!active) return;
        setLoading(false);
        setRequests([]);
        setListings([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          throw new Error("Please sign in again to search your freelancer pages.");
        }

        const [requestResult, listingResult] = await Promise.all([
          supabase
            .from("customer_requests")
            .select(
              "id, customer_id, title, category, description, budget_amount, location, timeline, status"
            )
            .eq("status", "open")
            .or(
              [
                `title.ilike.%${query}%`,
                `category.ilike.%${query}%`,
                `description.ilike.%${query}%`,
                `location.ilike.%${query}%`,
              ].join(",")
            )
            .limit(12),
          supabase
            .from("services")
            .select(
              "id, freelancer_id, title, category, location, price, description, listing_overview, is_published, created_at, updated_at"
            )
            .eq("freelancer_id", session.user.id)
            .or(
              [
                `title.ilike.%${query}%`,
                `category.ilike.%${query}%`,
                `location.ilike.%${query}%`,
                `description.ilike.%${query}%`,
                `listing_overview.ilike.%${query}%`,
              ].join(",")
            )
            .limit(12),
        ]);

        if (requestResult.error) throw requestResult.error;
        if (listingResult.error) throw listingResult.error;

        const requestRows = requestResult.data || [];
        const listingRows = listingResult.data || [];
        const customerIds = Array.from(
          new Set(requestRows.map((item) => item.customer_id).filter(Boolean))
        );
        const requestIds = requestRows.map((item) => item.id).filter(Boolean);
        const listingIds = listingRows.map((item) => item.id).filter(Boolean);

        const [profileResult, requestMediaResult, packageResult, listingMediaResult] =
          await Promise.all([
            customerIds.length > 0
              ? supabase
                  .from("profiles")
                  .select("id, display_name, first_name, last_name, avatar_url, region, city, barangay")
                  .in("id", customerIds)
              : Promise.resolve({ data: [], error: null }),
            requestIds.length > 0
              ? supabase
                  .from("customer_request_media")
                  .select("request_id, bucket_path, media_kind, sort_order")
                  .in("request_id", requestIds)
                  .order("sort_order", { ascending: true })
              : Promise.resolve({ data: [], error: null }),
            listingIds.length > 0
              ? supabase
                  .from("service_packages")
                  .select("service_id, price")
                  .in("service_id", listingIds)
              : Promise.resolve({ data: [], error: null }),
            listingIds.length > 0
              ? supabase
                  .from("service_media")
                  .select("service_id, bucket_path, media_kind, is_cover, sort_order")
                  .in("service_id", listingIds)
                  .order("sort_order", { ascending: true })
              : Promise.resolve({ data: [], error: null }),
          ]);

        if (profileResult.error) throw profileResult.error;
        if (requestMediaResult.error) throw requestMediaResult.error;
        if (packageResult.error) throw packageResult.error;
        if (listingMediaResult.error) throw listingMediaResult.error;

        const profileMap = new Map(
          (profileResult.data || []).map((item) => [item.id, item])
        );
        const requestMediaMap = groupRows(
          requestMediaResult.data || [],
          "request_id",
          (row) => ({
            ...row,
            publicUrl: getPublicUrl(REQUEST_MEDIA_BUCKET, row.bucket_path),
          })
        );
        const packageMap = groupRows(packageResult.data || [], "service_id");
        const listingMediaMap = groupRows(
          listingMediaResult.data || [],
          "service_id",
          (row) => ({
            ...row,
            publicUrl: getPublicUrl(SERVICE_MEDIA_BUCKET, row.bucket_path),
          })
        );

        const nextRequests = requestRows.map((row) => {
          const customer = profileMap.get(row.customer_id);
          const mediaRows = requestMediaMap.get(row.id) || [];

          return {
            ...row,
            previewMedia: mediaRows[0] || null,
            customerName: getProfileDisplayName(customer, "Customer"),
            customerInitials: getProfileInitials(customer, "C"),
            budgetLabel: formatPeso(row.budget_amount),
            deadlineLabel: formatDeadline(row.timeline),
            locationLabel:
              String(row.location || "").trim() ||
              buildPhilippinesLocationLabel({
                region: customer?.region,
                city: customer?.city,
                barangay: customer?.barangay,
              }) ||
              "Location not specified",
          };
        });

        const nextListings = listingRows.map((row) => {
          const packageRows = packageMap.get(row.id) || [];
          const mediaRows = listingMediaMap.get(row.id) || [];
          const previewMedia =
            mediaRows.find((item) => item.is_cover) || mediaRows[0] || null;
          const packagePrices = packageRows
            .map((item) => Number(item.price || 0))
            .filter((value) => Number.isFinite(value) && value > 0);

          return {
            ...row,
            summary:
              String(row.listing_overview || "").trim() ||
              String(row.description || "").trim() ||
              "Open this listing to review the current marketplace view.",
            packageCount: packageRows.length,
            startingPrice:
              packagePrices.length > 0
                ? Math.min(...packagePrices)
                : Number(row.price || 0),
            previewMedia,
            updatedLabel: formatDate(row.updated_at || row.created_at),
          };
        });

        if (!active) return;
        setRequests(nextRequests);
        setListings(nextListings);
      } catch (nextError) {
        if (!active) return;
        setRequests([]);
        setListings([]);
        setError(
          String(nextError?.message || "We couldn't load search results right now.")
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResults();

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details dashboardSearchPage">
      <Reveal>
        <section className="dashboardSearchHero">
          <div className="dashboardSearchHero__top">
            <div className="dashboardSearchHero__copy">
              <div className="dashboardSearchHero__titleWrap">
                <h1 className="dashboardSearchHero__title">
                  <TypewriterHeading text="Search results" />
                </h1>
                <motion.svg
                  className="dashboardSearchHero__line"
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
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.16 }}
                  />
                </motion.svg>
              </div>

              <p className="dashboardSearchHero__sub">
                {query ? (
                  <>
                    Showing matches for{" "}
                    <span className="dashboardSearchHero__query">"{query}"</span> across
                    request listings and your listings.
                  </>
                ) : (
                  "Search across open customer requests and your own marketplace listings."
                )}
              </p>
            </div>

            <motion.button
              type="button"
              className="dashboardSearchHero__ghost"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/freelancer/browse-requests")}
            >
              <span>Browse requests</span>
              <ArrowRight className="dashboardSearchHero__ghostIcon" />
            </motion.button>
          </div>
        </section>
      </Reveal>

      {error ? (
        <Reveal delay={0.06}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't load search results"
              description={error}
              actionLabel="Browse request listings"
              onAction={() => navigate("/dashboard/freelancer/browse-requests")}
              className="dashboardSearchEmpty"
            />
          </section>
        </Reveal>
      ) : null}

      {!error && !query ? (
        <Reveal delay={0.06}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="Search request listings or your listings"
              actionLabel="Browse request listings"
              onAction={() => navigate("/dashboard/freelancer/browse-requests")}
              className="dashboardSearchEmpty"
            />
          </section>
        </Reveal>
      ) : null}

      {!error && query ? (
        <>
          <Reveal delay={0.1}>
            <section className="profileSection dashboardSearchSection">
              <div className="dashboardSearchSection__head">
                <div>
                  <h2 className="dashboardSearchSection__title">Request listings</h2>
                  <p className="profileSection__sub">
                    Open customer requests that match your current search.
                  </p>
                </div>
                <span className="dashboardSearchSection__count">
                  {loading ? "Loading" : `${requests.length} found`}
                </span>
              </div>

              {loading ? (
                <div className="dashboardSearchGrid">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="dashboardSearchSkeleton" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No request listings matched this search"
                  actionLabel="Browse request listings"
                  onAction={() => navigate("/dashboard/freelancer/browse-requests")}
                  className="dashboardSearchEmpty"
                />
              ) : (
                <div className="dashboardSearchGrid">
                  {requests.map((item, index) => (
                    <RequestResultCard
                      key={item.id}
                      item={item}
                      index={index}
                      onOpen={() =>
                        navigate(`/dashboard/freelancer/browse-requests/${item.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal delay={0.14}>
            <section className="profileSection dashboardSearchSection">
              <div className="dashboardSearchSection__head">
                <div>
                  <h2 className="dashboardSearchSection__title">My listings</h2>
                  <p className="profileSection__sub">
                    Your drafts and published listings that match this search.
                  </p>
                </div>
                <span className="dashboardSearchSection__count">
                  {loading ? "Loading" : `${listings.length} found`}
                </span>
              </div>

              {loading ? (
                <div className="dashboardSearchGrid">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="dashboardSearchSkeleton" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No listings matched this search"
                  actionLabel="Open My Listings"
                  onAction={() => navigate("/dashboard/freelancer/listings")}
                  className="dashboardSearchEmpty"
                />
              ) : (
                <div className="dashboardSearchGrid">
                  {listings.map((item, index) => (
                    <ListingResultCard
                      key={item.id}
                      item={item}
                      index={index}
                      onOpen={() =>
                        navigate(
                          item.is_published
                            ? `/dashboard/freelancer/listings/${item.id}`
                            : `/dashboard/freelancer/listings/${item.id}/edit`
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </Reveal>
        </>
      ) : null}
    </FreelancerDashboardFrame>
  );
}
