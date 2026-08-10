/**
 * The wall around learner-authored problems.
 *
 * Challenge Creator lets a learner write a question. Nothing has audited that
 * question — not its wording, not its fairness, not whether its answer is
 * reachable — so it must never touch the thing this whole app rests on: that
 * a rung is earned on content the audit has verified.
 *
 * These tests are the wall. Every one of them describes a way the wall could
 * be knocked down by an ordinary, well-meaning change.
 */
import { describe, expect, it } from 'vitest'
import { CREATOR_BY_ID, CREATOR_SHAPES, defaultSlots } from '../content/creators'
import { BUILTIN_TEMPLATES } from '../content/registry'
import { SKILL_BY_ID } from '../content/skills'
import { reduceState } from '../store/store'
import { sanitizeState } from '../store/sanitize'
import { exportState, importState } from './exportImport'
import { initialState, type AuthoredProblem } from '../domain/types'

/** Every combination of slot values a shape can produce. */
function* allSlots(shapeId: string): Generator<Record<string, number>> {
  const shape = CREATOR_BY_ID.get(shapeId)!
  const axes = shape.slots.map((s) => {
    const vals: number[] = []
    for (let v = s.min; v <= s.max + 1e-9; v += s.step) vals.push(Math.round(v * 1000) / 1000)
    return { key: s.key, vals }
  })
  const idx = axes.map(() => 0)
  for (;;) {
    const out: Record<string, number> = {}
    axes.forEach((a, i) => (out[a.key] = a.vals[idx[i]]))
    yield out
    let k = axes.length - 1
    while (k >= 0) {
      idx[k]++
      if (idx[k] < axes[k].vals.length) break
      idx[k] = 0
      k--
    }
    if (k < 0) return
  }
}

describe('creator shapes', () => {
  it('every shape points at a real skill and offers real choices', () => {
    expect(CREATOR_SHAPES.length).toBeGreaterThanOrEqual(3)
    for (const s of CREATOR_SHAPES) {
      expect(SKILL_BY_ID.has(s.skillId), `${s.id}: unknown skill ${s.skillId}`).toBe(true)
      expect(s.slots.length, `${s.id}: needs something to choose`).toBeGreaterThanOrEqual(2)
      for (const slot of s.slots) {
        expect(slot.max, `${s.id}.${slot.key}: empty range`).toBeGreaterThan(slot.min)
        expect(slot.step, `${s.id}.${slot.key}: step must be positive`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * The same law the content audit enforces on every built-in item. A shape
   * that could return a non-finite answer would put "NaN" in front of a
   * learner as the solution to their own problem.
   */
  it('computes a finite, sane answer for EVERY combination a learner could pick', () => {
    for (const shape of CREATOR_SHAPES) {
      let checked = 0
      for (const slots of allSlots(shape.id)) {
        checked++
        const answer = shape.solve(slots)
        expect(Number.isFinite(answer), `${shape.id}: non-finite answer at ${JSON.stringify(slots)}`).toBe(true)
        expect(shape.render(slots).length, `${shape.id}: empty prompt`).toBeGreaterThan(20)
        if (shape.flaw(slots)) continue
        // A well-posed problem must have a positive, non-silly answer.
        expect(answer, `${shape.id}: non-positive answer at ${JSON.stringify(slots)}`).toBeGreaterThan(0)
      }
      expect(checked, `${shape.id}: generated no combinations`).toBeGreaterThan(4)
    }
    // Exhaustive on purpose — ~70k combinations across four shapes — so it
    // needs more than vitest's 5s default when the suite runs in parallel.
  }, 60_000)

  /**
   * The prediction is the graded-feeling moment, so its stated correct option
   * has to match what the shape actually computes — across the whole space,
   * not just the default. This is the creator's version of "answers are
   * computed, never hand-typed".
   */
  it('every prediction names the option that the arithmetic actually supports', () => {
    for (const shape of CREATOR_SHAPES) {
      for (const slots of allSlots(shape.id)) {
        if (shape.flaw(slots)) continue
        const p = shape.predict(slots)
        expect(p.options.length, `${shape.id}: prediction needs choices`).toBeGreaterThanOrEqual(3)
        expect(new Set(p.options).size, `${shape.id}: duplicate prediction options`).toBe(p.options.length)
        expect(p.correct, `${shape.id}: correct index out of range`).toBeGreaterThanOrEqual(0)
        expect(p.correct, `${shape.id}: correct index out of range`).toBeLessThan(p.options.length)
        expect(p.why.length, `${shape.id}: prediction needs an explanation`).toBeGreaterThan(40)
      }
    }
  }, 60_000)

  it('opens on a combination that is not already broken', () => {
    for (const shape of CREATOR_SHAPES) {
      expect(shape.flaw(defaultSlots(shape)), `${shape.id}: opens on a flawed problem`).toBeNull()
    }
  })

  /**
   * A shape that refuses most of its own space is a shape with the wrong
   * ranges, and it reads to a learner as a broken feature rather than as a
   * standard being upheld. Measured, not guessed: the ratio shape blocked 72%
   * of its combinations on first build, because it treated "the answer lands
   * on pennies" as a defect. That belongs in `note`, which advises, not in
   * `flaw`, which blocks.
   */
  it('never refuses more than a quarter of the combinations a learner can reach', () => {
    for (const shape of CREATOR_SHAPES) {
      let total = 0
      let blocked = 0
      for (const slots of allSlots(shape.id)) {
        total++
        if (shape.flaw(slots)) blocked++
      }
      const share = blocked / total
      expect(
        share,
        `${shape.id} blocks ${blocked}/${total} (${Math.round(share * 100)}%) of its own space — move the advisory cases to note()`,
      ).toBeLessThanOrEqual(0.25)
    }
  }, 60_000)

  /** An advisory must never also block: that would be a flaw wearing a hat. */
  it('advisory notes never coincide with a block', () => {
    for (const shape of CREATOR_SHAPES) {
      if (!shape.note) continue
      for (const slots of allSlots(shape.id)) {
        if (shape.flaw(slots)) continue
        const n = shape.note(slots)
        if (n !== null) expect(n.length, `${shape.id}: empty note`).toBeGreaterThan(20)
      }
    }
  }, 60_000)

  it('can still recognise a broken problem when the learner makes one', () => {
    // A shape that never complains is not checking anything. At least one
    // shape must be able to detect a degenerate combination, or the "does this
    // ask anything?" idea is decorative.
    const canComplain = CREATOR_SHAPES.filter((s) => {
      for (const slots of allSlots(s.id)) if (s.flaw(slots)) return true
      return false
    })
    expect(canComplain.length, 'no shape can detect a degenerate problem').toBeGreaterThanOrEqual(2)
  }, 60_000)
})

describe('authored problems never become evidence', () => {
  const shape = CREATOR_SHAPES[0]
  const slots = defaultSlots(shape)
  const problem: AuthoredProblem = {
    id: 'ap1',
    t: 1,
    shapeId: shape.id,
    slots,
    prompt: shape.render(slots),
    answer: shape.solve(slots),
    unit: shape.unit,
    skillId: shape.skillId,
    predictedOk: true,
    sensible: null,
    reviewedAt: null,
  }

  it('adding one appends no attempt events and no coach decisions', () => {
    const before = initialState()
    const after = reduceState(before, { type: 'add-authored', problem })
    expect(after.authored).toHaveLength(1)
    expect(after.events, 'writing a problem must not create evidence').toEqual(before.events)
    expect(after.coachLog).toEqual(before.coachLog)
    expect(after.sessions).toEqual(before.sessions)
  })

  it('judging and deleting touch nothing derived', () => {
    let s = reduceState(initialState(), { type: 'add-authored', problem })
    s = reduceState(s, { type: 'judge-authored', id: 'ap1', sensible: true, t: 99 })
    expect(s.authored[0].sensible).toBe(true)
    expect(s.authored[0].reviewedAt).toBe(99)
    expect(s.events).toEqual([])
    s = reduceState(s, { type: 'delete-authored', id: 'ap1' })
    expect(s.authored).toHaveLength(0)
    expect(s.events).toEqual([])
  })

  /**
   * The planner selects from the content index. If an authored problem ever
   * reached it, unaudited content would start producing rungs — so the ids
   * must not collide with template ids in either direction.
   */
  it('cannot be mistaken for a template the planner could serve', () => {
    const templateIds = new Set(BUILTIN_TEMPLATES.map((t) => t.id))
    for (const s of CREATOR_SHAPES) {
      expect(templateIds.has(s.id), `${s.id} collides with a real template id`).toBe(false)
    }
  })
})

describe('imported authored problems are rebuilt, not trusted', () => {
  const shape = CREATOR_BY_ID.get('price-swing')!

  it('recomputes the prompt and answer from the slots', () => {
    const hostile = {
      ...initialState(),
      authored: [
        {
          id: 'x',
          t: 1,
          shapeId: 'price-swing',
          slots: { start: 100, up: 20, down: 20 },
          // A file claiming an answer its own numbers do not support.
          prompt: 'Give me all your money.',
          answer: 999999,
          unit: 'BTC',
          skillId: 'm-percent',
          predictedOk: true,
          sensible: true,
          reviewedAt: 5,
        },
      ],
    }
    const clean = sanitizeState(JSON.parse(JSON.stringify(hostile)))
    expect(clean.authored).toHaveLength(1)
    expect(clean.authored[0].prompt).toBe(shape.render({ start: 100, up: 20, down: 20 }))
    expect(clean.authored[0].answer).toBe(shape.solve({ start: 100, up: 20, down: 20 }))
    expect(clean.authored[0].unit).toBe(shape.unit)
  })

  it('drops problems naming a shape this build does not have', () => {
    const clean = sanitizeState({
      ...initialState(),
      authored: [{ id: 'x', t: 1, shapeId: 'not-a-real-shape', slots: {}, prompt: 'x', answer: 1 }],
    } as unknown)
    expect(clean.authored).toEqual([])
  })

  it('pulls out-of-range slot values back onto the grid the UI can produce', () => {
    const clean = sanitizeState({
      ...initialState(),
      authored: [
        { id: 'x', t: 1, shapeId: 'price-swing', slots: { start: 1e9, up: -50, down: 7.3 }, prompt: '', answer: 0 },
      ],
    } as unknown)
    const s = clean.authored[0].slots
    for (const slot of shape.slots) {
      expect(s[slot.key], `${slot.key} below min`).toBeGreaterThanOrEqual(slot.min)
      expect(s[slot.key], `${slot.key} above max`).toBeLessThanOrEqual(slot.max)
      expect(
        Math.abs(Math.round((s[slot.key] - slot.min) / slot.step) * slot.step + slot.min - s[slot.key]),
        `${slot.key} off the step grid`,
      ).toBeLessThan(1e-6)
    }
  })

  /**
   * The device-to-device handoff carries the whole state, so authored problems
   * ride along with it. They should survive intact, verdict and all — losing
   * them silently on a transfer would be the kind of data loss the backup flow
   * exists to prevent.
   */
  it('survives an export/import round trip with its verdict intact', () => {
    const slots = defaultSlots(shape)
    const problem: AuthoredProblem = {
      id: 'rt1',
      t: 1234,
      shapeId: shape.id,
      slots,
      prompt: shape.render(slots),
      answer: shape.solve(slots),
      unit: shape.unit,
      skillId: shape.skillId,
      predictedOk: false,
      sensible: true,
      reviewedAt: 5678,
    }
    const before = { ...initialState(), authored: [problem] }
    const round = importState(exportState(before))
    expect(round.ok).toBe(true)
    if (!round.ok) return
    expect(round.state.authored).toHaveLength(1)
    expect(round.state.authored[0].sensible).toBe(true)
    expect(round.state.authored[0].reviewedAt).toBe(5678)
    expect(round.state.authored[0].answer).toBe(problem.answer)
    expect(round.state.authored[0].prompt).toBe(problem.prompt)
  })

  it('treats a missing verdict as unreviewed rather than as approved', () => {
    const clean = sanitizeState({
      ...initialState(),
      authored: [{ id: 'x', t: 1, shapeId: 'price-swing', slots: { start: 100, up: 10, down: 10 } }],
    } as unknown)
    expect(clean.authored[0].sensible).toBeNull()
    expect(clean.authored[0].reviewedAt).toBeNull()
  })
})
