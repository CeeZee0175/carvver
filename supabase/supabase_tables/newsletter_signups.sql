create table public.newsletter_signups (
  id uuid not null default gen_random_uuid (),
  email text not null,
  source text not null default 'home_four'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint newsletter_signups_pkey primary key (id),
  constraint newsletter_signups_email_format_check check (
    (
      email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists newsletter_signups_email_lower_key on public.newsletter_signups using btree (lower(email)) TABLESPACE pg_default;