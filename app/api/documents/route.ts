import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDocumentSchema } from "@/lib/validations/documents";
import type { VaultDocument } from "@/types/documents";

// M9 — document vault metadata API.
//
//   GET  /api/documents  → the caller's documents, newest first, each with a
//                          short-lived signed download URL.
//   POST /api/documents  → record metadata for a file the browser has ALREADY
//                          uploaded to the `documents` Storage bucket.
//
// The file bytes never pass through this route; the browser uploads straight to
// Storage (RLS-scoped to its own folder) and then calls POST to save the row.

export const dynamic = "force-dynamic";

const BUCKET = "documents";
const SIGNED_URL_TTL = 60 * 10; // 10 minutes

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, file_name, doc_type, issue_date, expiry_date, file_size, mime_type, uploaded_at, storage_path",
    )
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const paths = rows
    .map((r) => r.storage_path)
    .filter((p): p is string => !!p);

  // Sign all download URLs in one round-trip, then map back by path.
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const documents: VaultDocument[] = rows.map((r) => ({
    id: r.id,
    file_name: r.file_name,
    doc_type: r.doc_type,
    issue_date: r.issue_date,
    expiry_date: r.expiry_date,
    file_size: r.file_size,
    mime_type: r.mime_type,
    uploaded_at: r.uploaded_at,
    download_url: r.storage_path
      ? (signedByPath.get(r.storage_path) ?? null)
      : null,
  }));

  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = createDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid document" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // The storage object must live in the caller's own folder — the browser
  // uploaded it there under RLS, but re-check so a forged path can't attach
  // someone else's object to this user's row.
  if (!input.storage_path.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "storage_path must be within your own folder" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      file_name: input.file_name,
      storage_path: input.storage_path,
      doc_type: input.doc_type,
      issue_date: input.issue_date,
      expiry_date: input.expiry_date,
      file_size: input.file_size,
      mime_type: input.mime_type,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
