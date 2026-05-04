import React from "react";
import { motion as Motion} from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import "./workflow_pages.css";
import {
  FreelancerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import DashboardPagination from "../shared/dashboard_pagination";
import { usePagedItems } from "../shared/dashboard_pagination_hooks";
import { useFreelancerOrders } from "../hooks/useMarketplaceWorkflow";

function formatPayoutState(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "pending_release") return "Pending ops";
  if (normalized === "released") return "Released";
  if (normalized === "blocked") return "Blocked";
  if (normalized === "failed") return "Failed";
  if (normalized === "refunded") return "Refunded";
  return "Held";
}

function formatFulfillmentLabel(value) {
  return String(value || "").trim().toLowerCase() === "physical"
    ? "Physical"
    : "Digital";
}

export default function FreelancerOrders() {
  const navigate = useNavigate();
  const { loading, orders, summary, payoutMethod, error, reload } = useFreelancerOrders();
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pagedItems: pagedOrders,
  } = usePagedItems(orders, 8, [orders.length]);

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details workflowPage">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Orders" }]} homePath="/dashboard/freelancer" />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="workflowHero">
          <div className="workflowHero__top">
            <div className="workflowHero__copy">
              <div className="workflowHero__titleWrap">
                <h1 className="workflowHero__title">
                  <TypewriterHeading text="Orders" />
                </h1>
                <Motion.svg
                  className="workflowHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <Motion.path
                    d="M 0,10 L 300,10"
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
              <p className="workflowHero__sub">
                Track held earnings, queued payouts, blocked cases, and the customer orders already moving through your workflow.
              </p>
            </div>
          </div>

          <div className="workflowMeta">
            <div className="workflowMeta__item">
              <span className="workflowMeta__label">Held</span>
              <strong className="workflowMeta__value">{summary.heldLabel}</strong>
            </div>
            <div className="workflowMeta__item">
              <span className="workflowMeta__label">Pending ops</span>
              <strong className="workflowMeta__value">{summary.pendingReleaseLabel}</strong>
            </div>
            <div className="workflowMeta__item">
              <span className="workflowMeta__label">Released</span>
              <strong className="workflowMeta__value">{summary.releasedLabel}</strong>
            </div>
            <div className="workflowMeta__item">
              <span className="workflowMeta__label">Blocked</span>
              <strong className="workflowMeta__value">{summary.blockedLabel}</strong>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="profileSection workflowLayout">
          <div className="workflowMain">
            <article className="workflowCard">
              <div className="profileSection__head">
                <div>
                  <h2 className="profileSection__title">Your orders</h2>
                  <p className="profileSection__sub">
                    Open any order to send an update, submit delivery, review payout state, or continue the conversation.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="workflowCard" style={{ minHeight: 220 }} />
              ) : error ? (
                <EmptySurface
                  hideIcon
                  title="We couldn't load your orders"
                  description={error}
                  actionLabel="Try again"
                  onAction={reload}
                />
              ) : orders.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No freelancer orders yet"
                  className="messagesEmpty messagesEmpty--conversation"
                />
              ) : (
                <div className="workflowProposalList">
                  {pagedOrders.map((order) => (
                    <article key={order.id} className="workflowProposalCard">
                      <div className="workflowProposalCard__top">
                        <div>
                          <div className="workflowProposalCard__name">
                            {order.services?.title || "Service order"}
                          </div>
                          <p className="workflowCard__copy">
                            {order.customerName} - {order.createdAtLabel}
                          </p>
                        </div>
                        <span className="workflowChip">
                          {formatPayoutState(order.escrow_status)}
                        </span>
                      </div>

                      <div className="workflowActions">
                        {order.selected_package_name ? (
                          <span className="workflowChip">{order.selected_package_name}</span>
                        ) : null}
                        <span className="workflowChip">
                          {formatFulfillmentLabel(order.fulfillment_type)}
                        </span>
                        <span className="workflowChip">{order.freelancerNetLabel}</span>
                        <span className="workflowChip">{order.status}</span>
                      </div>

                      <div className="workflowActions">
                        <Motion.button
                          type="button"
                          className="workflowActionBtn workflowActionBtn--primary"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() => navigate(`/dashboard/freelancer/orders/${order.id}`)}
                        >
                          Open order
                        </Motion.button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading && !error && orders.length > 0 ? (
                <DashboardPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  label="Freelancer orders pagination"
                />
              ) : null}
            </article>
          </div>

          <aside className="workflowSide">
            <article className="workflowSummaryCard workflowPayoutCard">
              <h2 className="workflowCard__title">Payout destination</h2>
              <div className="workflowPayoutCard__summary">
                <p className="workflowSummaryCard__copy">
                  After customer confirmation, payouts are queued for ops release using the destination saved in freelancer settings.
                </p>
                <div className="workflowSummaryCard__row">
                  <span>Method</span>
                  <strong className="workflowSummaryCard__value">
                    {payoutMethod.payoutMethod || "Not set"}
                  </strong>
                </div>
                <div className="workflowSummaryCard__row">
                  <span>Reference</span>
                  <strong className="workflowSummaryCard__value">
                    {payoutMethod.accountReference || "Not set"}
                  </strong>
                </div>
              </div>

              <Motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/settings")}
              >
                Update payout details
              </Motion.button>
            </article>
          </aside>
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
