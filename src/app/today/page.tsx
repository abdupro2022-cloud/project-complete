"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, Clock, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Composer } from "@/components/ai/Composer";
import { Badge, Panel, Section, StatusDot } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { useApp } from "@/lib/store/provider";
import { timeAgo } from "@/lib/utils";

/**
 * My Day.
 *
 * Not a productivity dashboard. A short list of things that are actually
 * unfinished, ordered by what unblocks the rest.
 */
export default function TodayPage() {
  const { state } = useApp();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const active = state.projects.filter((p) => p.stage !== "published" && p.stage !== "archived");
  const stalled = state.tasks.filter((t) => t.status === "failed" || t.status === "running");
  const unfinishedIdeas = state.ideas.filter((i) => i.status === "idea" || i.status === "researching");

  const needsAttention = [
    ...active.map((p) => ({
      id: p.id,
      projectId: p.id,
      title: nextStep(p, state),
      sub: p.title,
      href: `/projects/${p.id}`,
    })),
    ...stalled.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      title: t.status === "failed" ? `مهمة متوقفة: ${t.title}` : `مهمة جارية: ${t.title}`,
      sub: t.error ?? t.step ?? "قيد التنفيذ",
      href: "/settings/logs",
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink md:text-2xl">
            <Clock className="size-5 text-ink-mute" aria-hidden />
            يومك
          </h1>
          <p className="mt-1.5 text-xs text-ink-mute">
            {needsAttention.length === 0
              ? "لا شيء معلّق. هذا نادر."
              : `${needsAttention.length} شيء غير مكتمل`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
          مشروع جديد
        </Button>
      </header>

      {needsAttention.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-4" />}
          title="لا شيء معلّق"
          description="كل مشروعك في مرحلة متقدمة أو منشور. ابدأ مشروعًا جديدًا أو التقط فكرة."
          action={{ label: "مشروع جديد", onClick: () => setCreating(true), icon: <Plus className="size-3.5" /> }}
        />
      ) : (
        <Section title="الخطوة التالية لكل مشروع">
          <ol className="space-y-2">
            {needsAttention.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className="group flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-line-strong hover:bg-panel-2"
                >
                  <StatusDot tone={stalled.some((t) => t.id === n.id) ? "warn" : "live"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{n.title}</p>
                    <p className="truncate text-2xs text-ink-mute">{n.sub}</p>
                  </div>
                  <ArrowLeft className="size-3.5 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* --- stalled detail ------------------------------------------------- */}
      {stalled.length > 0 && (
        <Section title="يحتاج انتباهك" className="mt-6">
          <ul className="space-y-2">
            {stalled.map((t) => (
              <li key={t.id}>
                <Panel className="flex items-start gap-3 border-attention/25 bg-attention-tint/20 p-3.5">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-attention" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{t.title}</p>
                    {t.error ? (
                      <p className="mt-0.5 text-2xs leading-relaxed text-danger">{t.error}</p>
                    ) : (
                      <p className="mt-0.5 text-2xs text-ink-mute">{t.step}</p>
                    )}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- open ideas ------------------------------------------------------ */}
      {unfinishedIdeas.length > 0 && (
        <Section title="أفكار لم تبدأ" className="mt-6" aside={<Link href="/ideas" className="text-2xs text-ink-mute hover:text-ink">الكل</Link>}>
          <ul className="space-y-2">
            {unfinishedIdeas.slice(0, 4).map((i) => (
              <li key={i.id}>
                <Link
                  href="/ideas"
                  className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3.5 py-2.5 transition-colors hover:border-line-strong hover:bg-panel-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-ink-soft">{i.title}</p>
                    <p className="text-[10px] text-ink-faint">{timeAgo(i.updatedAt)}</p>
                  </div>
                  <Badge tone="neutral">{i.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- quick capture --------------------------------------------------- */}
      <Section title="اكتب ما يدور في ذهنك" className="mt-8">
        <Panel className="sheen p-4">
          <Composer compact placeholder="فكرة سريعة، أو سؤال، أو مهمة…" />
        </Panel>
      </Section>

      <NewProjectDialog open={creating} onClose={() => setCreating(false)} onCreated={(id) => router.push(`/projects/${id}`)} />
    </div>
  );
}

/** Derive the single next action for a project from what is actually missing. */
function nextStep(
  p: ReturnType<typeof useApp>["state"]["projects"][number],
  state: ReturnType<typeof useApp>["state"],
): string {
  const sources = state.sources.filter((s) => s.projectId === p.id);
  const unresolved = state.claims.filter(
    (c) => c.projectId === p.id && (c.status === "needs_verification" || c.status === "unclear"),
  );
  const script = state.scripts.find((s) => s.projectId === p.id);
  const sections = script
    ? state.scriptSections.filter((s) => s.scriptId === script.id)
    : [];

  if (sources.length === 0) return "ابدأ البحث — لا مصادر بعد";
  if (unresolved.length > 0 || state.contradictions.some((c) => c.projectId === p.id))
    return "تحقق من الأرقام قبل الكتابة";
  if (!script) return "البحث جاهز — اكتب السكربت";
  if (sections.length < 4) return "أكمل بنية السكربت";
  if (state.shorts.filter((s) => s.projectId === p.id).length === 0) return "استخرج شورتس من السكربت";
  return "ولّد العناوين";
}
