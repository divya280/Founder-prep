import type { ReactNode } from "react";

// Reusable empty-state card: a title, a short description, and an optional
// action (button or link passed as children). Keeps empty screens consistent
// across the checklist, vault, calendar, and shared views.

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#d9ded4] bg-white p-8 text-center shadow-sm">
      <h3 className="text-base font-semibold text-[#17201b]">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#526057]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
