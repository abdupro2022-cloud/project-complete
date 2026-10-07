"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

import { ToolFrame, ToolResult, useCopy } from "@/components/tools/ToolFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge, DemoTag } from "@/components/ui/Surface";
import { ApiError, transcribeVideo } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";
import { formatDuration } from "@/lib/utils";
import type { Transcript } from "@/lib/types";

export default function TranscriptToolPage() {
  const { actions, state } = useApp();
  const [url, setUrl] = useState("");
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<Transcript | null>(null);
  const [saved, setSaved] = useState(false);
  const { copy } = useCopy();

  const run = async () => {
    setError(null);
    setSaved(false);
    if (!/^https?:\/\//i.test(url.trim())) {
      setError(new ApiError("validation", "الصق رابط فيديو صالح يبدأ بـ https://"));
      return;
    }
    setLoading(true);
    try {
      setResult(await transcribeVideo(url.trim(), "ar"));
    } catch (e) {
      setError(e as ApiError);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!result) return;
    actions.addTranscript({ ...result, projectId: projectId || null });
    actions.logActivity({
      what: "استخرج تفريغًا نصيًا",
      projectId: projectId || null,
      projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
      toolName: "transcribe_video",
      outcome: "success",
      detail: `${result.segments.length} مقطع`,
    });
    setSaved(true);
  };

  const asMarkdown = (t: Transcript) =>
    [
      `# تفريغ نصي — ${t.videoUrl}`,
      "",
      `## الخطّاف\n${t.hook || "—"}`,
      "",
      `## الملخص\n${t.summary || "—"}`,
      "",
      `## النقاط\n${t.keyPoints.map((k) => `- ${k}`).join("\n") || "—"}`,
      "",
      `## البنية\n${t.structure || "—"}`,
      "",
      `## النص\n${t.segments.map((s) => `[${formatDuration(s.startSec)}] ${s.text}`).join("\n\n")}`,
    ].join("\n");

  return (
    <ToolFrame
      title="فيديو إلى نص"
      description="استخراج تفريغ نصي مع فصول ومؤشرات زمنية. المزوّد قابل للاستبدال بالكامل من إعدادات التكامل — لا ارتباط بخدمة واحدة."
      integration={{ name: "Video-to-Text", envVar: "video_to_text" }}
      input={
        <div className="space-y-4">
          <Field label="رابط الفيديو" required hint="يدعم روابط YouTube المباشرة.">
            {(id, desc) => (
              <Input
                id={id}
                aria-describedby={desc}
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
          {state.projects.length > 0 && (
            <Field label="حفظ في مشروع" hint="اختياري — يمكنك حفظه كتفريغ مستقل.">
              {(id) => (
                <select
                  id={id}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
                >
                  <option value="">بدون مشروع</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
          <Button variant="primary" onClick={() => void run()} loading={loading} icon={<Mic className="size-4" />}>
            استخراج النص
          </Button>
        </div>
      }
    >
      <ToolResult
        title="التفريغ"
        loading={loading}
        error={error}
        empty={!result}
        demo={result?.isDemo}
        onCopy={() => result && void copy(asMarkdown(result))}
      >
        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
              {result.isDemo && <DemoTag />}
              <Badge tone="neutral">{result.segments.length} مقطع</Badge>
              <Badge tone="neutral">{result.chapters.length} فصل</Badge>
              <div className="ms-auto flex gap-2">
                <Button size="sm" variant="subtle" onClick={save} disabled={saved}>
                  {saved ? "محفوظ" : "حفظ"}
                </Button>
              </div>
            </div>

            {result.hook && (
              <div>
                <h3 className="label mb-1.5">الخطّاف</h3>
                <p className="rounded-e-lg border-s-2 border-accent/50 bg-accent-tint/40 px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
                  {result.hook}
                </p>
              </div>
            )}

            {result.chapters.length > 0 && (
              <div>
                <h3 className="label mb-1.5">الفصول</h3>
                <ul className="space-y-1">
                  {result.chapters.map((c, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-xs">
                      <span className="num shrink-0 font-mono text-2xs text-live">{formatDuration(c.startSec)}</span>
                      <span className="text-ink-soft">{c.title}</span>
                      {c.summary && <span className="text-2xs text-ink-faint">— {c.summary}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.keyPoints.length > 0 && (
              <div>
                <h3 className="label mb-1.5">أهم النقاط</h3>
                <ul className="space-y-1.5">
                  {result.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="label mb-1.5">النص الكامل</h3>
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-line bg-canvas-deep p-3.5">
                {result.segments.map((s, i) => (
                  <p key={i} className="text-xs leading-relaxed text-ink-soft">
                    <span className="num me-2 font-mono text-[10px] text-live">{formatDuration(s.startSec)}</span>
                    {s.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </ToolResult>
    </ToolFrame>
  );
}
