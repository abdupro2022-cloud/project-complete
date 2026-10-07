"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Badge, Panel, PanelHeader } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { MEMORY_LABELS_AR, type MemoryCategory } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

/**
 * Prompt library.
 *
 * Prompts are stored as memory entries with `category: "instructions"`, so a
 * prompt you promote is genuinely part of what the assistant knows — not a
 * separate silo.
 */
const STARTERS = [
  {
    key: "خطّاف رقمي",
    category: "instructions" as MemoryCategory,
    body: "اكتب ثلاثة خطافات تبدأ برقم محدد من مصادقي، ثم سؤال يعكس الترتيب الطبيعي للمشاهد. لا تخترع أي رقم غير موجود في المشروع.",
  },
  {
    key: "تدقيق رقمي",
    category: "instructions" as MemoryCategory,
    body: "راجع كل رقم في النص. لكل رقم اذكر مصدره وعدد المصادر التي تسنده. إن كان مصدرًا واحدًا فقط، اكتب: يحتاج مصدرًا ثانيًا قبل العرض.",
  },
  {
    key: "شرح بصري",
    category: "instructions" as MemoryCategory,
    body: "حوّل كل فكرة إلى مشهد: ماذا يُرى على الشاشة، ومن يتحرك، وأين تذهب العين. لا تكتب «لقطة جميلة» — اكتب ما هو موجود فعلًا.",
  },
  {
    key: "تفكيك الخصوم",
    category: "instructions" as MemoryCategory,
    body: "اعرض أدق تفسيرين متعارضين، واذكر لكل تفسير ما الذي يجعله أقوى. لا تحسم — اترك المشهد يحكم.",
  },
];

export default function PromptsPage() {
  const { state, actions } = useApp();
  const toast = useToast();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("instructions");

  // Prompts live in memories with the instructions category.
  const prompts = state.memories.filter((m) => m.category === "instructions");

  const save = () => {
    if (name.trim().length < 2 || body.trim().length < 5) return;
    actions.addMemory({ category, key: name.trim(), value: body.trim(), enabled: true, source: "user" });
    setName("");
    setBody("");
    toast.success("حُفظ الأمر", "سيُحقن في كل طلب بعد الآن");
  };

  const seed = () => {
    for (const s of STARTERS) {
      if (prompts.some((p) => p.key === s.key)) continue;
      actions.addMemory({ category: s.category, key: s.key, value: s.body, enabled: true, source: "user" });
    }
    toast.success("أُضيفت الأوامر الجاهزة");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">مكتبة الأوامر</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          تعليمات ثابتة تُحقن في كل طلب. احفظ هنا ما لا تريد تكراره — «لا تخترع أرقامًا» أو «اكتب بلغة
          قابلة للنطق».
        </p>
      </header>

      <Panel className="sheen mb-6">
        <PanelHeader title="أضف أمرًا" icon={<Plus className="size-4" />} />
        <div className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <Field label="الاسم">
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: لا تخترع أرقامًا"
                />
              )}
            </Field>
            <Field label="التصنيف">
              {(id) => (
                <select
                  id={id}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
                >
                  {(Object.keys(MEMORY_LABELS_AR) as MemoryCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {MEMORY_LABELS_AR[c]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="النص">
            {(id) => (
              <Textarea
                id={id}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="اكتب التعليمات بصيغة أمر مباشر…"
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={save} disabled={name.trim().length < 2 || body.trim().length < 5}>
              حفظ
            </Button>
            {prompts.length < STARTERS.length && (
              <Button variant="ghost" onClick={seed}>
                أضف الأوامر الجاهزة
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {prompts.length === 0 ? (
        <EmptyState
          icon={<Copy className="size-4" />}
          title="لا أوامر محفوظة"
          description="ابدأ بأمر واحد تطبّقه دائمًا — هذا أسرع طريقة لتثبيت أسلوبك."
          action={{ label: "أضف الأوامر الجاهزة", onClick: seed }}
        />
      ) : (
        <ul className="space-y-2.5">
          {prompts.map((p) => (
            <li key={p.id}>
              <Panel className="overflow-hidden">
                <div className="flex items-start gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-ink">{p.key}</h3>
                      <Badge tone="neutral">{MEMORY_LABELS_AR[p.category]}</Badge>
                      {!p.enabled && <Badge tone="warn">معطّل</Badge>}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-2xs leading-relaxed text-ink-mute">{p.value}</p>
                    <p className="mt-1.5 text-[10px] text-ink-faint">أُضيف {timeAgo(p.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <IconButton
                      label="نسخ الأمر"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(p.value).catch(() => {});
                        toast.success("نُسخ الأمر");
                      }}
                    >
                      <Copy className="size-3.5" aria-hidden />
                    </IconButton>
                    <IconButton
                      label={p.enabled ? "تعطيل الأمر" : "تفعيل الأمر"}
                      size="sm"
                      onClick={() => actions.updateMemory(p.id, { enabled: !p.enabled })}
                    >
                      <span className={p.enabled ? "text-ok" : "text-ink-faint"}>{p.enabled ? "●" : "○"}</span>
                    </IconButton>
                    <IconButton
                      label="حذف الأمر"
                      size="sm"
                      onClick={() => actions.removeMemory(p.id)}
                      className="text-ink-faint hover:text-danger"
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
