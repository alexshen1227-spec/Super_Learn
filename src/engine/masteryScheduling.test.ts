/**
 * The two honesty rules of review arithmetic (2026-08-18):
 *
 * 1. A success that SURVIVED a longer gap than its ladder step schedules the
 *    next check no sooner than the gap it survived. The old arithmetic reset
 *    to the ladder step, so a 45-day-late success was rescheduled as if the
 *    memory had only been shown to hold for a week.
 * 2. Only SPACED retrievals feed the stability factor. Five correct answers
 *    in one sitting used to stretch the schedule exactly as far as five
 *    successes spread over weeks.
 */
import { describe, expect, it } from 'vitest'
import type { AttemptEvent } from '../domain/types'
import { MAX_REVIEW_DAYS, deriveEvidence, evidenceFor } from './mastery'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 0, 5, 16)
const SKILL = 'm-percent'

function win(id: string, templateId: string, t: number): AttemptEvent {
  return {
    id,
    t,
    sessionId: 's1',
    templateId,
    itemVersion: 1,
    seed: Number(id.replace(/\D/g, '')) || 1,
    skillIds: [SKILL],
    bucket: 'math',
    mode: 'independent',
    firstResponse: 'x',
    finalResponse: 'x',
    correct: true,
    firstCorrect: true,
    score: 1,
    validator: 'numeric',
    hintLevel: 0,
    confidence: null,
    elapsedSec: 120,
    errorTags: [],
    difficulty: 3,
  }
}

describe('survived-gap credit', () => {
  it('a late successful review never schedules the next one sooner than the gap it survived', () => {
    // Two wins on distinct families make the skill independent; the second
    // win lands 45 days after the first, far past its 1-day ladder ask.
    const events = [win('a1', 'tpl-a', T0), win('a2', 'tpl-b', T0 + 45 * DAY)]
    const now = T0 + 45 * DAY + 1
    const ev = evidenceFor(deriveEvidence(events, now), SKILL)
    expect(ev.review).not.toBeNull()
    const intervalDays = (ev.review!.due - (T0 + 45 * DAY)) / DAY
    // Ladder step at index 2 is 3 days; the survived gap of 45 must win.
    expect(intervalDays).toBeGreaterThanOrEqual(45)
  })

  it('the ceiling holds: no gap schedules past MAX_REVIEW_DAYS x stability bounds', () => {
    const events = [win('b1', 'tpl-a', T0), win('b2', 'tpl-b', T0 + 400 * DAY)]
    const now = T0 + 400 * DAY + 1
    const ev = evidenceFor(deriveEvidence(events, now), SKILL)
    const intervalDays = (ev.review!.due - (T0 + 400 * DAY)) / DAY
    expect(intervalDays).toBeLessThanOrEqual(MAX_REVIEW_DAYS)
  })

  it('an on-time success keeps its ordinary ladder step', () => {
    // Second win only 12 hours later: survived < ladder, so ladder wins and
    // nothing behaves differently from the old arithmetic.
    const events = [win('c1', 'tpl-a', T0), win('c2', 'tpl-b', T0 + 0.5 * DAY)]
    const now = T0 + 0.5 * DAY + 1
    const ev = evidenceFor(deriveEvidence(events, now), SKILL)
    const intervalDays = (ev.review!.due - (T0 + 0.5 * DAY)) / DAY
    expect(intervalDays).toBeGreaterThanOrEqual(2.9)
    expect(intervalDays).toBeLessThanOrEqual(7)
  })
})

describe('spaced-only stability', () => {
  it('massed same-sitting successes do not stretch the schedule the way spaced ones do', () => {
    // Both learners end at the same ladder rung via the same number of wins;
    // one massed a burst of extra wins into a single hour, the other spread
    // the same extra wins across weeks. The spaced learner has demonstrated
    // stability; the massed one has not, and their intervals must differ.
    const massedBurst = [
      win('m1', 'tpl-a', T0),
      win('m2', 'tpl-b', T0 + 3 * DAY),
      win('m3', 'tpl-c', T0 + 3 * DAY + 10 * 60_000),
      win('m4', 'tpl-d', T0 + 3 * DAY + 20 * 60_000),
      win('m5', 'tpl-e', T0 + 3 * DAY + 30 * 60_000),
      win('m6', 'tpl-f', T0 + 6 * DAY),
    ]
    const spaced = [
      win('s1', 'tpl-a', T0),
      win('s2', 'tpl-b', T0 + 3 * DAY),
      win('s3', 'tpl-c', T0 + 3 * DAY + 2.1 * DAY),
      win('s4', 'tpl-d', T0 + 3 * DAY + 4.2 * DAY),
      win('s5', 'tpl-e', T0 + 3 * DAY + 6.3 * DAY),
      // Land the final win at the same day-6-relative rung... keep distinct.
      win('s6', 'tpl-f', T0 + 3 * DAY + 8.4 * DAY),
    ]
    const evMassed = evidenceFor(deriveEvidence(massedBurst, T0 + 20 * DAY), SKILL)
    const evSpaced = evidenceFor(deriveEvidence(spaced, T0 + 20 * DAY), SKILL)
    // The spaced learner accumulated spaced retrievals; the massed learner's
    // burst counted at most once. Their stability inputs must now differ,
    // which shows up as a longer scheduled interval for the spaced learner.
    const massedInterval = evMassed.review!.due - massedBurst[massedBurst.length - 1].t
    const spacedInterval = evSpaced.review!.due - spaced[spaced.length - 1].t
    expect(spacedInterval).toBeGreaterThan(massedInterval)
  })
})
