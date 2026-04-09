import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "../../lib/supabase/client";
import {
  DEFAULT_CUSTOMER_DESTINATION,
  FREELANCER_WELCOME_PATH,
  isCustomerOnboardingComplete,
  isFreelancerOnboardingComplete,
  resolveProfileRole,
} from "../../lib/customerOnboarding";

const supabase = createClient();

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default function CustomerWelcomeRoute({ children }) {
  const [state, setState] = useState({
    loading: true,
    redirectTo: "",
  });

  useEffect(() => {
    let active = true;

    async function resolveRoute(session) {
      if (!active) return;

      if (!session?.user) {
        setState({
          loading: false,
          redirectTo: "/sign-in",
        });
        return;
      }

      let profile = null;

      try {
        profile = await fetchProfile(session.user.id);
      } catch {
        profile = null;
      }

      if (!active) return;

      const role = resolveProfileRole(profile, session);

      if (role === "freelancer") {
        setState({
          loading: false,
          redirectTo: isFreelancerOnboardingComplete(profile)
            ? "/dashboard/freelancer"
            : FREELANCER_WELCOME_PATH,
        });
        return;
      }

      if (isCustomerOnboardingComplete(profile)) {
        setState({
          loading: false,
          redirectTo: DEFAULT_CUSTOMER_DESTINATION,
        });
        return;
      }

      setState({
        loading: false,
        redirectTo: "",
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
