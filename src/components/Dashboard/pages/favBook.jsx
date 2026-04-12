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
  LayoutGroup,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  MapPin,
  Mic2,
  Package,
  Palette,
  PenTool,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Star,
  Video,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./favBook.css";
import { createClient } from "../../../lib/supabase/client";
import { useCart } from "../hooks/useCart";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
} from "../shared/customerProfileShared";

const supabase = createClient();

/* ─── Constants ─── */

const SORT_OPTIONS = [
  { label: "Recently Saved", value: "recent" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Alphabetical", value: "alpha" },
];

const CATEGORY_ICONS = {
  "Art & Illustration": Palette,
  Photography: Camera,
  "Video Editing": Video,
  "Graphic Design": PenTool,
  "Voice Over": Mic2,
  "Social Media": Share2,
  Tutoring: GraduationCap,
  "Handmade Products": ShoppingBag,
};

const ACCENT_COLORS = [
  { a: "rgba(124,58,237,0.22)", b: "rgba(242,193,78,0.14)" },
  { a: "rgba(42,20,80,0.20)", b: "rgba(124,58,237,0.14)" },
  { a: "rgba(242,193,78,0.22)", b: "rgba(124,58,237,0.12)" },
  { a: "rgba(124,58,237,0.18)", b: "rgba(42,20,80,0.12)" },
  { a: "rgba(42,20,80,0.16)", b: "rgba(242,193,78,0.14)" },
  { a: "rgba(242,193,78,0.20)", b: "rgba(42,20,80,0.14)" },
];

const SPRING = { type: "spring", stiffness: 340, damping: 26 };

/* ─── Helpers ─── */

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || Package;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }

  return "Just now";
}

/* ─── ScrollReveal ─── */

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
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Typewriter Heading ─── */

function TypewriterHeading({ text = "Saved Listings" }) {
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
    <h1 className="favHero__title">
      {displayText}
      {!reduceMotion && displayText.length < text.length && (
        <motion.span
          className="favHero__cursor"
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

/* ─── Fav Card ─── */

function FavCard({
  item,
  index,
  cartServiceIds,
  onOpenServiceDetail,
  onOpenCart,
  onRemove,
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const service = item.services;
  if (!service) return null;
  const inCart = cartServiceIds.includes(service.id);

  const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const Icon = getCategoryIcon(service.category);

  const creatorName = service.profiles
    ? `${service.profiles.first_name || ""} ${service.profiles.last_name || ""}`.trim()
    : "Unknown Creator";

  const initials = service.profiles
    ? `${service.profiles.first_name?.charAt(0) || ""}${service.profiles.last_name?.charAt(0) || ""}`.toUpperCase()
    : "?";

  return (
    <motion.article
      ref={ref}
      layout
      className="favCard"
      style={{ "--fav-accent-a": colors.a, "--fav-accent-b": colors.b }}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.88, filter: "blur(6px)" }
      }
      transition={{
        layout: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.26 },
        scale: { duration: 0.26 },
        y: { duration: 0.44, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.06 },
      }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <div className="favCard__media">
        <div className="favCard__mediaBg">
          <span className="favCard__mediaIconWrap" aria-hidden="true">
            <Icon className="favCard__mediaIcon" />
          </span>
        </div>

        <div className="favCard__mediaTop">
          <span className="favCard__tag">{service.category}</span>

          <motion.button
            type="button"
            className="favCard__remove"
            aria-label="Remove from saved"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.82, rotate: -8 }}
            transition={SPRING}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id, item.service_id);
            }}
          >
            <X className="favCard__removeIcon" />
          </motion.button>
        </div>

        <div className="favCard__savedBadge">
          <Clock className="favCard__savedIcon" />
          {timeAgo(item.created_at)}
        </div>

        {service.is_pro && (
          <div className="favCard__proBadge">
            <BadgeCheck style={{ width: 12, height: 12 }} />
            Pro
          </div>
        )}
      </div>

      <div className="favCard__body">
        <div className="favCard__creatorRow">
          <div className="favCard__avatar">{initials}</div>
          <span className="favCard__creator">{creatorName}</span>
        </div>

        <h3 className="favCard__title">{service.title}</h3>

        {service.location && (
          <div className="favCard__locationRow">
            <MapPin className="favCard__locationIcon" />
            <span>{service.location}</span>
          </div>
        )}

        <div className="favCard__bottom">
          <div className="favCard__priceWrap">
            <span className="favCard__priceFrom">From</span>
            <span className="favCard__price">
              ₱{Number(service.price).toLocaleString()}
            </span>
          </div>

          <div className="favCard__actions">
            <motion.button
              type="button"
              className={`favCard__cartBtn ${inCart ? "favCard__cartBtn--active" : ""}`}
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              onClick={() => {
                if (inCart) {
                  onOpenCart();
                  return;
                }

                onOpenServiceDetail(service.id);
              }}
            >
              <ShoppingCart className="favCard__cartIcon" />
              <span>{inCart ? "In cart" : "Choose package"}</span>
            </motion.button>

            <motion.button
              type="button"
              className="favCard__viewBtn"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              onClick={() => onOpenServiceDetail(service.id)}
            >
              View
              <ArrowRight className="favCard__viewIcon" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Skeleton Card ─── */

function SkeletonCard() {
  return (
    <div className="favCard favCard--skeleton">
      <div className="favCard__media favCard__media--skeleton" />
      <div className="favCard__body">
        <div className="favCard__creatorRow">
          <div className="favSkel favSkel--avatar" />
          <div className="favSkel favSkel--name" />
        </div>
        <div className="favSkel favSkel--title" />
        <div className="favSkel favSkel--subtitle" />
        <div className="favCard__bottom" style={{ marginTop: 14 }}>
          <div className="favSkel favSkel--price" />
          <div className="favSkel favSkel--btn" />
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({ hasSearch, onClearSearch, onBrowse }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="favEmpty"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3 className="favEmpty__title">
        {hasSearch ? "No matches found" : "No saved listings yet"}
      </h3>

      {hasSearch ? (
        <motion.button
          type="button"
          className="favEmpty__btn"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          onClick={onClearSearch}
        >
          Clear search
        </motion.button>
      ) : (
        <motion.button
          type="button"
          className="favEmpty__btn"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          onClick={onBrowse}
        >
          <span>Browse Services</span>
          <ArrowRight className="favEmpty__btnIcon" />
        </motion.button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */

export default function FavBook() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { serviceIds: cartServiceIds } = useCart();

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [openSort, setOpenSort] = useState(false);

  const sortRef = useRef(null);

  /* ── Load saved services from Supabase ── */

  useEffect(() => {
    async function loadSaved() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const { data, error } = await supabase
          .from("saved_services")
          .select(
            `
            id,
            created_at,
            service_id,
            services (
              id,
              title,
              category,
              price,
              location,
              is_published,
              is_pro,
              freelancer_id,
              profiles (
                first_name,
                last_name
              )
            )
          `
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSavedItems(data || []);
      } catch {
        toast.error("Couldn't load saved listings.");
        setSavedItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadSaved();
  }, []);

  /* ── Close sort on outside click / escape ── */

  useEffect(() => {
    const onDown = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setOpenSort(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenSort(false);
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /* ── Derived: unique categories from saved items ── */

  const categories = useMemo(() => {
    const set = new Set();
    savedItems.forEach((item) => {
      if (item.services?.category) set.add(item.services.category);
    });
    return Array.from(set).sort();
  }, [savedItems]);

  /* ── Derived: filtered + sorted items ── */

  const filteredItems = useMemo(() => {
    let list = [...savedItems];

    // filter by category
    if (activeCategory) {
      list = list.filter((item) => item.services?.category === activeCategory);
    }

    // filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const s = item.services;
        if (!s) return false;

        const title = s.title?.toLowerCase() || "";
        const category = s.category?.toLowerCase() || "";
        const location = s.location?.toLowerCase() || "";
        const creator = s.profiles
          ? `${s.profiles.first_name} ${s.profiles.last_name}`.toLowerCase()
          : "";

        return (
          title.includes(q) ||
          category.includes(q) ||
          location.includes(q) ||
          creator.includes(q)
        );
      });
    }

    // sort
    switch (sortBy) {
      case "recent":
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "price_asc":
        list.sort(
          (a, b) => Number(a.services?.price || 0) - Number(b.services?.price || 0)
        );
        break;
      case "price_desc":
        list.sort(
          (a, b) => Number(b.services?.price || 0) - Number(a.services?.price || 0)
        );
        break;
      case "alpha":
        list.sort((a, b) =>
          (a.services?.title || "").localeCompare(b.services?.title || "")
        );
        break;
      default:
        break;
    }

    return list;
  }, [savedItems, activeCategory, searchQuery, sortBy]);

  /* ── Remove handler (optimistic UI) ── */

  const handleRemove = useCallback(
    async (savedRowId, serviceId) => {
      const previousItems = [...savedItems];

      // optimistic remove
      setSavedItems((prev) => prev.filter((item) => item.id !== savedRowId));

      try {
        const { error } = await supabase
          .from("saved_services")
          .delete()
          .eq("id", savedRowId);

        if (error) throw error;

        toast("Removed from saved", {
          icon: "✓",
          style: {
            fontWeight: 700,
            borderRadius: "12px",
          },
          duration: 1800,
        });
      } catch {
        // rollback
        setSavedItems(previousItems);
        toast.error("Couldn't remove. Please try again.");
      }
    },
    [savedItems]
  );

  const handleOpenCart = useCallback(() => {
    navigate("/dashboard/customer/cart");
  }, [navigate]);

  const handleOpenServiceDetail = useCallback(
    (serviceId) => {
      if (!serviceId) {
        toast.error("We couldn't open this listing right now.");
        return;
      }

      navigate(`/dashboard/customer/browse-services/${serviceId}`);
    },
    [navigate]
  );

  /* ── Clear search / filters ── */

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveCategory(null);
  }, []);

  /* ── UI values ── */

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";

  const hasSearch = !!(searchQuery.trim() || activeCategory);

  const subtitle = loading
    ? "Loading your collection…"
    : savedItems.length === 0
      ? "Your personal collection of services you love"
      : `${savedItems.length} service${savedItems.length !== 1 ? "s" : ""} in your collection`;

  /* ─── Render ─── */

  return (
    <CustomerDashboardFrame mainClassName="favBookPage">
      <Toaster position="top-center" />
      <div className="favBook">
      
        {/* ── Breadcrumb ── */}
        <ScrollReveal y={8}>
          <DashboardBreadcrumbs items={[{ label: "Saved Listings" }]} />
        </ScrollReveal>

        {/* ── Hero ── */}
        <ScrollReveal y={14} delay={0.04}>
          <section className="favHero">
            <div className="favHero__titleWrap">
              <TypewriterHeading text="Saved Listings" />

              <motion.svg
                className="favHero__line"
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
                  transition={{
                    duration: 1.05,
                    ease: "easeInOut",
                    delay: 0.1,
                  }}
                />
              </motion.svg>
            </div>

            <p className="favHero__sub">
              Keep the listings you want to revisit close by.
            </p>
          </section>
        </ScrollReveal>

        {/* ── Controls ── */}
        <ScrollReveal y={14} delay={0.06}>
          <section className="favControls">
            {/* Search */}
            <div className="favSearch">
              <span className="favSearch__iconWrap" aria-hidden="true">
                <Search className="favSearch__icon" />
              </span>

              <input
                className="favSearch__input"
                type="text"
                placeholder="Search saved listings…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    className="favSearch__clear"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.14 }}
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Category chips */}
            {categories.length > 0 && (
              <div className="favChips">
                <motion.button
                  type="button"
                  className={`favChip ${!activeCategory ? "favChip--active" : ""}`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING}
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </motion.button>

                {categories.map((cat) => {
                  const CatIcon = getCategoryIcon(cat);

                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      className={`favChip ${activeCategory === cat ? "favChip--active" : ""}`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING}
                      onClick={() =>
                        setActiveCategory((prev) =>
                          prev === cat ? null : cat
                        )
                      }
                    >
                      <CatIcon className="favChip__icon" />
                      {cat}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Sort */}
            <div className="favSortGroup" ref={sortRef}>
              <motion.button
                type="button"
                className={`favSortTrigger ${openSort ? "favSortTrigger--open" : ""}`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                onClick={() => setOpenSort((prev) => !prev)}
              >
                <span>{sortLabel}</span>
                <ChevronDown
                  className={`favSortTrigger__chevron ${openSort ? "favSortTrigger__chevron--open" : ""}`}
                  style={{ width: 14, height: 14 }}
                />
              </motion.button>

              <AnimatePresence>
                {openSort && (
                  <motion.div
                    className="favSortMenu"
                    initial={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 8, scale: 0.97 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 6, scale: 0.97 }
                    }
                    transition={{
                      duration: 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`favSortMenu__item ${sortBy === opt.value ? "favSortMenu__item--active" : ""}`}
                        onClick={() => {
                          setSortBy(opt.value);
                          setOpenSort(false);
                        }}
                      >
                        {sortBy === opt.value && (
                          <Check className="favSortMenu__icon" />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Results count */}
          {!loading && savedItems.length > 0 && (
            <p className="favResultsCount">
              {filteredItems.length === savedItems.length
                ? `Showing all ${savedItems.length} saved`
                : `${filteredItems.length} of ${savedItems.length} saved`}
            </p>
          )}
        </ScrollReveal>

        {/* ── Grid ── */}
        <section className="favGrid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredItems.length > 0 ? (
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <FavCard
                    key={item.id}
                    item={item}
                    index={index}
                    cartServiceIds={cartServiceIds}
                    onOpenServiceDetail={handleOpenServiceDetail}
                    onOpenCart={handleOpenCart}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>
            </LayoutGroup>
          ) : (
            <EmptyState
              hasSearch={hasSearch}
              onClearSearch={clearSearch}
              onBrowse={() =>
                navigate("/dashboard/customer/browse-services")
              }
            />
          )}
        </section>
      </div>

      {/* ── Footer ── */}
    </CustomerDashboardFrame>
  );
}
