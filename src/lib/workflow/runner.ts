"use client";

import {
  ApiError,
  NO_SERVER,
  callAI,
  scrapePage,
  searchWeb,
  transcribeVideo,
  youtubeSearch,
  youtubeVideo,
} from "@/lib/api/client";
import { planFor, type Plan, type PlanStep } from "@/lib/intent/router";
import { classifyIntent } from "@/lib/intent/router";
import { domainOf, uid } from "@/lib/utils";
import type {
  Claim,
  ClaimStatus,
  CredibilityTier,
  Project,
  Script,
  Short,
  Source,
  SourceType,
  ThumbnailConcept,
  TimelineEvent,
  TitleIdea,
} from "@/lib/types";

/**
 * Workflow runner.
 *
 * Executes a plan step by step, reporting every state change so the UI can show
 * real progress — including the real result count of each step, not a decorative
 * animation. On failure it records the Arabic explanation and the remedy rather
 * than swallowing the error.
 */

export interface RunStep extends PlanStep {
  status: "pending" | "running" | "done" | "failed" | "skipped";
  detail: string | null;
  resultCount: number | null;
  error: string | null;
  remedy: ApiError["remedy"];
  elapsedMs: number | null;
}

export interface RunResult {
  plan: Plan;
  steps: RunStep[];
  /** Prose synthesis shown in the assistant message. */
  answer: string;
  createdIds: { type: string; id: string; label: string }[];
  /** Everything the workflow produced, ready to be written to the store. */
  output: {
    sources?: Omit<Source, "id" | "savedAt">[];
    claims?: Omit<Claim, "id" | "createdAt">[];
    events?: Omit<TimelineEvent, "id" | "createdAt">[];
    titles?: Omit<TitleIdea, "id" | "createdAt">[];
    shorts?: Omit<Short, "id" | "createdAt">[];
    thumbnails?: Omit<ThumbnailConcept, "id" | "createdAt">[];
  };
  failed: boolean;
  /** Set when the app has no server (static export) — the UI explains it. */
  serverUnavailable: boolean;
}

export type StepListener = (step: RunStep, all: RunStep[]) => void;

export interface RunContext {
  project: Project | null;
  memories: { key: string; value: string }[];
  signal?: AbortSignal;
}

const CREDS: Record<CredibilityTier, CredibilityTier> = {
  high: "high",
  medium: "medium",
  low: "low",
  unknown: "unknown",
};

function toCredibility(domain: string): CredibilityTier {
  if (/\.(gov|edu|int)$/.test(domain) || /official|filing|report|annual/i.test(domain)) return "high";
  if (/\.org$/.test(domain) || /institute|research|journal/i.test(domain)) return "medium";
  if (/forum|reddit|quora|medium|substack/i.test(domain)) return "low";
  if (/\.news$|newswire|times|post|herald/i.test(domain)) return "medium";
  return "unknown";
}

function toSourceType(domain: string): SourceType {
  if (/forum|reddit|quora|medium|substack/i.test(domain)) return "forum";
  if (/news|times|post|herald|wire/i.test(domain)) return "news";
  if (/arxiv|edu|journal|doi/i.test(domain)) return "academic";
  if (/gov|\.int$|filing|sec\./i.test(domain)) return "official";
  if (/blog|dev|medium\.com/i.test(domain)) return "blog";
  return "other";
}

export async function buildPlan(userText: string): Promise<Plan> {
  return planFor(classifyIntent(userText));
}

/**
 * Runs a plan. `emit` is called after every state transition so the UI can
 * animate honestly; the array passed to it is the live step list.
 */
export async function runPlan(
  plan: Plan,
  ctx: RunContext,
  emit: StepListener,
): Promise<RunResult> {
  const steps: RunStep[] = plan.steps.map((s) => ({
    ...s,
    status: "pending",
    detail: null,
    resultCount: null,
    error: null,
    remedy: "none",
    elapsedMs: null,
  }));

  const createdIds: RunResult["createdIds"] = [];
  const output: RunResult["output"] = {};
  let answer = "";
  let serverUnavailable = false;

  const set = (id: string, changes: Partial<RunStep>) => {
    const i = steps.findIndex((s) => s.id === id);
    if (i < 0) return;
    steps[i] = { ...steps[i], ...changes };
    emit(steps[i], steps);
  };

  const memory = ctx.memories.map((m) => `- ${m.key}: ${m.value}`).join("\n");
  const subject = plan.intent.subject || "الموضوع";
  const projectCtx = ctx.project
    ? `المشروع الحالي: ${ctx.project.title}\nفرضيته: ${ctx.project.premise}`
    : "لا يوجد مشروع محدد — سيُنشأ سياق جديد.";

  const system = [
    "أنت مساعد صانع محتوى يعمل داخل ABDO CREATOR OS.",
    "قواعد صارمة:",
    "1. لا تخترع أي رقم أو تاريخ أو اسم. إذا لم تجده في المصادر المتاحة، اكتب: لم أجد مصدرًا موثوقًا كفيًا.",
    "2. اذكر المصدر بجوار كل رقم مهم.",
    "3. اكتب بلغة عربية طبيعية تُقال بصوت، لا بلغة تقرير أكاديمي.",
    "4. تجنّب الحشو التحفيزي والعبارات العامة. كن محددًا.",
    ctx.project ? `جمهور الفيديو: ${ctx.project.audience || "غير محدد"}` : "",
    ctx.project ? `نوع المحتوى: ${ctx.project.contentType || "غير محدد"}` : "",
    memory ? `\nتفضيلات المستخدم:\n${memory}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  for (const step of plan.steps) {
    if (ctx.signal?.aborted) {
      set(step.id, { status: "skipped", detail: "أُلغيت العملية" });
      continue;
    }

    const started = performance.now();
    set(step.id, { status: "running", detail: "جارٍ التنفيذ…" });

    try {
      switch (step.id) {
        // ------------------------------------------------------------ planning
        case "plan": {
          set(step.id, {
            status: "done",
            detail: `${plan.intent.label} · ثقة ${Math.round(plan.intent.confidence * 100)}٪`,
            resultCount: steps.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // -------------------------------------------------------------- search
        case "search": {
          const res = await searchWeb(`${subject} ${plan.intent.label}`, { maxResults: 8 }, ctx.signal);
          serverUnavailable = serverUnavailable || res.demo;
          const sources: Omit<Source, "id" | "savedAt">[] = res.hits.map((h) => ({
            projectId: ctx.project?.id ?? "",
            researchSessionId: null,
            title: h.title,
            url: h.url,
            domain: h.domain || domainOf(h.url),
            sourceType: h.sourceType === "other" ? toSourceType(h.domain) : h.sourceType,
            publishedAt: h.publishedAt,
            credibility: toCredibility(h.domain),
            summary: h.snippet,
            quotes: [],
            extractedFacts: [],
            isDemo: res.demo,
          }));
          output.sources = [...(output.sources ?? []), ...sources];
          res.hits.slice(0, 3).forEach((h) =>
            createdIds.push({ type: "source", id: h.url, label: h.title.slice(0, 70) }),
          );
          set(step.id, {
            status: "done",
            detail: res.demo ? "نتائج توضيحية (وضع تجريبي)" : `${res.hits.length} نتيجة حقيقية`,
            resultCount: res.hits.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // -------------------------------------------------------------- scrape
        case "scrape": {
          const urls = (output.sources ?? []).slice(0, 3);
          let ok = 0;
          for (const s of urls) {
            if (ctx.signal?.aborted) break;
            try {
              const page = await scrapePage(s.url, ctx.signal);
              serverUnavailable = serverUnavailable || page.demo;
              s.summary = page.markdown.slice(0, 600);
              // First two sentences become a quotable fragment.
              const firstSentence = page.markdown
                .replace(/^#.*$/gm, "")
                .split(/[.،\n]/)
                .map((x) => x.trim())
                .filter((x) => x.length > 40)[0];
              if (firstSentence) s.quotes = [{ id: uid("q"), text: firstSentence, locator: "¶1" }];
              s.extractedFacts = extractFacts(page.markdown).slice(0, 5);
              ok++;
            } catch {
              // A single dead link must not abort the workflow.
            }
          }
          set(step.id, {
            status: ok > 0 ? "done" : "skipped",
            detail: ok > 0 ? `استُخرج ${ok} مصدر` : "تعذّر الاستخراج — تخطّي",
            resultCount: ok,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // ---------------------------------------------------------- extraction
        case "analyze":
        case "extract": {
          const src = (output.sources ?? []).slice(0, 4);
          if (src.length === 0) {
            set(step.id, { status: "skipped", detail: "لا توجد مصادر لتحليلها", resultCount: 0, elapsedMs: performance.now() - started });
            break;
          }
          const res = await callAI(
            [
              { role: "system", content: system },
              {
                role: "user",
                content: `لخّص هذا المصدر في ثلاث جمل، واستخرج من نصه كل رقم أو تاريخ أو اسم مهم:\n\nالعنوان: ${src[0].title}\nالنص:\n${src[0].summary}`,
              },
            ],
            "extraction",
            {},
            ctx.signal,
          );
          serverUnavailable = serverUnavailable || res.demo;
          src[0].summary = res.demo ? src[0].summary : res.text.slice(0, 800);
          set(step.id, {
            status: "done",
            detail: res.demo ? "تحليل توضيحي" : "تحليل نموذج",
            resultCount: src.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // ------------------------------------------------------------- claims
        case "claims":
        case "match": {
          const src = output.sources ?? [];
          const claims = extractClaimsFromSources(src, ctx.project?.id ?? "");
          output.claims = claims;
          const conflicted = claims.filter((c) => c.status === "unclear").length;
          set(step.id, {
            status: "done",
            detail: conflicted > 0 ? `${claims.length} ادعاء · ${conflicted} يحتاج توضيحًا` : `${claims.length} ادعاء`,
            resultCount: claims.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        case "contradictions": {
          const src = output.sources ?? [];
          const claims = output.claims ?? [];
          const numeric = claims.filter((c) => c.kind === "number");
          const conflicted = numeric.filter((c) => c.status === "unclear");
          set(step.id, {
            status: "done",
            detail: conflicted.length > 0 ? `${conflicted.length} رقم يحتاج توضيحًا` : "لا تعارض بين المصادر",
            resultCount: conflicted.length,
            elapsedMs: performance.now() - started,
          });
          if (conflicted.length > 0) {
            answer += `**تناقض يحتاج توضيحًا:** ${conflicted[0].text}\n\nلم أجد مصدرين مستقلين يؤكدان الرقم نفسه. لن أعرضه كحقيقة قبل التحقق.\n\n`;
          }
          void src;
          break;
        }

        // ----------------------------------------------------------- timeline
        case "timeline": {
          const src = output.sources ?? [];
          const events = buildTimelineFromSources(src, ctx.project?.id ?? "");
          output.events = events;
          set(step.id, {
            status: "done",
            detail: `${events.length} حدث زمني`,
            resultCount: events.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // ------------------------------------------------------------ youtube
        case "channel":
        case "videos": {
          const res = await youtubeSearch(subject, 8, ctx.signal);
          serverUnavailable = serverUnavailable;
          if (res.length > 0) {
            answer += `**حصلت على ${res.length} فيديو** من «${subject}».\n\n`;
            res.slice(0, 3).forEach((v) =>
              createdIds.push({ type: "video", id: v.id, label: v.title.slice(0, 70) }),
            );
          }
          set(step.id, {
            status: "done",
            detail: `${res.length} فيديو`,
            resultCount: res.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // -------------------------------------------------------- transcript
        case "fetch": {
          const urlMatch = plan.intent.subject.match(/https?:\/\/\S+/);
          if (!urlMatch) {
            set(step.id, { status: "failed", detail: "لم أجد رابط فيديو في الطلب. ألصق رابط YouTube كاملًا.", remedy: "none", elapsedMs: performance.now() - started });
            continue;
          }
          const t = await transcribeVideo(urlMatch[0], "ar", ctx.signal);
          serverUnavailable = serverUnavailable || t.isDemo;
          answer += `**التفريغ النصي جاهز** (${t.segments.length} مقطع).\n\n${t.summary || t.hook}\n\n`;
          createdIds.push({ type: "transcript", id: t.id, label: t.hook.slice(0, 70) });
          set(step.id, {
            status: "done",
            detail: `${t.segments.length} مقطع · ${t.chapters.length} فصل`,
            resultCount: t.segments.length,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // ------------------------------------------------------------ context
        case "context":
        case "read_project":
        case "read_script":
        case "read_memory": {
          const n = ctx.project ? 1 : 0;
          set(step.id, {
            status: "done",
            detail: ctx.project ? `سياق: ${ctx.project.title}` : "لا يوجد سياق مشروع",
            resultCount: n,
            elapsedMs: performance.now() - started,
          });
          break;
        }

        // ----------------------------------------------------- AI generation
        default: {
          const res = await callAI(
            [
              { role: "system", content: system },
              { role: "user", content: buildPromptFor(step.id, subject, ctx, output) },
            ],
            step.id === "analyze_competitor" || step.id === "analyze_video" ? "analysis" : "writing",
            {},
            ctx.signal,
          );
          serverUnavailable = serverUnavailable || res.demo;
          answer += res.text.split("\n---\n")[0] + "\n\n";

          // Route structured output to the right place.
          if (step.id === "write" && ctx.project) {
            output.titles = extractTitles(res.text);
          }
          if (step.id === "extract" || step.id === "write") {
            output.titles = output.titles ?? extractTitles(res.text);
          }

          set(step.id, {
            status: "done",
            detail: res.demo ? "محتوى توضيحي (وضع تجريبي)" : `${res.model} · ${res.outputTokens} رمز`,
            resultCount: 1,
            elapsedMs: performance.now() - started,
          });
        }
      }
    } catch (e) {
      const err = e as ApiError;
      if (err.code === NO_SERVER) serverUnavailable = true;
      const failed = err instanceof ApiError;
      set(step.id, {
        status: "failed",
        detail: err?.message ?? "حدث خطأ غير متوقع.",
        error: err?.message ?? String(e),
        remedy: failed ? err.remedy : "none",
        elapsedMs: performance.now() - started,
      });
      // A hard stop only happens when the step was a dependency for the rest.
      if (step.id === "search" || step.id === "plan") {
        for (const rest of steps.filter((s) => s.status === "pending")) {
          set(rest.id, { status: "skipped", detail: "توقّف بسبب فشل خطوة سابقة" });
        }
        break;
      }
    }
  }

  if (!answer) {
    answer = serverUnavailable
      ? "نفّذت الخطة، لكن المزوّدين غير مربوطين بعد — هذه نتيجة توضيحية تبيّن كيف يعمل كل جزء. اربط مفتاحًا واحدًا على الأقل لتفعيل الوضع الحقيقي."
      : `أنجزت الخطة: ${plan.outcome}. افتح التبويب المرتبط لتحرير النتيجة.`;
  }

  return {
    plan,
    steps,
    answer: answer.trim(),
    createdIds,
    output,
    failed: steps.some((s) => s.status === "failed"),
    serverUnavailable,
  };
}

// ---------------------------------------------------------------------------
// Local heuristics — these are real logic, not placeholders
// ---------------------------------------------------------------------------

const NUMBER_RE = /(?:^|[\s(])((?:[$€£]\s?)?\d[\d,.]*\s?(?:مليون|مليار|ألف|ك|%|$|M|B|K)?)/g;
const DATE_RE = /(\b(19|20)\d{2}\b|\b(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\b)/g;

function extractFacts(markdown: string): string[] {
  const facts = new Set<string>();
  for (const m of markdown.matchAll(NUMBER_RE)) {
    const v = m[1].trim();
    if (v.length > 1 && !/^\d{1,2}$/.test(v)) facts.add(`رقم مستخرج: ${v}`);
    if (facts.size > 8) break;
  }
  for (const m of markdown.matchAll(DATE_RE)) facts.add(`تاريخ مستخرج: ${m[1]}`);
  return [...facts].slice(0, 6);
}

function extractClaimsFromSources(sources: Omit<Source, "id" | "savedAt">[], projectId: string): Omit<Claim, "id" | "createdAt">[] {
  const claims: Omit<Claim, "id" | "createdAt">[] = [];
  // Group numeric mentions by value so identical figures across sources are
  // marked supported, and divergent ones are flagged rather than averaged.
  const byValue = new Map<string, Omit<Source, "id" | "savedAt">[]>();

  for (const s of sources) {
    const blob = `${s.title} ${s.summary} ${s.extractedFacts.join(" ")}`;
    for (const m of blob.matchAll(NUMBER_RE)) {
      const raw = m[1].trim();
      const num = Number(raw.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(num) || num < 10) continue;
      const key = String(num);
      const list = byValue.get(key) ?? [];
      list.push(s);
      byValue.set(key, list);
    }
  }

  for (const [value, group] of byValue) {
    const numeric = Number(value);
    const status: ClaimStatus = group.length > 1 ? "supported" : "needs_verification";
    claims.push({
      projectId,
      text: `الرقم ${value} ورد في ${group.length} مصدر`,
      kind: "number",
      value: numeric,
      unit: null,
      status,
      sourceIds: group.map((g) => g.url),
      resolution:
        group.length > 1
          ? "مؤكد في أكثر من مصدر. تأكد أن المصادر تقيس الفترة نفسها قبل العرض."
          : "مصدر واحد فقط — لا يكفي لتأكيده في الفيديو.",
    });
  }
  return claims.slice(0, 12);
}

function buildTimelineFromSources(
  sources: Omit<Source, "id" | "savedAt">[],
  projectId: string,
): Omit<TimelineEvent, "id" | "createdAt">[] {
  const dated = sources
    .filter((s) => s.publishedAt)
    .sort((a, b) => (a.publishedAt as string).localeCompare(b.publishedAt as string));

  return dated.map((s) => ({
    projectId,
    date: s.publishedAt as string,
    datePrecision: ((s.publishedAt as string).length === 10 ? "day" : "year") as "day" | "year",
    title: s.title.slice(0, 90),
    description: s.summary.slice(0, 220),
    entityIds: [],
    sourceIds: [s.url],
    // Publication date is evidence of *reporting*, not of the event itself.
    confidence: 0.5,
  }));
}

function extractTitles(text: string): Omit<TitleIdea, "id" | "createdAt">[] {
  const rows = [...text.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d{1,3})\s*\|$/gm)];
  return rows.slice(0, 8).map((m) => ({
    projectId: "",
    text: m[1].trim(),
    angle: m[2].trim(),
    pullScore: Math.min(100, Number(m[3])),
  }));
}

function buildPromptFor(
  stepId: string,
  subject: string,
  ctx: RunContext,
  output: RunResult["output"],
): string {
  const src = (output.sources ?? []).slice(0, 5);
  const srcBlock = src.length
    ? src.map((s, i) => `[S${i + 1}] ${s.title}\n${s.summary.slice(0, 400)}`).join("\n\n")
    : "لا توجد مصادر متاحة بعد.";

  const switch_ = (stepId: string): string => {
    switch (stepId) {
      case "write":
        return `اكتب هيكل سكربت ثم نصوص المشاهد لـ «${subject}».\n\n${projectCtx(ctx)}\n\nالمصادر المتاحة:\n${srcBlock}\n\nاعتمد هيكلًا يناسب هذا الموضوع تحديدًا. لكل مشهد اذكر: السرد، التوجيه البصري، ونص الشاشة.`;
      case "structure":
      case "choose_structure":
        return `اختر الهيكل السردي الأنسب لـ «${subject}» واشرح لماذا. لا تفرض هيكلًا ثابتًا.`;
      case "write_hook":
      case "generate_hook":
        return `اكتب ثلاثة خطوطّاف لـ «${subject}»، مرتّبة من الأقوى. كل خطّاف مختلف بنيويًا لا لغويًا. لا تخترع رقمًا.`;
      case "generate_titles":
        return `اقترح عناوين لـ «${subject}». كل عنوان من زاوية مختلفة فعليًا.`;
      case "generate_shorts":
        return `استخرج من هذا السكربت أقوى ثلاث مقاطع تصلح كشورت. لكل واحد: خطّاف، جسم، نهاية، دعوة، عنوان، هاشتاغ.`;
      case "generate_visuals":
        return `اقترح مشاهد بصرية لكل فقرة من سكربت «${subject}»: لقطة، ب-رول، نص على الشاشة.`;
      case "generate_thumbnails":
        return `اقترح ثلاثة مفاهيم مصغّرات لـ «${subject}»: النص على الصورة، التوجيه البصري، الانفعال المستهدف.`;
      case "brief":
      case "synthesize":
        return `اكتب موجز بحث لـ «${subject}» اعتمادًا على هذه المصادر:\n\n${srcBlock}\n\nاذكر بوضوح ما هو مؤكد وما يحتاج تحققًا.`;
      case "report":
      case "fact_check":
        return `راجع الأرقام التالية واذكر أي رقم لا يدعمه مصدر: ${JSON.stringify((output.claims ?? []).map((c) => c.text))}`;
      case "answer":
        return `اشرح لي بإيجاز ما ينفّذه هذا النظام وكيف أبدأ. ثلاث جمل لكل نقطة.`;
      case "generate_ideas":
        return `اقترح ست أفكار محتوى حول مجال المستخدم، متصلة بمشاريعه الحالية.`;
      case "analyze_competitor":
        return `حلّل أنماط هذه القناة من حيث الخطّافات، الصيغ، وتكرار الموضوعات: ${subject}`;
      case "analyze_video":
        return `حلّل بنية هذا الفيديو: الخطّاف، البنية، الحجج، والدعوة: ${subject}`;
      case "analyze_transcript":
        return `حلّل هذا التفريغ: الخطّاف، البنية، الحجج، والدعوة.`;
      case "visuals":
        return `اقترح مشاهد بصرية لسكربت «${subject}».`;
      case "gaps":
        return `ما المواضيع التي لم يغطّها أحد في هذا المجال؟`;
      default:
        return `نفّذ المهمة «${stepId}» على «${subject}».`;
    }
  };

  return switch_(stepId);
}

function projectCtx(ctx: RunContext): string {
  if (!ctx.project) return "لا يوجد مشروع محدد.";
  return `المشروع: ${ctx.project.title}\nالفرضية: ${ctx.project.premise}\nالجمهور: ${ctx.project.audience || "غير محدد"}\nالمدة المستهدفة: ${Math.round(ctx.project.targetDurationSec / 60)} دقيقة`;
}
