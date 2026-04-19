import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { emitCartUpdated, CART_UPDATED_EVENT } from "../../../lib/cartSync";

const supabase = createClient();

export const CART_COMMISSION_RATE = 0.05;

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function calculatePlatformFee(amount) {
  return roundCurrency(Number(amount || 0) * CART_COMMISSION_RATE);
}

export function calculateFreelancerNet(amount) {
  return roundCurrency(Number(amount || 0) - calculatePlatformFee(amount));
}

export function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function friendlyCartMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/cart_items/i.test(message)) {
    return "We couldn't load your cart. Please try again.";
  }

  if (/customer_checkout_sessions|customer_checkout_items/i.test(message)) {
    return "Checkout is unavailable. Please try again.";
  }

  if (/FunctionsHttpError|function/i.test(message) && /paymongo/i.test(message)) {
    return "Payment is unavailable at the moment.";
  }

  if (/row-level security|permission denied/i.test(message)) {
    return "That cart action isn't available at the moment.";
  }

  return fallback;
}

async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      service_id,
      selected_package_id,
      selected_package_name,
      selected_package_summary,
      selected_package_price,
      selected_package_delivery_time_days,
      selected_package_revisions,
      selected_package_included_items,
      created_at,
      services (
        id,
        title,
        description,
        category,
        price,
        location,
        fulfillment_type,
        is_published,
        is_pro,
        is_verified,
        freelancer_id,
        profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          country
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function normalizePackageSnapshot(selectedPackage) {
  if (!selectedPackage) {
    return {
      selected_package_id: null,
      selected_package_name: null,
      selected_package_summary: null,
      selected_package_price: null,
      selected_package_delivery_time_days: null,
      selected_package_revisions: null,
      selected_package_included_items: null,
    };
  }

  const includedItems = Array.isArray(selectedPackage.includedItems)
    ? selectedPackage.includedItems
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  return {
    selected_package_id: selectedPackage.id || null,
    selected_package_name: String(selectedPackage.name || "").trim() || null,
    selected_package_summary:
      String(selectedPackage.summary || "").trim() || null,
    selected_package_price: Number.isFinite(Number(selectedPackage.price))
      ? Number(selectedPackage.price)
      : null,
    selected_package_delivery_time_days: Number.isFinite(
      Number(selectedPackage.deliveryTimeDays)
    )
      ? Number(selectedPackage.deliveryTimeDays)
      : null,
    selected_package_revisions: Number.isFinite(Number(selectedPackage.revisions))
      ? Number(selectedPackage.revisions)
      : null,
    selected_package_included_items:
      includedItems.length > 0 ? includedItems : null,
  };
}

function packageSnapshotMatches(item, snapshot) {
  return (
    String(item?.selected_package_id || "") ===
      String(snapshot?.selected_package_id || "") &&
    String(item?.selected_package_name || "") ===
      String(snapshot?.selected_package_name || "") &&
    Number(item?.selected_package_price || 0) ===
      Number(snapshot?.selected_package_price || 0)
  );
}

export function useCart() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const syncCartForSession = useCallback(async (session) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError("");

    if (!session?.user?.id) {
      setUserId(null);
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setUserId(session.user.id);

    try {
      const nextItems = await fetchCartItems(session.user.id);

      if (requestIdRef.current !== requestId) return;
      setItems(nextItems);
    } catch (nextError) {
      if (requestIdRef.current !== requestId) return;

      setItems([]);
      setError(
        friendlyCartMessage(nextError, "We couldn't load your cart.")
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await syncCartForSession(session);
    } catch (nextError) {
      setItems([]);
      setError(
        friendlyCartMessage(nextError, "We couldn't load your cart.")
      );
      setLoading(false);
    }
  }, [syncCartForSession]);

  useEffect(() => {
    let active = true;

    const handleSession = async (session) => {
      if (!active) return;
      await syncCartForSession(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        handleSession(session);
      })
      .catch((nextError) => {
        if (!active) return;
        setItems([]);
        setError(
          friendlyCartMessage(nextError, "Couldn't load your cart yet.")
        );
        setLoading(false);
      });

    return () => {
      active = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [syncCartForSession]);

  useEffect(() => {
    const handleCartUpdated = () => {
      reload();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [reload]);

  const addItem = useCallback(
    async (input, options = {}) => {
      const service = input?.service || input;
      const selectedPackage =
        input?.selectedPackage || options.selectedPackage || null;

      if (!service?.id) {
        throw new Error("This service listing cannot be added to the cart.");
      }

      if (service.is_published === false) {
        throw new Error("Only published services can be added to the cart.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Please sign in to add listings to your cart.");
      }

      setUserId(session.user.id);

      const snapshot = normalizePackageSnapshot(selectedPackage);
      const existingItem = items.find((item) => item.service_id === service.id);

      if (existingItem) {
        if (packageSnapshotMatches(existingItem, snapshot)) {
          emitCartUpdated({ serviceId: service.id, action: "duplicate" });
          return { duplicate: true, updated: false };
        }

        const { error: updateError } = await supabase
          .from("cart_items")
          .update(snapshot)
          .eq("user_id", session.user.id)
          .eq("service_id", service.id);

        if (updateError) throw updateError;

        emitCartUpdated({ serviceId: service.id, action: "update" });
        return { duplicate: false, updated: true };
      }

      const { error: insertError } = await supabase.from("cart_items").insert({
        user_id: session.user.id,
        service_id: service.id,
        ...snapshot,
      });

      if (insertError && insertError.code === "23505") {
        emitCartUpdated({ serviceId: service.id, action: "duplicate" });
        return { duplicate: true, updated: false };
      }

      if (insertError) throw insertError;

      emitCartUpdated({ serviceId: service.id, action: "add" });
      return { duplicate: false, updated: false };
    },
    [items]
  );

  const removeItem = useCallback(
    async (serviceId) => {
      if (!serviceId) return;

      const nextUserId =
        userId ||
        (
          await supabase.auth.getSession()
        ).data.session?.user.id;

      if (!nextUserId) {
        throw new Error("Please sign in to update your cart.");
      }

      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", nextUserId)
        .eq("service_id", serviceId);

      if (deleteError) throw deleteError;

      emitCartUpdated({ serviceId, action: "remove" });
    },
    [userId]
  );

  const clearCart = useCallback(
    async (serviceIds = []) => {
      const nextUserId =
        userId ||
        (
          await supabase.auth.getSession()
        ).data.session?.user.id;

      if (!nextUserId) {
        throw new Error("Please sign in to update your cart.");
      }

      let query = supabase.from("cart_items").delete().eq("user_id", nextUserId);

      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        query = query.in("service_id", serviceIds);
      }

      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;

      emitCartUpdated({
        action: "clear",
        serviceIds,
      });
    },
    [userId]
  );

  const count = items.length;
  const serviceIds = useMemo(
    () => items.map((item) => item.service_id).filter(Boolean),
    [items]
  );

  return {
    loading,
    error,
    items,
    count,
    serviceIds,
    addItem,
    removeItem,
    clearCart,
    reload,
  };
}
