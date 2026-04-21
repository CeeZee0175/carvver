create table public.payout_release_requests (
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
  processed_by_admin_id uuid null,
  freelancer_receipt_path text null,
  customer_receipt_path text null,
  constraint payout_release_requests_pkey primary key (id),
  constraint payout_release_requests_order_id_key unique (order_id),
  constraint payout_release_requests_processed_by_admin_id_fkey foreign KEY (processed_by_admin_id) references profiles (id) on delete set null,
  constraint payout_release_requests_customer_id_fkey foreign KEY (customer_id) references profiles (id) on delete CASCADE,
  constraint payout_release_requests_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE,
  constraint payout_release_requests_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
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
  ),
  constraint payout_release_requests_currency_check check ((char_length(btrim(currency)) > 0)),
  constraint payout_release_requests_amount_check check ((amount >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists payout_release_requests_status_idx on public.payout_release_requests using btree (status, requested_at desc) TABLESPACE pg_default;