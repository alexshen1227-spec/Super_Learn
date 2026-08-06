import { describe, expect, it } from 'vitest'
import { initialState, type AttemptEvent } from '../domain/types'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { openRepairTargets } from './errors'
import { buildErrorClinicPlan, estimatedPlanMinutes } from './planner'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 7, 6, 12)

function attempt(id: string, skillId: string, templateId: string, t: number, correct: boolean, confidence: number | null): AttemptEvent {
  return {
    id,
    t,
    sessionId: 's',
    templateId,
    itemVersion: 1,
    seed: Number(id.replace(/\D/g, '')) || 1,
    skillIds: [skillId],
    bucket: 'math',
    mode: 'independent',
    firstResponse: correct ? '1' : '0',
    finalResponse: correct ? '1' : '0',
    correct,
    firstCorrect: correct,
    score: null,
    validator: 'numeric',
    hintLevel: 0,
    confidence,
    elapsedSec: 90,
    errorTags: correct ? [] : ['concept'],
    difficulty: 2,
  }
}

describe('Error Clinic', () => {
  it('puts a confident misconception ahead of a newer ordinary miss', () => {
    const state = initialState()
    state.events = [
      attempt('e1', 'm-integers', 'int-ops', NOW - 2 * DAY, false, 95),
      attempt('e2', 'm-fractions', 'frac-addsub', NOW - DAY, false, 50),
    ]
    const evidence = deriveEvidence(state.events, NOW)
    const targets = openRepairTargets(state, evidence, NOW)
    expect(targets.map((target) => target.skillId)).toEqual(['m-integers', 'm-fractions'])
    const plan = buildErrorClinicPlan(
      { index: DEFAULT_INDEX, evidence, state, now: NOW, checkIn: { minutes: 30, energy: 'ok', focus: null } },
      targets,
    )
    expect(plan.blocks).toHaveLength(2)
    expect(plan.blocks[0].label).toContain('Integer operations')
    expect(plan.blocks.every((block) => block.activities.length >= 2)).toBe(true)
    expect(estimatedPlanMinutes(plan)).toBeGreaterThan(10)
  })

  it('removes a repaired error from the open queue', () => {
    const state = initialState()
    state.events = [
      attempt('e1', 'm-integers', 'int-ops', NOW - 2 * DAY, false, 95),
      attempt('e2', 'm-integers', 'int-ops', NOW - DAY, true, 70),
    ]
    expect(openRepairTargets(state, deriveEvidence(state.events, NOW), NOW)).toEqual([])
  })
})
