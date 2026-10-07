"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button, IconButton, Segmented } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Badge, CredibilityBadge, DemoTag, Panel, Section } from "@/components/ui/Surface";
import { Field, Textarea } from "@/components/ui/Field";
import { useApp } from "@/lib/store/provider";
import { CREDIBILITY_TIERS, type CredibilityTier, type Source } from "@/lib/types";
import { cn, formatDate, truncate } from "@/lib/utils";

/**
 * Source list.
 *
 * Sources are evidence, so the list is built around trust: credibility tier
 * first, then what was actually extracted. A URL on its own is not a source in
 * this product — it is a link.
 */
export function SourceList({ sources, projectId }: { sources: Source[]; projectId?: string }) {
  const { actions } = useApp();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<CredibilityTier | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sources.filter((s) => {
      if (tier !== "all" && s.credibility !== tier) return false;
      if (!needle) return true;
      return `${s.title} ${s.domain} ${s.summary} ${s.extractedFacts.join(" ")}`.toLowerCase().includes(needle);
    });
  }, [sources, q, tier]);

  // Citation indices are positional so [S01] always means the same row.
  const citationIndex = useMemo(() => {
    const map = new Map<string, string>();
    sources.forEach((s, i) => map.set(s.id, `S${String(i + 1).padStart(2, "0")}`));
    return map;
  }, [sources]);

  if (sources.length === 0) {
    return (
      <EmptyState
        icon={<Link2 className="size-4" />}
        title="لا مصادر بعد"
        description="المصدر هنا ليس رابطًا — بل ما استخرجته منه. أضف أول مصدر من مختبر البحث."
        action={projectId ? { label: "افتح مختبر البحث", onClick: () => { window.location.href = `/projects/${projectId}/research`; } } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في المصادر والمشتقات"
            aria-label="ابحث في المصادر"
            className="h-9 w-full rounded-lg border border-line bg-panel ps-9 pe-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>
        <Segmented
          aria-label="تصفية حسب درجة الموثوقية"
          value={tier}
          onChange={setTier}
          options={[{ value: "all" as const, label: "الكل" }, ...CREDIBILITY_TIERS.map((t) => ({ value: t, label: t === "high" ? "موثوق" : t === "medium" ? "متوسط" : t === "low" ? "ضعيف" : "غير مُقيَّم" }))]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState compact title="لا نتائج" description="لا مصدر يطابق البحث." />
      ) : (
        <ol className="space-y-2">
          {filtered.map((s) => {
            const open = openId === s.id;
            const idx = citationIndex.get(s.id);
            return (
              <li key={s.id}>
                <Panel className="overflow-hidden">
                  <div className="flex items-start gap-3 p-3.5">
                    <span className="cite mt-0.5 shrink-0">{idx}</span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{s.title}</h3>
                        {s.isDemo && <DemoTag />}
                      </div>

                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                        <span className="font-mono" dir="ltr">{s.domain}</span>
                        {s.publishedAt && <span>· {formatDate(s.publishedAt)}</span>}
                        <span>· {s.sourceType}</span>
                      </p>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-mute">{s.summary}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <CredibilityBadge tier={s.credibility} />
                        {s.extractedFacts.length > 0 && (
                          <Badge tone="neutral" mono>
                            {s.extractedFacts.length} مشتق
                          </Badge>
                        )}
                        {s.quotes.length > 0 && <Badge tone="neutral">{s.quotes.length} اقتباس</Badge>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label={open ? "طيّ التفاصيل" : "عرض التفاصيل"}
                        size="sm"
                        onClick={() => setOpenId(open ? null : s.id)}
                        aria-expanded={open}
                      >
                        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
                      </IconButton>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`فتح ${s.title}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-panel-2 hover:text-ink"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                      <IconButton
                        label={`حذف ${s.title}`}
                        size="sm"
                        onClick={() => actions.remove("sources", s.id)}
                        className="text-ink-faint hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </IconButton>
                    </div>
                  </div>

                  {open && (
                    <div className="space-y-4 border-t border-line bg-surface px-3.5 py-3.5">
                      {s.extractedFacts.length > 0 && (
                        <div>
                          <h4 className="label mb-1.5">المشتقات</h4>
                          <ul className="space-y-1">
                            {s.extractedFacts.map((f, i) => (
                              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.quotes.length > 0 && (
                        <div>
                          <h4 className="label mb-1.5">اقتباسات</h4>
                          <ul className="space-y-2">
                            {s.quotes.map((qt) => (
                              <li key={qt.id} className="rounded-e-lg border-s-2 border-line-strong ps-3 text-xs leading-relaxed text-ink-soft">
                                <span dir={/^[\u0600-\u06FF]/.test(qt.text) ? "rtl" : "ltr"}>{qt.text}</span>
                                {qt.locator && <span className="ms-2 font-mono text-[10px] text-ink-faint">{qt.locator}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="label mb-1.5">الملخّص الكامل</h4>
                        <TextArea value={s.summary} />
                      </div>

                      <p className="text-[10px] text-ink-faint">
                        هذا المصدر يُستخدم تلقائيًا عند التحقق من الأرقام والاقتباس منه في السكربت.
                      </p>
                    </div>
                  )}
                </Panel>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function TextArea({ value }: { value: string }) {
  const { actions } = useApp();
  return (
    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-canvas-deep p-3 text-2xs leading-relaxed text-ink-mute">
      {truncate(value, 1200)}
    </p>
  );
}

/** Project picker used by the cross-project views. */
export function ProjectPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const { state } = useApp();
  if (state.projects.length <= 1) return null;
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-2xs text-ink-mute">المشروع</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none focus:border-accent"
      >
        <option value="">كل المشاريع</option>
        {state.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </label>
  );
}


export function CrossProjectSources({ projectId }: { projectId: string | undefined }) {
  const { state } = useApp();
  const [picked, setPicked] = useState("");
  const effective = picked || projectId || "";
  const sources = state.sources.filter((s) => !effective || s.projectId === effective);

  return (
    <div className="space-y-5">
      <ProjectPicker value={picked} onChange={setPicked} />
      {state.sources.length === 0 ? (
        <SourceList sources={[]} />
      ) : effective ? (
        <SourceList sources={sources} />
      ) : (
        <div className="space-y-6">
          {state.projects
            .filter((p) => state.sources.some((s) => s.projectId === p.id))
            .map((p) => (
              <section key={p.id}>
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Link href={`/projects/${p.id}/sources`} className="hover:text-accent-soft">
                    {p.title}
                  </Link>
                  <span className="num text-2xs text-ink-faint">{state.sources.filter((s) => s.projectId === p.id).length}</span>
                </h2>
                <SourceList sources={state.sources.filter((s) => s.projectId === p.id)} />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
