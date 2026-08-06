import { describe, expect, it } from 'vitest'
import { aggregateParts, type PartOutcome } from './activity'
import { deriveEvidence, evidenceFor } from './mastery'
import type { AttemptEvent } from '../domain/types'

const graded = (firstCorrect: boolean, eventualOk = firstCorrect, score = eventualOk ? 1 : 0): PartOutcome => ({
  firstCorrect,
  eventualOk,
  score,
  graded: true,
})
const draftPart = (): PartOutcome => ({ firstCorrect: null, eventualOk: null, score: 0, graded: false })

describe('multi-part activity aggregation', () => {
  it('clean run is independent evidence', () => {
    const a = aggregateParts([graded(true), graded(true), graded(true)], 0)
    expect(a.firstCorrect).toBe(true)
    expect(a.correct).toBe(true)
    expect(a.score).toBe(1)
    expect(a.gradedCount).toBe(3)
  })

  it('a repaired checkpoint is GUIDED evidence, never independent', () => {
    // Missed one part, corrected it. Eventually right, but not unaided.
    const a = aggregateParts([graded(true), graded(false, true, 1), graded(true)], 0)
    expect(a.firstCorrect).toBe(false)
    expect(a.correct).toBe(true)
  })

  it('an unrepaired checkpoint fails the activity outright', () => {
    const a = aggregateParts([graded(true), graded(false, false, 0)], 0)
    expect(a.firstCorrect).toBe(false)
    expect(a.correct).toBe(false)
  })

  it('a hint anywhere disqualifies independent evidence', () => {
    const a = aggregateParts([graded(true), graded(true)], 1)
    expect(a.firstCorrect).toBe(false)
    expect(a.correct).toBe(true) // still eventually correct
  })

  it('drafts contribute nothing in either direction', () => {
    const withDraft = aggregateParts([draftPart(), graded(true)], 0)
    const without = aggregateParts([graded(true)], 0)
    expect(withDraft.firstCorrect).toBe(without.firstCorrect)
    expect(withDraft.correct).toBe(without.correct)
    expect(withDraft.score).toBe(without.score)
    expect(withDraft.gradedCount).toBe(1)
  })

  it('a draft cannot rescue a failed checkpoint', () => {
    const a = aggregateParts([draftPart(), graded(false, false, 0)], 0)
    expect(a.correct).toBe(false)
    expect(a.firstCorrect).toBe(false)
    expect(a.score).toBe(0)
  })

  it('an all-draft activity yields no verdict at all', () => {
    const a = aggregateParts([draftPart(), draftPart()], 0)
    expect(a.correct).toBeNull()
    expect(a.firstCorrect).toBeNull()
    expect(a.gradedCount).toBe(0)
  })
})

/**
 * The reason the aggregation rules matter: they decide what reaches the
 * mastery replay. These assert the end-to-end consequence.
 */
describe('repaired multi-part work cannot fake independence', () => {
  const T0 = Date.parse('2026-06-01T16:00:00Z')
  let n = 0
  const eventFrom = (agg: ReturnType<typeof aggregateParts>, over: Partial<AttemptEvent> = {}): AttemptEvent => {
    n++
    return {
      id: `e${n}`,
      t: T0 + n * 60_000,
      sessionId: 's1',
      templateId: `tpl-${n}`,
      itemVersion: 1,
      seed: n,
      skillIds: ['sk1'],
      bucket: 'meta',
      mode: 'independent',
      firstResponse: 'x',
      finalResponse: 'parts',
      correct: agg.correct,
      firstCorrect: agg.firstCorrect,
      score: agg.score,
      validator: 'multi',
      hintLevel: 0,
      confidence: null,
      elapsedSec: 120,
      errorTags: [],
      difficulty: 3,
      ...over,
    }
  }

  it('two repaired activities do NOT reach independent', () => {
    const repaired = aggregateParts([graded(true), graded(false, true, 1)], 0)
    const events = [eventFrom(repaired), eventFrom(repaired)]
    const ev = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(ev.state).toBe('guided')
    expect(ev.independentForms).toEqual([])
    expect(ev.guidedSuccesses).toBe(2)
  })

  it('two clean activities DO reach independent', () => {
    const clean = aggregateParts([graded(true), graded(true)], 0)
    const events = [eventFrom(clean), eventFrom(clean)]
    const ev = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(ev.state).toBe('independent')
    expect(ev.independentForms.length).toBe(2)
  })

  it('a corrected activity earns guided credit rather than counting as a miss', () => {
    // Before per-part repair existed, a wrong checkpoint could only ever end
    // as a flat miss. A learner who repairs it should not be punished as if
    // they had walked away from the error.
    const repaired = aggregateParts([graded(false, true, 1)], 0)
    const ev = evidenceFor(deriveEvidence([eventFrom(repaired)], T0 + 60_000), 'sk1')
    expect(ev.guidedSuccesses).toBe(1)
    expect(ev.recentMisses).toBe(0)
    expect(ev.state).toBe('guided')
  })

  it('an abandoned error still counts as a miss', () => {
    const abandoned = aggregateParts([graded(false, false, 0)], 0)
    const ev = evidenceFor(deriveEvidence([eventFrom(abandoned)], T0 + 60_000), 'sk1')
    expect(ev.recentMisses).toBe(1)
    expect(ev.guidedSuccesses).toBe(0)
  })
})
