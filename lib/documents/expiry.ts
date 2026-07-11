import { daysUntil } from "@/lib/compliance/deadlines";

// Expiry colour-coding for the vault grid + the cron alert windows. Reuses the
// TZ-safe daysUntil() from the deadline helpers so the calendar, the vault, and
// the alert job all agree on "days from today".

export type ExpiryStatus = "expired" | "expiring" | "ok" | "none";

/** Alert the founder this many days before a document expires (M9 spec: 30). */
export const EXPIRY_ALERT_DAYS = 30;

/** Days before expiry at which the daily cron emails a reminder. */
export const EXPIRY_ALERT_WINDOWS = [30, 7, 1, 0];

export function expiryStatus(
  expiry: string | null,
  now = new Date(),
): ExpiryStatus {
  if (!expiry) return "none";
  const days = daysUntil(expiry, now);
  if (days < 0) return "expired";
  if (days <= EXPIRY_ALERT_DAYS) return "expiring";
  return "ok";
}

export const EXPIRY_STYLES: Record<ExpiryStatus, string> = {
  expired: "border-red-300 bg-red-50 text-red-700",
  expiring: "border-[#c9a53a]/50 bg-[#c9a53a]/10 text-[#8a6d16]",
  ok: "border-[#427a5b]/40 bg-[#427a5b]/10 text-[#356549]",
  none: "border-[#d9ded4] bg-[#f4f6f1] text-[#5c6b61]",
};

/** Short human label for a document's expiry, e.g. "Expires in 12 days". */
export function expiryLabel(expiry: string | null, now = new Date()): string {
  if (!expiry) return "No expiry";
  const days = daysUntil(expiry, now);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}
