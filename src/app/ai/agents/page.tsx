"use client";

import { useEffect, useState } from "react";
import { ChevronDown, CircleDashed, Cpu, Play } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { ErrorState, LoadingPanel } from "@/components/ui/States";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ApiError, fetchHealth, searchWeb, scrapePage, transcribeVideo, youtubeSearch, youtubeVideo, type HealthReport } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * Agents.
 *
 * The tool registry made visible, plus a console that can actually run each
 * tool. This is the difference between claiming a tool architecture and
 * showing one.
 */
const TOOLS = [
  { name: "search_web", label: "بحث ويب", provider: "tavily", env: "tavily", args: { query: "مثال: سبب إفلاس شركة", maxResults: 5 }, run: (a: Record<string, string>) => searchWeb(a.query, { maxResults: Number(a.maxResults) || 5 }) },
  { name: "scrape_page", label: "استخراج صفحة", provider: "firecrawl", env: "firecrawl", args: { url: "https://example.com" }, run: (a: Record<string, string>) => scrapePage(a.url) },
  { name: "youtube_search", label: "بحث YouTube", provider: "youtube", env: "youtube", args: { query: "تحليل إفلاس", maxResults: 5 }, run: (a: Record<string, string>) => youtubeSearch(a.query, Number(a.maxResults) || 5) },
  { name: "youtube_video", label: "بيانات فيديو", provider: "youtube", env: "youtube", args: { url: "https://www.youtube.com/watch?v=..." }, run: (a: Record<string, string>) => youtubeVideo(a.url) },
  { name: "transcribe_video", label: "تفريغ نصي", provider: "video_to_text", env: "video_to_text", args: { url: "https://www.youtube.com/watch?v=..." }, run: (a: Record<string, string>) => transcribeVideo(a.url) },
  { name: "analyze_source", label: "تحليل مصدر", provider: "ai", env: "deepseek", args: { title: "عنوان", content: "نص المصدر" }, run: null },
  { name: "generate_script", label: "كتابة سكربت", provider: "ai", env: "deepseek", args: { topic: "موضوع الفيديو", beats: 9 }, run: null },
  { name: "fact_check", label: "تحقق من ادعاء", provider: "local", env: null, args: { claim: "الادعاء" }, run: null },
  { name: "detect_contradiction", label: "كشف تناقض", provider: "local", env: null, args: { a: "ادعاء أ", b: "ادعاء ب" }, run: null },
  { name: "build_timeline", label: "بناء خط زمني", provider: "local", env: null, args: { events: "حدث 1\nحدث 2" }, run: null },
  { name: "read_project", label: "قراءة مشروع", provider: "local", env: null, args: { projectId: "—" }, run: null },
  { name: "read_memory", label: "قراءة الذاكرة", provider: "local", env: null, args: { category: "all" }, run: null },
] as const;

export default function AgentsPage() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<(typeof TOOLS)[number] | null>(null);

  useEffect(() => {
    fetchHealth(true)
      .then(setHealth)
      .catch((e) => setError(e as ApiError))
      .finally(() => setLoading(false));
  }, []);

  const configured = (env: string | null) => (env ? !!health?.providers.find((p) => p.id === env)?.configured : true);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الوكلاء والأدوات</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          كل قدرة في النظام هي أداة لها عقد واضح. شغّل أي أداة مباشرة من هنا لترى ناتجها الحقيقي — بدون
          وسيط.
        </p>
      </header>

      {error ? (
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      ) : loading ? (
        <LoadingPanel rows={5} />
      ) : (
        <>
          <Panel className="sheen mb-6 overflow-hidden">
            <PanelHeader
              title="ما هو مربوط"
              subtitle={health?.hasRealMode ? "بعض المزوّدين متصلون" : "لا مزوّد متصل — كل الأدوات في وضع تجريبي"}
              icon={<Cpu className="size-4" />}
            />
            <ul className="grid gap-px bg-line sm:grid-cols-2">
              {TOOLS.filter((t) => t.env).map((t) => {
                const on = configured(t.env);
                return (
                  <li key={t.env} className="flex items-center gap-2 bg-panel px-3.5 py-2.5">
                    <StatusDot tone={on ? "ok" : "mute"} />
                    <span className="text-2xs text-ink-soft">{t.provider}</span>
                    <span className="ms-auto text-[10px] text-ink-faint">{on ? "متصل" : "غير مربوط"}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Section title="سجل الأدوات" aside={<Badge tone="neutral">{TOOLS.length}</Badge>}>
            <ul className="space-y-1.5">
              {TOOLS.map((t) => {
                const on = configured(t.env);
                const open = active?.name === t.name;
                return (
                  <li key={t.name}>
                    <Panel className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActive(open ? null : t)}
                        aria-expanded={open}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-start transition-colors hover:bg-panel-2"
                      >
                        <StatusDot tone={on ? "ok" : "mute"} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink">{t.label}</span>
                          <span className="block font-mono text-[10px] text-ink-faint">{t.name}()</span>
                        </span>
                        <Badge tone={on ? "ok" : "neutral"}>
                          {t.env ? (on ? "متصل" : "تجريبي") : "محلي"}
                        </Badge>
                        <ChevronDown className={cn("size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
                      </button>

                      {open && <ToolConsole tool={t} live={on} />}
                    </Panel>
                  </li>
                );
              })}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function ToolConsole({
  tool,
  live,
}: {
  tool: (typeof TOOLS)[number];
  live: boolean;
}) {
  const toast = useToast();
  const [args, setArgs] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(tool.args).map(([k, v]) => [k, String(v)])),
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ data: unknown; demo: boolean; ms: number } | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setResult(null);
    const t0 = performance.now();
    try {
      if (tool.run) {
        const data = await tool.run(args);
        const demo = JSON.stringify(data).includes('"demo":true') || JSON.stringify(data).includes("وضع تجريبي");
        setResult({ data, demo, ms: performance.now() - t0 });
      } else {
        setErr(
          new ApiError(
            "unsupported",
            "هذه الأداة تعمل داخل الـ workflow فقط، ولا تُستدعى مستقلة. شغّلها من خلال المساعد أو مختبر البحث لتظهر خطتها كاملة.",
          ),
        );
      }
    } catch (e) {
      setErr(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-line bg-surface px-3.5 py-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(tool.args).map(([k, v]) => (
          <Field key={k} label={k}>
            {(id) => (
              <Input
                id={id}
                value={args[k] ?? ""}
                onChange={(e) => setArgs((a) => ({ ...a, [k]: e.target.value }))}
                dir="ltr"
                mono
              />
            )}
          </Field>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => void run()} loading={busy} icon={<Play className="size-3.5" />}>
          تنفيذ
        </Button>
        {!live && tool.env && (
          <span className="flex items-center gap-1.5 text-2xs text-attention">
            <CircleDashed className="size-3" aria-hidden />
            بلا مفتاح — ستأتي نتيجة توضيحية
          </span>
        )}
        {result && (
          <span className="num ms-auto text-2xs text-ink-faint">{Math.round(result.ms)}ms</span>
        )}
      </div>

      {err && <ErrorState error={err} compact />}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {result.demo && <Badge tone="warn">وضع تجريبي</Badge>}
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2)).catch(() => {});
                toast.success("نُسخ الناتج");
              }}
            >
              نسخ الناتج
            </Button>
          </div>
          <pre
            dir="ltr"
            className="max-h-64 overflow-auto rounded-lg border border-line bg-canvas-deep p-3 text-left font-mono text-[10px] leading-relaxed text-ink-soft"
          >
            {JSON.stringify(result.data, null, 2).slice(0, 4000)}
          </pre>
        </div>
      )}
    </div>
  );
}
