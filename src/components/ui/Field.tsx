"use client";

import React, { forwardRef, useId, useRef } from "react";

import { cn } from "@/lib/utils";

const FIELD_BASE =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint " +
  "transition-[border-color,box-shadow] dur-2 ease-expo " +
  "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-panel";

const INVALID = "border-danger/60 focus:border-danger focus:ring-danger/25";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
  className?: string;
}

/** Wraps a control with label, hint and error, wiring aria correctly. */
export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ms-1 text-danger">*</span>}
      </label>
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-2xs leading-relaxed text-ink-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-2xs font-medium leading-relaxed text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, mono, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        FIELD_BASE,
        "h-10",
        mono && "font-mono text-xs tracking-tight",
        invalid && INVALID,
        className,
      )}
      {...rest}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  autoGrow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, autoGrow, onChange, ...rest },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);

  const grow = (el: HTMLTextAreaElement | null) => {
    if (!autoGrow || !el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  React.useEffect(() => {
    if (autoGrow && inner.current) grow(inner.current);
  }, [autoGrow, rest.value]);

  return (
    <textarea
      ref={(el) => {
        inner.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
        grow(el);
      }}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        grow(e.target);
        onChange?.(e);
      }}
      className={cn(FIELD_BASE, "resize-y py-2.5 leading-relaxed", autoGrow && "resize-none overflow-hidden", invalid && INVALID, className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(FIELD_BASE, "h-10 appearance-none pe-9", className)}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-mute"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  },
);

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel px-3 py-2.5",
        "transition-colors dur-2 ease-expo hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm text-ink">{label}</span>
        {description && <span className="text-2xs leading-relaxed text-ink-mute">{description}</span>}
      </span>
    </label>
  );
}
