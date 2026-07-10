// Central RAG configuration. Kept in one place so ingestion and retrieval can
// never drift apart (e.g. embedding model + dimension must match the
// `embeddings.embedding vector(384)` column and the `match_documents` RPC).

/** HuggingFace sentence-transformers model. 384-dim output — matches vector(384). */
export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/** Must equal the pgvector column dimension. Guarded at runtime in embed.ts. */
export const EMBEDDING_DIMENSIONS = 384;

/**
 * Chunking. 1200/150 (not 800/150): these compliance docs pair a fact with its
 * qualifying condition ("10 or more employees" ... "except 20 in Maharashtra"),
 * and a penalty with the filing it applies to. A slightly larger chunk keeps
 * those together so retrieval doesn't surface a number without its caveat.
 */
export const CHUNK_SIZE = 1200;
export const CHUNK_OVERLAP = 150;

/**
 * Separator precedence for the recursive splitter. These docs carry real
 * structural signal (## Eligibility, ### Penalties, fee tables), so we prefer to
 * break on section headers before falling back to paragraph → line → word.
 * That keeps a chunk from ending mid-way through a table or an eligibility list.
 */
export const CHUNK_SEPARATORS = ["\n## ", "\n### ", "\n\n", "\n", " "];

/** Top-K chunks returned by retrieval (M4 spec: top-5). */
export const RETRIEVAL_TOP_K = 5;

/** Where the raw knowledge base lives, relative to the repo root. */
export const DOCS_DIR = "data/compliance-docs";

/** File extensions we know how to ingest. */
export const SUPPORTED_EXTENSIONS = [".md", ".txt", ".pdf"] as const;
