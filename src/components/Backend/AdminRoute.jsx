import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "../../lib/supabase/client";
import {
  CUSTOMER_WELCOME_PATH,
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
  resolveProfileRole,
} from "../../lib/customerOnboarding";

const supabase = createClient();

export default function AdminRoute({ children }) {
  const [state, setState] = useState({
    loading: true,
    redirectTo: "",
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute(session) {
      if (!active) return;

      if (!session?.user) {
        setState({ loading: false, redirectTo: "/sign-in" });
        return;
      }

      let profile = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        profile = data;
      } catch {
        profile = null;
      }

      if (!active) return;

      const role = resolveProfileRole(profile, session);

      if (role === "admin") {
        setState({
          loading: false,
          redirectTo: "",
        });
        return;
      }

      if (role === "freelancer") {
        setState({
          loading: false,
          redirectTo: isFreelancerOnboardingComplete(profile)
            ? "/dashboard/freelancer"
            : FREELANCER_WELCOME_PATH,
        });
        return;
      }

      setState({
        loading: false,
        redirectTo: isCustomerOnboardingComplete(profile)
          ? DEFAULT_CUSTOMER_DESTINATION
          : CUSTOMER_WELCOME_PATH,
      });
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolveRoute(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveRoute(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (state.loading) return null;
  if (state.redirectTo) return <Navigate to={state.redirectTo} replace />;

  return children;
}
