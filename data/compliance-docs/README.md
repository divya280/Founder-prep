# Compliance docs — starter knowledge base

These 7 files cover all 8 items from the spec (DPIIT recognition and
Startup India registration are the same certification, so they're merged
into one doc rather than duplicated — see the file's opening section).

Drop this whole folder into `data/compliance-docs/` and point M4's
`lib/rag/ingest.ts` at it.

## What's here

| File | Covers |
|---|---|
| `dpiit-startup-india-recognition.md` | DPIIT recognition + Startup India |
| `gst-registration.md` | GST |
| `mca-roc-annual-filing.md` | MCA/ROC filing |
| `msme-udyam-registration.md` | MSME/Udyam |
| `pf-esi-registration.md` | PF/ESI |
| `fssai-license.md` | FSSAI (domain: food) |
| `nbfc-registration.md` | NBFC (domain: fintech/lending) |
| `trademark-registration.md` | Trademark |

## Format

Each file has YAML frontmatter (`title`, `category`, `jurisdiction`,
`mandatory`, `domain_specific`, `last_updated`, `sources`, `disclaimer`) —
your ingestion script should parse this into the `metadata` column
alongside the embedded chunks, so retrieval can filter/boost by category
and the generation step can surface `last_updated` and `disclaimer` in the
UI per source.

## Honesty flags — read before treating this as "done"

Three files carry an extra warning worth taking seriously rather than
ingesting silently:

- **`msme-udyam-registration.md`** — sources disagreed on whether MSME
  classification is still composite (investment + turnover) or has moved
  to turnover-only. I went with the more corroborated composite model and
  flagged the disagreement in the doc itself.
- **`nbfc-registration.md`** — sources split between ₹2 crore and ₹10 crore
  as the minimum Net Owned Fund. I went with ₹10 crore (more corroborated,
  more recent) but explicitly flagged it as needing direct RBI Master
  Direction verification, since this is the one area here with real
  legal-operability stakes if wrong.
- **`fssai-license.md`** — thresholds changed via an order effective
  1 April 2026, which is very recent — I noted the pre-2026-04-01 figures
  too in case a filing predates that.

None of this blocks the pipeline from working — it just means the RAG
answers for those three specific topics should visibly carry more caveat
weight than the others, and are good first candidates to replace with an
actual primary-source PDF (RBI Master Direction, Udyam gazette notification)
once you have bandwidth.

## Recommended next step, not done here

Every file's `sources` field only has 2 links each to keep this
deliverable moving — before this goes near real users, each doc should
carry links to the *actual* primary government source (startupindia.gov.in,
gst.gov.in, mca.gov.in, udyamregistration.gov.in, epfindia.gov.in,
foscos.fssai.gov.in, rbi.org.in, ipindia.gov.in) so the AI assistant's
"cited sources" feature points founders somewhere authoritative, not back
to a filing-service blog.
