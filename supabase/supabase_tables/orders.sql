create table public.orders (
  id uuid not null default gen_random_uuid (),
  service_id uuid null,
  customer_id uuid null,
  freelancer_id uuid null,
  status text not null default 'pending'::text,
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone null default now(),
  checkout_session_id uuid null,
  selected_package_id uuid null,
  selected_package_name text null,
  selected_package_summary text null,
  selected_package_delivery_time_days integer null,
  selected_package_revisions integer null,
  selected_package_included_items text[] null,
  gross_amount numeric(10, 2) null,
  platform_fee numeric(10, 2) null,
  freelancer_net numeric(10, 2) null,
  payment_provider text null,
  payment_reference text null,
  escrow_status text null,
  paid_at timestamp with time zone null,
  constraint orders_pkey primary key (id),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references profiles (id) on delete set null,
  constraint orders_checkout_session_id_fkey foreign KEY (checkout_session_id) references customer_checkout_sessions (id) on delete set null,
  constraint orders_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete set null,
  constraint orders_service_id_fkey foreign KEY (service_id) references services (id) on delete set null,
  constraint orders_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'active'::text,
          'completed'::text,
          'cancelled'::text,
          'disputed'::text
        ]
      )
    )
  ),
  constraint orders_escrow_status_check check (
    (
      escrow_status = any (
        array[
          'held'::text,
          'released'::text,
          'refunded'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists orders_checkout_service_customer_key on public.orders using btree (checkout_session_id, service_id, customer_id) TABLESPACE pg_default
where
  (checkout_session_id is not null);
