import React, { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./home.css";
import HomeBackdrop from "../layout/home_backdrop";
import HomeOne from "../sections/home_one";
import HomeTwo from "../sections/home_two";
import HomeThree from "../sections/home_three";
import HomeFour from "../sections/home_four";
import HomeFooter from "../layout/home_footer";

export default function Home() {
  const location = useLocation();
  const scrollRef = useRef(null);
  const wheelLockRef = useRef(false);
  const wheelTimerRef = useRef(null);

  const clearWheelLock = useCallback(() => {
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    }
    wheelLockRef.current = false;
  }, []);

  useEffect(() => clearWheelLock, [clearWheelLock]);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace(/^#/, "");
    if (!targetId) return;

    const timerId = window.setTimeout(() => {
      const element = document.getElementById(targetId);
      if (!element) return;

      element.scrollIntoView({
        behavior:
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "start",
      });
    }, 60);

    return () => window.clearTimeout(timerId);
  }, [location.hash]);

  const getSections = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll("[data-home-section]"));
  }, []);

  const scrollToSection = useCallback(
    (direction) => {
      const container = scrollRef.current;
      const sections = getSections();

      if (!container || !sections.length) return;

      const currentTop = container.scrollTop;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const distance = Math.abs(section.offsetTop - currentTop);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const targetIndex = Math.max(
        0,
        Math.min(sections.length - 1, nearestIndex + direction)
      );

      if (targetIndex === nearestIndex && nearestDistance < 6) {
        return;
      }

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      wheelLockRef.current = true;
      wheelTimerRef.current = setTimeout(() => {
        wheelLockRef.current = false;
        wheelTimerRef.current = null;
      }, 700);

      sections[targetIndex].scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [getSections]
  );

  const handleWheel = useCallback(
    (event) => {
      const deltaY = event.deltaY;
      const deltaX = event.deltaX;

      if (Math.abs(deltaY) < Math.abs(deltaX) || Math.abs(deltaY) < 14) {
        return;
      }

      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      scrollToSection(deltaY > 0 ? 1 : -1);
    },
    [scrollToSection]
  );

  return (
    <>
      <HomeBackdrop />

      <main className="homeScroll" ref={scrollRef} onWheel={handleWheel}>
        <section className="homeSnap" id="home-hero" data-home-section>
          <HomeOne />
        </section>

        <section className="homeSnap" id="home-categories" data-home-section>
          <HomeTwo />
        </section>

        <section className="homeSnap" id="home-how" data-home-section>
          <HomeThree />
        </section>

        <section className="homeSnap" id="home-updates" data-home-section>
          <HomeFour />
        </section>

        <section className="homeFooterSection" id="home-footer" data-home-section>
          <HomeFooter />
        </section>
      </main>
    </>
  );
}
