"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";

import { CrossProjectSources } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";

export default function AllSourcesPage() {
  const { state } = useApp();
  const [projectId] = useState<string | undefined>(undefined);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">المصادر</h1>
        <p className="mt-1.5 text-xs text-ink-mute">
          {state.sources.length} مصدر عبر كل المشاريع
        </p>
      </header>
      {state.sources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-14 text-center">
          <Link2 className="mx-auto mb-3 size-5 text-ink-faint" aria-hidden />
          <p className="text-sm font-semibold text-ink">لا مصادر بعد</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-ink-mute">
            افتح مشروعًا وشغّل بحثًا — كل مصدر يُحفظ هنا مع ما استُخرج منه.
          </p>
          <Link
            href="/research"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-soft"
          >
            ابدأ بحثًا
          </Link>
        </div>
      ) : (
        <CrossProjectSources projectId={projectId} />
      )}
    </div>
  );
}
