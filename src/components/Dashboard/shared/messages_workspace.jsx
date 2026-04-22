import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  EmptySurface,
  Reveal,
  DashboardBreadcrumbs,
  TypewriterHeading,
} from "./customerProfileShared";
import { PROFILE_SPRING } from "./customerProfileConfig";
import { formatConversationTime, useMessagesInbox } from "../hooks/useMessagesInbox";
import "./messages_workspace.css";

function MessageThreadButton({ thread, active, onSelect }) {
  return (
    <Motion.button
      type="button"
      className={`messagesThread ${active ? "messagesThread--active" : ""}`.trim()}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={PROFILE_SPRING}
      onClick={() => onSelect(thread.id)}
    >
      <span className="messagesThread__avatar" aria-hidden="true">
        {thread.counterpart.avatarUrl ? (
          <img
            src={thread.counterpart.avatarUrl}
            alt={thread.counterpart.title}
            className="messagesThread__avatarImage"
          />
        ) : (
          thread.counterpart.initials
        )}
      </span>

      <span className="messagesThread__copy">
        <span className="messagesThread__row">
          <strong className="messagesThread__name">{thread.counterpart.title}</strong>
          <span className="messagesThread__time">
            {formatConversationTime(thread.previewTime)}
          </span>
        </span>

        <span className="messagesThread__preview">{thread.preview}</span>
      </span>
    </Motion.button>
  );
}

function formatConversationStarted(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageHeaderActionButton({
  open,
  onToggle,
  onClose,
  onUpload,
  onDelete,
  disabled,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      onClose();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <div className="messagesConversation__menuWrap" ref={rootRef}>
      <button
        type="button"
        className={`messagesConversation__menu ${
          open ? "messagesConversation__menu--open" : ""
        }`}
        aria-label="Conversation actions"
        title="Conversation actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="messagesConversation__menuDot" />
        <span className="messagesConversation__menuDot" />
        <span className="messagesConversation__menuDot" />
      </button>

      <AnimatePresence>
        {open ? (
          <Motion.div
            className="messagesConversation__actionMenu"
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, scale: 0.98, filter: "blur(6px)" }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="messagesConversation__actionItem"
              role="menuitem"
              onClick={onUpload}
              disabled={disabled}
            >
              <Upload className="messagesConversation__actionIcon" />
              <span>Upload file</span>
            </button>
            <button
              type="button"
              className="messagesConversation__actionItem messagesConversation__actionItem--danger"
              role="menuitem"
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 className="messagesConversation__actionIcon" />
              <span>Delete conversation</span>
            </button>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ message, ownMessage }) {
  const bubbleClassName = `messagesBubble ${ownMessage ? "messagesBubble--own" : ""}`.trim();
  const metaText = formatConversationTime(message.created_at);

  if (message.message_type === "proposal") {
    const offeredPrice = Number(message?.metadata?.offeredPrice || 0);
    const deliveryDays = Number(message?.metadata?.deliveryDays || 0);
    const requestTitle = String(message?.metadata?.requestTitle || "").trim();
    const status = String(message?.metadata?.status || "").trim();

    return (
      <Motion.div
        className={`messagesBubbleWrap ${
          ownMessage ? "messagesBubbleWrap--own" : ""
        }`.trim()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={bubbleClassName}>
          <div className="messagesBubble__body messagesBubble__body--card">
            <div className="messagesBubble__cardLabel">Proposal</div>

            {requestTitle ? (
              <div className="messagesBubble__cardTitle">{requestTitle}</div>
            ) : null}

            <div className="messagesBubble__cardFacts">
              {offeredPrice > 0 ? <span>PHP {offeredPrice.toLocaleString()}</span> : null}
              {deliveryDays > 0 ? (
                <span>
                  {deliveryDays} day{deliveryDays === 1 ? "" : "s"}
                </span>
              ) : null}
              {status ? <span>{status}</span> : null}
            </div>

            {message.body ? <div>{message.body}</div> : null}
          </div>
        </div>

        <div className="messagesBubble__metaBelow">{metaText}</div>
      </Motion.div>
    );
  }

  if (message.message_type === "order_update") {
    const title = String(message?.metadata?.title || "").trim() || "Order update";
    const kind = String(message?.metadata?.updateKind || "").trim();

    return (
      <Motion.div
        className={`messagesBubbleWrap ${
          ownMessage ? "messagesBubbleWrap--own" : ""
        }`.trim()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={bubbleClassName}>
          <div className="messagesBubble__body messagesBubble__body--card">
            <div className="messagesBubble__cardLabel">{kind || "Order update"}</div>
            <div className="messagesBubble__cardTitle">{title}</div>
            {message.body ? <div>{message.body}</div> : null}
          </div>
        </div>

        <div className="messagesBubble__metaBelow">{metaText}</div>
      </Motion.div>
    );
  }

  if (message.message_type === "attachment") {
    const originalName =
      String(message?.metadata?.originalName || "").trim() || "Attachment";
    const mimeType = String(message?.metadata?.mimeType || "").trim();
    const size = formatFileSize(message?.metadata?.size);

    return (
      <Motion.div
        className={`messagesBubbleWrap ${
          ownMessage ? "messagesBubbleWrap--own" : ""
        }`.trim()}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={bubbleClassName}>
          <div className="messagesBubble__body messagesBubble__body--attachment">
            <FileText className="messagesBubble__attachmentIcon" />
            <div className="messagesBubble__attachmentCopy">
              <div className="messagesBubble__attachmentName">{originalName}</div>
              <div className="messagesBubble__attachmentMeta">
                {[mimeType || "File", size].filter(Boolean).join(" · ")}
              </div>
            </div>
            {message.attachmentUrl ? (
              <a
                className="messagesBubble__attachmentLink"
                href={message.attachmentUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>Open</span>
                <ExternalLink className="messagesBubble__attachmentLinkIcon" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="messagesBubble__metaBelow">{metaText}</div>
      </Motion.div>
    );
  }

  return (
    <Motion.div
      className={`messagesBubbleWrap ${
        ownMessage ? "messagesBubbleWrap--own" : ""
      }`.trim()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={bubbleClassName}>
        <div className="messagesBubble__body">{message.body}</div>
      </div>

      <div className="messagesBubble__metaBelow">{metaText}</div>
    </Motion.div>
  );
}

export default function MessagesWorkspace({ role = "customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [draft, setDraft] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const {
    loading,
    loadingMessages,
    error,
    threads,
    activeThread,
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
  } = useMessagesInbox(role);

  const homePath = role === "customer" ? "/dashboard/customer" : "/dashboard/freelancer";
  const currentLabel = "Messages";
  const browsePath =
    role === "customer"
      ? "/dashboard/customer/browse-services"
      : "/dashboard/freelancer/browse-requests";
  const browseLabel = role === "customer" ? "Browse services" : "Browse requests";

  const freelancerId = String(searchParams.get("freelancer") || "").trim();
  const customerId = String(searchParams.get("customer") || "").trim();
  const serviceTitle = String(searchParams.get("serviceTitle") || "").trim();
  const requestTitle = String(searchParams.get("requestTitle") || "").trim();

  useEffect(() => {
    if (role !== "customer" || !freelancerId) return;
    ensureThreadForFreelancer(freelancerId).catch(() => {});
  }, [ensureThreadForFreelancer, freelancerId, role]);

  useEffect(() => {
    if (role !== "freelancer" || !customerId) return;
    ensureThreadForCustomer(customerId).catch(() => {});
  }, [customerId, ensureThreadForCustomer, role]);

  useEffect(() => {
    if (!sending) return;
    composerRef.current?.focus();
  }, [sending]);

  useEffect(() => {
    queueMicrotask(() => setActionMenuOpen(false));
  }, [activeThread?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sent = await sendMessage(draft);
    if (sent) {
      setDraft("");
      composerRef.current?.focus();
    }
  };

  const handleUploadFile = () => {
    setActionMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await sendAttachment(file);
  };

  const handleDeleteConversation = async () => {
    setActionMenuOpen(false);
    const confirmed = window.confirm(
      "Delete this conversation from your inbox? It will stay visible for the other person."
    );
    if (!confirmed) return;
    await hideConversation(activeThread?.id);
  };

  const titleText = "Messages";
  const heroSubtext =
    role === "customer"
      ? "Keep service questions and project details in one conversation."
      : "Reply to customers and keep each conversation in one place.";

  const contextualThread =
    activeThread &&
    ((role === "customer" &&
      freelancerId &&
      activeThread.counterpartId === freelancerId) ||
      (role === "freelancer" &&
        customerId &&
        activeThread.counterpartId === customerId));

  return (
    <>
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: currentLabel }]} homePath={homePath} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="messagesHero">
          <div className="messagesHero__heading">
            <div className="messagesHero__titleWrap">
              <h1 className="messagesHero__title">
                <TypewriterHeading text={titleText} />
              </h1>

              <Motion.svg
                className="messagesHero__line"
                viewBox="0 0 250 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M 0,10 L 250,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.14 }}
                />
              </Motion.svg>
            </div>

            <p className="messagesHero__sub">{heroSubtext}</p>
          </div>

        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="messagesWorkspace">
          <div className="messagesWorkspace__threads">
            <div className="messagesWorkspace__sectionHead">
              <div>
                <h2 className="messagesWorkspace__sectionTitle">Conversations</h2>
                <p className="messagesWorkspace__sectionSub">
                  Open the thread you want to continue without leaving the inbox.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="messagesThreadSkeletonList" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="messagesThreadSkeleton" />
                ))}
              </div>
            ) : error && threads.length === 0 ? (
              <EmptySurface
                hideIcon
                title="We couldn't load your messages"
                actionLabel={browseLabel}
                onAction={() => navigate(browsePath)}
                className="messagesEmpty messagesEmpty--threads"
              />
            ) : threads.length === 0 ? (
              <EmptySurface
                hideIcon
                title="No conversations yet"
                actionLabel={browseLabel}
                onAction={() => navigate(browsePath)}
                className="messagesEmpty messagesEmpty--threads messagesEmpty--spacious"
              />
            ) : (
              <div className="messagesThreadList">
                {threads.map((thread) => (
                  <MessageThreadButton
                    key={thread.id}
                    thread={thread}
                    active={thread.id === activeThread?.id}
                    onSelect={setActiveThreadId}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="messagesWorkspace__conversation">
            {loading ? (
              <div className="messagesConversationSkeleton" aria-hidden="true" />
            ) : !activeThread ? (
              <EmptySurface
                hideIcon
                title={
                  role === "customer"
                    ? "Choose a freelancer to start chatting"
                    : "Choose a conversation to reply"
                }
                actionLabel={browseLabel}
                onAction={() => navigate(browsePath)}
                className="messagesEmpty messagesEmpty--conversation messagesEmpty--spacious"
              />
            ) : (
              <>
                <div className="messagesConversation__head">
                  <div className="messagesConversation__identity">
                    <div className="messagesConversation__avatar" aria-hidden="true">
                      {activeThread.counterpart.avatarUrl ? (
                        <img
                          src={activeThread.counterpart.avatarUrl}
                          alt={activeThread.counterpart.title}
                          className="messagesConversation__avatarImage"
                        />
                      ) : (
                        activeThread.counterpart.initials
                      )}
                    </div>

                    <div className="messagesConversation__copy">
                      <h2 className="messagesConversation__title">
                        {activeThread.counterpart.title}
                      </h2>

                      {activeThread.counterpart.subtitle ? (
                        <p className="messagesConversation__subtitle">
                          {activeThread.counterpart.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="messagesConversation__headActions">
                    {contextualThread && (serviceTitle || requestTitle) ? (
                      <div className="messagesConversation__context">
                        About {serviceTitle || requestTitle}
                      </div>
                    ) : null}

                    <MessageHeaderActionButton
                      open={actionMenuOpen}
                      onToggle={() => setActionMenuOpen((current) => !current)}
                      onClose={() => setActionMenuOpen(false)}
                      onUpload={handleUploadFile}
                      onDelete={handleDeleteConversation}
                      disabled={sending || hidingThread || !activeThread}
                    />
                  </div>
                </div>

                <div className="messagesConversation__body">
                  {loadingMessages ? (
                    <div className="messagesBubbleSkeletonList" aria-hidden="true">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="messagesBubbleSkeleton" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptySurface
                      hideIcon
                      title="Start the conversation"
                      className="messagesEmpty messagesEmpty--conversation"
                    />
                  ) : (
                    <div className="messagesBubbleList">
                      <div className="messagesSystemRow">
                        Conversation started {formatConversationStarted(activeThread?.created_at)}
                      </div>

                      <AnimatePresence initial={false}>
                        {messages.map((message) => {
                          const ownMessage = message.sender_role === role;
                          return (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              ownMessage={ownMessage}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <form className="messagesComposer" onSubmit={handleSubmit}>
                  <input
                    ref={fileInputRef}
                    className="messagesComposer__fileInput"
                    type="file"
                    onChange={handleFileSelected}
                    disabled={sending || startingThread || hidingThread || !activeThread}
                  />

                  <div className="messagesComposer__field">
                    <label className="messagesComposer__label" htmlFor="messages-composer">
                      Reply
                    </label>

                    <textarea
                      id="messages-composer"
                      ref={composerRef}
                      className="messagesComposer__control"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        startingThread
                          ? "Opening your thread..."
                          : sending
                            ? "Sending..."
                          : "Type your message here..."
                      }
                      disabled={sending || startingThread || !activeThread}
                    />
                  </div>

                  <div className="messagesComposer__actions">
                    <p className="messagesComposer__error" role="status" aria-live="polite">
                      {error ? error : "\u00A0"}
                    </p>

                    <button
                      type="submit"
                      className="messagesComposer__submit"
                      disabled={
                        sending ||
                        startingThread ||
                        hidingThread ||
                        !activeThread ||
                        !String(draft || "").trim()
                      }
                    >
                      {sending ? "Sending..." : "Send message"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </Reveal>
    </>
  );
}
