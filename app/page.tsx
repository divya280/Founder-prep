import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d9ded4] pb-5">
          <span className="text-lg font-semibold tracking-wide">
            FounderPrep
          </span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/login"
              className="text-[#526057] transition hover:text-[#427a5b]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-[#427a5b] px-4 py-2 text-white transition hover:bg-[#356549]"
            >
              Get started
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#427a5b]">
              Indian startup compliance
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[#17201b] sm:text-6xl">
              Personalized compliance roadmaps grounded in real regulations.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#526057]">
              FounderPrep uses Supabase pgvector, HuggingFace embeddings, and
              Groq generation to turn a founder profile into a cited, practical
              setup checklist.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-[#427a5b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#356549]"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="border border-[#d9ded4] bg-white px-6 py-3 text-sm font-semibold text-[#17201b] transition hover:border-[#427a5b]"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="border border-[#d9ded4] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">What you get</h2>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-center justify-between border-b border-[#eef0eb] pb-3">
                <dt className="text-[#5c6b61]">Personalized checklist</dt>
                <dd className="font-semibold">RAG-powered</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[#eef0eb] pb-3">
                <dt className="text-[#5c6b61]">Deadline tracking</dt>
                <dd className="font-semibold">Smart alerts</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[#eef0eb] pb-3">
                <dt className="text-[#5c6b61]">Document vault</dt>
                <dd className="font-semibold">Secure storage</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6b61]">AI assistant</dt>
                <dd className="font-semibold">Cited answers</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
