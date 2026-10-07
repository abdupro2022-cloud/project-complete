"use client";

import { useState } from "react";
import { Video } from "lucide-react";

import { ToolFrame, ToolResult, useCopy } from "@/components/tools/ToolFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge, DemoTag } from "@/components/ui/Surface";
import { ApiError, youtubeSearch, youtubeVideo } from "@/lib/api/client";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";
import type { Video as VideoRow } from "@/lib/types";

export default function YouTubeToolPage() {
  const [mode, setMode] = useState<"search" | "video">("search");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [single, setSingle] = useState<VideoRow | null>(null);
  const { copy } = useCopy();

  const run = async () => {
    setError(null);
    setVideos([]);
    setSingle(null);
    setLoading(true);
    try {
      if (mode === "search") {
        if (q.trim().length < 2) throw new ApiError("validation", "اكتب استعلامًا من كلمتين على الأقل.");
        setVideos(await youtubeSearch(q.trim(), 8));
      } else {
        if (!/^https?:\/\//i.test(q.trim())) {
          throw new ApiError("validation", "الصق رابط YouTube كاملًا.");
        }
        setSingle(await youtubeVideo(q.trim()));
      }
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolFrame
      title="YouTube"
      description="ابحث في الفيديوهات أو افتح فيديو محدد. التحليل يتناول البنية والخطّاف والدعوة — لا الأرقام السطحية فقط."
      integration={{ name: "YouTube Data API v3", envVar: "youtube" }}
      input={
        <div className="space-y-4">
          <div className="flex gap-1.5">
            {(["search", "video"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  mode === m
                    ? "border-accent/40 bg-accent-tint text-accent-soft"
                    : "border-line text-ink-mute hover:text-ink"
                }`}
              >
                {m === "search" ? "بحث" : "فيديو محدد"}
              </button>
            ))}
          </div>
          <Field
            label={mode === "search" ? "الاستعلام" : "رابط الفيديو"}
            required
            hint={mode === "video" ? "يدعم: watch?v=، youtu.be، embed، shorts" : undefined}
          >
            {(id) => (
              <Input
                id={id}
                dir={mode === "video" ? "ltr" : "rtl"}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) void run();
                }}
                placeholder={mode === "search" ? "تحليل إفلاس شركات التقنية" : "https://www.youtube.com/watch?v=..."}
              />
            )}
          </Field>
          <Button variant="primary" onClick={() => void run()} loading={loading} icon={<Video className="size-4" />}>
            {mode === "search" ? "ابحث" : "افتح"}
          </Button>
        </div>
      }
    >
      <ToolResult
        title={mode === "search" ? `${videos.length} فيديو` : single?.title ?? "الفيديو"}
        loading={loading}
        error={error}
        empty={!loading && !error && videos.length === 0 && !single}
        demo={videos[0]?.isDemo ?? single?.isDemo}
        onCopy={() => void copy((videos.length ? videos : single ? [single] : []).map((v) => `${v.title}\n${v.url}\n${v.views} مشاهدة`).join("\n\n"))}
      >
        <ul className="space-y-3">
          {(single ? [single] : videos).map((v) => (
            <li key={v.id} className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink hover:text-accent-soft"
                >
                  {v.title}
                </a>
                {v.isDemo && <DemoTag />}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[10px] text-ink-faint">
                <span>{v.channelName}</span>
                <span className="num">{formatNumber(v.views)} مشاهدة</span>
                <span className="num">{formatNumber(v.likes)} إعجاب</span>
                {v.durationSec > 0 && <span className="num">{formatDuration(v.durationSec)}</span>}
                {v.publishedAt && <span>· {formatDate(v.publishedAt)}</span>}
              </p>
              {v.structure ? (
                <div className="mt-2.5 space-y-1.5 rounded-lg border border-line bg-surface px-3 py-2.5">
                  <p className="text-2xs text-ink-mute">
                    <span className="text-ink-faint">الخطّاف:</span> {v.structure.hook}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <Badge tone="accent">{v.structure.structurePattern}</Badge>
                    <Badge tone="neutral" mono>
                      قوة الخطّاف {v.structure.hookScore}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-2xs text-ink-faint">
                  تحليل البنية متاح بعد ربط مفتاح YouTube.
                </p>
              )}
            </li>
          ))}
        </ul>
      </ToolResult>
    </ToolFrame>
  );
}
