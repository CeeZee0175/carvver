alter table public.profiles
  add column if not exists admin_username text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['customer'::text, 'freelancer'::text, 'admin'::text]));

create unique index if not exists profiles_admin_username_lower_key
  on public.profiles using btree (lower(admin_username))
  where admin_username is not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_admin_username_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_admin_username_role_check;
  end if;
end
$$;

alter table public.profiles
  add constraint profiles_admin_username_role_check
  check (admin_username is null or role = 'admin');

create or replace function public.promote_profile_to_admin(
  target_email text,
  target_admin_username text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(target_email));
  normalized_username text := lower(trim(target_admin_username));
  v_promoted_user_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Target email is required.';
  end if;

  if normalized_username = '' then
    raise exception 'Admin username is required.';
  end if;

  select u.id
    into v_promoted_user_id
  from auth.users u
  where lower(coalesce(u.email, '')) = normalized_email
  limit 1;

  if v_promoted_user_id is null then
    raise exception 'No authenticated user matches %.', target_email;
  end if;

  update public.profiles
  set
    role = 'admin',
    admin_username = normalized_username
  where id = v_promoted_user_id;

  if not found then
    raise exception 'Profile row was not found for %.', target_email;
  end if;

  return v_promoted_user_id;
end;
$$;

revoke all on function public.promote_profile_to_admin(text, text) from public;

alter table public.payout_release_requests
  add column if not exists processed_by_admin_id uuid null references public.profiles (id) on delete set null,
  add column if not exists freelancer_receipt_path text null,
  add column if not exists customer_receipt_path text null;

create table if not exists public.order_delivery_assets (
  id uuid not null default gen_random_uuid(),
  delivery_id uuid not null references public.order_deliveries (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  freelancer_id uuid not null references auth.users (id) on delete cascade,
  bucket_path text not null,
  asset_kind text not null,
  mime_type text null,
  original_name text null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint order_delivery_assets_pkey primary key (id),
  constraint order_delivery_assets_asset_kind_check
    check (asset_kind = any (array['image'::text, 'video'::text, 'document'::text])),
  constraint order_delivery_assets_bucket_path_check
    check (char_length(btrim(bucket_path)) > 0)
);

create index if not exists order_delivery_assets_delivery_created_idx
  on public.order_delivery_assets using btree (delivery_id, created_at);

create index if not exists order_delivery_assets_order_created_idx
  on public.order_delivery_assets using btree (order_id, created_at);

create table if not exists public.user_notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_group text not null default 'system'::text,
  label text not null,
  title text not null,
  body text not null,
  path text null,
  cta_label text not null default 'Open'::text,
  accent text null,
  accent_soft text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_group_check
    check (notification_group = any (array['activity'::text, 'system'::text]))
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications using btree (user_id, created_at desc);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'order-delivery-assets',
  'order-delivery-assets',
  true,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'order-receipts',
  'order-receipts',
  true,
  5242880,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Freelancers can upload order delivery assets" on storage.objects;
create policy "Freelancers can upload order delivery assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'order-delivery-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Freelancers can update order delivery assets" on storage.objects;
create policy "Freelancers can update order delivery assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'order-delivery-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'order-delivery-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Freelancers can delete order delivery assets" on storage.objects;
create policy "Freelancers can delete order delivery assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'order-delivery-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
