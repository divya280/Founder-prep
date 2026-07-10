import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/rag/embed";
import { RETRIEVAL_TOP_K } from "@/lib/rag/config";
import type { Database } from "@/types/supabase";
import type { ChunkMetadata, RetrievedChunk } from "@/types/rag";

// Query → top-K chunks. This is the read half of the RAG pipeline, shared by the
// compliance-checklist generator (M6) and the AI assistant (M7).

interface RetrieveOptions {
  /** How many chunks to return. Defaults to the M4 spec's top-5. */
  topK?: number;
  /**
   * Supabase client to run the RPC with. Defaults to the service-role admin
   * client so retrieval works in server contexts without a user session.
   * Callers inside an authenticated request may pass their own client.
   */
  client?: SupabaseClient<Database>;
}

/**
 * Embed `query`, run cosine similarity search via the `match_documents` RPC, and
 * return the top-K chunks ordered most-similar first.
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const topK = options.topK ?? RETRIEVAL_TOP_K;
  const supabase = options.client ?? createAdminClient();

  const queryEmbedding = await embedText(trimmed);

  const { data, error } = await supabase.rpc("match_documents", {
    // The embedding column + RPC arg are fed a JSON-stringified vector,
    // matching how M3 stores/queries vectors.
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
  });

  if (error) {
    throw new Error(`match_documents failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content,
    similarity: row.similarity,
    chunkIndex: row.chunk_index,
    metadata: (row.metadata as Partial<ChunkMetadata> | null) ?? null,
  }));
}
