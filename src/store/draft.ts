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
const DRAFT_VERSION = 2 as const
const PHASES = new Set<SessionPhase>(['item', 'feedback', 'repair-note', 'bridge', 'exit-reflect', 'summary'])
const MODES = new Set(['guided', 'independent', 'review', 'transfer', 'placement', 'exam'])

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
  v: 2
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
  const full: SessionDraft = { ...draft, v: DRAFT_VERSION, savedAt: Date.now() }
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
    const candidate = JSON.parse(raw) as unknown
    if (typeof candidate !== 'object' || candidate === null) return null
    const d = candidate as Record<string, unknown>
    // V1 is intentionally readable: the upgrade changes validation, not the
    // learner's ability to resume a draft made immediately before an update.
    if ((d.v !== 1 && d.v !== DRAFT_VERSION) || typeof d.savedAt !== 'number' || !Number.isFinite(d.savedAt)) return null
    if (typeof d.plan !== 'object' || d.plan === null) return null
    const plan = d.plan as Record<string, unknown>
    if (typeof plan.id !== 'string' || !Array.isArray(plan.blocks) || plan.blocks.length === 0) return null
    const validBlocks = plan.blocks.every((rawBlock) => {
      if (typeof rawBlock !== 'object' || rawBlock === null) return false
      const block = rawBlock as Record<string, unknown>
      if (!Array.isArray(block.activities) || block.activities.length === 0) return false
      return block.activities.every((rawActivity) => {
        if (typeof rawActivity !== 'object' || rawActivity === null) return false
        const activity = rawActivity as Record<string, unknown>
        return typeof activity.templateId === 'string' && activity.templateId.length > 0 &&
          typeof activity.seed === 'number' && Number.isFinite(activity.seed) && MODES.has(String(activity.mode))
      })
    })
    if (!validBlocks) return null
    if (!Number.isInteger(d.blockIndex) || !Number.isInteger(d.actIndex)) return null
    const blockIndex = d.blockIndex as number
    const actIndex = d.actIndex as number
    if (blockIndex < 0 || blockIndex >= plan.blocks.length) return null
    const activeBlock = plan.blocks[blockIndex] as { activities: unknown[] }
    if (actIndex < 0 || actIndex >= activeBlock.activities.length) return null
    if (typeof d.phase !== 'string' || !PHASES.has(d.phase as SessionPhase)) return null
    if (typeof d.checkIn !== 'object' || d.checkIn === null) return null
    const checkIn = d.checkIn as Record<string, unknown>
    if (typeof checkIn.minutes !== 'number' || checkIn.minutes < 1 || checkIn.minutes > 180) return null
    if (!['low', 'ok', 'high'].includes(String(checkIn.energy))) return null
    if (typeof d.records !== 'object' || d.records === null || Array.isArray(d.records)) return null
    if (typeof d.startedAt !== 'number' || !Number.isFinite(d.startedAt)) return null
    if (typeof d.activeSec !== 'number' || !Number.isFinite(d.activeSec) || d.activeSec < 0) return null
    if (typeof d.scratch !== 'string' || typeof d.principle !== 'string') return null
    if (d.phase === 'summary') return null // finished sessions never resume
    if (Date.now() - (d.savedAt as number) > MAX_AGE_MS) return null
    // Nothing answered and still on the first item = nothing to lose.
    const anySubmitted = Object.values(d.records).some((rawRecord) => {
      if (typeof rawRecord !== 'object' || rawRecord === null) return false
      const record = rawRecord as Record<string, unknown>
      return record.submitted === true || (typeof record.firstResponse === 'string' && record.firstResponse.length > 0)
    })
    if (!anySubmitted && blockIndex === 0 && actIndex === 0 && d.phase === 'item') return null
    return { ...(d as unknown as SessionDraft), v: DRAFT_VERSION }
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
