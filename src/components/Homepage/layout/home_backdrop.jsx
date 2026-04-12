import React from "react";
import "./home_backdrop.css";

export default function HomeBackdrop() {
  return (
    <div className="homeBackdrop" aria-hidden="true">
      <div className="homeBackdrop__base" />
      <div className="homeBackdrop__ambient homeBackdrop__ambient--one" />
      <div className="homeBackdrop__ambient homeBackdrop__ambient--two" />
      <div className="homeBackdrop__ambient homeBackdrop__ambient--three" />
      <div className="homeBackdrop__bg" />
      <div className="homeBackdrop__veil" />
    </div>
  );
}
