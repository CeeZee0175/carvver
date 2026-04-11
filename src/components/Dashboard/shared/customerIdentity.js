export function getCustomerDisplayName(profile) {
  if (!profile) return "Customer";

  const displayName = String(profile.display_name || "").trim();
  if (displayName) return displayName;

  const first = String(profile.first_name || "").trim();
  const last = String(profile.last_name || "").trim();
  const fallback = `${first} ${last}`.trim();

  return fallback || "Customer";
}

export function getCustomerRealName(profile) {
  if (!profile) return "No real name added yet";

  const first = String(profile.first_name || "").trim();
  const last = String(profile.last_name || "").trim();
  const fullName = `${first} ${last}`.trim();

  return fullName || "No real name added yet";
}

export function getCustomerInitials(profile) {
  const displayName = getCustomerDisplayName(profile);
  const parts = displayName.split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "C"
  );
}
