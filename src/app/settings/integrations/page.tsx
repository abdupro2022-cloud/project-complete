"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  ExternalLink,
  KeyRound,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge, DemoTag, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { ErrorState, LoadingPanel } from "@/components/ui/States";
import { ApiError, fetchHealth, type HealthReport } from "@/lib/api/client";
import { INTEGRATIONS, type IntegrationCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<IntegrationCategory, { label: string; blurb: string }> = {
  ai: { label: "نماذج الذكاء الاصطناعي", blurb: "مفتاح واحد يكفي لتفعيل الكتابة والتحليل والتركيب." },
  research: { label: "البحث والاستخراج", blurb: "بدونها لا يوجد بحث حقيقي — كل نتيجة ستكون توضيحية." },
  youtube: { label: "YouTube", blurb: "لتحليل الفيديوهات والقنوات بأرقام حقيقية." },
  video: { label: "الفيديو", blurb: "التفريغ النصي — المزوّد قابل للاستبدال بالكامل." },
  automation: { label: "الأتمتة", blurb: "نقاط النهاية والنماذج تُضبط من ملف التكامل." },
  productivity: { label: "الإنتاجية", blurb: "تصدير إلى Sheets و Notion — اختيارية ولا يعطّل التطبيق." },
};

/**
 * Integrations.
 *
 * The onboarding surface for real mode. It answers one question honestly:
 * "what will actually work once I connect this?" — per integration, not as a
 * vague marketing list.
 */
export default function IntegrationsPage() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await fetchHealth(true));
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<IntegrationCategory, typeof INTEGRATIONS>();
    for (const m of INTEGRATIONS) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, []);

  const configured = health?.providers.filter((p) => p.configured) ?? [];

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">التكاملات</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          النظام يعمل بالكامل بدون أي مفتاح — في الوضع التجريبي. اربط ما تحتاجه فقط، وستنتقل كل الأدوات
          المعتمدة عليه تلقائيًا إلى الوضع الحقيقي.
        </p>
      </header>

      {/* --- status summary ------------------------------------------------- */}
      <Panel className="sheen mb-6 overflow-hidden">
        <PanelHeader
          title="حالة النظام"
          subtitle={loading ? "جارٍ الفحص…" : `${configured.length} من ${INTEGRATIONS.length} مزوّد متصل`}
          icon={<Plug className="size-4" />}
          actions={
            health && !health.hasRealMode ? (
              <Badge tone="warn">
                <StatusDot tone="warn" /> الوضع التجريبي
              </Badge>
            ) : (
              <Badge tone="ok">
                <StatusDot tone="ok" /> وضع حقيقي
              </Badge>
            )
          }
        />
        <div className="grid gap-px bg-line sm:grid-cols-3">
          <SummaryCell
            icon={<Sparkles className="size-3.5" />}
            label="النماذج"
            detail={
              loading
                ? "—"
                : configured.some((p) => ["gemini", "deepseek", "openrouter"].includes(p.id))
                  ? "متصلة"
                  : "غير متصلة"
            }
            ok={!loading && configured.some((p) => ["gemini", "deepseek", "openrouter"].includes(p.id))}
          />
          <SummaryCell
            icon={<CircleDashed className="size-3.5" />}
            label="البحث"
            detail={
              loading
                ? "—"
                : configured.some((p) => p.id === "tavily")
                  ? "متصل"
                  : configured.some((p) => p.id === "firecrawl")
                    ? "استخراج فقط"
                    : "غير متصل"
            }
            ok={!loading && configured.some((p) => p.id === "tavily")}
          />
          <SummaryCell
            icon={<ShieldCheck className="size-3.5" />}
            label="خزنة المفاتيح"
            detail={loading ? "—" : health?.vaultPersistent ? "مشفّرة على القرص" : "في الذاكرة فقط"}
            ok={!loading && !!health?.vaultPersistent}
          />
        </div>
        {!loading && health && !health.vaultPersistent && (
          <p className="border-t border-line bg-attention-tint/30 px-4 py-2.5 text-2xs leading-relaxed text-attention">
            اضبط <code className="font-mono">ABDO_VAULT_SECRET</code> ليُشفَّر المفتاح قبل حفظه على القرص.
            بدونه تبقى المفاتيح في ذاكرة الخادم وتُفقد عند إعادة التشغيل.
          </p>
        )}
      </Panel>

      {loading ? (
        <LoadingPanel rows={5} />
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([category, items]) => {
            const meta = CATEGORY_META[category];
            const anyConnected = items.some((i) =>
              health?.providers.some((p) => p.id === i.id && p.configured),
            );
            return (
              <Section key={category} title={meta.label} aside={anyConnected ? undefined : undefined}>
                <p className="-mt-1 mb-2.5 text-2xs leading-relaxed text-ink-mute">{meta.blurb}</p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {items.map((m) => {
                    const st = health?.providers.find((p) => p.id === m.id);
                    const on = !!st?.configured;
                    return (
                      <li key={m.id}>
                        <Panel
                          className={cn(
                            "flex h-full flex-col p-4 transition-colors duration-200",
                            on ? "border-ok/25" : "hover:border-line-strong",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                                {m.name}
                                {on ? (
                                  <StatusDot tone="ok" />
                                ) : (
                                  <CircleDashed className="size-3 text-ink-faint" aria-hidden />
                                )}
                              </h3>
                              <p className="mt-1 text-2xs leading-relaxed text-ink-mute">{m.description}</p>
                            </div>
                            {on && <Badge tone="ok">متصل</Badge>}
                          </div>

                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {m.capabilities.map((c) => (
                              <li key={c}>
                                <Badge tone="neutral">{c}</Badge>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-4 flex items-center gap-2 pt-1">
                            <Link href="/settings/keys" className="ms-auto">
                              <Button
                                size="sm"
                                variant={on ? "subtle" : "primary"}
                                icon={on ? <Check className="size-3.5" /> : <KeyRound className="size-3.5" />}
                              >
                                {on ? "إدارة المفتاح" : "إضافة مفتاح"}
                              </Button>
                            </Link>
                            {m.keyUrl && (
                              <a
                                href={m.keyUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                aria-label={`فتح لوحة ${m.name}`}
                                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-mute transition-colors hover:border-line-strong hover:text-ink"
                              >
                                <ExternalLink className="size-3.5" aria-hidden />
                              </a>
                            )}
                          </div>
                        </Panel>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/settings/keys">
          <Button variant="secondary" iconEnd={<ArrowLeft className="size-3.5" />}>
            إدارة كل المفاتيح
          </Button>
        </Link>
        <Link href="/ai/models">
          <Button variant="ghost">إعداد توجيه النماذج</Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryCell({
  icon,
  label,
  detail,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="bg-panel px-4 py-3.5">
      <div className="flex items-center gap-2 text-2xs text-ink-mute">
        <span className={ok ? "text-ok" : "text-ink-faint"}>{icon}</span>
        {label}
      </div>
      <p className={cn("mt-1 text-sm font-medium", ok ? "text-ink" : "text-ink-soft")}>{detail}</p>
    </div>
  );
}
