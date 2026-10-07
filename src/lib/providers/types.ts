/**
 * Provider contracts.
 *
 * Every external capability the app needs is expressed as an interface. A
 * provider either talks to a real service (requires a server-side key) or is a
 * demo adapter that returns clearly-labelled fictional data. The UI never knows
 * which one it got — it only knows whether it is in demo mode.
 */

import type {
  Claim,
  CredibilityTier,
  ResearchAngle,
  Source,
  SourceType,
  TimelineEvent,
  Transcript,
  Video,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ProviderErrorCode =
  | "not_configured"
  | "invalid_key"
  | "rate_limited"
  | "network"
  | "not_found"
  | "unsupported"
  | "bad_request"
  | "server";

/**
 * Every failure carries an actionable Arabic explanation. The UI renders
 * `userMessage` directly — we never show a raw stack or "something went wrong".
 */
export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly providerId: string;
  /** Whether the fix is on the user's side (bad key) or transient. */
  readonly remedy: "configure" | "retry" | "wait" | "none";

  constructor(
    code: ProviderErrorCode,
    providerId: string,
    userMessage: string,
    opts: { retryable?: boolean; remedy?: "configure" | "retry" | "wait" | "none" } = {},
  ) {
    super(userMessage);
    this.name = "ProviderError";
    this.code = code;
    this.providerId = providerId;
    this.userMessage = userMessage;
    this.retryable = opts.retryable ?? false;
    this.remedy = opts.remedy ?? "none";
  }
}

export const isProviderError = (e: unknown): e is ProviderError =>
  e instanceof ProviderError;

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export type AICapability =
  | "writing"
  | "analysis"
  | "research_synthesis"
  | "extraction"
  | "fast"
  | "vision";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  capability: AICapability;
  temperature?: number;
  maxTokens?: number;
  /** Provider-specific model override; falls back to the routing table. */
  model?: string;
  /** JSON mode — providers that can't do it fall back to prose + parsing. */
  json?: boolean;
  signal?: AbortSignal;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  demo: boolean;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  complete(req: AIRequest): Promise<AIResponse>;
  /** Cheap liveness probe used by "Test Connection". */
  test(): Promise<{ ok: true; model: string } | { ok: false; error: ProviderError }>;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedAt: string | null;
  sourceType: SourceType;
  score: number;
}

export type SearchDepth = "basic" | "advanced";

export interface SearchRequest {
  query: string;
  depth?: SearchDepth;
  maxResults?: number;
  signal?: AbortSignal;
}

export interface SearchProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  search(req: SearchRequest): Promise<{ hits: SearchHit[]; demo: boolean }>;
  test(): Promise<{ ok: true } | { ok: false; error: ProviderError }>;
}

// ---------------------------------------------------------------------------
// Scrape
// ---------------------------------------------------------------------------

export interface ScrapeRequest {
  url: string;
  signal?: AbortSignal;
}

export interface ScrapeResult {
  url: string;
  markdown: string;
  title: string;
  demo: boolean;
}

export interface ScrapeProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  scrape(req: ScrapeRequest): Promise<ScrapeResult>;
  test(): Promise<{ ok: true } | { ok: false; error: ProviderError }>;
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

export interface YouTubeSearchRequest {
  query: string;
  maxResults?: number;
  signal?: AbortSignal;
}

export interface YouTubeVideoRequest {
  url: string;
  signal?: AbortSignal;
}

export interface YouTubeChannelRequest {
  url: string;
  signal?: AbortSignal;
}

export interface YouTubeProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  search(req: YouTubeSearchRequest): Promise<{ videos: Video[]; demo: boolean }>;
  video(req: YouTubeVideoRequest): Promise<{ video: Video; demo: boolean }>;
  channel(req: YouTubeChannelRequest): Promise<{ channel: ChannelInfo; demo: boolean }>;
  test(): Promise<{ ok: true } | { ok: false; error: ProviderError }>;
}

export interface ChannelInfo {
  id: string;
  name: string;
  handle: string;
  url: string;
  subscribers: number;
  videoCount: number;
  description: string;
  topVideos: Video[];
}

// ---------------------------------------------------------------------------
// Transcript
// ---------------------------------------------------------------------------

export interface TranscriptRequest {
  videoUrl: string;
  language?: string;
  signal?: AbortSignal;
}

export interface TranscriptProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  transcribe(req: TranscriptRequest): Promise<{ transcript: Transcript; demo: boolean }>;
  test(): Promise<{ ok: true } | { ok: false; error: ProviderError }>;
}

// ---------------------------------------------------------------------------
// Analysis (local — no external call)
// ---------------------------------------------------------------------------

export interface AnalysisInput {
  topic: string;
  mainQuestion: string;
  subQuestions: string[];
  targetAudience: string;
  contentType: string;
  goal: string;
}

export interface AngleSuggestion extends ResearchAngle {}

export interface ExtractedSource {
  title: string;
  url: string;
  sourceType: SourceType;
  credibility: CredibilityTier;
  publishedAt: string | null;
  summary: string;
  quotes: { text: string; locator: string | null }[];
  facts: string[];
}

export interface AnalysisProvider {
  readonly id: string;
  complete(input: AnalysisInput): Promise<{ angles: AngleSuggestion[]; demo: boolean }>;
  extract(source: { title: string; url: string; content: string }): Promise<{
    summary: string;
    quotes: { text: string; locator: string | null }[];
    facts: string[];
    demo: boolean;
  }>;
  claims(sources: { id: string; title: string; facts: string[] }[]): Promise<{ claims: Claim[]; demo: boolean }>;
  synthesize(input: {
    question: string;
    sources: { id: string; title: string; summary: string; facts: string[] }[];
  }): Promise<{ text: string; demo: boolean }>;
  timeline(events: { title: string; description: string; date: string }[]): Promise<{
    events: Pick<TimelineEvent, "date" | "title" | "description" | "confidence">[];
    demo: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface ProviderSnapshot {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  demo: boolean;
  enabled: boolean;
  source: "vault" | "env" | null;
  lastError: string | null;
}

export interface ResolvedProviders {
  ai: AIProvider | null;
  search: SearchProvider | null;
  scrape: ScrapeProvider | null;
  youtube: YouTubeProvider | null;
  transcript: TranscriptProvider | null;
  analysis: AnalysisProvider;
  /** True when at least one real (non-demo) provider is wired up. */
  hasRealMode: boolean;
  snapshot: ProviderSnapshot[];
}
