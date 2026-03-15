import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  MapPin,
  Mic2,
  Palette,
  PenTool,
  Scissors,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import "./browse_categories.css";
import DashBar from "./dashbar";
import HomeFooter from "../Homepage/home_footer";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";

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

const SERVICES = [
  {
    id: 1,
    title: "Handmade Plushie Commission",
    group: "Handmade Products",
    subcategory: "Plushies",
    creator: "SoftLoop Studio",
    price: 950,
    rating: 4.9,
    location: "Quezon City",
    delivery: "5 days",
    Icon: ShoppingBag,
    accentA: "rgba(124,58,237,0.18)",
    accentB: "rgba(242,193,78,0.12)",
    note: "Custom plushies inspired by your favorite characters or original ideas.",
  },
  {
    id: 2,
    title: "Custom Anime Convention Costume",
    group: "Costumes & Crafts",
    subcategory: "Convention Costumes",
    creator: "ThreadForge",
    price: 4200,
    rating: 5.0,
    location: "Pasig",
    delivery: "10 days",
    Icon: Shirt,
    accentA: "rgba(42,20,80,0.18)",
    accentB: "rgba(124,58,237,0.12)",
    note: "Handcrafted cosplay costume with detail-focused finishing for conventions.",
  },
  {
    id: 3,
    title: "Crochet Flower Bouquet",
    group: "Handmade Products",
    subcategory: "Crochet Bouquets",
    creator: "Knot & Bloom",
    price: 780,
    rating: 4.8,
    location: "Manila",
    delivery: "4 days",
    Icon: Scissors,
    accentA: "rgba(242,193,78,0.18)",
    accentB: "rgba(124,58,237,0.10)",
    note: "A handmade bouquet that lasts longer and can be customized by color theme.",
  },
  {
    id: 4,
    title: "Chibi Character Illustration",
    group: "Graphics & Design",
    subcategory: "Illustration",
    creator: "Pastel Pixel",
    price: 650,
    rating: 4.9,
    location: "Taguig",
    delivery: "3 days",
    Icon: Palette,
    accentA: "rgba(124,58,237,0.16)",
    accentB: "rgba(42,20,80,0.10)",
    note: "Cute custom chibi portraits for icons, gifts, and social media use.",
  },
  {
    id: 5,
    title: "Mini Product Photo Session",
    group: "Photography",
    subcategory: "Product Photography",
    creator: "Frame Avenue",
    price: 1200,
    rating: 4.8,
    location: "Makati",
    delivery: "3 days",
    Icon: Camera,
    accentA: "rgba(42,20,80,0.14)",
    accentB: "rgba(242,193,78,0.12)",
    note: "Clean product shots for small businesses, handmade sellers, and online listings.",
  },
  {
    id: 6,
    title: "Short Voice Intro Recording",
    group: "Voice & Audio",
    subcategory: "Voice Over",
    creator: "Mic Lane",
    price: 500,
    rating: 5.0,
    location: "Cebu City",
    delivery: "2 days",
    Icon: Mic2,
    accentA: "rgba(242,193,78,0.16)",
    accentB: "rgba(42,20,80,0.12)",
    note: "Warm and clear voice intros for videos, pages, and short creative projects.",
  },
  {
    id: 7,
    title: "Social Media Poster Pack",
    group: "Graphics & Design",
    subcategory: "Social Media Design",
    creator: "Maple Studio",
    price: 850,
    rating: 4.9,
    location: "Mandaluyong",
    delivery: "4 days",
    Icon: PenTool,
    accentA: "rgba(124,58,237,0.18)",
    accentB: "rgba(242,193,78,0.10)",
    note: "A polished set of post designs for promotions, launches, and announcements.",
  },
  {
    id: 8,
    title: "Hand-painted Tote Bag",
    group: "Handmade Products",
    subcategory: "Painted Tote Bags",
    creator: "Crafted Hue",
    price: 1100,
    rating: 4.8,
    location: "Antipolo",
    delivery: "6 days",
    Icon: Sparkles,
    accentA: "rgba(42,20,80,0.10)",
    accentB: "rgba(124,58,237,0.14)",
    note: "Wearable custom art on tote bags, painted to match your chosen style or fandom.",
  },
  {
    id: 9,
    title: "Custom Convention Prop",
    group: "Costumes & Crafts",
    subcategory: "Props",
    creator: "ForgeBox Crafts",
    price: 1800,
    rating: 4.9,
    location: "Mandaluyong",
    delivery: "7 days",
    Icon: Scissors,
    accentA: "rgba(124,58,237,0.14)",
    accentB: "rgba(242,193,78,0.10)",
    note: "Convention-ready props handcrafted for cosplay, displays, or stage use.",
  },
];

const ITEMS_PER_PAGE = 6;

function isMetroManila(location) {
  return [
    "Quezon City",
    "Pasig",
    "Taguig",
    "Makati",
    "Manila",
    "Mandaluyong",
  ].includes(location);
}

function matchesLocation(serviceLocation, selectedLocation) {
  if (selectedLocation === "All") return true;
  if (selectedLocation === "Metro Manila") return isMetroManila(serviceLocation);
  return serviceLocation === selectedLocation;
}

function TypewriterHeading({ text = "Browse Services" }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) {
        timeoutId = setTimeout(tick, 70);
      }
    };

    timeoutId = setTimeout(tick, 100);
    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <h1 className="browseCategories__title">
      {displayText}
      {displayText.length < text.length && (
        <motion.span
          className="browseCategories__cursor"
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </h1>
  );
}

export default function BrowseCategories() {
  const reduceMotion = useReducedMotion();

  const [openMenu, setOpenMenu] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);
  const [draftServices, setDraftServices] = useState([]);

  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [newestOnly, setNewestOnly] = useState(false);

  const [maxPrice, setMaxPrice] = useState(5000);
  const [draftMaxPrice, setDraftMaxPrice] = useState(5000);

  const [locationValue, setLocationValue] = useState("All");
  const [draftLocationValue, setDraftLocationValue] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState([]);

  const filterRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const filteredServices = useMemo(() => {
    let list = [...SERVICES];

    if (selectedServices.length > 0) {
      list = list.filter((service) => selectedServices.includes(service.subcategory));
    }

    if (topRatedOnly) {
      list = list.filter((service) => service.rating >= 4.9);
    }

    list = list.filter((service) => service.price <= maxPrice);

    list = list.filter((service) => matchesLocation(service.location, locationValue));

    if (newestOnly) {
      list.sort((a, b) => b.id - a.id);
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [selectedServices, topRatedOnly, newestOnly, maxPrice, locationValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedServices, topRatedOnly, newestOnly, maxPrice, locationValue]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredServices.slice(start, end);
  }, [filteredServices, currentPage]);

  const toggleServiceDraft = (item) => {
    setDraftServices((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]
    );
  };

  const openServicesMenu = () => {
    setDraftServices(selectedServices);
    setOpenMenu((prev) => (prev === "services" ? null : "services"));
  };

  const openPriceMenu = () => {
    setDraftMaxPrice(maxPrice);
    setOpenMenu((prev) => (prev === "price" ? null : "price"));
  };

  const openLocationMenu = () => {
    setDraftLocationValue(locationValue);
    setOpenMenu((prev) => (prev === "location" ? null : "location"));
  };

  const selectedServicesLabel =
    selectedServices.length === 0
      ? "Services"
      : selectedServices.length === 1
      ? selectedServices[0]
      : `${selectedServices.length} selected`;

  const toggleSaved = (id) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  return (
    <div className="browseCategories">
      <div className="browseCategories__base" />
      <div className="browseCategories__shadow" aria-hidden="true">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
      </div>
      <div className="browseCategories__bg" aria-hidden="true" />

      <DashBar />

      <main className="browseCategories__main">
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
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
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

        <section className="browseControlPanel" ref={filterRef}>
          <div className="browseFilterBar__inner">
            <div className="browseFilterGroup browseFilterGroup--services">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "services" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                onClick={openServicesMenu}
              >
                <SlidersHorizontal className="browseFilterTrigger__icon" />
                <span>{selectedServicesLabel}</span>
                <ChevronDown
                  className={`browseFilterTrigger__chevron ${
                    openMenu === "services" ? "browseFilterTrigger__chevron--open" : ""
                  }`}
                />
              </motion.button>

              <div className={`browseFilterMenu browseFilterMenu--services ${openMenu === "services" ? "browseFilterMenu--open" : ""}`}>
                <div className="browseFilterMenu__scroll">
                  <div className="browseFilterMenu__grid">
                    {CATEGORY_GROUPS.map((group) => (
                      <div key={group.label} className="browseFilterMenu__section">
                        <h3 className="browseFilterMenu__sectionTitle">{group.label}</h3>

                        <div className="browseFilterMenu__options">
                          {group.items.map((item) => {
                            const checked = draftServices.includes(item);

                            return (
                              <button
                                key={item}
                                type="button"
                                className={`browseFilterOption ${checked ? "browseFilterOption--checked" : ""}`}
                                onClick={() => toggleServiceDraft(item)}
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
                  <button
                    type="button"
                    className="browseFilterMenu__clear"
                    onClick={() => setDraftServices([])}
                  >
                    Clear all
                  </button>

                  <button
                    type="button"
                    className="browseFilterMenu__apply"
                    onClick={() => {
                      setSelectedServices(draftServices);
                      setOpenMenu(null);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              className={`browseFilterToggle ${topRatedOnly ? "browseFilterToggle--active" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              onClick={() => setTopRatedOnly((prev) => !prev)}
            >
              Top Rated
            </motion.button>

            <motion.button
              type="button"
              className={`browseFilterToggle ${newestOnly ? "browseFilterToggle--active" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              onClick={() => setNewestOnly((prev) => !prev)}
            >
              Newest
            </motion.button>

            <div className="browseFilterGroup">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "price" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                onClick={openPriceMenu}
              >
                <span>Price: up to ₱{maxPrice}</span>
                <ChevronDown
                  className={`browseFilterTrigger__chevron ${
                    openMenu === "price" ? "browseFilterTrigger__chevron--open" : ""
                  }`}
                />
              </motion.button>

              <div className={`browseFilterMenu browseFilterMenu--small ${openMenu === "price" ? "browseFilterMenu--open" : ""}`}>
                <div className="browsePriceMenu">
                  <div className="browsePriceMenu__top">
                    <span className="browsePriceMenu__label">Maximum price</span>
                    <span className="browsePriceMenu__value">₱{draftMaxPrice}</span>
                  </div>

                  <input
                    className="browsePriceMenu__slider"
                    type="range"
                    min="300"
                    max="5000"
                    step="50"
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(Number(e.target.value))}
                  />

                  <div className="browseFilterMenu__footer browseFilterMenu__footer--compact">
                    <button
                      type="button"
                      className="browseFilterMenu__clear"
                      onClick={() => setDraftMaxPrice(5000)}
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      className="browseFilterMenu__apply"
                      onClick={() => {
                        setMaxPrice(draftMaxPrice);
                        setOpenMenu(null);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="browseFilterGroup">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${openMenu === "location" ? "browseFilterTrigger--open" : ""}`}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
                onClick={openLocationMenu}
              >
                <MapPin className="browseFilterTrigger__icon" />
                <span>{locationValue === "All" ? "Location Services" : locationValue}</span>
                <ChevronDown
                  className={`browseFilterTrigger__chevron ${
                    openMenu === "location" ? "browseFilterTrigger__chevron--open" : ""
                  }`}
                />
              </motion.button>

              <div className={`browseFilterMenu browseFilterMenu--small ${openMenu === "location" ? "browseFilterMenu--open" : ""}`}>
                <div className="browseLocationMenu">
                  {LOCATION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`browseLocationMenu__item ${
                        draftLocationValue === option ? "browseLocationMenu__item--active" : ""
                      }`}
                      onClick={() => setDraftLocationValue(option)}
                    >
                      {option}
                    </button>
                  ))}

                  <div className="browseFilterMenu__footer browseFilterMenu__footer--compact">
                    <button
                      type="button"
                      className="browseFilterMenu__clear"
                      onClick={() => setDraftLocationValue("All")}
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      className="browseFilterMenu__apply"
                      onClick={() => {
                        setLocationValue(draftLocationValue);
                        setOpenMenu(null);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="browseControlPanel__bottom">
            <div className="browseResultsBar__left">
              <h2 className="browseResultsBar__title">
                {selectedServices.length > 0 ? "Filtered Services" : "All Services"}
              </h2>
              <p className="browseResultsBar__count">
                {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </section>

        <section className="browseServicesGrid">
          {paginatedServices.length > 0 ? (
            paginatedServices.map((service) => {
              const Icon = service.Icon;
              const saved = savedIds.includes(service.id);

              return (
                <motion.article
                  key={service.id}
                  className="browseServiceCard"
                  style={{
                    "--card-accent-a": service.accentA,
                    "--card-accent-b": service.accentB,
                  }}
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24 }}
                >
                  <div className="browseServiceCard__cover">
                    <span className="browseServiceCard__tag">{service.subcategory}</span>
                    <span className="browseServiceCard__coverIconWrap" aria-hidden="true">
                      <Icon className="browseServiceCard__coverIcon" />
                    </span>
                  </div>

                  <div className="browseServiceCard__body">
                    <div className="browseServiceCard__top">
                      <div>
                        <h3 className="browseServiceCard__title">{service.title}</h3>
                        <p className="browseServiceCard__creator">{service.creator}</p>
                      </div>

                      <motion.button
                        type="button"
                        className={`browseServiceCard__save ${saved ? "browseServiceCard__save--active" : ""}`}
                        aria-label="Save service"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleSaved(service.id)}
                      >
                        <motion.span
                          className="browseServiceCard__saveInner"
                          animate={
                            saved
                              ? { scale: [1, 1.18, 1], rotate: [0, -8, 0] }
                              : { scale: 1, rotate: 0 }
                          }
                          transition={{ duration: 0.28 }}
                        >
                          <Bookmark className="browseServiceCard__saveIcon" />
                        </motion.span>
                      </motion.button>
                    </div>

                    <p className="browseServiceCard__note">{service.note}</p>

                    <div className="browseServiceCard__meta">
                      <span className="browseMetaPill">
                        <Star className="browseMetaPill__icon" />
                        {service.rating}
                      </span>

                      <span className="browseMetaPill">
                        <MapPin className="browseMetaPill__icon" />
                        {service.location}
                      </span>

                      <span className="browseMetaPill">
                        <Sparkles className="browseMetaPill__icon" />
                        {service.delivery}
                      </span>
                    </div>

                    <div className="browseServiceCard__bottom">
                      <div className="browseServiceCard__priceWrap">
                        <span className="browseServiceCard__priceLabel">Starting at</span>
                        <div className="browseServiceCard__price">₱{service.price}</div>
                      </div>

                      <motion.button
                        type="button"
                        className="browseServiceCard__btn"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 340, damping: 24 }}
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
            <div className="browseEmptyState">
              <h3 className="browseEmptyState__title">No services found</h3>
              <p className="browseEmptyState__desc">
                Try adjusting your filters to discover more services.
              </p>
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <section className="browsePaginationWrap">
            <div className="browsePagination">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;

                return (
                  <motion.button
                    key={page}
                    type="button"
                    className={`browsePagination__btn ${currentPage === page ? "browsePagination__btn--active" : ""}`}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 340, damping: 24 }}
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