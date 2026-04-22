ALTER TABLE "public"."customer_freelancer_threads"
  ADD COLUMN IF NOT EXISTS "customer_hidden_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "freelancer_hidden_at" timestamp with time zone;


ALTER TABLE "public"."customer_freelancer_messages"
  DROP CONSTRAINT IF EXISTS "customer_freelancer_messages_message_type_check";

ALTER TABLE "public"."customer_freelancer_messages"
  ADD CONSTRAINT "customer_freelancer_messages_message_type_check"
  CHECK (("message_type" = ANY (ARRAY['text'::"text", 'proposal'::"text", 'order_update'::"text", 'attachment'::"text"])));


INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES ('message-attachments', 'message-attachments', false, 52428800, NULL)
ON CONFLICT ("id") DO UPDATE
SET
  "public" = false,
  "file_size_limit" = 52428800,
  "allowed_mime_types" = NULL;


CREATE OR REPLACE FUNCTION "public"."hide_customer_freelancer_thread"("p_thread_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_thread public.customer_freelancer_threads%rowtype;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to hide a conversation.';
  end if;

  select *
  into v_thread
  from public.customer_freelancer_threads
  where id = p_thread_id
  limit 1;

  if v_thread.id is null then
    raise exception 'Conversation not found.';
  end if;

  if v_thread.customer_id = v_user_id then
    update public.customer_freelancer_threads
    set customer_hidden_at = timezone('utc'::text, now())
    where id = p_thread_id;
  elsif v_thread.freelancer_id = v_user_id then
    update public.customer_freelancer_threads
    set freelancer_hidden_at = timezone('utc'::text, now())
    where id = p_thread_id;
  else
    raise exception 'You do not have access to this conversation.';
  end if;

  return p_thread_id;
end;
$$;


ALTER FUNCTION "public"."hide_customer_freelancer_thread"("p_thread_id" "uuid") OWNER TO "postgres";


REVOKE ALL ON FUNCTION "public"."hide_customer_freelancer_thread"("p_thread_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hide_customer_freelancer_thread"("p_thread_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hide_customer_freelancer_thread"("p_thread_id" "uuid") TO "service_role";


DO $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Participants can read message attachment files'
  ) then
    create policy "Participants can read message attachment files"
    on "storage"."objects"
    as permissive
    for select
    to authenticated
    using (
      bucket_id = 'message-attachments'::text
      and exists (
        select 1
        from public.customer_freelancer_threads t
        where t.id = ((storage.foldername(name))[1])::uuid
          and (auth.uid() = t.customer_id or auth.uid() = t.freelancer_id)
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Participants can upload message attachment files'
  ) then
    create policy "Participants can upload message attachment files"
    on "storage"."objects"
    as permissive
    for insert
    to authenticated
    with check (
      bucket_id = 'message-attachments'::text
      and (storage.foldername(name))[2] = (auth.uid())::text
      and exists (
        select 1
        from public.customer_freelancer_threads t
        where t.id = ((storage.foldername(name))[1])::uuid
          and (auth.uid() = t.customer_id or auth.uid() = t.freelancer_id)
      )
    );
  end if;
end
$$;
