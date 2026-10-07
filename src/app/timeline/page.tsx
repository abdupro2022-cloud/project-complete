"use client";

import { SectionBackdrop } from "@/components/ui/Motifs";
import { CrossProjectTimeline } from "@/components/research/TimelineRail";
import { useApp } from "@/lib/store/provider";

export default function AllTimelinePage() {
  const { state } = useApp();
  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <SectionBackdrop variant="timeline" />
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الخط الزمني</h1>
        <p className="mt-1.5 text-xs text-ink-mute">{state.events.length} حدث عبر كل المشاريع</p>
      </header>
      <CrossProjectTimeline />
    </div>
  );
}
