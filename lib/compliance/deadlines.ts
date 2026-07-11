import type { GeneratedChecklistItem } from "@/lib/validations/compliance";

// Deadline helpers shared by the calendar, the dashboard widget, and the cron
// job. Dates are handled as YYYY-MM-DD strings in local terms to avoid TZ drift
// between the browser calendar and the server-side alert job.

export type Urgency = "overdue" | "urgent" | "soon" | "ok";

/** Format a Date as YYYY-MM-DD (local). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from today (local midnight) until `dueDate` (YYYY-MM-DD). */
export function daysUntil(dueDate: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** Urgency bucket used for the red/amber/green colour coding. */
export function urgencyOf(dueDate: string, now = new Date()): Urgency {
  const days = daysUntil(dueDate, now);
  if (days < 0) return "overdue";
  if (days <= 1) return "urgent";
  if (days <= 7) return "soon";
  return "ok";
}

/** Tailwind classes per urgency (border + subtle fill + text). */
export const URGENCY_STYLES: Record<Urgency, string> = {
  overdue: "border-red-300 bg-red-50 text-red-700",
  urgent: "border-red-300 bg-red-50 text-red-700",
  soon: "border-[#c9a53a]/50 bg-[#c9a53a]/10 text-[#8a6d16]",
  ok: "border-[#427a5b]/40 bg-[#427a5b]/10 text-[#356549]",
};

/** Dot colour per urgency, for the calendar cells. */
export const URGENCY_DOT: Record<Urgency, string> = {
  overdue: "bg-red-500",
  urgent: "bg-red-500",
  soon: "bg-[#c9a53a]",
  ok: "bg-[#427a5b]",
};

/**
 * Suggest a target deadline for a freshly generated item. We don't have exact
 * statutory dates per founder, so we space items out by how urgent they are:
 * mandatory + high priority soonest, optional items furthest out.
 */
export function suggestDeadline(
  item: Pick<GeneratedChecklistItem, "necessity" | "priority">,
  from = new Date(),
): string {
  let offsetDays: number;
  if (item.necessity === "mandatory") {
    offsetDays = item.priority <= 20 ? 30 : 45;
  } else if (item.necessity === "conditional") {
    offsetDays = 60;
  } else {
    offsetDays = 90;
  }
  const due = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  due.setDate(due.getDate() + offsetDays);
  return toDateKey(due);
}
