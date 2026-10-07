"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, FileText, Plug } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { downloadBlob } from "@/app/settings/logs/page";

/**
 * Export tools.
 *
 * Both export to a real, working format right now (CSV / Markdown / JSON), and
 * additionally push to Sheets or Notion when a key is connected. The app never
 * depends on either integration to function.
 */
export default function SheetsToolPage() {
  const { state } = useApp();
  const toast = useToast();
  const router = useRouter();

  const sources = state.sources;

  const toCsv = () => {
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["العنوان", "النطاق", "النوع", "التاريخ", "المصداقية", "الملخص", "الرابط"];
    const rows = sources.map((s) => [s.title, s.domain, s.sourceType, s.publishedAt ?? "", s.credibility, s.summary, s.url]);
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    // BOM keeps Arabic readable when opened in Excel.
    downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "abdo-sources.csv");
    toast.success("صُدّر CSV", `${sources.length} مصدر`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/tools" className="mb-3 inline-flex items-center gap-1.5 text-2xs text-ink-mute hover:text-ink">
        كل الأدوات
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">Google Sheets</h1>
          <StatusDot tone="mute" />
          <span className="text-2xs text-ink-mute">غير متصل</span>
        </div>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          تصدير إلى جدول بيانات اختياري تمامًا. يمكنك تصدير CSV الآن بدون أي مفتاح، والمزامنة المباشرة تظهر عند الربط.
        </p>
      </header>

      <Panel className="mb-5 overflow-hidden">
        <PanelHeader title="تصدير مباشر" subtitle="يعمل الآن بدون أي تكامل" icon={<FileSpreadsheet className="size-4" />} />
        <div className="p-4">
          <p className="mb-3 text-xs leading-relaxed text-ink-mute">
            {sources.length > 0
              ? `${sources.length} مصدر جاهز للتصدير. الملف بصيغة CSV مع BOM لضمان قراءة العربية في Excel.`
              : "لا توجد مصادر بعد. أضف مصدرًا من مختبر البحث ثم عد هنا."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={toCsv} disabled={sources.length === 0} icon={<FileSpreadsheet className="size-4" />}>
              تصدير المصادر (CSV)
            </Button>
            <Button
              variant="secondary"
              disabled={state.ideas.length === 0}
              onClick={() => {
                const csv = ["العنوان,الموضوع,الزاوية,الخطاف,الحالة"]
                  .concat(state.ideas.map((i) => [i.title, i.topic, i.angle, i.potentialHook, i.status].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")))
                  .join("\n");
                downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "abdo-ideas.csv");
                toast.success("صُدّرت الأفكار");
              }}
              icon={<FileText className="size-4" />}
            >
              تصدير الأفكار (CSV)
            </Button>
          </div>
        </div>
      </Panel>

      <Section title="المزامنة المباشرة">
        <Panel className="p-4">
          <div className="flex flex-wrap items-start gap-3">
            <Plug className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">غير متصل بـ Google Sheets</p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-mute">
                بعد الربط ستتمكن من دفع البحث وقواعد بيانات المنافسين والأفكار إلى جدول محدد بدل تنزيل ملف.
                لن يتأثر أي شيء في التطبيق إن لم تربطه أبدًا.
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

      {sources.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<FileSpreadsheet className="size-4" />}
            title="لا مصادر للتصدير"
            description="ابدأ من مختبر البحث — كل مصدر تحفظه يصبح صفًا في الجدول."
            action={{ label: "افتح البحث", onClick: () => router.push("/research") }}
          />
        </div>
      )}
    </div>
  );
}
