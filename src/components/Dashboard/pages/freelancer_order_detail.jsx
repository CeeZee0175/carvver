import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  createFreelancerOrderUpdate,
  fetchFreelancerOrderDetail,
} from "../hooks/useMarketplaceWorkflow";
import SearchableCombobox from "../../Shared/searchable_combobox";

const ORDER_UPDATE_TYPE_OPTIONS = [
  "progress",
  "delivery",
  "revision",
  "status",
];

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;
  return <div className={`workflowStatus workflowStatus--${tone}`}>{message}</div>;
}

export default function FreelancerOrderDetail() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [updateValues, setUpdateValues] = useState({
    updateKind: "progress",
    title: "",
    body: "",
  });
  const [state, setState] = useState({ pending: false, error: "", success: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const nextOrder = await fetchFreelancerOrderDetail(orderId);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ pending: true, error: "", success: "" });
    try {
      await createFreelancerOrderUpdate({
        orderId,
        ...updateValues,
      });
      setUpdateValues({ updateKind: "progress", title: "", body: "" });
      await load();
      setState({
        pending: false,
        error: "",
        success: "Customer update sent successfully.",
      });
    } catch (nextError) {
      setState({
        pending: false,
        error: nextError.message || "We couldn't send that update.",
        success: "",
      });
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details workflowPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Orders", to: "/dashboard/freelancer/orders" },
            { label: order?.services?.title || "Order detail" },
          ]}
          homePath="/dashboard/freelancer"
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
                Keep the customer updated with progress, delivery notes, and clear status changes while the payment stays traceable.
              </p>
            </div>

            <div className="workflowHero__actions">
              <motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() =>
                  navigate(`/dashboard/freelancer/messages?customer=${order?.customer_id || ""}`)
                }
              >
                Open chat
              </motion.button>
            </div>
          </div>

          {order ? (
            <div className="workflowMeta">
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Customer</span>
                <strong className="workflowMeta__value">{order.customerName}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Escrow</span>
                <strong className="workflowMeta__value">{order.escrow_status || "held"}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Your net</span>
                <strong className="workflowMeta__value">{order.freelancerNetLabel}</strong>
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
            <EmptySurface hideIcon title="We couldn't open this order" description={error} actionLabel="Back to orders" onAction={() => navigate("/dashboard/freelancer/orders")} />
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
                  <span className="workflowChip">{order.status}</span>
                </div>
                {order.selected_package_summary ? (
                  <p className="workflowCard__copy">{order.selected_package_summary}</p>
                ) : null}
              </article>

              <article className="workflowCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Send customer update</h2>
                    <p className="profileSection__sub">
                      These updates appear both on the order timeline and inside the shared chat.
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

                <form className="workflowForm" onSubmit={handleSubmit}>
                  <div className="workflowForm__grid">
                    <label className="workflowField">
                      <span className="workflowField__label">Update type</span>
                      <SearchableCombobox
                        value={updateValues.updateKind}
                        onSelect={(nextValue) =>
                          setUpdateValues((prev) => ({ ...prev, updateKind: nextValue }))
                        }
                        options={ORDER_UPDATE_TYPE_OPTIONS}
                        placeholder="progress"
                        searchHint="Choose update type"
                        noResultsText="No update types"
                        ariaLabel="Choose update type"
                      />
                    </label>

                    <label className="workflowField">
                      <span className="workflowField__label">Title</span>
                      <input
                        className="workflowField__control"
                        value={updateValues.title}
                        onChange={(event) =>
                          setUpdateValues((prev) => ({ ...prev, title: event.target.value }))
                        }
                        placeholder="Example: First draft delivered"
                      />
                    </label>
                  </div>

                  <label className="workflowField workflowField--wide">
                    <span className="workflowField__label">Details</span>
                    <textarea
                      className="workflowField__textarea"
                      value={updateValues.body}
                      onChange={(event) =>
                        setUpdateValues((prev) => ({ ...prev, body: event.target.value }))
                      }
                      placeholder="Share the progress clearly so the customer knows what changed."
                    />
                  </label>

                  <div className="workflowActions">
                    <motion.button
                      type="submit"
                      className="workflowActionBtn workflowActionBtn--primary"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={state.pending}
                    >
                      {state.pending ? <LoaderCircle className="customerSettingsAction__spinner" /> : null}
                      <span>Send update</span>
                    </motion.button>
                  </div>
                </form>
              </article>

              <article className="workflowTimelineCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Order timeline</h2>
                    <p className="profileSection__sub">
                      Keep the customer-facing history readable and up to date.
                    </p>
                  </div>
                </div>

                {order.updates.length === 0 ? (
                  <EmptySurface hideIcon title="No updates sent yet" className="messagesEmpty messagesEmpty--conversation" />
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
                    <span>Platform fee</span>
                    <strong className="workflowSummaryCard__value">{order.platformFeeLabel}</strong>
                  </div>
                  <div className="workflowSummaryCard__row">
                    <span>Your net</span>
                    <strong className="workflowSummaryCard__value">{order.freelancerNetLabel}</strong>
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
