/**
 * Coach-tuned allocation targets.
 *
 * The user's sliders are the LONG-RUN BASE. When coach management is on, the
 * coach applies bounded, disclosed nudges for the situations the spec names —
 * an approaching deadline, review pressure building in a bucket — and then
 * drifts back as the pressure clears (the nudges are recomputed from live
 * evidence each time, so they decay naturally).
 *
 * Hard guarantees ("it won't let you forget stuff"):
 *  - every bucket keeps a true ≥5% share — nothing starves;
 *  - due reviews are pulled into the warm-up REGARDLESS of allocation, and a
 *    bucket whose reviews pile up gets a temporary boost here as well;
 *  - all tuning is visible: notes ship with the targets and reach the
 *    decision log and the balance cards.
 */
import type { AppState, BucketId, SkillEvidence } from '../domain/types'
import { BUCKET_BY_ID } from '../domain/types'
import type { ContentIndex } from './content-index'
import { allocationReport, type AllocationReport } from './allocation'
import { dueReviews } from './scheduler'
import { calendarDaysUntil } from './time'
import { normalizeAllocationPercentages, rebalanceAllocationPercentage } from './allocationTargets'
import { goalTilt } from './goals'

const DEADLINE_BOOST = 8
const REVIEW_BOOST_PER_2 = 2
const REVIEW_BOOST_CAP = 6

export interface TunedAllocation {
  /** Real target percentages summing to exactly 100. */
  targets: Record<BucketId, number>
  tuned: boolean
  notes: string[]
}

export function tuneTargets(
  state: AppState,
  evidence: Map<string, SkillEvidence>,
  index: ContentIndex,
  now: number,
): TunedAllocation {
  const base = normalizeAllocationPercentages(state.settings.allocations)
  if (!state.settings.coachManagedAllocations) {
    return { targets: base, tuned: false, notes: [] }
  }
  let targets = { ...base }
  const notes: string[] = []

  // Goals chosen at onboarding. A bounded tilt applied FIRST, so the
  // situational nudges below (deadlines, review pressure) still layer on top
  // and still win when something is actually urgent. Every rebalance keeps the
  // per-bucket floor, so nothing a goal points away from can starve.
  const tilt = goalTilt(state.profile.goals)
  if (tilt.note) {
    for (const [bucket, delta] of Object.entries(tilt.deltas) as [BucketId, number][]) {
      targets = rebalanceAllocationPercentage(targets, bucket, Math.round(targets[bucket] + delta))
    }
    notes.push(tilt.note)
  }

  // Deadline pressure: nearest upcoming subject deadline within 14 days.
  const deadline = state.deadlines
    .map((d) => ({ ...d, days: calendarDaysUntil(d.dateISO, now) }))
    .filter((d) => d.bucket !== null && d.days >= 0 && d.days <= 14)
    .sort((a, b) => a.days - b.days)[0]
  if (deadline && deadline.bucket) {
    const boost = deadline.days <= 5 ? DEADLINE_BOOST : DEADLINE_BOOST / 2
    const before = targets[deadline.bucket]
    Object.assign(targets, rebalanceAllocationPercentage(targets, deadline.bucket, before + boost))
    const applied = targets[deadline.bucket] - before
    notes.push(
      `${BUCKET_BY_ID[deadline.bucket].name} +${applied} points while “${deadline.title}” is ${deadline.days} day${deadline.days === 1 ? '' : 's'} out.`,
    )
  }

  // Review pressure: buckets with due reviews get a temporary boost.
  const dueByBucket = new Map<BucketId, number>()
  for (const d of dueReviews(evidence, now)) {
    const bucket = index.skills.get(d.skillId)?.bucket
    if (bucket) dueByBucket.set(bucket, (dueByBucket.get(bucket) ?? 0) + 1)
  }
  for (const [bucket, count] of dueByBucket) {
    const boost = Math.min(REVIEW_BOOST_CAP, Math.floor(count / 2) * REVIEW_BOOST_PER_2)
    if (boost > 0) {
      const before = targets[bucket]
      Object.assign(targets, rebalanceAllocationPercentage(targets, bucket, before + boost))
      const applied = targets[bucket] - before
      notes.push(`${BUCKET_BY_ID[bucket].name} +${applied} while ${count} review${count === 1 ? ' is' : 's are'} due.`)
    }
  }

  const tuned = notes.length > 0
  if (tuned) notes.push('Temporary — targets drift back to your base as deadlines pass and reviews clear.')
  // Boosts have already rebalanced the exact 100% mix, so no category can be
  // squeezed below its floor and no manual cleanup is needed downstream.
  return { targets, tuned, notes }
}

export interface EffectiveAllocation extends TunedAllocation {
  report: AllocationReport
}

/** One-stop: tuned targets + the 28-day report computed against them. */
export function effectiveAllocation(
  state: AppState,
  evidence: Map<string, SkillEvidence>,
  index: ContentIndex,
  now: number,
): EffectiveAllocation {
  const tuning = tuneTargets(state, evidence, index, now)
  const report = allocationReport(state.events, state.settings, now, tuning.targets)
  return { ...tuning, report }
}
