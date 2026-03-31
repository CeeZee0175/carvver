import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SplashScreen from "./components/StartUp/splash_screen";
import NavBar from "./components/Homepage/navbar";
import Home from "./components/Homepage/home";
import HomeAboutUs from "./components/Homepage/home_aboutUs";
import HomeFooter from "./components/Homepage/home_footer";
import SignIn from "./components/Auth/sign-in";
import SignUp from "./components/Auth/sign-up";
import DashboardCustomer from "./components/Dashboard/dashboard_customer";
import BrowseCategories from "./components/Dashboard/browse_categories";
import ProtectedRoute from "./components/Backend/ProtectedRoute";
import PublicOnlyRoute from "./components/Backend/PublicOnlyRoute";
import FavBook from "./components/Dashboard/favBook";

function HomePage() {
  return (
    <>
      <NavBar />
      <Home />
    </>
  );
}

function AboutUsPage() {
  return (
    <>
      <NavBar />
      <HomeAboutUs />
      <HomeFooter />
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
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about-us" element={<AboutUsPage />} />

      {/* Public only — redirects to dashboard if already logged in */}
      <Route
        path="/sign-in"
        element={
          <PublicOnlyRoute>
            <SignIn />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/sign-up"
        element={
          <PublicOnlyRoute>
            <SignUp />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes — redirects to /sign-in if not logged in */}
      <Route
        path="/dashboard/customer"
        element={
          <ProtectedRoute>
            <DashboardCustomer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customer/browse-services"
        element={
          <ProtectedRoute>
            <BrowseCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customer/saved"
        element={
          <ProtectedRoute>
            <FavBook />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}