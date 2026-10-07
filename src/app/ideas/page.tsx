"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lightbulb, Plus, Search, Trash2 } from "lucide-react";

import { Button, IconButton, Segmented } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Badge, Panel } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { IDEA_STATUSES, IDEA_STATUS_LABELS_AR, type IdeaStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Ideas.
 *
 * Capture first, organise second. The quick-add bar is deliberately the first
 * thing on the page: an idea that takes more than five seconds to record is an
 * idea that gets lost.
 */
export default function IdeasPage() {
  const { state, actions } = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = state.ideas.filter((i) =>
    !q ? true : `${i.title} ${i.topic} ${i.angle} ${i.notes}`.toLowerCase().includes(q.toLowerCase()),
  );

  const capture = () => {
    const t = title.trim();
    if (t.length < 2) return;
    const idea = actions.createIdea({ title: t, potentialHook: hook.trim() });
    setTitle("");
    setHook("");
    setOpenId(idea.id);
  };

  const byStatus = IDEA_STATUSES.map((status) => ({
    status,
    items: filtered.filter((i) => i.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الأفكار</h1>
        <p className="mt-1.5 text-xs text-ink-mute">
          {state.ideas.length} فكرة · الفكرة التي لا تُسجَّل خلال خمس ثوانٍ تضيع
        </p>
      </header>

      {/* --- capture -------------------------------------------------------- */}
      <Panel className="sheen mb-6">
        <div className="flex flex-col gap-2.5 p-4 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                capture();
              }
            }}
            placeholder="عنوان الفكرة في جملة…"
            aria-label="فكرة جديدة"
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent sm:flex-1"
          />
          <input
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                capture();
              }
            }}
            placeholder="خطّاف محتمل (اختياري)"
            aria-label="خطّاف محتمل"
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent sm:w-64"
          />
          <Button variant="primary" onClick={capture} disabled={title.trim().length < 2} icon={<Plus className="size-4" />}>
            التقاط
          </Button>
        </div>
      </Panel>

      {state.ideas.length > 0 && (
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في الأفكار"
            aria-label="ابحث في الأفكار"
            className="h-9 w-full rounded-lg border border-line bg-panel ps-9 pe-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>
      )}

      {/* --- board ----------------------------------------------------------- */}
      {state.ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="size-4" />}
          title="لا أفكار بعد"
          description="اكتب أول فكرة في الحقل أعلاه. لا تحتاج أن تكون كاملة — العنوان وحده يكفي للبدء."
        />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="لا نتائج" description="لا فكرة تطابق البحث." />
      ) : (
        <div className="space-y-6">
          {byStatus.map(({ status, items }) => (
            <section key={status}>
              <div className="mb-2.5 flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-wide text-ink-soft">
                  {IDEA_STATUS_LABELS_AR[status]}
                </h2>
                <span className="num text-2xs text-ink-faint">{items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.map((idea) => {
                  const open = openId === idea.id;
                  return (
                    <li key={idea.id}>
                      <Panel className="overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : idea.id)}
                          aria-expanded={open}
                          className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors hover:bg-panel-2"
                        >
                          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-attention/70" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-ink">{idea.title}</p>
                            {idea.potentialHook && (
                              <p className="mt-0.5 truncate text-2xs text-ink-mute">«{idea.potentialHook}»</p>
                            )}
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-faint">
                              {idea.topic && <span>{idea.topic}</span>}
                              <span>· {timeAgo(idea.updatedAt)}</span>
                            </p>
                          </div>
                          {idea.projectId && <Badge tone="accent">مرتبط بمشروع</Badge>}
                        </button>

                        {open && (
                          <div className="space-y-3.5 border-t border-line bg-surface px-3.5 py-3.5">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="الموضوع">
                                {(id) => (
                                  <Input
                                    id={id}
                                    defaultValue={idea.topic}
                                    onBlur={(e) => actions.updateIdea(idea.id, { topic: e.target.value })}
                                  />
                                )}
                              </Field>
                              <Field label="الزاوية">
                                {(id) => (
                                  <Input
                                    id={id}
                                    defaultValue={idea.angle}
                                    onBlur={(e) => actions.updateIdea(idea.id, { angle: e.target.value })}
                                  />
                                )}
                              </Field>
                              <Field label="الخطّاف المحتمل" className="sm:col-span-2">
                                {(id) => (
                                  <Input
                                    id={id}
                                    defaultValue={idea.potentialHook}
                                    onBlur={(e) => actions.updateIdea(idea.id, { potentialHook: e.target.value })}
                                  />
                                )}
                              </Field>
                              <Field label="الحالة">
                                {() => (
                                  <Segmented
                                    aria-label="حالة الفكرة"
                                    value={idea.status}
                                    onChange={(v) => actions.updateIdea(idea.id, { status: v as IdeaStatus })}
                                    options={IDEA_STATUSES.map((s) => ({ value: s, label: IDEA_STATUS_LABELS_AR[s] }))}
                                  />
                                )}
                              </Field>
                              <Field label="المشروع">
                                {(id) => (
                                  <select
                                    id={id}
                                    value={idea.projectId ?? ""}
                                    onChange={(e) => actions.updateIdea(idea.id, { projectId: e.target.value || null })}
                                    className="h-10 w-full rounded-lg border border-line bg-panel px-3 text-xs text-ink outline-none focus:border-accent"
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
                              <Field label="ملاحظات" className="sm:col-span-2">
                                {(id) => (
                                  <Textarea
                                    id={id}
                                    autoGrow
                                    defaultValue={idea.notes}
                                    onBlur={(e) => actions.updateIdea(idea.id, { notes: e.target.value })}
                                    rows={2}
                                  />
                                )}
                              </Field>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                              {idea.projectId && (
                                <Link href={`/projects/${idea.projectId}/research`}>
                                  <Button size="sm" variant="primary" iconEnd={<ArrowUpRight className="size-3.5" />}>
                                    ابدأ البحث
                                  </Button>
                                </Link>
                              )}
                              <IconButton
                                label="حذف الفكرة"
                                size="sm"
                                onClick={() => {
                                  actions.removeIdea(idea.id);
                                  toast.info("حُذفت الفكرة");
                                }}
                                className="text-ink-faint hover:text-danger"
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </IconButton>
                            </div>
                          </div>
                        )}
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
