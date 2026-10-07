/**
 * Demo adapters.
 *
 * These are real implementations of the provider contracts, not stubs. They
 * produce coherent, topic-aware fictional results so the product is fully
 * explorable before a single API key exists. Everything they return is marked
 * `demo: true` so the UI can label it honestly.
 *
 * The fictional data is deterministic per query so repeated runs are stable.
 */

import {
  ProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AnalysisInput,
  type AnalysisProvider,
  type ChannelInfo,
  type ScrapeProvider,
  type ScrapeRequest,
  type ScrapeResult,
  type SearchHit,
  type SearchProvider,
  type SearchRequest,
  type TranscriptProvider,
  type TranscriptRequest,
  type YouTubeProvider,
} from "./types";
import type { Claim, CredibilityTier, SourceType, TimelineEvent, Video } from "@/lib/types";
import { domainOf, uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Stable pseudo-random sequence seeded by a string. */
function rng(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return Math.abs(state % 100000) / 100000;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

const DEMO_DOMAIN_ROOTS = [
  "newswire",
  "research-institute",
  "industry-review",
  "ledger-daily",
  "business-archive",
  "policy-forum",
  "tech-observer",
  "capital-review",
];

const DEMO_TITLE_SHAPES = [
  (t: string) => `${t}: ما الذي حدث فعلًا، ولماذا لم يُقال علنًا`,
  (t: string) => `تحليل: الأرقام خلف ${t}`,
  (t: string) => `${t} — إعادة قراءة للأحداث`,
  (t: string) => `تسلسل زمني: ${t}`,
  (t: string) => `أرقام ${t} مقابل الرواية الرسمية`,
  (t: string) => `inside ${t}: the numbers behind the collapse`,
];

const SOURCE_TYPE_BY_DOMAIN: Record<string, SourceType> = {
  newswire: "news",
  "research-institute": "academic",
  "industry-review": "blog",
  "ledger-daily": "news",
  "business-archive": "report",
  "policy-forum": "forum",
  "tech-observer": "blog",
  "capital-review": "report",
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export class DemoSearchProvider implements SearchProvider {
  readonly id = "demo-search";
  readonly name = "البحث (وضع تجريبي)";

  isConfigured() {
    return true;
  }

  async search(req: SearchRequest): Promise<{ hits: SearchHit[]; demo: boolean }> {
    const r = rng(req.query);
    const max = Math.min(req.maxResults ?? 6, 10);
    const hits: SearchHit[] = [];

    for (let i = 0; i < max; i++) {
      const root = pick(DEMO_DOMAIN_ROOTS, r);
      const slug = req.query
        .trim()
        .replace(/[\s"']+/g, "-")
        .slice(0, 28)
        .toLowerCase();
      const url = `https://${root}.example/${slug}-${i + 1}`;
      const year = 2021 + Math.floor(r() * 4);
      const month = 1 + Math.floor(r() * 12);
      hits.push({
        title: pick(DEMO_TITLE_SHAPES, r)(req.query),
        url,
        domain: domainOf(url),
        sourceType: SOURCE_TYPE_BY_DOMAIN[root] ?? "other",
        publishedAt: `${year}-${String(month).padStart(2, "0")}-${String(1 + Math.floor(r() * 27)).padStart(2, "0")}`,
        snippet:
          `يتناول المصدر ${req.query} من زاوية مالية وتشغيلية. يذكر مؤشرات قابلة للتحقق، ويحدّد ما هو مؤكد وما هو تقديري. ` +
          `تنبيه: هذا نص تجريبي مُولَّد محليًا لعرض شكل النتيجة — لا يمثّل مصدرًا حقيقيًا.`,
        score: Number((1 - i * 0.11).toFixed(2)),
      });
    }
    return { hits, demo: true };
  }

  async test() {
    return { ok: true as const };
  }
}

// ---------------------------------------------------------------------------
// Scrape
// ---------------------------------------------------------------------------

export class DemoScrapeProvider implements ScrapeProvider {
  readonly id = "demo-scrape";
  readonly name = "الاستخراج (وضع تجريبي)";

  isConfigured() {
    return true;
  }

  async scrape(req: ScrapeRequest): Promise<ScrapeResult> {
    const r = rng(req.url);
    const sections = [
      "نظرة عامة",
      "الخلفية الزمنية",
      "الأرقام الأساسية",
      "التفسيرات المتنافسة",
      "ما لم يُقال",
    ];
    const markdown = [
      `# ${pick(DEMO_TITLE_SHAPES, r)(domainOf(req.url))}`,
      "",
      "> ⚠️ محتوى تجريبي مُولَّد محليًا لعرض شكل الاستخراج — ليس صفحة حقيقية.",
      "",
      ...sections.flatMap((h, i) => [
        `## ${h}`,
        "",
        `الفقرة ${i + 1} تتناول هذا المحور بتفصيل. في النسخة الحقيقية يظهر هنا النص المستخرج فعليًا مع الأرقام والتواريخ والاقتباسات.` +
        "",
        `- نقطة ${i + 1}-أ`,
        `- نقطة ${i + 1}-ب`,
        "",
      ]),
      "## الخلاصة",
      "",
      "الفقرة الختامية تلخّص ما سبق وتربطه بالسؤال الأصلي.",
    ].join("\n");

    return {
      url: req.url,
      markdown,
      title: pick(DEMO_TITLE_SHAPES, r)(domainOf(req.url)),
      demo: true,
    };
  }

  async test() {
    return { ok: true as const };
  }
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

const DEMO_CHANNELS = [
  { name: "قناة التحليل", handle: "@analysis", subs: 1_840_000, freq: 1.2 },
  { name: "مختبر المؤسسين", handle: "@founders", subs: 612_000, freq: 2.4 },
  { name: "أرقام ومصادر", handle: "@ledgers", subs: 407_000, freq: 0.8 },
  { name: "الاقتصاد بوضوح", handle: "@clear-econ", subs: 2_310_000, freq: 1.0 },
];

const HOOK_SHAPES = [
  (t: string) => `${t}. هذا ما لا تعرفه بعد.`,
  (t: string) => `ثلاث حقائق عن ${t}، الثالثة صادمة.`,
  (t: string) => `لماذا ${t}؟ الجواب أقصر مما تظن.`,
  (t: string) => `سؤال واحد عن ${t}، وإجابة واحدة خاطئة شائعة.`,
];

export class DemoYouTubeProvider implements YouTubeProvider {
  readonly id = "demo-youtube";
  readonly name = "YouTube (وضع تجريبي)";

  isConfigured() {
    return true;
  }

  private makeVideos(query: string, count: number, channelIdx: number): Video[] {
    const r = rng(query + channelIdx);
    const ch = DEMO_CHANNELS[channelIdx % DEMO_CHANNELS.length];
    return Array.from({ length: count }, (_, i) => {
      const views = Math.round(80_000 + r() * 3_000_000);
      const durationSec = Math.round(300 + r() * 1200);
      const hook = pick(HOOK_SHAPES, r)(query);
      return {
        id: uid("vid"),
        projectId: null,
        channelId: `UC_demo_${channelIdx}`,
        channelName: ch.name,
        channelUrl: `https://example-yt.test${ch.handle}`,
        youtubeId: `demo${hash(query + i).toString(36).slice(0, 9)}`,
        url: `https://example-yt.test/watch?v=demo${hash(query + i).toString(36).slice(0, 9)}`,
        title: `${query} — ${pick(["الجزء الكامل", "تحليل", "شرح مبسّط", "ما لا يقولونه"], r)}`,
        description: "وصف تجريبي مُولَّد محليًا.",
        thumbnailUrl: "",
        views,
        likes: Math.round(views * (0.03 + r() * 0.03)),
        comments: Math.round(views * (0.002 + r() * 0.004)),
        durationSec,
        publishedAt: `202${3 + Math.floor(r() * 2)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 27)).padStart(2, "0")}`,
        topic: query,
        structure: {
          hook,
          hookScore: Math.round(60 + r() * 35),
          mainArguments: [
            `الحجة الأولى حول ${query}`,
            "الحجة الثانية المبنية على الأرقام",
            "التفسير الذي يغفله الآخرون",
          ],
          structurePattern: pick(
            ["قصة ← أرقام ← نمط ← درس", "قائمة مرقّمة", "سؤال ← بحث ← إجابة", "تحديث ← تحليل ← توقع"],
            r,
          ),
          beats: [
            { atSec: 0, label: "الخطّاف", note: "جملة افتتاحية" },
            { atSec: 25, label: "التمهيد", note: "بناء السياق" },
            { atSec: 90, label: "الأدلة", note: "رسم بياني" },
            { atSec: Math.round(durationSec * 0.6), label: "التفسير", note: "الجزء التحليلي" },
            { atSec: Math.max(1, durationSec - 40), label: "الخاتمة", note: "الدعوة" },
          ],
          cta: "اشترك للمزيد من التحليل",
          retentionNotes: [
            "الانتقال من الخطّاف إلى السياق خلال 25 ثانية",
            "لا يوجد قطع مونتاج داخل الفكرة الواحدة",
          ],
        },
        isDemo: true,
      } satisfies Video;
    });
  }

  async search(req: { query: string; maxResults?: number }) {
    return {
      videos: this.makeVideos(req.query, Math.min(req.maxResults ?? 5, 10), 0),
      demo: true,
    };
  }

  async video(req: { url: string }) {
    return { video: this.makeVideos(req.url, 1, 0)[0], demo: true };
  }

  async channel(req: { url: string }): Promise<{ channel: ChannelInfo; demo: boolean }> {
    const r = rng(req.url);
    const idx = Math.floor(r() * DEMO_CHANNELS.length);
    const ch = DEMO_CHANNELS[idx];
    return {
      demo: true,
      channel: {
        id: `UC_demo_${idx}`,
        name: ch.name,
        handle: ch.handle,
        url: req.url,
        subscribers: ch.subs,
        videoCount: Math.round(80 + r() * 400),
        description: "وصف تجريبي للقناة.",
        topVideos: this.makeVideos(ch.name, 5, idx),
      },
    };
  }

  async test() {
    return { ok: true as const };
  }
}

// ---------------------------------------------------------------------------
// Transcript
// ---------------------------------------------------------------------------

export class DemoTranscriptProvider implements TranscriptProvider {
  readonly id = "demo-transcript";
  readonly name = "التفريغ النصي (وضع تجريبي)";

  isConfigured() {
    return true;
  }

  async transcribe(req: TranscriptRequest) {
    const r = rng(req.videoUrl);
    const lines = [
      "سنتحدث اليوم عن موضوع مدخل بسيط، لكنه يحمل نتيجة كبيرة.",
      "أولًا، لنضع التعريفات قبل أن ندخل في التفاصيل، لأن الالتباس يبدأ من هنا.",
      "ثم ننتقل إلى الأرقام، لأنها تحسم أكثر مما تحسم الحجج.",
      "هناك تفسيران متنافسان، وسأعرض لكما ثم أترك لك الحكم.",
      "الدرس العملي في النهاية هو ما يستحق أن تخرج به من هذا الفيديو.",
    ];

    let t = 0;
    const segments = lines.map((text) => {
      const startSec = t;
      const endSec = t + Math.round(6 + r() * 10);
      t = endSec + 1;
      return { startSec, endSec, text };
    });

    return {
      demo: true,
      transcript: {
        id: uid("trn"),
        projectId: null,
        videoUrl: req.videoUrl,
        provider: "demo",
        language: "ar",
        segments,
        summary:
          "⚠️ تفريغ نصي تجريبي مُولَّد محليًا لعرض شكل النتيجة. في الوضع الحقيقي يُستدعى مزود التفريغ المكوّن من الإعدادات.",
        keyPoints: [
          "النقطة الأولى التي يركّز عليها الفيديو",
          "النقطة الثانية وهي الأهم",
          "الخلاصة العملية في النهاية",
        ],
        quotes: [lines[0], lines[2]],
        hook: lines[0],
        structure: "خطّاف ← تعريف ← أرقام ← تفسيران ← درس",
        arguments: ["التفسير الأول", "التفسير الثاني", "لماذا يكاد لا واحد منهما يكون صحيحًا بالكامل"],
        cta: "اشترك للمزيد",
        chapters: [
          { startSec: 0, title: "المقدمة", summary: "التعريف والإطار" },
          { startSec: 8, title: "الأرقام", summary: "الأدلة الأساسية" },
          { startSec: 30, title: "التفسيرات", summary: "مقارنة بين روايتين" },
          { startSec: 52, title: "الخلاصة", summary: "ما الذي يجب أن تخرج به" },
        ],
        createdAt: new Date().toISOString(),
        isDemo: true,
      },
    };
  }

  async test() {
    return { ok: true as const };
  }
}

// ---------------------------------------------------------------------------
// AI (demo) — writes topic-aware, structurally correct output
// ---------------------------------------------------------------------------

const SYSTEM_HINT = "(وضع تجريبي — لا يوجد مزوّد ذكاء اصطناعي متصل)";

export class DemoAIProvider implements AIProvider {
  readonly id = "demo-ai";
  readonly name = "الذكاء الاصطناعي (وضع تجريبي)";

  isConfigured() {
    return true;
  }

  async complete(req: AIRequest): Promise<AIResponse> {
    const userText = req.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");
    const topic = extractTopic(userText);
    const task = detectTask(req.messages);

    const bodies: Record<string, string> = {
      hook: buildHook(topic),
      script: buildScript(topic),
      titles: buildTitles(topic),
      shorts: buildShorts(topic),
      thumbnails: buildThumbnails(topic),
      research: buildResearch(topic),
      improve: buildRewrite(userText),
      default: buildGeneral(topic, userText),
    };

    const text = bodies[task] ?? bodies.default;

    return {
      text: `${text}\n\n---\n${SYSTEM_HINT}`,
      provider: "demo",
      model: "demo-writer",
      inputTokens: estimateTokens(req.messages),
      outputTokens: estimateTokens(text),
      demo: true,
    };
  }

  async test() {
    return { ok: true as const, model: "demo-writer" };
  }
}

// ---------------------------------------------------------------------------
// Analysis (demo) — deterministic, genuinely useful scaffolding
// ---------------------------------------------------------------------------

export class DemoAnalysisProvider implements AnalysisProvider {
  readonly id = "demo-analysis";

  private angles(input: AnalysisInput) {
    const t = input.topic;
    return [
      {
        id: uid("ang"),
        title: `الجذر المالي لـ${t}`,
        thesis: `النتيجة النهائية في ${t} لم تكن سوء حظ، بل سلسلة قرارات كل واحدة منها تبدو منطقية بمفردها.`,
        rationale: "يبني الحجة على الأرقام المعلنة بدل التكرار، ويمنح المشاهد نموذجًا قابلًا للتطبيق.",
        risk: "يتطلب التأكد من دقة الأرقام في مصادر متعددة قبل العرض.",
        selected: true,
      },
      {
        id: uid("ang"),
        title: `قرار واحد خاطئ في ${t}`,
        thesis: `كان هناك قرار واحد يمكن تتبّعه عبر الزمن، وتكرّر بأشكال مختلفة.`,
        rationale: "الزاوية الأكثر إثارة للمشاهدة لأنها تختصر الموضوع في نقطة واحدة قابلة للحفظ.",
        risk: "قد يبالغ في تبسيط موضوع متعدد الأبعاد.",
        selected: true,
      },
      {
        id: uid("ang"),
        title: `ما لا يقوله أحد عن ${t}`,
        thesis: `المصادر المتاحة تتحدث عن الأرقام، وتتجاهل الطبقة التي تفسّرها.`,
        rationale: "تفتح فجوة محتوى واضحة إذا لم يغطها أحد في نفس الموضوع.",
        risk: "تحتاج مصادر أولية غير منشورة — لا تُعرض كفرضية قبل التحقق.",
        selected: false,
      },
    ];
  }

  async complete(input: AnalysisInput) {
    return { angles: this.angles(input), demo: true };
  }

  async extract(source: { title: string; url: string; content: string }) {
    const r = rng(source.url + source.title);
    return {
      demo: true,
      summary:
        `⚠️ تحليل تجريبي لعنوان «${source.title}». في الوضع الحقيقي يُستدعى نموذج ذكاء اصطناعي لاستخراج الملخص والاقتباسات والأرقام.`,
      quotes: [{ text: "اقتباس تجريبي — يظهر هنا النص الحرفي من المصدر مع موقعه.", locator: "¶1" }],
      facts: [
        `رقم استخراجي ${Math.round(10 + r() * 90)}`,
        `تاريخ استخراجي ${2019 + Math.floor(r() * 5)}`,
      ],
    };
  }

  async claims(sources: { id: string; title: string; facts: string[] }[]) {
    const claims: Claim[] = [];
    // Group by the leading number so genuinely conflicting figures surface.
    const buckets = new Map<string, typeof sources>();
    for (const s of sources) {
      for (const f of s.facts) {
        const m = f.match(/(-?\d+(?:\.\d+)?)/);
        if (!m) continue;
        const key = m[1];
        const list = buckets.get(key) ?? [];
        list.push(s);
        buckets.set(key, list);
      }
    }
    for (const [value, group] of buckets) {
      if (group.length < 1) continue;
      claims.push({
        id: uid("clm"),
        projectId: "",
        text: `الرقم ${value} ورد في ${group.length} مصدر`,
        kind: "number",
        value: Number(value),
        unit: null,
        status: group.length > 1 ? "unclear" : "needs_verification",
        sourceIds: group.map((g) => g.id),
        resolution:
          group.length > 1
            ? "نفس الرقم من أكثر من مصدر — يحتاج التأكد من أنهما يقيسان الفترة نفسها."
            : "مصدر واحد فقط — لا يكفي للحكم.",
        createdAt: new Date().toISOString(),
      });
    }
    return { claims, demo: true };
  }

  async synthesize(input: {
    question: string;
    sources: { id: string; title: string; summary: string; facts: string[] }[];
  }) {
    const lines = [
      `## الإجابة على: ${input.question}`,
      "",
      `⚠️ **ملاحظة:** هذا ملخّص تجريبي مُولَّد من بنية المشروع، وليس بحثًا حقيقيًا. اربط مزوّد بحث لتفعيل الوضع الحقيقي.`,
      "",
      `بناءً على ${input.sources.length} مصدر في المشروع، تتوزّع الأدلة على ثلاثة محاور:`,
      "",
      ...input.sources.slice(0, 4).map((s, i) => `${i + 1}. **${s.title}** — ${s.summary.slice(0, 90)}…`),
      "",
      "### ما يحتاج تحققًا",
      "",
      "- أي رقم يظهر في مصدر واحد فقط.",
      "- أي علاقة زمنية لم يثبتها مصدر.",
      "",
      "الخطوة التالية المقترحة: افتح تبويب المصادر وراجع الأدلة يدويًا قبل كتابة أي سطر.",
    ];
    return { text: lines.join("\n"), demo: true };
  }

  async timeline(events: { title: string; description: string; date: string }[]) {
    const out: Pick<TimelineEvent, "date" | "title" | "description" | "confidence">[] = events.map((e) => ({
      date: e.date,
      title: e.title,
      description: e.description,
      confidence: 0.7,
    }));
    return { events: out, demo: true };
  }
}

// ---------------------------------------------------------------------------
// Content builders — what the demo AI actually writes
// ---------------------------------------------------------------------------

function extractTopic(text: string): string {
  const patterns = [
    /(?:عن|حول|في|بخصوص|عن موضوع)\s+([^؟.!\n]{3,60})/,
    /(?:فيديو|موضوع|بحث|تحليل)\s+(?:عن|حول|عن)\s+([^؟.!\n]{3,60})/,
    /(?:why|how|what|about)\s+([a-zA-Z0-9\s"'.]{3,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/^["'«]|["'»]$/g, "");
  }
  return text.trim().split(/[؟.!\n]/)[0]?.slice(0, 60) || "موضوعك";
}

function detectTask(messages: { role: string; content: string }[]): string {
  const all = messages.map((m) => m.content).join(" ").toLowerCase();
  if (/خطّاف|خطاف|hook|افتتاحية/.test(all)) return "hook";
  if (/عنوان|العنوان|title/.test(all)) return "titles";
  if (/شورت|shorts|reels/.test(all)) return "shorts";
  if (/ثامبنيل|thumbnail|صورة مصغ/.test(all)) return "thumbnails";
  if (/سكربت|script|مشهد|نص الفيديو/.test(all)) return "script";
  if (/بحث|research|مصادر|ابحث|بحث لي/.test(all)) return "research";
  if (/حسّن|تحسين|أعد صياغة|rewrite|improve|اختصر|وسّع/.test(all)) return "improve";
  return "default";
}

function buildHook(topic: string): string {
  return [
    `ثلاث خيارات لخطّاف **${topic}**، مرتّبة من الأقوى:`,
    "",
    "**1 — الرقم ثم السؤال**",
    "يبدأ بالمبلغ أو التاريخ، ثم يسأل لماذا حدث هذا. يجبر المشاهد على الاستماع لأنه يعرف الأرقام لكنه لا يعرف التفسير.",
    "",
    `> «ثلاثمئة مليون دولار. سبع سنوات. ثم لم يتبقَّ منها ورقة واحدة. السؤال ليس كيف خسرت هذه الشركة — السؤال هو لماذا بقيت واقفة أربع سنوات بعد أن الأرقام قال لها بُد.»`,
    "",
    "**2 — المفارقة**",
    "يبدأ من معطى يوقع في الحيرة ثم يزيله.",
    "",
    `> «كل شركة في ${topic} كسبت جولتها التالية. هذا بالضبط ما يجعل قصصها مربكة.»`,
    "",
    "**3 — المشهد قبل التحليل**",
    "يبدأ بصورة ملموسة قبل أي رقم. أقوى في الفيديوهات التي تحتاج بناء ثقة سريعة.",
    "",
    `> «المستودع فارغ منذ سنتين. الدفاتر موجودة، والمالك موجود، والجواب واحد.»`,
    "",
    "**لماذا هذا الخطّاف يعمل:** المشاهدون في هذا النوع من المحتوى يعرفون الأرقام مسبقًا. الخطّاف الذي يبدأ بالمبلغ يخلق سؤالًا مفتوحًا، لا مفاجأة. استخدمه إن كانت لديك أرقام موثّقة؛ تجنّبه إن لم يكن لديك رقم من مصدر.",
  ].join("\n");
}

function buildScript(topic: string): string {
  return [
    `# هيكل السكربت — ${topic}`,
    "",
    "اخترت الهيكل التالي لأن الجمهور يعرف **الحدث** ولا يعرف **السبب**، فالمهم هنا الانتقال من «ماذا حدث» إلى «لماذا حدث» دون فقدان منهم.",
    "",
    "---",
    "",
    "## 1 · الخطّاف (0:00 – 0:20)",
    "",
    "ابدأ بأصغر رقم يصدمة، ثم اطرح السؤال المعكوس مباشرة.",
    "",
    "## 2 · المشهد (0:20 – 0:50)",
    "",
    "صورة واحدة + سطران. لا شرح هنا — الهدف منع المشاهد من مغادرة الفيديو.",
    "",
    "## 3 · السياق (0:50 – 1:40)",
    "",
    "من كان، وأين، ومتى. جملتان لا أكثر. أضف كل رقم هنا وسجل مصدره.",
    "",
    "## 4 · التصادم (1:40 – 4:00)",
    "",
    "هنا يبدأ العمل الحقيقي. اعرض المؤشر الذي لم يتغيّر، لأنه لا يتغيّر بينما تغيّر كل شيء حوله.",
    "",
    "## 5 · التصعيد (4:00 – 7:00)",
    "",
    "كل «فصل» يبدأ بمفارقة. فإذا لم تجد مفارقة، فلا فاصل.",
    "",
    "## 6 · نقطة التحوّل (7:00 – 8:30)",
    "",
    "الحدث الذي يفسّر كل ما قبله. أهم جزء في الفيديو وأقل ما يُكتب.",
    "",
    "## 7 · الرؤية (8:30 – 9:30)",
    "",
    "جملة واحدة قابلة للحفظ. لا تكتب أكثر من ذلك.",
    "",
    "## 8 · الخاتمة والدعوة (9:30 – 10:00)",
    "",
    "اربط ما سبق بشيء يخص المشاهد، ثم اسأل سؤالًا واحدًا فقط.",
    "",
    "---",
    "",
    "> ⚠️ هذا هيكل مُولَّد في الوضع التجريبي. فعّل مزوّد ذكاء اصطناعي لكتابة نص فعلي، أو اكتب مباشرة في المحرر.",
  ].join("\n");
}

function buildTitles(topic: string): string {
  const rows = [
    ["مئتان وأربعون مليون… ثم لا شيء", "المبلغ أولًا", 92],
    [`كل ما تعرفه عن ${topic} ينتهي عند هذه الجملة`, "المفارقة", 88],
    ["ثلاث حقائق، واحدة منها خاطئة", "فخ المعرفة", 84],
    ["الرقم الذي لم ينشره أحد", "ندرة المعلومة", 79],
    ["لماذا لم ينجح أحد في توقّع هذا", "سؤال مفتوح", 76],
  ];
  return [
    `## عناوين مقترحة — ${topic}`,
    "",
    "| العنوان | الزاوية | قوة الجذب |",
    "|---|---|---|",
    ...rows.map(([t, a, s]) => `| ${t} | ${a} | ${s} |`),
    "",
    "**ملاحظة:** رقم «قوة الجذب» تقدير استدلالي مبني على بنية العنوان (رقم، مفارقة، ندرة) — ليس قياسًا فعليًا للمشاهدات.",
    "",
    "**الأقوى للاختيار:** الأول، لأنه يجمع رقمًا واضحًا مع نفي — وهو أقوى تركيب يفتح باب الفضول دون أن يكون مضلّلًا.",
  ].join("\n");
}

function buildShorts(topic: string): string {
  return [
    `## شورتس مستخرجة من ${topic}`,
    "",
    "### شورت 1 — الرقم (≈45 ثانية)",
    "",
    "- **الخطّاف:** ثلاثمئة مليون دولار. وهذا ما بقي.",
    "- **الجسم:** الشركة حققت أعلى إيراد في تاريخها، ثم خسرت 34% في ربع واحد والإنفاق لم يتحرك.",
    "- **النهاية:** كل دولار طالب به الدائن استُرجع منه 32 سنتًا.",
    "- **الدعوة:** الفيديو الكامل يشرح الخط الزمني.",
    "- **العنوان:** أربع جولات تمويل ولم تنقذها",
    "- **الهاشتاغات:** #ريادة_الأعمال #تحليل_مالي",
    "",
    "### شورت 2 — السؤال (≈50 ثانية)",
    "",
    "- **الخطّاف:** كم شهرًا مرّ بين الجولة الأخيرة والإفلاس؟",
    "- **الجسم:** الإجابة أصغر مما تتوقع، والسؤال هو الفيديو كله.",
    "- **النهاية:** الرقم وحده يفسّر لماذا لم ينقذ أحد.",
    "- **الدعوة:** الرابط في الوصف.",
    "- **العنوان:** 17 شهرًا",
    "- **الهاشتاغات:** #أرقام #قصة",
    "",
    "> ⚠️ مُولَّد في الوضع التجريبي. فعّل مزوّد ذكاء اصطناعي للحصول على استخراج دقيق من نصّك.",
  ].join("\n");
}

function buildThumbnails(topic: string): string {
  return [
    `## مفاهيم مصغّرات — ${topic}`,
    "",
    "### المفهوم 1 — «المستودع الفارغ»",
    "- **النص:** المبلغ ← 0",
    "- **الإضاءة:** ضوء جانبي واحد، 나머ى شبه مظلم",
    "- **الانفعال:** إحباط هادئ",
    "- **ملاحظة التباين:** النص على الثلث الأيمن، والرقم باللون الفاتح على خلفية معتمة",
    "",
    "### المفهوم 2 — «الرقمان المتعارضان»",
    "- **النص:** أيّهما صحيح؟",
    "- **التصوير:** لوحان متجاوران بخطّأين متقاطعين",
    "- **الانفعال:** حيرة",
    "- **ملاحظة التباين:** لا تتجاوز ثلاثة ألوان. التباين يحدّد نسبة المشاهدة قبل النص",
    "",
    "### المفهوم 3 — «الخط الزمني المكسور»",
    "- **النص:** 17 شهرًا",
    "- **التصوير:** خط أفقي ينكسر في المنتصف",
    "- **الانفعال:** توتر",
    "- **ملاحظة التباين:** الرقم كبير، والوصف صغير أسفله",
    "",
    "> ⚠️ مفاهيم إرشادية. جرّب نسختين واختر بالإحصائيات لا بالذوق.",
  ].join("\n");
}

function buildResearch(topic: string): string {
  return [
    `## موجز بحث مبدئي — ${topic}`,
    "",
    "> ⚠️ **لا يوجد مزوّد بحث متصل.** هذا قالب جاهز يوضّح شكل الناتج، وليس بحثًا حقيقيًا. اربط Tavily أو أي مزوّد آخر في الإعدادات لتفعيل الوضع الحقيقي.",
    "",
    "### السؤال الرئيسي",
    `ما الذي جعل ${topic} ينتهي بهذه الطريقة، وما الذي يمكن تكراره؟`,
    "",
    "### الزوايا المقترحة",
    "",
    "1. **الجذر المالي** — الأرقام المعلنة تكفي لبناء الحجة دون اجتهاد.",
    "2. **قرار واحد خاطئ** — الزاوية الأقوى للمشاهدة، وأسهلها على الذاكرة.",
    "3. **ما لا يقوله أحد** — تفتح فجوة محتوى، لكن تحتاج مصادر أولية.",
    "",
    "### أسئلة فرعية يجب الإجابة عنها",
    "",
    "- ما الرقم الذي لم يتغيّر بينما تغيّر كل شيء حوله؟",
    "- ما أول قرار، عند مراجعة ما بعد الحدث، كان يمكن أن يغيّر النتيجة؟",
    "- من المستفيد من الرواية الرسمية؟ ومن لا يظهر فيها؟",
    "",
    "### ما يجب عدم فعله",
    "",
    "لا تستخدم أي رقم لم يرد في مصدر داخل المشروع. الرقم بلا مصدر هو أسرع طريق إلى فيديو خاطئ.",
  ].join("\n");
}

function buildRewrite(input: string): string {
  return [
    "## نسخة مُحسَّنة",
    "",
    "> ⚠️ الوضع التجريبي — لم يُستدعَ نموذج فعلي. هذا يوضّح شكل الناتج فقط.",
    "",
    "**ما تحسّن في هذه النسخة:**",
    "1. الجملة الافتتاحية أصبحت تحمل رقمًا محددًا بدل وصف عام.",
    "2. استُبدلت الجمل الاستفسارية بن칠ية — الاستفسار يشتت الانتباه في الثواني الأولى.",
    "3. قُلّصت الجمل التي تكرر الفكرة مرتين.",
    "",
    "**ما ينقصها:** التحقق من الأرقام. راجع كل رقم في النص مقابل المصادر قبل الاعتماد عليه.",
    "",
    "```",
    input.slice(0, 400) || "(النص الأصلي فارغ)",
    "```",
  ].join("\n");
}

function buildGeneral(topic: string, userText: string): string {
  return [
    `فهمت طلبك: **${topic}**`,
    "",
    "> ⚠️ **وضع تجريبي** — لا يوجد مزوّد ذكاء اصطناعي متصل بعد، لذا لا أستطيع تنفيذ هذا الطلب فعليًا. هذه رسالة توضّح ما سأفعله عند الربط:",
    "",
    "### ما سأفعله",
    "",
    "1. أحدّد نوع المهمة (بحث / كتابة / تحليل / استخراج).",
    "2. أختار الأدوات المناسبة من بين الأدوات المتصلة.",
    "3. أنفّذها بالتوازي حيثما لا يعتمد شيء على شيء.",
    "4. أعرض لك كل خطوة وسببها أثناء التنفيذ.",
    "5. أدمج النتائج في كيانات قابلة للتعديل — لا أضع نتائج في صندوق أسود.",
    "",
    "### لتفعيل الوضع الحقيقي",
    "",
    "افتح **الإعدادات ← التكاملات** وأضف مفتاح أحد هذه المزوّدين:",
    "",
    "| المزوّد | يفتح لك |",
    "|---|---|",
    "| Gemini أو DeepSeek أو OpenRouter | كل المهام الذكية |",
    "| Tavily | البحث في الويب |",
    "| Firecrawl | استخراج محتوى الصفحات |",
    "| YouTube | تحليل الفيديوهات والقنوات |",
    "| Video-to-Text | التفريغ النصي |",
    "",
    `**طلبك الأصلية محفوظة:** «${userText.slice(0, 120)}»`,
  ].join("\n");
}

/** Rough token estimate — provider billing is the source of truth, this is a UI hint. */
function estimateTokens(input: { content: string }[] | string): number {
  const text = typeof input === "string" ? input : input.map((m) => m.content).join(" ");
  return Math.ceil(text.length / 3.4);
}
