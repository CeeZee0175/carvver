import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import SearchableCombobox from "../../Shared/searchable_combobox";
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
} from "../hooks/useCustomerRequests";
import {
  buildPhilippinesLocationLabel,
  getCitiesByRegion,
  PH_REGION_OPTIONS,
} from "../../../lib/phLocations";
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
  region: "",
  city: "",
  timeline: "",
};

const CATEGORY_OPTIONS = [...REQUEST_CATEGORY_OPTIONS, "Other"];
const DEADLINE_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function createDateFromValue(value) {
  return new Date(`${value}T00:00:00`);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDeadlineValue(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(createDateFromValue(value));
  } catch {
    return value;
  }
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarDays(monthDate, minDateValue) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDay);
  const todayValue = getTodayDateValue();
  const selectedDays = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const value = formatDateKey(date);
    selectedDays.push({
      value,
      dateNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      isDisabled: value < minDateValue,
      isToday: value === todayValue,
    });
  }

  return selectedDays;
}

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
  const categoryWrapRef = useRef(null);
  const categoryButtonRef = useRef(null);
  const categoryOptionRefs = useRef([]);
  const deadlineWrapRef = useRef(null);
  const deadlineButtonRef = useRef(null);
  const categoryListId = useId();
  const deadlineGridId = useId();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryFocusIndex, setCategoryFocusIndex] = useState(-1);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialValue = INITIAL_FORM.timeline || getTodayDateValue();
    const initialDate = createDateFromValue(initialValue);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

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

  useEffect(() => {
    if (!categoryOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!categoryWrapRef.current?.contains(event.target)) {
        setCategoryOpen(false);
        setCategoryFocusIndex(-1);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCategoryOpen(false);
        setCategoryFocusIndex(-1);
        categoryButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryOpen]);

  useEffect(() => {
    if (!deadlineOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!deadlineWrapRef.current?.contains(event.target)) {
        setDeadlineOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDeadlineOpen(false);
        deadlineButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deadlineOpen]);

  useEffect(() => {
    if (!categoryOpen || categoryFocusIndex < 0) return;
    categoryOptionRefs.current[categoryFocusIndex]?.focus();
  }, [categoryOpen, categoryFocusIndex]);

  const attachmentStats = useMemo(() => {
    const images = attachments.filter((item) => item.kind === "image").length;
    const videos = attachments.filter((item) => item.kind === "video").length;
    return { images, videos };
  }, [attachments]);
  const cityOptions = useMemo(
    () => getCitiesByRegion(formValues.region),
    [formValues.region]
  );

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((option) => option === formValues.category) || "";
  const minimumDateValue = getTodayDateValue();
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, minimumDateValue),
    [minimumDateValue, visibleMonth]
  );

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
    const region = formValues.region.trim();
    const city = formValues.city.trim();
    const budgetAmount = formValues.budgetAmount;

    if (!title) return void setError("Please add a short title for your request.");
    if (!category) return void setError("Please choose a category.");
    if (!description) return void setError("Please describe what you want clearly.");
    if (!budgetAmount) return void setError("Please enter your budget amount.");
    if (!region) return void setError("Please choose your region.");
    if (!city) return void setError("Please choose your city.");
    if (!timeline) return void setError("Please choose a deadline date.");

    const numericBudget = Number(budgetAmount);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      return void setError("Please enter a valid budget amount.");
    }

    if (timeline < getTodayDateValue()) {
      return void setError("Please choose a deadline that is today or later.");
    }

    const location = buildPhilippinesLocationLabel({ region, city });

    try {
      setSubmitting(true);
      setError("");
      const created = await createCustomerRequest({
        ...formValues,
        location,
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

  const handleCategoryToggle = () => {
    setCategoryOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        const selectedIndex = Math.max(
          0,
          CATEGORY_OPTIONS.findIndex((option) => option === formValues.category)
        );
        setCategoryFocusIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setCategoryFocusIndex(-1);
      }
      return nextOpen;
    });
  };

  const handleCategorySelect = (value) => {
    updateField("category", value);
    setCategoryOpen(false);
    setCategoryFocusIndex(-1);
    categoryButtonRef.current?.focus();
  };

  const handleRegionSelect = (value) => {
    setFormValues((prev) => ({
      ...prev,
      region: value,
      city: value === prev.region ? prev.city : "",
    }));
    if (error) setError("");
  };

  const handleCitySelect = (value) => {
    updateField("city", value);
  };

  const handleCategoryTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!categoryOpen) {
        setCategoryOpen(true);
        const selectedIndex = CATEGORY_OPTIONS.findIndex(
          (option) => option === formValues.category
        );
        setCategoryFocusIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  const handleCategoryOptionKeyDown = (event, index) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCategoryFocusIndex((index + 1) % CATEGORY_OPTIONS.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCategoryFocusIndex((index - 1 + CATEGORY_OPTIONS.length) % CATEGORY_OPTIONS.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setCategoryFocusIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setCategoryFocusIndex(CATEGORY_OPTIONS.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCategorySelect(CATEGORY_OPTIONS[index]);
    }
  };

  const handleDeadlineToggle = () => {
    setDeadlineOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        const anchorValue = formValues.timeline || minimumDateValue;
        const anchorDate = createDateFromValue(anchorValue);
        setVisibleMonth(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
      }
      return nextOpen;
    });
  };

  const handleDeadlineSelect = (value) => {
    if (value < minimumDateValue) return;
    updateField("timeline", value);
    const nextDate = createDateFromValue(value);
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setDeadlineOpen(false);
    deadlineButtonRef.current?.focus();
  };

  const shiftVisibleMonth = (direction) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleDeadlineTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!deadlineOpen) {
        setDeadlineOpen(true);
      }
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
            <div className="requestPage__titleWrap">
              <h1 className="requestPage__title">
                <TypewriterHeading text="Post a Request" />
              </h1>
            </div>
            <p className="requestPage__sub">
              Share the details clearly so the right freelancer can respond with work that fits.
            </p>
          </div>

        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <form className="requestComposer" onSubmit={handleSubmit} noValidate>
          <div className="requestComposer__head">
            <div>
              <h2 className="requestComposer__title">Tell freelancers what you need</h2>
            </div>
            <Motion.button
              type="button"
              className="requestComposer__backLink"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.985 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer")}
            >
              Back to dashboard
            </Motion.button>
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

            <div className="requestField" ref={categoryWrapRef}>
              <span className="requestField__label">Category</span>
              <div className={`requestDropdown ${categoryOpen ? "requestDropdown--open" : ""}`}>
                <Motion.button
                  ref={categoryButtonRef}
                  type="button"
                  className="requestField__input requestDropdown__trigger"
                  aria-haspopup="listbox"
                  aria-expanded={categoryOpen}
                  aria-controls={categoryListId}
                  whileHover={submitting ? {} : { y: -1.5 }}
                  whileTap={submitting ? {} : { scale: 0.992 }}
                  transition={PROFILE_SPRING}
                  onClick={handleCategoryToggle}
                  onKeyDown={handleCategoryTriggerKeyDown}
                  disabled={submitting}
                >
                  <span
                    className={`requestDropdown__value ${
                      selectedCategoryLabel ? "" : "requestDropdown__value--placeholder"
                    }`}
                  >
                    {selectedCategoryLabel || "Choose a category"}
                  </span>
                  <ChevronDown className="requestDropdown__chevron" aria-hidden="true" />
                </Motion.button>

                <AnimatePresence>
                  {categoryOpen ? (
                    <Motion.div
                      id={categoryListId}
                      className="requestDropdown__menu"
                      role="listbox"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.985 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {CATEGORY_OPTIONS.map((option, index) => {
                        const selected = option === formValues.category;
                        return (
                          <Motion.button
                            key={option}
                            ref={(node) => {
                              categoryOptionRefs.current[index] = node;
                            }}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`requestDropdown__option ${
                              selected ? "requestDropdown__option--selected" : ""
                            }`}
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.16 }}
                            onClick={() => handleCategorySelect(option)}
                            onKeyDown={(event) => handleCategoryOptionKeyDown(event, index)}
                          >
                            {option}
                          </Motion.button>
                        );
                      })}
                    </Motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <div className="requestField" ref={deadlineWrapRef}>
              <span className="requestField__label">Deadline</span>
              <div className={`requestDateField ${deadlineOpen ? "requestDateField--open" : ""}`}>
                <Motion.button
                  ref={deadlineButtonRef}
                  type="button"
                  className="requestField__input requestDateField__trigger"
                  aria-haspopup="dialog"
                  aria-expanded={deadlineOpen}
                  aria-controls={deadlineGridId}
                  whileHover={submitting ? {} : { y: -1.5 }}
                  whileTap={submitting ? {} : { scale: 0.992 }}
                  transition={PROFILE_SPRING}
                  onClick={handleDeadlineToggle}
                  onKeyDown={handleDeadlineTriggerKeyDown}
                  disabled={submitting}
                >
                  <span
                    className={`requestDateField__value ${
                      formValues.timeline ? "" : "requestDateField__value--placeholder"
                    }`}
                  >
                    {formValues.timeline
                      ? formatDeadlineValue(formValues.timeline)
                      : "Choose a deadline"}
                  </span>
                  <ChevronDown className="requestDateField__chevron" aria-hidden="true" />
                </Motion.button>

                <AnimatePresence>
                  {deadlineOpen ? (
                    <Motion.div
                      id={deadlineGridId}
                      className="requestCalendar"
                      role="dialog"
                      aria-label="Choose a deadline"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.985 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="requestCalendar__header">
                        <Motion.button
                          type="button"
                          className="requestCalendar__nav"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.96 }}
                          transition={PROFILE_SPRING}
                          onClick={() => shiftVisibleMonth(-1)}
                        >
                          <ChevronLeft aria-hidden="true" />
                        </Motion.button>

                        <AnimatePresence mode="wait" initial={false}>
                          <Motion.strong
                            key={formatMonthLabel(visibleMonth)}
                            className="requestCalendar__month"
                            initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                            transition={{ duration: 0.18 }}
                          >
                            {formatMonthLabel(visibleMonth)}
                          </Motion.strong>
                        </AnimatePresence>

                        <Motion.button
                          type="button"
                          className="requestCalendar__nav"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.96 }}
                          transition={PROFILE_SPRING}
                          onClick={() => shiftVisibleMonth(1)}
                        >
                          <ChevronRight aria-hidden="true" />
                        </Motion.button>
                      </div>

                      <div className="requestCalendar__weekdays">
                        {DEADLINE_WEEKDAYS.map((day) => (
                          <span key={day} className="requestCalendar__weekday">
                            {day}
                          </span>
                        ))}
                      </div>

                      <Motion.div
                        key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`}
                        className="requestCalendar__grid"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                      >
                        {calendarDays.map((day) => {
                          const isSelected = day.value === formValues.timeline;
                          return (
                            <Motion.button
                              key={day.value}
                              type="button"
                              className={`requestCalendar__day ${
                                day.inMonth ? "" : "requestCalendar__day--outside"
                              } ${day.isToday ? "requestCalendar__day--today" : ""} ${
                                isSelected ? "requestCalendar__day--selected" : ""
                              }`}
                              whileHover={day.isDisabled ? {} : { y: -1.5 }}
                              whileTap={day.isDisabled ? {} : { scale: 0.96 }}
                              transition={PROFILE_SPRING}
                              onClick={() => handleDeadlineSelect(day.value)}
                              disabled={day.isDisabled}
                            >
                              {day.dateNumber}
                            </Motion.button>
                          );
                        })}
                      </Motion.div>
                    </Motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <label className="requestField">
              <span className="requestField__label">Budget amount</span>
              <input
                className="requestField__input"
                type="number"
                min="0"
                step="1"
                placeholder="Example: 1500"
                value={formValues.budgetAmount}
                onChange={(event) => updateField("budgetAmount", event.target.value)}
                disabled={submitting}
              />
            </label>

            <div className="requestField">
              <span className="requestField__label">Region</span>
              <SearchableCombobox
                value={formValues.region}
                onSelect={handleRegionSelect}
                options={PH_REGION_OPTIONS}
                placeholder="Choose your region"
                searchHint="Search regions"
                ariaLabel="Choose your region"
                disabled={submitting}
              />
            </div>

            <div className="requestField">
              <span className="requestField__label">City</span>
              <SearchableCombobox
                value={formValues.city}
                onSelect={handleCitySelect}
                options={cityOptions}
                placeholder={formValues.region ? "Choose your city" : "Choose a region first"}
                searchHint="Search cities"
                ariaLabel="Choose your city"
                disabled={submitting || !formValues.region}
              />
            </div>

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

                <Motion.button
                  type="button"
                  className="requestUpload__button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.985 }}
                  transition={PROFILE_SPRING}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  Add photos or video
                </Motion.button>
              </div>

              <AnimatePresence>
                {attachments.length > 0 ? (
                  <Motion.div
                    className="requestMediaGrid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {attachments.map((item) => (
                      <Motion.article
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
                      </Motion.article>
                    ))}
                  </Motion.div>
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
              {error || ""}
            </p>

            <Motion.button
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
            </Motion.button>
          </div>
        </form>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
