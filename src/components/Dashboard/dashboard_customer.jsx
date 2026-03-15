import HomeFooter from "../Homepage/home_footer";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Camera,
  Compass,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Mic2,
  Palette,
  PenTool,
  PlusCircle,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import "./dashboard_customer.css";
import DashBar from "./dashbar";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";

const quickStats = [
  { label: "Saved Listings", value: "12", hint: "Ready to revisit" },
  { label: "Open Requests", value: "3", hint: "Waiting for replies" },
  { label: "Unread Messages", value: "7", hint: "Replies from creators" },
  { label: "Nearby Matches", value: "18", hint: "Based on your area" },
];

const categories = [
  { label: "Art & Illustration", Icon: Palette },
  { label: "Photography", Icon: Camera },
  { label: "Video Editing", Icon: Video },
  { label: "Graphic Design", Icon: PenTool },
  { label: "Voice Over", Icon: Mic2 },
  { label: "Social Media", Icon: Share2 },
  { label: "Tutoring", Icon: GraduationCap },
  { label: "Handmade Products", Icon: ShoppingBag },
];

const recommendations = [
  {
    title: "Logo Refresh Package",
    creator: "Maple Studio",
    price: "₱850",
    rating: "4.9",
    location: "Quezon City",
    tag: "Design",
    Icon: PenTool,
    coverA: "rgba(124,58,237,0.20)",
    coverB: "rgba(242,193,78,0.14)",
  },
  {
    title: "Product Photo Retouch",
    creator: "Lens & Light",
    price: "₱650",
    rating: "4.8",
    location: "Makati",
    tag: "Photography",
    Icon: Camera,
    coverA: "rgba(42,20,80,0.16)",
    coverB: "rgba(124,58,237,0.14)",
  },
  {
    title: "Short Voice Intro",
    creator: "Mic Lane",
    price: "₱500",
    rating: "5.0",
    location: "Cebu City",
    tag: "Audio",
    Icon: Mic2,
    coverA: "rgba(242,193,78,0.18)",
    coverB: "rgba(42,20,80,0.14)",
  },
];

const nearbyCreators = [
  {
    name: "Alyssa M.",
    specialty: "Illustration & Stickers",
    location: "Pasig",
    rating: "4.9",
    accent: "rgba(124,58,237,0.10)",
  },
  {
    name: "Jiro P.",
    specialty: "Photo Edits",
    location: "Taguig",
    rating: "4.8",
    accent: "rgba(242,193,78,0.12)",
  },
  {
    name: "Camille R.",
    specialty: "Social Media Kits",
    location: "Mandaluyong",
    rating: "5.0",
    accent: "rgba(42,20,80,0.08)",
  },
  {
    name: "Tina L.",
    specialty: "Tutoring Sessions",
    location: "Manila",
    rating: "4.9",
    accent: "rgba(124,58,237,0.08)",
  },
];

const quickBoardItems = [
  { label: "Saved listings", Icon: Bookmark },
  { label: "Messages", Icon: MessageCircle },
  { label: "Requests & orders", Icon: ShoppingBag },
  { label: "Fresh recommendations", Icon: Sparkles },
];

function getStoredFirstName() {
  if (typeof window === "undefined") return "there";

  const stored =
    localStorage.getItem("carvverCustomerFirstName") ||
    localStorage.getItem("carvverUserFirstName") ||
    "";

  if (!stored.trim()) return "there";

  const first = stored.trim().split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function DashboardCustomer() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [firstName, setFirstName] = useState("there");

  useEffect(() => {
    setFirstName(getStoredFirstName());
  }, []);

  const actionTransition = useMemo(
    () => ({ type: "spring", stiffness: 340, damping: 24 }),
    []
  );

  return (
    <div className="dashboardCustomer">
      <div className="dashboardCustomer__base" />
      <div className="dashboardCustomer__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
      </div>
      <div className="dashboardCustomer__bg" aria-hidden="true" />

      <DashBar />

      <main className="dashboardCustomer__main">
        <section className="dashHero">
          <div className="dashHero__left">
            <motion.div
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.2, 0.95, 0.2, 1] }}
            >
              <div className="dashHero__titleWrap">
                <h1 className="dashHero__title">Welcome, {firstName}</h1>

                <motion.svg
                  className="dashHero__line"
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

              <p className="dashHero__sub">
                Explore creative services, connect with trusted creators, or post a request and let
                the right people find you.
              </p>
            </motion.div>

            <motion.div
              className="dashHero__actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.2, 0.95, 0.2, 1] }}
            >
              <motion.button
                type="button"
                className="dashActionBtn dashActionBtn--primary"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span className="dashActionBtn__text">Browse Services</span>
                <span className="dashActionBtn__arrowWrap" aria-hidden="true">
                  <ArrowRight className="dashActionBtn__arrow" />
                </span>
              </motion.button>

              <motion.button
                type="button"
                className="dashActionBtn dashActionBtn--secondary"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
                onClick={() => console.log("Post a request clicked")}
              >
                <PlusCircle className="dashActionBtn__icon" />
                <span>Post a Request</span>
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            className="dashHero__right"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.2, 0.95, 0.2, 1] }}
          >
            <div className="dashStats">
              {quickStats.map((item) => (
                <motion.article
                  key={item.label}
                  className="dashStatCard"
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  transition={actionTransition}
                >
                  <div className="dashStatCard__value">{item.value}</div>
                  <div className="dashStatCard__label">{item.label}</div>
                  <div className="dashStatCard__hint">{item.hint}</div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="dashSection">
          <div className="dashSection__head">
            <div>
              <h2 className="dashSection__title">Popular Categories</h2>
              <p className="dashSection__desc">
                Jump into the services customers often explore first.
              </p>
            </div>

            <motion.button
              type="button"
              className="dashGhostLink"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={actionTransition}
              onClick={() => navigate("/dashboard/customer/browse-services")}
            >
              See all
            </motion.button>
          </div>

          <div className="dashCategoryGrid">
            {categories.map(({ label, Icon }) => (
              <motion.button
                key={label}
                type="button"
                className="dashCategoryCard"
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={actionTransition}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span className="dashCategoryCard__iconWrap" aria-hidden="true">
                  <Icon className="dashCategoryCard__icon" />
                </span>
                <span className="dashCategoryCard__label">{label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="dashSplit">
          <div className="dashSplit__main">
            <div className="dashSection dashSection--embedded">
              <div className="dashSection__head">
                <div>
                  <h2 className="dashSection__title">Recommended For You</h2>
                  <p className="dashSection__desc">
                    Curated picks based on popular categories and customer activity.
                  </p>
                </div>

                <motion.button
                  type="button"
                  className="dashGhostLink"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={actionTransition}
                >
                  Refresh picks
                </motion.button>
              </div>

              <div className="dashListingGrid">
                {recommendations.map((item) => {
                  const Icon = item.Icon;

                  return (
                    <motion.article
                      key={item.title}
                      className="dashListingCard"
                      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                      transition={actionTransition}
                      style={{
                        "--listing-cover-a": item.coverA,
                        "--listing-cover-b": item.coverB,
                      }}
                    >
                      <div className="dashListingCard__cover">
                        <span className="dashListingCard__badge">{item.tag}</span>
                        <span className="dashListingCard__coverIconWrap" aria-hidden="true">
                          <Icon className="dashListingCard__coverIcon" />
                        </span>
                      </div>

                      <div className="dashListingCard__body">
                        <div className="dashListingCard__top">
                          <div>
                            <h3 className="dashListingCard__title">{item.title}</h3>
                            <p className="dashListingCard__creator">{item.creator}</p>
                          </div>

                          <button
                            type="button"
                            className="dashListingCard__save"
                            onClick={() => console.log("Save listing")}
                            aria-label="Save listing"
                          >
                            <Heart className="dashListingCard__saveIcon" />
                          </button>
                        </div>

                        <div className="dashListingCard__meta">
                          <span className="dashMetaPill">
                            <Star className="dashMetaPill__icon" />
                            {item.rating}
                          </span>
                          <span className="dashMetaPill">
                            <MapPin className="dashMetaPill__icon" />
                            {item.location}
                          </span>
                        </div>

                        <div className="dashListingCard__bottom">
                          <div className="dashListingCard__price">{item.price}</div>

                          <motion.button
                            type="button"
                            className="dashMiniBtn"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            transition={actionTransition}
                          >
                            View Listing
                          </motion.button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="dashSplit__side">
            <motion.article
              className="dashRequestCard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              <div className="dashRequestCard__iconWrap" aria-hidden="true">
                <Compass className="dashRequestCard__icon" />
              </div>

              <h3 className="dashRequestCard__title">Need something specific?</h3>
              <p className="dashRequestCard__desc">
                Post a request and let creators respond with offers that match what you need.
              </p>

              <ul className="dashRequestCard__list">
                <li>Receive interest from service providers</li>
                <li>Compare replies in one place</li>
                <li>Choose the best fit for your request</li>
              </ul>

              <motion.button
                type="button"
                className="dashRequestCard__btn"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={actionTransition}
              >
                Post a Request
              </motion.button>
            </motion.article>

            <motion.article
              className="dashBoardCard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
            >
              <h3 className="dashBoardCard__title">Your Quick Board</h3>

              <div className="dashQuickList">
                {quickBoardItems.map(({ label, Icon }) => (
                  <motion.button
                    key={label}
                    type="button"
                    className="dashQuickList__item"
                    whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01, x: 2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={actionTransition}
                    onClick={() => console.log(`${label} clicked`)}
                  >
                    <Icon className="dashQuickList__icon" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.article>
          </aside>
        </section>

        <section className="dashSection">
          <div className="dashSection__head">
            <div>
              <h2 className="dashSection__title">Nearby & Trusted</h2>
              <p className="dashSection__desc">
                Helpful creators around you, especially for location-based services.
              </p>
            </div>

            <motion.button
              type="button"
              className="dashGhostLink"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={actionTransition}
            >
              Explore nearby
            </motion.button>
          </div>

          <div className="dashCreatorRow">
            {nearbyCreators.map((creator) => (
              <motion.article
                key={creator.name}
                className="dashCreatorCard"
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={actionTransition}
                style={{ "--creator-accent": creator.accent }}
              >
                <div className="dashCreatorCard__avatar" aria-hidden="true">
                  {creator.name.charAt(0)}
                </div>

                <div className="dashCreatorCard__body">
                  <div className="dashCreatorCard__nameRow">
                    <h3 className="dashCreatorCard__name">{creator.name}</h3>
                    <span className="dashCreatorCard__rating">
                      <Star className="dashCreatorCard__ratingIcon" />
                      {creator.rating}
                    </span>
                  </div>

                  <p className="dashCreatorCard__specialty">{creator.specialty}</p>

                  <div className="dashCreatorCard__meta">
                    <span className="dashCreatorCard__location">
                      <MapPin className="dashCreatorCard__metaIcon" />
                      {creator.location}
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="dashCreatorCard__btn"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={actionTransition}
                >
                  View Profile
                </motion.button>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
      
      <section className="dashboardCustomer__footerSection">
            <HomeFooter fullBleed />
      </section>
    </div>
  );
}