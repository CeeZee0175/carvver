import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  DEFAULT_FREELANCER_DESTINATION,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
} from "../../lib/customerOnboarding";
import {
  AUTH_ROUTE_STATUS,
  resolveAuthenticatedProfile,
} from "./authRouteState";
import { AuthGuardFallback } from "./AuthGuardFeedback";

export default function FreelancerWelcomeRoute({ children }) {
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

      setState({
        loading: false,
        redirectTo: isFreelancerOnboardingComplete(result.profile)
          ? DEFAULT_FREELANCER_DESTINATION
          : "",
      });
    }

    resolveRoute();

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <AuthGuardFallback />;
  if (state.redirectTo) return <Navigate to={state.redirectTo} replace />;

  return children;
}
