import { describe, expect, it } from 'vitest'
import type { ConstructAnswer } from '../domain/types'
import { checkHolds, gradeConstruct, serializeConstruct, statOf, witnessResponse, witnessSatisfies } from './construct'
import { validate, wrongResponse } from './validate'
import { parseExpression } from './parseValue'

const sub = (v: Record<string, number | string>) =>
  serializeConstruct(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x)])))

/** Five whole numbers with mean 7, median 5, range 12. Many answers exist. */
const fiveNumbers: ConstructAnswer = {
  type: 'construct',
  what: 'five whole numbers',
  slots: ['a', 'b', 'c', 'd', 'e'].map((k) => ({ key: k, label: k.toUpperCase() })),
  checks: [
    { kind: 'integer', of: ['a', 'b', 'c', 'd', 'e'], label: 'every value is a whole number' },
    { kind: 'stat', stat: 'mean', of: ['a', 'b', 'c', 'd', 'e'], cmp: '=', value: 7, label: 'the mean is 7' },
    { kind: 'stat', stat: 'median', of: ['a', 'b', 'c', 'd', 'e'], cmp: '=', value: 5, label: 'the median is 5' },
    { kind: 'stat', stat: 'range', of: ['a', 'b', 'c', 'd', 'e'], cmp: '=', value: 12, label: 'the range is 12' },
  ],
  witness: { a: 1, b: 4, c: 5, d: 12, e: 13 },
}

describe('summary statistics', () => {
  it('median handles even and odd counts', () => {
    expect(statOf('median', [1, 3, 5])).toBe(3)
    expect(statOf('median', [1, 3, 5, 9])).toBe(4)
  })
  it('is order-independent', () => {
    expect(statOf('range', [9, 1, 4])).toBe(8)
    expect(statOf('range', [1, 4, 9])).toBe(8)
  })
  it('spread is mean absolute deviation', () => {
    expect(statOf('spread', [2, 4, 6])).toBeCloseTo(4 / 3, 9)
  })
})

describe('constructed answers accept ANY object that satisfies the constraints', () => {
  it('accepts the generator witness', () => {
    expect(witnessSatisfies(fiveNumbers).ok).toBe(true)
    expect(gradeConstruct(fiveNumbers, witnessResponse(fiveNumbers)).ok).toBe(true)
  })

  it('accepts a completely different valid answer', () => {
    // 0, 3, 5, 12, 15 → mean 7, median 5, range 15. Not valid; find one that is.
    // 2, 3, 5, 10, 15 → mean 7, median 5, range 13. No.
    // 1, 2, 5, 13, 14 → sum 35, mean 7, median 5, range 13. No.
    // 0, 4, 5, 14, 12 → sum 35, mean 7, median 5, range 14. No.
    // 2, 4, 5, 10, 14 → sum 35, mean 7, median 5, range 12. Yes.
    const other = sub({ a: 2, b: 4, c: 5, d: 10, e: 14 })
    expect(other).not.toBe(witnessResponse(fiveNumbers))
    expect(gradeConstruct(fiveNumbers, other).ok).toBe(true)
  })

  it('accepts the same multiset in a different order', () => {
    expect(gradeConstruct(fiveNumbers, sub({ a: 13, b: 12, c: 5, d: 4, e: 1 })).ok).toBe(true)
  })

  it('rejects a near miss and says which constraint broke', () => {
    // mean 7 and range 12 hold; median is 6, not 5.
    const v = gradeConstruct(fiveNumbers, sub({ a: 1, b: 4, c: 6, d: 11, e: 13 }))
    expect(v.ok).toBe(false)
    expect(v.failed).toEqual([2])
    expect(v.score).toBeCloseTo(3 / 4, 9)
  })

  it('treats a blank box as a format problem, not a wrong answer', () => {
    const v = gradeConstruct(fiveNumbers, sub({ a: 1, b: 4, c: 5, d: 12, e: '' }))
    expect(v.ok).toBe(false)
    expect(v.formatError).toMatch(/Could not read/)
    expect(v.failed).toEqual([])
  })

  it('rejects a non-integer even when every statistic is right', () => {
    // 1, 4, 5, 12.5, 12.5 → mean 7, median 5, range 11.5. Use a set that keeps
    // the stats and breaks only wholeness: 0.5, 3.5, 5, 12.5, 13.5.
    const v = gradeConstruct(fiveNumbers, sub({ a: 0.5, b: 3.5, c: 5, d: 12.5, e: 13.5 }))
    expect(v.failed).toContain(0)
  })

  it('reads fractions in a box', () => {
    expect(gradeConstruct(fiveNumbers, sub({ a: '1/1', b: 4, c: 5, d: 12, e: 13 })).ok).toBe(true)
  })
})

describe('each constraint kind', () => {
  const V = { x: 3, y: 7, z: 7 }
  it('each', () => {
    expect(checkHolds({ kind: 'each', of: ['x', 'y'], cmp: '>', value: 2, label: '' }, V)).toBe(true)
    expect(checkHolds({ kind: 'each', of: ['x', 'y'], cmp: '>', value: 5, label: '' }, V)).toBe(false)
  })
  it('allDifferent', () => {
    expect(checkHolds({ kind: 'allDifferent', of: ['x', 'y'], label: '' }, V)).toBe(true)
    expect(checkHolds({ kind: 'allDifferent', of: ['y', 'z'], label: '' }, V)).toBe(false)
  })
  it('ordered', () => {
    expect(checkHolds({ kind: 'ordered', of: ['x', 'y'], dir: 'up', label: '' }, V)).toBe(true)
    expect(checkHolds({ kind: 'ordered', of: ['y', 'z'], dir: 'up', label: '' }, V)).toBe(false)
  })
  it('linear', () => {
    expect(checkHolds({ kind: 'linear', terms: { x: 2, y: 1 }, cmp: '=', value: 13, label: '' }, V)).toBe(true)
    expect(checkHolds({ kind: 'linear', terms: { x: 2, y: 1 }, cmp: '=', value: 14, label: '' }, V)).toBe(false)
  })
  it('relate compares two statistics of the same values', () => {
    // mean of (3,7,7) is 17/3 ≈ 5.67; median is 7. median = mean + 1.33.
    const of = ['x', 'y', 'z']
    expect(checkHolds({ kind: 'relate', left: 'median', right: 'mean', of, cmp: '>', by: 0, label: '' }, V)).toBe(true)
    expect(checkHolds({ kind: 'relate', left: 'median', right: 'mean', of, cmp: '<', by: 0, label: '' }, V)).toBe(false)
  })
  it('digits enforces the pool', () => {
    const pool = { kind: 'digits' as const, of: ['x', 'y'], digits: [3, 7, 9], use: 'atMostOnce' as const, label: '' }
    expect(checkHolds(pool, { x: 3, y: 7 })).toBe(true)
    expect(checkHolds(pool, { x: 3, y: 3 })).toBe(false) // 3 used twice, pool has one
    expect(checkHolds(pool, { x: 3, y: 4 })).toBe(false) // 4 is not in the pool
    expect(checkHolds({ ...pool, use: 'exactlyOnce' }, { x: 3, y: 7 })).toBe(false) // 9 unused
  })
  it('a missing slot fails rather than throwing', () => {
    expect(checkHolds({ kind: 'stat', stat: 'mean', of: ['x', 'nope'], cmp: '=', value: 3, label: '' }, V)).toBe(false)
  })
})

describe('the shared validator agrees', () => {
  it('routes construct through the same entry point', () => {
    expect(validate(fiveNumbers, witnessResponse(fiveNumbers))).toEqual({ ok: true, score: 1 })
  })
  it('the audit’s deliberately-wrong response really is wrong', () => {
    expect(validate(fiveNumbers, wrongResponse(fiveNumbers)).ok).toBe(false)
  })
  it('garbage is a format error, not a score', () => {
    expect(validate(fiveNumbers, 'not json').formatError).toBeTruthy()
  })
})

describe('the grader accepts a value however a person writes it', () => {
  // Optimised against FALSE NEGATIVES on purpose. The ladder blocks promotion
  // on unrepaired errors, so a grader that rejects a correct answer silently
  // parks a learner on a skill they already hold. These were the forms
  // docs/OPEN.md listed as rejected.
  const forms: [string, number][] = [
    ['2^3', 8],
    ['sqrt(9)', 3],
    ['12/4 + 1', 4],
    ['(3+5)/2', 4],
    ['½', 0.5],
    ['¾', 0.75],
    ['3 1/2', 3.5],
    ['50%', 50],
    ['+7', 7],
    [' 12 ', 12],
    ['2 × 3', 6],
    ['10 ÷ 4', 2.5],
    ['−5', -5],
    ['1,200', 1200],
    ['2**3', 8],
  ]
  for (const [text, value] of forms) {
    it(`reads ${JSON.stringify(text)} as ${value}`, () => {
      expect(parseExpression(text)).toBeCloseTo(value, 9)
    })
  }

  it('still refuses things that are not numbers', () => {
    for (const junk of ['', 'x', 'abc', '3 + ', '(3', 'sqrt', 'sqrt(-4)', '1/0', '3..4', 'drop table']) {
      expect(Number.isNaN(parseExpression(junk)), junk).toBe(true)
    }
  })

  it('a constructed answer written as an expression is accepted', () => {
    // 1, 4, 5, 12, 13 — the witness — written every which way.
    const sub = serializeConstruct({ a: '2-1', b: '8/2', c: 'sqrt(25)', d: '3*4', e: '10+3' })
    expect(gradeConstruct(fiveNumbers, sub).ok).toBe(true)
  })
})
