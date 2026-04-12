import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { EmptySurface, Reveal, DashboardBreadcrumbs, TypewriterHeading } from "./customerProfileShared";
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
        {thread.counterpart.subtitle ? (
          <span className="messagesThread__subtitle">{thread.counterpart.subtitle}</span>
        ) : null}
        <span className="messagesThread__preview">{thread.preview}</span>
      </span>
    </motion.button>
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

  const homePath =
    role === "customer" ? "/dashboard/customer" : "/dashboard/freelancer";
  const currentLabel = role === "customer" ? "Messages" : "Messages";
  const browsePath =
    role === "customer"
      ? "/dashboard/customer/browse-services"
      : "/dashboard/freelancer/browse-requests";
  const browseLabel =
    role === "customer" ? "Browse services" : "Browse requests";
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

  const titleText = role === "customer" ? "Messages" : "Messages";
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
              <strong className="profileMiniStat__value">
                {activeThread ? "1" : "0"}
              </strong>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="messagesWorkspace">
          <div className="messagesWorkspace__threads">
            <div className="messagesWorkspace__sectionHead">
              <h2 className="messagesWorkspace__sectionTitle">Conversations</h2>
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

                  {contextualThread && (serviceTitle || requestTitle) ? (
                    <div className="messagesConversation__context">
                      About {serviceTitle || requestTitle}
                    </div>
                  ) : null}
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
                      {messages.map((message) => {
                        const ownMessage = message.sender_role === role;

                        return (
                          <motion.div
                            key={message.id}
                            className={`messagesBubble ${
                              ownMessage ? "messagesBubble--own" : ""
                            }`.trim()}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <div className="messagesBubble__body">{message.body}</div>
                            <div className="messagesBubble__meta">
                              {formatConversationTime(message.created_at)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form className="messagesComposer" onSubmit={handleSubmit}>
                  <label className="messagesComposer__field">
                    <span className="messagesComposer__label">Message</span>
                    <textarea
                      ref={composerRef}
                      className="messagesComposer__control"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        role === "customer"
                          ? "Ask about the service or share the details you need."
                          : "Reply with the details the customer needs."
                      }
                      rows={3}
                    />
                  </label>

                  <div className="messagesComposer__actions">
                    <AnimatePresence mode="wait">
                      {error ? (
                        <motion.p
                          key={error}
                          className="messagesComposer__error"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                        >
                          {error}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      className="messagesComposer__submit"
                      whileHover={sending ? {} : { y: -1.5 }}
                      whileTap={sending ? {} : { scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={sending || startingThread || !draft.trim()}
                    >
                      {sending ? "Sending..." : "Send"}
                    </motion.button>
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
