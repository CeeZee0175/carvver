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

function GuardFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(245,247,250,1) 100%)",
      }}
      aria-hidden="true"
    />
  );
}

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

        if (role === "admin") {
          setRedirectTo("/admin");
          return;
        }

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

  if (session === undefined) return <GuardFallback />;

  if (session) {
    return <Navigate to={redirectTo || DEFAULT_CUSTOMER_DESTINATION} replace />;
  }

  return children;
}
