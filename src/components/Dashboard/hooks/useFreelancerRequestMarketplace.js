import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { REQUEST_MEDIA_BUCKET } from "./useCustomerRequests";

const supabase = createClient();

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

function formatPeso(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Budget not specified";
  return `₱${numeric.toLocaleString("en-PH")}`;
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

function buildCustomerName(profile) {
  if (!profile) return "Customer";

  const displayName = String(profile.display_name || "").trim();
  if (displayName) return displayName;

  const fullName = [profile.first_name, profile.last_name]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Customer";
}

function buildCustomerInitials(profile) {
  const initials = [profile?.first_name, profile?.last_name]
    .map((part) => String(part || "").trim().charAt(0))
    .join("")
    .toUpperCase();

  return initials || buildCustomerName(profile).charAt(0).toUpperCase() || "C";
}

function getPublicMediaUrl(bucketPath) {
  if (!bucketPath) return "";
  const { data } = supabase.storage.from(REQUEST_MEDIA_BUCKET).getPublicUrl(bucketPath);
  return data?.publicUrl || "";
}

function normalizeRequest(row, profile, mediaRows) {
  const customerLocation = buildPhilippinesLocationLabel({
    region: profile?.region,
    city: profile?.city,
  });
  const media = (mediaRows || []).map((item) => ({
    ...item,
    publicUrl: getPublicMediaUrl(item.bucket_path),
  }));

  return {
    ...row,
    customer: {
      id: profile?.id || row.customer_id,
      displayName: buildCustomerName(profile),
      initials: buildCustomerInitials(profile),
      avatarUrl: profile?.avatar_url || "",
      location: customerLocation || "Philippines",
      bio: String(profile?.bio || "").trim(),
    },
    media,
    previewMedia: media[0] || null,
    budgetLabel: formatPeso(row.budget_amount),
    deadlineLabel: formatDeadline(row.timeline),
    locationLabel: String(row.location || "").trim() || customerLocation || "Location not specified",
  };
}

async function loadMarketplaceRequests({ limit = null, requestId = "" } = {}) {
  let query = supabase
    .from("customer_requests")
    .select(REQUEST_COLUMNS)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (requestId) {
    query = query.eq("id", requestId).limit(1);
  } else if (typeof limit === "number" && limit > 0) {
    query = query.limit(limit);
  }

  const { data: requestRows, error: requestError } = await query;

  if (requestError) throw requestError;

  const rows = requestRows || [];
  const customerIds = Array.from(new Set(rows.map((row) => row.customer_id).filter(Boolean)));
  const requestIds = rows.map((row) => row.id);

  const [{ data: profiles, error: profileError }, { data: mediaRows, error: mediaError }] =
    await Promise.all([
      customerIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, display_name, first_name, last_name, avatar_url, bio, region, city, barangay")
            .in("id", customerIds)
        : Promise.resolve({ data: [], error: null }),
      requestIds.length > 0
        ? supabase
            .from("customer_request_media")
            .select("id, request_id, bucket_path, media_kind, mime_type, original_name, sort_order")
            .in("request_id", requestIds)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (profileError) throw profileError;
  if (mediaError) throw mediaError;

  const profileMap = new Map((profiles || []).map((entry) => [entry.id, entry]));
  const mediaMap = new Map();

  (mediaRows || []).forEach((item) => {
    const existing = mediaMap.get(item.request_id) || [];
    existing.push(item);
    mediaMap.set(item.request_id, existing);
  });

  return rows.map((row) =>
    normalizeRequest(row, profileMap.get(row.customer_id), mediaMap.get(row.id))
  );
}

export function useFreelancerRequestMarketplace({ limit = null, requestId = "" } = {}) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextRequests = await loadMarketplaceRequests({ limit, requestId });
      setRequests(nextRequests);
    } catch (nextError) {
      setRequests([]);
      setError(
        String(
          nextError?.message || "We couldn't load request listings right now."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [limit, requestId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    requests,
    request: requestId ? requests[0] || null : null,
    error,
    reload: load,
  };
}

export function useFreelancerRequestPreview(limit = 3) {
  return useFreelancerRequestMarketplace({ limit });
}

export function useFreelancerRequestDetail(requestId) {
  return useFreelancerRequestMarketplace({ requestId });
}

export function useFreelancerRequestFilters(requests, { search = "", category = "All", sort = "newest" } = {}) {
  return useMemo(() => {
    let next = Array.isArray(requests) ? [...requests] : [];
    const normalizedSearch = String(search || "").trim().toLowerCase();

    if (normalizedSearch) {
      next = next.filter((item) =>
        [
          item.title,
          item.category,
          item.description,
          item.locationLabel,
          item.customer?.displayName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      );
    }

    if (category && category !== "All") {
      next = next.filter((item) => item.category === category);
    }

    switch (sort) {
      case "deadline":
        next.sort((a, b) => String(a.timeline || "").localeCompare(String(b.timeline || "")));
        break;
      case "budget_desc":
        next.sort((a, b) => Number(b.budget_amount || 0) - Number(a.budget_amount || 0));
        break;
      case "budget_asc":
        next.sort((a, b) => Number(a.budget_amount || 0) - Number(b.budget_amount || 0));
        break;
      default:
        next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return next;
  }, [category, requests, search, sort]);
}
