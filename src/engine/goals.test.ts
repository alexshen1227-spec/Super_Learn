import { describe, expect, it } from 'vitest'
import { goalTilt } from './goals'
import { tuneTargets } from './allocationPlus'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { BUCKETS, MIN_ALLOCATION_PERCENT, initialState, type AppState } from '../domain/types'

const NOW = Date.UTC(2026, 7, 8, 12)

function stateWithGoals(goals: string[]): AppState {
  const s = initialState()
  return { ...s, onboarded: true, profile: { ...s.profile, goals } }
}
const tune = (goals: string[]) =>
  tuneTargets(stateWithGoals(goals), deriveEvidence([], NOW), DEFAULT_INDEX, NOW)

/**
 * Goals were collected at onboarding and read by nothing. Picking them changed
 * not one thing about what the app served — worse than not asking, because it
 * implies a promise.
 */
describe('onboarding goals move the balance', () => {
  it('says nothing when no goals were chosen', () => {
    expect(goalTilt([]).note).toBeNull()
    expect(Object.keys(goalTilt([]).deltas)).toEqual([])
  })

  it('ignores unrecognised strings, so an imported profile cannot move anything', () => {
    expect(goalTilt(['definitely not a real goal']).note).toBeNull()
  })

  it('actually shifts the target for the area a goal leans on', () => {
    const before = tune([]).targets
    const after = tune(['Improve at chess']).targets
    expect(after.puzzle).toBeGreaterThan(before.puzzle)
  })

  it('spreads rather than multiplies when many goals are chosen', () => {
    const one = goalTilt(['Be ready for high-school math'])
    const all = goalTilt([
      'Raise my grades',
      'Be ready for high-school math',
      'Get better at problem solving',
      'Sharpen focus and memory',
      'Improve at chess',
      'Think more clearly about people and claims',
    ])
    const sum = (t: typeof one) => Object.values(t.deltas).reduce((a, b) => a + (b ?? 0), 0)
    // The same budget, spread across more areas — not six times the tilt.
    expect(Math.abs(sum(all) - sum(one))).toBeLessThan(0.001)
    expect(Object.keys(all.deltas).length).toBeGreaterThan(Object.keys(one.deltas).length)
  })
})

/**
 * The brief is explicit that urgent work must never permanently erase other
 * areas. A goal is the least urgent thing here, so it certainly must not.
 */
describe('unchosen areas are still taught', () => {
  it('keeps every bucket at or above its floor whatever is chosen', () => {
    for (const goals of [
      ['Improve at chess'],
      ['Be ready for high-school math'],
      ['Raise my grades', 'Be ready for high-school math'],
      ['Improve at chess', 'Sharpen focus and memory'],
    ]) {
      const t = tune(goals).targets
      for (const b of BUCKETS) {
        expect(t[b.id], `${b.id} starved by ${goals.join('+')}`).toBeGreaterThanOrEqual(MIN_ALLOCATION_PERCENT)
      }
      expect(Object.values(t).reduce((a, b) => a + b, 0)).toBe(100)
    }
  })

  it('explains itself, since a silent change cannot be checked', () => {
    const tuned = tune(['Improve at chess'])
    expect(tuned.tuned).toBe(true)
    expect(tuned.notes.join(' ')).toMatch(/goals/i)
    // The promise that matters: choosing a goal does not delete anything else.
    expect(tuned.notes.join(' ')).toMatch(/nothing else is dropped|keeps its floor/i)
  })

  it('is inert when the learner turns coach management off', () => {
    const s = stateWithGoals(['Improve at chess'])
    s.settings.coachManagedAllocations = false
    const t = tuneTargets(s, deriveEvidence([], NOW), DEFAULT_INDEX, NOW)
    expect(t.tuned).toBe(false)
    expect(t.targets).toEqual(s.settings.allocations)
  })
})
