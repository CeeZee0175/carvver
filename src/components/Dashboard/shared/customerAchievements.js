import {
  BadgeCheck,
  Bookmark,
  Camera,
  Check,
  Clock,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";

export const SHOWCASE_SLOT_LIMIT = 6;

export const ACHIEVEMENT_CATEGORIES = [
  "Profile",
  "Saves",
  "Orders",
  "Reviews",
  "Loyalty & Spend",
  "Showcase & Tenure",
];

const CATEGORY_THEMES = {
  Profile: {
    tint: "violet",
    badgeBg: "rgba(124,58,237,0.12)",
    badgeBorder: "rgba(124,58,237,0.22)",
    badgeColor: "rgba(87,34,182,0.96)",
  },
  Saves: {
    tint: "gold",
    badgeBg: "rgba(242,193,78,0.16)",
    badgeBorder: "rgba(242,193,78,0.26)",
    badgeColor: "rgba(140,92,11,0.96)",
  },
  Orders: {
    tint: "indigo",
    badgeBg: "rgba(42,20,80,0.12)",
    badgeBorder: "rgba(42,20,80,0.18)",
    badgeColor: "rgba(42,20,80,0.96)",
  },
  Reviews: {
    tint: "emerald",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeBorder: "rgba(34,197,94,0.22)",
    badgeColor: "rgba(21,128,61,0.96)",
  },
  "Loyalty & Spend": {
    tint: "rose",
    badgeBg: "rgba(244,114,182,0.12)",
    badgeBorder: "rgba(244,114,182,0.22)",
    badgeColor: "rgba(190,24,93,0.96)",
  },
  "Showcase & Tenure": {
    tint: "sky",
    badgeBg: "rgba(14,165,233,0.12)",
    badgeBorder: "rgba(14,165,233,0.22)",
    badgeColor: "rgba(3,105,161,0.96)",
  },
};

const LEGENDARY_THEME = {
  tint: "legendary",
  badgeBg:
    "linear-gradient(135deg, rgba(242,193,78,0.28), rgba(124,58,237,0.18))",
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

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";
}

function buildReviewMetrics(reviews) {
  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count
      : 0;

  return {
    reviewCount: count,
    writtenReviewCount: reviews.filter((review) => String(review.comment || "").trim())
      .length,
    averageRating: average,
    hasFiveStar: reviews.some((review) => Number(review.rating || 0) >= 5),
  };
}

function buildOrderMetrics(orders) {
  const completedOrders = orders.filter((order) => order.status === "completed");
  const activeOrders = orders.filter((order) =>
    ["pending", "active"].includes(order.status)
  );

  const byFreelancer = new Map();
  const activeMonths = new Set();

  orders.forEach((order) => {
    const freelancerId = order.freelancer_id;
    if (freelancerId) {
      byFreelancer.set(freelancerId, (byFreelancer.get(freelancerId) || 0) + 1);
    }

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
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
    completedSpend: completedOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0
    ),
    hiredFreelancerCount: byFreelancer.size,
    maxOrdersWithSameFreelancer:
      Math.max(0, ...Array.from(byFreelancer.values(), (value) => Number(value || 0))),
    orderActiveMonthCount: activeMonths.size,
  };
}

function buildSavedMetrics(savedItems) {
  const categories = new Set();
  const freelancerIds = new Set();

  savedItems.forEach((item) => {
    const service = item.services;
    if (!service) return;

    if (service.category) categories.add(service.category);
    if (service.freelancer_id) freelancerIds.add(service.freelancer_id);
  });

  return {
    savedCount: savedItems.length,
    savedCategoryCount: categories.size,
    savedDistinctFreelancers: freelancerIds.size,
  };
}

export function buildCustomerAchievementMetrics({
  profile,
  savedItems = [],
  orders = [],
  reviews = [],
  mfaEnabled = false,
  showcaseIds = [],
}) {
  const displayName = String(profile?.display_name || "").trim();
  const bio = String(profile?.bio || "").trim();
  const region = String(profile?.region || "").trim();
  const city = String(profile?.city || "").trim();
  const barangay = String(profile?.barangay || "").trim();
  const country = String(profile?.country || "").trim();
  const address = String(profile?.address || "").trim();
  const avatarUrl = String(profile?.avatar_url || "").trim();
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const now = Date.now();
  const locationSignal =
    buildPhilippinesLocationLabel({ region, city, barangay }) || address || country;

  const profileSignals = [displayName, avatarUrl, bio, locationSignal].filter(Boolean).length;
  const ageDays =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    hasDisplayName: Boolean(displayName),
    hasAvatar: Boolean(avatarUrl),
    hasBio: Boolean(bio),
    hasLocation: Boolean(locationSignal),
    hasCountry: Boolean(locationSignal),
    hasAddress: Boolean(barangay || address),
    profileSignalCount: profileSignals,
    mfaEnabled,
    showcasedBadgeCount: showcaseIds.filter(Boolean).length,
    accountAgeDays: ageDays,
    ...buildSavedMetrics(savedItems),
    ...buildOrderMetrics(orders),
    ...buildReviewMetrics(reviews),
  };
}

export const CUSTOMER_ACHIEVEMENTS = [
  makeAchievement({
    id: "first-impression",
    title: "First Impression",
    description: "Set your display name so creators know who they are talking to.",
    category: "Profile",
    badgeLabel: "First Impression",
    Icon: Sparkles,
    evaluate: (metrics) => metrics.hasDisplayName,
  }),
  makeAchievement({
    id: "face-of-the-request",
    title: "Face of the Request",
    description: "Add a profile photo to make your profile feel more human.",
    category: "Profile",
    badgeLabel: "Face of the Request",
    Icon: Camera,
    evaluate: (metrics) => metrics.hasAvatar,
  }),
  makeAchievement({
    id: "say-it-clearly",
    title: "Say It Clearly",
    description: "Write a short bio that tells creators a bit about you.",
    category: "Profile",
    badgeLabel: "Clear Brief",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.hasBio,
  }),
  makeAchievement({
    id: "on-the-map",
    title: "On the Map",
    description: "Add your location so creators can understand context faster.",
    category: "Profile",
    badgeLabel: "On the Map",
    Icon: MapPin,
    evaluate: (metrics) => metrics.hasCountry,
  }),
  makeAchievement({
    id: "ready-to-meet",
    title: "Ready to Meet",
    description: "Complete any two core profile signals.",
    category: "Profile",
    badgeLabel: "Ready to Meet",
    Icon: Compass,
    evaluate: (metrics) => metrics.profileSignalCount >= 2,
  }),
  makeAchievement({
    id: "fully-framed",
    title: "Fully Framed",
    description: "Complete your display name, photo, bio, and location.",
    category: "Profile",
    badgeLabel: "Fully Framed",
    Icon: BadgeCheck,
    evaluate: (metrics) => metrics.profileSignalCount >= 4,
  }),
  makeAchievement({
    id: "double-locked",
    title: "Double Locked",
    description: "Enable two-factor authentication on your account.",
    category: "Profile",
    badgeLabel: "Double Locked",
    Icon: ShieldCheck,
    evaluate: (metrics) => metrics.mfaEnabled,
  }),
  makeAchievement({
    id: "signature-customer",
    title: "Signature Customer",
    description:
      "Reach full profile completion, enable 2FA, and place your first order.",
    category: "Profile",
    tier: "legendary",
    badgeLabel: "Signature Customer",
    Icon: Star,
    evaluate: (metrics) =>
      metrics.profileSignalCount >= 4 &&
      metrics.mfaEnabled &&
      metrics.totalOrders >= 1,
  }),

  makeAchievement({
    id: "bookmark-spark",
    title: "Bookmark Spark",
    description: "Save your first listing.",
    category: "Saves",
    badgeLabel: "Bookmark Spark",
    Icon: Bookmark,
    evaluate: (metrics) => metrics.savedCount >= 1,
  }),
  makeAchievement({
    id: "shortlist-started",
    title: "Shortlist Started",
    description: "Save three listings you want to revisit.",
    category: "Saves",
    badgeLabel: "Shortlist Started",
    Icon: Bookmark,
    evaluate: (metrics) => metrics.savedCount >= 3,
  }),
  makeAchievement({
    id: "taste-builder",
    title: "Taste Builder",
    description: "Save ten listings across the platform.",
    category: "Saves",
    badgeLabel: "Taste Builder",
    Icon: Search,
    evaluate: (metrics) => metrics.savedCount >= 10,
  }),
  makeAchievement({
    id: "deep-cuts",
    title: "Deep Cuts",
    description: "Build a shortlist of twenty-five saved listings.",
    category: "Saves",
    badgeLabel: "Deep Cuts",
    Icon: Search,
    evaluate: (metrics) => metrics.savedCount >= 25,
  }),
  makeAchievement({
    id: "archive-of-ideas",
    title: "Archive of Ideas",
    description: "Reach fifty saved listings.",
    category: "Saves",
    badgeLabel: "Archive of Ideas",
    Icon: Home,
    evaluate: (metrics) => metrics.savedCount >= 50,
  }),
  makeAchievement({
    id: "cross-category-curious",
    title: "Cross-Category Curious",
    description: "Save listings across three categories.",
    category: "Saves",
    badgeLabel: "Cross-Category Curious",
    Icon: Compass,
    evaluate: (metrics) => metrics.savedCategoryCount >= 3,
  }),
  makeAchievement({
    id: "multi-craft-collector",
    title: "Multi-Craft Collector",
    description: "Save listings across five categories.",
    category: "Saves",
    badgeLabel: "Multi-Craft Collector",
    Icon: Users,
    evaluate: (metrics) => metrics.savedCategoryCount >= 5,
  }),
  makeAchievement({
    id: "all-around-eye",
    title: "All-Around Eye",
    description: "Save listings across eight categories.",
    category: "Saves",
    badgeLabel: "All-Around Eye",
    Icon: Package,
    evaluate: (metrics) => metrics.savedCategoryCount >= 8,
  }),
  makeAchievement({
    id: "creator-radar",
    title: "Creator Radar",
    description: "Save listings from three distinct freelancers.",
    category: "Saves",
    badgeLabel: "Creator Radar",
    Icon: Search,
    evaluate: (metrics) => metrics.savedDistinctFreelancers >= 3,
  }),
  makeAchievement({
    id: "golden-radar",
    title: "Golden Radar",
    description:
      "Save thirty listings across six categories from at least ten freelancers.",
    category: "Saves",
    tier: "legendary",
    badgeLabel: "Golden Radar",
    Icon: Star,
    evaluate: (metrics) =>
      metrics.savedCount >= 30 &&
      metrics.savedCategoryCount >= 6 &&
      metrics.savedDistinctFreelancers >= 10,
  }),

  makeAchievement({
    id: "first-commission",
    title: "First Commission",
    description: "Place your first order through Carvver.",
    category: "Orders",
    badgeLabel: "First Commission",
    Icon: ShoppingBag,
    evaluate: (metrics) => metrics.totalOrders >= 1,
  }),
  makeAchievement({
    id: "momentum-buyer",
    title: "Momentum Buyer",
    description: "Place three orders.",
    category: "Orders",
    badgeLabel: "Momentum Buyer",
    Icon: ShoppingBag,
    evaluate: (metrics) => metrics.totalOrders >= 3,
  }),
  makeAchievement({
    id: "frequent-patron",
    title: "Frequent Patron",
    description: "Reach ten total orders.",
    category: "Orders",
    badgeLabel: "Frequent Patron",
    Icon: Clock,
    evaluate: (metrics) => metrics.totalOrders >= 10,
  }),
  makeAchievement({
    id: "studio-supporter",
    title: "Studio Supporter",
    description: "Reach twenty-five total orders.",
    category: "Orders",
    badgeLabel: "Studio Supporter",
    Icon: Package,
    evaluate: (metrics) => metrics.totalOrders >= 25,
  }),
  makeAchievement({
    id: "juggling-briefs",
    title: "Juggling Briefs",
    description: "Keep two active or pending orders moving at the same time.",
    category: "Orders",
    badgeLabel: "Juggling Briefs",
    Icon: Sparkles,
    evaluate: (metrics) => metrics.activeOrders >= 2,
  }),
  makeAchievement({
    id: "queue-conductor",
    title: "Queue Conductor",
    description: "Keep five active or pending orders moving at once.",
    category: "Orders",
    badgeLabel: "Queue Conductor",
    Icon: Compass,
    evaluate: (metrics) => metrics.activeOrders >= 5,
  }),
  makeAchievement({
    id: "follow-through",
    title: "Follow-Through",
    description: "Complete your first order.",
    category: "Orders",
    badgeLabel: "Follow-Through",
    Icon: Check,
    evaluate: (metrics) => metrics.completedOrders >= 1,
  }),
  makeAchievement({
    id: "reliable-closer",
    title: "Reliable Closer",
    description: "Complete five orders.",
    category: "Orders",
    badgeLabel: "Reliable Closer",
    Icon: Check,
    evaluate: (metrics) => metrics.completedOrders >= 5,
  }),
  makeAchievement({
    id: "production-partner",
    title: "Production Partner",
    description: "Complete fifteen orders.",
    category: "Orders",
    badgeLabel: "Production Partner",
    Icon: BadgeCheck,
    evaluate: (metrics) => metrics.completedOrders >= 15,
  }),
  makeAchievement({
    id: "patron-saint",
    title: "Patron Saint",
    description: "Complete forty orders through Carvver.",
    category: "Orders",
    tier: "legendary",
    badgeLabel: "Patron Saint",
    Icon: Star,
    evaluate: (metrics) => metrics.completedOrders >= 40,
  }),

  makeAchievement({
    id: "first-word-back",
    title: "First Word Back",
    description: "Receive your first freelancer review.",
    category: "Reviews",
    badgeLabel: "First Word Back",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.reviewCount >= 1,
  }),
  makeAchievement({
    id: "noticed-client",
    title: "Noticed Client",
    description: "Receive three reviews.",
    category: "Reviews",
    badgeLabel: "Noticed Client",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.reviewCount >= 3,
  }),
  makeAchievement({
    id: "trusted-name",
    title: "Trusted Name",
    description: "Receive ten reviews.",
    category: "Reviews",
    badgeLabel: "Trusted Name",
    Icon: BadgeCheck,
    evaluate: (metrics) => metrics.reviewCount >= 10,
  }),
  makeAchievement({
    id: "known-quantity",
    title: "Known Quantity",
    description: "Receive twenty-five reviews.",
    category: "Reviews",
    badgeLabel: "Known Quantity",
    Icon: Users,
    evaluate: (metrics) => metrics.reviewCount >= 25,
  }),
  makeAchievement({
    id: "five-star-moment",
    title: "Five-Star Moment",
    description: "Receive at least one five-star review.",
    category: "Reviews",
    badgeLabel: "Five-Star Moment",
    Icon: Star,
    evaluate: (metrics) => metrics.hasFiveStar,
  }),
  makeAchievement({
    id: "well-regarded",
    title: "Well Regarded",
    description: "Maintain a 4.5 average rating with at least five reviews.",
    category: "Reviews",
    badgeLabel: "Well Regarded",
    Icon: Star,
    evaluate: (metrics) =>
      metrics.reviewCount >= 5 && metrics.averageRating >= 4.5,
  }),
  makeAchievement({
    id: "client-favorite",
    title: "Client Favorite",
    description: "Maintain a 4.7 average rating with at least ten reviews.",
    category: "Reviews",
    badgeLabel: "Client Favorite",
    Icon: Heart,
    evaluate: (metrics) =>
      metrics.reviewCount >= 10 && metrics.averageRating >= 4.7,
  }),
  makeAchievement({
    id: "written-praise",
    title: "Written Praise",
    description: "Receive three written reviews.",
    category: "Reviews",
    badgeLabel: "Written Praise",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.writtenReviewCount >= 3,
  }),
  makeAchievement({
    id: "reputation-trail",
    title: "Reputation Trail",
    description: "Receive ten written reviews.",
    category: "Reviews",
    badgeLabel: "Reputation Trail",
    Icon: MessageCircle,
    evaluate: (metrics) => metrics.writtenReviewCount >= 10,
  }),
  makeAchievement({
    id: "gold-standard-client",
    title: "Gold Standard Client",
    description: "Hold a 4.8 average rating with at least twenty-five reviews.",
    category: "Reviews",
    tier: "legendary",
    badgeLabel: "Gold Standard Client",
    Icon: Star,
    evaluate: (metrics) =>
      metrics.reviewCount >= 25 && metrics.averageRating >= 4.8,
  }),

  makeAchievement({
    id: "came-back-again",
    title: "Came Back Again",
    description: "Place two orders with the same freelancer.",
    category: "Loyalty & Spend",
    badgeLabel: "Came Back Again",
    Icon: Heart,
    evaluate: (metrics) => metrics.maxOrdersWithSameFreelancer >= 2,
  }),
  makeAchievement({
    id: "trusted-partner",
    title: "Trusted Partner",
    description: "Place five orders with the same freelancer.",
    category: "Loyalty & Spend",
    badgeLabel: "Trusted Partner",
    Icon: Heart,
    evaluate: (metrics) => metrics.maxOrdersWithSameFreelancer >= 5,
  }),
  makeAchievement({
    id: "creative-circle",
    title: "Creative Circle",
    description: "Hire three distinct freelancers.",
    category: "Loyalty & Spend",
    badgeLabel: "Creative Circle",
    Icon: Users,
    evaluate: (metrics) => metrics.hiredFreelancerCount >= 3,
  }),
  makeAchievement({
    id: "broad-network",
    title: "Broad Network",
    description: "Hire eight distinct freelancers.",
    category: "Loyalty & Spend",
    badgeLabel: "Broad Network",
    Icon: Users,
    evaluate: (metrics) => metrics.hiredFreelancerCount >= 8,
  }),
  makeAchievement({
    id: "returning-seasons",
    title: "Returning Seasons",
    description: "Place orders across three separate calendar months.",
    category: "Loyalty & Spend",
    badgeLabel: "Returning Seasons",
    Icon: Clock,
    evaluate: (metrics) => metrics.orderActiveMonthCount >= 3,
  }),
  makeAchievement({
    id: "long-run-client",
    title: "Long-Run Client",
    description: "Place orders across six separate calendar months.",
    category: "Loyalty & Spend",
    badgeLabel: "Long-Run Client",
    Icon: Clock,
    evaluate: (metrics) => metrics.orderActiveMonthCount >= 6,
  }),
  makeAchievement({
    id: "commission-column",
    title: "Commission Column",
    description:
      "Spend ₱75,000 or more on completed work across at least five freelancers.",
    category: "Loyalty & Spend",
    tier: "legendary",
    badgeLabel: "Commission Column",
    Icon: Star,
    evaluate: (metrics) =>
      metrics.completedSpend >= 75000 && metrics.hiredFreelancerCount >= 5,
  }),

  makeAchievement({
    id: "first-unlock",
    title: "First Unlock",
    description: "Earn your first achievement.",
    category: "Showcase & Tenure",
    badgeLabel: "First Unlock",
    Icon: Sparkles,
    meta: true,
    evaluate: (_metrics, context) => context.earnedCount >= 1,
  }),
  makeAchievement({
    id: "badge-on-display",
    title: "Badge On Display",
    description: "Feature one earned badge on your profile.",
    category: "Showcase & Tenure",
    badgeLabel: "Badge On Display",
    Icon: BadgeCheck,
    meta: true,
    evaluate: (_metrics, context) => context.showcasedBadgeCount >= 1,
  }),
  makeAchievement({
    id: "curated-shelf",
    title: "Curated Shelf",
    description: "Feature three badges on your profile.",
    category: "Showcase & Tenure",
    badgeLabel: "Curated Shelf",
    Icon: BadgeCheck,
    meta: true,
    evaluate: (_metrics, context) => context.showcasedBadgeCount >= 3,
  }),
  makeAchievement({
    id: "wall-of-signal",
    title: "Wall of Signal",
    description: "Fill all six profile badge slots.",
    category: "Showcase & Tenure",
    badgeLabel: "Wall of Signal",
    Icon: BadgeCheck,
    meta: true,
    evaluate: (_metrics, context) => context.showcasedBadgeCount >= 6,
  }),
  makeAchievement({
    id: "early-legacy",
    title: "Early Legacy",
    description:
      "Keep your account for at least a year and earn ten achievements.",
    category: "Showcase & Tenure",
    badgeLabel: "Early Legacy",
    Icon: Home,
    meta: true,
    evaluate: (metrics, context) =>
      metrics.accountAgeDays >= 365 && context.earnedCount >= 10,
  }),
];

export function resolveCustomerAchievementStates({
  metrics,
  unlockMap = {},
  showcaseIds = [],
}) {
  const persistedIds = new Set(Object.keys(unlockMap));
  const earnedIds = new Set();

  CUSTOMER_ACHIEVEMENTS.forEach((achievement) => {
    if (achievement.meta) return;
    if (achievement.evaluate(metrics, { earnedCount: 0, showcasedBadgeCount: 0 })) {
      earnedIds.add(achievement.id);
    }
  });

  persistedIds.forEach((id) => earnedIds.add(id));

  let changed = true;
  while (changed) {
    changed = false;

    CUSTOMER_ACHIEVEMENTS.forEach((achievement) => {
      if (!achievement.meta) return;
      if (earnedIds.has(achievement.id)) return;

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

  return CUSTOMER_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    earned: earnedIds.has(achievement.id),
    unlockedAt: unlockMap[achievement.id] || null,
  }));
}

export function getAchievementById(achievementId) {
  return CUSTOMER_ACHIEVEMENTS.find((item) => item.id === achievementId) || null;
}
