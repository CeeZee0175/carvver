create table public.customer_freelancer_threads (
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
) TABLESPACE pg_default;

create index IF not exists customer_freelancer_threads_customer_last_message_idx on public.customer_freelancer_threads using btree (customer_id, last_message_at desc) TABLESPACE pg_default;

create index IF not exists customer_freelancer_threads_freelancer_last_message_idx on public.customer_freelancer_threads using btree (freelancer_id, last_message_at desc) TABLESPACE pg_default;

create trigger customer_freelancer_threads_set_updated_at BEFORE
update on customer_freelancer_threads for EACH row
execute FUNCTION set_customer_freelancer_threads_updated_at ();