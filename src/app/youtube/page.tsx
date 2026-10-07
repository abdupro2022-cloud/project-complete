"use client";

import { useState } from "react";
import { Mic, Plus, Search, Video } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Badge, DemoTag, Panel, PanelHeader } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, transcribeVideo, youtubeSearch } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";
import type { Video as VideoRow } from "@/lib/types";

/**
 * YouTube research.
 *
 * Structure is the point: hook, pattern, beats, CTA. View counts alone tell you
 * what worked; the structure tells you why.
 */
export function YouTubeResearch({ projectId }: { projectId?: string | null }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [results, setResults] = useState<VideoRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<string | null>(null);

  const run = async () => {
    if (q.trim().length < 2) {
      setError(new ApiError("validation", "اكتب استعلامًا من كلمتين على الأقل."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setResults(await youtubeSearch(q.trim(), 10));
      setOpenId(null);
    } catch (e) {
      setError(e as ApiError);
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const save = (v: VideoRow) => {
    actions.addVideo({ ...v, projectId: projectId ?? null });
    actions.logActivity({
      what: "حفظ فيديو للبحث",
      projectId: projectId ?? null,
      projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
      toolName: "youtube_search",
      outcome: "success",
      detail: v.channelName,
    });
    toast.success("حُفظ الفيديو", v.title.slice(0, 50));
  };

  const transcribe = async (v: VideoRow) => {
    setTranscribing(v.id);
    try {
      const t = await transcribeVideo(v.url, "ar");
      actions.addTranscript({ ...t, projectId: projectId ?? null });
      toast.success("استُخرج التفريغ", `${t.segments.length} مقطع`);
    } catch (e) {
      toast.error("تعذّر الاستخراج", (e as ApiError).message);
    } finally {
      setTranscribing(null);
    }
  };

  const saved = state.videos.filter((v) => !projectId || v.projectId === projectId);

  return (
    <div className="space-y-5">
      <Panel className="sheen">
        <PanelHeader title="ابحث في YouTube" icon={<Video className="size-4" />} />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) void run();
              }}
              placeholder="موضوع يهمّك"
              aria-label="استعلام YouTube"
              className="h-10 min-w-[200px] flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
            />
            <Button variant="primary" onClick={() => void run()} loading={busy} icon={<Search className="size-4" />}>
              بحث
            </Button>
          </div>
          {error && <ErrorState error={error} compact onRetry={() => void run()} />}
        </div>
      </Panel>

      {results.length > 0 && (
        <Section title={`${results.length} نتيجة`}>
          <ul className="space-y-2">
            {results.map((v) => {
              const open = openId === v.id;
              return (
                <li key={v.id}>
                  <Panel className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : v.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 p-3.5 text-start transition-colors hover:bg-panel-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium leading-snug text-ink">{v.title}</h3>
                          {v.isDemo && <DemoTag />}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[10px] text-ink-faint">
                          <span>{v.channelName}</span>
                          <span className="num">{formatNumber(v.views)} مشاهدة</span>
                          <span className="num">{formatNumber(v.likes)} إعجاب</span>
                          {v.durationSec > 0 && <span className="num">{formatDuration(v.durationSec)}</span>}
                          {v.publishedAt && <span>· {formatDate(v.publishedAt)}</span>}
                        </p>
                      </div>
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-line bg-surface p-3.5">
                        {v.structure ? (
                          <>
                            <div>
                              <h4 className="label mb-1">الخطّاف</h4>
                              <p className="rounded-e-lg border-s-2 border-accent/50 bg-accent-tint/40 px-3 py-2 text-xs leading-relaxed text-ink">
                                {v.structure.hook}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge tone="accent">{v.structure.structurePattern}</Badge>
                              <Badge tone="neutral" mono>قوة الخطّاف {v.structure.hookScore}</Badge>
                            </div>
                            <div>
                              <h4 className="label mb-1.5">المشاهد</h4>
                              <ol className="space-y-1">
                                {v.structure.beats.map((b, i) => (
                                  <li key={i} className="flex items-baseline gap-2 text-2xs">
                                    <span className="num shrink-0 font-mono text-live">{formatDuration(b.atSec)}</span>
                                    <span className="text-ink-soft">{b.label}</span>
                                    <span className="text-ink-faint">— {b.note}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                            {v.structure.mainArguments.length > 0 && (
                              <div>
                                <h4 className="label mb-1.5">الحجج</h4>
                                <ul className="space-y-1">
                                  {v.structure.mainArguments.map((a, i) => (
                                    <li key={i} className="flex gap-2 text-2xs text-ink-soft">
                                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-2xs text-ink-mute">
                            تحليل البنية متاح بعد ربط مفتاح YouTube.
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                          <Button size="sm" variant="secondary" onClick={() => save(v)} icon={<Plus className="size-3.5" />}>
                            احفظ للمشروع
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void transcribe(v)}
                            loading={transcribing === v.id}
                            icon={<Mic className="size-3.5" />}
                          >
                            استخرج النص
                          </Button>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center rounded-md border border-line px-2.5 py-1.5 text-2xs text-ink-mute transition-colors hover:text-ink"
                          >
                            افتح في YouTube
                          </a>
                        </div>
                      </div>
                    )}
                  </Panel>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title="محفوظات">
        {saved.length === 0 ? (
          <EmptyState compact title="لا فيديوهات محفوظة" description="احفظ فيديو لتحليله لاحقًا أو للاستشهاد به." />
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {saved.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-ink-soft">{v.title}</p>
                    <p className="num text-[10px] text-ink-faint">{formatNumber(v.views)} مشاهدة</p>
                  </div>
                  <IconButton label="حذف" size="sm" onClick={() => actions.remove("videos", v.id)} className="text-ink-faint hover:text-danger">
                    ×
                  </IconButton>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </Section>
    </div>
  );
}

/** Local section wrapper — keeps the module self-contained. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}

export default function YouTubePage() {
  const { state } = useApp();
  const [projectId, setProjectId] = useState<string>("");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">بحث YouTube</h1>
        <p className="mt-1.5 text-xs text-ink-mute">
          ابحث، ثم اقرأ البنية — الخطّاف ونمط المشاهد والدعوة، لا الأرقام فقط.
        </p>
      </header>
      {state.projects.length > 0 && (
        <label className="mb-5 block">
          <span className="label">حفظ في مشروع</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1.5 h-9 w-full max-w-xs rounded-lg border border-line bg-panel px-2.5 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="">بدون مشروع</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <YouTubeResearch projectId={projectId || null} />
    </div>
  );
}
