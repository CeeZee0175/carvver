import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  MARKETPLACE_COMMENT_MAX_LENGTH,
  useMarketplaceComments,
} from "../hooks/useMarketplaceComments";
import "./marketplace_comments.css";

function formatCommentTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function roleLabel(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "freelancer") return "Freelancer";
  if (normalized === "customer") return "Customer";
  return "Member";
}

function CommentComposer({
  placeholder,
  submitLabel,
  helperText,
  busy,
  disabled,
  onSubmit,
  compact = false,
}) {
  const [value, setValue] = useState("");
  const remaining = MARKETPLACE_COMMENT_MAX_LENGTH - value.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || busy || disabled) return;

    await onSubmit(trimmed);
    setValue("");
  };

  return (
    <form
      className={`marketplaceCommentsComposer ${
        compact ? "marketplaceCommentsComposer--compact" : ""
      }`.trim()}
      onSubmit={handleSubmit}
    >
      <textarea
        className="marketplaceCommentsComposer__input"
        aria-label={placeholder || "Write a comment"}
        value={value}
        onChange={(event) => setValue(event.target.value.slice(0, MARKETPLACE_COMMENT_MAX_LENGTH))}
        placeholder={placeholder}
        disabled={busy || disabled}
        rows={compact ? 2 : 3}
      />
      <div className="marketplaceCommentsComposer__foot">
        <span className="marketplaceCommentsComposer__helper">
          {helperText || `${remaining} characters left`}
        </span>
        <button
          type="submit"
          className="marketplaceCommentsComposer__submit"
          disabled={busy || disabled || !value.trim()}
        >
          {busy ? "Posting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function CommentAvatar({ author }) {
  return (
    <span className="marketplaceComment__avatar" aria-hidden="true">
      {author?.avatarUrl ? (
        <img src={author.avatarUrl} alt="" />
      ) : (
        <span>{author?.initials || "C"}</span>
      )}
    </span>
  );
}

function CommentItem({
  comment,
  canComment,
  canDelete,
  onReply,
  onDelete,
  depth = 0,
  replyOpen,
  setReplyOpen,
  replyBusy,
}) {
  const isReply = depth > 0;
  const deleted = comment.deleted;
  const canShowReply = canComment && !isReply && !deleted;
  const canShowDelete = canDelete(comment);

  return (
    <article
      className={`marketplaceComment ${
        isReply ? "marketplaceComment--reply" : ""
      } ${deleted ? "marketplaceComment--deleted" : ""}`.trim()}
    >
      <div className="marketplaceComment__main">
        <CommentAvatar author={comment.author} />
        <div className="marketplaceComment__body">
          <div className="marketplaceComment__meta">
            <strong>{deleted ? "Removed comment" : comment.author.displayName}</strong>
            <span>{deleted ? "Comment removed" : roleLabel(comment.author.role)}</span>
            <span>{formatCommentTime(comment.createdAt)}</span>
          </div>

          <p className="marketplaceComment__text">
            {deleted ? "This comment was removed." : comment.body}
          </p>

          {!deleted ? (
            <div className="marketplaceComment__actions">
              {canShowReply ? (
                <button
                  type="button"
                  className="marketplaceComment__action"
                  onClick={() => setReplyOpen(replyOpen === comment.id ? "" : comment.id)}
                >
                  Reply
                </button>
              ) : null}
              {canShowDelete ? (
                <button
                  type="button"
                  className="marketplaceComment__action marketplaceComment__action--danger"
                  onClick={() => onDelete(comment.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}

          {replyOpen === comment.id ? (
            <CommentComposer
              compact
              busy={replyBusy}
              placeholder="Write a reply"
              submitLabel="Reply"
              helperText="Replies stay connected to this comment."
              onSubmit={(body) => onReply(comment.id, body)}
            />
          ) : null}
        </div>
      </div>

      {comment.replies.length > 0 ? (
        <div className="marketplaceComment__replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              canComment={canComment}
              canDelete={canDelete}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
              replyOpen={replyOpen}
              setReplyOpen={setReplyOpen}
              replyBusy={replyBusy}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function MarketplaceComments({
  targetType,
  targetId,
  targetOwnerId,
  title = "Comments",
  description = "Keep questions and context close to this page.",
  emptyTitle = "No comments yet.",
  emptyDescription = "Start the conversation when you are ready.",
  composePlaceholder = "Write a comment",
  composeHelper = "",
  allowCompose = true,
  className = "",
}) {
  const {
    loading,
    comments,
    error,
    canComment,
    canDeleteComment,
    reload,
    submitComment,
    removeComment,
  } = useMarketplaceComments({
    targetType,
    targetId,
    targetOwnerId,
    allowCompose,
  });
  const [posting, setPosting] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState("");
  const [removingId, setRemovingId] = useState("");

  const helperText = useMemo(() => {
    if (composeHelper) return composeHelper;
    if (!allowCompose) return "Comments posted to this profile appear here.";
    if (!canComment) return "Commenting is not available for this account here.";
    return "Be clear, specific, and respectful.";
  }, [allowCompose, canComment, composeHelper]);

  const handlePost = async (body) => {
    try {
      setPosting(true);
      await submitComment({ body });
      toast.success("Comment posted.");
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't post that comment.");
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId, body) => {
    try {
      setReplyBusy(true);
      await submitComment({ body, parentId });
      setReplyOpen("");
      toast.success("Reply posted.");
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't post that reply.");
    } finally {
      setReplyBusy(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      setRemovingId(commentId);
      await removeComment(commentId);
      toast.success("Comment removed.");
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't remove that comment.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <section className={`marketplaceComments ${className}`.trim()}>
      <div className="marketplaceComments__head">
        <div>
          <h2 className="marketplaceComments__title">{title}</h2>
          <p className="marketplaceComments__sub">{description}</p>
        </div>
        {error ? (
          <button type="button" className="marketplaceComments__refresh" onClick={reload}>
            Retry
          </button>
        ) : null}
      </div>

      {allowCompose && canComment ? (
        <CommentComposer
          busy={posting}
          placeholder={composePlaceholder}
          submitLabel="Comment"
          helperText={helperText}
          onSubmit={handlePost}
        />
      ) : (
        <p className="marketplaceComments__note">{helperText}</p>
      )}

      {loading ? (
        <div className="marketplaceComments__list" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="marketplaceComment marketplaceComment--skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="marketplaceComments__empty">
          <strong>Comments could not load.</strong>
          <span>{error}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="marketplaceComments__empty">
          <strong>{emptyTitle}</strong>
          <span>{emptyDescription}</span>
        </div>
      ) : (
        <div className="marketplaceComments__list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canComment={canComment}
              canDelete={(item) => canDeleteComment(item) && removingId !== item.id}
              onReply={handleReply}
              onDelete={handleDelete}
              replyOpen={replyOpen}
              setReplyOpen={setReplyOpen}
              replyBusy={replyBusy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
