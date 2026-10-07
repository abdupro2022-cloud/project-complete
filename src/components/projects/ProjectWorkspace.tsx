"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Images,
  LayoutGrid,
  Link2,
  ListChecks,
  Mic,
  PenLine,
  Puzzle,
  Target,
  Type,
  Users,
  FlaskConical,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, DemoTag, Panel, ProgressBar, StageBadge } from "@/components/ui/Surface";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { PIPELINE_LABELS_AR, PIPELINE_STAGES, type PipelineStage } from "@/lib/types";
import { useApp, useProject } from "@/lib/store/provider";
import { cn, formatDuration, timeAgo } from "@/lib/utils";

/**
 * Project workspace.
 *
 * A project is a container with its own views. The tab strip mirrors the
 * pipeline order (evidence → structure → output) so the mental model is the
 * production order, not an alphabetical list of tables.
 */
const TABS = [
  { id: "", label: "نظرة عامة", icon: LayoutGrid },
  { id: "research", label: "البحث", icon: FlaskConical },
  { id: "sources", label: "المصادر", icon: Link2 },
  { id: "competitors", label: "المنافسون", icon: Users },
  { id: "timeline", label: "الخط الزمني", icon: ListChecks },
  { id: "entities", label: "الكيانات", icon: Puzzle },
  { id: "script", label: "السكربت", icon: PenLine },
  { id: "shorts", label: "الشورتس", icon: FileText },
  { id: "titles", label: "العناوين", icon: Type },
  { id: "thumbnails", label: "الثامبنيل", icon: Images },
  { id: "fact-check", label: "تحقق الحقائق", icon: Target },
  { id: "transcript", label: "التفريغ", icon: Mic },
] as const;

/** Stages shown on the rail — archived is a status, not a place in the flow. */
const TRACKED_STAGES = PIPELINE_STAGES.filter((s) => s !== "archived") as readonly PipelineStage[];

export function ProjectWorkspace({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const project = useProject(params?.id);
  const { state, actions } = useApp();
  const [tab, setTab] = useState<string>("");

  // Tab lives in the URL so views are linkable and the back button works.
  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (h) setTab(h);
    const onHash = () => setTab(window.location.hash.replace("#", ""));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={<LayoutGrid className="size-4" />}
          title="المشروع غير موجود"
          description="ربما حُذف، أو الرابط غير صحيح."
          action={{ label: "كل المشاريع", onClick: () => router.push("/projects") }}
        />
      </div>
    );
  }

  const setStage = (stage: PipelineStage) => actions.setProjectStage(project.id, stage);

  const counts = {
    sources: state.sources.filter((s) => s.projectId === project.id).length,
    script: state.scriptSections.filter((s) => state.scripts.some((x) => x.id === s.scriptId && x.projectId === project.id)).length,
    shorts: state.shorts.filter((s) => s.projectId === project.id).length,
    titles: state.titleIdeas.filter((s) => s.projectId === project.id).length,
    contradictions: state.contradictions.filter((c) => c.projectId === project.id).length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      {/* --- header --------------------------------------------------------- */}
      <header className="mb-5">
        <Link
          href="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-2xs text-ink-mute transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3" aria-hidden />
          كل المشاريع
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{project.title}</h1>
              <StageBadge stage={project.stage} />
              {project.isDemo && <DemoTag />}
            </div>
            {project.premise && (
              <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-ink-mute">{project.premise}</p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-faint">
              <span className="num">{formatDuration(project.targetDurationSec)}</span>
              {project.audience && <span>· {project.audience}</span>}
              {project.contentType && <span>· {project.contentType}</span>}
              <span>· حُدّث {timeAgo(project.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* --- stage rail ---------------------------------------------------- */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="label">مرحلة المشروع</span>
            <span className="num text-2xs text-ink-faint">{project.progress}٪</span>
          </div>
          <ol className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {TRACKED_STAGES.map((stage, i, arr) => {
              const active = project.stage === stage;
              const done = i < TRACKED_STAGES.indexOf(project.stage);
              return (
                <li key={stage} className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStage(stage)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-2xs font-medium transition-colors duration-200",
                      active
                        ? "border-accent/40 bg-accent-tint text-accent-soft"
                        : done
                          ? "border-line bg-panel text-ink-soft hover:border-line-strong"
                          : "border-line-soft text-ink-faint hover:border-line hover:text-ink-mute",
                    )}
                  >
                    {PIPELINE_LABELS_AR[stage]}
                  </button>
                  {i < arr.length - 1 && <span className="h-px w-3 shrink-0 bg-line" aria-hidden />}
                </li>
              );
            })}
          </ol>
          <ProgressBar value={project.progress} className="mt-2.5" label={`تقدم المشروع`} />
        </div>
      </header>

      {/* --- tabs ------------------------------------------------------------ */}
      <nav aria-label="أقسام المشروع" className="mb-5 overflow-x-auto no-scrollbar">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {TABS.map((t) => {
            const href = `/projects/${project.id}${t.id ? `/${t.id}` : ""}`;
            const active = tab === t.id;
            const Icon = t.icon;
            const count = (counts as Record<string, number>)[t.id];
            return (
              <li key={t.id || "overview"}>
                <Link
                  href={href}
                  onClick={() => setTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs transition-colors duration-200",
                    active
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-mute hover:border-line-strong hover:text-ink-soft",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {t.label}
                  {count !== undefined && count > 0 && (
                    <span className="num rounded bg-panel-2 px-1 text-[10px] text-ink-faint">{count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {counts.contradictions > 0 && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-attention/25 bg-attention-tint/40 px-4 py-2.5">
          <Target className="size-3.5 shrink-0 text-attention" aria-hidden />
          <p className="min-w-0 flex-1 text-2xs leading-relaxed text-ink-soft">
            يوجد {counts.contradictions} تناقض في المصادر — راجعه قبل كتابة أي رقم في الفيديو.
          </p>
          <Link href={`/projects/${project.id}/fact-check`}>
            <Button size="sm" variant="subtle">
              مراجعة
            </Button>
          </Link>
        </div>
      )}

      {children}
    </div>
  );
}

/** Shared page header for project sub-views. */
export function ViewHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          {badge}
        </div>
        {description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-mute">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
