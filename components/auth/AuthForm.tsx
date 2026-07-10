import Link from "next/link";
import type { ReactNode } from "react";

interface AuthFormProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

export function AuthForm({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthFormProps) {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 text-lg font-semibold tracking-wide text-[#17201b]"
        >
          FounderPrep
        </Link>

        <div className="border border-[#d9ded4] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-[#526057]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-[#526057]">
          {footerText}{" "}
          <Link
            href={footerHref}
            className="font-semibold text-[#427a5b] hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      </section>
    </main>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#17201b]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full border border-[#d9ded4] bg-white px-3 py-2 text-sm outline-none focus:border-[#427a5b] focus:ring-1 focus:ring-[#427a5b]"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

export function AuthSubmitButton({
  label,
  loading,
}: {
  label: string;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#427a5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}
