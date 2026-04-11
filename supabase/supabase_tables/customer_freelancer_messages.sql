create table public.customer_freelancer_messages (
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
) TABLESPACE pg_default;

create index IF not exists customer_freelancer_messages_thread_created_idx
on public.customer_freelancer_messages using btree (thread_id, created_at asc) TABLESPACE pg_default;

create index IF not exists customer_freelancer_messages_thread_created_desc_idx
on public.customer_freelancer_messages using btree (thread_id, created_at desc) TABLESPACE pg_default;
