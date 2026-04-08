import React from "react";
import DashBar from "../layout/dashbar";
import HomeAboutUs from "../../Homepage/pages/home_aboutUs";
import HomeFooter from "../../Homepage/layout/home_footer";

export default function DashboardAboutUs() {
  return (
    <>
      <DashBar />
      <HomeAboutUs />
      <HomeFooter fullBleed />
    </>
  );
}
