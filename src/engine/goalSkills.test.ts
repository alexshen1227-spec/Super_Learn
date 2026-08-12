import { describe, expect, it } from 'vitest'
import { GOAL_PRESETS, goalSkillIds, goalSkillNote, goalTilt } from './goals'
import { SKILL_BY_ID } from '../content/skills'

const REASONING = 'Everyday reasoning & judgement'

describe('goals that name skills', () => {
  it('is offered in the picker', () => {
    expect(GOAL_PRESETS).toContain(REASONING)
  })

  it('names only skills that actually exist', () => {
    for (const id of goalSkillIds([REASONING])) {
      expect(SKILL_BY_ID.has(id), `${id} is not a real skill`).toBe(true)
    }
  })

  it('names nothing for goals with no evidence-backed skill list', () => {
    for (const g of GOAL_PRESETS) {
      if (g === REASONING) continue
      expect(goalSkillIds([g]).size, `${g} should not name skills`).toBe(0)
    }
    expect(goalSkillNote(['Improve at chess'])).toBeNull()
  })

  it('still tilts buckets, and still keeps the shared budget', () => {
    const one = goalTilt([REASONING])
    const total = Object.values(one.deltas).reduce((a, b) => a + b, 0)
    // The whole point of the budget: one goal or six, the movement is bounded.
    expect(total).toBeGreaterThan(11)
    expect(total).toBeLessThan(13)
    expect(one.note).toBeTruthy()
  })

  it('spreads rather than stacks when combined with other goals', () => {
    const alone = goalTilt([REASONING]).deltas.investigator ?? 0
    const shared = goalTilt([REASONING, 'Improve at chess', 'Raise my grades']).deltas.investigator ?? 0
    expect(shared).toBeLessThan(alone)
  })

  /*
   * THE HONESTY TEST. Confirmation bias is the one the 2025 meta-analysis of 54
   * RCTs singles out as essentially immovable by education, so no skill named
   * for it may ride in on this goal. If a future skill is added with that name,
   * this fails and someone has to justify it against the evidence.
   */
  it('does not promise to fix confirmation bias', () => {
    for (const id of goalSkillIds([REASONING])) {
      const name = (SKILL_BY_ID.get(id)?.name ?? '').toLowerCase()
      expect(name.includes('confirmation bias'), `${id} claims to train confirmation bias`).toBe(false)
    }
  })

  it('reaches across areas rather than becoming a second maths goal', () => {
    const buckets = new Set(
      [...goalSkillIds([REASONING])].map((id) => SKILL_BY_ID.get(id)?.bucket).filter(Boolean),
    )
    expect(buckets.size, 'a reasoning goal that lives in one bucket is a bucket tilt wearing a hat').toBeGreaterThanOrEqual(5)
    expect(buckets.has('math'), 'this goal is not a maths goal').toBe(false)
  })
})
