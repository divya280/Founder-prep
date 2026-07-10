-- M6: item-level fields the checklist card needs + idempotent generation.
-- Run in Supabase SQL Editor after 002_schema.sql.
--
-- penalty / deadline_note are properties of the compliance item itself (e.g.
-- "GST late-filing penalty is ₹50/day"), so they live on compliance_items — not
-- on the per-user user_compliance row and not (yet) on the date-specific
-- deadlines table (that's M8). unique(name) lets generation upsert the shared
-- master item by name instead of creating a duplicate per founder.

alter table public.compliance_items
  add column if not exists penalty text;

alter table public.compliance_items
  add column if not exists deadline_note text;

-- Idempotent master data: one row per named registration/filing.
alter table public.compliance_items
  drop constraint if exists compliance_items_name_key;
alter table public.compliance_items
  add constraint compliance_items_name_key unique (name);
