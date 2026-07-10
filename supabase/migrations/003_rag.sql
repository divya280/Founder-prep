-- M4: RAG knowledge base — document-level lookup + ingestion run log
-- Run in Supabase SQL Editor after 002_schema.sql
--
-- Why these two tables (not just `embeddings`):
--  * rag_documents  — document-level metadata (source URLs, disclaimer, last_updated)
--    keyed by source file. Keeps the same 2-3 source URLs out of every chunk's
--    metadata; chunks reference the file by name and join here when needed.
--  * ingestion_runs — an audit log of every ingest. When a founder gets a wrong
--    answer months from now, this tells you whether the source doc was stale or
--    whether a given day's ingestion silently failed halfway through.

-- ---------------------------------------------------------------------------
-- rag_documents — one row per source file in data/compliance-docs/
-- ---------------------------------------------------------------------------
create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  source_file text not null unique,          -- filename, the join key from embeddings.metadata->>'source'
  title text not null,
  category text,
  mandatory text,                            -- tri-state from frontmatter: 'true' | 'false' | 'conditional'
  domain_specific boolean not null default false,
  jurisdiction text,
  last_updated date,                         -- surfaced in UI to flag staleness
  disclaimer text,
  sources jsonb not null default '[]'::jsonb, -- document-level source URLs (NOT copied per chunk)
  chunk_count integer not null default 0,
  content_hash text,                         -- lets ingestion skip unchanged files
  last_ingested_at timestamptz,
  last_run_id uuid,
  created_at timestamptz not null default now()
);

alter table public.rag_documents enable row level security;

-- Reference data: any signed-in founder may read (e.g. to show "source: X, updated Y").
-- Writes happen only via the service-role key, which bypasses RLS — so no insert/update policy.
-- (drop-then-create keeps this migration safe to re-run; CREATE POLICY has no IF NOT EXISTS.)
drop policy if exists "Authenticated users can read rag documents" on public.rag_documents;
create policy "Authenticated users can read rag documents"
  on public.rag_documents
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- ingestion_runs — audit log, one row per /api/ingest invocation
-- ---------------------------------------------------------------------------
create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  trigger text,                              -- who/what kicked it off (e.g. 'api', 'manual')
  file_count integer not null default 0,     -- files attempted
  file_success_count integer not null default 0,
  chunk_count integer not null default 0,    -- chunks embedded + stored this run
  files jsonb not null default '[]'::jsonb,  -- per-file: { source, status, chunks, skipped, error }
  error text,                                -- top-level failure message, if the run itself blew up
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.ingestion_runs enable row level security;

create policy "Authenticated users can read ingestion runs"
  on public.ingestion_runs
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Optional: speed up retrieval once the corpus grows (per CLAUDE.md risk note).
-- Skip while the corpus is small (exact scan is fine and more accurate); enable
-- when embeddings row count is in the thousands. Requires data to be present.
-- ---------------------------------------------------------------------------
-- create index if not exists embeddings_embedding_ivfflat
--   on public.embeddings using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);
