import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import "./home_one.css";
import BeamsBackground from "./BeamsBackground";

const partners = [
  "Maya",
  "GCash",
  "PayPal",
  "Facebook",
  "Instagram",
  "X",
  "TikTok",
];

const carouselPartners = [...partners, ...partners, ...partners];

function PartnerItem({ name }) {
  return (
    <span className="partnerItem">
      <span className="partnerItem__name">{name}</span>
    </span>
  );
}

export default function HomeOne() {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
    },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1.05,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    ]
  );

  return (
    <section className="hero">
      <BeamsBackground className="hero__beams" intensity="medium" />

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
        </div>

        <div className="hero__partnersWrap">
          <p className="hero__partnersLabel">Trusted Partners</p>

          <div className="hero__carouselViewport" ref={emblaRef}>
            <div className="hero__carouselTrack">
              {carouselPartners.map((name, index) => (
                <div className="hero__carouselSlide" key={`${name}-${index}`}>
                  <PartnerItem name={name} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hero__fadeOut" aria-hidden="true" />
    </section>
  );
}