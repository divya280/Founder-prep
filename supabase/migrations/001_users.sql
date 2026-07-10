-- M2: minimal users table + RLS + auto-insert on signup
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  business_type text,
  domain text,
  state text,
  team_size text,
  funding_stage text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users read own row"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users update own row"
  on public.users
  for update
  using (auth.uid() = id);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
