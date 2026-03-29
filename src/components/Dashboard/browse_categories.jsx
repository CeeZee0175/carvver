import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  GraduationCap,
  MapPin,
  Mic2,
  Package,
  Palette,
  PenTool,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./browse_categories.css";
import DashBar from "./dashbar";
import HomeFooter from "../Homepage/home_footer";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

const CATEGORY_GROUPS = [
  {
    label: "Graphics & Design",
    items: ["Illustration", "Poster Design", "Logo Design", "Social Media Design"],
  },
  {
    label: "Handmade Products",
    items: ["Plushies", "Crochet Bouquets", "Painted Tote Bags", "Handmade Gifts"],
  },
  {
    label: "Costumes & Crafts",
    items: ["Convention Costumes", "Cosplay Accessories", "Props", "Custom Crafts"],
  },
  {
    label: "Photography",
    items: ["Product Photography", "Portrait Edits", "Event Shoots", "Photo Retouching"],
  },
  {
    label: "Voice & Audio",
    items: ["Voice Over", "Intro Recordings", "Character Voices", "Audio Cleanup"],
  },
];

const LOCATION_OPTIONS = [
  "All",
  "Metro Manila",
  "Quezon City",
  "Pasig",
  "Taguig",
  "Makati",
  "Manila",
  "Mandaluyong",
  "Antipolo",
  "Cebu City",
];

const CATEGORY_ICONS = {
  "Art & Illustration": Palette,
  "Photography": Camera,
  "Video Editing": Video,
  "Graphic Design": PenTool,
  "Voice Over": Mic2,
  "Social Media": Share2,
  "Tutoring": GraduationCap,
  "Handmade Products": ShoppingBag,
};

const ACCENT_COLORS = [
  { a: "rgba(124,58,237,0.18)", b: "rgba(242,193,78,0.12)" },
  { a: "rgba(42,20,80,0.18)", b: "rgba(124,58,237,0.12)" },
  { a: "rgba(242,193,78,0.18)", b: "rgba(124,58,237,0.10)" },
  { a: "rgba(124,58,237,0.16)", b: "rgba(42,20,80,0.10)" },
  { a: "rgba(42,20,80,0.14)", b: "rgba(242,193,78,0.12)" },
  { a: "rgba(242,193,78,0.16)", b: "rgba(42,20,80,0.12)" },
];

const ITEMS_PER_PAGE = 6;

const METRO_MANILA_CITIES = [
  "Quezon City", "Pasig", "Taguig", "Makati", "Manila", "Mandaluyong",
];

function matchesLocation(serviceLocation, selectedLocation) {
  if (!selectedLocation || selectedLocation === "All") return true;
  if (selectedLocation === "Metro Manila") return METRO_MANILA_CITIES.includes(serviceLocation);
  return serviceLocation === selectedLocation;
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || Package;
}

function TypewriterHeading({ text = "Browse Services" }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) { setDisplayText(text); return; }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = setTimeout(tick, 70);
    };

    timeoutId = setTimeout(tick, 100);
    return () => clearTimeout(timeoutId);
  }, [text, reduceMotion]);

  return (
    <h1 className="browseCategories__title">
      {displayText}
      {!reduceMotion && displayText.length < text.length && (
        <motion.span
          className="browseCategories__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >|</motion.span>
      )}
    </h1>
  );
}

// Skeleton card for loading state
function ServiceCardSkeleton() {
  return (
    <div className="browseServiceCard browseServiceCard--skeleton">
      <div className="browseServiceCard__cover browseServiceCard__cover--skeleton" />
      <div className="browseServiceCard__body">
        <div className="browseSkeleton browseSkeleton--title" />
        <div className="browseSkeleton browseSkeleton--subtitle" />
        <div className="browseSkeleton browseSkeleton--note" />
        <div className="browseServiceCard__meta" style={{ marginTop: 14 }}>
          <div className="browseSkeleton browseSkeleton--pill" />
          <div className="browseSkeleton browseSkeleton--pill" />
        </div>
        <div className="browseServiceCard__bottom" style={{ marginTop: 16 }}>
          <div className="browseSkeleton browseSkeleton--price" />
          <div className="browseSkeleton browseSkeleton--btn" />
        </div>
      </div>
    </div>
  );
}

// Better empty state
function BrowseEmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="browseEmptyState">
      <div className="browseEmptyState__iconWrap" aria-hidden="true">
        <Package className="browseEmptyState__icon" />
      </div>
      <h3 className="browseEmptyState__title">
        {hasFilters ? "No services match your filters" : "No services yet"}
      </h3>
      <p className="browseEmptyState__desc">
        {hasFilters
          ? "Try adjusting or clearing your filters to discover more services."
          : "Once freelancers start publishing their services, they'll show up here."}
      </p>
      {hasFilters && (
        <motion.button
          type="button"
          className="browseEmptyState__btn"
          onClick={onClearFilters}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
        >
          Clear all filters
        </motion.button>
      )}
    </div>
  );
}

export default function BrowseCategories() {
  const reduceMotion = useReducedMotion();

  const [openMenu, setOpenMenu] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [draftCategories, setDraftCategories] = useState([]);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [newestOnly, setNewestOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [draftMaxPrice, setDraftMaxPrice] = useState(5000);
  const [locationValue, setLocationValue] = useState("All");
  const [draftLocationValue, setDraftLocationValue] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState([]);

  const filterRef = useRef(null);

  // Load services from Supabase
  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, title, category, price, location, description, created_at, profiles(first_name, last_name)")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  // Close menus on outside click or Escape
  useEffect(() => {
    const onDown = (e) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpenMenu(null); };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const hasFilters = selectedCategories.length > 0 || topRatedOnly || maxPrice < 5000 || locationValue !== "All";

  const filteredServices = useMemo(() => {
    let list = [...services];

    if (selectedCategories.length > 0) {
      list = list.filter((s) => selectedCategories.includes(s.category));
    }

    if (topRatedOnly) {
      list = list.filter((s) => (s.rating ?? 0) >= 4.9);
    }

    list = list.filter((s) => Number(s.price) <= maxPrice);
    list = list.filter((s) => matchesLocation(s.location, locationValue));

    if (newestOnly) {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [services, selectedCategories, topRatedOnly, newestOnly, maxPrice, locationValue]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedCategories, topRatedOnly, newestOnly, maxPrice, locationValue]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setDraftCategories([]);
    setTopRatedOnly(false);
    setNewestOnly(false);
    setMaxPrice(5000);
    setDraftMaxPrice(5000);
    setLocationValue("All");
    setDraftLocationValue("All");
  };

  const toggleSaved = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    toast(savedIds.includes(id) ? "Removed from saved" : "Saved!");
  };

  const selectedServicesLabel =
    selectedCategories.length === 0
      ? "Categories"
      : selectedCategories.length === 1
      ? selectedCategories[0]
      : `${selectedCategories.length} selected`;

  const cardTransition = { type: "spring", stiffness: 300, damping: 28 };

  return (
    <div className="browseCategories">
      <Toaster position="top-center" />
      <div className="browseCategories__base" />
      <div className="browseCategories__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
          performanceMode="auto"
        />
      </div>
      <div className="browseCategories__bg" aria-hidden="true" />

      <DashBar />

      <main className="browseCategories__main">

        {/* ── Hero ── */}
        <section className="browseHeroPanel">
          <div className="browseHeroPanel__titleWrap">
            <TypewriterHeading />
            <motion.svg
              className="browseHeroPanel__line"
              viewBox="0 0 300 20"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.05, ease: "easeInOut", delay: 0.12 }}
              />
            </motion.svg>
          </div>
          <p className="browseHeroPanel__sub">
            Discover creative and handmade services from casual freelancers, hobbyists, and trusted
            creators — all in one place.
          </p>
        </section>

        {/* ── Filters ── */}
        <section className="browseControlPanel" ref={filterRef}>
          <div className="browseFilterBar__inner">

            {/* Categories filter */}
            <div className="browseFilterGroup browseFilterGroup--services">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "services" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={cardTransition}
                onClick={() => {
                  setDraftCategories(selectedCategories);
                  setOpenMenu((prev) => prev === "services" ? null : "services");
                }}
              >
                <SlidersHorizontal className="browseFilterTrigger__icon" />
                <span>{selectedServicesLabel}</span>
                <ChevronDown className={`browseFilterTrigger__chevron ${openMenu === "services" ? "browseFilterTrigger__chevron--open" : ""}`} />
              </motion.button>

              <div className={`browseFilterMenu ${openMenu === "services" ? "browseFilterMenu--open" : ""}`}>
                <div className="browseFilterMenu__scroll">
                  <div className="browseFilterMenu__grid">
                    {CATEGORY_GROUPS.map((group) => (
                      <div key={group.label} className="browseFilterMenu__section">
                        <h3 className="browseFilterMenu__sectionTitle">{group.label}</h3>
                        <div className="browseFilterMenu__options">
                          {group.items.map((item) => {
                            const checked = draftCategories.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                className={`browseFilterOption ${checked ? "browseFilterOption--checked" : ""}`}
                                onClick={() => setDraftCategories((prev) =>
                                  prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
                                )}
                              >
                                <span className="browseFilterOption__box" aria-hidden="true">
                                  {checked && <Check className="browseFilterOption__check" />}
                                </span>
                                <span className="browseFilterOption__text">{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="browseFilterMenu__footer">
                  <button type="button" className="browseFilterMenu__clear"
                    onClick={() => setDraftCategories([])}>Clear all</button>
                  <button type="button" className="browseFilterMenu__apply"
                    onClick={() => { setSelectedCategories(draftCategories); setOpenMenu(null); }}>Apply</button>
                </div>
              </div>
            </div>

            {/* Top Rated toggle */}
            <motion.button
              type="button"
              className={`browseFilterToggle ${topRatedOnly ? "browseFilterToggle--active" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={cardTransition}
              onClick={() => setTopRatedOnly((prev) => !prev)}
            >
              <Star style={{ width: 13, height: 13 }} />
              Top Rated
            </motion.button>

            {/* Newest toggle */}
            <motion.button
              type="button"
              className={`browseFilterToggle ${newestOnly ? "browseFilterToggle--active" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={cardTransition}
              onClick={() => setNewestOnly((prev) => !prev)}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              Newest
            </motion.button>

            {/* Price filter */}
            <div className="browseFilterGroup">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "price" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={cardTransition}
                onClick={() => {
                  setDraftMaxPrice(maxPrice);
                  setOpenMenu((prev) => prev === "price" ? null : "price");
                }}
              >
                <span>Up to ₱{maxPrice.toLocaleString()}</span>
                <ChevronDown className={`browseFilterTrigger__chevron ${openMenu === "price" ? "browseFilterTrigger__chevron--open" : ""}`} />
              </motion.button>

              <div className={`browseFilterMenu browseFilterMenu--small ${openMenu === "price" ? "browseFilterMenu--open" : ""}`}>
                <div className="browsePriceMenu">
                  <div className="browsePriceMenu__top">
                    <span className="browsePriceMenu__label">Maximum price</span>
                    <span className="browsePriceMenu__value">₱{draftMaxPrice.toLocaleString()}</span>
                  </div>
                  <input className="browsePriceMenu__slider" type="range"
                    min="300" max="5000" step="50" value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(Number(e.target.value))} />
                  <div className="browseFilterMenu__footer browseFilterMenu__footer--compact">
                    <button type="button" className="browseFilterMenu__clear"
                      onClick={() => setDraftMaxPrice(5000)}>Reset</button>
                    <button type="button" className="browseFilterMenu__apply"
                      onClick={() => { setMaxPrice(draftMaxPrice); setOpenMenu(null); }}>Apply</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Location filter */}
            <div className="browseFilterGroup">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "location" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={cardTransition}
                onClick={() => {
                  setDraftLocationValue(locationValue);
                  setOpenMenu((prev) => prev === "location" ? null : "location");
                }}
              >
                <MapPin className="browseFilterTrigger__icon" />
                <span>{locationValue === "All" ? "Location" : locationValue}</span>
                <ChevronDown className={`browseFilterTrigger__chevron ${openMenu === "location" ? "browseFilterTrigger__chevron--open" : ""}`} />
              </motion.button>

              <div className={`browseFilterMenu browseFilterMenu--small ${openMenu === "location" ? "browseFilterMenu--open" : ""}`}>
                <div className="browseLocationMenu">
                  {LOCATION_OPTIONS.map((option) => (
                    <button key={option} type="button"
                      className={`browseLocationMenu__item ${draftLocationValue === option ? "browseLocationMenu__item--active" : ""}`}
                      onClick={() => setDraftLocationValue(option)}>
                      {option}
                    </button>
                  ))}
                  <div className="browseFilterMenu__footer browseFilterMenu__footer--compact">
                    <button type="button" className="browseFilterMenu__clear"
                      onClick={() => setDraftLocationValue("All")}>Reset</button>
                    <button type="button" className="browseFilterMenu__apply"
                      onClick={() => { setLocationValue(draftLocationValue); setOpenMenu(null); }}>Apply</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear filters button — only shows when filters are active */}
            {hasFilters && (
              <motion.button
                type="button"
                className="browseFilterClear"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={cardTransition}
                onClick={clearAllFilters}
              >
                Clear filters
              </motion.button>
            )}
          </div>

          <div className="browseControlPanel__bottom">
            <h2 className="browseResultsBar__title">
              {selectedCategories.length > 0 ? "Filtered Services" : "All Services"}
            </h2>
            <p className="browseResultsBar__count">
              {loading
                ? "Loading services..."
                : `${filteredServices.length} service${filteredServices.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </section>

        {/* ── Service Cards ── */}
        <section className="browseServicesGrid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          ) : paginatedServices.length > 0 ? (
            paginatedServices.map((service, index) => {
              const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
              const Icon = getCategoryIcon(service.category);
              const saved = savedIds.includes(service.id);
              const creatorName = service.profiles
                ? `${service.profiles.first_name} ${service.profiles.last_name}`
                : "Unknown Creator";

              return (
                <motion.article
                  key={service.id}
                  className="browseServiceCard"
                  style={{
                    "--card-accent-a": colors.a,
                    "--card-accent-b": colors.b,
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.2, 0.95, 0.2, 1], delay: index * 0.05 }}
                  whileHover={reduceMotion ? undefined : { y: -5 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                >
                  <div className="browseServiceCard__cover">
                    <span className="browseServiceCard__tag">{service.category}</span>
                    <span className="browseServiceCard__coverIconWrap" aria-hidden="true">
                      <Icon className="browseServiceCard__coverIcon" />
                    </span>
                  </div>

                  <div className="browseServiceCard__body">
                    <div className="browseServiceCard__top">
                      <div>
                        <h3 className="browseServiceCard__title">{service.title}</h3>
                        <p className="browseServiceCard__creator">{creatorName}</p>
                      </div>

                      <motion.button
                        type="button"
                        className={`browseServiceCard__save ${saved ? "browseServiceCard__save--active" : ""}`}
                        aria-label={saved ? "Remove from saved" : "Save service"}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => toggleSaved(service.id)}
                      >
                        <motion.span
                          className="browseServiceCard__saveInner"
                          animate={saved ? { scale: [1, 1.22, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Bookmark className="browseServiceCard__saveIcon" />
                        </motion.span>
                      </motion.button>
                    </div>

                    {service.description && (
                      <p className="browseServiceCard__note">{service.description}</p>
                    )}

                    <div className="browseServiceCard__meta">
                      {service.location && (
                        <span className="browseMetaPill">
                          <MapPin className="browseMetaPill__icon" />
                          {service.location}
                        </span>
                      )}
                    </div>

                    <div className="browseServiceCard__bottom">
                      <div className="browseServiceCard__priceWrap">
                        <span className="browseServiceCard__priceLabel">Starting at</span>
                        <div className="browseServiceCard__price">
                          ₱{Number(service.price).toLocaleString()}
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        className="browseServiceCard__btn"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={cardTransition}
                        onClick={() => toast("Service detail page coming soon!")}
                      >
                        View Service
                        <ArrowRight className="browseServiceCard__btnArrow" />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              );
            })
          ) : (
            <BrowseEmptyState hasFilters={hasFilters} onClearFilters={clearAllFilters} />
          )}
        </section>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <section className="browsePaginationWrap">
            <div className="browsePagination">
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                return (
                  <motion.button
                    key={page}
                    type="button"
                    className={`browsePagination__btn ${currentPage === page ? "browsePagination__btn--active" : ""}`}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    transition={cardTransition}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <section className="browseCategories__footerSection">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}