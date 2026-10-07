"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  FlaskConical,
  Link2,
  ListChecks,
  PenLine,
  Puzzle,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useApp, useProjectBundle } from "@/lib/store/provider";
import { cn, estimateSpeechSeconds, timeAgo, uid } from "@/lib/utils";
import { now } from "@/lib/utils";

/**
 * Project overview.
 *
 * The Project Map is the point of this screen: a single strip showing which
 * stages have produced something and which are still empty, so "where is this
 * project right now" is answerable at a glance.
 */

const NODES: { key: string; label: string; href: string; icon: LucideIcon; count: (b: ReturnType<typeof useProjectBundle>) => number }[] = [
  { key: "research", label: "البحث", href: "research", icon: FlaskConical, count: (b) => b.sources.length },
  { key: "sources", label: "المصادر", href: "sources", icon: Link2, count: (b) => b.sources.length },
  { key: "timeline", label: "الخط الزمني", href: "timeline", icon: ListChecks, count: (b) => b.events.length },
  { key: "entities", label: "الكيانات", href: "entities", icon: Puzzle, count: (b) => b.entities.length },
  { key: "script", label: "السكربت", href: "script", icon: PenLine, count: (b) => (b.script ? b.scripts[0] ? 1 : 0 : 0) },
  { key: "fact", label: "التحقق", href: "fact-check", icon: Target, count: (b) => b.claims.length },
];

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const bundle = useProjectBundle(id);

  return (
    <ProjectWorkspace>
      <ProjectMap bundle={bundle} />
      <Counts bundle={bundle} />
      <Notes projectId={id} />
      <Activity projectId={id} />
    </ProjectWorkspace>
  );
}

// ---------------------------------------------------------------------------
// Project map
// ---------------------------------------------------------------------------

function ProjectMap({ bundle }: { bundle: ReturnType<typeof useProjectBundle> }) {
  const hasAny = NODES.some((n) => n.count(bundle) > 0);

  return (
    <Panel className="sheen mb-5 overflow-hidden">
      <PanelHeader
        title="خريطة المشروع"
        subtitle="ما الذي أنجزته فعلًا، وما هو فارغ بعد"
        icon={<Sparkles className="size-4" />}
      />
      <div className="overflow-x-auto p-4 no-scrollbar">
        <ol className="flex min-w-max items-stretch gap-1.5">
          {NODES.map((n, i) => {
            const count = n.count(bundle);
            const filled = count > 0;
            const Icon = n.icon;
            return (
              <li key={n.key} className="flex items-stretch gap-1.5">
                <Link
                  href={`#${n.href}`}
                  className={cn(
                    "group flex w-[132px] shrink-0 flex-col gap-2 rounded-lg border p-3 transition-colors duration-200",
                    filled
                      ? "border-line-strong bg-panel-2 hover:bg-panel-3"
                      : "border-dashed border-line bg-surface/50 hover:border-line",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("size-3.5", filled ? "text-accent" : "text-ink-faint")} aria-hidden />
                    <span className={cn("num text-xs font-semibold", filled ? "text-ink" : "text-ink-faint")}>{count}</span>
                  </div>
                  <span className={cn("text-2xs", filled ? "text-ink-soft" : "text-ink-faint")}>{n.label}</span>
                </Link>
                {i < NODES.length - 1 && (
                  <span className={cn("self-center w-4 shrink-0", filled ? "text-ink-faint" : "text-line")} aria-hidden>
                    <ArrowLeft className="size-3" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {!hasAny && (
        <p className="border-t border-line bg-surface px-4 py-3 text-2xs leading-relaxed text-ink-mute">
          الخريطة فارغة تمامًا. ابدأ من البحث — كل ما تضيفه بعدها يظهر هنا تلقائيًا.
        </p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

function Counts({ bundle }: { bundle: ReturnType<typeof useProjectBundle> }) {
  const { state } = useApp();
  const sections = state.scriptSections.filter((s) => bundle.scripts.some((x) => x.id === s.scriptId));
  const seconds = sections.reduce((n, s) => n + s.estimatedSec, 0);

  const items = [
    { label: "مصادر", value: bundle.sources.length, href: "sources" },
    { label: "ادعاءات", value: bundle.claims.length, href: "fact-check" },
    { label: "تناقضات", value: bundle.contradictions.length, href: "fact-check", warn: true },
    { label: "أحداث زمنية", value: bundle.events.length, href: "timeline" },
    { label: "كيانات", value: bundle.entities.length, href: "entities" },
    { label: "فجوات محتوى", value: bundle.gaps.length, href: "competitors" },
  ];

  return (
    <div className="mb-5 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      {items.map((i) => (
        <Link key={i.label} href={`#${i.href}`} className="bg-panel px-3.5 py-3 transition-colors hover:bg-panel-2">
          <p className="text-2xs text-ink-mute">{i.label}</p>
          <p className={cn("num mt-1 text-lg font-semibold", i.value === 0 ? "text-ink-faint" : i.warn ? "text-attention" : "text-ink")}>
            {i.value}
          </p>
        </Link>
      ))}
      {sections.length > 0 && (
        <div className="bg-panel px-3.5 py-3">
          <p className="text-2xs text-ink-mute">مقاطع السكربت</p>
          <p className="num mt-1 text-lg font-semibold text-ink">{Math.round(seconds / 60)}د</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes — autosaving
// ---------------------------------------------------------------------------

function Notes({ projectId }: { projectId: string }) {
  const { state, actions } = useApp();
  const note = state.projectNotes.find((n) => n.projectId === projectId);
  const [value, setValue] = useState(note?.body ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(note?.body ?? "");
  }, [note?.body, note?.id]);

  // Debounced autosave; the indicator tells the user it happened.
  useEffect(() => {
    if (value === (note?.body ?? "")) return;
    const t = setTimeout(() => {
      if (note) {
        actions.upsert("projectNotes", { ...note, body: value, updatedAt: now() });
      } else {
        actions.upsert("projectNotes", {
          id: uid("note"),
          projectId,
          body: value,
          createdAt: now(),
          updatedAt: now(),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    }, 700);
    return () => clearTimeout(t);
  }, [value, note, projectId, actions]);

  return (
    <Panel className="mb-5">
      <PanelHeader
        title="ملاحظات المشروع"
        subtitle="تُحفظ تلقائيًا"
        actions={
          <span className="flex items-center gap-1.5 text-2xs text-ink-faint">
            {saved ? (
              <>
                <StatusDot tone="ok" /> حُفظ
              </>
            ) : value ? (
              "يكتب…"
            ) : null}
          </span>
        }
      />
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder="اكتب هنا ما لا تريد أن تنساه: تناقض واجهتك، رقم تحتاج تأكيده، فكرة جانبية…"
          aria-label="ملاحظات المشروع"
          className="w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Recent project activity
// ---------------------------------------------------------------------------

function Activity({ projectId }: { projectId: string }) {
  const { state } = useApp();
  const rows = state.activity.filter((a) => a.projectId === projectId).slice(0, 6);

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        title="لا نشاط في هذا المشروع بعد"
        description="كل ما تنفّذه داخل المشروع سيظهر هنا."
      />
    );
  }

  return (
    <Panel className="overflow-hidden">
      <PanelHeader title="آخر النشاط في المشروع" />
      <ul className="divide-y divide-line-soft">
        {rows.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
            <StatusDot tone={a.outcome === "failure" ? "danger" : "ok"} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-soft">{a.what}</p>
              {a.detail && <p className="text-2xs text-ink-mute">{a.detail}</p>}
            </div>
            <span className="shrink-0 text-[10px] text-ink-faint">{timeAgo(a.at)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
