import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
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

function formatFulfillmentLabel(value) {
  return String(value || "").trim().toLowerCase() === "physical"
    ? "Physical shipment"
    : "Digital delivery";
}

function formatPayoutState(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "pending_release") return "Pending ops";
  if (normalized === "released") return "Released";
  if (normalized === "blocked") return "Blocked";
  if (normalized === "failed") return "Failed";
  if (normalized === "refunded") return "Refunded";
  return "Held";
}

function DeliveryAssetList({ assets = [] }) {
  if (!assets.length) return null;

  return (
    <div className="workflowAssetList">
      {assets.map((asset) => (
        <article key={asset.id} className="workflowAssetCard">
          <div className="workflowAssetCard__preview">
            {asset.assetKind === "image" ? (
              <img src={asset.publicUrl} alt={asset.originalName} />
            ) : asset.assetKind === "video" ? (
              <video src={asset.publicUrl} controls preload="metadata" />
            ) : (
              <div className="workflowAssetCard__document">PDF</div>
            )}
          </div>

          <div className="workflowAssetCard__body">
            <strong className="workflowAssetCard__title">{asset.originalName}</strong>
            <span className="workflowAssetCard__meta">
              {asset.assetKind === "document" ? "Document" : asset.assetKind}
            </span>
            <a
              className="workflowLink"
              href={asset.publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open file
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function DeliverySummary({ order }) {
  if (!order?.deliveries?.length) {
    return (
      <EmptySurface
        hideIcon
        title="No delivery submitted yet"
        description="The freelancer has not submitted the structured delivery details for this order yet."
        className="messagesEmpty messagesEmpty--conversation"
      />
    );
  }

  return (
    <div className="workflowDeliveryList">
      {order.deliveries.map((delivery) => (
        <article key={delivery.id} className="workflowDeliveryCard">
          <div className="workflowDeliveryCard__top">
            <div>
              <div className="workflowTimeline__title">
                {delivery.fulfillmentType === "physical"
                  ? "Shipment details"
                  : "Digital delivery"}
              </div>
              <div className="workflowTimeline__kind">
                {formatFulfillmentLabel(delivery.fulfillmentType)}
              </div>
            </div>
            <span className="workflowChip">{delivery.createdAtLabel || "Just now"}</span>
          </div>

          <p className="workflowTimeline__body">{delivery.deliveryNote}</p>

          <div className="workflowDeliveryCard__grid">
            {delivery.fulfillmentType === "digital" ? (
              <>
                <div className="workflowDeliveryCard__fact">
                  <span className="workflowDeliveryCard__label">Deliverable</span>
                  <strong className="workflowDeliveryCard__value">
                    {delivery.deliverableLabel || "Shared link"}
                  </strong>
                </div>
                <div className="workflowDeliveryCard__fact">
                  <span className="workflowDeliveryCard__label">Access link</span>
                  <strong className="workflowDeliveryCard__value">
                    {delivery.deliverableUrl ? (
                      <a
                        className="workflowLink"
                        href={delivery.deliverableUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open deliverable
                      </a>
                    ) : (
                      "Not added"
                    )}
                  </strong>
                </div>
                {delivery.accessCode ? (
                  <div className="workflowDeliveryCard__fact">
                    <span className="workflowDeliveryCard__label">Access code</span>
                    <strong className="workflowDeliveryCard__value">{delivery.accessCode}</strong>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="workflowDeliveryCard__fact">
                  <span className="workflowDeliveryCard__label">Courier</span>
                  <strong className="workflowDeliveryCard__value">
                    {delivery.courierName || "Not added"}
                  </strong>
                </div>
                <div className="workflowDeliveryCard__fact">
                  <span className="workflowDeliveryCard__label">Tracking/reference</span>
                  <strong className="workflowDeliveryCard__value">
                    {delivery.trackingReference || "Not added"}
                  </strong>
                </div>
                {delivery.shipmentNote ? (
                  <div className="workflowDeliveryCard__fact">
                    <span className="workflowDeliveryCard__label">Shipment note</span>
                    <strong className="workflowDeliveryCard__value">{delivery.shipmentNote}</strong>
                  </div>
                ) : null}
                {delivery.proofUrl ? (
                  <div className="workflowDeliveryCard__fact">
                    <span className="workflowDeliveryCard__label">Proof</span>
                    <strong className="workflowDeliveryCard__value">
                      <a
                        className="workflowLink"
                        href={delivery.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open proof
                      </a>
                    </strong>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <DeliveryAssetList assets={delivery.assets} />
        </article>
      ))}
    </div>
  );
}

export default function CustomerOrderDetail() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [state, setState] = useState({ pending: false, error: "", success: "" });

  const load = useCallback(async () => {
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
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    setState({ pending: true, error: "", success: "" });
    try {
      const result = await confirmOrderCompletion(orderId);
      await load();
      setState({
        pending: false,
        error: "",
        success: result?.message || "Order completed successfully.",
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
                <Motion.svg className="workflowHero__line" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
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
                Review the package snapshot, delivery details, and payout state before you confirm receipt.
              </p>
            </div>

            <div className="workflowHero__actions">
              <Motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/customer/messages")}
              >
                Open messages
              </Motion.button>
            </div>
          </div>

          {order ? (
            <div className="workflowMeta">
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Status</span>
                <strong className="workflowMeta__value">{order.status}</strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Payout state</span>
                <strong className="workflowMeta__value">
                  {formatPayoutState(order.escrow_status)}
                </strong>
              </div>
              <div className="workflowMeta__item">
                <span className="workflowMeta__label">Fulfillment</span>
                <strong className="workflowMeta__value">
                  {formatFulfillmentLabel(order.fulfillment_type)}
                </strong>
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

              <article className="workflowCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Delivery details</h2>
                    <p className="profileSection__sub">
                      Structured delivery details are the source of truth for what the freelancer submitted.
                    </p>
                  </div>
                </div>

                <DeliverySummary order={order} />
              </article>

              <article className="workflowTimelineCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Order updates</h2>
                    <p className="profileSection__sub">
                      Follow progress and system delivery updates from the freelancer here.
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
                  <div className="workflowSummaryCard__row">
                    <span>Payout state</span>
                    <strong className="workflowSummaryCard__value">
                      {formatPayoutState(order.escrow_status)}
                    </strong>
                  </div>
                  {order.payoutRelease?.requestedAtLabel ? (
                    <div className="workflowSummaryCard__row">
                      <span>Payout queued</span>
                      <strong className="workflowSummaryCard__value">
                        {order.payoutRelease.requestedAtLabel}
                      </strong>
                    </div>
                  ) : null}
                </div>
                <p className="workflowSummaryNote">
                  Confirming receipt marks the work complete and queues the freelancer payout for ops release. It does not mean the payout was already sent.
                </p>
                {order.payoutRelease?.customerReceiptUrl ? (
                  <a
                    className="workflowActionBtn workflowActionBtn--ghost"
                    href={order.payoutRelease.customerReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open receipt
                  </a>
                ) : null}
                {["pending", "active"].includes(order.status) ? (
                  <Motion.button
                    type="button"
                    className="workflowActionBtn workflowActionBtn--primary"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleConfirm}
                    disabled={state.pending}
                  >
                    {state.pending ? <LoaderCircle className="customerSettingsAction__spinner" /> : null}
                    <span>Confirm receipt</span>
                  </Motion.button>
                ) : null}
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </CustomerDashboardFrame>
  );
}
