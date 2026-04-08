import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Coins,
  LoaderCircle,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import "./profile.css";
import "./post_request.css";
import {
  createCustomerRequest,
  REQUEST_CATEGORY_OPTIONS,
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

function formatPeso(value) {
  if (value === "" || value == null) return "Set your budget";
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? `PHP ${numeric.toLocaleString()}`
    : "Set your budget";
}

const INITIAL_FORM = {
  title: "",
  category: "",
  description: "",
  budgetAmount: "",
  location: "",
  timeline: "Flexible",
};

export default function PostRequest() {
  const navigate = useNavigate();
  const { openCount } = useCustomerRequests({ limit: 2 });

  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const previewTitle = formValues.title.trim() || "Your request title";
  const previewCategory = formValues.category || "Choose a category";
  const previewDescription =
    formValues.description.trim() ||
    "Write a short but clear brief so freelancers understand what you need.";
  const previewLocation = formValues.location.trim() || "Add a location if it helps";

  const tips = useMemo(
    () => [
      "Be specific about the outcome you want, not just the service name.",
      "Add a budget if you want freelancers to judge fit faster.",
      "Use location when the request depends on where you are based.",
    ],
    []
  );

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const title = formValues.title.trim();
    const category = formValues.category.trim();
    const description = formValues.description.trim();
    const timeline = formValues.timeline.trim();
    const budgetAmount = formValues.budgetAmount;

    if (!title) {
      setError("Please add a short title for your request.");
      return;
    }

    if (!category) {
      setError("Please choose a category.");
      return;
    }

    if (!description) {
      setError("Please describe what you want clearly.");
      return;
    }

    if (!timeline) {
      setError("Please choose a timeline.");
      return;
    }

    if (budgetAmount !== "") {
      const numericBudget = Number(budgetAmount);
      if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
        setError("Please enter a valid budget amount.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const created = await createCustomerRequest(formValues);

      navigate("/dashboard/customer", {
        state: {
          requestCreated: true,
          requestCreatedTitle: created.title,
        },
      });
    } catch (nextError) {
      setError(String(nextError?.message || "We couldn't post your request yet."));
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
        <section className="profileHero requestHero">
          <div className="profileHero__heading">
            <p className="profileHero__eyebrow">Customer Requests</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Post a Request" />
              </h1>
              <motion.svg
                className="profileHero__line"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                />
              </motion.svg>
            </div>
            <p className="profileHero__sub">
              Write a clear brief, share your budget and timeline, and let the right
              freelancers see what you need later on.
            </p>
          </div>

          <div className="profileHero__stats requestHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Open Requests</span>
              <strong className="profileMiniStat__value">{openCount}</strong>
              <span className="profileMiniStat__hint">Active briefs you have already posted</span>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Current Timeline</span>
              <strong className="profileMiniStat__value requestHero__miniValue">
                {formValues.timeline}
              </strong>
              <span className="profileMiniStat__hint">You can adjust this before posting</span>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="requestComposer">
        <Reveal delay={0.08}>
          <form className="profileSection requestComposer__form" onSubmit={handleSubmit} noValidate>
            <div className="profileSection__head">
              <div>
                <p className="profileSection__eyebrow">Request brief</p>
                <h2 className="profileSection__title">Tell freelancers what you need</h2>
              </div>
              <motion.button
                type="button"
                className="profileSection__linkBtn"
                whileHover={{ x: 1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/customer")}
              >
                <span>Back to dashboard</span>
                <ArrowRight className="profileSection__linkIcon" />
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
            </div>

            <div className="requestComposer__footer">
              <p
                className={`requestComposer__feedback ${
                  error ? "requestComposer__feedback--error" : ""
                }`}
                aria-live="polite"
              >
                {error || "Your request will be saved for freelancer-facing features later on."}
              </p>

              <motion.button
                type="submit"
                className="requestSubmitBtn"
                whileHover={submitting ? {} : { y: -1.5, scale: 1.01 }}
                whileTap={submitting ? {} : { scale: 0.985 }}
                transition={PROFILE_SPRING}
                disabled={submitting}
              >
                <span className="requestSubmitBtn__copy">
                  <span className="requestSubmitBtn__eyebrow">Customer request</span>
                  <span className="requestSubmitBtn__title">
                    {submitting ? "Posting..." : "Post this request"}
                  </span>
                </span>

                <span className="requestSubmitBtn__iconWrap" aria-hidden="true">
                  {submitting ? (
                    <LoaderCircle className="requestSubmitBtn__icon requestSubmitBtn__icon--spin" />
                  ) : (
                    <Send className="requestSubmitBtn__icon" />
                  )}
                </span>
              </motion.button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="requestComposer__side">
            <section className="profileSection requestPreview">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">Live preview</p>
                  <h2 className="profileSection__title">How your brief reads</h2>
                </div>
              </div>

              <motion.article
                className="requestPreviewCard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="requestPreviewCard__meta">
                  <span className="requestPreviewCard__chip">{previewCategory}</span>
                  <span className="requestPreviewCard__chip requestPreviewCard__chip--soft">
                    {formValues.timeline}
                  </span>
                </div>

                <h3 className="requestPreviewCard__title">{previewTitle}</h3>
                <p className="requestPreviewCard__desc">{previewDescription}</p>

                <div className="requestPreviewCard__signals">
                  <span className="requestPreviewCard__signal">
                    <Coins className="requestPreviewCard__signalIcon" />
                    {formatPeso(formValues.budgetAmount)}
                  </span>
                  <span className="requestPreviewCard__signal">
                    <MapPin className="requestPreviewCard__signalIcon" />
                    {previewLocation}
                  </span>
                  <span className="requestPreviewCard__signal">
                    <Clock3 className="requestPreviewCard__signalIcon" />
                    {formValues.timeline}
                  </span>
                </div>
              </motion.article>
            </section>

            <section className="profileSection requestTips">
              <div className="profileSection__head">
                <div>
                  <p className="profileSection__eyebrow">Helpful notes</p>
                  <h2 className="profileSection__title">A stronger brief gets clearer replies later</h2>
                </div>
              </div>

              <div className="requestTips__list">
                {tips.map((tip, index) => (
                  <motion.article
                    key={tip}
                    className="requestTip"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.42, delay: index * 0.06 }}
                  >
                    <span className="requestTip__iconWrap" aria-hidden="true">
                      <Sparkles className="requestTip__icon" />
                    </span>
                    <p className="requestTip__text">{tip}</p>
                  </motion.article>
                ))}
              </div>
            </section>
          </div>
        </Reveal>
      </section>
    </CustomerDashboardFrame>
  );
}
