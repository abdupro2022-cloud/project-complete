import { aiSchema, body, ok, route } from "@/server/http";
import { buildRegistry } from "@/server/registry";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const payload = await body(req, aiSchema);
  const reg = await buildRegistry();
  const provider = reg.ai(payload.capability, payload.prefer);

  const res = await provider.complete({
    messages: payload.messages,
    capability: payload.capability,
    ...(payload.temperature !== undefined ? { temperature: payload.temperature } : {}),
    ...(payload.maxTokens !== undefined ? { maxTokens: payload.maxTokens } : {}),
    ...(payload.model ? { model: payload.model } : {}),
    ...(payload.json !== undefined ? { json: payload.json } : {}),
  });

  return ok(res, res.demo ? "demo" : "live");
});
