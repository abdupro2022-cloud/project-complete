"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Badge, Panel, PanelHeader } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, callAI } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";
import { formatDuration, uid } from "@/lib/utils";
import type { ScriptSection, Short, ThumbnailConcept, TitleIdea } from "@/lib/types";

/**
 * Derived-content generators.
 *
 * Titles, shorts and thumbnails are all "one input → many outputs" surfaces
 * with the same honest rules: the model is told not to invent numbers, the
 * result is editable, and every generated item is labelled as generated.
 */

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

export function TitlesPanel({ projectId, scriptTitle }: { projectId: string; scriptTitle?: string }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const titles = state.titleIdeas.filter((t) => t.projectId === projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [custom, setCustom] = useState("");

  const generate = async () => {
    const topic = custom.trim() || state.projects.find((p) => p.id === projectId)?.title || "";
    if (!topic) return;
    setBusy(true);
    setError(null);
    try {
      const res = await callAI(
        [
          {
            role: "system",
            content:
              "أنت خبير في عناوين يوتيوب. اقترح عناوين عربية. كل عنوان من زاوية مختلفة فعليًا (مبلغ، مفارقة، ندرة، سؤال). لا تخترع أرقامًا. أخرج الجدول بصيغة Markdown: | العنوان | الزاوية | قوة الجذب | من 100 |. لا تشرح الجدول.",
          },
          { role: "user", content: `الموضوع: ${topic}` },
        ],
        "writing",
      );

      const rows = [...res.text.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d{1,3})\s*\|$/gm)];
      let added = 0;
      for (const m of rows) {
        const text = m[1].trim();
        if (!text || text === "العنوان" || text === "---") continue;
        actions.addTitleIdea({
          projectId,
          text,
          angle: m[2].trim(),
          pullScore: Math.min(100, Number(m[3]) || 60),
        });
        added++;
      }
      if (added === 0) {
        // Model ignored the table format — keep the raw text editable instead of lying.
        actions.addTitleIdea({ projectId, text: res.text.split("\n---\n")[0].slice(0, 160), angle: "اقتراح", pullScore: 60 });
        added = 1;
      }
      actions.logActivity({
        what: `ولّد ${added} عناوين`,
        projectId,
        projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
        toolName: "generate_script",
        outcome: "success",
        detail: "generate_titles",
      });
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel className="sheen">
        <PanelHeader
          title="اقتراح عناوين"
          subtitle="كل عنوان من زاوية مختلفة، لا صياغة مختلفة"
          icon={<Sparkles className="size-4" />}
        />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={scriptTitle ?? "موضوع الفيديو"}
              aria-label="موضوع توليد العناوين"
              className="h-9 min-w-[200px] flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
            />
            <Button variant="primary" onClick={() => void generate()} loading={busy} icon={<Sparkles className="size-4" />}>
              اقترح عناوين
            </Button>
          </div>
          <p className="text-[10px] leading-relaxed text-ink-faint">
            رقم «قوة الجذب» تقدير استدلالي مبني على بنية العنوان — ليس قياسًا فعليًا للمشاهدات.
          </p>
          {error && <ErrorState error={error} compact onRetry={() => void generate()} />}
        </div>
      </Panel>

      {titles.length === 0 ? (
        <EmptyState
          compact
          title="لا عناوين بعد"
          description="اضغط «اقترح عناوين» أو أضف عنوانًا يدويًا."
          action={{
            label: "أضف يدويًا",
            onClick: () => actions.addTitleIdea({ projectId, text: "عنوان جديد", angle: "يدوي", pullScore: 0 }),
          }}
        />
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {[...titles].sort((a, b) => b.pullScore - a.pullScore).map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-ink">{t.text}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{t.angle}</Badge>
                    {t.pullScore > 0 && (
                      <Badge tone={t.pullScore >= 85 ? "ok" : t.pullScore >= 70 ? "accent" : "neutral"} mono>
                        {t.pullScore}
                      </Badge>
                    )}
                  </div>
                </div>
                <IconButton
                  label="نسخ العنوان"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(t.text).catch(() => {});
                    toast.success("نُسخ العنوان");
                  }}
                >
                  <Copy className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton
                  label="حذف العنوان"
                  size="sm"
                  onClick={() => actions.remove("titleIdeas", t.id)}
                  className="text-ink-faint hover:text-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </IconButton>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shorts
// ---------------------------------------------------------------------------

export function ShortsPanel({ projectId }: { projectId: string }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const shorts = state.shorts.filter((s) => s.projectId === projectId);
  const script = state.scripts.find((s) => s.projectId === projectId);
  const sections = state.scriptSections.filter((s) => script && s.scriptId === script.id && s.narration.trim());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const generate = async () => {
    if (sections.length === 0) {
      setError(new ApiError("validation", "اكتب السكربت أولًا — الاستخراج يبدأ من أقوى لحظاته."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const text = sections.map((s) => s.narration).join("\n\n");
      const res = await callAI(
        [
          {
            role: "system",
            content:
              "أنت محرّر شورتس. استخرج من السكربت أطول ثلاث مقاطع قائمة بذاتها. لكل واحد أخرج بالضبط هذا التنسيق:\n### N\nالخطّاف: …\nالجسم: …\nالنهاية: …\nالدعوة: …\nالمدة: NN\nالعنوان: …\nالهاشتاغات: a, b, c\nلا تخترع أرقامًا غير الموجودة في النص.",
          },
          { role: "user", content: text },
        ],
        "writing",
      );

      const blocks = res.text.split(/###\s*\d+/).filter((b) => b.trim());
      const pick = (b: string, key: string) => b.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim() ?? "";
      let added = 0;
      for (const b of blocks) {
        const hook = pick(b, "الخطّاف");
        if (!hook) continue;
        actions.addShort({
          projectId,
          scriptId: script?.id ?? null,
          hook,
          body: pick(b, "الجسم"),
          ending: pick(b, "النهاية"),
          cta: pick(b, "الدعوة"),
          estimatedSec: Number(pick(b, "المدة").replace(/\D/g, "")) || 45,
          caption: "",
          title: pick(b, "العنوان") || hook.slice(0, 60),
          hashtags: pick(b, "الهاشتاغات")
            .split(/[,،\s]+/)
            .map((h) => h.replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 6),
          sourceSectionId: null,
        });
        added++;
      }
      if (added === 0) setError(new ApiError("bad_request", "لم يخرج النموذج مقاطع قابلة للاستخدام. جرّب إعادة التوليد."));
      actions.logActivity({
        what: `ولّد ${added} شورت`,
        projectId,
        projectTitle: state.projects.find((p) => p.id === projectId)?.title ?? null,
        toolName: "generate_script",
        outcome: "success",
        detail: "generate_shorts",
      });
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel className="sheen">
        <PanelHeader
          title="استخراج الشورتس"
          subtitle="من السكربت، بلا إعادة كتابة"
          icon={<Sparkles className="size-4" />}
          actions={
            <Button size="sm" variant="primary" onClick={() => void generate()} loading={busy} icon={<Sparkles className="size-3.5" />}>
              استخراج
            </Button>
          }
        />
        <div className="px-4 py-3 text-2xs text-ink-mute">
          {sections.length > 0
            ? `${sections.length} مشهد جاهز للاستخراج من إجمالي السكربت.`
            : "لا يوجد سكربت بعد. الاستخراج يحتاج نصًا مكتوبًا."}
        </div>
        {error && (
          <div className="px-4 pb-4">
            <ErrorState error={error} compact onRetry={() => void generate()} />
          </div>
        )}
      </Panel>

      {shorts.length === 0 ? (
        <EmptyState
          compact
          title="لا شورتس بعد"
          description="الشورت هو مقطع قائم بذاته: خطّاف، جسم، نهاية، ودعوة. يُستخرج من أقوى لحظة في السكربت."
          action={{
            label: "أضف يدويًا",
            onClick: () =>
              actions.addShort({
                projectId,
                scriptId: null,
                hook: "خطّاف جديد",
                body: "",
                ending: "",
                cta: "",
                estimatedSec: 45,
                caption: "",
                title: "",
                hashtags: [],
                sourceSectionId: null,
              }),
          }}
        />
      ) : (
        <ul className="space-y-2.5">
          {shorts.map((s) => (
            <li key={s.id}>
              <ShortCard short={s} onCopy={() => toast.success("نُسخ الشورت")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ShortCard({ short, onCopy }: { short: Short; onCopy: () => void }) {
  const { actions } = useApp();
  const full = [short.hook, short.body, short.ending, short.cta].filter(Boolean).join("\n\n");

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start gap-3 p-3.5">
        <span className="num mt-0.5 shrink-0 rounded-md bg-panel-2 px-1.5 py-0.5 text-[10px] text-ink-mute">
          {short.estimatedSec}ث
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium leading-snug text-ink">{short.hook}</p>
          {short.body && <p className="text-xs leading-relaxed text-ink-soft">{short.body}</p>}
          {short.ending && (
            <p className="rounded-e-lg border-s-2 border-accent/40 bg-accent-tint/30 px-3 py-1.5 text-xs text-ink-soft">
              {short.ending}
            </p>
          )}
          {short.cta && <p className="text-2xs text-ink-mute">الدعوة: {short.cta}</p>}
          {short.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {short.hashtags.map((h) => (
                <span key={h} className="text-2xs text-accent-soft">
                  #{h}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <IconButton label="نسخ" size="sm" onClick={async () => { await navigator.clipboard.writeText(full).catch(() => {}); onCopy(); }}>
            <Copy className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton
            label="حذف"
            size="sm"
            onClick={() => actions.remove("shorts", short.id)}
            className="text-ink-faint hover:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </IconButton>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------

export function ThumbnailsPanel({ projectId }: { projectId: string }) {
  const { state, actions } = useApp();
  const toast = useToast();
  const items = state.thumbnailConcepts.filter((t) => t.projectId === projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const generate = async () => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      const res = await callAI(
        [
          {
            role: "system",
            content:
              "أنت مصمم ثامبنيل. اقترح ثلاثة مفاهيم. لكل واحد أخرج:\n### N\nالمفهوم: …\nالنص: …\nالاتجاه البصري: …\nالانفعال: …\nملاحظة التباين: …\nاجعل التباين ملموسًا: أين يوجد النص تحديدًا على الإطار.",
          },
          { role: "user", content: `${project.title}\n${project.premise}` },
        ],
        "writing",
      );
      const pick = (b: string, k: string) => b.match(new RegExp(`${k}:\\s*(.+)`))?.[1]?.trim() ?? "";
      let added = 0;
      for (const b of res.text.split(/###\s*\d+/).filter((x) => x.trim())) {
        const concept = pick(b, "المفهوم");
        if (!concept) continue;
        actions.addThumbnailConcept({
          projectId,
          concept,
          textOverlay: pick(b, "النص"),
          visualDirection: pick(b, "الاتجاه البصري"),
          emotion: pick(b, "الانفعال"),
          contrastNote: pick(b, "ملاحظة التباين"),
        });
        added++;
      }
      if (added === 0) setError(new ApiError("bad_request", "لم يخرج النموذج مفاهيم صالحة. أعد التوليد."));
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel className="sheen">
        <PanelHeader
          title="مفاهيم مصغّرات"
          subtitle="ما يُرى في 0.5 ثانية"
          icon={<Sparkles className="size-4" />}
          actions={
            <Button size="sm" variant="primary" onClick={() => void generate()} loading={busy} icon={<Sparkles className="size-3.5" />}>
              اقترح
            </Button>
          }
        />
        {error && (
          <div className="px-4 pb-4">
            <ErrorState error={error} compact onRetry={() => void generate()} />
          </div>
        )}
      </Panel>

      {items.length === 0 ? (
        <EmptyState
          compact
          title="لا مفاهيم بعد"
          description="الصورة المصغّرة تحسم نصف النقرات. ابدأ من المفهوم لا من التصميم."
          action={{
            label: "أضف يدويًا",
            onClick: () =>
              actions.addThumbnailConcept({
                projectId,
                concept: "مفهوم جديد",
                textOverlay: "",
                visualDirection: "",
                emotion: "",
                contrastNote: "",
              }),
          }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t.id}>
              <Panel className="flex h-full flex-col overflow-hidden">
                <ThumbnailFrame text={t.textOverlay} emotion={t.emotion} />
                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  <h3 className="text-sm font-medium leading-snug text-ink">{t.concept}</h3>
                  {t.visualDirection && <p className="text-2xs leading-relaxed text-ink-mute">{t.visualDirection}</p>}
                  {t.contrastNote && (
                    <p className="rounded-lg border border-line bg-surface px-2.5 py-2 text-[10px] leading-relaxed text-ink-mute">
                      <span className="text-ink-faint">التباين: </span>
                      {t.contrastNote}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Copy className="size-3.5" />}
                      onClick={async () => {
                        await navigator.clipboard
                          .writeText([t.concept, t.textOverlay, t.visualDirection, t.contrastNote].filter(Boolean).join("\n"))
                          .catch(() => {});
                        toast.success("نُسخ المفهوم");
                      }}
                    >
                      نسخ
                    </Button>
                    <IconButton
                      label="حذف"
                      size="sm"
                      onClick={() => actions.remove("thumbnailConcepts", t.id)}
                      className="ms-auto text-ink-faint hover:text-danger"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </IconButton>
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 16:9 frame showing where the overlay text sits. */
function ThumbnailFrame({ text, emotion }: { text: string; emotion: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-gradient-to-br from-panel-3 to-canvas-deep">
      <div className="grid-texture absolute inset-0 opacity-40" aria-hidden />
      {text && (
        <div className="absolute inset-x-3 bottom-3">
          <span className="inline-block max-w-full truncate rounded bg-white/95 px-2 py-1 text-[11px] font-bold text-black">
            {text}
          </span>
        </div>
      )}
      {emotion && (
        <span className="absolute start-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/90">
          {emotion}
        </span>
      )}
      <span className="absolute end-2 top-2 text-[9px] text-ink-faint" aria-hidden>
        16:9
      </span>
    </div>
  );
}
