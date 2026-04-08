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
    return "Run the cart SQL first so the cart tables and policies exist in Supabase.";
  }

  if (/customer_checkout_sessions|customer_checkout_items/i.test(message)) {
    return "Run the cart checkout SQL first so checkout tracking tables exist.";
  }

  if (/FunctionsHttpError|function/i.test(message) && /paymongo/i.test(message)) {
    return "Deploy the PayMongo edge functions first before starting checkout.";
  }

  if (/row-level security|permission denied/i.test(message)) {
    return "Supabase blocked this cart action. Check the RLS policies for the cart tables.";
  }

  return message || fallback;
}

async function parseFunctionError(error) {
  if (!error) return null;

  if (typeof error.context?.json === "function") {
    try {
      const payload = await error.context.json();
      return payload?.error || payload?.message || error.message;
    } catch {
      return error.message;
    }
  }

  return error.message;
}

async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      service_id,
      created_at,
      services (
        id,
        title,
        description,
        category,
        price,
        location,
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

export function useCart() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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
        friendlyCartMessage(nextError, "Couldn't load your cart yet.")
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
        friendlyCartMessage(nextError, "Couldn't load your cart yet.")
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
    async (service) => {
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

      const alreadyInCart = items.some((item) => item.service_id === service.id);
      if (alreadyInCart) {
        emitCartUpdated({ serviceId: service.id, action: "duplicate" });
        return { duplicate: true };
      }

      const { error: insertError } = await supabase.from("cart_items").insert({
        user_id: session.user.id,
        service_id: service.id,
      });

      if (insertError && insertError.code === "23505") {
        emitCartUpdated({ serviceId: service.id, action: "duplicate" });
        return { duplicate: true };
      }

      if (insertError) throw insertError;

      emitCartUpdated({ serviceId: service.id, action: "add" });
      return { duplicate: false };
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

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-paymongo-checkout",
        {
          body: {
            successPath: "/dashboard/customer/cart?checkout=success",
            cancelPath: "/dashboard/customer/cart?checkout=cancelled",
          },
        }
      );

      if (invokeError) {
        const nextMessage = await parseFunctionError(invokeError);
        throw new Error(nextMessage || invokeError.message);
      }

      if (!data?.checkoutUrl) {
        throw new Error("PayMongo didn't return a checkout URL.");
      }

      window.location.assign(data.checkoutUrl);
      return data;
    } catch (nextError) {
      throw new Error(
        friendlyCartMessage(nextError, "Couldn't start checkout right now.")
      );
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const count = items.length;
  const serviceIds = useMemo(
    () => items.map((item) => item.service_id).filter(Boolean),
    [items]
  );

  return {
    loading,
    checkoutLoading,
    error,
    items,
    count,
    serviceIds,
    addItem,
    removeItem,
    clearCart,
    reload,
    startCheckout,
  };
}
