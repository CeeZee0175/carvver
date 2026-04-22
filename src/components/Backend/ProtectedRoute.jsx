import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AUTH_ROUTE_STATUS,
  resolveAuthenticatedProfile,
} from "./authRouteState";
import { AuthGuardFallback } from "./AuthGuardFeedback";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({
    loading: true,
    redirectTo: "",
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute() {
      const result = await resolveAuthenticatedProfile();
      if (!active) return;

      setState({
        loading: false,
        redirectTo:
          result.status === AUTH_ROUTE_STATUS.SIGNED_OUT ||
          result.status === AUTH_ROUTE_STATUS.INVALID_SESSION
            ? "/sign-in"
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
