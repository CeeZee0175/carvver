create table public.profiles (
  id uuid not null,
  first_name text not null,
  last_name text not null,
  role text not null,
  avatar_url text null,
  country text null,
  bio text null,
  created_at timestamp with time zone null default now(),
  display_name text null,
  address text null,
  age integer null,
  customer_onboarding_completed_at timestamp with time zone null,
  region text null,
  city text null,
  barangay text null,
  freelancer_onboarding_completed_at timestamp with time zone null,
  freelancer_headline text null,
  freelancer_primary_category text null,
  freelancer_specialties text[] null,
  freelancer_experience_level text null,
  freelancer_portfolio_url text null,
  admin_username text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_admin_username_role_check check (
    (
      (admin_username is null)
      or (role = 'admin'::text)
    )
  ),
  constraint profiles_age_check check (
    (
      (age is null)
      or (age > 0)
    )
  ),
  constraint profiles_role_check check (
    (
      role = any (
        array[
          'customer'::text,
          'freelancer'::text,
          'admin'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists profiles_admin_username_lower_key on public.profiles using btree (lower(admin_username)) TABLESPACE pg_default
where
  (admin_username is not null);