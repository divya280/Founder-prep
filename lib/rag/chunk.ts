import {
  CHUNK_OVERLAP,
  CHUNK_SEPARATORS,
  CHUNK_SIZE,
} from "@/lib/rag/config";
import type { PreparedChunk } from "@/types/rag";

// A focused re-implementation of LangChain's RecursiveCharacterTextSplitter.
// (langchain v1.5 moved the splitter to a separate package that isn't installed,
// and we want tight control over the header-aware separator behaviour anyway.)
//
// Strategy: try to split on the highest-priority separator that appears in the
// text (section headers first), recursing into any piece still larger than the
// chunk size, then greedily merge adjacent pieces up to CHUNK_SIZE with a
// trailing CHUNK_OVERLAP carried into the next chunk. Separators are kept at the
// START of the following piece (keepSeparator) so a "## Penalties" header stays
// attached to the section it introduces.

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split on `separator`, keeping the separator at the start of each segment. */
function splitKeepingSeparator(text: string, separator: string): string[] {
  if (separator === "") {
    return text.split("");
  }
  // Lookahead split: the separator is retained as a prefix of each segment.
  const parts = text.split(new RegExp(`(?=${escapeRegExp(separator)})`));
  return parts.filter((part) => part !== "");
}

/**
 * Merge small pieces into chunks of at most `chunkSize`, carrying `overlap`
 * characters of tail context into the next chunk. Pieces already contain their
 * leading separators, so they are joined with "".
 */
function mergeSplits(
  splits: string[],
  chunkSize: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  const current: string[] = [];
  let currentLength = 0;

  for (const piece of splits) {
    if (
      currentLength + piece.length > chunkSize &&
      current.length > 0
    ) {
      const joined = current.join("").trim();
      if (joined) {
        chunks.push(joined);
      }
      // Drop from the front until the retained tail fits the overlap budget
      // (and the incoming piece fits the chunk).
      while (
        current.length > 0 &&
        (currentLength > overlap ||
          currentLength + piece.length > chunkSize)
      ) {
        currentLength -= current[0].length;
        current.shift();
      }
    }
    current.push(piece);
    currentLength += piece.length;
  }

  const tail = current.join("").trim();
  if (tail) {
    chunks.push(tail);
  }
  return chunks;
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
): string[] {
  const finalChunks: string[] = [];

  // Pick the first separator that actually occurs; "" is the ultimate fallback.
  let separator = separators[separators.length - 1] ?? "";
  let remainingSeparators: string[] = [];
  for (let i = 0; i < separators.length; i += 1) {
    const candidate = separators[i];
    if (candidate === "" || text.includes(candidate)) {
      separator = candidate;
      remainingSeparators = separators.slice(i + 1);
      break;
    }
  }

  const splits = splitKeepingSeparator(text, separator);
  let goodSplits: string[] = [];

  for (const piece of splits) {
    if (piece.length <= chunkSize) {
      goodSplits.push(piece);
      continue;
    }
    // Flush accumulated small pieces before handling the oversized one.
    if (goodSplits.length > 0) {
      finalChunks.push(...mergeSplits(goodSplits, chunkSize, overlap));
      goodSplits = [];
    }
    if (remainingSeparators.length === 0) {
      // Nothing finer to split on — keep it whole (rare; a single long line).
      finalChunks.push(piece);
    } else {
      finalChunks.push(
        ...recursiveSplit(piece, remainingSeparators, chunkSize, overlap),
      );
    }
  }

  if (goodSplits.length > 0) {
    finalChunks.push(...mergeSplits(goodSplits, chunkSize, overlap));
  }

  return finalChunks;
}

/**
 * Chunk a document body into overlapping, header-aware chunks.
 * Returns chunks with a stable 0-based index for storage + debugging.
 */
export function chunkDocument(
  body: string,
  options: {
    chunkSize?: number;
    overlap?: number;
    separators?: string[];
  } = {},
): PreparedChunk[] {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;
  const overlap = options.overlap ?? CHUNK_OVERLAP;
  const separators = options.separators ?? CHUNK_SEPARATORS;

  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const rawChunks = recursiveSplit(normalized, separators, chunkSize, overlap);

  return rawChunks
    .map((content) => content.trim())
    .filter((content) => content.length > 0)
    .map((content, chunkIndex) => ({ content, chunkIndex }));
}
