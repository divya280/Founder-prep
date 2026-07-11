// Document-vault option lists and upload constraints — the single source of
// truth shared by the upload form, validation, and the grid. Same convention as
// lib/onboarding/options.ts: a values tuple → union type, a separate LABELS map,
// and a derived render array.

export const docTypeValues = [
  "incorporation",
  "pan",
  "gst",
  "license",
  "agreement",
  "tax_filing",
  "bank",
  "identity",
  "other",
] as const;

export type DocType = (typeof docTypeValues)[number];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  incorporation: "Incorporation / Registration",
  pan: "PAN / TAN",
  gst: "GST Certificate",
  license: "License / Permit",
  agreement: "Agreement / Contract",
  tax_filing: "Tax Filing",
  bank: "Bank / Financial",
  identity: "Identity Proof",
  other: "Other",
};

export const DOC_TYPES: { value: DocType; label: string }[] = docTypeValues.map(
  (value) => ({ value, label: DOC_TYPE_LABELS[value] }),
);

// Upload constraints. Kept conservative — the vault is for certificates and
// filings, not media. Enforced client-side (fast feedback) AND server-side.
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** `accept` attribute for the file input. */
export const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";

export function isAllowedMime(mime: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

/** Human-readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
