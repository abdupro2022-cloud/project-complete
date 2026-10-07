"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger" | "live";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-soft active:bg-accent-deep disabled:bg-panel-3 disabled:text-ink-faint",
  secondary:
    "bg-panel-2 text-ink border border-line hover:bg-panel-3 hover:border-line-strong active:bg-panel",
  ghost:
    "text-ink-soft hover:text-ink hover:bg-panel-2 active:bg-panel-3",
  subtle:
    "bg-panel text-ink-soft border border-line-soft hover:text-ink hover:border-line hover:bg-panel-2",
  danger:
    "bg-danger-tint text-danger border border-danger/25 hover:bg-danger/20 hover:border-danger/40",
  live: "bg-live-tint text-live border border-live/25 hover:bg-live/20",
};

const SIZES: Record<Size, string> = {
  // min-h keeps every target at or above 44px on touch, and 32px on desktop
  // where the pointer is precise.
  sm: "h-8 min-h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 min-h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 min-h-12 px-6 text-base gap-2.5 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, icon, iconEnd, block, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
        "transition-[background-color,border-color,color,transform] dur-2 ease-expo",
        "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
      {!loading && iconEnd}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Icon button — always gets an accessible name
// ---------------------------------------------------------------------------

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, variant = "ghost", size = "md", active, children, ...rest },
  ref,
) {
  const box = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg",
        "transition-colors dur-2 ease-expo disabled:pointer-events-none disabled:opacity-50",
        box,
        VARIANTS[variant],
        active && "bg-panel-3 text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
              "transition-colors dur-2 ease-expo",
              active ? "bg-panel-3 text-ink" : "text-ink-mute hover:text-ink-soft",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
