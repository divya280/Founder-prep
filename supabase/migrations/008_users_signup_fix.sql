-- Fix: public.users rows were never created on signup — the 001 trigger is
-- missing from this project (auth users existed while public.users was empty),
-- which looped every login back to onboarding: the dashboard saw no profile
-- row, and the onboarding form's UPDATE matched zero rows so nothing ever
-- saved. Run in Supabase SQL Editor after 007_item_detail_fields.sql.
--
-- 1) Reinstall the signup trigger from 001.
-- 2) Backfill rows for auth users created while the trigger was missing.
-- 3) Let founders insert their own row, so onboarding can self-heal if the
--    trigger ever goes missing again.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.users (id, email, name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', '')
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id);

drop policy if exists "Users insert own row" on public.users;
create policy "Users insert own row"
  on public.users
  for insert
  with check (auth.uid() = id);
