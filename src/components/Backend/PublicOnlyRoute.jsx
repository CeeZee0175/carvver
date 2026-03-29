import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

export default function PublicOnlyRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        setRole(data?.role || "customer");
      }
    });
  }, []);

  // Still checking
  if (session === undefined) return null;

  // Logged in — redirect to their dashboard
  if (session) {
    if (role === "freelancer") return <Navigate to="/dashboard/freelancer" replace />;
    return <Navigate to="/dashboard/customer" replace />;
  }

  // Not logged in — show the page normally
  return children;
}