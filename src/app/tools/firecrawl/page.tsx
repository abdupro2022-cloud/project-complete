"use client";

import { useState } from "react";
import { FileCode2 } from "lucide-react";

import { ToolFrame, ToolResult, useCopy } from "@/components/tools/ToolFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ApiError, scrapePage } from "@/lib/api/client";

export default function FirecrawlToolPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof scrapePage>> | null>(null);
  const { copy } = useCopy();

  const run = async () => {
    setError(null);
    if (!/^https?:\/\//i.test(url.trim())) {
      setError(new ApiError("validation", "أدخل رابطًا كاملًا يبدأ بـ https://"));
      return;
    }
    setLoading(true);
    try {
      setResult(await scrapePage(url.trim()));
    } catch (e) {
      setError(e as ApiError);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = result?.markdown.trim().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <ToolFrame
      title="استخراج الصفحات"
      description="يحوّل صفحة الويب إلى نص نظيف جاهز للتحليل. الرابط وحده لا يكفي — النص هو ما يمكن للذكاء الاصطناعي أن يقرأه."
      integration={{ name: "Firecrawl", envVar: "firecrawl" }}
      input={
        <div className="space-y-4">
          <Field label="رابط الصفحة" required>
            {(id) => (
              <Input
                id={id}
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) void run();
                }}
                placeholder="https://example.com/article"
              />
            )}
          </Field>
          <Button variant="primary" onClick={() => void run()} loading={loading} icon={<FileCode2 className="size-4" />}>
            استخراج
          </Button>
        </div>
      }
    >
      <ToolResult
        title="المستخرج"
        loading={loading}
        error={error}
        empty={!result}
        demo={result?.demo}
        onCopy={() => result && void copy(result.markdown)}
      >
        {result && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 text-2xs text-ink-mute">
              <span className="font-medium text-ink">{result.title}</span>
              <span className="num">· {wordCount} كلمة</span>
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer noopener"
                className="ms-auto truncate font-mono text-[10px] text-accent-soft hover:underline"
                dir="ltr"
              >
                {result.url}
              </a>
            </div>
            <pre
              dir="auto"
              className="max-h-[26rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-canvas-deep p-3.5 text-xs leading-relaxed text-ink-soft"
            >
              {result.markdown}
            </pre>
          </div>
        )}
      </ToolResult>
    </ToolFrame>
  );
}
