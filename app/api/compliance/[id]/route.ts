import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ComplianceStatus } from "@/types/compliance";

// PATCH /api/compliance/:id  — update a single checklist row's status.
// :id is the user_compliance row id. Uses the caller's session so RLS
// ("Users update own compliance rows") guarantees they can only touch their own.

export const dynamic = "force-dynamic";

const VALID_STATUSES: ComplianceStatus[] = ["Not Started", "In Progress", "Done"];

/** Strict YYYY-MM-DD check, and that it's a real calendar date. */
function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

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

  let body: { status?: unknown; deadline?: unknown };
  try {
    body = (await request.json()) as { status?: unknown; deadline?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: {
    status?: ComplianceStatus;
    completed_at?: string | null;
    deadline?: string | null;
  } = {};

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !VALID_STATUSES.includes(body.status as ComplianceStatus)
    ) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    update.status = body.status as ComplianceStatus;
    update.completed_at = body.status === "Done" ? new Date().toISOString() : null;
  }

  if (body.deadline !== undefined) {
    // Accept a YYYY-MM-DD date string, or null to clear it.
    if (body.deadline !== null && !isDateString(body.deadline)) {
      return NextResponse.json(
        { error: "deadline must be a YYYY-MM-DD string or null" },
        { status: 400 },
      );
    }
    update.deadline = body.deadline as string | null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Provide status and/or deadline" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("user_compliance")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id) // belt-and-suspenders alongside RLS
    .select("id, status, deadline, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
