"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn, uid } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastApi {
  push(t: Omit<Toast, "id" | "duration"> & { duration?: number }): void;
  success(title: string, description?: string): void;
  error(title: string, description?: string, action?: Toast["action"]): void;
  info(title: string, description?: string): void;
  warning(title: string, description?: string): void;
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-ok" aria-hidden />,
  error: <XCircle className="size-4 text-danger" aria-hidden />,
  warning: <AlertTriangle className="size-4 text-attention" aria-hidden />,
  info: <Info className="size-4 text-accent" aria-hidden />,
};

const BORDER: Record<ToastTone, string> = {
  success: "border-ok/25",
  error: "border-danger/30",
  warning: "border-attention/25",
  info: "border-accent/25",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback<ToastApi["push"]>(
    (t) => {
      const id = uid("t");
      // Errors stay longer — they usually need reading, not glancing.
      const duration = t.duration ?? (t.tone === "error" ? 9000 : 4500);
      setToasts((prev) => [...prev.slice(-3), { ...t, id, duration }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  // Clear pending timers if the provider unmounts mid-flight.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      dismiss,
      success: (title, description) => push({ tone: "success", title, ...(description ? { description } : {}) }),
      error: (title, description, action) =>
        push({ tone: "error", title, ...(description ? { description } : {}), ...(action ? { action } : {}) }),
      info: (title, description) => push({ tone: "info", title, ...(description ? { description } : {}) }),
      warning: (title, description) => push({ tone: "warning", title, ...(description ? { description } : {}) }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:items-end md:pe-6 md:pb-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-lg border bg-panel-2 px-4 py-3 shadow-lg",
              BORDER[t.tone],
            )}
          >
            <span className="mt-0.5 shrink-0">{ICON[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-ink">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-2xs leading-relaxed text-ink-mute">{t.description}</p>
              )}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-2xs font-semibold text-accent-soft underline-offset-2 hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="إغلاق الإشعار"
              className="-me-1 -mt-1 shrink-0 rounded p-1 text-ink-faint transition-colors hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
