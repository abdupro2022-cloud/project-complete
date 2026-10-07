"use client";

import type { Video } from "@/lib/types";
import type { SearchHit } from "@/lib/providers/types";

/**
 * Client-side API client.
 *
 * One place that knows the wire format, so components never see `fetch` or a
 * raw envelope. Every failure surfaces as an `ApiError` carrying the server's
 * Arabic explanation and remedy, which the UI renders directly.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly remedy: "configure" | "retry" | "wait" | "none";
  readonly retryable: boolean;
  readonly providerId?: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    opts: { remedy?: "configure" | "retry" | "wait" | "none"; retryable?: boolean; providerId?: string; status?: number } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.remedy = opts.remedy ?? "none";
    this.retryable = opts.retryable ?? false;
    this.providerId = opts.providerId;
    this.status = opts.status ?? 0;
  }
}

/** Raised when the app is running as a static bundle with no server routes. */
export const NO_SERVER = "no_server";

/** Set once we learn the bundle has no server. `null` = not probed yet,
 * `true`/`false` = known. */
let serverPresent: boolean | null = null;

export function markServerAbsent(): void {
  serverPresent = false;
  healthCache = null;
}

export function hasServer(): boolean {
  return serverPresent !== false;
}

/** Message shown when the bundle runs without a backend. */
export const NO_SERVER_MSG =
  "هذه نسخة عرض بلا خادم. شغّل التطبيق محلياً (npm run build && npm start) لتفعيل الأدوات الحقيقية ومفاتيح API.";

/**
 * Static fallback — when the host answers with an HTML 404 or the fetch fails,
 * run the same demo adapters the server uses. They are pure and deterministic,
 * so the whole product stays explorable offline. Saving keys / live calls are
 * intentionally server-only and report honestly here.
 */
async function offlineFallback<T>(path: string, init?: RequestInit): Promise<{ data: T; mode: "live" | "demo" }> {
  const body = (() => {
    if (!init?.body || typeof init.body !== "string") return {} as Record<string, unknown>;
    try {
      return JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  })();

  const { DemoAIProvider, DemoSearchProvider, DemoScrapeProvider, DemoYouTubeProvider, DemoTranscriptProvider } =
    await import("@/lib/providers/demo");

  switch (path) {
    case "/api/ai": {
      const req = body as { messages: { role: "system" | "user" | "assistant"; content: string }[]; capability?: string };
      const res = await new DemoAIProvider().complete(req as unknown as Parameters<typeof DemoAIProvider.prototype.complete>[0]);
      return { data: { text: res.text, provider: res.provider, model: res.model, inputTokens: res.inputTokens, outputTokens: res.outputTokens, demo: true } as unknown as T, mode: "demo" };
    }
    case "/api/search": {
      const q = String(body.query ?? "");
      if (q.trim().length < 2) {
        throw new ApiError("invalid_query", "اكتب استعلامًا من حرفين على الأقل.", { remedy: "none", status: 400 });
      }
      const res = await new DemoSearchProvider().search({
        query: q,
        depth: (body.depth as "basic" | "advanced") ?? "advanced",
        maxResults: (body.maxResults as number) ?? 8,
      });
      return { data: { hits: res.hits, demo: true } as unknown as T, mode: "demo" };
    }
    case "/api/scrape": {
      const url = String(body.url ?? "");
      if (!/^https?:\/\//i.test(url)) {
        throw new ApiError("invalid_url", "أدخل رابطًا يبدأ بـ https://", { remedy: "none", status: 400 });
      }
      const res = await new DemoScrapeProvider().scrape({ url });
      return { data: { url: res.url, markdown: res.markdown, title: res.title, demo: true } as unknown as T, mode: "demo" };
    }
    case "/api/youtube": {
      const p = new DemoYouTubeProvider();
      if (body.action === "video") {
        const res = await p.video({ url: String(body.url ?? "") });
        return { data: { video: res.video } as unknown as T, mode: "demo" };
      }
      const res = await p.search({ query: String(body.query ?? ""), maxResults: (body.maxResults as number) ?? 8 });
      return { data: { videos: res.videos } as unknown as T, mode: "demo" };
    }
    case "/api/transcript": {
      const res = await new DemoTranscriptProvider().transcribe({ videoUrl: String(body.url ?? ""), language: String(body.language ?? "ar") });
      return { data: { transcript: res } as unknown as T, mode: "demo" };
    }
    default:
      throw new ApiError(NO_SERVER, NO_SERVER_MSG, { remedy: "none", status: 0 });
  }
}

/** Returns true for endpoints we can emulate without a server. */
function supportsOffline(path: string): boolean {
  return path === "/api/ai" || path === "/api/search" || path === "/api/scrape" || path === "/api/youtube" || path === "/api/transcript";
}

async function request<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<{ data: T; mode: "live" | "demo" }> {
  // If we already know there's no server, take the offline path immediately.
  if (serverPresent === false && supportsOffline(path)) {
    return offlineFallback<T>(path, init);
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    serverPresent = false;
    if (supportsOffline(path)) return offlineFallback<T>(path, init);
    throw new ApiError(NO_SERVER, NO_SERVER_MSG, { remedy: "none", status: 0 });
  }

  // Static hosts return an HTML 404 page for unknown API routes.
  if (res.status === 404 || res.status === 405) {
    serverPresent = false;
    if (supportsOffline(path)) return offlineFallback<T>(path, init);
    throw new ApiError(NO_SERVER, NO_SERVER_MSG, { remedy: "none", status: 404 });
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    serverPresent = false;
    if (supportsOffline(path)) return offlineFallback<T>(path, init);
    throw new ApiError(NO_SERVER, NO_SERVER_MSG, { remedy: "none", status: res.status });
  }

  const env = payload as
    | { ok: true; data: T; mode: "live" | "demo" }
    | { ok: false; error: { code: string; message: string; remedy: ApiError["remedy"]; retryable: boolean; providerId?: string } };

  if (!env.ok) {
    throw new ApiError(env.error.code, env.error.message, {
      remedy: env.error.remedy,
      retryable: env.error.retryable,
      ...(env.error.providerId ? { providerId: env.error.providerId } : {}),
      status: res.status,
    });
  }
  serverPresent = true;
  return { data: env.data, mode: env.mode };
}

// ---------------------------------------------------------------------------
// Capability probe
// ---------------------------------------------------------------------------

export interface HealthReport {
  hasRealMode: boolean;
  vaultPersistent: boolean;
  providers: {
    id: string;
    name: string;
    category: string;
    configured: boolean;
    source: "vault" | "env" | null;
  }[];
  catalog: {
    id: string;
    name: string;
    category: string;
    description: string;
    envVar: string;
    keyUrl: string;
    docsUrl: string;
    capabilities: string[];
    requiredFields: { key: string; label: string; placeholder: string }[];
  }[];
}

let healthCache: HealthReport | null = null;

export async function fetchHealth(force = false): Promise<HealthReport> {
  if (healthCache && !force) return healthCache;
  // The static demo has no vault and no integrations, but we still want the
  // Settings → Integrations page to render. Return a minimal report.
  if (serverPresent === false) {
    healthCache = offlineHealth();
    return healthCache;
  }
  try {
    const { data } = await request<HealthReport>("/api/health");
    healthCache = data;
    return data;
  } catch {
    throw new ApiError(NO_SERVER, NO_SERVER_MSG, { remedy: "none", status: 0 });
  }
}

/**
 * Health for a serverless bundle. Every integration is reported as
 * unconfigured — there is nowhere to store a key — and the catalog is the
 * same one shown on the Settings page so the UI stays consistent.
 */
function offlineHealth(): HealthReport {
  // Inline copy of the integration types. Intentionally not a deep import —
  // keeps the static bundle lean and means the catalog remains honest even
  // when the server is offline.
  const catalog: HealthReport["catalog"] = [
    { id: "gemini", name: "Google Gemini", category: "ai", description: "تحليل وبحث وتوليد.", envVar: "GEMINI_API_KEY", keyUrl: "https://aistudio.google.com/apikey", docsUrl: "https://ai.google.dev/", capabilities: ["writing", "analysis", "research_synthesis", "vision"], requiredFields: [{ key: "apiKey", label: "مفتاح Gemini", placeholder: "AIza…" }] },
    { id: "deepseek", name: "DeepSeek", category: "ai", description: "كتابة سريعة بتكلفة منخفضة.", envVar: "DEEPSEEK_API_KEY", keyUrl: "https://platform.deepseek.com/api_keys", docsUrl: "https://platform.deepseek.com/docs", capabilities: ["writing", "fast"], requiredFields: [{ key: "apiKey", label: "مفتاح DeepSeek", placeholder: "sk-…" }] },
    { id: "openrouter", name: "OpenRouter", category: "ai", description: "موجّه لنماذج متعددة.", envVar: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/settings/keys", docsUrl: "https://openrouter.ai/docs", capabilities: ["writing", "analysis", "research_synthesis", "extraction"], requiredFields: [{ key: "apiKey", label: "مفتاح OpenRouter", placeholder: "sk-or-…" }] },
    { id: "tavily", name: "Tavily", category: "search", description: "بحث ويب مُحَكَّم.", envVar: "TAVILY_API_KEY", keyUrl: "https://tavily.com/", docsUrl: "https://docs.tavily.com/", capabilities: ["search"], requiredFields: [{ key: "apiKey", label: "مفتاح Tavily", placeholder: "tvly-…" }] },
    { id: "firecrawl", name: "Firecrawl", category: "scrape", description: "استخراج محتوى صفحات كاملة.", envVar: "FIRECRAWL_API_KEY", keyUrl: "https://firecrawl.dev/", docsUrl: "https://docs.firecrawl.dev/", capabilities: ["scrape"], requiredFields: [{ key: "apiKey", label: "مفتاح Firecrawl", placeholder: "fc-…" }] },
    { id: "youtube", name: "YouTube Data API v3", category: "youtube", description: "بحث وفيديوهات.", envVar: "YOUTUBE_API_KEY", keyUrl: "https://console.cloud.google.com/apis/credentials", docsUrl: "https://developers.google.com/youtube/v3", capabilities: ["search", "video"], requiredFields: [{ key: "apiKey", label: "مفتاح YouTube", placeholder: "AIza…" }] },
    { id: "transcript", name: "خدمة التفريغ النصي", category: "transcript", description: "تفريغ نص الفيديو.", envVar: "TRANSCRIPT_API_KEY", keyUrl: "", docsUrl: "", capabilities: ["transcript"], requiredFields: [{ key: "apiKey", label: "مفتاح التفريغ", placeholder: "" }] },
  ];

  return {
    hasRealMode: false,
    vaultPersistent: false,
    providers: catalog.map((c) => ({ id: c.id, name: c.name, category: c.category, configured: false, source: null })),
    catalog,
  };
}

export function isServerAvailable(): boolean {
  return typeof window !== "undefined" && !window.location.protocol.startsWith("file");
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export interface AIResult {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  demo: boolean;
}

export async function callAI(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  capability: "writing" | "analysis" | "research_synthesis" | "extraction" | "fast" | "vision" = "writing",
  opts: { temperature?: number; maxTokens?: number; prefer?: "gemini" | "deepseek" | "openrouter" | "auto" } = {},
  signal?: AbortSignal,
): Promise<AIResult> {
  const { data } = await request<AIResult>(
    "/api/ai",
    {
      method: "POST",
      ...(signal ? { signal } : {}),
      body: JSON.stringify({ messages, capability, ...opts }),
    },
  );
  return data;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export async function searchWeb(
  query: string,
  opts: { depth?: "basic" | "advanced"; maxResults?: number } = {},
  signal?: AbortSignal,
): Promise<{ hits: SearchHit[]; demo: boolean }> {
  const { data } = await request<{ hits: SearchHit[]; demo: boolean }>(
    "/api/search",
    { method: "POST", ...(signal ? { signal } : {}), body: JSON.stringify({ query, depth: "advanced", maxResults: 8, ...opts }) },
  );
  return data;
}

export async function scrapePage(url: string, signal?: AbortSignal) {
  const { data } = await request<{ url: string; markdown: string; title: string; demo: boolean }>(
    "/api/scrape",
    { method: "POST", ...(signal ? { signal } : {}), body: JSON.stringify({ url }) },
  );
  return data;
}

export async function youtubeSearch(query: string, maxResults = 8, signal?: AbortSignal) {
  const { data } = await request<{ videos: Video[] }>(
    "/api/youtube",
    { method: "POST", ...(signal ? { signal } : {}), body: JSON.stringify({ action: "search", query, maxResults }) },
  );
  return data.videos;
}

export async function youtubeVideo(url: string, signal?: AbortSignal) {
  const { data } = await request<{ video: Video }>(
    "/api/youtube",
    { method: "POST", ...(signal ? { signal } : {}), body: JSON.stringify({ action: "video", url }) },
  );
  return data.video;
}

export async function transcribeVideo(url: string, language = "ar", signal?: AbortSignal) {
  const { data } = await request<{ transcript: import("@/lib/types").Transcript }>(
    "/api/transcript",
    { method: "POST", ...(signal ? { signal } : {}), body: JSON.stringify({ url, language }) },
  );
  return data.transcript;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export async function saveKey(integrationId: string, value: string, config?: Record<string, string>) {
  const { data } = await request<{ persisted: boolean }>("/api/keys", {
    method: "POST",
    body: JSON.stringify({
      integrationId,
      value,
      ...(config && Object.keys(config).length > 0 ? { config } : {}),
    }),
  });
  healthCache = null;
  return data;
}

export async function removeKey(integrationId: string) {
  await request<{ removed: boolean }>("/api/keys", {
    method: "DELETE",
    body: JSON.stringify({ integrationId }),
  });
  healthCache = null;
}

export interface TestResult {
  ok: boolean;
  detail: string;
  remedy: "configure" | "retry" | "wait" | "none";
}

export async function testConnection(integrationId: string): Promise<TestResult> {
  const { data } = await request<TestResult>("/api/integrations/test", {
    method: "POST",
    body: JSON.stringify({ integrationId }),
  });
  return data;
}