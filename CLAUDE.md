# CLAUDE.md — FounderPrep

This file is the persistent project brief for any AI coding agent (Claude Code, Cursor, etc.) working in this repo. Read this before writing any code. Follow it over your own defaults when the two conflict.

## What we're building

FounderPrep is an AI-powered compliance and setup platform for first-time Indian startup founders. A founder submits a profile (business type, domain, state, team size, funding stage) and the platform uses a Retrieval-Augmented Generation (RAG) pipeline to generate a personalized, cited compliance roadmap — what registrations they need, in what order, by when, and what the penalties are for missing them.

RAG is not a chatbot bolt-on here — it is the core engine behind the checklist, the AI assistant, and the infra recommendations. Every generated answer must be grounded in retrieved chunks, never hallucinated.

Full context, problem statement, feature list, business model, and future roadmap are in `docs/founderprep-spec.md` (copy the original project doc there). This CLAUDE.md is the buildable subset: stack, structure, schema, conventions, and milestones.

## Tech stack (locked)

- **Frontend/Backend**: Next.js 14+, App Router, **TypeScript** (strict mode), Tailwind CSS, ESLint
- **Database**: Supabase (PostgreSQL) — Auth, Storage, Edge Functions
- **Vector store**: Supabase pgvector (no separate vector DB)
- **Embeddings**: HuggingFace Inference API — `sentence-transformers/all-MiniLM-L6-v2` (384 dims)
- **LLM**: Groq API — Llama 3.2, free tier
- **Email**: Resend
- **Deployment**: Vercel (frontend) + Supabase (backend)

Do not substitute these unless explicitly asked — the whole plan (schema dimensions, milestone order, cost model) assumes this exact stack. The stack is swap-friendly *later* (e.g. Groq → Claude/OpenAI is a 2-line change in `lib/groq/client.ts`), but don't swap preemptively.

## TypeScript conventions

- Strict mode on (`"strict": true` in `tsconfig.json`). No `any` — use `unknown` + narrowing, or proper interfaces.
- Define shared types in `types/` (e.g. `types/compliance.ts`, `types/user.ts`) and import them everywhere rather than redefining inline shapes.
- All API route handlers (`route.ts`) type their request body and response JSON explicitly.
- Supabase: generate types with `supabase gen types typescript` into `types/supabase.ts` and use the typed client (`createClient<Database>()`), not the untyped one.
- Zod (or similar) for runtime validation of anything crossing a trust boundary: onboarding form submission, API route bodies, Groq's JSON output before it hits the DB.

## Folder structure

```
app/
  **/page.tsx              # frontend pages
  api/**/route.ts           # backend API routes (server-side only)
components/                # reusable UI components
lib/
  supabase/                 # browser + server Supabase clients (typed)
  rag/
    embed.ts                # HuggingFace embedding calls
    ingest.ts                # chunking + vector DB population
    retrieve.ts              # query -> top-K chunks
  groq/
    client.ts                # Groq LLM calls + prompt construction
types/                      # shared TS types, incl. generated Supabase types
data/compliance-docs/        # raw compliance PDFs/text — the RAG knowledge base
.env.local                  # secrets — never imported into client components
```

## Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never NEXT_PUBLIC_
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
RESEND_API_KEY=
```
Never reference server-only keys in a client component. If a value needs `NEXT_PUBLIC_`, treat it as public.

## Database schema (Supabase / Postgres)

| Table | Purpose & key fields |
|---|---|
| `users` | Founder profile — id, email, name, business_type, domain, state, team_size, funding_stage, created_at |
| `compliance_items` | Master list of certifications — id, name, category, description, how_to_apply, mandatory, domain_specific |
| `user_compliance` | Per-founder checklist — id, user_id, compliance_item_id, status, deadline, completed_at |
| `deadlines` | Filing dates — id, compliance_item_id, due_date, recurrence, penalty_description |
| `documents` | Vault uploads — id, user_id, file_name, file_url, doc_type, expiry_date, uploaded_at |
| `embeddings` | RAG vector store — id, content, embedding (vector(384)), metadata, chunk_index |
| `notifications` | Alert history — id, user_id, type, message, sent_at, compliance_item_id |

Enable Row Level Security on every table — founders can only read/write their own rows. Enable `pgvector` extension. Create a `match_documents` SQL function (cosine similarity, top-K) for retrieval.

## RAG pipeline — request flow

1. Founder completes onboarding → profile saved to `users`.
2. Frontend POSTs to `/api/compliance/generate`.
3. Route builds a compliance query string from the profile.
4. `lib/rag/embed.ts` calls HuggingFace to embed the query.
5. `lib/rag/retrieve.ts` runs `match_documents` against `embeddings`, returns top-5 chunks.
6. Route sends `{ query, chunks }` to `lib/groq/client.ts`.
7. Groq generates a **structured JSON** checklist, grounded only in retrieved context — validate the shape with Zod before trusting it.
8. Result returned to frontend, rendered as interactive UI, and persisted to `user_compliance`.

Same retrieve → generate pattern powers `/api/rag/query` (AI assistant) — system prompt must instruct the model to answer only from provided context and say "I don't have enough information" rather than hallucinate. Cite which source document each answer came from.

## Build milestones — work through these in order

Do not skip ahead. Each milestone should be a working, demoable state before moving to the next. Treat the checklist under each milestone as your Definition of Done.

**M1 — Project Foundation** (Day 1)
- Next.js 14 App Router + TypeScript + Tailwind + ESLint scaffolded
- Folder structure above created
- Packages installed: `@supabase/supabase-js`, `groq-sdk`, `@huggingface/inference`, `langchain`, `pdf-parse`, `resend`, `date-fns`, `zod`
- Supabase + Groq + HuggingFace accounts created, keys in `.env.local`
- `npm run dev` clean at localhost:3000

**M2 — Authentication** (Day 2–3)
- Supabase Auth, email/password
- Register / login pages, protected route middleware, session persistence, logout
- `users` row created on registration

**M3 — Database Schema** (Day 4)
- pgvector enabled, all 7 tables created, RLS policies set
- `match_documents` function created and tested
- Test insert/fetch from a Next.js API route

**M4 — RAG Knowledge Base** (Day 5–7)
- Compliance docs collected into `data/compliance-docs/` (DPIIT, GST, MCA, Startup India, MSME, PF/ESI, domain licenses)
- `lib/rag/ingest.ts`: read → chunk (with overlap) → embed → store with metadata
- `lib/rag/retrieve.ts`: embed query → similarity search → top-5 chunks
- `POST /api/ingest` route to trigger re-ingestion
- Test query returns relevant, correct chunks

**M5 — Founder Onboarding** (Day 8–9)
- 4-step form (business type → domain → state → team/funding/revenue), step indicator, state preserved across steps
- Profile saved to `users`, redirect to dashboard on completion

**M6 — Compliance Checklist** (Day 10–13)
- `POST /api/compliance/generate` — full RAG flow above
- Checklist saved to `user_compliance`, initial status `Not Started`
- Card UI: name, category, why needed, how to apply, deadline, penalty
- Status toggle (Not Started / In Progress / Done), filter bar, progress indicator

**M7 — AI Assistant** (Day 14–16)
- Chat UI, `POST /api/rag/query`
- Context-only system prompt, cited sources, graceful "not enough info" fallback
- Example questions on empty state; chat history in React state for the session

**M8 — Deadline Calendar & Alerts** (Day 17–19)
- `deadlines` populated, monthly calendar view, red/yellow/green coding
- Dashboard "X filings due this month" widget
- Resend integration; Supabase Edge Function (`check-deadlines`) on daily cron: alerts at 7 days, 1 day, day-of
- `notifications` row per send

**M9 — Document Vault** (Day 20–21)
- Supabase Storage bucket + access policies, drag-and-drop upload with validation
- Tagging (type, issue date, expiry date), grid view, download
- Expiry alert 30 days out; shareable vault link for CA/co-founder

**M10 — Dashboard & Polish** (Day 22–24)
- Compliance score widget, next-5-deadlines widget, quick actions
- Mobile responsive (Tailwind breakpoints), loading skeletons, toasts, error boundaries, empty states

**M11 — Deploy & Launch** (Day 25)
- GitHub repo pushed, Vercel connected, env vars configured in Vercel
- Production Supabase project, full end-to-end test on production URL

## Known risks — build defensively around these

- **Groq rate limits**: cache responses where reasonable, queue requests under load.
- **Compliance content going stale**: version every ingested doc, store a last-updated date, surface it in the UI.
- **HuggingFace downtime**: cache embeddings after first ingestion so retrieval doesn't hard-depend on live embedding calls for existing content.
- **pgvector at scale**: add an IVFFlat index on the embedding column once the corpus grows.
- **Legal liability**: every checklist/assistant response must carry a visible disclaimer — FounderPrep is a guide, not a substitute for legal/CA advice.

## Working agreement for the agent

- Confirm which milestone we're on before generating large amounts of code; don't jump ahead to M7 features while M3 is still unfinished.
- Every Groq JSON response gets validated (Zod) before it's persisted or rendered — never trust raw LLM output as-is.
- Never put a service-role key or other secret in client-facing code.
- When a milestone's Definition of Done is met, say so explicitly and wait for confirmation before moving to the next milestone, unless told to proceed through several at once.
