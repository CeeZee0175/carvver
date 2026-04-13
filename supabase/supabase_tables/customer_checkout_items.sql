create table public.customer_checkout_items (
  id uuid not null default gen_random_uuid (),
  checkout_session_id uuid not null,
  service_id uuid not null,
  freelancer_id uuid not null,
  title text not null,
  category text null,
  description text null,
  unit_price numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null,
  freelancer_net numeric(10, 2) not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  selected_package_id uuid null,
  selected_package_name text null,
  selected_package_summary text null,
  selected_package_delivery_time_days integer null,
  selected_package_revisions integer null,
  selected_package_included_items text[] null,
  constraint customer_checkout_items_pkey primary key (id),
  constraint customer_checkout_items_session_service_key unique (checkout_session_id, service_id),
  constraint customer_checkout_items_checkout_session_id_fkey foreign KEY (checkout_session_id) references customer_checkout_sessions (id) on delete CASCADE,
  constraint customer_checkout_items_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete RESTRICT,
  constraint customer_checkout_items_service_id_fkey foreign KEY (service_id) references services (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists customer_checkout_items_session_idx on public.customer_checkout_items using btree (checkout_session_id) TABLESPACE pg_default;