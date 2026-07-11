import Link from "next/link";
import { redirect } from "next/navigation";
import { VaultView } from "@/components/documents/VaultView";
import { createClient } from "@/lib/supabase/server";

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-[#d9ded4] pb-5">
          <span className="text-lg font-semibold tracking-wide">FounderPrep</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#427a5b] hover:underline"
          >
            ← Dashboard
          </Link>
        </header>

        <div className="py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#427a5b]">
            Vault
          </p>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
            Document Vault
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#526057]">
            Keep your incorporation certificates, PAN, GST, licenses and filings
            in one place. Tag each with an expiry date and we&apos;ll remind you
            before it lapses.
          </p>

          <div className="mt-8">
            <VaultView userId={user.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
