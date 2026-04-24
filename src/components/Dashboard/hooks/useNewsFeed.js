import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { SERVICE_MEDIA_BUCKET } from "./useFreelancerServiceListings";
import { REQUEST_MEDIA_BUCKET } from "./useCustomerRequests";

const supabase = createClient();

const SERVICE_COLUMNS = `
  id,
  freelancer_id,
  title,
  category,
  price,
  location,
  description,
  listing_overview,
  delivery_time_days,
  is_pro,
  is_verified,
  created_at,
  updated_at,
  profiles(display_name, first_name, last_name, avatar_url, freelancer_headline, region, city, barangay, freelancer_verified_at)
`;

const REQUEST_COLUMNS = `
  id,
  customer_id,
  title,
  category,
  description,
  budget_amount,
  location,
  timeline,
  status,
  created_at,
  updated_at
`;

function normalizeRelation(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function formatPeso(value, fallback = "Budget not set") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return `PHP ${numeric.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatFeedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getPublicUrl(bucket, path) {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

function buildDisplayName(profile, fallback) {
  const displayName = normalizeText(profile?.display_name);
  if (displayName) return displayName;

  const fullName = [profile?.first_name, profile?.last_name]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  return fullName || fallback;
}

function buildInitials(profile, fallback = "C") {
  const initials = [profile?.first_name, profile?.last_name]
    .map((part) => normalizeText(part).charAt(0))
    .join("")
    .toUpperCase();

  return initials || buildDisplayName(profile, fallback).charAt(0).toUpperCase() || fallback;
}

function groupBy(rows, key) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const mapKey = row?.[key];
    if (!mapKey) return;
    const existing = map.get(mapKey) || [];
    existing.push(row);
    map.set(mapKey, existing);
  });
  return map;
}

function normalizeServicePost(row, mediaRows, packageRows) {
  const profile = normalizeRelation(row.profiles);
  const media = (mediaRows || []).map((item) => ({
    ...item,
    publicUrl: getPublicUrl(SERVICE_MEDIA_BUCKET, item.bucket_path),
  }));
  const previewMedia = media.find((item) => item.is_cover) || media[0] || null;
  const prices = (packageRows || [])
    .map((item) => Number(item.price || 0))
    .filter((value) => value > 0);
  const startingPrice = prices.length > 0 ? Math.min(...prices) : Number(row.price || 0);
  const location =
    normalizeText(row.location) ||
    buildPhilippinesLocationLabel({
      region: profile?.region,
      city: profile?.city,
      barangay: profile?.barangay,
    });

  return {
    id: `service-${row.id}`,
    sourceId: row.id,
    type: "service",
    typeLabel: "Service listing",
    title: normalizeText(row.title) || "Untitled service",
    category: normalizeText(row.category) || "Uncategorized",
    description:
      normalizeText(row.listing_overview) ||
      normalizeText(row.description) ||
      "Review packages, delivery details, and the freelancer profile.",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dateLabel: formatFeedDate(row.created_at),
    priceLabel: formatPeso(startingPrice, "Custom pricing"),
    location: location || "Location not set",
    metaLabel:
      Number(row.delivery_time_days || 0) > 0
        ? `${Number(row.delivery_time_days)} day delivery`
        : `${packageRows?.length || 0} package${packageRows?.length === 1 ? "" : "s"}`,
    ownerId: row.freelancer_id,
    detailPath: `/dashboard/customer/browse-services/${row.id}`,
    sharePath: `/dashboard/customer/browse-services/${row.id}`,
    media,
    previewMedia,
    author: {
      id: row.freelancer_id,
      name: buildDisplayName(profile, "Freelancer"),
      initials: buildInitials(profile, "F"),
      avatarUrl: profile?.avatar_url || "",
      headline: normalizeText(profile?.freelancer_headline) || "Freelancer",
      verified: Boolean(profile?.freelancer_verified_at || row.is_verified),
    },
    badges: [
      row.is_pro ? "Pro" : "",
      row.is_verified ? "Verified" : "",
    ].filter(Boolean),
  };
}

function normalizeRequestPost(row, profile, mediaRows) {
  const media = (mediaRows || []).map((item) => ({
    ...item,
    publicUrl: getPublicUrl(REQUEST_MEDIA_BUCKET, item.bucket_path),
  }));
  const profileLocation = buildPhilippinesLocationLabel({
    region: profile?.region,
    city: profile?.city,
    barangay: profile?.barangay,
  });

  return {
    id: `request-${row.id}`,
    sourceId: row.id,
    type: "request",
    typeLabel: "Request listing",
    title: normalizeText(row.title) || "Untitled request",
    category: normalizeText(row.category) || "Uncategorized",
    description: normalizeText(row.description) || "Open customer request.",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dateLabel: formatFeedDate(row.created_at),
    priceLabel: formatPeso(row.budget_amount),
    location: normalizeText(row.location) || profileLocation || "Location not set",
    metaLabel: normalizeText(row.timeline) || "Timeline not set",
    ownerId: row.customer_id,
    detailPath: `/dashboard/freelancer/browse-requests/${row.id}`,
    sharePath: `/dashboard/freelancer/browse-requests/${row.id}`,
    media,
    previewMedia: media[0] || null,
    author: {
      id: row.customer_id,
      name: buildDisplayName(profile, "Customer"),
      initials: buildInitials(profile, "C"),
      avatarUrl: profile?.avatar_url || "",
      headline: profileLocation || "Customer",
    },
    badges: ["Open request"],
  };
}

async function loadServicePosts(limit) {
  const { data: serviceRows, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = serviceRows || [];
  const ids = rows.map((item) => item.id).filter(Boolean);

  const [{ data: mediaRows, error: mediaError }, { data: packageRows, error: packageError }] =
    await Promise.all([
      ids.length > 0
        ? supabase
            .from("service_media")
            .select("id, service_id, bucket_path, media_kind, original_name, sort_order, is_cover")
            .in("service_id", ids)
            .order("is_cover", { ascending: false })
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      ids.length > 0
        ? supabase
            .from("service_packages")
            .select("id, service_id, price")
            .in("service_id", ids)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (mediaError) throw mediaError;
  if (packageError) throw packageError;

  const mediaMap = groupBy(mediaRows, "service_id");
  const packageMap = groupBy(packageRows, "service_id");

  return rows.map((row) =>
    normalizeServicePost(row, mediaMap.get(row.id) || [], packageMap.get(row.id) || [])
  );
}

async function loadRequestPosts(limit) {
  const { data: requestRows, error } = await supabase
    .from("customer_requests")
    .select(REQUEST_COLUMNS)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = requestRows || [];
  const requestIds = rows.map((item) => item.id).filter(Boolean);
  const customerIds = Array.from(new Set(rows.map((item) => item.customer_id).filter(Boolean)));

  const [{ data: profiles, error: profileError }, { data: mediaRows, error: mediaError }] =
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
            .select("id, request_id, bucket_path, media_kind, original_name, sort_order")
            .in("request_id", requestIds)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (profileError) throw profileError;
  if (mediaError) throw mediaError;

  const profileMap = new Map((profiles || []).map((item) => [item.id, item]));
  const mediaMap = groupBy(mediaRows, "request_id");

  return rows.map((row) =>
    normalizeRequestPost(row, profileMap.get(row.customer_id), mediaMap.get(row.id) || [])
  );
}

export function useNewsFeed({ limit = 24 } = {}) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setWarning("");
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || "");

      const [serviceResult, requestResult] = await Promise.allSettled([
        loadServicePosts(limit),
        loadRequestPosts(limit),
      ]);

      const nextPosts = [
        ...(serviceResult.status === "fulfilled" ? serviceResult.value : []),
        ...(requestResult.status === "fulfilled" ? requestResult.value : []),
      ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setPosts(nextPosts.slice(0, limit * 2));

      const failed = [serviceResult, requestResult].filter(
        (result) => result.status === "rejected"
      );

      if (failed.length > 0 && nextPosts.length > 0) {
        setWarning("Some feed posts could not be loaded. Refresh to try again.");
      } else if (failed.length > 0) {
        throw failed[0].reason;
      }
    } catch (nextError) {
      setPosts([]);
      setError(String(nextError?.message || "We couldn't load the news feed right now."));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    posts,
    warning,
    error,
    currentUserId,
    reload: load,
  };
}
