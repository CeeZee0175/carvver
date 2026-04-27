export const FREELANCER_EXPERIENCE_OPTIONS = [
  "Starting out",
  "Building momentum",
  "Experienced",
  "Expert",
];

export const FREELANCER_SPECIALTY_OPTIONS = [
  "Brand Identity",
  "Logo Design",
  "Social Media Content",
  "Product Photography",
  "Portrait Photography",
  "Video Reels",
  "Motion Graphics",
  "Voice Acting",
  "Copywriting",
  "Web UI",
  "Front-end Build",
  "Tutoring",
  "Virtual Assistance",
  "Custom Gifts",
  "Crochet",
  "Event Styling",
];

export function validateFreelancerIdentity(values) {
  const errors = {};

  if (!String(values.firstName || "").trim()) {
    errors.firstName = "Please add your first name.";
  }

  if (!String(values.lastName || "").trim()) {
    errors.lastName = "Please add your last name.";
  }

  if (!String(values.displayName || "").trim()) {
    errors.displayName = "Please choose a display name.";
  }

  return errors;
}

export function validateFreelancerWork(values) {
  const errors = {};

  if (!String(values.headline || "").trim()) {
    errors.headline = "Please add a professional headline.";
  }

  if (!String(values.primaryCategory || "").trim()) {
    errors.primaryCategory = "Please choose a primary category.";
  }

  if (!Array.isArray(values.specialties) || values.specialties.length === 0) {
    errors.specialties = "Please choose at least one specialty.";
  }

  if (Array.isArray(values.specialties) && values.specialties.length > 5) {
    errors.specialties = "Choose up to five specialties only.";
  }

  if (!String(values.experienceLevel || "").trim()) {
    errors.experienceLevel = "Please choose your experience level.";
  }

  if (String(values.portfolioUrl || "").trim()) {
    try {
      new URL(String(values.portfolioUrl || "").trim());
    } catch {
      errors.portfolioUrl = "Please enter a valid portfolio link.";
    }
  }

  return errors;
}

export function validateFreelancerLocation(values) {
  const errors = {};

  if (!String(values.region || "").trim()) {
    errors.region = "Please choose your region.";
  }

  if (!String(values.city || "").trim()) {
    errors.city = "Please choose your city.";
  }

  return errors;
}
