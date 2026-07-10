import Groq from "groq-sdk";
import {
  GROQ_MODEL,
  GROQ_TEMPERATURE,
  GROQ_MAX_TOKENS,
} from "@/lib/groq/config";

// Groq LLM client + the low-level JSON call. Isolated here so the checklist
// generator (lib/compliance/generate.ts) and the future AI assistant (M7) share
// one place that knows how to talk to Groq, and swapping providers touches only
// this file. Server-side only — never import into a client component (it reads
// GROQ_API_KEY).

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env.local");
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

export interface ChatJsonOptions {
  system: string;
  user: string;
  /** Override the default temperature for this call. */
  temperature?: number;
  maxTokens?: number;
}

/**
 * Run a chat completion in JSON mode and return the raw JSON string. Groq's
 * JSON mode guarantees syntactically valid JSON, but NOT that it matches our
 * shape — the caller must validate (Zod) before trusting it.
 *
 * Throws on an empty/refused completion so callers get a clear error rather
 * than a silent `{}`.
 */
export async function chatJson(options: ChatJsonOptions): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: GROQ_MODEL,
    temperature: options.temperature ?? GROQ_TEMPERATURE,
    max_tokens: options.maxTokens ?? GROQ_MAX_TOKENS,
    // JSON mode: Groq requires the word "json" to appear in the prompt, which
    // our system prompt satisfies.
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty completion");
  }
  return content;
}
