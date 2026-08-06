import { describe, expect, it } from 'vitest'
import { deriveEvidence, evidenceFor, RETENTION_GAP_MS } from './mastery'
import { dueReviews, nextReviewAt } from './scheduler'
import type { AttemptEvent } from '../domain/types'

const DAY = 86_400_000
const T0 = Date.parse('2026-06-01T16:00:00Z')

let counter = 0
function ev(over: Partial<AttemptEvent>): AttemptEvent {
  counter++
  return {
    id: `e${counter}`,
    t: T0 + counter * 60_000,
    sessionId: 's1',
    templateId: 'tpl-a',
    itemVersion: 1,
    seed: counter,
    skillIds: ['sk1'],
    bucket: 'math',
    mode: 'independent',
    firstResponse: 'x',
    finalResponse: 'x',
    correct: true,
    firstCorrect: true,
    score: null,
    validator: 'numeric',
    hintLevel: 0,
    confidence: null,
    elapsedSec: 60,
    errorTags: [],
    difficulty: 2,
    ...over,
  }
}

describe('evidence ladder', () => {
  it('unseen → introduced → guided → independent', () => {
    expect(evidenceFor(deriveEvidence([], T0), 'sk1').state).toBe('unseen')

    const failed = [ev({ correct: false, firstCorrect: false })]
    expect(deriveEvidence(failed, T0 + DAY).get('sk1')!.state).toBe('introduced')

    const hinted = [ev({ hintLevel: 2, correct: true, firstCorrect: false })]
    expect(deriveEvidence(hinted, T0 + DAY).get('sk1')!.state).toBe('guided')

    const oneSuccess = [ev({})]
    expect(deriveEvidence(oneSuccess, T0 + DAY).get('sk1')!.state).toBe('guided')

    const sameForm = [ev({ seed: 7 }), ev({ seed: 7 })]
    expect(deriveEvidence(sameForm, T0 + DAY).get('sk1')!.state).toBe('guided') // same form twice ≠ independent

    const twoForms = [ev({ seed: 1 }), ev({ seed: 2 })]
    expect(deriveEvidence(twoForms, T0 + 0.5 * DAY).get('sk1')!.state).toBe('independent')
  })

  it('hinted success never counts as independent evidence', () => {
    const events = [ev({ seed: 1 }), ev({ seed: 2, hintLevel: 1 }), ev({ seed: 3, hintLevel: 3 })]
    const e = deriveEvidence(events, T0 + DAY).get('sk1')!
    expect(e.independentForms.length).toBe(1)
    expect(e.guidedSuccesses).toBe(2)
  })

  it('retained requires a ≥48h gap after independence', () => {
    const events = [
      ev({ seed: 1 }),
      ev({ seed: 2 }),
      ev({ seed: 3, t: T0 + 10 * 60_000 }), // too soon
    ]
    expect(deriveEvidence(events, T0 + DAY).get('sk1')!.state).toBe('independent')

    const withGap = [...events, ev({ seed: 4, t: T0 + RETENTION_GAP_MS + 20 * 60_000, mode: 'review' })]
    const e = deriveEvidence(withGap, T0 + 3 * DAY).get('sk1')!
    expect(e.state).toBe('retained')
    expect(e.retainedAt).not.toBeNull()
  })

  it('transfer success after independence marks transferred', () => {
    const events = [
      ev({ seed: 1 }),
      ev({ seed: 2 }),
      ev({ seed: 5, t: T0 + RETENTION_GAP_MS + 60_000, mode: 'review' }),
      ev({ seed: 9, t: T0 + RETENTION_GAP_MS + 2 * 60_000 + 1, mode: 'transfer', templateId: 'tpl-b' }),
    ]
    expect(deriveEvidence(events, T0 + 5 * DAY).get('sk1')!.state).toBe('transferred')
  })

  it('a high-confidence miss blocks independent until repaired, keeping bestState visible', () => {
    const events = [
      ev({ seed: 1 }),
      ev({ seed: 2 }),
      ev({ seed: 3, correct: false, firstCorrect: false, confidence: 90 }),
    ]
    const blocked = deriveEvidence(events, T0 + DAY).get('sk1')!
    expect(blocked.blockedByMisconception).toBe(true)
    expect(blocked.state).toBe('guided')
    expect(blocked.bestState).toBe('independent')
    expect(blocked.needsReview).toBe(true)

    const repaired = [...events, ev({ seed: 4 })]
    const e = deriveEvidence(repaired, T0 + DAY).get('sk1')!
    expect(e.blockedByMisconception).toBe(false)
    expect(e.state).toBe('independent')
  })

  it('placement counts once and never schedules review', () => {
    const events = [ev({ mode: 'placement', seed: 1 }), ev({ mode: 'placement', seed: 2 })]
    const e = deriveEvidence(events, T0 + DAY).get('sk1')!
    expect(e.independentForms).toEqual(['placement'])
    expect(e.state).toBe('guided')
    expect(e.review).toBeNull()
  })
})

describe('review scheduling', () => {
  it('climbs the ladder on success and drops on failure', () => {
    const one = [ev({ seed: 1 })]
    const e1 = deriveEvidence(one, T0).get('sk1')!
    expect(e1.review!.due).toBe(one[0].t + 1 * DAY)

    const two = [ev({ seed: 1 }), ev({ seed: 2 })]
    const e2 = deriveEvidence(two, T0).get('sk1')!
    expect(e2.review!.due).toBe(two[1].t + 3 * DAY)

    const miss = [...two, ev({ seed: 3, correct: false, firstCorrect: false })]
    const e3 = deriveEvidence(miss, T0).get('sk1')!
    expect(e3.review!.due).toBe(miss[2].t + 1 * DAY) // reset short

    const confidentMiss = [...two, ev({ seed: 3, correct: false, firstCorrect: false, confidence: 95 })]
    const e4 = deriveEvidence(confidentMiss, T0).get('sk1')!
    expect(e4.review!.due).toBe(confidentMiss[2].t + 0.5 * DAY) // sooner
  })

  it('dueReviews surfaces independent skills past due, misconceptions first', () => {
    const skillA = [ev({ seed: 1 }), ev({ seed: 2 })] // independent, due in 3d
    const skillB = [
      ev({ skillIds: ['sk2'], seed: 1 }),
      ev({ skillIds: ['sk2'], seed: 2 }),
      ev({ skillIds: ['sk2'], seed: 3, correct: false, firstCorrect: false, confidence: 90 }),
    ]
    const all = [...skillA, ...skillB]
    const now = T0 + 10 * DAY
    const evidence = deriveEvidence(all, now)
    const due = dueReviews(evidence, now)
    expect(due.length).toBe(2)
    expect(due[0].skillId).toBe('sk2')
    expect(due[0].reason).toBe('misconception')
    expect(due[1].skillId).toBe('sk1')
    expect(due[1].reason).toBe('interval')
  })

  it('nextReviewAt reports the soonest future due', () => {
    const events = [ev({ seed: 1 }), ev({ seed: 2 })]
    const evd = deriveEvidence(events, T0 + 60 * 60_000)
    const next = nextReviewAt(evd, T0 + 60 * 60_000)
    expect(next).toBe(events[1].t + 3 * DAY)
  })

  it('replaying after deleting events recomputes honestly', () => {
    const events = [ev({ seed: 1 }), ev({ seed: 2 })]
    expect(deriveEvidence(events, T0).get('sk1')!.state).toBe('independent')
    expect(deriveEvidence(events.slice(0, 1), T0).get('sk1')!.state).toBe('guided')
    expect(deriveEvidence([], T0).get('sk1')).toBeUndefined()
  })
})
