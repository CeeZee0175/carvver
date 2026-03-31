import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  BadgeCheck,
  ArrowUpDown,
  X,
  Clock,
  Map,
  Home,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast, { Toaster } from "react-hot-toast";
import "./browse_categories.css";
import DashBar from "./dashbar";
import HomeFooter from "../Homepage/home_footer";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const PH_CENTER = [12.8797, 121.774];
const PH_BOUNDS = [
  [4.5, 116.0],
  [21.8, 127.5],
];

const CATEGORY_GROUPS = [
  {
    label: "Creative Services",
    items: [
      "Art & Illustration",
      "Graphic Design",
      "Video Editing",
      "Voice Over",
      "Social Media",
      "Photography",
    ],
  },
  {
    label: "Handmade & Custom Work",
    items: [
      "Handmade Products",
      "Plushies",
      "Custom Gifts",
      "Costumes & Props",
      "Crochet & Knitting",
      "Embroidery",
    ],
  },
  {
    label: "Learning & Support",
    items: [
      "Tutoring",
      "Language Help",
      "Writing",
      "Virtual Assistance",
      "Craft Lessons",
      "Event Styling",
    ],
  },
];

const ALL_CATEGORY_ITEMS = CATEGORY_GROUPS.flatMap((group) => group.items);

const DELIVERY_OPTIONS = [
  { label: "Any", value: null },
  { label: "Express (1 day)", value: 1 },
  { label: "Up to 3 days", value: 3 },
  { label: "Up to 7 days", value: 7 },
  { label: "Up to 14 days", value: 14 },
];

const SORT_OPTIONS = [
  { label: "Best Match", value: "best" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

const PHILIPPINES_REGIONS = [
  {
    name: "NCR / Metro Manila",
    coords: [14.5995, 120.9842],
    cities: [
      { name: "Manila", coords: [14.5995, 120.9842] },
      { name: "Quezon City", coords: [14.676, 121.0437] },
      { name: "Makati", coords: [14.5547, 121.0244] },
      { name: "Taguig", coords: [14.5176, 121.0509] },
      { name: "Pasig", coords: [14.5764, 121.0851] },
      { name: "Mandaluyong", coords: [14.5794, 121.0359] },
      { name: "Marikina", coords: [14.6507, 121.1029] },
      { name: "Pasay", coords: [14.5378, 121.0014] },
      { name: "Parañaque", coords: [14.4793, 121.0198] },
    ],
  },
  {
    name: "CAR",
    coords: [16.4023, 120.596],
    cities: [
      { name: "Baguio", coords: [16.4023, 120.596] },
      { name: "La Trinidad", coords: [16.455, 120.587] },
      { name: "Tabuk", coords: [17.4082, 121.4443] },
      { name: "Bangued", coords: [17.6077, 120.6155] },
      { name: "Lagawe", coords: [16.7996, 121.1194] },
    ],
  },
  {
    name: "Ilocos Region",
    coords: [16.0, 120.5],
    cities: [
      { name: "Laoag", coords: [18.196, 120.593] },
      { name: "Vigan", coords: [17.5707, 120.3869] },
      { name: "San Fernando", coords: [16.6159, 120.3166] },
      { name: "Dagupan", coords: [16.043, 120.3333] },
      { name: "Alaminos", coords: [16.1546, 119.9813] },
    ],
  },
  {
    name: "Cagayan Valley",
    coords: [17.6131, 121.7269],
    cities: [
      { name: "Tuguegarao", coords: [17.6131, 121.7269] },
      { name: "Ilagan", coords: [17.1485, 121.8892] },
      { name: "Santiago", coords: [16.6914, 121.5487] },
      { name: "Cauayan", coords: [16.9297, 121.7696] },
      { name: "Bayombong", coords: [16.4812, 121.1498] },
    ],
  },
  {
    name: "Central Luzon",
    coords: [15.4828, 120.5979],
    cities: [
      { name: "Angeles City", coords: [15.145, 120.5887] },
      { name: "San Fernando", coords: [15.0343, 120.684] },
      { name: "Olongapo", coords: [14.8386, 120.2842] },
      { name: "Malolos", coords: [14.8433, 120.8111] },
      { name: "Cabanatuan", coords: [15.4859, 120.9665] },
      { name: "Tarlac City", coords: [15.4802, 120.5979] },
    ],
  },
  {
    name: "CALABARZON",
    coords: [14.1008, 121.0794],
    cities: [
      { name: "Antipolo", coords: [14.6255, 121.1245] },
      { name: "Calamba", coords: [14.2117, 121.1653] },
      { name: "Santa Rosa", coords: [14.3122, 121.111] },
      { name: "Batangas City", coords: [13.7565, 121.0583] },
      { name: "Lucena", coords: [13.9411, 121.6142] },
      { name: "Lipa", coords: [13.9411, 121.1631] },
      { name: "Dasmariñas", coords: [14.3294, 120.9367] },
      { name: "Imus", coords: [14.4297, 120.9367] },
    ],
  },
  {
    name: "MIMAROPA",
    coords: [12.3, 121.2],
    cities: [
      { name: "Puerto Princesa", coords: [9.7392, 118.7353] },
      { name: "Calapan", coords: [13.4115, 121.18] },
      { name: "Romblon", coords: [12.5778, 122.2692] },
      { name: "Boac", coords: [13.4466, 121.84] },
      { name: "Mamburao", coords: [13.2232, 120.596] },
    ],
  },
  {
    name: "Bicol Region",
    coords: [13.1391, 123.7438],
    cities: [
      { name: "Legazpi", coords: [13.1391, 123.7438] },
      { name: "Naga", coords: [13.6218, 123.1948] },
      { name: "Sorsogon", coords: [12.9708, 124.0055] },
      { name: "Tabaco", coords: [13.3586, 123.7337] },
      { name: "Iriga", coords: [13.4324, 123.4115] },
    ],
  },
  {
    name: "Western Visayas",
    coords: [10.7202, 122.5621],
    cities: [
      { name: "Iloilo City", coords: [10.7202, 122.5621] },
      { name: "Bacolod", coords: [10.6765, 122.95] },
      { name: "Roxas", coords: [11.5853, 122.7511] },
      { name: "Kalibo", coords: [11.7061, 122.3646] },
      { name: "Passi", coords: [11.1085, 122.6411] },
    ],
  },
  {
    name: "Central Visayas",
    coords: [10.3157, 123.8854],
    cities: [
      { name: "Cebu City", coords: [10.3157, 123.8854] },
      { name: "Mandaue", coords: [10.3231, 123.9411] },
      { name: "Lapu-Lapu", coords: [10.3103, 123.9494] },
      { name: "Tagbilaran", coords: [9.65, 123.85] },
      { name: "Dumaguete", coords: [9.3063, 123.3054] },
      { name: "Talisay", coords: [10.2447, 123.8494] },
    ],
  },
  {
    name: "Eastern Visayas",
    coords: [11.244, 125.0],
    cities: [
      { name: "Tacloban", coords: [11.244, 125.0] },
      { name: "Ormoc", coords: [11.0047, 124.6075] },
      { name: "Catbalogan", coords: [11.7753, 124.8861] },
      { name: "Borongan", coords: [11.6081, 125.4319] },
      { name: "Baybay", coords: [10.6785, 124.8006] },
    ],
  },
  {
    name: "Zamboanga Peninsula",
    coords: [8.1541, 123.2588],
    cities: [
      { name: "Zamboanga City", coords: [6.9214, 122.079] },
      { name: "Dipolog", coords: [8.5883, 123.3409] },
      { name: "Dapitan", coords: [8.6549, 123.4227] },
      { name: "Pagadian", coords: [7.8257, 123.437] },
      { name: "Isabela City", coords: [6.7041, 121.9712] },
    ],
  },
  {
    name: "Northern Mindanao",
    coords: [8.4542, 124.6319],
    cities: [
      { name: "Cagayan de Oro", coords: [8.4542, 124.6319] },
      { name: "Iligan", coords: [8.228, 124.2452] },
      { name: "Malaybalay", coords: [8.1575, 125.1278] },
      { name: "Valencia", coords: [7.9064, 125.0925] },
      { name: "Gingoog", coords: [8.821, 125.102] },
    ],
  },
  {
    name: "Davao Region",
    coords: [7.1907, 125.4553],
    cities: [
      { name: "Davao City", coords: [7.1907, 125.4553] },
      { name: "Tagum", coords: [7.4478, 125.8094] },
      { name: "Panabo", coords: [7.3081, 125.6842] },
      { name: "Mati", coords: [6.9551, 126.216] },
      { name: "Digos", coords: [6.7496, 125.3572] },
    ],
  },
  {
    name: "SOCCSKSARGEN",
    coords: [6.1164, 125.1716],
    cities: [
      { name: "General Santos", coords: [6.1164, 125.1716] },
      { name: "Koronadal", coords: [6.4974, 124.847] },
      { name: "Kidapawan", coords: [7.0083, 125.0894] },
      { name: "Tacurong", coords: [6.6925, 124.6769] },
      { name: "Midsayap", coords: [7.1906, 124.5306] },
    ],
  },
  {
    name: "Caraga",
    coords: [8.9475, 125.5406],
    cities: [
      { name: "Butuan", coords: [8.9475, 125.5406] },
      { name: "Surigao", coords: [9.789, 125.495] },
      { name: "Bislig", coords: [8.2153, 126.3164] },
      { name: "Bayugan", coords: [8.7561, 125.7675] },
      { name: "Tandag", coords: [9.0783, 126.1986] },
    ],
  },
  {
    name: "BARMM",
    coords: [7.2047, 124.231],
    cities: [
      { name: "Cotabato City", coords: [7.2047, 124.231] },
      { name: "Marawi", coords: [8.0034, 124.2839] },
      { name: "Lamitan", coords: [6.6502, 122.1295] },
      { name: "Jolo", coords: [6.0522, 121.0027] },
      { name: "Bongao", coords: [5.0286, 119.7731] },
    ],
  },
];

const ACCENT_COLORS = [
  { a: "rgba(124,58,237,0.22)", b: "rgba(242,193,78,0.14)" },
  { a: "rgba(42,20,80,0.20)", b: "rgba(124,58,237,0.14)" },
  { a: "rgba(242,193,78,0.22)", b: "rgba(124,58,237,0.12)" },
  { a: "rgba(124,58,237,0.18)", b: "rgba(42,20,80,0.12)" },
  { a: "rgba(42,20,80,0.16)", b: "rgba(242,193,78,0.14)" },
  { a: "rgba(242,193,78,0.20)", b: "rgba(42,20,80,0.14)" },
];

const ITEMS_PER_PAGE = 8;

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

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || Package;
}

function createPinIcon(className) {
  return L.divIcon({
    className: "browseLeafletPinWrap",
    html: `<span class="${className}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
}

const regionPinIcon = createPinIcon("browseLeafletPin browseLeafletPin--region");
const cityPinIcon = createPinIcon("browseLeafletPin browseLeafletPin--city");

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function ScrollReveal({ children, delay = 0, y = 20, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      animate={inView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

function TypewriterHeading({ text = "Browse Services" }) {
  const [displayText, setDisplayText] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      return;
    }

    let timeoutId;
    let index = 0;

    const tick = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) timeoutId = setTimeout(tick, 65);
    };

    timeoutId = setTimeout(tick, 80);
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
          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
        >
          |
        </motion.span>
      )}
    </h1>
  );
}

function MapViewportController({ focusTarget }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!focusTarget) return;

    if (focusTarget.type === "city") {
      map.flyTo(focusTarget.coords, 9, { duration: 0.9 });
      return;
    }

    if (focusTarget.type === "region") {
      map.flyTo(focusTarget.coords, 6.7, { duration: 0.9 });
      return;
    }

    map.flyTo(PH_CENTER, 5.5, { duration: 0.9 });
  }, [focusTarget, map]);

  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Category Modal                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function CategoryModal({
  open,
  onClose,
  selectedCategories,
  includeOthers,
  onApply,
}) {
  const reduceMotion = useReducedMotion();
  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const [draftIncludeOthers, setDraftIncludeOthers] = useState(includeOthers);

  useEffect(() => {
    if (!open) return;
    setDraftCategories(selectedCategories);
    setDraftIncludeOthers(includeOthers);
  }, [open, selectedCategories, includeOthers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleCategory = (item) => {
    setDraftCategories((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="browseModalLayer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="browseModalOverlay" onClick={onClose} />

          <motion.div
            className="browseCategoryModal"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="browseCategoryModal__header">
              <div>
                <h2 className="browseCategoryModal__title">Service Categories</h2>
                <p className="browseCategoryModal__sub">
                  Choose one or more categories to narrow down your results.
                </p>
              </div>

              <button
                type="button"
                className="browseCategoryModal__close"
                onClick={onClose}
                aria-label="Close categories modal"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="browseCategoryModal__body">
              <div className="browseCategoryModal__grid">
                {CATEGORY_GROUPS.map((group) => (
                  <section key={group.label} className="browseCategoryGroup">
                    <h3 className="browseCategoryGroup__title">{group.label}</h3>

                    <div className="browseCategoryGroup__items">
                      {group.items.map((item) => {
                        const checked = draftCategories.includes(item);

                        return (
                          <button
                            key={item}
                            type="button"
                            className={`browseCategoryOption ${checked ? "browseCategoryOption--checked" : ""}`}
                            onClick={() => toggleCategory(item)}
                          >
                            <span className="browseCategoryOption__box" aria-hidden="true">
                              {checked && <Check style={{ width: 11, height: 11, color: "#fff" }} />}
                            </span>
                            <span className="browseCategoryOption__text">{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <section className="browseCategoryOther">
                <button
                  type="button"
                  className={`browseCategoryOther__toggle ${draftIncludeOthers ? "browseCategoryOther__toggle--checked" : ""}`}
                  onClick={() => setDraftIncludeOthers((prev) => !prev)}
                >
                  <span className="browseCategoryOther__box" aria-hidden="true">
                    {draftIncludeOthers && <Check style={{ width: 11, height: 11, color: "#fff" }} />}
                  </span>
                  <span className="browseCategoryOther__text">Others</span>
                </button>

                <p className="browseCategoryOther__sub">
                  Include services that do not fall under the listed categories above.
                </p>
              </section>
            </div>

            <div className="browseCategoryModal__footer">
              <button
                type="button"
                className="browseCategoryModal__clear"
                onClick={() => {
                  setDraftCategories([]);
                  setDraftIncludeOthers(false);
                }}
              >
                Clear
              </button>

              <button
                type="button"
                className="browseCategoryModal__apply"
                onClick={() => {
                  onApply({
                    categories: draftCategories,
                    includeOthers: draftIncludeOthers,
                  });
                  onClose();
                }}
              >
                Apply Categories
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Location Modal                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function LocationMapModal({
  open,
  onClose,
  selectedRegion,
  selectedCity,
  onApply,
}) {
  const reduceMotion = useReducedMotion();

  const [activeRegion, setActiveRegion] = useState(selectedRegion);
  const [activeCity, setActiveCity] = useState(selectedCity);
  const [expandedRegion, setExpandedRegion] = useState(selectedRegion || "NCR / Metro Manila");
  const [focusTarget, setFocusTarget] = useState({ type: "country", coords: PH_CENTER });

  useEffect(() => {
    if (!open) return;

    setActiveRegion(selectedRegion);
    setActiveCity(selectedCity);
    setExpandedRegion(selectedRegion || "NCR / Metro Manila");

    if (selectedCity && selectedRegion) {
      const region = PHILIPPINES_REGIONS.find((r) => r.name === selectedRegion);
      const city = region?.cities.find((c) => c.name === selectedCity);
      if (city) {
        setFocusTarget({ type: "city", coords: city.coords });
        return;
      }
    }

    if (selectedRegion) {
      const region = PHILIPPINES_REGIONS.find((r) => r.name === selectedRegion);
      if (region) {
        setFocusTarget({ type: "region", coords: region.coords });
        return;
      }
    }

    setFocusTarget({ type: "country", coords: PH_CENTER });
  }, [open, selectedRegion, selectedCity]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selectedLabel = activeCity || activeRegion || "All Philippines";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="browseModalLayer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="browseModalOverlay" onClick={onClose} />

          <motion.div
            className="browseLocationModal"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="browseLocationModal__header">
              <div>
                <h2 className="browseLocationModal__title">Location Services</h2>
                <p className="browseLocationModal__sub">
                  Select a region or city to discover nearby service providers.
                </p>
              </div>

              <button
                type="button"
                className="browseLocationModal__close"
                onClick={onClose}
                aria-label="Close location modal"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="browseLocationModal__preview">
              <div className="browseLocationModal__mapCard">
                <div className="browseLocationModal__mapTop">
                  <div>
                    <span className="browseLocationModal__mapEyebrow">Map Preview</span>
                    <h3 className="browseLocationModal__mapTitle">{selectedLabel}</h3>
                  </div>

                  <span className="browseLocationModal__selectedPill">{selectedLabel}</span>
                </div>

                <div className="browseLocationModal__leafletWrap">
                  <MapContainer
                    center={PH_CENTER}
                    zoom={5.5}
                    minZoom={5}
                    maxZoom={11}
                    maxBounds={PH_BOUNDS}
                    scrollWheelZoom
                    zoomControl={false}
                    className="browseLocationModal__leaflet"
                  >
                    <ZoomControl position="bottomright" />

                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapViewportController focusTarget={focusTarget} />

                    {PHILIPPINES_REGIONS.map((region) => (
                      <Marker
                        key={region.name}
                        position={region.coords}
                        icon={regionPinIcon}
                        eventHandlers={{
                          click: () => {
                            setExpandedRegion(region.name);
                            setActiveRegion(region.name);
                            setActiveCity(null);
                            setFocusTarget({ type: "region", coords: region.coords });
                          },
                        }}
                      >
                        <Popup className="browseLeafletPopup" closeButton={false}>
                          <div className="browseLeafletPopup__card">
                            <div>
                              <h4 className="browseLeafletPopup__title">{region.name}</h4>
                              <p className="browseLeafletPopup__sub">{region.cities.length} cities available</p>
                            </div>

                            <button
                              type="button"
                              className="browseLeafletPopup__btn"
                              onClick={() => {
                                setExpandedRegion(region.name);
                                setActiveRegion(region.name);
                                setActiveCity(null);
                                setFocusTarget({ type: "region", coords: region.coords });
                              }}
                            >
                              Open Region
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {(() => {
                      const region = PHILIPPINES_REGIONS.find((r) => r.name === expandedRegion);
                      if (!region) return null;

                      return region.cities.map((city) => (
                        <Marker
                          key={city.name}
                          position={city.coords}
                          icon={cityPinIcon}
                          eventHandlers={{
                            click: () => {
                              setActiveRegion(region.name);
                              setActiveCity(city.name);
                              setFocusTarget({ type: "city", coords: city.coords });
                            },
                          }}
                        >
                          <Popup className="browseLeafletPopup" closeButton={false}>
                            <div className="browseLeafletPopup__card">
                              <div>
                                <h4 className="browseLeafletPopup__title">{city.name}</h4>
                                <p className="browseLeafletPopup__sub">{region.name}</p>
                              </div>

                              <button
                                type="button"
                                className="browseLeafletPopup__btn browseLeafletPopup__btn--city"
                                onClick={() => {
                                  setActiveRegion(region.name);
                                  setActiveCity(city.name);
                                  setFocusTarget({ type: "city", coords: city.coords });
                                }}
                              >
                                Use City
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ));
                    })()}
                  </MapContainer>
                </div>

                <div className="browseLocationModal__legend">
                  <span className="browseLocationModal__legendItem">
                    <span className="browseLocationModal__legendPin browseLocationModal__legendPin--region" />
                    Region pin
                  </span>
                  <span className="browseLocationModal__legendItem">
                    <span className="browseLocationModal__legendPin browseLocationModal__legendPin--city" />
                    City pin
                  </span>
                </div>
              </div>
            </div>

            <div className="browseLocationModal__regions">
              <button
                type="button"
                className={`browseLocationModal__allBtn ${!activeRegion && !activeCity ? "browseLocationModal__allBtn--active" : ""}`}
                onClick={() => {
                  setActiveRegion(null);
                  setActiveCity(null);
                  setFocusTarget({ type: "country", coords: PH_CENTER });
                }}
              >
                <span>All Philippines</span>
                <span className="browseLocationModal__allSub">
                  Show all available locations nationwide
                </span>
              </button>

              {PHILIPPINES_REGIONS.map((region) => {
                const expanded = expandedRegion === region.name;
                const regionActive = activeRegion === region.name && !activeCity;

                return (
                  <div
                    key={region.name}
                    className={`browseRegionCard ${regionActive ? "browseRegionCard--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="browseRegionCard__header"
                      onClick={() => {
                        setExpandedRegion((prev) => (prev === region.name ? null : region.name));
                        setFocusTarget({ type: "region", coords: region.coords });
                      }}
                    >
                      <div className="browseRegionCard__headerLeft">
                        <span className="browseRegionCard__title">{region.name}</span>
                        <span className="browseRegionCard__count">{region.cities.length} cities</span>
                      </div>

                      <ChevronDown
                        className={`browseRegionCard__chevron ${expanded ? "browseRegionCard__chevron--open" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          className="browseRegionCard__content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                          <button
                            type="button"
                            className={`browseRegionCard__allCities ${regionActive ? "browseRegionCard__allCities--active" : ""}`}
                            onClick={() => {
                              setActiveRegion(region.name);
                              setActiveCity(null);
                              setFocusTarget({ type: "region", coords: region.coords });
                            }}
                          >
                            Use all cities in {region.name}
                          </button>

                          <div className="browseRegionCard__cities">
                            {region.cities.map((city) => {
                              const cityActive = activeCity === city.name;

                              return (
                                <button
                                  key={city.name}
                                  type="button"
                                  className={`browseCityChip ${cityActive ? "browseCityChip--active" : ""}`}
                                  onClick={() => {
                                    setActiveRegion(region.name);
                                    setActiveCity(city.name);
                                    setFocusTarget({ type: "city", coords: city.coords });
                                  }}
                                >
                                  {city.name}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="browseLocationModal__footer">
              <button
                type="button"
                className="browseLocationModal__clear"
                onClick={() => {
                  setActiveRegion(null);
                  setActiveCity(null);
                  setFocusTarget({ type: "country", coords: PH_CENTER });
                }}
              >
                Clear
              </button>

              <button
                type="button"
                className="browseLocationModal__apply"
                onClick={() => {
                  onApply({
                    region: activeRegion,
                    city: activeCity,
                  });
                  onClose();
                }}
              >
                Apply Location
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Service Card                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function ServiceCard({ service, index, savedIds, onToggleSave, cardTransition }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const saved = savedIds.includes(service.id);
  const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const Icon = getCategoryIcon(service.category);

  const creatorName = service.profiles
    ? `${service.profiles.first_name} ${service.profiles.last_name}`
    : "Unknown Creator";

  const initials = service.profiles
    ? `${service.profiles.first_name?.charAt(0) || ""}${service.profiles.last_name?.charAt(0) || ""}`.toUpperCase()
    : "?";

  return (
    <motion.article
      ref={ref}
      className="browseServiceCard"
      style={{ "--card-accent-a": colors.a, "--card-accent-b": colors.b }}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.48,
        ease: [0.22, 1, 0.36, 1],
        delay: (index % 4) * 0.07,
      }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <div className="browseServiceCard__media">
        <div className="browseServiceCard__mediaBg">
          <span className="browseServiceCard__mediaIconWrap" aria-hidden="true">
            <Icon className="browseServiceCard__mediaIcon" />
          </span>
        </div>

        <div className="browseServiceCard__mediaTop">
          <span className="browseServiceCard__tag">{service.category}</span>

          <motion.button
            type="button"
            className={`browseServiceCard__save ${saved ? "browseServiceCard__save--active" : ""}`}
            aria-label={saved ? "Remove from saved" : "Save service"}
            whileTap={{ scale: 0.82 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(service.id);
            }}
          >
            <motion.span
              animate={saved ? { scale: [1, 1.28, 1] } : { scale: 1 }}
              transition={{ duration: 0.22 }}
              style={{ display: "inline-grid", placeItems: "center" }}
            >
              <Bookmark style={{ width: 15, height: 15 }} fill={saved ? "currentColor" : "none"} />
            </motion.span>
          </motion.button>
        </div>

        {service.is_pro && (
          <div className="browseServiceCard__proBadge">
            <BadgeCheck style={{ width: 12, height: 12 }} />
            Pro
          </div>
        )}
      </div>

      <div className="browseServiceCard__body">
        <div className="browseServiceCard__creatorRow">
          <div className="browseServiceCard__avatar">{initials}</div>
          <span className="browseServiceCard__creator">{creatorName}</span>
        </div>

        <h3 className="browseServiceCard__title">{service.title}</h3>

        <div className="browseServiceCard__ratingRow">
          <Star className="browseServiceCard__starIcon" />
          <span className="browseServiceCard__rating">—</span>
          <span className="browseServiceCard__reviewCount">(0 reviews)</span>
        </div>

        <div className="browseServiceCard__bottom">
          <div className="browseServiceCard__priceWrap">
            <span className="browseServiceCard__priceFrom">From</span>
            <span className="browseServiceCard__price">
              ₱{Number(service.price).toLocaleString()}
            </span>
          </div>

          <motion.button
            type="button"
            className="browseServiceCard__btn"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            transition={cardTransition}
            onClick={() => toast("Service detail page coming soon!")}
          >
            View
            <ArrowRight style={{ width: 13, height: 13 }} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Skeleton Card                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="browseServiceCard browseServiceCard--skeleton">
      <div className="browseServiceCard__media browseServiceCard__media--skeleton" />
      <div className="browseServiceCard__body">
        <div className="browseServiceCard__creatorRow">
          <div className="browseSkel browseSkel--avatar" />
          <div className="browseSkel browseSkel--name" />
        </div>
        <div className="browseSkel browseSkel--title" />
        <div className="browseSkel browseSkel--subtitle" />
        <div className="browseServiceCard__bottom" style={{ marginTop: 14 }}>
          <div className="browseSkel browseSkel--price" />
          <div className="browseSkel browseSkel--btn" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Empty State                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <ScrollReveal className="browseEmptyState">
      <div className="browseEmptyState__iconWrap" aria-hidden="true">
        <Package style={{ width: 26, height: 26 }} />
      </div>
      <h3 className="browseEmptyState__title">
        {hasFilters ? "No services match your filters" : "No services yet"}
      </h3>
      <p className="browseEmptyState__desc">
        {hasFilters
          ? "Try adjusting or clearing your filters to discover more services."
          : "Once freelancers start publishing their services, they'll appear here."}
      </p>
      {hasFilters && (
        <motion.button
          type="button"
          className="browseEmptyState__btn"
          onClick={onClearFilters}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Clear all filters
        </motion.button>
      )}
    </ScrollReveal>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Filter Dropdown                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function FilterDropdown({ label, icon: Icon, open, onToggle, children, wide }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="browseFilterGroup">
      <motion.button
        type="button"
        className={`browseFilterTrigger ${open ? "browseFilterTrigger--open" : ""}`}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 24 }}
        onClick={onToggle}
      >
        {Icon && <Icon style={{ width: 14, height: 14 }} />}
        <span>{label}</span>
        <ChevronDown
          className={`browseFilterTrigger__chevron ${open ? "browseFilterTrigger__chevron--open" : ""}`}
          style={{ width: 14, height: 14 }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`browseFilterMenu ${wide ? "browseFilterMenu--wide" : "browseFilterMenu--small"}`}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export default function BrowseCategories() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const cardTransition = { type: "spring", stiffness: 340, damping: 26 };

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openMenu, setOpenMenu] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [includeOthers, setIncludeOthers] = useState(false);

  const [deliveryDays, setDeliveryDays] = useState(null);

  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [draftMinBudget, setDraftMinBudget] = useState("");
  const [draftMaxBudget, setDraftMaxBudget] = useState("");

  const [sortBy, setSortBy] = useState("best");
  const [proOnly, setProOnly] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState([]);

  const filterRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, title, category, price, location, description, created_at, is_published, is_pro, profiles(first_name, last_name)")
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

    load();
  }, []);

    // ── Load user's saved service IDs on mount ──
  useEffect(() => {
    async function loadSavedIds() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("saved_services")
        .select("service_id")
        .eq("user_id", session.user.id);

      if (data) setSavedIds(data.map((row) => row.service_id));
    }

    loadSavedIds();
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (!filterRef.current?.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenMenu(null);
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const hasFilters =
    selectedCategories.length > 0 ||
    includeOthers ||
    deliveryDays ||
    minBudget ||
    maxBudget ||
    proOnly ||
    selectedRegion ||
    selectedCity;

  const filteredServices = useMemo(() => {
    let list = [...services];

    if (selectedCategories.length > 0 || includeOthers) {
      list = list.filter((s) => {
        const inSelected = selectedCategories.includes(s.category);
        const isOther = includeOthers && !ALL_CATEGORY_ITEMS.includes(s.category);
        return inSelected || isOther;
      });
    }

    if (minBudget !== "") {
      list = list.filter((s) => Number(s.price) >= Number(minBudget));
    }

    if (maxBudget !== "") {
      list = list.filter((s) => Number(s.price) <= Number(maxBudget));
    }

    if (proOnly) {
      list = list.filter((s) => s.is_pro);
    }

    if (selectedCity) {
      list = list.filter((s) =>
        s.location?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    } else if (selectedRegion) {
      const region = PHILIPPINES_REGIONS.find((r) => r.name === selectedRegion);
      if (region) {
        list = list.filter((s) =>
          region.cities.some((city) =>
            s.location?.toLowerCase().includes(city.name.toLowerCase())
          )
        );
      }
    }

    switch (sortBy) {
      case "newest":
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "price_asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default:
        break;
    }

    return list;
  }, [services, selectedCategories, includeOthers, deliveryDays, minBudget, maxBudget, proOnly, selectedRegion, selectedCity, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, includeOthers, deliveryDays, minBudget, maxBudget, proOnly, selectedRegion, selectedCity, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setIncludeOthers(false);
    setDeliveryDays(null);
    setMinBudget("");
    setMaxBudget("");
    setDraftMinBudget("");
    setDraftMaxBudget("");
    setProOnly(false);
    setSelectedRegion(null);
    setSelectedCity(null);
    setSortBy("best");
  }, []);

  const handleToggleSave = useCallback(async (serviceId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to save services.");
      return;
    }

    const userId = session.user.id;
    const isSaved = savedIds.includes(serviceId);

    // optimistic update
    setSavedIds((prev) =>
      isSaved ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_services")
          .delete()
          .eq("user_id", userId)
          .eq("service_id", serviceId);
        if (error) throw error;
        toast("Removed from saved", { duration: 1800 });
      } else {
        const { error } = await supabase
          .from("saved_services")
          .insert([{ user_id: userId, service_id: serviceId }]);
        if (error) throw error;
        toast("Saved!", { duration: 1800 });
      }
    } catch {
      // rollback on failure
      setSavedIds((prev) =>
        isSaved ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
      );
      toast.error("Something went wrong. Please try again.");
    }
  }, [savedIds]);

  const categoriesLabel =
    selectedCategories.length === 0 && !includeOthers
      ? "Categories"
      : includeOthers && selectedCategories.length === 0
      ? "Others"
      : includeOthers
      ? `${selectedCategories.length + 1} selected`
      : selectedCategories.length === 1
      ? selectedCategories[0]
      : `${selectedCategories.length} selected`;

  const budgetLabel =
    minBudget || maxBudget
      ? `₱${minBudget || "0"} - ₱${maxBudget || "∞"}`
      : "Budget";

  const deliveryLabel = deliveryDays
    ? DELIVERY_OPTIONS.find((o) => o.value === deliveryDays)?.label || "Delivery"
    : "Delivery time";

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort by";

  const locationLabel = selectedCity || selectedRegion || "Location Services";

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

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        selectedCategories={selectedCategories}
        includeOthers={includeOthers}
        onApply={({ categories, includeOthers: nextOthers }) => {
          setSelectedCategories(categories);
          setIncludeOthers(nextOthers);
        }}
      />

      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        selectedRegion={selectedRegion}
        selectedCity={selectedCity}
        onApply={({ region, city }) => {
          setSelectedRegion(region);
          setSelectedCity(city);
        }}
      />

      <main className="browseCategories__main">
        <ScrollReveal y={8}>
          <section className="browseCrumbs">
            <motion.button
              type="button"
              className="browseCrumbs__home"
              whileHover={{ x: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={cardTransition}
              onClick={() => navigate("/dashboard/customer")}
            >
              <Home className="browseCrumbs__icon" />
              <span>Home</span>
            </motion.button>

            <span className="browseCrumbs__sep">/</span>
            <span className="browseCrumbs__current">Service Listings</span>
          </section>
        </ScrollReveal>

        <ScrollReveal y={14} delay={0.04}>
          <section className="browseHero">
            <div className="browseHero__titleWrap">
              <TypewriterHeading />
              <motion.svg
                className="browseHero__line"
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.1 }}
                />
              </motion.svg>
            </div>

            <p className="browseHero__sub">
              Discover creative and handmade services from casual freelancers, hobbyists, and trusted
              creators — all in one place.
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal y={14} delay={0.06}>
          <section className="browseControlPanel" ref={filterRef}>
            <div className="browseFilterBar__inner">
              <motion.button
                type="button"
                className={`browseFilterTrigger ${categoryModalOpen ? "browseFilterTrigger--open" : ""}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={cardTransition}
                onClick={() => setCategoryModalOpen(true)}
              >
                <SlidersHorizontal style={{ width: 14, height: 14 }} />
                <span>{categoriesLabel}</span>
                <ChevronDown className={`browseFilterTrigger__chevron ${categoryModalOpen ? "browseFilterTrigger__chevron--open" : ""}`} style={{ width: 14, height: 14 }} />
              </motion.button>

              <FilterDropdown
                label={budgetLabel}
                open={openMenu === "budget"}
                onToggle={() => {
                  setDraftMinBudget(minBudget);
                  setDraftMaxBudget(maxBudget);
                  setOpenMenu((prev) => (prev === "budget" ? null : "budget"));
                }}
              >
                <div className="browseBudgetMenu">
                  <div className="browseBudgetMenu__field">
                    <label className="browseBudgetMenu__label">Minimum Price</label>
                    <div className="browseBudgetMenu__inputWrap">
                      <span className="browseBudgetMenu__peso">₱</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={draftMinBudget}
                        onChange={(e) => setDraftMinBudget(e.target.value)}
                        className="browseBudgetMenu__input"
                      />
                    </div>
                  </div>

                  <div className="browseBudgetMenu__field">
                    <label className="browseBudgetMenu__label">Maximum Price</label>
                    <div className="browseBudgetMenu__inputWrap">
                      <span className="browseBudgetMenu__peso">₱</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="5000"
                        value={draftMaxBudget}
                        onChange={(e) => setDraftMaxBudget(e.target.value)}
                        className="browseBudgetMenu__input"
                      />
                    </div>
                  </div>

                  <div className="browseFilterMenu__footer browseFilterMenu__footer--compact">
                    <motion.button
                      type="button"
                      className="browseFilterMenu__clear"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={cardTransition}
                      onClick={() => {
                        setDraftMinBudget("");
                        setDraftMaxBudget("");
                      }}
                    >
                      Reset
                    </motion.button>

                    <motion.button
                      type="button"
                      className="browseFilterMenu__apply"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={cardTransition}
                      onClick={() => {
                        setMinBudget(draftMinBudget);
                        setMaxBudget(draftMaxBudget);
                        setOpenMenu(null);
                      }}
                    >
                      Apply
                    </motion.button>
                  </div>
                </div>
              </FilterDropdown>

              <FilterDropdown
                label={deliveryLabel}
                icon={Clock}
                open={openMenu === "delivery"}
                onToggle={() => setOpenMenu((prev) => (prev === "delivery" ? null : "delivery"))}
              >
                <div className="browseSimpleMenu">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      className={`browseSimpleMenu__item ${deliveryDays === opt.value ? "browseSimpleMenu__item--active" : ""}`}
                      onClick={() => {
                        setDeliveryDays(opt.value);
                        setOpenMenu(null);
                      }}
                    >
                      {deliveryDays === opt.value && <Check style={{ width: 13, height: 13 }} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterDropdown>

              <motion.button
                type="button"
                className={`browseFilterTrigger browseFilterTrigger--location ${(selectedRegion || selectedCity) ? "browseFilterTrigger--open" : ""}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={cardTransition}
                onClick={() => setMapOpen(true)}
                title="Filter by location"
              >
                <Map style={{ width: 14, height: 14 }} />
                <span>{locationLabel}</span>
                {(selectedRegion || selectedCity) && (
                  <span
                    className="browseFilterTrigger__clearPin"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegion(null);
                      setSelectedCity(null);
                    }}
                    role="button"
                    aria-label="Clear location filter"
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </span>
                )}
              </motion.button>

              <motion.button
                type="button"
                className={`browseFilterToggle browseFilterToggle--pro ${proOnly ? "browseFilterToggle--active" : ""}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={cardTransition}
                onClick={() => setProOnly((prev) => !prev)}
              >
                <BadgeCheck style={{ width: 14, height: 14 }} />
                Pro Services
              </motion.button>

              <FilterDropdown
                label={`Sort: ${sortLabel}`}
                icon={ArrowUpDown}
                open={openMenu === "sort"}
                onToggle={() => setOpenMenu((prev) => (prev === "sort" ? null : "sort"))}
              >
                <div className="browseSimpleMenu">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`browseSimpleMenu__item ${sortBy === opt.value ? "browseSimpleMenu__item--active" : ""}`}
                      onClick={() => {
                        setSortBy(opt.value);
                        setOpenMenu(null);
                      }}
                    >
                      {sortBy === opt.value && <Check style={{ width: 13, height: 13 }} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterDropdown>

              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    type="button"
                    className="browseFilterClear"
                    initial={{ opacity: 0, scale: 0.88, x: -6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.88, x: -6 }}
                    transition={{ duration: 0.18 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={clearAllFilters}
                  >
                    <X style={{ width: 13, height: 13 }} />
                    Clear filters
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="browseControlPanel__bottom">
              <p className="browseResultsBar__count">
                {loading
                  ? "Loading services..."
                  : `${filteredServices.length} service${filteredServices.length !== 1 ? "s" : ""} found${
                      selectedCity
                        ? ` in ${selectedCity}`
                        : selectedRegion
                        ? ` in ${selectedRegion}`
                        : ""
                    }`}
              </p>
            </div>
          </section>
        </ScrollReveal>

        <section className="browseServicesGrid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : paginatedServices.length > 0 ? (
            paginatedServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                cardTransition={cardTransition}
              />
            ))
          ) : (
            <EmptyState hasFilters={!!hasFilters} onClearFilters={clearAllFilters} />
          )}
        </section>

        {!loading && totalPages > 1 && (
          <ScrollReveal>
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
                      whileTap={{ scale: 0.95 }}
                      transition={cardTransition}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
                      }}
                    >
                      {page}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>

      <section className="browseCategories__footerSection">
        <HomeFooter fullBleed />
      </section>
    </div>
  );
}