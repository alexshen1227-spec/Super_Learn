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
import type { AttemptEvent } from '../domain/types'

/** Attempts considered. Long enough to be stable, short enough to be current. */
const WINDOW = 25
/** Below this many, the signal says nothing at all. */
export const MIN_SAMPLE = 12
const LOOKBACK_MS = 21 * 86_400_000

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

export function stretchSignal(events: AttemptEvent[], now: number): StretchSignal {
  const cutoff = now - LOOKBACK_MS
  const graded = events
    .filter(
      (e) =>
        e.t >= cutoff &&
        e.mode !== 'placement' &&
        e.hintLevel === 0 &&
        e.firstCorrect !== null,
    )
    .slice(-WINDOW)

  if (graded.length < MIN_SAMPLE) {
    return { accuracy: null, n: graded.length, adjust: 0, why: null }
  }

  const hits = graded.filter((e) => e.firstCorrect === true).length
  const accuracy = hits / graded.length
  const pct = Math.round(accuracy * 100)

  // Asymmetric on purpose. Easing off happens faster than pushing up, because
  // being over someone's head wastes a session outright while being slightly
  // under it merely wastes some of one.
  if (accuracy >= 0.9) {
    return {
      accuracy,
      n: graded.length,
      adjust: 1.5,
      why: `${pct}% first-try correct over your last ${graded.length} unaided attempts — the work is under you, so it steps up.`,
    }
  }
  if (accuracy >= 0.82) {
    return {
      accuracy,
      n: graded.length,
      adjust: 0.75,
      why: `${pct}% first-try correct recently, which is comfortable — nudging the difficulty up.`,
    }
  }
  if (accuracy <= 0.35) {
    return {
      accuracy,
      n: graded.length,
      adjust: -1,
      why: `${pct}% first-try correct recently. That is too hard to learn from, so the difficulty comes down until it is not.`,
    }
  }
  if (accuracy <= 0.5) {
    return {
      accuracy,
      n: graded.length,
      adjust: -0.5,
      why: `${pct}% first-try correct recently — easing the difficulty back toward the range where the work is hard but winnable.`,
    }
  }
  return {
    accuracy,
    n: graded.length,
    adjust: 0,
    why: `${pct}% first-try correct — a good place to be working, so the difficulty holds.`,
  }
}
