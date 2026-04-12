create table public.service_packages (
  id uuid not null default gen_random_uuid (),
  service_id uuid not null,
  sort_order smallint not null default 1,
  package_name text not null,
  package_summary text null,
  price numeric(10, 2) not null,
  delivery_time_days integer null,
  revisions integer null,
  included_items text[] null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint service_packages_pkey primary key (id),
  constraint service_packages_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint service_packages_service_sort_key unique (service_id, sort_order)
) TABLESPACE pg_default;

create index IF not exists service_packages_service_idx on public.service_packages using btree (service_id, sort_order asc) TABLESPACE pg_default;
