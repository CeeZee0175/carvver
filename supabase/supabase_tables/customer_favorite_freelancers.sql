create table public.customer_favorite_freelancers (
  customer_id uuid not null,
  freelancer_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint customer_favorite_freelancers_pkey primary key (customer_id, freelancer_id),
  constraint customer_favorite_freelancers_customer_id_fkey foreign KEY (customer_id) references auth.users (id) on delete CASCADE,
  constraint customer_favorite_freelancers_freelancer_id_fkey foreign KEY (freelancer_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index if not exists customer_favorite_freelancers_created_idx
on public.customer_favorite_freelancers using btree (customer_id, created_at desc) TABLESPACE pg_default;
