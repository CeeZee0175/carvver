import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SplashScreen from "./components/StartUp/pages/splash_screen";
import NavBar from "./components/Homepage/layout/navbar";
import Home from "./components/Homepage/pages/home";
import HomeFooter from "./components/Homepage/layout/home_footer";
import DashBar from "./components/Dashboard/layout/dashbar";
import CustomerRoute from "./components/Backend/CustomerRoute";
import CustomerWelcomeRoute from "./components/Backend/CustomerWelcomeRoute";
import FreelancerRoute from "./components/Backend/FreelancerRoute";
import FreelancerWelcomeRoute from "./components/Backend/FreelancerWelcomeRoute";
import PublicOnlyRoute from "./components/Backend/PublicOnlyRoute";
import { createClient } from "./lib/supabase/client";
import {
  isCustomerOnboardingComplete,
  resolveProfileRole,
} from "./lib/customerOnboarding";

const HomeAboutUs = lazy(() => import("./components/Homepage/pages/home_aboutUs"));
const HomeCommunity = lazy(() => import("./components/Homepage/pages/home_community"));
const PricingPageContent = lazy(() => import("./components/Homepage/pages/pricing_page"));
const AuthCallback = lazy(() => import("./components/Auth/pages/auth_callback"));
const SignIn = lazy(() => import("./components/Auth/pages/sign-in"));
const SignUp = lazy(() => import("./components/Auth/pages/sign-up"));
const CustomerWelcome = lazy(() => import("./components/Dashboard/pages/customer_welcome"));
const FreelancerWelcome = lazy(() => import("./components/Dashboard/pages/freelancer_welcome"));
const DashboardCustomer = lazy(() => import("./components/Dashboard/pages/dashboard_customer"));
const DashboardFreelancer = lazy(() => import("./components/Dashboard/pages/dashboard_freelancer"));
const DashboardAboutUs = lazy(() => import("./components/Dashboard/pages/dashboard_aboutUs"));
const BrowseCategories = lazy(() => import("./components/Dashboard/pages/browse_categories"));
const FavBook = lazy(() => import("./components/Dashboard/pages/favBook"));
const CartPage = lazy(() => import("./components/Dashboard/pages/cart_page"));
const PostRequest = lazy(() => import("./components/Dashboard/pages/post_request"));
const NotifPage = lazy(() => import("./components/Dashboard/pages/notifPage"));
const Profile = lazy(() => import("./components/Dashboard/pages/profile"));
const ProfileAchievements = lazy(() => import("./components/Dashboard/pages/profileAchievements"));
const CustomerOrders = lazy(() => import("./components/Dashboard/pages/customerOrders"));
const supabase = createClient();

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

function BrandPageShell({ children }) {
  const [shellState, setShellState] = useState({
    resolved: false,
    useDashboardShell: false,
  });

  useEffect(() => {
    let active = true;

    async function resolveShell(session) {
      if (!active) return;

      if (!session?.user) {
        setShellState({
          resolved: true,
          useDashboardShell: false,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        const role = resolveProfileRole(data, session);

        setShellState({
          resolved: true,
          useDashboardShell:
            role === "customer" && isCustomerOnboardingComplete(data),
        });
      } catch {
        if (!active) return;

        setShellState({
          resolved: true,
          useDashboardShell: false,
        });
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolveShell(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveShell(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="brandPageShell">
      {shellState.resolved ? (
        shellState.useDashboardShell ? (
          <DashBar />
        ) : (
          <NavBar />
        )
      ) : (
        <div className="brandPageShell__barPlaceholder" aria-hidden="true" />
      )}
      <div className="brandPageShell__content">{children}</div>
      <HomeFooter />
    </div>
  );
}

function AboutUsPage() {
  return (
    <BrandPageShell>
      <HomeAboutUs />
    </BrandPageShell>
  );
}

function CommunityPage() {
  return (
    <BrandPageShell>
      <HomeCommunity />
    </BrandPageShell>
  );
}

function PricingPage() {
  return (
    <BrandPageShell>
      <PricingPageContent />
    </BrandPageShell>
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
          <Suspense fallback={<RouteFallback />}>
            <AboutUsPage />
          </Suspense>
        }
      />
      <Route
        path="/community"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CommunityPage />
          </Suspense>
        }
      />
      <Route
        path="/pricing"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PricingPage />
          </Suspense>
        }
      />

      {/* Public only - redirects to dashboard if already logged in */}
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
      <Route
        path="/welcome/customer"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerWelcomeRoute>
              <CustomerWelcome />
            </CustomerWelcomeRoute>
          </Suspense>
        }
      />
      <Route
        path="/welcome/freelancer"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerWelcomeRoute>
              <FreelancerWelcome />
            </FreelancerWelcomeRoute>
          </Suspense>
        }
      />

      {/* Protected routes - redirects to /sign-in if not logged in */}
      <Route
        path="/dashboard/customer"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <DashboardCustomer />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <DashboardFreelancer />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/about-us"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <DashboardAboutUs />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/browse-services"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <BrowseCategories />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/saved"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <FavBook />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/cart"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CartPage />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/post-request"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <PostRequest />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/notifications"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <NotifPage />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/profile"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <Profile />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/profile/achievements"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <ProfileAchievements />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/orders"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerOrders />
            </CustomerRoute>
          </Suspense>
        }
      />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
