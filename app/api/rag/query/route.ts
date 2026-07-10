import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrieve } from "@/lib/rag/retrieve";
import { answerQuestion } from "@/lib/assistant/answer";

// M7 — AI assistant. POST a question, get a context-grounded answer + citations.
//   POST /api/rag/query  { "question": "..." }
//   → { answer, hasEnoughInfo, sources: [{ source, title }] }
//
// Same retrieve→generate pattern as the checklist; auth via the caller session.

export const runtime = "nodejs"; // Groq SDK + retrieval; not edge
export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 500;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let question: unknown;
  try {
    const body = (await request.json()) as { question?: unknown };
    question = body.question;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);

  try {
    const chunks = await retrieve(trimmed);
    if (chunks.length === 0) {
      return NextResponse.json({
        answer:
          "I don't have any compliance documents to search yet. Please try again later.",
        hasEnoughInfo: false,
        sources: [],
      });
    }

    const result = await answerQuestion(trimmed, chunks);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to answer question",
      },
      { status: 500 },
    );
  }
}
