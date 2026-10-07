"use client";

import { useMemo } from "react";
import { BarChart3, Cpu, TrendingUp } from "lucide-react";

import { Panel, PanelHeader, Section, StatusDot, Badge } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { Segmented } from "@/components/ui/Button";
import { useState } from "react";
import { useApp } from "@/lib/store/provider";
import { formatFullNumber, timeAgo } from "@/lib/utils";

/**
 * Usage.
 *
 * Only shows what is actually recorded. When nothing is connected, token
 * counters stay at zero rather than showing invented numbers.
 */
export default function UsagePage() {
  const { state } = useApp();
  const [range, setRange] = useState<"7" | "30" | "all">("30");

  const windowMs = range === "all" ? Infinity : Number(range) * 86400000;
  const records = useMemo(
    () => state.usage.filter((u) => Date.now() - new Date(u.at).getTime() <= windowMs),
    [state.usage, windowMs],
  );

  const byCapability = useMemo(() => {
    const map = new Map<string, { calls: number; inTok: number; outTok: number }>();
    for (const r of records) {
      const cur = map.get(r.capability) ?? { calls: 0, inTok: 0, outTok: 0 };
      cur.calls += r.calls;
      cur.inTok += r.inputTokens;
      cur.outTok += r.outputTokens;
      map.set(r.capability, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].calls - a[1].calls);
  }, [records]);

  const totals = records.reduce(
    (acc, r) => ({ calls: acc.calls + r.calls, inTok: acc.inTok + r.inputTokens, outTok: acc.outTok + r.outputTokens }),
    { calls: 0, inTok: 0, outTok: 0 },
  );

  const maxCalls = Math.max(1, ...byCapability.map(([, v]) => v.calls));
  const isDemo = state.usage.every((u) => u.provider === "demo");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الاستهلاك</h1>
          <p className="mt-1.5 text-xs text-ink-mute">
            {isDemo
              ? "لا يوجد مزوّد متصل — كل الاستدعاءات مُحقَّقة محليًا ولم تُحتسب رموزًا."
              : "الأرقام كما يبلّغها المزوّد."}
          </p>
        </div>
        <Segmented
          aria-label="نطاق العرض"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "٧ أيام" },
            { value: "30", label: "٣٠ يومًا" },
            { value: "all", label: "الكل" },
          ]}
        />
      </header>

      {records.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="size-4" />}
          title="لا استهلاك مسجّل"
          description="سجّل الأرقام هنا بعد أول عملية على مزوّد متصل."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            <Stat label="إجمالي الطلبات" value={formatFullNumber(totals.calls)} icon={<TrendingUp className="size-3.5" />} />
            <Stat label="رموز إدخال" value={formatFullNumber(totals.inTok)} icon={<Cpu className="size-3.5" />} />
            <Stat label="رموز إخراج" value={formatFullNumber(totals.outTok)} icon={<Cpu className="size-3.5" />} />
          </div>

          <Section title="حسب النوع">
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {byCapability.map(([cap, v]) => (
                  <li key={cap} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{cap}</span>
                      <span className="num text-xs text-ink-soft">{formatFullNumber(v.calls)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3">
                      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(v.calls / maxCalls) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-[10px] text-ink-faint">
                      {formatFullNumber(v.inTok)} إدخال · {formatFullNumber(v.outTok)} إخراج
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>

          <Section title="السجل">
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {records.slice(0, 30).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <StatusDot tone={r.provider === "demo" ? "warn" : "ok"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-soft">
                        {r.provider} · {r.capability}
                      </p>
                    </div>
                    <span className="num text-2xs text-ink-faint">{r.calls} طلب</span>
                    <span className="text-[10px] text-ink-faint">{timeAgo(r.at)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-panel px-4 py-4">
      <div className="flex items-center gap-1.5 text-2xs text-ink-mute">
        {icon}
        {label}
      </div>
      <p className="num mt-1.5 text-xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
