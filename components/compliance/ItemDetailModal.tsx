"use client";

import { useEffect } from "react";
import type { ChecklistEntry, ComplianceStatus } from "@/types/compliance";

// Detail view for a single checklist item — opened by clicking a card. Shows
// the full compliance_items content (why required, who's responsible,
// documents required, how to apply, timeframe, penalty) that the card only
// summarizes. Read-only: status and deadline stay editable on the card.

const STATUS_STYLES: Record<ComplianceStatus, string> = {
  "Not Started": "border-[#d9ded4] bg-white text-[#5c6b61]",
  "In Progress": "border-[#c9a53a]/40 bg-[#c9a53a]/10 text-[#8a6d16]",
  Done: "border-[#427a5b]/40 bg-[#427a5b]/10 text-[#356549]",
};

export function ItemDetailModal({
  entry,
  onClose,
}: {
  entry: ChecklistEntry;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { item, status, deadline } = entry;

  const sections: { label: string; value: string | null }[] = [
    { label: "Why it's required", value: item.description },
    { label: "Who's responsible", value: item.responsible },
    { label: "Documents required", value: item.documents_required },
    { label: "How to apply", value: item.how_to_apply },
    { label: "Typical timeframe", value: item.deadline_note },
    { label: "Penalty for non-compliance", value: item.penalty },
  ];

  const hasGaps = sections.some((s) => !s.value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto border border-[#d9ded4] bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="item-detail-title" className="text-xl font-semibold">
              {item.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="border border-[#d9ded4] px-2 py-0.5 text-[11px] font-medium text-[#5c6b61]">
                {item.category}
              </span>
              {item.mandatory ? (
                <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  Mandatory
                </span>
              ) : null}
              <span
                className={`border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
              >
                {status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="border border-[#d9ded4] px-2.5 py-1 text-sm text-[#5c6b61] transition hover:border-[#427a5b] hover:text-[#427a5b]"
          >
            ✕
          </button>
        </div>

        <dl className="mt-6 space-y-5">
          {sections.map((section) =>
            section.value ? (
              <div key={section.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
                  {section.label}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-[#3d4842]">
                  {section.value}
                </dd>
              </div>
            ) : null,
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
              Your deadline
            </dt>
            <dd className="mt-1 text-sm leading-6 text-[#3d4842]">
              {deadline ?? "Not set — pick a date on the card."}
            </dd>
          </div>
        </dl>

        {hasGaps ? (
          <p className="mt-6 text-xs leading-5 text-[#8a978c]">
            Some details aren&apos;t available for this item yet. Regenerating
            your checklist can fill them in — your progress is kept.
          </p>
        ) : null}
      </div>
    </div>
  );
}
