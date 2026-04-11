create table if not exists public.customer_billing_profiles (
  customer_id uuid not null,
  billing_name text null,
  billing_email text null,
  billing_address text null,
  preferred_payment_method text null,
  wallet_provider text null,
  wallet_phone_number text null,
  paymongo_customer_id text null,
  default_card_payment_method_id text null,
  default_card_brand text null,
  default_card_last4 text null,
  default_card_exp_month integer null,
  default_card_exp_year integer null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_billing_profiles_pkey primary key (customer_id),
  constraint customer_billing_profiles_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE
);

alter table public.customer_billing_profiles
  add column if not exists preferred_payment_method text null,
  add column if not exists wallet_provider text null,
  add column if not exists wallet_phone_number text null,
  add column if not exists paymongo_customer_id text null,
  add column if not exists default_card_payment_method_id text null,
  add column if not exists default_card_brand text null,
  add column if not exists default_card_last4 text null,
  add column if not exists default_card_exp_month integer null,
  add column if not exists default_card_exp_year integer null;

create index if not exists customer_billing_profiles_updated_at_idx
on public.customer_billing_profiles using btree (updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'set_customer_billing_profiles_updated_at'
      and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create function public.set_customer_billing_profiles_updated_at()
      returns trigger
      language plpgsql
      as $body$
      begin
        new.updated_at = timezone('utc'::text, now());
        return new;
      end;
      $body$
    $fn$;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'customer_billing_profiles_set_updated_at'
  ) then
    create trigger customer_billing_profiles_set_updated_at
    before update on public.customer_billing_profiles
    for each row
    execute function public.set_customer_billing_profiles_updated_at();
  end if;
end
$$;

alter table public.customer_billing_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_billing_profiles'
      and policyname = 'Customers can read their billing profile'
  ) then
    create policy "Customers can read their billing profile"
      on public.customer_billing_profiles
      for select
      to authenticated
      using (auth.uid() = customer_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_billing_profiles'
      and policyname = 'Customers can insert their billing profile'
  ) then
    create policy "Customers can insert their billing profile"
      on public.customer_billing_profiles
      for insert
      to authenticated
      with check (auth.uid() = customer_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_billing_profiles'
      and policyname = 'Customers can update their billing profile'
  ) then
    create policy "Customers can update their billing profile"
      on public.customer_billing_profiles
      for update
      to authenticated
      using (auth.uid() = customer_id)
      with check (auth.uid() = customer_id);
  end if;
end
$$;
