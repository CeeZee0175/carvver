import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

function createBeam(width, height) {
  const angle = -35 + Math.random() * 10;
  return {
    x:          Math.random() * width * 1.5 - width * 0.25,
    y:          Math.random() * height * 1.5 - height * 0.25,
    width:      80 + Math.random() * 220,
    length:     height * 2.5,
    angle:      angle,
    speed:      0.6 + Math.random() * 1.2,
    opacity:    0.5 + Math.random() * 0.4,
    hue:        250 + Math.random() * 40,
    pulse:      Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

const opacityMap = {
  subtle: 0.7,
  medium: 0.85,
  strong: 1.0,
};

export function BeamsBackground({ className, intensity = "strong" }) {
  const canvasRef          = useRef(null);
  const beamsRef           = useRef([]);
  const animationFrameRef  = useRef(0);
  const intensityRef       = useRef(intensity);

  // Keep intensity ref in sync without re-running the effect
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const MINIMUM_BEAMS = 20;
    const TOTAL_BEAMS   = Math.round(MINIMUM_BEAMS * 1.5);

    /* ── Size canvas to viewport ── */
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w   = window.innerWidth;
      const h   = window.innerHeight;

      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      beamsRef.current = Array.from({ length: TOTAL_BEAMS }, () =>
        createBeam(w, h)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    /* ── Reset a beam that scrolled off-screen ── */
    function resetBeam(beam, index) {
      const w       = canvas.width  / (window.devicePixelRatio || 1);
      const h       = canvas.height / (window.devicePixelRatio || 1);
      const column  = index % 3;
      const spacing = w / 3;

      beam.y       = h + 100;
      beam.x       = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
      beam.width   = 80 + Math.random() * 220;
      beam.speed   = 0.5 + Math.random() * 0.4;
      beam.hue     = 250 + (index * 40) / TOTAL_BEAMS;
      beam.opacity = 0.5 + Math.random() * 0.4;
      return beam;
    }

    /* ── Draw a single beam ── */
    function drawBeam(beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        opacityMap[intensityRef.current];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      const h = beam.hue;

      gradient.addColorStop(0,   `hsla(${h}, 85%, 70%, 0)`);
      gradient.addColorStop(0.1, `hsla(${h}, 85%, 70%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.4, `hsla(${h}, 85%, 70%, ${pulsingOpacity})`);
      gradient.addColorStop(0.6, `hsla(${h}, 85%, 70%, ${pulsingOpacity})`);
      gradient.addColorStop(0.9, `hsla(${h}, 85%, 70%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1,   `hsla(${h}, 85%, 70%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    /* ── Animation loop ── */
    function animate() {
      const w = canvas.width  / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "blur(12px)";

      beamsRef.current.forEach((beam, index) => {
        beam.y     -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          resetBeam(beam, index);
        }

        drawBeam(beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // runs once — intensity is read via ref

  return (
    <div className={`beamsBackground__wrap${className ? ` ${className}` : ""}`}>
      <canvas
        ref={canvasRef}
        className="beamsBackground__canvas"
      />

      <motion.div
        className="beamsBackground__pulse"
        animate={{ opacity: [0.08, 0.25, 0.08] }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
}

export default BeamsBackground;