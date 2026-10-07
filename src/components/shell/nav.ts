import {
  Activity,
  Brain,
  Film,
  FlaskConical,
  Home,
  Images,
  KeyRound,
  LayoutGrid,
  Link2,
  ListChecks,
  Mic,
  MonitorPlay,
  PenLine,
  Puzzle,
  Search,
  Settings,
  Sparkles,
  Tags,
  Target,
  Terminal,
  Timer,
  Trash2,
  TrendingUp,
  Type,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation model.
 *
 * Grouped by the creator's mental model, not by the database schema:
 * HOME (orientation) → CREATE (production) → RESEARCH (evidence) →
 * PROJECTS (containers) → AI (cognition) → TOOLS (integrations) → SYSTEM.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown as a small count badge when meaningful. */
  badge?: number;
  /** Exact match required — used for the project-scoped routes. */
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  /** Collapsed in the rail until hovered/expanded. */
  primary?: boolean;
}

export const NAV: NavGroup[] = [
  {
    id: "home",
    label: "الرئيسية",
    primary: true,
    items: [
      { href: "/", label: "مركز القيادة", icon: Home, exact: true },
      { href: "/today", label: "يومك", icon: Timer },
      { href: "/recent", label: "آخر الأعمال", icon: Activity },
    ],
  },
  {
    id: "create",
    label: "الإنشاء",
    items: [
      { href: "/ideas", label: "الأفكار", icon: Sparkles },
      { href: "/scripts", label: "السكربتات", icon: PenLine },
      { href: "/shorts", label: "الشورتس", icon: MonitorPlay },
      { href: "/titles", label: "العناوين", icon: Type },
      { href: "/thumbnails", label: "الثامبنيلات", icon: Images },
    ],
  },
  {
    id: "research",
    label: "البحث",
    items: [
      { href: "/research", label: "مختبر البحث", icon: FlaskConical },
      { href: "/sources", label: "المصادر", icon: Link2 },
      { href: "/competitors", label: "المنافسون", icon: Users },
      { href: "/youtube", label: "بحث YouTube", icon: Video },
      { href: "/transcript", label: "نص الفيديو", icon: Mic },
      { href: "/fact-check", label: "تحقق الحقائق", icon: Target },
      { href: "/timeline", label: "الخط الزمني", icon: ListChecks },
      { href: "/entities", label: "خريطة الكيانات", icon: Puzzle },
    ],
  },
  {
    id: "projects",
    label: "المشاريع",
    items: [
      { href: "/projects", label: "كل المشاريع", icon: LayoutGrid },
      { href: "/projects/active", label: "النشطة", icon: TrendingUp },
      { href: "/projects/completed", label: "المكتملة", icon: ListChecks },
    ],
  },
  {
    id: "ai",
    label: "الذكاء",
    items: [
      { href: "/ai", label: "المساعد", icon: Brain, exact: true },
      { href: "/ai/models", label: "النماذج", icon: MonitorPlay },
      { href: "/ai/agents", label: "الوكلاء", icon: Terminal },
      { href: "/ai/prompts", label: "مكتبة الأوامر", icon: Target },
      { href: "/memory", label: "الذاكرة", icon: Sparkles },
    ],
  },
  {
    id: "tools",
    label: "الأدوات",
    items: [
      { href: "/tools", label: "كل الأدوات", icon: Wrench },
      { href: "/tools/youtube", label: "YouTube", icon: Video },
      { href: "/tools/tavily", label: "بحث الويب", icon: Search },
      { href: "/tools/firecrawl", label: "استخراج الصفحات", icon: Film },
      { href: "/tools/transcript", label: "فيديو إلى نص", icon: Mic },
      { href: "/tools/sheets", label: "Google Sheets", icon: LayoutGrid },
      { href: "/tools/notion", label: "Notion", icon: LayoutGrid },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      { href: "/settings/integrations", label: "التكاملات", icon: Link2 },
      { href: "/settings/keys", label: "مفاتيح API", icon: KeyRound },
      { href: "/settings", label: "الإعدادات", icon: Settings, exact: true },
      { href: "/settings/usage", label: "الاستهلاك", icon: TrendingUp },
      { href: "/settings/logs", label: "السجلات", icon: Activity },
      { href: "/settings/data", label: "البيانات", icon: Trash2 },
    ],
  },
];

/** Bottom navigation on phones — five destinations, no more. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home, exact: true },
  { href: "/ai", label: "المساعد", icon: Brain, exact: true },
  { href: "/projects", label: "المشاريع", icon: LayoutGrid },
  { href: "/research", label: "البحث", icon: FlaskConical },
  { href: "/settings/integrations", label: "الأدوات", icon: Wrench },
];

/** Flat list used by the command palette and global search. */
export const NAV_FLAT: (NavItem & { group: string })[] = NAV.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
);

/** Shortcuts offered directly in the palette. */
export const PALETTE_ACTIONS = [
  { id: "new-project", label: "مشروع جديد", hint: "أنشئ مساحة عمل مستقلة", href: "/projects?new=1", icon: LayoutGrid },
  { id: "new-idea", label: "فكرة جديدة", hint: "التقط فكرة قبل أن تضيع", href: "/ideas?new=1", icon: Sparkles },
  { id: "start-research", label: "ابدأ بحثًا", hint: "ادخل مختبر البحث", href: "/research", icon: FlaskConical },
  { id: "open-ai", label: "افتح المساعد", hint: "محادثة كاملة مع ذاكرة المشروع", href: "/ai", icon: Brain },
  { id: "connect-tool", label: "اربط أداة", hint: "أضف مفتاح API", href: "/settings/integrations", icon: Link2 },
  { id: "open-settings", label: "الإعدادات", hint: "التفضيلات والذاكرة", href: "/settings", icon: Settings },
] as const;
