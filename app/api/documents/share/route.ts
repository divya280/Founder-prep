import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

// M9 — read-only vault share link ("share with my CA / co-founder").
//
//   GET    /api/documents/share  → the caller's active link (or null)
//   POST   /api/documents/share  → create one, or rotate to a fresh token
//   DELETE /api/documents/share  → revoke sharing
//
// One active (non-revoked) link per founder — enforced by a partial unique index
// (see migration 006). The public page at /shared/<token> resolves the token via
// the admin client, so no anon read policy on vault_shares is needed.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shareUrl(request: NextRequest, token: string): string {
  return `${request.nextUrl.origin}/shared/${token}`;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("vault_shares")
    .select("token")
    .eq("user_id", user.id)
    .eq("revoked", false)
    .maybeSingle();

  return NextResponse.json({
    token: data?.token ?? null,
    url: data?.token ? shareUrl(request, data.token) : null,
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revoke any existing active link first so the partial unique index stays
  // happy and rotating always yields a brand-new token.
  const { error: revokeError } = await supabase
    .from("vault_shares")
    .update({ revoked: true })
    .eq("user_id", user.id)
    .eq("revoked", false);
  if (revokeError) {
    return NextResponse.json({ error: revokeError.message }, { status: 500 });
  }

  const token = randomBytes(24).toString("base64url");
  const { error: insertError } = await supabase
    .from("vault_shares")
    .insert({ user_id: user.id, token });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ token, url: shareUrl(request, token) }, { status: 201 });
}

export async function DELETE() {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("vault_shares")
    .update({ revoked: true })
    .eq("user_id", user.id)
    .eq("revoked", false);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
