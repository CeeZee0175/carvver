import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import "./profile.css";
import "./post_request.css";
import {
  createCustomerRequest,
  REQUEST_CATEGORY_OPTIONS,
  REQUEST_MEDIA_ACCEPTED_IMAGE_TYPES,
  REQUEST_MEDIA_ACCEPTED_VIDEO_TYPES,
  REQUEST_MEDIA_MAX_IMAGES,
  REQUEST_MEDIA_MAX_IMAGE_BYTES,
  REQUEST_MEDIA_MAX_VIDEO_BYTES,
  REQUEST_MEDIA_MAX_VIDEOS,
  REQUEST_TIMELINE_OPTIONS,
  useCustomerRequests,
} from "../hooks/useCustomerRequests";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";

const INITIAL_FORM = {
  title: "",
  category: "",
  description: "",
  budgetAmount: "",
  location: "",
  timeline: "Flexible",
};

function buildAttachmentErrorMessage(file) {
  const isVideo = String(file?.type || "").startsWith("video/");
  const tooLarge = file.size > (isVideo ? REQUEST_MEDIA_MAX_VIDEO_BYTES : REQUEST_MEDIA_MAX_IMAGE_BYTES);
  if (tooLarge) {
    return isVideo
      ? "Videos must be 40 MB or smaller."
      : "Images must be 8 MB or smaller.";
  }
  return "Only JPG, PNG, WEBP, MP4, WEBM, and MOV files are supported.";
}

export default function PostRequest() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const attachmentsRef = useRef([]);
  const { openCount } = useCustomerRequests({ limit: 2 });
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      attachmentsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    },
    []
  );

  const attachmentStats = useMemo(() => {
    const images = attachments.filter((item) => item.kind === "image").length;
    const videos = attachments.filter((item) => item.kind === "video").length;
    return { images, videos };
  }, [attachments]);

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleFilesPicked = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const nextItems = [];
    let nextImages = attachmentStats.images;
    let nextVideos = attachmentStats.videos;

    for (const file of files) {
      const isImage = REQUEST_MEDIA_ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = REQUEST_MEDIA_ACCEPTED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        setError(buildAttachmentErrorMessage(file));
        continue;
      }

      if (isImage && nextImages >= REQUEST_MEDIA_MAX_IMAGES) {
        setError("You can upload up to 8 images only.");
        continue;
      }

      if (isVideo && nextVideos >= REQUEST_MEDIA_MAX_VIDEOS) {
        setError("You can upload only 1 video.");
        continue;
      }

      if (
        (isImage && file.size > REQUEST_MEDIA_MAX_IMAGE_BYTES) ||
        (isVideo && file.size > REQUEST_MEDIA_MAX_VIDEO_BYTES)
      ) {
        setError(buildAttachmentErrorMessage(file));
        continue;
      }

      nextItems.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind: isVideo ? "video" : "image",
        previewUrl: URL.createObjectURL(file),
      });

      if (isImage) nextImages += 1;
      if (isVideo) nextVideos += 1;
    }

    if (nextItems.length > 0) {
      setAttachments((prev) => [...prev, ...nextItems]);
      setError("");
    }

    event.target.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const title = formValues.title.trim();
    const category = formValues.category.trim();
    const description = formValues.description.trim();
    const timeline = formValues.timeline.trim();
    const budgetAmount = formValues.budgetAmount;

    if (!title) return void setError("Please add a short title for your request.");
    if (!category) return void setError("Please choose a category.");
    if (!description) return void setError("Please describe what you want clearly.");
    if (!timeline) return void setError("Please choose a timeline.");

    if (budgetAmount !== "") {
      const numericBudget = Number(budgetAmount);
      if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
        return void setError("Please enter a valid budget amount.");
      }
    }

    try {
      setSubmitting(true);
      setError("");
      const created = await createCustomerRequest({
        ...formValues,
        attachments: attachments.map((item) => item.file),
      });

      attachments.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setAttachments([]);

      navigate("/dashboard/customer", {
        state: {
          requestCreated: true,
          requestCreatedTitle: created.title,
        },
      });
    } catch (nextError) {
      setError(
        String(nextError?.message || "We couldn't post your request. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerDashboardFrame mainClassName="profilePage requestPage">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Post a Request" }]} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="requestPage__hero">
          <div className="requestPage__heroCopy">
            <p className="requestPage__eyebrow">Customer Requests</p>
            <div className="requestPage__titleWrap">
              <h1 className="requestPage__title">
                <TypewriterHeading text="Post a Request" />
              </h1>
            </div>
            <p className="requestPage__sub">
              Write a clear brief, add optional photos or video if they help,
              and make it easy for freelancers to understand what you need.
            </p>
          </div>

          <div className="requestPage__stats">
            <div className="requestPage__stat">
              <span className="requestPage__statLabel">Open requests</span>
              <strong className="requestPage__statValue">{openCount}</strong>
            </div>
            <div className="requestPage__stat">
              <span className="requestPage__statLabel">Attachments</span>
              <strong className="requestPage__statValue">
                {attachmentStats.images + attachmentStats.videos}
              </strong>
              <span className="requestPage__statHint">
                {attachmentStats.images} image{attachmentStats.images === 1 ? "" : "s"} / {attachmentStats.videos} video
              </span>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <form className="requestComposer" onSubmit={handleSubmit} noValidate>
          <div className="requestComposer__head">
            <div>
              <p className="requestComposer__eyebrow">Request brief</p>
              <h2 className="requestComposer__title">Tell freelancers what you need</h2>
              <p className="requestComposer__desc">
                Keep the details clear and direct so the right freelancer can understand the work quickly.
              </p>
            </div>
            <motion.button
              type="button"
              className="requestComposer__backLink"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.985 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer")}
            >
              Back to dashboard
            </motion.button>
          </div>

          <div className="requestGrid">
            <label className="requestField requestField--full">
              <span className="requestField__label">Request title</span>
              <input
                className="requestField__input"
                type="text"
                maxLength={120}
                placeholder="Example: Need a logo for a handmade soap shop"
                value={formValues.title}
                onChange={(event) => updateField("title", event.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="requestField">
              <span className="requestField__label">Category</span>
              <select
                className="requestField__input requestField__select"
                value={formValues.category}
                onChange={(event) => updateField("category", event.target.value)}
                disabled={submitting}
              >
                <option value="">Choose a category</option>
                {REQUEST_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="requestField">
              <span className="requestField__label">Timeline</span>
              <select
                className="requestField__input requestField__select"
                value={formValues.timeline}
                onChange={(event) => updateField("timeline", event.target.value)}
                disabled={submitting}
              >
                {REQUEST_TIMELINE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="requestField">
              <span className="requestField__label">Budget amount</span>
              <input
                className="requestField__input"
                type="number"
                min="0"
                step="1"
                placeholder="Optional"
                value={formValues.budgetAmount}
                onChange={(event) => updateField("budgetAmount", event.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="requestField">
              <span className="requestField__label">Location</span>
              <input
                className="requestField__input"
                type="text"
                placeholder="Optional"
                value={formValues.location}
                onChange={(event) => updateField("location", event.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="requestField requestField--full">
              <span className="requestField__label">Description</span>
              <textarea
                className="requestField__input requestField__textarea"
                placeholder="Describe what you need, what style you prefer, and any details a freelancer should know first."
                value={formValues.description}
                onChange={(event) => updateField("description", event.target.value)}
                disabled={submitting}
              />
            </label>

            <div className="requestField requestField--full">
              <div className="requestField__labelRow">
                <span className="requestField__label">Photos or video (optional)</span>
                <span className="requestField__hint">
                  Up to 8 images and 1 video
                </span>
              </div>

              <div className="requestUpload">
                <input
                  ref={fileInputRef}
                  className="requestUpload__input"
                  type="file"
                  accept={[...REQUEST_MEDIA_ACCEPTED_IMAGE_TYPES, ...REQUEST_MEDIA_ACCEPTED_VIDEO_TYPES].join(",")}
                  multiple
                  onChange={handleFilesPicked}
                  disabled={submitting}
                />

                <motion.button
                  type="button"
                  className="requestUpload__button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.985 }}
                  transition={PROFILE_SPRING}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  Add photos or video
                </motion.button>

                <p className="requestUpload__copy">
                  Images can help with references, and a short video can help show movement or pacing.
                </p>
              </div>

              <AnimatePresence>
                {attachments.length > 0 ? (
                  <motion.div
                    className="requestMediaGrid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {attachments.map((item) => (
                      <motion.article
                        key={item.id}
                        className="requestMediaCard"
                        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="requestMediaCard__preview">
                          {item.kind === "video" ? (
                            <video
                              src={item.previewUrl}
                              className="requestMediaCard__video"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="requestMediaCard__image"
                            />
                          )}
                        </div>

                        <div className="requestMediaCard__copy">
                          <strong className="requestMediaCard__name">{item.file.name}</strong>
                          <span className="requestMediaCard__meta">
                            {item.kind === "video" ? "Video" : "Image"}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="requestMediaCard__remove"
                          onClick={() => removeAttachment(item.id)}
                          disabled={submitting}
                        >
                          Remove
                        </button>
                      </motion.article>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="requestComposer__footer">
            <p
              className={`requestComposer__feedback ${
                error ? "requestComposer__feedback--error" : ""
              }`}
              aria-live="polite"
            >
              {error || "Your request will appear on your dashboard after you post it."}
            </p>

            <motion.button
              type="submit"
              className="requestSubmitBtn"
              whileHover={submitting ? {} : { y: -1.5 }}
              whileTap={submitting ? {} : { scale: 0.985 }}
              transition={PROFILE_SPRING}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="requestSubmitBtn__spinner" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post request</span>
              )}
            </motion.button>
          </div>
        </form>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
