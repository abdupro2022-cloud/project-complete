/**
 * Intent routing and workflow planning.
 *
 * The Command Center is not a chat box. Free text is classified into a task
 * type, and a task type maps to a plan: an ordered list of steps, each with a
 * reason and the tool it will use. The plan is shown to the user *before* it
 * runs, so the system is legible rather than magical.
 */

export type IntentId =
  | "web_research"
  | "video_research"
  | "script"
  | "hook"
  | "titles"
  | "shorts"
  | "thumbnails"
  | "competitor"
  | "transcript"
  | "idea"
  | "project"
  | "fact_check"
  | "help"
  | "unknown";

export interface Intent {
  id: IntentId;
  label: string;
  confidence: number;
  /** The noun phrase the router pulled out, e.g. the company or topic. */
  subject: string;
  /** Alternative intents with lower scores, shown as "did you mean". */
  alternatives: { id: IntentId; label: string; score: number }[];
}

interface Rule {
  id: IntentId;
  label: string;
  /** Strong signals: presence means the intent is almost certain. */
  strong: RegExp[];
  /** Weak signals: accumulate toward the threshold. */
  weak: RegExp[];
  weight: number;
}

const RULES: Rule[] = [
  {
    id: "transcript",
    label: "استخراج نص من فيديو",
    strong: [/تفريغ/i, /نص\s+الفيديو/i, /transcript/i, /انقل\s+الكلام/i, /لخص\s+الفيديو/i],
    weak: [/فيديو/i, /حلقة/i, /بودكاست/i],
    weight: 3,
  },
  {
    id: "competitor",
    label: "تحليل منافس",
    strong: [/منافس/i, /منافسين/i, /القناة\s+التالية/i, /قارن\s+القنوات/i, /competitor/i, /غرورس/i],
    weak: [/قناة/i, /مشترك/i, /مشاهدات/i, /أسلوب\s+القناة/i],
    weight: 3,
  },
  {
    id: "video_research",
    label: "بحث في YouTube",
    strong: [/يوتيوب/i, /youtube/i, /فيديوهات\s+عن/i, /ماذا\s+يقول\s+الناس/i],
    weak: [/فيديو/i, /ترند/i, /* trending */ /رائج/i],
    weight: 2,
  },
  {
    id: "web_research",
    label: "بحث عميق في الويب",
    strong: [/ابحث\s+لي/i, /ابحث\s+عن/i, /بحث\s+عميق/i, /لماذا\s+(?:فشلت|سقطت|انهارت|توقفت)/i, /ما\s+الذي\s+حدث/i],
    weak: [/مصادر/i, /أدلة/i, /* evidence */ /حقائق/i, /تقارير/i, /تحليل/i],
    weight: 3,
  },
  {
    id: "hook",
    label: "كتابة خطّاف",
    strong: [/خطّاف/i, /خطاف/i, /hook/i, /الجملة\s+الافتتاحية/i, /أول\s+جملة/i],
    weak: [],
    weight: 4,
  },
  {
    id: "script",
    label: "كتابة سكربت",
    strong: [/اكتب\s+(?:لي\s+)?(?:ال)?(?:سكربت|سيناريو|نص)/i, /سكربت/i, /script/i, /* script */ /مشهد/i],
    weak: [/اكتب/i, /اكتب لي/i, /نص/i],
    weight: 3,
  },
  {
    id: "shorts",
    label: "توليد شورتس",
    strong: [/شورت/i, /shorts/i, /ريلز/i, /reels/i, /تيك\s*توك/i, /مقطع\s+قصير/i],
    weak: [],
    weight: 4,
  },
  {
    id: "titles",
    label: "اقتراح عناوين",
    strong: [/عناوين/i, /عنوان/i, /title/i, /أسماء\s+للفيديو/i],
    weak: [],
    weight: 4,
  },
  {
    id: "thumbnails",
    label: "مفاهيم ثامبنيل",
    strong: [/ثامبنيل/i, /* thumbnail */ /صورة\s+مصغ/i, /غلاف/i, /تصميم\s+صورة/i],
    weak: [],
    weight: 4,
  },
  {
    id: "fact_check",
    label: "تحقق من الحقائق",
    strong: [/تحقق\s+من/i, /تدقيق/i, /هل\s+(?:هذا|هذه)\s+(?:صحيح|صحيحة)/i, /fact\s*check/i],
    weak: [/مصدر/i, /رقم/i],
    weight: 3,
  },
  {
    id: "project",
    label: "إنشاء مشروع",
    strong: [/مشروع\s+جديد/i, /ابدأ\s+مشروع/i, /أنشئ\s+مشروع/i],
    weak: [],
    weight: 4,
  },
  {
    id: "idea",
    label: "توليد أفكار",
    strong: [/أفكار/i, /فكرة\s+جديدة/i, /اقتراحات/i],
    weak: [/فكرة/i],
    weight: 3,
  },
  {
    id: "help",
    label: "شرح الاستخدام",
    strong: [/كيف\s+أستخدم/i, /ماذا\s+تفعل/i, /ساعدني/i, /help/i],
    weak: [],
    weight: 4,
  },
];

const LABELS: Record<IntentId, string> = Object.fromEntries(
  RULES.map((r) => [r.id, r.label]),
) as Record<IntentId, string>;

LABELS.unknown = "طلب عام";

/** Pulls the subject noun phrase out of the request. */
function extractSubject(text: string): string {
  const patterns = [
    /(?:فيديو|بحث|تحليل|موضوع|هاشتاغ)\s+(?:عن|حول|بخصوص)\s+["«]?([^»"؟.!\n]{2,60})/,
    /(?:لماذا|كيف|ما\s+الذي\s+jalل)\s+([^\n؟.]{3,60})/,
    /(?:لي|عن|حول)\s+["«]?([^»"؟.!\n]{3,60})/,
    /(?:why|how|what|about)\s+([a-zA-Z0-9\s"'.]{3,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim().replace(/^["'«]\s*|\s*["'»]$/g, "").slice(0, 70);
  }
  return text.trim().split(/[؟.!\n]/)[0]?.slice(0, 70) ?? "";
}

export function classifyIntent(raw: string): Intent {
  const text = raw.trim();
  const scores = new Map<IntentId, number>();

  for (const rule of RULES) {
    let score = 0;
    for (const p of rule.strong) if (p.test(text)) score += rule.weight;
    for (const p of rule.weak) if (p.test(text)) score += 1;
    if (score > 0) scores.set(rule.id, score);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const total = ranked.reduce((s, [, v]) => s + v, 0);

  if (!top) {
    return {
      id: "unknown",
      label: LABELS.unknown,
      confidence: 0.2,
      subject: extractSubject(text),
      alternatives: [],
    };
  }

  return {
    id: top[0],
    label: LABELS[top[0]],
    confidence: Math.min(0.98, 0.45 + (top[1] / Math.max(total, 1)) * 0.5),
    subject: extractSubject(text),
    alternatives: ranked.slice(1, 3).map(([id, v]) => ({ id, label: LABELS[id], score: v })),
  };
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export type StepKind = "tool" | "ai" | "local";

export interface PlanStep {
  id: string;
  label: string;
  /** Why this step exists. Always shown — the AI must explain itself. */
  why: string;
  kind: StepKind;
  tool: string | null;
}

export interface Plan {
  intent: Intent;
  steps: PlanStep[];
  /** What the user gets at the end. */
  outcome: string;
}

const PLANS: Record<IntentId, Omit<Plan, "intent" | "steps"> & { steps: PlanStep[] }> = {
  web_research: {
    outcome: "موجز بحث + مصادر + ادعاءات + تناقضات + خط زمني داخل مشروعك",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد نوع المهمة قبل اختيار الأدوات", kind: "local", tool: null },
      { id: "search", label: "البحث عن المصادر", why: "جمع أدلة من مصادر مستقلة", kind: "tool", tool: "search_web" },
      { id: "scrape", label: "استخراج نصوص المصادر", why: "الرابط وحده لا يكفي؛ نحتاج النص للقراءة", kind: "tool", tool: "scrape_page" },
      { id: "analyze", label: "تحليل المصادر", why: "استخراج الادعاءات والأرقام والاقتباسات", kind: "ai", tool: "analyze_source" },
      { id: "claims", label: "مطابقة الأرقام", why: "منع نشر رقم غير دقيق", kind: "local", tool: "fact_check" },
      { id: "contradictions", label: "كشف التناقضات", why: "إظهار الاختلاف بدل إخفاءه", kind: "local", tool: "detect_contradiction" },
      { id: "timeline", label: "بناء الخط الزمني", why: "ترتيب الأحداث وربطها بمصادرها", kind: "local", tool: "build_timeline" },
      { id: "brief", label: "كتابة موجز البحث", why: "تثبيت النتائج قبل الانتقال للكتابة", kind: "ai", tool: "synthesize" },
    ],
  },
  video_research: {
    outcome: "قائمة فيديوهات محلّلة + بنية + خطّافات + مواضيع متكررة",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد ما نبحث عنه في YouTube", kind: "local", tool: null },
      { id: "search", label: "بحث YouTube", why: "جمع الفيديوهات المرتبطة بالموضوع", kind: "tool", tool: "youtube_search" },
      { id: "analyze", label: "تحليل البنية", why: "الخطّاف والبنية والدعوة لكل فيديو", kind: "ai", tool: "analyze_video" },
      { id: "gaps", label: "استخراج الفجوات", why: "ما الذي لم يتكلم فيه أحد", kind: "local", tool: "find_gaps" },
    ],
  },
  competitor: {
    outcome: "ملف منافس + أنماط الخطّافات + فجوات المحتوى",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد القناة المقارنة", kind: "local", tool: null },
      { id: "channel", label: "جلب بيانات القناة", why: "الحجم وتيرة النشر والمواضيع", kind: "tool", tool: "youtube_channel" },
      { id: "videos", label: "أعلى الفيديوهات", why: "الأنماط تظهر في ما نجح لا في ما فشل", kind: "tool", tool: "youtube_videos" },
      { id: "analyze", label: "تحليل الأنماط", why: "خطّافات، صيغ، عناوين، ثامبنيل", kind: "ai", tool: "analyze_competitor" },
      { id: "gaps", label: "حساب الفجوات", why: "البيانات فقط — بدون حكم على من هو أفضل", kind: "local", tool: "find_gaps" },
    ],
  },
  transcript: {
    outcome: "نص مفهرس + ملخص + نقاط + اقتباسات + تحليل البنية",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد الفيديو المستهدف", kind: "local", tool: null },
      { id: "fetch", label: "استخراج النص", why: "التفريغ النصي هو الأساس", kind: "tool", tool: "transcribe_video" },
      { id: "analyze", label: "تحليل المحتوى", why: "خطّاف، بنية، حجج، دعوة", kind: "ai", tool: "analyze_transcript" },
    ],
  },
  script: {
    outcome: "هيكل + سكربت مكتوب + مشاهد مقترحة",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "قراءة سياق المشروع أولًا", kind: "local", tool: null },
      { id: "context", label: "جمع سياق المشروع", why: "لا نكتب خارج ما هو موثّق", kind: "local", tool: "read_project" },
      { id: "structure", label: "اختيار الهيكل", why: "الهيكل يُختار حسب الموضوع لا يُفرض", kind: "ai", tool: "choose_structure" },
      { id: "write", label: "كتابة السكربت", why: "كتابة المشاهد والسرد", kind: "ai", tool: "generate_script" },
      { id: "visuals", label: "اقتراح المشاهد", why: "لكل فقرة suggestion مرئي", kind: "ai", tool: "generate_visuals" },
      { id: "check", label: "فحص الأرقام", why: "كل رقم يجب أن يعود لمصدر", kind: "local", tool: "fact_check" },
    ],
  },
  hook: {
    outcome: "ثلاثة خطوطّاف مرتّبة حسب قوتها",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد موضوع الخطّاف", kind: "local", tool: null },
      { id: "context", label: "قراءة الأرقام المتاحة", why: "الخطّاف لا يجوز أن يخترع رقمًا", kind: "local", tool: "read_project" },
      { id: "write", label: "كتابة الخيارات", why: "توليد بدائل ثم ترتيبها", kind: "ai", tool: "generate_hook" },
      { id: "check", label: "فحص الأرقام", why: "كل رقم يجب أن يعود لمصدر", kind: "local", tool: "fact_check" },
    ],
  },
  titles: {
    outcome: "عناوين مرتّبة مع الزاوية المستخدمة",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد موضوع العناوين", kind: "local", tool: null },
      { id: "context", label: "قراءة سياق المشروع", why: "العنوان يوعد بما سيستلمه المشاهد", kind: "local", tool: "read_project" },
      { id: "write", label: "توليد العناوين", why: "تنويع الزوايا لا تنويع الكلمات", kind: "ai", tool: "generate_titles" },
    ],
  },
  shorts: {
    outcome: "شورتس كاملة: خطّاف، جسم، نهاية، دعوة، عنوان، هاشتاغ",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد المصدر", kind: "local", tool: null },
      { id: "context", label: "قراءة السكربت", why: "الاستخراج يبدأ من أقوى لحظات النص", kind: "local", tool: "read_script" },
      { id: "extract", label: "استخراج الأقوى", why: "اختيار المقاطع الأكثر اكتفاءً بذاتها", kind: "ai", tool: "generate_shorts" },
    ],
  },
  thumbnails: {
    outcome: "مفاهيم مصغّرات مع نص وتوجيه بصري",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "تحديد موضوع المفهوم", kind: "local", tool: null },
      { id: "context", label: "قراءة المشروع", why: "المفهوم يخدم زاوية محددة", kind: "local", tool: "read_project" },
      { id: "write", label: "توليد المفاهيم", why: "توجيه بصري قابل للتنفيذ", kind: "ai", tool: "generate_thumbnails" },
    ],
  },
  fact_check: {
    outcome: "كل ادعاء بحالته ومصادره وما يحتاج تحقق",
    steps: [
      { id: "plan", label: "فهم النطاق", why: "تحديد ما نتحقق منه", kind: "local", tool: null },
      { id: "extract", label: "استخراج الادعاءات", why: "تحديد ما يمكن التحقق منه", kind: "local", tool: "extract_claims" },
      { id: "match", label: "مطابقة المصادر", why: "مقارنة كل رقم بمصدره", kind: "local", tool: "match_sources" },
      { id: "report", label: "كتابة التقرير", why: "تمييز المؤكد عن غير المؤكد", kind: "ai", tool: "fact_check" },
    ],
  },
  project: {
    outcome: "مشروع جديد بمراحله جاهزة",
    steps: [
      { id: "plan", label: "فهم الفكرة", why: "تحديد العنوان والفرضية", kind: "local", tool: null },
      { id: "create", label: "إنشاء مساحة العمل", why: "كل مشروع مستقل بسياقه الخاص", kind: "local", tool: "create_project" },
    ],
  },
  idea: {
    outcome: "أفكار مرتبطة بمحتواك الحالي",
    steps: [
      { id: "plan", label: "فهم المجال", why: "تحديد نوع الأفكار المطلوبة", kind: "local", tool: null },
      { id: "context", label: "قراءة الذاكرة والمشاريع", why: "الأفكار الجيدة تستمر من حيث توقفت", kind: "local", tool: "read_memory" },
      { id: "generate", label: "توليد الأفكار", why: "تنويع الزوايا لا تنويع الصياغة", kind: "ai", tool: "generate_ideas" },
    ],
  },
  help: {
    outcome: "شرح مباشر لما ينفّذه النظام",
    steps: [
      { id: "plan", label: "فهم السؤال", why: "تحديد ما يحتاج شرحًا", kind: "local", tool: null },
      { id: "answer", label: "الإجابة", why: "شرح مختصر مع أمثلة", kind: "ai", tool: "answer" },
    ],
  },
  unknown: {
    outcome: "فهم الطلب ثم اقتراح أفضل مسار",
    steps: [
      { id: "plan", label: "فهم الطلب", why: "الطلب غير محدد — نبدأ بالفهم", kind: "local", tool: null },
      { id: "ask", label: "توضيح النية", why: "سؤال واحد فقط لا lebih", kind: "local", tool: null },
    ],
  },
};

export function planFor(intent: Intent): Plan {
  const base = PLANS[intent.id] ?? PLANS.unknown;
  return { intent, steps: base.steps, outcome: base.outcome };
}

// ---------------------------------------------------------------------------
// Rotating examples shown in the Command Center input
// ---------------------------------------------------------------------------

export const COMMAND_EXAMPLES = [
  "ابحث لي عن قصة سقوط شركة كسبت 240 مليونًا",
  "حلل لي هذا الفيديو واستخرج أهم أفكاره",
  "حوّل هذه الفكرة إلى فيديو كامل",
  "قارن بين قناتين واستخرج فجوات المحتوى",
  "اكتب لي Hook قوي لبداية الفيديو",
];

export const QUICK_INTENTS: { id: IntentId; label: string; hint: string; example: string }[] = [
  { id: "web_research", label: "بحث عميق", hint: "مصادر + أدلة + تناقضات", example: COMMAND_EXAMPLES[0] },
  { id: "video_research", label: "بحث YouTube", hint: "بنية + خطّافات", example: COMMAND_EXAMPLES[1] },
  { id: "script", label: "اكتب سكربت", hint: "هيكل + مشاهد", example: COMMAND_EXAMPLES[2] },
  { id: "competitor", label: "حلّل منافسًا", hint: "أنماط + فجوات", example: COMMAND_EXAMPLES[3] },
  { id: "hook", label: "خطّاف قوي", hint: "٣ خيارات مرتّبة", example: COMMAND_EXAMPLES[4] },
];
