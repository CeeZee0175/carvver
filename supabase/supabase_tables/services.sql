create table public.services (
  id uuid not null default gen_random_uuid (),
  freelancer_id uuid not null,
  title text not null,
  description text not null,
  category text not null,
  price numeric(10, 2) not null,
  location text null,
  is_published boolean null default false,
  created_at timestamp with time zone null default now(),
  is_verified boolean null default false,
  is_pro boolean null default false,
  constraint services_pkey primary key (id),
  constraint services_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;