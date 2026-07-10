-- M3: pgvector, remaining tables, RLS, match_documents
-- Run in Supabase SQL Editor after 001_users.sql

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- compliance_items (master reference data)
-- ---------------------------------------------------------------------------
create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  how_to_apply text,
  mandatory boolean not null default false,
  domain_specific boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.compliance_items enable row level security;

create policy "Authenticated users can read compliance items"
  on public.compliance_items
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- user_compliance (per-founder checklist)
-- ---------------------------------------------------------------------------
create table if not exists public.user_compliance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  compliance_item_id uuid not null references public.compliance_items (id) on delete cascade,
  status text not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'Done')),
  deadline date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, compliance_item_id)
);

alter table public.user_compliance enable row level security;

create policy "Users read own compliance rows"
  on public.user_compliance
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own compliance rows"
  on public.user_compliance
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own compliance rows"
  on public.user_compliance
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own compliance rows"
  on public.user_compliance
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- deadlines (filing dates linked to compliance items)
-- ---------------------------------------------------------------------------
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  compliance_item_id uuid not null references public.compliance_items (id) on delete cascade,
  due_date date not null,
  recurrence text,
  penalty_description text,
  created_at timestamptz not null default now()
);

alter table public.deadlines enable row level security;

create policy "Authenticated users can read deadlines"
  on public.deadlines
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- documents (vault uploads)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  doc_type text,
  expiry_date date,
  uploaded_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users read own documents"
  on public.documents
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own documents"
  on public.documents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own documents"
  on public.documents
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users delete own documents"
  on public.documents
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- embeddings (RAG vector store)
-- ---------------------------------------------------------------------------
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(384),
  metadata jsonb default '{}'::jsonb,
  chunk_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.embeddings enable row level security;

create policy "Authenticated users can read embeddings"
  on public.embeddings
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- notifications (alert history)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  message text not null,
  sent_at timestamptz not null default now(),
  compliance_item_id uuid references public.compliance_items (id) on delete set null
);

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- match_documents — cosine similarity search for RAG retrieval
-- ---------------------------------------------------------------------------
create or replace function public.match_documents(
  query_embedding vector(384),
  match_count integer default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  chunk_index integer,
  similarity float
)
language sql
stable
as $$
  select
    e.id,
    e.content,
    e.metadata,
    e.chunk_index,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  where e.embedding is not null
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Seed one reference compliance item for testing
-- ---------------------------------------------------------------------------
insert into public.compliance_items (name, category, description, mandatory)
select
  'GSTIN Registration',
  'Core',
  'Goods and Services Tax identification for businesses above turnover threshold.',
  true
where not exists (
  select 1 from public.compliance_items where name = 'GSTIN Registration'
);
