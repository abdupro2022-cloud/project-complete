import { buildRegistry } from "@/server/registry";
import { ok, route } from "@/server/http";
import { vaultIsPersistent } from "@/server/vault";
import { INTEGRATIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Capability report. The client uses this to decide whether to show the demo
 * banner and which tools to enable, so it must never leak a secret.
 */
export const GET = route(async () => {
  const reg = await buildRegistry();
  return ok({
    hasRealMode: reg.hasRealMode,
    vaultPersistent: vaultIsPersistent(),
    providers: reg.snapshot,
    catalog: INTEGRATIONS.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description,
      envVar: m.envVar,
      keyUrl: m.keyUrl,
      docsUrl: m.docsUrl,
      capabilities: m.capabilities,
      requiredFields: m.requiredFields ?? [],
    })),
  });
});
