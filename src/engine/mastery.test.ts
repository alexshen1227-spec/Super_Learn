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
    templateId: `tpl-${counter}`,
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

    const sameForm = [ev({ seed: 7, templateId: 'same' }), ev({ seed: 7, templateId: 'same' })]
    expect(deriveEvidence(sameForm, T0 + DAY).get('sk1')!.state).toBe('guided') // same form twice ≠ independent

    // A FAMILY is the unit of independence, not a variant. Two randomisations
    // of one generator are the same question with different numbers; they used
    // to satisfy the rung, which was the most generous thing in the ladder.
    const twoVariantsOneFamily = [ev({ seed: 1, templateId: 'fam' }), ev({ seed: 2, templateId: 'fam' })]
    expect(deriveEvidence(twoVariantsOneFamily, T0 + 0.5 * DAY).get('sk1')!.state).toBe('guided')

    const twoForms = [ev({ seed: 1, templateId: 'fam-1' }), ev({ seed: 2, templateId: 'fam-2' })]
    expect(deriveEvidence(twoForms, T0 + 0.5 * DAY).get('sk1')!.state).toBe('independent')
  })

  it('the four Paths need a third question family before Independent', () => {
    // Judgment skills are the easiest to fake by recognising a question shape,
    // so observation/logic/strategy/influence-defence carry a stricter rung.
    const two = (bucket: 'math' | 'observer') => [
      ev({ seed: 1, templateId: 'p-1', bucket }),
      ev({ seed: 2, templateId: 'p-2', bucket }),
    ]
    expect(deriveEvidence(two('math'), T0 + DAY).get('sk1')!.state).toBe('independent')
    expect(deriveEvidence(two('observer'), T0 + DAY).get('sk1')!.state).toBe('guided')

    const three = [...two('observer'), ev({ seed: 3, templateId: 'p-3', bucket: 'observer' })]
    expect(deriveEvidence(three, T0 + DAY).get('sk1')!.state).toBe('independent')
  })

  it('hinted success never counts as independent evidence', () => {
    const events = [ev({ seed: 1 }), ev({ seed: 2, hintLevel: 1 }), ev({ seed: 3, hintLevel: 3 })]
    const e = deriveEvidence(events, T0 + DAY).get('sk1')!
    expect(e.independentForms.length).toBe(1)
    expect(e.guidedSuccesses).toBe(2)
  })

  it('retained requires a ≥48h gap after independence', () => {
    // Timestamps are pinned: the shared `ev` counter drives `t` by default, so
    // adding a test elsewhere in this file would otherwise move these events
    // and quietly change what the gap is measured from.
    const events = [
      ev({ seed: 1, t: T0 + 1 * 60_000, templateId: 'r-1' }),
      ev({ seed: 2, t: T0 + 2 * 60_000, templateId: 'r-2' }),
      ev({ seed: 3, t: T0 + 10 * 60_000, templateId: 'r-3' }), // too soon
    ]
    expect(deriveEvidence(events, T0 + DAY).get('sk1')!.state).toBe('independent')

    const withGap = [...events, ev({ seed: 4, t: T0 + RETENTION_GAP_MS + 20 * 60_000, mode: 'review' })]
    const e = deriveEvidence(withGap, T0 + 3 * DAY).get('sk1')!
    expect(e.state).toBe('retained')
    expect(e.retainedAt).not.toBeNull()
  })

  it('transfer needs distance on two dimensions, not just a new question form', () => {
    // Times pinned: the shared `ev` counter drives `t` by default, so events
    // added elsewhere in this file would otherwise reorder these.
    const upTo = [
      ev({ seed: 1, t: T0 + 1_000, templateId: 'x-1' }),
      ev({ seed: 2, t: T0 + 2_000, templateId: 'x-2' }),
      ev({ seed: 5, t: T0 + RETENTION_GAP_MS + 60_000, mode: 'review', templateId: 'x-1' }),
    ]
    // Novel family, but same subject, same format, moments after the last
    // success. One dial — near transfer, and it does not earn the rung.
    const nearOnly = [...upTo, ev({ seed: 9, t: T0 + RETENTION_GAP_MS + 2 * 60_000 + 1, mode: 'transfer', templateId: 'tpl-b' })]
    expect(deriveEvidence(nearOnly, T0 + 5 * DAY).get('sk1')!.state).toBe('retained')

    // Same attempt, but the item also sits in another subject.
    const withDistance = [...upTo, ev({ seed: 9, t: T0 + RETENTION_GAP_MS + 2 * 60_000 + 1, mode: 'transfer', templateId: 'tpl-b', bucket: 'science' })]
    expect(deriveEvidence(withDistance, T0 + 5 * DAY).get('sk1')!.state).toBe('transferred')
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

/**
 * Transfer is the app's strongest claim, so it is the one most worth pinning
 * down. It used to fire on ANY success in transfer mode, which meant an
 * authoring flag decided the top rung. Novelty is now measured against the
 * learner's own history.
 */
describe('transferred is measured, not declared', () => {
  // Independence now needs two distinct FAMILIES, not two variants of one.
  const independent = () => [ev({ seed: 1, templateId: 'fam-a' }), ev({ seed: 2, templateId: 'fam-a2' })]

  it('a transfer attempt on an ALREADY PRACTICED family does not count', () => {
    const events = [...independent(), ev({ seed: 3, templateId: 'fam-a', mode: 'transfer' })]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).toBeNull()
    expect(state.state).toBe('independent')
  })

  /**
   * A novel family ALONE is near transfer — same subject, same answer format,
   * same sitting, only the surface changed. Barnett & Ceci put transfer
   * distance on nine dimensions; moving one and calling it "Transferred" was
   * the overclaim this rule now closes. See RESEARCH.md §21.
   */
  it('a novel family ALONE is not enough — that is near transfer', () => {
    const events = [...independent(), ev({ seed: 3, templateId: 'fam-b', mode: 'transfer' })]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).toBeNull()
    expect(state.state).toBe('independent')
  })

  it('a novel family in a DIFFERENT SUBJECT counts', () => {
    const events = [
      ...independent(),
      ev({ seed: 3, templateId: 'fam-b', mode: 'transfer', bucket: 'investigator' }),
    ]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).not.toBeNull()
    expect(state.state).toBe('transferred')
    expect(state.transferCrossed).toContain('a different subject')
  })

  it('a novel family in a DIFFERENT ANSWER FORMAT counts', () => {
    const events = [
      ...independent(),
      ev({ seed: 3, templateId: 'fam-b', mode: 'transfer', validator: 'mcq' }),
    ]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).not.toBeNull()
    expect(state.transferCrossed).toContain('a different answer format')
  })

  it('a novel family AFTER A DELAY counts', () => {
    const events = [
      ev({ seed: 1, templateId: 'd-a', t: T0 + 1_000 }),
      ev({ seed: 2, templateId: 'd-b', t: T0 + 2_000 }),
      ev({ seed: 3, templateId: 'd-c', mode: 'transfer', t: T0 + RETENTION_GAP_MS + 60_000 }),
    ]
    const state = evidenceFor(deriveEvidence(events, T0 + 5 * DAY), 'sk1')
    expect(state.transferredAt).not.toBeNull()
    expect(state.transferCrossed).toContain('after a delay')
  })

  it('reports which dimensions the qualifying attempt actually crossed', () => {
    const events = [
      ...independent(),
      ev({ seed: 3, templateId: 'fam-b', mode: 'transfer', bucket: 'investigator', validator: 'mcq' }),
    ]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    // Never claims physical, functional or social context — unobservable here.
    expect(state.transferCrossed!.length).toBeGreaterThanOrEqual(3)
    expect(state.transferCrossed!.join(' ')).not.toMatch(/physical|social|purpose/i)
  })

  it('transfer still requires independence first', () => {
    // One novel-family transfer success, but the skill was never independent.
    const events = [ev({ seed: 1, templateId: 'fam-b', mode: 'transfer' })]
    const state = evidenceFor(deriveEvidence(events, T0 + 60_000), 'sk1')
    expect(state.transferredAt).toBeNull()
  })

  it('a hinted transfer on a novel family does not count', () => {
    const events = [...independent(), ev({ seed: 3, templateId: 'fam-b', mode: 'transfer', hintLevel: 2 })]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).toBeNull()
  })

  it('placement exposure does not make a family look already-practiced', () => {
    // Placement routes; it must not burn a family's novelty for transfer.
    const events = [
      ev({ seed: 9, templateId: 'fam-b', mode: 'placement' }),
      ...independent(),
      ev({ seed: 3, templateId: 'fam-b', mode: 'transfer', bucket: 'investigator' }),
    ]
    const state = evidenceFor(deriveEvidence(events, T0 + 10 * 60_000), 'sk1')
    expect(state.transferredAt).not.toBeNull()
  })
})

/**
 * The no-self-grading law, enforced at the point it actually matters: replay.
 * Written work is exposure. It must never promote, never demote, and never
 * touch the review schedule.
 */
describe('ungraded work produces no evidence', () => {
  const ungraded = (over: Partial<AttemptEvent> = {}) =>
    ev({ correct: null, firstCorrect: null, score: null, validator: 'draft', ...over })

  it('a perfect-looking ungraded event cannot advance a skill', () => {
    // Score 1 would once have counted as a first unaided success. Not any more.
    const events = [ungraded({ seed: 1, score: 1 }), ungraded({ seed: 2, score: 1 })]
    const state = evidenceFor(deriveEvidence(events, T0), 'sk1')
    expect(state.state).toBe('introduced') // exposure only
    expect(state.independentForms).toEqual([])
    expect(state.review).toBeNull()
  })

  it('ungraded work is not counted as a miss either', () => {
    const events = [ungraded({ seed: 1 }), ungraded({ seed: 2 }), ungraded({ seed: 3 })]
    const state = evidenceFor(deriveEvidence(events, T0), 'sk1')
    expect(state.recentMisses).toBe(0)
    expect(state.needsReview).toBe(false)
    expect(state.exposure).toBe(3)
  })

  it('ungraded work never disturbs an earned rung or its review date', () => {
    const graded = [ev({ seed: 1 }), ev({ seed: 2 })]
    const before = evidenceFor(deriveEvidence(graded, T0), 'sk1')
    expect(before.state).toBe('independent')

    const withDrafts = [...graded, ungraded({ seed: 3, score: 0 }), ungraded({ seed: 4, score: 1 })]
    const after = evidenceFor(deriveEvidence(withDrafts, T0), 'sk1')
    expect(after.state).toBe('independent')
    expect(after.review!.due).toBe(before.review!.due)
    expect(after.independentForms).toEqual(before.independentForms)
  })
})

describe('long append-only histories', () => {
  it('extends cached evidence without double-applying the old prefix', () => {
    const first = ev({ templateId: 'incremental-a' })
    const base = [first]
    expect(evidenceFor(deriveEvidence(base, T0 + DAY), 'sk1').attempts).toBe(1)

    const extended = [...base, ev({ templateId: 'incremental-b' })]
    const after = evidenceFor(deriveEvidence(extended, T0 + DAY), 'sk1')
    expect(after.attempts).toBe(2)
    expect(after.independentForms).toEqual(['incremental-a', 'incremental-b'])
    expect(evidenceFor(deriveEvidence(extended, T0 + DAY), 'sk1').attempts).toBe(2)
  })
})
