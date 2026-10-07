import { body, ok, route, urlSchema } from "@/server/http";
import { buildRegistry } from "@/server/registry";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const payload = await body(req, urlSchema);
  const reg = await buildRegistry();
  const res = await reg.scrape().scrape(payload);
  return ok(res, res.demo ? "demo" : "live");
});
