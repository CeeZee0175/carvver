import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

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

export const REQUEST_CATEGORY_OPTIONS = [
  "Art & Illustration",
  "Photography",
  "Video Editing",
  "Graphic Design",
  "Voice Over",
  "Social Media",
  "Tutoring",
  "Handmade Products",
];

export const REQUEST_TIMELINE_OPTIONS = [
  "ASAP",
  "This week",
  "This month",
  "Flexible",
];

function getCustomerRequestErrorMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/customer_requests/i.test(message) || error?.code === "42P01") {
    return "Customer requests are unavailable right now.";
  }

  if (/row-level security|permission denied/i.test(message) || error?.code === "42501") {
    return "This request action is unavailable right now.";
  }

  return fallback;
}

function normalizeBudgetAmount(value) {
  if (value === "" || value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function createCustomerRequest({
  title,
  category,
  description,
  budgetAmount,
  location,
  timeline,
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
        "We couldn't post your request just yet. Please try again."
      )
    );
  }

  return data;
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
          "We couldn't load your requests right now."
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
