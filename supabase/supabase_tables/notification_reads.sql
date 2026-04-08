create table public.notification_reads (
  user_id uuid not null,
  notification_id text not null,
  is_read boolean not null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint notification_reads_pkey primary key (user_id, notification_id),
  constraint notification_reads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;