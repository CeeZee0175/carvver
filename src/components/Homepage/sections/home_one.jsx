import React from "react";
import "./home_one.css";
import { ArrowRight } from "lucide-react";

function ArrowIcon() {
  return (
    <svg className="hero__arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const partners = [
  { name: "Maya", type: "mono", mono: "M" },
  { name: "GCash", type: "mono", mono: "G" },
  { name: "PayPal", type: "img", src: "https://cdn.simpleicons.org/paypal/2a1450" },
  { name: "Facebook", type: "img", src: "https://cdn.simpleicons.org/facebook/2a1450" },
  { name: "Instagram", type: "img", src: "https://cdn.simpleicons.org/instagram/2a1450" },
  { name: "Twitter", type: "img", src: "https://cdn.simpleicons.org/x/2a1450" },
];

function FlowButton({ text = "Start Selling" }) {
  return (
    <button className="flowBtn" type="button">
      <ArrowRight className="flowBtn__arr flowBtn__arr--left" />
      <span className="flowBtn__text">{text}</span>
      <span className="flowBtn__circle" aria-hidden="true" />
      <ArrowRight className="flowBtn__arr flowBtn__arr--right" />
    </button>
  );
}

function PartnerItem({ p }) {
  return (
    <span className="partnerItem">
      {p.type === "img" ? (
        <img className="partner__img" src={p.src} alt="" aria-hidden="true" loading="lazy" />
      ) : (
        <span className="partner__mono" aria-hidden="true">
          {p.mono}
        </span>
      )}
      <span className="partner__name">{p.name}</span>
    </span>
  );
}

export default function HomeOne() {
  return (
    <div className="hero">
      <div className="hero__inner">
        <div className="hero__content">
          <h1 className="hero__title fadeIn fadeIn--1">Create. Share. Earn</h1>

          <p className="hero__sub fadeIn fadeIn--2">
            Discover a variety of services from casual freelancers or get paid while showcasing your
            own skills.
          </p>

          <p className="hero__support fadeIn fadeIn--3">
            Post your services and reach a wider audience across multiple social media platforms.
          </p>

          <div className="hero__actions fadeIn fadeIn--4">
            <button className="heroBtn heroBtn--primary" type="button">
              <span className="heroBtn__text">Start Browsing</span>
              <span className="heroBtn__arrowWrap" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>

            <FlowButton text="Start Selling" />
          </div>
        </div>

        <div className="partners fadeIn fadeIn--5">
          <h2 className="partners__title">Partnered With</h2>

          <div className="partners__line" aria-label="Partnered with logos">
            {partners.map((p, index) => (
              <React.Fragment key={p.name}>
                <PartnerItem p={p} />
                {index < partners.length - 1 && (
                  <span className="partners__sep" aria-hidden="true">
                    |
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}