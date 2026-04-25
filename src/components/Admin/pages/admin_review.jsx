import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminPayoutQueue,
  fetchAdminPayoutReviewDetail,
  fetchAdminVerificationDetail,
  fetchAdminVerificationQueue,
  processAdminPayoutAction,
  processAdminVerificationAction,
} from "../../Dashboard/hooks/useMarketplaceWorkflow";
import VerifiedBadge from "../../Dashboard/shared/VerifiedBadge";
import { signOut } from "../../../lib/supabase/auth";
import {
  EmptySurface,
  Reveal,
} from "../../Dashboard/shared/customerProfileShared";
import "../../Dashboard/pages/workflow_pages.css";
import "./admin_review.css";

const SPRING = { type: "spring", stiffness: 340, damping: 24 };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "blocked", label: "Blocked" },
  { value: "failed", label: "Failed" },
  { value: "released", label: "Released" },
];

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

function VerificationMediaList({ media = [] }) {
  if (!media.length) {
    return (
      <EmptySurface
        hideIcon
        title="No proof files attached"
        description="This request has no media available for review."
        className="adminEmptySurface"
      />
    );
  }

  return (
    <div className="adminVerificationMediaGrid">
      {media.map((item) => {
        const isVideo = item.mediaKind === "video";
        const Icon = isVideo ? FileVideo : ImageIcon;

        return (
          <article key={item.id} className="adminVerificationMediaCard">
            <div className="adminVerificationMediaCard__preview">
              {item.signedUrl ? (
                isVideo ? (
                  <video src={item.signedUrl} controls preload="metadata" />
                ) : (
                  <img src={item.signedUrl} alt={item.originalName} />
                )
              ) : (
                <Icon className="adminVerificationMediaCard__fallbackIcon" />
              )}
            </div>
            <strong className="adminVerificationMediaCard__title">
              {item.originalName}
            </strong>
            {item.signedUrl ? (
              <a
                className="workflowLink"
                href={item.signedUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open file
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function DeliveryReview({ order }) {
  if (!order?.deliveries?.length) {
    return (
      <EmptySurface
        hideIcon
        title="No delivery submitted yet"
        description="The freelancer has not submitted final work or shipment details for this order yet."
        className="adminEmptySurface"
      />
    );
  }

  return (
    <div className="adminDeliveryStack">
      {order.deliveries.map((delivery) => (
        <article key={delivery.id} className="adminDeliveryCard">
          <div className="adminDeliveryCard__top">
            <div>
              <h3 className="adminDeliveryCard__title">
                {delivery.fulfillmentType === "physical"
                  ? "Shipment details"
                  : "Digital delivery"}
              </h3>
              <span className="adminDeliveryCard__meta">
                {delivery.createdAtLabel || "Just now"}
              </span>
            </div>
            <span className="adminQueueCard__pill">
              {formatFulfillmentLabel(delivery.fulfillmentType)}
            </span>
          </div>

          <p className="adminDeliveryCard__note">{delivery.deliveryNote}</p>

          <div className="adminDetailGrid adminDetailGrid--compact">
            {delivery.fulfillmentType === "digital" ? (
              <>
                <div className="adminDetailFact">
                  <span className="adminDetailFact__label">Deliverable</span>
                  <strong className="adminDetailFact__value">
                    {delivery.deliverableLabel || "Shared link"}
                  </strong>
                </div>
                <div className="adminDetailFact">
                  <span className="adminDetailFact__label">Access link</span>
                  <strong className="adminDetailFact__value">
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
                  <div className="adminDetailFact">
                    <span className="adminDetailFact__label">Access code</span>
                    <strong className="adminDetailFact__value">
                      {delivery.accessCode}
                    </strong>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="adminDetailFact">
                  <span className="adminDetailFact__label">Courier</span>
                  <strong className="adminDetailFact__value">
                    {delivery.courierName || "Not added"}
                  </strong>
                </div>
                <div className="adminDetailFact">
                  <span className="adminDetailFact__label">Tracking/reference</span>
                  <strong className="adminDetailFact__value">
                    {delivery.trackingReference || "Not added"}
                  </strong>
                </div>
                {delivery.shipmentNote ? (
                  <div className="adminDetailFact">
                    <span className="adminDetailFact__label">Shipment note</span>
                    <strong className="adminDetailFact__value">
                      {delivery.shipmentNote}
                    </strong>
                  </div>
                ) : null}
                {delivery.proofUrl ? (
                  <div className="adminDetailFact">
                    <span className="adminDetailFact__label">External proof</span>
                    <strong className="adminDetailFact__value">
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

export default function AdminReview() {
  const navigate = useNavigate();
  const [activeQueue, setActiveQueue] = useState("payouts");
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState("pending");
  const [selectedVerificationId, setSelectedVerificationId] = useState("");
  const [verificationDetail, setVerificationDetail] = useState(null);
  const [verificationDetailLoading, setVerificationDetailLoading] = useState(false);
  const [verificationActionNote, setVerificationActionNote] = useState("");
  const [error, setError] = useState("");
  const [actionValues, setActionValues] = useState({
    providerReference: "",
    note: "",
  });
  const [actionState, setActionState] = useState({
    pending: false,
    error: "",
    success: "",
  });

  const loadQueue = async (preferredId = "") => {
    setLoadingQueue(true);
    setError("");

    try {
      const nextQueue = await fetchAdminPayoutQueue();
      setQueue(nextQueue);

      const nextSelectedId =
        preferredId && nextQueue.some((item) => item.id === preferredId)
          ? preferredId
          : nextQueue[0]?.id || "";

      setSelectedId(nextSelectedId);
    } catch (nextError) {
      setQueue([]);
      setSelectedId("");
      setError(nextError.message || "We couldn't load the admin queue.");
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadVerificationQueue = async (preferredId = "") => {
    setVerificationLoading(true);
    setError("");

    try {
      const nextQueue = await fetchAdminVerificationQueue();
      setVerificationQueue(nextQueue);

      const filteredPreferred = preferredId && nextQueue.some((item) => item.id === preferredId);
      const pendingFirst = nextQueue.find((item) => item.status === "pending")?.id;
      setSelectedVerificationId(
        filteredPreferred ? preferredId : pendingFirst || nextQueue[0]?.id || ""
      );
    } catch (nextError) {
      setVerificationQueue([]);
      setSelectedVerificationId("");
      setError(nextError.message || "We couldn't load the verification queue.");
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    loadVerificationQueue();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!selectedId) {
        setDetail(null);
        return;
      }

      setDetailLoading(true);

      try {
        const nextDetail = await fetchAdminPayoutReviewDetail(selectedId);
        if (!active) return;
        setDetail(nextDetail);
        setActionValues({
          providerReference: nextDetail.adminPayoutRequest?.providerReference || "",
          note: nextDetail.adminPayoutRequest?.opsNote || "",
        });
      } catch (nextError) {
        if (!active) return;
        setDetail(null);
        setActionState({
          pending: false,
          error: nextError.message || "We couldn't load this payout review.",
          success: "",
        });
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!selectedVerificationId) {
        setVerificationDetail(null);
        return;
      }

      setVerificationDetailLoading(true);

      try {
        const nextDetail = await fetchAdminVerificationDetail(selectedVerificationId);
        if (!active) return;
        setVerificationDetail(nextDetail);
        setVerificationActionNote(nextDetail.adminNote || "");
      } catch (nextError) {
        if (!active) return;
        setVerificationDetail(null);
        setActionState({
          pending: false,
          error: nextError.message || "We couldn't load this verification review.",
          success: "",
        });
      } finally {
        if (active) setVerificationDetailLoading(false);
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedVerificationId]);

  const filteredQueue = useMemo(() => {
    if (filter === "all") return queue;
    return queue.filter((item) => item.status === filter);
  }, [filter, queue]);

  const filteredVerificationQueue = useMemo(() => {
    if (verificationFilter === "all") return verificationQueue;
    return verificationQueue.filter((item) => item.status === verificationFilter);
  }, [verificationFilter, verificationQueue]);

  const releaseProviderReference = actionValues.providerReference.trim();

  const handleAction = async (action) => {
    if (!selectedId) return;

    const trimmedProviderReference = actionValues.providerReference.trim();

    if (action === "release" && !trimmedProviderReference) {
      setActionState({
        pending: false,
        error: "Add a provider reference before releasing this payout.",
        success: "",
      });
      return;
    }

    setActionState({ pending: true, error: "", success: "" });

    try {
      await processAdminPayoutAction({
        payoutRequestId: selectedId,
        action,
        providerReference: trimmedProviderReference,
        note: actionValues.note,
      });

      await loadQueue(selectedId);
      const refreshedDetail = await fetchAdminPayoutReviewDetail(selectedId);
      setDetail(refreshedDetail);
      setActionState({
        pending: false,
        error: "",
        success:
          action === "release"
            ? "Payout released successfully."
            : action === "block"
              ? "Payout marked blocked."
              : "Payout marked failed.",
      });
      toast.success(
        action === "release"
          ? "Funds released."
          : action === "block"
            ? "Payout blocked."
            : "Payout failed."
      );
    } catch (nextError) {
      setActionState({
        pending: false,
        error: nextError.message || "We couldn't process that payout action.",
        success: "",
      });
    }
  };

  const handleVerificationAction = async (action) => {
    if (!selectedVerificationId) return;

    if (action === "reject" && !verificationActionNote.trim()) {
      setActionState({
        pending: false,
        error: "Add a short note before rejecting this verification request.",
        success: "",
      });
      return;
    }

    setActionState({ pending: true, error: "", success: "" });

    try {
      await processAdminVerificationAction({
        requestId: selectedVerificationId,
        action,
        note: verificationActionNote,
      });

      await loadVerificationQueue(selectedVerificationId);
      const refreshedDetail = await fetchAdminVerificationDetail(selectedVerificationId);
      setVerificationDetail(refreshedDetail);
      setActionState({
        pending: false,
        error: "",
        success:
          action === "approve"
            ? "Freelancer verified successfully."
            : "Verification request rejected.",
      });
      toast.success(action === "approve" ? "Freelancer verified." : "Request rejected.");
    } catch (nextError) {
      setActionState({
        pending: false,
        error: nextError.message || "We couldn't process that verification action.",
        success: "",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="adminPage">
      <Toaster position="top-center" />
      <div className="adminPage__base" />
      <div className="adminPage__bg" aria-hidden="true" />

      <header className="adminBar">
        <div className="adminBar__inner">
          <div className="adminBar__brandWrap">
            <span className="adminBar__brand">Carvver</span>
          </div>

          <Motion.button
            type="button"
            className="adminBar__button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            onClick={handleSignOut}
          >
            <span>Sign Out</span>
          </Motion.button>
        </div>
      </header>

      <main className="adminPage__main">
        <Reveal>
          <section className="adminHero">
            <h1 className="adminHero__title">Admin Review</h1>
            <p className="adminHero__sub">
              Review payouts and verification requests with clear status, proof, and controls.
            </p>
          </section>
        </Reveal>

        {error ? (
          <Reveal delay={0.06}>
            <EmptySurface
              hideIcon
              title="We couldn't load the admin queue"
              description={error}
              actionLabel="Try again"
              onAction={() => loadQueue(selectedId)}
              className="adminEmptySurface"
            />
          </Reveal>
        ) : (
          <Reveal delay={0.08}>
            <>
            <div className="adminQueueTabs">
              <button
                type="button"
                className={`adminQueueTab ${activeQueue === "payouts" ? "adminQueueTab--active" : ""}`}
                onClick={() => setActiveQueue("payouts")}
              >
                Payouts
              </button>
              <button
                type="button"
                className={`adminQueueTab ${activeQueue === "verification" ? "adminQueueTab--active" : ""}`}
                onClick={() => setActiveQueue("verification")}
              >
                Verification
              </button>
            </div>

            <section className="adminLayout">
              {activeQueue === "payouts" ? (
                <>
              <aside className="adminQueue">
                <div className="adminPanel">
                  <div className="adminPanel__head">
                    <h2 className="adminPanel__title">Payout queue</h2>
                    <span className="adminPanel__count">
                      {filteredQueue.length} item{filteredQueue.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="adminFilters">
                    {FILTERS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`adminFilterChip ${
                          filter === item.value ? "adminFilterChip--active" : ""
                        }`}
                        onClick={() => setFilter(item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {loadingQueue ? (
                    <div className="adminQueue__loading">Loading queue...</div>
                  ) : filteredQueue.length ? (
                    <div className="adminQueue__list">
                      {filteredQueue.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`adminQueueCard ${
                            selectedId === item.id ? "adminQueueCard--active" : ""
                          }`}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <div className="adminQueueCard__top">
                            <div>
                              <strong className="adminQueueCard__title">
                                {item.serviceTitle}
                              </strong>
                              <span className="adminQueueCard__meta">
                                {item.freelancerName} to {item.customerName}
                              </span>
                            </div>
                            <span className="adminQueueCard__pill">{item.status}</span>
                          </div>

                          <div className="adminQueueCard__facts">
                            <span>{item.amountLabel}</span>
                            <span>{formatFulfillmentLabel(item.fulfillmentType)}</span>
                            <span>{item.requestedAtLabel}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptySurface
                      hideIcon
                      title="Nothing in this queue state"
                      description="Try another status filter to review a different set of payouts."
                      className="adminEmptySurface"
                    />
                  )}
                </div>
              </aside>

              <div className="adminDetail">
                {detailLoading ? (
                  <div className="adminPanel adminPanel--loading">Loading review...</div>
                ) : detail ? (
                  <>
                    <div className="adminPanel">
                      <div className="adminPanel__head">
                        <h2 className="adminPanel__title">Order review</h2>
                        <span className="adminQueueCard__pill">
                          {detail.adminPayoutRequest?.status || "pending"}
                        </span>
                      </div>

                      <div className="adminDetailGrid">
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Service</span>
                          <strong className="adminDetailFact__value">
                            {detail.services?.title || "Order"}
                          </strong>
                        </div>
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Customer</span>
                          <strong className="adminDetailFact__value">
                            {detail.customerName}
                          </strong>
                        </div>
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Freelancer</span>
                          <strong className="adminDetailFact__value">
                            {detail.freelancerName}
                          </strong>
                        </div>
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Fulfillment</span>
                          <strong className="adminDetailFact__value">
                            {formatFulfillmentLabel(detail.fulfillment_type)}
                          </strong>
                        </div>
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Escrow state</span>
                          <strong className="adminDetailFact__value">
                            {formatPayoutState(detail.escrow_status)}
                          </strong>
                        </div>
                        <div className="adminDetailFact">
                          <span className="adminDetailFact__label">Net payout</span>
                          <strong className="adminDetailFact__value">
                            {detail.freelancerNetLabel}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="adminPanel">
                      <div className="adminPanel__head">
                        <h2 className="adminPanel__title">Submitted work</h2>
                      </div>
                      <DeliveryReview order={detail} />
                    </div>

                    <div className="adminPanel">
                      <div className="adminPanel__head">
                        <h2 className="adminPanel__title">Release controls</h2>
                      </div>

                      <div className="adminDetailGrid adminDetailGrid--compact">
                        <label className="adminField">
                          <span className="adminField__label">Provider reference</span>
                          <input
                            className="adminField__control"
                            value={actionValues.providerReference}
                            onChange={(event) =>
                              setActionValues((prev) => ({
                                ...prev,
                                providerReference: event.target.value,
                              }))
                            }
                            required={false}
                          />
                          <span className="adminField__hint">
                            Required when releasing funds. Use the external payout,
                            transfer, or ops reference.
                          </span>
                        </label>

                        <label className="adminField adminField--wide">
                          <span className="adminField__label">Admin note</span>
                          <textarea
                            className="adminField__control adminField__textarea"
                            value={actionValues.note}
                            onChange={(event) =>
                              setActionValues((prev) => ({
                                ...prev,
                                note: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <AnimatePresence mode="wait">
                        {actionState.error ? (
                          <Motion.div
                            className="workflowStatus workflowStatus--danger"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                          >
                            {actionState.error}
                          </Motion.div>
                        ) : actionState.success ? (
                          <Motion.div
                            className="workflowStatus workflowStatus--success"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                          >
                            {actionState.success}
                          </Motion.div>
                        ) : null}
                      </AnimatePresence>

                      <div className="adminActionRow">
                        <Motion.button
                          type="button"
                          className="adminAction adminAction--release"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING}
                          disabled={actionState.pending || !releaseProviderReference}
                          onClick={() => handleAction("release")}
                        >
                          <span>{actionState.pending ? "Processing..." : "Release"}</span>
                        </Motion.button>

                        <Motion.button
                          type="button"
                          className="adminAction adminAction--block"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING}
                          disabled={actionState.pending}
                          onClick={() => handleAction("block")}
                        >
                          <span>Block</span>
                        </Motion.button>

                        <Motion.button
                          type="button"
                          className="adminAction adminAction--fail"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING}
                          disabled={actionState.pending}
                          onClick={() => handleAction("fail")}
                        >
                          <span>Fail</span>
                        </Motion.button>
                      </div>

                      <div className="adminReceiptRow">
                        {detail.adminPayoutRequest?.freelancerReceiptUrl ? (
                          <a
                            className="workflowActionBtn workflowActionBtn--ghost"
                            href={detail.adminPayoutRequest.freelancerReceiptUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Freelancer receipt
                          </a>
                        ) : null}
                        {detail.adminPayoutRequest?.customerReceiptUrl ? (
                          <a
                            className="workflowActionBtn workflowActionBtn--ghost"
                            href={detail.adminPayoutRequest.customerReceiptUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Customer receipt
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptySurface
                    hideIcon
                    title="Select a payout review"
                    description="Choose an item from the queue to inspect the submitted work and release controls."
                    className="adminEmptySurface"
                  />
                )}
              </div>
                </>
              ) : (
                <>
                  <aside className="adminQueue">
                    <div className="adminPanel">
                      <div className="adminPanel__head">
                        <h2 className="adminPanel__title">Verification queue</h2>
                        <span className="adminPanel__count">
                          {filteredVerificationQueue.length} item{filteredVerificationQueue.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="adminFilters">
                        {["all", "pending", "approved", "rejected"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            className={`adminFilterChip ${
                              verificationFilter === item ? "adminFilterChip--active" : ""
                            }`}
                            onClick={() => setVerificationFilter(item)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      {verificationLoading ? (
                        <div className="adminQueue__loading">Loading verification queue...</div>
                      ) : filteredVerificationQueue.length ? (
                        <div className="adminQueue__list">
                          {filteredVerificationQueue.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={`adminQueueCard ${
                                selectedVerificationId === item.id ? "adminQueueCard--active" : ""
                              }`}
                              onClick={() => setSelectedVerificationId(item.id)}
                            >
                              <div className="adminQueueCard__top">
                                <div>
                                  <strong className="adminQueueCard__title adminQueueCard__title--inline">
                                    {item.freelancerName}
                                    <VerifiedBadge
                                      verified={item.freelancerVerified}
                                      className="verifiedBadge--sm"
                                    />
                                  </strong>
                                  <span className="adminQueueCard__meta">
                                    {item.freelancerHeadline || "Freelancer verification"}
                                  </span>
                                </div>
                                <span className="adminQueueCard__pill">{item.status}</span>
                              </div>

                              <div className="adminQueueCard__facts">
                                <span>{item.createdAtLabel || "Recently"}</span>
                                <span>{item.status}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <EmptySurface
                          hideIcon
                          title="Nothing in this queue state"
                          description="Try another status filter to review a different set of verification requests."
                          className="adminEmptySurface"
                        />
                      )}
                    </div>
                  </aside>

                  <div className="adminDetail">
                    {verificationDetailLoading ? (
                      <div className="adminPanel adminPanel--loading">Loading verification...</div>
                    ) : verificationDetail ? (
                      <>
                        <div className="adminPanel">
                          <div className="adminPanel__head">
                            <h2 className="adminPanel__title">Freelancer review</h2>
                            <span className="adminQueueCard__pill">
                              {verificationDetail.status}
                            </span>
                          </div>

                          <div className="adminDetailGrid">
                            <div className="adminDetailFact">
                              <span className="adminDetailFact__label">Freelancer</span>
                              <strong className="adminDetailFact__value adminDetailFact__value--inline">
                                {verificationDetail.freelancerName}
                                <VerifiedBadge
                                  verified={verificationDetail.freelancerVerified}
                                  className="verifiedBadge--sm"
                                />
                              </strong>
                            </div>
                            <div className="adminDetailFact">
                              <span className="adminDetailFact__label">Headline</span>
                              <strong className="adminDetailFact__value">
                                {verificationDetail.freelancerHeadline || "Not added"}
                              </strong>
                            </div>
                            <div className="adminDetailFact">
                              <span className="adminDetailFact__label">Submitted</span>
                              <strong className="adminDetailFact__value">
                                {verificationDetail.createdAtLabel || "Recently"}
                              </strong>
                            </div>
                          </div>

                          <p className="adminVerificationDescription">
                            {verificationDetail.description}
                          </p>
                        </div>

                        <div className="adminPanel">
                          <div className="adminPanel__head">
                            <h2 className="adminPanel__title">Work proof</h2>
                          </div>
                          <VerificationMediaList media={verificationDetail.media} />
                        </div>

                        <div className="adminPanel">
                          <div className="adminPanel__head">
                            <h2 className="adminPanel__title">Verification controls</h2>
                          </div>

                          <label className="adminField adminField--wide">
                            <span className="adminField__label">Admin note</span>
                            <textarea
                              className="adminField__control adminField__textarea"
                              value={verificationActionNote}
                              onChange={(event) => setVerificationActionNote(event.target.value)}
                            />
                          </label>

                          <AnimatePresence mode="wait">
                            {actionState.error ? (
                              <Motion.div
                                className="workflowStatus workflowStatus--danger"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                              >
                                {actionState.error}
                              </Motion.div>
                            ) : actionState.success ? (
                              <Motion.div
                                className="workflowStatus workflowStatus--success"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                              >
                                {actionState.success}
                              </Motion.div>
                            ) : null}
                          </AnimatePresence>

                          <div className="adminActionRow">
                            <Motion.button
                              type="button"
                              className="adminAction adminAction--release"
                              whileHover={{ y: -1.5 }}
                              whileTap={{ scale: 0.98 }}
                              transition={SPRING}
                              disabled={
                                actionState.pending ||
                                verificationDetail.status === "approved"
                              }
                              onClick={() => handleVerificationAction("approve")}
                            >
                              <span>{actionState.pending ? "Processing..." : "Approve"}</span>
                            </Motion.button>

                            <Motion.button
                              type="button"
                              className="adminAction adminAction--fail"
                              whileHover={{ y: -1.5 }}
                              whileTap={{ scale: 0.98 }}
                              transition={SPRING}
                              disabled={
                                actionState.pending ||
                                verificationDetail.status === "rejected"
                              }
                              onClick={() => handleVerificationAction("reject")}
                            >
                              <span>Reject</span>
                            </Motion.button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <EmptySurface
                        hideIcon
                        title="Select a verification request"
                        description="Choose an item from the queue to inspect submitted proof and approve or reject it."
                        className="adminEmptySurface"
                      />
                    )}
                  </div>
                </>
              )}
            </section>
            </>
          </Reveal>
        )}
      </main>
    </div>
  );
}
