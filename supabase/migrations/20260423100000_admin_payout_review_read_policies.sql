CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.profiles
     WHERE id = auth.uid()
       AND role = 'admin'
  );
$$;

ALTER FUNCTION "public"."is_current_user_admin"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."is_current_user_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_admin"() TO "service_role";

DROP POLICY IF EXISTS "Admins can read payout release requests" ON "public"."payout_release_requests";
CREATE POLICY "Admins can read payout release requests"
  ON "public"."payout_release_requests"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can read orders" ON "public"."orders";
CREATE POLICY "Admins can read orders"
  ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can read order updates" ON "public"."order_updates";
CREATE POLICY "Admins can read order updates"
  ON "public"."order_updates"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can read order deliveries" ON "public"."order_deliveries";
CREATE POLICY "Admins can read order deliveries"
  ON "public"."order_deliveries"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can read order delivery assets" ON "public"."order_delivery_assets";
CREATE POLICY "Admins can read order delivery assets"
  ON "public"."order_delivery_assets"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can read services" ON "public"."services";
CREATE POLICY "Admins can read services"
  ON "public"."services"
  FOR SELECT
  TO "authenticated"
  USING (public.is_current_user_admin());
