import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile } from "../../../lib/supabase/auth";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";

const supabase = createClient();

const READ_STATE_EVENT = "carvver:notifications:read-state";

export const NOTIFICATION_FILTERS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Activity", value: "activity" },
  { label: "System", value: "system" },
];

export const NOTIFICATIONS_PER_PAGE = 6;

function emitReadState(userId, nextMap) {
  if (!userId || typeof window === "undefined") return;

  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(READ_STATE_EVENT, {
        detail: { userId, readMap: nextMap },
      })
    );
  }, 0);
}

export function formatNotificationTime(date) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  );
  const intervals = [
    { label: "d ago", seconds: 86400 },
    { label: "h ago", seconds: 3600 },
    { label: "m ago", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label}`;
  }

  return "Just now";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function resolveNotificationIcon(item) {
  const label = normalizeText(item?.label).toLowerCase();
  const title = normalizeText(item?.title).toLowerCase();

  if (label.includes("saved")) return Bookmark;
  if (label.includes("listing") || title.includes("listing")) return PackageSearch;
  if (label.includes("orders") || title.includes("order") || title.includes("payout")) {
    return ShoppingBag;
  }
  if (label.includes("profile")) return UserRound;
  if (label.includes("tip") || title.includes("trust") || title.includes("verified")) {
    return ShieldCheck;
  }
  return Bell;
}

function buildBaseNotifications({ profile, role, savedCount, pendingOrders, recentServices }) {
  const now = Date.now();
  const firstName = profile?.first_name || "there";
  const locationLabel =
    buildPhilippinesLocationLabel({
      region: String(profile?.region || "").trim(),
      city: String(profile?.city || "").trim(),
    }) ||
    String(profile?.address || "").trim() ||
    String(profile?.country || "").trim();

  if (role === "freelancer") {
    const notifications = [
      {
        id: "freelancer-welcome",
        group: "system",
        label: "Overview",
        title: `Welcome back, ${firstName}.`,
        body:
          "Your workspace keeps orders, profile visibility, and payout-ready delivery activity closer together.",
        createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
        defaultRead: false,
        ctaLabel: "Open dashboard",
        path: "/dashboard/freelancer",
        Icon: Bell,
        accent: "rgba(124,58,237,0.94)",
        accentSoft: "rgba(124,58,237,0.12)",
      },
    ];

    if (pendingOrders > 0) {
      notifications.push({
        id: "freelancer-pending-orders",
        group: "activity",
        label: "Orders",
        title: `${pendingOrders} active order${pendingOrders === 1 ? "" : "s"} need attention`,
        body:
          "Keep delivery notes, progress updates, and payout-ready handoff details moving.",
        createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
        defaultRead: false,
        ctaLabel: "Open orders",
        path: "/dashboard/freelancer/orders",
        Icon: ShoppingBag,
        accent: "rgba(249,115,22,0.94)",
        accentSoft: "rgba(249,115,22,0.12)",
      });
    }

    if (!profile?.freelancer_headline || !locationLabel) {
      notifications.push({
        id: "freelancer-profile-reminder",
        group: "system",
        label: "Profile",
        title: "Your freelancer profile can still feel more complete.",
        body:
          "A stronger headline and visible location help customers trust what you offer faster.",
        createdAt: new Date(now - 1000 * 60 * 65).toISOString(),
        defaultRead: false,
        ctaLabel: "Open profile",
        path: "/dashboard/freelancer/profile",
        Icon: UserRound,
        accent: "rgba(42,20,80,0.94)",
        accentSoft: "rgba(42,20,80,0.10)",
      });
    }

    return notifications;
  }

  const notifications = [
    {
      id: "welcome",
      group: "system",
      label: "Overview",
      title: `Welcome back, ${firstName}.`,
      body:
        "Your activity feed now keeps saved services, fresh listings, and order reminders in one place.",
      createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
      defaultRead: false,
      ctaLabel: "Open dashboard",
      path: "/dashboard/customer",
      Icon: Bell,
      accent: "rgba(124,58,237,0.94)",
      accentSoft: "rgba(124,58,237,0.12)",
    },
    {
      id: "filter-tip",
      group: "system",
      label: "Tip",
      title: "Trust filters are live in Browse Services.",
      body:
        "Use Verified and Pro filters when you want stronger trust signals while narrowing down creators.",
      createdAt: new Date(now - 1000 * 60 * 42).toISOString(),
      defaultRead: true,
      ctaLabel: "Browse services",
      path: "/dashboard/customer/browse-services",
      Icon: ShieldCheck,
      accent: "rgba(34,197,94,0.94)",
      accentSoft: "rgba(34,197,94,0.12)",
    },
  ];

  if (pendingOrders > 0) {
    notifications.push({
      id: "pending-orders",
      group: "activity",
      label: "Orders",
      title: `${pendingOrders} active request${pendingOrders === 1 ? "" : "s"} need attention`,
      body:
        "You have open order activity waiting for a follow-up or response.",
      createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
      defaultRead: false,
      ctaLabel: "Open dashboard",
      path: "/dashboard/customer",
      Icon: ShoppingBag,
      accent: "rgba(249,115,22,0.94)",
      accentSoft: "rgba(249,115,22,0.12)",
    });
  }

  if (savedCount > 0) {
    notifications.push({
      id: "saved-reminder",
      group: "activity",
      label: "Saved",
      title: `${savedCount} saved listing${savedCount === 1 ? "" : "s"} ready to revisit`,
      body:
        "Your shortlist is waiting when you want to compare creators or send a request.",
      createdAt: new Date(now - 1000 * 60 * 28).toISOString(),
      defaultRead: false,
      ctaLabel: "Open saved",
      path: "/dashboard/customer/saved",
      Icon: Bookmark,
      accent: "rgba(242,193,78,0.98)",
      accentSoft: "rgba(242,193,78,0.18)",
    });
  }

  if (!profile?.bio || !locationLabel) {
    notifications.push({
      id: "profile-reminder",
      group: "system",
      label: "Profile",
      title: "Your customer profile can still feel more complete.",
      body:
        "A short bio and location help creators understand who they are talking to when they receive your request.",
      createdAt: new Date(now - 1000 * 60 * 65).toISOString(),
      defaultRead: false,
      ctaLabel: "Go home",
      path: "/dashboard/customer",
      Icon: UserRound,
      accent: "rgba(42,20,80,0.94)",
      accentSoft: "rgba(42,20,80,0.10)",
    });
  }

  recentServices.slice(0, 4).forEach((service, index) => {
    const creatorName = service.profiles
      ? `${service.profiles.first_name || ""} ${service.profiles.last_name || ""}`.trim()
      : "A creator";
    const place = service.location ? ` in ${service.location}` : "";

    notifications.push({
      id: `service-${service.id}`,
      group: "activity",
      label: "Fresh Listing",
      title: `${creatorName} posted "${service.title}"`,
      body: `${service.category}${place} was recently published and may match what you have been browsing.`,
      createdAt: service.created_at,
      defaultRead: index > 0,
      ctaLabel: "Browse services",
      path: "/dashboard/customer/browse-services",
      Icon: PackageSearch,
      accent: "rgba(14,165,233,0.94)",
      accentSoft: "rgba(14,165,233,0.12)",
    });
  });

  return notifications;
}

function normalizeStoredNotification(row) {
  return {
    id: row.id,
    group: normalizeText(row.notification_group) || "system",
    label: normalizeText(row.label) || "Update",
    title: normalizeText(row.title),
    body: normalizeText(row.body),
    createdAt: row.created_at || new Date().toISOString(),
    defaultRead: false,
    ctaLabel: normalizeText(row.cta_label) || "Open",
    path: normalizeText(row.path) || "/",
    accent: normalizeText(row.accent) || "rgba(124,58,237,0.94)",
    accentSoft: normalizeText(row.accent_soft) || "rgba(124,58,237,0.12)",
    Icon: resolveNotificationIcon(row),
  };
}

export function useNotifications() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [recentServices, setRecentServices] = useState([]);
  const [storedNotifications, setStoredNotifications] = useState([]);
  const [readMap, setReadMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchSavedCount(nextUserId, role) {
      if (role !== "customer") return 0;

      const { count, error } = await supabase
        .from("saved_services")
        .select("id", { count: "exact", head: true })
        .eq("user_id", nextUserId);

      if (error) throw error;
      return count ?? 0;
    }

    async function fetchPendingOrders(nextUserId, role) {
      const column = role === "freelancer" ? "freelancer_id" : "customer_id";

      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq(column, nextUserId)
        .in("status", ["pending", "active"]);

      if (error) throw error;
      return count ?? 0;
    }

    async function fetchRecentServices(role) {
      if (role !== "customer") return [];

      const { data, error } = await supabase
        .from("services")
        .select(
          "id, title, category, location, created_at, is_published, profiles(first_name, last_name)"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    }

    async function fetchStoredNotifications(nextUserId) {
      if (!nextUserId || nextUserId === "guest") return [];

      const { data, error } = await supabase
        .from("user_notifications")
        .select(
          "id, notification_group, label, title, body, path, cta_label, accent, accent_soft, created_at"
        )
        .eq("user_id", nextUserId)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;
      return (data || []).map(normalizeStoredNotification);
    }

    async function fetchReadMap(nextUserId) {
      if (!nextUserId || nextUserId === "guest") return {};

      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id, is_read")
        .eq("user_id", nextUserId);

      if (error) throw error;

      return Object.fromEntries(
        (data || []).map((row) => [row.notification_id, row.is_read])
      );
    }

    async function load() {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const nextUserId = session?.user?.id || "guest";
        const nextProfile = await getProfile().catch(() => null);
        const role = normalizeText(nextProfile?.role).toLowerCase() || "customer";

        const tasks = [
          Promise.resolve(nextProfile),
          nextUserId !== "guest"
            ? fetchSavedCount(nextUserId, role)
            : Promise.resolve(0),
          nextUserId !== "guest"
            ? fetchPendingOrders(nextUserId, role)
            : Promise.resolve(0),
          fetchRecentServices(role),
          fetchStoredNotifications(nextUserId),
          fetchReadMap(nextUserId),
        ];

        const [
          profileRes,
          savedRes,
          ordersRes,
          servicesRes,
          storedRes,
          readRes,
        ] = await Promise.allSettled(tasks);

        if (!active) return;

        setUserId(nextUserId);
        setProfile(profileRes.status === "fulfilled" ? profileRes.value : null);
        setSavedCount(savedRes.status === "fulfilled" ? savedRes.value : 0);
        setPendingOrders(ordersRes.status === "fulfilled" ? ordersRes.value : 0);
        setRecentServices(
          servicesRes.status === "fulfilled" ? servicesRes.value : []
        );
        setStoredNotifications(
          storedRes.status === "fulfilled" ? storedRes.value : []
        );
        setReadMap(readRes.status === "fulfilled" ? readRes.value : {});
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const handleCustomSync = (event) => {
      if (event.detail?.userId === userId) {
        setReadMap(event.detail.readMap || {});
      }
    };

    window.addEventListener(READ_STATE_EVENT, handleCustomSync);

    return () => {
      window.removeEventListener(READ_STATE_EVENT, handleCustomSync);
    };
  }, [userId]);

  const notifications = useMemo(() => {
    const role = normalizeText(profile?.role).toLowerCase() || "customer";
    const base = buildBaseNotifications({
      profile,
      role,
      savedCount,
      pendingOrders,
      recentServices,
    });

    const merged = [...storedNotifications, ...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return merged.map((item) => ({
      ...item,
      isRead: readMap[item.id] ?? item.defaultRead,
    }));
  }, [pendingOrders, profile, readMap, recentServices, savedCount, storedNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications]
  );

  const applyReadMap = (nextMap) => {
    setReadMap(nextMap);
    emitReadState(userId, nextMap);
  };

  const persistReadEntries = async (entries, nextMap, previousMap) => {
    if (!userId || userId === "guest") {
      applyReadMap(nextMap);
      return true;
    }

    applyReadMap(nextMap);

    const timestamp = new Date().toISOString();
    const payload = entries.map((entry) => ({
      user_id: userId,
      notification_id: entry.notificationId,
      is_read: entry.isRead,
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from("notification_reads")
      .upsert(payload, { onConflict: "user_id,notification_id" });

    if (error) {
      applyReadMap(previousMap);
      throw error;
    }

    return true;
  };

  const toggleRead = async (id) => {
    const target = notifications.find((item) => item.id === id);
    if (!target) return false;

    const previousMap = readMap;
    const nextMap = {
      ...previousMap,
      [id]: !target.isRead,
    };

    return persistReadEntries(
      [{ notificationId: id, isRead: !target.isRead }],
      nextMap,
      previousMap
    );
  };

  const markRead = async (id) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.isRead) return true;

    const previousMap = readMap;
    const nextMap = {
      ...previousMap,
      [id]: true,
    };

    return persistReadEntries(
      [{ notificationId: id, isRead: true }],
      nextMap,
      previousMap
    );
  };

  const markAllRead = async () => {
    const previousMap = readMap;
    const nextMap = { ...previousMap };

    notifications.forEach((item) => {
      nextMap[item.id] = true;
    });

    return persistReadEntries(
      notifications.map((item) => ({
        notificationId: item.id,
        isRead: true,
      })),
      nextMap,
      previousMap
    );
  };

  return {
    loading,
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    hasUnread: unreadNotifications.length > 0,
    profile,
    role: normalizeText(profile?.role).toLowerCase() || "customer",
    toggleRead,
    markRead,
    markAllRead,
  };
}
