import { chatJson } from "@/lib/groq/client";
import { assistantAnswerSchema } from "@/lib/validations/assistant";
import type { RetrievedChunk } from "@/types/rag";

// M7 — the AI assistant's answer step. Same retrieve→generate shape as the
// checklist, but tuned for Q&A: answer strictly from context, cite sources,
// and refuse gracefully when the context doesn't cover the question.

const SYSTEM_PROMPT = `You are FounderPrep's compliance assistant for first-time Indian startup founders.

Answer the user's QUESTION using ONLY the provided CONTEXT excerpts from official compliance documents.

STRICT RULES:
- If the context contains the answer, answer clearly and concisely. Prefer short paragraphs or bullet points.
- Cite the source document(s) you used, by their exact filename, in "sources".
- If the context does NOT contain enough information to answer reliably, set "has_enough_info" to false and make "answer" a brief message telling the user you don't have enough information and they should consult a qualified CA or lawyer. Do NOT use any knowledge outside the context.
- Never invent thresholds, fees, dates, deadlines, or penalties that are not present in the context.

Return a JSON object: { "answer": string, "sources": string[], "has_enough_info": boolean }`;

/** A citation surfaced to the UI. */
export interface AnswerSource {
  source: string;
  title: string;
}

export interface AssistantResult {
  answer: string;
  hasEnoughInfo: boolean;
  sources: AnswerSource[];
}

/** Unique source→title map from the retrieved chunks. */
function sourceTitleMap(chunks: RetrievedChunk[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const chunk of chunks) {
    const source = chunk.metadata?.source;
    if (source && !map.has(source)) {
      map.set(source, chunk.metadata?.title ?? source);
    }
  }
  return map;
}

function formatContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk) => {
      const source = chunk.metadata?.source ?? "unknown";
      const title = chunk.metadata?.title ?? source;
      return `[Source: ${source}] ${title}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

export async function answerQuestion(
  question: string,
  chunks: RetrievedChunk[],
): Promise<AssistantResult> {
  const available = sourceTitleMap(chunks);

  const user = `QUESTION: ${question}

CONTEXT:
${formatContext(chunks)}

Answer the question using ONLY the context above, as the specified JSON object.`;

  const raw = await chatJson({ system: SYSTEM_PROMPT, user });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  const result = assistantAnswerSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Assistant output failed validation: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  // Trust citations only if they point at a doc we actually retrieved — this
  // stops a hallucinated filename from being shown as a real source.
  const sources: AnswerSource[] = [];
  const seen = new Set<string>();
  for (const cited of result.data.sources) {
    const title = available.get(cited);
    if (title && !seen.has(cited)) {
      seen.add(cited);
      sources.push({ source: cited, title });
    }
  }

  return {
    answer: result.data.answer,
    hasEnoughInfo: result.data.has_enough_info,
    sources,
  };
}
