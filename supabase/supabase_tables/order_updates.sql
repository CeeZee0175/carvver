create table public.order_updates (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  author_id uuid not null,
  author_role text not null,
  update_kind text not null default 'progress'::text,
  title text not null,
  body text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint order_updates_pkey primary key (id),
  constraint order_updates_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete CASCADE,
  constraint order_updates_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_updates_author_role_check check (
    (
      author_role = any (array['customer'::text, 'freelancer'::text])
    )
  ),
  constraint order_updates_body_check check ((char_length(btrim(body)) > 0)),
  constraint order_updates_title_check check ((char_length(btrim(title)) > 0))
) TABLESPACE pg_default;

create index IF not exists order_updates_order_created_idx on public.order_updates using btree (order_id, created_at) TABLESPACE pg_default;