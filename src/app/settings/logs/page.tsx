"use client";

import { useMemo } from "react";
import { Activity, Download, Filter, Gauge, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge, Panel, PanelHeader, Section, StatusDot, Tone } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { formatFullNumber, formatTime, timeAgo } from "@/lib/utils";

/**
 * Activity log.
 *
 * Every workflow step, tool call and failure lands here. Failures are
 * deliberately not filtered out by default — a tool you cannot trust is worse
 * than a tool that is visibly broken.
 */
export default function LogsPage() {
  const { state, actions } = useApp();
  const toast = useToast();

  const rows = state.activity;

  const byTool = useMemo(() => {
    const map = new Map<string, { count: number; failures: number }>();
    for (const a of rows) {
      if (!a.toolName) continue;
      const cur = map.get(a.toolName) ?? { count: 0, failures: 0 };
      cur.count++;
      if (a.outcome === "failure") cur.failures++;
      map.set(a.toolName, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [rows]);

  const failures = rows.filter((r) => r.outcome === "failure");

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    downloadBlob(blob, "abdo-activity.json");
    toast.success("صُدّر السجل", `${rows.length} حدث`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">السجلات</h1>
          <p className="mt-1.5 text-xs text-ink-mute">
            {rows.length} حدث · {failures.length} إخفاق
            {failures.length > 0 && " — الإخفاقات محفوظة عن قصد؛ الأداة المعطوبة بصمت أخطر من المعطوبة بوضوح."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={exportJson} icon={<Download className="size-3.5" />} disabled={!rows.length}>
            تصدير JSON
          </Button>
          {rows.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => { actions.replace("activity", []); toast.info("مُسح السجل"); }}>
              مسح
            </Button>
          )}
        </div>
      </header>

      {byTool.length > 0 && (
        <Section title="استخدام الأدوات" aside={<Filter className="size-3.5 text-ink-faint" />}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {byTool.map(([tool, { count, failures: f }]) => {
              const rate = (f / count) * 100;
              const tone: Tone = rate > 30 ? "danger" : rate > 0 ? "warn" : "ok";
              return (
                <Panel key={tool} className="px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-ink">{tool}</span>
                    <Badge tone={tone}>
                      <span className="num">{count}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-3">
                    <div
                      className={tone === "danger" ? "h-full bg-danger" : tone === "warn" ? "h-full bg-attention" : "h-full bg-ok"}
                      style={{ width: `${Math.round(((count - f) / count) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-faint">
                    نجح {count - f} · فشل {f}
                  </p>
                </Panel>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="الأحداث" className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Activity className="size-4" />}
            title="لا أحداث بعد"
            description="كل عملية تنفّذها ستُسجَّل هنا مع وقتها وأداتها ونتيجتها."
          />
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {rows.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <StatusDot tone={a.outcome === "failure" ? "danger" : "ok"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="text-sm text-ink">{a.what}</p>
                      {a.toolName && (
                        <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                          {a.toolName}
                        </span>
                      )}
                    </div>
                    {a.detail && (
                      <p className={`mt-0.5 text-2xs leading-relaxed ${a.outcome === "failure" ? "text-danger" : "text-ink-mute"}`}>
                        {a.detail}
                      </p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                      {a.projectTitle && <span className="truncate">{a.projectTitle}</span>}
                      <span>{formatTime(a.at)}</span>
                      <span>· {timeAgo(a.at)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </Section>
    </div>
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
