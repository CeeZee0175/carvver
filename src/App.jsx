import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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

const SplashScreen = lazy(() => import("./components/StartUp/pages/splash_screen"));
const NavBar = lazy(() => import("./components/Homepage/layout/navbar"));
const Home = lazy(() => import("./components/Homepage/pages/home"));
const HomeFooter = lazy(() => import("./components/Homepage/layout/home_footer"));
const DashBar = lazy(() => import("./components/Dashboard/layout/dashbar"));
const HomeAboutUs = lazy(() => import("./components/Homepage/pages/home_aboutUs"));
const HomeCommunity = lazy(() => import("./components/Homepage/pages/home_community"));
const PricingPageContent = lazy(() => import("./components/Homepage/pages/pricing_page"));
const AuthCallback = lazy(() => import("./components/Auth/pages/auth_callback"));
const PasswordRecovery = lazy(() =>
  import("./components/Auth/pages/password_recovery")
);
const PasswordRecoveryVerify = lazy(() =>
  import("./components/Auth/pages/password_recovery_verify")
);
const PasswordRecoveryReset = lazy(() =>
  import("./components/Auth/pages/password_recovery_reset")
);
const SignIn = lazy(() => import("./components/Auth/pages/sign-in"));
const SignUp = lazy(() => import("./components/Auth/pages/sign-up"));
const SignUpSuccess = lazy(() => import("./components/Auth/pages/sign-up-success"));
const CustomerWelcome = lazy(() => import("./components/Dashboard/pages/customer_welcome"));
const FreelancerWelcome = lazy(() => import("./components/Dashboard/pages/freelancer_welcome"));
const DashboardCustomer = lazy(() => import("./components/Dashboard/pages/dashboard_customer"));
const DashboardFreelancer = lazy(() => import("./components/Dashboard/pages/dashboard_freelancer"));
const FreelancerBrowseRequests = lazy(() =>
  import("./components/Dashboard/pages/freelancer_browse_requests")
);
const FreelancerRequestDetail = lazy(() =>
  import("./components/Dashboard/pages/freelancer_request_detail")
);
const FreelancerPostListing = lazy(() =>
  import("./components/Dashboard/pages/freelancer_post_listing")
);
const FreelancerProfile = lazy(() => import("./components/Dashboard/pages/freelancer_profile"));
const FreelancerSettings = lazy(() => import("./components/Dashboard/pages/freelancer_settings"));
const FreelancerMessages = lazy(() => import("./components/Dashboard/pages/freelancer_messages"));
const DashboardAboutUs = lazy(() => import("./components/Dashboard/pages/dashboard_aboutUs"));
const BrowseCategories = lazy(() => import("./components/Dashboard/pages/browse_categories"));
const CustomerServiceDetail = lazy(() =>
  import("./components/Dashboard/pages/customer_service_detail")
);
const FavBook = lazy(() => import("./components/Dashboard/pages/favBook"));
const CartPage = lazy(() => import("./components/Dashboard/pages/cart_page"));
const CustomerPayment = lazy(() => import("./components/Dashboard/pages/customer_payment"));
const PostRequest = lazy(() => import("./components/Dashboard/pages/post_request"));
const NotifPage = lazy(() => import("./components/Dashboard/pages/notifPage"));
const Profile = lazy(() => import("./components/Dashboard/pages/profile"));
const CustomerSettings = lazy(() => import("./components/Dashboard/pages/customer_settings"));
const ProfileAchievements = lazy(() => import("./components/Dashboard/pages/profileAchievements"));
const CustomerOrders = lazy(() => import("./components/Dashboard/pages/customerOrders"));
const CustomerOrderDetail = lazy(() =>
  import("./components/Dashboard/pages/customer_order_detail")
);
const CustomerMessages = lazy(() =>
  import("./components/Dashboard/pages/customer_messages")
);
const CustomerRequestDetail = lazy(() =>
  import("./components/Dashboard/pages/customer_request_detail")
);
const CustomerSearch = lazy(() =>
  import("./components/Dashboard/pages/customer_search")
);
const FreelancerListings = lazy(() =>
  import("./components/Dashboard/pages/freelancer_listings")
);
const FreelancerListingPreview = lazy(() =>
  import("./components/Dashboard/pages/freelancer_listing_preview")
);
const FreelancerSearch = lazy(() =>
  import("./components/Dashboard/pages/freelancer_search")
);
const FreelancerOrders = lazy(() =>
  import("./components/Dashboard/pages/freelancer_orders")
);
const FreelancerOrderDetail = lazy(() =>
  import("./components/Dashboard/pages/freelancer_order_detail")
);
const CustomerFreelancerProfile = lazy(() =>
  import("./components/Dashboard/pages/customer_freelancer_profile")
);
const supabase = createClient();

function resolveRouteShellFamily(pathname) {
  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/sign-up/success" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/recover-password")
  ) {
    return "auth";
  }

  return "brand";
}

function useRouteShellFamily(pathname) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const shellFamily = resolveRouteShellFamily(pathname);
    document.body.dataset.shellFamily = shellFamily;
    document.documentElement.dataset.shellFamily = shellFamily;

    return () => {
      delete document.body.dataset.shellFamily;
      delete document.documentElement.dataset.shellFamily;
    };
  }, [pathname]);
}

function useCustomerBrandShell() {
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

  return shellState;
}

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "transparent",
      }}
      aria-hidden="true"
    />
  );
}

function HomePage() {
  const shellState = useCustomerBrandShell();

  return (
    <>
      {shellState.resolved ? (
        <Suspense
          fallback={<div className="brandPageShell__barPlaceholder" aria-hidden="true" />}
        >
          {shellState.useDashboardShell ? <DashBar /> : <NavBar />}
        </Suspense>
      ) : (
        <div className="brandPageShell__barPlaceholder" aria-hidden="true" />
      )}
      <Home />
    </>
  );
}

function BrandPageShell({ children }) {
  const shellState = useCustomerBrandShell();

  return (
    <div className="brandPageShell">
      {shellState.resolved ? (
        <Suspense
          fallback={<div className="brandPageShell__barPlaceholder" aria-hidden="true" />}
        >
          {shellState.useDashboardShell ? <DashBar /> : <NavBar />}
        </Suspense>
      ) : (
        <div className="brandPageShell__barPlaceholder" aria-hidden="true" />
      )}
      <div className="brandPageShell__content">{children}</div>
      <Suspense fallback={null}>
        <HomeFooter />
      </Suspense>
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
  useRouteShellFamily(location.pathname);

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
    return (
      <Suspense fallback={<RouteFallback />}>
        <SplashScreen duration={9000} onFinish={handleSplashFinish} />
      </Suspense>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <Suspense fallback={<RouteFallback />}>
            <HomePage />
          </Suspense>
        }
      />
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
        path="/recover-password"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PasswordRecovery />
          </Suspense>
        }
      />
      <Route
        path="/recover-password/verify"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PasswordRecoveryVerify />
          </Suspense>
        }
      />
      <Route
        path="/recover-password/reset"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PasswordRecoveryReset />
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
        path="/sign-up/success"
        element={
          <Suspense fallback={<RouteFallback />}>
            <SignUpSuccess />
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
        path="/dashboard/customer/search"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerSearch />
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
        path="/dashboard/freelancer/search"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerSearch />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/browse-requests"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerBrowseRequests />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/browse-requests/:requestId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerRequestDetail />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/post-listing"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerPostListing />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/listings"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerListings />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/listings/:listingId/edit"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerPostListing />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/listings/:listingId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerListingPreview />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/profile"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerProfile />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/settings"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerSettings />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/messages"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerMessages />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/orders"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerOrders />
            </FreelancerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/freelancer/orders/:orderId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <FreelancerRoute>
              <FreelancerOrderDetail />
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
        path="/dashboard/customer/browse-services/:serviceId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerServiceDetail />
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
        path="/dashboard/customer/payment"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerPayment />
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
        path="/dashboard/customer/requests/:requestId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerRequestDetail />
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
        path="/dashboard/customer/settings"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerSettings />
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
      <Route
        path="/dashboard/customer/orders/:orderId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerOrderDetail />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/messages"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerMessages />
            </CustomerRoute>
          </Suspense>
        }
      />
      <Route
        path="/dashboard/customer/freelancers/:freelancerId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <CustomerRoute>
              <CustomerFreelancerProfile />
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
