import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCustomerDisplayName } from "../shared/customerIdentity";
import { useCustomerOrdersData } from "../hooks/useCustomerProfileData";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./profile.css";

const ORDER_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Disputed", value: "disputed" },
];

const STATUS_META = {
  pending: { label: "Pending", tone: "gold" },
  active: { label: "Active", tone: "violet" },
  completed: { label: "Completed", tone: "emerald" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  disputed: { label: "Disputed", tone: "rose" },
};

function formatOrderDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatOrderPrice(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

function OrderStat({ label, value }) {
  return (
    <div className="profileMiniStat profileMiniStat--open">
      <span className="profileMiniStat__label">{label}</span>
      <strong className="profileMiniStat__value">{value}</strong>
    </div>
  );
}

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { loading, orders, savedCount, error } = useCustomerOrdersData();
  const [filter, setFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((order) => ["pending", "active"].includes(order.status))
        .length,
      completed: orders.filter((order) => order.status === "completed").length,
    }),
    [orders]
  );

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details customerOrdersPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Profile", to: "/dashboard/customer/profile" },
            { label: "Orders" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="profileHero">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <span className="customerOrdersPage__titleText">
                  <TypewriterHeading text="Orders" />
                  <motion.svg
                    className="profileHero__line customerOrdersPage__line"
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
                </span>
              </h1>
            </div>
          </div>

          <div className="profileHero__stats profileHero__stats--open">
            <OrderStat label="Total" value={stats.total} />
            <OrderStat label="Active" value={stats.active} />
            <OrderStat label="Completed" value={stats.completed} />
            <OrderStat label="Bookmarked Items" value={savedCount} />
          </div>
        </section>
      </Reveal>

      {error && (
        <Reveal delay={0.08}>
          <section className="profileNotice">
            <div className="profileNotice__iconWrap" aria-hidden="true">
              <ShieldCheck className="profileNotice__icon" />
            </div>
            <div className="profileNotice__copy">
              <h2 className="profileNotice__title">We couldn't load your orders</h2>
              <p className="profileNotice__desc">{error}</p>
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Status</h2>
            </div>
            <motion.button
              type="button"
              className="profileSection__linkBtn"
              whileHover={{ x: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/profile")}
            >
              <span>Back to profile</span>
              <ArrowRight className="profileSection__linkIcon" />
            </motion.button>
          </div>

          <div className="profileFilterGroup profileFilterGroup--scroll">
            {ORDER_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`profileFilterChip ${
                  filter === option.value ? "profileFilterChip--active" : ""
                }`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="profileSection">
          <div className="profileSection__head">
            <div>
              <h2 className="profileSection__title">Your order history</h2>
            </div>
            <div className="profileSection__sideNote">
              {filteredOrders.length} shown
            </div>
          </div>

          {loading ? (
            <div className="profileOrderList">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="profileOrderCard profileOrderCard--skeleton" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptySurface
              className={`customerOrdersPage__empty ${
                orders.length === 0 ? "customerOrdersPage__empty--noDesc" : ""
              }`}
              hideIcon
              title="No orders match this view"
              description={
                orders.length === 0
                  ? null
                  : "Try a different status filter to see the rest of your order history."
              }
              actionLabel={orders.length === 0 ? "Browse services" : undefined}
              onAction={
                orders.length === 0
                  ? () => navigate("/dashboard/customer/browse-services")
                  : undefined
              }
            />
          ) : (
            <div className="profileOrderList">
              {filteredOrders.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending;
                const freelancerName = getCustomerDisplayName(order.freelancer);

                return (
                  <article key={order.id} className="profileOrderCard">
                    <div className="profileOrderCard__top">
                      <div>
                        <span className={`profileOrderStatus profileOrderStatus--${meta.tone}`}>
                          {meta.label}
                        </span>
                        <h3 className="profileOrderCard__title">
                          {order.services?.title || "Service unavailable"}
                        </h3>
                      </div>
                      <strong className="profileOrderCard__price">
                        {formatOrderPrice(order.total_price)}
                      </strong>
                    </div>

                    <div className="profileOrderCard__meta">
                      <span className="profileOrderCard__metaItem">
                        <Sparkles className="profileOrderCard__metaIcon" />
                        {order.services?.category || "Uncategorized service"}
                      </span>
                      <span className="profileOrderCard__metaItem">
                        <Package className="profileOrderCard__metaIcon" />
                        {freelancerName}
                      </span>
                      <span className="profileOrderCard__metaItem">
                        <ShoppingBag className="profileOrderCard__metaIcon" />
                        {formatOrderDate(order.created_at)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
