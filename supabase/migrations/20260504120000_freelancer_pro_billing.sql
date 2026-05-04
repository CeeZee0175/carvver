CREATE TABLE IF NOT EXISTS "public"."freelancer_plan_checkout_sessions" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "freelancer_id" "uuid" NOT NULL,
  "plan_code" "text" DEFAULT 'carvver_pro'::"text" NOT NULL,
  "status" "text" DEFAULT 'draft'::"text" NOT NULL,
  "subtotal" numeric(10,2) DEFAULT 149.00 NOT NULL,
  "currency" "text" DEFAULT 'PHP'::"text" NOT NULL,
  "paymongo_payment_intent_id" "text",
  "qr_image_url" "text",
  "qr_expires_at" timestamp with time zone,
  "payment_reference" "text",
  "paid_at" timestamp with time zone,
  "expired_at" timestamp with time zone,
  "failed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
  CONSTRAINT "freelancer_plan_checkout_sessions_currency_check" CHECK (("char_length"("btrim"("currency")) > 0)),
  CONSTRAINT "freelancer_plan_checkout_sessions_plan_check" CHECK (("plan_code" = 'carvver_pro'::"text")),
  CONSTRAINT "freelancer_plan_checkout_sessions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'paid'::"text", 'failed'::"text", 'expired'::"text", 'superseded'::"text", 'refunded'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."freelancer_plan_memberships" (
  "freelancer_id" "uuid" NOT NULL,
  "plan_code" "text" DEFAULT 'carvver_pro'::"text" NOT NULL,
  "status" "text" DEFAULT 'active'::"text" NOT NULL,
  "starts_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
  "current_period_end" timestamp with time zone NOT NULL,
  "last_checkout_session_id" "uuid",
  "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
  CONSTRAINT "freelancer_plan_memberships_plan_check" CHECK (("plan_code" = 'carvver_pro'::"text")),
  CONSTRAINT "freelancer_plan_memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'cancelled'::"text"])))
);

CREATE OR REPLACE FUNCTION "public"."set_freelancer_plan_billing_updated_at"()
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

ALTER TABLE ONLY "public"."freelancer_plan_checkout_sessions"
  ADD CONSTRAINT "freelancer_plan_checkout_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."freelancer_plan_memberships"
  ADD CONSTRAINT "freelancer_plan_memberships_pkey" PRIMARY KEY ("freelancer_id");

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_plan_checkout_sessions_intent_key"
  ON "public"."freelancer_plan_checkout_sessions" USING "btree" ("paymongo_payment_intent_id")
  WHERE ("paymongo_payment_intent_id" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "freelancer_plan_checkout_sessions_owner_idx"
  ON "public"."freelancer_plan_checkout_sessions" USING "btree" ("freelancer_id", "status", "created_at" DESC);

ALTER TABLE ONLY "public"."freelancer_plan_checkout_sessions"
  ADD CONSTRAINT "freelancer_plan_checkout_sessions_freelancer_id_fkey"
  FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."freelancer_plan_memberships"
  ADD CONSTRAINT "freelancer_plan_memberships_freelancer_id_fkey"
  FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."freelancer_plan_memberships"
  ADD CONSTRAINT "freelancer_plan_memberships_last_session_fkey"
  FOREIGN KEY ("last_checkout_session_id") REFERENCES "public"."freelancer_plan_checkout_sessions"("id") ON DELETE SET NULL;

CREATE OR REPLACE TRIGGER "freelancer_plan_checkout_sessions_set_updated_at"
  BEFORE UPDATE ON "public"."freelancer_plan_checkout_sessions"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_freelancer_plan_billing_updated_at"();

CREATE OR REPLACE TRIGGER "freelancer_plan_memberships_set_updated_at"
  BEFORE UPDATE ON "public"."freelancer_plan_memberships"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_freelancer_plan_billing_updated_at"();

ALTER TABLE "public"."freelancer_plan_checkout_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."freelancer_plan_memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "freelancer_plan_checkout_sessions_select_own"
  ON "public"."freelancer_plan_checkout_sessions"
  FOR SELECT TO "authenticated"
  USING (("auth"."uid"() = "freelancer_id"));

CREATE POLICY "freelancer_plan_memberships_select_own"
  ON "public"."freelancer_plan_memberships"
  FOR SELECT TO "authenticated"
  USING (("auth"."uid"() = "freelancer_id"));

GRANT ALL ON FUNCTION "public"."set_freelancer_plan_billing_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_freelancer_plan_billing_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_freelancer_plan_billing_updated_at"() TO "service_role";

GRANT ALL ON TABLE "public"."freelancer_plan_checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_plan_checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_plan_checkout_sessions" TO "service_role";

GRANT ALL ON TABLE "public"."freelancer_plan_memberships" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_plan_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_plan_memberships" TO "service_role";
