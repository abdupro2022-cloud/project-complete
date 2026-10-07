"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Plug, RotateCw } from "lucide-react";

import { Button } from "./Button";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Every empty state answers three things: what goes here, why you want it, and
 * the single action that fills it.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-lg border border-line bg-panel text-ink-mute">
          {icon}
        </div>
      )}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description && <p className="text-xs leading-relaxed text-ink-mute">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button variant="primary" size="sm" onClick={action.onClick} icon={action.icon}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

/**
 * States the cause and the fix, then offers the matching action. There is no
 * path in this component that renders a bare "something went wrong".
 */
export function ErrorState({
  error,
  onRetry,
  onConfigure,
  className,
  compact,
}: {
  error: ApiError | { message: string; remedy?: string; retryable?: boolean } | string;
  onRetry?: () => void;
  onConfigure?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const message = typeof error === "string" ? error : error.message;
  const remedy = typeof error === "string" ? "none" : (error.remedy ?? "none");
  const retryable = typeof error === "string" ? false : (error.retryable ?? false);

  const remedyText = {
    configure: "الإصلاح: افتح الإعدادات وأضف مفتاح هذا المزوّد.",
    retry: "الإصلاح: أعد المحاولة. غالبًا مشكلة مؤقتة.",
    wait: "الإصلاح: انتظر قليلًا — تجاوزت حد الطلبات لدى المزوّد.",
    none: "",
  }[remedy as "configure" | "retry" | "wait" | "none"];

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-danger/25 bg-danger-tint/40",
        compact ? "px-4 py-3" : "px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-ink">تعذّر إتمام العملية</h3>
          <p className="text-xs leading-relaxed text-ink-soft">{message}</p>
          {remedyText && <p className="text-2xs leading-relaxed text-ink-mute">{remedyText}</p>}
        </div>
      </div>
      {(onRetry || onConfigure) && (
        <div className="flex flex-wrap gap-2">
          {onRetry && retryable !== false && (
            <Button size="sm" variant="secondary" onClick={onRetry} icon={<RotateCw className="size-3.5" />}>
              إعادة المحاولة
            </Button>
          )}
          {onConfigure && (
            <Button size="sm" variant="subtle" onClick={onConfigure} icon={<Plug className="size-3.5" />}>
              الذهاب للإعدادات
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small inline error for a control that failed without taking the page down. */
export function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-2xs font-medium leading-relaxed text-danger">
      <RefreshCw className="mt-px size-3 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-md bg-panel-2", className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-sweep bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ التحميل</span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Matches the shape of the content it replaces so nothing jumps on load. */
export function LoadingPanel({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      <span className="sr-only">جارٍ التحميل</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
