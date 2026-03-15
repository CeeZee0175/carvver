import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SplashScreen from "./components/StartUp/splash_screen";
import NavBar from "./components/Homepage/navbar";
import Home from "./components/Homepage/home";
import SignIn from "./components/Auth/sign-in";
import SignUp from "./components/Auth/sign-up";
import DashboardCustomer from "./components/Dashboard/dashboard_customer";
import BrowseCategories from "./components/Dashboard/browse_categories";

function HomePage() {
  return (
    <>
      <NavBar />
      <Home />
    </>
  );
}

function AppRoutes() {
  const location = useLocation();

  const [splashDone, setSplashDone] = useState(location.pathname !== "/");
  const [showSplash, setShowSplash] = useState(location.pathname === "/" && !splashDone);

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowSplash(false);
      return;
    }

    if (!splashDone) {
      setShowSplash(true);
    }
  }, [location.pathname, splashDone]);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setSplashDone(true);
  };

  if (location.pathname === "/" && showSplash && !splashDone) {
    return <SplashScreen duration={9000} onFinish={handleSplashFinish} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/dashboard/customer" element={<DashboardCustomer />} />
      <Route path="/dashboard/customer/browse-services" element={<BrowseCategories />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}