import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile } from "../../../lib/supabase/auth";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";

const supabase = createClient();

function getCounterpartId(thread, currentUserId) {
  if (!thread || !currentUserId) return "";
  return thread.customer_id === currentUserId
    ? thread.freelancer_id
    : thread.customer_id;
}

function buildCounterpartMeta(profile, role) {
  if (!profile) {
    return {
      id: "",
      title: "Conversation",
      subtitle: "",
      avatarUrl: "",
      initials: "?",
    };
  }

  const displayName =
    String(profile.display_name || "").trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    (role === "customer" ? "Customer" : "Freelancer");

  const initials = [profile.first_name, profile.last_name]
    .map((part) => String(part || "").trim().charAt(0))
    .join("")
    .toUpperCase() || displayName.charAt(0).toUpperCase() || "?";

  const location = buildPhilippinesLocationLabel({
    region: profile.region,
    city: profile.city,
    barangay: profile.barangay,
  });

  return {
    id: profile.id,
    title: displayName,
    subtitle:
      role === "freelancer"
        ? String(profile.freelancer_headline || "").trim() || location || ""
        : location || String(profile.bio || "").trim(),
    avatarUrl: profile.avatar_url || "",
    initials,
  };
}

function buildMessagePreview(message, currentUserId) {
  if (!message) return "No messages yet";
  const prefix = message.sender_id === currentUserId ? "You: " : "";
  return `${prefix}${message.body}`;
}

export function formatConversationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function useMessagesInbox(role = "customer") {
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [startingThread, setStartingThread] = useState(false);

  const userId = profile?.id || "";
  const activeThreadIdRef = useRef("");

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const cleanupExpiredThreads = useCallback(async () => {
    try {
      await supabase.rpc("cleanup_expired_customer_freelancer_threads");
    } catch {
      // Leave cleanup failures silent so the inbox still loads.
    }
  }, []);

  const loadThreads = useCallback(async () => {
    const currentProfile = await getProfile();

    if (!currentProfile || currentProfile.role !== role) {
      throw new Error("We couldn't open your messages right now.");
    }

    await cleanupExpiredThreads();

    const { data: threadRows, error: threadError } = await supabase
      .from("customer_freelancer_threads")
      .select("id, customer_id, freelancer_id, created_at, updated_at, last_message_at")
      .eq(role === "customer" ? "customer_id" : "freelancer_id", currentProfile.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (threadError) throw threadError;

    const rows = threadRows || [];
    const counterpartIds = Array.from(
      new Set(rows.map((thread) => getCounterpartId(thread, currentProfile.id)).filter(Boolean))
    );

    const threadIds = rows.map((thread) => thread.id);

    const [{ data: profileRows, error: profileError }, { data: latestRows, error: latestError }] =
      await Promise.all([
        counterpartIds.length > 0
          ? supabase
              .from("profiles")
              .select(
                "id, first_name, last_name, display_name, avatar_url, bio, region, city, barangay, freelancer_headline"
              )
              .in("id", counterpartIds)
          : Promise.resolve({ data: [], error: null }),
        threadIds.length > 0
          ? supabase
              .from("customer_freelancer_messages")
              .select("id, thread_id, sender_id, body, created_at")
              .in("thread_id", threadIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (profileError) throw profileError;
    if (latestError) throw latestError;

    const profileMap = new Map((profileRows || []).map((entry) => [entry.id, entry]));
    const latestByThread = new Map();

    (latestRows || []).forEach((entry) => {
      if (!latestByThread.has(entry.thread_id)) {
        latestByThread.set(entry.thread_id, entry);
      }
    });

    return {
      currentProfile,
      nextThreads: rows.map((thread) => {
        const counterpartId = getCounterpartId(thread, currentProfile.id);
        const counterpartProfile = profileMap.get(counterpartId);
        const latestMessage = latestByThread.get(thread.id);

        return {
          ...thread,
          counterpartId,
          counterpart: buildCounterpartMeta(counterpartProfile, role === "customer" ? "freelancer" : "customer"),
          latestMessage,
          preview: buildMessagePreview(latestMessage, currentProfile.id),
          previewTime: latestMessage?.created_at || thread.last_message_at || thread.updated_at,
        };
      }),
    };
  }, [cleanupExpiredThreads, role]);

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const { data, error: messagesError } = await supabase
        .from("customer_freelancer_messages")
        .select("id, thread_id, sender_id, sender_role, body, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(data || []);
    } catch (nextError) {
      setError(nextError.message || "We couldn't load this conversation.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const refreshThreads = useCallback(async () => {
    try {
      const { currentProfile, nextThreads } = await loadThreads();
      setProfile(currentProfile);
      setThreads(nextThreads);
      setError("");

      setActiveThreadId((currentId) => {
        if (currentId && nextThreads.some((thread) => thread.id === currentId)) {
          return currentId;
        }
        return nextThreads[0]?.id || "";
      });
    } catch (nextError) {
      setError(nextError.message || "We couldn't load your messages.");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [loadThreads]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    loadMessages(activeThreadId);
  }, [activeThreadId, loadMessages]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`messages-inbox:${role}:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_freelancer_threads" },
        async () => {
          await refreshThreads();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_freelancer_messages" },
        async (payload) => {
          const changedThreadId =
            payload.new?.thread_id || payload.old?.thread_id || activeThreadIdRef.current;
          await refreshThreads();
          if (changedThreadId && changedThreadId === activeThreadIdRef.current) {
            await loadMessages(changedThreadId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages, refreshThreads, role, userId]);

  const ensureThreadForFreelancer = useCallback(
    async (freelancerId) => {
      if (!freelancerId || !userId || role !== "customer") return "";

      setStartingThread(true);

      try {
        await cleanupExpiredThreads();

        const { data: existing, error: existingError } = await supabase
          .from("customer_freelancer_threads")
          .select("id")
          .eq("customer_id", userId)
          .eq("freelancer_id", freelancerId)
          .maybeSingle();

        if (existingError) throw existingError;

        let threadId = existing?.id || "";

        if (!threadId) {
          const { data: inserted, error: insertError } = await supabase
            .from("customer_freelancer_threads")
            .insert([
              {
                customer_id: userId,
                freelancer_id: freelancerId,
              },
            ])
            .select("id")
            .single();

          if (insertError) throw insertError;
          threadId = inserted.id;
        }

        await refreshThreads();
        setActiveThreadId(threadId);
        return threadId;
      } finally {
        setStartingThread(false);
      }
    },
    [cleanupExpiredThreads, refreshThreads, role, userId]
  );

  const ensureThreadForCustomer = useCallback(
    async (customerId) => {
      if (!customerId || !userId || role !== "freelancer") return "";

      setStartingThread(true);

      try {
        await cleanupExpiredThreads();

        const { data: existing, error: existingError } = await supabase
          .from("customer_freelancer_threads")
          .select("id")
          .eq("customer_id", customerId)
          .eq("freelancer_id", userId)
          .maybeSingle();

        if (existingError) throw existingError;

        let threadId = existing?.id || "";

        if (!threadId) {
          const { data: inserted, error: insertError } = await supabase
            .from("customer_freelancer_threads")
            .insert([
              {
                customer_id: customerId,
                freelancer_id: userId,
              },
            ])
            .select("id")
            .single();

          if (insertError) throw insertError;
          threadId = inserted.id;
        }

        await refreshThreads();
        setActiveThreadId(threadId);
        return threadId;
      } finally {
        setStartingThread(false);
      }
    },
    [cleanupExpiredThreads, refreshThreads, role, userId]
  );

  const sendMessage = useCallback(
    async (body) => {
      const trimmedBody = String(body || "").trim();
      if (!trimmedBody || !activeThreadId || !userId) return false;

      setSending(true);

      try {
        await cleanupExpiredThreads();

        const { error: insertError } = await supabase
          .from("customer_freelancer_messages")
          .insert([
            {
              thread_id: activeThreadId,
              sender_id: userId,
              sender_role: role,
              body: trimmedBody,
            },
          ]);

        if (insertError) throw insertError;

        await Promise.all([refreshThreads(), loadMessages(activeThreadId)]);
        return true;
      } catch (nextError) {
        setError(nextError.message || "We couldn't send your message.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeThreadId, cleanupExpiredThreads, loadMessages, refreshThreads, role, userId]
  );

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [activeThreadId, threads]
  );

  return {
    loading,
    loadingMessages,
    error,
    profile,
    threads,
    activeThread,
    activeThreadId,
    messages,
    sending,
    startingThread,
    setActiveThreadId,
    sendMessage,
    ensureThreadForFreelancer,
    ensureThreadForCustomer,
    refreshThreads,
  };
}
