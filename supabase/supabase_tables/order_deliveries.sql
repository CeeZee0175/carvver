create table public.order_deliveries (
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
  constraint order_deliveries_freelancer_id_fkey foreign KEY (freelancer_id) references auth.users (id) on delete CASCADE,
  constraint order_deliveries_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_deliveries_delivery_note_check check ((char_length(btrim(delivery_note)) > 0)),
  constraint order_deliveries_fulfillment_type_check check (
    (
      fulfillment_type = any (array['digital'::text, 'physical'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists order_deliveries_order_created_idx on public.order_deliveries using btree (order_id, created_at) TABLESPACE pg_default;