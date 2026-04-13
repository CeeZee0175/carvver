create table public.cart_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  service_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  selected_package_id uuid null,
  selected_package_name text null,
  selected_package_summary text null,
  selected_package_price numeric(10, 2) null,
  selected_package_delivery_time_days integer null,
  selected_package_revisions integer null,
  selected_package_included_items text[] null,
  constraint cart_items_pkey primary key (id),
  constraint cart_items_user_service_key unique (user_id, service_id),
  constraint cart_items_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint cart_items_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists cart_items_user_created_at_idx on public.cart_items using btree (user_id, created_at desc) TABLESPACE pg_default;