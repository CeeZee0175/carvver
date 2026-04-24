import React, { useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  FileVideo,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  VERIFICATION_MAX_FILES,
  useFreelancerTrustData,
} from "../hooks/useFreelancerTrustData";
import VerifiedBadge from "../shared/VerifiedBadge";
import {
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./profile.css";
import "./freelancer_trust.css";

function formatStatusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Needs updates";
  return "Pending review";
}

function VerificationMediaPreview({ file, media }) {
  const url = file ? URL.createObjectURL(file) : media?.signedUrl || "";
  const kind = file
    ? String(file.type || "").startsWith("video/")
      ? "video"
      : "image"
    : media?.media_kind;

  if (!url) {
    const Icon = kind === "video" ? FileVideo : ImageIcon;
    return (
      <div className="freelancerVerificationMedia__fallback">
        <Icon className="freelancerVerificationMedia__fallbackIcon" />
      </div>
    );
  }

  if (kind === "video") {
    return <video src={url} className="freelancerVerificationMedia__asset" controls preload="metadata" />;
  }

  return <img src={url} alt={file?.name || media?.original_name || "Verification proof"} className="freelancerVerificationMedia__asset" />;
}

export default function FreelancerVerification() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const {
    loading,
    warnings,
    profile,
    verified,
    latestVerificationRequest,
    pendingVerificationRequest,
    capabilities,
    submitVerification,
    reload,
  } = useFreelancerTrustData();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const acceptedExtensions = ".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov";
  const canSubmit =
    !verified &&
    !pendingVerificationRequest &&
    capabilities.canSubmitVerification &&
    description.trim().length >= 20 &&
    files.length > 0;

  const stateCopy = useMemo(() => {
    if (verified) {
      return {
        title: "Your freelancer profile is verified",
        body: "Customers will see the verified badge next to your name across Carvver.",
      };
    }

    if (pendingVerificationRequest) {
      return {
        title: "Your verification is under review",
        body: "An admin can now review your submitted work proof and approve your account-wide badge.",
      };
    }

    if (latestVerificationRequest?.status === "rejected") {
      return {
        title: "Your last request needs updates",
        body:
          latestVerificationRequest.admin_note ||
          "Review your proof and submit clearer photos or videos when you're ready.",
      };
    }

    return {
      title: "Submit work proof for verification",
      body: "Add photos or videos of your work and a short explanation so admins can review your freelancer account.",
    };
  }, [latestVerificationRequest, pendingVerificationRequest, verified]);

  const handleFilePick = (event) => {
    const picked = Array.from(event.target.files || []);
    const merged = [...files, ...picked].slice(0, VERIFICATION_MAX_FILES);
    setFiles(merged);
    event.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      await submitVerification({ description, files });
      setDescription("");
      setFiles([]);
      toast.success("Verification submitted for admin review.");
    } catch (error) {
      toast.error(error.message || "We couldn't submit your verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage freelancerTrustPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Profile", to: "/dashboard/freelancer/profile" },
            { label: "Verification" },
          ]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero freelancerTrustHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Verification" />
              </h1>
              <Motion.svg
                className="profileHero__line"
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                />
              </Motion.svg>
            </div>
            <p className="profileHero__sub">
              Submit real work proof so admins can review and grant your account-wide verified badge.
            </p>
          </div>
        </section>
      </Reveal>

      {warnings.length > 0 ? (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">Some verification details couldn't be loaded</h2>
              <p className="profileNotice__desc">{warnings[0]}</p>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <section className="profileSection freelancerVerificationPanel">
          <div className="freelancerVerificationPanel__summary">
            <div className="freelancerVerificationPanel__iconWrap" aria-hidden="true">
              {verified ? (
                <VerifiedBadge verified className="verifiedBadge--lg" />
              ) : (
                <ShieldCheck className="freelancerVerificationPanel__icon" />
              )}
            </div>
            <div>
              <h2 className="profileSection__title">{stateCopy.title}</h2>
              <p className="profileSection__sub">{stateCopy.body}</p>
            </div>
          </div>

          <div className="freelancerVerificationPanel__facts">
            <div>
              <span>Status</span>
              <strong>
                {verified
                  ? "Verified"
                  : latestVerificationRequest
                    ? formatStatusLabel(latestVerificationRequest.status)
                    : "Not submitted"}
              </strong>
            </div>
            <div>
              <span>Freelancer</span>
              <strong>{profile?.display_name || profile?.first_name || "Signed-in freelancer"}</strong>
            </div>
            <div>
              <span>Files</span>
              <strong>
                {pendingVerificationRequest?.media?.length ||
                  latestVerificationRequest?.media?.length ||
                  files.length ||
                  0}
              </strong>
            </div>
          </div>

          <div className="freelancerVerificationPanel__actions">
            <Motion.button
              type="button"
              className="profileEditor__btn profileEditor__btn--ghost"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw className="profileEditor__btnIcon" />
              <span>Refresh status</span>
            </Motion.button>
            <Motion.button
              type="button"
              className="profileEditor__btn profileEditor__btn--primary"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/freelancer/profile/achievements")}
            >
              <BadgeCheck className="profileEditor__btnIcon" />
              <span>View achievements</span>
            </Motion.button>
          </div>
        </section>
      </Reveal>

      {verified || pendingVerificationRequest ? (
        <Reveal delay={0.12}>
          <section className="profileSection freelancerTrustSection">
            <div className="profileSection__head">
              <div>
                <h2 className="profileSection__title">Submitted proof</h2>
                <p className="profileSection__sub">
                  The latest files and context attached to this verification request.
                </p>
              </div>
            </div>

            {latestVerificationRequest?.media?.length ? (
              <div className="freelancerVerificationMediaGrid">
                {latestVerificationRequest.media.map((media) => (
                  <article key={media.id} className="freelancerVerificationMedia">
                    <VerificationMediaPreview media={media} />
                    <strong>{media.original_name}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <EmptySurface hideIcon title="No media available" />
            )}
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.12}>
          <section className="profileSection freelancerTrustSection">
            <div className="profileSection__head">
              <div>
                <h2 className="profileSection__title">Verification submission</h2>
                <p className="profileSection__sub">
                  Add 1 to 6 photos or videos and explain what admins are looking at.
                </p>
              </div>
            </div>

            <form className="freelancerVerificationForm" onSubmit={handleSubmit}>
              <label className="profileField profileField--wide">
                <span className="profileField__label">Work description</span>
                <textarea
                  className="profileField__control profileField__control--textarea"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain the work shown, your role, the client context, tools, materials, or process."
                />
              </label>

              <div className="freelancerVerificationUpload">
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptedExtensions}
                  multiple
                  className="profileIdentity__avatarInput"
                  onChange={handleFilePick}
                />
                <Motion.button
                  type="button"
                  className="freelancerVerificationUpload__button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  onClick={() => inputRef.current?.click()}
                  disabled={files.length >= VERIFICATION_MAX_FILES}
                >
                  <Upload className="freelancerVerificationUpload__icon" />
                  <span>Add photos or videos</span>
                </Motion.button>
                <p className="freelancerVerificationUpload__note">
                  JPG, PNG, WEBP, MP4, WEBM, or MOV. Up to {VERIFICATION_MAX_FILES} files.
                </p>
              </div>

              {files.length > 0 ? (
                <div className="freelancerVerificationMediaGrid">
                  {files.map((file, index) => (
                    <article key={`${file.name}-${index}`} className="freelancerVerificationMedia">
                      <VerificationMediaPreview file={file} />
                      <strong>{file.name}</strong>
                      <button
                        type="button"
                        className="freelancerVerificationMedia__remove"
                        onClick={() => handleRemoveFile(index)}
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="freelancerVerificationForm__actions">
                <Motion.button
                  type="submit"
                  className="profileEditor__btn profileEditor__btn--primary"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={PROFILE_SPRING}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <LoaderCircle className="profileEditor__btnIcon freelancerTrustSpin" />
                  ) : (
                    <ArrowRight className="profileEditor__btnIcon" />
                  )}
                  <span>{submitting ? "Submitting..." : "Submit for review"}</span>
                </Motion.button>
              </div>
            </form>
          </section>
        </Reveal>
      )}
    </FreelancerDashboardFrame>
  );
}
