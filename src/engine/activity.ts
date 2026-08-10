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

/**
 * The sentence the learner reads after a checkpoint resolves.
 *
 * It lives here rather than in the player because it is the one place the app
 * tells a learner what their answer PROVED, and that claim has to match what
 * the engine actually recorded. Getting it wrong is not a cosmetic slip: it is
 * the app asserting independent evidence it did not collect.
 *
 * `supported` marks work that handed the learner the explanation up front — a
 * PFL probe. Answering one is genuinely informative, but it is never unaided,
 * so it must never be described as the evidence that advances skills.
 */
export function verdictMessage({
  ok,
  firstTry,
  hintsUsed,
  supported,
}: {
  ok: boolean | null
  firstTry: boolean
  hintsUsed: number
  supported: boolean
}): string {
  if (ok === null) return 'Recorded.'
  if (supported) {
    return ok
      ? 'Correct — but you were given the explanation, so this is not counted as independent evidence. It measures how well you pick a new idea up.'
      : 'Not yet — and that is fine. This one measures how a brand-new idea lands, not what you already know.'
  }
  if (!ok) return 'Still not there — read the path below closely; this idea will return as a new problem.'
  if (firstTry && hintsUsed === 0) return 'Correct — unaided, first try. That is the evidence that advances skills.'
  if (hintsUsed > 0) return 'Correct — with hints, so this counts as guided evidence (independence comes next).'
  return 'Corrected. The repair is real learning; a fresh version of this idea will come back later.'
}

/**
 * Which phase a resumed activity should open in.
 *
 * A draft records the phase the learner was in, but content can change
 * between sessions and a saved index can land on a part built differently
 * from the one that was saved. Replaying `'study'` onto a part with nothing
 * to study renders an empty screen whose only button is missing — the learner
 * is stuck with a parked session they cannot finish.
 *
 * Lives here rather than in the player for the same reason `aggregateParts`
 * does: it is a rule about activities, and it should be provable without a DOM.
 */
export function resumePhase<P extends string>(
  saved: P | undefined,
  hasStudy: boolean,
  fallbacks: { study: P; answer: P },
): P {
  if (saved === fallbacks.study && !hasStudy) return fallbacks.answer
  if (saved) return saved
  return hasStudy ? fallbacks.study : fallbacks.answer
}
