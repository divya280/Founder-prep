import { InferenceClient } from "@huggingface/inference";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/rag/config";

// HuggingFace embedding calls. Isolated here so swapping the embedding provider
// later (per the "swap-friendly stack" note) is a change to this one file.

const MAX_BATCH = 32; // keep request payloads modest against the free Inference API

let client: InferenceClient | null = null;

function getClient(): InferenceClient {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY in .env.local");
  }
  if (!client) {
    client = new InferenceClient(apiKey);
  }
  return client;
}

/** Narrow HF's flexible return type to a flat 384-length vector. */
function asVector(raw: unknown, context: string): number[] {
  let value = raw;
  // sentence-transformers via featureExtraction can nest one level; unwrap it.
  while (Array.isArray(value) && Array.isArray(value[0])) {
    value = value[0];
  }
  if (
    !Array.isArray(value) ||
    value.some((n) => typeof n !== "number")
  ) {
    throw new Error(`Unexpected embedding shape for ${context}`);
  }
  const vector = value as number[];
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch for ${context}: got ${vector.length}, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }
  return vector;
}

/** Embed a single string (used for query embedding at retrieval time). */
export async function embedText(text: string): Promise<number[]> {
  const output = await getClient().featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
    provider: "hf-inference",
  });
  return asVector(output, "single input");
}

/**
 * Embed many strings, batched. Returns vectors in the same order as `texts`.
 * Empty input returns an empty array without calling the API.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += MAX_BATCH) {
    const batch = texts.slice(start, start + MAX_BATCH);
    const output = await getClient().featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: batch,
      provider: "hf-inference",
    });

    if (!Array.isArray(output)) {
      throw new Error("Expected an array of embeddings for a batch input");
    }
    output.forEach((item, index) => {
      vectors.push(asVector(item, `batch item ${start + index}`));
    });
  }

  return vectors;
}
