/**
 * Rolling 28-day allocation of focused minutes vs the user's targets.
 * Only active task time counts (attempt elapsedSec), never navigation.
 */
import type { AppSettings, AttemptEvent, BucketId } from '../domain/types'
import { BUCKETS } from '../domain/types'

export const WINDOW_DAYS = 28
const WINDOW_MS = WINDOW_DAYS * 86_400_000

export interface AllocationReport {
  totalMinutes: number
  /** Actual minutes per bucket in the window. */
  minutes: Record<BucketId, number>
  /** Actual share (0..1) per bucket; 0 when no time recorded. */
  actual: Record<BucketId, number>
  /** Target share (0..1). */
  target: Record<BucketId, number>
  /**
   * Debt in minutes: positive = under-practiced vs target.
   * Computed against the window's total, so it is meaningful from day one.
   */
  debtMinutes: Record<BucketId, number>
  /** Buckets ranked most-underserved first (only meaningful with some data). */
  underserved: BucketId[]
}

function zeroRecord(): Record<BucketId, number> {
  return Object.fromEntries(BUCKETS.map((b) => [b.id, 0])) as Record<BucketId, number>
}

export function allocationReport(
  events: AttemptEvent[],
  settings: AppSettings,
  now: number,
  /** Optional coach-tuned percentages; defaults to the user's base. */
  targetsOverride?: Record<BucketId, number>,
): AllocationReport {
  const percentages = targetsOverride ?? settings.allocations
  const minutes = zeroRecord()
  const cutoff = now - WINDOW_MS
  for (const e of events) {
    if (e.t < cutoff || e.mode === 'placement') continue
    minutes[e.bucket] += e.elapsedSec / 60
  }
  const totalMinutes = Object.values(minutes).reduce((a, b) => a + b, 0)
  const actual = zeroRecord()
  const target = zeroRecord()
  const debtMinutes = zeroRecord()
  const totalTarget = Object.values(percentages).reduce((a, b) => a + b, 0) || 100
  for (const b of BUCKETS) {
    target[b.id] = (percentages[b.id] ?? 0) / totalTarget
    actual[b.id] = totalMinutes > 0 ? minutes[b.id] / totalMinutes : 0
    debtMinutes[b.id] = target[b.id] * totalMinutes - minutes[b.id]
  }
  /*
   * Ranked by absolute minutes owed.
   *
   * A relative (debt ÷ target) ordering looks fairer on paper — a 5% bucket
   * can only ever be 5% of the window behind, so it might seem doomed to sit
   * below every larger bucket. It is not: serving a bucket clears its debt and
   * the queue rotates. Both orderings were simulated over 120 days and came
   * out equivalent (52 vs 53 skills reached, every bucket within a couple of
   * points of target), so this stays as the simpler of the two.
   */
  const underserved = BUCKETS.map((b) => b.id)
    .filter((id) => target[id] > 0)
    .sort((a, b) => debtMinutes[b] - debtMinutes[a])
  return { totalMinutes, minutes, actual, target, debtMinutes, underserved }
}

/**
 * Relative debt used by the planner: how far below target a bucket is,
 * normalized so it is comparable across buckets of different size.
 * Range roughly [-1, 1]; positive = underserved.
 */
export function relativeDebt(report: AllocationReport, bucket: BucketId): number {
  const t = report.target[bucket]
  if (t === 0) return -1
  if (report.totalMinutes < 10) return 0 // not enough data to owe anything
  return Math.max(-1, Math.min(1, (t - report.actual[bucket]) / t))
}
