create table public.saved_services (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  service_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint saved_services_pkey primary key (id),
  constraint saved_services_user_id_service_id_key unique (user_id, service_id),
  constraint saved_services_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint saved_services_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;