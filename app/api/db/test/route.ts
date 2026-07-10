import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MatchedDocument } from "@/types/compliance";

const TEST_EMBEDDING_CONTENT = "FounderPrep M3 schema test chunk";

function buildTestVector(seed: number): number[] {
  return Array.from({ length: 384 }, (_, index) =>
    index === 0 ? seed : 0,
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message, hint: "Run supabase/migrations/001_users.sql" },
      { status: 500 },
    );
  }

  const { data: complianceItems, error: itemsError } = await supabase
    .from("compliance_items")
    .select("id, name, category, mandatory")
    .limit(5);

  if (itemsError) {
    return NextResponse.json(
      {
        error: itemsError.message,
        hint: "Run supabase/migrations/002_schema.sql",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: profile,
    complianceItems,
    tablesVerified: [
      "users",
      "compliance_items",
    ],
  });
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local",
      },
      { status: 500 },
    );
  }

  const testVector = buildTestVector(1);
  const queryVector = buildTestVector(1);

  const { data: inserted, error: insertError } = await admin
    .from("embeddings")
    .insert({
      content: TEST_EMBEDDING_CONTENT,
      embedding: JSON.stringify(testVector),
      metadata: { source: "m3-test", userId: user.id },
      chunk_index: 0,
    })
    .select("id, content, chunk_index")
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        error: insertError.message,
        hint: "Run supabase/migrations/002_schema.sql and enable pgvector",
      },
      { status: 500 },
    );
  }

  const { data: matches, error: matchError } = await supabase.rpc(
    "match_documents",
    {
      query_embedding: JSON.stringify(queryVector),
      match_count: 3,
    },
  );

  if (matchError) {
    await admin.from("embeddings").delete().eq("id", inserted.id);
    return NextResponse.json(
      {
        error: matchError.message,
        hint: "Ensure match_documents function exists (002_schema.sql)",
      },
      { status: 500 },
    );
  }

  await admin.from("embeddings").delete().eq("id", inserted.id);

  const matchedDocuments = (matches ?? []) as MatchedDocument[];
  const topMatch = matchedDocuments.find(
    (match) => match.content === TEST_EMBEDDING_CONTENT,
  );

  return NextResponse.json({
    ok: true,
    inserted,
    matchCount: matchedDocuments.length,
    topMatch: topMatch ?? null,
    vectorSearchWorking: Boolean(topMatch),
  });
}
