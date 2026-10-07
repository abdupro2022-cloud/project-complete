"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { IconButton } from "./Button";
import { cn } from "@/lib/utils";

/**
 * Focus management for overlays.
 *
 * On open: focus moves into the dialog, focus is trapped inside it, and the
 * background is marked aria-hidden by virtue of `inert`-style scroll lock. On
 * close: focus returns to whatever opened it. Escape always closes.
 */

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // Focus the first control, or the panel itself if there is none.
    const t = setTimeout(() => (focusables()[0] ?? node)?.focus(), 20);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

// ---------------------------------------------------------------------------
// Modal — centred, for decisions and short forms
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useDialog(open, onClose);
  if (!open || typeof document === "undefined") return null;

  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-canvas-deep/80 backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-panel shadow-float animate-fade-up sm:rounded-2xl",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-ink-mute">{description}</p>}
          </div>
          <IconButton label="إغلاق" size="sm" onClick={onClose} className="-me-1 -mt-1">
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line bg-surface px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Drawer — slides from the inline-start edge, for context panels
// ---------------------------------------------------------------------------

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "end",
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "start" | "end";
  width?: string;
}) {
  const ref = useDialog(open, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-canvas-deep/75 backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col border-line bg-panel shadow-float",
          side === "end" ? "end-0 border-s" : "start-0 border-e",
          width,
        )}
        style={{ animation: `drawer-in 260ms var(--ease-out-expo)` }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          <IconButton label="إغلاق" size="sm" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
      <style>{`@keyframes drawer-in{from{transform:translateX(var(--drawer-from,100%));opacity:.4}to{transform:none;opacity:1}}
        [dir="rtl"] .drawer-in{--drawer-from:-100%}`}</style>
    </div>,
    document.body,
  );
}
