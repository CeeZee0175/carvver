import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
  setFreelancerWelcomeDestination,
} from "../../lib/customerOnboarding";
import {
  AUTH_ROUTE_STATUS,
  resolveAuthenticatedProfile,
} from "./authRouteState";
import { AuthGuardFallback } from "./AuthGuardFeedback";

export default function FreelancerRoute({ children }) {
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    redirectTo: "",
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute() {
      const result = await resolveAuthenticatedProfile();
      if (!active) return;

      if (
        result.status === AUTH_ROUTE_STATUS.SIGNED_OUT ||
        result.status === AUTH_ROUTE_STATUS.INVALID_SESSION
      ) {
        setState({ loading: false, redirectTo: "/sign-in" });
        return;
      }

      if (result.status === AUTH_ROUTE_STATUS.ADMIN) {
        setState({ loading: false, redirectTo: "/admin" });
        return;
      }

      if (result.status !== AUTH_ROUTE_STATUS.FREELANCER) {
        setState({
          loading: false,
          redirectTo: isCustomerOnboardingComplete(result.profile)
            ? DEFAULT_CUSTOMER_DESTINATION
            : CUSTOMER_WELCOME_PATH,
        });
        return;
      }

      if (!isFreelancerOnboardingComplete(result.profile)) {
        setFreelancerWelcomeDestination(
          `${location.pathname}${location.search}${location.hash}`
        );
        setState({ loading: false, redirectTo: FREELANCER_WELCOME_PATH });
        return;
      }

      setState({ loading: false, redirectTo: "" });
    }

    resolveRoute();

    return () => {
      active = false;
    };
  }, [location.hash, location.pathname, location.search]);

  if (state.loading) return <AuthGuardFallback />;
  if (state.redirectTo) return <Navigate to={state.redirectTo} replace />;

  return children;
}
