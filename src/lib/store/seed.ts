import type { AppState } from "./provider";
import { DEFAULT_SETTINGS } from "./provider";
import { DEFAULT_SCRIPT_BEATS, type IntegrationState } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Demo dataset.
 *
 * Everything here is fictional — the company, the people, the numbers — so the
 * product can be explored in full without a single API key and without any risk
 * of presenting invented claims as facts. Every row carries `isDemo: true` and
 * the UI labels it as such.
 *
 * Story: the collapse of "Vexa", a fictional hardware startup. It is chosen
 * because it exercises every hard feature: conflicting numbers, a sourced
 * timeline, an entity graph, competitor gaps and a half-written script.
 */

const T = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();

const p1 = "prj_vexa";
const p2 = "prj_cities";
const p3 = "prj_memory";

export function buildDemoState(): AppState {
  const s1 = "src_vexa_a";
  const s2 = "src_vexa_b";
  const s3 = "src_vexa_c";
  const s4 = "src_vexa_d";
  const s5 = "src_vexa_e";
  const s6 = "src_vexa_f";
  const cl1 = "clm_1";
  const cl2 = "clm_2";
  const cl3 = "clm_3";
  const cl4 = "clm_4";
  const en1 = "ent_vexa";
  const en2 = "ent_ran";
  const en3 = "ent_lena";
  const en4 = "ent_inv";
  const en5 = "ent_prof";
  const scr1 = "scr_vexa";

  const integrationState: IntegrationState[] = [];

  return {
    // ---------------------------------------------------------------- Projects
    projects: [
      {
        id: p1,
        title: "لماذا انهارت Vexa",
        premise:
          "شركة عتاده استهلكت 240 مليون دولار خلال 7 سنوات ثم اختفت. أريد فيديو يشرح ما الذي كسرها فعلًا — ليس القصة الرسمية.",
        status: "writing",
        stage: "script",
        progress: 62,
        audience: "رياديو ومستثمرون",
        contentType: "فيديو تحليلي 12 دقيقة",
        targetDurationSec: 720,
        createdAt: T(11),
        updatedAt: T(0),
        deletedAt: null,
        isDemo: true,
      },
      {
        id: p2,
        title: "مدن تختفي من الخريطة",
        premise: "لماذا تختفي مدن بأكملها خلال أقل من عقدين، وما الذي تكرر فيها.",
        status: "research",
        stage: "research",
        progress: 34,
        audience: "جغرافيا وتاريخ",
        contentType: "فيديو وثائقي 15 دقيقة",
        targetDurationSec: 900,
        createdAt: T(4),
        updatedAt: T(1),
        deletedAt: null,
        isDemo: true,
      },
      {
        id: p3,
        title: "كيف تتعلّم من الفاشلة",
        premise: "مقارنة بين ثلاث قنوات: ما الذي تعلّمه صانع محتوى من القناة التي فشلت.",
        status: "idea",
        stage: "idea",
        progress: 8,
        audience: "صنّاع المحتوى",
        contentType: "تحليل 10 دقائق",
        targetDurationSec: 600,
        createdAt: T(2),
        updatedAt: T(2),
        deletedAt: null,
        isDemo: true,
      },
    ],

    projectNotes: [
      {
        id: uid("note"),
        projectId: p1,
        body:
          "ملاحظة من مراجعة المصدر الثالث: الرقم 240 مليون يشمل جولة 2022. لا تدمجه مع 185 مليون في التقرير السنوي 2021 — الأرقام لنفس الفترة أم لا؟",
        createdAt: T(1),
        updatedAt: T(1),
      },
    ],

    // ------------------------------------------------------------------ Ideas
    ideas: [
      {
        id: uid("idea"),
        title: "الشركات التي كسبت الجولة الأخيرة ثم سقطت",
        topic: "ريادة الأعمال",
        angle: "قائمة قصيرة بنمط متكرر",
        potentialHook: "ثلاث شركات. نفس الجولة. نفس الخطأ.",
        status: "researching",
        notes: "يمكن ربطها بمشروع Vexa كمقدمة.",
        projectId: p1,
        createdAt: T(6),
        updatedAt: T(2),
        isDemo: true,
      },
      {
        id: uid("idea"),
        title: "لماذا أطول الفيديوهات الناجحة ليست الأطول",
        topic: "صناعة المحتوى",
        angle: "تحليل إحصائي",
        potentialHook: "الطول ليس السبب.",
        status: "idea",
        notes: "",
        projectId: null,
        createdAt: T(3),
        updatedAt: T(3),
        isDemo: true,
      },
      {
        id: uid("idea"),
        title: "خريطة المدن المهجورة في العالم العربي",
        topic: "جغرافيا",
        angle: "قائمة مرئية",
        potentialHook: "قرية كاملة خلت قبل عشرين سنة.",
        status: "idea",
        notes: "تحتاج مصادر بصرية.",
        projectId: p2,
        createdAt: T(4),
        updatedAt: T(4),
        isDemo: true,
      },
    ],

    // --------------------------------------------------------------- Research
    researchBriefs: [
      {
        id: uid("brf"),
        projectId: p1,
        topic: "انهيار شركة Vexa للتقنية",
        mainQuestion: "ما الذي كسر Vexa فعليًا خلال 24 شهرًا قبل إفلاسها؟",
        subQuestions: [
          "كم خسرت Vexa في كل ربع، ولماذا تضاعف الخسارة؟",
          "ما دور التوسع في أسواق لم يختبرها المنتج فيها؟",
          "هل كانت رواية المؤسسين عن السوق حقيقية، أم بناء سردي مصمّم بعناية؟",
          "من التدقيق المالي، وما الذي لم يُقال علنًا؟",
        ],
        researchGoal: "تقديم تحليل مالي وسلوكي دقيق لا يكرّر الرواية الرسمية.",
        targetAudience: "رياديو ومستثمرون",
        contentType: "فيديو تحليلي 12 دقيقة",
        suggestedAngles: [
          {
            id: uid("ang"),
            title: "الاحتياطي الهامشي",
            thesis: "كل ربع مبيعات كانت مدعومة بانفاق تسويقي أعلى — والحلقة كسرت في 2023.",
            rationale: "الأرقام في التقارير الربعية تسمح باشتقاق هذا مباشرة بدل التكرار.",
            risk: "يحتاج التحقق من صحة قوائم الدخل قبل العرض.",
            selected: true,
          },
          {
            id: uid("ang"),
            title: "التوسع المبكر",
            thesis: "دخلت سوق أوروبي قبل إثبات المنتج في السوق المحلي.",
            rationale: "موجود في المصادر المتاحة، والمسار الزمني لهذا القرار واضح.",
            risk: "قد يكون قرارًا صحيحًا تجاريًا — تأطيره كملاحظة لا كنقد.",
            selected: true,
          },
          {
            id: uid("ang"),
            title: "فجوة التوقعات",
            thesis: "العرض للمستثمرين تجاوز ما\Supportته الأرقام.",
            rationale: "قابل للتحقق من وثائق الجولة.",
            risk: "يحتاج مستندًا أوليًا غير منشور.",
            selected: false,
          },
        ],
        createdAt: T(10),
        updatedAt: T(1),
      },
    ],

    sources: [
      {
        id: s1,
        projectId: p1,
        researchSessionId: null,
        title: "Vexa submits its third consecutive quarterly loss filing",
        url: "https://example-newswire.test/vexa-third-loss",
        domain: "example-newswire.test",
        sourceType: "news",
        publishedAt: "2024-02-11",
        credibility: "high",
        summary:
          "يصف 제출 الخسارة للربع الثالث، ويذكر تراجع الإيرادات 34% عن الربع السابق مع ثبات الإنفاق التسويقي تقريبًا.",
        quotes: [
          { id: uid("q"), text: "reported a 34% sequential decline in revenue while marketing spend held flat", locator: "¶3" },
        ],
        extractedFacts: [
          "تراجع إيرادات 34% ربعًا على ربع",
          "الإنفاق التسويقي ثابت تقريبًا",
          "الخسارة الثالثة على التوالي",
        ],
        savedAt: T(9),
        isDemo: true,
      },
      {
        id: s2,
        projectId: p1,
        researchSessionId: null,
        title: "Vexa FY2021 annual report — consolidated figures",
        url: "https://example-filings.test/vexa/fy2021",
        domain: "example-filings.test",
        sourceType: "report",
        publishedAt: "2022-03-30",
        credibility: "high",
        summary:
          "التقرير السنوي يذكر إجمالي الإيرادات 185 مليون دولار وصافي خسارة 61 مليونًا. الأرقام مدقّقة.",
        quotes: [
          { id: uid("q"), text: "Total revenue for fiscal 2021: $185M. Net loss: $61M.", locator: "p.12" },
        ],
        extractedFacts: [
          "إيرادات 2021 = 185 مليون دولار",
          "صافي خسارة 2021 = 61 مليون دولار",
        ],
        savedAt: T(9),
        isDemo: true,
      },
      {
        id: s3,
        projectId: p1,
        researchSessionId: null,
        title: "Inside the Vexa Series D: what the term sheet said",
        url: "https://example-startup.test/vexa-series-d",
        domain: "example-startup.test",
        sourceType: "blog",
        publishedAt: "2022-09-15",
        credibility: "medium",
        summary:
          "مقال عن وثائق جولة التمويل. يذكر أن إجمالي التمويل التراكمي وصل 240 مليون دولار عبر أربع جولات، بينما يذكر التقرير السنوي المدقق رقمًا مختلفًا تمامًا (إيراد 185 مليون).",
        quotes: [
          { id: uid("q"), text: "bringing total funding to $240M across four rounds", locator: "¶2" },
        ],
        extractedFacts: [
          "إجمالي التمويل = 240 مليون دولار",
          "أربع جولات تمويل",
        ],
        savedAt: T(8),
        isDemo: true,
      },
      {
        id: s4,
        projectId: p1,
        researchSessionId: null,
        title: "CEO steps down as Vexa restructures European operations",
        url: "https://example-newswire.test/vexa-ceo-departure",
        domain: "example-newswire.test",
        sourceType: "news",
        publishedAt: "2023-11-02",
        credibility: "high",
        summary:
          "استقالة المؤسس والرئيس التنفيذي مع إعادة هيكلة العمليات الأوروبية. يذكر تسريح 240 موظفًا.",
        quotes: [{ id: uid("q"), text: "approximately 240 roles were eliminated in the restructuring", locator: "¶5" }],
        extractedFacts: ["استقالة المؤسس", "تسريح ~240 موظفًا", "إعادة هيكلة أوروبا"],
        savedAt: T(7),
        isDemo: true,
      },
      {
        id: s5,
        projectId: p1,
        researchSessionId: null,
        title: "Thread: ex-employees on Vexa's European launch",
        url: "https://example-forum.test/t/vexa-eu-2019",
        domain: "example-forum.test",
        sourceType: "forum",
        publishedAt: "2019-08-20",
        credibility: "low",
        summary:
          "منشور لموظفين سابقين يذكر أن المنتج لم يُختبر في السوق الأوروبي قبل الإطلاق. شهادات فردية — تحتاج تأكيدًا مستقلًا.",
        quotes: [
          { id: uid("q"), text: "we shipped EU two months after the internal go decision, with no local testing", locator: "#14" },
        ],
        extractedFacts: ["الإطلاق الأوروبي بعد شهرين من القرار الداخلي", "لا يوجد اختبار محلي"],
        savedAt: T(6),
        isDemo: true,
      },
      {
        id: s6,
        projectId: p1,
        researchSessionId: null,
        title: "Vexa bankruptcy filing lists creditor claims",
        url: "https://example-filings.test/vexa/bankruptcy",
        domain: "example-filings.test",
        sourceType: "official",
        publishedAt: "2024-06-28",
        credibility: "high",
        summary:
          "ملف الإفلاس الرسمي. يذكر إجمالي المطالبات 96 مليون دولار وأصولًا متبقية 31 مليونًا.",
        quotes: [{ id: uid("q"), text: "Total creditor claims: $96M. Estimated recoverable assets: $31M.", locator: "p.4" }],
        extractedFacts: ["مطالبات دائنين = 96 مليون", "أصول قابلة للاسترداد = 31 مليون", "نسبة التغطية ~32%"],
        savedAt: T(5),
        isDemo: true,
      },
    ],

    claims: [
      {
        id: cl1,
        projectId: p1,
        text: "إجمالي تمويل Vexa التراكمي بلغ 240 مليون دولار",
        kind: "number",
        value: 240,
        unit: "USD million",
        status: "unclear",
        sourceIds: [s3],
        resolution:
          "240 مليون يشمل جولة 2022؛ 185 مليون هو إيراد 2021 لا تمويل. الرقم 240 صحيح كتمويل تراكمي لكنه يُخلط مع الإيراد في بعض الروايات.",
        createdAt: T(8),
      },
      {
        id: cl2,
        projectId: p1,
        text: "إيرادات Vexa في 2021 بلغت 185 مليون دولار",
        kind: "number",
        value: 185,
        unit: "USD million",
        status: "supported",
        sourceIds: [s2],
        resolution: "من التقرير السنوي المدقق — مصدر واحد، لكن من الدرجة الأعلى.",
        createdAt: T(8),
      },
      {
        id: cl3,
        projectId: p1,
        text: "تراجع الإيرادات 34% في الربع الثالث",
        kind: "number",
        value: 34,
        unit: "percent",
        status: "supported",
        sourceIds: [s1],
        resolution: "مصدر إخباري واحد. يحتاج تأكيدًا من قائمة الدخل.",
        createdAt: T(7),
      },
      {
        id: cl4,
        projectId: p1,
        text: "الإطلاق الأوروبي سبق أي اختبار للسوق المحلي",
        kind: "fact",
        value: null,
        unit: null,
        status: "needs_verification",
        sourceIds: [s5],
        resolution: "شهادات موظفين سابقين فقط — مصدر واحد منخفض الدرجة. لا يُعرض كحقيقة في الفيديو.",
        createdAt: T(6),
      },
    ],

    contradictions: [
      {
        id: uid("con"),
        projectId: p1,
        claimIds: [cl1, cl2],
        summary: "الرقمان 240 مليون و185 مليون يظهران أحيانًا وكأنهما نفس القيمة.",
        whatDiffers:
          "240 مليون هو إجمالي التمويل التراكمي عبر أربع جولات. 185 مليون هو إيرادات السنة المالية 2021. مصدران يذكران رقمين مختلفين عن شيء مختلف تمامًا.",
        whyItMayDiffer:
          "الخلط شائع لأن التقرير السنوي ووثيقة الجولة يغطيان نفس الفترة الزمنية تقريبًا، وبعض التغطيات نقلت رقم التمويل بدل رقم الإيراد.",
        recommendedValue: "الاعتماد على كلا الرقمين مع توضيح طبيعة كل منهما",
        recommendedReason:
          "لا يوجد تعارض فعلي. التوضيح في السكربت يحل المشكلة بدون حذف أي رقم.",
        severity: "medium",
        resolved: false,
      },
    ],

    // ------------------------------------------------------- Timeline & graph
    events: [
      {
        id: uid("evt"),
        projectId: p1,
        date: "2017-03-14",
        datePrecision: "day",
        title: "تأسيس Vexa",
        description: "تأسيس الشركة في مدينة تقنية على يد المؤسسين الثلاثة.",
        entityIds: [en1, en2, en3],
        sourceIds: [s2],
        confidence: 0.9,
        createdAt: T(10),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2019-06-01",
        datePrecision: "month",
        title: "الإطلاق الأوروبي المبكر",
        description: "إطلاق المنتج في ثلاثة أسواق أوروبية بعد قرار داخلي بضغط المواعيد.",
        entityIds: [en1],
        sourceIds: [s5],
        confidence: 0.55,
        createdAt: T(10),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2021-12-31",
        datePrecision: "day",
        title: "ذروة الإيرادات: 185 مليون",
        description: "أعلى إيراد سنوي مسجّل، مع خسارة صافية 61 مليونًا.",
        entityIds: [en1],
        sourceIds: [s2],
        confidence: 0.95,
        createdAt: T(9),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2022-09-15",
        datePrecision: "day",
        title: "جولة التمويل D",
        description: "رابع جولة تمويل، ترفع الإجمالي التراكمي إلى 240 مليون دولار.",
        entityIds: [en1, en4],
        sourceIds: [s3],
        confidence: 0.7,
        createdAt: T(8),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2023-11-02",
        datePrecision: "day",
        title: "استقالة المؤسس وإعادة الهيكلة",
        description: "استقالة المؤسس والرئيس التنفيذي، وتسريح نحو 240 موظفًا في إعادة هيكلة العمليات.",
        entityIds: [en1, en2, en3],
        sourceIds: [s4],
        confidence: 0.9,
        createdAt: T(7),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2024-02-11",
        datePrecision: "day",
        title: "الخسارة الثالثة على التوالي",
        description: "تراجع الإيرادات 34% عن الربع السابق مع ثبات الإنفاق التسويقي.",
        entityIds: [en1],
        sourceIds: [s1],
        confidence: 0.85,
        createdAt: T(6),
      },
      {
        id: uid("evt"),
        projectId: p1,
        date: "2024-06-28",
        datePrecision: "day",
        title: "ملف الإفلاس",
        description: "مطالبات دائنين 96 مليون دولار مقابل أصول قابلة للاسترداد 31 مليونًا.",
        entityIds: [en1, en4, en5],
        sourceIds: [s6],
        confidence: 0.98,
        createdAt: T(5),
      },
    ],

    entities: [
      { id: en1, projectId: p1, name: "Vexa", type: "company", role: "الشركة موضوع الفيديو", description: "شركة عتاد استهلاهي أُسست 2017 وأفلست 2024.", sourceIds: [s2, s6] },
      { id: en2, projectId: p1, name: "Rami Haddad", type: "person", role: "المؤسس والرئيس التنفيذي", description: "انسحب في نوفمبر 2023.", sourceIds: [s4] },
      { id: en3, projectId: p1, name: "Lena Fischer", type: "person", role: "شريكة التأسيس — التقنية", description: "غادرت الشركة قبل الإفلاس بسنتين.", sourceIds: [s2] },
      { id: en4, projectId: p1, name: "Northline Capital", type: "company", role: "المستثمر الرئيسي في الجولة D", description: "استثمر في الجولة الأخيرة قبل الإفلاس.", sourceIds: [s3, s6] },
      { id: en5, projectId: p1, name: "صندوق الإفلاس العام", type: "event", role: "جهة الملف القانوني", description: "أدار ملف الإفلاس ومطالبات الدائنين.", sourceIds: [s6] },
    ],

    entityEdges: [
      { id: uid("edg"), projectId: p1, fromId: en1, toId: en2, relation: "أسّسها", evidence: "استقالة المؤسس مذكورة في التغطية الرسمية.", sourceIds: [s4] },
      { id: uid("edg"), projectId: p1, fromId: en1, toId: en3, relation: "أسّسها", evidence: "شريكة تأسيس.", sourceIds: [s2] },
      { id: uid("edg"), projectId: p1, fromId: en4, toId: en1, relation: "استثمر في", evidence: "الجولة D بقيمة إجمالية 240 مليون.", sourceIds: [s3] },
      { id: uid("edg"), projectId: p1, fromId: en1, toId: en5, relation: "خضعت لملف", evidence: "مطالبات 96 مليون مقابل أصول 31 مليون.", sourceIds: [s6] },
    ],

    // ------------------------------------------------------- YouTube & comps
    videos: [
      {
        id: uid("vid"),
        projectId: p1,
        channelId: "UC_demo_1",
        channelName: "قناة التحليل الاقتصادي",
        channelUrl: "https://example-yt.test/@econ",
        youtubeId: "demoVid001",
        url: "https://example-yt.test/watch?v=demoVid001",
        title: "لماذا انهارت شركة ناشئة كسبت 300 مليون",
        description: "تحليل لسببية الإفلاس.",
        thumbnailUrl: "",
        views: 1840000,
        likes: 92000,
        comments: 8100,
        durationSec: 1140,
        publishedAt: "2024-08-11",
        topic: "ريادة الأعمال",
        structure: {
          hook: "ثلاثمئة مليون دولار. سبع سنوات. لا يتبقى منها ورقة.",
          hookScore: 88,
          mainArguments: [
            "التمويل أخّر المشكلة بدل أن يحلها",
            "التوسع قبل التحقق من المنتج",
            "غياب المؤشرات المبكرة",
          ],
          structurePattern: "قصة ← أرقام ← نمط ← درس",
          beats: [
            { atSec: 0, label: "الخطّاف", note: "سؤال مباشر بالمبلغ" },
            { atSec: 25, label: "المشهد الافتتاحي", note: "لقطة للمستودع المغلق" },
            { atSec: 90, label: "الخط الزمني", note: "سبع سنوات في 60 ثانية" },
            { atSec: 300, label: "التحليل المالي", note: "رسم بياني للإيرادات" },
            { atSec: 780, label: "الدرس", note: "ثلاث قواعد قابلة للتطبيق" },
            { atSec: 1100, label: "الخاتمة", note: "دعوة للاشتراك" },
          ],
          cta: "اشترك وشارك القصة التي يجب أن تُروى",
          retentionNotes: ["الانتقال من الخطّاف للقصة خلال 25 ثانية", "لا يقطع المونتاج إلا عند تغيّر الفكرة"],
        },
        isDemo: true,
      },
      {
        id: uid("vid"),
        projectId: p1,
        channelId: "UC_demo_2",
        channelName: "مختبر المؤسسين",
        channelUrl: "https://example-yt.test/@founders",
        youtubeId: "demoVid002",
        url: "https://example-yt.test/watch?v=demoVid002",
        title: "3 أخطاء قاتلة في الجولة الثالثة",
        description: "نصائح عملية من مؤسسين.",
        thumbnailUrl: "",
        views: 640000,
        likes: 41000,
        comments: 3200,
        durationSec: 620,
        publishedAt: "2024-09-02",
        topic: "ريادة الأعمال",
        structure: {
          hook: "الجولة الثالثة هي أخطر جولة في حياتك.",
          hookScore: 81,
          mainArguments: ["التقييم المبالغ فيه", "حرق رأس المال بسرعة", "فريق بلا وظائف متقاطعة"],
          structurePattern: "قائمة مرقّمة",
          beats: [
            { atSec: 0, label: "الخطّاف", note: "تحذير مباشر" },
            { atSec: 20, label: "الخطأ 1", note: "مثال واقعي" },
            { atSec: 200, label: "الخطأ 2", note: "مثال واقعي" },
            { atSec: 380, label: "الخطأ 3", note: "مثال واقعي" },
          ],
          cta: "راسلني إذا بدأت جولتك الثالثة",
          retentionNotes: ["بنية واضحة تسمح بالقفزة", "مثال في كل خطأ"],
        },
        isDemo: true,
      },
    ],

    competitors: [
      {
        id: uid("cmp"),
        projectId: p1,
        name: "قناة التحليل الاقتصادي",
        handle: "@econ",
        channelUrl: "https://example-yt.test/@econ",
        subscribers: 1840000,
        postingFrequencyPerWeek: 1.2,
        topics: ["ريادة الأعمال", "اقتصاد", "حالات شركة"],
        recurringThemes: ["لماذا انهارت", "أرقام مخفية", "قرار واحد خاطئ"],
        hookPatterns: ["المبلغ أولًا ثم السؤال", "سؤال مباشر بالمبلغ", "جملة صادمة في 5 كلمات"],
        thumbnailPatterns: ["وجه متفاجئ", "رقم أضخم", "سهم أحمر هابط"],
        formats: ["فيديو تحليلي 12-20 دقيقة", "ملخص 6 دقائق"],
        topVideos: [
          { youtubeId: "demoVid001", title: "لماذا انهارت شركة ناشئة كسبت 300 مليون", views: 1840000, publishedAt: "2024-08-11", hook: "ثلاثمئة مليون. سبع سنوات. لا يتبقى منها ورقة.", url: "https://example-yt.test/watch?v=demoVid001" },
          { youtubeId: "demoVid010", title: "أكثر 5 أرقام كاذبة في تقارير الشركات", views: 940000, publishedAt: "2024-06-19", hook: "هذه الأرقام تجعلك تعتقد أنك تعرف أكثر مما تعرف.", url: "https://example-yt.test/watch?v=demoVid010" },
        ],
        addedAt: T(9),
        isDemo: true,
      },
      {
        id: uid("cmp"),
        projectId: p1,
        name: "مختبر المؤسسين",
        handle: "@founders",
        channelUrl: "https://example-yt.test/@founders",
        subscribers: 612000,
        postingFrequencyPerWeek: 2.4,
        topics: ["ريادة الأعمال", "تمويل", "نصائح"],
        recurringThemes: ["أخطاء", "قوالب", "مباشرة"],
        hookPatterns: ["تحذير مباشر", "قائمة مرقّمة", "سؤال للمشاهد"],
        thumbnailPatterns: ["نص كبير", "رموز تعبيرية", "ألوان صارخة"],
        formats: ["قائمة 8-10 دقائق", "مباشر أسبوعي"],
        topVideos: [
          { youtubeId: "demoVid002", title: "3 أخطاء قاتلة في الجولة الثالثة", views: 640000, publishedAt: "2024-09-02", hook: "الجولة الثالثة هي أخطر جولة في حياتك.", url: "https://example-yt.test/watch?v=demoVid002" },
        ],
        addedAt: T(8),
        isDemo: true,
      },
    ],

    contentGaps: [
      {
        id: uid("gap"),
        projectId: p1,
        topic: "مصادر الدائنين في إفلاس التقنية — من أين تأتي الأرقام",
        evidence:
          "كلا القناتين تتحدث عن الإيرادات ولا تتحدث عن بنية المطالبات. ملف الإفلاس يحوي طبقة تحليل غير مستغلة.",
        coverage: 0,
        opportunityScore: 91,
        recommendedFormat: "فيديو تحليلي 14 دقيقة مع رسم بياني لتدفق المطالبات",
      },
      {
        id: uid("gap"),
        projectId: p1,
        topic: "مقارنة زمنية: كم شهرًا بين الجولة الأخيرة والإفلاس",
        evidence: "القنوات تتكلم عن الجولات، ولا أحد يربطها بالتوقيت. البيانات تسمح بخط زمني واضح.",
        coverage: 0,
        opportunityScore: 84,
        recommendedFormat: "فيديو قصير 8 دقائق بخط زمني متحرك",
      },
    ],

    transcripts: [
      {
        id: uid("trn"),
        projectId: p1,
        videoUrl: "https://example-yt.test/watch?v=demoVid001",
        provider: "demo",
        language: "ar",
        segments: [
          { startSec: 0, endSec: 8, text: "ثلاثمئة مليون دولار. سبع سنوات. ولا يتبقّى منها ورقة واحدة." },
          { startSec: 8, endSec: 24, text: "في هذا الفيديو لن نكرّر القصة الرسمية. سنفعل شيئًا أبسط وأقسى: سنضع الأرقام على الطاولة." },
          { startSec: 24, endSec: 60, text: "أولًا، الخط الزمني. من التأسيس حتى الإفلاس كانت سبع سنوات وأربعة أشهر." },
        ],
        summary:
          "فيديو يربط إفلاس شركة تقنية بثلاثة عوامل: هيكلة الإنفاق، التوسع المبكر، ونقص المؤشرات المبكرة.",
        keyPoints: [
          "التمويل لم يُصلح المشكلة بل أجّل كشفها",
          "التوسع الأوروبي حدث قبل الاختبار",
          "غياب مؤشر نقدي واحد كان سيُنقذ القرار",
        ],
        quotes: [
          "ثلاثمئة مليون دولار. سبع سنوات. ولا يتبقّى منها ورقة واحدة.",
          "سنضع الأرقام على الطاولة.",
        ],
        hook: "ثلاثمئة مليون دولار. سبع سنوات. ولا يتبقّى منها ورقة واحدة.",
        structure: "خطّاف ← تمهيد زمني ← تحليل مالي ← نمط متكرر ← درس ← دعوة",
        arguments: [
          "هيكلة الإنفاق التسويقي الثابت على إيراد متقلّب",
          "التوسع كقرار مواعيد لا كقرار بيانات",
          "غياب المؤشرات المالية المبكرة",
        ],
        cta: "اشترك وشارك القصة التي يجب أن تُروى",
        chapters: [
          { startSec: 0, title: "الخطّاف", summary: "المبلغ والمدة والخلاصة في 20 ثانية" },
          { startSec: 24, title: "الخط الزمني", summary: "سبع سنوات في دقيقة" },
          { startSec: 84, title: "التحليل المالي", summary: "الإيراد مقابل الإنفاق" },
          { startSec: 480, title: "الدرس", summary: "ثلاث قواعد" },
        ],
        createdAt: T(7),
        isDemo: true,
      },
    ],

    // ----------------------------------------------------------------- Script
    scripts: [
      {
        id: scr1,
        projectId: p1,
        title: "لماذا انهارت Vexa — المسودة الأولى",
        structure: {
          name: "تشريح مالي بخطّاف رقمي",
          rationale:
            "المبلغ نفسه هو الخطّاف الأقوى في هذا الموضوع، وجمهورك يستجيب للمقارنة الرقمية. البنية تنتقل من الصدمة إلى التفسير إلى القاعدة القابلة للتطبيق.",
          beats: DEFAULT_SCRIPT_BEATS,
        },
        targetDurationSec: 720,
        tone: "سردي هادئ، واثق، بلا استعراض",
        wordCount: 0,
        status: "draft",
        createdAt: T(6),
        updatedAt: T(0),
        isDemo: true,
      },
    ],

    scriptSections: [
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "hook",
        order: 0,
        narration:
          "مئتا وأربعون مليون دولار. سبع سنوات. ثمّ مستودع فارغ وشركاء لا يردّون. هذه ليست قصة فشل عادية — بل قصة شركة كسبت كل جولة تمويل طلبتها، ثم اختفت. والسؤال الحقيقي ليس: كيف خسرت(Vexa)؟ السؤال هو: كيف بقيت واقفة أربع سنوات بعد أن الأرقام قال لها اعبُد.",
        visual: "لقطة ثابتة لمستودع فارغ، ثم قطع سريع على شعار Vexa يتشقق.",
        broll: "مشهد مستودع + أرشيف صور للشركة",
        onScreenText: "$240M · 7 سنوات · 0",
        sound: "صمت ثم صوت رياح خفيف",
        sourceIds: [s2, s3, s6],
        estimatedSec: 32,
        updatedAt: T(0),
      },
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "context",
        order: 1,
        narration:
          "لتضع الصورة كاملة: Vexa تأسست عام 2017 على يد ثلاثة مؤسسين، وبنيت أجهزة استهلاكية نجحت في سوق واحد بسرعة. بحلول 2021 كانت الإيرادات قدبلغت مئة وخمسة وثمانين مليون دولار — وهي أعلى نقطة وصلتها. في نفس السنة، سجّلت خسارة صافية وواحد وستون مليونًا.",
        visual: "خط زمني أفقي يمتد من 2017.",
        broll: "رسم بياني للإيرادات يرتفع ثم ينحني",
        onScreenText: "2021 · إيرادات $185M · خسارة $61M",
        sound: "موسيقى تصاعدية خافتة",
        sourceIds: [s2],
        estimatedSec: 38,
        updatedAt: T(0),
      },
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "conflict",
        order: 2,
        narration:
          "وهنا يبدأ ما لا تجده في الرواية الرسمية. في الربع الرابع من 2022، تراجعت الإيرادات أربعة وثلاثين بالمئة عن الربع السابق — لكن الإنفاق التسويقي لم يتحرك. وهذا بالضبط هو بيت القصيد: إنفاق ثابت على إيراد يتقلّب. كل شهر إضافي يجعل الحلقة أضيق، والحلقة الأضيق تعني قرارًا أسوأ.",
        visual: "رسم بياني بخطّين: الإيراد ينزل والإنفاق ثابت.",
        broll: "رسم متحرك + مخطط خطّي للأرقام",
        onScreenText: "إيراد -34% · إنفاق ثابت",
        sound: "توتر صوتي متزايد",
        sourceIds: [s1],
        estimatedSec: 46,
        updatedAt: T(0),
      },
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "turn",
        order: 3,
        narration:
          "وفي نوفمبر 2023، استقال المؤسس والرئيس التنفيذي. تلتها إعادة هيكلة إجراءات aksik Hundreds من الموظفين بعد ستة أشهر، ملف الإفلاس: مطالبات دائنين ستة وتسعون مليونًا مقابل أصول تقديرية واحد وثلاثون مليونًا. أي أن كل دولار مطالب به الدائن استُرجع منه نحو 32 سنتًا فقط.",
        visual: "مخططط تدفق: 96 مليون ← 31 مليون",
        broll: "لقطات أرشيفية + مخططط Sankey مبسّط",
        onScreenText: "تغطية الدائنين ≈ 32%",
        sound: "صمت مفاجئ عند ذكر الـ 32%",
        sourceIds: [s4, s6],
        estimatedSec: 41,
        updatedAt: T(0),
      },
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "insight",
        order: 4,
        narration:
          "الدرس ليس أن التمويل سمّم. التمويل أضاف سبعة عشر شهرًا من عمر الشركة — لكنه لم يغيّر المعادلة. القاعدة التي تكررها كل حالة إفلاس تقنية تقريبًا: إذا كان إنفاقك لا ينخفض بنفس سرعة إيرادك، فأنت لا تدير نقدًا؛ أنت تشتري وقتًا مقابل ثمن فادح.",
        visual: "نص على الشاشة: القاعدة، جملة واحدة.",
        broll: "—",
        onScreenText: "إنفاقك لا ينخفض بسرعة إيرادك = أنت تشتري وقتًا",
        sound: "موسيقى هادئة",
        sourceIds: [],
        estimatedSec: 36,
        updatedAt: T(0),
      },
      {
        id: uid("sec"),
        scriptId: scr1,
        beatKey: "cta",
        order: 5,
        narration:
          "إن كانت لديك شركة أو مشروع، اكتب لي في التعليقات ما المؤشر الذي تتابعه شهريًا — المؤشر الذي لو تحوّل إلى الأحمر كان سيُنقذك. اشترك، وسأفكّك حالة إفلاس أخرى الأسبوع prochain بالأرقام نفسها.",
        visual: "لقطة للمضيف + بطاقة الفيديو القادم.",
        broll: "—",
        onScreenText: "ما المؤشر الذي تتابعه؟",
        sound: "خاتمة موسيقية",
        sourceIds: [],
        estimatedSec: 18,
        updatedAt: T(0),
      },
    ],

    shorts: [
      {
        id: uid("srt"),
        projectId: p1,
        scriptId: scr1,
        hook: "مئتان وأربعون مليون دولار. وهذا ما بقي.",
        body: "شركة كسبت أربع جولات تمويل، وحققت أعلى إيراد لها في 2021 بمئة وخمسة وثمانين مليونًا. ثم في 2022 هبط الإيراد 34% والإنفاق التسويقي لم يتحرك.",
        ending: "كل دولار طالب به الدائن استُرجع منه 32 سنتًا فقط.",
        cta: "الفيديو الكامل يشرح الخط الزمني كاملًا.",
        estimatedSec: 48,
        caption: "أربع جولات تمويل، وأعلى إيراد في تاريخها، ثم… #ريادة_الأعمال #تحليل",
        title: "أربع جولات تمويل ولم تنقذها",
        hashtags: ["ريادة_الأعمال", "تحليل_مالي", "قصص_شركات"],
        sourceSectionId: null,
        createdAt: T(0),
      },
    ],

    titleIdeas: [
      {
        id: uid("ttl"),
        projectId: p1,
        text: "مئتان وأربعون مليون دولار… ثم لا شيء",
        angle: "المبلغ أولًا",
        pullScore: 92,
        createdAt: T(0),
      },
      {
        id: uid("ttl"),
        projectId: p1,
        text: "الشركة التي كسبت كل جولة ثم اختفت",
        angle: "المفارقة",
        pullScore: 88,
        createdAt: T(0),
      },
      {
        id: uid("ttl"),
        projectId: p1,
        text: "32 سنتًا: كم استرجع دائنو Vexa فعلًا",
        angle: "رقم مدهش",
        pullScore: 85,
        createdAt: T(0),
      },
    ],

    thumbnailConcepts: [
      {
        id: uid("thb"),
        projectId: p1,
        concept: "مستودع فارغ بإضاءة حادة واحدة",
        textOverlay: "$240M → $0",
        visualDirection: "لقطة واسعة، ضوء جانبي واحد، عربة تسويقية مقلوبة في الزاوية",
        emotion: "إحباط هادئ",
        contrastNote: "النص أبيض سميك على الثلث الأيمن، والرقم باللون الأحمر",
        createdAt: T(0),
      },
    ],

    // -------------------------------------------------------- Conversations
    conversations: [
      {
        id: "conv_vexa",
        projectId: p1,
        title: "لماذا انهارت Vexa",
        createdAt: T(5),
        updatedAt: T(0),
      },
    ],

    messages: [
      {
        id: uid("msg"),
        conversationId: "conv_vexa",
        projectId: p1,
        role: "user",
        content: "ابحث لي لماذا فشلت شركة Vexa",
        intent: "web_research",
        steps: null,
        createdIds: [],
        createdAt: T(5),
      },
      {
        id: uid("msg"),
        conversationId: "conv_vexa",
        projectId: p1,
        role: "assistant",
        content:
          "وجدت ست مصادر موزّعة على سبع سنوات. ثلاث نتائج تستحق انتباهك قبل كتابة أي سكربت:\n\n**أولًا — تناقض رقمي يجب توضيحه:** رقم 240 مليون دولار (إجمالي التمويل التراكمي) يظهر أحيانًا مخلوطًا برقم 185 مليون (إيرادات 2021). ليسا متعارضين — لكن الخلط بينهما ي frequentا في التغطيات. التوصية: اذكر الرقمين مع توضيح طبيعة كل منهما في السكربت بدل حذف أحدهما.\n\n**ثانيًا — نمط قابل للتعميم:** الإنفاق التسويقي بقي ثابتًا بينما هبط الإيراد 34% في 2022. هذا هو المؤشر الذي كان يمكن أن يُطلق الإنذار مبكرًا.\n\n**ثالثًا — ادعاء يحتاج تحققًا:** ادعاء إطلاق المنتج الأوروبي قبل اختباره في السوق المحلي مصدره موظفون سابقون فقط. لم أجد مصدرًا مستقلًا يؤكده، لذلك لم أدرجه كحقيقة — وضعته كـ «يحتاج تحقق».\n\nخط الزمني جاهز بـ 7 أحداث، والكيانات مربوطة. الخطوة التالية المقترحة: اكتب السكربت.",
        intent: "web_research",
        steps: [
          { id: "1", label: "فهم الطلب", why: "تحديد نوع المهمة قبل اختيار الأدوات", status: "done", detail: "بحث ويب حول أسباب إفلاس شركة", toolName: null, startedAt: 0, endedAt: 1, resultCount: 1, error: null },
          { id: "2", label: "البحث عن المصادر", why: "جمع أدلة من مصادر مستقلة", status: "done", detail: "استعلامان: الأرباح، إعادة الهيكلة", toolName: "search_web", startedAt: 1, endedAt: 4, resultCount: 6, error: null },
          { id: "3", label: "تحليل المصادر", why: "استخراج الادعاءات والأرقام والقتباسات", status: "done", detail: "6 مصادر محلّلة", toolName: "analyze_source", startedAt: 4, endedAt: 9, resultCount: 14, error: null },
          { id: "4", label: "كشف التناقضات", why: "منع التكرار من نشر رقم غير دقيق", status: "done", detail: "تناقض واحد يحتاج توضيحًا", toolName: "fact_check", startedAt: 9, endedAt: 11, resultCount: 1, error: null },
          { id: "5", label: "بناء الخط الزمني", why: "ترتيب الأحداث زمنيًا مع ربطها بالمصادر", status: "done", detail: "7 أحداث", toolName: null, startedAt: 11, endedAt: 14, resultCount: 7, error: null },
          { id: "6", label: "كتابة موجز البحث", why: "تثبيت النتائج قبل الانتقال للسكربت", status: "done", detail: "موجز جاهز", toolName: null, startedAt: 14, endedAt: 16, resultCount: 1, error: null },
        ],
        createdIds: [
          { type: "source", id: s1, label: "Vexa submits its third consecutive quarterly loss filing" },
          { type: "event", id: "evt", label: "7 أحداث على الخط الزمني" },
        ],
        createdAt: T(5),
      },
      {
        id: uid("msg"),
        conversationId: "conv_vexa",
        projectId: p1,
        role: "user",
        content: "اكتب لي Hook قوي للبداية",
        intent: "script",
        steps: null,
        createdIds: [],
        createdAt: T(0),
      },
      {
        id: uid("msg"),
        conversationId: "conv_vexa",
        projectId: p1,
        role: "assistant",
        content:
          "الخطّاف الذي كتبته الآن يعتمد على ثلاث حركات: رقم صادم، مدة، ثم استفهام يقلب السؤال المعتاد. يعمل لأن المشاهد يعرف أرقام إفلاس أخرى (300، 500 مليون) فيتساءل لماذا هذه تحديدًا.\n\nتنبيه: تجنّب أي رقم لا يوجد له مصدر في مشروعك. المئتان والأربعون والعشرة أرقام تملكها ومصدرها موثّق. جملة «المئة وخمسة وثمانين» هي إيراد 2021 — لا تدمجها مع التمويل في جملة واحدة.",
        intent: "script",
        steps: [
          { id: "1", label: "قراءة سياق المشروع", why: "الخطّاف يعتمد على ما هو موثّق في مشروعك", status: "done", detail: "6 مصادر · 4 ادعاءات", toolName: "read_project", startedAt: 0, endedAt: 2, resultCount: 10, error: null },
          { id: "2", label: "كتابة الخطّاف", why: "توليد خيارات ثم اختيار الأقوى", status: "done", detail: "3 خيارات", toolName: "generate_script", startedAt: 2, endedAt: 6, resultCount: 3, error: null },
          { id: "3", label: "فحص الأرقام", why: "منع رقم بلا مصدر", status: "done", detail: "كل الأرقام موثّقة", toolName: "fact_check", startedAt: 6, endedAt: 8, resultCount: 0, error: null },
        ],
        createdIds: [],
        createdAt: T(0),
      },
    ],

    // ------------------------------------------------------------------ Tasks
    tasks: [
      {
        id: uid("task"),
        projectId: p1,
        kind: "research",
        title: "تحليل مصادر Vexa",
        status: "done",
        progress: 100,
        step: "اكتمل",
        createdAt: T(5),
        updatedAt: T(5),
        error: null,
      },
      {
        id: uid("task"),
        projectId: p2,
        kind: "research",
        title: "بحث: مدن تختفي من الخريطة",
        status: "failed",
        progress: 45,
        step: "تحليل المصادر",
        createdAt: T(1),
        updatedAt: T(1),
        error: "لم يُرجع مزود البحث أي نتائج. تحقق من مفتاح API أو أعد المحاولة.",
      },
    ],

    // ---------------------------------------------------------------- Memories
    memories: [
      {
        id: uid("mem"),
        category: "writing_style",
        key: "نبرة السرد",
        value: "سردي هادئ. لا صراخ، لا مبالغة. أعطي الرقم ثم اسأل السؤال بدل أن أجيب عنه.",
        enabled: true,
        source: "user",
        createdAt: T(8),
        updatedAt: T(8),
      },
      {
        id: uid("mem"),
        category: "language",
        key: "لغة الكتابة",
        value: "العربية الفصحى المبسّطة. مصطلحات تقنية إنجليزية بين قوسين عند أول ذكر فقط.",
        enabled: true,
        source: "user",
        createdAt: T(8),
        updatedAt: T(8),
      },
      {
        id: uid("mem"),
        category: "audience",
        key: "الجمهور",
        value: "رياديو ومستثمرون. يعرفون المصطلحات لكنهم يريدون السبب لا الوصف.",
        enabled: true,
        source: "inferred",
        createdAt: T(7),
        updatedAt: T(7),
      },
      {
        id: uid("mem"),
        category: "instructions",
        key: "قاعدة الأرقام",
        value: "لا تستخدم أي رقم غير مرتبط بمصدر داخل المشروع. إذا لم يوجد مصدر، احذف الجملة.",
        enabled: true,
        source: "user",
        createdAt: T(6),
        updatedAt: T(6),
      },
      {
        id: uid("mem"),
        category: "structure",
        key: "طول الفيديو",
        value: "الافتراضي 12 دقيقة. لا أنزل تحت 9 دقائق لفيديو تحليلي.",
        enabled: false,
        source: "user",
        createdAt: T(6),
        updatedAt: T(6),
      },
    ],

    // --------------------------------------------------------------- Settings
    settings: {
      ...DEFAULT_SETTINGS,
      displayName: "عبده",
      channelName: "قناة الرؤية",
      contentStyle: "narrator",
      onboardedAt: T(11),
    },

    // ---------------------------------------------------------------- Activity
    activity: [
      { id: uid("act"), at: T(0), what: "ولّد خطّافًا للـ Script", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: "generate_script", outcome: "success", detail: "3 خيارات" },
      { id: uid("act"), at: T(0), what: "أضاف 3 عناوين", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: null, outcome: "success", detail: null },
      { id: uid("act"), at: T(0), what: "أنشأ Short من السكربت", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: null, outcome: "success", detail: "48 ثانية" },
      { id: uid("act"), at: T(1), what: "فشل البحث", projectId: p2, projectTitle: "مدن تختفي من الخريطة", toolName: "search_web", outcome: "failure", detail: "لم يُرجع مزود البحث أي نتائج." },
      { id: uid("act"), at: T(1), what: "حلّل منافسًا جديدًا", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: "youtube_search", outcome: "success", detail: "مختبر المؤسسين" },
      { id: uid("act"), at: T(2), what: "أنشأ مشروعًا", projectId: p3, projectTitle: "كيف تتعلّم من الفاشلة", toolName: null, outcome: "success", detail: null },
      { id: uid("act"), at: T(5), what: "بحث ويب مكتمل", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: "search_web", outcome: "success", detail: "6 مصادر" },
      { id: uid("act"), at: T(5), what: "استخرج تفريغًا نصيًا", projectId: p1, projectTitle: "لماذا انهارت Vexa", toolName: "transcribe_video", outcome: "success", detail: "3 مقاطع" },
    ],

    usage: [
      { id: uid("use"), at: T(5), provider: "demo", capability: "research", inputTokens: 0, outputTokens: 0, calls: 6 },
      { id: uid("use"), at: T(1), provider: "demo", capability: "youtube", inputTokens: 0, outputTokens: 0, calls: 2 },
      { id: uid("use"), at: T(0), provider: "demo", capability: "writing", inputTokens: 0, outputTokens: 0, calls: 3 },
    ],

    integrationState,
  };
}
