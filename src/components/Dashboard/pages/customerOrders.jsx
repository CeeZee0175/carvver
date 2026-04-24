import React, { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
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
import VerifiedBadge from "../shared/VerifiedBadge";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
} from "../shared/customerProfileShared";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import "./browse_categories.css";
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
  const { loading, orders, error } = useCustomerOrdersData();
  const [filter, setFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

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
        <section className="profileHero profileHero--centered">
          <div className="profileHero__heading">
            <div className="profileHero__titleWrap">
              <h1 className="profileHero__title">
                <span className="customerOrdersPage__titleText">
                  Orders
                  <Motion.svg
                    className="profileHero__line customerOrdersPage__line"
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
                      transition={{ duration: 1.05, ease: "easeInOut", delay: 0.2 }}
                    />
                  </Motion.svg>
                </span>
              </h1>
            </div>

            <p className="profileHero__sub">
              See every order in one place and check what still needs your attention.
            </p>
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
              <p className="profileSection__sub">
                Narrow the order view before you scan the full history below.
              </p>
            </div>
            <Motion.button
              type="button"
              className="profileSection__linkBtn"
              whileHover={{ x: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={PROFILE_SPRING}
              onClick={() => navigate("/dashboard/customer/profile")}
            >
              <span>Back to profile</span>
              <ArrowRight className="profileSection__linkIcon" />
            </Motion.button>
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
              <p className="profileSection__sub">
                Review each booked listing together with its current package snapshot.
              </p>
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
                const packageName = String(order.selected_package_name || "").trim();
                const packageSummary = String(order.selected_package_summary || "").trim();
                const packageDeliveryDays = Number(
                  order.selected_package_delivery_time_days || 0
                );
                return (
                  <Motion.article
                    key={order.id}
                    className="browseServiceCard customerOrderListingCard"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.38 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => navigate(`/dashboard/customer/orders/${order.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/dashboard/customer/orders/${order.id}`);
                      }
                    }}
                  >
                    <div className="browseServiceCard__media customerOrderListingCard__media">
                      {order.previewMedia?.publicUrl ? (
                        order.previewMedia.media_kind === "video" ? (
                          <video
                            className="browseServiceCard__mediaAsset"
                            src={order.previewMedia.publicUrl}
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            className="browseServiceCard__mediaAsset"
                            src={order.previewMedia.publicUrl}
                            alt={order.services?.title || "Order service preview"}
                          />
                        )
                      ) : (
                        <div className="browseServiceCard__mediaBg">
                          <span className="browseServiceCard__mediaIconWrap" aria-hidden="true">
                            <Package className="browseServiceCard__mediaIcon" />
                          </span>
                          {packageName ? (
                            <span className="browseServiceCard__mediaMeta">{packageName}</span>
                          ) : null}
                        </div>
                      )}

                      <div className="browseServiceCard__mediaTop">
                        <span className={`profileOrderStatus profileOrderStatus--${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    <div className="browseServiceCard__body">
                      <div className="browseServiceCard__creatorRow">
                        <div className="browseServiceCard__creatorMain">
                          <div className="browseServiceCard__avatar">
                            {String(freelancerName || "F").charAt(0).toUpperCase()}
                          </div>
                          <div className="browseServiceCard__creatorBlock">
                            <span className="browseServiceCard__creator">
                              <span>{freelancerName}</span>
                              <VerifiedBadge
                                verified={Boolean(order.freelancer?.freelancer_verified_at)}
                                className="verifiedBadge--sm"
                              />
                            </span>
                            <div className="browseServiceCard__trustRow">
                              <span className="browseServiceCard__trustChip browseServiceCard__trustChip--verified">
                                Order history
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <h3 className="browseServiceCard__title customerOrderListingCard__title">
                        {order.services?.title || "Service unavailable"}
                      </h3>

                      {packageName ? (
                        <p className="browseServiceCard__summary">
                          {packageName}
                          {packageSummary ? ` · ${packageSummary}` : ""}
                        </p>
                      ) : (
                        <p className="browseServiceCard__summary">
                          Review the booking details and current fulfillment status.
                        </p>
                      )}

                      <div className="profileOrderCard__meta customerOrderListingCard__meta">
                        <span className="profileOrderCard__metaItem">
                          <Sparkles className="profileOrderCard__metaIcon" />
                          {order.services?.category || "Uncategorized service"}
                        </span>
                        {packageName ? (
                          <span className="profileOrderCard__metaItem">
                            <Package className="profileOrderCard__metaIcon" />
                            {packageDeliveryDays > 0
                              ? `${packageName} · ${packageDeliveryDays} day${
                                  packageDeliveryDays === 1 ? "" : "s"
                                }`
                              : packageName}
                          </span>
                        ) : null}
                        <span className="profileOrderCard__metaItem">
                          <ShoppingBag className="profileOrderCard__metaIcon" />
                          {formatOrderDate(order.created_at)}
                        </span>
                      </div>

                      <div className="browseServiceCard__bottom">
                        <div className="browseServiceCard__offerRow">
                          <div className="browseServiceCard__priceWrap">
                            <span className="browseServiceCard__priceFrom">Total</span>
                            <span className="browseServiceCard__price">
                              {formatOrderPrice(order.total_price)}
                            </span>
                          </div>
                        </div>

                        <Motion.button
                          type="button"
                          className="browseServiceCard__cartBtn customerOrderListingCard__detailBtn"
                          whileHover={{ x: 1 }}
                          whileTap={{ scale: 0.96 }}
                          transition={PROFILE_SPRING}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/dashboard/customer/orders/${order.id}`);
                          }}
                        >
                          <span>View details</span>
                        </Motion.button>
                      </div>
                    </div>
                  </Motion.article>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </CustomerDashboardFrame>
  );
}
