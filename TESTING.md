# FounderPrep — Migrations & Test Checklist

Everything through **M10** is built. This doc is what you need to get the app
running end-to-end locally and verify M6–M10. Work top to bottom.

---

## 1. Apply database migrations

Run these in the **Supabase SQL Editor**, in order. 001–004 are already applied;
**005, 006 and 007 are the ones still pending.**

| # | File | Adds | Applied? |
|---|------|------|----------|
| 001 | `supabase/migrations/001_users.sql` | `users` table | ✅ |
| 002 | `supabase/migrations/002_schema.sql` | core tables, RLS, `match_documents` | ✅ |
| 003 | `supabase/migrations/003_rag.sql` | RAG ingestion tables | ✅ |
| 004 | `supabase/migrations/004_revenue.sql` | `users.revenue` | ✅ |
| 005 | `supabase/migrations/005_compliance_fields.sql` | `compliance_items.penalty` + `.deadline_note` + `unique(name)` | ⬜ **apply** |
| 006 | `supabase/migrations/006_documents_vault.sql` | vault columns, **Storage bucket + policies**, `vault_shares`, `notifications.document_id` | ⬜ **apply** |
| 007 | `supabase/migrations/007_item_detail_fields.sql` | `compliance_items.responsible` + `.documents_required` (item detail view) | ⬜ **apply** |
| 008 | `supabase/migrations/008_users_signup_fix.sql` | reinstall signup trigger, backfill missing `users` rows, insert-own-row policy | ⬜ **apply** |

> Without **005**, `POST /api/compliance/generate` (M6) fails on the upsert.
> Without **006**, the entire vault (M9) fails — the `documents` Storage bucket
> and its access policies are created here.
> Without **007**, checklist generation fails on the upsert (unknown columns)
> and the item detail modal has no "who's responsible" / "documents required".
> Without **008**, signups get no `users` row (the 001 trigger is missing from
> this project), so every login loops back to onboarding and nothing saves.
> The existing account has already been backfilled directly; 008 makes the fix
> permanent for future signups.

**After running 006, confirm** in the Supabase dashboard:
- **Storage** → a private bucket named `documents` exists.
- **Storage → Policies** → four `Vault ... own objects` policies on `storage.objects`.

---

## 2. Environment variables (`.env.local`)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC_

# LLM (M6, M7)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile   # optional; this is the default

# Embeddings (M4 retrieval)
HUGGINGFACE_API_KEY=

# Ingestion route guard (M4)
INGEST_SECRET=

# Email + alert cron (M8, M9)
RESEND_API_KEY=
EMAIL_FROM=                       # optional; defaults to onboarding@resend.dev
CRON_SECRET=                      # any strong random string
```

Notes:
- **Resend**: until you verify a domain, the default `onboarding@resend.dev`
  sender only delivers to the email on your Resend account — fine for testing.
- **CRON_SECRET**: needed only to exercise the alert cron (below).

---

## 3. Run

```bash
npm run dev      # http://localhost:3000
```

---

## 4. End-to-end test checklist (M6 → M10)

Do these in order — each milestone builds on the previous.

### Auth + onboarding (M2, M5)
- [ ] Register a new account, confirm you land on `/onboarding`.
- [ ] Complete the 4-step wizard; you're redirected to `/dashboard`.
- [ ] Profile card on the dashboard shows readable labels.

### Returning-user flow (M2 + M5 + M6)
- [ ] **Login, onboarded**: log out, log back in → straight to `/dashboard`,
      no onboarding, checklist loads with the statuses you left (no regeneration).
- [ ] **Resume onboarding**: register a fresh account, answer steps 1–2, then
      close the tab. Log in again → you land on `/onboarding` **at step 3**,
      with steps 1–2 pre-filled.
- [ ] **Session persistence**: close and reopen the browser → still signed in;
      **Log out** → back at `/login`, and `/dashboard` now redirects to login.
- [ ] **Edit profile**: dashboard → profile **Edit** → wizard opens pre-filled at
      step 1. Change a field, **Save changes** → dashboard shows the amber
      "profile has changed" banner; the checklist itself is unchanged until you
      explicitly hit **Regenerate** (which asks for confirmation).
- [ ] **Regenerate keeps progress**: confirm the regenerate dialog → statuses
      and deadlines you set earlier are still there; new items may be added.
- [ ] **Item detail view**: click a checklist card's title → modal with why
      it's required, who's responsible, documents required, how to apply,
      timeframe, penalty, and your deadline. Escape / backdrop / ✕ closes it.
      *(Items generated before migration 007 show a "regenerate to fill in"
      hint for the two new fields.)*

### M6 — Compliance checklist
- [ ] On the dashboard, click **Generate my roadmap**. A success toast appears.
- [ ] Items render with name/category/why/how/penalty/deadline and a Mandatory badge where relevant.
- [ ] Change an item's status → the progress bar + score update. Reload → it persisted.
- [ ] Use the filter bar (All / Not Started / In Progress / Done).

### M7 — AI assistant
- [ ] Open **AI Assistant**. Ask an in-scope question (e.g. *"Do I need GST registration?"*) → grounded answer **with a source chip**.
- [ ] Ask an out-of-scope question (e.g. *"What's a good marketing plan?"*) → graceful "not enough information", **no invented citation**.

### M8 — Deadline calendar & alerts
- [ ] Dashboard **Next deadlines** widget lists upcoming items; overdue/this-month counts look right.
- [ ] Open **Calendar** → month grid with red/amber/green dots; prev/next/Today nav works.
- [ ] Cron dry-run (no emails sent):
  ```bash
  curl -X POST "http://localhost:3000/api/cron/check-deadlines?dryRun=1" \
    -H "x-cron-secret: <CRON_SECRET>"
  ```
  Expect JSON with `deadlines` + `documents` blocks and candidate counts.
  *(The real daily send only runs on Vercel — Cron is production-only.)*

### M9 — Document vault
- [ ] Open **Vault**. Drag-and-drop (or browse) a PDF/image; set a type + expiry date; **Upload** → success toast, card appears in the grid.
- [ ] Try a >10 MB file or an unsupported type → blocked with a clear message.
- [ ] **Download** from a card opens the file (signed URL).
- [ ] Set an expiry within 30 days → the card shows an amber/red expiry badge.
- [ ] **Create share link**, open it in an incognito window (`/shared/<token>`) → read-only grid, downloads work, **no delete buttons**.
- [ ] **Revoke** the link → the incognito page now shows "Link unavailable".
- [ ] **Delete** a document → it disappears and the Storage object is removed.

### M10 — Dashboard & polish
- [ ] Compliance score + next-5-deadlines + quick-action cards render on the dashboard.
- [ ] Loading states show skeletons (throttle the network in dev tools to see them).
- [ ] Actions fire toasts (upload, delete, status change, share copy).
- [ ] Resize to a narrow/mobile width → header wraps, grids reflow, nothing overflows.
- [ ] Empty states read well (e.g. a fresh account before generating a roadmap).

---

## 5. Known non-local behavior
- **Alert emails** (M8 deadlines, M9 expiry) only send on a schedule via **Vercel
  Cron** (`vercel.json`, daily `0 2 * * *` UTC) once deployed with `CRON_SECRET`
  set in the Vercel project. Locally, use the `?dryRun=1` curl above.

## 6. Next milestone
- **M11 — Deploy & Launch**: push to GitHub, connect Vercel, set all env vars in
  the Vercel project, point at a production Supabase project (apply migrations
  001–008 there too), then run this checklist against the production URL.
