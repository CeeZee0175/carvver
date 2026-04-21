create table public.user_notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  notification_group text not null default 'system'::text,
  label text not null,
  title text not null,
  body text not null,
  path text null,
  cta_label text not null default 'Open'::text,
  accent text null,
  accent_soft text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_notifications_pkey primary key (id),
  constraint user_notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_notifications_group_check check (
    (
      notification_group = any (array['activity'::text, 'system'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists user_notifications_user_created_idx on public.user_notifications using btree (user_id, created_at desc) TABLESPACE pg_default;