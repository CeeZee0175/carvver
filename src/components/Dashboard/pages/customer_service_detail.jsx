import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion} from "framer-motion";
import { ArrowRight, Heart, Link as LinkIcon, MessageCircle, Bookmark } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { createClient } from "../../../lib/supabase/client";
import { PROFILE_SPRING } from "../shared/customerProfileConfig";
import {
  CustomerDashboardFrame,
  DashboardBreadcrumbs,
  EmptySurface,
  Reveal,
  TypewriterHeading,
} from "../shared/customerProfileShared";
import { useCustomerFavoriteFreelancers } from "../hooks/useCustomerFavoriteFreelancers";
import VerifiedBadge from "../shared/VerifiedBadge";
import { useCart } from "../hooks/useCart";
import { useServiceListingDetail } from "../hooks/useServiceListingDetail";
import MarketplaceComments from "../shared/marketplace_comments";
import "./service_listing_detail.css";

const supabase = createClient();

function formatPeso(value) {
  return `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function packagesMatchCartItem(cartItem, selectedPackage) {
  return (
    String(cartItem?.selected_package_id || "") === String(selectedPackage?.id || "") &&
    String(cartItem?.selected_package_name || "") === String(selectedPackage?.name || "") &&
    Number(cartItem?.selected_package_price || 0) === Number(selectedPackage?.price || 0)
  );
}

export default function CustomerServiceDetail() {
  const navigate = useNavigate();
  const { serviceId = "" } = useParams();
  const { loading, service, error, reload } = useServiceListingDetail(serviceId);
  const { favoriteIds, toggleFavoriteFreelancer } = useCustomerFavoriteFreelancers({
    includeProfiles: false,
  });
  const { items, addItem, serviceIds: cartServiceIds } = useCart();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [favoriteActionLoading, setFavoriteActionLoading] = useState(false);
  const [activeMediaId, setActiveMediaId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSavedState() {
      if (!serviceId) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      const { data, error: savedError } = await supabase
        .from("saved_services")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("service_id", serviceId)
        .maybeSingle();

      if (!active) return;
      if (savedError) {
        setSaved(false);
        return;
      }

      setSaved(Boolean(data?.id));
    }

    loadSavedState().catch(() => {
      if (active) setSaved(false);
    });

    return () => {
      active = false;
    };
  }, [serviceId]);

  useEffect(() => {
    if (!service?.media?.length) {
      setActiveMediaId("");
      return;
    }

    setActiveMediaId((prev) => {
      const current = service.media.find((item) => item.id === prev);
      if (current) return prev;
      return service.media[0]?.id || "";
    });
  }, [service]);

  useEffect(() => {
    if (!service?.packages?.length) {
      setSelectedPackageId("");
      return;
    }

    setSelectedPackageId((prev) => {
      const current = service.packages.find((item) => String(item.id || item.name) === prev);
      if (current) return prev;
      const first = service.packages[0];
      return String(first.id || first.name);
    });
  }, [service]);

  const selectedPackage = useMemo(() => {
    if (!service?.packages?.length) return null;
    return (
      service.packages.find((item) => String(item.id || item.name) === selectedPackageId) ||
      service.packages[0]
    );
  }, [selectedPackageId, service]);

  const activeMedia = useMemo(() => {
    if (!service?.media?.length) return null;
    return service.media.find((item) => item.id === activeMediaId) || service.media[0];
  }, [activeMediaId, service]);

  const cartItem = useMemo(
    () => items.find((item) => item.service_id === service?.id) || null,
    [items, service]
  );
  const inCart = cartServiceIds.includes(service?.id);
  const selectedPackageInCart = cartItem && selectedPackage
    ? packagesMatchCartItem(cartItem, selectedPackage)
    : false;
  const favoriteFreelancer = favoriteIds.includes(service?.freelancer?.id || service?.freelancer_id);

  const handleToggleSave = async () => {
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error("Please sign in to save listings.");
      }

      if (saved) {
        const { error: deleteError } = await supabase
          .from("saved_services")
          .delete()
          .eq("user_id", session.user.id)
          .eq("service_id", serviceId);

        if (deleteError) throw deleteError;
        setSaved(false);
        toast("Removed from saved.");
        return;
      }

      const { error: insertError } = await supabase.from("saved_services").insert({
        user_id: session.user.id,
        service_id: serviceId,
      });

      if (insertError && insertError.code !== "23505") throw insertError;
      setSaved(true);
      toast.success("Saved to your listings.");
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't update your saved listings.");
    } finally {
      setSaving(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!service?.freelancer?.id) return;

    try {
      setFavoriteActionLoading(true);
      const result = await toggleFavoriteFreelancer(service.freelancer.id, {
        id: service.freelancer.id,
        display_name: service.freelancer.displayName,
        avatar_url: service.freelancer.avatarUrl,
      });

      toast.success(
        result.favorite
          ? `${service.freelancer.displayName} is now in your favorites.`
          : `${service.freelancer.displayName} was removed from your favorites.`
      );
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't update your favorites.");
    } finally {
      setFavoriteActionLoading(false);
    }
  };

  const handleOpenMessage = () => {
    if (!service?.freelancer?.id) return;

    navigate(
      `/dashboard/customer/messages?freelancer=${encodeURIComponent(
        service.freelancer.id
      )}&serviceTitle=${encodeURIComponent(service.title)}`
    );
  };

  const handleCartAction = async () => {
    if (!service || !selectedPackage) return;

    if (selectedPackageInCart) {
      navigate("/dashboard/customer/cart");
      return;
    }

    try {
      setCartActionLoading(true);
      const result = await addItem({
        service,
        selectedPackage,
      });

      if (result?.updated) {
        toast.success("Cart updated to this package.");
        return;
      }

      if (result?.duplicate) {
        navigate("/dashboard/customer/cart");
        return;
      }

      toast.success("Added to cart.");
    } catch (nextError) {
      toast.error(nextError.message || "We couldn't update your cart.");
    } finally {
      setCartActionLoading(false);
    }
  };

  const packageActionBusyLabel = inCart ? "Updating..." : "Adding...";
  const packageActionLabel = selectedPackageInCart
    ? "In cart"
    : inCart
      ? "Update cart"
      : "Add to cart";

  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details serviceDetailPage">
      <Reveal>
        <DashboardBreadcrumbs
          items={[
            { label: "Browse Services", to: "/dashboard/customer/browse-services" },
            { label: service?.title || "Listing" },
          ]}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <section className="serviceDetailHero">
          <div className="serviceDetailHero__top">
            <div className="serviceDetailHero__copy">
              <div className="serviceDetailHero__titleWrap">
                <h1 className="serviceDetailHero__title">
                  <TypewriterHeading text={service?.title || "Listing"} />
                </h1>
                <Motion.svg
                  className="serviceDetailHero__line"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <Motion.path
                    d="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
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

              <p className="serviceDetailHero__sub">
                Review the package options, check the media, and choose the setup that fits your brief before checkout.
              </p>
            </div>

            <div className="serviceDetailHero__actions">
              <Motion.button
                type="button"
                className="serviceDetailBtnGhost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleToggleSave}
                disabled={saving}
              >
                <Bookmark style={{ width: 14, height: 14 }} />
                <span>{saving ? "Saving..." : saved ? "Saved" : "Save listing"}</span>
              </Motion.button>

              <Motion.button
                type="button"
                className="serviceDetailBtnGhost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={handleOpenMessage}
                disabled={!service?.freelancer?.id}
              >
                <MessageCircle style={{ width: 14, height: 14 }} />
                <span>Message</span>
              </Motion.button>

              <Motion.button
                type="button"
                className="serviceDetailBtnGhost"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                transition={PROFILE_SPRING}
                onClick={() =>
                  navigate(`/dashboard/customer/freelancers/${service?.freelancer?.id}`)
                }
                disabled={!service?.freelancer?.id}
              >
                <span>View freelancer</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Motion.button>
            </div>
          </div>

          {service ? (
            <div className="serviceDetailHero__meta">
              <div className="serviceDetailHero__metaItem">
                <span className="serviceDetailHero__metaLabel">Category</span>
                <strong className="serviceDetailHero__metaValue">{service.category}</strong>
              </div>
              <div className="serviceDetailHero__metaItem">
                <span className="serviceDetailHero__metaLabel">Location</span>
                <strong className="serviceDetailHero__metaValue">{service.locationLabel}</strong>
              </div>
              <div className="serviceDetailHero__metaItem">
                <span className="serviceDetailHero__metaLabel">Starting at</span>
                <strong className="serviceDetailHero__metaValue">
                  {formatPeso(service.startingPrice)}
                </strong>
              </div>
            </div>
          ) : null}
        </section>
      </Reveal>

      {loading ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <div className="serviceDetailCard" style={{ minHeight: 420 }} />
          </section>
        </Reveal>
      ) : error || !service ? (
        <Reveal delay={0.08}>
          <section className="profileSection">
            <EmptySurface
              hideIcon
              title="We couldn't open this listing"
              description={error || "Please try again."}
              actionLabel="Try again"
              onAction={reload}
              className="serviceDetailEmpty"
            />
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
          <section className="profileSection serviceDetailLayout">
            <div className="serviceDetailMain">
              <article className="serviceDetailCard">
                <div className="serviceDetailCard__head">
                  <h2 className="serviceDetailSection__title">Gallery</h2>
                  <p className="serviceDetailSection__sub">
                    Browse the cover and extra media before you choose a package.
                  </p>
                </div>

                {activeMedia ? (
                  <div className="serviceDetailMediaStage">
                    {activeMedia.kind === "video" ? (
                      <video src={activeMedia.publicUrl} controls playsInline />
                    ) : (
                      <img src={activeMedia.publicUrl} alt={service.title} />
                    )}
                  </div>
                ) : (
                  <div className="serviceDetailMediaStage" />
                )}

                {service.media.length > 1 ? (
                  <div className="serviceDetailMediaGrid">
                    {service.media.map((item) => (
                      <Motion.button
                        key={item.id}
                        type="button"
                        className={`serviceDetailMediaThumb ${
                          item.id === activeMedia?.id ? "serviceDetailMediaThumb--active" : ""
                        }`.trim()}
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={PROFILE_SPRING}
                        onClick={() => setActiveMediaId(item.id)}
                      >
                        <div className="serviceDetailMediaThumb__preview">
                          {item.kind === "video" ? (
                            <video src={item.publicUrl} muted playsInline />
                          ) : (
                            <img src={item.publicUrl} alt={service.title} />
                          )}
                        </div>
                        <div className="serviceDetailMediaThumb__body">
                          <strong className="serviceDetailCard__label">
                            {item.isCover ? "Cover media" : "Gallery media"}
                          </strong>
                          <span className="serviceDetailMediaThumb__meta">
                            {item.originalName}
                          </span>
                        </div>
                      </Motion.button>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="serviceDetailCard">
                <h2 className="serviceDetailSection__title">What this listing covers</h2>
                <p className="serviceDetailSection__sub">
                  Review the overview and highlights the freelancer shared for this listing.
                </p>
                <p className="serviceDetail__bodyText">{service.overview}</p>

                {service.highlights.length > 0 ? (
                  <>
                    <span className="serviceDetailCard__label">Highlights</span>
                    <div className="serviceDetailHighlights">
                      {service.highlights.map((item) => (
                        <span key={item} className="serviceDetailHighlights__item">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
              </article>

              <article className="serviceDetailCard">
                <h2 className="serviceDetailSection__title">Choose your package</h2>
                <p className="serviceDetailSection__sub">
                  Pick one package at a time before you send this listing to cart.
                </p>
                <div className="serviceDetailPackages">
                  {service.packages.map((item) => {
                    const active = String(item.id || item.name) === selectedPackageId;
                    return (
                      <Motion.button
                        key={`${item.id || item.name}`}
                        type="button"
                        className={`serviceDetailPackage ${active ? "serviceDetailPackage--selected" : ""}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        transition={PROFILE_SPRING}
                        onClick={() => setSelectedPackageId(String(item.id || item.name))}
                      >
                        <div className="serviceDetailPackage__top">
                          <div>
                            <span className="serviceDetailCard__label">{item.name}</span>
                            <h3 className="serviceDetailPackage__title">{item.name}</h3>
                          </div>
                          <strong className="serviceDetailPackage__price">
                            {item.priceLabel}
                          </strong>
                        </div>

                        {item.summary ? (
                          <p className="serviceDetailPackage__summary">{item.summary}</p>
                        ) : null}

                        <div className="serviceDetailPackage__facts">
                          <div className="serviceDetailPackage__fact">
                            <span className="serviceDetailPackage__factLabel">Delivery</span>
                            <span className="serviceDetailPackage__factValue">
                              {item.deliveryTimeDays > 0
                                ? `${item.deliveryTimeDays} day${item.deliveryTimeDays === 1 ? "" : "s"}`
                                : "Flexible"}
                            </span>
                          </div>
                        </div>

                        {item.includedItems.length > 0 ? (
                          <div className="serviceDetailPillRow">
                            {item.includedItems.map((entry) => (
                              <span key={entry} className="serviceDetailPill">
                                {entry}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </Motion.button>
                    );
                  })}
                </div>
              </article>

              <article className="serviceDetailCard serviceDetailCommentsCard">
                <MarketplaceComments
                  targetType="service"
                  targetId={service.id}
                  targetOwnerId={service.freelancer?.id}
                  title="Listing comments"
                  description="Ask clear questions or leave notes about this service before you book."
                  emptyTitle="No questions or notes yet."
                  emptyDescription="Customers can start a focused thread about this listing."
                  composePlaceholder="Ask about availability, scope, or package details"
                  composeHelper="Customers can comment here. Booking details still belong in messages."
                />
              </article>
            </div>

            <aside className="serviceDetailSide">
              <article className="serviceDetailFreelancer">
                <h2 className="serviceDetailSection__title">Freelancer</h2>
                <p className="serviceDetailSection__sub">
                  Review the creator behind this listing and open a conversation if needed.
                </p>
                <div className="serviceDetailFreelancer__top">
                  <div className="serviceDetailFreelancer__avatar" aria-hidden="true">
                    {service.freelancer.avatarUrl ? (
                      <img src={service.freelancer.avatarUrl} alt={service.freelancer.displayName} />
                    ) : (
                      service.freelancer.initials
                    )}
                  </div>
                  <div>
                    <div className="serviceDetailFreelancer__name">
                      <span>{service.freelancer.displayName}</span>
                      <VerifiedBadge
                        verified={service.freelancer.verified}
                        className="verifiedBadge--sm"
                      />
                    </div>
                    {service.freelancer.headline ? (
                      <p className="serviceDetailFreelancer__headline">
                        {service.freelancer.headline}
                      </p>
                    ) : null}
                  </div>
                </div>

                {service.freelancer.bio ? (
                  <p className="serviceDetailFreelancer__bio">{service.freelancer.bio}</p>
                ) : null}

                <div className="serviceDetailPillRow">
                  <span className="serviceDetailPill">{service.freelancer.locationLabel}</span>
                  {service.freelancer.portfolioUrl ? (
                    <a
                      className="serviceDetailPill"
                      href={service.freelancer.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <LinkIcon style={{ width: 13, height: 13 }} />
                      Portfolio
                    </a>
                  ) : null}
                </div>

                <div className="serviceDetailHero__secondaryActions">
                  <Motion.button
                    type="button"
                    className="serviceDetailTagBtn"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleFavoriteToggle}
                    disabled={favoriteActionLoading || !service?.freelancer?.id}
                  >
                    <Heart style={{ width: 14, height: 14 }} fill={favoriteFreelancer ? "currentColor" : "none"} />
                    <span>
                      {favoriteActionLoading
                        ? "Updating..."
                        : favoriteFreelancer
                          ? "Favorited"
                          : "Favorite freelancer"}
                    </span>
                  </Motion.button>

                  <Motion.button
                    type="button"
                    className="serviceDetailTagBtn"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleOpenMessage}
                    disabled={!service?.freelancer?.id}
                  >
                    <MessageCircle style={{ width: 14, height: 14 }} />
                    <span>Message</span>
                  </Motion.button>
                </div>
              </article>

              <article className="serviceDetailPackage">
                <h2 className="serviceDetailSection__title">{selectedPackage?.name}</h2>
                <p className="serviceDetailSection__sub">
                  This summary follows the package you currently have selected.
                </p>
                {selectedPackage?.summary ? (
                  <p className="serviceDetailPackage__summary">{selectedPackage.summary}</p>
                ) : null}

                <div className="serviceDetailPackage__facts">
                  <div className="serviceDetailPackage__fact">
                    <span className="serviceDetailPackage__factLabel">Price</span>
                    <span className="serviceDetailPackage__factValue">
                      {formatPeso(selectedPackage?.price || 0)}
                    </span>
                  </div>
                  <div className="serviceDetailPackage__fact">
                    <span className="serviceDetailPackage__factLabel">Delivery</span>
                    <span className="serviceDetailPackage__factValue">
                      {selectedPackage?.deliveryTimeDays > 0
                        ? `${selectedPackage.deliveryTimeDays} day${selectedPackage.deliveryTimeDays === 1 ? "" : "s"}`
                        : "Flexible"}
                    </span>
                  </div>
                </div>

                {selectedPackage?.includedItems?.length > 0 ? (
                  <div className="serviceDetailPillRow">
                    {selectedPackage.includedItems.map((entry) => (
                      <span key={entry} className="serviceDetailPill">
                        {entry}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="serviceDetailPackage__actions">
                  <Motion.button
                    type="button"
                    className="serviceDetailPackage__cta"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={PROFILE_SPRING}
                    onClick={handleCartAction}
                    disabled={cartActionLoading || !selectedPackage}
                  >
                    {cartActionLoading ? packageActionBusyLabel : packageActionLabel}
                  </Motion.button>

                  {selectedPackageInCart ? (
                    <span className="serviceDetailStatus">
                      This package is already in your cart.
                    </span>
                  ) : inCart ? (
                    <span className="serviceDetailStatus">
                      Choosing this package will update the cart.
                    </span>
                  ) : null}
                </div>
              </article>
            </aside>
          </section>
        </Reveal>
      )}
    </CustomerDashboardFrame>
  );
}
