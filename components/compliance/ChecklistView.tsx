"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChecklistEntry, ComplianceStatus } from "@/types/compliance";
import { urgencyOf, daysUntil, URGENCY_STYLES } from "@/lib/compliance/deadlines";

const STATUSES: ComplianceStatus[] = ["Not Started", "In Progress", "Done"];

const STATUS_STYLES: Record<ComplianceStatus, string> = {
  "Not Started": "border-[#d9ded4] bg-white text-[#5c6b61]",
  "In Progress": "border-[#c9a53a]/40 bg-[#c9a53a]/10 text-[#8a6d16]",
  Done: "border-[#427a5b]/40 bg-[#427a5b]/10 text-[#356549]",
};

type Filter = "All" | ComplianceStatus;

const FALLBACK_DISCLAIMER =
  "This checklist is AI-generated guidance based on official sources — not a substitute for advice from a qualified CA or lawyer.";

export function ChecklistView() {
  const [entries, setEntries] = useState<ChecklistEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/compliance/generate");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load checklist");
        if (active) setEntries(data.checklist ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/compliance/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setEntries(data.checklist ?? []);
      setDisclaimer(data.disclaimer ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: ComplianceStatus) => {
      // Optimistic — revert on failure.
      const prev = entries;
      setEntries((cur) =>
        cur
          ? cur.map((e) =>
              e.userComplianceId === id ? { ...e, status } : e,
            )
          : cur,
      );
      try {
        const res = await fetch(`/api/compliance/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setEntries(prev); // revert
        setError("Could not update status. Please try again.");
      }
    },
    [entries],
  );

  const updateDeadline = useCallback(
    async (id: string, deadline: string | null) => {
      const prev = entries;
      setEntries((cur) =>
        cur
          ? cur.map((e) =>
              e.userComplianceId === id ? { ...e, deadline } : e,
            )
          : cur,
      );
      try {
        const res = await fetch(`/api/compliance/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deadline }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setEntries(prev);
        setError("Could not update deadline. Please try again.");
      }
    },
    [entries],
  );

  const counts = useMemo(() => {
    const base = { All: entries?.length ?? 0, "Not Started": 0, "In Progress": 0, Done: 0 };
    for (const e of entries ?? []) base[e.status] += 1;
    return base as Record<Filter, number>;
  }, [entries]);

  const visible = useMemo(
    () => (entries ?? []).filter((e) => filter === "All" || e.status === filter),
    [entries, filter],
  );

  if (loading) {
    return <div className="mt-10 text-sm text-[#5c6b61]">Loading your checklist…</div>;
  }

  // Empty state — offer to generate.
  if (!entries || entries.length === 0) {
    return (
      <div className="mt-10 border border-[#d9ded4] bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold">Your compliance roadmap</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#526057]">
          Generate a personalized checklist of the registrations, filings and
          licenses your business needs — grounded in official Indian compliance
          sources.
        </p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="mt-6 bg-[#427a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate my roadmap"}
        </button>
      </div>
    );
  }

  const doneCount = counts.Done;
  const total = counts.All;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your compliance roadmap</h2>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="text-sm font-medium text-[#427a5b] hover:underline disabled:opacity-60"
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      {/* Progress */}
      <div className="mt-4 border border-[#d9ded4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {doneCount} of {total} complete
          </span>
          <span className="text-[#5c6b61]">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e4e8e0]">
          <div
            className="h-full rounded-full bg-[#427a5b] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`border px-3 py-1.5 text-xs font-medium transition ${
              filter === f
                ? "border-[#427a5b] bg-[#427a5b]/5 text-[#356549]"
                : "border-[#d9ded4] bg-white text-[#5c6b61] hover:border-[#427a5b]/50"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {/* Cards */}
      <div className="mt-5 space-y-4">
        {visible.map((entry) => (
          <ChecklistCard
            key={entry.userComplianceId}
            entry={entry}
            onStatusChange={updateStatus}
            onDeadlineChange={updateDeadline}
          />
        ))}
      </div>

      <p className="mt-8 text-xs leading-5 text-[#8a978c]">
        {disclaimer ?? FALLBACK_DISCLAIMER}
      </p>
    </div>
  );
}

function ChecklistCard({
  entry,
  onStatusChange,
  onDeadlineChange,
}: {
  entry: ChecklistEntry;
  onStatusChange: (id: string, status: ComplianceStatus) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}) {
  const { item, status, deadline } = entry;
  const urgency = deadline ? urgencyOf(deadline) : null;
  const days = deadline ? daysUntil(deadline) : null;
  return (
    <article className="border border-[#d9ded4] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{item.name}</h3>
            <span className="border border-[#d9ded4] px-2 py-0.5 text-[11px] font-medium text-[#5c6b61]">
              {item.category}
            </span>
            {item.mandatory ? (
              <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                Mandatory
              </span>
            ) : null}
          </div>
        </div>
        <label className="sr-only" htmlFor={`status-${entry.userComplianceId}`}>
          Status for {item.name}
        </label>
        <select
          id={`status-${entry.userComplianceId}`}
          value={status}
          onChange={(e) =>
            onStatusChange(entry.userComplianceId, e.target.value as ComplianceStatus)
          }
          className={`border px-2.5 py-1.5 text-xs font-medium outline-none ${STATUS_STYLES[status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {item.description ? (
        <p className="mt-3 text-sm leading-6 text-[#3d4842]">{item.description}</p>
      ) : null}

      {/* Deadline editor */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]"
          htmlFor={`deadline-${entry.userComplianceId}`}
        >
          Deadline
        </label>
        <input
          id={`deadline-${entry.userComplianceId}`}
          type="date"
          value={deadline ?? ""}
          onChange={(e) =>
            onDeadlineChange(entry.userComplianceId, e.target.value || null)
          }
          className="border border-[#d9ded4] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#427a5b] focus:ring-1 focus:ring-[#427a5b]"
        />
        {deadline && urgency && days !== null && status !== "Done" ? (
          <span className={`border px-2 py-0.5 text-[11px] font-medium ${URGENCY_STYLES[urgency]}`}>
            {days < 0
              ? `${Math.abs(days)}d overdue`
              : days === 0
                ? "due today"
                : `in ${days}d`}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {item.how_to_apply ? (
          <Field label="How to apply" value={item.how_to_apply} />
        ) : null}
        {item.deadline_note ? (
          <Field label="Typical timeframe" value={item.deadline_note} />
        ) : null}
        {item.penalty ? <Field label="Penalty" value={item.penalty} /> : null}
      </dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
        {label}
      </dt>
      <dd className="mt-0.5 leading-6 text-[#3d4842]">{value}</dd>
    </div>
  );
}
