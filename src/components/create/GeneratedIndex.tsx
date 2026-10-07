"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PenLine, Type, MonitorPlay, Images } from "lucide-react";

import { Badge, Panel } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { ProjectPicker } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";
import { timeAgo } from "@/lib/utils";

/** Cross-project index for scripts, shorts, titles and thumbnails. */
export function GeneratedIndex({
  kind,
}: {
  kind: "scripts" | "shorts" | "titles" | "thumbnails";
}) {
  const { state } = useApp();
  const [picked, setPicked] = useState("");

  const META = {
    scripts: { label: "السكربتات", empty: "لا سكربتات بعد", blurb: "كل سكربت داخل مشروع، ومكتوب من بحث موثّق.", icon: PenLine },
    shorts: { label: "الشورتس", empty: "لا شورتس بعد", blurb: "مقاطع قائمة بذاتها مستخرجة من السكربت.", icon: MonitorPlay },
    titles: { label: "العناوين", empty: "لا عناوين بعد", blurb: "عناوين مقترحة من زوايا مختلفة.", icon: Type },
    thumbnails: { label: "الثامبنيلات", empty: "لا مفاهيم بعد", blurb: "مفاهيم بصرية تُحسم قبل التصميم.", icon: Images },
  } as const;

  const meta = META[kind];

  const groups = useMemo(() => {
    const byProject = new Map<string, { title: string; items: { id: string; label: string; sub: string; href: string; badge?: React.ReactNode }[] }>();

    const push = (
      projectId: string,
      item: { id: string; label: string; sub: string; href: string; badge?: React.ReactNode },
    ) => {
      const p = state.projects.find((x) => x.id === projectId);
      const key = projectId || "none";
      const g = byProject.get(key) ?? { title: p?.title ?? "بلا مشروع", items: [] };
      g.items.push(item);
      byProject.set(key, g);
    };

    if (kind === "scripts") {
      for (const s of state.scripts) {
        if (picked && s.projectId !== picked) continue;
        const secs = state.scriptSections.filter((x) => x.scriptId === s.id);
        const sec = secs.reduce((n, x) => n + (x.estimatedSec || 0), 0);
        push(s.projectId, {
          id: s.id,
          label: s.title,
          sub: `${secs.length} مشهد · ≈${Math.round(sec / 60)} دقيقة · ${timeAgo(s.updatedAt)}`,
          href: `/projects/${s.projectId}/script`,
        });
      }
    }
    if (kind === "shorts") {
      for (const s of state.shorts) {
        if (picked && s.projectId !== picked) continue;
        push(s.projectId, {
          id: s.id,
          label: s.hook,
          sub: `${s.estimatedSec} ثانية${s.hashtags.length ? ` · ${s.hashtags.length} هاشتاغ` : ""}`,
          href: `/projects/${s.projectId}/shorts`,
        });
      }
    }
    if (kind === "titles") {
      for (const t of state.titleIdeas) {
        if (picked && t.projectId !== picked) continue;
        push(t.projectId, {
          id: t.id,
          label: t.text,
          sub: t.angle,
          href: `/projects/${t.projectId}/titles`,
          badge: t.pullScore > 0 ? <Badge tone="accent" mono>{t.pullScore}</Badge> : undefined,
        });
      }
    }
    if (kind === "thumbnails") {
      for (const t of state.thumbnailConcepts) {
        if (picked && t.projectId !== picked) continue;
        push(t.projectId, {
          id: t.id,
          label: t.concept,
          sub: t.textOverlay || t.visualDirection,
          href: `/projects/${t.projectId}/thumbnails`,
        });
      }
    }
    return [...byProject.values()].filter((g) => g.items.length > 0);
  }, [kind, state, picked]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-5">
      <ProjectPicker value={picked} onChange={setPicked} />
      {total === 0 ? (
        <EmptyState
          icon={<meta.icon className="size-4" />}
          title={meta.empty}
          description={meta.blurb}
        />
      ) : (
        groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
              {g.title}
              <span className="num text-2xs text-ink-faint">{g.items.length}</span>
            </h2>
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {g.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{item.label}</p>
                        {item.sub && <p className="truncate text-2xs text-ink-mute">{item.sub}</p>}
                      </div>
                      {item.badge}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>
        ))
      )}
    </div>
  );
}

export function IndexShell({ kind, title, blurb }: { kind: "scripts" | "shorts" | "titles" | "thumbnails"; title: string; blurb: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h1>
        <p className="mt-1.5 text-xs text-ink-mute">{blurb}</p>
      </header>
      <GeneratedIndex kind={kind} />
    </div>
  );
}
