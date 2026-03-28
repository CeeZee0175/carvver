import React, { useEffect, useId, useMemo, useRef, useState, useCallback } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = () => {
  const id = useId();
  const cleanId = id.replace(/:/g, "");
  return `shadowoverlay-${cleanId}`;
};

function addMediaListener(mq, handler) {
  if (!mq) return () => {};
  if (mq.addEventListener) {
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }
  mq.addListener(handler);
  return () => mq.removeListener(handler);
}

function checkGPUCapability() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

function getPerformanceTier(reduceMotion) {
  if (reduceMotion) return "lite";
  if (typeof window === "undefined") return "high";

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

  const noGPU = !checkGPUCapability();

  if (noGPU || lowThreads || lowMemory) return "lite";
  if (isSmallScreen || isCoarsePointer || noHover) return "medium";

  return "high";
}

export function Component({
  sizing = "fill",
  color = "rgba(128, 128, 128, 1)",
  animation,
  noise,
  style,
  className,
  performanceMode = "auto",
}) {
  const id = useInstanceId();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);

  const animScale = animation?.scale ?? 0;
  const animSpeed = animation?.speed ?? 0;
  const baseAnimationEnabled = animScale > 0;

  const feColorMatrixRef = useRef(null);
  const feTurbulenceRef = useRef(null);
  const hueRotateMotionValue = useMotionValue(180);
  const hueRotateAnimation = useRef(null);

  const [performanceTier, setPerformanceTier] = useState(() => {
    if (performanceMode === "lite") return "lite";
    if (performanceMode === "high") return "high";
    return getPerformanceTier(shouldReduceMotion);
  });

  const [isPageVisible, setIsPageVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return !document.hidden;
  });

  const [isInViewport, setIsInViewport] = useState(true);
  const lastFrameTimeRef = useRef(0);
  const frameSkipRef = useRef(0);

  useEffect(() => {
    if (performanceMode !== "auto") return;

    let resizeTimeout;
    const updateTier = () => {
      setPerformanceTier(getPerformanceTier(shouldReduceMotion));
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateTier, 250);
    };

    const mqSmall = typeof window !== "undefined" ? window.matchMedia("(max-width: 820px)") : null;
    const mqPointer = typeof window !== "undefined" ? window.matchMedia("(pointer: coarse)") : null;
    const mqHover = typeof window !== "undefined" ? window.matchMedia("(hover: none)") : null;

    const cleanupSmall = addMediaListener(mqSmall, updateTier);
    const cleanupPointer = addMediaListener(mqPointer, updateTier);
    const cleanupHover = addMediaListener(mqHover, updateTier);

    if (typeof window !== "undefined") {
      window.addEventListener("resize", debouncedResize);
    }

    return () => {
      cleanupSmall();
      cleanupPointer();
      cleanupHover();
      clearTimeout(resizeTimeout);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", debouncedResize);
      }
    };
  }, [performanceMode, shouldReduceMotion]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden);
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, []);

  const animationEnabled =
    baseAnimationEnabled &&
    !shouldReduceMotion &&
    performanceTier !== "lite" &&
    isPageVisible &&
    isInViewport;

  const getFrameSkipRate = useCallback(() => {
    switch (performanceTier) {
      case "lite":
        return 2;
      case "medium":
        return 1;
      case "high":
        return 0;
      default:
        return 0;
    }
  }, [performanceTier]);

  const displacementScale = useMemo(() => {
    if (!animationEnabled) return 0;
    const baseScale = mapRange(animScale, 1, 100, 25, 130);
    return performanceTier === "medium" ? baseScale * 0.75 : baseScale;
  }, [animationEnabled, animScale, performanceTier]);

  const animationDuration = useMemo(() => {
    if (!animationEnabled) return 1;
    const baseDuration = mapRange(animSpeed, 1, 100, 1200, 80);
    return performanceTier === "medium" ? baseDuration * 1.2 : baseDuration;
  }, [animationEnabled, animSpeed, performanceTier]);

  useEffect(() => {
    if (!animationEnabled || !feColorMatrixRef.current) return;

    if (hueRotateAnimation.current) hueRotateAnimation.current.stop();

    hueRotateMotionValue.set(0);
    hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
      duration: animationDuration / 25,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      onUpdate: (value) => {
        if (feColorMatrixRef.current) {
          feColorMatrixRef.current.setAttribute("values", String(value));
        }
      },
    });

    return () => {
      if (hueRotateAnimation.current) hueRotateAnimation.current.stop();
    };
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  useEffect(() => {
    if (!animationEnabled || !feTurbulenceRef.current) return;

    let raf = 0;
    const start = performance.now();
    const frameSkipRate = getFrameSkipRate();

    const speed = mapRange(animSpeed, 1, 100, 0.35, 1.3);
    const ampX = mapRange(animScale, 1, 100, 0.00015, 0.0007);
    const ampY = mapRange(animScale, 1, 100, 0.00035, 0.0011);

    const baseX = mapRange(animScale, 0, 100, 0.0012, 0.0006);
    const baseY = mapRange(animScale, 0, 100, 0.0042, 0.0024);

    const tick = (t) => {
      frameSkipRef.current++;

      if (frameSkipRef.current <= frameSkipRate) {
        raf = requestAnimationFrame(tick);
        return;
      }

      frameSkipRef.current = 0;
      const s = ((t - start) / 1000) * speed;

      const x = baseX + Math.sin(s * 0.9) * ampX;
      const y = baseY + Math.cos(s * 0.75) * ampY;

      if (feTurbulenceRef.current) {
        feTurbulenceRef.current.setAttribute("baseFrequency", `${x} ${y}`);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [animationEnabled, animScale, animSpeed, getFrameSkipRate]);

  const finalNoiseOpacity = useMemo(() => {
    const raw = (noise?.opacity || 0) / 2;
    if (performanceTier === "lite") return Math.min(raw, 0.04);
    if (performanceTier === "medium") return Math.min(raw, 0.06);
    return raw;
  }, [noise?.opacity, performanceTier]);

  const finalNoiseScale = useMemo(() => {
    if (performanceTier === "lite") return Math.min(noise?.scale || 1, 0.8);
    if (performanceTier === "medium") return Math.min(noise?.scale || 1, 0.9);
    return noise?.scale || 1;
  }, [noise?.scale, performanceTier]);

  const svgFilterDef = useMemo(() => {
    if (!animationEnabled) return null;

    const octaves = performanceTier === "medium" ? 1 : 2;

    return (
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        style={{ position: "absolute" }}
      >
        <defs>
          <filter id={id}>
            <feTurbulence
              ref={feTurbulenceRef}
              result="undulation"
              numOctaves={octaves}
              baseFrequency="0.001 0.004"
              seed="0"
              type="turbulence"
            />
            <feColorMatrix
              ref={feColorMatrixRef}
              in="undulation"
              result="hue"
              type="hueRotate"
              values="180"
            />
            <feColorMatrix
              in="hue"
              result="circulation"
              type="matrix"
              values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="circulation"
              scale={displacementScale}
              result="dist"
            />
            <feDisplacementMap
              in="dist"
              in2="undulation"
              scale={displacementScale}
              result="output"
            />
          </filter>
        </defs>
      </svg>
    );
  }, [animationEnabled, id, performanceTier, displacementScale]);

  const innerFilter = animationEnabled
    ? `url(#${id}) blur(6px)`
    : performanceTier === "lite"
    ? "blur(3px)"
    : "none";

  const innerInset = animationEnabled ? -displacementScale : -2;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        willChange: animationEnabled ? "transform" : "auto",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: innerInset,
          filter: innerFilter,
          opacity: performanceTier === "lite" ? 0.92 : 1,
          willChange: animationEnabled ? "filter" : "auto",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          contain: animationEnabled ? "layout style paint" : "auto",
        }}
      >
        {svgFilterDef}

        <div
          style={{
            backgroundColor: color,
            WebkitMaskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
            maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
            WebkitMaskSize: sizing === "stretch" ? "100% 100%" : "cover",
            maskSize: sizing === "stretch" ? "100% 100%" : "cover",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {noise && finalNoiseOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
            backgroundSize: finalNoiseScale * 200,
            backgroundRepeat: "repeat",
            opacity: finalNoiseOpacity,
            willChange: "opacity",
          }}
        />
      )}
    </div>
  );
}

export default React.memo(Component);