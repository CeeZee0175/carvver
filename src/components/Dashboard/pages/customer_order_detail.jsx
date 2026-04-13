import React, { useEffect, useState } from "react";
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
  confirmOrderCompletion,
  fetchCustomerOrderDetail,
} from "../hooks/useMarketplaceWorkflow";

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;
  return <div className={`workflowStatus workflowStatus--${tone}`}>{message}</div>;
}

export default function CustomerOrderDetail() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [state, setState] = useState({ pending: false, error: "", success: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const nextOrder = await fetchCustomerOrderDetail(orderId);
      setOrder(nextOrder);
    } catch (nextError) {
      setOrder(null);
      setError(nextError.message || "We couldn't open this order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const handleConfirm = async () => {
    setState({ pending: true, error: "", success: "" });
    try {
      await confirmOrderCompletion(orderId);
      await load();
      setState({
        pending: false,
        error: "",
        success: "Order completed and released successfully.",
      });
    } catch (nextError) {
      setState({
        pending: false,
        error: nextError.message || "We couldn't complete this order.",
        success: "",
      });
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details workflowPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Orders", to: "/dashboard/customer/orders" },
            { label: order?.services?.title || "Order detail" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="workflowHero">
          <div className="workflowHero__top">
            <div className="workflowHero__copy">
              <div className="workflowHero__titleWrap">
                <h1 className="workflowHero__title">
                  <TypewriterHeading text={order?.services?.title || "Order detail"} />
                </h1>
                <motion.svg className="workflowHero__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
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
                Review the package snapshot, order timeline, and completion state before you release the held amount.
              </p>
            </div>

            <div className="workflowHero__actions">
              <motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/customer/messages")}
              >
                Open messages
              </motion.button>
            </div>
          </div>

          {order ? (
            <div className="workflowMeta">
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Status</span>
                <strong className="workflowMeta__value">{order.status}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Escrow</span>
                <strong className="workflowMeta__value">{order.escrow_status || "held"}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Customer total</span>
                <strong className="workflowMeta__value">{order.totalLabel}</strong>
              </div>
            </div>
          ) : null}
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="workflowCard" style={{ minHeight: 300 }} />
          </section>
        </Reveal>
      ) : error || !order ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface hideIcon title="We couldn't open this order" description={error} actionLabel="Back to orders" onAction={() => navigate("/dashboard/customer/orders")} />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <section className="profileSection workflowLayout">
            <div className="workflowMain">
              <article className="workflowCard">
                <h2 className="workflowCard__title">Package snapshot</h2>
                <div className="workflowActions">
                  {order.selected_package_name ? <span className="workflowChip">{order.selected_package_name}</span> : null}
                  {order.selected_package_delivery_time_days ? (
                    <span className="workflowChip">
                      {order.selected_package_delivery_time_days} day{order.selected_package_delivery_time_days === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                {order.selected_package_summary ? (
                  <p className="workflowCard__copy">{order.selected_package_summary}</p>
                ) : null}
                {Array.isArray(order.selected_package_included_items) &&
                order.selected_package_included_items.length > 0 ? (
                  <div className="workflowActions">
                    {order.selected_package_included_items.map((item) => (
                      <span key={item} className="workflowChip">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="workflowTimelineCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Order updates</h2>
                    <p className="profileSection__sub">
                      Follow progress and delivery notes from the freelancer here.
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {state.error ? (
                    <InlineStatus tone="danger" message={state.error} />
                  ) : state.success ? (
                    <InlineStatus tone="success" message={state.success} />
                  ) : null}
                </AnimatePresence>

                {order.updates.length === 0 ? (
                  <EmptySurface hideIcon title="No order updates yet" className="messagesEmpty messagesEmpty--conversation" />
                ) : (
                  <div className="workflowTimeline">
                    {order.updates.map((update) => (
                      <article key={update.id} className="workflowTimeline__item">
                        <div className="workflowTimeline__top">
                          <div>
                            <div className="workflowTimeline__title">{update.title}</div>
                            <div className="workflowTimeline__kind">{update.updateKind}</div>
                          </div>
                          <span className="workflowChip">{update.createdAtLabel}</span>
                        </div>
                        <p className="workflowTimeline__body">{update.body}</p>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <aside className="workflowSide">
              <article className="workflowSummaryCard">
                <h2 className="workflowCard__title">Payment summary</h2>
                <div className="workflowSummaryCard__facts">
                  <div className="workflowSummaryCard__row">
                    <span>Charged</span>
                    <strong className="workflowSummaryCard__value">{order.totalLabel}</strong>
                  </div>
                  <div className="workflowSummaryCard__row">
                    <span>Paid at</span>
                    <strong className="workflowSummaryCard__value">{order.paidAtLabel || "Pending"}</strong>
                  </div>
                  <div className="workflowSummaryCard__row">
                    <span>Freelancer</span>
                    <strong className="workflowSummaryCard__value">{order.freelancerName}</strong>
                  </div>
                </div>
                {["pending", "active"].includes(order.status) ? (
                  <motion.button
                    type="button"
                    className="workflowActionBtn workflowActionBtn--primary"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleConfirm}
                    disabled={state.pending}
                  >
                    {state.pending ? <LoaderCircle className="customerSettingsAction__spinner" /> : null}
                    <span>Confirm completion</span>
                  </motion.button>
                ) : null}
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </CustomerDashboardFrame>
  );
}
