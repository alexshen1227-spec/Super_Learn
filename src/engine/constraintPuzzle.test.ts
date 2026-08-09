import { describe, expect, it } from 'vitest'
import { solveConstraint, type ConstraintKind, type ConstraintPuzzle } from './constraintPuzzle'
import { CONSTRAINT_PUZZLE_TEMPLATES } from '../content/items/constraintPuzzles'

/**
 * The solver is the answer key for every constraint item, so it gets checked
 * against hand-verifiable cases first. A solver nobody validated would just
 * relocate the "authored optimum nobody checked" problem into the engine.
 */
describe('the constraint solver finds true optima', () => {
  it('maximises a two-digit sum the obvious way', () => {
    // 9,8 in the tens places; 7,6 in the ones: 97 + 86 = 183.
    const r = solveConstraint({ kind: 'sum2x2', digits: [6, 7, 8, 9], goal: 'max' })
    expect(r.value).toBe(183)
  })

  it('minimises a two-digit sum the obvious way', () => {
    // 6,7 in the tens places; 8,9 in the ones: 68 + 79 = 147.
    const r = solveConstraint({ kind: 'sum2x2', digits: [6, 7, 8, 9], goal: 'min' })
    expect(r.value).toBe(147)
  })

  it('prefers BALANCED factors for a maximum product', () => {
    // 96 × 87 = 8352 beats the tempting 98 × 76 = 7448.
    const r = solveConstraint({ kind: 'product2x2', digits: [6, 7, 8, 9], goal: 'max' })
    expect(r.value).toBe(8352)
    expect(r.value).toBeGreaterThan(98 * 76)
  })

  it('hits a target exactly when the digits allow it', () => {
    // 91 − 51 is not available (one 1), but e.g. 62 − 37 = 25 is.
    const r = solveConstraint({ kind: 'closest-difference', digits: [2, 3, 6, 7], goal: 'target', target: 25 })
    expect(r.value).toBe(25)
  })

  it('never divides by zero in the fraction kind', () => {
    const r = solveConstraint({ kind: 'closest-sum', digits: [0, 1, 2, 3], goal: 'max' })
    expect(Number.isFinite(r.value)).toBe(true)
  })

  it('counts ties rather than pretending an optimum is unique', () => {
    // Swapping the two whole numbers gives the same sum, so ties ≥ 2.
    const r = solveConstraint({ kind: 'sum2x2', digits: [6, 7, 8, 9], goal: 'max' })
    expect(r.ties).toBeGreaterThan(1)
  })

  it('is deterministic — the same puzzle always yields the same answer', () => {
    const p: ConstraintPuzzle = { kind: 'product2x2', digits: [2, 4, 5, 6, 8, 9], goal: 'max' }
    expect(solveConstraint(p)).toEqual(solveConstraint(p))
  })
})

/**
 * THE RELEASE GATE. Every rendered constraint item states an optimum; this
 * re-derives it independently from the digits and target printed in the
 * prompt, so an item whose generator drifted from its own answer cannot ship.
 * Same discipline as the search-verified chess tactics.
 */
describe('every rendered constraint item states a genuine optimum', () => {
  const KIND_BY_ID: Record<string, ConstraintKind> = {
    'cp-biggest-sum': 'sum2x2',
    'cp-biggest-product': 'product2x2',
    'cp-closest-difference': 'closest-difference',
    'cp-fraction-sum': 'closest-sum',
  }

  it('re-solves each item from its own prompt and matches the stated answer', () => {
    for (const t of CONSTRAINT_PUZZLE_TEMPLATES) {
      const kind = KIND_BY_ID[t.id]
      expect(kind, `${t.id}: no kind registered for the gate`).toBeTruthy()
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        // Pull the digit pool straight out of the text the learner reads.
        const digitMatch = item.prompt.match(/digits \*\*([\d, ]+)\*\*/)
        expect(digitMatch, `${t.id}@${seed}: no digit pool in the prompt`).toBeTruthy()
        const digits = digitMatch![1].split(',').map((d) => Number(d.trim()))

        const targetMatch = item.prompt.match(/close as possible to \*\*(\d+)\*\*/)
        const wantsMax = /LARGEST/.test(item.prompt)
        const goal = targetMatch ? 'target' : wantsMax ? 'max' : 'min'
        const solved = solveConstraint({
          kind,
          digits,
          goal,
          ...(targetMatch ? { target: Number(targetMatch[1]) } : {}),
        })

        if (item.answer?.type === 'numeric') {
          expect(item.answer.answer, `${t.id}@${seed}: stated answer is not the true optimum`).toBe(solved.value)
        } else {
          // MCQ kinds state the winning ARRANGEMENT; check the correct option
          // evaluates to the optimum rather than merely looking plausible.
          expect(item.answer?.type, `${t.id}@${seed}: unexpected answer type`).toBe('mcq')
          const opt = (item.answer as { options: string[]; correct: number }).options[
            (item.answer as { correct: number }).correct
          ]
          const nums = opt.match(/\d+/g)!.map(Number)
          expect(nums.length, `${t.id}@${seed}: could not read the option`).toBe(4)
          const value = nums[0] / nums[1] + nums[2] / nums[3]
          expect(value, `${t.id}@${seed}: the "correct" option is not optimal`).toBeCloseTo(solved.value, 9)
        }
      }
    }
  })

  it('never asks for a digit the pool does not contain', () => {
    for (const t of CONSTRAINT_PUZZLE_TEMPLATES) {
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        const digits = item.prompt.match(/digits \*\*([\d, ]+)\*\*/)![1].split(',').map((d) => Number(d.trim()))
        expect(new Set(digits).size, `${t.id}@${seed}: duplicate digit offered`).toBe(digits.length)
        expect(digits.length, `${t.id}@${seed}: pool too small to fill four boxes`).toBeGreaterThanOrEqual(4)
      }
    }
  })
})
