create table public.service_media (
  id uuid not null default gen_random_uuid (),
  service_id uuid not null,
  freelancer_id uuid not null,
  bucket_path text not null,
  media_kind text not null,
  mime_type text not null,
  original_name text not null,
  sort_order smallint not null default 1,
  is_cover boolean not null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint service_media_pkey primary key (id),
  constraint service_media_freelancer_id_fkey foreign KEY (freelancer_id) references auth.users (id) on delete CASCADE,
  constraint service_media_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint service_media_kind_check check (
    (
      media_kind = any (array['image'::text, 'video'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists service_media_service_idx on public.service_media using btree (service_id, sort_order) TABLESPACE pg_default;

create index IF not exists service_media_freelancer_idx on public.service_media using btree (freelancer_id, created_at desc) TABLESPACE pg_default;