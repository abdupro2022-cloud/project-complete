import { z } from "zod";

import { body, ok, route } from "@/server/http";
import { buildRegistry } from "@/server/registry";
import { urlSchema } from "@/server/http";

export const dynamic = "force-dynamic";

const transcriptSchema = urlSchema.extend({
  language: z.string().min(2).max(10).optional(),
  projectId: z.string().max(64).optional(),
});

export const POST = route(async (req: Request) => {
  const payload = await body(req, transcriptSchema);
  const reg = await buildRegistry();
  const res = await reg.transcript().transcribe({
    videoUrl: payload.url,
    ...(payload.language ? { language: payload.language } : {}),
  });
  return ok({ transcript: res.transcript }, res.demo ? "demo" : "live");
});
