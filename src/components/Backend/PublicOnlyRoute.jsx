import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { signOut } from "../../lib/supabase/auth";
import {
  AuthGuardError,
  AuthGuardFallback,
  ExistingSessionPanel,
} from "./AuthGuardFeedback";

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
    sessionResult: null,
    profileError: null,
    signingOut: false,
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute() {
      const result = await resolveAuthenticatedProfile();
      if (!active) return;

      if (result.status === AUTH_ROUTE_STATUS.INVALID_SESSION) {
        setState({
          loading: false,
          sessionResult: null,
          profileError: result.reason === "profile" ? result : null,
          signingOut: false,
        });
        return;
      }

      setState({
        loading: false,
        sessionResult:
          result.status === AUTH_ROUTE_STATUS.SIGNED_OUT ? null : result,
        profileError: null,
        signingOut: false,
      });
    }

    resolveRoute();

    return () => {
      active = false;
    };
  }, []);

  const handleContinue = () => {
    const redirectTo = state.sessionResult
      ? getPublicRedirect(state.sessionResult)
      : "";

    if (redirectTo) navigate(redirectTo, { replace: true });
  };

  const handleSignOut = async () => {
    setState((current) => ({
      ...current,
      signingOut: true,
    }));

    await signOut().catch(() => {});

    setState({
      loading: false,
      sessionResult: null,
      profileError: null,
      signingOut: false,
    });
  };

  if (state.loading) return <AuthGuardFallback />;

  if (state.profileError) {
    return (
      <AuthGuardError
        message={getAuthRouteMessage(state.profileError)}
        onRetry={() => navigate("/sign-in", { replace: true })}
      />
    );
  }

  if (state.sessionResult) {
    return (
      <ExistingSessionPanel
        email={
          state.sessionResult.profile?.email ||
          state.sessionResult.user?.email ||
          ""
        }
        role={state.sessionResult.status}
        signingOut={state.signingOut}
        onContinue={handleContinue}
        onSignOut={handleSignOut}
      />
    );
  }

  return children;
}
