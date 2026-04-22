import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { SERVICE_MEDIA_BUCKET } from "../hooks/useFreelancerServiceListings";
import {
  CustomerDashboardFrame,
  EmptySurface,
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
  return `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeRelation(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function getPublicServiceMediaUrl(path) {
  if (!path) return "";
  const { data } = supabase.storage.from(SERVICE_MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

function buildServiceMediaMap(rows) {
  const map = new Map();

  (rows || []).forEach((row) => {
    const existing = map.get(row.service_id) || [];
    existing.push({
      ...row,
      publicUrl: getPublicServiceMediaUrl(row.bucket_path),
    });
    map.set(row.service_id, existing);
  });

  return map;
}

function buildPackageMap(rows) {
  const map = new Map();

  (rows || []).forEach((row) => {
    const existing = map.get(row.service_id) || [];
    existing.push(row);
    map.set(row.service_id, existing);
  });

  return map;
}

function ServiceResultCard({ item, index, onOpen }) {
  return (
    <Motion.article
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
            Listing media will appear here when the freelancer adds a cover.
          </div>
        )}
      </div>

      <div className="dashboardSearchCard__body">
        <div className="dashboardSearchCard__meta">
          <span className="dashboardSearchCard__chip">{item.category || "Listing"}</span>
          <span className="dashboardSearchCard__chip">
            {item.packageCount > 0
              ? `${item.packageCount} package${item.packageCount === 1 ? "" : "s"}`
              : "Standard"}
          </span>
        </div>

        <span className="dashboardSearchCard__eyebrow">Service</span>
        <h2 className="dashboardSearchCard__title">{item.title}</h2>
        <p className="dashboardSearchCard__subtitle">{item.freelancerName}</p>
        <p className="dashboardSearchCard__desc">{item.summary}</p>

        <div className="dashboardSearchCard__foot">
          {item.locationLabel ? (
            <span className="dashboardSearchCard__secondaryText">
              <MapPin style={{ width: 14, height: 14, verticalAlign: "text-bottom" }} />{" "}
              {item.locationLabel}
            </span>
          ) : null}
        </div>

        <div className="dashboardSearchCard__footer">
          <div>
            <div className="dashboardSearchCard__price">{formatPeso(item.startingPrice)}</div>
            <div className="dashboardSearchCard__secondaryText">
              Starting price
            </div>
          </div>

          <Motion.button
            type="button"
            className="dashboardSearchCard__action"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            <span>View listing</span>
            <ArrowRight className="dashboardSearchCard__actionIcon" />
          </Motion.button>
        </div>
      </div>
    </Motion.article>
  );
}

function FreelancerResultCard({ item, index, onOpen }) {
  return (
    <Motion.article
      className="dashboardSearchCard"
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="dashboardSearchCard__body">
        <div className="dashboardSearchCard__identity">
          <div className="dashboardSearchCard__avatar" aria-hidden="true">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.displayName} />
            ) : (
              item.initials
            )}
          </div>

          <div className="dashboardSearchCard__identityMeta">
            <span className="dashboardSearchCard__eyebrow">Freelancer</span>
            <h2 className="dashboardSearchCard__title">{item.displayName}</h2>
            {item.headline ? (
              <p className="dashboardSearchCard__subtitle">{item.headline}</p>
            ) : null}
          </div>
        </div>

        <div className="dashboardSearchCard__chips">
          {item.primaryCategory ? (
            <span className="dashboardSearchCard__chip">{item.primaryCategory}</span>
          ) : null}
          {item.locationLabel ? (
            <span className="dashboardSearchCard__chip">{item.locationLabel}</span>
          ) : null}
        </div>

        <p className="dashboardSearchCard__desc">
          {item.bio || "Open this freelancer profile to review details and published work."}
        </p>

        <div className="dashboardSearchCard__footer">
          <div className="dashboardSearchCard__secondaryText">
            Customer-visible freelancer profile
          </div>

          <Motion.button
            type="button"
            className="dashboardSearchCard__action dashboardSearchCard__action--ghost"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={onOpen}
          >
            <span>Open profile</span>
            <ArrowRight className="dashboardSearchCard__actionIcon" />
          </Motion.button>
        </div>
      </div>
    </Motion.article>
  );
}

export default function CustomerSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
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
        setServices([]);
        setFreelancers([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [serviceResult, freelancerResult] = await Promise.all([
          supabase
            .from("services")
            .select(
              "id, freelancer_id, title, category, price, location, description, listing_overview, profiles(display_name, first_name, last_name, avatar_url, freelancer_headline, region, city, barangay)"
            )
            .eq("is_published", true)
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
          supabase
            .from("profiles")
            .select(
              "id, display_name, first_name, last_name, avatar_url, bio, freelancer_headline, freelancer_primary_category, region, city, barangay"
            )
            .eq("role", "freelancer")
            .or(
              [
                `display_name.ilike.%${query}%`,
                `first_name.ilike.%${query}%`,
                `last_name.ilike.%${query}%`,
                `bio.ilike.%${query}%`,
                `freelancer_headline.ilike.%${query}%`,
                `freelancer_primary_category.ilike.%${query}%`,
              ].join(",")
            )
            .limit(12),
        ]);

        if (serviceResult.error) throw serviceResult.error;
        if (freelancerResult.error) throw freelancerResult.error;

        const serviceRows = serviceResult.data || [];
        const serviceIds = serviceRows.map((item) => item.id).filter(Boolean);

        const [packageResult, mediaResult] = await Promise.all([
          serviceIds.length > 0
            ? supabase
                .from("service_packages")
                .select("service_id, price")
                .in("service_id", serviceIds)
            : Promise.resolve({ data: [], error: null }),
          serviceIds.length > 0
            ? supabase
                .from("service_media")
                .select("service_id, bucket_path, media_kind, is_cover, sort_order")
                .in("service_id", serviceIds)
                .order("sort_order", { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (packageResult.error) throw packageResult.error;
        if (mediaResult.error) throw mediaResult.error;

        const packageMap = buildPackageMap(packageResult.data || []);
        const mediaMap = buildServiceMediaMap(mediaResult.data || []);

        const nextServices = serviceRows.map((row) => {
          const profile = normalizeRelation(row.profiles);
          const packageRows = packageMap.get(row.id) || [];
          const mediaRows = mediaMap.get(row.id) || [];
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
              "Open this listing to choose a package and review the details.",
            packageCount: packageRows.length,
            startingPrice:
              packagePrices.length > 0
                ? Math.min(...packagePrices)
                : Number(row.price || 0),
            previewMedia,
            freelancerName: getProfileDisplayName(profile, "Freelancer"),
            freelancerHeadline: String(profile?.freelancer_headline || "").trim(),
            locationLabel:
              String(row.location || "").trim() ||
              buildPhilippinesLocationLabel({
                region: profile?.region,
                city: profile?.city,
                barangay: profile?.barangay,
              }) ||
              "",
          };
        });

        const nextFreelancers = (freelancerResult.data || []).map((row) => ({
          ...row,
          displayName: getProfileDisplayName(row, "Freelancer"),
          initials: getProfileInitials(row, "F"),
          headline: String(row.freelancer_headline || "").trim(),
          bio: String(row.bio || "").trim(),
          primaryCategory: String(row.freelancer_primary_category || "").trim(),
          locationLabel:
            buildPhilippinesLocationLabel({
              region: row.region,
              city: row.city,
              barangay: row.barangay,
            }) || "",
        }));

        if (!active) return;
        setServices(nextServices);
        setFreelancers(nextFreelancers);
      } catch (nextError) {
        if (!active) return;
        setServices([]);
        setFreelancers([]);
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
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details dashboardSearchPage">
      <Reveal>
        <section className="dashboardSearchHero">
          <div className="dashboardSearchHero__top">
            <div className="dashboardSearchHero__copy">
              <div className="dashboardSearchHero__titleWrap">
                <h1 className="dashboardSearchHero__title">
                  <TypewriterHeading text="Search results" />
                </h1>
                <Motion.svg
                  className="dashboardSearchHero__line"
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
                    transition={{ duration: 1.05, ease: "easeInOut", delay: 0.16 }}
                  />
                </Motion.svg>
              </div>

              <p className="dashboardSearchHero__sub">
                {query ? (
                  <>
                    Showing matches for{" "}
                    <span className="dashboardSearchHero__query">"{query}"</span> across
                    services and freelancers.
                  </>
                ) : (
                  "Search across published services and customer-visible freelancer profiles."
                )}
              </p>
            </div>

            <Motion.button
              type="button"
              className="dashboardSearchHero__ghost"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              <span>Browse services</span>
              <ArrowRight className="dashboardSearchHero__ghostIcon" />
            </Motion.button>
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
              actionLabel="Browse services"
              onAction={() => navigate("/dashboard/customer/browse-services")}
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
              title="Search services or freelancers"
              actionLabel="Browse services"
              onAction={() => navigate("/dashboard/customer/browse-services")}
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
                  <h2 className="dashboardSearchSection__title">Services</h2>
                  <p className="profileSection__sub">
                    Published listings that match your current search.
                  </p>
                </div>
                <span className="dashboardSearchSection__count">
                  {loading ? "Loading" : `${services.length} found`}
                </span>
              </div>

              {loading ? (
                <div className="dashboardSearchGrid">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="dashboardSearchSkeleton" />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No services matched this search"
                  actionLabel="Browse services"
                  onAction={() => navigate("/dashboard/customer/browse-services")}
                  className="dashboardSearchEmpty"
                />
              ) : (
                <div className="dashboardSearchGrid">
                  {services.map((item, index) => (
                    <ServiceResultCard
                      key={item.id}
                      item={item}
                      index={index}
                      onOpen={() =>
                        navigate(`/dashboard/customer/browse-services/${item.id}`)
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
                  <h2 className="dashboardSearchSection__title">Freelancers</h2>
                  <p className="profileSection__sub">
                    Customer-visible freelancer profiles that match your search.
                  </p>
                </div>
                <span className="dashboardSearchSection__count">
                  {loading ? "Loading" : `${freelancers.length} found`}
                </span>
              </div>

              {loading ? (
                <div className="dashboardSearchGrid dashboardSearchGrid--wide">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="dashboardSearchSkeleton" />
                  ))}
                </div>
              ) : freelancers.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No freelancers matched this search"
                  actionLabel="Browse services"
                  onAction={() => navigate("/dashboard/customer/browse-services")}
                  className="dashboardSearchEmpty"
                />
              ) : (
                <div className="dashboardSearchGrid dashboardSearchGrid--wide">
                  {freelancers.map((item, index) => (
                    <FreelancerResultCard
                      key={item.id}
                      item={item}
                      index={index}
                      onOpen={() =>
                        navigate(`/dashboard/customer/freelancers/${item.id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </Reveal>
        </>
      ) : null}
    </CustomerDashboardFrame>
  );
}
