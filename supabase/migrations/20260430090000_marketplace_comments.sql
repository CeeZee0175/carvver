CREATE TABLE IF NOT EXISTS "public"."marketplace_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "target_type" text NOT NULL,
  "service_id" uuid,
  "profile_id" uuid,
  "parent_id" uuid,
  "author_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "marketplace_comments_body_check" CHECK (
    char_length(btrim("body")) BETWEEN 1 AND 1000
  ),
  CONSTRAINT "marketplace_comments_target_type_check" CHECK (
    "target_type" = ANY (ARRAY[
      'service'::text,
      'freelancer_profile'::text,
      'customer_profile'::text
    ])
  ),
  CONSTRAINT "marketplace_comments_target_check" CHECK (
    (
      "target_type" = 'service'::text
      AND "service_id" IS NOT NULL
      AND "profile_id" IS NULL
    )
    OR (
      "target_type" = ANY (ARRAY['freelancer_profile'::text, 'customer_profile'::text])
      AND "profile_id" IS NOT NULL
      AND "service_id" IS NULL
    )
  )
);

ALTER TABLE "public"."marketplace_comments" OWNER TO "postgres";

ALTER TABLE ONLY "public"."marketplace_comments"
  ADD CONSTRAINT "marketplace_comments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."marketplace_comments"
  ADD CONSTRAINT "marketplace_comments_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."marketplace_comments"
  ADD CONSTRAINT "marketplace_comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "public"."marketplace_comments"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."marketplace_comments"
  ADD CONSTRAINT "marketplace_comments_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."marketplace_comments"
  ADD CONSTRAINT "marketplace_comments_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "marketplace_comments_service_created_idx"
  ON "public"."marketplace_comments" USING btree ("service_id", "created_at");

CREATE INDEX IF NOT EXISTS "marketplace_comments_profile_created_idx"
  ON "public"."marketplace_comments" USING btree ("profile_id", "target_type", "created_at");

CREATE INDEX IF NOT EXISTS "marketplace_comments_parent_idx"
  ON "public"."marketplace_comments" USING btree ("parent_id", "created_at");

CREATE OR REPLACE FUNCTION "public"."validate_marketplace_comment"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent public.marketplace_comments%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
    INTO v_parent
    FROM public.marketplace_comments
   WHERE id = NEW.parent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reply parent comment was not found.';
  END IF;

  IF v_parent.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Replies can only be one level deep.';
  END IF;

  IF v_parent.target_type IS DISTINCT FROM NEW.target_type
     OR v_parent.service_id IS DISTINCT FROM NEW.service_id
     OR v_parent.profile_id IS DISTINCT FROM NEW.profile_id THEN
    RAISE EXCEPTION 'Reply target must match the parent comment.';
  END IF;

  IF v_parent.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot reply to a removed comment.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."restrict_marketplace_comment_update"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.target_type IS DISTINCT FROM NEW.target_type
     OR OLD.service_id IS DISTINCT FROM NEW.service_id
     OR OLD.profile_id IS DISTINCT FROM NEW.profile_id
     OR OLD.parent_id IS DISTINCT FROM NEW.parent_id
     OR OLD.author_id IS DISTINCT FROM NEW.author_id
     OR OLD.body IS DISTINCT FROM NEW.body
     OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Only comment removal state can be updated.';
  END IF;

  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'Removed comments cannot be restored or changed.';
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."marketplace_comment_target_is_visible"(
  p_target_type text,
  p_service_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_target_type = 'service' THEN EXISTS (
      SELECT 1
        FROM public.services s
       WHERE s.id = p_service_id
         AND s.is_published = true
    )
    WHEN p_target_type = 'freelancer_profile' THEN EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.id = p_profile_id
         AND p.role = 'freelancer'
    )
    WHEN p_target_type = 'customer_profile' THEN EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.id = p_profile_id
         AND p.role = 'customer'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION "public"."marketplace_comment_insert_allowed"(
  p_author_id uuid,
  p_target_type text,
  p_service_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_target_type = 'service' THEN EXISTS (
      SELECT 1
        FROM public.profiles author
        JOIN public.services s ON s.id = p_service_id
       WHERE author.id = p_author_id
         AND author.role = 'customer'
         AND s.is_published = true
    )
    WHEN p_target_type = 'freelancer_profile' THEN EXISTS (
      SELECT 1
        FROM public.profiles author
        JOIN public.profiles target ON target.id = p_profile_id
       WHERE author.id = p_author_id
         AND author.role = 'customer'
         AND target.role = 'freelancer'
    )
    WHEN p_target_type = 'customer_profile' THEN EXISTS (
      SELECT 1
        FROM public.profiles author
        JOIN public.profiles target ON target.id = p_profile_id
       WHERE author.id = p_author_id
         AND author.role = 'freelancer'
         AND target.role = 'customer'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION "public"."marketplace_comment_delete_allowed"(
  p_user_id uuid,
  p_comment_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.marketplace_comments c
      LEFT JOIN public.services s
        ON c.target_type = 'service'
       AND s.id = c.service_id
     WHERE c.id = p_comment_id
       AND (
         c.author_id = p_user_id
         OR (
           c.target_type = 'service'
           AND s.freelancer_id = p_user_id
         )
         OR (
           c.target_type = ANY (ARRAY['freelancer_profile'::text, 'customer_profile'::text])
           AND c.profile_id = p_user_id
         )
       )
  );
$$;

CREATE TRIGGER "marketplace_comments_validate_before_insert"
  BEFORE INSERT ON "public"."marketplace_comments"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."validate_marketplace_comment"();

CREATE TRIGGER "marketplace_comments_restrict_before_update"
  BEFORE UPDATE ON "public"."marketplace_comments"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."restrict_marketplace_comment_update"();

ALTER TABLE "public"."marketplace_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read visible marketplace comments"
  ON "public"."marketplace_comments"
  FOR SELECT
  TO authenticated
  USING (
    public.marketplace_comment_target_is_visible(target_type, service_id, profile_id)
  );

CREATE POLICY "Allowed users can write marketplace comments"
  ON "public"."marketplace_comments"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND deleted_at IS NULL
    AND public.marketplace_comment_insert_allowed(author_id, target_type, service_id, profile_id)
  );

CREATE POLICY "Authors and owners can remove marketplace comments"
  ON "public"."marketplace_comments"
  FOR UPDATE
  TO authenticated
  USING (
    public.marketplace_comment_delete_allowed(auth.uid(), id)
  )
  WITH CHECK (
    public.marketplace_comment_delete_allowed(auth.uid(), id)
  );

GRANT ALL ON TABLE "public"."marketplace_comments" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_comments" TO "service_role";
