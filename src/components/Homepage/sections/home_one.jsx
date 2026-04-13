import React from "react";
import "./home_one.css";
import { ArrowRight } from "lucide-react";

const partners = [
  { name: "Maya", mono: "M" },
  { name: "GCash", mono: "G" },
  { name: "PayPal", src: "https://cdn.simpleicons.org/paypal/2a1450" },
  { name: "Facebook", src: "https://cdn.simpleicons.org/facebook/2a1450" },
  { name: "Instagram", src: "https://cdn.simpleicons.org/instagram/2a1450" },
  { name: "X", src: "https://cdn.simpleicons.org/x/2a1450" },
];

function HeroButton({ text, primary = false }) {
  return (
    <button className={`heroBtn ${primary ? "heroBtn--primary" : "heroBtn--secondary"}`} type="button">
      <span className="heroBtn__label">{text}</span>
      <ArrowRight className="heroBtn__icon" aria-hidden="true" />
    </button>
  );
}

function PartnerItem({ partner }) {
  return (
    <span className="partnerItem">
      <span className="partnerItem__icon" aria-hidden="true">
        {partner.src ? (
          <img className="partnerItem__img" src={partner.src} alt="" loading="lazy" />
        ) : (
          <span className="partnerItem__mono">{partner.mono}</span>
        )}
      </span>
      <span className="partnerItem__name">{partner.name}</span>
    </span>
  );
}

export default function HomeOne() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__mesh hero__mesh--one" />
        <span className="hero__mesh hero__mesh--two" />
        <span className="hero__mesh hero__mesh--three" />
        <span className="hero__grain" />
      </div>

      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__kicker">Create. Share. Earn</p>

          <h1 className="hero__title">
            Find trusted creators or start earning from what you love.
          </h1>

          <div className="hero__actions">
            <HeroButton text="Find a Freelancer" primary />
            <HeroButton text="Become a Seller" />
          </div>
        </div>

        <div className="hero__partnersWrap">
          <p className="hero__partnersLabel">Connected with tools people already use</p>

          <div className="hero__partners" aria-label="Connected platforms">
            {partners.map((partner, index) => (
              <React.Fragment key={partner.name}>
                <PartnerItem partner={partner} />
                {index < partners.length - 1 && <span className="hero__partnersDivider" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}