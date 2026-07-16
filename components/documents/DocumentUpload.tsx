"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import {
  DOC_TYPES,
  FILE_ACCEPT,
  MAX_FILE_BYTES,
  formatFileSize,
  isAllowedMime,
  type DocType,
} from "@/lib/documents/options";

// Drag-and-drop upload with client-side validation + tagging. The browser
// uploads the file straight to the private `documents` Storage bucket (RLS
// scopes it to the founder's own folder), then POSTs metadata to /api/documents.

const BUCKET = "documents";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function DocumentUpload({
  userId,
  onUploaded,
}: {
  userId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType | "">("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  function validateAndSet(f: File) {
    setError("");
    if (!isAllowedMime(f.type)) {
      setError("Unsupported file type. Use PDF, image, or Word document.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(`File is too large (max ${formatFileSize(MAX_FILE_BYTES)}).`);
      return;
    }
    setFile(f);
  }

  function reset() {
    setFile(null);
    setDocType("");
    setIssueDate("");
    setExpiryDate("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");

    try {
      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          storage_path: path,
          doc_type: docType || null,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          file_size: file.size,
          mime_type: file.type,
        }),
      });

      if (!res.ok) {
        // Roll back the orphaned object so a failed save doesn't leave litter.
        await supabase.storage.from(BUCKET).remove([path]);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save document");
      }

      reset();
      onUploaded();
      toast("Document uploaded.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-[#d9ded4] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Upload a document</h2>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) validateAndSet(dropped);
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-[#427a5b] bg-[#427a5b]/5"
            : "border-[#d9ded4] hover:border-[#427a5b]/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) validateAndSet(f);
          }}
        />
        {file ? (
          <p className="text-sm font-medium text-[#17201b]">
            {file.name}{" "}
            <span className="text-[#8a978c]">({formatFileSize(file.size)})</span>
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-[#3d4842]">
              Drag &amp; drop a file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-[#8a978c]">
              PDF, image, or Word — up to {formatFileSize(MAX_FILE_BYTES)}
            </p>
          </>
        )}
      </div>

      {/* Tagging */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="text-[#5c6b61]">Type</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType | "")}
            className="mt-1 w-full border border-[#d9ded4] bg-white px-2 py-2 text-sm"
          >
            <option value="">Uncategorized</option>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-[#5c6b61]">Issue date</span>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="mt-1 w-full border border-[#d9ded4] bg-white px-2 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="text-[#5c6b61]">Expiry date</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 w-full border border-[#d9ded4] bg-white px-2 py-2 text-sm"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-[#427a5b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#356549] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {file && !uploading ? (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-[#5c6b61] hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
