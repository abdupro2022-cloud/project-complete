"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleDashed, Cpu, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { ErrorState, LoadingPanel } from "@/components/ui/States";
import { ApiError, fetchHealth, type HealthReport } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";

/**
 * Model routing.
 *
 * One table: capability → provider. The whole point of the abstraction layer
 * is that this choice is data, not code — so switching provider is a dropdown,
 * not a rebuild.
 */
const CAPABILITIES = [
  { id: "writing", label: "الكتابة", hint: "سكربت، عناوين، نصوص" },
  { id: "analysis", label: "التحليل", hint: "قراءة المصادر واستخلاص النتائج" },
  { id: "research_synthesis", label: "تركيب البحث", hint: "دمج عدة مصادر في خلاصة" },
  { id: "extraction", label: "الاستخراج", hint: "أرقام وأسماء وتواريخ من نص" },
  { id: "fast", label: "السريع", hint: "مهام قصيرة وزمن استجابة أقل" },
] as const;

const PROVIDERS = [
  { id: "deepseek", name: "DeepSeek", env: "deepseek" },
  { id: "gemini", name: "Gemini", env: "gemini" },
  { id: "openrouter", name: "OpenRouter", env: "openrouter" },
] as const;

export default function ModelsPage() {
  const { state, actions } = useApp();
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth(true)
      .then(setHealth)
      .catch((e) => setError(e as ApiError))
      .finally(() => setLoading(false));
  }, []);

  const isConnected = (env: string) => !!health?.providers.find((p) => p.id === env)?.configured;
  const anyAI = PROVIDERS.some((p) => isConnected(p.env));

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState error={error} onRetry={() => window.location.reload()} /></div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">توجيه النماذج</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          لكل مهمة نمط مزوّد. تغيير الاختيار هنا لا يحتاج أي تعديل في الكود.
        </p>
      </header>

      {!loading && !anyAI && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-attention/25 bg-attention-tint/40 px-4 py-3">
          <CircleDashed className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">لا يوجد مزوّد ذكاء اصطناعي متصل</p>
            <p className="mt-1 text-2xs leading-relaxed text-ink-mute">
              النظام يعمل حاليًا في الوضع التجريبي. التوجيه أدناه يُحفظ وسيُستخدم فور إضافة أي مفتاح.
            </p>
            <Link href="/settings/keys" className="mt-2 inline-block text-2xs font-medium text-attention hover:underline">
              اربط نموذجًا
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingPanel rows={4} />
      ) : (
        <>
          <Panel className="sheen mb-6 overflow-hidden">
            <PanelHeader
              title="المزوّدون"
              subtitle="من متصل الآن"
              icon={<Cpu className="size-4" />}
            />
            <ul className="divide-y divide-line-soft">
              {PROVIDERS.map((p) => {
                const on = isConnected(p.env);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <StatusDot tone={on ? "ok" : "mute"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{p.name}</p>
                      <p className="font-mono text-[10px] text-ink-faint">{p.env}</p>
                    </div>
                    {on ? <Badge tone="ok">متصل</Badge> : <Badge tone="neutral">غير مربوط</Badge>}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Section title="التوجيه لكل مهمة">
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-line-soft">
                {CAPABILITIES.map((c) => {
                  const current = state.settings.modelRouting[c.id] ?? "deepseek";
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">{c.label}</p>
                        <p className="text-2xs text-ink-mute">{c.hint}</p>
                      </div>
                      <label className="sr-only" htmlFor={`route-${c.id}`}>
                        مزوّد {c.label}
                      </label>
                      <select
                        id={`route-${c.id}`}
                        value={current}
                        onChange={(e) =>
                          actions.updateSettings({
                            modelRouting: { ...state.settings.modelRouting, [c.id]: e.target.value },
                          })
                        }
                        className="h-9 rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none focus:border-accent"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {isConnected(p.env) ? "" : " (غير مربوط)"}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </Section>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/settings/keys">
              <Button size="sm" variant="secondary">
                إدارة المفاتيح
              </Button>
            </Link>
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-2xs text-ink-mute hover:text-ink"
            >
              قائمة نماذج OpenRouter
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
