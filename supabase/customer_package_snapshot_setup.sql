alter table public.services
  add column if not exists updated_at timestamp with time zone null default timezone ('utc'::text, now());

update public.services
set updated_at = coalesce(updated_at, created_at, timezone ('utc'::text, now()))
where updated_at is null;

alter table public.cart_items
  add column if not exists selected_package_id uuid null,
  add column if not exists selected_package_name text null,
  add column if not exists selected_package_summary text null,
  add column if not exists selected_package_price numeric(10, 2) null,
  add column if not exists selected_package_delivery_time_days integer null,
  add column if not exists selected_package_revisions integer null,
  add column if not exists selected_package_included_items text[] null;

alter table public.customer_checkout_items
  add column if not exists selected_package_id uuid null,
  add column if not exists selected_package_name text null,
  add column if not exists selected_package_summary text null,
  add column if not exists selected_package_delivery_time_days integer null,
  add column if not exists selected_package_revisions integer null,
  add column if not exists selected_package_included_items text[] null;

alter table public.orders
  add column if not exists selected_package_id uuid null,
  add column if not exists selected_package_name text null,
  add column if not exists selected_package_summary text null,
  add column if not exists selected_package_delivery_time_days integer null,
  add column if not exists selected_package_revisions integer null,
  add column if not exists selected_package_included_items text[] null;
