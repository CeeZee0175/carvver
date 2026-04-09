create table if not exists public.customer_request_media (
  id uuid not null default gen_random_uuid (),
  request_id uuid not null,
  customer_id uuid not null,
  bucket_path text not null,
  media_kind text not null,
  mime_type text not null,
  original_name text not null,
  sort_order smallint not null default 1,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_request_media_pkey primary key (id),
  constraint customer_request_media_request_id_fkey foreign KEY (request_id) references public.customer_requests (id) on delete CASCADE,
  constraint customer_request_media_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE,
  constraint customer_request_media_media_kind_check check (
    (
      media_kind = any (array['image'::text, 'video'::text])
    )
  )
);

create index if not exists customer_request_media_request_idx
on public.customer_request_media using btree (request_id, sort_order asc);

create index if not exists customer_request_media_customer_idx
on public.customer_request_media using btree (customer_id, created_at desc);

alter table public.customer_request_media enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_request_media'
      and policyname = 'Customers can view their own request media'
  ) then
    create policy "Customers can view their own request media"
      on public.customer_request_media
      for select
      to authenticated
      using (auth.uid() = customer_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_request_media'
      and policyname = 'Customers can insert their own request media'
  ) then
    create policy "Customers can insert their own request media"
      on public.customer_request_media
      for insert
      to authenticated
      with check (auth.uid() = customer_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_request_media'
      and policyname = 'Customers can delete their own request media'
  ) then
    create policy "Customers can delete their own request media"
      on public.customer_request_media
      for delete
      to authenticated
      using (auth.uid() = customer_id);
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('customer-request-media', 'customer-request-media', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Customers can upload their own request media'
  ) then
    create policy "Customers can upload their own request media"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'customer-request-media'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Customers can view their own request media files'
  ) then
    create policy "Customers can view their own request media files"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'customer-request-media'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Customers can delete their own request media files'
  ) then
    create policy "Customers can delete their own request media files"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'customer-request-media'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end
$$;
