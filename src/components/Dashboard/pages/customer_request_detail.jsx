import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./profile.css";
import "./workflow_pages.css";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  acceptRequestProposal,
  useCustomerRequestDetail,
} from "../hooks/useMarketplaceWorkflow";

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;

  return (
    <motion.div
      className={`workflowStatus workflowStatus--${tone}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </motion.div>
  );
}

export default function CustomerRequestDetail() {
  const navigate = useNavigate();
  const { requestId = "" } = useParams();
  const { loading, request, error, reload } = useCustomerRequestDetail(requestId);
  const [actionState, setActionState] = useState({
    pendingId: "",
    error: "",
    success: "",
  });

  const handleAccept = async (proposalId) => {
    setActionState({ pendingId: proposalId, error: "", success: "" });

    try {
      await acceptRequestProposal({ requestId, proposalId });
      await reload();
      setActionState({
        pendingId: "",
        error: "",
        success: "Proposal accepted. The request is now matched.",
      });
    } catch (nextError) {
      setActionState({
        pendingId: "",
        error: nextError.message || "We couldn't accept that proposal.",
        success: "",
      });
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details workflowPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Post a Request", to: "/dashboard/customer/post-request" },
            { label: request?.title || "Request details" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="workflowHero">
          <div className="workflowHero__top">
            <div className="workflowHero__copy">
              <div className="workflowHero__titleWrap">
                <h1 className="workflowHero__title">
                  <TypewriterHeading text={request?.title || "Request details"} />
                </h1>
                <motion.svg
                  className="workflowHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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

              <p className="workflowHero__sub">
                Review incoming proposals, attached references, and the core brief before you choose who to move forward with.
              </p>
            </div>

            <div className="workflowHero__actions">
              <motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/customer/post-request")}
              >
                Back to requests
              </motion.button>
            </div>
          </div>

          {request ? (
            <div className="workflowMeta">
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Budget</span>
                <strong className="workflowMeta__value">{request.budgetLabel}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Deadline</span>
                <strong className="workflowMeta__value">{request.deadlineLabel}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Status</span>
                <strong className="workflowMeta__value">{request.status}</strong>
              </div>
            </div>
          ) : null}
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="workflowCard" style={{ minHeight: 320 }} />
          </section>
        </Reveal>
      ) : error || !request ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't open this request"
              description={error || "Please try again."}
              actionLabel="Try again"
              onAction={reload}
            />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <section className="profileSection workflowLayout">
            <div className="workflowMain">
              <article className="workflowCard">
                <div className="workflowActions">
                  <span className="workflowChip">{request.category}</span>
                  <span className="workflowChip">{request.createdAtLabel}</span>
                </div>
                <h2 className="workflowCard__title">Request brief</h2>
                <p className="workflowCard__copy">{request.description}</p>
              </article>

              {request.media.length > 0 ? (
                <article className="workflowCard">
                  <h2 className="workflowCard__title">Attached references</h2>
                  <div className="workflowGallery">
                    {request.media.map((item) => (
                      <div key={item.id} className="workflowGallery__item">
                        {item.media_kind === "video" ? (
                          <video src={item.publicUrl} controls playsInline />
                        ) : (
                          <img src={item.publicUrl} alt={item.originalName} />
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className="workflowCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Proposals</h2>
                    <p className="profileSection__sub">
                      Accept one proposal to match this request with a freelancer.
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {actionState.error ? (
                    <InlineStatus tone="danger" message={actionState.error} />
                  ) : actionState.success ? (
                    <InlineStatus tone="success" message={actionState.success} />
                  ) : null}
                </AnimatePresence>

                {request.proposals.length === 0 ? (
                  <EmptySurface
                    hideIcon
                    title="No proposals yet"
                    className="messagesEmpty messagesEmpty--conversation"
                  />
                ) : (
                  <div className="workflowProposalList">
                    {request.proposals.map((proposal) => {
                      const accepted = proposal.status === "accepted";

                      return (
                        <article
                          key={proposal.id}
                          className={`workflowProposalCard ${
                            accepted ? "workflowProposalCard--accepted" : ""
                          }`}
                        >
                          <div className="workflowProposalCard__top">
                            <div>
                              <div className="workflowProposalCard__name">
                                {proposal.freelancer.displayName}
                              </div>
                              <p className="workflowCard__copy">
                                {proposal.freelancer.headline || proposal.freelancer.location}
                              </p>
                            </div>
                            <span className="workflowChip">{proposal.status}</span>
                          </div>

                          <div className="workflowActions">
                            <span className="workflowChip">{proposal.offeredPriceLabel}</span>
                            <span className="workflowChip">
                              {proposal.deliveryDays} day{proposal.deliveryDays === 1 ? "" : "s"}
                            </span>
                          </div>

                          <p className="workflowProposalCard__pitch">{proposal.pitch}</p>

                          <div className="workflowActions">
                            <motion.button
                              type="button"
                              className="workflowActionBtn workflowActionBtn--ghost"
                              whileHover={{ y: -1.5 }}
                              whileTap={{ scale: 0.98 }}
                              transition={PROFILE_SPRING}
                              onClick={() =>
                                navigate(
                                  `/dashboard/customer/messages?freelancer=${proposal.freelancerId}&requestTitle=${encodeURIComponent(
                                    request.title
                                  )}`
                                )
                              }
                            >
                              Open chat
                            </motion.button>

                            {!accepted ? (
                              <motion.button
                                type="button"
                                className="workflowActionBtn workflowActionBtn--primary"
                                whileHover={{ y: -1.5 }}
                                whileTap={{ scale: 0.98 }}
                                transition={PROFILE_SPRING}
                                onClick={() => handleAccept(proposal.id)}
                                disabled={Boolean(actionState.pendingId)}
                              >
                                {actionState.pendingId === proposal.id ? (
                                  <LoaderCircle className="customerSettingsAction__spinner" />
                                ) : null}
                                <span>Accept proposal</span>
                              </motion.button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>

            <aside className="workflowSide">
              <article className="workflowSummaryCard">
                <h2 className="workflowCard__title">Request summary</h2>
                <div className="workflowSummaryCard__facts">
                  <div className="workflowSummaryCard__row">
                    <span>Location</span>
                    <strong className="workflowSummaryCard__value">
                      {request.location || "Not set"}
                    </strong>
                  </div>
                  <div className="workflowSummaryCard__row">
                    <span>Budget</span>
                    <strong className="workflowSummaryCard__value">{request.budgetLabel}</strong>
                  </div>
                  <div className="workflowSummaryCard__row">
                    <span>Deadline</span>
                    <strong className="workflowSummaryCard__value">{request.deadlineLabel}</strong>
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </CustomerDashboardFrame>
  );
}
