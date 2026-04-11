create table if not exists public.customer_freelancer_threads (
  id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  freelancer_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  last_message_at timestamp with time zone null,
  constraint customer_freelancer_threads_pkey primary key (id),
  constraint customer_freelancer_threads_customer_freelancer_key unique (customer_id, freelancer_id),
  constraint customer_freelancer_threads_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE,
  constraint customer_freelancer_threads_freelancer_id_fkey foreign KEY (freelancer_id) references auth.users (id) on delete CASCADE,
  constraint customer_freelancer_threads_distinct_users_check check ((customer_id <> freelancer_id))
);

alter table public.customer_freelancer_threads
  add column if not exists updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  add column if not exists last_message_at timestamp with time zone null;

create table if not exists public.customer_freelancer_messages (
  id uuid not null default gen_random_uuid (),
  thread_id uuid not null,
  sender_id uuid not null,
  sender_role text not null,
  body text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_freelancer_messages_pkey primary key (id),
  constraint customer_freelancer_messages_thread_id_fkey foreign KEY (thread_id) references customer_freelancer_threads (id) on delete CASCADE,
  constraint customer_freelancer_messages_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete CASCADE,
  constraint customer_freelancer_messages_sender_role_check check ((sender_role = any (array['customer'::text, 'freelancer'::text]))),
  constraint customer_freelancer_messages_body_check check ((char_length(btrim(body)) > 0))
);

create index if not exists customer_freelancer_threads_customer_last_message_idx
on public.customer_freelancer_threads using btree (customer_id, last_message_at desc);

create index if not exists customer_freelancer_threads_freelancer_last_message_idx
on public.customer_freelancer_threads using btree (freelancer_id, last_message_at desc);

create index if not exists customer_freelancer_messages_thread_created_idx
on public.customer_freelancer_messages using btree (thread_id, created_at asc);

create index if not exists customer_freelancer_messages_thread_created_desc_idx
on public.customer_freelancer_messages using btree (thread_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'set_customer_freelancer_threads_updated_at'
      and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create function public.set_customer_freelancer_threads_updated_at()
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
    from pg_proc
    where proname = 'touch_customer_freelancer_thread'
      and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create function public.touch_customer_freelancer_thread()
      returns trigger
      language plpgsql
      as $body$
      begin
        update public.customer_freelancer_threads
        set
          updated_at = timezone('utc'::text, now()),
          last_message_at = coalesce(new.created_at, timezone('utc'::text, now()))
        where id = new.thread_id;

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
    from pg_proc
    where proname = 'cleanup_expired_customer_freelancer_threads'
      and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create function public.cleanup_expired_customer_freelancer_threads()
      returns integer
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        deleted_count integer := 0;
      begin
        delete from public.customer_freelancer_threads
        where coalesce(last_message_at, created_at) < timezone('utc'::text, now()) - interval '30 days';

        get diagnostics deleted_count = row_count;
        return deleted_count;
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
    where tgname = 'customer_freelancer_threads_set_updated_at'
  ) then
    create trigger customer_freelancer_threads_set_updated_at
    before update on public.customer_freelancer_threads
    for each row
    execute function public.set_customer_freelancer_threads_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'customer_freelancer_messages_touch_thread'
  ) then
    create trigger customer_freelancer_messages_touch_thread
    after insert on public.customer_freelancer_messages
    for each row
    execute function public.touch_customer_freelancer_thread();
  end if;
end
$$;

alter table public.customer_freelancer_threads enable row level security;
alter table public.customer_freelancer_messages enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_freelancer_threads'
      and policyname = 'Participants can read their threads'
  ) then
    create policy "Participants can read their threads"
      on public.customer_freelancer_threads
      for select
      to authenticated
      using ((auth.uid() = customer_id) or (auth.uid() = freelancer_id));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_freelancer_threads'
      and policyname = 'Participants can create threads'
  ) then
    create policy "Participants can create threads"
      on public.customer_freelancer_threads
      for insert
      to authenticated
      with check (
        ((auth.uid() = customer_id) or (auth.uid() = freelancer_id))
        and (customer_id <> freelancer_id)
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_freelancer_messages'
      and policyname = 'Participants can read their messages'
  ) then
    create policy "Participants can read their messages"
      on public.customer_freelancer_messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.customer_freelancer_threads t
          where t.id = thread_id
            and ((auth.uid() = t.customer_id) or (auth.uid() = t.freelancer_id))
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_freelancer_messages'
      and policyname = 'Participants can send messages'
  ) then
    create policy "Participants can send messages"
      on public.customer_freelancer_messages
      for insert
      to authenticated
      with check (
        auth.uid() = sender_id
        and exists (
          select 1
          from public.customer_freelancer_threads t
          where t.id = thread_id
            and (
              (auth.uid() = t.customer_id and sender_role = 'customer')
              or (auth.uid() = t.freelancer_id and sender_role = 'freelancer')
            )
        )
      );
  end if;
end
$$;
