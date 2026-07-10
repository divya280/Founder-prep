import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ComplianceStatus } from "@/types/compliance";

// PATCH /api/compliance/:id  — update a single checklist row's status.
// :id is the user_compliance row id. Uses the caller's session so RLS
// ("Users update own compliance rows") guarantees they can only touch their own.

export const dynamic = "force-dynamic";

const VALID_STATUSES: ComplianceStatus[] = ["Not Started", "In Progress", "Done"];

export async function PATCH(
  request: NextRequest,
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

  let status: unknown;
  try {
    const body = (await request.json()) as { status?: unknown };
    status = body.status;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    typeof status !== "string" ||
    !VALID_STATUSES.includes(status as ComplianceStatus)
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("user_compliance")
    .update({
      status,
      completed_at: status === "Done" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id) // belt-and-suspenders alongside RLS
    .select("id, status, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
