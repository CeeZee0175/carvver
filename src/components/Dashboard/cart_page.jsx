import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCustomerDisplayName } from "./customerAchievements";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "./customerProfileShared";
import { PROFILE_SPRING } from "./customerProfileConfig";
import {
  calculateFreelancerNet,
  calculatePlatformFee,
  formatPeso,
  useCart,
} from "./useCart";
import "./cart_page.css";

function CartLineItem({ item, onRemove, removing }) {
  const service = item.services;
  const creatorName = service?.profiles
    ? getCustomerDisplayName(service.profiles)
    : "Unavailable creator";
  const invalid = !service || service.is_published === false;
  const price = Number(service?.price || 0);

  return (
    <article
      className={`cartLineItem ${invalid ? "cartLineItem--invalid" : ""}`}
    >
      <div className="cartLineItem__left">
        <div className="cartLineItem__iconWrap" aria-hidden="true">
          <Store className="cartLineItem__icon" />
        </div>

        <div className="cartLineItem__copy">
          <div className="cartLineItem__meta">
            <span className="cartLineItem__category">
              {service?.category || "Unavailable service"}
            </span>
            <span
              className={`cartLineItem__status ${
                invalid ? "cartLineItem__status--invalid" : ""
              }`}
            >
              {invalid ? "Unavailable" : "Ready for checkout"}
            </span>
          </div>

          <h3 className="cartLineItem__title">
            {service?.title || "This listing is no longer available"}
          </h3>

          <div className="cartLineItem__info">
            <span>{creatorName}</span>
            {service?.location && (
              <span className="cartLineItem__infoItem">
                <MapPin className="cartLineItem__infoIcon" />
                {service.location}
              </span>
            )}
          </div>

          {!invalid && (
            <p className="cartLineItem__split">
              Carvver holds {formatPeso(calculatePlatformFee(price))} from this
              escrowed payment, leaving {formatPeso(calculateFreelancerNet(price))}
              for freelancer release later.
            </p>
          )}
          {invalid && (
            <p className="cartLineItem__split cartLineItem__split--warning">
              Remove this item before checkout. Only currently published service
              listings can be paid through Carvver escrow.
            </p>
          )}
        </div>
      </div>

      <div className="cartLineItem__right">
        <strong className="cartLineItem__price">{formatPeso(price)}</strong>
        <motion.button
          type="button"
          className="cartLineItem__remove"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={PROFILE_SPRING}
          onClick={() => onRemove(item.service_id)}
          disabled={removing}
        >
          <Trash2 className="cartLineItem__removeIcon" />
          <span>{removing ? "Removing..." : "Remove"}</span>
        </motion.button>
      </div>
    </article>
  );
}

function CartSkeleton() {
  return (
    <div className="cartLineItem cartLineItem--skeleton">
      <div className="cartLineItem__left">
        <div className="cartSkeleton cartSkeleton--icon" />
        <div className="cartSkeleton__copy">
          <div className="cartSkeleton cartSkeleton--meta" />
          <div className="cartSkeleton cartSkeleton--title" />
          <div className="cartSkeleton cartSkeleton--desc" />
        </div>
      </div>
      <div className="cartSkeleton cartSkeleton--actions" />
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    checkoutLoading,
    error,
    items,
    clearCart,
    removeItem,
    reload,
    startCheckout,
  } = useCart();
  const [removingId, setRemovingId] = React.useState("");
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const checkoutState = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutState !== "success") return;

    reload();
    const timeoutId = window.setTimeout(() => {
      reload();
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutState, reload]);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const service = item.services;
        const invalid = !service || service.is_published === false;
        const amount = Number(service?.price || 0);

        return {
          ...item,
          invalid,
          amount,
          platformFee: calculatePlatformFee(amount),
          freelancerNet: calculateFreelancerNet(amount),
        };
      }),
    [items]
  );

  const validItems = normalizedItems.filter((item) => !item.invalid);
  const invalidItems = normalizedItems.filter((item) => item.invalid);

  const summary = useMemo(() => {
    const subtotal = validItems.reduce((total, item) => total + item.amount, 0);
    const platformFee = validItems.reduce(
      (total, item) => total + item.platformFee,
      0
    );
    const freelancerNet = validItems.reduce(
      (total, item) => total + item.freelancerNet,
      0
    );

    return {
      subtotal,
      platformFee,
      freelancerNet,
    };
  }, [validItems]);

  const handleRemove = async (serviceId) => {
    try {
      setRemovingId(serviceId);
      await removeItem(serviceId);
      toast.success("Removed from cart.");
    } catch (nextError) {
      toast.error(nextError.message || "Couldn't update your cart.");
    } finally {
      setRemovingId("");
    }
  };

  const handleClearInvalid = async () => {
    try {
      await clearCart(invalidItems.map((item) => item.service_id));
      toast.success("Unavailable listings removed from cart.");
    } catch (nextError) {
      toast.error(nextError.message || "Couldn't clean up your cart.");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared.");
    } catch (nextError) {
      toast.error(nextError.message || "Couldn't clear your cart.");
    }
  };

  const handleCheckout = async () => {
    try {
      await startCheckout();
    } catch (nextError) {
      toast.error(nextError.message || "Couldn't start checkout.");
    }
  };

  const showSuccessEmpty = !loading && items.length === 0 && checkoutState === "success";

  return (
    <CustomerDashboardFrame mainClassName="cartPage">
      <Reveal>
        <DashboardBreadcrumbs items={[{ label: "Cart" }]} />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="cartHero">
          <div className="cartHero__heading">
            <p className="cartHero__eyebrow">Customer Cart</p>
            <div className="cartHero__titleWrap">
              <h1 className="cartHero__title">
                <TypewriterHeading text="Cart" />
              </h1>
              <motion.svg
                className="cartHero__line"
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </motion.svg>
            </div>
            <p className="cartHero__sub">
              Keep service listings in one place, pay the exact listed amount,
              and let Carvver hold the transaction in escrow while the platform
              keeps its 5% commission from the freelancer payout.
            </p>
          </div>

          <div className="cartHero__stats">
            <div className="cartHeroStat">
              <span className="cartHeroStat__label">Listings</span>
              <strong className="cartHeroStat__value">{validItems.length}</strong>
              <span className="cartHeroStat__hint">Ready for checkout</span>
            </div>
            <div className="cartHeroStat">
              <span className="cartHeroStat__label">Customer total</span>
              <strong className="cartHeroStat__value">
                {formatPeso(summary.subtotal)}
              </strong>
              <span className="cartHeroStat__hint">No extra platform surcharge</span>
            </div>
            <div className="cartHeroStat">
              <span className="cartHeroStat__label">Carvver fee</span>
              <strong className="cartHeroStat__value">
                {formatPeso(summary.platformFee)}
              </strong>
              <span className="cartHeroStat__hint">Held from payout, not from buyer</span>
            </div>
          </div>
        </section>
      </Reveal>

      {checkoutState && (
        <Reveal delay={0.06}>
          <section
            className={`cartNotice ${
              checkoutState === "success" ? "cartNotice--success" : ""
            }`}
          >
            <div className="cartNotice__iconWrap" aria-hidden="true">
              {checkoutState === "success" ? (
                <Sparkles className="cartNotice__icon" />
              ) : (
                <AlertTriangle className="cartNotice__icon" />
              )}
            </div>
            <div className="cartNotice__copy">
              <h2 className="cartNotice__title">
                {checkoutState === "success"
                  ? "Checkout returned successfully"
                  : "Checkout was cancelled"}
              </h2>
              <p className="cartNotice__desc">
                {checkoutState === "success"
                  ? "We’re syncing PayMongo confirmation with your escrow-backed orders now. If your cart does not clear immediately, give it a moment and refresh."
                  : "Your cart is still intact. You can review the listings or try checkout again whenever you're ready."}
              </p>
            </div>
          </section>
        </Reveal>
      )}

      {error && (
        <Reveal delay={0.08}>
          <section className="cartNotice cartNotice--warning">
            <div className="cartNotice__iconWrap" aria-hidden="true">
              <AlertTriangle className="cartNotice__icon" />
            </div>
            <div className="cartNotice__copy">
              <h2 className="cartNotice__title">Cart data needs attention</h2>
              <p className="cartNotice__desc">{error}</p>
            </div>
          </section>
        </Reveal>
      )}

      {showSuccessEmpty ? (
        <Reveal delay={0.1}>
          <EmptySurface
            icon={Sparkles}
            title="Payment is in motion"
            description="Your cart is clear and Carvver is syncing the paid checkout into customer orders. Check your order page in a moment for the escrow-backed entries."
            actionLabel="Open orders"
            onAction={() => navigate("/dashboard/customer/orders")}
          />
        </Reveal>
      ) : !loading && items.length === 0 ? (
        <Reveal delay={0.1}>
          <EmptySurface
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add listings from Browse Services or Saved Listings when you want to collect work before a single PayMongo checkout."
            actionLabel="Browse services"
            onAction={() => navigate("/dashboard/customer/browse-services")}
          />
        </Reveal>
      ) : (
        <div className="cartGrid">
          <Reveal delay={0.1} className="cartGrid__main">
            <section className="cartSection">
              <div className="cartSection__head">
                <div>
                  <p className="cartSection__eyebrow">Listings in cart</p>
                  <h2 className="cartSection__title">
                    Review what will be charged today
                  </h2>
                </div>

                {items.length > 0 && (
                  <motion.button
                    type="button"
                    className="cartSection__linkBtn"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleClearCart}
                  >
                    <Trash2 className="cartSection__linkIcon" />
                    <span>Clear cart</span>
                  </motion.button>
                )}
              </div>

              <div className="cartList">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <CartSkeleton key={index} />
                    ))
                  : normalizedItems.map((item) => (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        onRemove={handleRemove}
                        removing={removingId === item.service_id}
                      />
                    ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.14} className="cartGrid__side">
            <section className="cartSummary">
              <div className="cartSummary__head">
                <p className="cartSection__eyebrow">Checkout summary</p>
                <h2 className="cartSection__title">PayMongo + escrow</h2>
              </div>

              <div className="cartSummary__rows">
                <div className="cartSummary__row">
                  <span>Listings subtotal</span>
                  <strong>{formatPeso(summary.subtotal)}</strong>
                </div>
                <div className="cartSummary__row">
                  <span>Customer total charged</span>
                  <strong>{formatPeso(summary.subtotal)}</strong>
                </div>
                <div className="cartSummary__row cartSummary__row--muted">
                  <span>Carvver commission held from payout</span>
                  <strong>{formatPeso(summary.platformFee)}</strong>
                </div>
                <div className="cartSummary__row cartSummary__row--muted">
                  <span>Freelancer payout after escrow release</span>
                  <strong>{formatPeso(summary.freelancerNet)}</strong>
                </div>
              </div>

              {invalidItems.length > 0 && (
                <div className="cartWarning">
                  <div className="cartWarning__copy">
                    <h3 className="cartWarning__title">
                      Remove unavailable listings first
                    </h3>
                    <p className="cartWarning__desc">
                      {invalidItems.length} listing
                      {invalidItems.length === 1 ? "" : "s"} in this cart can’t
                      move into checkout because they are no longer published.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    className="cartWarning__btn"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleClearInvalid}
                  >
                    Remove invalid items
                  </motion.button>
                </div>
              )}

              <motion.button
                type="button"
                className="cartCheckoutBtn"
                whileHover={checkoutLoading ? {} : { y: -1.5 }}
                whileTap={checkoutLoading ? {} : { scale: 0.98 }}
                transition={PROFILE_SPRING}
                disabled={
                  checkoutLoading || loading || validItems.length === 0 || invalidItems.length > 0
                }
                onClick={handleCheckout}
              >
                <span className="cartCheckoutBtn__copy">
                  <span className="cartCheckoutBtn__eyebrow">Checkout</span>
                  <strong className="cartCheckoutBtn__title">
                    {checkoutLoading ? "Opening PayMongo..." : "Pay with PayMongo"}
                  </strong>
                </span>
                <span className="cartCheckoutBtn__iconWrap" aria-hidden="true">
                  <CreditCard className="cartCheckoutBtn__icon" />
                </span>
              </motion.button>

              <div className="cartInfoCard">
                <div className="cartInfoCard__top">
                  <div className="cartInfoCard__iconWrap" aria-hidden="true">
                    <ShieldCheck className="cartInfoCard__icon" />
                  </div>
                  <div>
                    <h3 className="cartInfoCard__title">Escrow-first flow</h3>
                    <p className="cartInfoCard__desc">
                      Payment creates pending orders and marks funds as held in
                      escrow. Freelancer release and refund handling can layer on
                      top of this record later.
                    </p>
                  </div>
                </div>
                <ul className="cartInfoCard__list">
                  <li>GCash and card payments go through PayMongo checkout.</li>
                  <li>Customers pay only the listed service price.</li>
                  <li>Carvver keeps 5% from the freelancer payout split.</li>
                </ul>
              </div>

              <motion.button
                type="button"
                className="cartBrowseBtn"
                whileHover={{ x: 1 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/customer/browse-services")}
              >
                <span>Add more listings</span>
                <ArrowRight className="cartBrowseBtn__icon" />
              </motion.button>
            </section>
          </Reveal>
        </div>
      )}
    </CustomerDashboardFrame>
  );
}
