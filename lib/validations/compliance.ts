import { z } from "zod";

// Runtime validation of Groq's JSON output. Groq's JSON mode guarantees valid
// JSON but not our shape, so nothing from the model is trusted until it passes
// this schema (CLAUDE.md working agreement: never persist raw LLM output).

/** Tri-state legal necessity, mirrored from the knowledge base frontmatter. */
export const complianceNecessityValues = [
  "mandatory",
  "conditional",
  "optional",
] as const;

export const generatedChecklistItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  why_needed: z.string().trim().min(1).max(600),
  how_to_apply: z.string().trim().min(1).max(1200),
  necessity: z.enum(complianceNecessityValues),
  deadline_note: z.string().trim().max(300).default(""),
  penalty: z.string().trim().max(400).default(""),
  // Lower = do sooner. Used to order the checklist.
  priority: z.coerce.number().int().min(1).max(100).default(50),
  // Which source doc grounded this item (filename from the retrieved chunks).
  source: z.string().trim().max(120).default(""),
});

export const generatedChecklistSchema = z.object({
  items: z.array(generatedChecklistItemSchema).min(1).max(30),
  disclaimer: z.string().trim().max(600).optional(),
});

export type GeneratedChecklistItem = z.infer<typeof generatedChecklistItemSchema>;
export type GeneratedChecklist = z.infer<typeof generatedChecklistSchema>;
