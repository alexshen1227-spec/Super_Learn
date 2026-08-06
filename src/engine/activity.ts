/**
 * Multi-part activity aggregation.
 *
 * Extracted from the player so the evidence rules are testable in isolation —
 * these decide what a case file, studio, or method drill contributes to
 * mastery, and they must hold the same line the single-item path holds:
 *
 *  - `firstCorrect` reflects FIRST submissions only. A checkpoint repaired
 *    after an error is guided evidence, never independent evidence.
 *  - Any hint anywhere in the activity disqualifies independent evidence.
 *  - `correct` reflects EVENTUAL success, so a corrected activity still earns
 *    guided credit instead of being logged as a flat miss.
 *  - `draft` parts are ungraded: they contribute nothing in either direction.
 */

export interface PartOutcome {
  /** Correct on the first submission of this checkpoint. Null for drafts. */
  firstCorrect: boolean | null
  /** Eventual correctness after any permitted correction. Null for drafts. */
  eventualOk: boolean | null
  /** Deterministic partial credit for the resolved checkpoint. */
  score: number
  /** False for `draft` parts — exposure, never evidence. */
  graded: boolean
}

export interface AggregatedActivity {
  correct: boolean | null
  firstCorrect: boolean | null
  score: number | null
  gradedCount: number
}

export function aggregateParts(outcomes: PartOutcome[], hintsUsed: number): AggregatedActivity {
  const graded = outcomes.filter((p) => p.graded)
  // Drafts are excluded from the average too: a written artifact must not be
  // able to lift OR dilute the score of the checkpoints that were graded.
  const score = graded.length ? graded.reduce((a, p) => a + p.score, 0) / graded.length : null
  const deterministic = graded.filter((p) => p.firstCorrect !== null)
  if (!deterministic.length) {
    return { correct: null, firstCorrect: null, score, gradedCount: graded.length }
  }
  const allFirst = deterministic.every((p) => p.firstCorrect === true)
  const allEventual = deterministic.every((p) => p.eventualOk === true)
  return {
    correct: allEventual,
    firstCorrect: allFirst && hintsUsed === 0,
    score,
    gradedCount: graded.length,
  }
}
