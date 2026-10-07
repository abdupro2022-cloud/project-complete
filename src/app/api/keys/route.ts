import { z } from "zod";

import { body, keySchema, ok, route } from "@/server/http";
import { buildRegistry } from "@/server/registry";
import { deleteSecret, getSecret, getSecretConfig, maskHint, setSecret, vaultIsPersistent } from "@/server/vault";
import { INTEGRATIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Status only — masked hints, never the secret itself. */
export const GET = route(async () => {
  const reg = await buildRegistry();
  const states = await Promise.all(
    INTEGRATIONS.map(async (meta) => {
      const [secret, config] = await Promise.all([
        getSecret(meta.id, meta.envVar),
        getSecretConfig(meta.id),
      ]);
      const state = reg.snapshot.find((p) => p.id === meta.id);
      return {
        id: meta.id,
        configured: Boolean(secret),
        source: state?.source ?? null,
        hint: maskHint(secret),
        persisted: vaultIsPersistent(),
        config: config ?? {},
      };
    }),
  );
  return ok({ states, vaultPersistent: vaultIsPersistent() });
});

export const POST = route(async (req: Request) => {
  const { integrationId, value, config } = await body(req, keySchema);
  const { persisted } = await setSecret(integrationId, value, config);
  return ok(
    { id: integrationId, stored: true, persisted },
    "live",
  );
});

const deleteSchema = z.object({ integrationId: keySchema.shape.integrationId });

export const DELETE = route(async (req: Request) => {
  const { integrationId } = await body(req, deleteSchema);
  const { removed } = await deleteSecret(integrationId);
  return ok({ id: integrationId, removed });
});
