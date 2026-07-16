"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

// Read-only vault share link for a CA / co-founder. Fetches the current link,
// lets the founder create, rotate, copy, or revoke it. Anyone with the link can
// view + download the vault's documents (no login), so rotating/revoking is the
// way to cut off access.

export function ShareLink() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/documents/share");
        const data = await res.json();
        if (active && res.ok) setUrl(data.url ?? null);
      } catch {
        /* best-effort */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function mutate(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/documents/share", { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUrl(method === "POST" ? (data.url ?? null) : null);
      toast(method === "POST" ? "Share link ready." : "Sharing revoked.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard.", "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — copy the link manually.");
    }
  }

  return (
    <div className="border border-[#d9ded4] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Share your vault</h2>
      <p className="mt-1 text-sm text-[#5c6b61]">
        Create a read-only link so your CA or co-founder can view and download
        these documents without an account.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[#8a978c]">Loading…</p>
      ) : url ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 border border-[#d9ded4] bg-[#f7f8f3] px-3 py-2 text-sm text-[#3d4842]"
            />
            <button
              type="button"
              onClick={copy}
              className="bg-[#427a5b] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#356549]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => mutate("POST")}
              disabled={busy}
              className="font-medium text-[#427a5b] hover:underline disabled:opacity-50"
            >
              Rotate link
            </button>
            <button
              type="button"
              onClick={() => mutate("DELETE")}
              disabled={busy}
              className="font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => mutate("POST")}
          disabled={busy}
          className="mt-4 bg-[#427a5b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#356549] disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create share link"}
        </button>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
