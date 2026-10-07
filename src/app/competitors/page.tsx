"use client";

import { useState } from "react";
import { Lightbulb, Plus, Trash2, Users } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge, Panel, PanelHeader, Section } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, callAI, youtubeSearch } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";
import { formatDate, formatNumber, uid } from "@/lib/utils";
import type { Competitor } from "@/lib/types";

/**
 * Competitor analysis.
 *
 * Deliberately shows data and gaps, never verdicts. The screen tells you what
 * competitors do and what nobody covers; it never tells you that you are worse
 * than anyone, because that is not a fact the data can support.
 */
export function CompetitorPanel({ projectId }: { projectId?: string | null }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const competitors = state.competitors.filter((c) => !projectId || c.projectId === projectId);
  const gaps = state.contentGaps.filter((g) => g.projectId === projectId);

  const add = async () => {
    if (handle.trim().length < 2) {
      setError(new ApiError("validation", "اكتب اسم القناة أو رابطها."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const vids = await youtubeSearch(handle.trim(), 8);
      const first = vids[0];
      const competitor: Omit<Competitor, "id" | "addedAt"> = {
        projectId: projectId ?? null,
        name: first?.channelName ?? handle.trim().replace(/^@/, ""),
        handle: first?.channelName ?? handle.trim(),
        channelUrl: first?.channelUrl ?? `https://www.youtube.com/${handle.trim()}`,
        subscribers: 0,
        postingFrequencyPerWeek: 0,
        topics: [...new Set(vids.map((v) => v.topic).filter(Boolean))].slice(0, 6),
        recurringThemes: [...new Set(vids.flatMap((v) => v.structure?.mainArguments ?? []))].slice(0, 5),
        hookPatterns: [...new Set(vids.map((v) => v.structure?.hook ?? "").filter(Boolean))].slice(0, 5),
        thumbnailPatterns: [],
        formats: [...new Set(vids.map((v) => (v.durationSec > 900 ? "طويل" : v.durationSec > 300 ? "متوسط" : "قصير")))],
        topVideos: vids.slice(0, 5).map((v) => ({
          youtubeId: v.youtubeId,
          title: v.title,
          views: v.views,
          publishedAt: v.publishedAt,
          hook: v.structure?.hook ?? "",
          url: v.url,
        })),
        isDemo: vids[0]?.isDemo ?? true,
      };
      actions.addCompetitor(competitor);
      vids.slice(0, 4).forEach((v) => actions.addVideo({ ...v, projectId: projectId ?? null }));
      setHandle("");
      actions.logActivity({
        what: "أضاف قناة منافسة",
        projectId: projectId ?? null,
        projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
        toolName: "youtube_search",
        outcome: "success",
        detail: competitor.name,
      });
      toast.success("أُضيفت القناة", `${vids.length} فيديو للتجميع`);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  const findGaps = async () => {
    if (competitors.length === 0) {
      setError(new ApiError("validation", "أضف قناة منافسة واحدة على الأقل أولًا."));
      return;
    }
    setBusy(true);
    try {
      const topics = [...new Set(competitors.flatMap((c) => c.topics))].join("، ");
      const themes = [...new Set(competitors.flatMap((c) => c.recurringThemes))].slice(0, 8).join("، ");
      const res = await callAI(
        [
          {
            role: "system",
            content:
              "أنت محلل محتوى. حدّد المواضيع التي لم يغطّها منافسون في هذا المجال. لكل فجوة اذكر: الموضوع، الدليل على عدم تغطيتها، والصيغة المقترحة. لا تقارن بين القنوات ولا تقول إن أحدها أفضل. أخرج: ### الموضوع\nالدليل: …\nالصيغة: …",
          },
          { role: "user", content: `المواضيع: ${topics}\nالأنماط المتكررة: ${themes}` },
        ],
        "analysis",
      );

      const blocks = res.text.split(/###\s*/).filter((b) => b.trim());
      let added = 0;
      for (const b of blocks) {
        const topic = b.split("\n")[0].trim();
        if (!topic || topic.length < 4) continue;
        const evidence = b.match(/الدليل:\s*(.+)/)?.[1]?.trim() ?? "";
        const format = b.match(/الصيغة:\s*(.+)/)?.[1]?.trim() ?? "";
        const coverage = competitors.filter((c) =>
          c.topics.some((t) => t.toLowerCase() === topic.toLowerCase()),
        ).length;
        actions.upsert("contentGaps", {
          id: uid("gap"),
          projectId: projectId ?? "",
          topic,
          evidence,
          coverage,
          // Heuristic, and shown as such in the UI.
          opportunityScore: Math.min(100, 70 + Math.max(0, 30 - coverage * 15)),
          recommendedFormat: format,
        });
        added++;
      }
      if (added === 0) setError(new ApiError("bad_request", "لم يخرج النموذج فجوات صالحة. أعد المحاولة."));
      toast.success("حُلّلت الفجوات", `${added} موضوعًا`);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="sheen">
        <PanelHeader title="أضف قناة منافسة" icon={<Users className="size-4" />} />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Field label="اسم القناة أو رابطها" className="min-w-[220px] flex-1">
              {(id) => (
                <Input
                  id={id}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) void add();
                  }}
                  placeholder="@handle أو رابط القناة"
                  dir="ltr"
                />
              )}
            </Field>
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={() => void add()} loading={busy} icon={<Plus className="size-4" />}>
                أضف
              </Button>
              <Button variant="secondary" onClick={() => void findGaps()} loading={busy} icon={<Lightbulb className="size-4" />}>
                حدّد الفجوات
              </Button>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-ink-faint">
            يعرض هذا القسم البيانات والأنماط فقط. لن يخبرك النظام أن قناة أفضل منك — البيانات لا تقول ذلك.
          </p>
          {error && <ErrorState error={error} compact />}
        </div>
      </Panel>

      {competitors.length === 0 ? (
        <EmptyState
          icon={<Users className="size-4" />}
          title="لا قنوات منافسة"
          description="أضف قنوات تشاركك المجال. النماذج المتكررة تظهر في ما نجح لا في ما فشل."
        />
      ) : (
        <ul className="space-y-3">
          {competitors.map((c) => (
            <li key={c.id}>
              <Panel className="overflow-hidden">
                <div className="flex items-start gap-3 border-b border-line p-3.5">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {c.name}
                      {c.isDemo && <Badge tone="warn">بيانات تجريبية</Badge>}
                    </h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10px] text-ink-faint">
                      {c.subscribers > 0 && <span className="num">{formatNumber(c.subscribers)} مشترك</span>}
                      {c.postingFrequencyPerWeek > 0 && (
                        <span className="num">{c.postingFrequencyPerWeek} فيديو/أسبوع</span>
                      )}
                      <span>{c.topVideos.length} فيديو محفوظ</span>
                    </p>
                  </div>
                  <IconButton
                    label={`إزالة ${c.name}`}
                    size="sm"
                    onClick={() => actions.remove("competitors", c.id)}
                    className="text-ink-faint hover:text-danger"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </IconButton>
                </div>

                <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["المواضيع", c.topics],
                      ["أنماط متكررة", c.recurringThemes],
                      ["أنماط الخطّاف", c.hookPatterns],
                      ["الصيغ", c.formats],
                    ] as const
                  ).map(([label, items]) => (
                    <div key={label} className="bg-panel px-3.5 py-3">
                      <p className="label mb-1.5">{label}</p>
                      {items.length === 0 ? (
                        <p className="text-2xs text-ink-faint">لا بيانات كافية</p>
                      ) : (
                        <ul className="space-y-1">
                          {items.slice(0, 4).map((t) => (
                            <li key={t} className="truncate text-2xs text-ink-soft">
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {c.topVideos.length > 0 && (
                  <div className="border-t border-line p-3.5">
                    <h4 className="label mb-2">أعلى الفيديوهات</h4>
                    <ul className="space-y-1.5">
                      {c.topVideos.map((v) => (
                        <li key={v.youtubeId} className="flex flex-wrap items-center gap-2">
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="min-w-0 flex-1 truncate text-2xs text-accent-soft hover:underline"
                          >
                            {v.title}
                          </a>
                          <span className="num shrink-0 text-[10px] text-ink-faint">{formatNumber(v.views)}</span>
                          {v.publishedAt && (
                            <span className="shrink-0 text-[10px] text-ink-faint">{formatDate(v.publishedAt)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>
            </li>
          ))}
        </ul>
      )}

      {gaps.length > 0 && (
        <Section title="فجوات المحتوى" aside={<Badge tone="accent">{gaps.length}</Badge>}>
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {gaps.map((g) => (
                <li key={g.id} className="p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-sm font-medium text-ink">{g.topic}</h3>
                    <Badge tone={g.opportunityScore >= 85 ? "ok" : "accent"} mono>
                      {g.opportunityScore}
                    </Badge>
                  </div>
                  {g.evidence && <p className="mt-1.5 text-2xs leading-relaxed text-ink-mute">{g.evidence}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={g.coverage === 0 ? "ok" : "neutral"}>
                      {g.coverage === 0 ? "لا أحد يغطيه" : `${g.coverage} قناة تغطيه`}
                    </Badge>
                    {g.recommendedFormat && <Badge tone="neutral">{g.recommendedFormat}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
            رقم الفرصة تقدير استدلالي يعتمد على عدد القنوات التي تغطّي الموضوع — ليس قياسًا للمشاهدات.
          </p>
        </Section>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  const { state } = useApp();
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">المنافسون</h1>
        <p className="mt-1.5 text-xs text-ink-mute">
          البيانات والأنماط المشتركة بين القنوات — والبيانات وحدها تحدد الفجوات.
        </p>
      </header>
      {state.projects.length > 1 && (
        <label className="mb-5 block">
          <span className="label">المشروع</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1.5 h-9 w-full max-w-xs rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none focus:border-accent"
          >
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <CompetitorPanel projectId={projectId || null} />
    </div>
  );
}
