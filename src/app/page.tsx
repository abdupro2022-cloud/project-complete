"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  CircleAlert,
  FlaskConical,
  Lightbulb,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";

import { Composer } from "@/components/ai/Composer";
import { Panel, PanelHeader, ProgressBar, Section, StatusDot, StageBadge, Badge } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { SectionBackdrop } from "@/components/ui/Motifs";
import { useApp, useLiveProject } from "@/lib/store/provider";
import { formatDuration, timeAgo, truncate } from "@/lib/utils";

/**
 * Command Center.
 *
 * Deliberately not a dashboard. The order of attention is:
 *   1. What do I want to do right now?  (the composer — 80% of the screen)
 *   2. What should I do next?           (one recommendation, not ten metrics)
 *   3. Where was I?                     (a short resume rail)
 */
export default function CommandCenterPage() {
  const { state } = useApp();
  const project = useLiveProject();

  const failures = state.activity.filter((a) => a.outcome === "failure");
  const running = state.tasks.filter((t) => t.status === "running" || t.status === "queued");

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <SectionBackdrop variant="default" />

      {/* --- hero illustration --------------------------------------------- */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-line bg-panel-2">
        <picture>
          <source srcSet="/illustrations/hero-home.webp" type="image/webp" />
          <img
            src="/illustrations/hero-home.webp"
            alt=""
            width={1280}
            height={720}
            className="h-auto w-full object-cover opacity-95"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-4 start-4 me-4 max-w-md">
          <p className="text-2xs uppercase tracking-[0.18em] text-accent-soft">مركز القيادة</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">كل ما تحتاجه في مكان واحد</h1>
        </div>
      </div>

      {/* --- greeting ------------------------------------------------------- */}
      <header className="mb-8 md:mb-12">
        <p className="text-xs text-ink-faint">
          {greeting()}، {state.settings.displayName}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          ماذا تريد أن تُنجز اليوم؟
        </h1>
      </header>

      {/* --- composer -------------------------------------------------------- */}
      <Composer autoFocus />

      {/* --- next action ------------------------------------------------------ */}
      <section className="mt-10" aria-label="الخطوة التالية">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-soft">الخطوة التالية</h2>
        <NextAction />
      </section>

      {/* --- resume rail ------------------------------------------------------ */}
      {state.projects.length > 0 && (
        <section className="mt-8" aria-label="متابعة العمل">
          <Section
            title="متابعة"
            aside={
              <Link href="/projects" className="text-2xs text-ink-mute hover:text-ink">
                كل المشاريع
              </Link>
            }
          >
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {state.projects.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex h-full flex-col gap-2 rounded-lg border border-line bg-panel p-3.5 transition-colors duration-200 hover:border-line-strong hover:bg-panel-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-accent-soft">
                        {p.title}
                      </h3>
                      <StageBadge stage={p.stage} />
                    </div>
                    <ProgressBar value={p.progress} className="mt-auto" label={`تقدم ${p.title}`} />
                    <div className="flex items-center justify-between text-[10px] text-ink-faint">
                      <span className="num">{formatDuration(p.targetDurationSec)}</span>
                      <span>{timeAgo(p.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </section>
      )}

      {/* --- two-column: ideas + activity ------------------------------------- */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section aria-label="أفكار سريعة">
          <Section
            title="أفكار قيد التطوير"
            aside={
              <Link href="/ideas" className="text-2xs text-ink-mute hover:text-ink">
                كل الأفكار
              </Link>
            }
          >
            {state.ideas.length === 0 ? (
              <EmptyState
                compact
                icon={<Lightbulb className="size-4" />}
                title="لا أفكار محفوظة"
                description="التقط فكرة قبل أن تضيع — تستغرق منك جملة واحدة."
                action={{ label: "أضف فكرة", onClick: () => {}, icon: <Lightbulb className="size-3.5" /> }}
              />
            ) : (
              <ul className="space-y-2">
                {state.ideas.slice(0, 4).map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href="/ideas"
                      className="group flex items-start gap-3 rounded-lg border border-line bg-panel p-3 transition-colors duration-200 hover:border-line-strong hover:bg-panel-2"
                    >
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-attention/70" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{idea.title}</p>
                        {idea.potentialHook && (
                          <p className="mt-0.5 truncate text-2xs text-ink-mute">«{idea.potentialHook}»</p>
                        )}
                      </div>
                      <ArrowUpLeft className="size-3.5 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </section>

        <section aria-label="آخر النشاط">
          <Section title="آخر النشاط">
            <Panel className="overflow-hidden">
              {state.activity.length === 0 ? (
                <div className="p-4">
                  <EmptyState compact title="لا نشاط بعد" description="كل ما تنفّذه سيُسجَّل هنا." />
                </div>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {state.activity.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
                      <StatusDot tone={a.outcome === "failure" ? "danger" : "ok"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-2xs text-ink-soft">{a.what}</p>
                        <p className="text-[10px] text-ink-faint">
                          {a.projectTitle ? `${truncate(a.projectTitle, 24)} · ` : ""}
                          {timeAgo(a.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Section>
        </section>
      </div>

      {/* --- attention strip -------------------------------------------------- */}
      {(failures.length > 0 || running.length > 0) && (
        <section className="mt-8" aria-label="يحتاج انتباهك">
          <Section title="يحتاج انتباهك">
            <div className="space-y-2">
              {running.map((t) => (
                <Panel key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <StatusDot tone="live" pulse />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{t.title}</p>
                    <p className="text-2xs text-ink-mute">{t.step ?? "قيد التنفيذ"}</p>
                  </div>
                  <span className="num text-xs text-live">{t.progress}%</span>
                </Panel>
              ))}
              {failures.slice(0, 3).map((a) => (
                <Link key={a.id} href="/settings/logs" className="block">
                  <Panel className="flex items-start gap-3 border-attention/25 bg-attention-tint/30 px-4 py-3">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-attention" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{a.what}</p>
                      {a.detail && <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">{a.detail}</p>}
                    </div>
                    <ArrowLeft className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                  </Panel>
                </Link>
              ))}
            </div>
          </Section>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Next action — one recommendation, derived from actual project state
// ---------------------------------------------------------------------------

function NextAction() {
  const { state } = useApp();

  if (state.projects.length === 0) {
    return (
      <Panel className="sheen p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent">
            <FlaskConical className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink">ابدأ أول مشروع بحثي</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-mute">
              اكتب فرضيتك في المربع أعلاه وسيحوّلها النظام إلى بحث كامل: مصادر، أدلة، تناقضات، وخط زمني.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  const p = useLiveProject();
  if (!p) return null;

  const rec = recommendFor(p.id, state);

  return (
    <Panel className="sheen overflow-hidden">
      <PanelHeader
        title="مقترح من حالة مشروعك"
        subtitle={p.title}
        actions={<StageBadge stage={p.stage} />}
      />
      <div className="flex flex-wrap items-center gap-4 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent">
          {rec.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{rec.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-mute">{rec.why}</p>
        </div>
        <Link href={rec.href}>
          <Button variant="primary" size="sm" iconEnd={<ArrowLeft className="size-3.5" />}>
            {rec.action}
          </Button>
        </Link>
      </div>
    </Panel>
  );
}

function recommendFor(projectId: string, state: ReturnType<typeof useApp>["state"]) {
  const p = state.projects.find((x) => x.id === projectId)!;
  const sources = state.sources.filter((s) => s.projectId === projectId);
  const claims = state.claims.filter((c) => c.projectId === projectId);
  const contradictions = state.contradictions.filter((c) => c.projectId === projectId);
  const scripts = state.scripts.filter((s) => s.projectId === projectId);
  const sections = state.scriptSections.filter((s) => scripts.some((x) => x.id === s.scriptId));
  const unresolved = claims.filter((c) => c.status === "needs_verification" || c.status === "unclear");

  if (sources.length === 0) {
    return {
      title: "ابدأ البحث — لا مصادر بعد",
      why: "كل خطوة لاحقة تعتمد على ما تجده هنا. بدون مصادر، لا رقم يمكن الاعتماد عليه.",
      action: "ابدأ البحث",
      href: `/projects/${projectId}/research`,
      icon: <FlaskConical className="size-4" />,
    };
  }
  if (unresolved.length > 0 || contradictions.length > 0) {
    return {
      title: `${unresolved.length + contradictions.length} رقم يحتاج توضيحًا قبل الكتابة`,
      why: "نشر رقم غير مؤكد أسرع طريق إلى فيديو خاطئ. تحقق أولًا ثم اكتب.",
      action: "تحقق الآن",
      href: `/projects/${projectId}/fact-check`,
      icon: <Target className="size-4" />,
    };
  }
  if (scripts.length === 0) {
    return {
      title: "البحث جاهز — اكتب السكربت",
      why: `لديك ${sources.length} مصدر. اكتب بثقة: كل رقم ستستخدمه موثّق.`,
      action: "اكتب السكربت",
      href: `/projects/${projectId}/script`,
      icon: <PenLine className="size-4" />,
    };
  }
  if (sections.length < 4) {
    return {
      title: "أكمل بنية السكربت",
      why: `لديك ${sections.length} مشهد فقط. الفيديو يحتاج بنية كاملة قبل التسجيل.`,
      action: "أكمل السكربت",
      href: `/projects/${projectId}/script`,
      icon: <PenLine className="size-4" />,
    };
  }
  return {
    title: "السكربت جاهز — ولّد العناوين والشورتس",
    why: "من السكربت الواحد يمكنك استخراج كل المخرجات بخطوة واحدة.",
    action: "استخرج المخرجات",
    href: `/projects/${projectId}/titles`,
    icon: <Sparkles className="size-4" />,
  };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "سهر مريح";
  if (h < 12) return "صباح الخير";
  if (h < 17) return "نهارك سعيد";
  return "مساء الخير";
}
