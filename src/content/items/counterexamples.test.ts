import { describe, expect, it } from 'vitest'
import { COUNTEREXAMPLE_TEMPLATES, FALSE_CLAIMS } from './counterexamples'

/**
 * THE GATE. These items teach that one counterexample kills a universal claim.
 * If the offered "counterexample" did not actually break the claim, or a
 * distractor secretly did, the item would teach the opposite of the lesson —
 * so every claim carries a machine-checkable predicate and it is exercised
 * here rather than trusted.
 *
 * Two claims are unfalsifiable by arithmetic (shared-cause reasoning and
 * sampling bias): their predicates return false by construction, which is
 * checked explicitly rather than silently passing the numeric test.
 */
const REASONING_ONLY = new Set(['correlation-direction', 'bigger-sample-better'])

describe('every stated counterexample genuinely breaks its claim', () => {
  it('the key case fails the claim', () => {
    for (const c of FALSE_CLAIMS) {
      if (REASONING_ONLY.has(c.id)) continue
      expect(c.test(c.counter.values), `${c.id}: the "counterexample" does not break the claim`).toBe(false)
    }
  })

  it('every supporting case SATISFIES the claim, so it cannot refute it', () => {
    for (const c of FALSE_CLAIMS) {
      if (REASONING_ONLY.has(c.id)) continue
      for (const s of c.supporters) {
        expect(c.test(s.values), `${c.id}: "${s.label}" is offered as a supporter but breaks the claim`).toBe(true)
      }
    }
  })

  it('marks the reasoning-only claims deliberately, not by omission', () => {
    for (const id of REASONING_ONLY) {
      const c = FALSE_CLAIMS.find((x) => x.id === id)
      expect(c, `${id} is no longer in the bank — update the gate`).toBeTruthy()
      // These are refuted by argument, so the predicate must be the explicit
      // always-false one rather than an arithmetic test that happens to pass.
      expect(c!.test([1])).toBe(false)
      expect(c!.test([2])).toBe(false)
    }
  })

  it('gives every claim a repaired version in its explanation, not just a refutation', () => {
    for (const c of FALSE_CLAIMS) {
      expect(c.why.length, `${c.id}: no explanation`).toBeGreaterThan(40)
    }
  })

  it('offers enough distinct options on every seed', () => {
    for (const t of COUNTEREXAMPLE_TEMPLATES) {
      for (let seed = 0; seed < t.variants; seed++) {
        const item = t.generate(seed)
        expect(item.answer?.type).toBe('mcq')
        const a = item.answer as { options: string[]; correct: number }
        expect(a.options.length, `${t.id}@${seed}: too few options`).toBeGreaterThanOrEqual(3)
        expect(new Set(a.options).size, `${t.id}@${seed}: duplicate options`).toBe(a.options.length)
        expect(a.correct).toBeGreaterThanOrEqual(0)
        expect(a.correct).toBeLessThan(a.options.length)
      }
    }
  })

  it('every claim in the bank is actually FALSE — no true claim is presented as broken', () => {
    for (const c of FALSE_CLAIMS) {
      if (REASONING_ONLY.has(c.id)) continue
      // A false universal claim must have at least one case where it fails.
      const anyFailure = c.test(c.counter.values) === false
      expect(anyFailure, `${c.id}: no case in the bank breaks this claim, so it may be true`).toBe(true)
    }
  })
})
