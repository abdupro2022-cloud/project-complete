"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Brain, ChevronDown, Link2, Sparkles } from "lucide-react";

import { Composer, WorkflowPanel } from "@/components/ai/Composer";
import { Markdown } from "@/components/ui/Markdown";
import { Badge } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { SectionBackdrop } from "@/components/ui/Motifs";
import { useApp, useMessages } from "@/lib/store/provider";
import { useActiveMemories } from "@/lib/store/provider";
import { cn, timeAgo } from "@/lib/utils";
import type { Message, WorkflowStep } from "@/lib/types";

/**
 * AI Assistant.
 *
 * A conversation scoped to one project. The right rail shows exactly what the
 * model can currently see — sources, script, memory — so the user can tell the
 * difference between "the AI doesn't know this" and "the AI wasn't told".
 */
export default function AssistantPage() {
  const { state, actions } = useApp();
  const memories = useActiveMemories();
  const [projectId, setProjectId] = useState<string>("");
  const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Default to the most recent active project; keep it stable afterwards.
  useEffect(() => {
    setProjectId((cur) => cur || state.projects[0]?.id || "");
  }, [state.projects]);

  const conversation = useMemo(
    () => state.conversations.find((c) => c.projectId === projectId) ?? null,
    [state.conversations, projectId],
  );
  const messages = useMessages(conversation?.id ?? null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const project = state.projects.find((p) => p.id === projectId) ?? null;
  const sources = state.sources.filter((s) => s.projectId === projectId);
  const script = state.scripts.find((s) => s.projectId === projectId);
  const sections = state.scriptSections.filter((s) => script && s.scriptId === script.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* --- conversation ---------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 md:px-6">
          <Brain className="size-4 shrink-0 text-accent" aria-hidden />
          <h1 className="text-sm font-semibold text-ink">المساعد</h1>
          {state.projects.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="محادثة المشروع"
              className="h-8 max-w-[220px] rounded-md border border-line bg-panel px-2 text-xs text-ink outline-none focus:border-accent"
            >
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          {project && <Badge tone="neutral">{project.stage}</Badge>}
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <SectionBackdrop variant="ai" />

          {/* Hero illustration matching the brand motif */}
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-line">
            <picture>
              <source srcSet="/illustrations/hero-ai.webp" type="image/webp" />
              <img
                src="/illustrations/hero-ai.webp"
                alt=""
                width={1280}
                height={720}
                className="h-auto w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
            <div className="pointer-events-none absolute bottom-4 start-4 me-4 max-w-md">
              <p className="text-2xs uppercase tracking-[0.18em] text-accent-soft">المساعد</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">ذكاء اصطناعي يعرف مشروعك</h1>
            </div>
          </div>

          {!project ? (
            <div className="mx-auto max-w-sm py-16 text-center">
              <p className="text-sm font-semibold text-ink">لا يوجد مشروع</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                المساعد يعمل داخل مشروع واحد في كل مرة حتى لا تختلط مصادر مشروعين.
              </p>
              <Link href="/projects" className="mt-4 inline-block text-xs text-accent-soft hover:underline">
                أنشئ مشروعًا
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-lg space-y-6 py-6">
              <div>
                <h2 className="text-lg font-semibold text-ink">محادثة عن {project.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                  كل ما تكتبه يُقرأ مع سياق هذا المشروع: {sources.length} مصدر،{" "}
                  {sections.length} مشهد سكربت، و{memories.length} تفضيل محفوظ.
                </p>
              </div>
              <EmptyState
                compact
                icon={<Sparkles className="size-4" />}
                title="ابدأ بسؤال أو مهمة"
                description="اكتب «ابحث لي عن…» أو «اكتب لي Hook» أو «قارن هذه القنوات» — والنظام يعرض لك خطته قبل تنفيذها."
              />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <MessageBlock
                  key={m.id}
                  message={m}
                  open={showSteps[m.id] ?? false}
                  onToggle={() => setShowSteps((s) => ({ ...s, [m.id]: !s[m.id] }))}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {project && (
          <div className="border-t border-line bg-surface px-4 py-3 md:px-6">
            <Composer
              compact
              projectId={projectId}
              placeholder="ماذا تريد أن تفعل داخل هذا المشروع؟"
            />
          </div>
        )}
      </div>

      {/* --- context rail ------------------------------------------------------ */}
      <aside className="hidden w-72 shrink-0 border-s border-line bg-surface lg:flex lg:flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <h2 className="label mb-2">ما يراه المساعد</h2>
            <ul className="space-y-1.5">
              {[
                ["مصادر", sources.length, `/projects/${projectId}/sources`],
                ["ادعاءات", state.claims.filter((c) => c.projectId === projectId).length, `/projects/${projectId}/fact-check`],
                ["أحداث زمنية", state.events.filter((e) => e.projectId === projectId).length, `/projects/${projectId}/timeline`],
                ["مقاطع سكربت", sections.length, `/projects/${projectId}/script`],
              ].map(([label, n, href]) => (
                <li key={label as string}>
                  <Link
                    href={href as string}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-2xs text-ink-mute transition-colors hover:bg-panel-2 hover:text-ink"
                  >
                    {label as string}
                    <span className="num ms-auto text-ink-soft">{n as number}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line pt-4">
            <h2 className="label mb-2">الذاكرة المستخدمة</h2>
            {memories.length === 0 ? (
              <p className="text-2xs leading-relaxed text-ink-faint">
                {state.settings.memoryEnabled
                  ? "لا تفضيلات محفوظة بعد. المساعد سيعمل بأسلوب افتراضي."
                  : "الذاكرة معطّلة من الإعدادات."}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {memories.slice(0, 5).map((m) => (
                  <li key={m.id} className="rounded-md border border-line bg-panel px-2.5 py-2">
                    <p className="text-2xs font-medium text-ink-soft">{m.key}</p>
                    <p className="mt-0.5 line-clamp-3 text-[10px] leading-relaxed text-ink-mute">{m.value}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/memory" className="mt-2 inline-block text-2xs text-accent-soft hover:underline">
              إدارة الذاكرة
            </Link>
          </div>

          {project?.premise && (
            <div className="border-t border-line pt-4">
              <h2 className="label mb-2">فرضية المشروع</h2>
              <p className="text-2xs leading-relaxed text-ink-mute">{project.premise}</p>
            </div>
          )}
        </div>

        <div className="border-t border-line p-3">
          <Link
            href="/ai/agents"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-2xs text-ink-mute transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <Link2 className="size-3.5" aria-hidden />
            انظر إلى الأدوات
          </Link>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

function MessageBlock({
  message,
  open,
  onToggle,
}: {
  message: Message;
  open: boolean;
  onToggle: () => void;
}) {
  const isUser = message.role === "user";
  const steps = (message.steps as WorkflowStep[] | null) ?? null;

  return (
    <article className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
          isUser ? "bg-panel-3 text-ink-soft" : "bg-accent-tint text-accent",
        )}
        aria-hidden
      >
        {isUser ? "ع" : <Sparkles className="size-3.5" />}
      </span>

      <div className={cn("min-w-0 flex-1", isUser && "flex items-end justify-end")}>
        <div
          className={cn(
            "max-w-[85%] rounded-lg border px-3.5 py-2.5",
            isUser ? "border-line bg-panel" : "border-line-soft bg-surface",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.content}</p>
          ) : (
            <>
              {message.intent && <Badge tone="accent" className="mb-2">{message.intent}</Badge>}
              <Markdown content={message.content} />

              {steps && steps.length > 0 && (
                <div className="mt-3 border-t border-line pt-2.5">
                  <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="flex w-full items-center gap-1.5 text-2xs text-ink-mute transition-colors hover:text-ink"
                  >
                    <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
                    {steps.filter((s) => s.status === "done").length}/{steps.length} خطوة
                  </button>
                  {open && (
                    <div className="mt-2">
                      <WorkflowPanel
                        steps={steps.map((s) => ({
                          ...s,
                          kind: "local" as const,
                          tool: s.toolName,
                          remedy: "none" as const,
                          elapsedMs: null,
                        }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {message.createdIds.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-ink-faint">أُنشئ</span>
                  {message.createdIds.slice(0, 5).map((c, i) => (
                    <Badge key={i} tone="neutral">
                      {c.label}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="mt-1.5 text-[10px] text-ink-faint">{timeAgo(message.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
