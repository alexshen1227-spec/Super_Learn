/**
 * Onboarding goals, wired to something real.
 *
 * They were collected and then read by nothing at all: picking "Improve at
 * chess" or "Raise my grades" changed not one thing about what the app served
 * you. That is worse than not asking, because it implies a promise.
 *
 * What they now do is nudge the long-run BALANCE — a bounded tilt, not a
 * filter. The brief is explicit that urgent work must never permanently erase
 * other areas, and there is a real learning reason too: a learner is a poor
 * judge of what they most need, so a goal should shift emphasis rather than
 * decide the curriculum. Nothing chosen is dropped; the unchosen areas keep
 * their floor and keep being taught, just less often.
 *
 * The floors in `rebalanceAllocationPercentage` still apply after this, so no
 * bucket can be pushed under its ≥5% share however many goals point elsewhere.
 */
import type { BucketId } from '../domain/types'

/** Total percentage points a full set of goals may move. Deliberately modest. */
const GOAL_BUDGET = 12

/**
 * Which areas each preset leans on. Several goals touch several buckets,
 * because that is honest — "think more clearly about people and claims" is
 * not one subject.
 */
const GOAL_WEIGHTS: Record<string, Partial<Record<BucketId, number>>> = {
  'Raise my grades': { math: 3, science: 1, physics: 1 },
  'Be ready for high-school math': { math: 4, physics: 1 },
  'Get better at problem solving': { math: 2, investigator: 1, puzzle: 1, strategist: 1 },
  'Sharpen focus and memory': { observer: 2, meta: 2 },
  'Improve at chess': { puzzle: 4 },
  'Think more clearly about people and claims': { insight: 2, observer: 1, science: 1, investigator: 1 },
}

export interface GoalTilt {
  /** Percentage points to add per bucket (before floors and renormalisation). */
  deltas: Partial<Record<BucketId, number>>
  /** Plain-language note, or null when no goals were chosen. */
  note: string | null
}

/**
 * Turn chosen goals into a bounded allocation tilt.
 *
 * Returns zero deltas for an empty or unrecognised selection — an unknown
 * string from an imported profile must not be able to move anything.
 */
export function goalTilt(goals: string[]): GoalTilt {
  const known = goals.filter((g) => GOAL_WEIGHTS[g])
  if (!known.length) return { deltas: {}, note: null }

  const raw: Partial<Record<BucketId, number>> = {}
  let total = 0
  for (const g of known) {
    for (const [bucket, w] of Object.entries(GOAL_WEIGHTS[g]) as [BucketId, number][]) {
      raw[bucket] = (raw[bucket] ?? 0) + w
      total += w
    }
  }
  // Scale to the fixed budget so picking six goals does not tilt six times as
  // hard as picking one — more goals means the same emphasis spread wider,
  // which is what choosing everything should mean.
  const deltas: Partial<Record<BucketId, number>> = {}
  for (const [bucket, w] of Object.entries(raw) as [BucketId, number][]) {
    deltas[bucket] = (w / total) * GOAL_BUDGET
  }
  return {
    deltas,
    // Kept short on purpose: this shows in a list of adjustments, and a
    // paragraph there reads as an error message rather than an explanation.
    note: `Your goals tilt the balance ~${GOAL_BUDGET} points. Nothing else is dropped — every area keeps its floor.`,
  }
}
