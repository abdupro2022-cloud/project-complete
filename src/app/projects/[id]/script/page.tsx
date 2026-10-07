"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Type,
  Wand2,
} from "lucide-react";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Field, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ApiError, callAI } from "@/lib/api/client";
import { useApp, useScriptSections } from "@/lib/store/provider";
import { DEFAULT_SCRIPT_BEATS, SCRIPT_AI_ACTIONS, type ScriptAIAction, type ScriptSection } from "@/lib/types";
import { cn, estimateSpeechSeconds, uid } from "@/lib/utils";

/**
 * Script Studio.
 *
 * A document editor, not a textarea in a dark frame: a beat rail on one side,
 * the writing surface in the middle, and AI actions plus live duration on the
 * other. AI output is never written straight into the text — it arrives as a
 * before/after choice so the writer stays the author.
 */
export default function ScriptStudioPage() {
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useApp();
  const toast = useToast();
  const project = state.projects.find((p) => p.id === id) ?? null;
  const scripts = state.scripts.filter((s) => s.projectId === id);
  const [scriptId, setScriptId] = useState<string | null>(null);

  // Default to the project's first script, creating one on demand.
  useEffect(() => {
    if (!scriptId && scripts[0]) setScriptId(scripts[0].id);
  }, [scripts, scriptId]);

  const sections = useScriptSections(scriptId);
  const script = scripts.find((s) => s.id === scriptId) ?? null;

  const totalSec = useMemo(() => sections.reduce((n, s) => n + (s.estimatedSec || estimateSpeechSeconds(s.narration)), 0), [sections]);
  const targetSec = script?.targetDurationSec ?? project?.targetDurationSec ?? 600;
  const overBy = totalSec - targetSec;

  if (!project) return null;

  const ensureScript = () => {
    if (script) return script;
    const s = actions.createScript({ projectId: project.id, title: `${project.title} — السكربت` });
    setScriptId(s.id);
    return s;
  };

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="استوديو السكربت"
        description="كل مشهد يحمل سرده وتوجيهه البصري ومصدره. المدة تُحسب من سرعة النطق الفعلية، لا من تقدير ثابت."
        badge={sections.length > 0 ? <Badge tone="accent">{sections.length} مشهد</Badge> : undefined}
        actions={
          scripts.length > 1 ? (
            <select
              value={scriptId ?? ""}
              onChange={(e) => setScriptId(e.target.value)}
              aria-label="اختر السكربت"
              className="h-9 rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none focus:border-accent"
            >
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {!script ? (
        <EmptyState
          icon={<Type className="size-4" />}
          title="لا سكربت بعد"
          description="السكربت يبدأ من بحثك: كل مشهد سيعرف ما رقمه ومصدره. أنشئ أول مسودة."
          action={{ label: "إنشاء سكربت", onClick: ensureScript, icon: <Plus className="size-3.5" /> }}
        />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={<Type className="size-4" />}
          title="السكربت فارغ"
          description="ابدأ بالخطّاف. جملة واحدة توقف التمرير أهم من عشر جمل لاحقة."
          action={{ label: "أضف أول مشهد", onClick: () => addSection(actions, script.id, 0, "hook"), icon: <Plus className="size-3.5" /> }}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[13rem_1fr_17rem]">
          <BeatRail scriptId={script.id} sections={sections} />
          <ScriptSurface scriptId={script.id} sections={sections} />
          <ContextPanel
            projectId={project.id}
            totalSec={totalSec}
            targetSec={targetSec}
            overBy={overBy}
            sectionCount={sections.length}
          />
        </div>
      )}
    </ProjectWorkspace>
  );
}

function addSection(actions: ReturnType<typeof useApp>["actions"], scriptId: string, order: number, beatKey: string) {
  return actions.addScriptSection({
    scriptId,
    beatKey,
    order,
    narration: "",
    visual: "",
    broll: "",
    onScreenText: "",
    sound: "",
    sourceIds: [],
    estimatedSec: 0,
  });
}

// ---------------------------------------------------------------------------
// Beat rail
// ---------------------------------------------------------------------------

function BeatRail({ scriptId, sections }: { scriptId: string; sections: ScriptSection[] }) {
  const { state, actions } = useApp();
  const script = state.scripts.find((s) => s.id === scriptId);
  const beats = script?.structure?.beats ?? DEFAULT_SCRIPT_BEATS;

  return (
    <Panel className="h-fit p-3 xl:sticky xl:top-4">
      <h2 className="label mb-2.5">الهيكل</h2>
      <ol className="space-y-0.5">
        {beats.map((b) => {
          const count = sections.filter((s) => s.beatKey === b.key).length;
          const filled = count > 0;
          return (
            <li key={b.key}>
              <button
                type="button"
                onClick={() => addSection(actions, scriptId, sections.length, b.key)}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-panel-2"
                title={`${b.purpose} — اضغط لإضافة مشهد`}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-colors",
                    filled ? "bg-accent" : "bg-line-strong group-hover:bg-ink-faint",
                  )}
                  aria-hidden
                />
                <span className={cn("flex-1 truncate text-2xs", filled ? "text-ink-soft" : "text-ink-mute")}>
                  {b.label}
                </span>
                {filled && <span className="num text-[10px] text-ink-faint">{count}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => addSection(actions, scriptId, sections.length, "free")}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-line px-2 py-1.5 text-2xs text-ink-mute transition-colors hover:border-line-strong hover:text-ink"
        >
          <Plus className="size-3" aria-hidden />
          مشهد حر
        </button>
      </div>

      {script?.structure?.rationale && (
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-ink-faint">
          {script.structure.rationale}
        </p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Writing surface
// ---------------------------------------------------------------------------

function ScriptSurface({ scriptId, sections }: { scriptId: string; sections: ScriptSection[] }) {
  const { actions } = useApp();
  const toast = useToast();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    const ids = sections.map((s) => s.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    actions.reorderScriptSections(scriptId, ids);
  };

  const runAi = async (section: ScriptSection, action: ScriptAIAction) => {
    if (!section.narration.trim()) {
      setError("اكتب نص المشهد أولًا — لا يوجد ما يحسّنه الذكاء الاصطناعي.");
      return;
    }
    setBusy(section.id);
    setError(null);
    try {
      const res = await callAI(
        [
          {
            role: "system",
            content:
              "أنت محرّر نصوص فيديو. أعد كتابة النص المطلوب فقط. لا تضف مقدمة ولا خاتمة ولا شرحًا لما فعلت. حافظ على الأرقام كما هي تمامًا.",
          },
          { role: "user", content: `المهمة: ${action}\n\nالنص:\n${section.narration}` },
        ],
        action === "fact_check" ? "analysis" : "writing",
      );
      setPending((p) => ({ ...p, [section.id]: res.text.split("\n---\n")[0] }));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      {error && <ErrorState error={error} compact onRetry={() => setError(null)} />}

      {sections.map((section, i) => {
        const open = expanded[section.id];
        const sec = section.estimatedSec || estimateSpeechSeconds(section.narration);
        return (
          <Panel key={section.id} className="sheen overflow-hidden">
            {/* header */}
            <div className="flex items-center gap-2.5 border-b border-line-soft px-3.5 py-2">
              <span className="num shrink-0 text-[10px] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <Badge tone="neutral" className="shrink-0">
                {DEFAULT_SCRIPT_BEATS.find((b) => b.key === section.beatKey)?.label ?? section.beatKey}
              </Badge>
              <span className="num text-[10px] text-ink-faint">≈ {sec}ث</span>

              <div className="ms-auto flex items-center gap-0.5">
                <IconButton label="تحريك لأعلى" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton label="تحريك لأسفل" size="sm" disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton
                  label={open ? "طيّ التفاصيل" : "تفاصيل المشهد"}
                  size="sm"
                  onClick={() => setExpanded((e) => ({ ...e, [section.id]: !open }))}
                  aria-expanded={open}
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
                </IconButton>
                <IconButton
                  label="حذف المشهد"
                  size="sm"
                  onClick={() => actions.removeScriptSection(section.id)}
                  className="text-ink-faint hover:text-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </IconButton>
              </div>
            </div>

            {/* narration — the document surface */}
            <div className="px-4 py-3">
              <label htmlFor={`n-${section.id}`} className="sr-only">
                سرد المشهد
              </label>
              <Textarea
                id={`n-${section.id}`}
                autoGrow
                rows={1}
                value={section.narration}
                placeholder="اكتب ما يُقال في هذا المشهد…"
                onChange={(e) => actions.updateScriptSection(section.id, { narration: e.target.value })}
                className="border-transparent bg-transparent px-0 text-[1.0625rem] leading-[1.85] focus:border-transparent focus:ring-0"
              />
            </div>

            {/* production fields */}
            {open && (
              <div className="grid gap-3 border-t border-line-soft bg-surface px-4 py-3.5 sm:grid-cols-2">
                <Field label="التوجيه البصري">
                  {(fid) => (
                    <Input2
                      id={fid}
                      value={section.visual}
                      onChange={(v) => actions.updateScriptSection(section.id, { visual: v })}
                      placeholder="لقطة ثابتة لمستودع فارغ"
                    />
                  )}
                </Field>
                <Field label="ب‑رول">
                  {(fid) => (
                    <Input2
                      id={fid}
                      value={section.broll}
                      onChange={(v) => actions.updateScriptSection(section.id, { broll: v })}
                      placeholder="أرشيف صور الشركة"
                    />
                  )}
                </Field>
                <Field label="نص على الشاشة">
                  {(fid) => (
                    <Input2
                      id={fid}
                      value={section.onScreenText}
                      onChange={(v) => actions.updateScriptSection(section.id, { onScreenText: v })}
                      placeholder="$240M → $0"
                    />
                  )}
                </Field>
                <Field label="الصوت">
                  {(fid) => (
                    <Input2
                      id={fid}
                      value={section.sound}
                      onChange={(v) => actions.updateScriptSection(section.id, { sound: v })}
                      placeholder="صمت ثم رياح"
                    />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <span className="label">مصادر المشهد</span>
                  <p className="mt-1.5 text-2xs text-ink-mute">
                    {section.sourceIds.length > 0
                      ? `${section.sourceIds.length} مصدر مرتبط — يظهر في تحقق الحقائق.`
                      : "لا مصادر مرتبطة بعد. اربط الأرقام بمصادرها في تبويب التحقق."}
                  </p>
                </div>
              </div>
            )}

            {/* AI actions */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line-soft bg-surface px-3.5 py-2.5">
              <span className="me-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
                <Wand2 className="size-3" aria-hidden />
                الذكاء الاصطناعي
              </span>
              {SCRIPT_AI_ACTIONS.filter((a) => a.id !== "generate_shorts").map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => void runAi(section, a.id as ScriptAIAction)}
                  disabled={busy === section.id}
                  title={a.hint}
                  className="rounded-md border border-line px-2 py-1 text-[10px] text-ink-mute transition-colors hover:border-accent/40 hover:text-ink disabled:opacity-50"
                >
                  {busy === section.id ? <Loader2 className="size-3 animate-spin" aria-hidden /> : a.label}
                </button>
              ))}
            </div>

            {/* AI proposal — accept or discard, never silent */}
            {pending[section.id] && (
              <div className="border-t border-accent/25 bg-accent-tint/20 px-4 py-3">
                <p className="label mb-1.5">اقتراح — لم يُكتب بعد</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {pending[section.id]}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      actions.updateScriptSection(section.id, { narration: pending[section.id] });
                      setPending((p) => ({ ...p, [section.id]: "" }));
                      toast.success("كُتب الاقتراح");
                    }}
                  >
                    استبدل النص
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPending((p) => ({ ...p, [section.id]: "" }))}>
                    تجاهل
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        );
      })}

      <Button
        variant="subtle"
        block
        icon={<Plus className="size-4" />}
        onClick={() => addSection(actions, scriptId, sections.length, "free")}
      >
        أضف مشهدًا
      </Button>
    </div>
  );
}

function Input2({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-line bg-panel px-3 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-accent"
    />
  );
}

// ---------------------------------------------------------------------------
// Context panel
// ---------------------------------------------------------------------------

function ContextPanel({
  projectId,
  totalSec,
  targetSec,
  overBy,
  sectionCount,
}: {
  projectId: string;
  totalSec: number;
  targetSec: number;
  overBy: number;
  sectionCount: number;
}) {
  const { state } = useApp();
  const project = state.projects.find((p) => p.id === projectId);
  const sources = state.sources.filter((s) => s.projectId === projectId);
  const pct = Math.min(100, (totalSec / targetSec) * 100);

  return (
    <div className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
      <Panel className="p-3.5">
        <h2 className="label mb-2.5">المدة</h2>
        <p className="num text-2xl font-semibold tracking-tight text-ink">
          {Math.floor(totalSec / 60)}:{String(Math.round(totalSec % 60)).padStart(2, "0")}
        </p>
        <p className="mt-0.5 text-2xs text-ink-mute">
          من هدف {Math.floor(targetSec / 60)} دقيقة
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", overBy > 0 ? "bg-attention" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className={cn("mt-2 text-2xs leading-relaxed", overBy > 0 ? "text-attention" : "text-ink-mute")}>
          {overBy > 0
            ? `أطول بـ ${Math.round(overBy)} ثانية من الهدف. اختصر مشهدين أو ارفع الهدف.`
            : sectionCount > 0
              ? "داخل النطاق."
              : "لم تبدأ الكتابة بعد."}
        </p>
      </Panel>

      <Panel className="p-3.5">
        <h2 className="label mb-2.5">السياق المتاح</h2>
        <ul className="space-y-1.5 text-2xs">
          <li className="flex items-center justify-between">
            <span className="text-ink-mute">مصادر</span>
            <span className="num text-ink-soft">{sources.length}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-ink-mute">ادعاءات</span>
            <span className="num text-ink-soft">{state.claims.filter((c) => c.projectId === projectId).length}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-ink-mute">تناقضات</span>
            <span
              className={cn(
                "num",
                state.contradictions.filter((c) => c.projectId === projectId).length > 0 ? "text-attention" : "text-ink-soft",
              )}
            >
              {state.contradictions.filter((c) => c.projectId === projectId).length}
            </span>
          </li>
        </ul>

        <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          <Link href={`/projects/${projectId}/fact-check`} className="text-2xs text-accent-soft hover:underline">
            تحقّق قبل الكتابة
          </Link>
          <Link href={`/projects/${projectId}/sources`} className="text-2xs text-accent-soft hover:underline">
            مراجعة المصادر
          </Link>
          <Link href={`/projects/${projectId}/shorts`} className="text-2xs text-accent-soft hover:underline">
            استخراج شورتس
          </Link>
        </div>
      </Panel>

      {project?.premise && (
        <Panel className="p-3.5">
          <h2 className="label mb-2">فرضية المشروع</h2>
          <p className="text-2xs leading-relaxed text-ink-mute">{project.premise}</p>
        </Panel>
      )}
    </div>
  );
}
