"use client";

import { useMemo, useState } from "react";
import { Database, Download, FileJson, FileText, RotateCcw, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Badge, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { formatFullNumber } from "@/lib/utils";
import { downloadBlob } from "../logs/page";

/** Data management: see what exists, export it, reset it. */
export default function DataPage() {
  const { state, actions, isDemo } = useApp();
  const toast = useToast();
  const [confirm, setConfirm] = useState<"wipe" | "demo" | null>(null);

  const groups = useMemo(
    () =>
      [
        { key: "projects", label: "المشاريع" },
        { key: "projectNotes", label: "ملاحظات المشاريع" },
        { key: "ideas", label: "الأفكار" },
        { key: "researchBriefs", label: "موجزات البحث" },
        { key: "sources", label: "المصادر" },
        { key: "claims", label: "الادعاءات" },
        { key: "contradictions", label: "التناقضات" },
        { key: "events", label: "أحداث الخط الزمني" },
        { key: "entities", label: "الكيانات" },
        { key: "entityEdges", label: "روابط الكيانات" },
        { key: "videos", label: "الفيديوهات" },
        { key: "competitors", label: "المنافسون" },
        { key: "contentGaps", label: "فجوات المحتوى" },
        { key: "transcripts", label: "التفريغات" },
        { key: "scripts", label: "السكربتات" },
        { key: "scriptSections", label: "مقاطع السكربت" },
        { key: "shorts", label: "الشورتس" },
        { key: "titleIdeas", label: "العناوين" },
        { key: "thumbnailConcepts", label: "الثامبنيلات" },
        { key: "messages", label: "الرسائل" },
        { key: "memories", label: "الذاكرة" },
        { key: "activity", label: "السجلات" },
      ] as const,
    [],
  );

  const total = groups.reduce((n, g) => n + (state[g.key] as unknown[]).length, 0);

  const exportJson = () => {
    const payload: Record<string, unknown> = Object.fromEntries(
      groups.map((g) => [g.key, state[g.key] as unknown[]]),
    );
    payload.exportedAt = new Date().toISOString();
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "abdo-creator-os-export.json");
    toast.success("صُدّرت البيانات", `${total} سجل`);
  };

  const exportMarkdown = () => {
    const lines: string[] = [`# ABDO CREATOR OS — تصدير`, `> ${new Date().toLocaleString("ar")}`, ""];
    for (const p of state.projects) {
      lines.push(`## ${p.title}`, "", p.premise || "_لا فرضية_", "", `**المرحلة:** ${p.stage} · **التقدم:** ${p.progress}%`, "");
      const srcs = state.sources.filter((s) => s.projectId === p.id);
      if (srcs.length) {
        lines.push("### المصادر", "");
        for (const [i, s] of srcs.entries()) {
          lines.push(`${i + 1}. **${s.title}** — ${s.domain} · ${s.credibility}`, `   ${s.url}`, "");
        }
      }
      const secs = state.scriptSections
        .filter((sec) => state.scripts.some((x) => x.id === sec.scriptId && x.projectId === p.id))
        .sort((a, b) => a.order - b.order);
      if (secs.length) {
        lines.push("### السكربت", "");
        for (const sec of secs) {
          lines.push(`#### ${sec.beatKey}`, "", sec.narration, "");
          if (sec.visual) lines.push(`> مشهد: ${sec.visual}`, "");
          if (sec.onScreenText) lines.push(`> نص على الشاشة: ${sec.onScreenText}`, "");
        }
      }
      lines.push("---", "");
    }
    downloadBlob(new Blob([lines.join("\n")], { type: "text/markdown" }), "abdo-creator-os.md");
    toast.success("صُدّر كـ Markdown");
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">البيانات</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          كل بياناتك محفوظة على جهازك فقط. لا يُرسل شيء إلى أي خادم — بما في ذلك المفاتيح، فهي منفصلة تمامًا.
        </p>
      </header>

      <Panel className="sheen mb-6 overflow-hidden">
        <PanelHeader
          title="المحتوى"
          subtitle={`${formatFullNumber(total)} سجل عبر ${groups.length} مجموعة`}
          icon={<Database className="size-4" />}
          actions={isDemo ? <Badge tone="warn">بيانات تجريبية</Badge> : <Badge tone="ok">بياناتك</Badge>}
        />
        <ul className="grid gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => {
            const n = (state[g.key] as unknown[]).length;
            return (
              <li key={g.key} className="flex items-center justify-between gap-2 bg-panel px-3.5 py-2.5">
                <span className="truncate text-2xs text-ink-mute">{g.label}</span>
                <span className={`num text-xs font-medium ${n > 0 ? "text-ink" : "text-ink-faint"}`}>{n}</span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Section title="تصدير">
        <Panel className="p-4">
          <p className="mb-3 text-xs leading-relaxed text-ink-mute">
            خذ نسخة قبل أي عملية حذف. التصدير يشمل كل المحتوى ولا يشمل المفاتيح — لا يمكن تصديرها لأنها غير مخزّنة في المتصفح أصلًا.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportJson} icon={<FileJson className="size-3.5" />} disabled={total === 0}>
              تصدير كامل (JSON)
            </Button>
            <Button variant="secondary" onClick={exportMarkdown} icon={<FileText className="size-3.5" />} disabled={state.projects.length === 0}>
              تصدير المشاريع (Markdown)
            </Button>
          </div>
        </Panel>
      </Section>

      <Section title="إعادة تعيين" className="mt-6">
        <div className="space-y-2.5">
          <Panel className="flex flex-wrap items-center gap-3 p-4">
            <RotateCcw className="size-4 shrink-0 text-ink-mute" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">استعادة البيانات التجريبية</p>
              <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">
                يستبدل كل ما أنشأته بمشروع تجريبي كامل. مفيد لتجربة المنتج من جديد.
              </p>
            </div>
            <Button variant="subtle" onClick={() => setConfirm("demo")}>
              استعادة
            </Button>
          </Panel>

          <Panel className="flex flex-wrap items-center gap-3 border-danger/25 p-4">
            <Trash2 className="size-4 shrink-0 text-danger" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">حذف كل البيانات</p>
              <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">
                يفرّغ كل شيء ويبدأ من مشروع فارغ. صدّر نسخة أولًا إن كنت تريد الاحتفاظ بها.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirm("wipe")} icon={<TriangleAlert className="size-3.5" />}>
              حذف كل شيء
            </Button>
          </Panel>
        </div>
      </Section>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === "wipe" ? "حذف كل البيانات" : "استعادة البيانات التجريبية"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              إلغاء
            </Button>
            <Button
              variant={confirm === "wipe" ? "danger" : "primary"}
              onClick={async () => {
                if (confirm === "wipe") {
                  await actions.wipeAll();
                  toast.success("حُذفت كل البيانات");
                } else {
                  await actions.resetToDemo();
                  toast.success("استُعيدت البيانات التجريبية");
                }
                setConfirm(null);
              }}
            >
              {confirm === "wipe" ? "حذف نهائي" : "استعادة"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {confirm === "wipe"
            ? "سيُحذف كل شيء نهائيًا من هذا الجهاز. لا يمكن التراجع."
            : "سيُستبدل محتواك الحالي ببيانات تجريبية. لا يمكن التراجع."}
        </p>
        {confirm === "wipe" && total > 0 && (
          <p className="mt-2 text-2xs text-ink-mute">
            يُشمل {formatFullNumber(total)} سجل عبر {state.projects.length} مشروع.
          </p>
        )}
      </Modal>

      {total === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<Download className="size-4" />}
            title="لا توجد بيانات بعد"
            description="أنشئ مشروعك الأول من مركز القيادة."
          />
        </div>
      )}
    </div>
  );
}
