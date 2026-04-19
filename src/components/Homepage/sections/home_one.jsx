import React from "react";
import "./home_one.css";
import BeamsBackground from "./BeamsBackground";

export default function HomeOne() {
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
      </div>

      <div className="hero__fadeOut" aria-hidden="true" />
    </section>
  );
}
