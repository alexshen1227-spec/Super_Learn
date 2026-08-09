/**
 * On-device data safety. IndexedDB is the PRIMARY store (structured data can
 * outgrow localStorage); localStorage keeps only tiny preferences and a
 * best-effort bootstrap mirror. Defenses:
 *  1. navigator.storage.persist() — asks the browser to exempt this origin
 *     from automatic storage cleanup.
 *  2. A periodic secondary IDB key ('backup') — survives a corrupted write.
 *  3. A localStorage mirror when the state is small enough — survives IDB
 *     unavailability (some private-browsing modes).
 * Load order: primary → backup → localStorage → null.
 */

const DB_NAME = 'axiomlab'
const STORE = 'kv'
const KEY_MAIN = 'state-v1'
const KEY_BACKUP = 'state-backup'
export const KEY_REAL_STASH = 'state-real-stash' // real data while sample mode is on
const LS_MIRROR = 'axiomlab.mirror'
const LS_MIRROR_MAX = 1_500_000
const EVENT_PREFIX = 'event-v1:'

export type LoadSource = 'primary' | 'backup' | 'mirror' | 'journal'
let lastLoadSource: LoadSource | null = null

/** A candidate must at least be parseable state-shaped JSON before it can win load priority. */
export function isLoadableStateJson(json: string | null): json is string {
  if (!json) return false
  try {
    const value = JSON.parse(json) as unknown
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
    const state = value as Record<string, unknown>
    return typeof state.version === 'number' &&
      typeof state.createdAt === 'number' &&
      typeof state.onboarded === 'boolean' &&
      typeof state.profile === 'object' && state.profile !== null &&
      typeof state.settings === 'object' && state.settings !== null &&
      Array.isArray(state.events)
  } catch {
    return false
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
  })
}

/**
 * Close on every outcome. A connection left open by a failed write blocks a
 * future `onupgradeneeded`, so a schema change would hang instead of running.
 */
async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDb()
  try {
    return await fn(db)
  } finally {
    db.close()
  }
}

function idbPut(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error ?? new Error('write aborted'))
    tx.onerror = () => reject(tx.error ?? new Error('write failed'))
  })
}

function idbGet(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
    req.onerror = () => reject(req.error ?? new Error('read failed'))
  })
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('delete failed'))
  })
}

function idbClear(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error ?? new Error('clear aborted'))
    tx.onerror = () => reject(tx.error ?? new Error('clear failed'))
  })
}

function idbPrefixValues(db: IDBDatabase, prefix: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const values: string[] = []
    const tx = db.transaction(STORE, 'readonly')
    const range = IDBKeyRange.bound(prefix, `${prefix}\uffff`)
    const req = tx.objectStore(STORE).openCursor(range)
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return
      if (typeof cursor.value === 'string') values.push(cursor.value)
      cursor.continue()
    }
    tx.oncomplete = () => resolve(values)
    tx.onabort = () => reject(tx.error ?? new Error('prefix read aborted'))
    tx.onerror = () => reject(tx.error ?? new Error('prefix read failed'))
  })
}

let writesSinceBackup = 0

/** Persist serialized state. Never throws; returns whether any durable copy landed. */
export async function saveState(json: string): Promise<boolean> {
  let ok = false
  try {
    await withDb(async (db) => {
      await idbPut(db, KEY_MAIN, json)
      writesSinceBackup++
      if (writesSinceBackup >= 20) {
        writesSinceBackup = 0
        await idbPut(db, KEY_BACKUP, json)
      }
    })
    ok = true
  } catch {
    /* fall through to mirror */
  }
  try {
    if (json.length <= LS_MIRROR_MAX) {
      localStorage.setItem(LS_MIRROR, json)
      ok = true
    }
  } catch {
    /* mirror is best-effort */
  }
  return ok
}

/** Force a backup write (called at session completion — a known-good moment). */
export async function checkpointBackup(json: string): Promise<boolean> {
  try {
    await withDb((db) => idbPut(db, KEY_BACKUP, json))
    writesSinceBackup = 0
    return true
  } catch {
    return false
  }
}

export async function loadState(): Promise<{ json: string; source: Exclude<LoadSource, 'journal'> } | null> {
  try {
    const main = await withDb((db) => idbGet(db, KEY_MAIN))
    if (isLoadableStateJson(main)) {
      lastLoadSource = 'primary'
      return { json: main, source: 'primary' }
    }
  } catch {
    /* try backup */
  }
  try {
    const backup = await withDb((db) => idbGet(db, KEY_BACKUP))
    if (isLoadableStateJson(backup)) {
      lastLoadSource = 'backup'
      return { json: backup, source: 'backup' }
    }
  } catch {
    /* try mirror */
  }
  try {
    const mirror = localStorage.getItem(LS_MIRROR)
    if (isLoadableStateJson(mirror)) {
      lastLoadSource = 'mirror'
      return { json: mirror, source: 'mirror' }
    }
  } catch {
    /* nothing */
  }
  return null
}

/**
 * Append-only per-event journal. Whole-state snapshots remain convenient, but
 * a damaged snapshot can no longer erase the evidence created after a backup.
 */
export async function appendEventJournal(events: readonly { id: string }[]): Promise<boolean> {
  if (!events.length) return true
  try {
    await withDb(async (db) => {
      const txDone = new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        for (const event of events) store.put(JSON.stringify(event), `${EVENT_PREFIX}${event.id}`)
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error ?? new Error('journal write aborted'))
        tx.onerror = () => reject(tx.error ?? new Error('journal write failed'))
      })
      await txDone
    })
    return true
  } catch {
    return false
  }
}

export async function loadEventJournal(): Promise<unknown[]> {
  try {
    const rows = await withDb((db) => idbPrefixValues(db, EVENT_PREFIX))
    const events: unknown[] = []
    for (const row of rows) {
      try {
        const event = JSON.parse(row) as unknown
        if (typeof event === 'object' && event !== null) events.push(event)
      } catch {
        /* one damaged event must not hide the rest of the journal */
      }
    }
    return events
  } catch {
    return []
  }
}

export async function stashRealState(json: string): Promise<boolean> {
  try {
    await withDb((db) => idbPut(db, KEY_REAL_STASH, json))
    return true
  } catch {
    return false
  }
}

export async function readRealStash(): Promise<string | null> {
  try {
    return await withDb((db) => idbGet(db, KEY_REAL_STASH))
  } catch {
    return null
  }
}

export async function clearRealStash(): Promise<void> {
  try {
    await withDb((db) => idbDelete(db, KEY_REAL_STASH))
  } catch {
    /* best effort */
  }
}

/** Full wipe: IDB keys + mirrors. Used by "Delete everything". */
export async function wipeAll(): Promise<void> {
  try {
    await withDb((db) => idbClear(db))
  } catch {
    /* best effort */
  }
  try {
    localStorage.removeItem(LS_MIRROR)
    localStorage.removeItem('axiomlab.draft')
  } catch {
    /* best effort */
  }
}

export async function writeDraftMirror(json: string | null): Promise<void> {
  try {
    await withDb((db) => (json === null ? idbDelete(db, 'draft') : idbPut(db, 'draft', json)))
  } catch {
    /* best effort */
  }
}

export async function readDraftMirror(): Promise<string | null> {
  try {
    return await withDb((db) => idbGet(db, 'draft'))
  } catch {
    return null
  }
}

/** Ask the browser to protect this origin's storage from eviction. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export interface StorageInfo {
  persisted: boolean | null
  usageBytes: number | null
  /**
   * Chrome-only breakdown (`estimate().usageDetails`, non-standard): how much
   * of the total is the app-file cache vs the learner's actual data. Worth
   * surfacing because the headline number confuses people — the estimate
   * includes precached app files, compiled-code caches, and database overhead,
   * so it reads tens of MB while the learning data itself is kilobytes.
   * Null where the browser does not expose the split.
   */
  cachesBytes: number | null
  idbBytes: number | null
  primaryHealthy: boolean | null
  backupHealthy: boolean | null
  mirrorHealthy: boolean | null
  journalEvents: number | null
  realDataStashed: boolean | null
  lastLoadSource: LoadSource | null
}

export async function storageInfo(): Promise<StorageInfo> {
  const info: StorageInfo = {
    persisted: null,
    usageBytes: null,
    cachesBytes: null,
    idbBytes: null,
    primaryHealthy: null,
    backupHealthy: null,
    mirrorHealthy: null,
    journalEvents: null,
    realDataStashed: null,
    lastLoadSource,
  }
  try {
    if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted()
  } catch {
    /* unknown */
  }
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      info.usageBytes = est.usage ?? null
      const details = (est as { usageDetails?: Record<string, number> }).usageDetails
      if (details) {
        info.cachesBytes = typeof details.caches === 'number' ? details.caches : null
        info.idbBytes = typeof details.indexedDB === 'number' ? details.indexedDB : null
      }
    }
  } catch {
    /* unknown */
  }
  try {
    await withDb(async (db) => {
      info.primaryHealthy = isLoadableStateJson(await idbGet(db, KEY_MAIN))
      info.backupHealthy = isLoadableStateJson(await idbGet(db, KEY_BACKUP))
      info.realDataStashed = (await idbGet(db, KEY_REAL_STASH)) !== null
      info.journalEvents = (await idbPrefixValues(db, EVENT_PREFIX)).length
    })
  } catch {
    /* unavailable */
  }
  try {
    info.mirrorHealthy = isLoadableStateJson(localStorage.getItem(LS_MIRROR))
  } catch {
    /* unavailable */
  }
  return info
}
