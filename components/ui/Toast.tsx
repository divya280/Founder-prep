"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Lightweight toast system — a context provider mounted once in the root layout
// plus a useToast() hook. No external deps. Toasts auto-dismiss after a few
// seconds and can be dismissed by clicking.

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastApi {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TYPE_STYLES: Record<ToastType, string> = {
  success: "border-[#427a5b]/40 bg-[#eef4ef] text-[#2f5a41]",
  error: "border-red-300 bg-red-50 text-red-700",
  info: "border-[#d9ded4] bg-white text-[#3d4842]",
};

const DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = (idRef.current += 1);
      setItems((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => remove(id), DISMISS_MS);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => remove(t.id)}
            className={`pointer-events-auto border px-4 py-3 text-left text-sm font-medium shadow-sm transition ${TYPE_STYLES[t.type]}`}
          >
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Returns { toast }. If no provider is mounted (shouldn't happen), toast is a
 * no-op so callers never crash.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? { toast: () => {} };
}
