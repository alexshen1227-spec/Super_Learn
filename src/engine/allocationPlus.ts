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
 *  - every bucket with a nonzero base keeps a ≥3% floor — nothing starves;
 *  - due reviews are pulled into the warm-up REGARDLESS of allocation, and a
 *    bucket whose reviews pile up gets a temporary boost here as well;
 *  - all tuning is visible: notes ship with the targets and reach the
 *    decision log and the balance cards.
 */
import type { AppState, BucketId, SkillEvidence } from '../domain/types'
import { BUCKETS, BUCKET_BY_ID } from '../domain/types'
import type { ContentIndex } from './content-index'
import { allocationReport, type AllocationReport } from './allocation'
import { dueReviews } from './scheduler'

const FLOOR = 3 // percent points
const DEADLINE_BOOST = 8
const REVIEW_BOOST_PER_2 = 2
const REVIEW_BOOST_CAP = 6

export interface TunedAllocation {
  /** Targets in percent points (same scale as settings.allocations). */
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
  const base = { ...state.settings.allocations }
  if (!state.settings.coachManagedAllocations) {
    return { targets: base, tuned: false, notes: [] }
  }
  const targets = { ...base }
  const notes: string[] = []

  // Deadline pressure: nearest upcoming subject deadline within 14 days.
  const deadline = state.deadlines
    .map((d) => ({ ...d, days: (Date.parse(d.dateISO) - now) / 86_400_000 }))
    .filter((d) => d.bucket !== null && d.days >= 0 && d.days <= 14)
    .sort((a, b) => a.days - b.days)[0]
  if (deadline && deadline.bucket) {
    const boost = deadline.days <= 5 ? DEADLINE_BOOST : DEADLINE_BOOST / 2
    targets[deadline.bucket] += boost
    notes.push(
      `${BUCKET_BY_ID[deadline.bucket].name} +${boost} points while “${deadline.title}” is ${Math.max(0, Math.round(deadline.days))} day${Math.round(deadline.days) === 1 ? '' : 's'} out.`,
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
      targets[bucket] += boost
      notes.push(`${BUCKET_BY_ID[bucket].name} +${boost} while ${count} review${count === 1 ? ' is' : 's are'} due.`)
    }
  }

  // Floor every nonzero-base bucket so no area can be starved into forgetting.
  for (const b of BUCKETS) {
    if (base[b.id] > 0 && targets[b.id] < FLOOR) targets[b.id] = FLOOR
  }

  const tuned = notes.length > 0 || BUCKETS.some((b) => targets[b.id] !== base[b.id])
  if (tuned && notes.length === 0) notes.push('Floors applied so every area keeps at least 3%.')
  if (tuned) notes.push('Temporary — targets drift back to your base as deadlines pass and reviews clear.')
  // allocationReport normalizes by the sum, so boosted weights trade off
  // against everything else proportionally — no manual rebalancing needed.
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
