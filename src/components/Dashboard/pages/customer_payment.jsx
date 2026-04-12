import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { createClient } from "../../../lib/supabase/client";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { formatPeso, useCart } from "../hooks/useCart";
import "./profile.css";
import "./customer_payment.css";

const supabase = createClient();

async function readFunctionError(error, fallback) {
  if (typeof error?.context?.json === "function") {
    try {
      const payload = await error.context.json();
      return payload?.error || payload?.message || error?.message || fallback;
    } catch {
      return error?.message || fallback;
    }
  }

  return error?.message || fallback;
}

function formatCountdown(target) {
  if (!target) return "";
  const remainingMs = Math.max(new Date(target).getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolvePaymentTitle(session) {
  switch (String(session?.status || "").toLowerCase()) {
    case "paid":
      return "Payment confirmed";
    case "expired":
      return "QR code expired";
    case "failed":
      return "Payment failed";
    case "cancelled":
      return "Card checkout cancelled";
    case "superseded":
      return "Payment session updated";
    default:
      return "Awaiting payment";
  }
}

function resolvePaymentCopy(session, selectedMethod) {
  const status = String(session?.status || "").toLowerCase();

  if (status === "paid") {
    return "Your payment is secured and your orders are being prepared now.";
  }

  if (status === "expired") {
    return "This QR code expired before payment completed. Generate a fresh one to continue.";
  }

  if (status === "failed") {
    return "The payment did not complete. You can generate a new QR code or switch methods.";
  }

  if (status === "cancelled") {
    return "Your card checkout was cancelled. You can open it again anytime from this page.";
  }

  if (selectedMethod === "card") {
    return "Card payments open in PayMongo and return here after confirmation.";
  }

  return "Scan this QR in GCash or Maya and keep this page open while we confirm payment.";
}

function InlineStatus({ tone = "neutral", message }) {
  if (!message) return null;

  return (
    <motion.div
      className={`customerPaymentStatus customerPaymentStatus--${tone}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </motion.div>
  );
}

function PaymentOverview({ itemCount, subtotal }) {
  return (
    <div className="customerPaymentOverview">
      <article className="customerPaymentOverview__item">
        <span className="customerPaymentOverview__label">Listings</span>
        <strong className="customerPaymentOverview__value">{itemCount}</strong>
      </article>
      <article className="customerPaymentOverview__item">
        <span className="customerPaymentOverview__label">Total</span>
        <strong className="customerPaymentOverview__value">{formatPeso(subtotal)}</strong>
      </article>
    </div>
  );
}

export default function CustomerPayment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading: cartLoading,
    items,
    reload: reloadCart,
  } = useCart();
  const [selectedMethod, setSelectedMethod] = useState(
    searchParams.get("method") === "card" ? "card" : "qrph"
  );
  const [paymentSession, setPaymentSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [cardActionLoading, setCardActionLoading] = useState(false);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [pollPaused, setPollPaused] = useState(false);
  const initializedRef = useRef(false);
  const cancelMarkedRef = useRef(false);

  const itemCount = items.length;
  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Number(item.selected_package_price ?? item.services?.price ?? 0),
        0
      ),
    [items]
  );

  const sessionIdFromUrl = searchParams.get("session");
  const returnState = searchParams.get("state");

  const updateSearch = useCallback(
    (updates = {}, removals = []) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
          return;
        }

        next.set(key, String(value));
      });

      removals.forEach((key) => next.delete(key));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const startPaymentSession = useCallback(async (method, options = {}) => {
    setSessionLoading(true);
    setSessionError("");
    setPollPaused(false);

    try {
      const { data, error } = await supabase.functions.invoke("create-paymongo-checkout", {
        body: {
          method,
          ...options,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.sessionId) {
        throw new Error("We couldn't create a payment session.");
      }

      setPaymentSession(data);
      setSelectedMethod(method);
      updateSearch(
        {
          method,
          session: data.sessionId,
        },
        ["state"]
      );

      return data;
    } catch (error) {
      const message = await readFunctionError(error, "We couldn't prepare payment.");
      setSessionError(message);
      throw new Error(message);
    } finally {
      setSessionLoading(false);
    }
  }, [updateSearch]);

  const loadPaymentSession = useCallback(async (sessionId, options = {}) => {
    if (!sessionId) return null;

    setSessionLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("get-paymongo-payment-session", {
        body: {
          sessionId,
          ...options,
        },
      });

      if (error) {
        throw error;
      }

      setPaymentSession(data);
      if (data?.method === "card" || data?.method === "qrph") {
        setSelectedMethod(data.method);
      }
      setSessionError("");
      setPollPaused(false);
      return data;
    } catch (error) {
      const message = await readFunctionError(
        error,
        "We couldn't load this payment session."
      );
      setSessionError(message);
      setPollPaused(true);
      return null;
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const handleMethodChange = async (method) => {
    setSelectedMethod(method);

    if (method === "qrph") {
      await startPaymentSession("qrph");
      return;
    }

    updateSearch(
      {
        method: "card",
      },
      ["state"]
    );
  };

  const handleCardCheckout = async () => {
    setCardActionLoading(true);
    setSessionError("");

    try {
      const data = await startPaymentSession("card");
      if (!data?.checkoutUrl) {
        throw new Error("We couldn't open card checkout.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error.message || "We couldn't open card checkout.");
    } finally {
      setCardActionLoading(false);
    }
  };

  useEffect(() => {
    if (cartLoading) return;

    if (sessionIdFromUrl) {
      const shouldMarkCancelled = returnState === "cancelled" && !cancelMarkedRef.current;
      if (shouldMarkCancelled) {
        cancelMarkedRef.current = true;
      }

      loadPaymentSession(sessionIdFromUrl, {
        markCancelled: shouldMarkCancelled,
      });
      initializedRef.current = true;
      return;
    }

    if (!initializedRef.current && items.length > 0) {
      initializedRef.current = true;
      startPaymentSession("qrph").catch(() => {});
    }
  }, [cartLoading, items.length, loadPaymentSession, returnState, sessionIdFromUrl, startPaymentSession]);

  useEffect(() => {
    if (String(paymentSession?.status || "").toLowerCase() !== "paid") return;
    reloadCart();
  }, [paymentSession?.status, reloadCart]);

  useEffect(() => {
    if (!paymentSession?.sessionId) return;
    if (pollPaused) return;

    const status = String(paymentSession.status || "").toLowerCase();
    const shouldPollQr = paymentSession.method === "qrph" && status === "pending";
    const shouldPollCard =
      paymentSession.method === "card" &&
      returnState === "success" &&
      status === "pending";

    if (!shouldPollQr && !shouldPollCard) return;

    const intervalId = window.setInterval(() => {
      loadPaymentSession(paymentSession.sessionId);
    }, shouldPollCard ? 3500 : 5000);

    return () => window.clearInterval(intervalId);
  }, [
    loadPaymentSession,
    paymentSession?.method,
    paymentSession?.sessionId,
    paymentSession?.status,
    pollPaused,
    returnState,
  ]);

  useEffect(() => {
    if (selectedMethod !== "qrph") return undefined;
    if (!paymentSession?.qrExpiresAt) return undefined;
    if (String(paymentSession?.status || "").toLowerCase() !== "pending") return undefined;

    const intervalId = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [paymentSession?.qrExpiresAt, paymentSession?.status, selectedMethod]);

  const qrCountdown = useMemo(() => {
    void countdownNow;
    return formatCountdown(paymentSession?.qrExpiresAt);
  }, [countdownNow, paymentSession?.qrExpiresAt]);

  const showPaidState = String(paymentSession?.status || "").toLowerCase() === "paid";
  const showEmptyState = !cartLoading && items.length === 0 && !paymentSession;

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details customerPaymentPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Cart", to: "/dashboard/customer/cart" },
            { label: "Payment" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="customerPaymentHero">
          <div className="customerPaymentHero__heading">
            <div className="customerPaymentHero__titleWrap">
              <h1 className="customerPaymentHero__title">
                <TypewriterHeading text="Payment" />
              </h1>
              <motion.svg
                className="customerPaymentHero__line"
                viewBox="0 0 268 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M 0,10 Q 67,0 134,10 Q 201,20 268,10"
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

            <p className="profileHero__sub">
              Scan with GCash or Maya through QRPh, or switch to card when you need it.
            </p>
          </div>

          <PaymentOverview itemCount={itemCount} subtotal={subtotal} />
        </section>
      </Reveal>

      {showEmptyState ? (
        <Reveal delay={0.08}>
          <EmptySurface
            hideIcon
            title="Nothing is waiting for payment"
            actionLabel="Back to cart"
            onAction={() => navigate("/dashboard/customer/cart")}
            className="customerPaymentPage__empty"
            actionButtonClassName="customerPaymentPage__emptyBtn"
          />
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.08}>
            <section className="profileSection customerPaymentSection">
              <div className="profileSection__head customerPaymentSection__head">
                <div className="customerSettingsSectionIntro">
                  <h2 className="profileSection__title">Payment method</h2>
                  <p className="customerSettingsSectionIntro__copy">
                    Use one QR for GCash or Maya, or fall back to card through PayMongo.
                  </p>
                </div>
              </div>

              <div className="customerPaymentMethods">
                <button
                  type="button"
                  className={`customerPaymentMethod ${
                    selectedMethod === "qrph" ? "customerPaymentMethod--active" : ""
                  }`}
                  onClick={() => handleMethodChange("qrph")}
                  disabled={sessionLoading}
                >
                  <span className="customerPaymentMethod__title">GCash or Maya</span>
                  <span className="customerPaymentMethod__copy">Scan the same secure QR code</span>
                </button>

                <button
                  type="button"
                  className={`customerPaymentMethod ${
                    selectedMethod === "card" ? "customerPaymentMethod--active" : ""
                  }`}
                  onClick={() => handleMethodChange("card")}
                  disabled={sessionLoading}
                >
                  <span className="customerPaymentMethod__title">Card</span>
                  <span className="customerPaymentMethod__copy">Open PayMongo card checkout</span>
                </button>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="profileSection customerPaymentSection customerPaymentPanel">
              <div className="profileSection__head customerPaymentSection__head">
                <div className="customerSettingsSectionIntro">
                  <h2 className="profileSection__title">{resolvePaymentTitle(paymentSession)}</h2>
                  <p className="customerSettingsSectionIntro__copy">
                    {resolvePaymentCopy(paymentSession, selectedMethod)}
                  </p>
                </div>
                {selectedMethod === "qrph" && paymentSession?.qrExpiresAt ? (
                  <div className="customerPaymentTimer">
                    <span className="customerPaymentTimer__label">Expires in</span>
                    <strong className="customerPaymentTimer__value">{qrCountdown}</strong>
                  </div>
                ) : null}
              </div>

              <AnimatePresence mode="wait">
                {sessionError ? (
                  <InlineStatus key="payment-error" tone="danger" message={sessionError} />
                ) : returnState === "success" && paymentSession?.method === "card" && !showPaidState ? (
                  <InlineStatus
                    key="payment-sync"
                    tone="neutral"
                    message="We are confirming your card payment now."
                  />
                ) : returnState === "cancelled" && paymentSession?.method === "card" ? (
                  <InlineStatus
                    key="payment-cancelled"
                    tone="neutral"
                    message="Card checkout was cancelled before payment completed."
                  />
                ) : showPaidState ? (
                  <InlineStatus
                    key="payment-success"
                    tone="success"
                    message="Payment confirmed. Your order is now in motion."
                  />
                ) : null}
              </AnimatePresence>

              {selectedMethod === "qrph" ? (
                <div className="customerPaymentQrLayout">
                  <div className="customerPaymentQrCard">
                    <div className="customerPaymentQrCard__eyebrow">Scan in GCash or Maya</div>
                    {sessionLoading && !paymentSession?.qrImageUrl ? (
                      <div className="customerPaymentQrCard__loading">
                        <LoaderCircle className="customerPaymentSpinner" />
                        <span>Preparing your QR code...</span>
                      </div>
                    ) : paymentSession?.qrImageUrl ? (
                      <img
                        className="customerPaymentQrCard__image"
                        src={paymentSession.qrImageUrl}
                        alt="GCash or Maya payment QR code"
                      />
                    ) : (
                      <div className="customerPaymentQrCard__loading">
                        <span>Generate a QR code to continue.</span>
                      </div>
                    )}
                  </div>

                  <div className="customerPaymentQrInfo">
                    <div className="customerPaymentQrInfo__block">
                      <span className="customerPaymentQrInfo__label">Method</span>
                      <strong className="customerPaymentQrInfo__value">GCash or Maya scan</strong>
                    </div>
                    <div className="customerPaymentQrInfo__block">
                      <span className="customerPaymentQrInfo__label">Total due</span>
                      <strong className="customerPaymentQrInfo__value">{formatPeso(subtotal)}</strong>
                    </div>
                    <div className="customerPaymentQrInfo__block">
                      <span className="customerPaymentQrInfo__label">Session</span>
                      <strong className="customerPaymentQrInfo__value customerPaymentQrInfo__value--mono">
                        {paymentSession?.sessionId || "Preparing..."}
                      </strong>
                    </div>

                    <div className="customerPaymentActions">
                      <motion.button
                        type="button"
                        className="profileEditor__btn profileEditor__btn--primary customerPaymentAction"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={() => startPaymentSession("qrph")}
                        disabled={sessionLoading}
                      >
                        {sessionLoading ? (
                          <LoaderCircle className="customerPaymentSpinner" />
                        ) : null}
                        <span>
                          {paymentSession?.qrImageUrl ? "Generate new QR" : "Generate QR"}
                        </span>
                      </motion.button>

                      {pollPaused && paymentSession?.sessionId ? (
                        <motion.button
                          type="button"
                          className="profileEditor__btn profileEditor__btn--ghost customerPaymentAction customerPaymentAction--ghost"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() => loadPaymentSession(paymentSession.sessionId)}
                          disabled={sessionLoading}
                        >
                          {sessionLoading ? (
                            <LoaderCircle className="customerPaymentSpinner" />
                          ) : null}
                          <span>Retry status</span>
                        </motion.button>
                      ) : null}

                      {showPaidState ? (
                        <motion.button
                          type="button"
                          className="profileEditor__btn profileEditor__btn--ghost customerPaymentAction customerPaymentAction--ghost"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() => navigate("/dashboard/customer/orders")}
                        >
                          Open orders
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          className="profileEditor__btn profileEditor__btn--ghost customerPaymentAction customerPaymentAction--ghost"
                          whileHover={{ y: -1.5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={PROFILE_SPRING}
                          onClick={() => navigate("/dashboard/customer/cart")}
                        >
                          Back to cart
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="customerPaymentCardLayout">
                  <div className="customerPaymentCardPanel">
                    <div className="customerPaymentCardPanel__copy">
                      <span className="customerPaymentCardPanel__label">Card checkout</span>
                      <strong className="customerPaymentCardPanel__title">
                        Use your card through PayMongo
                      </strong>
                      <p className="customerPaymentCardPanel__desc">
                        Card entry stays on PayMongo. We will return you here right after payment.
                      </p>
                    </div>

                    <div className="customerPaymentActions">
                      <motion.button
                        type="button"
                        className="profileEditor__btn profileEditor__btn--primary customerPaymentAction"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={handleCardCheckout}
                        disabled={cardActionLoading || sessionLoading}
                      >
                        {cardActionLoading ? (
                          <LoaderCircle className="customerPaymentSpinner" />
                        ) : null}
                        <span>
                          {paymentSession?.checkoutUrl ? "Open card checkout again" : "Continue with card"}
                        </span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="profileEditor__btn profileEditor__btn--ghost customerPaymentAction customerPaymentAction--ghost"
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={() => navigate("/dashboard/customer/cart")}
                      >
                        Back to cart
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </Reveal>
        </>
      )}
    </CustomerDashboardFrame>
  );
}
