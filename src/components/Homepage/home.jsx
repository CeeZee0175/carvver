import React from "react";
import "./home.css";
import HomeBackdrop from "./home_backdrop";
import HomeOne from "./home_one";
import HomeTwo from "./home_two";
import HomeThree from "./home_three";
import HomeFour from "./home_four";
import HomeFooter from "./home_footer";

export default function Home() {
  return (
    <>
      <HomeBackdrop />

      <main className="homeScroll">
        <section className="homeSnap" id="home-hero">
          <HomeOne />
        </section>

        <section className="homeSnap" id="home-categories">
          <HomeTwo />
        </section>

        <section className="homeSnap" id="home-how">
          <HomeThree />
        </section>

        <section className="homeSnap" id="home-updates">
          <HomeFour />
        </section>

        <section className="homeFooterSection" id="home-footer">
          <HomeFooter />
        </section>
      </main>
    </>
  );
}