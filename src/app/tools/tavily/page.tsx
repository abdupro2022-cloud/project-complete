"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { ToolFrame, ToolResult, useCopy } from "@/components/tools/ToolFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Surface";
import { ApiError, searchWeb } from "@/lib/api/client";
import type { SearchDepth } from "@/lib/providers/types";
import { formatDate, timeAgo } from "@/lib/utils";

export default function TavilyToolPage() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<SearchDepth>("advanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchWeb>> | null>(null);
  const { copy } = useCopy();

  const run = async () => {
    if (query.trim().length < 2) {
      setError(new ApiError("validation", "اكتب استعلامًا من كلمتين على الأقل."));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await searchWeb(query.trim(), { depth, maxResults: 8 }));
    } catch (e) {
      setError(e as ApiError);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolFrame
      title="بحث الويب"
      description="بحث مُهيّأ للذكاء الاصطناعي: يعيد مقتطفات قابلة للقراءة، لا قائمة روابط. النتيجة تُحفظ في المشروع عند ربطها."
      integration={{ name: "Tavily", envVar: "tavily" }}
      input={
        <div className="space-y-4">
          <Field label="الاستعلام" required>
            {(id) => (
              <Input
                id={id}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) void run();
                }}
                placeholder="لماذا انهارت شركة تقنية بعد جولة تمويل ناجحة"
              />
            )}
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="عمق البحث" className="w-44">
              {() => (
                <Segmented
                  aria-label="عمق البحث"
                  value={depth}
                  onChange={setDepth}
                  options={[
                    { value: "basic", label: "سريع" },
                    { value: "advanced", label: "متعمّق" },
                  ]}
                />
              )}
            </Field>
            <Button variant="primary" onClick={() => void run()} loading={loading} icon={<Search className="size-4" />} className="ms-auto">
              بحث
            </Button>
          </div>
        </div>
      }
    >
      <ToolResult
        title="النتائج"
        loading={loading}
        error={error}
        empty={!result}
        demo={result?.demo}
        onCopy={() => result && void copy(result.hits.map((h) => `- ${h.title}\n  ${h.url}\n  ${h.snippet}`).join("\n\n"))}
      >
        {result && (
          <ol className="space-y-3">
            {result.hits.map((hit, i) => (
              <li key={hit.url} className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <span className="cite shrink-0">{`S${String(i + 1).padStart(2, "0")}`}</span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium leading-snug text-ink hover:text-accent-soft"
                    >
                      {hit.title}
                    </a>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                      <span className="font-mono" dir="ltr">{hit.domain}</span>
                      {hit.publishedAt && <span>· {formatDate(hit.publishedAt)}</span>}
                      <span>· {timeAgo(hit.publishedAt ?? new Date().toISOString())}</span>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">{hit.snippet}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{hit.sourceType}</Badge>
                      {hit.score > 0 && <Badge tone="accent" mono>{hit.score.toFixed(2)}</Badge>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </ToolResult>
    </ToolFrame>
  );
}
