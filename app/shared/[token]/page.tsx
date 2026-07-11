import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VaultDocument } from "@/types/documents";

// Public, read-only vault view for a shared link (/shared/<token>). No login:
// the token is resolved with the service-role client, so this page must never
// expose anything beyond the shared founder's documents. Not listed in the
// middleware protected routes, so it stays reachable while signed out.

export const dynamic = "force-dynamic";

const BUCKET = "documents";
const SIGNED_URL_TTL = 60 * 10;

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-6 text-center text-[#17201b]">
      <div>
        <h1 className="text-xl font-semibold">Link unavailable</h1>
        <p className="mt-2 text-sm text-[#5c6b61]">
          This share link is invalid or has been revoked.
        </p>
      </div>
    </main>
  );
}

export default async function SharedVaultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: share } = await admin
    .from("vault_shares")
    .select("user_id")
    .eq("token", token)
    .eq("revoked", false)
    .maybeSingle();

  if (!share) {
    return <NotFound />;
  }

  const { data: rows } = await admin
    .from("documents")
    .select(
      "id, file_name, doc_type, issue_date, expiry_date, file_size, mime_type, uploaded_at, storage_path",
    )
    .eq("user_id", share.user_id)
    .order("uploaded_at", { ascending: false });

  const list = rows ?? [];
  const paths = list.map((r) => r.storage_path).filter((p): p is string => !!p);

  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const documents: VaultDocument[] = list.map((r) => ({
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

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-[#d9ded4] pb-5">
          <span className="text-lg font-semibold tracking-wide">FounderPrep</span>
          <span className="text-sm text-[#8a978c]">Shared vault (read-only)</span>
        </header>

        <div className="py-10">
          <h1 className="text-2xl font-semibold sm:text-3xl">Shared documents</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#526057]">
            These compliance documents were shared with you. You can view and
            download them; you cannot edit or delete anything.
          </p>

          <div className="mt-8">
            <DocumentGrid documents={documents} readOnly />
          </div>

          <p className="mt-8 text-xs leading-6 text-[#8a978c]">
            FounderPrep is a guide, not a substitute for advice from a qualified
            CA or lawyer.
          </p>
        </div>
      </section>
    </main>
  );
}
