import { chatJson } from "@/lib/groq/client";
import {
  generatedChecklistSchema,
  type GeneratedChecklist,
} from "@/lib/validations/compliance";
import type { ComplianceProfile } from "@/lib/compliance/query";
import type { RetrievedChunk } from "@/types/rag";

// The generate half of the RAG pipeline: retrieved context + founder profile
// → grounded, structured checklist. Retrieval is done by the caller; this file
// owns the prompt, the Groq call, and validation of the result.

const SYSTEM_PROMPT = `You are a compliance advisor for first-time Indian startup founders.

You are given (a) a founder's profile and (b) CONTEXT: excerpts from official Indian compliance documents. Produce a personalized compliance checklist as JSON.

STRICT RULES:
- Ground every item ONLY in the provided CONTEXT. Never invent registrations, thresholds, fees, deadlines, or penalties that are not supported by the context.
- If the context does not support an item for this founder, omit it. A shorter, correct checklist is better than a padded one.
- Do not copy an item that is clearly irrelevant to this founder's sector or profile.
- Numbers (turnover thresholds, employee counts, penalty amounts) must come from the context verbatim; if unknown, say so in words rather than guessing.
- Set "source" to the filename of the context excerpt the item is grounded in.

Return a JSON object with this exact shape:
{
  "items": [
    {
      "name": "short registration/filing name",
      "category": "one of: Registration, Tax, Labour, IP, Sector Licence, Filing",
      "why_needed": "1-2 sentences on why this founder needs it",
      "how_to_apply": "concise steps or where to apply",
      "necessity": "mandatory | conditional | optional",
      "deadline_note": "typical statutory timeframe in words, or empty string",
      "penalty": "consequence of non-compliance from the context, or empty string",
      "priority": 1-100 integer (lower = do sooner),
      "source": "source-filename.md"
    }
  ],
  "disclaimer": "one-line reminder that this is guidance, not legal/CA advice"
}`;

function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "(no context available)";
  }
  return chunks
    .map((chunk) => {
      const source = chunk.metadata?.source ?? "unknown";
      return `[Source: ${source}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

function buildUserPrompt(
  profile: ComplianceProfile,
  chunks: RetrievedChunk[],
): string {
  return `FOUNDER PROFILE
- Business type: ${profile.businessType}
- Sector/domain: ${profile.domain}
- State: ${profile.state}
- Team size: ${profile.teamSize}
- Funding stage: ${profile.fundingStage}
- Annual revenue: ${profile.revenue}

CONTEXT
${formatContext(chunks)}

Using ONLY the context above, produce the founder's compliance checklist as the specified JSON object.`;
}

/**
 * Generate and validate a compliance checklist. Throws if Groq's output can't
 * be parsed or fails the schema, so the route never persists malformed data.
 */
export async function generateChecklist(
  profile: ComplianceProfile,
  chunks: RetrievedChunk[],
): Promise<GeneratedChecklist> {
  const raw = await chatJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(profile, chunks),
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  const result = generatedChecklistSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Groq output failed validation: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  // Stable ordering: priority asc, then mandatory before optional.
  const necessityRank = { mandatory: 0, conditional: 1, optional: 2 } as const;
  result.data.items.sort(
    (a, b) =>
      a.priority - b.priority ||
      necessityRank[a.necessity] - necessityRank[b.necessity],
  );

  return result.data;
}
