import React from "react";
import DashBar from "./dashbar";
import HomeAboutUs from "../Homepage/home_aboutUs";
import HomeFooter from "../Homepage/home_footer";

export default function DashboardAboutUs() {
  return (
    <>
      <DashBar />
      <HomeAboutUs />
      <HomeFooter fullBleed />
    </>
  );
}
