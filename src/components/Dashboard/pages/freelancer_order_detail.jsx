import React, { useEffect, useRef, useState } from "react";
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
  ORDER_DELIVERY_ACCEPTED_DOCUMENT_TYPES,
  ORDER_DELIVERY_ACCEPTED_IMAGE_TYPES,
  ORDER_DELIVERY_ACCEPTED_VIDEO_TYPES,
  ORDER_DELIVERY_MAX_ASSET_ITEMS,
  submitFreelancerOrderDelivery,
} from "../hooks/useMarketplaceWorkflow";
import SearchableCombobox from "../../Shared/searchable_combobox";

const ORDER_UPDATE_TYPE_OPTIONS = [
  "progress",
  "revision",
  "status",
];

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

function buildAcceptedDeliveryAssetTypes() {
  return [
    ...ORDER_DELIVERY_ACCEPTED_IMAGE_TYPES,
    ...ORDER_DELIVERY_ACCEPTED_VIDEO_TYPES,
    ...ORDER_DELIVERY_ACCEPTED_DOCUMENT_TYPES,
  ].join(",");
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

function DeliveryHistory({ order }) {
  if (!order?.deliveries?.length) {
    return (
      <EmptySurface
        hideIcon
        title="No delivery submitted yet"
        description="Once you submit a digital handoff or shipment details, it will appear here."
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

export default function FreelancerOrderDetail() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const deliveryAssetsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [updateValues, setUpdateValues] = useState({
    updateKind: "progress",
    title: "",
    body: "",
  });
  const [deliveryValues, setDeliveryValues] = useState({
    deliveryNote: "",
    deliverableLabel: "",
    deliverableUrl: "",
    accessCode: "",
    courierName: "",
    trackingReference: "",
    shipmentNote: "",
    proofUrl: "",
  });
  const [deliveryAssets, setDeliveryAssets] = useState([]);
  const [updateState, setUpdateState] = useState({ pending: false, error: "", success: "" });
  const [deliveryState, setDeliveryState] = useState({
    pending: false,
    error: "",
    success: "",
  });

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

  useEffect(() => {
    deliveryAssetsRef.current = deliveryAssets;
  }, [deliveryAssets]);

  useEffect(() => {
    return () => {
      deliveryAssetsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const removeDeliveryAsset = (assetId) => {
    setDeliveryAssets((prev) => {
      const target = prev.find((item) => item.id === assetId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== assetId);
    });
  };

  const handleDeliveryAssetPicked = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots = ORDER_DELIVERY_MAX_ASSET_ITEMS - deliveryAssets.length;
    const nextAssets = files.slice(0, Math.max(remainingSlots, 0)).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      originalName: file.name,
      previewUrl: String(file.type || "").startsWith("image/") ||
        String(file.type || "").startsWith("video/")
        ? URL.createObjectURL(file)
        : "",
      assetKind: String(file.type || "").startsWith("video/")
        ? "video"
        : String(file.type || "") === "application/pdf"
          ? "document"
          : "image",
    }));

    setDeliveryAssets((prev) => [...prev, ...nextAssets].slice(0, ORDER_DELIVERY_MAX_ASSET_ITEMS));
    setDeliveryState((prev) => ({ ...prev, error: "" }));
    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUpdateState({ pending: true, error: "", success: "" });
    try {
      await createFreelancerOrderUpdate({
        orderId,
        ...updateValues,
      });
      setUpdateValues({ updateKind: "progress", title: "", body: "" });
      await load();
      setUpdateState({
        pending: false,
        error: "",
        success: "Customer update sent successfully.",
      });
    } catch (nextError) {
      setUpdateState({
        pending: false,
        error: nextError.message || "We couldn't send that update.",
        success: "",
      });
    }
  };

  const handleDeliverySubmit = async (event) => {
    event.preventDefault();
    setDeliveryState({ pending: true, error: "", success: "" });

    try {
      await submitFreelancerOrderDelivery({
        orderId,
        ...deliveryValues,
        deliveryAssets: deliveryAssets.map((item) => item.file),
      });
      setDeliveryValues({
        deliveryNote: "",
        deliverableLabel: "",
        deliverableUrl: "",
        accessCode: "",
        courierName: "",
        trackingReference: "",
        shipmentNote: "",
        proofUrl: "",
      });
      setDeliveryAssets((prev) => {
        prev.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        return [];
      });
      await load();
      setDeliveryState({
        pending: false,
        error: "",
        success:
          order?.fulfillment_type === "physical"
            ? "Shipment details shared with the customer."
            : "Digital delivery shared with the customer.",
      });
    } catch (nextError) {
      setDeliveryState({
        pending: false,
        error: nextError.message || "We couldn't submit that delivery.",
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
                Keep the customer updated with progress and structured delivery details while the payout stays traceable.
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
                    <h2 className="profileSection__title">Submit delivery</h2>
                    <p className="profileSection__sub">
                      This structured delivery record becomes the source of truth for what you handed off.
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {deliveryState.error ? (
                    <InlineStatus tone="danger" message={deliveryState.error} />
                  ) : deliveryState.success ? (
                    <InlineStatus tone="success" message={deliveryState.success} />
                  ) : null}
                </AnimatePresence>

                <form className="workflowForm" onSubmit={handleDeliverySubmit}>
                  <label className="workflowField workflowField--wide">
                    <span className="workflowField__label">Delivery note</span>
                    <textarea
                      className="workflowField__textarea"
                      value={deliveryValues.deliveryNote}
                      onChange={(event) =>
                        setDeliveryValues((prev) => ({
                          ...prev,
                          deliveryNote: event.target.value,
                        }))
                      }
                      placeholder={
                        order.fulfillment_type === "physical"
                          ? "Example: Your package was shipped today and is now in transit."
                          : "Example: Your final files are ready in the shared folder below."
                      }
                    />
                  </label>

                  <label className="workflowField workflowField--wide">
                    <span className="workflowField__label">
                      Upload final files or proof
                    </span>
                    <input
                      className="workflowField__control workflowField__control--file"
                      type="file"
                      accept={buildAcceptedDeliveryAssetTypes()}
                      multiple
                      onChange={handleDeliveryAssetPicked}
                    />
                    <p className="workflowForm__note">
                      Upload up to {ORDER_DELIVERY_MAX_ASSET_ITEMS} files. PDFs work well for digital handoff, while images or videos work well for physical proof.
                    </p>
                  </label>

                  {deliveryAssets.length ? (
                    <div className="workflowUploadList">
                      {deliveryAssets.map((asset) => (
                        <article key={asset.id} className="workflowUploadChip">
                          <div className="workflowUploadChip__copy">
                            <strong className="workflowUploadChip__title">
                              {asset.originalName}
                            </strong>
                            <span className="workflowUploadChip__meta">
                              {asset.assetKind}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="workflowUploadChip__remove"
                            onClick={() => removeDeliveryAsset(asset.id)}
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {order.fulfillment_type === "physical" ? (
                    <>
                      <div className="workflowForm__grid">
                        <label className="workflowField">
                          <span className="workflowField__label">Courier</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.courierName}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                courierName: event.target.value,
                              }))
                            }
                            placeholder="LBC, J&T, Ninja Van, etc."
                          />
                        </label>

                        <label className="workflowField">
                          <span className="workflowField__label">Tracking/reference</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.trackingReference}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                trackingReference: event.target.value,
                              }))
                            }
                            placeholder="Shipment or receipt reference"
                          />
                        </label>
                      </div>

                      <div className="workflowForm__grid">
                        <label className="workflowField">
                          <span className="workflowField__label">Shipment note</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.shipmentNote}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                shipmentNote: event.target.value,
                              }))
                            }
                            placeholder="Packaging notes or drop-off details"
                          />
                        </label>

                        <label className="workflowField">
                          <span className="workflowField__label">Proof image URL</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.proofUrl}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                proofUrl: event.target.value,
                              }))
                            }
                            placeholder="Optional public proof image link"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="workflowForm__grid">
                        <label className="workflowField">
                          <span className="workflowField__label">Deliverable label</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.deliverableLabel}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                deliverableLabel: event.target.value,
                              }))
                            }
                            placeholder="Final drive folder, Notion page, ZIP file"
                          />
                        </label>

                        <label className="workflowField">
                          <span className="workflowField__label">Deliverable URL</span>
                          <input
                            className="workflowField__control"
                            value={deliveryValues.deliverableUrl}
                            onChange={(event) =>
                              setDeliveryValues((prev) => ({
                                ...prev,
                                deliverableUrl: event.target.value,
                              }))
                            }
                            placeholder="Public or shared access link"
                          />
                        </label>
                      </div>

                      <label className="workflowField">
                        <span className="workflowField__label">Access code</span>
                        <input
                          className="workflowField__control"
                          value={deliveryValues.accessCode}
                          onChange={(event) =>
                            setDeliveryValues((prev) => ({
                              ...prev,
                              accessCode: event.target.value,
                            }))
                          }
                          placeholder="Optional password or PIN"
                        />
                      </label>
                    </>
                  )}

                  <div className="workflowActions">
                    <motion.button
                      type="submit"
                      className="workflowActionBtn workflowActionBtn--primary"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={PROFILE_SPRING}
                      disabled={deliveryState.pending}
                    >
                      {deliveryState.pending ? (
                        <LoaderCircle className="customerSettingsAction__spinner" />
                      ) : null}
                      <span>
                        {order.fulfillment_type === "physical"
                          ? "Share shipment details"
                          : "Share delivery"}
                      </span>
                    </motion.button>
                  </div>
                </form>
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
                  {updateState.error ? (
                    <InlineStatus tone="danger" message={updateState.error} />
                  ) : updateState.success ? (
                    <InlineStatus tone="success" message={updateState.success} />
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
                      disabled={updateState.pending}
                    >
                      {updateState.pending ? (
                        <LoaderCircle className="customerSettingsAction__spinner" />
                      ) : null}
                      <span>Send update</span>
                    </motion.button>
                  </div>
                </form>
              </article>

              <article className="workflowCard">
                <div className="profileSection__head">
                  <div>
                    <h2 className="profileSection__title">Delivery history</h2>
                    <p className="profileSection__sub">
                      Review the structured handoff records already shared with the customer.
                    </p>
                  </div>
                </div>

                <DeliveryHistory order={order} />
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
                  Customer completion only queues payout for ops release. Funds are marked released only after the payout request is processed successfully.
                </p>
                {order.payoutRelease?.freelancerReceiptUrl ? (
                  <a
                    className="workflowActionBtn workflowActionBtn--ghost"
                    href={order.payoutRelease.freelancerReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open payout receipt
                  </a>
                ) : null}
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
