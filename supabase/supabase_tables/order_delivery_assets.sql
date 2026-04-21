create table public.order_delivery_assets (
  id uuid not null default gen_random_uuid (),
  delivery_id uuid not null,
  order_id uuid not null,
  freelancer_id uuid not null,
  bucket_path text not null,
  asset_kind text not null,
  mime_type text null,
  original_name text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint order_delivery_assets_pkey primary key (id),
  constraint order_delivery_assets_delivery_id_fkey foreign KEY (delivery_id) references order_deliveries (id) on delete CASCADE,
  constraint order_delivery_assets_freelancer_id_fkey foreign KEY (freelancer_id) references auth.users (id) on delete CASCADE,
  constraint order_delivery_assets_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_delivery_assets_asset_kind_check check (
    (
      asset_kind = any (
        array['image'::text, 'video'::text, 'document'::text]
      )
    )
  ),
  constraint order_delivery_assets_bucket_path_check check ((char_length(btrim(bucket_path)) > 0))
) TABLESPACE pg_default;

create index IF not exists order_delivery_assets_delivery_created_idx on public.order_delivery_assets using btree (delivery_id, created_at) TABLESPACE pg_default;

create index IF not exists order_delivery_assets_order_created_idx on public.order_delivery_assets using btree (order_id, created_at) TABLESPACE pg_default;