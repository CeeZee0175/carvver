alter table public.profiles
  add column if not exists region text null,
  add column if not exists city text null,
  add column if not exists barangay text null,
  add column if not exists freelancer_onboarding_completed_at timestamp with time zone null,
  add column if not exists freelancer_headline text null,
  add column if not exists freelancer_primary_category text null,
  add column if not exists freelancer_specialties text[] null,
  add column if not exists freelancer_experience_level text null,
  add column if not exists freelancer_portfolio_url text null;

update public.profiles
set freelancer_onboarding_completed_at = coalesce(
  freelancer_onboarding_completed_at,
  timezone('utc'::text, now())
)
where role = 'freelancer';
