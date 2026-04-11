import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";

const supabase = createClient();
export const REQUEST_MEDIA_BUCKET = "customer-request-media";
export const REQUEST_MEDIA_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const REQUEST_MEDIA_ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
export const REQUEST_MEDIA_MAX_IMAGES = 8;
export const REQUEST_MEDIA_MAX_VIDEOS = 1;
export const REQUEST_MEDIA_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const REQUEST_MEDIA_MAX_VIDEO_BYTES = 40 * 1024 * 1024;

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

export const REQUEST_CATEGORY_OPTIONS = ALL_SERVICE_CATEGORIES;

function getCustomerRequestErrorMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/customer_requests/i.test(message) || error?.code === "42P01") {
    return "We couldn't load your requests. Please try again.";
  }

  if (/row-level security|permission denied/i.test(message) || error?.code === "42501") {
    return "That request action isn't available at the moment.";
  }

  return fallback;
}

function normalizeBudgetAmount(value) {
  if (value === "" || value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeRequestMediaName(name) {
  return String(name || "attachment")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRequestMediaKind(file) {
  return String(file?.type || "").startsWith("video/") ? "video" : "image";
}

async function uploadRequestAttachments({ userId, requestId, attachments }) {
  const uploadedPaths = [];

  try {
    for (let index = 0; index < attachments.length; index += 1) {
      const file = attachments[index];
      const safeName = sanitizeRequestMediaName(file.name);
      const bucketPath = `${userId}/${requestId}/${index + 1}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(REQUEST_MEDIA_BUCKET)
        .upload(bucketPath, file, {
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;
      uploadedPaths.push(bucketPath);
    }

    const rows = attachments.map((file, index) => ({
      request_id: requestId,
      customer_id: userId,
      bucket_path: uploadedPaths[index],
      media_kind: getRequestMediaKind(file),
      mime_type: String(file.type || "").trim() || "application/octet-stream",
      original_name: String(file.name || "").trim() || `attachment-${index + 1}`,
      sort_order: index + 1,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("customer_request_media")
        .insert(rows);

      if (insertError) throw insertError;
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(REQUEST_MEDIA_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
}

export async function createCustomerRequest({
  title,
  category,
  description,
  budgetAmount,
  location,
  timeline,
  attachments = [],
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("You need to be signed in before posting a request.");
  }

  const payload = {
    customer_id: session.user.id,
    title: String(title || "").trim(),
    category: String(category || "").trim(),
    description: String(description || "").trim(),
    budget_amount: normalizeBudgetAmount(budgetAmount),
    location: String(location || "").trim() || null,
    timeline: String(timeline || "").trim(),
    status: "open",
  };

  const { data, error } = await supabase
    .from("customer_requests")
    .insert(payload)
    .select(REQUEST_COLUMNS)
    .single();

  if (error) {
    throw new Error(
      getCustomerRequestErrorMessage(
        error,
        "We couldn't post your request. Please try again."
      )
    );
  }

  try {
    if (attachments.length > 0) {
      await uploadRequestAttachments({
        userId: session.user.id,
        requestId: data.id,
        attachments,
      });
    }
    return data;
  } catch (error) {
    await supabase.from("customer_requests").delete().eq("id", data.id);
    throw new Error(
      getCustomerRequestErrorMessage(
        error,
        "We couldn't save your attachments. Please try again."
      )
    );
  }
}

export function useCustomerRequests({ limit = 4 } = {}) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setRequests([]);
        setOpenCount(0);
        return;
      }

      const listQuery = supabase
        .from("customer_requests")
        .select(REQUEST_COLUMNS)
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (typeof limit === "number" && limit > 0) {
        listQuery.limit(limit);
      }

      const [requestsResult, countResult] = await Promise.all([
        listQuery,
        supabase
          .from("customer_requests")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", session.user.id)
          .eq("status", "open"),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (countResult.error) throw countResult.error;

      setRequests(requestsResult.data || []);
      setOpenCount(Number(countResult.count || 0));
    } catch (nextError) {
      setRequests([]);
      setOpenCount(0);
      setError(
        getCustomerRequestErrorMessage(
          nextError,
          "We couldn't load your requests."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    requests,
    openCount,
    error,
    reload: load,
  };
}
