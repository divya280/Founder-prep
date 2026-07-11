"use client";

import { useCallback, useEffect, useState } from "react";
import type { VaultDocument } from "@/types/documents";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentGrid } from "./DocumentGrid";
import { ShareLink } from "./ShareLink";

// Client orchestrator for the vault page: loads the document list and wires the
// upload form, grid (with optimistic delete), and share panel to a single
// refresh so the three stay in sync.

export function VaultView({ userId }: { userId: string }) {
  const [documents, setDocuments] = useState<VaultDocument[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setDocuments(data.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const handleDeleted = useCallback((id: string) => {
    setDocuments((prev) => prev?.filter((d) => d.id !== id) ?? prev);
  }, []);

  return (
    <div className="space-y-8">
      <DocumentUpload userId={userId} onUploaded={load} />

      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your documents</h2>
          {documents ? (
            <span className="text-sm text-[#8a978c]">
              {documents.length} file{documents.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : !documents ? (
          <p className="mt-4 text-sm text-[#5c6b61]">Loading documents…</p>
        ) : (
          <DocumentGrid documents={documents} onDeleted={handleDeleted} />
        )}
      </div>

      <ShareLink />

      <p className="text-xs leading-6 text-[#8a978c]">
        FounderPrep is a guide, not a substitute for advice from a qualified CA
        or lawyer. Store only documents you are comfortable keeping here.
      </p>
    </div>
  );
}
