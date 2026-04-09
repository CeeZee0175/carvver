export function getProfileDisplayName(profile, fallback = "User") {
  if (!profile) return fallback;

  const displayName = String(profile.display_name || "").trim();
  if (displayName) return displayName;

  const firstName = String(profile.first_name || "").trim();
  const lastName = String(profile.last_name || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || fallback;
}

export function getProfileRealName(profile, fallback = "No real name added yet") {
  if (!profile) return fallback;

  const firstName = String(profile.first_name || "").trim();
  const lastName = String(profile.last_name || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || fallback;
}

export function getProfileInitials(profile, fallback = "U") {
  const name = getProfileDisplayName(profile, fallback);
  const parts = name.split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || fallback
  );
}
