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

let writesSinceBackup = 0

/** Persist serialized state. Never throws; returns whether the primary write landed. */
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
    if (json.length <= LS_MIRROR_MAX) localStorage.setItem(LS_MIRROR, json)
  } catch {
    /* mirror is best-effort */
  }
  return ok
}

/** Force a backup write (called at session completion — a known-good moment). */
export async function checkpointBackup(json: string): Promise<void> {
  try {
    await withDb((db) => idbPut(db, KEY_BACKUP, json))
    writesSinceBackup = 0
  } catch {
    /* best effort */
  }
}

export async function loadState(): Promise<{ json: string; source: 'primary' | 'backup' | 'mirror' } | null> {
  try {
    const main = await withDb((db) => idbGet(db, KEY_MAIN))
    if (main) return { json: main, source: 'primary' }
  } catch {
    /* try backup */
  }
  try {
    const backup = await withDb((db) => idbGet(db, KEY_BACKUP))
    if (backup) return { json: backup, source: 'backup' }
  } catch {
    /* try mirror */
  }
  try {
    const mirror = localStorage.getItem(LS_MIRROR)
    if (mirror) return { json: mirror, source: 'mirror' }
  } catch {
    /* nothing */
  }
  return null
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
    await withDb(async (db) => {
      await idbDelete(db, KEY_MAIN)
      await idbDelete(db, KEY_BACKUP)
      await idbDelete(db, KEY_REAL_STASH)
      await idbDelete(db, 'draft')
    })
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
}

export async function storageInfo(): Promise<StorageInfo> {
  const info: StorageInfo = { persisted: null, usageBytes: null }
  try {
    if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted()
  } catch {
    /* unknown */
  }
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      info.usageBytes = est.usage ?? null
    }
  } catch {
    /* unknown */
  }
  return info
}
