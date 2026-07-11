"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistEntry } from "@/types/compliance";
import {
  URGENCY_DOT,
  URGENCY_STYLES,
  toDateKey,
  urgencyOf,
  daysUntil,
} from "@/lib/compliance/deadlines";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Dated {
  entry: ChecklistEntry;
  dueDate: string;
}

export function DeadlineCalendar() {
  const [entries, setEntries] = useState<ChecklistEntry[] | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0); // months from the current month

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/compliance/generate");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        if (active) setEntries(data.checklist ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dated: Dated[] = useMemo(
    () =>
      (entries ?? [])
        .filter((e): e is ChecklistEntry & { deadline: string } => !!e.deadline)
        .map((e) => ({ entry: e, dueDate: e.deadline })),
    [entries],
  );

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayKey = toDateKey(today);

  // dateKey → items due that day
  const byDate = useMemo(() => {
    const map = new Map<string, Dated[]>();
    for (const d of dated) {
      const list = map.get(d.dueDate) ?? [];
      list.push(d);
      map.set(d.dueDate, list);
    }
    return map;
  }, [dated]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // This month's deadlines, sorted, for the list below the grid.
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthItems = dated
    .filter((d) => d.dueDate.startsWith(monthPrefix))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!entries) {
    return <p className="text-sm text-[#5c6b61]">Loading calendar…</p>;
  }

  return (
    <div>
      {/* Month header + nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-2">
          <NavButton label="‹" onClick={() => setOffset((o) => o - 1)} />
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="border border-[#d9ded4] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61] hover:border-[#427a5b]/50"
          >
            Today
          </button>
          <NavButton label="›" onClick={() => setOffset((o) => o + 1)} />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 border border-[#d9ded4] bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-[#eef0eb]">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-xs font-semibold text-[#8a978c]"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`b-${i}`} className="min-h-[76px] border-b border-r border-[#f1f3ee]" />;
            }
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const items = byDate.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`min-h-[76px] border-b border-r border-[#f1f3ee] p-1.5 ${
                  isToday ? "bg-[#427a5b]/5" : ""
                }`}
              >
                <div
                  className={`text-xs ${
                    isToday ? "font-bold text-[#356549]" : "text-[#5c6b61]"
                  }`}
                >
                  {day}
                </div>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 2).map((d) => (
                    <div
                      key={d.entry.userComplianceId}
                      className="flex items-center gap-1"
                      title={d.entry.item.name}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${URGENCY_DOT[urgencyOf(key)]}`}
                      />
                      <span className="truncate text-[10px] text-[#3d4842]">
                        {d.entry.item.name}
                      </span>
                    </div>
                  ))}
                  {items.length > 2 ? (
                    <div className="text-[10px] text-[#8a978c]">
                      +{items.length - 2} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* This month's list */}
      <h3 className="mt-8 text-sm font-semibold">
        Due in {MONTHS[month]} ({monthItems.length})
      </h3>
      {monthItems.length === 0 ? (
        <p className="mt-2 text-sm text-[#5c6b61]">
          No deadlines this month.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {monthItems.map(({ entry, dueDate }) => {
            const urgency = urgencyOf(dueDate);
            const days = daysUntil(dueDate);
            return (
              <li
                key={entry.userComplianceId}
                className={`flex items-center justify-between border px-3 py-2 text-sm ${URGENCY_STYLES[urgency]}`}
              >
                <span className="font-medium">{entry.item.name}</span>
                <span className="text-xs">
                  {dueDate}
                  {" · "}
                  {days < 0
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                      ? "today"
                      : `in ${days}d`}
                  {entry.status === "Done" ? " · Done" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-[#d9ded4] bg-white px-3 py-1 text-sm font-medium text-[#5c6b61] hover:border-[#427a5b]/50"
    >
      {label}
    </button>
  );
}
