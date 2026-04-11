create table public.customer_badge_showcase (
  user_id uuid not null,
  achievement_id text not null,
  slot smallint not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_badge_showcase_pkey primary key (user_id, slot),
  constraint customer_badge_showcase_user_achievement_key unique (user_id, achievement_id),
  constraint customer_badge_showcase_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint customer_badge_showcase_slot_check check (
    (
      (slot >= 1)
      and (slot <= 9)
    )
  )
) TABLESPACE pg_default;
