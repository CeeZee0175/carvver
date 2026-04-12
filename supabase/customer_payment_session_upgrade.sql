alter table public.customer_checkout_sessions
  alter column paymongo_checkout_id drop not null;

alter table public.customer_checkout_sessions
  add column if not exists paymongo_payment_intent_id text null,
  add column if not exists local_payment_method text not null default 'qrph'::text,
  add column if not exists cart_snapshot_hash text null,
  add column if not exists qr_image_url text null,
  add column if not exists qr_expires_at timestamp with time zone null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customer_checkout_sessions_method_check'
  ) then
    alter table public.customer_checkout_sessions
      add constraint customer_checkout_sessions_method_check
      check (
        local_payment_method = any (array['qrph'::text, 'card'::text])
      );
  end if;
end
$$;

alter table public.customer_checkout_sessions
  drop constraint if exists customer_checkout_sessions_status_check;

alter table public.customer_checkout_sessions
  add constraint customer_checkout_sessions_status_check
  check (
    status = any (
      array[
        'draft'::text,
        'pending'::text,
        'paid'::text,
        'failed'::text,
        'expired'::text,
        'cancelled'::text,
        'superseded'::text,
        'refunded'::text
      ]
    )
  );

alter table public.customer_checkout_sessions
  drop constraint if exists customer_checkout_sessions_paymongo_checkout_id_key;

create unique index if not exists customer_checkout_sessions_paymongo_checkout_id_key
on public.customer_checkout_sessions using btree (paymongo_checkout_id)
where (paymongo_checkout_id is not null);

create unique index if not exists customer_checkout_sessions_payment_intent_id_key
on public.customer_checkout_sessions using btree (paymongo_payment_intent_id)
where (paymongo_payment_intent_id is not null);

create index if not exists customer_checkout_sessions_user_status_idx
on public.customer_checkout_sessions using btree (user_id, status, created_at desc);

create index if not exists customer_checkout_sessions_snapshot_idx
on public.customer_checkout_sessions using btree (user_id, cart_snapshot_hash, local_payment_method, created_at desc);
