/**
 * Where an error came FROM, derived from the work rather than asked about.
 *
 * ## Why this exists
 *
 * The coach's mal-rule profile (`engine/malRules.ts`) sorts mistakes by CAUSE
 * rather than by topic, which is the highest-leverage study move available:
 * "practise more" only repairs execution gaps, and a learner who reliably
 * misreads constraints needs a different intervention from one who reliably
 * slips on signs. RESEARCH.md §5 also states plainly that the cause must come
 * from observed work, because self-diagnosis is self-assessment and the
 * evidence model refuses self-assessment everywhere else.
 *
 * It did not. Measured over 120 simulated days at 30 min/day and 70% accuracy,
 * with no manual self-tagging: **318 misses, of which 13 (4.1%) could be tagged
 * from the work at all.** In the trailing 28-day window that left 4 tagged
 * against 68 untagged — below the profile's floor of 8 — so the coach said
 * "not enough yet to name a pattern" permanently. The only route to the feature
 * was the learner tapping a cause chip after every miss, which is exactly the
 * self-report the ledger says the app does not accept.
 *
 * Only worked chains (6 of 548 template families), chess and logic grids could
 * produce a tag. This module widens that to every graded checkpoint.
 *
 * ## The three sources, in precedence order
 *
 * 1. **The broken step** — a worked chain checks each intermediate value, so
 *    the first failed link names the misconception exactly. Most precise;
 *    always wins.
 * 2. **The chosen distractor** — an option the learner actually selected, whose
 *    misconception was named at authoring time. Also observed work: it says
 *    which wrong idea attracted them, not merely that they were wrong.
 * 3. **How the repair went** — the universal fallback, and the reason coverage
 *    moves at all. A learner who fixes their own error unaided on the next
 *    attempt had the method and mis-executed it; one who needed a hint or the
 *    full solution did not have the method.
 *
 * ## What source 3 is and is not
 *
 * It is a HEURISTIC mapping, and the coach says so where it reaches the learner.
 * What it is not is an opinion: the input is what the learner did next, not what
 * they think went wrong. That is the distinction RESEARCH.md §5 draws, and it is
 * the same distinction the productive-failure literature draws when it finds
 * that instruction built on the learner's own attempted solutions is the
 * strongest moderator of the effect (Sinha & Kapur 2021, g = 0.56 with that
 * feature present versus 0.20 without).
 *
 * It deliberately refuses to fire on CHOICE formats. Picking a second option
 * from four after being told the first was wrong costs nothing and succeeds by
 * luck about a third of the time, so a lucky second pick would be recorded as
 * "execution slip" on a learner who has no idea. On a constructed answer —
 * a number, a fraction, a typed expression — a correct unaided retry is real
 * evidence that the method was there. Choice formats therefore rely on sources
 * 1 and 2, and produce no tag when neither is available. An untagged miss is
 * counted as untagged; `malRuleProfile` reports those separately and never
 * redistributes them to the nearest cause.
 */
import type { ErrorTag } from '../domain/types'

/** How a learner got from a first-attempt miss to the end of the checkpoint. */
export type RepairPath =
  /** Corrected on the very next attempt, with no hint revealed. */
  | 'unaided-retry'
  /** Corrected, but a hint had been revealed first. */
  | 'after-hints'
  /** Took the full worked solution. */
  | 'full-reveal'
  /** Attempted the repair and got it wrong again. */
  | 'still-wrong'

/** Which of the three sources produced the tag. Recorded so copy can be honest. */
export type DiagnosisBasis = 'broken-step' | 'chosen-distractor' | 'repair-path'

export interface DiagnosisInput {
  /** Misconception named by the first failed link of a worked chain. */
  stepTag?: ErrorTag | null
  /** Misconception authored on the option the learner actually picked. */
  distractorTag?: ErrorTag | null
  /** `AnswerSpec['type']` of the checkpoint that was graded. */
  validator: string
  repair: RepairPath
}

export interface Diagnosis {
  tag: ErrorTag | null
  basis: DiagnosisBasis | null
}

/**
 * Formats where a wrong answer had to be CONSTRUCTED, so re-deriving it unaided
 * is evidence rather than a coin flip. Everything else is a choice among shown
 * options: `mcq`, `multi`, `order`, `classify`.
 */
const CONSTRUCTED: ReadonlySet<string> = new Set(['numeric', 'fraction', 'text', 'steps'])

export function isConstructedFormat(validator: string): boolean {
  return CONSTRUCTED.has(validator)
}

/**
 * The cause of a first-attempt miss, or null when nothing observable names one.
 *
 * Call this ONLY for a checkpoint whose first submission was wrong. A correct
 * first attempt has no cause to find.
 */
export function diagnose(input: DiagnosisInput): Diagnosis {
  if (input.stepTag) return { tag: input.stepTag, basis: 'broken-step' }
  if (input.distractorTag) return { tag: input.distractorTag, basis: 'chosen-distractor' }
  if (!isConstructedFormat(input.validator)) return { tag: null, basis: null }
  switch (input.repair) {
    case 'unaided-retry':
      // Had the method, mis-ran it. The repair for this is a check, not re-teaching.
      return { tag: 'slip', basis: 'repair-path' }
    case 'after-hints':
    case 'full-reveal':
    case 'still-wrong':
      // Needed teaching to get there — or did not get there. Drilling this
      // without re-learning the idea first is the wasted-practice case.
      return { tag: 'concept', basis: 'repair-path' }
  }
}

/** Plain-language note on where a cause came from, for the coach's evidence list. */
export const BASIS_NOTE: Record<DiagnosisBasis, string> = {
  'broken-step':
    'named by the step that broke — the chain checks each intermediate value, so the cause is the link itself',
  'chosen-distractor':
    'named by the specific wrong answer you picked, not just by being wrong',
  'repair-path':
    'inferred from how the repair went — fixing it unaided reads as a slip, needing the explanation reads as a gap. A rule of thumb, not a measurement',
}
