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
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_age_check check (
    (
      (age is null)
      or (age > 0)
    )
  ),
  constraint profiles_role_check check (
    (
      role = any (array['customer'::text, 'freelancer'::text])
    )
  )
) TABLESPACE pg_default;