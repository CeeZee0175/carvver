CREATE OR REPLACE FUNCTION "public"."is_current_user_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
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

ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "freelancer_verified_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "freelancer_verified_by" uuid;

REVOKE UPDATE ("freelancer_verified_at", "freelancer_verified_by")
ON TABLE "public"."profiles"
FROM "authenticated";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'profiles_freelancer_verified_by_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."profiles"
      ADD CONSTRAINT "profiles_freelancer_verified_by_fkey"
      FOREIGN KEY ("freelancer_verified_by")
      REFERENCES "public"."profiles"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."freelancer_verification_requests" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "freelancer_id" uuid NOT NULL,
    "description" text NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL,
    "admin_note" text,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "freelancer_verification_description_check" CHECK ((char_length(btrim(description)) >= 20)),
    CONSTRAINT "freelancer_verification_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);

ALTER TABLE "public"."freelancer_verification_requests" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."freelancer_verification_media" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "request_id" uuid NOT NULL,
    "freelancer_id" uuid NOT NULL,
    "bucket_path" text NOT NULL,
    "media_kind" text NOT NULL,
    "mime_type" text NOT NULL,
    "original_name" text NOT NULL,
    "sort_order" smallint DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "freelancer_verification_media_kind_check" CHECK ((media_kind = ANY (ARRAY['image'::text, 'video'::text]))),
    CONSTRAINT "freelancer_verification_media_path_check" CHECK ((char_length(btrim(bucket_path)) > 0))
);

ALTER TABLE "public"."freelancer_verification_media" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."freelancer_achievement_unlocks" (
    "user_id" uuid NOT NULL,
    "achievement_id" text NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "public"."freelancer_achievement_unlocks" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."freelancer_badge_showcase" (
    "user_id" uuid NOT NULL,
    "achievement_id" text NOT NULL,
    "slot" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "freelancer_badge_showcase_slot_check" CHECK (((slot >= 1) AND (slot <= 9)))
);

ALTER TABLE "public"."freelancer_badge_showcase" OWNER TO "postgres";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_requests_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_requests"
      ADD CONSTRAINT "freelancer_verification_requests_pkey" PRIMARY KEY ("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_media_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_media"
      ADD CONSTRAINT "freelancer_verification_media_pkey" PRIMARY KEY ("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_achievement_unlocks_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_achievement_unlocks"
      ADD CONSTRAINT "freelancer_achievement_unlocks_pkey" PRIMARY KEY ("user_id", "achievement_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_badge_showcase_pkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_badge_showcase"
      ADD CONSTRAINT "freelancer_badge_showcase_pkey" PRIMARY KEY ("user_id", "slot");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_badge_showcase_user_achievement_key'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_badge_showcase"
      ADD CONSTRAINT "freelancer_badge_showcase_user_achievement_key" UNIQUE ("user_id", "achievement_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_requests_freelancer_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_requests"
      ADD CONSTRAINT "freelancer_verification_requests_freelancer_id_fkey"
      FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_requests_reviewed_by_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_requests"
      ADD CONSTRAINT "freelancer_verification_requests_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_media_request_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_media"
      ADD CONSTRAINT "freelancer_verification_media_request_id_fkey"
      FOREIGN KEY ("request_id") REFERENCES "public"."freelancer_verification_requests"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_verification_media_freelancer_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_verification_media"
      ADD CONSTRAINT "freelancer_verification_media_freelancer_id_fkey"
      FOREIGN KEY ("freelancer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_achievement_unlocks_user_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_achievement_unlocks"
      ADD CONSTRAINT "freelancer_achievement_unlocks_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_badge_showcase_user_id_fkey'
  ) THEN
    ALTER TABLE ONLY "public"."freelancer_badge_showcase"
      ADD CONSTRAINT "freelancer_badge_showcase_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_verification_one_pending_per_user"
  ON "public"."freelancer_verification_requests" ("freelancer_id")
  WHERE ("status" = 'pending'::text);

CREATE INDEX IF NOT EXISTS "freelancer_verification_requests_status_created_idx"
  ON "public"."freelancer_verification_requests" ("status", "created_at" DESC);

ALTER TABLE "public"."freelancer_verification_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."freelancer_verification_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."freelancer_achievement_unlocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."freelancer_badge_showcase" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "freelancer_verification_requests_select_own_or_admin" ON "public"."freelancer_verification_requests";
CREATE POLICY "freelancer_verification_requests_select_own_or_admin"
ON "public"."freelancer_verification_requests"
FOR SELECT TO authenticated
USING (auth.uid() = freelancer_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "freelancer_verification_requests_insert_own" ON "public"."freelancer_verification_requests";
CREATE POLICY "freelancer_verification_requests_insert_own"
ON "public"."freelancer_verification_requests"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "freelancer_verification_media_select_own_or_admin" ON "public"."freelancer_verification_media";
CREATE POLICY "freelancer_verification_media_select_own_or_admin"
ON "public"."freelancer_verification_media"
FOR SELECT TO authenticated
USING (auth.uid() = freelancer_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "freelancer_verification_media_insert_own" ON "public"."freelancer_verification_media";
CREATE POLICY "freelancer_verification_media_insert_own"
ON "public"."freelancer_verification_media"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "freelancer_achievement_unlocks_select_own" ON "public"."freelancer_achievement_unlocks";
CREATE POLICY "freelancer_achievement_unlocks_select_own"
ON "public"."freelancer_achievement_unlocks"
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancer_achievement_unlocks_insert_own" ON "public"."freelancer_achievement_unlocks";
CREATE POLICY "freelancer_achievement_unlocks_insert_own"
ON "public"."freelancer_achievement_unlocks"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancer_badge_showcase_select_own" ON "public"."freelancer_badge_showcase";
CREATE POLICY "freelancer_badge_showcase_select_own"
ON "public"."freelancer_badge_showcase"
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancer_badge_showcase_select_public" ON "public"."freelancer_badge_showcase";
CREATE POLICY "freelancer_badge_showcase_select_public"
ON "public"."freelancer_badge_showcase"
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "freelancer_badge_showcase_insert_own" ON "public"."freelancer_badge_showcase";
CREATE POLICY "freelancer_badge_showcase_insert_own"
ON "public"."freelancer_badge_showcase"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancer_badge_showcase_delete_own" ON "public"."freelancer_badge_showcase";
CREATE POLICY "freelancer_badge_showcase_delete_own"
ON "public"."freelancer_badge_showcase"
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES (
  'freelancer-verification-media',
  'freelancer-verification-media',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']::text[]
)
ON CONFLICT ("id") DO UPDATE
SET "public" = excluded."public",
    "file_size_limit" = excluded."file_size_limit",
    "allowed_mime_types" = excluded."allowed_mime_types";

DROP POLICY IF EXISTS "Freelancers can upload verification media" ON "storage"."objects";
CREATE POLICY "Freelancers can upload verification media"
ON "storage"."objects"
AS permissive
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'freelancer-verification-media'::text
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Freelancers and admins can read verification media" ON "storage"."objects";
CREATE POLICY "Freelancers and admins can read verification media"
ON "storage"."objects"
AS permissive
FOR SELECT
TO authenticated
USING (
  bucket_id = 'freelancer-verification-media'::text
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_current_user_admin()
  )
);

CREATE OR REPLACE FUNCTION "public"."process_freelancer_verification_request"(
  "p_request_id" uuid,
  "p_action" text,
  "p_admin_note" text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.freelancer_verification_requests%ROWTYPE;
  v_action text := lower(trim(coalesce(p_action, '')));
  v_now timestamp with time zone := timezone('utc'::text, now());
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Admin access is required.';
  END IF;

  IF v_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Use approve or reject.';
  END IF;

  SELECT *
    INTO v_request
    FROM public.freelancer_verification_requests
   WHERE id = p_request_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found.';
  END IF;

  UPDATE public.freelancer_verification_requests
     SET status = CASE WHEN v_action = 'approve' THEN 'approved' ELSE 'rejected' END,
         admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
         reviewed_by = auth.uid(),
         reviewed_at = v_now,
         updated_at = v_now
   WHERE id = p_request_id;

  IF v_action = 'approve' THEN
    UPDATE public.profiles
       SET freelancer_verified_at = coalesce(freelancer_verified_at, v_now),
           freelancer_verified_by = auth.uid()
     WHERE id = v_request.freelancer_id
       AND role = 'freelancer';

    UPDATE public.services
       SET is_verified = true
     WHERE freelancer_id = v_request.freelancer_id;
  END IF;

  RETURN jsonb_build_object(
    'requestId', p_request_id,
    'freelancerId', v_request.freelancer_id,
    'status', CASE WHEN v_action = 'approve' THEN 'approved' ELSE 'rejected' END
  );
END;
$$;

ALTER FUNCTION "public"."process_freelancer_verification_request"(uuid, text, text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."process_freelancer_verification_request"(uuid, text, text) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_freelancer_verification_request"(uuid, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_freelancer_verification_request"(uuid, text, text) TO "service_role";

GRANT ALL ON TABLE "public"."freelancer_verification_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_verification_requests" TO "service_role";
GRANT ALL ON TABLE "public"."freelancer_verification_media" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_verification_media" TO "service_role";
GRANT ALL ON TABLE "public"."freelancer_achievement_unlocks" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_achievement_unlocks" TO "service_role";
GRANT ALL ON TABLE "public"."freelancer_badge_showcase" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_badge_showcase" TO "service_role";
