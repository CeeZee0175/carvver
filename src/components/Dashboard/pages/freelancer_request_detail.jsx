import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { motion as Motion} from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import "./profile.css";
import "./workflow_pages.css";
import "./freelancer_pages.css";
import "./freelancer_marketplace.css";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { createRequestProposal } from "../hooks/useMarketplaceWorkflow";
import { useFreelancerRequestDetail } from "../hooks/useFreelancerRequestMarketplace";

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;
  return <div className={`workflowStatus workflowStatus--${tone}`}>{message}</div>;
}

export default function FreelancerRequestDetail() {
  const navigate = useNavigate();
  const { requestId = "" } = useParams();
  const { loading, request, error, reload } = useFreelancerRequestDetail(requestId);
  const [proposalValues, setProposalValues] = useState({
    pitch: "",
    offeredPrice: "",
    deliveryDays: "",
  });
  const [proposalState, setProposalState] = useState({
    pending: false,
    error: "",
    success: "",
  });

  const openConversation = () => {
    if (!request?.customer?.id) return;

    const params = new URLSearchParams();
    params.set("customer", request.customer.id);
    params.set("requestTitle", request.title);
    navigate(`/dashboard/freelancer/messages?${params.toString()}`);
  };

  const handleProposalSubmit = async (event) => {
    event.preventDefault();
    setProposalState({ pending: true, error: "", success: "" });

    try {
      await createRequestProposal({
        requestId,
        ...proposalValues,
      });
      setProposalValues({
        pitch: "",
        offeredPrice: "",
        deliveryDays: "",
      });
      setProposalState({
        pending: false,
        error: "",
        success: "Proposal sent. The customer can now review it and reply in chat.",
      });
    } catch (nextError) {
      setProposalState({
        pending: false,
        error: nextError.message || "We couldn't send that proposal.",
        success: "",
      });
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerMarketplacePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Browse request listings", to: "/dashboard/freelancer/browse-requests" },
            { label: request?.title || "Request details" },
          ]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="freelancerMarketplaceHero">
          <div className="freelancerMarketplaceHero__top">
            <div className="freelancerMarketplaceHero__copy">
              <div className="freelancerMarketplaceHero__titleWrap">
                <h1 className="freelancerMarketplaceHero__title">
                  <TypewriterHeading text={request?.title || "Request details"} />
                </h1>
                <Motion.svg
                  className="freelancerMarketplaceHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <Motion.path
                    d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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

              <p className="freelancerMarketplaceHero__sub">
                Review the brief, check the references, and open a direct conversation when you are ready to respond.
              </p>
            </div>

            <div className="freelancerMarketplaceHero__actions">
              <Motion.button
                type="button"
                className="freelancerMarketplaceHero__action"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={openConversation}
                disabled={!request?.customer?.id}
              >
                Message customer
              </Motion.button>

              <Motion.button
                type="button"
                className="freelancerMarketplaceHero__ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/browse-requests")}
              >
                Back to requests
              </Motion.button>
            </div>
          </div>

          {request ? (
            <div className="freelancerMarketplaceHero__meta">
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Budget</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {request.budgetLabel}
                </strong>
              </div>
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Deadline</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {request.deadlineLabel}
                </strong>
              </div>
              <div className="freelancerMarketplaceHero__metaItem">
                <span className="freelancerMarketplaceHero__metaLabel">Location</span>
                <strong className="freelancerMarketplaceHero__metaValue">
                  {request.locationLabel}
                </strong>
              </div>
            </div>
          ) : null}
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="freelancerRequestDetailCard" style={{ minHeight: 420 }} />
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
              className="freelancerRequestEmpty"
            />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <section className="profileSection freelancerRequestDetailLayout">
            <div className="freelancerRequestDetailMain">
              <article className="freelancerRequestDetailCard">
                <div className="freelancerRequestDetail__facts">
                  <span className="freelancerRequestDetail__chip">{request.category}</span>
                  <span className="freelancerRequestDetail__chip">{request.budgetLabel}</span>
                  <span className="freelancerRequestDetail__chip">{request.deadlineLabel}</span>
                </div>
                <h2 className="freelancerRequestDetail__title">Description</h2>
                <p className="profileSection__sub">
                  Review the full customer brief before you decide how to respond.
                </p>
                <p className="freelancerRequestDetail__desc">{request.description}</p>
              </article>

              {request.media.length > 0 ? (
                <article className="freelancerRequestDetailCard">
                  <h2 className="freelancerRequestDetail__title">Attached references</h2>
                  <p className="profileSection__sub">
                    Browse any photos or video the customer included with the request.
                  </p>
                  <div className="freelancerRequestGrid">
                    {request.media.map((item) => (
                      <div key={item.id} className="freelancerRequestDetail__media">
                        {item.media_kind === "video" ? (
                          <video src={item.publicUrl} controls playsInline />
                        ) : (
                          <img src={item.publicUrl} alt={item.original_name || request.title} />
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            <aside className="freelancerRequestDetailSide">
              <article className="freelancerRequestDetailCard freelancerRequestDetail__customer">
                <h2 className="freelancerRequestDetail__title">Customer</h2>
                <p className="profileSection__sub">
                  Check who posted the request and start the conversation from here.
                </p>
                <div className="freelancerRequestDetail__customerTop">
                  <div className="freelancerRequestDetail__avatar" aria-hidden="true">
                    {request.customer.avatarUrl ? (
                      <img src={request.customer.avatarUrl} alt={request.customer.displayName} />
                    ) : (
                      request.customer.initials
                    )}
                  </div>
                  <div>
                    <div className="freelancerRequestDetail__customerName">
                      {request.customer.displayName}
                    </div>
                    <div className="freelancerRequestDetail__customerLocation">
                      {request.customer.location}
                    </div>
                  </div>
                </div>

                {request.customer.bio ? (
                  <p className="freelancerRequestDetail__customerDesc">
                    {request.customer.bio}
                  </p>
                ) : null}

                <Motion.button
                  type="button"
                  className="freelancerRequestDetail__action"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={openConversation}
                >
                  Start conversation
                </Motion.button>
              </article>

              <article className="freelancerRequestDetailCard">
                <h2 className="freelancerRequestDetail__title">Send proposal</h2>
                <p className="profileSection__sub">
                  Share your approach, your price, and how quickly you can deliver.
                </p>

                <AnimatePresence mode="wait">
                  {proposalState.error ? (
                    <InlineStatus tone="danger" message={proposalState.error} />
                  ) : proposalState.success ? (
                    <InlineStatus tone="success" message={proposalState.success} />
                  ) : null}
                </AnimatePresence>

                <form className="workflowForm" onSubmit={handleProposalSubmit}>
                  <div className="workflowForm__grid">
                    <label className="workflowField">
                      <span className="workflowField__label">Offered price</span>
                      <input
                        className="workflowField__control"
                        type="number"
                        min="1"
                        step="1"
                        value={proposalValues.offeredPrice}
                        onChange={(event) =>
                          setProposalValues((prev) => ({
                            ...prev,
                            offeredPrice: event.target.value,
                          }))
                        }
                        placeholder="2500"
                      />
                    </label>

                    <label className="workflowField">
                      <span className="workflowField__label">Delivery in days</span>
                      <input
                        className="workflowField__control"
                        type="number"
                        min="1"
                        step="1"
                        value={proposalValues.deliveryDays}
                        onChange={(event) =>
                          setProposalValues((prev) => ({
                            ...prev,
                            deliveryDays: event.target.value,
                          }))
                        }
                        placeholder="7"
                      />
                    </label>
                  </div>

                  <label className="workflowField workflowField--wide">
                    <span className="workflowField__label">Proposal</span>
                    <textarea
                      className="workflowField__textarea"
                      value={proposalValues.pitch}
                      onChange={(event) =>
                        setProposalValues((prev) => ({
                          ...prev,
                          pitch: event.target.value,
                        }))
                      }
                      placeholder="Explain how you would take this on, what the customer can expect, and any important delivery notes."
                    />
                  </label>

                  <div className="workflowActions">
                    <Motion.button
                      type="submit"
                      className="workflowActionBtn workflowActionBtn--primary"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={proposalState.pending}
                    >
                      {proposalState.pending ? (
                        <LoaderCircle className="customerSettingsAction__spinner" />
                      ) : null}
                      <span>Send proposal</span>
                    </Motion.button>
                  </div>
                </form>
              </article>

              <article className="freelancerRequestDetailCard">
                <h2 className="freelancerRequestDetail__title">Request summary</h2>
                <p className="profileSection__sub">
                  Keep the main facts visible while you review the rest of the brief.
                </p>
                <div className="freelancerRequestDetail__facts">
                  <span className="freelancerRequestDetail__customerMeta">{request.locationLabel}</span>
                  <span className="freelancerRequestDetail__customerMeta">{request.deadlineLabel}</span>
                  <span className="freelancerRequestDetail__customerMeta">{request.budgetLabel}</span>
                </div>
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
