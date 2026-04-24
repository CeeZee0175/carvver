import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { getProfileDisplayName, getProfileInitials } from "../shared/profileIdentity";

const supabase = createClient();
const SERVICE_MEDIA_BUCKET = "service-media";

function getPublicServiceMediaUrl(path) {
  if (!path) return "";
  const { data } = supabase.storage.from(SERVICE_MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizePackage(row) {
  return {
    id: row.id,
    serviceId: row.service_id,
    name: String(row.package_name || "").trim(),
    summary: String(row.package_summary || "").trim(),
    price: Number(row.price || 0),
    deliveryTimeDays: Number(row.delivery_time_days || 0),
    includedItems: Array.isArray(row.included_items)
      ? row.included_items.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    priceLabel: formatPeso(row.price),
  };
}

function buildFallbackPackage(serviceRow) {
  const includedItems = Array.isArray(serviceRow.listing_highlights)
    ? serviceRow.listing_highlights
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  return {
    id: null,
    serviceId: serviceRow.id,
    name: "Standard",
    summary: String(serviceRow.description || "").trim(),
    price: Number(serviceRow.price || 0),
    deliveryTimeDays: Number(serviceRow.delivery_time_days || 0),
    includedItems,
    priceLabel: formatPeso(serviceRow.price),
    derived: true,
  };
}

function normalizeMedia(row) {
  return {
    id: row.id,
    serviceId: row.service_id,
    kind: row.media_kind,
    originalName: row.original_name,
    sortOrder: row.sort_order,
    isCover: Boolean(row.is_cover),
    publicUrl: getPublicServiceMediaUrl(row.bucket_path),
  };
}

export function useServiceListingDetail(serviceId) {
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!serviceId) {
      setLoading(false);
      setService(null);
      setError("We couldn't find this listing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: serviceRow, error: serviceError } = await supabase
        .from("services")
        .select(
          "id, freelancer_id, title, category, price, location, description, fulfillment_type, listing_overview, listing_highlights, delivery_time_days, is_published, is_pro, is_verified, created_at, profiles(display_name, first_name, last_name, avatar_url, bio, region, city, barangay, freelancer_headline, freelancer_portfolio_url, freelancer_verified_at)"
        )
        .eq("id", serviceId)
        .eq("is_published", true)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!serviceRow) throw new Error("We couldn't find this listing.");

      const [{ data: packageRows, error: packageError }, { data: mediaRows, error: mediaError }] =
        await Promise.all([
          supabase
            .from("service_packages")
            .select(
              "id, service_id, sort_order, package_name, package_summary, price, delivery_time_days, included_items"
            )
            .eq("service_id", serviceId)
            .order("sort_order", { ascending: true }),
          supabase
            .from("service_media")
            .select(
              "id, service_id, bucket_path, media_kind, original_name, sort_order, is_cover"
            )
            .eq("service_id", serviceId)
            .order("sort_order", { ascending: true }),
        ]);

      if (packageError) throw packageError;
      if (mediaError) throw mediaError;

      const profile = Array.isArray(serviceRow.profiles)
        ? serviceRow.profiles[0]
        : serviceRow.profiles;
      const packages =
        (packageRows || []).length > 0
          ? (packageRows || []).map(normalizePackage)
          : [buildFallbackPackage(serviceRow)];
      const media = (mediaRows || []).map(normalizeMedia);
      const locationLabel =
        String(serviceRow.location || "").trim() ||
        buildPhilippinesLocationLabel({
          region: profile?.region,
          city: profile?.city,
          barangay: profile?.barangay,
        }) ||
        "Location not set";

      setService({
        ...serviceRow,
        fulfillment_type:
          String(serviceRow.fulfillment_type || "").trim().toLowerCase() === "physical"
            ? "physical"
            : "digital",
        overview:
          String(serviceRow.listing_overview || "").trim() ||
          String(serviceRow.description || "").trim(),
        highlights: Array.isArray(serviceRow.listing_highlights)
          ? serviceRow.listing_highlights
              .map((item) => String(item || "").trim())
              .filter(Boolean)
          : [],
        freelancer: {
          id: serviceRow.freelancer_id,
          displayName: getProfileDisplayName(profile, "Freelancer"),
          initials: getProfileInitials(profile, "F"),
          avatarUrl: profile?.avatar_url || "",
          headline: String(profile?.freelancer_headline || "").trim(),
          bio: String(profile?.bio || "").trim(),
          locationLabel:
            buildPhilippinesLocationLabel({
              region: profile?.region,
              city: profile?.city,
              barangay: profile?.barangay,
            }) || "Philippines",
          portfolioUrl: String(profile?.freelancer_portfolio_url || "").trim(),
          verified: Boolean(profile?.freelancer_verified_at || serviceRow.is_verified),
        },
        packageCount: packages.length,
        startingPrice:
          packages.length > 0
            ? Math.min(...packages.map((item) => item.price))
            : Number(serviceRow.price || 0),
        locationLabel,
        packages,
        media,
      });
    } catch (nextError) {
      setService(null);
      setError(
        String(nextError?.message || "We couldn't load this listing right now.")
      );
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    service,
    error,
    reload: load,
  };
}
