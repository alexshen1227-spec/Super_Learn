/**
 * THE BUG THIS PINS DOWN — the frontier stopped moving for the learners doing
 * best.
 *
 * Two independent defects combined, and neither was visible in the code, the
 * UI, or any passing test:
 *
 * 1. `prereqLeverage` counted every unowned dependent of a skill, whether or
 *    not that skill was what stood in their way. Once a skill was owned its
 *    dependents were already unlocked — nothing was waiting on it — yet it kept
 *    the leverage bonus (capped at 2.5, the largest term after a due review)
 *    permanently. The root of the tree has the most dependents, so the root won
 *    every tie forever.
 *
 * 2. Three skills carried fewer question FAMILIES than their own promotion rule
 *    requires, counting only the families an ordinary daily block can serve.
 *    They could never reach Independent, so they never left the `guided`
 *    frontier, so they kept the frontier bonus permanently too.
 *
 * Measured over 365 simulated days at ~90% first-try accuracy, before the fix:
 * the learner touched **58 of 122 skills all year**, 34 reached Retained, the
 * core block landed on the same skill 215 times, and one question family was
 * served 611 times — about a fifth of every attempt they made.
 *
 * These tests are simulations rather than assertions-by-construction because
 * that is the only level at which the failure was visible: every individual
 * scoring decision was defensible and the aggregate was still broken.
 */
import { describe, expect, it } from 'vitest'
import { buildSessionPlan, prereqLeverage } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence, stateRank } from './mastery'
import { initialState, type AppState, type AttemptEvent, type SessionRecord } from '../domain/types'

const DAY = 86_400_000
const START = Date.UTC(2026, 0, 5, 16)

function simulate(days: number, acc: number, minutes = 30) {
  const base = initialState()
  const state: AppState = { ...base, onboarded: true, events: [], sessions: [] }
  let t = START
  const coreLabel = new Map<string, number>()
  const templateReps = new Map<string, number>()
  for (let d = 0; d < days; d++) {
    t += DAY
    const evidence = deriveEvidence(state.events, t)
    let plan
    try {
      plan = buildSessionPlan({
        index: DEFAULT_INDEX,
        evidence,
        state,
        now: t,
        checkIn: { minutes, energy: 'ok', focus: null },
      })
    } catch {
      continue
    }
    for (const block of plan.blocks) {
      if (block.kind === 'core') coreLabel.set(block.label, (coreLabel.get(block.label) ?? 0) + 1)
      for (const a of block.activities) {
        const tpl = DEFAULT_INDEX.templates.get(a.templateId)
        if (!tpl) continue
        templateReps.set(tpl.id, (templateReps.get(tpl.id) ?? 0) + 1)
        // Deterministic pass/fail so the test cannot flake on Math.random.
        const ok = (state.events.length % 10) / 10 < acc
        state.events.push({
          id: `e${state.events.length}`, t: t + state.events.length, sessionId: plan.id,
          templateId: tpl.id, itemVersion: tpl.version, seed: a.seed, skillIds: tpl.skillIds,
          bucket: tpl.bucket, mode: a.mode, firstResponse: 'x', finalResponse: 'x',
          correct: ok, firstCorrect: ok, score: null, validator: 'numeric', hintLevel: 0,
          confidence: null, elapsedSec: tpl.minutes * 60, errorTags: [], difficulty: tpl.difficulty,
        } as AttemptEvent)
      }
    }
    state.sessions.push({
      id: plan.id, startedAt: t, endedAt: t, activeMinutes: minutes,
      checkIn: { minutes, energy: 'ok', focus: null }, attempts: 0, correctFirst: 0,
      bucketMinutes: {}, learned: [], exitPrinciple: null, interrupted: false,
    } as SessionRecord)
  }
  const evidence = deriveEvidence(state.events, t + DAY)
  const attempts = state.events.length
  return {
    state,
    evidence,
    attempts,
    touched: evidence.size,
    owned: [...evidence.values()].filter((e) => stateRank(e.state) >= stateRank('independent')).length,
    worstCoreShare: Math.max(...coreLabel.values()) / days,
    worstTemplateShare: Math.max(...templateReps.values()) / attempts,
  }
}

describe('nothing is waiting on a door that is already open', () => {
  it('an owned skill claims no prerequisite leverage', () => {
    // Two unaided first-attempt successes on distinct families = Independent.
    const events: AttemptEvent[] = ['a', 'b'].map((k, i) => ({
      id: `x${i}`, t: START + i * 60_000, sessionId: 's', templateId: `int-${k}`, itemVersion: 1,
      seed: i, skillIds: ['m-integers'], bucket: 'math', mode: 'independent',
      firstResponse: '1', finalResponse: '1', correct: true, firstCorrect: true, score: null,
      validator: 'numeric', hintLevel: 0, confidence: null, elapsedSec: 60, errorTags: [], difficulty: 2,
    })) as AttemptEvent[]
    const state: AppState = { ...initialState(), onboarded: true, events }

    const cold = deriveEvidence([], START)
    const coldState: AppState = { ...initialState(), onboarded: true }
    const warm = deriveEvidence(events, START + DAY)
    expect(stateRank(warm.get('m-integers')!.state)).toBeGreaterThanOrEqual(stateRank('independent'))

    expect(
      prereqLeverage('m-integers', DEFAULT_INDEX, cold, coldState),
      'an unowned root skill really is blocking its dependents',
    ).toBeGreaterThan(0)
    expect(
      prereqLeverage('m-integers', DEFAULT_INDEX, warm, state),
      'an owned skill blocks nothing, so it must claim no leverage',
    ).toBe(0)
  })
})

describe('the frontier keeps moving for a learner who is doing well', () => {
  /*
   * The pre-fix numbers at this accuracy were 58 touched / 34 owned. The floors
   * below sit well under what is measured now (120 / 119) so ordinary content
   * growth does not make them brittle, and well above the broken behaviour so a
   * regression cannot slip through.
   */
  it('covers most of the curriculum over a year at high accuracy', () => {
    const run = simulate(365, 0.85)
    expect(run.touched, `only ${run.touched}/122 skills were ever served`).toBeGreaterThan(95)
    expect(run.owned, `only ${run.owned} skills reached Independent`).toBeGreaterThan(85)
  })

  it('does not park on one skill or one question family', () => {
    const run = simulate(365, 0.95)
    // Pre-fix: one core label took 215/365 days (59%) and one family took 611
    // of 2,938 attempts (21%).
    expect(run.worstCoreShare, 'one skill is monopolising the core block').toBeLessThan(0.45)
    expect(run.worstTemplateShare, 'one question family is monopolising practice').toBeLessThan(0.08)
  })

  it('still gets a struggling learner somewhere', () => {
    const run = simulate(365, 0.55)
    expect(run.touched).toBeGreaterThan(60)
    expect(run.owned).toBeGreaterThan(45)
  })
})
