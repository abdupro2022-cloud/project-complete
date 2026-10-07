/**
 * ABDO CREATOR OS — Domain model
 *
 * Single source of truth for shapes shared by the client store, the server
 * repositories, the provider layer and the UI. Nothing here imports React or
 * Node built-ins, so it is safe in every runtime.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type ID = string;

/** ISO-8601 timestamp. */
export type Timestamp = string;

export type Locale = "ar" | "en";

// ---------------------------------------------------------------------------
// Pipeline status vocabulary
//
// The content pipeline (Idea → Research → Script → Production → Published) and
// the project status are deliberately different axes: a project is a container,
// a pipeline item is the work inside it.
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = [
  "idea",
  "research",
  "outline",
  "script",
  "production",
  "published",
  "archived",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PROJECT_STATUSES = [
  "idea",
  "research",
  "writing",
  "production",
  "published",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const IDEA_STATUSES = [
  "idea",
  "researching",
  "writing",
  "editing",
  "published",
  "archived",
] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

/** Arabic-first labels. Kept beside the values so the UI never guesses. */
export const PIPELINE_LABELS_AR: Record<PipelineStage, string> = {
  idea: "فكرة",
  research: "بحث",
  outline: "مخطط",
  script: "سكربت",
  production: "إنتاج",
  published: "منشور",
  archived: "مؤرشف",
};

export const IDEA_STATUS_LABELS_AR: Record<IdeaStatus, string> = {
  idea: "فكرة",
  researching: "قيد البحث",
  writing: "قيد الكتابة",
  editing: "مونتاج",
  published: "منشور",
  archived: "مؤرشف",
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface Project {
  id: ID;
  title: string;
  /** The user's own words. Drives every downstream AI step. */
  premise: string;
  status: ProjectStatus;
  stage: PipelineStage;
  /** Position on the project map: which node of the pipeline we're at. */
  progress: number;
  audience: string;
  contentType: string;
  targetDurationSec: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
  /** Marks seeded content so the UI can label Demo Mode honestly. */
  isDemo: boolean;
}

export interface ProjectNote {
  id: ID;
  projectId: ID;
  body: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

export interface Idea {
  id: ID;
  title: string;
  topic: string;
  angle: string;
  potentialHook: string;
  status: IdeaStatus;
  notes: string;
  projectId: ID | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDemo: boolean;
}

// ---------------------------------------------------------------------------
// Research
// ---------------------------------------------------------------------------

export interface ResearchBrief {
  id: ID;
  projectId: ID;
  topic: string;
  mainQuestion: string;
  subQuestions: string[];
  researchGoal: string;
  targetAudience: string;
  contentType: string;
  suggestedAngles: ResearchAngle[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResearchAngle {
  id: ID;
  title: string;
  thesis: string;
  /** Why this angle is worth making — shown so the user can judge, not trust. */
  rationale: string;
  risk: string | null;
  selected: boolean;
}

export const SOURCE_TYPES = [
  "news",
  "academic",
  "blog",
  "forum",
  "video",
  "social",
  "report",
  "official",
  "other",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Where a piece of knowledge came from — evidence, not vibes. */
export const CREDIBILITY_TIERS = ["high", "medium", "low", "unknown"] as const;
export type CredibilityTier = (typeof CREDIBILITY_TIERS)[number];

export interface Source {
  id: ID;
  projectId: ID;
  researchSessionId: ID | null;
  title: string;
  url: string;
  domain: string;
  sourceType: SourceType;
  publishedAt: string | null;
  credibility: CredibilityTier;
  /** Short AI summary of what this source contributes. */
  summary: string;
  /** Verbatim quotes with attribution — used for citations. */
  quotes: SourceQuote[];
  /** Extracted atomic facts, numbers, dates. */
  extractedFacts: string[];
  savedAt: Timestamp;
  isDemo: boolean;
}

export interface SourceQuote {
  id: ID;
  text: string;
  /** Location inside the document, e.g. "¶4" or "02:14". */
  locator: string | null;
}

/** An atomic assertion extracted from sources — the unit of fact-checking. */
export interface Claim {
  id: ID;
  projectId: ID;
  text: string;
  /** Claim kind drives which contradiction rules apply. */
  kind: "number" | "date" | "fact" | "quote" | "attribution";
  /** The comparable value when kind is number/date, else null. */
  value: number | string | null;
  unit: string | null;
  status: ClaimStatus;
  sourceIds: ID[];
  resolution: string | null;
  createdAt: Timestamp;
}

export const CLAIM_STATUSES = [
  "supported",
  "contradicted",
  "unclear",
  "needs_verification",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_LABELS_AR: Record<ClaimStatus, string> = {
  supported: "مؤكد",
  contradicted: "متناقض",
  unclear: "غير واضح",
  needs_verification: "يحتاج تحقق",
};

export interface Contradiction {
  id: ID;
  projectId: ID;
  claimIds: ID[];
  summary: string;
  /** What actually differs between the sources. */
  whatDiffers: string;
  /** Why the divergence may exist (different years, definitions, scopes…). */
  whyItMayDiffer: string;
  /** Which value is most defensible — null when genuinely undecidable. */
  recommendedValue: string | null;
  recommendedReason: string | null;
  severity: "low" | "medium" | "high";
  resolved: boolean;
}

// ---------------------------------------------------------------------------
// Timeline & entities
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  id: ID;
  projectId: ID;
  /** ISO date, or year-only precision ("2019"). */
  date: string;
  datePrecision: "day" | "month" | "year" | "unknown";
  title: string;
  description: string;
  entityIds: ID[];
  sourceIds: ID[];
  /** Events the AI inferred rather than a source stating outright. */
  confidence: number;
  createdAt: Timestamp;
}

export const ENTITY_TYPES = [
  "company",
  "person",
  "product",
  "event",
  "location",
  "money",
  "concept",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface Entity {
  id: ID;
  projectId: ID;
  name: string;
  type: EntityType;
  role: string;
  description: string;
  sourceIds: ID[];
}

export interface EntityEdge {
  id: ID;
  projectId: ID;
  fromId: ID;
  toId: ID;
  relation: string;
  evidence: string;
  sourceIds: ID[];
}

// ---------------------------------------------------------------------------
// YouTube & competitors
// ---------------------------------------------------------------------------

export interface Video {
  id: ID;
  projectId: ID | null;
  channelId: string;
  channelName: string;
  channelUrl: string;
  youtubeId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  durationSec: number;
  publishedAt: string;
  topic: string;
  /** Structure analysis produced by the analysis workflow. */
  structure: VideoStructure | null;
  isDemo: boolean;
}

export interface VideoStructure {
  hook: string;
  hookScore: number;
  mainArguments: string[];
  structurePattern: string;
  beats: VideoBeat[];
  cta: string;
  retentionNotes: string[];
}

export interface VideoBeat {
  atSec: number;
  label: string;
  note: string;
}

export interface Competitor {
  id: ID;
  projectId: ID | null;
  name: string;
  handle: string;
  channelUrl: string;
  subscribers: number;
  postingFrequencyPerWeek: number;
  /** Aggregated observations powering the comparison view. */
  topics: string[];
  recurringThemes: string[];
  hookPatterns: string[];
  thumbnailPatterns: string[];
  formats: string[];
  topVideos: CompetitorVideo[];
  addedAt: Timestamp;
  isDemo: boolean;
}

export interface CompetitorVideo {
  youtubeId: string;
  title: string;
  views: number;
  publishedAt: string;
  hook: string;
  url: string;
}

export interface ContentGap {
  id: ID;
  projectId: ID;
  /** The unexploited topic or angle. */
  topic: string;
  evidence: string;
  /** How many competitors cover it, and how well. */
  coverage: number;
  opportunityScore: number;
  recommendedFormat: string;
}

// ---------------------------------------------------------------------------
// Transcripts
// ---------------------------------------------------------------------------

export interface Transcript {
  id: ID;
  projectId: ID | null;
  videoUrl: string;
  provider: string;
  language: string;
  segments: TranscriptSegment[];
  summary: string;
  keyPoints: string[];
  quotes: string[];
  hook: string;
  structure: string;
  arguments: string[];
  cta: string;
  chapters: TranscriptChapter[];
  createdAt: Timestamp;
  isDemo: boolean;
}

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscriptChapter {
  startSec: number;
  title: string;
  summary: string;
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

export interface Script {
  id: ID;
  projectId: ID;
  title: string;
  /** Narrative skeleton the AI chose for this specific topic. */
  structure: ScriptStructure | null;
  targetDurationSec: number;
  tone: string;
  wordCount: number;
  status: "draft" | "review" | "locked";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDemo: boolean;
}

export interface ScriptStructure {
  name: string;
  rationale: string;
  beats: ScriptStructureBeat[];
}

export interface ScriptStructureBeat {
  key: string;
  label: string;
  purpose: string;
  targetSec: number;
}

export const DEFAULT_SCRIPT_BEATS: ScriptStructureBeat[] = [
  { key: "hook", label: "الخطّاف", purpose: "إيقاف التمرير خلال ثانيتين", targetSec: 20 },
  { key: "context", label: "السياق", purpose: "تعريف سريع بالعالم", targetSec: 30 },
  { key: "setup", label: "التمهيد", purpose: "بناء التوقع", targetSec: 40 },
  { key: "conflict", label: "التصادم", purpose: "طرح المشكلة الحقيقية", targetSec: 60 },
  { key: "escalation", label: "التصعيد", purpose: "الأدلة تتراكم", targetSec: 70 },
  { key: "turn", label: "نقطة التحوّل", purpose: "ما الذي غيّر كل شيء", targetSec: 50 },
  { key: "insight", label: "الرؤية", purpose: "الدرس القابل للنقل", targetSec: 45 },
  { key: "conclusion", label: "الخاتمة", purpose: "إغلاق حلزوني", targetSec: 30 },
  { key: "cta", label: "الدعوة", purpose: "خطوة واحدة واضحة", targetSec: 15 },
];

export interface ScriptSection {
  id: ID;
  scriptId: ID;
  /** Beat key from ScriptStructure, or "free" for unsorted blocks. */
  beatKey: string;
  order: number;
  narration: string;
  visual: string;
  broll: string;
  onScreenText: string;
  sound: string;
  sourceIds: ID[];
  /** Word count drives the running duration estimate. */
  estimatedSec: number;
  updatedAt: Timestamp;
}

export const SCRIPT_AI_ACTIONS = [
  { id: "improve", label: "تحسين", hint: "وضوح ودقة دون تغيير النبرة" },
  { id: "rewrite", label: "إعادة صياغة", hint: "نسخة بديلة بنفس المعنى" },
  { id: "shorten", label: "اختصار", hint: "تقليل الكلمات 30%" },
  { id: "expand", label: "توسيع", hint: "إضافة تفصيل ودعم" },
  { id: "stronger_hook", label: "خطّاف أقوى", hint: "جملة افتتاحية تصمد" },
  { id: "more_natural", label: "أكثر طبيعية", hint: "إزالة الرتابة الآلية" },
  { id: "more_emotional", label: "أكثر عاطفية", hint: "رفع الحماس دون مبالغة" },
  { id: "more_analytical", label: "أكثر تحليلية", hint: "أرقام وأدلة" },
  { id: "simplify", label: "تبسيط", hint: "لغة أبسط" },
  { id: "fact_check", label: "تحقق من الحقائق", hint: "مطابقة مع المصادر" },
  { id: "generate_visuals", label: "اقتراح مشاهد", hint: "ب‑رول ونص على الشاشة" },
  { id: "generate_shorts", label: "توليد شورتس", hint: "استخراج أقوى المقاطع" },
] as const;
export type ScriptAIAction = (typeof SCRIPT_AI_ACTIONS)[number]["id"];

// ---------------------------------------------------------------------------
// Shorts / titles / thumbnails
// ---------------------------------------------------------------------------

export interface Short {
  id: ID;
  projectId: ID;
  scriptId: ID | null;
  hook: string;
  body: string;
  ending: string;
  cta: string;
  estimatedSec: number;
  caption: string;
  title: string;
  hashtags: string[];
  /** Which part of the long script this was cut from. */
  sourceSectionId: ID | null;
  createdAt: Timestamp;
}

export interface TitleIdea {
  id: ID;
  projectId: ID;
  text: string;
  angle: string;
  /** Predicted pull, 0-100. A heuristic signal, labelled as such in the UI. */
  pullScore: number;
  createdAt: Timestamp;
}

export interface ThumbnailConcept {
  id: ID;
  projectId: ID;
  concept: string;
  textOverlay: string;
  visualDirection: string;
  emotion: string;
  contrastNote: string;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// AI conversations
// ---------------------------------------------------------------------------

export interface Conversation {
  id: ID;
  projectId: ID | null;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: ID;
  conversationId: ID;
  projectId: ID | null;
  role: "user" | "assistant";
  content: string;
  /** Which intent the router classified this message as. */
  intent: string | null;
  /** The workflow plan the assistant ran, if any. */
  steps: WorkflowStep[] | null;
  /** Entities the assistant created while answering. */
  createdIds: { type: string; id: ID; label: string }[];
  createdAt: Timestamp;
}

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface WorkflowStep {
  id: string;
  label: string;
  /** Why this step exists — shown in the UI so the AI explains itself. */
  why: string;
  status: StepStatus;
  detail: string | null;
  toolName: string | null;
  startedAt: number | null;
  endedAt: number | null;
  /** Real result count, so progress is factual rather than decorative. */
  resultCount: number | null;
  error: string | null;
}

/** A long-running job the user can leave and come back to. */
export interface Task {
  id: ID;
  projectId: ID | null;
  kind: string;
  title: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  progress: number;
  step: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export const MEMORY_CATEGORIES = [
  "writing_style",
  "language",
  "content_style",
  "audience",
  "structure",
  "instructions",
  "reference",
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const MEMORY_LABELS_AR: Record<MemoryCategory, string> = {
  writing_style: "أسلوب الكتابة",
  language: "اللغة",
  content_style: "نوع المحتوى",
  audience: "الجمهور",
  structure: "الهيكل المفضّل",
  instructions: "تعليمات ثابتة",
  reference: "مراجع",
};

export interface MemoryEntry {
  id: ID;
  category: MemoryCategory;
  key: string;
  value: string;
  /** Disabled entries are kept but not injected into prompts. */
  enabled: boolean;
  source: "user" | "inferred";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const INTEGRATION_IDS = [
  "gemini",
  "deepseek",
  "openrouter",
  "tavily",
  "firecrawl",
  "youtube",
  "video_to_text",
  "google_sheets",
  "notion",
] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export type IntegrationCategory =
  | "ai"
  | "research"
  | "youtube"
  | "video"
  | "automation"
  | "productivity";

export interface IntegrationMeta {
  id: IntegrationId;
  name: string;
  category: IntegrationCategory;
  description: string;
  /** Env var consulted when no key is stored in the vault. */
  envVar: string;
  keyUrl: string;
  docsUrl: string;
  /** Capabilities unlocked when connected — shown on the card. */
  capabilities: string[];
  /** Per-provider quirks surfaced in the test-connection flow. */
  requiredFields?: { key: string; label: string; placeholder: string }[];
  /** Honest UI hint when the integration isn't fully wired yet. */
  notes?: string;
}

export const INTEGRATIONS: IntegrationMeta[] = [
  {
    id: "gemini",
    name: "Gemini",
    category: "ai",
    description: "نماذج Google — سياق طويل ومهام متعددة الوسائط.",
    envVar: "GEMINI_API_KEY",
    keyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    capabilities: ["كتابة", "تحليل", "سياق طويل", "استخراج من صور"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    category: "ai",
    description: "نماذج OpenAI‑compatible منخفضة التكلفة ومناسبة للاستدلال.",
    envVar: "DEEPSEEK_API_KEY",
    keyUrl: "https://platform.deepseek.com/api_keys",
    docsUrl: "https://api-docs.deepseek.com/",
    capabilities: ["كتابة", "استدلال", "تلخيص بحثي"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "ai",
    description: "بوابة لنماذج متعددة — تختار النموذج من الإعدادات.",
    envVar: "OPENROUTER_API_KEY",
    keyUrl: "https://openrouter.ai/keys",
    docsUrl: "https://openrouter.ai/docs",
    capabilities: ["تبديل النموذج", "نماذج متعددة", "fallback"],
  },
  {
    id: "tavily",
    name: "Tavily",
    category: "research",
    description: "بحث ويب مُهيّأ للذكاء الاصطناعي مع مقتطفات جاهزة.",
    envVar: "TAVILY_API_KEY",
    keyUrl: "https://app.tavily.com/home",
    docsUrl: "https://docs.tavily.com/",
    capabilities: ["بحث ويب", "مقتطفات", "عمق بحث"],
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    category: "research",
    description: "تحويل صفحات الويب إلى Markdown نظيف للتحليل.",
    envVar: "FIRECRAWL_API_KEY",
    keyUrl: "https://www.firecrawl.dev/",
    docsUrl: "https://docs.firecrawl.dev/",
    capabilities: ["سكرابينج", "Markdown", "استخراج محتوى"],
  },
  {
    id: "youtube",
    name: "YouTube Data API v3",
    category: "youtube",
    description: "بحث وإحصائيات الفيديو والقنوات.",
    envVar: "YOUTUBE_API_KEY",
    keyUrl: "https://console.cloud.google.com/apis/credentials",
    docsUrl: "https://developers.google.com/youtube/v3/getting-started",
    capabilities: ["بحث", "إحصائيات", "بيانات القناة"],
  },
  {
    id: "video_to_text",
    name: "Video-to-Text",
    category: "video",
    description: "تفريغ نصي للفيديوهات — المزود قابل للاستبدال من الإعدادات.",
    envVar: "VIDEO_TO_TEXT_API_KEY",
    keyUrl: "",
    docsUrl: "",
    capabilities: ["تفريغ نصي", "فصول", "ملخص"],
    requiredFields: [
      { key: "endpoint", label: "رابط الـ Endpoint", placeholder: "https://api.example.com/v1/transcribe" },
      { key: "model", label: "اسم النموذج (اختياري)", placeholder: "whisper-1" },
    ],
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    category: "productivity",
    description: "تصدير البحث وقواعد بيانات المحتوى إلى جداول.",
    notes: "التصدير المحلي يعمل الآن. المزامنة الحية مع Sheets قيد الإعداد.",
    envVar: "GOOGLE_SHEETS_API_KEY",
    keyUrl: "https://console.cloud.google.com/apis/credentials",
    docsUrl: "https://developers.google.com/sheets/api",
    capabilities: ["تصدير", "قراءة", "مزامنة"],
    requiredFields: [
      { key: "spreadsheet_id", label: "معرّف جدول البيانات", placeholder: "1AbC…" },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    category: "productivity",
    description: "حفظ البحث والسكربتات والأفكار كصفحات Notion.",
    notes: "التصدير المحلي يعمل. المزامنة الحية مع Notion قيد الإعداد.",
    envVar: "NOTION_API_KEY",
    keyUrl: "https://www.notion.so/my-integrations",
    docsUrl: "https://developers.notion.com/",
    capabilities: ["إنشاء صفحة", "حفظ بحث", "حفظ سكربت"],
    requiredFields: [
      { key: "database_id", label: "معرّف قاعدة البيانات (اختياري)", placeholder: "abc123…" },
    ],
  },
];

export type ConnectionStatus = "connected" | "not_configured" | "invalid" | "testing";

export interface IntegrationState {
  id: IntegrationId;
  status: ConnectionStatus;
  /** Never the raw key — only a masked hint like "AIza…f3K9". */
  keyHint: string | null;
  lastTestedAt: Timestamp | null;
  lastError: string | null;
  enabled: boolean;
  /** Extra provider-specific config (endpoint, model, ids). Never secrets. */
  config: Record<string, string>;
  /** Which provider satisfied the key: vault or environment. */
  source: "vault" | "env" | null;
}

// ---------------------------------------------------------------------------
// Settings & activity
// ---------------------------------------------------------------------------

export interface Settings {
  displayName: string;
  channelName: string;
  channelUrl: string;
  locale: Locale;
  direction: "rtl" | "ltr";
  theme: "dark";
  accent: string;
  contentStyle: "narrator" | "thinker" | "friend";
  primaryLanguage: Locale;
  memoryEnabled: boolean;
  notificationsEnabled: boolean;
  reducedMotion: "system" | "on" | "off";
  /** Model choice per capability — the routing table. */
  modelRouting: Record<string, string>;
  onboardedAt: Timestamp | null;
}

export interface ActivityEntry {
  id: ID;
  at: Timestamp;
  what: string;
  projectId: ID | null;
  projectTitle: string | null;
  toolName: string | null;
  outcome: "success" | "failure";
  detail: string | null;
}

export interface UsageRecord {
  id: ID;
  at: Timestamp;
  provider: string;
  capability: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
}
