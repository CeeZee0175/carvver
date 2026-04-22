import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
} from "../../lib/customerOnboarding";
import {
  AUTH_ROUTE_STATUS,
  resolveAuthenticatedProfile,
} from "./authRouteState";
import { AuthGuardFallback } from "./AuthGuardFeedback";

export default function AdminRoute({ children }) {
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
        setState({ loading: false, redirectTo: "" });
        return;
      }

      if (result.status === AUTH_ROUTE_STATUS.FREELANCER) {
        setState({
          loading: false,
          redirectTo: isFreelancerOnboardingComplete(result.profile)
            ? "/dashboard/freelancer"
            : FREELANCER_WELCOME_PATH,
        });
        return;
      }

      setState({
        loading: false,
        redirectTo: isCustomerOnboardingComplete(result.profile)
          ? DEFAULT_CUSTOMER_DESTINATION
          : CUSTOMER_WELCOME_PATH,
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
