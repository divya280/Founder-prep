// Central Groq (LLM) configuration. Kept in one place so the model + generation
// params are easy to tune and swap (the "swap-friendly stack" note in CLAUDE.md:
// moving off Groq should be a change to this file + client.ts only).

/**
 * Groq chat model used for checklist + assistant generation.
 *
 * CLAUDE.md names "Llama 3.2", but Groq's 3.2 *text* models are preview/
 * deprecated, so we default to the current stable versatile model (which also
 * supports JSON mode). Override with GROQ_MODEL in the environment if needed.
 */
export const GROQ_MODEL =
  process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/** Low temperature: this is grounded extraction, not creative writing. */
export const GROQ_TEMPERATURE = 0.2;

/** Cap output so a runaway generation can't rack up tokens. */
export const GROQ_MAX_TOKENS = 4096;

/**
 * How many retrieved chunks to feed the checklist generator. Larger than the
 * retrieval default (5) so a single profile query still surfaces enough breadth
 * across the different compliance areas for a complete checklist.
 */
export const CHECKLIST_CONTEXT_CHUNKS = 12;
