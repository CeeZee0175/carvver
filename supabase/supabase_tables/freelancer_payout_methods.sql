create table public.freelancer_payout_methods (
  freelancer_id uuid not null,
  payout_method text not null,
  account_name text not null,
  account_reference text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint freelancer_payout_methods_pkey primary key (freelancer_id),
  constraint freelancer_payout_methods_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE,
  constraint freelancer_payout_methods_account_name_check check ((char_length(btrim(account_name)) > 0)),
  constraint freelancer_payout_methods_account_reference_check check ((char_length(btrim(account_reference)) > 0)),
  constraint freelancer_payout_methods_payout_method_check check ((char_length(btrim(payout_method)) > 0))
) TABLESPACE pg_default;

create trigger freelancer_payout_methods_set_updated_at BEFORE
update on freelancer_payout_methods for EACH row
execute FUNCTION set_freelancer_payout_methods_updated_at ();