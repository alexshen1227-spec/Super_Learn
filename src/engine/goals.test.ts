import { describe, expect, it } from 'vitest'
import { GOAL_PRESETS, goalTilt } from './goals'
import { effectiveAllocation, tuneTargets } from './allocationPlus'
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
    // Singular or plural: the note reads "Your goal…" for one and "Your N
    // goals share…" for several, because the budget is shared not multiplied.
    expect(tuned.notes.join(' ')).toMatch(/goal/i)
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

/**
 * Deltas used to be applied one bucket at a time, and each single-bucket
 * rebalance pulled back from the buckets already raised — so the FIRST goal in
 * the list quietly funded the last one, and two goals pointing opposite ways
 * cancelled almost to baseline. Measured before the fix: a request for math
 * +9.6 / meta +2.4 landed at +8 / +2. Order must not matter.
 */
describe('goal deltas are applied in one pass, not eroded in list order', () => {
  const at = (goals: string[]) => {
    const s = {
      ...initialState(),
      profile: { ...initialState().profile, goals },
    }
    return effectiveAllocation(s, new Map(), DEFAULT_INDEX, NOW).targets
  }

  it('gives the same result whichever order the goals were picked in', () => {
    const a = at(['Move up in my math course', 'Walk the four Paths'])
    const b = at(['Walk the four Paths', 'Move up in my math course'])
    expect(a).toEqual(b)
  })

  it('does not let a later delta cannibalise an earlier one', () => {
    // 'Move up in my math course' weights math 4 / meta 1 — math must keep the
    // clearly larger share of the budget, not surrender it to meta.
    const base = at([])
    const tilted = at(['Move up in my math course'])
    const mathGain = tilted.math - base.math
    const metaGain = tilted.meta - base.meta
    expect(mathGain).toBeGreaterThan(metaGain * 2)
    // And the tilt as a whole lands near the declared budget rather than
    // shrinking on the way through.
    expect(mathGain + metaGain).toBeGreaterThanOrEqual(10)
  })

  it('still respects every floor when many goals pull at once', () => {
    const all = at(GOAL_PRESETS)
    for (const [bucket, value] of Object.entries(all)) {
      expect(value, `${bucket} fell through the floor`).toBeGreaterThanOrEqual(MIN_ALLOCATION_PERCENT)
    }
    expect(Object.values(all).reduce((a, b) => a + b, 0)).toBe(100)
  })
})
