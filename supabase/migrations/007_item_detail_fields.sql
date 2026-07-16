-- Returning-user flow: fields for the compliance item detail view.
-- Run in Supabase SQL Editor after 006_documents_vault.sql.
--
-- responsible / documents_required are properties of the item itself (who
-- typically handles the filing, what paperwork it needs), so they live on
-- compliance_items alongside penalty / deadline_note from 005.

alter table public.compliance_items
  add column if not exists responsible text;

alter table public.compliance_items
  add column if not exists documents_required text;
