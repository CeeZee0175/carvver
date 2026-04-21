-- One-time operational helper for separating a shared admin/customer account
-- into:
-- 1. a restored marketplace customer account
-- 2. a dedicated admin account with its own admin_username
--
-- Before running:
-- - create the dedicated admin auth user first in the Supabase Auth dashboard
-- - replace the placeholder emails and admin username below
--
-- This file is operational only and is intentionally outside supabase_tables.

begin;

-- Restore the originally shared account back to customer use.
update public.profiles
set
  role = 'customer',
  admin_username = null
where id = (
  select id
  from auth.users
  where lower(email) = lower('shared-customer@example.com')
  limit 1
);

-- Prepare the dedicated admin account profile.
update public.profiles
set
  role = 'admin',
  admin_username = lower('admin')
where id = (
  select id
  from auth.users
  where lower(email) = lower('dedicated-admin@example.com')
  limit 1
);

-- Optional verification.
select id, email
from auth.users
where lower(email) in (
  lower('shared-customer@example.com'),
  lower('dedicated-admin@example.com')
);

select id, first_name, last_name, role, admin_username
from public.profiles
where id in (
  select id
  from auth.users
  where lower(email) in (
    lower('shared-customer@example.com'),
    lower('dedicated-admin@example.com')
  )
);

commit;
