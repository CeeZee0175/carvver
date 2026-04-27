import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "../../../lib/supabase/auth";
import { createClient } from "../../../lib/supabase/client";
import { emitProfileUpdated } from "../../../lib/profileSync";
import {
  buildPhilippinesLocationLabel,
  coercePhilippinesLocation,
  PHILIPPINES_COUNTRY,
} from "../../../lib/phLocations";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  PROFILE_AVATAR_BUCKET,
} from "./useCustomerProfileData";
import {
  validateFreelancerIdentity,
  validateFreelancerLocation,
  validateFreelancerWork,
} from "../shared/freelancerProfileFields";
import {
  getProfileDisplayName,
  getProfileInitials,
  getProfileRealName,
} from "../shared/profileIdentity";

const supabase = createClient();

function friendlyFreelancerMessage(error, fallback) {
  const message = String(error?.message || "");

  if (
    /column .*(display_name|address|region|city|barangay|freelancer_)/i.test(
      message
    )
  ) {
    return "Some freelancer details couldn't be loaded.";
  }

  if (/bucket|storage/i.test(message)) {
    return "Profile photo uploads are unavailable right now.";
  }

  if (/row-level security|permission denied/i.test(message)) {
    return "That profile action isn't available right now.";
  }

  return fallback;
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
  const path = `freelancers/${userId}/${Date.now()}-${safeName || "avatar"}.${extension}`;

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

function buildFreelancerTasks(profile) {
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];

  return [
    {
      id: "display-name",
      label: "Add a display name",
      detail: "Use the name clients will remember.",
      complete: Boolean(String(profile?.display_name || "").trim()),
    },
    {
      id: "headline",
      label: "Write your headline",
      detail: "A clear one-line headline explains your work fast.",
      complete: Boolean(String(profile?.freelancer_headline || "").trim()),
    },
    {
      id: "category",
      label: "Choose a main category",
      detail: "This helps people place your work immediately.",
      complete: Boolean(String(profile?.freelancer_primary_category || "").trim()),
    },
    {
      id: "specialties",
      label: "Pick your specialties",
      detail: "Specialties make your profile more specific.",
      complete: specialties.length > 0,
    },
    {
      id: "experience",
      label: "Set your experience level",
      detail: "Tell people how you describe your current level.",
      complete: Boolean(String(profile?.freelancer_experience_level || "").trim()),
    },
    {
      id: "portfolio",
      label: "Add a portfolio link",
      detail: "A working link gives people more to review.",
      complete: Boolean(String(profile?.freelancer_portfolio_url || "").trim()),
    },
    {
      id: "location",
      label: "Add your location",
      detail: "Location helps people understand where you are based.",
      complete: Boolean(
        buildPhilippinesLocationLabel({
          region: String(profile?.region || "").trim(),
          city: String(profile?.city || "").trim(),
        })
      ),
    },
  ];
}

export function useFreelancerProfileData() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [warning, setWarning] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setWarning("");

    try {
      const nextProfile = await getProfile();
      setProfile(nextProfile);
    } catch (error) {
      setProfile(null);
      setWarning(
        friendlyFreelancerMessage(
          error,
          "We couldn't load your freelancer details."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tasks = useMemo(() => buildFreelancerTasks(profile), [profile]);
  const completion = useMemo(() => {
    const completed = tasks.filter((task) => task.complete).length;
    const total = tasks.length;

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const displayName = useMemo(
    () => getProfileDisplayName(profile, "Freelancer"),
    [profile]
  );
  const realName = useMemo(
    () => getProfileRealName(profile),
    [profile]
  );
  const initials = useMemo(
    () => getProfileInitials(profile, "F"),
    [profile]
  );
  const locationLabel = useMemo(
    () =>
      buildPhilippinesLocationLabel({
        region: String(profile?.region || "").trim(),
        city: String(profile?.city || "").trim(),
      }) ||
      String(profile?.address || "").trim() ||
      "No location added yet",
    [profile]
  );

  const saveProfile = useCallback(
    async ({
      firstName,
      lastName,
      displayName: nextDisplayName,
      bio,
      headline,
      primaryCategory,
      specialties,
      experienceLevel,
      portfolioUrl,
      region,
      city,
      avatarFile,
      removeAvatar = false,
    }) => {
      if (!profile?.id) {
        throw new Error("You need to be signed in to update your profile.");
      }

      const normalizedLocation = coercePhilippinesLocation({
        region: String(region || "").trim(),
        city: String(city || "").trim(),
      });

      const normalizedValues = {
        firstName: String(firstName || "").trim(),
        lastName: String(lastName || "").trim(),
        displayName: String(nextDisplayName || "").trim(),
        bio: String(bio || "").trim(),
        headline: String(headline || "").trim(),
        primaryCategory: String(primaryCategory || "").trim(),
        specialties: Array.isArray(specialties)
          ? specialties.map((item) => String(item || "").trim()).filter(Boolean)
          : [],
        experienceLevel: String(experienceLevel || "").trim(),
        portfolioUrl: String(portfolioUrl || "").trim(),
        region: normalizedLocation.region,
        city: normalizedLocation.city,
      };

      const errors = {
        ...validateFreelancerIdentity(normalizedValues),
        ...validateFreelancerWork(normalizedValues),
        ...validateFreelancerLocation(normalizedValues),
      };

      const firstError = Object.values(errors)[0];
      if (firstError) throw new Error(firstError);

      let nextAvatarUrl = removeAvatar ? null : profile.avatar_url || null;

      if (avatarFile) {
        nextAvatarUrl = await uploadAvatarFile(profile.id, avatarFile);
      }

      const payload = {
        first_name: normalizedValues.firstName,
        last_name: normalizedValues.lastName,
        display_name: normalizedValues.displayName,
        bio: normalizedValues.bio || null,
        country: PHILIPPINES_COUNTRY,
        region: normalizedValues.region,
        city: normalizedValues.city,
        address: buildPhilippinesLocationLabel(normalizedValues),
        avatar_url: nextAvatarUrl,
        freelancer_headline: normalizedValues.headline,
        freelancer_primary_category: normalizedValues.primaryCategory,
        freelancer_specialties: normalizedValues.specialties,
        freelancer_experience_level: normalizedValues.experienceLevel,
        freelancer_portfolio_url: normalizedValues.portfolioUrl || null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(
          friendlyFreelancerMessage(
            error,
            "We couldn't save your freelancer profile. Please try again."
          )
        );
      }

      const nextProfile = {
        ...data,
        email: profile.email || "",
      };

      setProfile(nextProfile);
      emitProfileUpdated(nextProfile);
      return nextProfile;
    },
    [profile]
  );

  return {
    loading,
    profile,
    warning,
    displayName,
    realName,
    initials,
    locationLabel,
    tasks,
    completion,
    saveProfile,
    reload: load,
  };
}
