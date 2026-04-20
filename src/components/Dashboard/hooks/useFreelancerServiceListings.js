import { createClient } from "../../../lib/supabase/client";

const supabase = createClient();

export const SERVICE_MEDIA_BUCKET = "service-media";
export const SERVICE_MEDIA_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const SERVICE_MEDIA_ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
export const SERVICE_MEDIA_MAX_ITEMS = 7;
export const SERVICE_MEDIA_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const SERVICE_MEDIA_MAX_VIDEO_BYTES = 40 * 1024 * 1024;

const SERVICE_COLUMNS_BASE = `
  id,
  freelancer_id,
  title,
  category,
  description,
  fulfillment_type,
  location,
  listing_overview,
  listing_highlights,
  delivery_time_days,
  price,
  is_published,
  created_at
`;

const SERVICE_COLUMNS_WITH_UPDATED = `${SERVICE_COLUMNS_BASE},
  updated_at`;

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeFulfillmentType(value) {
  return String(value || "").trim().toLowerCase() === "physical"
    ? "physical"
    : "digital";
}

function sanitizeFileName(name) {
  return String(name || "media")
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
    default:
      return "jpg";
  }
}

function getMediaKind(file) {
  if (file?.kind) return file.kind;
  return String(file?.type || "").startsWith("video/") ? "video" : "image";
}

function isMissingColumnError(error) {
  const message = String(error?.message || "");
  return error?.code === "42703" || /column .* does not exist/i.test(message);
}

function isMissingTableError(error) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || /relation .* does not exist/i.test(message);
}

function hasValidPayoutDestination(row) {
  return Boolean(
    normalizeText(row?.payout_method) &&
      normalizeText(row?.account_name) &&
      normalizeText(row?.account_reference)
  );
}

function getPublicServiceMediaUrl(path) {
  if (!path) return "";
  const { data } = supabase.storage.from(SERVICE_MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

function normalizePackage(item, index, fallbackIncludedItems = []) {
  const includedItems = Array.isArray(item?.includedItems)
    ? item.includedItems
    : Array.isArray(item?.included_items)
      ? item.included_items
      : fallbackIncludedItems;

  return {
    id: item?.id || null,
    name: normalizeText(item?.name || item?.package_name) || `Package ${index + 1}`,
    summary: normalizeText(item?.summary || item?.package_summary),
    price: Number(item?.price || 0),
    deliveryTimeDays: Number(item?.deliveryTimeDays || item?.delivery_time_days || 0),
    revisions: null,
    includedItems: Array.isArray(includedItems)
      ? includedItems.map((entry) => normalizeText(entry)).filter(Boolean)
      : [],
  };
}

function buildServicePayload({
  freelancerId,
  title,
  category,
  fulfillmentType,
  description,
  location,
  highlights,
  packages,
  publish,
}) {
  const validPackages = packages
    .map((item, index) => normalizePackage(item, index, highlights))
    .filter((item) => Number.isFinite(item.price) && item.price > 0);
  const sortedPrices = validPackages.map((item) => item.price).sort((a, b) => a - b);
  const sortedDelivery = validPackages
    .map((item) => item.deliveryTimeDays)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  return {
    base: {
      freelancer_id: freelancerId,
      title,
      category,
      description,
      fulfillment_type: fulfillmentType,
      location,
      price: sortedPrices[0] || 0,
      is_published: Boolean(publish),
    },
    extended: {
      freelancer_id: freelancerId,
      title,
      category,
      description,
      fulfillment_type: fulfillmentType,
      location,
      price: sortedPrices[0] || 0,
      is_published: Boolean(publish),
      listing_overview: description,
      listing_highlights: highlights,
      delivery_time_days: sortedDelivery[0] || null,
      revisions: null,
    },
    packages: validPackages,
  };
}

async function getSignedInFreelancerId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("You need to be signed in before managing listings.");
  }

  return session.user.id;
}

async function ensureFreelancerPayoutDestinationReady(freelancerId) {
  const { data, error } = await supabase
    .from("freelancer_payout_methods")
    .select("payout_method, account_name, account_reference")
    .eq("freelancer_id", freelancerId)
    .maybeSingle();

  if (error) throw error;

  if (!hasValidPayoutDestination(data)) {
    throw new Error(
      "Add your payout destination in Settings before publishing service listings."
    );
  }
}

async function fetchOwnedServices(freelancerId, listingId = "") {
  const queryBase = supabase
    .from("services")
    .select(SERVICE_COLUMNS_WITH_UPDATED)
    .eq("freelancer_id", freelancerId);

  const query = listingId
    ? queryBase.eq("id", listingId)
    : queryBase.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    if (!isMissingColumnError(error)) throw error;

    const fallbackBase = supabase
      .from("services")
      .select(SERVICE_COLUMNS_BASE)
      .eq("freelancer_id", freelancerId);

    const fallback = listingId
      ? fallbackBase.eq("id", listingId)
      : fallbackBase.order("created_at", { ascending: false });

    const fallbackResult = await fallback;
    if (fallbackResult.error) throw fallbackResult.error;
    return fallbackResult.data || [];
  }

  return data || [];
}

async function fetchServicePackages(serviceIds) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) return [];

  const { data, error } = await supabase
    .from("service_packages")
    .select(
      "id, service_id, sort_order, package_name, package_summary, price, delivery_time_days, revisions, included_items"
    )
    .in("service_id", serviceIds)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchServiceMedia(serviceIds) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) return [];

  const { data, error } = await supabase
    .from("service_media")
    .select(
      "id, service_id, freelancer_id, bucket_path, media_kind, mime_type, original_name, sort_order, is_cover, created_at"
    )
    .in("service_id", serviceIds)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
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

async function uploadNewMediaItem({ freelancerId, serviceId, item, sortOrder, isCover }) {
  const file = item.file;
  const extension = getFileExtension(file);
  const safeName = sanitizeFileName(file.name);
  const bucketPath = `${freelancerId}/${serviceId}/${sortOrder}-${Date.now()}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(SERVICE_MEDIA_BUCKET)
    .upload(bucketPath, file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  const insertRow = {
    service_id: serviceId,
    freelancer_id: freelancerId,
    bucket_path: bucketPath,
    media_kind: getMediaKind(item),
    mime_type: normalizeText(file.type) || "application/octet-stream",
    original_name: normalizeText(file.name) || `media-${sortOrder}`,
    sort_order: sortOrder,
    is_cover: Boolean(isCover),
  };

  const { error: insertError } = await supabase.from("service_media").insert(insertRow);

  if (insertError) {
    await supabase.storage.from(SERVICE_MEDIA_BUCKET).remove([bucketPath]);
    throw insertError;
  }
}

async function syncServiceMedia({ freelancerId, serviceId, mediaItems }) {
  const { data: existingRows, error: fetchError } = await supabase
    .from("service_media")
    .select("id, bucket_path")
    .eq("service_id", serviceId)
    .eq("freelancer_id", freelancerId);

  if (fetchError) throw fetchError;

  const existingMap = new Map((existingRows || []).map((row) => [row.id, row]));
  const keptExistingIds = new Set(
    mediaItems.filter((item) => item.existing && item.id).map((item) => item.id)
  );
  const removedRows = (existingRows || []).filter((row) => !keptExistingIds.has(row.id));

  if (removedRows.length > 0) {
    const removedIds = removedRows.map((row) => row.id);
    const removedPaths = removedRows.map((row) => row.bucket_path).filter(Boolean);

    const { error: deleteRowsError } = await supabase
      .from("service_media")
      .delete()
      .in("id", removedIds);

    if (deleteRowsError) throw deleteRowsError;

    if (removedPaths.length > 0) {
      await supabase.storage.from(SERVICE_MEDIA_BUCKET).remove(removedPaths);
    }
  }

  for (let index = 0; index < mediaItems.length; index += 1) {
    const item = mediaItems[index];
    const sortOrder = index + 1;
    const isCover = index === 0;

    if (item.existing && item.id && existingMap.has(item.id)) {
      const { error: updateError } = await supabase
        .from("service_media")
        .update({
          sort_order: sortOrder,
          is_cover: isCover,
        })
        .eq("id", item.id)
        .eq("freelancer_id", freelancerId);

      if (updateError) throw updateError;
      continue;
    }

    if (item.file) {
      await uploadNewMediaItem({
        freelancerId,
        serviceId,
        item,
        sortOrder,
        isCover,
      });
    }
  }
}

function normalizeListingSummary(service, packageRows, mediaRows) {
  const normalizedPackages = (packageRows || []).map((item, index) =>
    normalizePackage(item, index, item.included_items || [])
  );
  const normalizedMedia = (mediaRows || []).map((item) => ({
    ...item,
    publicUrl: getPublicServiceMediaUrl(item.bucket_path),
  }));
  const previewMedia = normalizedMedia.find((item) => item.is_cover) || normalizedMedia[0] || null;
  const startingPrice =
    normalizedPackages.length > 0
      ? Math.min(...normalizedPackages.map((item) => Number(item.price || 0)).filter((value) => value > 0))
      : Number(service.price || 0);

  return {
    ...service,
    fulfillment_type: normalizeFulfillmentType(service.fulfillment_type),
    updated_at: service.updated_at || service.created_at || null,
    packageCount: normalizedPackages.length,
    startingPrice,
    previewMedia,
    packages: normalizedPackages,
    media: normalizedMedia,
  };
}

async function upsertServiceRow({ freelancerId, listingId, payload, publish }) {
  const timestamp = new Date().toISOString();

  if (listingId) {
    const updatePayload = {
      ...payload.extended,
      is_published: Boolean(publish),
      updated_at: timestamp,
    };

    const { data, error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", listingId)
      .eq("freelancer_id", freelancerId)
      .select(SERVICE_COLUMNS_WITH_UPDATED)
      .single();

    if (error) {
      if (!isMissingColumnError(error)) throw error;

      const fallback = await supabase
        .from("services")
        .update({
          ...payload.base,
          is_published: Boolean(publish),
        })
        .eq("id", listingId)
        .eq("freelancer_id", freelancerId)
        .select(SERVICE_COLUMNS_BASE)
        .single();

      if (fallback.error) throw fallback.error;
      return fallback.data;
    }

    return data;
  }

  const insertPayload = {
    ...payload.extended,
    is_published: Boolean(publish),
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { data, error } = await supabase
    .from("services")
    .insert(insertPayload)
    .select(SERVICE_COLUMNS_WITH_UPDATED)
    .single();

  if (error) {
    if (!isMissingColumnError(error)) throw error;

    const fallback = await supabase
      .from("services")
      .insert({
        ...payload.base,
        is_published: Boolean(publish),
      })
      .select(SERVICE_COLUMNS_BASE)
      .single();

    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  return data;
}

export async function listFreelancerServiceListings() {
  const freelancerId = await getSignedInFreelancerId();
  const services = await fetchOwnedServices(freelancerId);
  const serviceIds = services.map((item) => item.id).filter(Boolean);

  const [packageRows, mediaRows] = await Promise.all([
    fetchServicePackages(serviceIds),
    fetchServiceMedia(serviceIds),
  ]);

  const packageMap = groupBy(packageRows, "service_id");
  const mediaMap = groupBy(mediaRows, "service_id");

  return services.map((service) =>
    normalizeListingSummary(
      service,
      packageMap.get(service.id) || [],
      mediaMap.get(service.id) || []
    )
  );
}

export async function fetchFreelancerListingForEdit(listingId) {
  const freelancerId = await getSignedInFreelancerId();
  const services = await fetchOwnedServices(freelancerId, listingId);
  const service = services[0];

  if (!service) {
    throw new Error("We couldn't find that listing.");
  }

  const [packageRows, mediaRows] = await Promise.all([
    fetchServicePackages([service.id]),
    fetchServiceMedia([service.id]),
  ]);

  return normalizeListingSummary(service, packageRows, mediaRows);
}

export async function saveFreelancerServiceListing({
  listingId = "",
  title,
  category,
  fulfillmentType = "digital",
  description,
  location,
  highlights = [],
  packages = [],
  mediaItems = [],
  publish = true,
}) {
  const freelancerId = await getSignedInFreelancerId();
  const normalizedTitle = normalizeText(title);
  const normalizedCategory = normalizeText(category);
  const normalizedFulfillmentType = normalizeFulfillmentType(fulfillmentType);
  const normalizedDescription = normalizeText(description);
  const normalizedLocation = normalizeText(location);
  const normalizedHighlights = Array.isArray(highlights)
    ? highlights.map(normalizeText).filter(Boolean)
    : [];

  if (!normalizedTitle) throw new Error("Please add a title for your listing.");
  if (!normalizedCategory) throw new Error("Please choose a category.");
  if (!["digital", "physical"].includes(normalizedFulfillmentType)) {
    throw new Error("Choose how this listing will be fulfilled.");
  }
  if (!normalizedDescription) throw new Error("Please add an overview for your listing.");
  if (!normalizedLocation) throw new Error("Please add your location.");

  const payload = buildServicePayload({
    freelancerId,
    title: normalizedTitle,
    category: normalizedCategory,
    fulfillmentType: normalizedFulfillmentType,
    description: normalizedDescription,
    location: normalizedLocation,
    highlights: normalizedHighlights,
    packages,
    publish,
  });

  if (payload.packages.length === 0) {
    throw new Error("Add at least one package with a valid price.");
  }

  if (publish) {
    await ensureFreelancerPayoutDestinationReady(freelancerId);
  }

  let serviceRow = null;
  const isEditing = Boolean(listingId);

  try {
    serviceRow = await upsertServiceRow({
      freelancerId,
      listingId,
      payload,
      publish,
    });

    const { error: deletePackageError } = await supabase
      .from("service_packages")
      .delete()
      .eq("service_id", serviceRow.id);

    if (deletePackageError) throw deletePackageError;

    const packageRows = payload.packages.map((item, index) => ({
      service_id: serviceRow.id,
      sort_order: index + 1,
      package_name: item.name,
      package_summary: item.summary || null,
      price: item.price,
      delivery_time_days: item.deliveryTimeDays || null,
      revisions: null,
      included_items:
        item.includedItems.length > 0 ? item.includedItems : normalizedHighlights,
    }));

    const { error: packageError } = await supabase
      .from("service_packages")
      .insert(packageRows);

    if (packageError) throw packageError;

    await syncServiceMedia({
      freelancerId,
      serviceId: serviceRow.id,
      mediaItems,
    });

    return serviceRow;
  } catch (error) {
    if (!isEditing && serviceRow?.id && !isMissingTableError(error)) {
      await supabase.from("services").delete().eq("id", serviceRow.id);
    }

    if (isMissingTableError(error) || isMissingColumnError(error)) {
      throw new Error(
        "Run the latest listing package snapshot SQL before publishing or editing marketplace listings."
      );
    }

    throw new Error(
      String(error?.message || "We couldn't save your listing right now.")
    );
  }
}

export async function createFreelancerServiceListing(input) {
  return saveFreelancerServiceListing(input);
}

export async function setFreelancerListingPublished(listingId, publish = true) {
  const freelancerId = await getSignedInFreelancerId();
  const timestamp = new Date().toISOString();

  if (publish) {
    await ensureFreelancerPayoutDestinationReady(freelancerId);
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      is_published: Boolean(publish),
      updated_at: timestamp,
    })
    .eq("id", listingId)
    .eq("freelancer_id", freelancerId)
    .select("id, is_published")
    .single();

  if (error) {
    if (!isMissingColumnError(error)) {
      throw new Error(
        String(error?.message || "We couldn't update this listing right now.")
      );
    }

    const fallback = await supabase
      .from("services")
      .update({
        is_published: Boolean(publish),
      })
      .eq("id", listingId)
      .eq("freelancer_id", freelancerId)
      .select("id, is_published")
      .single();

    if (fallback.error) {
      throw new Error(
        String(
          fallback.error?.message || "We couldn't update this listing right now."
        )
      );
    }

    return fallback.data;
  }

  return data;
}

export async function deleteFreelancerDraft(listingId) {
  const freelancerId = await getSignedInFreelancerId();

  const { data: mediaRows, error: mediaError } = await supabase
    .from("service_media")
    .select("id, bucket_path")
    .eq("service_id", listingId)
    .eq("freelancer_id", freelancerId);

  if (mediaError && !isMissingTableError(mediaError)) {
    throw new Error(
      String(mediaError?.message || "We couldn't delete this draft right now.")
    );
  }

  const mediaPaths = (mediaRows || []).map((row) => row.bucket_path).filter(Boolean);
  if (mediaPaths.length > 0) {
    await supabase.storage.from(SERVICE_MEDIA_BUCKET).remove(mediaPaths);
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", listingId)
    .eq("freelancer_id", freelancerId)
    .eq("is_published", false);

  if (error) {
    throw new Error(
      String(error?.message || "We couldn't delete this draft right now.")
    );
  }

  return true;
}
