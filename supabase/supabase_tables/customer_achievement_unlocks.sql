create table public.customer_achievement_unlocks (
  user_id uuid not null,
  achievement_id text not null,
  unlocked_at timestamp with time zone not null default timezone ('utc'::text, now()),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_achievement_unlocks_pkey primary key (user_id, achievement_id),
  constraint customer_achievement_unlocks_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;