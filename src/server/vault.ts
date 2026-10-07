import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Server-side secret vault.
 *
 * Rules this file enforces:
 *   1. A secret is never returned to the client — only a masked hint.
 *   2. A secret is never written to disk in plaintext.
 *   3. A secret is never logged. `redact()` is used anywhere a payload is printed.
 *
 * If `ABDO_VAULT_SECRET` is not configured, secrets are held in process memory
 * only. Nothing is persisted, and the UI is told so — a missing master key
 * degrades to "keys survive until you restart the server", never to "keys are
 * stored in a plaintext file".
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

const VAULT_DIR = join(process.cwd(), ".data");
const VAULT_FILE = join(VAULT_DIR, "vault.json");

interface VaultEntry {
  /** AES-256-GCM: iv || authTag || ciphertext, all base64. */
  sealed: string;
  storedAt: string;
  /** Optional provider-specific config (endpoint URL, model name, ids).
   *  Stored next to the sealed secret so it survives restarts. Never secrets. */
  config?: Record<string, string>;
}

type VaultFile = Record<string, VaultEntry>;

let masterKey: Buffer | null | undefined;
let memoryVault: VaultFile = {};

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

/** Strips anything that looks like a key out of an object before it is logged. */
export function redact<T>(value: T): T {
  const SECRET_KEYS = /(key|token|secret|password|authorization|apiKey|api_key)/i;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([k, val]) => [
          k,
          SECRET_KEYS.test(k) ? "[redacted]" : walk(val),
        ]),
      );
    }
    return v;
  };
  return walk(value) as T;
}

// ---------------------------------------------------------------------------
// Master key
// ---------------------------------------------------------------------------

function getMasterKey(): Buffer | null {
  if (masterKey !== undefined) return masterKey;
  const secret = process.env.ABDO_VAULT_SECRET;
  if (!secret || secret.length < 16) {
    masterKey = null;
    return null;
  }
  masterKey = scryptSync(secret, "abdo-creator-os.vault.v1", KEY_BYTES);
  return masterKey;
}

export function vaultIsPersistent(): boolean {
  return getMasterKey() !== null;
}

// ---------------------------------------------------------------------------
// Load / persist
// ---------------------------------------------------------------------------

let loaded = false;

async function load(): Promise<VaultFile> {
  if (loaded) return memoryVault;
  loaded = true;
  if (!getMasterKey()) return memoryVault;
  try {
    const raw = await readFile(VAULT_FILE, "utf8");
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed && typeof parsed === "object") memoryVault = parsed;
  } catch {
    // No vault yet, or it was written by an older format. Start clean.
    memoryVault = {};
  }
  return memoryVault;
}

async function persist(): Promise<boolean> {
  if (!getMasterKey()) return false;
  try {
    await mkdir(dirname(VAULT_FILE), { recursive: true });
    // Write-then-rename so a crash mid-write cannot corrupt the vault.
    const tmp = `${VAULT_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(memoryVault, null, 2), { mode: 0o600 });
    await rename(tmp, VAULT_FILE);
    return true;
  } catch {
    // A read-only filesystem must not break the app; the key stays in memory
    // and `setSecret` will report the failure honestly.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sealing
// ---------------------------------------------------------------------------

function seal(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

function unseal(payload: string, key: Buffer): string | null {
  try {
    const raw = Buffer.from(payload, "base64");
    if (raw.length <= IV_BYTES + TAG_BYTES) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const data = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolution order: vault first, then environment. Returns null when neither
 * is present so the caller can fall back to the demo adapter.
 */
export async function getSecret(integrationId: string, envVar: string): Promise<string | null> {
  const key = getMasterKey();
  if (key) {
    const file = await load();
    const entry = file[integrationId];
    if (entry) {
      const opened = unseal(entry.sealed, key);
      if (opened) return opened;
    }
  } else {
    const entry = memoryVault[integrationId];
    if (entry && memoryVault[`${integrationId}:plain`]) {
      return memoryVault[`${integrationId}:plain`] as unknown as string;
    }
  }
  const fromEnv = process.env[envVar];
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : null;
}

export async function hasSecret(integrationId: string, envVar: string): Promise<boolean> {
  return (await getSecret(integrationId, envVar)) !== null;
}

/** Where a currently-resolved secret came from, for honest status reporting. */
export async function secretSource(
  integrationId: string,
  envVar: string,
): Promise<"vault" | "env" | null> {
  const key = getMasterKey();
  if (key) {
    const file = await load();
    if (file[integrationId]) return "vault";
  }
  return process.env[envVar]?.trim() ? "env" : null;
}

export async function setSecret(
  integrationId: string,
  value: string,
  config?: Record<string, string>,
): Promise<{ persisted: boolean }> {
  const key = getMasterKey();
  if (key) {
    const file = await load();
    const existing = file[integrationId];
    file[integrationId] = {
      sealed: seal(value, key),
      storedAt: new Date().toISOString(),
      ...(config !== undefined ? { config } : existing?.config ? { config: existing.config } : {}),
    };
    const ok = await persist();
    return { persisted: ok };
  }
  // No master key: hold in memory for this process only, and say so.
  memoryVault[integrationId] = {
    sealed: "",
    storedAt: new Date().toISOString(),
    ...(config !== undefined ? { config } : {}),
  };
  memoryVault[`${integrationId}:plain`] = value as unknown as VaultEntry;
  return { persisted: false };
}

export async function getSecretConfig(integrationId: string): Promise<Record<string, string> | undefined> {
  const key = getMasterKey();
  if (key) {
    const file = await load();
    return file[integrationId]?.config;
  }
  return memoryVault[integrationId]?.config;
}

export async function deleteSecret(integrationId: string): Promise<{ removed: boolean }> {
  const file = await load();
  delete file[integrationId];
  delete memoryVault[`${integrationId}:plain`];
  const ok = await persist();
  return { removed: ok };
}

/** Masked hint for the UI. The client can never recover the full value. */
export function maskHint(secret: string | null): string | null {
  if (!secret) return null;
  if (secret.length <= 10) return "••••••••";
  return `${secret.slice(0, 6)}…${secret.slice(-4)}`;
}

export async function destroyVault(): Promise<void> {
  memoryVault = {};
  loaded = false;
  try {
    await unlink(VAULT_FILE);
  } catch {
    /* nothing to remove */
  }
}
