import React, { useEffect, useState } from "react";
import "./home_backdrop.css";
import { Component as EtheralShadow } from "../StartUp/etheral-shadow";
import { useReducedMotion } from "framer-motion";

function addMediaListener(mq, handler) {
  if (!mq) return () => {};
  if (mq.addEventListener) {
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }
  mq.addListener(handler);
  return () => mq.removeListener(handler);
}

function getLiteBackdropMode(reduceMotion) {
  if (reduceMotion) return true;
  if (typeof window === "undefined") return false;

  const isSmallScreen = window.matchMedia("(max-width: 820px)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;

  const lowThreads =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  const lowMemory =
    typeof navigator !== "undefined" &&
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 4;

  return isSmallScreen || isCoarsePointer || noHover || lowThreads || lowMemory;
}

export default function HomeBackdrop() {
  const shouldReduceMotion = useReducedMotion();

  const [isLiteMode, setIsLiteMode] = useState(() =>
    getLiteBackdropMode(shouldReduceMotion)
  );

  useEffect(() => {
    const updateMode = () => {
      setIsLiteMode(getLiteBackdropMode(shouldReduceMotion));
    };

    updateMode();

    const mqSmall = typeof window !== "undefined" ? window.matchMedia("(max-width: 820px)") : null;
    const mqPointer = typeof window !== "undefined" ? window.matchMedia("(pointer: coarse)") : null;
    const mqHover = typeof window !== "undefined" ? window.matchMedia("(hover: none)") : null;

    const cleanupSmall = addMediaListener(mqSmall, updateMode);
    const cleanupPointer = addMediaListener(mqPointer, updateMode);
    const cleanupHover = addMediaListener(mqHover, updateMode);

    window.addEventListener("resize", updateMode);

    return () => {
      cleanupSmall();
      cleanupPointer();
      cleanupHover();
      window.removeEventListener("resize", updateMode);
    };
  }, [shouldReduceMotion]);

  return (
    <div className={`homeBackdrop ${isLiteMode ? "homeBackdrop--lite" : ""}`} aria-hidden="true">
      <div className="homeBackdrop__base" />

      {!isLiteMode ? (
        <div className="homeBackdrop__shadow">
          <EtheralShadow
            sizing="fill"
            color="rgba(0,0,0,0.55)"
            animation={{ scale: 45, speed: 35 }}
            noise={{ opacity: 0.08, scale: 1 }}
            performanceMode="full"
          />
        </div>
      ) : (
        <div className="homeBackdrop__staticGlow" />
      )}

      <div className="homeBackdrop__bg" />

      {isLiteMode && <div className="homeBackdrop__veil" />}
    </div>
  );
}