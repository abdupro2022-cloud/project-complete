import "server-only";

import {
  DemoAIProvider,
  DemoAnalysisProvider,
  DemoScrapeProvider,
  DemoSearchProvider,
  DemoTranscriptProvider,
  DemoYouTubeProvider,
} from "@/lib/providers/demo";
import type {
  AIProvider,
  AICapability,
  AnalysisProvider,
  ProviderSnapshot,
  ScrapeProvider,
  SearchProvider,
  TranscriptProvider,
  YouTubeProvider,
} from "@/lib/providers/types";
import { INTEGRATIONS, type IntegrationId } from "@/lib/types";
import {
  ConfiguredTranscriptProvider,
  DeepSeekProvider,
  FirecrawlProvider,
  GeminiProvider,
  OpenRouterProvider,
  TavilySearchProvider,
  YouTubeApiProvider,
  resolveSecrets,
} from "./providers";
import { maskHint, secretSource } from "./vault";

/**
 * Provider registry.
 *
 * One place decides, for every capability, whether a real provider or a demo
 * adapter serves the request. The rest of the app asks for a capability and
 * never constructs a provider itself.
 */

export interface Registry {
  ai(capability: AICapability, prefer?: string): AIProvider;
  search(): SearchProvider;
  scrape(): ScrapeProvider;
  youtube(): YouTubeProvider;
  transcript(): TranscriptProvider;
  analysis(): AnalysisProvider;
  hasRealMode: boolean;
  snapshot: ProviderSnapshot[];
}

function pickAI(
  secrets: Awaited<ReturnType<typeof resolveSecrets>>,
  capability: AICapability,
  prefer?: string,
): AIProvider {
  const order: IntegrationId[] =
    prefer && prefer !== "auto"
      ? [prefer as IntegrationId]
      : capability === "fast"
        ? ["deepseek", "gemini", "openrouter"]
        : capability === "extraction" || capability === "analysis"
          ? ["gemini", "deepseek", "openrouter"]
          : ["deepseek", "gemini", "openrouter"];

  for (const id of order) {
    if (id === "gemini" && secrets.gemini) return new GeminiProvider(secrets.gemini);
    if (id === "deepseek" && secrets.deepseek) return new DeepSeekProvider(secrets.deepseek);
    if (id === "openrouter" && secrets.openrouter) {
      return new OpenRouterProvider(secrets.openrouter, secrets.openrouterModel ?? "openai/gpt-4o-mini");
    }
  }
  return new DemoAIProvider();
}

export async function buildRegistry(): Promise<Registry> {
  const s = await resolveSecrets();
  const analysis = new DemoAnalysisProvider();

  const realAI = Boolean(s.gemini || s.deepseek || s.openrouter);
  const realSearch = Boolean(s.tavily);
  const realScrape = Boolean(s.firecrawl);
  const realYouTube = Boolean(s.youtube);
  const realTranscript = Boolean(s.videoToText && s.videoToTextEndpoint);

  const search: SearchProvider = s.tavily ? new TavilySearchProvider(s.tavily) : new DemoSearchProvider();
  const scrape: ScrapeProvider = s.firecrawl ? new FirecrawlProvider(s.firecrawl) : new DemoScrapeProvider();
  const youtube: YouTubeProvider = s.youtube ? new YouTubeApiProvider(s.youtube) : new DemoYouTubeProvider();
  const transcript: TranscriptProvider =
    s.videoToText && s.videoToTextEndpoint
      ? new ConfiguredTranscriptProvider(
          s.videoToText,
          s.videoToTextEndpoint,
          s.videoToTextModel ?? "",
          "Video-to-Text",
        )
      : new DemoTranscriptProvider();

  const aiFor = (capability: AICapability, prefer?: string) => pickAI(s, capability, prefer);

  // Status per integration, resolved from vault then env.
  const snapshot: ProviderSnapshot[] = await Promise.all(
    INTEGRATIONS.map(async (meta) => {
      const src = await secretSource(meta.id, meta.envVar);
      const secret =
        src === "vault"
          ? await maskHintFor(meta.id, meta.envVar)
          : meta.envVar && process.env[meta.envVar]
            ? maskHint(process.env[meta.envVar] as string)
            : null;
      return {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        configured: Boolean(src),
        demo: false,
        enabled: true,
        source: src,
        lastError: null,
        ...(secret ? {} : {}),
      } satisfies ProviderSnapshot;
    }),
  );

  return {
    ai: aiFor,
    search: () => search,
    scrape: () => scrape,
    youtube: () => youtube,
    transcript: () => transcript,
    analysis: () => analysis,
    hasRealMode: realAI || realSearch || realScrape || realYouTube || realTranscript,
    snapshot,
  };
}

async function maskHintFor(id: string, envVar: string): Promise<string | null> {
  const { getSecret } = await import("./vault");
  return maskHint(await getSecret(id, envVar));
}
