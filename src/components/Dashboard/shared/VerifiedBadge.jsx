import React from "react";
import { FREELANCER_VERIFIED_BADGE_MEDIA } from "./freelancerBadgeMedia";
import "./verifiedBadge.css";

export default function VerifiedBadge({
  verified = false,
  className = "",
  label = "Verified freelancer",
}) {
  if (!verified) return null;

  return (
    <span className={`verifiedBadge ${className}`.trim()} title={label}>
      <img src={FREELANCER_VERIFIED_BADGE_MEDIA} alt={label} />
    </span>
  );
}
