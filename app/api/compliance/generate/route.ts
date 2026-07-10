import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieve } from "@/lib/rag/retrieve";
import {
  toComplianceProfile,
  buildComplianceQuery,
} from "@/lib/compliance/query";
import { generateChecklist } from "@/lib/compliance/generate";
import { CHECKLIST_CONTEXT_CHUNKS } from "@/lib/groq/config";
import type { ChecklistEntry, ComplianceItem, ComplianceStatus } from "@/types/compliance";
import type { UserProfile } from "@/types/user";

// M6 — the compliance checklist engine.
//   POST /api/compliance/generate  → profile → retrieve → Groq → validate →
//                                     persist → return the founder's checklist
//   GET  /api/compliance/generate  → return the already-saved checklist
//
// Auth is enforced with the user's session; DB writes use the service-role
// admin client because compliance_items is shared master data (no per-user
// insert policy).

export const runtime = "nodejs"; // Groq SDK + retrieval; not edge
export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Load the founder's checklist (status joined with the item content). */
async function loadChecklist(
  admin: AdminClient,
  userId: string,
): Promise<ChecklistEntry[]> {
  const { data, error } = await admin
    .from("user_compliance")
    .select(
      "id, status, deadline, compliance_items ( id, name, category, description, how_to_apply, mandatory, domain_specific, penalty, deadline_note, created_at )",
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load checklist: ${error.message}`);
  }

  const entries: ChecklistEntry[] = (data ?? [])
    .map((row) => {
      // The FK embed comes back as an object (or null if the item vanished).
      const item = row.compliance_items as unknown as ComplianceItem | null;
      if (!item) return null;
      return {
        userComplianceId: row.id,
        status: row.status as ComplianceStatus,
        deadline: row.deadline,
        item,
      } satisfies ChecklistEntry;
    })
    .filter((entry): entry is ChecklistEntry => entry !== null);

  // Mandatory first, then by category and name — deterministic display order.
  entries.sort(
    (a, b) =>
      Number(b.item.mandatory) - Number(a.item.mandatory) ||
      a.item.category.localeCompare(b.item.category) ||
      a.item.name.localeCompare(b.item.name),
  );
  return entries;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const checklist = await loadChecklist(createAdminClient(), user.id);
    return NextResponse.json({ count: checklist.length, checklist });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load checklist" },
      { status: 500 },
    );
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Load + validate the founder profile.
  const { data: profileRow, error: profileError } = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError || !profileRow) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = toComplianceProfile(profileRow as UserProfile);
  if (!profile) {
    return NextResponse.json(
      { error: "Complete onboarding before generating a checklist" },
      { status: 400 },
    );
  }

  try {
    // 2. Retrieve grounding context, 3. generate + validate.
    const query = buildComplianceQuery(profile);
    const chunks = await retrieve(query, { topK: CHECKLIST_CONTEXT_CHUNKS });
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Knowledge base is empty — run ingestion first" },
        { status: 503 },
      );
    }

    const generated = await generateChecklist(profile, chunks);

    // 4. Upsert the shared master items (idempotent by name), get their ids.
    const itemRows = generated.items.map((it) => ({
      name: it.name,
      category: it.category,
      description: it.why_needed,
      how_to_apply: it.how_to_apply,
      mandatory: it.necessity === "mandatory",
      domain_specific: /sector|licen[cs]e/i.test(it.category),
      penalty: it.penalty || null,
      deadline_note: it.deadline_note || null,
    }));

    const { data: upserted, error: itemsError } = await admin
      .from("compliance_items")
      .upsert(itemRows, { onConflict: "name" })
      .select("id, name");
    if (itemsError || !upserted) {
      throw new Error(`Persisting items failed: ${itemsError?.message ?? "unknown"}`);
    }

    // 5. Link to the founder — preserve any existing status on regeneration.
    const linkRows = upserted.map((row) => ({
      user_id: user.id,
      compliance_item_id: row.id,
      status: "Not Started",
    }));
    const { error: linkError } = await admin
      .from("user_compliance")
      .upsert(linkRows, {
        onConflict: "user_id,compliance_item_id",
        ignoreDuplicates: true,
      });
    if (linkError) {
      throw new Error(`Linking checklist failed: ${linkError.message}`);
    }

    const checklist = await loadChecklist(admin, user.id);
    return NextResponse.json({
      count: checklist.length,
      checklist,
      disclaimer: generated.disclaimer ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checklist generation failed",
      },
      { status: 500 },
    );
  }
}
