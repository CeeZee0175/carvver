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

export default function PublicOnlyRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const [redirectTo, setRedirectTo] = useState("");

  useEffect(() => {
    let active = true;

    async function resolveRedirect(session) {
      if (!active) return;

      setSession(session);

      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!active) return;

        const role = resolveProfileRole(data, session);

        if (role === "freelancer") {
          setRedirectTo(
            isFreelancerOnboardingComplete(data)
              ? "/dashboard/freelancer"
              : FREELANCER_WELCOME_PATH
          );
          return;
        }

        if (!isCustomerOnboardingComplete(data)) {
          setRedirectTo(CUSTOMER_WELCOME_PATH);
          return;
        }

        setRedirectTo(DEFAULT_CUSTOMER_DESTINATION);
        return;
      }

      setRedirectTo("");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveRedirect(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resolveRedirect(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) return null;

  if (session) {
    return <Navigate to={redirectTo || DEFAULT_CUSTOMER_DESTINATION} replace />;
  }

  return children;
}
