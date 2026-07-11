import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDeadlineEmail, sendDocumentExpiryEmail } from "@/lib/email/resend";
import { daysUntil, toDateKey } from "@/lib/compliance/deadlines";
import { EXPIRY_ALERT_WINDOWS } from "@/lib/documents/expiry";

// M8/M9 — daily alert job. Meant to be hit once a day by a scheduler (Vercel
// Cron or Supabase pg_cron). Two passes, both emailing via Resend and recording
// a deduped notification (one per subject+window+day):
//   • M8 deadlines — checklist items due in 7 / 1 / 0 days that aren't Done.
//   • M9 documents — vault documents expiring in 30 / 7 / 1 / 0 days.
//
//   GET or POST /api/cron/check-deadlines
//   Auth: header  x-cron-secret: <CRON_SECRET>   (or Authorization: Bearer <CRON_SECRET>)
//   ?dryRun=1  → compute + report, but don't send emails or write notifications.
//
// Vercel Cron (see vercel.json) invokes this with a GET and automatically adds
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project's
// env — which the Bearer check below accepts. Both verbs share one handler.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Alert windows, in days before the due date.
const ALERT_WINDOWS = [7, 1, 0];

interface CandidateRow {
  id: string;
  deadline: string | null;
  user_id: string;
  compliance_item_id: string;
  users: { email: string | null; name: string | null } | null;
  compliance_items: { name: string; penalty: string | null } | null;
}

interface DocRow {
  id: string;
  expiry_date: string | null;
  user_id: string;
  file_name: string;
  users: { email: string | null; name: string | null } | null;
}

interface Tally {
  sent: number;
  skippedDuplicate: number;
  skippedNoEmail: number;
  failed: number;
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === expected || bearer === expected;
}

async function run(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const admin = createAdminClient();
  const now = new Date();

  // Target due-dates: today + each alert window.
  const targetDates = ALERT_WINDOWS.map((d) => {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    return toDateKey(dt);
  });

  // 1. Pull checklist items due on those dates that aren't done yet.
  const { data, error } = await admin
    .from("user_compliance")
    .select(
      "id, deadline, user_id, compliance_item_id, users ( email, name ), compliance_items ( name, penalty )",
    )
    .in("deadline", targetDates)
    .neq("status", "Done");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const candidates = (data ?? []) as unknown as CandidateRow[];

  // 2. Load today's already-sent alerts to dedupe (one per subject+window+day).
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const { data: sentToday } = await admin
    .from("notifications")
    .select("user_id, compliance_item_id, document_id, type")
    .gte("sent_at", startOfToday);
  const alreadySent = new Set(
    (sentToday ?? []).map(
      (n) => `${n.user_id}|${n.compliance_item_id}|${n.type}`,
    ),
  );
  const docAlreadySent = new Set(
    (sentToday ?? [])
      .filter((n) => n.document_id)
      .map((n) => `${n.user_id}|${n.document_id}|${n.type}`),
  );

  let sent = 0;
  let skippedDuplicate = 0;
  let skippedNoEmail = 0;
  let failed = 0;

  for (const row of candidates) {
    if (!row.deadline || !row.compliance_items) continue;
    const daysOut = daysUntil(row.deadline, now);
    const type = `deadline-${daysOut}d`;
    const key = `${row.user_id}|${row.compliance_item_id}|${type}`;

    if (alreadySent.has(key)) {
      skippedDuplicate += 1;
      continue;
    }
    const email = row.users?.email;
    if (!email) {
      skippedNoEmail += 1;
      continue;
    }

    if (dryRun) {
      sent += 1; // "would send"
      continue;
    }

    const result = await sendDeadlineEmail({
      to: email,
      founderName: row.users?.name ?? "",
      itemName: row.compliance_items.name,
      dueDate: row.deadline,
      daysOut,
      penalty: row.compliance_items.penalty,
    });

    if (!result.ok) {
      failed += 1;
      continue;
    }

    const { error: notifyError } = await admin.from("notifications").insert({
      user_id: row.user_id,
      type,
      message: `Reminder sent: ${row.compliance_items.name} due ${row.deadline} (${daysOut}d).`,
      compliance_item_id: row.compliance_item_id,
    });
    if (notifyError) {
      failed += 1;
      continue;
    }
    alreadySent.add(key);
    sent += 1;
  }

  // 3. M9 — vault documents expiring within the expiry windows.
  const docTargetDates = EXPIRY_ALERT_WINDOWS.map((d) => {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    return toDateKey(dt);
  });

  const { data: docData, error: docError } = await admin
    .from("documents")
    .select("id, expiry_date, user_id, file_name, users ( email, name )")
    .in("expiry_date", docTargetDates);

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }
  const docCandidates = (docData ?? []) as unknown as DocRow[];

  const docs: Tally = {
    sent: 0,
    skippedDuplicate: 0,
    skippedNoEmail: 0,
    failed: 0,
  };

  for (const row of docCandidates) {
    if (!row.expiry_date) continue;
    const daysOut = daysUntil(row.expiry_date, now);
    const type = `doc-expiry-${daysOut}d`;
    const key = `${row.user_id}|${row.id}|${type}`;

    if (docAlreadySent.has(key)) {
      docs.skippedDuplicate += 1;
      continue;
    }
    const email = row.users?.email;
    if (!email) {
      docs.skippedNoEmail += 1;
      continue;
    }

    if (dryRun) {
      docs.sent += 1; // "would send"
      continue;
    }

    const result = await sendDocumentExpiryEmail({
      to: email,
      founderName: row.users?.name ?? "",
      documentName: row.file_name,
      expiryDate: row.expiry_date,
      daysOut,
    });

    if (!result.ok) {
      docs.failed += 1;
      continue;
    }

    const { error: notifyError } = await admin.from("notifications").insert({
      user_id: row.user_id,
      type,
      message: `Reminder sent: ${row.file_name} expires ${row.expiry_date} (${daysOut}d).`,
      document_id: row.id,
    });
    if (notifyError) {
      docs.failed += 1;
      continue;
    }
    docAlreadySent.add(key);
    docs.sent += 1;
  }

  return NextResponse.json({
    dryRun,
    deadlines: {
      targetDates,
      candidates: candidates.length,
      sent,
      skippedDuplicate,
      skippedNoEmail,
      failed,
    },
    documents: {
      targetDates: docTargetDates,
      candidates: docCandidates.length,
      ...docs,
    },
  });
}

// Vercel Cron uses GET; manual/dry-run triggers may use either.
export const GET = run;
export const POST = run;
