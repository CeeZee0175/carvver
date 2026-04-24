import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile } from "../../../lib/supabase/auth";
import {
  FREELANCER_SHOWCASE_SLOT_LIMIT,
  buildFreelancerAchievementMetrics,
  getFreelancerAchievementById,
  resolveFreelancerAchievementStates,
} from "../shared/freelancerAchievements";

const supabase = createClient();

export const FREELANCER_VERIFICATION_BUCKET = "freelancer-verification-media";
export const VERIFICATION_MAX_FILES = 6;
export const VERIFICATION_MAX_BYTES = 50 * 1024 * 1024;
export const VERIFICATION_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function friendlyTrustMessage(error, fallback) {
  const message = String(error?.message || "");

  if (
    /freelancer_(achievement|badge|verification)|freelancer_verified|column/i.test(
      message
    )
  ) {
    return "Some freelancer trust details couldn't be loaded.";
  }

  if (/bucket|storage/i.test(message)) {
    return "Verification uploads are unavailable right now.";
  }

  if (/row-level security|permission denied/i.test(message)) {
    return "That freelancer trust action isn't available right now.";
  }

  return fallback;
}

function toObjectMap(rows, keyName, valueName) {
  return Object.fromEntries((rows || []).map((row) => [row[keyName], row[valueName]]));
}

function sanitizeFileName(name) {
  return String(name || "proof")
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
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    default:
      return "jpg";
  }
}

function resolveMediaKind(file) {
  return String(file?.type || "").startsWith("video/") ? "video" : "image";
}

function validateVerificationFiles(files) {
  if (!files.length) throw new Error("Add at least one photo or video.");
  if (files.length > VERIFICATION_MAX_FILES) {
    throw new Error(`Add up to ${VERIFICATION_MAX_FILES} files only.`);
  }

  files.forEach((file) => {
    if (!VERIFICATION_ACCEPTED_TYPES.includes(file.type)) {
      throw new Error("Use JPG, PNG, WEBP, MP4, WEBM, or MOV files.");
    }

    if (file.size > VERIFICATION_MAX_BYTES) {
      throw new Error("Each verification file must be 50 MB or smaller.");
    }
  });
}

async function fetchServices(userId) {
  const { data, error } = await supabase
    .from("services")
    .select("id, is_published, is_pro, price, created_at")
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchServiceMedia(serviceIds) {
  if (!serviceIds.length) return [];

  const { data, error } = await supabase
    .from("service_media")
    .select("id, service_id")
    .in("service_id", serviceIds);

  if (error) throw error;
  return data || [];
}

async function fetchServicePackages(serviceIds) {
  if (!serviceIds.length) return [];

  const { data, error } = await supabase
    .from("service_packages")
    .select("id, service_id")
    .in("service_id", serviceIds);

  if (error) throw error;
  return data || [];
}

async function fetchOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, total_price, freelancer_net, created_at")
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchReviews(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, reviewer_id, reviewee_id, rating, comment, created_at")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchProposals(userId) {
  const { data, error } = await supabase
    .from("customer_request_proposals")
    .select("id, status, created_at")
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchUnlockMap(userId) {
  const { data, error } = await supabase
    .from("freelancer_achievement_unlocks")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  if (error) throw error;
  return toObjectMap(data || [], "achievement_id", "unlocked_at");
}

async function fetchBadgeShowcase(userId) {
  const { data, error } = await supabase
    .from("freelancer_badge_showcase")
    .select("slot, achievement_id")
    .eq("user_id", userId)
    .order("slot", { ascending: true });

  if (error) throw error;
  return (data || [])
    .sort((a, b) => Number(a.slot || 0) - Number(b.slot || 0))
    .map((row) => row.achievement_id);
}

async function signedMediaRows(rows) {
  return Promise.all(
    (rows || []).map(async (row) => {
      try {
        const { data, error } = await supabase.storage
          .from(FREELANCER_VERIFICATION_BUCKET)
          .createSignedUrl(row.bucket_path, 60 * 30);

        if (error) throw error;
        return { ...row, signedUrl: data?.signedUrl || "" };
      } catch {
        return { ...row, signedUrl: "" };
      }
    })
  );
}

async function fetchVerificationRequests(userId) {
  const { data, error } = await supabase
    .from("freelancer_verification_requests")
    .select(
      `
      id,
      freelancer_id,
      description,
      status,
      admin_note,
      reviewed_at,
      created_at,
      updated_at,
      freelancer_verification_media (
        id,
        request_id,
        freelancer_id,
        bucket_path,
        media_kind,
        mime_type,
        original_name,
        sort_order
      )
    `
    )
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data || []).map(async (request) => ({
      ...request,
      media: await signedMediaRows(request.freelancer_verification_media || []),
    }))
  );
}

async function uploadVerificationFile({ userId, requestId, file, index }) {
  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${requestId}/${Date.now()}-${index + 1}-${safeName || "proof"}.${extension}`;

  const { error } = await supabase.storage
    .from(FREELANCER_VERIFICATION_BUCKET)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw error;
  return path;
}

export function useFreelancerTrustData() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceMedia, setServiceMedia] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [unlockMap, setUnlockMap] = useState({});
  const [showcaseIds, setShowcaseIds] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [capabilities, setCapabilities] = useState({
    canPersistAchievements: true,
    canPersistShowcase: true,
    canSubmitVerification: true,
  });

  const syncInFlightRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setWarnings([]);

    try {
      const nextProfile = await getProfile();
      const userId = nextProfile?.id;
      setProfile(nextProfile);

      if (!userId) {
        setServices([]);
        setServiceMedia([]);
        setServicePackages([]);
        setOrders([]);
        setReviews([]);
        setProposals([]);
        setUnlockMap({});
        setShowcaseIds([]);
        setVerificationRequests([]);
        return;
      }

      const servicesRes = await fetchServices(userId);
      const serviceIds = servicesRes.map((service) => service.id).filter(Boolean);

      const [
        mediaRes,
        packageRes,
        orderRes,
        reviewRes,
        proposalRes,
        unlockRes,
        showcaseRes,
        verificationRes,
      ] = await Promise.allSettled([
        fetchServiceMedia(serviceIds),
        fetchServicePackages(serviceIds),
        fetchOrders(userId),
        fetchReviews(userId),
        fetchProposals(userId),
        fetchUnlockMap(userId),
        fetchBadgeShowcase(userId),
        fetchVerificationRequests(userId),
      ]);

      const nextWarnings = [];

      setServices(servicesRes);
      setServiceMedia(mediaRes.status === "fulfilled" ? mediaRes.value : []);
      setServicePackages(packageRes.status === "fulfilled" ? packageRes.value : []);
      setOrders(orderRes.status === "fulfilled" ? orderRes.value : []);
      setReviews(reviewRes.status === "fulfilled" ? reviewRes.value : []);
      setProposals(proposalRes.status === "fulfilled" ? proposalRes.value : []);
      setUnlockMap(unlockRes.status === "fulfilled" ? unlockRes.value : {});
      setShowcaseIds(showcaseRes.status === "fulfilled" ? showcaseRes.value : []);
      setVerificationRequests(
        verificationRes.status === "fulfilled" ? verificationRes.value : []
      );

      [mediaRes, packageRes, orderRes, reviewRes, proposalRes].forEach((result) => {
        if (result.status === "rejected") {
          nextWarnings.push(
            friendlyTrustMessage(result.reason, "Some activity details couldn't be loaded.")
          );
        }
      });

      setCapabilities({
        canPersistAchievements: unlockRes.status === "fulfilled",
        canPersistShowcase: showcaseRes.status === "fulfilled",
        canSubmitVerification: verificationRes.status === "fulfilled",
      });

      if (unlockRes.status === "rejected") {
        nextWarnings.push(
          friendlyTrustMessage(unlockRes.reason, "Some achievements couldn't be updated.")
        );
      }

      if (showcaseRes.status === "rejected") {
        nextWarnings.push(
          friendlyTrustMessage(showcaseRes.reason, "Your badge showcase couldn't be updated.")
        );
      }

      if (verificationRes.status === "rejected") {
        nextWarnings.push(
          friendlyTrustMessage(
            verificationRes.reason,
            "Your verification requests couldn't be loaded."
          )
        );
      }

      setWarnings(Array.from(new Set(nextWarnings)));
    } catch (error) {
      setProfile(null);
      setWarnings([
        friendlyTrustMessage(error, "We couldn't load your freelancer trust details."),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(
    () =>
      buildFreelancerAchievementMetrics({
        profile,
        services,
        serviceMedia,
        servicePackages,
        orders,
        reviews,
        proposals,
        showcaseIds,
      }),
    [
      orders,
      profile,
      proposals,
      reviews,
      serviceMedia,
      servicePackages,
      services,
      showcaseIds,
    ]
  );

  const achievementStates = useMemo(
    () =>
      resolveFreelancerAchievementStates({
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
        .map((achievementId) => getFreelancerAchievementById(achievementId))
        .filter(Boolean),
    [showcaseIds]
  );

  const latestVerificationRequest = verificationRequests[0] || null;
  const pendingVerificationRequest =
    verificationRequests.find((request) => request.status === "pending") || null;
  const verified = Boolean(profile?.freelancer_verified_at);

  const pendingUnlockIds = useMemo(
    () =>
      achievementStates
        .filter((achievement) => achievement.earned && !unlockMap[achievement.id])
        .map((achievement) => achievement.id),
    [achievementStates, unlockMap]
  );

  useEffect(() => {
    if (!profile?.id || !capabilities.canPersistAchievements) return;
    if (loading || pendingUnlockIds.length === 0) return;
    if (syncInFlightRef.current) return;

    syncInFlightRef.current = true;

    const syncUnlocks = async () => {
      try {
        const timestamp = new Date().toISOString();
        const payload = pendingUnlockIds.map((achievementId) => ({
          user_id: profile.id,
          achievement_id: achievementId,
          unlocked_at: timestamp,
        }));

        const { error } = await supabase
          .from("freelancer_achievement_unlocks")
          .upsert(payload, { onConflict: "user_id,achievement_id" });

        if (error) throw error;

        setUnlockMap((current) => ({
          ...current,
          ...Object.fromEntries(
            pendingUnlockIds.map((achievementId) => [achievementId, timestamp])
          ),
        }));
      } catch {
        setCapabilities((current) => ({
          ...current,
          canPersistAchievements: false,
        }));
      } finally {
        syncInFlightRef.current = false;
      }
    };

    syncUnlocks();
  }, [
    capabilities.canPersistAchievements,
    loading,
    pendingUnlockIds,
    profile?.id,
  ]);

  const saveBadgeShowcase = useCallback(
    async (nextIds) => {
      if (!profile?.id) {
        throw new Error("You need to be signed in to update badges.");
      }

      const normalizedIds = Array.from(
        new Set((nextIds || []).map(normalizeText).filter(Boolean))
      ).slice(0, FREELANCER_SHOWCASE_SLOT_LIMIT);

      const invalidId = normalizedIds.find((id) => {
        const achievement = getFreelancerAchievementById(id);
        return !achievement || !achievementStates.some((item) => item.id === id && item.earned);
      });

      if (invalidId) {
        throw new Error("Only earned badges can be displayed.");
      }

      const { error: deleteError } = await supabase
        .from("freelancer_badge_showcase")
        .delete()
        .eq("user_id", profile.id);

      if (deleteError) throw deleteError;

      if (normalizedIds.length > 0) {
        const payload = normalizedIds.map((achievementId, index) => ({
          user_id: profile.id,
          achievement_id: achievementId,
          slot: index + 1,
        }));

        const { error: insertError } = await supabase
          .from("freelancer_badge_showcase")
          .insert(payload);

        if (insertError) throw insertError;
      }

      setShowcaseIds(normalizedIds);
      return normalizedIds;
    },
    [achievementStates, profile?.id]
  );

  const submitVerification = useCallback(
    async ({ description, files }) => {
      if (!profile?.id) {
        throw new Error("You need to be signed in to submit verification.");
      }

      const normalizedDescription = normalizeText(description);
      if (normalizedDescription.length < 20) {
        throw new Error("Add at least 20 characters so admins understand your work.");
      }

      const nextFiles = Array.from(files || []).filter(Boolean);
      validateVerificationFiles(nextFiles);

      if (verified) {
        throw new Error("Your freelancer profile is already verified.");
      }

      if (pendingVerificationRequest) {
        throw new Error("Your current verification request is still being reviewed.");
      }

      const { data: request, error: requestError } = await supabase
        .from("freelancer_verification_requests")
        .insert([
          {
            freelancer_id: profile.id,
            description: normalizedDescription,
            status: "pending",
          },
        ])
        .select("id")
        .single();

      if (requestError) throw requestError;

      const mediaPayload = [];

      for (const [index, file] of nextFiles.entries()) {
        const bucketPath = await uploadVerificationFile({
          userId: profile.id,
          requestId: request.id,
          file,
          index,
        });

        mediaPayload.push({
          request_id: request.id,
          freelancer_id: profile.id,
          bucket_path: bucketPath,
          media_kind: resolveMediaKind(file),
          mime_type: file.type,
          original_name: file.name || `proof-${index + 1}`,
          sort_order: index + 1,
        });
      }

      const { error: mediaError } = await supabase
        .from("freelancer_verification_media")
        .insert(mediaPayload);

      if (mediaError) throw mediaError;

      await load();
      return request.id;
    },
    [load, pendingVerificationRequest, profile?.id, verified]
  );

  return {
    loading,
    profile,
    warnings,
    metrics,
    achievementStates,
    earnedAchievements,
    showcasedBadges,
    showcaseIds,
    verificationRequests,
    latestVerificationRequest,
    pendingVerificationRequest,
    verified,
    capabilities,
    saveBadgeShowcase,
    submitVerification,
    reload: load,
  };
}
