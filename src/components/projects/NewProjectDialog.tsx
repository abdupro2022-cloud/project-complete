"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";

const CONTENT_TYPES = [
  "فيديو تحليلي",
  "فيديو وثائقي",
  "فيديو قصير",
  "شورتس",
  "بودكاست",
  "مقال",
];

/**
 * New project.
 *
 * A project is a workspace with its own sources, script and memory. The premise
 * is the most important field, so it gets the largest input and an explanation
 * of what the system will do with it.
 */
export function NewProjectDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { actions } = useApp();
  const toast = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [audience, setAudience] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [duration, setDuration] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (title.trim().length < 2) {
      setError("العنوان قصير جدًا. اكتب اسمًا يميّز المشروع.");
      return;
    }
    setBusy(true);
    // Synchronous store write; the yield keeps the button's pressed state visible.
    requestAnimationFrame(() => {
      const p = actions.createProject({
        title: title.trim(),
        premise: premise.trim(),
        audience: audience.trim(),
        contentType,
        targetDurationSec: duration * 60,
      });
      setBusy(false);
      setTitle("");
      setPremise("");
      setAudience("");
      setError(null);
      onClose();
      toast.success("أُنشئ المشروع", p.title);
      if (onCreated) onCreated(p.id);
      else router.push(`/projects/${p.id}`);
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مشروع جديد"
      description="كل مشروع مساحة عمل مستقلة: مصادره وسكربته وذاكرته لا تختلط بغيره."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={submit} loading={busy}>
            إنشاء المشروع
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="عنوان المشروع" required error={error}>
          {(id, desc) => (
            <Input
              id={id}
              aria-describedby={desc}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="مثال: لماذا انهارت شركة Vexa"
              autoFocus
            />
          )}
        </Field>

        <Field
          label="الفرضية"
          hint="اكتبها بكلماتك أنت. هذا ما سيستخدمه النظام في كل بحث لاحق — كلما كان أدق، كانت النتائج أدق."
        >
          {(id, desc) => (
            <Textarea
              id={id}
              aria-describedby={desc}
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              rows={4}
              placeholder="ما الذي تريد أن يشرحه هذا الفيديو، ولمن؟ وما الذي لا تريد أن يقوله؟"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الجمهور">
            {(id) => (
              <Input
                id={id}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="رياديو، مستثمرون، مبتدئون…"
              />
            )}
          </Field>
          <Field label="نوع المحتوى">
            {(id) => (
              <Select id={id} value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="المدة المستهدفة" hint="تُستخدم لتقدير طول كل مشهد في السكربت.">
          {(id, desc) => (
            <div className="flex items-center gap-3">
              <input
                id={id}
                aria-describedby={desc}
                type="range"
                min={3}
                max={45}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="h-1 flex-1 accent-[var(--color-accent)]"
              />
              <span className="num w-20 shrink-0 text-end text-sm text-ink-soft">
                {duration} دقيقة
              </span>
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}
