/**
 * Evidence replay: AttemptEvent[] → per-skill SkillEvidence.
 *
 * Nothing here is stored; every number is derived, so deleting or importing
 * history always recomputes progress honestly.
 *
 * Promotion thresholds are PRODUCT HEURISTICS (labeled as such in the UI):
 *  - independent: ≥2 first-attempt unaided successes on distinct item forms
 *  - retained: a later unaided first-attempt success ≥48h after the previous
 *    success on that skill
 *  - transferred: unaided first-attempt success in transfer mode
 *  - an unrepaired high-confidence miss (≥80% confidence, wrong) blocks
 *    promotion to independent and flags the skill for review
 */
import type { AttemptEvent, SkillEvidence, SkillState } from '../domain/types'

export const STATE_ORDER: SkillState[] = [
  'unseen',
  'introduced',
  'guided',
  'independent',
  'retained',
  'transferred',
]

export function stateRank(s: SkillState): number {
  return STATE_ORDER.indexOf(s)
}

export const STATE_LABEL: Record<SkillState, string> = {
  unseen: 'Unseen',
  introduced: 'Introduced',
  guided: 'Guided',
  independent: 'Independent',
  retained: 'Retained',
  transferred: 'Transferred',
}

/** Review interval ladder in days — explainable, adaptive, heuristic. */
export const REVIEW_LADDER_DAYS = [1, 3, 7, 14, 30, 60]

const DAY = 86_400_000
export const RETENTION_GAP_MS = 48 * 3_600_000
const HIGH_CONF = 80

interface Tracker {
  skillId: string
  exposure: number
  guidedSuccesses: number
  independentForms: Set<string>
  independentAt: number | null
  retainedAt: number | null
  transferredAt: number | null
  lastCorrectAt: number | null
  lastAttemptAt: number | null
  lastOutcomeCorrect: boolean | null
  recentMisses: number
  /** Time of the latest unrepaired high-confidence miss. */
  misconceptionAt: number | null
  hintedRecent: boolean[]
  reviewIndex: number
  reviewDue: number | null
  attempts: number
}

function newTracker(skillId: string): Tracker {
  return {
    skillId,
    exposure: 0,
    guidedSuccesses: 0,
    independentForms: new Set(),
    independentAt: null,
    retainedAt: null,
    transferredAt: null,
    lastCorrectAt: null,
    lastAttemptAt: null,
    lastOutcomeCorrect: null,
    recentMisses: 0,
    misconceptionAt: null,
    hintedRecent: [],
    reviewIndex: 0,
    reviewDue: null,
    attempts: 0,
  }
}

/**
 * Success for evidence purposes = correct on the FIRST submission with no
 * hints. Eventually-correct after hints earns guided evidence only.
 * Rubric-scored parts count as success at score ≥ 0.75 (self-assessed; the
 * UI labels rubric evidence separately).
 */
function isFirstUnaidedSuccess(e: AttemptEvent): boolean {
  if (e.hintLevel > 0) return false
  if (e.firstCorrect !== null) return e.firstCorrect
  return e.score !== null && e.score >= 0.75
}

function isEventualSuccess(e: AttemptEvent): boolean {
  if (e.correct !== null) return e.correct
  return e.score !== null && e.score >= 0.75
}

function applyEvent(tr: Tracker, e: AttemptEvent): void {
  tr.attempts++
  tr.exposure++
  tr.lastAttemptAt = e.t
  const firstSuccess = isFirstUnaidedSuccess(e)
  const eventualSuccess = isEventualSuccess(e)
  tr.lastOutcomeCorrect = e.firstCorrect ?? (e.score !== null ? e.score >= 0.75 : null)

  tr.hintedRecent.push(e.hintLevel > 0)
  if (tr.hintedRecent.length > 10) tr.hintedRecent.shift()

  // Misconception tracking: a confident wrong first answer arms the block;
  // a later unaided first-attempt success on the skill repairs it.
  const confidentMiss = e.firstCorrect === false && e.confidence !== null && e.confidence >= HIGH_CONF
  if (confidentMiss) tr.misconceptionAt = e.t
  if (firstSuccess && tr.misconceptionAt !== null) tr.misconceptionAt = null

  if (firstSuccess) {
    tr.recentMisses = 0
    // Placement gives at most one form of credit; it routes, it does not prove.
    const formKey = e.mode === 'placement' ? 'placement' : `${e.templateId}:${e.seed}`
    // Retention: a later unaided success ≥48h after the previous success.
    if (
      tr.independentForms.size >= 2 &&
      tr.lastCorrectAt !== null &&
      e.t - tr.lastCorrectAt >= RETENTION_GAP_MS &&
      tr.retainedAt === null
    ) {
      tr.retainedAt = e.t
    }
    tr.independentForms.add(formKey)
    if (tr.independentForms.size >= 2 && tr.independentAt === null) tr.independentAt = e.t
    if (e.mode === 'transfer' && tr.independentAt !== null && tr.transferredAt === null) {
      tr.transferredAt = e.t
    }
    tr.lastCorrectAt = e.t
    // Review ladder advances on unaided success (placement does not schedule).
    // First success schedules ladder[0] = 1 day; each further success climbs.
    if (e.mode !== 'placement') {
      tr.reviewIndex = Math.min(tr.reviewIndex + 1, REVIEW_LADDER_DAYS.length)
      tr.reviewDue = e.t + REVIEW_LADDER_DAYS[Math.min(tr.reviewIndex - 1, REVIEW_LADDER_DAYS.length - 1)] * DAY
    }
  } else if (eventualSuccess) {
    // Solved with hints or on retry: guided evidence.
    tr.guidedSuccesses++
    tr.recentMisses = 0
    if (e.mode !== 'placement') {
      // Keep the current rung; nudge the due date a day out so it resurfaces.
      tr.reviewDue = e.t + 1 * DAY
    }
  } else {
    tr.recentMisses++
    if (e.mode !== 'placement') {
      // Errors shorten the interval; a confident error shortens it most.
      tr.reviewIndex = Math.max(0, tr.reviewIndex - 2)
      tr.reviewDue = e.t + (confidentMiss ? 0.5 : 1) * DAY
    }
  }
}

function finalize(tr: Tracker, now: number): SkillEvidence {
  const blocked = tr.misconceptionAt !== null
  const rungIgnoringBlock: SkillState =
    tr.transferredAt !== null
      ? 'transferred'
      : tr.retainedAt !== null
        ? 'retained'
        : tr.independentForms.size >= 2
          ? 'independent'
          : tr.guidedSuccesses >= 1 || tr.independentForms.size >= 1
            ? 'guided'
            : tr.exposure >= 1
              ? 'introduced'
              : 'unseen'
  // A live misconception holds the *current* state at guided, but the best
  // rung ever demonstrated stays visible ("needs review" never erases it).
  const state: SkillState =
    blocked && rungIgnoringBlock === 'independent' ? 'guided' : rungIgnoringBlock

  const needsReview =
    blocked ||
    tr.recentMisses >= 2 ||
    (tr.reviewDue !== null && tr.reviewDue <= now && stateRank(state) >= stateRank('independent'))

  const hinted = tr.hintedRecent
  return {
    skillId: tr.skillId,
    state,
    bestState: rungIgnoringBlock,
    needsReview,
    exposure: tr.exposure,
    guidedSuccesses: tr.guidedSuccesses,
    independentForms: [...tr.independentForms],
    retainedAt: tr.retainedAt,
    transferredAt: tr.transferredAt,
    lastCorrectAt: tr.lastCorrectAt,
    lastAttemptAt: tr.lastAttemptAt,
    lastOutcomeCorrect: tr.lastOutcomeCorrect,
    recentMisses: tr.recentMisses,
    blockedByMisconception: blocked,
    hintDependence: hinted.length >= 3 ? hinted.filter(Boolean).length / hinted.length : null,
    review: tr.reviewDue !== null ? { due: tr.reviewDue, intervalIndex: tr.reviewIndex } : null,
    attempts: tr.attempts,
  }
}

/** Replay all events into per-skill evidence. Events must be time-ordered. */
export function deriveEvidence(events: AttemptEvent[], now: number): Map<string, SkillEvidence> {
  const trackers = new Map<string, Tracker>()
  const sorted = [...events].sort((a, b) => a.t - b.t)
  for (const e of sorted) {
    for (const skillId of e.skillIds) {
      let tr = trackers.get(skillId)
      if (!tr) {
        tr = newTracker(skillId)
        trackers.set(skillId, tr)
      }
      applyEvent(tr, e)
    }
  }
  const out = new Map<string, SkillEvidence>()
  for (const [id, tr] of trackers) out.set(id, finalize(tr, now))
  return out
}

export function evidenceFor(
  evidence: Map<string, SkillEvidence>,
  skillId: string,
): SkillEvidence {
  return (
    evidence.get(skillId) ?? {
      skillId,
      state: 'unseen',
      bestState: 'unseen',
      needsReview: false,
      exposure: 0,
      guidedSuccesses: 0,
      independentForms: [],
      retainedAt: null,
      transferredAt: null,
      lastCorrectAt: null,
      lastAttemptAt: null,
      lastOutcomeCorrect: null,
      recentMisses: 0,
      blockedByMisconception: false,
      hintDependence: null,
      review: null,
      attempts: 0,
    }
  )
}
