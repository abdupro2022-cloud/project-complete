import { z } from "zod";

import { body, ok, route } from "@/server/http";
import { buildRegistry } from "@/server/registry";

export const dynamic = "force-dynamic";

const schema = z.object({
  integrationId: z.enum([
    "gemini", "deepseek", "openrouter", "tavily", "firecrawl",
    "youtube", "video_to_text", "google_sheets", "notion",
  ]),
});

/**
 * "Test Connection" for one integration. Returns a specific, actionable
 * message on failure — never a bare false.
 */
export const POST = route(async (req: Request) => {
  const { integrationId } = await body(req, schema);
  const reg = await buildRegistry();

  const aiIds = new Set(["gemini", "deepseek", "openrouter"]);
  if (aiIds.has(integrationId)) {
    const p = reg.ai("fast", integrationId);
    const r = await p.test();
    return ok(
      r.ok
        ? { ok: true, detail: `اتصال ناجح · النموذج ${r.model}` }
        : { ok: false, detail: r.error.userMessage, remedy: r.error.remedy },
    );
  }

  const provider =
    integrationId === "tavily" ? reg.search()
    : integrationId === "firecrawl" ? reg.scrape()
    : integrationId === "youtube" ? reg.youtube()
    : integrationId === "video_to_text" ? reg.transcript()
    : null;

  if (!provider) {
    return ok({
      ok: false as const,
      detail: "هذا التكامل لا يدعم اختبار الاتصال تلقائيًا. تحقق من الإعدادات المرفقة به.",
      remedy: "configure" as const,
    });
  }

  if (provider.id.startsWith("demo")) {
    return ok({
      ok: false as const,
      detail: "لم يُضف مفتاح بعد، لذلك يعمل النظام في الوضع التجريبي. أضف المفتاح لتفعيل الاختبار الحقيقي.",
      remedy: "configure" as const,
    });
  }

  const r = await provider.test();
  return ok(
    r.ok
      ? { ok: true, detail: "اتصال ناجح" }
      : { ok: false, detail: r.error.userMessage, remedy: r.error.remedy },
  );
});
