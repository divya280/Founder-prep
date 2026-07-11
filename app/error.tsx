"use client";

// Segment-level error boundary: catches render/data errors in any route under
// app/ that doesn't define its own error.tsx. Client component with a reset()
// to retry the failed segment.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] px-6 text-center text-[#17201b]">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#427a5b]">
          Something went wrong
        </p>
        <h1 className="mt-4 text-2xl font-semibold">
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#526057]">
          This part of FounderPrep failed to load. You can try again, or head
          back to your dashboard.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[#8a978c]">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-[#427a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549]"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="text-sm font-medium text-[#427a5b] hover:underline"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
