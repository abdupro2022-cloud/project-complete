/**
 * Storage adapter.
 *
 * ABDO CREATOR OS is local-first: user content lives on the device, so the app
 * stays fully usable offline and works in a static export. Preference order is
 * IndexedDB → localStorage → memory, so a hostile environment degrades to a
 * session-scoped app instead of a blank screen.
 */

export const DB_NAME = "abdo-creator-os";
export const DB_VERSION = 1;

export const COLLECTIONS = [
  "projects",
  "projectNotes",
  "ideas",
  "researchBriefs",
  "sources",
  "claims",
  "contradictions",
  "events",
  "entities",
  "entityEdges",
  "videos",
  "competitors",
  "contentGaps",
  "transcripts",
  "scripts",
  "scriptSections",
  "shorts",
  "titleIdeas",
  "thumbnailConcepts",
  "conversations",
  "messages",
  "tasks",
  "memories",
  "settings",
  "activity",
  "usage",
  "integrationState",
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export type Row = { id: string; [key: string]: unknown };

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of COLLECTIONS) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
    // Never let a hung open() wedge app boot.
    setTimeout(() => resolve(req.result ?? null), 2500);
  });
  return dbPromise;
}

const LS_PREFIX = `${DB_NAME}:`;

function lsAvailable(): boolean {
  try {
    const k = `${LS_PREFIX}__probe`;
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** In-memory fallback, also used as the write-through cache. */
const memory = new Map<string, Map<string, Row>>();

function memStore(name: CollectionName): Map<string, Row> {
  let m = memory.get(name);
  if (!m) {
    m = new Map();
    memory.set(name, m);
  }
  return m;
}

export async function readAll<T extends Row>(name: CollectionName): Promise<T[]> {
  const db = await openDb();
  if (db) {
    return new Promise<T[]>((resolve) => {
      try {
        const tx = db.transaction(name, "readonly");
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }
  if (lsAvailable()) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + name);
      const parsed = raw ? JSON.parse(raw) : [];
      const m = memStore(name);
      m.clear();
      for (const row of parsed as T[]) m.set(row.id, row as Row);
      return parsed as T[];
    } catch {
      return [];
    }
  }
  return [...memStore(name).values()] as T[];
}

export async function writeAll(name: CollectionName, rows: Row[]): Promise<void> {
  // `settings` is stored as a single row by the caller, but guard here too:
  // a non-array would otherwise blow up the write-through loop.
  if (!Array.isArray(rows)) rows = [];
  const m = memStore(name);
  m.clear();
  for (const row of rows) m.set(row.id, row);

  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(name, "readwrite");
        const store = tx.objectStore(name);
        store.clear();
        for (const row of rows) store.put(row);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
    return;
  }

  if (lsAvailable()) {
    try {
      localStorage.setItem(LS_PREFIX + name, JSON.stringify(rows));
    } catch {
      // Quota exceeded — keep the in-memory copy so the session still works.
    }
  }
}

export async function clearAll(): Promise<void> {
  await Promise.all(COLLECTIONS.map((c) => writeAll(c, [])));
}

/** Wipes the underlying database, used by Settings → Danger zone. */
export async function destroy(): Promise<void> {
  await clearAll();
  const db = await openDb();
  if (db) {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    dbPromise = null;
  }
  if (typeof indexedDB !== "undefined") {
    try {
      indexedDB.deleteDatabase(DB_NAME);
    } catch {
      /* ignore */
    }
  }
}

export function storageBackend(): "indexeddb" | "localstorage" | "memory" {
  if (typeof indexedDB !== "undefined") return "indexeddb";
  if (lsAvailable()) return "localstorage";
  return "memory";
}
