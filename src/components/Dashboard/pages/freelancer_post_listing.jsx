import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
import { LoaderCircle } from "lucide-react";
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
import { ALL_SERVICE_CATEGORIES } from "../../../lib/serviceCategories";
import {
  buildPhilippinesLocationLabel,
  coercePhilippinesLocation,
  getCitiesByRegion,
  PH_REGION_OPTIONS,
} from "../../../lib/phLocations";
import SearchableCombobox from "../../Shared/searchable_combobox";
import {
  fetchFreelancerListingForEdit,
  saveFreelancerServiceListing,
  SERVICE_MEDIA_ACCEPTED_IMAGE_TYPES,
  SERVICE_MEDIA_ACCEPTED_VIDEO_TYPES,
  SERVICE_MEDIA_MAX_IMAGE_BYTES,
  SERVICE_MEDIA_MAX_ITEMS,
  SERVICE_MEDIA_MAX_VIDEO_BYTES,
} from "../hooks/useFreelancerServiceListings";
import { fetchFreelancerPayoutMethod } from "../hooks/useMarketplaceWorkflow";

const INITIAL_PACKAGES = [
  { id: null, name: "Basic", summary: "", price: "", deliveryTimeDays: "" },
  { id: null, name: "Standard", summary: "", price: "", deliveryTimeDays: "" },
  { id: null, name: "Premium", summary: "", price: "", deliveryTimeDays: "" },
];

const FULFILLMENT_OPTIONS = [
  { value: "digital", label: "Digital delivery" },
  { value: "physical", label: "Physical shipment" },
];

function buildMediaError(file) {
  const isVideo = String(file?.type || "").startsWith("video/");
  if (file.size > (isVideo ? SERVICE_MEDIA_MAX_VIDEO_BYTES : SERVICE_MEDIA_MAX_IMAGE_BYTES)) {
    return isVideo
      ? "Videos must be 40 MB or smaller."
      : "Images must be 8 MB or smaller.";
  }
  return "Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are supported.";
}

function normalizePackagesForForm(packages = []) {
  if (!Array.isArray(packages) || packages.length === 0) {
    return INITIAL_PACKAGES;
  }

  return packages.map((item, index) => ({
    id: item.id || null,
    name: item.name || `Package ${index + 1}`,
    summary: item.summary || "",
    price: item.price ?? "",
    deliveryTimeDays: item.deliveryTimeDays ?? "",
  }));
}

function deriveListingLocationParts(location = "") {
  const [city = "", region = ""] = String(location || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return coercePhilippinesLocation({ region, city });
}

export default function FreelancerPostListing() {
  const navigate = useNavigate();
  const uploadRef = useRef(null);
  const mediaItemsRef = useRef([]);
  const { listingId = "" } = useParams();
  const isEditMode = Boolean(listingId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("digital");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [packages, setPackages] = useState(INITIAL_PACKAGES);
  const [mediaItems, setMediaItems] = useState([]);
  const [submittingMode, setSubmittingMode] = useState("");
  const [error, setError] = useState("");
  const [loadingListing, setLoadingListing] = useState(isEditMode);
  const [listingPublished, setListingPublished] = useState(false);
  const [payoutReady, setPayoutReady] = useState(true);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(() => {
    return () => {
      mediaItemsRef.current.forEach((item) => {
        if (!item.existing && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadListing() {
      if (!isEditMode) {
        setLoadingListing(false);
        return;
      }

      setLoadingListing(true);
      setError("");

      try {
        const listing = await fetchFreelancerListingForEdit(listingId);
        if (!active) return;

        setTitle(listing.title || "");
        setCategory(listing.category || "");
        setFulfillmentType(listing.fulfillment_type || "digital");
        const locationParts = deriveListingLocationParts(listing.location);
        setRegion(locationParts.region);
        setCity(locationParts.city);
        setDescription(listing.listing_overview || listing.description || "");
        setHighlightsText(
          Array.isArray(listing.listing_highlights)
            ? listing.listing_highlights.filter(Boolean).join("\n")
            : ""
        );
        setPackages(normalizePackagesForForm(listing.packages));
        setMediaItems(
          Array.isArray(listing.media)
            ? listing.media.map((item) => ({
                id: item.id,
                existing: true,
                kind: item.media_kind,
                previewUrl: item.publicUrl,
                originalName: item.original_name,
                isCover: Boolean(item.is_cover),
              }))
            : []
        );
        setListingPublished(Boolean(listing.is_published));
      } catch (nextError) {
        if (!active) return;
        setError(
          String(nextError?.message || "We couldn't load this listing right now.")
        );
      } finally {
        if (active) setLoadingListing(false);
      }
    }

    loadListing();

    return () => {
      active = false;
    };
  }, [isEditMode, listingId]);

  useEffect(() => {
    let active = true;

    fetchFreelancerPayoutMethod()
      .then((method) => {
        if (!active) return;
        const ready = Boolean(
          String(method?.payoutMethod || "").trim() &&
            String(method?.accountName || "").trim() &&
            String(method?.accountReference || "").trim()
        );
        setPayoutReady(ready);
      })
      .catch(() => {
        if (active) setPayoutReady(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const highlights = useMemo(
    () =>
      highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [highlightsText]
  );
  const cityOptions = useMemo(() => getCitiesByRegion(region), [region]);

  const updatePackage = (index, field, value) => {
    setPackages((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeMedia = (id) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && !target.existing && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleMediaPicked = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const next = [];
    const remainingSlots = SERVICE_MEDIA_MAX_ITEMS - mediaItems.length;

    for (const file of files.slice(0, Math.max(remainingSlots, 0))) {
      const isImage = SERVICE_MEDIA_ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = SERVICE_MEDIA_ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        setError(buildMediaError(file));
        continue;
      }

      if (
        (isImage && file.size > SERVICE_MEDIA_MAX_IMAGE_BYTES) ||
        (isVideo && file.size > SERVICE_MEDIA_MAX_VIDEO_BYTES)
      ) {
        setError(buildMediaError(file));
        continue;
      }

      next.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
        existing: false,
        file,
        kind: isVideo ? "video" : "image",
        originalName: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (next.length > 0) {
      setMediaItems((prev) => [...prev, ...next].slice(0, SERVICE_MEDIA_MAX_ITEMS));
      setError("");
    }

    event.target.value = "";
  };

  const handleSubmit = async (mode) => {
    if (submittingMode) return;

    const publish = listingPublished ? true : mode === "publish";

    try {
      setSubmittingMode(mode);
      setError("");
      const normalizedLocation = coercePhilippinesLocation({ region, city });
      const listingLocation = buildPhilippinesLocationLabel(normalizedLocation);
      if (!normalizedLocation.region || !normalizedLocation.city) {
        throw new Error("Please choose your region and city.");
      }

      const savedListing = await saveFreelancerServiceListing({
        listingId,
        title,
        category,
        fulfillmentType,
        description,
        location: listingLocation,
        highlights,
        packages,
        mediaItems: mediaItems.map((item) =>
          item.existing
            ? {
                id: item.id,
                existing: true,
                kind: item.kind,
              }
            : {
                file: item.file,
                kind: item.kind,
              }
        ),
        publish,
      });

      navigate("/dashboard/freelancer/listings", {
        state: {
          listingSavedTitle: savedListing.title,
        },
      });
    } catch (nextError) {
      const message = String(
        nextError?.message || "We couldn't save your listing right now."
      );
      if (/payout destination/i.test(message)) {
        setPayoutReady(false);
      }
      setError(message);
    } finally {
      setSubmittingMode("");
    }
  };

  const pageTitle = isEditMode ? "Edit listing" : "Post a listing";
  const subText = isEditMode
    ? "Update your packages, media, and overview in one place before customers see the latest version."
    : "Build your listing with packages, media, and clear delivery details so customers can book with confidence.";

  const showDraftActions = !listingPublished;
  const publishDisabled = (!listingPublished && !payoutReady) || Boolean(submittingMode) || loadingListing;

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerMarketplacePage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "My Listings", to: "/dashboard/freelancer/listings" },
            { label: pageTitle },
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
                  <TypewriterHeading text={pageTitle} />
                </h1>
                <Motion.svg
                  className="freelancerMarketplaceHero__line"
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

              <p className="freelancerMarketplaceHero__sub">{subText}</p>
          </div>

          <div className="freelancerListingActions">
              {showDraftActions ? (
                <Motion.button
                  type="button"
                  className="freelancerListingActionBtn--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={() => handleSubmit("draft")}
                  disabled={Boolean(submittingMode) || loadingListing}
                >
                  {submittingMode === "draft" ? (
                    <>
                      <LoaderCircle className="freelancerListingSpinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save draft</span>
                  )}
                </Motion.button>
              ) : (
                <Motion.button
                  type="button"
                  className="freelancerListingActionBtn--ghost"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={() => navigate("/dashboard/freelancer/listings")}
                  disabled={Boolean(submittingMode)}
                >
                  Back to listings
                </Motion.button>
              )}

              <Motion.button
                type="button"
                className="freelancerListingActionBtn"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => handleSubmit(showDraftActions ? "publish" : "save")}
                disabled={publishDisabled}
              >
                {submittingMode === "publish" || submittingMode === "save" ? (
                  <>
                    <LoaderCircle className="freelancerListingSpinner" />
                    <span>{listingPublished ? "Saving..." : "Publishing..."}</span>
                  </>
                ) : (
                  <span>{listingPublished ? "Save changes" : "Publish listing"}</span>
                )}
              </Motion.button>
            </div>
          </div>
        </section>
      </Reveal>

      {!payoutReady ? (
        <Reveal delay={0.06}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">
                Add your payout destination before publishing
              </h2>
              <p className="profileNotice__desc">
                You can still build and save drafts, but listing publication stays locked until your payout method is complete in Settings.
              </p>
            </div>
            <div className="workflowActions">
              <Motion.button
                type="button"
                className="workflowActionBtn workflowActionBtn--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/settings")}
              >
                Open settings
              </Motion.button>
            </div>
          </section>
        </Reveal>
      ) : null}

      {error && (!isEditMode || title) ? (
        <Reveal delay={0.07}>
          <p className="freelancerListingInputError freelancerListingInputError--surface">
            {error}
          </p>
        </Reveal>
      ) : null}

      {loadingListing ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="freelancerRequestDetailCard" style={{ minHeight: 360 }} />
          </section>
        </Reveal>
      ) : error && isEditMode && !title ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't open this listing"
              description={error}
              actionLabel="Back to listings"
              onAction={() => navigate("/dashboard/freelancer/listings")}
              className="freelancerListingEmpty"
            />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <div className="freelancerListingForm">
            <section className="profileSection">
              <div className="freelancerListingSection__head">
                <div>
                  <h2 className="freelancerListingSection__title">Core details</h2>
                  <p className="profileSection__sub">
                    Set the main information customers will use to understand this listing.
                  </p>
                </div>
              </div>

              <div className="freelancerListingGrid">
                <label className="freelancerListingField freelancerListingField--wide">
                  <span className="freelancerListingField__label">Title</span>
                  <input
                    className="freelancerListingField__input"
                    type="text"
                    maxLength={120}
                    placeholder="Example: Custom crochet bouquet with gift-ready packaging"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>

                <label className="freelancerListingField">
                  <span className="freelancerListingField__label">Category</span>
                  <SearchableCombobox
                    value={category}
                    onSelect={setCategory}
                    options={ALL_SERVICE_CATEGORIES}
                    placeholder="Choose a category"
                    searchHint="Browse categories"
                    noResultsText="No categories found"
                    ariaLabel="Choose listing category"
                  />
                </label>

                <label className="freelancerListingField">
                  <span className="freelancerListingField__label">Region</span>
                  <SearchableCombobox
                    value={region}
                    onSelect={(nextRegion) => {
                      setRegion(nextRegion);
                      setCity("");
                    }}
                    options={PH_REGION_OPTIONS}
                    placeholder="Choose your region"
                    searchHint="Choose service region"
                    noResultsText="No regions found"
                    ariaLabel="Choose listing region"
                  />
                </label>

                <label className="freelancerListingField">
                  <span className="freelancerListingField__label">City</span>
                  <SearchableCombobox
                    value={city}
                    onSelect={setCity}
                    options={cityOptions}
                    placeholder={region ? "Choose your city" : "Choose a region first"}
                    searchHint="Choose service city"
                    noResultsText="No cities found"
                    ariaLabel="Choose listing city"
                    disabled={!region}
                  />
                </label>

                <label className="freelancerListingField">
                  <span className="freelancerListingField__label">Fulfillment</span>
                  <SearchableCombobox
                    value={FULFILLMENT_OPTIONS.find((item) => item.value === fulfillmentType)?.label || ""}
                    onSelect={(nextLabel) => {
                      const nextOption = FULFILLMENT_OPTIONS.find(
                        (item) => item.label === nextLabel
                      );
                      setFulfillmentType(nextOption?.value || "digital");
                    }}
                    options={FULFILLMENT_OPTIONS.map((item) => item.label)}
                    placeholder="Choose fulfillment type"
                    searchHint="Choose fulfillment type"
                    noResultsText="No fulfillment types found"
                    ariaLabel="Choose fulfillment type"
                  />
                </label>

                <label className="freelancerListingField freelancerListingField--wide">
                  <span className="freelancerListingField__label">Overview</span>
                  <textarea
                    className="freelancerListingField__textarea"
                    placeholder="Describe the work, the style customers can expect, and how you usually deliver it."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

                <label className="freelancerListingField freelancerListingField--wide">
                  <span className="freelancerListingField__label">What's included</span>
                  <textarea
                    className="freelancerListingField__textarea"
                    placeholder={"One point per line\nExample: Gift-ready wrapping\nExample: Progress photos before final handoff"}
                    value={highlightsText}
                    onChange={(event) => setHighlightsText(event.target.value)}
                  />
                  <p className="freelancerListingField__hint">
                    These lines become the highlights customers see across your listing and packages.
                  </p>
                </label>

                <div className="freelancerListingField freelancerListingField--wide">
                  <span className="freelancerListingField__label">Order handoff</span>
                  <p className="freelancerListingField__hint">
                    {fulfillmentType === "physical"
                      ? "Customers will expect shipment details like courier name and tracking reference before they confirm receipt."
                      : "Customers will expect a structured digital delivery with a delivery note and a deliverable link before they confirm receipt."}
                  </p>
                </div>
              </div>
            </section>

            <section className="profileSection">
              <div className="freelancerListingSection__head">
                <div>
                  <h2 className="freelancerListingSection__title">Pricing and delivery</h2>
                  <p className="profileSection__sub">
                    Shape the package options and delivery timing customers can choose from.
                  </p>
                </div>
              </div>

              <div className="freelancerListingPackages">
                {packages.map((item, index) => (
                  <article key={`${item.name}-${index}`} className="freelancerListingPackageCard">
                    <h3 className="freelancerListingPackageCard__title">{item.name}</h3>

                    <label className="freelancerListingField">
                      <span className="freelancerListingField__label">Package summary</span>
                      <input
                        className="freelancerListingField__input"
                        type="text"
                        placeholder="What this package covers"
                        value={item.summary}
                        onChange={(event) =>
                          updatePackage(index, "summary", event.target.value)
                        }
                      />
                    </label>

                    <label className="freelancerListingField">
                      <span className="freelancerListingField__label">Price</span>
                      <input
                        className="freelancerListingField__input"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="1500"
                        value={item.price}
                        onChange={(event) =>
                          updatePackage(index, "price", event.target.value)
                        }
                      />
                    </label>

                    <label className="freelancerListingField">
                      <span className="freelancerListingField__label">Delivery time in days</span>
                      <input
                        className="freelancerListingField__input"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="7"
                        value={item.deliveryTimeDays}
                        onChange={(event) =>
                          updatePackage(index, "deliveryTimeDays", event.target.value)
                        }
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="profileSection">
              <div className="freelancerListingSection__head">
                <div>
                  <h2 className="freelancerListingSection__title">Cover and gallery</h2>
                  <p className="profileSection__sub">
                    Add the media customers will see first when they open this listing.
                  </p>
                </div>
              </div>

              <input
                ref={uploadRef}
                type="file"
                hidden
                multiple
                accept={[...SERVICE_MEDIA_ACCEPTED_IMAGE_TYPES, ...SERVICE_MEDIA_ACCEPTED_VIDEO_TYPES].join(",")}
                onChange={handleMediaPicked}
              />

              <Motion.button
                type="button"
                className="freelancerListingUpload__button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => uploadRef.current?.click()}
              >
                Add cover or gallery media
              </Motion.button>

              {mediaItems.length === 0 ? (
                <EmptySurface
                  hideIcon
                  title="No media added yet"
                  actionLabel="Add media"
                  onAction={() => uploadRef.current?.click()}
                  className="freelancerListingEmpty"
                />
              ) : (
                <AnimatePresence>
                  <Motion.div
                    className="freelancerListingMediaGrid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {mediaItems.map((item, index) => (
                      <Motion.article
                        key={item.id}
                        className="freelancerListingMediaCard"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="freelancerListingMediaCard__preview">
                          {item.kind === "video" ? (
                            <video src={item.previewUrl} muted playsInline />
                          ) : (
                            <img src={item.previewUrl} alt={item.originalName} />
                          )}
                        </div>

                        <div className="freelancerListingMediaCard__body">
                          <strong className="freelancerListingMediaCard__name">
                            {item.originalName}
                          </strong>
                          <span className="freelancerListingMediaCard__meta">
                            {index === 0 ? "Cover media" : "Gallery media"}
                          </span>
                          <button
                            type="button"
                            className="freelancerListingMediaCard__remove"
                            onClick={() => removeMedia(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </Motion.article>
                    ))}
                  </Motion.div>
                </AnimatePresence>
              )}
            </section>
          </div>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
