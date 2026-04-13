import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    <motion.button
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
    </motion.button>
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

function MessageHeaderActionButton() {
  return (
    <button
      type="button"
      className="messagesConversation__menu"
      aria-label="Conversation actions"
      title="Conversation actions"
    >
      <span className="messagesConversation__menuDot" />
      <span className="messagesConversation__menuDot" />
      <span className="messagesConversation__menuDot" />
    </button>
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
      <motion.div
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
      </motion.div>
    );
  }

  if (message.message_type === "order_update") {
    const title = String(message?.metadata?.title || "").trim() || "Order update";
    const kind = String(message?.metadata?.updateKind || "").trim();

    return (
      <motion.div
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
      </motion.div>
    );
  }

  return (
    <motion.div
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
    </motion.div>
  );
}

export default function MessagesWorkspace({ role = "customer" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const composerRef = useRef(null);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [draft, setDraft] = useState("");

  const {
    loading,
    loadingMessages,
    error,
    threads,
    activeThread,
    messages,
    sending,
    startingThread,
    setActiveThreadId,
    sendMessage,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sent = await sendMessage(draft);
    if (sent) {
      setDraft("");
      composerRef.current?.focus();
    }
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

              <motion.svg
                className="messagesHero__line"
                viewBox="0 0 250 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 62,0 125,10 Q 188,20 250,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.14 }}
                />
              </motion.svg>
            </div>

            <p className="messagesHero__sub">{heroSubtext}</p>
          </div>

          <div className="messagesHero__stats">
            <div className="profileMiniStat profileMiniStat--open">
              <span className="profileMiniStat__label">Threads</span>
              <strong className="profileMiniStat__value">{threads.length}</strong>
            </div>

            <div className="profileMiniStat profileMiniStat--open">
              <span className="profileMiniStat__label">Active</span>
              <strong className="profileMiniStat__value">{activeThread ? "1" : "0"}</strong>
            </div>
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

                    <MessageHeaderActionButton />
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