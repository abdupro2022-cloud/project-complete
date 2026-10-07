import "server-only";

import { getSecret, getSecretConfig, secretSource } from "./vault";
import { ProviderError, type AIProvider, type AIRequest, type AIResponse, type ScrapeProvider, type ScrapeRequest, type ScrapeResult, type SearchProvider, type SearchRequest, type SearchHit, type TranscriptProvider, type TranscriptRequest, type YouTubeProvider, type ChannelInfo } from "@/lib/providers/types";
import { domainOf, uid } from "@/lib/utils";
import type { SourceType, Video } from "@/lib/types";

/**
 * Real network providers.
 *
 * Every class here follows the same contract: it holds a key that was resolved
 * server-side, and it converts transport failures into `ProviderError` with an
 * Arabic explanation and a concrete remedy. No raw upstream message is ever
 * surfaced to the UI.
 */

const UA = "ABDO-Creator-OS/1.0";

async function fetchJson(
  url: string,
  init: RequestInit & { timeoutMs?: number },
  providerId: string,
  notConfiguredMsg: string,
): Promise<unknown> {
  const { timeoutMs = 20_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal, headers: { "User-Agent": UA, ...(rest.headers ?? {}) } });
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("invalid_key", providerId, "المفتاح غير صالح أو انتهت صلاحيته. افتح الإعدادات وأعد إدخاله.", { remedy: "configure" });
    }
    if (res.status === 429) {
      throw new ProviderError("rate_limited", providerId, "تجاوزت حد الطلبات. انتظر قليلًا ثم أعد المحاولة.", { retryable: true, remedy: "wait" });
    }
    if (res.status === 404) {
      throw new ProviderError("not_found", providerId, "العنصر غير موجود. تحقق من الرابط أو المعرّف.", { remedy: "configure" });
    }
    if (res.status >= 500) {
      throw new ProviderError("server", providerId, "أرجع خادم المزوّد خطأً مؤقتًا. أعد المحاولة بعد قليل.", { retryable: true, remedy: "retry" });
    }
    if (!res.ok) {
      throw new ProviderError("bad_request", providerId, `تعذّر إتمام الطلب (رمز ${res.status}). ${notConfiguredMsg}`, { retryable: false, remedy: "configure" });
    }
    return await res.json();
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    if ((e as Error)?.name === "AbortError") {
      throw new ProviderError("network", providerId, "انتهت مهلة الطلب. الشبكة بطيئة أو الخدمة لا تستجيب.", { retryable: true, remedy: "retry" });
    }
    throw new ProviderError("network", providerId, "تعذّر الاتصال بالخدمة. تحقق من الشبكة أو جرّب لاحقًا.", { retryable: true, remedy: "retry" });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// AI — DeepSeek (OpenAI-compatible)
// ---------------------------------------------------------------------------

export class DeepSeekProvider implements AIProvider {
  readonly id = "deepseek";
  readonly name = "DeepSeek";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async complete(req: AIRequest): Promise<AIResponse> {
    const model = req.model ?? "deepseek-chat";
    const data = (await fetchJson(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model,
          messages: req.messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 2000,
          ...(req.json ? { response_format: { type: "json_object" } } : {}),
        }),
      },
      this.id,
      "تحقق من مفتاح DeepSeek من الإعدادات.",
    )) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: data.choices?.[0]?.message?.content ?? "",
      provider: this.id,
      model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      demo: false,
    };
  }

  async test() {
    try {
      await this.complete({ messages: [{ role: "user", content: "ping" }], capability: "fast", maxTokens: 8 });
      return { ok: true as const, model: "deepseek-chat" };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// AI — Gemini
// ---------------------------------------------------------------------------

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Gemini";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async complete(req: AIRequest): Promise<AIResponse> {
    const model = req.model ?? "gemini-3.5-flash";
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const data = (await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.maxTokens ?? 2000,
            ...(req.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
      this.id,
      "تحقق من مفتاح Gemini من الإعدادات.",
    )) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    return {
      text: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "",
      provider: this.id,
      model,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      demo: false,
    };
  }

  async test() {
    try {
      await this.complete({ messages: [{ role: "user", content: "ping" }], capability: "fast", maxTokens: 8 });
      return { ok: true as const, model: "gemini-3.5-flash" };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// AI — OpenRouter (model chosen in settings)
// ---------------------------------------------------------------------------

export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter";
  constructor(private readonly apiKey: string, private readonly defaultModel: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async complete(req: AIRequest): Promise<AIResponse> {
    const model = req.model ?? this.defaultModel;
    const data = (await fetchJson(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://abdo-creator-os.local",
          "X-Title": "ABDO CREATOR OS",
        },
        body: JSON.stringify({
          model,
          messages: req.messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 2000,
        }),
        timeoutMs: 45_000,
      },
      this.id,
      "تحقق من مفتاح OpenRouter وتأكد أن اسم النموذج صحيح.",
    )) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: data.choices?.[0]?.message?.content ?? "",
      provider: this.id,
      model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      demo: false,
    };
  }

  async test() {
    try {
      const res = await this.complete({ messages: [{ role: "user", content: "ping" }], capability: "fast", maxTokens: 8 });
      return { ok: true as const, model: res.model };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// Search — Tavily
// ---------------------------------------------------------------------------

export class TavilySearchProvider implements SearchProvider {
  readonly id = "tavily";
  readonly name = "Tavily";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async search(req: SearchRequest): Promise<{ hits: SearchHit[]; demo: boolean }> {
    const data = (await fetchJson(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: req.query,
          search_depth: req.depth ?? "advanced",
          max_results: req.maxResults ?? 8,
          include_answer: false,
          include_raw_content: false,
        }),
      },
      this.id,
      "تحقق من مفتاح Tavily من الإعدادات.",
    )) as {
      results?: {
        title?: string;
        url?: string;
        content?: string;
        score?: number;
        published_date?: string;
      }[];
    };

    const hits: SearchHit[] = (data.results ?? [])
      .filter((r) => r.url)
      .map((r) => ({
        title: r.title ?? "بدون عنوان",
        url: r.url as string,
        snippet: (r.content ?? "").slice(0, 400),
        domain: domainOf(r.url as string),
        publishedAt: r.published_date ?? null,
        sourceType: "other" as SourceType,
        score: r.score ?? 0,
      }));

    if (hits.length === 0) {
      throw new ProviderError("not_found", this.id, "لم يُرجع البحث أي نتائج. جرّب صياغة استعلام مختلفة أو تحقق من مفتاحك.", { retryable: true, remedy: "retry" });
    }
    return { hits, demo: false };
  }

  async test() {
    try {
      await this.search({ query: "test", maxResults: 1 });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// Scrape — Firecrawl
// ---------------------------------------------------------------------------

export class FirecrawlProvider implements ScrapeProvider {
  readonly id = "firecrawl";
  readonly name = "Firecrawl";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async scrape(req: ScrapeRequest): Promise<ScrapeResult> {
    const data = (await fetchJson(
      "https://api.firecrawl.dev/v1/scrape",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ url: req.url, formats: ["markdown"], onlyMainContent: true }),
        timeoutMs: 45_000,
      },
      this.id,
      "تحقق من مفتاح Firecrawl من الإعدادات.",
    )) as { data?: { markdown?: string; metadata?: { title?: string } } };

    const markdown = data.data?.markdown ?? "";
    if (!markdown.trim()) {
      throw new ProviderError("not_found", this.id, "لم يُرجع الاستخراج أي محتوى. قد تكون الصفحة محمية أو تعتمد على JavaScript.", { remedy: "retry" });
    }
    return {
      url: req.url,
      markdown,
      title: data.data?.metadata?.title ?? "بدون عنوان",
      demo: false,
    };
  }

  async test() {
    try {
      await this.scrape({ url: "https://example.com" });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// YouTube Data API v3
// ---------------------------------------------------------------------------

const ISO_DURATION = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

function parseDuration(iso: string): number {
  const m = iso.match(ISO_DURATION);
  if (!m) return 0;
  const [, d, h, mi, s] = m.map((x) => (x ? Number(x) : 0)) as number[];
  return d * 86400 + h * 3600 + mi * 60 + s;
}

export class YouTubeApiProvider implements YouTubeProvider {
  readonly id = "youtube";
  readonly name = "YouTube Data API v3";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  private async call(params: Record<string, string>) {
    const qs = new URLSearchParams({ ...params, key: this.apiKey });
    // Channels.list, search.list, and videos.list are distinct endpoints.
    // Pick the right one based on which query parameters the caller passed.
    const endpoint = params.part === "search"
      ? "search"
      : params.forHandle || params.forUsername || params.id && params.channelId
        ? "channels"
        : "videos";
    return (await fetchJson(
      `https://www.googleapis.com/youtube/v3/${endpoint}?${qs}`,
      { method: "GET" },
      this.id,
      "تحقق من مفتاح YouTube وتأكد من تفعيل YouTube Data API v3 في مشروع Google Cloud.",
    )) as Record<string, unknown>;
  }

  private toVideo(item: Record<string, unknown>, snippet?: Record<string, unknown>): Video {
    const sn = (item.snippet as Record<string, unknown>) ?? snippet ?? {};
    const stats = (item.statistics as Record<string, unknown>) ?? {};
    const content = (item.contentDetails as Record<string, unknown>) ?? {};
    const id = (item.id as Record<string, unknown>) ?? {};
    const videoId = String(id.videoId ?? item.id ?? "");
    return {
      id: uid("vid"),
      projectId: null,
      channelId: String(sn.channelId ?? ""),
      channelName: String(sn.channelTitle ?? "قناة مجهولة"),
      channelUrl: String(sn.channelTitle ? `https://www.youtube.com/channel/${sn.channelId}` : ""),
      youtubeId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: String(sn.title ?? "بدون عنوان"),
      description: String(sn.description ?? "").slice(0, 600),
      thumbnailUrl: (sn.thumbnails as { high?: { url?: string } } | undefined)?.high?.url ?? "",
      views: Number(stats.viewCount ?? 0),
      likes: Number(stats.likeCount ?? 0),
      comments: Number(stats.commentCount ?? 0),
      durationSec: parseDuration(String(content.duration ?? "")),
      publishedAt: String(sn.publishedAt ?? new Date().toISOString()),
      topic: "",
      structure: null,
      isDemo: false,
    };
  }

  async search(req: { query: string; maxResults?: number; signal?: AbortSignal }) {
    const data = await this.call({
      part: "snippet",
      q: req.query,
      type: "video",
      maxResults: String(req.maxResults ?? 8),
    });
    const items = (data.items as Record<string, unknown>[]) ?? [];
    return { videos: items.map((i) => this.toVideo(i)), demo: false };
  }

  async video(req: { url: string; signal?: AbortSignal }) {
    const videoId = extractYouTubeId(req.url);
    if (!videoId) {
      throw new ProviderError("bad_request", this.id, "الرابط لا يحتوي على معرّف فيديو صالح. تأكد أنه رابط YouTube كامل.", { remedy: "configure" });
    }
    const data = await this.call({ part: "snippet,statistics,contentDetails", id: videoId });
    const item = (data.items as Record<string, unknown>[])?.[0];
    if (!item) throw new ProviderError("not_found", this.id, "الفيديو غير موجود أو محذوف أو خاص.", {});
    return { video: this.toVideo(item), demo: false };
  }

  async channel(req: { url: string; signal?: AbortSignal }): Promise<{ channel: ChannelInfo; demo: boolean }> {
    const handle = req.url.split("/").filter(Boolean).pop() ?? "";
    const data = await this.call({ part: "snippet,statistics,contentDetails", forHandle: handle.replace(/^@/, "") });
    const item = (data.items as Record<string, unknown>[])?.[0];
    if (!item) throw new ProviderError("not_found", this.id, "لم يُعثر على القناة. تحقق من اسم المعرّف (@handle).", {});
    const sn = item.snippet as Record<string, unknown>;
    const stats = item.statistics as Record<string, unknown>;
    return {
      demo: false,
      channel: {
        id: String(item.id ?? ""),
        name: String(sn.title ?? ""),
        handle: String(sn.customUrl ?? ""),
        url: String(sn.customUrl ?? req.url),
        subscribers: Number(stats.subscriberCount ?? 0),
        videoCount: Number((item.contentDetails as Record<string, unknown>)?.videoCount ?? 0),
        description: String(sn.description ?? "").slice(0, 400),
        topVideos: [],
      },
    };
  }

  async test() {
    try {
      await this.call({ part: "snippet", chart: "mostPopular", maxResults: "1" });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Transcript — provider is configured, not hard-coded
// ---------------------------------------------------------------------------

export class ConfiguredTranscriptProvider implements TranscriptProvider {
  readonly id = "video_to_text";
  readonly name: string;
  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly model: string,
    private readonly label: string,
  ) {
    this.name = label;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.endpoint);
  }

  async transcribe(req: TranscriptRequest) {
    if (!this.isConfigured()) {
      throw new ProviderError("not_configured", this.id, "مزوّد التفريغ غير مكتمل. أضف المفتاح ورابط الـ Endpoint من الإعدادات.", { remedy: "configure" });
    }
    const data = (await fetchJson(
      this.endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ url: req.videoUrl, model: this.model || undefined, language: req.language ?? "ar" }),
        timeoutMs: 180_000,
      },
      this.id,
      "تحقق من إعدادات مزوّد التفريغ.",
    )) as {
      text?: string;
      segments?: { start?: number; end?: number; text?: string }[];
      chapters?: { start?: number; title?: string; summary?: string }[];
    };

    const text = data.text ?? (data.segments ?? []).map((s) => s.text ?? "").join(" ");
    if (!text.trim()) {
      throw new ProviderError("not_found", this.id, "لم يُرجع المزوّد أي نص. قد يكون الفيديو محميًا أو رابطه غير مدعوم.", { remedy: "retry" });
    }

    return {
      demo: false,
      transcript: {
        id: uid("trn"),
        projectId: null,
        videoUrl: req.videoUrl,
        provider: this.id,
        language: req.language ?? "ar",
        segments: (data.segments ?? []).map((s) => ({ startSec: s.start ?? 0, endSec: s.end ?? 0, text: s.text ?? "" })),
        summary: "",
        keyPoints: [],
        quotes: [],
        hook: "",
        structure: "",
        arguments: [],
        cta: "",
        chapters: (data.chapters ?? []).map((c) => ({ startSec: c.start ?? 0, title: c.title ?? "", summary: c.summary ?? "" })),
        createdAt: new Date().toISOString(),
        isDemo: false,
      },
    };
  }

  async test() {
    try {
      if (!this.isConfigured()) {
        throw new ProviderError("not_configured", this.id, "المفتاح أو رابط الـ Endpoint ناقص.", { remedy: "configure" });
      }
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e as ProviderError };
    }
  }
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export interface ResolvedSecrets {
  gemini: string | null;
  deepseek: string | null;
  openrouter: string | null;
  tavily: string | null;
  firecrawl: string | null;
  youtube: string | null;
  videoToText: string | null;
  videoToTextEndpoint: string | null;
  videoToTextModel: string | null;
  openrouterModel: string | null;
}

export async function resolveSecrets(): Promise<ResolvedSecrets> {
  const [gemini, deepseek, openrouter, tavily, firecrawl, youtube, v2t] = await Promise.all([
    getSecret("gemini", "GEMINI_API_KEY"),
    getSecret("deepseek", "DEEPSEEK_API_KEY"),
    getSecret("openrouter", "OPENROUTER_API_KEY"),
    getSecret("tavily", "TAVILY_API_KEY"),
    getSecret("firecrawl", "FIRECRAWL_API_KEY"),
    getSecret("youtube", "YOUTUBE_API_KEY"),
    getSecret("video_to_text", "VIDEO_TO_TEXT_API_KEY"),
  ]);
  // Configs persisted in the vault take priority; environment variables stay
  // as the fallback so deployments that rely on env-only still work.
  const [v2tCfg, openrouterCfg] = await Promise.all([
    getSecretConfig("video_to_text"),
    getSecretConfig("openrouter"),
  ]);

  return {
    gemini,
    deepseek,
    openrouter,
    tavily,
    firecrawl,
    youtube,
    videoToText: v2t,
    videoToTextEndpoint: v2tCfg?.endpoint?.trim() || process.env.VIDEO_TO_TEXT_ENDPOINT || null,
    videoToTextModel: v2tCfg?.model?.trim() || process.env.VIDEO_TO_TEXT_MODEL || null,
    openrouterModel:
      openrouterCfg?.model?.trim() || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  };
}

export async function sourceOf(id: string, envVar: string) {
  return secretSource(id, envVar);
}
