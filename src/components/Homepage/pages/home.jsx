import React, { useEffect } from "react";
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

  return (
    <>
      <HomeBackdrop />

      <main className="homeScroll">
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
