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
import { getCustomerDisplayName } from "../shared/customerAchievements";
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
    <CustomerDashboardFrame mainClassName="profilePage">
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
            <p className="profileHero__eyebrow">Customer Orders</p>
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <TypewriterHeading text="Orders" />
              </h1>
              <motion.svg
                className="profileHero__line"
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
            <p className="profileHero__sub">
              Keep track of every service you have booked, check what is still in
              progress, and come back here whenever you want a clear view of your
              customer activity.
            </p>
          </div>

          <div className="profileHero__stats">
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Total</span>
              <strong className="profileMiniStat__value">{stats.total}</strong>
              <span className="profileMiniStat__hint">Orders placed</span>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Active</span>
              <strong className="profileMiniStat__value">{stats.active}</strong>
              <span className="profileMiniStat__hint">Pending + active work</span>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Completed</span>
              <strong className="profileMiniStat__value">{stats.completed}</strong>
              <span className="profileMiniStat__hint">Finished orders</span>
            </div>
            <div className="profileMiniStat">
              <span className="profileMiniStat__label">Bookmarked Items</span>
              <strong className="profileMiniStat__value">{savedCount}</strong>
              <span className="profileMiniStat__hint">Saved listings to revisit</span>
            </div>
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
              <p className="profileSection__eyebrow">Filters</p>
              <h2 className="profileSection__title">Check one status or scan everything</h2>
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
              <p className="profileSection__eyebrow">Order List</p>
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
              icon={ShoppingBag}
              title="No orders match this view"
              description={
                orders.length === 0
                  ? "Once you place your first order, it will show up here with its real status and service details."
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
