import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile } from "../../../lib/supabase/auth";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";

const supabase = createClient();
const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";
const MESSAGE_ATTACHMENT_SIGNED_URL_TTL = 60 * 60;

function getSafeFileName(name) {
  return String(name || "attachment")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "attachment";
}

function getAttachmentKind(file) {
  const mimeType = String(file?.type || "").toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

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
  if (message.message_type === "attachment") {
    const name = String(message?.metadata?.originalName || "Attachment").trim();
    return `${message.sender_id === currentUserId ? "You: " : ""}Attachment: ${name}`;
  }
  if (message.message_type === "proposal") {
    const amount = Number(message?.metadata?.offeredPrice || 0);
    const deliveryDays = Number(message?.metadata?.deliveryDays || 0);
    const bits = [];
    if (amount > 0) bits.push(`PHP ${amount.toLocaleString()}`);
    if (deliveryDays > 0) bits.push(`${deliveryDays} day${deliveryDays === 1 ? "" : "s"}`);
    return `${message.sender_id === currentUserId ? "You: " : ""}Proposal${bits.length ? ` · ${bits.join(" · ")}` : ""}`;
  }
  if (message.message_type === "order_update") {
    return `${message.sender_id === currentUserId ? "You: " : ""}${message?.metadata?.title || "Order update"}`;
  }
  const prefix = message.sender_id === currentUserId ? "You: " : "";
  return `${prefix}${message.body}`;
}

function normalizeMessageRow(row) {
  return {
    id: row.id,
    thread_id: row.thread_id,
    sender_id: row.sender_id,
    sender_role: row.sender_role,
    body: row.body,
    created_at: row.created_at,
    message_type: String(row.message_type || "text").trim() || "text",
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    attachmentUrl: row.attachmentUrl || "",
  };
}

async function enrichAttachmentMessages(messages) {
  const enrichedEntries = await Promise.all(
    messages.map(async (message) => {
      const bucketPath = String(message?.metadata?.bucketPath || "").trim();
      if (message.message_type !== "attachment" || !bucketPath) {
        return message;
      }

      const { data, error } = await supabase.storage
        .from(MESSAGE_ATTACHMENTS_BUCKET)
        .createSignedUrl(bucketPath, MESSAGE_ATTACHMENT_SIGNED_URL_TTL);

      return {
        ...message,
        attachmentUrl: error ? "" : data?.signedUrl || "",
      };
    })
  );

  return enrichedEntries;
}

async function fetchThreadMessages(threadId) {
  const primary = await supabase
    .from("customer_freelancer_messages")
    .select("id, thread_id, sender_id, sender_role, body, created_at, message_type, metadata")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (!primary.error) {
    return enrichAttachmentMessages((primary.data || []).map(normalizeMessageRow));
  }

  const message = String(primary.error?.message || "");
  if (!/message_type|metadata|column .* does not exist/i.test(message)) {
    throw primary.error;
  }

  const fallback = await supabase
    .from("customer_freelancer_messages")
    .select("id, thread_id, sender_id, sender_role, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (fallback.error) throw fallback.error;
  return (fallback.data || []).map(normalizeMessageRow);
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
  const [hidingThread, setHidingThread] = useState(false);

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
      .select("id, customer_id, freelancer_id, created_at, updated_at, last_message_at, customer_hidden_at, freelancer_hidden_at")
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
              .select("id, thread_id, sender_id, body, created_at, message_type, metadata")
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
      nextThreads: rows
        .map((thread) => {
          const counterpartId = getCounterpartId(thread, currentProfile.id);
          const counterpartProfile = profileMap.get(counterpartId);
          const latestMessage = latestByThread.get(thread.id);
          const activityTime =
            latestMessage?.created_at || thread.last_message_at || thread.created_at;
          const hiddenTime =
            role === "customer"
              ? thread.customer_hidden_at
              : thread.freelancer_hidden_at;

          return {
            ...thread,
            counterpartId,
            counterpart: buildCounterpartMeta(counterpartProfile, role === "customer" ? "freelancer" : "customer"),
            latestMessage: latestMessage ? normalizeMessageRow(latestMessage) : null,
            preview: buildMessagePreview(latestMessage, currentProfile.id),
            previewTime: latestMessage?.created_at || thread.last_message_at || thread.updated_at,
            hiddenForCurrentUser:
              hiddenTime && activityTime
                ? new Date(hiddenTime).getTime() >= new Date(activityTime).getTime()
                : false,
          };
        })
        .filter((thread) => !thread.hiddenForCurrentUser),
    };
  }, [cleanupExpiredThreads, role]);

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const nextMessages = await fetchThreadMessages(threadId);
      setMessages(nextMessages);
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
          if (!changedThreadId || changedThreadId !== activeThreadIdRef.current) {
            return;
          }

          if (payload.eventType === "INSERT" && payload.new) {
            const nextMessage = normalizeMessageRow(payload.new);
            if (nextMessage.message_type === "attachment") {
              await loadMessages(changedThreadId);
              return;
            }

            setMessages((current) =>
              current.some((entry) => entry.id === nextMessage.id)
                ? current
                : [...current, nextMessage]
            );
            return;
          }

          await loadMessages(changedThreadId);
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

        let insertError = null;

        const primaryInsert = await supabase
          .from("customer_freelancer_messages")
          .insert([
            {
              thread_id: activeThreadId,
              sender_id: userId,
              sender_role: role,
              body: trimmedBody,
              message_type: "text",
              metadata: null,
            },
          ]);

        insertError = primaryInsert.error;

        if (insertError && /message_type|metadata|column .* does not exist/i.test(String(insertError.message || ""))) {
          const fallbackInsert = await supabase
            .from("customer_freelancer_messages")
            .insert([
              {
                thread_id: activeThreadId,
                sender_id: userId,
                sender_role: role,
                body: trimmedBody,
              },
            ]);

          insertError = fallbackInsert.error;
        }

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

  const sendAttachment = useCallback(
    async (file) => {
      if (!file || !activeThreadId || !userId) return false;

      setSending(true);
      setError("");

      const safeName = getSafeFileName(file.name);
      const bucketPath = `${activeThreadId}/${userId}/${Date.now()}-${safeName}`;

      try {
        await cleanupExpiredThreads();

        const { error: uploadError } = await supabase.storage
          .from(MESSAGE_ATTACHMENTS_BUCKET)
          .upload(bucketPath, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const metadata = {
          bucketPath,
          originalName: file.name || safeName,
          mimeType: file.type || "application/octet-stream",
          size: file.size || 0,
          kind: getAttachmentKind(file),
        };

        const { error: insertError } = await supabase
          .from("customer_freelancer_messages")
          .insert([
            {
              thread_id: activeThreadId,
              sender_id: userId,
              sender_role: role,
              body: `Attachment: ${metadata.originalName}`,
              message_type: "attachment",
              metadata,
            },
          ]);

        if (insertError) {
          await supabase.storage
            .from(MESSAGE_ATTACHMENTS_BUCKET)
            .remove([bucketPath])
            .catch(() => {});
          throw insertError;
        }

        await Promise.all([refreshThreads(), loadMessages(activeThreadId)]);
        return true;
      } catch (nextError) {
        setError(nextError.message || "We couldn't upload that file.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeThreadId, cleanupExpiredThreads, loadMessages, refreshThreads, role, userId]
  );

  const hideConversation = useCallback(
    async (threadId = activeThreadId) => {
      const normalizedThreadId = String(threadId || "").trim();
      if (!normalizedThreadId) return false;

      setHidingThread(true);
      setError("");

      try {
        const { error: hideError } = await supabase.rpc(
          "hide_customer_freelancer_thread",
          {
            p_thread_id: normalizedThreadId,
          }
        );

        if (hideError) throw hideError;

        if (normalizedThreadId === activeThreadId) {
          setActiveThreadId("");
          setMessages([]);
        }

        await refreshThreads();
        return true;
      } catch (nextError) {
        setError(nextError.message || "We couldn't delete that conversation.");
        return false;
      } finally {
        setHidingThread(false);
      }
    },
    [activeThreadId, refreshThreads]
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
    hidingThread,
    setActiveThreadId,
    sendMessage,
    sendAttachment,
    hideConversation,
    ensureThreadForFreelancer,
    ensureThreadForCustomer,
    refreshThreads,
  };
}
