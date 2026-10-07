import { body, ok, route, searchSchema } from "@/server/http";
import { buildRegistry } from "@/server/registry";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  const payload = await body(req, searchSchema);
  const reg = await buildRegistry();
  const res = await reg.search().search(payload);
  return ok(res, res.demo ? "demo" : "live");
});
