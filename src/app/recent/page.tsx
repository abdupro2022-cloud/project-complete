"use client";

import Link from "next/link";
import { Activity, ArrowLeft, CircleDashed, FlaskConical, PenLine, Video } from "lucide-react";

import { Badge, Panel, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useApp } from "@/lib/store/provider";
import { timeAgo } from "@/lib/utils";

/**
 * Recent work.
 *
 * What you touched, newest first — the fastest way back into whatever you were
 * halfway through.
 */
export default function RecentPage() {
  const { state } = useApp();

  const items = [
    ...state.projects.map((p) => ({
      id: p.id,
      at: p.updatedAt,
      icon: FlaskConical,
      title: p.title,
      sub: "مشروع",
      href: `/projects/${p.id}`,
    })),
    ...state.sources.map((s) => ({
      id: s.id,
      at: s.savedAt,
      icon: Video,
      title: s.title,
      sub: `مصدر · ${s.domain}`,
      href: `/projects/${s.projectId}/sources`,
    })),
    ...state.scripts.map((s) => ({
      id: s.id,
      at: s.updatedAt,
      icon: PenLine,
      title: s.title,
      sub: "سكربت",
      href: `/projects/${s.projectId}/script`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 40);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink md:text-2xl">
          <Activity className="size-5 text-ink-mute" aria-hidden />
          آخر الأعمال
        </h1>
        <p className="mt-1.5 text-xs text-ink-mute">{items.length} عنصر مرتّبًا من الأحدث</p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<CircleDashed className="size-4" />}
          title="لا عمل بعد"
          description="كل ما تنشئه يظهر هنا مرتّبًا زمنيًا."
        />
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {items.map((i) => {
              const Icon = i.icon;
              return (
                <li key={i.id}>
                  <Link
                    href={i.href}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 text-ink-mute">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{i.title}</p>
                      <p className="truncate text-[10px] text-ink-faint">{i.sub}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-faint">{timeAgo(i.at)}</span>
                    <ArrowLeft className="size-3.5 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
