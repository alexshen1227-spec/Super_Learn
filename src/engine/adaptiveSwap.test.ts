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

/*
 * Outcomes carry the area they came from: the engine trusts same-area results
 * on a shorter run than results from elsewhere. These fixtures are all
 * mathematics, matching the m-proportion families under test, so they exercise
 * the local branch — thresholds 3 up, 2 down.
 */
const ok = (n: number, val: boolean) =>
  Array.from({ length: n }, () => ({ ok: val, bucket: 'math' as const }))
const CRUISING = ok(3, true)
const STRUGGLING = ok(2, false)

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
    expect(adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, ok(1, true))).toBeNull()
    expect(
      adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, [
        { ok: true, bucket: 'math' },
        { ok: false, bucket: 'math' },
        { ok: true, bucket: 'math' },
      ]),
    ).toBeNull()
  })

  /**
   * The reason outcomes carry an area at all: a run of misses somewhere else
   * is not evidence that THIS area is too hard. Two wrong answers in physics
   * used to ease the next mathematics item.
   */
  it('does not ease an area on the strength of misses in a different one', () => {
    const plan = planWith([{ templateId: 'prop-word', seed: 3 }])
    const elsewhere = [
      { ok: false, bucket: 'physics' as const },
      { ok: false, bucket: 'physics' as const },
    ]
    expect(
      adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, elsewhere),
      'two misses in another area moved a mathematics item',
    ).toBeNull()

    // The same two misses IN mathematics do move it, so the test is measuring
    // the area rule rather than some unrelated refusal to swap at all.
    const here = ok(2, false)
    const local = adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, here)
    expect(local?.direction, 'same-area misses should still ease').toBe('eased')
  })

  it('still reacts to a longer run of misses across areas', () => {
    const plan = planWith([{ templateId: 'prop-word', seed: 3 }])
    // Three from elsewhere clears the weaker cross-area bar of 3.
    const wide = [
      { ok: false, bucket: 'physics' as const },
      { ok: false, bucket: 'observer' as const },
      { ok: false, bucket: 'coding' as const },
    ]
    expect(adaptiveSwap(plan, DEFAULT_INDEX, { block: 0, act: 0 }, wide)?.direction).toBe('eased')
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
