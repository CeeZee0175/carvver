import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "../../../lib/supabase/auth";
import { createClient } from "../../../lib/supabase/client";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "../shared/profileIdentity";

const supabase = createClient();

export const MARKETPLACE_COMMENT_MAX_LENGTH = 1000;

function normalizeTarget({ targetType, targetId }) {
  const normalizedType = String(targetType || "").trim();
  const normalizedId = String(targetId || "").trim();

  if (!normalizedType || !normalizedId) return null;

  if (normalizedType === "service") {
    return {
      target_type: "service",
      service_id: normalizedId,
      profile_id: null,
    };
  }

  if (normalizedType === "freelancer_profile" || normalizedType === "customer_profile") {
    return {
      target_type: normalizedType,
      service_id: null,
      profile_id: normalizedId,
    };
  }

  return null;
}

function normalizeComment(row) {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const deleted = Boolean(row.deleted_at);

  return {
    id: row.id,
    parentId: row.parent_id || "",
    authorId: row.author_id || "",
    body: deleted ? "" : String(row.body || "").trim(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || "",
    deleted,
    author: {
      id: author?.id || row.author_id || "",
      role: author?.role || "",
      displayName: getProfileDisplayName(author, "Carvver user"),
      initials: getProfileInitials(author, "C"),
      avatarUrl: author?.avatar_url || "",
    },
    replies: [],
  };
}

function buildThread(rows) {
  const normalized = (rows || []).map(normalizeComment);
  const replyMap = new Map();

  normalized.forEach((comment) => {
    if (!comment.parentId) return;
    const replies = replyMap.get(comment.parentId) || [];

    if (!comment.deleted) {
      replies.push(comment);
    }

    replyMap.set(comment.parentId, replies);
  });

  return normalized
    .filter((comment) => !comment.parentId)
    .map((comment) => ({
      ...comment,
      replies: replyMap.get(comment.id) || [],
    }))
    .filter((comment) => !comment.deleted || comment.replies.length > 0);
}

function canRoleComment(profile, targetType) {
  const role = String(profile?.role || "").trim().toLowerCase();

  if (targetType === "service" || targetType === "freelancer_profile") {
    return role === "customer";
  }

  if (targetType === "customer_profile") {
    return role === "freelancer";
  }

  return false;
}

function buildCommentPayload(target, profile, body, parentId = "") {
  return {
    ...target,
    parent_id: parentId || null,
    author_id: profile.id,
    body: String(body || "").trim(),
  };
}

function createCommentQuery(target) {
  let query = supabase
    .from("marketplace_comments")
    .select(
      `
      id,
      target_type,
      service_id,
      profile_id,
      parent_id,
      author_id,
      body,
      created_at,
      updated_at,
      deleted_at,
      author:profiles!marketplace_comments_author_id_fkey (
        id,
        role,
        display_name,
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .eq("target_type", target.target_type);

  query = target.service_id
    ? query.eq("service_id", target.service_id)
    : query.eq("profile_id", target.profile_id);

  return query.order("created_at", { ascending: true });
}

export function useMarketplaceComments({
  targetType,
  targetId,
  targetOwnerId = "",
  allowCompose = true,
} = {}) {
  const target = useMemo(
    () => normalizeTarget({ targetType, targetId }),
    [targetId, targetType]
  );
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!target) {
      setLoading(false);
      setComments([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [profileResult, commentResult] = await Promise.all([
        getProfile().catch(() => null),
        createCommentQuery(target),
      ]);

      if (commentResult.error) throw commentResult.error;

      setProfile(profileResult);
      setComments(buildThread(commentResult.data || []));
    } catch (nextError) {
      setComments([]);
      setError(nextError?.message || "We couldn't load comments right now.");
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    load();
  }, [load]);

  const canComment = Boolean(
    allowCompose && profile?.id && target && canRoleComment(profile, target.target_type)
  );

  const canDeleteComment = useCallback(
    (comment) => {
      if (!profile?.id || !comment || comment.deleted) return false;

      return (
        String(comment.authorId || "") === String(profile.id) ||
        String(targetOwnerId || "") === String(profile.id)
      );
    },
    [profile?.id, targetOwnerId]
  );

  const submitComment = useCallback(
    async ({ body, parentId = "" } = {}) => {
      const trimmed = String(body || "").trim();

      if (!target || !profile?.id) {
        throw new Error("Sign in before commenting.");
      }

      if (!canRoleComment(profile, target.target_type)) {
        throw new Error("Comments are not available for this account type here.");
      }

      if (!trimmed) {
        throw new Error("Write a comment first.");
      }

      if (trimmed.length > MARKETPLACE_COMMENT_MAX_LENGTH) {
        throw new Error(`Keep comments under ${MARKETPLACE_COMMENT_MAX_LENGTH} characters.`);
      }

      const { error: insertError } = await supabase
        .from("marketplace_comments")
        .insert(buildCommentPayload(target, profile, trimmed, parentId));

      if (insertError) throw insertError;
      await load();
    },
    [load, profile, target]
  );

  const removeComment = useCallback(
    async (commentId) => {
      if (!commentId) return;

      const { error: updateError } = await supabase
        .from("marketplace_comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", commentId);

      if (updateError) throw updateError;
      await load();
    },
    [load]
  );

  return {
    loading,
    comments,
    profile,
    error,
    canComment,
    canDeleteComment,
    reload: load,
    submitComment,
    removeComment,
  };
}
