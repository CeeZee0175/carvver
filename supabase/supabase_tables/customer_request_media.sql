create table public.customer_request_media (
  id uuid not null default gen_random_uuid (),
  request_id uuid not null,
  customer_id uuid not null,
  bucket_path text not null,
  media_kind text not null,
  mime_type text not null,
  original_name text not null,
  sort_order smallint not null default 1,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_request_media_pkey primary key (id),
  constraint customer_request_media_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE,
  constraint customer_request_media_request_id_fkey foreign KEY (request_id) references customer_requests (id) on delete CASCADE,
  constraint customer_request_media_media_kind_check check (
    (
      media_kind = any (array['image'::text, 'video'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists customer_request_media_request_idx on public.customer_request_media using btree (request_id, sort_order) TABLESPACE pg_default;

create index IF not exists customer_request_media_customer_idx on public.customer_request_media using btree (customer_id, created_at desc) TABLESPACE pg_default;