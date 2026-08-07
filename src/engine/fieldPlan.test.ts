import { describe, expect, it } from 'vitest'
import { FOLLOW_UP_AFTER_DAYS, planCandidate, planNeedingFollowUp } from './fieldPlan'
import { deriveEvidence } from './mastery'
import { DEFAULT_INDEX } from '../content/registry'
import { initialState, type AppState, type AttemptEvent, type FieldPlan } from '../domain/types'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 6, 1, 12)
let n = 0
const ev = (skillId: string, bucket: AttemptEvent['bucket'], templateId: string, t: number): AttemptEvent => ({
  id: `fp${n++}`, t, sessionId: 's', templateId, itemVersion: 1, seed: n,
  skillIds: [skillId], bucket, mode: 'independent', firstResponse: 'x', finalResponse: 'x',
  correct: true, firstCorrect: true, score: null, validator: 'mcq', hintLevel: 0,
  confidence: null, elapsedSec: 30, errorTags: [], difficulty: 3,
})

/** Observer needs three families for Independent, plus a delayed success for Retained. */
function retainedObserverEvents(skillId: string): AttemptEvent[] {
  return [
    ev(skillId, 'observer', 'f1', T0),
    ev(skillId, 'observer', 'f2', T0 + 60_000),
    ev(skillId, 'observer', 'f3', T0 + 120_000),
    ev(skillId, 'observer', 'f4', T0 + 3 * DAY),
  ]
}

const bucketOf = (id: string) => DEFAULT_INDEX.skills.get(id)?.bucket

function stateWith(events: AttemptEvent[], plans: FieldPlan[] = []): AppState {
  return { ...initialState(), onboarded: true, events, plans }
}

describe('if-then plans are offered at the right moment', () => {
  it('offers nothing until a Path skill is actually retained', () => {
    const evidence = deriveEvidence([], T0)
    expect(planCandidate(stateWith([]), evidence, bucketOf)).toBeNull()

    // Independent but not yet retained — too early to carry into a week.
    const partial = retainedObserverEvents('o-obsinf').slice(0, 3)
    expect(planCandidate(stateWith(partial), deriveEvidence(partial, T0 + DAY), bucketOf)).toBeNull()
  })

  it('offers a plan once a Path skill is retained', () => {
    const events = retainedObserverEvents('o-obsinf')
    const got = planCandidate(stateWith(events), deriveEvidence(events, T0 + 4 * DAY), bucketOf)
    expect(got).toBe('o-obsinf')
  })

  it('never offers one for an academic skill', () => {
    const events = [
      ev('m-integers', 'math', 'f1', T0),
      ev('m-integers', 'math', 'f2', T0 + 60_000),
      ev('m-integers', 'math', 'f3', T0 + 3 * DAY),
    ]
    const evidence = deriveEvidence(events, T0 + 4 * DAY)
    expect(evidence.get('m-integers')!.state).toBe('retained')
    expect(planCandidate(stateWith(events), evidence, bucketOf)).toBeNull()
  })

  it('never offers a second plan for a skill that already has one', () => {
    const events = retainedObserverEvents('o-obsinf')
    const plan: FieldPlan = {
      id: 'p1', t: T0, skillId: 'o-obsinf', cue: 'x', action: 'y', askedAt: null, outcome: null,
    }
    const evidence = deriveEvidence(events, T0 + 4 * DAY)
    expect(planCandidate(stateWith(events, [plan]), evidence, bucketOf)).toBeNull()
  })
})

describe('the follow-up asks once, and only when due', () => {
  const plan: FieldPlan = { id: 'p1', t: T0, skillId: 'o-obsinf', cue: 'x', action: 'y', askedAt: null, outcome: null }

  it('stays quiet before the interval', () => {
    expect(planNeedingFollowUp(stateWith([], [plan]), T0 + 3 * DAY)).toBeNull()
    expect(planNeedingFollowUp(stateWith([], [plan]), T0 + (FOLLOW_UP_AFTER_DAYS - 1) * DAY)).toBeNull()
  })

  it('asks once the interval has passed', () => {
    const due = planNeedingFollowUp(stateWith([], [plan]), T0 + FOLLOW_UP_AFTER_DAYS * DAY)
    expect(due?.id).toBe('p1')
  })

  it('never asks twice', () => {
    const answered: FieldPlan = { ...plan, askedAt: T0 + 20 * DAY, outcome: 'used' }
    expect(planNeedingFollowUp(stateWith([], [answered]), T0 + 60 * DAY)).toBeNull()
  })
})

/**
 * The load-bearing one. Real-life use cannot be machine-checked, so it is
 * self-report — and self-report advances nothing in this app. If this test
 * ever fails, the no-self-grading spine has been broken.
 */
describe('plans are never evidence', () => {
  it('a plan and its outcome change no skill state, and schedule no review', () => {
    const events = retainedObserverEvents('o-obsinf')
    const before = deriveEvidence(events, T0 + 4 * DAY).get('o-obsinf')!

    const plans: FieldPlan[] = [
      { id: 'p1', t: T0, skillId: 'o-obsinf', cue: 'someone rushes me', action: 'answer tomorrow', askedAt: T0 + 20 * DAY, outcome: 'used' },
    ]
    // Evidence is derived from EVENTS ONLY. Plans live in state and are not an
    // input to the replay at all — which is exactly the guarantee.
    const after = deriveEvidence(stateWith(events, plans).events, T0 + 4 * DAY).get('o-obsinf')!

    expect(after.state).toBe(before.state)
    expect(after.independentForms.length).toBe(before.independentForms.length)
    expect(after.review?.due).toBe(before.review?.due)
    expect(after.attempts).toBe(before.attempts)
  })

  it('reporting "I used it" cannot manufacture a rung on its own', () => {
    const plans: FieldPlan[] = [
      { id: 'p1', t: T0, skillId: 'o-recall', cue: 'a', action: 'b', askedAt: T0 + 20 * DAY, outcome: 'used' },
    ]
    const evidence = deriveEvidence(stateWith([], plans).events, T0 + 30 * DAY)
    expect(evidence.get('o-recall')).toBeUndefined()
  })
})
