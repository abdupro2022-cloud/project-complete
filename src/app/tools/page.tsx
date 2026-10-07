"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileCode2,
  Film,
  LayoutGrid,
  Mic,
  Search,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingPanel } from "@/components/ui/States";
import { ApiError, fetchHealth, type HealthReport } from "@/lib/api/client";

const TOOLS: { href: string; name: string; blurb: string; integration: string; icon: LucideIcon; demoSafe: boolean }[] = [
  { href: "/tools/tavily", name: "بحث الويب", blurb: "بحث مع مقتطفات جاهزة، لا روابط مجرّدة.", integration: "tavily", icon: Search, demoSafe: true },
  { href: "/tools/firecrawl", name: "استخراج الصفحات", blurb: "يحوّل أي صفحة إلى نص نظيف قابل للتحليل.", integration: "firecrawl", icon: FileCode2, demoSafe: true },
  { href: "/tools/youtube", name: "YouTube", blurb: "بحث وتحليل بنية الفيديوهات والقنوات.", integration: "youtube", icon: Video, demoSafe: true },
  { href: "/tools/transcript", name: "فيديو إلى نص", blurb: "تفريغ نصي مع فصول وتحليل بنية.", integration: "video_to_text", icon: Mic, demoSafe: true },
  { href: "/tools/sheets", name: "Google Sheets", blurb: "تصدير البحث وقواعد بيانات المحتوى إلى جداول.", integration: "google_sheets", icon: LayoutGrid, demoSafe: false },
  { href: "/tools/notion", name: "Notion", blurb: "حفظ السكربتات والبحث كصفحات.", integration: "notion", icon: LayoutGrid, demoSafe: false },
];

export default function ToolsPage() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchHealth(true)
      .then((h) => alive && setHealth(h))
      .catch((e) => alive && setError(e as ApiError))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الأدوات</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          كل أداة صفقة مع مزوّد. بدون مفتاح تعمل في الوضع التجريبي وتُظهر لك الشكل — والنتيجة الحقيقية
          تبدأ فور إضافة المفتاح.
        </p>
      </header>

      {loading ? (
        <LoadingPanel rows={4} />
      ) : (
        <>
          <Section title="بحث واستخراج">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {TOOLS.slice(0, 2).map((t) => (
                <ToolCard key={t.href} tool={t} connected={isConnected(health, t.integration)} />
              ))}
            </ul>
          </Section>

          <Section title="فيديو" className="mt-6">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {TOOLS.slice(2, 4).map((t) => (
                <ToolCard key={t.href} tool={t} connected={isConnected(health, t.integration)} />
              ))}
            </ul>
          </Section>

          <Section title="إنتاجية" className="mt-6">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {TOOLS.slice(4).map((t) => (
                <ToolCard key={t.href} tool={t} connected={isConnected(health, t.integration)} />
              ))}
            </ul>
          </Section>
        </>
      )}

      <Panel className="mt-8 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Wrench className="size-4 shrink-0 text-ink-mute" aria-hidden />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-mute">
            أدوات Google Sheets و Notion اختيارية تمامًا — التطبيق يعمل كاملًا بدونها. اربطها فقط إن أردت
            تصديرًا تلقائيًا.
          </p>
          <Link href="/settings/integrations">
            <Button size="sm" variant="secondary">
              إدارة التكاملات
            </Button>
          </Link>
        </div>
      </Panel>
    </div>
  );
}

function isConnected(health: HealthReport | null, id: string): boolean {
  return !!health?.providers.find((p) => p.id === id)?.configured;
}

function ToolCard({
  tool,
  connected,
}: {
  tool: (typeof TOOLS)[number];
  connected: boolean;
}) {
  const Icon = tool.icon;
  return (
    <li>
      <Link
        href={tool.href}
        className="group flex h-full items-start gap-3.5 rounded-lg border border-line bg-panel p-4 transition-colors duration-200 hover:border-line-strong hover:bg-panel-2"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel-2 text-ink-mute transition-colors group-hover:text-ink">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{tool.name}</h3>
            {connected ? <StatusDot tone="ok" /> : <StatusDot tone="mute" />}
            {connected && <Badge tone="ok">متصل</Badge>}
          </div>
          <p className="mt-1 text-2xs leading-relaxed text-ink-mute">{tool.blurb}</p>
        </div>
      </Link>
    </li>
  );
}
