import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/documents/:id — remove a vault document: delete the Storage object
// first, then the metadata row. Uses the caller's session so RLS ("Users delete
// own documents" + the per-folder Storage policy) guarantees they can only touch
// their own. :id is the documents row id.

export const dynamic = "force-dynamic";

const BUCKET = "documents";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the row (scoped to the user) so we know which object to remove.
  const { data: row, error: fetchError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove the object first. If this fails we stop, rather than orphan the file.
  if (row.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([row.storage_path]);
    if (storageError) {
      return NextResponse.json(
        { error: `Could not delete file: ${storageError.message}` },
        { status: 500 },
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
