-- M9 — Document Vault
-- Run in Supabase SQL Editor after 005_compliance_fields.sql
--
-- Adds the storage-backed document vault: extra metadata columns on `documents`,
-- a private Storage bucket with per-user-folder access policies, and a
-- `vault_shares` table for the read-only "share my vault with a CA" link.

-- ---------------------------------------------------------------------------
-- documents: extra columns for the vault
-- ---------------------------------------------------------------------------
-- storage_path is the object key inside the `documents` bucket (source of truth
-- for downloads via signed URLs). file_url is kept for backward-compat but is no
-- longer required — signed URLs are minted on read, not stored.
alter table public.documents
  add column if not exists storage_path text,
  add column if not exists issue_date date,
  add column if not exists file_size bigint,
  add column if not exists mime_type text;

alter table public.documents
  alter column file_url drop not null;

-- ---------------------------------------------------------------------------
-- Storage bucket + per-user access policies
-- ---------------------------------------------------------------------------
-- Private bucket; objects are keyed  <user_id>/<uuid>-<filename>  so the first
-- path segment identifies the owner. Policies below scope every operation to the
-- caller's own folder, mirroring the RLS on public.documents.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Vault read own objects" on storage.objects;
create policy "Vault read own objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Vault insert own objects" on storage.objects;
create policy "Vault insert own objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Vault update own objects" on storage.objects;
create policy "Vault update own objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Vault delete own objects" on storage.objects;
create policy "Vault delete own objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- vault_shares — read-only share links for the whole vault
-- ---------------------------------------------------------------------------
-- The public /shared/<token> page resolves the token with the service-role
-- (admin) client, so no anon SELECT policy is needed here. Founders manage their
-- own share rows under RLS. A partial unique index enforces at most one active
-- (non-revoked) link per founder; rotating a link revokes the old row first.
create table if not exists public.vault_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null unique,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists vault_shares_one_active_per_user
  on public.vault_shares (user_id)
  where not revoked;

-- ---------------------------------------------------------------------------
-- notifications: link a document (for expiry alerts), alongside the existing
-- compliance_item_id (deadline alerts). Lets the daily cron dedupe per document.
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists document_id uuid
    references public.documents (id) on delete set null;

alter table public.vault_shares enable row level security;

drop policy if exists "Users read own shares" on public.vault_shares;
create policy "Users read own shares"
  on public.vault_shares for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own shares" on public.vault_shares;
create policy "Users insert own shares"
  on public.vault_shares for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own shares" on public.vault_shares;
create policy "Users update own shares"
  on public.vault_shares for update to authenticated
  using (auth.uid() = user_id);
