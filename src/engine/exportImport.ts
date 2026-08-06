/**
 * Manual JSON export/import. Import runs through the same sanitizer as every
 * other untrusted-JSON path, so a tampered file can degrade only to a smaller
 * valid state, never to a corrupt one.
 */
import type { AppState } from '../domain/types'
import { sanitizeState } from '../store/sanitize'

export interface ExportEnvelope {
  app: 'axiomlab'
  schema: 1
  exportedAt: string
  state: AppState
}

export function exportState(state: AppState): string {
  const envelope: ExportEnvelope = {
    app: 'axiomlab',
    schema: 1,
    exportedAt: new Date().toISOString(),
    state,
  }
  return JSON.stringify(envelope, null, 2)
}

export type ImportResult =
  | { ok: true; state: AppState; counts: { events: number; sessions: number } }
  | { ok: false; error: string }

export function importState(json: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Not an Axiom Lab export.' }
  const env = raw as Record<string, unknown>
  if (env.app !== 'axiomlab' || env.schema !== 1 || typeof env.state !== 'object' || env.state === null) {
    return { ok: false, error: 'Not an Axiom Lab export (missing app/schema/state).' }
  }
  const state = sanitizeState(env.state)
  return { ok: true, state, counts: { events: state.events.length, sessions: state.sessions.length } }
}
