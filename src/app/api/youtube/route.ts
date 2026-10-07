import { z } from "zod";

import { body, ok, route, urlSchema, youtubeSearchSchema } from "@/server/http";
import { buildRegistry } from "@/server/registry";

export const dynamic = "force-dynamic";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search") }).merge(youtubeSearchSchema),
  z.object({ action: z.literal("video") }).merge(urlSchema),
  z.object({ action: z.literal("channel") }).merge(urlSchema),
]);

export const POST = route(async (req: Request) => {
  const payload = await body(req, requestSchema);
  const reg = await buildRegistry();
  const yt = reg.youtube();

  if (payload.action === "search") {
    const res = await yt.search({ query: payload.query, maxResults: payload.maxResults });
    return ok({ videos: res.videos }, res.demo ? "demo" : "live");
  }
  if (payload.action === "video") {
    const res = await yt.video({ url: payload.url });
    return ok({ video: res.video }, res.demo ? "demo" : "live");
  }
  const res = await yt.channel({ url: payload.url });
  return ok({ channel: res.channel }, res.demo ? "demo" : "live");
});
