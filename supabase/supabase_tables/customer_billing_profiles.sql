create table public.customer_billing_profiles (
  customer_id uuid not null,
  billing_name text null,
  billing_email text null,
  billing_address text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  preferred_payment_method text null,
  wallet_provider text null,
  wallet_phone_number text null,
  paymongo_customer_id text null,
  default_card_payment_method_id text null,
  default_card_brand text null,
  default_card_last4 text null,
  default_card_exp_month integer null,
  default_card_exp_year integer null,
  constraint customer_billing_profiles_pkey primary key (customer_id),
  constraint customer_billing_profiles_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists customer_billing_profiles_updated_at_idx on public.customer_billing_profiles using btree (updated_at desc) TABLESPACE pg_default;

create trigger customer_billing_profiles_set_updated_at BEFORE
update on customer_billing_profiles for EACH row
execute FUNCTION set_customer_billing_profiles_updated_at ();