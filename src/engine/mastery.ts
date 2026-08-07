/**
 * Evidence replay: AttemptEvent[] → per-skill SkillEvidence.
 *
 * Nothing here is stored; every number is derived, so deleting or importing
 * history always recomputes progress honestly.
 *
 * Only DETERMINISTIC grading produces evidence here. Written artifacts are
 * drafted, compared against a model, and logged as exposure — they never
 * carry a skill up a rung. Anything that advances a skill was machine-graded.
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

/**
 * Review state for ONE question family (keyed by templateId).
 *
 * A skill is not one thing: `m-percent` covers ten distinct families, and a
 * learner can own percent-of-a-number while reverse-percent keeps failing.
 * With a single schedule per skill, answering the easy family satisfied the
 * review and pushed the interval out — so the weak family could go untested
 * for months while the skill read "Retained". Each family now carries its own
 * ladder position, which is what lets the planner ask for the one that broke.
 *
 * Keyed by templateId, NOT templateId:seed. Seeds are what make two ATTEMPTS
 * distinct (the independence rule needs that); families are what make two
 * KINDS of problem distinct. Keying on the seed would hand every new variant a
 * blank history and nothing would ever accumulate a schedule.
 */
interface FormTracker {
  reviewIndex: number
  reviewDue: number | null
  successes: number
  lapses: number
  lastAttemptAt: number
  lastOutcomeCorrect: boolean | null
}

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
  /** Unaided successes AFTER independence (successful spaced retrievals). */
  reviewSuccesses: number
  /** First-attempt misses AFTER independence (lapses). */
  lapses: number
  /**
   * Every template family this skill has been practiced on. Transfer requires
   * a NOVEL family, so novelty is measured against the learner's own history
   * rather than trusted to an authoring flag.
   */
  practicedTemplates: Set<string>
  /** Per-question-family review schedules. See FormTracker. */
  forms: Map<string, FormTracker>
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
    reviewSuccesses: 0,
    lapses: 0,
    practicedTemplates: new Set(),
    forms: new Map(),
  }
}

function newFormTracker(): FormTracker {
  return { reviewIndex: 0, reviewDue: null, successes: 0, lapses: 0, lastAttemptAt: 0, lastOutcomeCorrect: null }
}

/**
 * Advance one family's ladder. Mirrors the skill-level rules deliberately —
 * the same interval ladder, the same shortening on error — so a learner never
 * has to hold two different mental models of how review timing works.
 */
function applyFormEvent(
  form: FormTracker,
  e: AttemptEvent,
  firstSuccess: boolean,
  eventualSuccess: boolean,
  confidentMiss: boolean,
): void {
  form.lastAttemptAt = e.t
  form.lastOutcomeCorrect = e.firstCorrect
  if (firstSuccess) {
    form.successes++
    form.reviewIndex = Math.min(form.reviewIndex + 1, REVIEW_LADDER_DAYS.length)
    const baseDays = REVIEW_LADDER_DAYS[Math.min(form.reviewIndex - 1, REVIEW_LADDER_DAYS.length - 1)]
    form.reviewDue = e.t + baseDays * stabilityFactor(form.successes, form.lapses) * DAY
  } else if (eventualSuccess) {
    // Repaired: hold the rung but bring it back soon.
    form.reviewDue = e.t + 1 * DAY
  } else {
    form.lapses++
    form.reviewIndex = Math.max(0, form.reviewIndex - 2)
    form.reviewDue = e.t + (confidentMiss ? 0.5 : 1) * DAY
  }
}

/**
 * Personal forgetting-curve factor (HEURISTIC, labeled in the UI): once a
 * skill has real review history, its intervals stretch with successful spaced
 * retrievals and shrink with lapses. Bounded so one streak or one bad day
 * can never run away with the schedule.
 */
export function stabilityFactor(reviewSuccesses: number, lapses: number): number {
  const f = 1 + 0.15 * reviewSuccesses - 0.35 * lapses
  return Math.min(2, Math.max(0.5, f))
}

/**
 * Success for evidence purposes = correct on the FIRST submission with no
 * hints. Eventually-correct after hints earns guided evidence only.
 *
 * ONLY deterministic grading counts. `score` is deliberately not consulted:
 * an event with `firstCorrect === null` produced no graded verdict (a draft,
 * a written artifact) and therefore produces no evidence, however good the
 * work was. Self-assessment guides the plan; it never advances a skill.
 */
function isFirstUnaidedSuccess(e: AttemptEvent): boolean {
  if (e.hintLevel > 0) return false
  return e.firstCorrect === true
}

function isEventualSuccess(e: AttemptEvent): boolean {
  return e.correct === true
}

/**
 * An event that produced no deterministic verdict at all — a pure written
 * artifact, or a legacy self-scored attempt from before drafts became
 * ungraded. It is EXPOSURE, not evidence: never a success, never a miss, and
 * it never moves the review schedule in either direction.
 */
function isUngraded(e: AttemptEvent): boolean {
  return e.firstCorrect === null && e.correct === null
}

function applyEvent(tr: Tracker, e: AttemptEvent): void {
  tr.attempts++
  tr.exposure++
  tr.lastAttemptAt = e.t
  if (isUngraded(e)) return
  const firstSuccess = isFirstUnaidedSuccess(e)
  const eventualSuccess = isEventualSuccess(e)
  tr.lastOutcomeCorrect = e.firstCorrect

  tr.hintedRecent.push(e.hintLevel > 0)
  if (tr.hintedRecent.length > 10) tr.hintedRecent.shift()

  // Misconception tracking: a confident wrong first answer arms the block;
  // a later unaided first-attempt success on the skill repairs it.
  const confidentMiss = e.firstCorrect === false && e.confidence !== null && e.confidence >= HIGH_CONF
  if (confidentMiss) tr.misconceptionAt = e.t
  if (firstSuccess && tr.misconceptionAt !== null) tr.misconceptionAt = null

  if (firstSuccess) {
    tr.recentMisses = 0
    if (tr.independentForms.size >= 2 && e.mode !== 'placement') tr.reviewSuccesses++
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
    // TRANSFER IS MEASURED, NOT DECLARED. It used to fire on any success in
    // transfer mode, which meant an authoring flag decided the top rung. Now
    // the item must come from a template family this skill has never been
    // practiced on — novelty checked against the learner's own history — so
    // "Transferred" means the principle survived leaving its familiar form.
    const novelFamily = !tr.practicedTemplates.has(e.templateId)
    if (e.mode === 'transfer' && tr.independentAt !== null && tr.transferredAt === null && novelFamily) {
      tr.transferredAt = e.t
    }
    tr.lastCorrectAt = e.t
    // Review ladder advances on unaided success (placement does not schedule).
    // First success schedules ladder[0] = 1 day; each further success climbs.
    // The base interval is scaled by the skill's personal stability factor.
    if (e.mode !== 'placement') {
      tr.reviewIndex = Math.min(tr.reviewIndex + 1, REVIEW_LADDER_DAYS.length)
      const baseDays = REVIEW_LADDER_DAYS[Math.min(tr.reviewIndex - 1, REVIEW_LADDER_DAYS.length - 1)]
      tr.reviewDue = e.t + baseDays * stabilityFactor(tr.reviewSuccesses, tr.lapses) * DAY
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
    if (tr.independentForms.size >= 2 && e.mode !== 'placement') tr.lapses++
    if (e.mode !== 'placement') {
      // Errors shorten the interval; a confident error shortens it most.
      tr.reviewIndex = Math.max(0, tr.reviewIndex - 2)
      tr.reviewDue = e.t + (confidentMiss ? 0.5 : 1) * DAY
    }
  }

  // Per-family schedule, in parallel with the skill-level one above.
  // Placement routes rather than teaches, so it schedules nothing.
  if (e.mode !== 'placement') {
    let form = tr.forms.get(e.templateId)
    if (!form) {
      form = newFormTracker()
      tr.forms.set(e.templateId, form)
    }
    applyFormEvent(form, e, firstSuccess, eventualSuccess, confidentMiss)
  }

  // Recorded LAST, so the transfer test above compared this attempt against
  // the families seen strictly before it. Placement routes rather than
  // teaches, so it must not make a family look already-practiced.
  if (e.mode !== 'placement') tr.practicedTemplates.add(e.templateId)
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
    forms: [...tr.forms.entries()].map(([templateId, f]) => ({
      templateId,
      due: f.reviewDue,
      intervalIndex: f.reviewIndex,
      successes: f.successes,
      lapses: f.lapses,
      lastOutcomeCorrect: f.lastOutcomeCorrect,
    })),
    attempts: tr.attempts,
  }
}

/**
 * Memoized replay. A single submitted item used to trigger about five full
 * replays of the whole log (twice while diffing for promotions, plus the
 * evidence hook, the review check, and session completion), each sorting a
 * fresh copy. Cost was O(n) per attempt with no reuse.
 *
 * The cache keys on the events ARRAY IDENTITY — the reducer is append-only and
 * never mutates in place, so a new array means new evidence — plus `now`
 * bucketed to the minute, since review dues only move at minute resolution.
 */
const replayCache = new WeakMap<AttemptEvent[], Map<number, Map<string, SkillEvidence>>>()
const MINUTE = 60_000

export function deriveEvidence(events: AttemptEvent[], now: number): Map<string, SkillEvidence> {
  const bucket = Math.floor(now / MINUTE)
  let perArray = replayCache.get(events)
  if (!perArray) {
    perArray = new Map()
    replayCache.set(events, perArray)
  }
  const hit = perArray.get(bucket)
  if (hit) return hit
  const fresh = replayEvidence(events, now)
  // Only the newest bucket is worth keeping; older ones will never be asked for
  // again and would pin memory for the lifetime of the events array.
  perArray.clear()
  perArray.set(bucket, fresh)
  return fresh
}

/** Uncached replay. Events must be time-ordered. */
function replayEvidence(events: AttemptEvent[], now: number): Map<string, SkillEvidence> {
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
      forms: [],
      attempts: 0,
    }
  )
}
