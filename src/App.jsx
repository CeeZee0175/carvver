import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SplashScreen from "./components/StartUp/splash_screen";
import NavBar from "./components/Homepage/navbar";
import Home from "./components/Homepage/home";
import HomeFooter from "./components/Homepage/home_footer";
import ProtectedRoute from "./components/Backend/ProtectedRoute";
import PublicOnlyRoute from "./components/Backend/PublicOnlyRoute";
const HomeAboutUs = lazy(() => import("./components/Homepage/home_aboutUs"));
const AuthCallback = lazy(() => import("./components/Auth/auth_callback"));
const SignIn = lazy(() => import("./components/Auth/sign-in"));
const SignUp = lazy(() => import("./components/Auth/sign-up"));
const DashboardCustomer = lazy(() => import("./components/Dashboard/dashboard_customer"));
const BrowseCategories = lazy(() => import("./components/Dashboard/browse_categories"));
const FavBook = lazy(() => import("./components/Dashboard/favBook"));
const NotifPage = lazy(() => import("./components/Dashboard/notifPage"));

function RouteFallback({ withNav = false }) {
  return (
    <>
      {withNav && <NavBar />}
      <div
        style={{
          minHeight: withNav ? "calc(100vh - 66px)" : "100vh",
          width: "100%",
          background: "transparent",
        }}
        aria-hidden="true"
      />
    </>
  );
}

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
      <Route
        path="/about-us"
        element={
          <Suspense fallback={<RouteFallback withNav />}>
            <AboutUsPage />
          </Suspense>
        }
      />

      {/* Public only — redirects to dashboard if already logged in */}
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<RouteFallback />}>
            <AuthCallback />
          </Suspense>
        }
      />
      <Route
        path="/sign-in"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PublicOnlyRoute>
              <SignIn />
            </PublicOnlyRoute>
          </Suspense>
        }
      />
      <Route
        path="/sign-up"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PublicOnlyRoute>
              <SignUp />
            </PublicOnlyRoute>
          </Suspense>
        }
      />

      {/* Protected routes — redirects to /sign-in if not logged in */}
      <Route
        path="/dashboard/customer"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ProtectedRoute>
              <DashboardCustomer />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/browse-services"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ProtectedRoute>
              <BrowseCategories />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/saved"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ProtectedRoute>
              <FavBook />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/notifications"
        element={
          <Suspense fallback={<RouteFallback />}>
            <ProtectedRoute>
              <NotifPage />
            </ProtectedRoute>
          </Suspense>
        }
      />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
