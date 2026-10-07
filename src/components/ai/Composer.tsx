"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Circle,
  CornerDownLeft,
  Layers,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge, StatusDot } from "@/components/ui/Surface";
import { Markdown } from "@/components/ui/Markdown";
import { useToast } from "@/components/ui/Toast";
import { COMMAND_EXAMPLES, QUICK_INTENTS, classifyIntent, planFor } from "@/lib/intent/router";
import { runPlan, type RunStep } from "@/lib/workflow/runner";
import { useActiveMemories, useApp, useLiveProject } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

/**
 * The composer.
 *
 * This is the heart of the product, so it behaves like an instrument, not a
 * chat box: as you type, the system shows what it *understood* (intent +
 * subject) and what it *would do* (the plan) before you commit. Running it
 * then streams each step with its real result count.
 */
export function Composer({
  autoFocus,
  placeholder = "ماذا تريد أن تُنجز اليوم؟",
  onDone,
  compact,
  projectId,
}: {
  autoFocus?: boolean;
  placeholder?: string;
  onDone?: (answer: string) => void;
  compact?: boolean;
  /** Pin the composer to one project; defaults to the most recent active one. */
  projectId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const live = useLiveProject();
  const project = projectId ? (state.projects.find((p) => p.id === projectId) ?? null) : live;
  const memories = useActiveMemories();

  const [text, setText] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [answer, setAnswer] = useState("");
  const [created, setCreated] = useState<{ type: string; id: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aborted, setAborted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotating placeholder examples — stops when the user starts typing.
  useEffect(() => {
    if (text) return;
    const t = setInterval(() => setExampleIndex((i) => (i + 1) % COMMAND_EXAMPLES.length), 4200);
    return () => clearInterval(t);
  }, [text]);

  const intent = text.trim() ? classifyIntent(text) : null;
  const plan = intent ? planFor(intent) : null;

  const run = useCallback(async () => {
    const value = text.trim();
    if (!value || running) return;

    setRunning(true);
    setError(null);
    setAnswer("");
    setCreated([]);
    setAborted(false);
    const controller = new AbortController();
    abortRef.current = controller;

    const resolved = planFor(classifyIntent(value));
    setSteps(
      resolved.steps.map((s) => ({
        ...s,
        status: "pending",
        detail: null,
        resultCount: null,
        error: null,
        remedy: "none",
        elapsedMs: null,
      })),
    );

    try {
      const result = await runPlan(
        resolved,
        {
          project,
          memories: memories.map((m) => ({ key: m.key, value: m.value })),
          signal: controller.signal,
        },
        (step) => {
          setSteps((prev) => prev.map((s) => (s.id === step.id ? step : s)));
        },
      );

      setAnswer(result.answer);
      setCreated(result.createdIds);

      // Persist what the workflow produced into the active project.
      if (project) {
        const out = result.output;
        const newSources = (out.sources ?? []).map((s) => actions.addSource({ ...s, projectId: project.id }));
        (out.claims ?? []).forEach((c) =>
          actions.addClaim({ ...c, projectId: project.id, sourceIds: c.sourceIds.map((id) => newSources.find((s) => s.url === id)?.id ?? id) }),
        );
        (out.events ?? []).forEach((e) => actions.addEvent({ ...e, projectId: project.id }));
        (out.titles ?? []).forEach((t) => actions.addTitleIdea({ ...t, projectId: project.id }));

        if (newSources.length) {
          actions.logActivity({
            what: `بحث ويب: ${newSources.length} مصدر`,
            projectId: project.id,
            projectTitle: project.title,
            toolName: "search_web",
            outcome: "success",
            detail: resolved.intent.label,
          });
        }
        // Move the project forward if the research actually produced evidence.
        if (newSources.length > 0 && project.stage === "idea") {
          actions.setProjectStage(project.id, "research");
        }
      }

      const conv = actions.ensureConversation(project?.id ?? null, value.slice(0, 60));
      actions.addMessage({ conversationId: conv.id, projectId: project?.id ?? null, role: "user", content: value, intent: resolved.intent.id, steps: null, createdIds: [] });
      actions.addMessage({
        conversationId: conv.id,
        projectId: project?.id ?? null,
        role: "assistant",
        content: result.answer,
        intent: resolved.intent.id,
        steps: result.steps.map((s) => ({
          id: s.id, label: s.label, why: s.why, status: s.status, detail: s.detail,
          toolName: s.tool, startedAt: null, endedAt: null, resultCount: s.resultCount, error: s.error,
        })),
        createdIds: result.createdIds,
      });

      if (result.serverUnavailable) {
        toast.warning("الوضع التجريبي", "المزوّدون غير مربوطين — هذه نتيجة توضيحية. اربط مفتاحًا لتفعيل الوضع الحقيقي.");
      }
      onDone?.(result.answer);
    } catch (e) {
      setError((e as Error)?.message ?? "حدث خطأ غير متوقع.");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [text, running, project, memories, actions, onDone, plan, toast]);

  const cancel = () => {
    abortRef.current?.abort();
    setAborted(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void run();
    }
  };

  const activeCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className={cn("w-full", compact ? "" : "mx-auto max-w-3xl")}>
      {/* --- input ---------------------------------------------------------- */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-panel transition-[border-color,box-shadow] duration-300 ease-expo",
          "focus-within:border-accent/50 focus-within:shadow-lg",
          intent && !running ? "border-accent/35" : "border-line",
        )}
      >
        <div className="grid-texture pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative p-4 sm:p-5">
          <label htmlFor="composer" className="sr-only">
            اكتب ما تريد إنجازه
          </label>
          <textarea
            id="composer"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={compact ? 2 : 3}
            autoFocus={autoFocus}
            disabled={running}
            placeholder={
              text
                ? "…"
                : `${placeholder}\nمثال: ${COMMAND_EXAMPLES[exampleIndex]}`
            }
            className={cn(
              "w-full resize-none bg-transparent leading-relaxed text-ink outline-none placeholder:text-ink-faint",
              compact ? "text-sm" : "text-base sm:text-lg",
            )}
          />

          {/* Live intent read-out — the system shows its work before acting. */}
          {intent && !running && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Badge tone="accent" icon={<Sparkles className="size-3" />}>
                فهمت: {intent.label}
              </Badge>
              {intent.subject && (
                <span className="truncate text-2xs text-ink-mute">
                  حول: <span className="text-ink-soft">{intent.subject}</span>
                </span>
              )}
              <span className="num ms-auto text-[10px] text-ink-faint">
                ثقة {Math.round(intent.confidence * 100)}٪
              </span>
            </div>
          )}

          {intent && !running && plan && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-ink-faint">سأقوم بـ</span>
              {plan.steps.slice(0, 5).map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-2xs text-ink-mute">
                  <Circle className="size-1.5 fill-ink-faint" aria-hidden />
                  {s.label}
                </span>
              ))}
              {plan.steps.length > 5 && (
                <span className="text-2xs text-ink-faint">+{plan.steps.length - 5} خطوة</span>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="hidden items-center gap-2 text-2xs text-ink-faint sm:flex">
              <kbd className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono">Enter</kbd>
              للإرسال
              <kbd className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono">Shift+Enter</kbd>
              سطر جديد
            </div>

            {running ? (
              <Button variant="danger" size="sm" onClick={cancel} icon={<Square className="size-3 fill-current" />}>
                إيقاف
              </Button>
            ) : (
              <Button
                variant="primary"
                size={compact ? "sm" : "md"}
                onClick={() => void run()}
                disabled={!text.trim()}
                iconEnd={<ArrowLeft className="size-4" />}
                className="ms-auto"
              >
                نفّذ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* --- quick intents --------------------------------------------------- */}
      {!text && !running && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {QUICK_INTENTS.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setText(q.example);
                inputRef.current?.focus();
              }}
              className="group flex flex-col items-start gap-0.5 rounded-lg border border-line bg-surface px-3 py-2 text-start transition-colors duration-200 hover:border-accent/40 hover:bg-panel"
            >
              <span className="text-2xs font-medium text-ink-soft group-hover:text-ink">{q.label}</span>
              <span className="text-[10px] text-ink-faint">{q.hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* --- live workflow ---------------------------------------------------- */}
      {steps.length > 0 && (
        <WorkflowPanel steps={steps} running={running} aborted={aborted} />
      )}

      {/* --- error ------------------------------------------------------------ */}
      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-danger/25 bg-danger-tint/40 px-4 py-3">
          <p className="text-sm font-medium text-ink">تعذّر التنفيذ</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">{error}</p>
        </div>
      )}

      {/* --- answer ----------------------------------------------------------- */}
      {answer && (
        <div className="mt-5 animate-fade-up rounded-xl border border-line bg-panel">
          <header className="flex items-center gap-2 border-b border-line px-5 py-3">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            <h2 className="text-sm font-semibold text-ink">النتيجة</h2>
            <Badge tone={activeCount === steps.length ? "ok" : "warn"} className="ms-auto">
              {activeCount}/{steps.length} خطوة
            </Badge>
          </header>
          <div className="px-5 py-4">
            <Markdown content={answer} />
          </div>

          {created.length > 0 && (
            <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
              <span className="text-[10px] uppercase tracking-wider text-ink-faint">أُنشئ</span>
              {created.slice(0, 6).map((c, i) => (
                <Badge key={`${c.type}-${i}`} tone="neutral">
                  {c.label}
                </Badge>
              ))}
            </footer>
          )}

          <footer className="flex flex-wrap gap-2 border-t border-line bg-surface px-5 py-3">
            {project && <Button size="sm" variant="secondary" onClick={() => router.push(`/projects/${project.id}/research`)}>افتح البحث</Button>}
            <Button size="sm" variant="secondary" onClick={() => router.push("/ai")}>افتح المساعد</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAnswer("");
                setSteps([]);
                setCreated([]);
              }}
            >
              مسح
            </Button>
          </footer>
        </div>
      )}

      {state.tasks.some((t) => t.status === "failed") && !answer && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-attention/20 bg-attention-tint/40 px-4 py-2.5">
          <StatusDot tone="warn" />
          <span className="text-2xs text-ink-soft">هناك مهمة متوقّفة تحتاج انتباهك.</span>
          <button
            type="button"
            onClick={() => router.push("/today")}
            className="ms-auto min-h-8 shrink-0 rounded-md border border-attention/30 px-2.5 text-2xs font-medium text-attention transition-colors hover:bg-attention/10"
          >
            عرض
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live workflow visualisation
// ---------------------------------------------------------------------------

const STEP_ICON: Record<RunStep["status"], React.ReactNode> = {
  pending: <Circle className="size-3 text-ink-faint" aria-hidden />,
  running: <Loader2 className="size-3 animate-spin text-live" aria-hidden />,
  done: (
    <svg viewBox="0 0 12 12" className="size-3 text-ok" aria-hidden>
      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  failed: (
    <svg viewBox="0 0 12 12" className="size-3 text-danger" aria-hidden>
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  skipped: <Circle className="size-3 text-ink-faint" aria-hidden />,
};

export function WorkflowPanel({
  steps,
  running,
  aborted,
  className,
}: {
  steps: RunStep[];
  running?: boolean;
  aborted?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="سير العمل"
      aria-live="polite"
      className={cn("mt-4 overflow-hidden rounded-xl border border-line bg-panel", className)}
    >
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Layers className="size-3.5 text-ink-mute" aria-hidden />
        <h2 className="text-xs font-semibold text-ink-soft">سير العمل</h2>
        {running && (
          <Badge tone="live" className="ms-auto">
            <StatusDot tone="live" pulse />
            جارٍ
          </Badge>
        )}
        {aborted && !running && (
          <Badge tone="warn" className="ms-auto">
            متوقّف
          </Badge>
        )}
      </header>

      <ol className="divide-y divide-line-soft">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 px-4 py-2.5 transition-colors duration-300",
              step.status === "running" && "bg-live-tint/30",
              step.status === "failed" && "bg-danger-tint/25",
            )}
          >
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">{STEP_ICON[step.status]}</span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={cn("text-xs font-medium", step.status === "pending" ? "text-ink-mute" : "text-ink")}>
                  {step.label}
                </span>
                {step.tool && <span className="font-mono text-[10px] text-ink-faint">{step.tool}</span>}
                {step.resultCount !== null && step.status === "done" && (
                  <span className="num text-[10px] text-ink-faint">{step.resultCount}</span>
                )}
                {step.elapsedMs !== null && step.status === "done" && (
                  <span className="num text-[10px] text-ink-faint">· {Math.max(1, Math.round(step.elapsedMs))}ms</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-ink-faint">{step.why}</p>
              {step.detail && (
                <p className={cn("mt-1 text-2xs leading-relaxed", step.status === "failed" ? "text-danger" : "text-ink-mute")}>
                  {step.detail}
                </p>
              )}
            </div>

            <span className="num shrink-0 pt-0.5 text-[10px] text-ink-faint">
              {i + 1}/{steps.length}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
