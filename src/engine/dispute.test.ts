/**
 * A contested grade must not be able to hurt you while it is contested.
 *
 * The claim under test is the whole point of the feature: raising a dispute
 * takes the attempt out of every derived number IMMEDIATELY, before anyone
 * decides who was right. Leaving it counted until resolution would mean the
 * disputed evidence does its damage during exactly the window when its
 * validity is in doubt.
 */
import { describe, expect, it } from 'vitest'
import type { AttemptEvent, DisputeEvent, DisputeOutcome } from '../domain/types'
import { initialState, type AppState } from '../domain/types'
import { deriveEvidence, evidenceFor, stateRank } from './mastery'
import { stretchSignal } from './stretch'
import { buildSessionPlan } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { targetDifficulty } from './planner'
import {
  SUPPRESS_AFTER_UNRESOLVED,
  disputeStatuses,
  evidenceEvents,
  openDisputes,
  quarantinedAttemptIds,
  suppressedTemplateIds,
} from './dispute'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 2, 1, 9)
const SKILL = 'm-fractions'

function attempt(id: string, templateId: string, t: number, ok: boolean): AttemptEvent {
  return {
    id,
    t,
    sessionId: 's',
    templateId,
    itemVersion: 1,
    seed: 0,
    skillIds: [SKILL],
    bucket: 'math',
    mode: 'independent',
    correct: ok,
    firstCorrect: ok,
    score: ok ? 1 : 0,
    hintLevel: 0,
    seconds: 60,
    validator: 'numeric',
    response: '1',
    difficulty: 3,
  } as unknown as AttemptEvent
}

const raise = (attemptId: string, templateId: string, t: number): DisputeEvent => ({
  id: `d-${attemptId}`,
  t,
  kind: 'raised',
  attemptId,
  templateId,
  itemVersion: 1,
  seed: 0,
  note: 'graded wrong',
})

const settle = (attemptId: string, templateId: string, t: number, outcome: DisputeOutcome): DisputeEvent => ({
  id: `r-${attemptId}-${outcome}`,
  t,
  kind: 'resolved',
  attemptId,
  templateId,
  outcome,
  note: '',
})

/** Four clean wins, then one contested loss. */
const wins = ['w1', 'w2', 'w3', 'w4'].map((id, i) => attempt(id, `tpl-${i}`, T0 + i * 3 * DAY, true))
const loss = attempt('bad', 'tpl-9', T0 + 20 * DAY, false)
const events = [...wins, loss]
const NOW = T0 + 21 * DAY

describe('a disputed attempt is quarantined the moment it is raised', () => {
  it('CONTROL: undisputed, the loss really does damage — so the test can fail', () => {
    const before = evidenceFor(deriveEvidence(wins, NOW), SKILL)
    const after = evidenceFor(deriveEvidence(events, NOW), SKILL)
    expect(after.recentMisses).toBeGreaterThan(0)
    expect(after.recentMisses).toBeGreaterThan(before.recentMisses)
  })

  it('cannot lower a mastery estimate', () => {
    const disputes = [raise('bad', 'tpl-9', NOW)]
    const clean = evidenceFor(deriveEvidence(wins, NOW), SKILL)
    const disputed = evidenceFor(deriveEvidence(evidenceEvents(events, disputes), NOW), SKILL)
    expect(disputed.recentMisses).toBe(0)
    expect(stateRank(disputed.state)).toBe(stateRank(clean.state))
    expect(disputed.ability).toBe(clean.ability)
  })

  it('cannot trigger a difficulty step-down', () => {
    const disputes = [raise('bad', 'tpl-9', NOW)]
    const clean = evidenceFor(deriveEvidence(wins, NOW), SKILL)
    const disputed = evidenceFor(deriveEvidence(evidenceEvents(events, disputes), NOW), SKILL)
    const counted = evidenceFor(deriveEvidence(events, NOW), SKILL)
    // The undisputed loss really does pull the target down…
    expect(targetDifficulty(counted, 'ok', false)).toBeLessThan(targetDifficulty(clean, 'ok', false))
    // …and the disputed one leaves it exactly where it was.
    expect(targetDifficulty(disputed, 'ok', false)).toBe(targetDifficulty(clean, 'ok', false))
  })

  it('cannot move the stretch signal', () => {
    const disputes = [raise('bad', 'tpl-9', NOW)]
    expect(stretchSignal(evidenceEvents(events, disputes), NOW)).toEqual(stretchSignal(wins, NOW))
  })

  it('is out before anyone decides, not after', () => {
    // No resolution event exists at all here. That is the case that matters:
    // quarantine cannot depend on the learner getting round to adjudicating.
    const disputes = [raise('bad', 'tpl-9', NOW)]
    expect(disputeStatuses(disputes).get('bad')).toBe('open')
    expect(quarantinedAttemptIds(disputes).has('bad')).toBe(true)
  })
})

describe('resolving decides whether it comes back', () => {
  const cases: [DisputeOutcome, boolean][] = [
    ['my-error', true],
    ['item-bug', false],
    ['wrong-skill', false],
  ]
  for (const [outcome, restored] of cases) {
    it(`${outcome} ${restored ? 'restores' : 'keeps out'} the attempt`, () => {
      const disputes = [raise('bad', 'tpl-9', NOW), settle('bad', 'tpl-9', NOW + DAY, outcome)]
      const usable = evidenceEvents(events, disputes)
      expect(usable.some((e) => e.id === 'bad')).toBe(restored)
    })
  }

  it('admitting your own error counts the attempt even though it hurts', () => {
    // The honest outcome, and the one a badge-clearing design would quietly
    // avoid: saying "I misread" puts the miss back on the record.
    const disputes = [raise('bad', 'tpl-9', NOW), settle('bad', 'tpl-9', NOW + DAY, 'my-error')]
    const ev = evidenceFor(deriveEvidence(evidenceEvents(events, disputes), NOW + 2 * DAY), SKILL)
    expect(ev.recentMisses).toBeGreaterThan(0)
  })

  it('the raise record survives resolution, so the history stays readable', () => {
    const disputes = [raise('bad', 'tpl-9', NOW), settle('bad', 'tpl-9', NOW + DAY, 'my-error')]
    expect(disputes.filter((d) => d.kind === 'raised')).toHaveLength(1)
    expect(openDisputes(disputes)).toHaveLength(0)
  })
})

describe('items that keep being contested stop being served', () => {
  it(`suppresses after ${SUPPRESS_AFTER_UNRESOLVED} unresolved disputes`, () => {
    const one = [raise('a1', 'tpl-x', T0)]
    expect(suppressedTemplateIds(one).has('tpl-x')).toBe(false)
    const two = [...one, raise('a2', 'tpl-x', T0 + DAY)]
    expect(suppressedTemplateIds(two).has('tpl-x')).toBe(true)
  })

  it('a confirmed item bug suppresses on the first one', () => {
    const d = [raise('a1', 'tpl-y', T0), settle('a1', 'tpl-y', T0 + DAY, 'item-bug')]
    expect(suppressedTemplateIds(d).has('tpl-y')).toBe(true)
  })

  it('does not suppress an item the learner cleared as their own error', () => {
    const d = [
      raise('a1', 'tpl-z', T0),
      settle('a1', 'tpl-z', T0 + DAY, 'my-error'),
      raise('a2', 'tpl-z', T0 + 2 * DAY),
      settle('a2', 'tpl-z', T0 + 3 * DAY, 'my-error'),
    ]
    expect(suppressedTemplateIds(d).has('tpl-z')).toBe(false)
  })
})

describe('the quarantine filter is inert when nothing is disputed', () => {
  it('returns the original array', () => {
    const s = initialState()
    expect(evidenceEvents(events, s.disputes)).toBe(events)
  })
})

describe('suppression reaches the real planner, not just the helper', () => {
  it('a repeatedly contested template stops being planned', () => {
    // The helper being right is not the claim; the claim is that the SESSION
    // stops containing it. Picking a template the planner actually serves,
    // then contesting it twice.
    const base: AppState = { ...initialState(), onboarded: true }
    const plan = () =>
      buildSessionPlan({
        index: DEFAULT_INDEX,
        evidence: deriveEvidence(base.events, NOW),
        state: base,
        now: NOW,
        checkIn: { minutes: 45, energy: 'ok', focus: null },
      })
    const served = plan().blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    expect(served.length).toBeGreaterThan(0)
    const victim = served[0]

    const contested: AppState = {
      ...base,
      disputes: [raise('x1', victim, T0), raise('x2', victim, T0 + DAY)],
    }
    const after = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence(contested.events, NOW),
      state: contested,
      now: NOW,
      checkIn: { minutes: 45, energy: 'ok', focus: null },
    })
    const servedAfter = after.blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    expect(servedAfter).not.toContain(victim)
    // …and the session is still a session, not an empty plan.
    expect(servedAfter.length).toBeGreaterThan(0)
  })
})
