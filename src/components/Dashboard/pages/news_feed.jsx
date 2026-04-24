import React, { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
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
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { useNewsFeed } from "../hooks/useNewsFeed";
import "./profile.css";
import "./news_feed.css";

function buildAbsoluteUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function openShareWindow(url) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
}

function buildShareLinks(post) {
  const url = buildAbsoluteUrl(post.sharePath);
  const title = `${post.title} on Carvver`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
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
        <strong className="newsFeedCard__authorName">{post.author.name}</strong>
        <span className="newsFeedCard__authorMeta">
          {post.author.headline} · {post.dateLabel || "Recently"}
        </span>
      </div>
    </div>
  );
}

function NewsFeedCard({ post, role, currentUserId, onOpen }) {
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
      toast.success("Feed post link copied.");
    } catch {
      toast.error("We couldn't copy the link.");
    }
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
        <span className={`newsFeedCard__type newsFeedCard__type--${post.type}`}>
          {post.typeLabel}
        </span>
      </div>

      <div className="newsFeedCard__body">
        <div className="newsFeedCard__copy">
          <div className="newsFeedCard__chips">
            <span>{post.category}</span>
            {post.badges.map((badge) => (
              <span key={badge}>{badge}</span>
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

      <div className="newsFeedCard__actions">
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
        ) : (
          <span className="newsFeedCard__context">
            Shared for visibility in the marketplace feed
          </span>
        )}

        <div className="newsFeedCard__shareGroup" aria-label={`Share ${post.title}`}>
          <Share2 className="newsFeedCard__shareIcon" aria-hidden="true" />
          <Motion.button
            type="button"
            className="newsFeedCard__shareBtn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={() => openShareWindow(shareLinks.facebook)}
          >
            Facebook
          </Motion.button>
          <Motion.button
            type="button"
            className="newsFeedCard__shareBtn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={() => openShareWindow(shareLinks.twitter)}
          >
            X
          </Motion.button>
          <Motion.button
            type="button"
            className="newsFeedCard__shareBtn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={() => openShareWindow(shareLinks.reddit)}
          >
            Reddit
          </Motion.button>
          <Motion.button
            type="button"
            className="newsFeedCard__shareBtn newsFeedCard__shareBtn--icon"
            aria-label="Copy feed post link"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={PROFILE_SPRING}
            onClick={handleCopyLink}
          >
            <LinkIcon className="newsFeedCard__btnIcon" />
          </Motion.button>
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
              <h1 className="newsFeedHero__title">
                <TypewriterHeading text="News Feed" />
              </h1>
              <Motion.svg
                className="newsFeedHero__line"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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
