create table public.customer_request_proposals (
  id uuid not null default gen_random_uuid (),
  request_id uuid not null,
  freelancer_id uuid not null,
  thread_id uuid not null,
  pitch text not null,
  offered_price numeric(10, 2) not null,
  delivery_days integer not null,
  status text not null default 'pending'::text,
  accepted_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_request_proposals_pkey primary key (id),
  constraint customer_request_proposals_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE,
  constraint customer_request_proposals_request_id_fkey foreign KEY (request_id) references customer_requests (id) on delete CASCADE,
  constraint customer_request_proposals_thread_id_fkey foreign KEY (thread_id) references customer_freelancer_threads (id) on delete CASCADE,
  constraint customer_request_proposals_price_check check ((offered_price > (0)::numeric)),
  constraint customer_request_proposals_pitch_check check ((char_length(btrim(pitch)) > 0)),
  constraint customer_request_proposals_delivery_days_check check ((delivery_days > 0)),
  constraint customer_request_proposals_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'accepted'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists customer_request_proposals_request_freelancer_key on public.customer_request_proposals using btree (request_id, freelancer_id) TABLESPACE pg_default;

create index IF not exists customer_request_proposals_request_created_idx on public.customer_request_proposals using btree (request_id, created_at desc) TABLESPACE pg_default;

create index IF not exists customer_request_proposals_freelancer_created_idx on public.customer_request_proposals using btree (freelancer_id, created_at desc) TABLESPACE pg_default;

create trigger customer_request_proposals_set_updated_at BEFORE
update on customer_request_proposals for EACH row
execute FUNCTION set_customer_request_proposals_updated_at ();