create table public.reviews (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  reviewer_id uuid null,
  reviewee_id uuid null,
  rating integer not null,
  comment text null,
  created_at timestamp with time zone null default now(),
  constraint reviews_pkey primary key (id),
  constraint reviews_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint reviews_reviewee_id_fkey foreign KEY (reviewee_id) references profiles (id) on delete set null,
  constraint reviews_reviewer_id_fkey foreign KEY (reviewer_id) references profiles (id) on delete set null,
  constraint reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;