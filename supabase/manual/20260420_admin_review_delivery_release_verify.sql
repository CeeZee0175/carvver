-- Run these read-only checks in Supabase SQL before applying the repair migration.
-- They help confirm which parts of the failed migration already applied.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'admin_username';

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass
  and conname in ('profiles_role_check', 'profiles_admin_username_role_check');

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
  and indexname = 'profiles_admin_username_lower_key';

select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'promote_profile_to_admin';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'payout_release_requests'
  and column_name in (
    'processed_by_admin_id',
    'freelancer_receipt_path',
    'customer_receipt_path'
  );

select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('order_delivery_assets', 'user_notifications');

select id, name
from storage.buckets
where id in ('order-delivery-assets', 'order-receipts');

select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Freelancers can upload order delivery assets',
    'Freelancers can update order delivery assets',
    'Freelancers can delete order delivery assets'
  );
