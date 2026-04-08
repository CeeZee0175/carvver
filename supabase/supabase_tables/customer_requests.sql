create table public.customer_requests (
  id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  title text not null,
  category text not null,
  description text not null,
  budget_amount numeric(10, 2) null,
  location text null,
  timeline text not null,
  status text not null default 'open'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_requests_pkey primary key (id),
  constraint customer_requests_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE,
  constraint customer_requests_status_check check (
    (
      status = any (
        array[
          'open'::text,
          'closed'::text,
          'matched'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists customer_requests_customer_id_idx on public.customer_requests using btree (customer_id, created_at desc) TABLESPACE pg_default;

create index IF not exists customer_requests_status_idx on public.customer_requests using btree (status, created_at desc) TABLESPACE pg_default;

create trigger customer_requests_set_updated_at BEFORE
update on customer_requests for EACH row
execute FUNCTION set_customer_requests_updated_at ();