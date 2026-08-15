/**
 * The stretch signal: is the work currently too easy, or too hard?
 *
 * The app was collecting first-try accuracy and never acting on it globally.
 * A 120-day simulation made the consequence visible: a learner answering 95%
 * of items correctly was still being served difficulty ~2.4 in week 17, the
 * same as in week 3. Two causes, both fixed alongside this — retained skills
 * left the selection pool entirely (so the learner sat permanently at the
 * frontier of NEW material, which is always easy), and reviews were capped at
 * difficulty 3 — but the missing piece was any signal that said "this person
 * is cruising, ask for more".
 *
 * Desirable difficulty is the principle: learning is best somewhere below
 * comfortable and above overwhelming. Sustained 95% is a signal the material
 * is under the learner, and sustained 40% is a signal it is over them.
 *
 * HEURISTIC. The thresholds below are product judgment, not a measured
 * optimum, and the copy says so wherever they reach the learner. What is not
 * heuristic is the direction: an app that never raises difficulty cannot get
 * anyone anywhere.
 *
 * Refusing to exist is part of the contract: under `MIN_SAMPLE` graded
 * attempts this returns a null accuracy and a zero adjustment, so a single bad
 * afternoon cannot swing the whole plan.
 */
import type { AttemptEvent, BucketId } from '../domain/types'

/** Attempts considered. Long enough to be stable, short enough to be current. */
const WINDOW = 25
/** Below this many, the signal says nothing at all. */
export const MIN_SAMPLE = 12
const LOOKBACK_MS = 21 * 86_400_000

/**
 * Per-area lookback. Longer than the global one on purpose: a learner splits
 * their minutes across ten areas, so any single area accumulates evidence
 * roughly four times slower. Measured on a 120-day run at 30 minutes a day,
 * only five of ten areas cleared the 12-sample floor inside 21 days, while all
 * ten cleared it over the full run.
 */
const AREA_LOOKBACK_MS = 45 * 86_400_000
/**
 * Pseudo-count pulling a thin area's accuracy back toward the global figure.
 *
 * Without it a per-area dial would chase noise: the control learner in
 * `sim/lopsided.sim.ts` is uniformly able by construction and STILL showed a
 * 17-point spread between areas, which at n≈15 is about 1.4 standard errors —
 * exactly what you would expect from sampling alone. Set equal to MIN_SAMPLE so
 * an area with 12 of its own attempts is weighted half its own, half global.
 */
const AREA_PRIOR = 12
/** Below this many attempts of its own, an area just is the global figure. */
const AREA_MIN_SAMPLE = 6

export interface StretchSignal {
  /** Unaided first-try accuracy over the window, or null when too few. */
  accuracy: number | null
  /** How many graded attempts the number rests on. */
  n: number
  /** Difficulty adjustment, in difficulty units. 0 when undetermined. */
  adjust: number
  /** Plain-language reason, or null when the signal is staying quiet. */
  why: string | null
}

function isGraded(e: AttemptEvent): boolean {
  return e.mode !== 'placement' && e.hintLevel === 0 && e.firstCorrect !== null
}

/**
 * Turn an accuracy into an adjustment and a sentence.
 *
 * Asymmetric on purpose. Easing off happens faster than pushing up, because
 * being over someone's head wastes a session outright while being slightly
 * under it merely wastes some of one.
 *
 * `where` names the area when the number describes one area rather than the
 * whole diet, so the learner can tell why one part of today got harder while
 * another got easier.
 */
function band(accuracy: number, n: number, where: string | null): StretchSignal {
  const pct = Math.round(accuracy * 100)
  const scope = where ? ` in ${where}` : ''
  if (accuracy >= 0.9) {
    return {
      accuracy,
      n,
      adjust: 1.5,
      why: where
        ? `${pct}% first-try correct${scope} — that work is under you, so it steps up.`
        : `${pct}% first-try correct over your last ${n} unaided attempts — the work is under you, so it steps up.`,
    }
  }
  if (accuracy >= 0.82) {
    return {
      accuracy,
      n,
      adjust: 0.75,
      why: `${pct}% first-try correct${scope} recently, which is comfortable — nudging the difficulty up.`,
    }
  }
  if (accuracy <= 0.35) {
    return {
      accuracy,
      n,
      adjust: -1,
      why: `${pct}% first-try correct${scope} recently. That is too hard to learn from, so the difficulty comes down until it is not.`,
    }
  }
  if (accuracy <= 0.5) {
    return {
      accuracy,
      n,
      adjust: -0.5,
      why: `${pct}% first-try correct${scope} recently — easing the difficulty back toward the range where the work is hard but winnable.`,
    }
  }
  return {
    accuracy,
    n,
    adjust: 0,
    why: `${pct}% first-try correct${scope} — a good place to be working, so the difficulty holds.`,
  }
}

export function stretchSignal(events: AttemptEvent[], now: number): StretchSignal {
  const cutoff = now - LOOKBACK_MS
  const graded = events.filter((e) => e.t >= cutoff && isGraded(e)).slice(-WINDOW)

  if (graded.length < MIN_SAMPLE) {
    return { accuracy: null, n: graded.length, adjust: 0, why: null }
  }

  const hits = graded.filter((e) => e.firstCorrect === true).length
  return band(hits / graded.length, graded.length, null)
}

/**
 * The same question asked one area at a time.
 *
 * The global signal answers "is the diet under or over this learner?" with a
 * single number, and applies it to every block of the day. That is right for a
 * learner who is uniformly able and wrong for everyone else. Measured on a
 * 120-day run: a learner at 96% in mathematics and 39% in observation produced
 * a global reading of 68% and an adjustment of ZERO — so the app held a level
 * that was far too easy in one area and far too hard in another, and said the
 * learner was in a good place.
 *
 * Two rules keep it honest. It stays completely silent whenever the global
 * signal is silent, so a new learner is not aimed at from four data points. And
 * a thin area is pulled back toward the global figure rather than believed on
 * its own, because per-area counts are small enough that noise alone moves them
 * across a band.
 *
 * Returns a lookup so the whole log is scanned once per plan, not once per block.
 */
export function areaStretch(
  events: AttemptEvent[],
  now: number,
): (bucket: BucketId | undefined) => StretchSignal {
  const overall = stretchSignal(events, now)
  if (overall.accuracy === null) return () => overall

  const cutoff = now - AREA_LOOKBACK_MS
  const byBucket = new Map<string, { n: number; hits: number }>()
  for (const e of events) {
    if (e.t < cutoff || !isGraded(e)) continue
    const row = byBucket.get(e.bucket) ?? { n: 0, hits: 0 }
    row.n += 1
    if (e.firstCorrect === true) row.hits += 1
    byBucket.set(e.bucket, row)
  }

  const cache = new Map<string, StretchSignal>()
  return (bucket) => {
    if (!bucket) return overall
    const hit = cache.get(bucket)
    if (hit) return hit
    const row = byBucket.get(bucket)
    if (!row || row.n < AREA_MIN_SAMPLE) {
      cache.set(bucket, overall)
      return overall
    }
    // Shrink toward the global figure in proportion to how little this area
    // has to say for itself.
    const shrunk = (row.hits + AREA_PRIOR * overall.accuracy!) / (row.n + AREA_PRIOR)
    const signal = band(shrunk, row.n, BUCKET_LABEL[bucket] ?? null)
    cache.set(bucket, signal)
    return signal
  }
}

const BUCKET_LABEL: Record<string, string> = {
  math: 'mathematics',
  physics: 'physics',
  coding: 'coding',
  science: 'science',
  observer: 'observation',
  investigator: 'investigation',
  strategist: 'strategy',
  insight: 'human insight',
  meta: 'learning skills',
  puzzle: 'puzzles',
}
