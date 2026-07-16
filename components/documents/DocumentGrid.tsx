"use client";

import { useState } from "react";
import type { VaultDocument } from "@/types/documents";
import { DOC_TYPE_LABELS, formatFileSize, type DocType } from "@/lib/documents/options";
import { EXPIRY_STYLES, expiryLabel, expiryStatus } from "@/lib/documents/expiry";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

// Grid of vault documents with download + (optionally) delete. Reused read-only
// on the public /shared/<token> page, where onDeleted is omitted.

function typeLabel(docType: string | null): string {
  if (!docType) return "Uncategorized";
  return DOC_TYPE_LABELS[docType as DocType] ?? docType;
}

export function DocumentGrid({
  documents,
  onDeleted,
  readOnly = false,
}: {
  documents: VaultDocument[];
  onDeleted?: (id: string) => void;
  readOnly?: boolean;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (deleting) return;
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete");
      }
      onDeleted?.(id);
      toast("Document deleted.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="No documents yet"
          description={
            readOnly
              ? "Nothing has been shared here yet."
              : "Upload your incorporation certificate, PAN, GST, licenses and filings to keep them in one place."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const status = expiryStatus(doc.expiry_date);
          return (
            <div
              key={doc.id}
              className="flex flex-col border border-[#d9ded4] bg-white p-4 shadow-sm"
            >
              <p
                className="truncate text-sm font-semibold text-[#17201b]"
                title={doc.file_name}
              >
                {doc.file_name}
              </p>
              <p className="mt-1 text-xs text-[#8a978c]">
                {typeLabel(doc.doc_type)} · {formatFileSize(doc.file_size)}
              </p>

              <dl className="mt-3 space-y-1 text-xs text-[#5c6b61]">
                {doc.issue_date ? (
                  <div className="flex justify-between">
                    <dt>Issued</dt>
                    <dd className="font-medium">{doc.issue_date}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>Expiry</dt>
                  <dd className="font-medium">{doc.expiry_date ?? "—"}</dd>
                </div>
              </dl>

              {doc.expiry_date ? (
                <span
                  className={`mt-3 inline-block self-start border px-2 py-0.5 text-[11px] font-medium ${EXPIRY_STYLES[status]}`}
                >
                  {expiryLabel(doc.expiry_date)}
                </span>
              ) : null}

              <div className="mt-4 flex items-center gap-3 border-t border-[#eef0eb] pt-3">
                {doc.download_url ? (
                  <a
                    href={doc.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#427a5b] hover:underline"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-sm text-[#8a978c]">Unavailable</span>
                )}
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="ml-auto text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deleting === doc.id ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
