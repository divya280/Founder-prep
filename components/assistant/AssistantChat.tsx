"use client";

import { FormEvent, useRef, useState } from "react";

interface Source {
  source: string;
  title: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  hasEnoughInfo?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "Do I need an FSSAI licence for a food delivery startup?",
  "What is the turnover threshold for GST registration?",
  "When must I register for PF and ESI?",
  "How do I get DPIIT Startup India recognition?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    // Scroll after the user message paints.
    requestAnimationFrame(() =>
      listEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    );

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources ?? [],
          hasEnoughInfo: data.hasEnoughInfo ?? true,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        listEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col">
      <div className="min-h-[320px] border border-[#d9ded4] bg-white p-5 shadow-sm">
        {isEmpty ? (
          <div className="py-6 text-center">
            <h2 className="text-lg font-semibold">Ask the compliance assistant</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#526057]">
              Answers are grounded in official Indian compliance sources and cite
              where they came from. Try one of these:
            </p>
            <div className="mx-auto mt-5 grid max-w-lg gap-2 sm:grid-cols-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="border border-[#d9ded4] bg-white px-3 py-2 text-left text-sm text-[#3d4842] transition hover:border-[#427a5b]/50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {loading ? (
              <div className="text-sm text-[#8a978c]">Thinking…</div>
            ) : null}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about registrations, licenses, deadlines…"
          className="flex-1 border border-[#d9ded4] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#427a5b] focus:ring-1 focus:ring-[#427a5b]"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="bg-[#427a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-[#8a978c]">
        FounderPrep is a guide, not a substitute for advice from a qualified CA or
        lawyer.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#427a5b] px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  const noInfo = message.hasEnoughInfo === false;
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] border px-4 py-3 text-sm leading-6 ${
          noInfo
            ? "border-[#c9a53a]/40 bg-[#c9a53a]/10 text-[#5f4d12]"
            : "border-[#d9ded4] bg-[#f7f8f3] text-[#3d4842]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 ? (
          <div className="mt-3 border-t border-[#d9ded4] pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
              Sources
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {message.sources.map((s) => (
                <li
                  key={s.source}
                  className="border border-[#d9ded4] bg-white px-2 py-0.5 text-xs text-[#5c6b61]"
                >
                  {s.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
