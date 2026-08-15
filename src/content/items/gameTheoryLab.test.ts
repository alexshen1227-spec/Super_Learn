/**
 * Independent verification of the part-three keys.
 *
 * Same discipline as `gameTheoryDepth.test.ts`, and for the same reason: the
 * content audit checks that items are well-formed, fair and answerable, and
 * cannot check that a mixed-strategy solution is actually the solution. A
 * generator that solved the indifference equation with a sign flipped would
 * emit a beautifully formatted item with a wrong key and pass every gate.
 *
 * So each answer here is re-derived from the RENDERED prompt — the numbers the
 * learner actually sees — rather than from the generator's own variables.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_INDEX } from '../registry'

function variants(id: string, cap = 40) {
  const t = DEFAULT_INDEX.templates.get(id)
  if (!t) throw new Error(`missing template ${id}`)
  return Array.from({ length: Math.min(t.variants, cap) }, (_, s) => t.generate(s))
}

const numericAnswer = (body: { answer?: unknown }) => {
  const a = body.answer as { type: string; answer: number; tolerance?: number }
  expect(a.type).toBe('numeric')
  return a
}

describe('the mixed-strategy solution really makes them indifferent', () => {
  it('solves the indifference equation the prompt actually shows', () => {
    for (const [i, b] of variants('gtl-mixed-solve').entries()) {
      // Pull their 2x2 payoff table back out of the rendered markdown.
      const rows = b.prompt.split('\n').filter((l) => l.trim().startsWith('| they cover'))
      expect(rows, `variant ${i}: expected two payoff rows`).toHaveLength(2)
      const nums = rows.map((r) =>
        r
          .split('|')
          .slice(2, 4)
          .map((c) => Number(c.trim())),
      )
      const [[x, y], [u, w]] = nums
      for (const v of [x, y, u, w]) expect(Number.isFinite(v), `variant ${i}: unparsed payoff`).toBe(true)

      // Their payoff from covering A is p*x + (1-p)*y; from covering B it is
      // p*u + (1-p)*w. Indifference: p = (w - y) / (x - y - u + w).
      const denom = x - y - u + w
      expect(denom, `variant ${i}: degenerate game, no interior solution`).not.toBe(0)
      const p = (w - y) / denom
      expect(p, `variant ${i}: solution must be a real probability`).toBeGreaterThan(0)
      expect(p, `variant ${i}: solution must be a real probability`).toBeLessThan(1)

      const a = numericAnswer(b)
      expect(Math.abs(a.answer - p * 100), `variant ${i}: key ${a.answer}% vs solved ${(p * 100).toFixed(1)}%`).toBeLessThanOrEqual(
        a.tolerance ?? 0,
      )

      // And the point of the exercise: at that mix their two options really do
      // pay the same. Verified directly rather than trusted from the algebra.
      const coverA = p * x + (1 - p) * y
      const coverB = p * u + (1 - p) * w
      expect(Math.abs(coverA - coverB), `variant ${i}: not actually indifferent`).toBeLessThan(1e-9)
    }
  })
})

describe('the median voter key is the Condorcet winner', () => {
  it('beats every alternative head to head, and is not just the average', () => {
    for (const [i, b] of variants('gtl-median-voter', 24).entries()) {
      const m = b.prompt.match(/preferred values are: \*\*([\d, ]+)\*\*/)
      expect(m, `variant ${i}: expected the preference list`).toBeTruthy()
      const prefs = m![1].split(',').map((x) => Number(x.trim()))
      expect(prefs).toHaveLength(7)

      const key = numericAnswer(b).answer

      // Brute force: the key must beat every other value 0-100 in a majority
      // vote, where each person votes for whichever is nearer their own.
      for (let rival = 0; rival <= 100; rival++) {
        if (rival === key) continue
        const forKey = prefs.filter((v) => Math.abs(v - key) < Math.abs(v - rival)).length
        const forRival = prefs.filter((v) => Math.abs(v - rival) < Math.abs(v - key)).length
        expect(forKey, `variant ${i}: ${rival} beat the key ${key} (${forRival} to ${forKey})`).toBeGreaterThanOrEqual(
          forRival,
        )
      }
      // The explanation leans on median ≠ mean, so at least sometimes it must not be.
      expect(key).toBe([...prefs].sort((a, c) => a - c)[3])
    }
  })
})

describe('the level-k crowd arithmetic is right', () => {
  it('targets two thirds of the crowd it describes', () => {
    for (const [i, b] of variants('gtl-levelk-play').entries()) {
      const counts = [...b.prompt.matchAll(/- (\d+) people will write about \*\*(\d+)\*\*/g)].map((x) => ({
        n: Number(x[1]),
        v: Number(x[2]),
      }))
      expect(counts, `variant ${i}: expected four crowd rows`).toHaveLength(4)
      const total = counts.reduce((acc, c) => acc + c.n * c.v, 0)
      const people = counts.reduce((acc, c) => acc + c.n, 0)
      const target = ((total / people) * 2) / 3

      const a = numericAnswer(b)
      expect(Math.abs(a.answer - target), `variant ${i}: key ${a.answer} vs ${target.toFixed(2)}`).toBeLessThanOrEqual(
        (a.tolerance ?? 0) + 0.5,
      )
      // The whole lesson: the equilibrium (0) is NOT the answer.
      expect(a.answer, `variant ${i}: the crowd answer must not collapse to the equilibrium`).toBeGreaterThan(5)
    }
  })
})

describe('the fairness item picks the genuinely best expected offer', () => {
  it('maximises expected keep over the table it prints', () => {
    for (const [i, b] of variants('gtl-fair-expected', 8).entries()) {
      const rows = [...b.prompt.matchAll(/\| (\d+) \| (\d+)% \| (\d+) \|/g)].map((x) => ({
        offer: Number(x[1]),
        accept: Number(x[2]) / 100,
        keep: Number(x[3]),
      }))
      expect(rows.length, `variant ${i}: expected the offer table`).toBeGreaterThanOrEqual(5)
      const ev = rows.map((r) => r.keep * r.accept)
      const best = rows[ev.indexOf(Math.max(...ev))]

      const a = b.answer as { type: string; options: string[]; correct: number }
      expect(a.type).toBe('mcq')
      expect(a.options[a.correct], `variant ${i}: key should name offer ${best.offer}`).toContain(
        `Offer ${best.offer}`,
      )
      // The point of the item: the greedy offer must NOT be the best one.
      expect(best.offer, `variant ${i}: the smallest offer should not win`).not.toBe(rows[0].offer)
    }
  })
})

describe('the trust arithmetic adds up', () => {
  it('returns exactly what the stated split produces', () => {
    for (const [i, b] of variants('gtl-trust-entry', 9).entries()) {
      const start = Number(b.prompt.match(/You both start with (\d+) units/)![1])
      const send = Number(b.prompt.match(/If you send \*\*(\d+)\*\*/)![1])
      const multWord = b.prompt.match(/is (tripled|doubled|quadrupled) on the way/)
      expect(multWord, `variant ${i}: expected a multiplier`).toBeTruthy()
      const mult = { doubled: 2, tripled: 3, quadrupled: 4 }[multWord![1] as 'doubled' | 'tripled' | 'quadrupled']
      const expected = start - send + (send * mult) / 2
      expect(numericAnswer(b).answer, `variant ${i}`).toBe(expected)
    }
  })
})
