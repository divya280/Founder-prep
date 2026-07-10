// Shared RAG types. Imported by lib/rag/* and the ingest API route so shapes are
// defined once rather than redeclared inline.

/** Whether a compliance item is legally required. Tri-state on purpose: the
 * frontmatter uses `conditional` (GST, PF/ESI) which is neither true nor false —
 * coercing it to a boolean would drop the signal the checklist generator needs. */
export type MandatoryStatus = "true" | "false" | "conditional";

/** Parsed YAML frontmatter of a knowledge-base doc. All optional except title —
 * we tolerate incomplete docs rather than fail ingestion on a missing field. */
export interface DocFrontmatter {
  title: string;
  category?: string;
  mandatory?: MandatoryStatus;
  domain_specific?: boolean;
  jurisdiction?: string;
  last_updated?: string;
  disclaimer?: string;
  sources?: string[];
}

/**
 * Metadata stored on every `embeddings` row (jsonb). Deliberately excludes the
 * `sources` URL list — that is document-level and lives in `rag_documents`,
 * keyed by `source`. `disclaimer` IS carried here so the generation step can
 * attach it regardless of which chunk was retrieved (a chunk boundary must
 * never separate a stated fact from its caveat).
 */
export interface ChunkMetadata {
  source: string; // filename — join key to rag_documents.source_file
  title: string;
  category: string | null;
  mandatory: MandatoryStatus | null;
  last_updated: string | null;
  disclaimer: string | null;
  chunk_index: number;
}

/** A chunk ready to be embedded and stored. */
export interface PreparedChunk {
  content: string;
  chunkIndex: number;
}

/** Per-file outcome, recorded in ingestion_runs.files for later debugging. */
export interface IngestFileResult {
  source: string;
  status: "ingested" | "skipped" | "failed";
  chunks: number;
  skippedReason?: string;
  error?: string;
}

/** Summary returned by the ingestion run and the API route. */
export interface IngestionResult {
  runId: string;
  status: "success" | "partial" | "failed";
  fileCount: number;
  fileSuccessCount: number;
  chunkCount: number;
  files: IngestFileResult[];
  error?: string;
}

/** A chunk returned from similarity search, with its metadata narrowed. */
export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  metadata: Partial<ChunkMetadata> | null;
}
