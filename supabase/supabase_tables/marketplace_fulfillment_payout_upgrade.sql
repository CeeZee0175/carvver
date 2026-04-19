alter table if exists public.services
add column if not exists fulfillment_type text not null default 'digital'::text;

alter table if exists public.services
drop constraint if exists services_fulfillment_type_check;

alter table if exists public.services
add constraint services_fulfillment_type_check check (
  (
    fulfillment_type = any (array['digital'::text, 'physical'::text])
  )
);

alter table if exists public.customer_checkout_items
add column if not exists fulfillment_type text not null default 'digital'::text;

alter table if exists public.customer_checkout_items
drop constraint if exists customer_checkout_items_fulfillment_type_check;

alter table if exists public.customer_checkout_items
add constraint customer_checkout_items_fulfillment_type_check check (
  (
    fulfillment_type = any (array['digital'::text, 'physical'::text])
  )
);

alter table if exists public.orders
add column if not exists fulfillment_type text not null default 'digital'::text;

alter table if exists public.orders
drop constraint if exists orders_escrow_status_check;

alter table if exists public.orders
add constraint orders_escrow_status_check check (
  (
    escrow_status = any (
      array[
        'held'::text,
        'pending_release'::text,
        'released'::text,
        'blocked'::text,
        'refunded'::text,
        'failed'::text
      ]
    )
  )
);

alter table if exists public.orders
drop constraint if exists orders_fulfillment_type_check;

alter table if exists public.orders
add constraint orders_fulfillment_type_check check (
  (
    fulfillment_type = any (array['digital'::text, 'physical'::text])
  )
);

create table if not exists public.order_deliveries (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  freelancer_id uuid not null,
  fulfillment_type text not null,
  delivery_note text not null,
  deliverable_label text null,
  deliverable_url text null,
  access_code text null,
  courier_name text null,
  tracking_reference text null,
  shipment_note text null,
  proof_url text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint order_deliveries_pkey primary key (id),
  constraint order_deliveries_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_deliveries_freelancer_id_fkey foreign KEY (freelancer_id) references auth.users (id) on delete CASCADE,
  constraint order_deliveries_delivery_note_check check ((char_length(btrim(delivery_note)) > 0)),
  constraint order_deliveries_fulfillment_type_check check (
    (
      fulfillment_type = any (array['digital'::text, 'physical'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists order_deliveries_order_created_idx on public.order_deliveries using btree (order_id, created_at) TABLESPACE pg_default;

create table if not exists public.payout_release_requests (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  customer_id uuid not null,
  freelancer_id uuid not null,
  amount numeric(10, 2) not null,
  currency text not null default 'PHP'::text,
  status text not null default 'pending'::text,
  destination_method text null,
  destination_account_name text null,
  destination_account_reference text null,
  provider_reference text null,
  ops_note text null,
  requested_at timestamp with time zone not null default timezone ('utc'::text, now()),
  processed_at timestamp with time zone null,
  released_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint payout_release_requests_pkey primary key (id),
  constraint payout_release_requests_order_id_key unique (order_id),
  constraint payout_release_requests_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint payout_release_requests_customer_id_fkey foreign KEY (customer_id) references profiles (id) on delete CASCADE,
  constraint payout_release_requests_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE,
  constraint payout_release_requests_amount_check check ((amount >= 0)),
  constraint payout_release_requests_currency_check check ((char_length(btrim(currency)) > 0)),
  constraint payout_release_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'blocked'::text,
          'released'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists payout_release_requests_status_idx on public.payout_release_requests using btree (status, requested_at desc) TABLESPACE pg_default;
