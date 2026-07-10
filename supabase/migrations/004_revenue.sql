-- M5 addendum: bucketed annual-revenue band on users.
-- Stored as a text enum (not a number): the compliance logic only cares which
-- threshold band you're in (GST registration, MSME classification, audit
-- limits), never the exact figure — and founders answer a band far more
-- honestly than a precise number. Run in Supabase SQL Editor after 001_users.sql.

alter table public.users
  add column if not exists revenue text;

-- Keep the allowed buckets in lockstep with revenueValues in
-- lib/onboarding/options.ts. drop-then-add keeps this migration re-runnable.
alter table public.users
  drop constraint if exists users_revenue_check;
alter table public.users
  add constraint users_revenue_check
  check (
    revenue is null
    or revenue in (
      'pre_revenue',
      'under_10l',
      '10l_1cr',
      '1cr_10cr',
      'over_10cr'
    )
  );
