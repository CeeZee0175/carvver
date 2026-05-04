import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion} from "framer-motion";
import { Check, ChevronDown, LoaderCircle, LogOut, MessageCircle, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { createClient } from "../../../lib/supabase/client";
import { signOut } from "../../../lib/supabase/auth";
import {
  DashboardBreadcrumbs,
  FreelancerDashboardFrame,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import { useFreelancerProfileData } from "../hooks/useFreelancerProfileData";
import {
  fetchFreelancerPayoutMethod,
  saveFreelancerPayoutMethod,
} from "../hooks/useMarketplaceWorkflow";
import "./profile.css";
import "./freelancer_pages.css";
import "./customer_settings.css";

const supabase = createClient();
const WALLET_METHODS = new Set(["gcash", "maya"]);
const PAYOUT_METHOD_OPTIONS = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "bank_transfer", label: "Bank transfer" },
];

function normalizePayoutMethodForUi(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "bank" || normalized === "banktransfer") return "bank_transfer";
  return PAYOUT_METHOD_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : "";
}

function getPayoutMethodLabel(value) {
  return PAYOUT_METHOD_OPTIONS.find((option) => option.value === value)?.label || "Choose method";
}

function toWalletLocalNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("639") && digits.length >= 12) return digits.slice(2, 12);
  if (digits.startsWith("09") && digits.length >= 11) return digits.slice(1, 11);
  if (digits.startsWith("9") && digits.length >= 10) return digits.slice(0, 10);
  return digits.slice(0, 10);
}

function composePayoutValues(values) {
  const payoutMethod = normalizePayoutMethodForUi(values.payoutMethod);
  const accountReference = WALLET_METHODS.has(payoutMethod)
    ? `+63${toWalletLocalNumber(values.accountReference)}`
    : String(values.accountReference || "").trim();

  return {
    payoutMethod,
    accountName: values.accountName,
    accountReference,
  };
}

function formatCountdown(target) {
  if (!target) return "";
  const remainingMs = Math.max(new Date(target).getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatPlanDate(value) {
  if (!value) return "Not active";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not active";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function resolveProStatus(membership, session) {
  const active =
    membership?.status === "active" &&
    membership?.current_period_end &&
    new Date(membership.current_period_end).getTime() > Date.now();

  if (active) {
    return {
      label: "Active",
      copy: `Carvver Pro is active until ${formatPlanDate(membership.current_period_end)}.`,
      tone: "success",
    };
  }

  if (session?.status === "pending") {
    return {
      label: "Awaiting payment",
      copy: "Scan the QR with GCash or Maya to activate Carvver Pro for one month.",
      tone: "neutral",
    };
  }

  if (session?.status === "expired") {
    return {
      label: "QR expired",
      copy: "Generate a fresh QR when you are ready to activate Pro.",
      tone: "danger",
    };
  }

  return {
    label: "Not active",
    copy: "Generate a QR to activate Carvver Pro for P149/month.",
    tone: "neutral",
  };
}

function PayoutMethodDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="freelancerPayoutSelect" ref={wrapRef}>
      <button
        type="button"
        className={`customerSettingsField__control freelancerPayoutSelect__trigger ${
          open ? "freelancerPayoutSelect__trigger--open" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span>{getPayoutMethodLabel(value)}</span>
        <ChevronDown className="freelancerPayoutSelect__chevron" />
      </button>

      <AnimatePresence>
        {open ? (
          <Motion.div
            className="freelancerPayoutSelect__menu"
            role="listbox"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {PAYOUT_METHOD_OPTIONS.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`freelancerPayoutSelect__option ${
                    selected ? "freelancerPayoutSelect__option--selected" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check className="freelancerPayoutSelect__check" /> : null}
                </button>
              );
            })}
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProBillingSection() {
  const [session, setSession] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdownNow, setCountdownNow] = useState(Date.now());

  const loadProBilling = useCallback(async (sessionId, options = {}) => {
    if (!options.silent) {
      setLoading(true);
    }
    setError("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "get-freelancer-pro-session",
        {
          body: sessionId ? { sessionId } : {},
        }
      );

      if (invokeError) throw invokeError;
      setSession(data?.sessionId ? data : null);
      setMembership(data?.membership || null);
      if (data?.status === "paid" || data?.membership?.status === "active") {
        setSuccess("Carvver Pro is active.");
      }
      return data;
    } catch (nextError) {
      setError(nextError.message || "We couldn't load Carvver Pro billing.");
      return null;
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProBilling();
  }, [loadProBilling]);

  useEffect(() => {
    if (!session?.sessionId || session?.status !== "pending") return undefined;
    const intervalId = window.setInterval(() => {
      loadProBilling(session.sessionId, { silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadProBilling, session?.sessionId, session?.status]);

  useEffect(() => {
    if (!session?.qrExpiresAt || session?.status !== "pending") return undefined;
    const intervalId = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [session?.qrExpiresAt, session?.status]);

  const qrExpired =
    session?.status === "pending" &&
    session?.qrExpiresAt &&
    new Date(session.qrExpiresAt).getTime() <= countdownNow;
  const countdown = useMemo(() => {
    void countdownNow;
    return formatCountdown(session?.qrExpiresAt);
  }, [countdownNow, session?.qrExpiresAt]);
  const planStatus = resolveProStatus(membership, qrExpired ? { ...session, status: "expired" } : session);

  const handleGenerate = async () => {
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-freelancer-pro-checkout",
        {
          body: {
            forceNew: Boolean(session?.qrImageUrl),
          },
        }
      );

      if (invokeError) throw invokeError;
      setSession(data || null);
      setMembership(data?.membership || membership);
    } catch (nextError) {
      setError(nextError.message || "We couldn't generate a Carvver Pro QR.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="profileSection freelancerBillingSection">
      <div className="profileSection__head">
        <div>
          <h2 className="profileSection__title">Carvver Pro billing</h2>
          <p className="profileSection__sub">
            Activate Pro with QRPh for P149/month. GCash and Maya can scan the same QR.
          </p>
        </div>
      </div>

      <div className="freelancerBillingLayout">
        <article className="freelancerBillingSummary">
          <span className={`freelancerBillingStatus freelancerBillingStatus--${planStatus.tone}`}>
            {planStatus.label}
          </span>
          <strong className="freelancerBillingPrice">P149/month</strong>
          <p>{planStatus.copy}</p>
          <div className="freelancerBillingFacts">
            <span>0% platform commission</span>
            <span>Priority listing visibility</span>
            <span>Faster support handling</span>
          </div>
        </article>

        <article className="freelancerBillingQr">
          <div className="freelancerBillingQr__head">
            <div>
              <h3>QR billing</h3>
              <p>{session?.status === "pending" ? "Keep this page open while we confirm payment." : "Generate a QR when you are ready."}</p>
            </div>
            {session?.qrExpiresAt && session?.status === "pending" ? (
              <div className="freelancerBillingTimer">
                <span>Expires in</span>
                <strong>{countdown}</strong>
              </div>
            ) : null}
          </div>

          <div className="freelancerBillingQr__surface">
            {creating && !session?.qrImageUrl ? (
              <div className="freelancerBillingQr__empty">
                <LoaderCircle className="customerSettingsAction__spinner" />
                <span>Preparing QR...</span>
              </div>
            ) : session?.qrImageUrl ? (
              <a
                className="freelancerBillingQr__imageLink"
                href={session.qrImageUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Carvver Pro QR full size"
              >
                <img
                  src={session.qrImageUrl}
                  alt="Carvver Pro GCash or Maya QR code"
                  className={qrExpired ? "freelancerBillingQr__image--expired" : ""}
                />
              </a>
            ) : (
              <div className="freelancerBillingQr__empty">
                <span>No QR generated yet.</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {error ? (
              <Motion.div
                className="customerSettingsStatus customerSettingsStatus--danger"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {error}
              </Motion.div>
            ) : success ? (
              <Motion.div
                className="customerSettingsStatus customerSettingsStatus--success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {success}
              </Motion.div>
            ) : null}
          </AnimatePresence>

          <div className="customerSettingsActionsRow">
            <Motion.button
              type="button"
              className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={handleGenerate}
              disabled={creating || loading}
              aria-busy={creating}
            >
              {creating ? <LoaderCircle className="customerSettingsAction__spinner" /> : null}
              <span>{session?.qrImageUrl ? "Refresh QR" : "Generate QR"}</span>
            </Motion.button>
            {session?.qrImageUrl ? (
              <a
                className="freelancerBillingQr__fullLink"
                href={session.qrImageUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open full-size QR
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

export default function FreelancerSettings() {
  const navigate = useNavigate();
  const { profile, displayName, locationLabel, warning } = useFreelancerProfileData();
  const [payoutValues, setPayoutValues] = useState({
    payoutMethod: "",
    accountName: "",
    accountReference: "",
  });
  const [payoutState, setPayoutState] = useState({
    pending: false,
    error: "",
    success: "",
  });
  const [signOutPending, setSignOutPending] = useState(false);

  useEffect(() => {
    fetchFreelancerPayoutMethod()
      .then((next) => {
        const payoutMethod = normalizePayoutMethodForUi(next.payoutMethod);
        setPayoutValues({
          payoutMethod,
          accountName: next.accountName || "",
          accountReference: WALLET_METHODS.has(payoutMethod)
            ? toWalletLocalNumber(next.accountReference)
            : next.accountReference || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    try {
      setSignOutPending(true);
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch {
      setSignOutPending(false);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handlePayoutSave = async (event) => {
    event.preventDefault();
    setPayoutState({ pending: true, error: "", success: "" });

    try {
      const saved = await saveFreelancerPayoutMethod(composePayoutValues(payoutValues));
      const payoutMethod = normalizePayoutMethodForUi(saved.payoutMethod);
      setPayoutValues({
        payoutMethod,
        accountName: saved.accountName,
        accountReference: WALLET_METHODS.has(payoutMethod)
          ? toWalletLocalNumber(saved.accountReference)
          : saved.accountReference,
      });
      setPayoutState({
        pending: false,
        error: "",
        success: "Payout destination saved.",
      });
    } catch (error) {
      setPayoutState({
        pending: false,
        error: error.message || "We couldn't save your payout destination.",
        success: "",
      });
    }
  };

  const handlePayoutMethodChange = (nextMethod) => {
    setPayoutValues((prev) => {
      const previousWallet = WALLET_METHODS.has(prev.payoutMethod);
      const nextWallet = WALLET_METHODS.has(nextMethod);
      return {
        ...prev,
        payoutMethod: nextMethod,
        accountReference: nextWallet
          ? toWalletLocalNumber(prev.accountReference)
          : previousWallet
            ? ""
            : prev.accountReference,
      };
    });
    setPayoutState({ pending: false, error: "", success: "" });
  };

  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details freelancerPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[{ label: "Settings" }]}
          homePath="/dashboard/freelancer"
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Settings" />
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
                  transition={{ duration: 1.05, ease: "easeInOut", delay: 0.18 }}
                />
              </Motion.svg>
            </div>
            <p className="profileHero__sub">
              Review the details tied to your freelancer profile and keep your main
              account actions close.
            </p>
          </div>

          <div className="freelancerHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Display name</span>
              <strong className="profileMiniStat__value" style={{ fontSize: "24px" }}>
                {displayName}
              </strong>
            </div>

            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Location</span>
              <strong className="profileMiniStat__value" style={{ fontSize: "24px" }}>
                {locationLabel === "No location added yet" ? "Missing" : "Set"}
              </strong>
            </div>
          </div>
        </section>
      </Reveal>

      {warning ? (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">Some account details couldn't be loaded</h2>
              <p className="profileNotice__desc">{warning}</p>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Account details</h2>
              <p className="profileSection__sub">
                Review the freelancer account details that are already saved here.
              </p>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Email</span>
              <strong className="freelancerDataValue--strong">
                {profile?.email || "No email available"}
              </strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Role</span>
              <strong className="freelancerDataValue--strong">Freelancer</strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Profile status</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_onboarding_completed_at ? "Completed" : "Incomplete"}
              </strong>
            </article>

            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Main category</span>
              <strong className="freelancerDataValue--strong">
                {profile?.freelancer_primary_category || "Not set yet"}
              </strong>
            </article>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="profileNavBand">
          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/profile")}
          >
            <UserRound className="profileNavBand__icon" />
            <span className="profileNavBand__label">Profile</span>
          </Motion.button>

          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/dashboard/freelancer/messages")}
          >
            <MessageCircle className="profileNavBand__icon" />
            <span className="profileNavBand__label">Messages</span>
          </Motion.button>

          <Motion.button
            type="button"
            className="profileNavBand__item"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            transition={PROFILE_SPRING}
            onClick={() => navigate("/pricing")}
          >
            <Sparkles className="profileNavBand__icon" />
            <span className="profileNavBand__label">Carvver Pro</span>
          </Motion.button>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <ProBillingSection />
      </Reveal>

      <Reveal delay={0.22}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Payout destination</h2>
              <p className="profileSection__sub">
                After the customer confirms completion, payout is queued for ops release using these saved details. New listings also need this destination before they can be published.
              </p>
            </div>
          </div>

          <form className="customerSettingsForm" onSubmit={handlePayoutSave}>
            <div className="customerSettingsForm__row">
              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Payout method</span>
                <PayoutMethodDropdown
                  value={payoutValues.payoutMethod}
                  onChange={handlePayoutMethodChange}
                  disabled={payoutState.pending}
                />
              </label>

              <label className="customerSettingsField">
                <span className="customerSettingsField__label">Account name</span>
                <input
                  className="customerSettingsField__control"
                  type="text"
                  placeholder="Name on the payout account"
                  value={payoutValues.accountName}
                  onChange={(event) =>
                    setPayoutValues((prev) => ({
                      ...prev,
                      accountName: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="customerSettingsField">
              <span className="customerSettingsField__label">
                {WALLET_METHODS.has(payoutValues.payoutMethod)
                  ? "Wallet number"
                  : "Account reference"}
              </span>
              {WALLET_METHODS.has(payoutValues.payoutMethod) ? (
                <div className="freelancerPhoneField">
                  <span className="freelancerPhoneField__prefix">+63</span>
                  <input
                    className="customerSettingsField__control freelancerPhoneField__input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9XXXXXXXXX"
                    value={payoutValues.accountReference}
                    disabled={payoutState.pending}
                    onChange={(event) =>
                      setPayoutValues((prev) => ({
                        ...prev,
                        accountReference: toWalletLocalNumber(event.target.value),
                      }))
                    }
                  />
                </div>
              ) : (
                <input
                  className="customerSettingsField__control"
                  type="text"
                  placeholder="Bank account number or reference"
                  value={payoutValues.accountReference}
                  disabled={payoutState.pending}
                  onChange={(event) =>
                    setPayoutValues((prev) => ({
                      ...prev,
                      accountReference: event.target.value,
                    }))
                  }
                />
              )}
            </label>

            <AnimatePresence mode="wait">
              {payoutState.error ? (
                <Motion.div
                  className="customerSettingsStatus customerSettingsStatus--danger"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {payoutState.error}
                </Motion.div>
              ) : payoutState.success ? (
                <Motion.div
                  className="customerSettingsStatus customerSettingsStatus--success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {payoutState.success}
                </Motion.div>
              ) : null}
            </AnimatePresence>

            <div className="customerSettingsActionsRow">
              <Motion.button
                type="submit"
                className="profileEditor__btn profileEditor__btn--primary customerSettingsAction"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                disabled={payoutState.pending}
              >
                <span>{payoutState.pending ? "Saving..." : "Save payout method"}</span>
              </Motion.button>

              <Motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--ghost customerSettingsAction customerSettingsAction--ghost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() => navigate("/dashboard/freelancer/orders")}
              >
                Open orders
              </Motion.button>
            </div>
          </form>
        </section>
      </Reveal>

      <Reveal delay={0.26}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Account actions</h2>
              <p className="profileSection__sub">
                Sign out when you are done working on this device.
              </p>
            </div>
          </div>

          <div className="freelancerSettingsGrid">
            <article className="freelancerSettingsCard">
              <span className="freelancerDataLabel">Sign out</span>
              <strong className="freelancerDataValue--strong">End this session</strong>
              <Motion.button
                type="button"
                className="profileEditor__btn profileEditor__btn--primary"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleSignOut}
                disabled={signOutPending}
              >
                {signOutPending ? (
                  <LoaderCircle className="customerSettingsAction__spinner" />
                ) : (
                  <LogOut className="profileEditor__btnIcon" />
                )}
                <span>{signOutPending ? "Signing out..." : "Sign out"}</span>
              </Motion.button>
            </article>
          </div>
        </section>
      </Reveal>
    </FreelancerDashboardFrame>
  );
}
