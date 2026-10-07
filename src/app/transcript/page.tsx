"use client";

import { useState } from "react";
import { Copy, Download, Mic, Save } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge, DemoTag, Panel, PanelHeader, Section } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, transcribeVideo } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";
import { formatDuration, timeAgo } from "@/lib/utils";
import type { Transcript } from "@/lib/types";

/** Video → text. The provider is swappable; the output shape is not. */
export function TranscriptView({ projectId }: { projectId?: string | null }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const saved = state.transcripts.filter((t) => !projectId || t.projectId === projectId);

  const run = async () => {
    if (!/^https?:\/\//i.test(url.trim())) {
      setError(new ApiError("validation", "الصق رابط فيديو صالح يبدأ بـ https://"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const t = await transcribeVideo(url.trim(), "ar");
      actions.addTranscript({ ...t, projectId: projectId ?? null });
      actions.logActivity({
        what: "استخرج تفريغًا نصيًا",
        projectId: projectId ?? null,
        projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
        toolName: "transcribe_video",
        outcome: "success",
        detail: `${t.segments.length} مقطع`,
      });
      setUrl("");
      setOpenId(t.id);
      toast.success("استُخرج التفريغ", `${t.segments.length} مقطع`);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  const asMarkdown = (t: Transcript) =>
    [
      `# تفريغ نصي`,
      ``,
      `> ${t.videoUrl}`,
      ``,
      `## الخطّاف`,
      t.hook || "—",
      ``,
      `## النقاط`,
      ...(t.keyPoints.length ? t.keyPoints.map((k) => `- ${k}`) : ["—"]),
      ``,
      `## النص`,
      ...t.segments.map((s) => `[${formatDuration(s.startSec)}] ${s.text}`),
    ].join("\n");

  return (
    <div className="space-y-5">
      <Panel className="sheen">
        <PanelHeader title="استخرج تفريغًا نصيًا" icon={<Mic className="size-4" />} />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="رابط الفيديو" className="min-w-[240px] flex-1">
              {(id) => (
                <Input
                  id={id}
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) void run();
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              )}
            </Field>
            <Button variant="primary" onClick={() => void run()} loading={busy} icon={<Mic className="size-4" />}>
              استخراج
            </Button>
          </div>
          {error && <ErrorState error={error} compact onRetry={() => void run()} />}
        </div>
      </Panel>

      {saved.length === 0 ? (
        <EmptyState
          icon={<Mic className="size-4" />}
          title="لا تفريغات محفوظة"
          description="التفريغ النصي هو أسرع طريقة لدراسة كيف يبني منافسك الفيديو."
        />
      ) : (
        <Section title="التفريغات" aside={<Badge tone="neutral">{saved.length}</Badge>}>
          <ul className="space-y-2">
            {saved.map((t) => {
              const open = openId === t.id;
              return (
                <li key={t.id}>
                  <Panel className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : t.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors hover:bg-panel-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-ink">{t.hook || "تفريغ نصي"}</h3>
                          {t.isDemo && <DemoTag />}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                          <span>{t.segments.length} مقطع</span>
                          <span>· {t.chapters.length} فصل</span>
                          <span>· {timeAgo(t.createdAt)}</span>
                        </p>
                      </div>
                    </button>

                    {open && (
                      <div className="space-y-4 border-t border-line bg-surface p-3.5">
                        {t.chapters.length > 0 && (
                          <div>
                            <h4 className="label mb-1.5">الفصول</h4>
                            <ul className="space-y-1">
                              {t.chapters.map((c, i) => (
                                <li key={i} className="flex items-baseline gap-2 text-2xs">
                                  <span className="num shrink-0 font-mono text-live">{formatDuration(c.startSec)}</span>
                                  <span className="text-ink-soft">{c.title}</span>
                                  {c.summary && <span className="text-ink-faint">— {c.summary}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {t.keyPoints.length > 0 && (
                          <div>
                            <h4 className="label mb-1.5">أهم النقاط</h4>
                            <ul className="space-y-1">
                              {t.keyPoints.map((k, i) => (
                                <li key={i} className="flex gap-2 text-2xs leading-relaxed text-ink-soft">
                                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                                  {k}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h4 className="label mb-1.5">النص المفهرس</h4>
                          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-canvas-deep p-3">
                            {t.segments.map((s, i) => (
                              <p key={i} className="text-2xs leading-relaxed text-ink-soft">
                                <span className="num me-2 font-mono text-[10px] text-live">
                                  {formatDuration(s.startSec)}
                                </span>
                                {s.text}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Copy className="size-3.5" />}
                            onClick={async () => {
                              await navigator.clipboard.writeText(asMarkdown(t)).catch(() => {});
                              toast.success("نُسخ التفريغ");
                            }}
                          >
                            نسخ
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Download className="size-3.5" />}
                            onClick={() => {
                              const blob = new Blob([asMarkdown(t)], { type: "text/markdown" });
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = "transcript.md";
                              a.click();
                              URL.revokeObjectURL(a.href);
                            }}
                          >
                            تنزيل
                          </Button>
                          {projectId && !t.projectId && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Save className="size-3.5" />}
                              onClick={() => {
                                actions.upsert("transcripts", { ...t, projectId });
                                toast.success("ربط التفريغ بالمشروع");
                              }}
                            >
                              اربط بالمشروع
                            </Button>
                          )}
                          <IconButton
                            label="حذف التفريغ"
                            size="sm"
                            onClick={() => actions.remove("transcripts", t.id)}
                            className="ms-auto text-ink-faint hover:text-danger"
                          >
                            ×
                          </IconButton>
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
    </div>
  );
}

export default function TranscriptPage() {
  const { state } = useApp();
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">نص الفيديو</h1>
        <p className="mt-1.5 text-xs text-ink-mute">
          استخراج تفريغ مع فصول ومؤشرات زمنية. المزوّد قابل للاستبدال من إعدادات التكامل.
        </p>
      </header>
      {state.projects.length > 1 && (
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
      <TranscriptView projectId={projectId || null} />
    </div>
  );
}
