import React from "react";
import "./home_backdrop.css";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";

export default function HomeBackdrop() {
  return (
    <div className="homeBackdrop" aria-hidden="true">
      <div className="homeBackdrop__base" />

      <div className="homeBackdrop__shadow">
        <EtheralShadow
          sizing="fill"
          color="rgba(0,0,0,0.55)"
          animation={{ scale: 45, speed: 35 }}
          noise={{ opacity: 0.1, scale: 1 }}
        />
      </div>

      <div className="homeBackdrop__bg" />
    </div>
  );
}