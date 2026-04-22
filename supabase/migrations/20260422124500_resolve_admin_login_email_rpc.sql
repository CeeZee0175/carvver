CREATE OR REPLACE FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  normalized_username text := lower(trim(coalesce(p_admin_username, '')));
  resolved_email text;
  resolved_username text;
begin
  if normalized_username = '' then
    return null;
  end if;

  select
    u.email,
    p.admin_username
  into
    resolved_email,
    resolved_username
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'admin'
    and p.admin_username is not null
    and lower(trim(p.admin_username)) = normalized_username
  limit 1;

  if resolved_email is null then
    return null;
  end if;

  return jsonb_build_object(
    'email', resolved_email,
    'adminUsername', lower(trim(resolved_username))
  );
end;
$$;


ALTER FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") OWNER TO "postgres";


REVOKE ALL ON FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_admin_login_email"("p_admin_username" "text") TO "service_role";
