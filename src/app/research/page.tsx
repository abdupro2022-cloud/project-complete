"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

import { Composer } from "@/components/ai/Composer";
import { SectionBackdrop } from "@/components/ui/Motifs";
import { useApp } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

/**
 * Cross-project research entry.
 *
 * Research lives inside a project — a search with no project has nowhere to
 * put its sources. So this page's first job is choosing or making that
 * container.
 */
export default function ResearchIndexPage() {
  const { state } = useApp();
  const [picked, setPicked] = useState(state.projects[0]?.id ?? "");

  useEffect(() => {
    if (!picked && state.projects[0]) setPicked(state.projects[0].id);
  }, [state.projects, picked]);

  if (state.projects.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-panel text-ink-mute">
          <FlaskConical className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">البحث يحتاج مشروعًا</h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-mute">
          المصادر والادعاءات والخط الزمني كلها تنتمي لمشروع. أنشئ مشروعًا أولًا، ثم عُد للبحث — كل نتيجة
          ستُحفظ في مكانها.
        </p>
        <div className="mt-5 flex gap-2">
          <a
            href="/"
            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-soft"
          >
            مركز القيادة
          </a>
          <a
            href="/projects"
            className="rounded-lg border border-line bg-panel px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong"
          >
            المشاريع
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      {/* Hero illustration matching the brand motif */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-line">
        <picture>
          <source srcSet="/illustrations/hero-research.webp" type="image/webp" />
          <img
            src="/illustrations/hero-research.webp"
            alt=""
            width={1280}
            height={720}
            className="h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        <div className="pointer-events-none absolute bottom-4 start-4 me-4 max-w-md">
          <p className="text-2xs uppercase tracking-[0.18em] text-accent-soft">مختبر البحث</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">اجمع مصادر، دقّق حقائق</h1>
        </div>
      </div>
      <SectionBackdrop variant="research" />
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">مختبر البحث</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
          اختر المشروع ثم اطرح سؤالك. النتائج تُحفظ داخله تلقائيًا.
        </p>
      </header>

      <label className="mb-5 block">
        <span className="label">المشروع</span>
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className={cn(
            "mt-1.5 h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink",
            "outline-none focus:border-accent",
          )}
        >
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      <Composer projectId={picked} />
    </div>
  );
}
