import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import "./profile.css";
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
import { useFreelancerRequestDetail } from "../hooks/useFreelancerRequestMarketplace";

export default function FreelancerRequestDetail() {
  const navigate = useNavigate();
  const { requestId = "" } = useParams();
  const { loading, request, error, reload } = useFreelancerRequestDetail(requestId);

  const openConversation = () => {
    if (!request?.customer?.id) return;

    const params = new URLSearchParams();
    params.set("customer", request.customer.id);
    params.set("requestTitle", request.title);
    navigate(`/dashboard/freelancer/messages?${params.toString()}`);
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
                <motion.svg
                  className="freelancerMarketplaceHero__line"
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

              <p className="freelancerMarketplaceHero__sub">
                Review the brief, check the references, and open a direct conversation when you are ready to respond.
              </p>
            </div>

            <div className="freelancerMarketplaceHero__actions">
              <motion.button
                type="button"
                className="freelancerMarketplaceHero__action"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={openConversation}
                disabled={!request?.customer?.id}
              >
                Message customer
              </motion.button>

              <motion.button
                type="button"
                className="freelancerMarketplaceHero__ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/browse-requests")}
              >
                Back to requests
              </motion.button>
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
                <span className="freelancerRequestDetail__label">Description</span>
                <p className="freelancerRequestDetail__desc">{request.description}</p>
              </article>

              {request.media.length > 0 ? (
                <article className="freelancerRequestDetailCard">
                  <span className="freelancerRequestDetail__label">Attached references</span>
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
                <span className="freelancerRequestDetail__label">Customer</span>
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

                <motion.button
                  type="button"
                  className="freelancerRequestDetail__action"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={openConversation}
                >
                  Start conversation
                </motion.button>
              </article>

              <article className="freelancerRequestDetailCard">
                <span className="freelancerRequestDetail__label">Request summary</span>
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
