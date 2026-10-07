"use client";

import React from "react";

import { cn } from "@/lib/utils";
import type {
  ClaimStatus,
  CredibilityTier,
  IdeaStatus,
  PipelineStage,
  ProjectStatus,
} from "@/lib/types";
import {
  CLAIM_STATUS_LABELS_AR,
  IDEA_STATUS_LABELS_AR,
  PIPELINE_LABELS_AR,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Panel({
  className,
  children,
  as: As = "section",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside" }) {
  return (
    <As className={cn("panel", className)} {...rest}>
      {children}
    </As>
  );
}

/** A titled block. The title bar is structural, not decorative. */
export function PanelHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
  dense,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line",
        dense ? "px-4 py-2.5" : "px-5 py-3.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 shrink-0 text-ink-mute">{icon}</span>}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/** Vertical rhythm for a workspace. Sections, not cards. */
export function Section({
  children,
  className,
  title,
  aside,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-xs font-semibold tracking-wide text-ink-soft">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 h-px bg-line", className)} />;
}

// ---------------------------------------------------------------------------
// Badges & status
// ---------------------------------------------------------------------------

const TONE = {
  neutral: "bg-panel-2 text-ink-soft border-line",
  accent: "bg-accent-tint text-accent-soft border-accent/25",
  ok: "bg-ok-tint text-ok border-ok/25",
  warn: "bg-attention-tint text-attention border-attention/25",
  danger: "bg-danger-tint text-danger border-danger/25",
  live: "bg-live-tint text-live border-live/25",
  plum: "bg-plum-tint text-plum border-plum/25",
} as const;

export type Tone = keyof typeof TONE;

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
  mono,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-2xs font-medium leading-none",
        TONE[tone],
        mono && "font-mono",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function StatusDot({
  tone,
  pulse,
}: {
  tone: "ok" | "warn" | "danger" | "live" | "mute";
  pulse?: boolean;
}) {
  const color = {
    ok: "bg-ok",
    warn: "bg-attention",
    danger: "bg-danger",
    live: "bg-live",
    mute: "bg-ink-faint",
  }[tone];
  return (
    <span className="relative inline-flex size-2 shrink-0" aria-hidden>
      {pulse && <span className={cn("absolute inset-0 rounded-full opacity-40", color, "animate-pulse-soft")} />}
      <span className={cn("relative size-2 rounded-full", color)} />
    </span>
  );
}

const STAGE_TONE: Record<PipelineStage, Tone> = {
  idea: "neutral",
  research: "accent",
  outline: "accent",
  script: "plum",
  production: "warn",
  published: "ok",
  archived: "neutral",
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return <Badge tone={STAGE_TONE[stage]}>{PIPELINE_LABELS_AR[stage]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const labels: Record<ProjectStatus, string> = {
    idea: "فكرة",
    research: "قيد البحث",
    writing: "قيد الكتابة",
    production: "قيد الإنتاج",
    published: "منشور",
    archived: "مؤرشف",
  };
  return <Badge tone={STAGE_TONE[status as PipelineStage]}>{labels[status]}</Badge>;
}

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  return <Badge tone={status === "published" ? "ok" : "neutral"}>{IDEA_STATUS_LABELS_AR[status]}</Badge>;
}

const CRED_TONE: Record<CredibilityTier, Tone> = {
  high: "ok",
  medium: "neutral",
  low: "warn",
  unknown: "neutral",
};

const CRED_LABEL: Record<CredibilityTier, string> = {
  high: "موثوق",
  medium: "متوسط",
  low: "ضعيف",
  unknown: "غير مُقيَّم",
};

export function CredibilityBadge({ tier }: { tier: CredibilityTier }) {
  return <Badge tone={CRED_TONE[tier]}>{CRED_LABEL[tier]}</Badge>;
}

const CLAIM_TONE: Record<ClaimStatus, Tone> = {
  supported: "ok",
  contradicted: "danger",
  unclear: "warn",
  needs_verification: "accent",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return <Badge tone={CLAIM_TONE[status]}>{CLAIM_STATUS_LABELS_AR[status]}</Badge>;
}

// ---------------------------------------------------------------------------
// Demo marker — used everywhere demo data can appear
// ---------------------------------------------------------------------------

export function DemoTag({ className }: { className?: string }) {
  return (
    <Badge tone="warn" className={className}>
      بيانات تجريبية
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-panel-3", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-expo", TONE[tone].split(" ")[0])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Indeterminate sweep used while a step is running. */
export function RunningBar({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-px w-full overflow-hidden bg-line", className)} aria-hidden>
      <div className="absolute inset-y-0 w-1/3 animate-sweep bg-live" />
    </div>
  );
}
