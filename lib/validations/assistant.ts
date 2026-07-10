import { z } from "zod";

// Validation for the AI assistant's JSON answer. Groq's JSON mode guarantees
// valid JSON, not our shape — nothing is trusted until it passes this.

export const assistantAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  // Filenames the model claims it used; cross-checked against the retrieved set
  // by the caller so a hallucinated citation can't leak through.
  sources: z.array(z.string().trim()).default([]),
  // False → the context didn't cover the question; UI shows the graceful
  // "not enough info" state instead of a confident answer.
  has_enough_info: z.boolean().default(true),
});

export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
