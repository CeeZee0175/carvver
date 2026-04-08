create table public.customer_checkout_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  paymongo_checkout_id text not null,
  status text not null default 'draft'::text,
  subtotal numeric(10, 2) not null default 0,
  currency text not null default 'PHP'::text,
  checkout_url text null,
  redirect_success_url text null,
  redirect_cancel_url text null,
  payment_reference text null,
  paid_at timestamp with time zone null,
  failed_at timestamp with time zone null,
  expired_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_checkout_sessions_pkey primary key (id),
  constraint customer_checkout_sessions_paymongo_checkout_id_key unique (paymongo_checkout_id),
  constraint customer_checkout_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint customer_checkout_sessions_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'pending'::text,
          'paid'::text,
          'failed'::text,
          'expired'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists customer_checkout_sessions_user_created_at_idx on public.customer_checkout_sessions using btree (user_id, created_at desc) TABLESPACE pg_default;