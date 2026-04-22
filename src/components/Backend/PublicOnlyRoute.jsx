import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
} from "../../lib/customerOnboarding";
import {
  AUTH_ROUTE_STATUS,
  getAuthRouteMessage,
  resolveAuthenticatedProfile,
} from "./authRouteState";
import { AuthGuardError, AuthGuardFallback } from "./AuthGuardFeedback";

function getPublicRedirect(result) {
  if (result.status === AUTH_ROUTE_STATUS.ADMIN) return "/admin";

  if (result.status === AUTH_ROUTE_STATUS.FREELANCER) {
    return isFreelancerOnboardingComplete(result.profile)
      ? "/dashboard/freelancer"
      : FREELANCER_WELCOME_PATH;
  }

  if (result.status === AUTH_ROUTE_STATUS.CUSTOMER) {
    return isCustomerOnboardingComplete(result.profile)
      ? DEFAULT_CUSTOMER_DESTINATION
      : CUSTOMER_WELCOME_PATH;
  }

  return "";
}

export default function PublicOnlyRoute({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    redirectTo: "",
    profileError: null,
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute() {
      const result = await resolveAuthenticatedProfile();
      if (!active) return;

      if (result.status === AUTH_ROUTE_STATUS.INVALID_SESSION) {
        setState({
          loading: false,
          redirectTo: "",
          profileError: result.reason === "profile" ? result : null,
        });
        return;
      }

      setState({
        loading: false,
        redirectTo: getPublicRedirect(result),
        profileError: null,
      });
    }

    resolveRoute();

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <AuthGuardFallback />;

  if (state.profileError) {
    return (
      <AuthGuardError
        message={getAuthRouteMessage(state.profileError)}
        onRetry={() => navigate("/sign-in", { replace: true })}
      />
    );
  }

  if (state.redirectTo) return <Navigate to={state.redirectTo} replace />;

  return children;
}
