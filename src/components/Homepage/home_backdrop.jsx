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

function getShouldUseLiteBackdrop(reduceMotion) {
  // Only use the static glow fallback when the device truly can't animate.
  // Mobile devices now get the lighter "medium" animation via etheral-shadow's
  // own tier detection — so we don't need to hide the shadow here anymore.
  if (reduceMotion) return true;
  if (typeof window === "undefined") return false;

  const lowThreads =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 2;

  const lowMemory =
    typeof navigator !== "undefined" &&
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 2;

  // No GPU = no SVG filter support, use static fallback
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return true;
  } catch {
    return true;
  }

  return lowThreads || lowMemory;
}

export default function HomeBackdrop() {
  const shouldReduceMotion = useReducedMotion();

  const [isLiteMode, setIsLiteMode] = useState(() =>
    getShouldUseLiteBackdrop(shouldReduceMotion)
  );

  useEffect(() => {
    const updateMode = () => {
      setIsLiteMode(getShouldUseLiteBackdrop(shouldReduceMotion));
    };

    updateMode();

    // Still listen for reduce-motion changes
    const mqMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const cleanupMotion = addMediaListener(mqMotion, updateMode);

    return () => {
      cleanupMotion();
    };
  }, [shouldReduceMotion]);

  return (
    <div className={`homeBackdrop ${isLiteMode ? "homeBackdrop--lite" : ""}`} aria-hidden="true">
      <div className="homeBackdrop__base" />

      {!isLiteMode ? (
        // "auto" lets etheral-shadow decide the tier itself:
        // high on desktop, medium (lighter) on mobile, lite only if GPU is missing
        <div className="homeBackdrop__shadow">
          <EtheralShadow
            sizing="fill"
            color="rgba(0,0,0,0.55)"
            animation={{ scale: 45, speed: 35 }}
            noise={{ opacity: 0.08, scale: 1 }}
            performanceMode="auto"
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