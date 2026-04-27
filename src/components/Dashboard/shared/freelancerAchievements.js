import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock,
  FileStack,
  Handshake,
  Link,
  MapPin,
  MessageCircle,
  PackageCheck,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  WandSparkles,
} from "lucide-react";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { ORDERED_FREELANCER_BADGE_MEDIA } from "./freelancerBadgeMedia";

export const FREELANCER_SHOWCASE_SLOT_LIMIT = 9;

export const FREELANCER_ACHIEVEMENT_CATEGORIES = [
  "Profile",
  "Listings",
  "Marketplace",
  "Reviews",
  "Trust",
  "Showcase",
];

const CATEGORY_THEMES = {
  Profile: {
    tint: "violet",
    badgeBg: "rgba(124,58,237,0.12)",
    badgeBorder: "rgba(124,58,237,0.22)",
    badgeColor: "rgba(87,34,182,0.96)",
  },
  Listings: {
    tint: "gold",
    badgeBg: "rgba(242,193,78,0.16)",
    badgeBorder: "rgba(242,193,78,0.26)",
    badgeColor: "rgba(140,92,11,0.96)",
  },
  Marketplace: {
    tint: "emerald",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeBorder: "rgba(34,197,94,0.22)",
    badgeColor: "rgba(21,128,61,0.96)",
  },
  Reviews: {
    tint: "sky",
    badgeBg: "rgba(14,165,233,0.12)",
    badgeBorder: "rgba(14,165,233,0.22)",
    badgeColor: "rgba(3,105,161,0.96)",
  },
  Trust: {
    tint: "indigo",
    badgeBg: "rgba(42,20,80,0.12)",
    badgeBorder: "rgba(42,20,80,0.18)",
    badgeColor: "rgba(42,20,80,0.96)",
  },
  Showcase: {
    tint: "rose",
    badgeBg: "rgba(244,114,182,0.12)",
    badgeBorder: "rgba(244,114,182,0.22)",
    badgeColor: "rgba(190,24,93,0.96)",
  },
};

const LEGENDARY_THEME = {
  tint: "legendary",
  badgeBg: "linear-gradient(135deg, rgba(242,193,78,0.28), rgba(124,58,237,0.18))",
  badgeBorder: "rgba(242,193,78,0.36)",
  badgeColor: "rgba(107,52,4,0.98)",
};

function buildBadge(category, tier, label, Icon) {
  const theme = tier === "legendary" ? LEGENDARY_THEME : CATEGORY_THEMES[category];

  return {
    label,
    Icon,
    tint: theme.tint,
    bg: theme.badgeBg,
    border: theme.badgeBorder,
    color: theme.badgeColor,
  };
}

function makeAchievement({
  id,
  title,
  description,
  category,
  tier = "standard",
  badgeLabel,
  Icon,
  evaluate,
  meta = false,
}) {
  return {
    id,
    title,
    description,
    category,
    tier,
    legendary: tier === "legendary",
    badge: buildBadge(category, tier, badgeLabel || title, Icon),
    evaluate,
    meta,
  };
}

function buildListingMetrics(services = [], mediaRows = [], packageRows = []) {
  const published = services.filter((service) => service.is_published);
  const serviceIdsWithMedia = new Set(mediaRows.map((item) => item.service_id).filter(Boolean));
  const serviceIdsWithPackages = new Set(
    packageRows.map((item) => item.service_id).filter(Boolean)
  );

  return {
    listingCount: services.length,
    publishedListingCount: published.length,
    mediaBackedListingCount: published.filter((service) =>
      serviceIdsWithMedia.has(service.id)
    ).length,
    packagedListingCount: published.filter((service) =>
      serviceIdsWithPackages.has(service.id)
    ).length,
    proListingCount: published.filter((service) => service.is_pro).length,
  };
}

function buildOrderMetrics(orders = []) {
  const completed = orders.filter((order) => order.status === "completed");
  const activeMonths = new Set();
  const customers = new Set();

  orders.forEach((order) => {
    if (order.customer_id) customers.add(order.customer_id);
    if (order.created_at) {
      const created = new Date(order.created_at);
      if (!Number.isNaN(created.getTime())) {
        activeMonths.add(
          `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(
            2,
            "0"
          )}`
        );
      }
    }
  });

  return {
    totalOrders: orders.length,
    completedOrders: completed.length,
    completedRevenue: completed.reduce(
      (sum, order) => sum + Number(order.freelancer_net || order.total_price || 0),
      0
    ),
    distinctCustomers: customers.size,
    orderActiveMonthCount: activeMonths.size,
  };
}

function buildReviewMetrics(reviews = []) {
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

  return {
    reviewCount: reviews.length,
    averageRating: average,
    fiveStarCount: reviews.filter((review) => Number(review.rating || 0) >= 5).length,
  };
}

function buildProposalMetrics(proposals = []) {
  return {
    proposalCount: proposals.length,
    acceptedProposalCount: proposals.filter((proposal) => proposal.status === "accepted")
      .length,
  };
}

export function buildFreelancerAchievementMetrics({
  profile,
  services = [],
  serviceMedia = [],
  servicePackages = [],
  orders = [],
  reviews = [],
  proposals = [],
  showcaseIds = [],
}) {
  const displayName = String(profile?.display_name || "").trim();
  const headline = String(profile?.freelancer_headline || "").trim();
  const bio = String(profile?.bio || "").trim();
  const avatarUrl = String(profile?.avatar_url || "").trim();
  const category = String(profile?.freelancer_primary_category || "").trim();
  const portfolioUrl = String(profile?.freelancer_portfolio_url || "").trim();
  const specialties = Array.isArray(profile?.freelancer_specialties)
    ? profile.freelancer_specialties.filter(Boolean)
    : [];
  const locationSignal = buildPhilippinesLocationLabel({
    region: String(profile?.region || "").trim(),
    city: String(profile?.city || "").trim(),
  });
  const profileSignals = [
    displayName,
    headline,
    bio,
    avatarUrl,
    category,
    specialties.length > 0 ? "specialties" : "",
    portfolioUrl,
    locationSignal,
  ].filter(Boolean).length;
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const accountAgeDays =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    hasDisplayName: Boolean(displayName),
    hasHeadline: Boolean(headline),
    hasBio: Boolean(bio),
    hasAvatar: Boolean(avatarUrl),
    hasCategory: Boolean(category),
    hasSpecialties: specialties.length > 0,
    hasPortfolio: Boolean(portfolioUrl),
    hasLocation: Boolean(locationSignal),
    profileSignalCount: profileSignals,
    isVerified: Boolean(profile?.freelancer_verified_at),
    showcasedBadgeCount: showcaseIds.filter(Boolean).length,
    accountAgeDays,
    ...buildListingMetrics(services, serviceMedia, servicePackages),
    ...buildOrderMetrics(orders),
    ...buildReviewMetrics(reviews),
    ...buildProposalMetrics(proposals),
  };
}

export const FREELANCER_ACHIEVEMENTS = [
  makeAchievement({
    id: "studio-name",
    title: "Studio Name",
    description: "Set the name customers will recognize across Carvver.",
    category: "Profile",
    badgeLabel: "Studio Name",
    Icon: Sparkles,
    evaluate: (metrics) => metrics.hasDisplayName,
  }),
  makeAchievement({
    id: "clear-headline",
    title: "Clear Headline",
    description: "Write a quick headline that explains your work.",
    category: "Profile",
    badgeLabel: "Clear Headline",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.hasHeadline,
  }),
  makeAchievement({
    id: "face-to-the-work",
    title: "Face To The Work",
    description: "Add a profile photo so customers can recognize you.",
    category: "Profile",
    badgeLabel: "Face To The Work",
    Icon: Camera,
    evaluate: (metrics) => metrics.hasAvatar,
  }),
  makeAchievement({
    id: "work-map",
    title: "Work Map",
    description: "Add your location so nearby customers understand context.",
    category: "Profile",
    badgeLabel: "Work Map",
    Icon: MapPin,
    evaluate: (metrics) => metrics.hasLocation,
  }),
  makeAchievement({
    id: "portfolio-signal",
    title: "Portfolio Signal",
    description: "Add a portfolio link customers can review.",
    category: "Profile",
    badgeLabel: "Portfolio Signal",
    Icon: Link,
    evaluate: (metrics) => metrics.hasPortfolio,
  }),
  makeAchievement({
    id: "full-creator-profile",
    title: "Full Creator Profile",
    description: "Complete at least seven freelancer profile signals.",
    category: "Profile",
    tier: "legendary",
    badgeLabel: "Full Creator Profile",
    Icon: Star,
    evaluate: (metrics) => metrics.profileSignalCount >= 7,
  }),
  makeAchievement({
    id: "first-live-listing",
    title: "First Live Listing",
    description: "Publish your first service listing.",
    category: "Listings",
    badgeLabel: "First Live Listing",
    Icon: BriefcaseBusiness,
    evaluate: (metrics) => metrics.publishedListingCount >= 1,
  }),
  makeAchievement({
    id: "visual-proof",
    title: "Visual Proof",
    description: "Publish a service listing with photo or video media.",
    category: "Listings",
    badgeLabel: "Visual Proof",
    Icon: FileStack,
    evaluate: (metrics) => metrics.mediaBackedListingCount >= 1,
  }),
  makeAchievement({
    id: "package-ready",
    title: "Package Ready",
    description: "Add package options to a published listing.",
    category: "Listings",
    badgeLabel: "Package Ready",
    Icon: PackageCheck,
    evaluate: (metrics) => metrics.packagedListingCount >= 1,
  }),
  makeAchievement({
    id: "catalog-builder",
    title: "Catalog Builder",
    description: "Publish three or more service listings.",
    category: "Listings",
    badgeLabel: "Catalog Builder",
    Icon: Rocket,
    evaluate: (metrics) => metrics.publishedListingCount >= 3,
  }),
  makeAchievement({
    id: "first-pitch",
    title: "First Pitch",
    description: "Send your first customer request proposal.",
    category: "Marketplace",
    badgeLabel: "First Pitch",
    Icon: Handshake,
    evaluate: (metrics) => metrics.proposalCount >= 1,
  }),
  makeAchievement({
    id: "accepted-pitch",
    title: "Accepted Pitch",
    description: "Get a proposal accepted by a customer.",
    category: "Marketplace",
    badgeLabel: "Accepted Pitch",
    Icon: CheckCircle2,
    evaluate: (metrics) => metrics.acceptedProposalCount >= 1,
  }),
  makeAchievement({
    id: "first-completed-order",
    title: "First Completed Order",
    description: "Complete your first order on Carvver.",
    category: "Marketplace",
    badgeLabel: "First Completed Order",
    Icon: Trophy,
    evaluate: (metrics) => metrics.completedOrders >= 1,
  }),
  makeAchievement({
    id: "returning-demand",
    title: "Returning Demand",
    description: "Work with at least three distinct customers.",
    category: "Marketplace",
    badgeLabel: "Returning Demand",
    Icon: Users,
    evaluate: (metrics) => metrics.distinctCustomers >= 3,
  }),
  makeAchievement({
    id: "first-review",
    title: "First Review",
    description: "Receive your first customer review.",
    category: "Reviews",
    badgeLabel: "First Review",
    Icon: WandSparkles,
    evaluate: (metrics) => metrics.reviewCount >= 1,
  }),
  makeAchievement({
    id: "five-star-signal",
    title: "Five Star Signal",
    description: "Receive a five-star customer review.",
    category: "Reviews",
    badgeLabel: "Five Star Signal",
    Icon: Star,
    evaluate: (metrics) => metrics.fiveStarCount >= 1,
  }),
  makeAchievement({
    id: "verified-creator",
    title: "Verified Creator",
    description: "Pass Carvver freelancer verification.",
    category: "Trust",
    tier: "legendary",
    badgeLabel: "Verified Creator",
    Icon: ShieldCheck,
    evaluate: (metrics) => metrics.isVerified,
  }),
  makeAchievement({
    id: "badge-on-display",
    title: "Badge On Display",
    description: "Display one earned freelancer badge on your profile.",
    category: "Showcase",
    badgeLabel: "Badge On Display",
    Icon: BadgeCheck,
    meta: true,
    evaluate: (_metrics, context) => context.showcasedBadgeCount >= 1,
  }),
  makeAchievement({
    id: "seasoned-seller",
    title: "Seasoned Seller",
    description: "Keep your freelancer account active for a year and earn ten badges.",
    category: "Showcase",
    tier: "legendary",
    badgeLabel: "Seasoned Seller",
    Icon: Clock,
    meta: true,
    evaluate: (metrics, context) =>
      metrics.accountAgeDays >= 365 && context.earnedCount >= 10,
  }),
];

FREELANCER_ACHIEVEMENTS.forEach((achievement, index) => {
  achievement.badge.media =
    ORDERED_FREELANCER_BADGE_MEDIA[index] ||
    ORDERED_FREELANCER_BADGE_MEDIA[ORDERED_FREELANCER_BADGE_MEDIA.length - 1];
});

export function resolveFreelancerAchievementStates({
  metrics,
  unlockMap = {},
  showcaseIds = [],
}) {
  const persistedIds = new Set(Object.keys(unlockMap));
  const earnedIds = new Set();

  FREELANCER_ACHIEVEMENTS.forEach((achievement) => {
    if (achievement.meta) return;
    if (achievement.evaluate(metrics, { earnedCount: 0, showcasedBadgeCount: 0 })) {
      earnedIds.add(achievement.id);
    }
  });

  persistedIds.forEach((id) => earnedIds.add(id));

  let changed = true;
  while (changed) {
    changed = false;

    FREELANCER_ACHIEVEMENTS.forEach((achievement) => {
      if (!achievement.meta || earnedIds.has(achievement.id)) return;

      const context = {
        earnedCount: Array.from(earnedIds).filter((id) => id !== achievement.id).length,
        showcasedBadgeCount: showcaseIds.filter(Boolean).length,
      };

      if (achievement.evaluate(metrics, context)) {
        earnedIds.add(achievement.id);
        changed = true;
      }
    });
  }

  return FREELANCER_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    earned: earnedIds.has(achievement.id),
    unlockedAt: unlockMap[achievement.id] || null,
  }));
}

export function getFreelancerAchievementById(achievementId) {
  return FREELANCER_ACHIEVEMENTS.find((item) => item.id === achievementId) || null;
}
