import React, { useEffect, useId, useMemo, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";

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

export function Component({
  sizing = "fill",
  color = "rgba(128, 128, 128, 1)",
  animation,
  noise,
  style,
  className,
}) {
  const id = useInstanceId();

  const animScale = animation?.scale ?? 0;
  const animSpeed = animation?.speed ?? 0;
  const animationEnabled = animScale > 0;

  const feColorMatrixRef = useRef(null);
  const feTurbulenceRef = useRef(null);

  const hueRotateMotionValue = useMotionValue(180);
  const hueRotateAnimation = useRef(null);

  const displacementScale = useMemo(() => {
    return animationEnabled ? mapRange(animScale, 1, 100, 25, 130) : 0;
  }, [animationEnabled, animScale]);

  const animationDuration = useMemo(() => {
    return animationEnabled ? mapRange(animSpeed, 1, 100, 1200, 80) : 1;
  }, [animationEnabled, animSpeed]);

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

    const speed = mapRange(animSpeed, 1, 100, 0.35, 1.3);
    const ampX = mapRange(animScale, 1, 100, 0.00015, 0.0007);
    const ampY = mapRange(animScale, 1, 100, 0.00035, 0.0011);

    const baseX = mapRange(animScale, 0, 100, 0.0012, 0.0006);
    const baseY = mapRange(animScale, 0, 100, 0.0042, 0.0024);

    const tick = (t) => {
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
  }, [animationEnabled, animScale, animSpeed]);

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -displacementScale,
          filter: animationEnabled ? `url(#${id}) blur(6px)` : "none",
        }}
      >
        {animationEnabled && (
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
                  numOctaves="2"
                  baseFrequency="0.001 0.004"
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix
                  ref={feColorMatrixRef}
                  in="undulation"
                  type="hueRotate"
                  values="180"
                />
                <feColorMatrix
                  in="undulation"
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
        )}

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

      {noise && (noise.opacity ?? 0) > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
            backgroundSize: (noise.scale || 1) * 200,
            backgroundRepeat: "repeat",
            opacity: (noise.opacity || 0) / 2,
          }}
        />
      )}
    </div>
  );
}