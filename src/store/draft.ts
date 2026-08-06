/**
 * Crash-proof live-session storage. A phone that sleeps or backgrounds the
 * tab can have the page discarded by the OS — every meaningful change is
 * mirrored here (localStorage, tiny + synchronous) and echoed to IndexedDB,
 * so a session resumes exactly where it left off after a full reload.
 */
import type { CheckIn, SessionPlan } from '../domain/types'
import { writeDraftMirror, readDraftMirror } from './persist'

const KEY = 'axiomlab.draft'
/** Older than this and it is yesterday's session, not an interruption. */
const MAX_AGE_MS = 18 * 3_600_000

export type SessionPhase = 'item' | 'feedback' | 'repair-note' | 'bridge' | 'exit-reflect' | 'summary'

export interface ActivityRecord {
  /** `${blockIndex}:${actIndex}` */
  key: string
  hintsUsed: number
  firstResponse: string | null
  submitted: boolean
  correct: boolean | null
  /** Event-accurate first-attempt outcome (null for rubric/self-scored). */
  firstCorrect: boolean | null
  score: number | null
  confidence: number | null
  elapsedSec: number
  errorTag: string | null
  retryResponse: string | null
  retryCorrect: boolean | null
  eventLogged: boolean
  /** Puzzle-specific runtime payload (board placements, chess progress…). */
  extra: unknown
}

export interface SessionDraft {
  v: 1
  savedAt: number
  startedAt: number
  plan: SessionPlan
  checkIn: CheckIn
  blockIndex: number
  actIndex: number
  phase: SessionPhase
  records: Record<string, ActivityRecord>
  scratch: string
  activeSec: number
  /** Draft of the exit-ticket principle text. */
  principle: string
}

export function saveDraft(draft: Omit<SessionDraft, 'v' | 'savedAt'>): void {
  const full: SessionDraft = { ...draft, v: 1, savedAt: Date.now() }
  const json = JSON.stringify(full)
  try {
    localStorage.setItem(KEY, json)
  } catch {
    /* localStorage full/unavailable — IDB mirror still tries */
  }
  void writeDraftMirror(json)
}

function parseDraft(raw: string | null): SessionDraft | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as SessionDraft
    if (d?.v !== 1 || typeof d.savedAt !== 'number') return null
    if (!d.plan || !Array.isArray(d.plan.blocks) || d.plan.blocks.length === 0) return null
    if (typeof d.blockIndex !== 'number' || typeof d.actIndex !== 'number') return null
    if (d.phase === 'summary') return null // finished sessions never resume
    if (Date.now() - d.savedAt > MAX_AGE_MS) return null
    // Nothing answered and still on the first item = nothing to lose.
    const anySubmitted = Object.values(d.records ?? {}).some((r) => r?.submitted || r?.firstResponse)
    if (!anySubmitted && d.blockIndex === 0 && d.actIndex === 0 && d.phase === 'item') return null
    return d
  } catch {
    return null
  }
}

export function loadDraftSync(): SessionDraft | null {
  try {
    const d = parseDraft(localStorage.getItem(KEY))
    if (d === null && localStorage.getItem(KEY) !== null) localStorage.removeItem(KEY)
    return d
  } catch {
    return null
  }
}

/** Async fallback: recover from the IDB mirror when localStorage was wiped. */
export async function loadDraftDeep(): Promise<SessionDraft | null> {
  const sync = loadDraftSync()
  if (sync) return sync
  return parseDraft(await readDraftMirror())
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing */
  }
  void writeDraftMirror(null)
}
