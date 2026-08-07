import { describe, expect, it } from 'vitest'
import { adaptiveSwap } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import type { SessionPlan } from '../domain/types'

/**
 * Regression: reported from real use as "It gave me this problem two times in
 * a row" (prop-word), alongside a second report on prop-identify. Both are
 * m-proportion families, and the within-session difficulty adjustment picks
 * replacements from exactly that pool — so it could hand back a template the
 * learner had just answered.
 */
function planWith(activities: { templateId: string; seed: number }[]): SessionPlan {
  return {
    id: 'p1',
    createdAt: 0,
    minutes: 30,
    blocks: [
      {
        kind: 'core',
        bucket: 'math',
        label: 'core',
        minutes: 10,
        why: 'test',
        activities: activities.map((a) => ({ ...a, mode: 'independent' as const })),
      },
    ],
    rationale: [],
  } as unknown as SessionPlan
}

const CRUISING = [true, true, true]
const STRUGGLING = [false, false]

describe('within-session difficulty adjustment', () => {
  it('never swaps in a template already used this session', () => {
    // Every m-proportion family that could be chosen, all already "used".
    const family = (DEFAULT_INDEX.bySkill.get('m-proportion') ?? []).filter((t) => !t.authentic)
    expect(family.length, 'need a multi-template skill for this test to mean anything').toBeGreaterThan(1)

    const plan = planWith(family.map((t, i) => ({ templateId: t.id, seed: 100 + i })))
    // Try to adjust each position, in both directions.
    for (let i = 0; i < family.length; i++) {
      for (const outcomes of [CRUISING, STRUGGLING]) {
        const swap = adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: i }, outcomes)
        if (!swap) continue
        const others = family.filter((_, j) => j !== i).map((t) => t.id)
        expect(others, `swapped in ${swap.templateId}, already used this session`).not.toContain(swap.templateId)
      }
    }
  })

  it('still adjusts when a fresh candidate exists', () => {
    const family = (DEFAULT_INDEX.bySkill.get('m-proportion') ?? []).filter((t) => !t.authentic)
    const spread = family.slice().sort((a, b) => a.difficulty - b.difficulty)
    const easiest = spread[0]
    const plan = planWith([{ templateId: easiest.id, seed: 7 }])
    const swap = adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, CRUISING)
    if (spread.some((t) => t.difficulty > easiest.difficulty && t.kind === easiest.kind)) {
      expect(swap, 'a harder sibling exists, so cruising should step up').toBeTruthy()
      expect(swap!.direction).toBe('stepped-up')
      expect(swap!.templateId).not.toBe(easiest.id)
    }
  })

  it('does nothing without enough graded evidence, or on a mixed run', () => {
    const plan = planWith([{ templateId: 'prop-word', seed: 3 }])
    expect(adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, [])).toBeNull()
    expect(adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, [true])).toBeNull()
    expect(adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, [true, false, true])).toBeNull()
  })

  it('picks a seed that does not repeat a form already served', () => {
    const t = DEFAULT_INDEX.templates.get('prop-word')!
    // Fill the plan with every variant of prop-word plus the target slot.
    const acts = Array.from({ length: t.variants }, (_, i) => ({ templateId: 'prop-word', seed: i }))
    const plan = planWith([...acts, { templateId: 'prop-identify', seed: 0 }])
    const swap = adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: acts.length }, CRUISING)
    // prop-word is fully consumed, so it must not come back as the swap.
    if (swap) expect(swap.templateId).not.toBe('prop-word')
  })
})
