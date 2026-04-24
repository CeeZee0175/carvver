import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { getProfile } from "../../../lib/supabase/auth";
import { buildPhilippinesLocationLabel } from "../../../lib/phLocations";
import { REQUEST_MEDIA_BUCKET } from "./useCustomerRequests";

const supabase = createClient();
export const ORDER_DELIVERY_ASSET_BUCKET = "order-delivery-assets";
export const ORDER_RECEIPT_BUCKET = "order-receipts";
export const FREELANCER_VERIFICATION_BUCKET = "freelancer-verification-media";
export const ORDER_DELIVERY_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const ORDER_DELIVERY_ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
export const ORDER_DELIVERY_ACCEPTED_DOCUMENT_TYPES = ["application/pdf"];
export const ORDER_DELIVERY_MAX_ASSET_ITEMS = 5;
export const ORDER_DELIVERY_MAX_ASSET_BYTES = 50 * 1024 * 1024;

function normalizeText(value) {
  return String(value || "").trim();
}

function sanitizeFileName(name) {
  return String(name || "delivery-asset")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFileExtension(file) {
  const fromName = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  switch (file?.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}

function getDeliveryAssetKind(file) {
  const type = String(file?.type || "").toLowerCase();

  if (ORDER_DELIVERY_ACCEPTED_DOCUMENT_TYPES.includes(type)) return "document";
  if (type.startsWith("video/")) return "video";
  return "image";
}

function buildDeliveryAssetError(file) {
  if (Number(file?.size || 0) > ORDER_DELIVERY_MAX_ASSET_BYTES) {
    return "Delivery files must be 50 MB or smaller.";
  }

  return "Use JPG, PNG, WEBP, MP4, WEBM, MOV, or PDF files only.";
}

function validateDeliveryAssetFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const isAccepted = [
    ...ORDER_DELIVERY_ACCEPTED_IMAGE_TYPES,
    ...ORDER_DELIVERY_ACCEPTED_VIDEO_TYPES,
    ...ORDER_DELIVERY_ACCEPTED_DOCUMENT_TYPES,
  ].includes(type);

  if (!isAccepted || Number(file?.size || 0) > ORDER_DELIVERY_MAX_ASSET_BYTES) {
    throw new Error(buildDeliveryAssetError(file));
  }
}

function friendlyWorkflowMessage(error, fallback) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied/i.test(message)) {
    return "That action isn't available right now.";
  }

  if (
    /customer_request_proposals|order_updates|freelancer_payout_methods|order_deliveries|payout_release_requests/i.test(
      message
    )
  ) {
    return "Run the latest workflow SQL before using this page.";
  }

  return fallback;
}

function getPublicUrl(bucket, path) {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

function getReceiptPublicUrl(path) {
  return getPublicUrl(ORDER_RECEIPT_BUCKET, path);
}

async function getSignedUrl(bucket, path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (error) return "";
  return data?.signedUrl || "";
}

function groupBy(rows, key) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const groupKey = row[key];
    const existing = map.get(groupKey) || [];
    existing.push(row);
    map.set(groupKey, existing);
  });
  return map;
}

function formatPeso(value) {
  const amount = Number(value || 0);
  return `PHP ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value, options = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

function formatLongDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDeadline(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "No deadline yet";
  return formatDate(`${normalized}T00:00:00`) || normalized;
}

function buildProfileName(profile, fallback = "User") {
  if (!profile) return fallback;

  const displayName = normalizeText(profile.display_name);
  if (displayName) return displayName;

  const fullName = [profile.first_name, profile.last_name]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || fallback;
}

function buildProfileInitials(profile, fallback = "U") {
  const initials = [profile?.first_name, profile?.last_name]
    .map((part) => normalizeText(part).charAt(0))
    .join("")
    .toUpperCase();

  return initials || buildProfileName(profile, fallback).charAt(0).toUpperCase() || fallback;
}

function normalizeRequestMedia(rows = [], requestTitle = "Request") {
  return rows.map((item) => ({
    ...item,
    publicUrl: getPublicUrl(REQUEST_MEDIA_BUCKET, item.bucket_path),
    originalName: normalizeText(item.original_name) || requestTitle,
  }));
}

function normalizeProposal(row) {
  const freelancer = row.freelancer || row.profiles || null;
  return {
    id: row.id,
    requestId: row.request_id,
    freelancerId: row.freelancer_id,
    threadId: row.thread_id,
    pitch: normalizeText(row.pitch),
    offeredPrice: Number(row.offered_price || 0),
    offeredPriceLabel: formatPeso(row.offered_price || 0),
    deliveryDays: Number(row.delivery_days || 0),
    status: normalizeText(row.status) || "pending",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    acceptedAt: row.accepted_at || null,
    freelancer: {
      id: freelancer?.id || row.freelancer_id,
      displayName: buildProfileName(freelancer, "Freelancer"),
      initials: buildProfileInitials(freelancer, "F"),
      avatarUrl: normalizeText(freelancer?.avatar_url),
      headline: normalizeText(freelancer?.freelancer_headline),
      location:
        buildPhilippinesLocationLabel({
          region: freelancer?.region,
          city: freelancer?.city,
          barangay: freelancer?.barangay,
        }) || "Philippines",
    },
  };
}

function normalizeOrderUpdate(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    authorId: row.author_id,
    authorRole: normalizeText(row.author_role) || "freelancer",
    updateKind: normalizeText(row.update_kind) || "progress",
    title: normalizeText(row.title),
    body: normalizeText(row.body),
    createdAt: row.created_at || null,
    createdAtLabel: formatLongDateTime(row.created_at),
  };
}

function normalizePayoutMethod(row) {
  return {
    payoutMethod: normalizeText(row?.payout_method),
    accountName: normalizeText(row?.account_name),
    accountReference: normalizeText(row?.account_reference),
  };
}

function normalizeFulfillmentType(value) {
  return String(value || "").trim().toLowerCase() === "physical"
    ? "physical"
    : "digital";
}

function normalizeEscrowStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (
    ["held", "pending_release", "released", "blocked", "failed", "refunded"].includes(
      normalized
    )
  ) {
    return normalized;
  }
  return "held";
}

function normalizePayoutQueueStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (["pending", "blocked", "released", "failed"].includes(normalized)) {
    return normalized;
  }
  return "pending";
}

function normalizeDeliveryAsset(row) {
  return {
    id: row?.id || "",
    deliveryId: row?.delivery_id || "",
    orderId: row?.order_id || "",
    freelancerId: row?.freelancer_id || "",
    assetKind: normalizeText(row?.asset_kind) || "document",
    mimeType: normalizeText(row?.mime_type),
    originalName: normalizeText(row?.original_name) || "Delivery asset",
    bucketPath: normalizeText(row?.bucket_path),
    publicUrl: getPublicUrl(ORDER_DELIVERY_ASSET_BUCKET, row?.bucket_path),
    createdAt: row?.created_at || null,
    createdAtLabel: formatLongDateTime(row?.created_at),
  };
}

function normalizeOrderDelivery(row, assets = []) {
  const fulfillmentType = normalizeFulfillmentType(row?.fulfillment_type);

  return {
    id: row?.id || "",
    orderId: row?.order_id || "",
    freelancerId: row?.freelancer_id || "",
    fulfillmentType,
    deliveryNote: normalizeText(row?.delivery_note),
    deliverableLabel: normalizeText(row?.deliverable_label),
    deliverableUrl: normalizeText(row?.deliverable_url),
    accessCode: normalizeText(row?.access_code),
    courierName: normalizeText(row?.courier_name),
    trackingReference: normalizeText(row?.tracking_reference),
    shipmentNote: normalizeText(row?.shipment_note),
    proofUrl: normalizeText(row?.proof_url),
    createdAt: row?.created_at || null,
    createdAtLabel: formatLongDateTime(row?.created_at),
    assets,
  };
}

function normalizePayoutReleaseRequest(row) {
  if (!row) return null;

  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    freelancerId: row.freelancer_id,
    amount: Number(row.amount || 0),
    amountLabel: formatPeso(row.amount || 0),
    currency: normalizeText(row.currency) || "PHP",
    status: normalizePayoutQueueStatus(row.status),
    payoutMethod: normalizeText(row.destination_method),
    accountName: normalizeText(row.destination_account_name),
    accountReference: normalizeText(row.destination_account_reference),
    providerReference: normalizeText(row.provider_reference),
    opsNote: normalizeText(row.ops_note),
    requestedAt: row.requested_at || null,
    requestedAtLabel: formatLongDateTime(row.requested_at),
    releasedAt: row.released_at || null,
    releasedAtLabel: formatLongDateTime(row.released_at),
    processedAt: row.processed_at || null,
    processedAtLabel: formatLongDateTime(row.processed_at),
    freelancerReceiptPath: normalizeText(row.freelancer_receipt_path),
    customerReceiptPath: normalizeText(row.customer_receipt_path),
    freelancerReceiptUrl: getReceiptPublicUrl(row.freelancer_receipt_path),
    customerReceiptUrl: getReceiptPublicUrl(row.customer_receipt_path),
  };
}

async function getSignedInProfile() {
  const profile = await getProfile();
  if (!profile?.id) {
    throw new Error("You need to be signed in to continue.");
  }
  return profile;
}

async function uploadOrderDeliveryAsset({
  freelancerId,
  orderId,
  deliveryId,
  file,
}) {
  validateDeliveryAssetFile(file);

  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name);
  const bucketPath = `${freelancerId}/${orderId}/${deliveryId}/${Date.now()}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(ORDER_DELIVERY_ASSET_BUCKET)
    .upload(bucketPath, file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from("order_delivery_assets").insert({
    delivery_id: deliveryId,
    order_id: orderId,
    freelancer_id: freelancerId,
    bucket_path: bucketPath,
    asset_kind: getDeliveryAssetKind(file),
    mime_type: normalizeText(file.type) || "application/octet-stream",
    original_name: normalizeText(file.name) || "delivery-asset",
  });

  if (insertError) {
    await supabase.storage.from(ORDER_DELIVERY_ASSET_BUCKET).remove([bucketPath]);
    throw insertError;
  }
}

async function ensureThread({ customerId, freelancerId }) {
  const { data: existing, error: existingError } = await supabase
    .from("customer_freelancer_threads")
    .select("id, customer_id, freelancer_id, created_at, updated_at, last_message_at")
    .eq("customer_id", customerId)
    .eq("freelancer_id", freelancerId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from("customer_freelancer_threads")
    .insert([
      {
        customer_id: customerId,
        freelancer_id: freelancerId,
      },
    ])
    .select("id, customer_id, freelancer_id, created_at, updated_at, last_message_at")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function insertThreadMessage({
  threadId,
  senderId,
  senderRole,
  body,
  messageType = "text",
  metadata = null,
}) {
  const payload = {
    thread_id: threadId,
    sender_id: senderId,
    sender_role: senderRole,
    body,
    message_type: messageType,
    metadata,
  };

  const { error } = await supabase.from("customer_freelancer_messages").insert([payload]);
  if (error) throw error;
}

export async function fetchCustomerRequestDetail(requestId) {
  const profile = await getSignedInProfile();

  const { data: requestRow, error: requestError } = await supabase
    .from("customer_requests")
    .select("id, customer_id, title, category, description, budget_amount, location, timeline, status, created_at, updated_at")
    .eq("id", requestId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (requestError) throw requestError;
  if (!requestRow) throw new Error("We couldn't find that request.");

  const [{ data: mediaRows, error: mediaError }, { data: proposalRows, error: proposalError }] =
    await Promise.all([
      supabase
        .from("customer_request_media")
        .select("id, request_id, bucket_path, media_kind, mime_type, original_name, sort_order")
        .eq("request_id", requestId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("customer_request_proposals")
        .select(
          `
          id,
          request_id,
          freelancer_id,
          thread_id,
          pitch,
          offered_price,
          delivery_days,
          status,
          created_at,
          updated_at,
          accepted_at,
          freelancer:profiles!customer_request_proposals_freelancer_id_fkey (
            id,
            first_name,
            last_name,
            display_name,
            avatar_url,
            freelancer_headline,
            region,
            city,
            barangay
          )
        `
        )
        .eq("request_id", requestId)
        .order("created_at", { ascending: false }),
    ]);

  if (mediaError) throw mediaError;
  if (proposalError) throw proposalError;

  const media = normalizeRequestMedia(mediaRows || [], requestRow.title);
  const proposals = (proposalRows || []).map(normalizeProposal);

  return {
    ...requestRow,
    budgetLabel: requestRow.budget_amount ? formatPeso(requestRow.budget_amount) : "Budget not set",
    deadlineLabel: formatDeadline(requestRow.timeline),
    createdAtLabel: formatDate(requestRow.created_at),
    media,
    proposals,
  };
}

export async function createRequestProposal({ requestId, pitch, offeredPrice, deliveryDays }) {
  const profile = await getSignedInProfile();
  const normalizedPitch = normalizeText(pitch);
  const numericPrice = Number(offeredPrice || 0);
  const numericDeliveryDays = Number(deliveryDays || 0);

  if (!normalizedPitch) {
    throw new Error("Add a short proposal before sending it.");
  }
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new Error("Enter a valid offered price.");
  }
  if (!Number.isFinite(numericDeliveryDays) || numericDeliveryDays <= 0) {
    throw new Error("Enter a valid delivery time in days.");
  }

  const { data: requestRow, error: requestError } = await supabase
    .from("customer_requests")
    .select("id, customer_id, title, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) throw requestError;
  if (!requestRow) throw new Error("We couldn't find that request.");
  if (!["open", "matched"].includes(normalizeText(requestRow.status))) {
    throw new Error("This request is no longer accepting proposals.");
  }

  const thread = await ensureThread({
    customerId: requestRow.customer_id,
    freelancerId: profile.id,
  });

  const { data: existingProposal, error: existingError } = await supabase
    .from("customer_request_proposals")
    .select("id, status")
    .eq("request_id", requestId)
    .eq("freelancer_id", profile.id)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  let proposalId = existingProposal?.id || "";

  if (proposalId && existingProposal.status === "pending") {
    const { error: updateError } = await supabase
      .from("customer_request_proposals")
      .update({
        thread_id: thread.id,
        pitch: normalizedPitch,
        offered_price: numericPrice,
        delivery_days: numericDeliveryDays,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) throw updateError;
  } else if (!proposalId) {
    const { data: insertedProposal, error: insertError } = await supabase
      .from("customer_request_proposals")
      .insert([
        {
          request_id: requestId,
          freelancer_id: profile.id,
          thread_id: thread.id,
          pitch: normalizedPitch,
          offered_price: numericPrice,
          delivery_days: numericDeliveryDays,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;
    proposalId = insertedProposal.id;
  } else {
    throw new Error("This request already has an accepted proposal from you.");
  }

  await insertThreadMessage({
    threadId: thread.id,
    senderId: profile.id,
    senderRole: "freelancer",
    body: normalizedPitch,
    messageType: "proposal",
    metadata: {
      proposalId,
      requestId,
      requestTitle: requestRow.title,
      offeredPrice: numericPrice,
      deliveryDays: numericDeliveryDays,
    },
  });

  return proposalId;
}

export async function acceptRequestProposal({ requestId, proposalId }) {
  const profile = await getSignedInProfile();

  const { data: requestRow, error: requestError } = await supabase
    .from("customer_requests")
    .select("id, customer_id, title")
    .eq("id", requestId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (requestError) throw requestError;
  if (!requestRow) throw new Error("We couldn't open this request.");

  const { data: proposalRow, error: proposalError } = await supabase
    .from("customer_request_proposals")
    .select("id, request_id, freelancer_id, thread_id, status")
    .eq("id", proposalId)
    .eq("request_id", requestId)
    .maybeSingle();

  if (proposalError) throw proposalError;
  if (!proposalRow) throw new Error("We couldn't find that proposal.");

  const now = new Date().toISOString();

  const { error: acceptError } = await supabase
    .from("customer_request_proposals")
    .update({
      status: "accepted",
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", proposalId);

  if (acceptError) throw acceptError;

  const { error: rejectOthersError } = await supabase
    .from("customer_request_proposals")
    .update({
      status: "rejected",
      updated_at: now,
    })
    .eq("request_id", requestId)
    .neq("id", proposalId)
    .eq("status", "pending");

  if (rejectOthersError) throw rejectOthersError;

  const { error: requestUpdateError } = await supabase
    .from("customer_requests")
    .update({
      status: "matched",
      updated_at: now,
    })
    .eq("id", requestId);

  if (requestUpdateError) throw requestUpdateError;

  if (proposalRow.thread_id) {
    await insertThreadMessage({
      threadId: proposalRow.thread_id,
      senderId: profile.id,
      senderRole: "customer",
      body: `Accepted the proposal for ${requestRow.title}.`,
      messageType: "proposal",
      metadata: {
        proposalId,
        requestId,
        requestTitle: requestRow.title,
        status: "accepted",
      },
    });
  }

  return true;
}

async function fetchOrderDetail(orderId, column, ownerId) {
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id,
      service_id,
      customer_id,
      freelancer_id,
      status,
      total_price,
      selected_package_id,
      selected_package_name,
      selected_package_summary,
      selected_package_delivery_time_days,
      selected_package_revisions,
      selected_package_included_items,
      gross_amount,
      platform_fee,
      freelancer_net,
      payment_provider,
      payment_reference,
      escrow_status,
      fulfillment_type,
      paid_at,
      completed_at,
      released_at,
      created_at,
      services (
        id,
        title,
        category,
        location
      ),
      customer:profiles!orders_customer_id_fkey (
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        region,
        city,
        barangay
      ),
      freelancer:profiles!orders_freelancer_id_fkey (
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        freelancer_headline,
        region,
        city,
        barangay
      )
    `
    )
    .eq("id", orderId)
    .eq(column, ownerId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!orderRow) throw new Error("We couldn't find that order.");

  const [
    { data: updateRows, error: updateError },
    { data: deliveryRows, error: deliveryError },
    { data: deliveryAssetRows, error: deliveryAssetError },
    { data: payoutRequestRows, error: payoutError },
  ] = await Promise.all([
    supabase
      .from("order_updates")
      .select("id, order_id, author_id, author_role, update_kind, title, body, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_deliveries")
      .select(
        "id, order_id, freelancer_id, fulfillment_type, delivery_note, deliverable_label, deliverable_url, access_code, courier_name, tracking_reference, shipment_note, proof_url, created_at"
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_delivery_assets")
      .select(
        "id, delivery_id, order_id, freelancer_id, bucket_path, asset_kind, mime_type, original_name, created_at"
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("payout_release_requests")
      .select(
        "id, order_id, customer_id, freelancer_id, amount, currency, status, destination_method, destination_account_name, destination_account_reference, provider_reference, ops_note, requested_at, processed_at, released_at, created_at, freelancer_receipt_path, customer_receipt_path"
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (updateError) throw updateError;
  if (deliveryError) throw deliveryError;
  if (deliveryAssetError) throw deliveryAssetError;
  if (payoutError) throw payoutError;

  const payoutRelease = normalizePayoutReleaseRequest((payoutRequestRows || [])[0] || null);
  const escrowStatus = normalizeEscrowStatus(orderRow.escrow_status);
  const fulfillmentType = normalizeFulfillmentType(orderRow.fulfillment_type);
  const assetMap = groupBy(
    (deliveryAssetRows || []).map(normalizeDeliveryAsset),
    "deliveryId"
  );
  const normalizedDeliveries = (deliveryRows || []).map((row) =>
    normalizeOrderDelivery(row, assetMap.get(row.id) || [])
  );

  return {
    ...orderRow,
    escrow_status: escrowStatus,
    fulfillment_type: fulfillmentType,
    totalLabel: formatPeso(orderRow.total_price),
    grossLabel: formatPeso(orderRow.gross_amount || orderRow.total_price),
    platformFeeLabel: formatPeso(orderRow.platform_fee || 0),
    freelancerNetLabel: formatPeso(orderRow.freelancer_net || 0),
    createdAtLabel: formatLongDateTime(orderRow.created_at),
    paidAtLabel: formatLongDateTime(orderRow.paid_at),
    completedAtLabel: formatLongDateTime(orderRow.completed_at),
    releasedAtLabel: formatLongDateTime(orderRow.released_at),
    customerName: buildProfileName(orderRow.customer, "Customer"),
    freelancerName: buildProfileName(orderRow.freelancer, "Freelancer"),
    updates: (updateRows || []).map(normalizeOrderUpdate),
    deliveries: normalizedDeliveries,
    latestDelivery:
      normalizedDeliveries.length > 0
        ? normalizedDeliveries[normalizedDeliveries.length - 1]
        : null,
    payoutRelease,
  };
}

export async function fetchCustomerOrderDetail(orderId) {
  const profile = await getSignedInProfile();
  return fetchOrderDetail(orderId, "customer_id", profile.id);
}

export async function fetchFreelancerOrderDetail(orderId) {
  const profile = await getSignedInProfile();
  return fetchOrderDetail(orderId, "freelancer_id", profile.id);
}

async function fetchAdminOrderDetail(orderId) {
  return fetchOrderDetail(orderId, "id", orderId);
}

export async function fetchAdminPayoutQueue() {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required to open this queue.");
  }

  const { data, error } = await supabase
    .from("payout_release_requests")
    .select(
      `
      id,
      order_id,
      customer_id,
      freelancer_id,
      amount,
      currency,
      status,
      destination_method,
      destination_account_name,
      destination_account_reference,
      provider_reference,
      ops_note,
      requested_at,
      processed_at,
      released_at,
      freelancer_receipt_path,
      customer_receipt_path,
      orders (
        id,
        status,
        escrow_status,
        fulfillment_type,
        total_price,
        freelancer_net,
        created_at,
        services (
          id,
          title,
          category,
          location
        ),
        customer:profiles!orders_customer_id_fkey (
          id,
          first_name,
          last_name,
          display_name
        ),
        freelancer:profiles!orders_freelancer_id_fkey (
          id,
          first_name,
          last_name,
          display_name
        )
      )
    `
    )
    .order("requested_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    const payoutRelease = normalizePayoutReleaseRequest(row);

    return {
      id: row.id,
      orderId: row.order_id,
      status: payoutRelease?.status || "pending",
      amount: payoutRelease?.amount || 0,
      amountLabel: payoutRelease?.amountLabel || formatPeso(row.amount),
      requestedAt: payoutRelease?.requestedAt,
      requestedAtLabel: payoutRelease?.requestedAtLabel || "",
      fulfillmentType: normalizeFulfillmentType(order?.fulfillment_type),
      escrowStatus: normalizeEscrowStatus(order?.escrow_status),
      orderStatus: normalizeText(order?.status) || "pending",
      destinationMethod: normalizeText(row.destination_method),
      destinationAccountReference: normalizeText(row.destination_account_reference),
      providerReference: normalizeText(row.provider_reference),
      opsNote: normalizeText(row.ops_note),
      serviceTitle: normalizeText(order?.services?.title) || "Order",
      category: normalizeText(order?.services?.category),
      location: normalizeText(order?.services?.location),
      customerName: buildProfileName(order?.customer, "Customer"),
      freelancerName: buildProfileName(order?.freelancer, "Freelancer"),
      payoutRelease,
    };
  });
}

export async function fetchAdminPayoutReviewDetail(payoutRequestId) {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required to open this payout review.");
  }

  const { data, error } = await supabase
    .from("payout_release_requests")
    .select(
      "id, order_id, customer_id, freelancer_id, amount, currency, status, destination_method, destination_account_name, destination_account_reference, provider_reference, ops_note, requested_at, processed_at, released_at, freelancer_receipt_path, customer_receipt_path"
    )
    .eq("id", payoutRequestId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.order_id) {
    throw new Error("We couldn't find that payout review.");
  }

  const order = await fetchAdminOrderDetail(data.order_id);

  return {
    ...order,
    adminPayoutRequest: normalizePayoutReleaseRequest(data),
  };
}

export async function processAdminPayoutAction({
  payoutRequestId,
  action,
  providerReference,
  note,
}) {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required for payout actions.");
  }

  const { data, error } = await supabase.functions.invoke(
    "release-freelancer-payout",
    {
      body: {
        payoutRequestId,
        action,
        providerReference,
        note,
      },
    }
  );

  if (error) {
    throw new Error(
      String(error.message || "We couldn't process that payout action.")
    );
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return data;
}

function normalizeVerificationRequest(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    freelancerId: row.freelancer_id,
    description: normalizeText(row.description),
    status: normalizeText(row.status) || "pending",
    adminNote: normalizeText(row.admin_note),
    reviewedAt: row.reviewed_at,
    reviewedAtLabel: formatDate(row.reviewed_at),
    createdAt: row.created_at,
    createdAtLabel: formatDate(row.created_at),
    updatedAt: row.updated_at,
    freelancerName: buildProfileName(profile, "Freelancer"),
    freelancerEmail: "",
    freelancerHeadline: normalizeText(profile?.freelancer_headline),
    freelancerAvatarUrl: normalizeText(profile?.avatar_url),
    freelancerVerified: Boolean(profile?.freelancer_verified_at),
    media: [],
  };
}

export async function fetchAdminVerificationQueue() {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required to open this queue.");
  }

  const { data, error } = await supabase
    .from("freelancer_verification_requests")
    .select(
      `
      id,
      freelancer_id,
      description,
      status,
      admin_note,
      reviewed_at,
      created_at,
      updated_at,
      profiles!freelancer_verification_requests_freelancer_id_fkey (
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        freelancer_headline,
        freelancer_verified_at
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeVerificationRequest);
}

export async function fetchAdminVerificationDetail(requestId) {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required to open this review.");
  }

  const { data, error } = await supabase
    .from("freelancer_verification_requests")
    .select(
      `
      id,
      freelancer_id,
      description,
      status,
      admin_note,
      reviewed_at,
      created_at,
      updated_at,
      profiles!freelancer_verification_requests_freelancer_id_fkey (
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        freelancer_headline,
        freelancer_verified_at
      ),
      freelancer_verification_media (
        id,
        bucket_path,
        media_kind,
        mime_type,
        original_name,
        sort_order
      )
    `
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("We couldn't find that verification request.");

  const normalized = normalizeVerificationRequest(data);
  const mediaRows = data.freelancer_verification_media || [];
  const media = await Promise.all(
    mediaRows
      .slice()
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map(async (item) => ({
        id: item.id,
        mediaKind: normalizeText(item.media_kind) || "image",
        mimeType: normalizeText(item.mime_type),
        originalName: normalizeText(item.original_name) || "Verification proof",
        signedUrl: await getSignedUrl(FREELANCER_VERIFICATION_BUCKET, item.bucket_path),
      }))
  );

  return {
    ...normalized,
    media,
  };
}

export async function processAdminVerificationAction({
  requestId,
  action,
  note,
}) {
  const profile = await getSignedInProfile();
  if (normalizeText(profile?.role).toLowerCase() !== "admin") {
    throw new Error("Admin access is required for verification actions.");
  }

  const { data, error } = await supabase.rpc(
    "process_freelancer_verification_request",
    {
      p_request_id: requestId,
      p_action: action,
      p_admin_note: note,
    }
  );

  if (error) throw error;
  return data;
}

export async function confirmOrderCompletion(orderId) {
  const profile = await getSignedInProfile();
  const order = await fetchOrderDetail(orderId, "customer_id", profile.id);

  if (normalizeEscrowStatus(order.escrow_status) === "released") {
    return {
      escrowStatus: "released",
      payoutRequestStatus: "released",
      message: "This order was already completed and the payout has already been released.",
    };
  }

  const { data: receiptResult, error: receiptError } = await supabase.rpc(
    "confirm_customer_order_receipt",
    { p_order_id: orderId }
  );

  if (receiptError) throw receiptError;

  const payoutRequestStatus = normalizePayoutQueueStatus(
    receiptResult?.payoutRequestStatus
  );
  const escrowStatus = normalizeEscrowStatus(receiptResult?.escrowStatus);
  const payoutDestinationReady = payoutRequestStatus === "pending";
  const updateTitle = payoutDestinationReady
    ? "Order completed and payout queued"
    : "Order completed but payout blocked";

  if (escrowStatus === "released" && !receiptResult?.updateId) {
    return {
      escrowStatus,
      payoutRequestStatus,
      message:
        receiptResult?.message ||
        "This order was already completed and the payout has already been released.",
    };
  }

  const thread = await ensureThread({
    customerId: order.customer_id,
    freelancerId: order.freelancer_id,
  });

  await insertThreadMessage({
    threadId: thread.id,
    senderId: profile.id,
    senderRole: "customer",
    body: payoutDestinationReady
      ? "Confirmed receipt and queued the freelancer payout for ops release."
      : "Confirmed receipt, but the payout is blocked until the freelancer payout details are fixed.",
    messageType: "order_update",
    metadata: {
      orderId,
      updateId: receiptResult?.updateId || null,
      payoutRequestId: receiptResult?.payoutRequestId || null,
      updateKind: "status",
      title: updateTitle,
    },
  });

  return {
    escrowStatus,
    payoutRequestStatus,
    message:
      receiptResult?.message ||
      (payoutDestinationReady
        ? "Order completed. The freelancer payout is now queued for ops release."
        : "Order completed. The payout is blocked until the freelancer updates their payout details."),
  };
}

export async function createFreelancerOrderUpdate({
  orderId,
  updateKind,
  title,
  body,
}) {
  const profile = await getSignedInProfile();
  const normalizedTitle = normalizeText(title);
  const normalizedBody = normalizeText(body);
  const normalizedKind = normalizeText(updateKind) || "progress";

  if (!normalizedTitle) throw new Error("Add a short update title.");
  if (!normalizedBody) throw new Error("Add the update details before sending.");

  const order = await fetchOrderDetail(orderId, "freelancer_id", profile.id);

  const { data: insertedUpdate, error: updateError } = await supabase
    .from("order_updates")
    .insert([
      {
        order_id: orderId,
        author_id: profile.id,
        author_role: "freelancer",
        update_kind: normalizedKind,
        title: normalizedTitle,
        body: normalizedBody,
      },
    ])
    .select("id")
    .single();

  if (updateError) throw updateError;

  const thread = await ensureThread({
    customerId: order.customer_id,
    freelancerId: order.freelancer_id,
  });

  await insertThreadMessage({
    threadId: thread.id,
    senderId: profile.id,
    senderRole: "freelancer",
    body: normalizedBody,
    messageType: "order_update",
    metadata: {
      orderId,
      updateId: insertedUpdate.id,
      updateKind: normalizedKind,
      title: normalizedTitle,
    },
  });

  return true;
}

export async function submitFreelancerOrderDelivery({
  orderId,
  deliveryNote,
  deliverableLabel,
  deliverableUrl,
  accessCode,
  courierName,
  trackingReference,
  shipmentNote,
  proofUrl,
  deliveryAssets = [],
}) {
  const profile = await getSignedInProfile();
  const order = await fetchOrderDetail(orderId, "freelancer_id", profile.id);

  const fulfillmentType = normalizeFulfillmentType(order.fulfillment_type);
  const normalizedDeliveryNote = normalizeText(deliveryNote);
  const normalizedDeliverableLabel = normalizeText(deliverableLabel);
  const normalizedDeliverableUrl = normalizeText(deliverableUrl);
  const normalizedAccessCode = normalizeText(accessCode);
  const normalizedCourierName = normalizeText(courierName);
  const normalizedTrackingReference = normalizeText(trackingReference);
  const normalizedShipmentNote = normalizeText(shipmentNote);
  const normalizedProofUrl = normalizeText(proofUrl);
  const nextAssets = Array.isArray(deliveryAssets) ? deliveryAssets.filter(Boolean) : [];

  if (!normalizedDeliveryNote) {
    throw new Error("Add a short delivery note before sending.");
  }

  if (nextAssets.length > ORDER_DELIVERY_MAX_ASSET_ITEMS) {
    throw new Error("Keep delivery uploads to 5 files or fewer.");
  }

  if (
    fulfillmentType === "digital" &&
    !normalizedDeliverableUrl &&
    nextAssets.length === 0
  ) {
    throw new Error("Add a delivery link or upload at least one final file for this digital order.");
  }

  if (fulfillmentType === "physical") {
    if (!normalizedCourierName) {
      throw new Error("Add the courier name before sending shipment details.");
    }
    if (!normalizedTrackingReference) {
      throw new Error("Add the tracking or reference number before sending shipment details.");
    }
  }

  const { data: insertedDelivery, error: deliveryError } = await supabase
    .from("order_deliveries")
    .insert([
      {
        order_id: orderId,
        freelancer_id: profile.id,
        fulfillment_type: fulfillmentType,
        delivery_note: normalizedDeliveryNote,
        deliverable_label: fulfillmentType === "digital" ? normalizedDeliverableLabel || null : null,
        deliverable_url: fulfillmentType === "digital" ? normalizedDeliverableUrl || null : null,
        access_code: fulfillmentType === "digital" ? normalizedAccessCode || null : null,
        courier_name: fulfillmentType === "physical" ? normalizedCourierName || null : null,
        tracking_reference:
          fulfillmentType === "physical" ? normalizedTrackingReference || null : null,
        shipment_note: fulfillmentType === "physical" ? normalizedShipmentNote || null : null,
        proof_url: fulfillmentType === "physical" ? normalizedProofUrl || null : null,
      },
    ])
    .select("id")
    .single();

  if (deliveryError) throw deliveryError;

  if (nextAssets.length > 0) {
    for (const asset of nextAssets) {
      await uploadOrderDeliveryAsset({
        freelancerId: profile.id,
        orderId,
        deliveryId: insertedDelivery.id,
        file: asset,
      });
    }
  }

  if (normalizeText(order.status) === "pending") {
    const { error: activateError } = await supabase
      .from("orders")
      .update({ status: "active" })
      .eq("id", orderId)
      .eq("freelancer_id", profile.id);

    if (activateError) throw activateError;
  }

  const deliveryTitle =
    fulfillmentType === "physical" ? "Shipment details shared" : "Digital delivery submitted";
  const deliveryBody =
    fulfillmentType === "physical"
      ? [
          normalizedDeliveryNote,
          `Courier: ${normalizedCourierName}`,
          `Tracking/reference: ${normalizedTrackingReference}`,
          normalizedShipmentNote ? `Shipment note: ${normalizedShipmentNote}` : "",
          normalizedProofUrl ? `Proof: ${normalizedProofUrl}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          normalizedDeliveryNote,
          normalizedDeliverableLabel ? `Deliverable: ${normalizedDeliverableLabel}` : "",
          `Access link: ${normalizedDeliverableUrl}`,
          normalizedAccessCode ? `Access code: ${normalizedAccessCode}` : "",
        ]
          .filter(Boolean)
          .join(" ");

  const { data: insertedUpdate, error: updateError } = await supabase
    .from("order_updates")
    .insert([
      {
        order_id: orderId,
        author_id: profile.id,
        author_role: "freelancer",
        update_kind: "delivery",
        title: deliveryTitle,
        body: deliveryBody,
      },
    ])
    .select("id")
    .single();

  if (updateError) throw updateError;

  const thread = await ensureThread({
    customerId: order.customer_id,
    freelancerId: order.freelancer_id,
  });

  await insertThreadMessage({
    threadId: thread.id,
    senderId: profile.id,
    senderRole: "freelancer",
    body: deliveryBody,
    messageType: "order_update",
    metadata: {
      orderId,
      deliveryId: insertedDelivery.id,
      updateId: insertedUpdate.id,
      updateKind: "delivery",
      title: deliveryTitle,
      fulfillmentType,
    },
  });

  return true;
}

export async function listFreelancerOrders() {
  const profile = await getSignedInProfile();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      service_id,
      customer_id,
      freelancer_id,
      status,
      total_price,
      gross_amount,
      platform_fee,
      freelancer_net,
      escrow_status,
      fulfillment_type,
      paid_at,
      created_at,
      selected_package_name,
      selected_package_summary,
      selected_package_delivery_time_days,
      services (
        id,
        title,
        category,
        location
      ),
      customer:profiles!orders_customer_id_fkey (
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        region,
        city,
        barangay
      )
    `
    )
    .eq("freelancer_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    escrow_status: normalizeEscrowStatus(row.escrow_status),
    fulfillment_type: normalizeFulfillmentType(row.fulfillment_type),
    customerName: buildProfileName(row.customer, "Customer"),
    totalLabel: formatPeso(row.total_price),
    freelancerNetLabel: formatPeso(row.freelancer_net || 0),
    createdAtLabel: formatDate(row.created_at),
  }));
}

export async function fetchFreelancerPayoutMethod() {
  const profile = await getSignedInProfile();
  const { data, error } = await supabase
    .from("freelancer_payout_methods")
    .select("payout_method, account_name, account_reference")
    .eq("freelancer_id", profile.id)
    .maybeSingle();

  if (error) throw error;
  return normalizePayoutMethod(data);
}

export async function saveFreelancerPayoutMethod(values) {
  const profile = await getSignedInProfile();
  const payoutMethod = normalizeText(values?.payoutMethod);
  const accountName = normalizeText(values?.accountName);
  const accountReference = normalizeText(values?.accountReference);

  if (!payoutMethod) throw new Error("Choose a payout method.");
  if (!accountName) throw new Error("Add the account name.");
  if (!accountReference) throw new Error("Add the payout account reference.");

  const { data, error } = await supabase
    .from("freelancer_payout_methods")
    .upsert(
      [
        {
          freelancer_id: profile.id,
          payout_method: payoutMethod,
          account_name: accountName,
          account_reference: accountReference,
        },
      ],
      { onConflict: "freelancer_id" }
    )
    .select("payout_method, account_name, account_reference")
    .single();

  if (error) throw error;
  return normalizePayoutMethod(data);
}

export function useCustomerRequestDetail(requestId) {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextRequest = await fetchCustomerRequestDetail(requestId);
      setRequest(nextRequest);
    } catch (nextError) {
      setRequest(null);
      setError(
        friendlyWorkflowMessage(nextError, "We couldn't open this request.")
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setRequest(null);
      return;
    }
    load();
  }, [load, requestId]);

  return {
    loading,
    request,
    error,
    reload: load,
  };
}

export function useFreelancerOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [payoutMethod, setPayoutMethod] = useState(normalizePayoutMethod(null));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [nextOrders, nextPayoutMethod] = await Promise.all([
        listFreelancerOrders(),
        fetchFreelancerPayoutMethod().catch(() => normalizePayoutMethod(null)),
      ]);

      setOrders(nextOrders);
      setPayoutMethod(nextPayoutMethod);
    } catch (nextError) {
      setOrders([]);
      setPayoutMethod(normalizePayoutMethod(null));
      setError(
        friendlyWorkflowMessage(nextError, "We couldn't load your freelancer orders.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const held = orders
      .filter((order) => normalizeEscrowStatus(order.escrow_status) === "held")
      .reduce((sum, order) => sum + Number(order.freelancer_net || 0), 0);
    const pendingRelease = orders
      .filter((order) => normalizeEscrowStatus(order.escrow_status) === "pending_release")
      .reduce((sum, order) => sum + Number(order.freelancer_net || 0), 0);
    const released = orders
      .filter((order) => normalizeEscrowStatus(order.escrow_status) === "released")
      .reduce((sum, order) => sum + Number(order.freelancer_net || 0), 0);
    const blocked = orders
      .filter((order) =>
        ["blocked", "failed"].includes(normalizeEscrowStatus(order.escrow_status))
      )
      .reduce((sum, order) => sum + Number(order.freelancer_net || 0), 0);

    return {
      held,
      heldLabel: formatPeso(held),
      pendingRelease,
      pendingReleaseLabel: formatPeso(pendingRelease),
      released,
      releasedLabel: formatPeso(released),
      blocked,
      blockedLabel: formatPeso(blocked),
      totalLabel: formatPeso(held + pendingRelease + released + blocked),
      activeCount: orders.filter((order) => ["pending", "active"].includes(order.status)).length,
      completedCount: orders.filter((order) => order.status === "completed").length,
    };
  }, [orders]);

  return {
    loading,
    orders,
    payoutMethod,
    summary,
    error,
    reload: load,
  };
}
