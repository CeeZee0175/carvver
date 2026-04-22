


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cleanup_expired_customer_freelancer_threads"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
      declare
        deleted_count integer := 0;
      begin
        delete from public.customer_freelancer_threads
        where coalesce(last_message_at, created_at) < timezone('utc'::text, now()) - interval '30 days';

        get diagnostics deleted_count = row_count;
        return deleted_count;
      end;
      $$;


ALTER FUNCTION "public"."cleanup_expired_customer_freelancer_threads"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first_name text;
  v_last_name text;
  v_role text;
begin
  v_first_name := nullif(trim(coalesce(meta->>'first_name', '')), '');
  v_last_name := nullif(trim(coalesce(meta->>'last_name', '')), '');
  v_role := nullif(trim(coalesce(meta->>'role', '')), '');

  if v_first_name is null then
    v_first_name := 'New';
  end if;

  if v_last_name is null then
    v_last_name := 'User';
  end if;

  if v_role is null or v_role not in ('customer', 'freelancer', 'admin') then
    v_role := 'customer';
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    role
  )
  values (
    new.id,
    v_first_name,
    v_last_name,
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  normalized_email text := lower(trim(target_email));
  normalized_username text := lower(trim(target_admin_username));
  v_promoted_user_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Target email is required.';
  end if;

  if normalized_username = '' then
    raise exception 'Admin username is required.';
  end if;

  select u.id
    into v_promoted_user_id
  from auth.users u
  where lower(coalesce(u.email, '')) = normalized_email
  limit 1;

  if v_promoted_user_id is null then
    raise exception 'No authenticated user matches %.', target_email;
  end if;

  update public.profiles
  set
    role = 'admin',
    admin_username = normalized_username
  where id = v_promoted_user_id;

  if not found then
    raise exception 'Profile row was not found for %.', target_email;
  end if;

  return v_promoted_user_id;
end;
$$;


ALTER FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_billing_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = timezone('utc'::text, now());
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_customer_billing_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_freelancer_threads_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = timezone('utc'::text, now());
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_customer_freelancer_threads_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_request_proposals_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = timezone('utc'::text, now());
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_customer_request_proposals_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = timezone('utc', now());
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_customer_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_freelancer_payout_methods_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        new.updated_at = timezone('utc'::text, now());
        return new;
      end;
      $$;


ALTER FUNCTION "public"."set_freelancer_payout_methods_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_customer_freelancer_thread"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
      begin
        update public.customer_freelancer_threads
        set
          updated_at = timezone('utc'::text, now()),
          last_message_at = coalesce(new.created_at, timezone('utc'::text, now()))
        where id = new.thread_id;

        return new;
      end;
      $$;


ALTER FUNCTION "public"."touch_customer_freelancer_thread"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "selected_package_id" "uuid",
    "selected_package_name" "text",
    "selected_package_summary" "text",
    "selected_package_price" numeric(10,2),
    "selected_package_delivery_time_days" integer,
    "selected_package_revisions" integer,
    "selected_package_included_items" "text"[]
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_achievement_unlocks" (
    "user_id" "uuid" NOT NULL,
    "achievement_id" "text" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."customer_achievement_unlocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_badge_showcase" (
    "user_id" "uuid" NOT NULL,
    "achievement_id" "text" NOT NULL,
    "slot" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "customer_badge_showcase_slot_check" CHECK ((("slot" >= 1) AND ("slot" <= 9)))
);


ALTER TABLE "public"."customer_badge_showcase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_billing_profiles" (
    "customer_id" "uuid" NOT NULL,
    "billing_name" "text",
    "billing_email" "text",
    "billing_address" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "preferred_payment_method" "text",
    "wallet_provider" "text",
    "wallet_phone_number" "text",
    "paymongo_customer_id" "text",
    "default_card_payment_method_id" "text",
    "default_card_brand" "text",
    "default_card_last4" "text",
    "default_card_exp_month" integer,
    "default_card_exp_year" integer
);


ALTER TABLE "public"."customer_billing_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_checkout_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checkout_session_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "unit_price" numeric(10,2) NOT NULL,
    "platform_fee" numeric(10,2) NOT NULL,
    "freelancer_net" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "selected_package_id" "uuid",
    "selected_package_name" "text",
    "selected_package_summary" "text",
    "selected_package_delivery_time_days" integer,
    "selected_package_revisions" integer,
    "selected_package_included_items" "text"[],
    "fulfillment_type" "text" DEFAULT 'digital'::"text" NOT NULL,
    CONSTRAINT "customer_checkout_items_fulfillment_type_check" CHECK (("fulfillment_type" = ANY (ARRAY['digital'::"text", 'physical'::"text"])))
);


ALTER TABLE "public"."customer_checkout_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_checkout_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "paymongo_checkout_id" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'PHP'::"text" NOT NULL,
    "checkout_url" "text",
    "redirect_success_url" "text",
    "redirect_cancel_url" "text",
    "payment_reference" "text",
    "paid_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "expired_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "paymongo_payment_intent_id" "text",
    "local_payment_method" "text" DEFAULT 'qrph'::"text" NOT NULL,
    "cart_snapshot_hash" "text",
    "qr_image_url" "text",
    "qr_expires_at" timestamp with time zone,
    CONSTRAINT "customer_checkout_sessions_method_check" CHECK (("local_payment_method" = ANY (ARRAY['qrph'::"text", 'card'::"text"]))),
    CONSTRAINT "customer_checkout_sessions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'paid'::"text", 'failed'::"text", 'expired'::"text", 'cancelled'::"text", 'superseded'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."customer_checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_favorite_freelancers" (
    "customer_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."customer_favorite_freelancers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_freelancer_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "customer_freelancer_messages_body_check" CHECK (("char_length"("btrim"("body")) > 0)),
    CONSTRAINT "customer_freelancer_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'proposal'::"text", 'order_update'::"text"]))),
    CONSTRAINT "customer_freelancer_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['customer'::"text", 'freelancer'::"text"])))
);


ALTER TABLE "public"."customer_freelancer_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_freelancer_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_message_at" timestamp with time zone,
    CONSTRAINT "customer_freelancer_threads_distinct_users_check" CHECK (("customer_id" <> "freelancer_id"))
);


ALTER TABLE "public"."customer_freelancer_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_request_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "bucket_path" "text" NOT NULL,
    "media_kind" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "sort_order" smallint DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "customer_request_media_media_kind_check" CHECK (("media_kind" = ANY (ARRAY['image'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."customer_request_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_request_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "pitch" "text" NOT NULL,
    "offered_price" numeric(10,2) NOT NULL,
    "delivery_days" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "customer_request_proposals_delivery_days_check" CHECK (("delivery_days" > 0)),
    CONSTRAINT "customer_request_proposals_pitch_check" CHECK (("char_length"("btrim"("pitch")) > 0)),
    CONSTRAINT "customer_request_proposals_price_check" CHECK (("offered_price" > (0)::numeric)),
    CONSTRAINT "customer_request_proposals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."customer_request_proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "budget_amount" numeric(10,2),
    "location" "text",
    "timeline" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "customer_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text", 'matched'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."customer_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."freelancer_payout_methods" (
    "freelancer_id" "uuid" NOT NULL,
    "payout_method" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "account_reference" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "freelancer_payout_methods_account_name_check" CHECK (("char_length"("btrim"("account_name")) > 0)),
    CONSTRAINT "freelancer_payout_methods_account_reference_check" CHECK (("char_length"("btrim"("account_reference")) > 0)),
    CONSTRAINT "freelancer_payout_methods_payout_method_check" CHECK (("char_length"("btrim"("payout_method")) > 0))
);


ALTER TABLE "public"."freelancer_payout_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_signups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'home_four'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "newsletter_signups_email_format_check" CHECK (("email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::"text"))
);


ALTER TABLE "public"."newsletter_signups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_reads" (
    "user_id" "uuid" NOT NULL,
    "notification_id" "text" NOT NULL,
    "is_read" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notification_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "fulfillment_type" "text" NOT NULL,
    "delivery_note" "text" NOT NULL,
    "deliverable_label" "text",
    "deliverable_url" "text",
    "access_code" "text",
    "courier_name" "text",
    "tracking_reference" "text",
    "shipment_note" "text",
    "proof_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "order_deliveries_delivery_note_check" CHECK (("char_length"("btrim"("delivery_note")) > 0)),
    CONSTRAINT "order_deliveries_fulfillment_type_check" CHECK (("fulfillment_type" = ANY (ARRAY['digital'::"text", 'physical'::"text"])))
);


ALTER TABLE "public"."order_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_delivery_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "bucket_path" "text" NOT NULL,
    "asset_kind" "text" NOT NULL,
    "mime_type" "text",
    "original_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "order_delivery_assets_asset_kind_check" CHECK (("asset_kind" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text"]))),
    CONSTRAINT "order_delivery_assets_bucket_path_check" CHECK (("char_length"("btrim"("bucket_path")) > 0))
);


ALTER TABLE "public"."order_delivery_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_role" "text" NOT NULL,
    "update_kind" "text" DEFAULT 'progress'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "order_updates_author_role_check" CHECK (("author_role" = ANY (ARRAY['customer'::"text", 'freelancer'::"text"]))),
    CONSTRAINT "order_updates_body_check" CHECK (("char_length"("btrim"("body")) > 0)),
    CONSTRAINT "order_updates_title_check" CHECK (("char_length"("btrim"("title")) > 0))
);


ALTER TABLE "public"."order_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid",
    "customer_id" "uuid",
    "freelancer_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "checkout_session_id" "uuid",
    "gross_amount" numeric(10,2),
    "platform_fee" numeric(10,2),
    "freelancer_net" numeric(10,2),
    "payment_provider" "text",
    "payment_reference" "text",
    "escrow_status" "text",
    "paid_at" timestamp with time zone,
    "selected_package_id" "uuid",
    "selected_package_name" "text",
    "selected_package_summary" "text",
    "selected_package_delivery_time_days" integer,
    "selected_package_revisions" integer,
    "selected_package_included_items" "text"[],
    "completed_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "fulfillment_type" "text" DEFAULT 'digital'::"text" NOT NULL,
    CONSTRAINT "orders_escrow_status_check" CHECK (("escrow_status" = ANY (ARRAY['held'::"text", 'pending_release'::"text", 'released'::"text", 'blocked'::"text", 'refunded'::"text", 'failed'::"text"]))),
    CONSTRAINT "orders_fulfillment_type_check" CHECK (("fulfillment_type" = ANY (ARRAY['digital'::"text", 'physical'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text", 'disputed'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_release_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'PHP'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "destination_method" "text",
    "destination_account_name" "text",
    "destination_account_reference" "text",
    "provider_reference" "text",
    "ops_note" "text",
    "requested_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "processed_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "processed_by_admin_id" "uuid",
    "freelancer_receipt_path" "text",
    "customer_receipt_path" "text",
    CONSTRAINT "payout_release_requests_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "payout_release_requests_currency_check" CHECK (("char_length"("btrim"("currency")) > 0)),
    CONSTRAINT "payout_release_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'blocked'::"text", 'released'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payout_release_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "avatar_url" "text",
    "country" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_name" "text",
    "address" "text",
    "age" integer,
    "customer_onboarding_completed_at" timestamp with time zone,
    "region" "text",
    "city" "text",
    "barangay" "text",
    "freelancer_onboarding_completed_at" timestamp with time zone,
    "freelancer_headline" "text",
    "freelancer_primary_category" "text",
    "freelancer_specialties" "text"[],
    "freelancer_experience_level" "text",
    "freelancer_portfolio_url" "text",
    "admin_username" "text",
    CONSTRAINT "profiles_admin_username_role_check" CHECK ((("admin_username" IS NULL) OR ("role" = 'admin'::"text"))),
    CONSTRAINT "profiles_age_check" CHECK ((("age" IS NULL) OR ("age" > 0))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'freelancer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "reviewer_id" "uuid",
    "reviewee_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "bucket_path" "text" NOT NULL,
    "media_kind" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "sort_order" smallint DEFAULT 1 NOT NULL,
    "is_cover" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "service_media_kind_check" CHECK (("media_kind" = ANY (ARRAY['image'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."service_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "sort_order" smallint DEFAULT 1 NOT NULL,
    "package_name" "text" NOT NULL,
    "package_summary" "text",
    "price" numeric(10,2) NOT NULL,
    "delivery_time_days" integer,
    "revisions" integer,
    "included_items" "text"[],
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."service_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "location" "text",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_verified" boolean DEFAULT false,
    "is_pro" boolean DEFAULT false,
    "listing_overview" "text",
    "listing_highlights" "text"[],
    "delivery_time_days" integer,
    "revisions" integer,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "fulfillment_type" "text" DEFAULT 'digital'::"text" NOT NULL,
    CONSTRAINT "services_fulfillment_type_check" CHECK (("fulfillment_type" = ANY (ARRAY['digital'::"text", 'physical'::"text"])))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


COMMENT ON COLUMN "public"."services"."is_verified" IS 'True if the freelancer has passed identity/platform verification';



CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_group" "text" DEFAULT 'system'::"text" NOT NULL,
    "label" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "path" "text",
    "cta_label" "text" DEFAULT 'Open'::"text" NOT NULL,
    "accent" "text",
    "accent_soft" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_notifications_group_check" CHECK (("notification_group" = ANY (ARRAY['activity'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_service_key" UNIQUE ("user_id", "service_id");



ALTER TABLE ONLY "public"."customer_achievement_unlocks"
    ADD CONSTRAINT "customer_achievement_unlocks_pkey" PRIMARY KEY ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."customer_badge_showcase"
    ADD CONSTRAINT "customer_badge_showcase_pkey" PRIMARY KEY ("user_id", "slot");



ALTER TABLE ONLY "public"."customer_badge_showcase"
    ADD CONSTRAINT "customer_badge_showcase_user_achievement_key" UNIQUE ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."customer_billing_profiles"
    ADD CONSTRAINT "customer_billing_profiles_pkey" PRIMARY KEY ("customer_id");



ALTER TABLE ONLY "public"."customer_checkout_items"
    ADD CONSTRAINT "customer_checkout_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_checkout_items"
    ADD CONSTRAINT "customer_checkout_items_session_service_key" UNIQUE ("checkout_session_id", "service_id");



ALTER TABLE ONLY "public"."customer_checkout_sessions"
    ADD CONSTRAINT "customer_checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_favorite_freelancers"
    ADD CONSTRAINT "customer_favorite_freelancers_pkey" PRIMARY KEY ("customer_id", "freelancer_id");



ALTER TABLE ONLY "public"."customer_freelancer_messages"
    ADD CONSTRAINT "customer_freelancer_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_freelancer_threads"
    ADD CONSTRAINT "customer_freelancer_threads_customer_freelancer_key" UNIQUE ("customer_id", "freelancer_id");



ALTER TABLE ONLY "public"."customer_freelancer_threads"
    ADD CONSTRAINT "customer_freelancer_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_request_media"
    ADD CONSTRAINT "customer_request_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_request_proposals"
    ADD CONSTRAINT "customer_request_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_requests"
    ADD CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."freelancer_payout_methods"
    ADD CONSTRAINT "freelancer_payout_methods_pkey" PRIMARY KEY ("freelancer_id");



ALTER TABLE ONLY "public"."newsletter_signups"
    ADD CONSTRAINT "newsletter_signups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_reads"
    ADD CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("user_id", "notification_id");



ALTER TABLE ONLY "public"."order_deliveries"
    ADD CONSTRAINT "order_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_delivery_assets"
    ADD CONSTRAINT "order_delivery_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_updates"
    ADD CONSTRAINT "order_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_checkout_service_customer_unique" UNIQUE ("checkout_session_id", "service_id", "customer_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_services"
    ADD CONSTRAINT "saved_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_services"
    ADD CONSTRAINT "saved_services_user_id_service_id_key" UNIQUE ("user_id", "service_id");



ALTER TABLE ONLY "public"."service_media"
    ADD CONSTRAINT "service_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_service_sort_key" UNIQUE ("service_id", "sort_order");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



CREATE INDEX "cart_items_user_created_at_idx" ON "public"."cart_items" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "customer_billing_profiles_updated_at_idx" ON "public"."customer_billing_profiles" USING "btree" ("updated_at" DESC);



CREATE INDEX "customer_checkout_items_session_idx" ON "public"."customer_checkout_items" USING "btree" ("checkout_session_id");



CREATE UNIQUE INDEX "customer_checkout_sessions_payment_intent_id_key" ON "public"."customer_checkout_sessions" USING "btree" ("paymongo_payment_intent_id") WHERE ("paymongo_payment_intent_id" IS NOT NULL);



CREATE UNIQUE INDEX "customer_checkout_sessions_paymongo_checkout_id_key" ON "public"."customer_checkout_sessions" USING "btree" ("paymongo_checkout_id") WHERE ("paymongo_checkout_id" IS NOT NULL);



CREATE INDEX "customer_checkout_sessions_snapshot_idx" ON "public"."customer_checkout_sessions" USING "btree" ("user_id", "cart_snapshot_hash", "local_payment_method", "created_at" DESC);



CREATE INDEX "customer_checkout_sessions_user_created_at_idx" ON "public"."customer_checkout_sessions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "customer_checkout_sessions_user_status_idx" ON "public"."customer_checkout_sessions" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "customer_favorite_freelancers_created_idx" ON "public"."customer_favorite_freelancers" USING "btree" ("customer_id", "created_at" DESC);



CREATE INDEX "customer_freelancer_messages_thread_created_desc_idx" ON "public"."customer_freelancer_messages" USING "btree" ("thread_id", "created_at" DESC);



CREATE INDEX "customer_freelancer_messages_thread_created_idx" ON "public"."customer_freelancer_messages" USING "btree" ("thread_id", "created_at");



CREATE INDEX "customer_freelancer_threads_customer_last_message_idx" ON "public"."customer_freelancer_threads" USING "btree" ("customer_id", "last_message_at" DESC);



CREATE INDEX "customer_freelancer_threads_freelancer_last_message_idx" ON "public"."customer_freelancer_threads" USING "btree" ("freelancer_id", "last_message_at" DESC);



CREATE INDEX "customer_request_media_customer_idx" ON "public"."customer_request_media" USING "btree" ("customer_id", "created_at" DESC);



CREATE INDEX "customer_request_media_request_idx" ON "public"."customer_request_media" USING "btree" ("request_id", "sort_order");



CREATE INDEX "customer_request_proposals_freelancer_created_idx" ON "public"."customer_request_proposals" USING "btree" ("freelancer_id", "created_at" DESC);



CREATE INDEX "customer_request_proposals_request_created_idx" ON "public"."customer_request_proposals" USING "btree" ("request_id", "created_at" DESC);



CREATE UNIQUE INDEX "customer_request_proposals_request_freelancer_key" ON "public"."customer_request_proposals" USING "btree" ("request_id", "freelancer_id");



CREATE INDEX "customer_requests_customer_id_idx" ON "public"."customer_requests" USING "btree" ("customer_id", "created_at" DESC);



CREATE INDEX "customer_requests_status_idx" ON "public"."customer_requests" USING "btree" ("status", "created_at" DESC);



CREATE UNIQUE INDEX "newsletter_signups_email_lower_key" ON "public"."newsletter_signups" USING "btree" ("lower"("email"));



CREATE INDEX "order_deliveries_order_created_idx" ON "public"."order_deliveries" USING "btree" ("order_id", "created_at");



CREATE INDEX "order_delivery_assets_delivery_created_idx" ON "public"."order_delivery_assets" USING "btree" ("delivery_id", "created_at");



CREATE INDEX "order_delivery_assets_order_created_idx" ON "public"."order_delivery_assets" USING "btree" ("order_id", "created_at");



CREATE INDEX "order_updates_order_created_idx" ON "public"."order_updates" USING "btree" ("order_id", "created_at");



CREATE UNIQUE INDEX "orders_checkout_service_customer_key" ON "public"."orders" USING "btree" ("checkout_session_id", "service_id", "customer_id") WHERE ("checkout_session_id" IS NOT NULL);



CREATE INDEX "payout_release_requests_status_idx" ON "public"."payout_release_requests" USING "btree" ("status", "requested_at" DESC);



CREATE UNIQUE INDEX "profiles_admin_username_lower_key" ON "public"."profiles" USING "btree" ("lower"("admin_username")) WHERE ("admin_username" IS NOT NULL);



CREATE INDEX "service_media_freelancer_idx" ON "public"."service_media" USING "btree" ("freelancer_id", "created_at" DESC);



CREATE INDEX "service_media_service_idx" ON "public"."service_media" USING "btree" ("service_id", "sort_order");



CREATE INDEX "service_packages_service_idx" ON "public"."service_packages" USING "btree" ("service_id", "sort_order");



CREATE INDEX "user_notifications_user_created_idx" ON "public"."user_notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "customer_billing_profiles_set_updated_at" BEFORE UPDATE ON "public"."customer_billing_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_billing_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "customer_freelancer_messages_touch_thread" AFTER INSERT ON "public"."customer_freelancer_messages" FOR EACH ROW EXECUTE FUNCTION "public"."touch_customer_freelancer_thread"();



CREATE OR REPLACE TRIGGER "customer_freelancer_threads_set_updated_at" BEFORE UPDATE ON "public"."customer_freelancer_threads" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_freelancer_threads_updated_at"();



CREATE OR REPLACE TRIGGER "customer_request_proposals_set_updated_at" BEFORE UPDATE ON "public"."customer_request_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_request_proposals_updated_at"();



CREATE OR REPLACE TRIGGER "customer_requests_set_updated_at" BEFORE UPDATE ON "public"."customer_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_requests_updated_at"();



CREATE OR REPLACE TRIGGER "freelancer_payout_methods_set_updated_at" BEFORE UPDATE ON "public"."freelancer_payout_methods" FOR EACH ROW EXECUTE FUNCTION "public"."set_freelancer_payout_methods_updated_at"();



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_achievement_unlocks"
    ADD CONSTRAINT "customer_achievement_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_badge_showcase"
    ADD CONSTRAINT "customer_badge_showcase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_billing_profiles"
    ADD CONSTRAINT "customer_billing_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_checkout_items"
    ADD CONSTRAINT "customer_checkout_items_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."customer_checkout_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_checkout_items"
    ADD CONSTRAINT "customer_checkout_items_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customer_checkout_items"
    ADD CONSTRAINT "customer_checkout_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customer_checkout_sessions"
    ADD CONSTRAINT "customer_checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_favorite_freelancers"
    ADD CONSTRAINT "customer_favorite_freelancers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_favorite_freelancers"
    ADD CONSTRAINT "customer_favorite_freelancers_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_freelancer_messages"
    ADD CONSTRAINT "customer_freelancer_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_freelancer_messages"
    ADD CONSTRAINT "customer_freelancer_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_freelancer_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_freelancer_threads"
    ADD CONSTRAINT "customer_freelancer_threads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_freelancer_threads"
    ADD CONSTRAINT "customer_freelancer_threads_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_request_media"
    ADD CONSTRAINT "customer_request_media_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_request_media"
    ADD CONSTRAINT "customer_request_media_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."customer_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_request_proposals"
    ADD CONSTRAINT "customer_request_proposals_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_request_proposals"
    ADD CONSTRAINT "customer_request_proposals_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."customer_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_request_proposals"
    ADD CONSTRAINT "customer_request_proposals_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_freelancer_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_requests"
    ADD CONSTRAINT "customer_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."freelancer_payout_methods"
    ADD CONSTRAINT "freelancer_payout_methods_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_reads"
    ADD CONSTRAINT "notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_deliveries"
    ADD CONSTRAINT "order_deliveries_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_deliveries"
    ADD CONSTRAINT "order_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_delivery_assets"
    ADD CONSTRAINT "order_delivery_assets_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."order_deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_delivery_assets"
    ADD CONSTRAINT "order_delivery_assets_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_delivery_assets"
    ADD CONSTRAINT "order_delivery_assets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_updates"
    ADD CONSTRAINT "order_updates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_updates"
    ADD CONSTRAINT "order_updates_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."customer_checkout_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_release_requests"
    ADD CONSTRAINT "payout_release_requests_processed_by_admin_id_fkey" FOREIGN KEY ("processed_by_admin_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_services"
    ADD CONSTRAINT "saved_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_services"
    ADD CONSTRAINT "saved_services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_media"
    ADD CONSTRAINT "service_media_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_media"
    ADD CONSTRAINT "service_media_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_packages"
    ADD CONSTRAINT "service_packages_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Customers can create orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can create their own requests" ON "public"."customer_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can delete their own favorite freelancers" ON "public"."customer_favorite_freelancers" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can delete their own open requests" ON "public"."customer_requests" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "customer_id") AND ("status" = 'open'::"text")));



CREATE POLICY "Customers can delete their own request media" ON "public"."customer_request_media" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can delete their own requests" ON "public"."customer_requests" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can insert their billing profile" ON "public"."customer_billing_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can insert their own favorite freelancers" ON "public"."customer_favorite_freelancers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can insert their own request media" ON "public"."customer_request_media" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can manage their own request media" ON "public"."customer_request_media" TO "authenticated" USING (("auth"."uid"() = "customer_id")) WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can read their billing profile" ON "public"."customer_billing_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can read their own requests" ON "public"."customer_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can update their billing profile" ON "public"."customer_billing_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "customer_id")) WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can update their own open requests" ON "public"."customer_requests" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "customer_id") AND ("status" = 'open'::"text"))) WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can update their own requests" ON "public"."customer_requests" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "customer_id")) WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can view their own favorite freelancers" ON "public"."customer_favorite_freelancers" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can view their own request media" ON "public"."customer_request_media" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Freelancers can insert their payout details" ON "public"."freelancer_payout_methods" FOR INSERT TO "authenticated" WITH CHECK (("freelancer_id" = "auth"."uid"()));



CREATE POLICY "Freelancers can manage their own services" ON "public"."services" USING (("auth"."uid"() = "freelancer_id"));



CREATE POLICY "Freelancers can manage their service media" ON "public"."service_media" TO "authenticated" USING (("auth"."uid"() = "freelancer_id")) WITH CHECK (("auth"."uid"() = "freelancer_id"));



CREATE POLICY "Freelancers can manage their service packages" ON "public"."service_packages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."services" "s"
  WHERE (("s"."id" = "service_packages"."service_id") AND ("s"."freelancer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."services" "s"
  WHERE (("s"."id" = "service_packages"."service_id") AND ("s"."freelancer_id" = "auth"."uid"())))));



CREATE POLICY "Freelancers can read media for open requests" ON "public"."customer_request_media" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."customer_requests" "r"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("r"."id" = "customer_request_media"."request_id") AND ("r"."status" = 'open'::"text") AND ("p"."role" = 'freelancer'::"text")))));



CREATE POLICY "Freelancers can read open customer requests" ON "public"."customer_requests" FOR SELECT TO "authenticated" USING ((("status" = 'open'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'freelancer'::"text"))))));



CREATE POLICY "Freelancers can read their payout details" ON "public"."freelancer_payout_methods" FOR SELECT TO "authenticated" USING (("freelancer_id" = "auth"."uid"()));



CREATE POLICY "Freelancers can send proposals" ON "public"."customer_request_proposals" FOR INSERT TO "authenticated" WITH CHECK ((("freelancer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."customer_requests" "requests"
  WHERE (("requests"."id" = "customer_request_proposals"."request_id") AND ("requests"."status" = ANY (ARRAY['open'::"text", 'matched'::"text"])))))));



CREATE POLICY "Freelancers can update their payout details" ON "public"."freelancer_payout_methods" FOR UPDATE TO "authenticated" USING (("freelancer_id" = "auth"."uid"())) WITH CHECK (("freelancer_id" = "auth"."uid"()));



CREATE POLICY "Order participants can insert updates" ON "public"."order_updates" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_updates"."order_id") AND ((("order_updates"."author_role" = 'customer'::"text") AND ("orders"."customer_id" = "auth"."uid"())) OR (("order_updates"."author_role" = 'freelancer'::"text") AND ("orders"."freelancer_id" = "auth"."uid"()))))))));



CREATE POLICY "Order participants can read updates" ON "public"."order_updates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_updates"."order_id") AND (("orders"."customer_id" = "auth"."uid"()) OR ("orders"."freelancer_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can create threads" ON "public"."customer_freelancer_threads" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "freelancer_id")) AND ("customer_id" <> "freelancer_id")));



CREATE POLICY "Participants can read their messages" ON "public"."customer_freelancer_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customer_freelancer_threads" "t"
  WHERE (("t"."id" = "customer_freelancer_messages"."thread_id") AND (("auth"."uid"() = "t"."customer_id") OR ("auth"."uid"() = "t"."freelancer_id"))))));



CREATE POLICY "Participants can read their threads" ON "public"."customer_freelancer_threads" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "freelancer_id")));



CREATE POLICY "Participants can send messages" ON "public"."customer_freelancer_messages" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."customer_freelancer_threads" "t"
  WHERE (("t"."id" = "customer_freelancer_messages"."thread_id") AND ((("auth"."uid"() = "t"."customer_id") AND ("customer_freelancer_messages"."sender_role" = 'customer'::"text")) OR (("auth"."uid"() = "t"."freelancer_id") AND ("customer_freelancer_messages"."sender_role" = 'freelancer'::"text"))))))));



CREATE POLICY "Participants can update proposal state" ON "public"."customer_request_proposals" FOR UPDATE TO "authenticated" USING ((("freelancer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."customer_requests" "requests"
  WHERE (("requests"."id" = "customer_request_proposals"."request_id") AND ("requests"."customer_id" = "auth"."uid"())))))) WITH CHECK ((("freelancer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."customer_requests" "requests"
  WHERE (("requests"."id" = "customer_request_proposals"."request_id") AND ("requests"."customer_id" = "auth"."uid"()))))));



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published service media is readable" ON "public"."service_media" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."services" "s"
  WHERE (("s"."id" = "service_media"."service_id") AND ("s"."is_published" = true)))));



CREATE POLICY "Published service packages are readable" ON "public"."service_packages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."services" "s"
  WHERE (("s"."id" = "service_packages"."service_id") AND ("s"."is_published" = true)))));



CREATE POLICY "Published services are viewable by everyone" ON "public"."services" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Request participants can read proposals" ON "public"."customer_request_proposals" FOR SELECT TO "authenticated" USING ((("freelancer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."customer_requests" "requests"
  WHERE (("requests"."id" = "customer_request_proposals"."request_id") AND ("requests"."customer_id" = "auth"."uid"()))))));



CREATE POLICY "Reviews are viewable by everyone" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Users can manage their own saved services" ON "public"."saved_services" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "freelancer_id")));



CREATE POLICY "Users can write their own reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cart_items_delete_own" ON "public"."cart_items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "cart_items_insert_own" ON "public"."cart_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "cart_items_select_own" ON "public"."cart_items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."customer_achievement_unlocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_achievement_unlocks_insert_own" ON "public"."customer_achievement_unlocks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "customer_achievement_unlocks_select_own" ON "public"."customer_achievement_unlocks" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."customer_badge_showcase" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_badge_showcase_delete_own" ON "public"."customer_badge_showcase" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "customer_badge_showcase_insert_own" ON "public"."customer_badge_showcase" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "customer_badge_showcase_select_own" ON "public"."customer_badge_showcase" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."customer_billing_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_checkout_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_checkout_items_select_own" ON "public"."customer_checkout_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customer_checkout_sessions" "sessions"
  WHERE (("sessions"."id" = "customer_checkout_items"."checkout_session_id") AND ("sessions"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."customer_checkout_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_checkout_sessions_select_own" ON "public"."customer_checkout_sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."customer_favorite_freelancers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_freelancer_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_freelancer_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_request_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_request_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freelancer_payout_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_signups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "newsletter_signups_insert_public" ON "public"."newsletter_signups" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."notification_reads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notification_reads_insert_own" ON "public"."notification_reads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notification_reads_select_own" ON "public"."notification_reads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notification_reads_update_own" ON "public"."notification_reads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."order_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_delivery_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payout_release_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_expired_customer_freelancer_threads"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_customer_freelancer_threads"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_customer_freelancer_threads"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_profile_to_admin"("target_email" "text", "target_admin_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_billing_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_billing_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_billing_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_freelancer_threads_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_freelancer_threads_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_freelancer_threads_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_request_proposals_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_request_proposals_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_request_proposals_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_freelancer_payout_methods_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_freelancer_payout_methods_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_freelancer_payout_methods_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_customer_freelancer_thread"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_customer_freelancer_thread"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_customer_freelancer_thread"() TO "service_role";


















GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."customer_achievement_unlocks" TO "anon";
GRANT ALL ON TABLE "public"."customer_achievement_unlocks" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_achievement_unlocks" TO "service_role";



GRANT ALL ON TABLE "public"."customer_badge_showcase" TO "anon";
GRANT ALL ON TABLE "public"."customer_badge_showcase" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_badge_showcase" TO "service_role";



GRANT ALL ON TABLE "public"."customer_billing_profiles" TO "anon";
GRANT ALL ON TABLE "public"."customer_billing_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_billing_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."customer_checkout_items" TO "anon";
GRANT ALL ON TABLE "public"."customer_checkout_items" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_checkout_items" TO "service_role";



GRANT ALL ON TABLE "public"."customer_checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."customer_checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_checkout_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."customer_favorite_freelancers" TO "anon";
GRANT ALL ON TABLE "public"."customer_favorite_freelancers" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_favorite_freelancers" TO "service_role";



GRANT ALL ON TABLE "public"."customer_freelancer_messages" TO "anon";
GRANT ALL ON TABLE "public"."customer_freelancer_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_freelancer_messages" TO "service_role";



GRANT ALL ON TABLE "public"."customer_freelancer_threads" TO "anon";
GRANT ALL ON TABLE "public"."customer_freelancer_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_freelancer_threads" TO "service_role";



GRANT ALL ON TABLE "public"."customer_request_media" TO "anon";
GRANT ALL ON TABLE "public"."customer_request_media" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_request_media" TO "service_role";



GRANT ALL ON TABLE "public"."customer_request_proposals" TO "anon";
GRANT ALL ON TABLE "public"."customer_request_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_request_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."customer_requests" TO "anon";
GRANT ALL ON TABLE "public"."customer_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_requests" TO "service_role";



GRANT ALL ON TABLE "public"."freelancer_payout_methods" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_payout_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_payout_methods" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_signups" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_signups" TO "service_role";



GRANT ALL ON TABLE "public"."notification_reads" TO "anon";
GRANT ALL ON TABLE "public"."notification_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_reads" TO "service_role";



GRANT ALL ON TABLE "public"."order_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."order_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."order_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."order_delivery_assets" TO "anon";
GRANT ALL ON TABLE "public"."order_delivery_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."order_delivery_assets" TO "service_role";



GRANT ALL ON TABLE "public"."order_updates" TO "anon";
GRANT ALL ON TABLE "public"."order_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."order_updates" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payout_release_requests" TO "anon";
GRANT ALL ON TABLE "public"."payout_release_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_release_requests" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."saved_services" TO "anon";
GRANT ALL ON TABLE "public"."saved_services" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_services" TO "service_role";



GRANT ALL ON TABLE "public"."service_media" TO "anon";
GRANT ALL ON TABLE "public"."service_media" TO "authenticated";
GRANT ALL ON TABLE "public"."service_media" TO "service_role";



GRANT ALL ON TABLE "public"."service_packages" TO "anon";
GRANT ALL ON TABLE "public"."service_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."service_packages" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "newsletter_signups_insert_public" on "public"."newsletter_signups";


  create policy "newsletter_signups_insert_public"
  on "public"."newsletter_signups"
  as permissive
  for insert
  to anon, authenticated
with check (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Customers can delete their own request media files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'customer-request-media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Customers can upload their own request media"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'customer-request-media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Customers can view their own request media files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'customer-request-media'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Freelancers can delete order delivery assets"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'order-delivery-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Freelancers can update order delivery assets"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'order-delivery-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'order-delivery-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Freelancers can upload order delivery assets"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'order-delivery-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "authenticated users can upload own profile avatars"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile-avatars'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY['customers'::text, 'freelancers'::text])) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "profile_avatars_delete_own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile-avatars'::text) AND ((storage.foldername(name))[1] = 'customers'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "profile_avatars_insert_own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile-avatars'::text) AND ((storage.foldername(name))[1] = 'customers'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "profile_avatars_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-avatars'::text));



  create policy "profile_avatars_update_own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile-avatars'::text) AND ((storage.foldername(name))[1] = 'customers'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))
with check (((bucket_id = 'profile-avatars'::text) AND ((storage.foldername(name))[1] = 'customers'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



