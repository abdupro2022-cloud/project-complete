"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  COLLECTIONS,
  readAll,
  writeAll,
  type CollectionName,
  type Row,
} from "./storage";
import { buildDemoState } from "./seed";
import { now, uid } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  type ActivityEntry,
  type Claim,
  type Competitor,
  type ContentGap,
  type Contradiction,
  type Conversation,
  type Entity,
  type EntityEdge,
  type Idea,
  type IntegrationId,
  type IntegrationState,
  type MemoryEntry,
  type Message,
  type Project,
  type ProjectNote,
  type ResearchAngle,
  type ResearchBrief,
  type Script,
  type ScriptSection,
  type Settings,
  type Short,
  type Source,
  type Task,
  type ThumbnailConcept,
  type TimelineEvent,
  type TitleIdea,
  type Transcript,
  type UsageRecord,
  type Video,
  type WorkflowStep,
} from "@/lib/types";

/**
 * App state shape. One object per collection, loaded once at boot and
 * write-through persisted. For a single-creator tool the working set is small,
 * so holding it in memory keeps every screen instant and removes a whole class
 * of loading spinners.
 */
export interface AppState {
  projects: Project[];
  projectNotes: ProjectNote[];
  ideas: Idea[];
  researchBriefs: ResearchBrief[];
  sources: Source[];
  claims: Claim[];
  contradictions: Contradiction[];
  events: TimelineEvent[];
  entities: Entity[];
  entityEdges: EntityEdge[];
  videos: Video[];
  competitors: Competitor[];
  contentGaps: ContentGap[];
  transcripts: Transcript[];
  scripts: Script[];
  scriptSections: ScriptSection[];
  shorts: Short[];
  titleIdeas: TitleIdea[];
  thumbnailConcepts: ThumbnailConcept[];
  conversations: Conversation[];
  messages: Message[];
  tasks: Task[];
  memories: MemoryEntry[];
  settings: Settings;
  activity: ActivityEntry[];
  usage: UsageRecord[];
  integrationState: IntegrationState[];
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: "عبده",
  channelName: "",
  channelUrl: "",
  locale: "ar",
  direction: "rtl",
  theme: "dark",
  accent: "#4c8dff",
  contentStyle: "narrator",
  primaryLanguage: "ar",
  memoryEnabled: true,
  notificationsEnabled: true,
  reducedMotion: "system",
  modelRouting: {
    writing: "deepseek",
    analysis: "gemini",
    fast: "deepseek",
  },
  onboardedAt: null,
};

const EMPTY: AppState = {
  projects: [],
  projectNotes: [],
  ideas: [],
  researchBriefs: [],
  sources: [],
  claims: [],
  contradictions: [],
  events: [],
  entities: [],
  entityEdges: [],
  videos: [],
  competitors: [],
  contentGaps: [],
  transcripts: [],
  scripts: [],
  scriptSections: [],
  shorts: [],
  titleIdeas: [],
  thumbnailConcepts: [],
  conversations: [],
  messages: [],
  tasks: [],
  memories: [],
  settings: DEFAULT_SETTINGS,
  activity: [],
  usage: [],
  integrationState: [],
};

/** True when nothing has been created yet — drives the first-run experience. */
function isPristine(s: AppState): boolean {
  return s.projects.length === 0 && s.ideas.length === 0 && s.settings.onboardedAt === null;
}

/** Persists a whole state, serialising the `settings` singleton as one row. */
async function writeState(s: AppState): Promise<void> {
  await Promise.all(
    COLLECTIONS.map((name) => {
      if (name === "settings") {
        return writeAll("settings", [{ ...(s.settings as unknown as Row), id: "settings" }]);
      }
      const value = s[name];
      return writeAll(name, Array.isArray(value) ? (value as unknown as Row[]) : []);
    }),
  );
}

interface AppContextValue {
  state: AppState;
  ready: boolean;
  /** True when the visible content came from the bundled demo dataset. */
  isDemo: boolean;
  actions: Actions;
}

export interface Actions {
  upsert<K extends CollectionName>(name: K, row: Row): void;
  patch<K extends CollectionName>(name: K, id: string, changes: Partial<Row>): void;
  remove(name: CollectionName, id: string): void;
  replace(name: CollectionName, rows: Row[]): void;

  // Domain helpers — these keep id/timestamp bookkeeping out of the UI.
  createProject(input: Partial<Project> & { title: string }): Project;
  updateProject(id: string, changes: Partial<Project>): void;
  deleteProject(id: string): void;
  setProjectStage(id: string, stage: Project["stage"]): void;

  createIdea(input: Partial<Idea> & { title: string }): Idea;
  updateIdea(id: string, changes: Partial<Idea>): void;
  removeIdea(id: string): void;

  ensureConversation(projectId: string | null, title: string): Conversation;
  addMessage(input: Omit<Message, "id" | "createdAt">): Message;
  updateMessage(id: string, changes: Partial<Message>): void;

  upsertTask(task: Omit<Task, "id" | "createdAt" | "updatedAt"> & { id?: ID_ }): Task;
  updateTask(id: string, changes: Partial<Task>): void;

  addMemory(input: Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">): MemoryEntry;
  updateMemory(id: string, changes: Partial<MemoryEntry>): void;
  removeMemory(id: string): void;

  updateSettings(changes: Partial<Settings>): void;
  setIntegrationState(id: IntegrationId, changes: Partial<IntegrationState>): void;

  logActivity(entry: Omit<ActivityEntry, "id" | "at">): void;
  recordUsage(record: Omit<UsageRecord, "id" | "at">): void;

  addSource(source: Omit<Source, "id" | "savedAt"> & { id?: string }): Source;
  addClaim(claim: Omit<Claim, "id" | "createdAt"> & { id?: string }): Claim;
  addContradiction(c: Omit<Contradiction, "id">): Contradiction;
  addEvent(e: Omit<TimelineEvent, "id" | "createdAt">): TimelineEvent;
  addEntity(e: Omit<Entity, "id">): Entity;
  addEdge(e: Omit<EntityEdge, "id">): EntityEdge;
  addShort(s: Omit<Short, "id" | "createdAt">): Short;
  addTitleIdea(t: Omit<TitleIdea, "id" | "createdAt">): TitleIdea;
  addThumbnailConcept(t: Omit<ThumbnailConcept, "id" | "createdAt">): ThumbnailConcept;
  addCompetitor(c: Omit<Competitor, "id" | "addedAt">): Competitor;
  addVideo(v: Omit<Video, "id">): Video;
  addTranscript(t: Omit<Transcript, "id" | "createdAt">): Transcript;
  upsertBrief(b: Omit<ResearchBrief, "id" | "createdAt" | "updatedAt"> & { id?: string }): ResearchBrief;
  createScript(input: { projectId: string; title: string }): Script;
  updateScriptSection(id: string, changes: Partial<ScriptSection>): void;
  addScriptSection(section: Omit<ScriptSection, "id" | "updatedAt">): ScriptSection;
  removeScriptSection(id: string): void;
  reorderScriptSections(scriptId: string, orderedIds: string[]): void;

  /** Bulk import of workflow output in one write. */
  ingest(projectId: string, payload: Partial<AppState>): void;

  resetToDemo(): Promise<void>;
  wipeAll(): Promise<void>;
  completeOnboarding(): void;
}

type ID_ = string;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Write-through is debounced so rapid typing in the editor doesn't thrash
  // IndexedDB on every keystroke.
  const dirty = useRef<Set<CollectionName>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<AppState>(EMPTY);
  latest.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        COLLECTIONS.map(async (name) => [name, await readAll(name)] as const),
      );
      if (cancelled) return;

      const loaded = { ...EMPTY } as AppState;
      for (const [name, rows] of entries) {
        if (name === "settings") {
          const s = rows[0] as unknown as Settings | undefined;
          if (s) loaded.settings = { ...DEFAULT_SETTINGS, ...s };
          continue;
        }
        if (name === "integrationState") {
          loaded.integrationState = rows as unknown as IntegrationState[];
          continue;
        }
        (loaded as unknown as Record<string, Row[]>)[name] = rows as Row[];
      }

      if (isPristine(loaded)) {
        // First boot: seed a realistic workspace so the product is explorable
        // before a single API key exists.
        const demo = buildDemoState();
        setState(demo);
        setIsDemo(true);
        setReady(true);
        await writeState(demo);
        return;
      }

      setState(loaded);
      setIsDemo(false);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (dirty.current.size === 0) return;
    const snapshot = new Set(dirty.current);
    dirty.current.clear();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      for (const name of snapshot) {
        // `settings` is a singleton, not a collection — wrap it as one row.
        if (name === "settings") {
          void writeAll("settings", [{ ...(latest.current.settings as unknown as Row), id: "settings" }]);
          continue;
        }
        const value = latest.current[name];
        void writeAll(name, Array.isArray(value) ? (value as unknown as Row[]) : []);
      }
    }, 260);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, ready]);

  const mark = useCallback((name: CollectionName) => {
    dirty.current.add(name);
  }, []);

  // --- Generic collection ops --------------------------------------------

  const upsert = useCallback(
    (name: CollectionName, row: Row) => {
      setState((s) => {
        const list = s[name] as unknown as Row[];
        const idx = list.findIndex((r) => r.id === row.id);
        const next = idx >= 0 ? list.map((r, i) => (i === idx ? row : r)) : [...list, row];
        return { ...s, [name]: next } as AppState;
      });
      mark(name);
    },
    [mark],
  );

  const patch = useCallback(
    (name: CollectionName, id: string, changes: Partial<Row>) => {
      setState((s) => {
        const list = s[name] as unknown as Row[];
        return {
          ...s,
          [name]: list.map((r) => (r.id === id ? { ...r, ...changes } : r)),
        } as AppState;
      });
      mark(name);
    },
    [mark],
  );

  const remove = useCallback(
    (name: CollectionName, id: string) => {
      setState((s) => ({
        ...s,
        [name]: (s[name] as unknown as Row[]).filter((r) => r.id !== id),
      }));
      mark(name);
    },
    [mark],
  );

  const replace = useCallback(
    (name: CollectionName, rows: Row[]) => {
      setState((s) => ({ ...s, [name]: rows }) as AppState);
      mark(name);
    },
    [mark],
  );

  // --- Domain helpers -----------------------------------------------------

  const logActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "at">) => {
      setState((s) => ({
        ...s,
        activity: [{ ...entry, id: uid("act"), at: now() }, ...s.activity].slice(0, 400),
      }));
    },
    [],
  );

  const actions = useMemo<Actions>(() => {
    const mk = <T extends Row>(row: T): T => row;

    return {
      upsert,
      patch,
      remove,
      replace,

      createProject(input) {
        const ts = now();
        const project: Project = {
          id: uid("prj"),
          title: input.title,
          premise: input.premise ?? "",
          status: input.status ?? "idea",
          stage: input.stage ?? "idea",
          progress: input.progress ?? 0,
          audience: input.audience ?? "",
          contentType: input.contentType ?? "فيديو طويل",
          targetDurationSec: input.targetDurationSec ?? 600,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
          isDemo: false,
        };
        upsert("projects", mk(project as unknown as Row));
        logActivity({ what: "أنشأ مشروعًا", projectId: project.id, projectTitle: project.title, toolName: null, outcome: "success", detail: project.premise });
        return project;
      },

      updateProject(id, changes) {
        patch("projects", id, { ...changes, updatedAt: now() } as unknown as Partial<Row>);
      },

      deleteProject(id) {
        const title = state.projects.find((p) => p.id === id)?.title ?? "";
        remove("projects", id);
        setState((s) => ({
          ...s,
          projectNotes: s.projectNotes.filter((n) => n.projectId !== id),
          researchBriefs: s.researchBriefs.filter((b) => b.projectId !== id),
          sources: s.sources.filter((x) => x.projectId !== id),
          claims: s.claims.filter((c) => c.projectId !== id),
          contradictions: s.contradictions.filter((c) => c.projectId !== id),
          events: s.events.filter((e) => e.projectId !== id),
          entities: s.entities.filter((e) => e.projectId !== id),
          entityEdges: s.entityEdges.filter((e) => e.projectId !== id),
          scripts: s.scripts.filter((x) => x.projectId !== id),
          contentGaps: s.contentGaps.filter((g) => g.projectId !== id),
        }));
        logActivity({ what: "حذف مشروعًا", projectId: null, projectTitle: title, toolName: null, outcome: "success", detail: null });
      },

      setProjectStage(id, stage) {
        const idx = PIPELINE_STAGES.indexOf(stage);
        patch("projects", id, {
          stage,
          progress: Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100),
          updatedAt: now(),
        } as unknown as Partial<Row>);
      },

      createIdea(input) {
        const ts = now();
        const idea: Idea = {
          id: uid("idea"),
          title: input.title,
          topic: input.topic ?? "",
          angle: input.angle ?? "",
          potentialHook: input.potentialHook ?? "",
          status: input.status ?? "idea",
          notes: input.notes ?? "",
          projectId: input.projectId ?? null,
          createdAt: ts,
          updatedAt: ts,
          isDemo: false,
        };
        upsert("ideas", mk(idea as unknown as Row));
        return idea;
      },

      updateIdea(id, changes) {
        patch("ideas", id, { ...changes, updatedAt: now() } as unknown as Partial<Row>);
      },

      removeIdea(id) {
        remove("ideas", id);
      },

      ensureConversation(projectId, title) {
        const existing = state.conversations.find((c) => c.projectId === projectId);
        if (existing) return existing;
        const ts = now();
        const conv: Conversation = {
          id: uid("conv"),
          projectId,
          title,
          createdAt: ts,
          updatedAt: ts,
        };
        upsert("conversations", mk(conv as unknown as Row));
        return conv;
      },

      addMessage(input) {
        const msg: Message = { ...input, id: uid("msg"), createdAt: now() };
        upsert("messages", mk(msg as unknown as Row));
        return msg;
      },

      updateMessage(id, changes) {
        patch("messages", id, changes as unknown as Partial<Row>);
      },

      upsertTask(input) {
        const ts = now();
        const task: Task = {
          id: input.id ?? uid("task"),
          projectId: input.projectId ?? null,
          kind: input.kind,
          title: input.title,
          status: input.status,
          progress: input.progress,
          step: input.step,
          error: input.error,
          createdAt: ts,
          updatedAt: ts,
        };
        upsert("tasks", mk(task as unknown as Row));
        return task;
      },

      updateTask(id, changes) {
        patch("tasks", id, { ...changes, updatedAt: now() } as unknown as Partial<Row>);
      },

      addMemory(input) {
        const ts = now();
        const entry: MemoryEntry = { ...input, id: uid("mem"), createdAt: ts, updatedAt: ts };
        upsert("memories", mk(entry as unknown as Row));
        return entry;
      },

      updateMemory(id, changes) {
        patch("memories", id, { ...changes, updatedAt: now() } as unknown as Partial<Row>);
      },

      removeMemory(id) {
        remove("memories", id);
      },

      updateSettings(changes) {
        setState((s) => ({ ...s, settings: { ...s.settings, ...changes } }));
        mark("settings");
      },

      setIntegrationState(id, changes) {
        setState((s) => {
          const list = s.integrationState;
          const idx = list.findIndex((i) => i.id === id);
          const row: IntegrationState = {
            id,
            status: "not_configured",
            keyHint: null,
            lastTestedAt: null,
            lastError: null,
            enabled: true,
            config: {},
            source: null,
            ...(idx >= 0 ? list[idx] : undefined),
            ...changes,
          };
          return { ...s, integrationState: idx >= 0 ? list.map((i, k) => (k === idx ? row : i)) : [...list, row] };
        });
        mark("integrationState");
      },

      logActivity,

      recordUsage(record) {
        setState((s) => ({ ...s, usage: [{ ...record, id: uid("use"), at: now() }, ...s.usage].slice(0, 500) }));
      },

      addSource(source) {
        const row: Source = { ...source, id: source.id ?? uid("src"), savedAt: now() };
        upsert("sources", mk(row as unknown as Row));
        return row;
      },

      addClaim(claim) {
        const row: Claim = { ...claim, id: claim.id ?? uid("clm"), createdAt: now() };
        upsert("claims", mk(row as unknown as Row));
        return row;
      },

      addContradiction(c) {
        const row: Contradiction = { ...c, id: uid("con") };
        upsert("contradictions", mk(row as unknown as Row));
        return row;
      },

      addEvent(e) {
        const row: TimelineEvent = { ...e, id: uid("evt"), createdAt: now() };
        upsert("events", mk(row as unknown as Row));
        return row;
      },

      addEntity(e) {
        const row: Entity = { ...e, id: uid("ent") };
        upsert("entities", mk(row as unknown as Row));
        return row;
      },

      addEdge(e) {
        const row: EntityEdge = { ...e, id: uid("edg") };
        upsert("entityEdges", mk(row as unknown as Row));
        return row;
      },

      addShort(s) {
        const row: Short = { ...s, id: uid("srt"), createdAt: now() };
        upsert("shorts", mk(row as unknown as Row));
        return row;
      },

      addTitleIdea(t) {
        const row: TitleIdea = { ...t, id: uid("ttl"), createdAt: now() };
        upsert("titleIdeas", mk(row as unknown as Row));
        return row;
      },

      addThumbnailConcept(t) {
        const row: ThumbnailConcept = { ...t, id: uid("thb"), createdAt: now() };
        upsert("thumbnailConcepts", mk(row as unknown as Row));
        return row;
      },

      addCompetitor(c) {
        const row: Competitor = { ...c, id: uid("cmp"), addedAt: now() };
        upsert("competitors", mk(row as unknown as Row));
        return row;
      },

      addVideo(v) {
        const row: Video = { ...v, id: uid("vid") };
        upsert("videos", mk(row as unknown as Row));
        return row;
      },

      addTranscript(t) {
        const row: Transcript = { ...t, id: uid("trn"), createdAt: now() };
        upsert("transcripts", mk(row as unknown as Row));
        return row;
      },

      upsertBrief(b) {
        const ts = now();
        const existing = state.researchBriefs.find((x) => x.id === b.id);
        const row: ResearchBrief = {
          ...b,
          id: b.id ?? uid("brf"),
          createdAt: existing?.createdAt ?? ts,
          updatedAt: ts,
        };
        upsert("researchBriefs", mk(row as unknown as Row));
        return row;
      },

      createScript({ projectId, title }) {
        const ts = now();
        const script: Script = {
          id: uid("scr"),
          projectId,
          title,
          structure: null,
          targetDurationSec: 600,
          tone: "سردي هادئ",
          wordCount: 0,
          status: "draft",
          createdAt: ts,
          updatedAt: ts,
          isDemo: false,
        };
        upsert("scripts", mk(script as unknown as Row));
        return script;
      },

      updateScriptSection(id, changes) {
        patch("scriptSections", id, { ...changes, updatedAt: now() } as unknown as Partial<Row>);
      },

      addScriptSection(section) {
        const row: ScriptSection = { ...section, id: uid("sec"), updatedAt: now() };
        upsert("scriptSections", mk(row as unknown as Row));
        return row;
      },

      removeScriptSection(id) {
        remove("scriptSections", id);
      },

      reorderScriptSections(scriptId, orderedIds) {
        setState((s) => {
          const others = s.scriptSections.filter((x) => x.scriptId !== scriptId);
          const mine = s.scriptSections.filter((x) => x.scriptId === scriptId);
          const byId = new Map(mine.map((x) => [x.id, x]));
          const reordered = orderedIds
            .map((id, i) => {
              const sec = byId.get(id);
              return sec ? { ...sec, order: i } : null;
            })
            .filter((x): x is ScriptSection => x !== null);
          return { ...s, scriptSections: [...others, ...reordered] };
        });
        mark("scriptSections");
      },

      ingest(projectId, payload) {
        setState((s) => {
          const next = { ...s };
          const append = <K extends CollectionName>(name: K, filterByProject: boolean) => {
            const incoming = payload[name] as unknown as Row[] | undefined;
            if (!incoming?.length) return;
            const existing = next[name] as unknown as Row[];
            const keep = filterByProject
              ? existing.filter((r) => r.projectId !== projectId)
              : existing;
            (next as unknown as Record<string, Row[]>)[name] = [...keep, ...incoming];
          };
          append("sources", true);
          append("claims", true);
          append("contradictions", true);
          append("events", true);
          append("entities", true);
          append("entityEdges", true);
          if (payload.researchBriefs?.length) {
            const keep = s.researchBriefs.filter((b) => b.projectId !== projectId);
            next.researchBriefs = [...keep, ...(payload.researchBriefs as unknown as ResearchBrief[])];
          }
          return next;
        });
        for (const name of [
          "sources", "claims", "contradictions", "events", "entities", "entityEdges", "researchBriefs",
        ] as CollectionName[]) {
          mark(name);
        }
      },

      async resetToDemo() {
        const demo = buildDemoState();
        setState(demo);
        setIsDemo(true);
        await writeState(demo);
      },

      async wipeAll() {
        const fresh: AppState = {
          ...EMPTY,
          settings: { ...DEFAULT_SETTINGS, onboardedAt: new Date().toISOString() },
          integrationState: [],
        };
        setState(fresh);
        setIsDemo(false);
        await writeState(fresh);
      },

      completeOnboarding() {
        setState((s) => ({ ...s, settings: { ...s.settings, onboardedAt: now() } }));
        mark("settings");
      },
    };
  }, [upsert, patch, remove, replace, logActivity, mark, state]);

  const value = useMemo(
    () => ({ state, ready, isDemo, actions }),
    [state, ready, isDemo, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function useSettings(): Settings {
  return useApp().state.settings;
}

export function useProject(id: string | undefined | null): Project | null {
  const { state } = useApp();
  return useMemo(
    () => (id ? state.projects.find((p) => p.id === id) ?? null : null),
    [id, state.projects],
  );
}

export function useLiveProject(): Project | null {
  const { state } = useApp();
  return useMemo(
    () => state.projects.find((p) => p.stage !== "published" && p.stage !== "archived") ?? state.projects[0] ?? null,
    [state.projects],
  );
}

export function useProjectBundle(projectId: string | null) {
  const { state } = useApp();
  return useMemo(() => {
    if (!projectId) {
      return {
        brief: null, sources: [], claims: [], contradictions: [],
        events: [], entities: [], edges: [], scripts: [], shorts: [],
        titles: [], thumbnails: [], notes: [], gaps: [],
      };
    }
    const script = state.scripts.find((s) => s.projectId === projectId) ?? null;
    return {
      brief: state.researchBriefs.find((b) => b.projectId === projectId) ?? null,
      sources: state.sources.filter((s) => s.projectId === projectId),
      claims: state.claims.filter((c) => c.projectId === projectId),
      contradictions: state.contradictions.filter((c) => c.projectId === projectId),
      events: state.events.filter((e) => e.projectId === projectId).sort((a, b) => a.date.localeCompare(b.date)),
      entities: state.entities.filter((e) => e.projectId === projectId),
      edges: state.entityEdges.filter((e) => e.projectId === projectId),
      scripts: state.scripts.filter((s) => s.projectId === projectId),
      shorts: state.shorts.filter((s) => s.projectId === projectId),
      titles: state.titleIdeas.filter((t) => t.projectId === projectId),
      thumbnails: state.thumbnailConcepts.filter((t) => t.projectId === projectId),
      notes: state.projectNotes.filter((n) => n.projectId === projectId),
      gaps: state.contentGaps.filter((g) => g.projectId === projectId),
      script,
    };
  }, [projectId, state]);
}

export function useScriptSections(scriptId: string | null): ScriptSection[] {
  const { state } = useApp();
  return useMemo(
    () =>
      scriptId
        ? state.scriptSections.filter((s) => s.scriptId === scriptId).sort((a, b) => a.order - b.order)
        : [],
    [scriptId, state.scriptSections],
  );
}

export function useMessages(conversationId: string | null): Message[] {
  const { state } = useApp();
  return useMemo(
    () =>
      conversationId
        ? state.messages
            .filter((m) => m.conversationId === conversationId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        : [],
    [conversationId, state.messages],
  );
}

/** Memory entries actually injected into prompts. */
export function useActiveMemories(): MemoryEntry[] {
  const { state } = useApp();
  return useMemo(
    () => (state.settings.memoryEnabled ? state.memories.filter((m) => m.enabled) : []),
    [state.memories, state.settings.memoryEnabled],
  );
}

export function useUnreadCount(): number {
  const { state } = useApp();
  return useMemo(
    () => state.activity.filter((a) => a.outcome === "failure").length,
    [state.activity],
  );
}

export type { ResearchAngle, WorkflowStep };
