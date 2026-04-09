import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfile } from "../../../lib/supabase/auth";
import { createClient } from "../../../lib/supabase/client";
import { emitProfileUpdated } from "../../../lib/profileSync";
import {
  buildPhilippinesLocationLabel,
  PHILIPPINES_COUNTRY,
} from "../../../lib/phLocations";
import {
  SHOWCASE_SLOT_LIMIT,
  buildCustomerAchievementMetrics,
  getAchievementById,
  resolveCustomerAchievementStates,
} from "../shared/customerAchievements";

const supabase = createClient();

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function friendlySupabaseMessage(error, fallback) {
  const message = String(error?.message || "");

  if (
    /column .*(display_name|address|age|first_name|last_name|region|city|barangay)/i.test(
      message
    )
  ) {
    return "Some profile details couldn't be loaded.";
  }

  if (/bucket/i.test(message) || /storage/i.test(message)) {
    return "Profile photo uploads are unavailable at the moment.";
  }

  if (/customer_achievement_unlocks|customer_badge_showcase/i.test(message)) {
    return "Some profile achievements couldn't be loaded.";
  }

  if (/row-level security|permission denied/i.test(message)) {
    return "That profile action isn't available at the moment.";
  }

  return fallback;
}

function toObjectMap(rows, keyName, valueName) {
  return Object.fromEntries(
    (rows || []).map((row) => [row[keyName], row[valueName]])
  );
}

function sanitizeFileName(name) {
  return String(name || "avatar")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFileExtension(file) {
  const fromName = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  switch (file?.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

async function fetchSavedItems(userId) {
  const { data, error } = await supabase
    .from("saved_services")
    .select(
      `
      id,
      created_at,
      service_id,
      services (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchSavedCount(userId) {
  const { count, error } = await supabase
    .from("saved_services")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return Number(count || 0);
}

async function fetchOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      service_id,
      customer_id,
      freelancer_id,
      status,
      total_price,
      created_at,
      services (*),
      freelancer:profiles!orders_freelancer_id_fkey (*)
    `
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchReviews(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      order_id,
      reviewer_id,
      rating,
      comment,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey (*)
    `
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).filter((review) => review.reviewer?.role === "freelancer");
}

async function fetchAchievementUnlockMap(userId) {
  const { data, error } = await supabase
    .from("customer_achievement_unlocks")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  if (error) throw error;
  return toObjectMap(data || [], "achievement_id", "unlocked_at");
}

async function fetchBadgeShowcase(userId) {
  const { data, error } = await supabase
    .from("customer_badge_showcase")
    .select("slot, achievement_id")
    .eq("user_id", userId)
    .order("slot", { ascending: true });

  if (error) throw error;
  return (data || [])
    .sort((a, b) => Number(a.slot || 0) - Number(b.slot || 0))
    .map((row) => row.achievement_id);
}

async function fetchMfaStatus() {
  const [factorResult, assuranceResult] = await Promise.allSettled([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const factors =
    factorResult.status === "fulfilled" ? factorResult.value.data?.all || [] : [];
  const currentLevel =
    assuranceResult.status === "fulfilled"
      ? assuranceResult.value.data?.currentLevel
      : null;

  return {
    enabled:
      currentLevel === "aal2" ||
      factors.some((factor) => factor.status === "verified"),
    available:
      factorResult.status === "fulfilled" || assuranceResult.status === "fulfilled",
  };
}

function validateAvatarFile(file) {
  if (!file) {
    throw new Error("Choose an image before saving.");
  }

  if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Use a JPG, PNG, or WEBP image for your profile photo.");
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("Profile photos must be 5 MB or smaller.");
  }
}

async function uploadAvatarFile(userId, file) {
  validateAvatarFile(file);

  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name);
  const path = `customers/${userId}/${Date.now()}-${safeName || "avatar"}.${extension}`;

  const { error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function useCustomerProfileData() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [unlockMap, setUnlockMap] = useState({});
  const [showcaseIds, setShowcaseIds] = useState([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [capabilities, setCapabilities] = useState({
    canPersistAchievements: true,
    canPersistShowcase: true,
  });

  const syncInFlightRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setWarnings([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setUserId(null);
        setProfile(null);
        setSavedItems([]);
        setOrders([]);
        setReviews([]);
        setUnlockMap({});
        setShowcaseIds([]);
        setMfaEnabled(false);
        return;
      }

      const nextUserId = session.user.id;
      setUserId(nextUserId);

      const [
        profileRes,
        savedRes,
        ordersRes,
        reviewsRes,
        unlockRes,
        showcaseRes,
        mfaRes,
      ] = await Promise.allSettled([
        getProfile(),
        fetchSavedItems(nextUserId),
        fetchOrders(nextUserId),
        fetchReviews(nextUserId),
        fetchAchievementUnlockMap(nextUserId),
        fetchBadgeShowcase(nextUserId),
        fetchMfaStatus(),
      ]);

      const nextWarnings = [];

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
      } else {
        nextWarnings.push(
          friendlySupabaseMessage(profileRes.reason, "We couldn't load your profile.")
        );
        setProfile(null);
      }

      setSavedItems(savedRes.status === "fulfilled" ? savedRes.value : []);
      if (savedRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(savedRes.reason, "We couldn't load your saved listings.")
        );
      }

      setOrders(ordersRes.status === "fulfilled" ? ordersRes.value : []);
      if (ordersRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(ordersRes.reason, "We couldn't load your orders.")
        );
      }

      setReviews(reviewsRes.status === "fulfilled" ? reviewsRes.value : []);
      if (reviewsRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(reviewsRes.reason, "We couldn't load your reviews.")
        );
      }

      setUnlockMap(unlockRes.status === "fulfilled" ? unlockRes.value : {});
      setShowcaseIds(showcaseRes.status === "fulfilled" ? showcaseRes.value : []);
      setCapabilities({
        canPersistAchievements: unlockRes.status === "fulfilled",
        canPersistShowcase: showcaseRes.status === "fulfilled",
      });

      if (unlockRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(
            unlockRes.reason,
            "Some achievements couldn't be updated."
          )
        );
      }

      if (showcaseRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(
            showcaseRes.reason,
            "Your badge showcase couldn't be updated."
          )
        );
      }

      setMfaEnabled(
        mfaRes.status === "fulfilled" ? Boolean(mfaRes.value.enabled) : false
      );
      if (mfaRes.status === "rejected") {
        nextWarnings.push(
          friendlySupabaseMessage(mfaRes.reason, "We couldn't read your 2FA status.")
        );
      }

      setWarnings(nextWarnings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(
    () =>
      buildCustomerAchievementMetrics({
        profile,
        savedItems,
        orders,
        reviews,
        mfaEnabled,
        showcaseIds,
      }),
    [mfaEnabled, orders, profile, reviews, savedItems, showcaseIds]
  );

  const achievementStates = useMemo(
    () =>
      resolveCustomerAchievementStates({
        metrics,
        unlockMap,
        showcaseIds,
      }),
    [metrics, showcaseIds, unlockMap]
  );

  const earnedAchievements = useMemo(
    () => achievementStates.filter((achievement) => achievement.earned),
    [achievementStates]
  );

  const showcasedBadges = useMemo(
    () =>
      showcaseIds
        .map((achievementId) => getAchievementById(achievementId))
        .filter(Boolean),
    [showcaseIds]
  );

  const progressTasks = useMemo(
    () => [
      {
        id: "display-name",
        label: "Add a display name",
        detail: "Help creators recognize you quickly.",
        complete: metrics.hasDisplayName,
      },
      {
        id: "profile-photo",
        label: "Upload a profile photo",
        detail: "A real face makes the request feel more human.",
        complete: metrics.hasAvatar,
      },
      {
        id: "bio",
        label: "Write your bio",
        detail: "Give creators context before they respond.",
        complete: metrics.hasBio,
      },
      {
        id: "location",
        label: "Add your location",
        detail: "Location helps with local expectations and logistics.",
        complete: metrics.hasLocation,
      },
      {
        id: "mfa",
        label: "Enable 2FA",
        detail: "Extra sign-in protection helps keep your account safer.",
        complete: metrics.mfaEnabled,
      },
      {
        id: "save-listing",
        label: "Save a first listing",
        detail: "Build a shortlist so your profile starts feeling active.",
        complete: metrics.savedCount >= 1,
      },
    ],
    [metrics]
  );

  const pendingUnlockIds = useMemo(
    () =>
      achievementStates
        .filter((achievement) => achievement.earned && !unlockMap[achievement.id])
        .map((achievement) => achievement.id),
    [achievementStates, unlockMap]
  );

  useEffect(() => {
    if (!userId || !capabilities.canPersistAchievements) return;
    if (loading || pendingUnlockIds.length === 0) return;
    if (syncInFlightRef.current) return;

    syncInFlightRef.current = true;

    const syncUnlocks = async () => {
      try {
        const timestamp = new Date().toISOString();
        const payload = pendingUnlockIds.map((achievementId) => ({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: timestamp,
        }));

        const { error } = await supabase
          .from("customer_achievement_unlocks")
          .upsert(payload, { onConflict: "user_id,achievement_id" });

        if (error) throw error;

        setUnlockMap((prev) => ({
          ...prev,
          ...Object.fromEntries(
            pendingUnlockIds.map((achievementId) => [achievementId, timestamp])
          ),
        }));
      } catch (error) {
        setWarnings((prev) => [
          ...prev,
          friendlySupabaseMessage(
            error,
            "New achievements were found, but they couldn't be saved yet."
          ),
        ]);
        setCapabilities((prev) => ({
          ...prev,
          canPersistAchievements: false,
        }));
      } finally {
        syncInFlightRef.current = false;
      }
    };

    syncUnlocks();
  }, [capabilities.canPersistAchievements, loading, pendingUnlockIds, userId]);

  const saveProfile = useCallback(
    async ({
      firstName,
      lastName,
      displayName,
      bio,
      region,
      city,
      barangay,
      age,
      avatarFile,
      removeAvatar = false,
    }) => {
      if (!userId) {
        throw new Error("You need to be signed in to update your profile.");
      }

      const normalizedFirstName = String(firstName || "").trim();
      const normalizedLastName = String(lastName || "").trim();

      if (!normalizedFirstName) {
        throw new Error("Please add your first name.");
      }

      if (!normalizedLastName) {
        throw new Error("Please add your last name.");
      }

      let normalizedAge = null;
      if (age !== "" && age != null) {
        const numericAge = Number(age);

        if (!Number.isInteger(numericAge) || numericAge <= 0) {
          throw new Error("Please enter a valid age.");
        }

        normalizedAge = numericAge;
      }

      const normalizedRegion = String(region || "").trim();
      const normalizedCity = String(city || "").trim();
      const normalizedBarangay = String(barangay || "").trim();
      const normalizedLocation = buildPhilippinesLocationLabel({
        region: normalizedRegion,
        city: normalizedCity,
        barangay: normalizedBarangay,
      });

      let nextAvatarUrl = removeAvatar ? null : profile?.avatar_url || null;

      if (avatarFile) {
        nextAvatarUrl = await uploadAvatarFile(userId, avatarFile);
      }

      const payload = {
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        display_name: String(displayName || "").trim() || null,
        bio: String(bio || "").trim() || null,
        country:
          normalizedRegion || normalizedCity || normalizedBarangay
            ? PHILIPPINES_COUNTRY
            : null,
        region: normalizedRegion || null,
        city: normalizedCity || null,
        barangay: normalizedBarangay || null,
        address: normalizedLocation || null,
        age: normalizedAge,
        avatar_url: nextAvatarUrl,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) {
        throw new Error(
          friendlySupabaseMessage(error, "We couldn't save your profile. Please try again.")
        );
      }

      const nextProfile = {
        ...data,
        email: profile?.email || "",
      };

      setProfile(nextProfile);
      emitProfileUpdated(nextProfile);
      return nextProfile;
    },
    [profile?.avatar_url, profile?.email, userId]
  );

  const saveBadgeShowcase = useCallback(
    async (nextIds) => {
      if (!userId) {
        throw new Error("You need to be signed in to update your badge showcase.");
      }

      if (!capabilities.canPersistShowcase) {
        throw new Error("Badge showcase changes are unavailable at the moment.");
      }

      const uniqueIds = Array.from(
        new Set((nextIds || []).filter(Boolean))
      ).slice(0, SHOWCASE_SLOT_LIMIT);

      const previousIds = showcaseIds;
      setShowcaseIds(uniqueIds);

      try {
        const { error: clearError } = await supabase
          .from("customer_badge_showcase")
          .delete()
          .eq("user_id", userId);

        if (clearError) throw clearError;

        if (uniqueIds.length > 0) {
          const rows = uniqueIds.map((achievementId, index) => ({
            user_id: userId,
            achievement_id: achievementId,
            slot: index + 1,
          }));

          const { error: insertError } = await supabase
            .from("customer_badge_showcase")
            .insert(rows);

          if (insertError) throw insertError;
        }
      } catch (error) {
        setShowcaseIds(previousIds);
        throw new Error(
          friendlySupabaseMessage(error, "We couldn't update your badge showcase.")
        );
      }
    },
    [capabilities.canPersistShowcase, showcaseIds, userId]
  );

  return {
    loading,
    userId,
    profile,
    savedItems,
    orders,
    reviews,
    warnings,
    metrics,
    progressTasks,
    achievementStates,
    earnedAchievements,
    showcasedBadges,
    showcaseIds,
    mfaEnabled,
    capabilities,
    saveProfile,
    saveBadgeShowcase,
    reload: load,
  };
}

export function useCustomerOrdersData() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          if (!active) return;
          setOrders([]);
          setSavedCount(0);
          return;
        }

        const [ordersResult, savedCountResult] = await Promise.allSettled([
          fetchOrders(session.user.id),
          fetchSavedCount(session.user.id),
        ]);

        if (!active) return;

        if (ordersResult.status === "fulfilled") {
          setOrders(ordersResult.value);
        } else {
          throw ordersResult.reason;
        }

        setSavedCount(
          savedCountResult.status === "fulfilled" ? savedCountResult.value : 0
        );
      } catch (nextError) {
        if (!active) return;
        setOrders([]);
        setSavedCount(0);
        setError(
          friendlySupabaseMessage(nextError, "We couldn't load your orders.")
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  return {
    loading,
    orders,
    savedCount,
    error,
  };
}
