"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleDot, ListChecks, TriangleAlert } from "lucide-react";

import { Badge, Panel, Section } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProjectPicker } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";
import { cn, formatDate } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

/**
 * Timeline.
 *
 * Confidence is the important part: an event inferred from a publication date
 * is not the same as an event a source states outright. Low-confidence events
 * are marked so a viewer can see which line on the rail is evidence and which
 * is inference.
 */
export function TimelineRail({ events, showProject }: { events: TimelineEvent[]; showProject?: boolean }) {
  const { state } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);

  const byYear = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of events) {
      const y = e.date.slice(0, 4);
      const list = map.get(y) ?? [];
      list.push(e);
      map.set(y, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="size-4" />}
        title="لا أحداث بعد"
        description="يُبنى الخط الزمني تلقائيًا من مصادر البحث. شغّل بحثًا أولًا."
      />
    );
  }

  return (
    <div className="space-y-6">
      {byYear.map(([year, list]) => (
        <Section key={year} title={year} aside={<Badge tone="neutral">{list.length} حدث</Badge>}>
          <ol className="relative space-y-2 ps-4">
            {/* The rail itself — a hairline, not a decoration. */}
            <span className="absolute inset-y-2 start-[3px] w-px bg-line" aria-hidden />

            {list.map((e) => {
              const open = openId === e.id;
              const inferred = e.confidence < 0.7;
              const project = state.projects.find((p) => p.id === e.projectId);
              return (
                <li key={e.id} className="relative">
                  <span
                    className={cn(
                      "absolute -start-4 top-3.5 flex size-[7px] items-center justify-center rounded-full ring-4 ring-canvas",
                      inferred ? "bg-attention" : "bg-accent",
                    )}
                    aria-hidden
                  />
                  <Panel className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : e.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors hover:bg-panel-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-ink">{e.title}</h3>
                          {inferred && (
                            <Badge tone="warn" icon={<TriangleAlert className="size-2.5" />}>
                              استنتاجي
                            </Badge>
                          )}
                          {showProject && project && <Badge tone="neutral">{project.title}</Badge>}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                          <span className="num">{formatDate(e.date)}</span>
                          {e.datePrecision === "year" && <span>· دقة: سنة</span>}
                          <span>· ثقة {Math.round(e.confidence * 100)}٪</span>
                          <span>· {e.sourceIds.length} مصدر</span>
                        </p>
                      </div>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-line bg-surface px-3.5 py-3">
                        <p className="text-xs leading-relaxed text-ink-soft">{e.description}</p>

                        {e.sourceIds.length > 0 && (
                          <div>
                            <h4 className="label mb-1.5">المصادر</h4>
                            <ul className="space-y-1">
                              {e.sourceIds.map((sid) => {
                                const s = state.sources.find((x) => x.id === sid) ?? state.sources.find((x) => x.url === sid);
                                return (
                                  <li key={sid} className="text-2xs text-ink-mute">
                                    {s ? (
                                      <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="text-accent-soft hover:underline"
                                      >
                                        {s.title}
                                      </a>
                                    ) : (
                                      "مصدر محفوظ بالمعرّف"
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {e.entityIds.length > 0 && (
                          <div>
                            <h4 className="label mb-1.5">الكيانات المرتبطة</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {e.entityIds.map((eid) => {
                                const ent = state.entities.find((x) => x.id === eid);
                                return ent ? <Badge key={eid} tone="neutral">{ent.name}</Badge> : null;
                              })}
                            </div>
                          </div>
                        )}

                        {inferred && (
                          <p className="rounded-lg border border-attention/25 bg-attention-tint/30 px-3 py-2 text-2xs leading-relaxed text-attention">
                            هذا التاريخ مبني على تاريخ نشر المصدر، لا على نص يذكر الحدث. اعامله كفرضية حتى
                            يتأكد من مصدر صريح.
                          </p>
                        )}
                      </div>
                    )}
                  </Panel>
                </li>
              );
            })}
          </ol>
        </Section>
      ))}
    </div>
  );
}

export function CrossProjectTimeline() {
  const { state } = useApp();
  const [picked, setPicked] = useState("");
  const events = state.events.filter((e) => !picked || e.projectId === picked).slice().sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      <ProjectPicker value={picked} onChange={setPicked} />
      <TimelineRail events={events} showProject />
    </div>
  );
}

export { CircleDot, Button };
