"use client";

import { useState } from "react";
import { Brain, Plus, Trash2, TriangleAlert } from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Badge, Panel, PanelHeader, Section } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { MEMORY_CATEGORIES, MEMORY_LABELS_AR, type MemoryCategory, type MemoryEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

/**
 * AI memory.
 *
 * The user owns it completely: view, edit, disable, delete. A memory system you
 * cannot inspect is a liability, especially for a tool whose whole promise is
 * trustworthy sourcing.
 */
export default function MemoryPage() {
  const { state, actions } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [adding, setAdding] = useState<MemoryCategory | null>(null);

  const entries = state.memories;
  const enabledCount = entries.filter((m) => m.enabled).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الذاكرة</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          ما يحفظه النظام عن أسلوبك وجمهورك وتفضيلاتك. هذه المدخلات تُحقن في كل طلب. المعطّل منها يُحفظ ولا
          يُستخدم.
        </p>
      </header>

      <Panel className="sheen mb-6">
        <PanelHeader
          title="التحكم العام"
          subtitle={`${enabledCount} من ${entries.length} مُفعّل`}
          icon={<Brain className="size-4" />}
        />
        <div className="space-y-3 p-4">
          <Checkbox
            label="تفعيل الذاكرة"
            description="عند الإيقاف يبقى كل شيء محفوظًا لكن لا يُحقن أي تفضيل في الطلبات."
            checked={state.settings.memoryEnabled}
            onChange={(v) => actions.updateSettings({ memoryEnabled: v })}
          />
          <p className="text-2xs leading-relaxed text-ink-faint">
            الذاكرة لا تخزّن أسرارًا ولا بيانات دخول ولا محتوى مشاريعك. هي ملاحظات تفضيل فقط، وتبقى على
            جهازك.
          </p>
          {entries.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<TriangleAlert className="size-3.5" />}
              onClick={() => setConfirmClear(true)}
            >
              مسح الذاكرة بالكامل
            </Button>
          )}
        </div>
      </Panel>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Brain className="size-4" />}
          title="الذاكرة فارغة"
          description="أضف ما تريد أن يتذكره النظام عنك: أسلوب كتابتك، جمهورك، أو أي قاعدة لا تريد تكرارها."
          action={{ label: "أضف تفضيلًا", onClick: () => setAdding("writing_style"), icon: <Plus className="size-3.5" /> }}
        />
      ) : (
        <div className="space-y-6">
          {MEMORY_CATEGORIES.map((cat) => {
            const list = entries.filter((m) => m.category === cat);
            if (!list.length) return null;
            return (
              <Section key={cat} title={MEMORY_LABELS_AR[cat]} aside={<Badge tone="neutral">{list.length}</Badge>}>
                <ul className="space-y-2">
                  {list.map((m) => (
                    <li key={m.id}>
                      <Panel className={m.enabled ? "" : "opacity-60"}>
                        <div className="flex items-start gap-3 p-3.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium text-ink">{m.key}</h3>
                              {m.source === "inferred" && <Badge tone="accent">مستنتَج</Badge>}
                              {!m.enabled && <Badge tone="warn">معطّل</Badge>}
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap text-2xs leading-relaxed text-ink-mute">{m.value}</p>
                            <p className="mt-1.5 text-[10px] text-ink-faint">آخر تعديل {timeAgo(m.updatedAt)}</p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <IconButton
                              label={m.enabled ? `تعطيل ${m.key}` : `تفعيل ${m.key}`}
                              size="sm"
                              onClick={() => actions.updateMemory(m.id, { enabled: !m.enabled })}
                            >
                              <span className={m.enabled ? "text-ok" : "text-ink-faint"}>{m.enabled ? "●" : "○"}</span>
                            </IconButton>
                            <IconButton label={`تعديل ${m.key}`} size="sm" onClick={() => setEditing(m)}>
                              <span className="text-2xs">✎</span>
                            </IconButton>
                            <IconButton
                              label={`حذف ${m.key}`}
                              size="sm"
                              onClick={() => actions.removeMemory(m.id)}
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
              </Section>
            );
          })}
        </div>
      )}

      <EditDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSave={(changes) => {
          if (editing) actions.updateMemory(editing.id, changes);
          setEditing(null);
          toast.success("حُفظ");
        }}
      />

      <AddDialog
        category={adding}
        onClose={() => setAdding(null)}
        onSave={(cat, key, value) => {
          actions.addMemory({ category: cat, key, value, enabled: true, source: "user" });
          setAdding(null);
          toast.success("أُضيف التفضيل");
        }}
      />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="مسح الذاكرة"
        description="سيُحذف كل ما حفظه النظام عنك."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                for (const m of entries) actions.removeMemory(m.id);
                setConfirmClear(false);
                toast.success("مُسحت الذاكرة");
              }}
            >
              امسح كل شيء
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          سيُحذف {entries.length} تفضيل. مشاريعك ومصادرك لن تتأثر.
        </p>
      </Modal>
    </div>
  );
}

function EditDialog({
  entry,
  onClose,
  onSave,
}: {
  entry: MemoryEntry | null;
  onClose: () => void;
  onSave: (changes: Partial<MemoryEntry>) => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  if (!entry) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="تعديل التفضيل"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave({ key: key || entry.key, value })}
          >
            حفظ
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="الاسم">
          {(id) => <Input id={id} value={key} onChange={(e) => setKey(e.target.value)} defaultValue={entry.key} />}
        </Field>
        <Field label="القيمة">
          {(id) => <Textarea id={id} value={value} onChange={(e) => setValue(e.target.value)} defaultValue={entry.value} rows={4} />}
        </Field>
      </div>
    </Modal>
  );
}

function AddDialog({
  category,
  onClose,
  onSave,
}: {
  category: MemoryCategory | null;
  onClose: () => void;
  onSave: (cat: MemoryCategory, key: string, value: string) => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  if (!category) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="أضف تفضيلًا"
      description="اكتبه كما تريد أن يطبّقه النظام."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" disabled={key.trim().length < 2} onClick={() => onSave(category, key.trim(), value.trim())}>
            إضافة
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="الاسم">
          {(id) => <Input id={id} value={key} onChange={(e) => setKey(e.target.value)} placeholder="نبرة السرد" />}
        </Field>
        <Field label="القيمة" hint="صيغة الأمر المباشر تعمل أفضل.">
          {(id) => (
            <Textarea
              id={id}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              placeholder="سردي هادئ. أعطي الرقم ثم اسأل السؤال بدل أن تجيب عنه."
            />
          )}
        </Field>
        <p className="text-2xs text-ink-faint">التصنيف: {MEMORY_LABELS_AR[category]}</p>
      </div>
    </Modal>
  );
}
