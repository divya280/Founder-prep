// Shared types for the M9 document vault. The DB row lives in
// types/supabase.ts (Database["public"]["Tables"]["documents"]); this is the
// shape the API returns to the UI — metadata plus a freshly-minted, short-lived
// signed download URL (never the raw storage path).

export interface VaultDocument {
  id: string;
  file_name: string;
  doc_type: string | null;
  issue_date: string | null; // YYYY-MM-DD
  expiry_date: string | null; // YYYY-MM-DD
  file_size: number | null; // bytes
  mime_type: string | null;
  uploaded_at: string;
  /** Signed URL for download, valid for a few minutes. null if signing failed. */
  download_url: string | null;
}
