import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestAll } from "@/lib/rag/ingest";

// Manual, secret-guarded re-ingestion trigger. NOT public and NOT on a cron:
// ingesting the whole corpus spends embedding-API calls and rewrites the vector
// store, so it must be an explicit, authenticated action.
//
// POST /api/ingest   -> run ingestion (optional { "force": true } body)
// GET  /api/ingest   -> read recent ingestion runs (for debugging stale answers)
//
// Both require header:  x-ingest-secret: <INGEST_SECRET>

export const runtime = "nodejs"; // needs fs + pdf-parse; not edge-compatible
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    return false; // fail closed if the secret isn't configured
  }
  const provided = request.headers.get("x-ingest-secret");
  return Boolean(provided) && provided === expected;
}

export async function POST(request: NextRequest) {
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json(
      { error: "INGEST_SECRET is not configured on the server" },
      { status: 500 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let force = false;
  try {
    const body = (await request.json()) as { force?: boolean } | null;
    force = body?.force === true;
  } catch {
    // no/invalid body — default to force=false
  }

  try {
    const result = await ingestAll({ trigger: "api", force });
    const httpStatus = result.status === "failed" ? 500 : 200;
    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ingestion failed unexpectedly",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: runs, error } = await admin
    .from("ingestion_runs")
    .select(
      "id, status, trigger, file_count, file_success_count, chunk_count, error, started_at, finished_at",
    )
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: docs } = await admin
    .from("rag_documents")
    .select("source_file, title, chunk_count, last_updated, last_ingested_at")
    .order("source_file");

  return NextResponse.json({ runs: runs ?? [], documents: docs ?? [] });
}
