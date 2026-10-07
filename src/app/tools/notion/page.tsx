"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Plug } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { downloadBlob } from "@/app/settings/logs/page";

/** Notion export: Markdown today, live sync once a key is connected. */
export default function NotionToolPage() {
  const { state } = useApp();
  const toast = useToast();
  const router = useRouter();
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? "");

  const project = state.projects.find((p) => p.id === projectId);
  const sections = state.scriptSections
    .filter((s) => state.scripts.some((x) => x.id === s.scriptId && x.projectId === projectId))
    .sort((a, b) => a.order - b.order);

  const toMarkdown = () => {
    if (!project) return;
    const lines = [`# ${project.title}`, "", project.premise, ""];
    const srcs = state.sources.filter((s) => s.projectId === projectId);
    if (srcs.length) {
      lines.push("## المصادر", "");
      srcs.forEach((s, i) => lines.push(`${i + 1}. [${s.title}](${s.url}) — ${s.domain} · ${s.credibility}`));
      lines.push("");
    }
    if (sections.length) {
      lines.push("## السكربت", "");
      for (const s of sections) {
        lines.push(`### ${s.beatKey}`, "", s.narration, "");
        if (s.onScreenText) lines.push(`> **على الشاشة:** ${s.onScreenText}`, "");
        if (s.sourceIds.length) lines.push(`> المصادر: ${s.sourceIds.length}`, "");
      }
    }
    downloadBlob(new Blob([lines.join("\n")], { type: "text/markdown" }), `${project.title}.md`);
    toast.success("صُدّر كـ Markdown", "جاهز للّصق في Notion");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/tools" className="mb-3 inline-flex items-center gap-1.5 text-2xs text-ink-mute hover:text-ink">
        كل الأدوات
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">Notion</h1>
          <StatusDot tone="mute" />
          <span className="text-2xs text-ink-mute">غير متصل</span>
        </div>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          صدّر بحثك أو سكربتك كملف Markdown متوافق مع Notion، أو ادفعه مباشرة بعد الربط.
        </p>
      </header>

      <Panel className="mb-5 overflow-hidden">
        <PanelHeader title="تصدير" subtitle="Markdown متوافق مع Notion" icon={<FileText className="size-4" />} />
        <div className="space-y-4 p-4">
          {state.projects.length === 0 ? (
            <EmptyState
              compact
              title="لا مشاريع"
              description="أنشئ مشروعًا أولًا لتصدير محتواه."
              action={{ label: "مركز القيادة", onClick: () => router.push("/") }}
            />
          ) : (
            <>
              <label className="block">
                <span className="label">المشروع</span>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>

              {project && (
                <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
                  {[
                    ["مصادر", state.sources.filter((s) => s.projectId === projectId).length],
                    ["مقاطع سكربت", sections.length],
                    ["عناوين", state.titleIdeas.filter((t) => t.projectId === projectId).length],
                  ].map(([label, n]) => (
                    <li key={label as string} className="bg-panel px-3.5 py-2.5">
                      <p className="text-2xs text-ink-mute">{label}</p>
                      <p className="num mt-0.5 text-sm font-medium text-ink">{n}</p>
                    </li>
                  ))}
                </ul>
              )}

              <Button variant="primary" onClick={toMarkdown} disabled={!project} icon={<FileText className="size-4" />}>
                تصدير المشروع (Markdown)
              </Button>
            </>
          )}
        </div>
      </Panel>

      <Section title="المزامنة المباشرة">
        <Panel className="p-4">
          <div className="flex flex-wrap items-start gap-3">
            <Plug className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">غير متصل بـ Notion</p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-mute">
                بعد الربط ستتمكن من إنشاء صفحة لكل بحث أو سكربت داخل قاعدة بيانات Notion تختارها.
                التكامل اختياري — لا يوقف أي شيء.
              </p>
            </div>
            <Link href="/settings/keys">
              <Button size="sm" variant="secondary">
                إضافة مفتاح
              </Button>
            </Link>
          </div>
        </Panel>
      </Section>
    </div>
  );
}
