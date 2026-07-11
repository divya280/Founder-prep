"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChecklistEntry } from "@/types/compliance";
import {
  URGENCY_STYLES,
  daysUntil,
  toDateKey,
  urgencyOf,
} from "@/lib/compliance/deadlines";
import { Skeleton } from "@/components/ui/Skeleton";

// M10 dashboard overview row: compliance score, next 5 deadlines, and quick
// actions. Fetches the checklist once (the same endpoint the full ChecklistView
// below uses) and derives everything client-side.

interface Derived {
  total: number;
  done: number;
  pct: number;
  overdue: number;
  dueThisMonth: number;
  upcoming: ChecklistEntry[]; // next 5 undated-excluded, not Done, soonest first
}

function derive(entries: ChecklistEntry[]): Derived {
  const now = new Date();
  const monthPrefix = toDateKey(now).slice(0, 7);
  const total = entries.length;
  const done = entries.filter((e) => e.status === "Done").length;

  let overdue = 0;
  let dueThisMonth = 0;
  for (const e of entries) {
    if (!e.deadline || e.status === "Done") continue;
    if (daysUntil(e.deadline, now) < 0) overdue += 1;
    if (e.deadline.startsWith(monthPrefix)) dueThisMonth += 1;
  }

  const upcoming = entries
    .filter((e) => e.deadline && e.status !== "Done")
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 5);

  return {
    total,
    done,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    overdue,
    dueThisMonth,
    upcoming,
  };
}

export function DashboardWidgets() {
  const [entries, setEntries] = useState<ChecklistEntry[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/compliance/generate");
        const data = await res.json();
        if (active && res.ok) setEntries(data.checklist ?? []);
      } catch {
        /* best-effort; widgets simply stay empty */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const d = useMemo(() => derive(entries ?? []), [entries]);

  if (!loaded) {
    return (
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-40 rounded" />
        <Skeleton className="h-40 rounded lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <ScoreCard total={d.total} done={d.done} pct={d.pct} />
        <DeadlinesCard
          upcoming={d.upcoming}
          overdue={d.overdue}
          dueThisMonth={d.dueThisMonth}
        />
      </div>
      <QuickActions />
    </div>
  );
}

function ScoreCard({
  total,
  done,
  pct,
}: {
  total: number;
  done: number;
  pct: number;
}) {
  return (
    <div className="border border-[#d9ded4] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#8a978c]">
        Compliance score
      </p>
      {total === 0 ? (
        <p className="mt-4 text-sm text-[#526057]">
          Generate your roadmap below to start tracking progress.
        </p>
      ) : (
        <>
          <p className="mt-3 text-4xl font-semibold text-[#17201b]">{pct}%</p>
          <p className="mt-1 text-sm text-[#526057]">
            {done} of {total} tasks complete
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#e4e8e0]">
            <div
              className="h-full rounded-full bg-[#427a5b] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DeadlinesCard({
  upcoming,
  overdue,
  dueThisMonth,
}: {
  upcoming: ChecklistEntry[];
  overdue: number;
  dueThisMonth: number;
}) {
  return (
    <div className="border border-[#d9ded4] bg-white p-6 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8a978c]">
          Next deadlines
        </p>
        <div className="flex items-center gap-3 text-xs">
          {overdue > 0 ? (
            <span className="font-medium text-red-600">{overdue} overdue</span>
          ) : null}
          <span className="text-[#5c6b61]">{dueThisMonth} this month</span>
          <Link
            href="/calendar"
            className="font-medium text-[#427a5b] hover:underline"
          >
            Calendar →
          </Link>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-4 text-sm text-[#526057]">
          No upcoming deadlines. Add dates to your checklist items to see them
          here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {upcoming.map((e) => {
            const days = e.deadline ? daysUntil(e.deadline) : 0;
            const urgency = e.deadline ? urgencyOf(e.deadline) : "ok";
            return (
              <li
                key={e.userComplianceId}
                className={`flex items-center justify-between border px-3 py-2 text-sm ${URGENCY_STYLES[urgency]}`}
              >
                <span className="mr-2 truncate font-medium">{e.item.name}</span>
                <span className="shrink-0 text-xs">
                  {e.deadline}
                  {" · "}
                  {days < 0
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                      ? "today"
                      : `in ${days}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const ACTIONS = [
  { href: "/assistant", label: "Ask the AI assistant", hint: "Get grounded answers" },
  { href: "/vault", label: "Upload a document", hint: "Store certificates & filings" },
  { href: "/calendar", label: "View the calendar", hint: "See every deadline" },
];

function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="border border-[#d9ded4] bg-white p-4 shadow-sm transition hover:border-[#427a5b]/50"
        >
          <p className="text-sm font-semibold text-[#17201b]">{a.label}</p>
          <p className="mt-1 text-xs text-[#8a978c]">{a.hint}</p>
        </Link>
      ))}
    </div>
  );
}
