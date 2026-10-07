# ABDO CREATOR OS — Build Contract

Read this fully before writing any file. It is the single source of truth for
conventions. Do not deviate; do not invent new patterns.

Project root: `/workspace/abdo-creator-os`

---

## 1. Stack (already installed, do not add dependencies)

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS v4 ·
lucide-react · motion · zod. No new npm packages.

---

## 2. Non-negotiable product rules

1. **Arabic-first, real RTL.** The document is already `dir="rtl"`. Use CSS
   logical properties exclusively: `ms-* me-* ps-* pe-* start-* end-* text-start
   text-end`. NEVER use `ml-* mr-* pl-* pr-* left-* right-*` for layout.
2. **Dark-first, deep navy** — never pure black. The canvas is `#060911`.
3. **No card-grid dashboards.** Prefer sections, panels, split views, rails,
   timelines, expandable areas. Use a bounded `.panel` only when it has a job.
4. **No neon, no glassmorphism, no glow for decoration.** Accent colour is
   functional. Cyan (`--color-live`) is reserved for *running* state only.
   Amber (`--color-attention`) is reserved for *needs attention* only.
5. **Honest states.** Every list needs an empty state that says what goes there
   and gives one action. Every async operation needs loading + error + retry.
   Never render "Something went wrong". Never show a spinner alone for a long
   operation — show named steps.
6. **No dead buttons.** Every button/link must do something real. If a feature
   is out of scope, do not render a control for it.
7. **Never invent facts.** AI/demo output that is simulated must be visibly
   labelled. Use `<DemoTag />` or an explicit `⚠️` note.
8. **Accessibility is not optional**: keyboard reachable, visible focus (the
   global `:focus-visible` handles it — never remove it), `aria-label` on
   icon-only buttons, `role`/`aria-*` on custom widgets.

---

## 3. Files that already exist — import, never rewrite

### Store
- `@/lib/store/provider` exports:
  - `useApp()` → `{ state, ready, isDemo, actions }`
  - `useSettings()`, `useProject(id)`, `useLiveProject()`, `useProjectBundle(projectId)`,
    `useScriptSections(scriptId)`, `useMessages(conversationId)`,
    `useActiveMemories()`, `useUnreadCount()`
  - `AppProvider` (already mounted in `app/layout.tsx`)
- `AppState` collections: `projects, projectNotes, ideas, researchBriefs, sources,
  claims, contradictions, events, entities, entityEdges, videos, competitors,
  contentGaps, transcripts, scripts, scriptSections, shorts, titleIdeas,
  thumbnailConcepts, conversations, messages, tasks, memories, settings,
  activity, usage, integrationState`
- `actions`: `upsert, patch, remove, replace, createProject, updateProject,
  deleteProject, setProjectStage, createIdea, updateIdea, removeIdea,
  ensureConversation, addMessage, updateMessage, upsertTask, updateTask,
  addMemory, updateMemory, removeMemory, updateSettings, setIntegrationState,
  logActivity, recordUsage, addSource, addClaim, addContradiction, addEvent,
  addEntity, addEdge, addShort, addTitleIdea, addThumbnailConcept,
  addCompetitor, addVideo, addTranscript, upsertBrief, createScript,
  updateScriptSection, addScriptSection, removeScriptSection,
  reorderScriptSections, ingest, resetToDemo, wipeAll, completeOnboarding`

### Domain types
`@/lib/types` exports all entity types plus:
`PIPELINE_STAGES, PIPELINE_LABELS_AR, IDEA_STATUSES, IDEA_STATUS_LABELS_AR,
CLAIM_STATUSES, CLAIM_STATUS_LABELS_AR, SCRIPT_AI_ACTIONS, DEFAULT_SCRIPT_BEATS,
MEMORY_CATEGORIES, MEMORY_LABELS_AR, INTEGRATIONS, INTEGRATION_IDS`

### UI primitives (`@/components/ui/*`) — use these, do not rebuild
- `Button` — props: `variant: "primary"|"secondary"|"ghost"|"subtle"|"danger"|"live"`,
  `size: "sm"|"md"|"lg"`, `loading`, `icon`, `iconEnd`, `block`
- `IconButton` — props: `label` (REQUIRED), `variant`, `size`, `active`
- `Segmented` — props: `options: {value,label,icon?}[]`, `value`, `onChange`
- `Field` — render-prop: `<Field label hint error>{(id, describedBy) => <Input id={id} …/>}</Field>`
- `Input`, `Textarea` (prop `autoGrow`), `Select`, `Checkbox`
- `Panel`, `PanelHeader {title, subtitle, actions, icon, dense}`, `Section {title, aside}`, `Divider`
- `Badge {tone, icon, mono}`, `StatusDot {tone, pulse}`,
  `StageBadge {stage}`, `ProjectStatusBadge {status}`, `IdeaStatusBadge {status}`,
  `CredibilityBadge {tier}`, `ClaimStatusBadge {status}`, `DemoTag`,
  `ProgressBar {value, tone, label}`, `RunningBar`
- `EmptyState {icon, title, description, action:{label,onClick,icon}, secondaryAction, compact}`
- `ErrorState {error, onRetry, onConfigure, compact}` — pass an `ApiError`
- `Skeleton`, `SkeletonText {lines}`, `LoadingPanel {rows}`
- `Modal {open,onClose,title,description,footer,size}`, `Drawer {open,onClose,title,side,width}`
- `ToastProvider` / `useToast()` → `{success, error, info, warning, push, dismiss}`
- `Markdown {content, onCite}` — safe renderer, use it for all AI output

### Other components
- `@/components/ai/Composer` → `<Composer autoFocus compact placeholder onDone />`
- `@/components/ai/Composer` also exports `WorkflowPanel {steps, running}`
- `@/components/projects/ProjectWorkspace` → wraps project sub-views
- `@/components/projects/ProjectWorkspace` also exports `ViewHeader {title, description, actions, badge}`
- `@/components/shell/nav` → `NAV` (all routes you must implement)

### Utils
`@/lib/utils`: `cn, uid, now, formatNumber, formatFullNumber, formatTime,
timeAgo, formatDate, formatDuration, estimateSpeechSeconds, truncate, domainOf,
isValidUrl, maskSecret, slugify, groupBy, uniqueBy, sortBy, clamp`

### API client (`@/lib/api/client`)
`ApiError` (has `.message`, `.remedy`, `.retryable`, `.code`),
`callAI(messages, capability, opts, signal)`, `searchWeb(query, opts, signal)`,
`scrapePage(url, signal)`, `youtubeSearch(q, max, signal)`,
`youtubeVideo(url, signal)`, `transcribeVideo(url, lang, signal)`,
`fetchHealth()`, `saveKey`, `removeKey`, `testConnection`

### Intent + workflow
- `@/lib/intent/router`: `classifyIntent(text)`, `planFor(intent)`,
  `IntentId`, `Intent`, `Plan`, `PlanStep`, `QUICK_INTENTS`, `COMMAND_EXAMPLES`
- `@/lib/workflow/runner`: `runPlan(plan, ctx, emit)`, `buildPlan(text)`,
  `RunStep`, `RunResult`

---

## 4. File conventions

- Every page/component that uses hooks or browser APIs starts with `"use client";`
- Route files export `export default function XPage()`.
- Dynamic project routes live at `src/app/projects/[id]/<view>/page.tsx`.
  Read the id with `useParams<{ id: string }>()` from `next/navigation`.
- Do NOT call `params` as a Promise — this is a client-component codebase.
- Semantic HTML: `<main>` is already in the shell, so pages use `<div>` or
  `<section>` wrappers. One `<h1>` per page, `<h2>`/`<h3>` below it.
- Every icon-only control needs `aria-label` (via `<IconButton label="…">`).

---

## 5. Route coverage (every link in `nav.ts` must resolve)

Top level: `/` `/today` `/recent` `/ideas` `/scripts` `/shorts` `/titles`
`/thumbnails` `/research` `/sources` `/competitors` `/youtube` `/transcript`
`/fact-check` `/timeline` `/entities` `/projects` `/projects/active`
`/projects/completed` `/ai` `/ai/models` `/ai/agents` `/ai/prompts` `/memory`
`/tools` `/tools/youtube` `/tools/tavily` `/tools/firecrawl`
`/tools/transcript` `/tools/sheets` `/tools/notion` `/settings`
`/settings/integrations` `/settings/keys` `/settings/usage` `/settings/logs`
`/settings/data` `/onboarding`

Project: `/projects/[id]` `/projects/[id]/research` `/projects/[id]/sources`
`/projects/[id]/competitors` `/projects/[id]/timeline` `/projects/[id]/entities`
`/projects/[id]/script` `/projects/[id]/shorts` `/projects/[id]/titles`
`/projects/[id]/thumbnails` `/projects/[id]/fact-check` `/projects/[id]/transcript`

---

## 6. Before you finish

Run these and make them pass:

```bash
cd /workspace/abdo-creator-os
python3 scripts/check-text.py     # must print: TEXT INTEGRITY: clean
npx tsc --noEmit                  # must print nothing
```

`check-text.py` fails on CJK/Cyrillic glyphs or Latin words glued to Arabic
inside user-facing strings. If it flags a line, fix the string.

---

## 7. Arabic writing rules for generated copy

- Modern Standard Arabic, simplified. Never translate UI labels mechanically.
- Numbers stay Latin inside Arabic sentences where they are technical
  (`34%`, `$185M`, `12 دقيقة`).
- No motivational filler. No "Certainly!" / "Happy to help!" style padding.
- Errors always state: what happened, why, what the user does next.
