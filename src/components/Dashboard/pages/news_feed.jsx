import React, { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MapPin,
  Newspaper,
  RefreshCw,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  FreelancerDashboardFrame,
  Reveal,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { useNewsFeed } from "../hooks/useNewsFeed";
import VerifiedBadge from "../shared/VerifiedBadge";
import carvverIcon from "../../../assets/carvver_icon.png";
import "./profile.css";
import "./news_feed.css";

function buildAbsoluteUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function buildSharePreviewUrl(post, targetUrl) {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  if (!supabaseUrl || typeof window === "undefined") return targetUrl;

  const url = new URL(`${supabaseUrl}/functions/v1/share-preview`);
  url.searchParams.set("type", post.type);
  url.searchParams.set("id", post.sourceId);
  url.searchParams.set("origin", window.location.origin);
  url.searchParams.set("image", new URL(carvverIcon, window.location.origin).toString());
  return url.toString();
}

function openShareWindow(url) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
}

function buildShareLinks(post) {
  const url = buildAbsoluteUrl(post.sharePath);
  const title = `${post.title} on Carvver`;
  const text = [post.description, post.priceLabel, post.location]
    .filter(Boolean)
    .join(" - ");
  const facebookPreviewUrl = buildSharePreviewUrl(post, url);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookPreviewUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title} - ${text}`)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${title} - ${text}`)}`,
    url,
  };
}

function FeedMedia({ post }) {
  const media = post.previewMedia;

  if (!media?.publicUrl) {
    const Icon = post.type === "service" ? BriefcaseBusiness : FileText;
    return (
      <div className={`newsFeedCard__mediaFallback newsFeedCard__mediaFallback--${post.type}`}>
        <Icon className="newsFeedCard__mediaFallbackIcon" />
        <span>{post.typeLabel}</span>
      </div>
    );
  }

  if (media.media_kind === "video") {
    return <video className="newsFeedCard__mediaAsset" src={media.publicUrl} muted playsInline />;
  }

  return (
    <img
      className="newsFeedCard__mediaAsset"
      src={media.publicUrl}
      alt={post.title}
    />
  );
}

function FeedAuthor({ post }) {
  return (
    <div className="newsFeedCard__author">
      <div className="newsFeedCard__avatar" aria-hidden="true">
        {post.author.avatarUrl ? (
          <img src={post.author.avatarUrl} alt={post.author.name} />
        ) : (
          post.author.initials
        )}
      </div>
      <div className="newsFeedCard__identity">
        <span className={`newsFeedCard__type newsFeedCard__type--${post.type}`}>
          {post.typeLabel}
        </span>
        <strong className="newsFeedCard__authorName">
          <span>{post.author.name}</span>
          <VerifiedBadge
            verified={Boolean(post.author.verified)}
            className="verifiedBadge--sm"
          />
        </strong>
        <span className="newsFeedCard__authorMeta">
          {post.author.headline} - {post.dateLabel || "Recently"}
        </span>
      </div>
    </div>
  );
}

function NewsFeedCard({ post, role, currentUserId, onOpen }) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareLinks = useMemo(() => buildShareLinks(post), [post]);
  const canOpenPrimary =
    (role === "customer" && post.type === "service") ||
    (role === "freelancer" && post.type === "request") ||
    post.ownerId === currentUserId;
  const primaryLabel =
    post.type === "service"
      ? post.ownerId === currentUserId && role === "freelancer"
        ? "Open my listing"
        : "View listing"
      : post.ownerId === currentUserId && role === "customer"
        ? "Open my request"
        : "View request";
  const ownerPath =
    post.type === "service"
      ? `/dashboard/freelancer/listings/${post.sourceId}`
      : `/dashboard/customer/requests/${post.sourceId}`;
  const primaryPath = post.ownerId === currentUserId ? ownerPath : post.detailPath;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLinks.url);
      setShareOpen(false);
      toast.success("Feed post link copied.");
    } catch {
      toast.error("We couldn't copy the link.");
    }
  };

  const handleShareOpen = (url) => {
    setShareOpen(false);
    openShareWindow(url);
  };

  return (
    <Motion.article
      className={`newsFeedCard newsFeedCard--${post.type}`}
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="newsFeedCard__top">
        <FeedAuthor post={post} />
      </div>

      <div className="newsFeedCard__body">
        <div className="newsFeedCard__copy">
          <div className="newsFeedCard__labels">
            <span>{post.category}</span>
            {post.badges.map((badge) => (
              <React.Fragment key={badge}>
                <span className="newsFeedCard__labelDot" aria-hidden="true" />
                <span>{badge}</span>
              </React.Fragment>
            ))}
          </div>

          <h2 className="newsFeedCard__title">{post.title}</h2>
          <p className="newsFeedCard__desc">{post.description}</p>

          <div className="newsFeedCard__facts">
            <span className="newsFeedCard__fact">{post.priceLabel}</span>
            <span className="newsFeedCard__fact">
              <MapPin className="newsFeedCard__factIcon" />
              {post.location}
            </span>
            <span className="newsFeedCard__fact">{post.metaLabel}</span>
          </div>
        </div>

        <div className="newsFeedCard__media">
          <FeedMedia post={post} />
        </div>
      </div>

      <div
        className={`newsFeedCard__actions ${
          canOpenPrimary ? "newsFeedCard__actions--split" : ""
        }`}
      >
        {canOpenPrimary ? (
          <Motion.button
            type="button"
            className="newsFeedCard__primary"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={() => onOpen(primaryPath)}
          >
            <span>{primaryLabel}</span>
            <ArrowRight className="newsFeedCard__btnIcon" />
          </Motion.button>
        ) : null}

        <div className="newsFeedCard__shareWrap">
          <Motion.button
            type="button"
            className="newsFeedCard__shareToggle"
            aria-expanded={shareOpen}
            aria-haspopup="menu"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={() => setShareOpen((open) => !open)}
          >
            <Share2 className="newsFeedCard__btnIcon" />
            <span>Share</span>
          </Motion.button>

          {shareOpen ? (
            <div className="newsFeedShareMenu" role="menu">
              <button
                type="button"
                className="newsFeedShareMenu__item"
                role="menuitem"
                onClick={() => handleShareOpen(shareLinks.facebook)}
              >
                Facebook
              </button>
              <button
                type="button"
                className="newsFeedShareMenu__item"
                role="menuitem"
                onClick={() => handleShareOpen(shareLinks.twitter)}
              >
                X
              </button>
              <button
                type="button"
                className="newsFeedShareMenu__item"
                role="menuitem"
                onClick={() => handleShareOpen(shareLinks.reddit)}
              >
                Reddit
              </button>
              <button
                type="button"
                className="newsFeedShareMenu__item"
                role="menuitem"
                onClick={handleCopyLink}
              >
                <LinkIcon className="newsFeedShareMenu__icon" />
                <span>Copy link</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Motion.article>
  );
}

function NewsFeedPageContent({ role }) {
  const navigate = useNavigate();
  const { loading, posts, warning, error, currentUserId, reload } = useNewsFeed({
    limit: 24,
  });
  const homePath = role === "freelancer" ? "/dashboard/freelancer" : "/dashboard/customer";
  const handleScrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="newsFeedPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "News Feed" }]}
          homePath={homePath}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="newsFeedHero">
          <div className="newsFeedHero__copy">
            <div className="newsFeedHero__titleWrap">
              <h1 className="newsFeedHero__title">News Feed</h1>
            </div>
            <p className="newsFeedHero__sub">
              Follow fresh service listings and open customer requests across Carvver.
            </p>
          </div>

          <div className="newsFeedHero__actions">
            <Motion.button
              type="button"
              className="newsFeedHero__action"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={reload}
            >
              <RefreshCw className="newsFeedHero__actionIcon" />
              <span>Refresh</span>
            </Motion.button>
            <Motion.button
              type="button"
              className="newsFeedHero__ghost"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() =>
                navigate(
                  role === "freelancer"
                    ? "/dashboard/freelancer/post-listing"
                    : "/dashboard/customer/post-request"
                )
              }
            >
              <ExternalLink className="newsFeedHero__actionIcon" />
              <span>{role === "freelancer" ? "Post listing" : "Post request"}</span>
            </Motion.button>
          </div>
        </section>
      </Reveal>

      {warning ? (
        <Reveal delay={0.06}>
          <div className="newsFeedNotice">{warning}</div>
        </Reveal>
      ) : null}

      <Reveal delay={0.08}>
        <section className="newsFeedSection">
          <div className="newsFeedSection__head">
            <div>
              <h2 className="newsFeedSection__title">Marketplace updates</h2>
              <p className="newsFeedSection__sub">
                {loading ? "Loading posts..." : `${posts.length} post${posts.length === 1 ? "" : "s"} visible`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="newsFeedList">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="newsFeedCard newsFeedCard--skeleton" />
              ))}
            </div>
          ) : error ? (
            <EmptySurface
              icon={Newspaper}
              title="We couldn't load the news feed"
              description={error}
              actionLabel="Try again"
              onAction={reload}
              className="newsFeedEmpty"
            />
          ) : posts.length === 0 ? (
            <EmptySurface
              icon={Newspaper}
              title="No feed posts yet"
              description="Published services and open customer requests will appear here."
              actionLabel="Refresh feed"
              onAction={reload}
              className="newsFeedEmpty"
            />
          ) : (
            <div className="newsFeedList">
              {posts.map((post) => (
                <NewsFeedCard
                  key={post.id}
                  post={post}
                  role={role}
                  currentUserId={currentUserId}
                  onOpen={navigate}
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>

      <Motion.button
        type="button"
        className="newsFeedBackTop"
        aria-label="Back to top"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={PROFILE_SPRING}
        onClick={handleScrollToTop}
      >
        <ArrowUp className="newsFeedBackTop__icon" />
      </Motion.button>
    </div>
  );
}

export default function NewsFeedPage({ role = "customer" }) {
  const Frame = role === "freelancer" ? FreelancerDashboardFrame : CustomerDashboardFrame;

  return (
    <Frame mainClassName="profilePage profilePage--details newsFeedFrame">
      <NewsFeedPageContent role={role} />
    </Frame>
  );
}
