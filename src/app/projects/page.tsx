"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, Plus, Search, SlidersHorizontal } from "lucide-react";

import { Button, IconButton, Segmented } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Badge, DemoTag, Panel, ProgressBar, StageBadge } from "@/components/ui/Surface";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { useApp } from "@/lib/store/provider";
import { PIPELINE_LABELS_AR, PIPELINE_STAGES, type PipelineStage } from "@/lib/types";
import { formatDuration, timeAgo } from "@/lib/utils";

type Filter = "all" | "active" | "done" | PipelineStage;

/**
 * Projects index.
 *
 * A project is a container, so this is a work list rather than a gallery:
 * stage, progress, and what is actually inside each one.
 */
export default function ProjectsPage() {
  const { state } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const projects = state.projects.filter((p) => {
    if (q && !`${p.title} ${p.premise} ${p.audience}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "all") return true;
    if (filter === "active") return p.stage !== "published" && p.stage !== "archived";
    if (filter === "done") return p.stage === "published" || p.stage === "archived";
    return p.stage === filter;
  });

  const counts = {
    sources: (id: string) => state.sources.filter((s) => s.projectId === id).length,
    script: (id: string) =>
      state.scriptSections.filter((s) => state.scripts.some((x) => x.id === s.scriptId && x.projectId === id)).length,
    shorts: (id: string) => state.shorts.filter((s) => s.projectId === id).length,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">المشاريع</h1>
          <p className="mt-1.5 text-xs text-ink-mute">
            {state.projects.length} مشروع · كل مشروع مساحة عمل مستقلة
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
          مشروع جديد
        </Button>
      </header>

      {state.projects.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في المشاريع"
              aria-label="ابحث في المشاريع"
              className="h-9 w-full rounded-lg border border-line bg-panel ps-9 pe-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </div>
          <Segmented
            aria-label="تصفية حسب المرحلة"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "الكل" },
              { value: "active", label: "نشطة" },
              { value: "done", label: "منتهية" },
            ]}
          />
        </div>
      )}

      {projects.length === 0 ? (
        state.projects.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-4" />}
            title="ابدأ أول مشروع بحثي"
            description="المشروع هو مساحة العمل الكاملة: مصادره، بحثه، سكربته، ومخرجاته. ابدأ بفكرة واحدة وسيبني النظام حولها."
            action={{ label: "مشروع جديد", onClick: () => setCreating(true), icon: <Plus className="size-3.5" /> }}
          />
        ) : (
          <EmptyState
            icon={<SlidersHorizontal className="size-4" />}
            title="لا نتائج"
            description="لا يوجد مشروع يطابق هذه التصفية."
            secondaryAction={{ label: "مسح التصفية", onClick: () => { setQ(""); setFilter("all"); } }}
          />
        )
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group flex h-full flex-col rounded-lg border border-line bg-panel p-4 transition-colors duration-200 hover:border-line-strong hover:bg-panel-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-accent-soft">
                    {p.title}
                  </h2>
                  {p.isDemo && <DemoTag />}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StageBadge stage={p.stage} />
                  <span className="num text-[10px] text-ink-faint">{formatDuration(p.targetDurationSec)}</span>
                </div>

                {p.premise && (
                  <p className="mt-2 line-clamp-3 text-2xs leading-relaxed text-ink-mute">{p.premise}</p>
                )}

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-ink-faint">
                    <span>{PIPELINE_LABELS_AR[p.stage]}</span>
                    <span className="num">{p.progress}٪</span>
                  </div>
                  <ProgressBar value={p.progress} label={`تقدم ${p.title}`} />
                </div>

                <dl className="mt-3 flex gap-3 border-t border-line-soft pt-2.5 text-[10px] text-ink-faint">
                  <div className="flex gap-1">
                    <dt>مصادر</dt>
                    <dd className="num text-ink-mute">{counts.sources(p.id)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>مقاطع</dt>
                    <dd className="num text-ink-mute">{counts.script(p.id)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>شورتس</dt>
                    <dd className="num text-ink-mute">{counts.shorts(p.id)}</dd>
                  </div>
                  <dd className="ms-auto">{timeAgo(p.updatedAt)}</dd>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewProjectDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

/** Filtered variants reuse the same list with a locked filter. */
export function ProjectsVariant({ mode }: { mode: "active" | "completed" }) {
  return <ProjectsPageInner mode={mode} />;
}

function ProjectsPageInner({ mode }: { mode: "active" | "completed" }) {
  const { state } = useApp();
  const projects = state.projects.filter((p) =>
    mode === "active"
      ? p.stage !== "published" && p.stage !== "archived"
      : p.stage === "published" || p.stage === "archived",
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
          {mode === "active" ? "المشاريع النشطة" : "المشاريع المكتملة"}
        </h1>
        <p className="mt-1.5 text-xs text-ink-mute">{projects.length} مشروع</p>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-4" />}
          title={mode === "active" ? "لا مشاريع نشطة" : "لا مشاريع مكتملة"}
          description={
            mode === "active"
              ? "كل مشروع تنشئه يظهر هنا حتى تصل إلى مرحلة النشر."
              : "المشاريع التي تنشرها أو تؤرشفها تظهر هنا."
          }
          action={{ label: "كل المشاريع", onClick: () => (window.location.href = "/projects") }}
        />
      ) : (
        <ul className="space-y-2.5">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-line-strong hover:bg-panel-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                  <p className="text-[10px] text-ink-faint">{timeAgo(p.updatedAt)}</p>
                </div>
                <StageBadge stage={p.stage} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { PIPELINE_STAGES, IconButton, Badge };
