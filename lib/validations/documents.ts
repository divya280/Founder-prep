import { z } from "zod";
import { docTypeValues } from "@/lib/documents/options";

// Runtime validation for the document-metadata write (POST /api/documents),
// which runs AFTER the file itself is uploaded to Storage by the browser client.
// The route trusts none of this shape until it passes here.

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, "must be a real calendar date");

// Accepts a valid date, or null/"" (cleared field) which normalises to null.
const optionalDate = z
  .union([dateString, z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

export const createDocumentSchema = z.object({
  file_name: z.string().trim().min(1).max(255),
  storage_path: z.string().trim().min(1).max(512),
  doc_type: z.enum(docTypeValues).nullable().optional().default(null),
  issue_date: optionalDate,
  expiry_date: optionalDate,
  file_size: z.number().int().nonnegative().nullable().optional().default(null),
  mime_type: z.string().max(255).nullable().optional().default(null),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
