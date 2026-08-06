import { describe, expect, it } from 'vitest'
import { parseNumeric, validate, correctResponse, wrongResponse } from './validate'
import type { AnswerSpec } from '../domain/types'

describe('parseNumeric', () => {
  it('reads plain, fraction, mixed, comma, percent forms', () => {
    expect(parseNumeric('12')).toBe(12)
    expect(parseNumeric(' -3.5 ')).toBe(-3.5)
    expect(parseNumeric('3/4')).toBe(0.75)
    expect(parseNumeric('-3/4')).toBe(-0.75)
    expect(parseNumeric('2 1/2')).toBe(2.5)
    expect(parseNumeric('-2 1/2')).toBe(-2.5)
    expect(parseNumeric('1,200')).toBe(1200)
    expect(parseNumeric('45%')).toBe(45)
    expect(parseNumeric('.5')).toBe(0.5)
  })
  it('rejects junk and zero denominators', () => {
    expect(parseNumeric('abc')).toBeNaN()
    expect(parseNumeric('1/0')).toBeNaN()
    expect(parseNumeric('')).toBeNaN()
    expect(parseNumeric('1 + 2')).toBeNaN()
  })
})

describe('numeric validation', () => {
  const spec: AnswerSpec = { type: 'numeric', answer: 0.75 }
  it('accepts equivalent forms', () => {
    expect(validate(spec, '0.75').ok).toBe(true)
    expect(validate(spec, '3/4').ok).toBe(true)
    expect(validate(spec, '75/100').ok).toBe(true)
    expect(validate(spec, ' .75 ').ok).toBe(true)
  })
  it('rejects wrong values and reports format errors', () => {
    expect(validate(spec, '0.76').ok).toBe(false)
    expect(validate(spec, 'seven').formatError).toBeTruthy()
  })
  it('honors explicit tolerance only', () => {
    const tol: AnswerSpec = { type: 'numeric', answer: 31.4, tolerance: 0.15 }
    expect(validate(tol, '31.4').ok).toBe(true)
    expect(validate(tol, '31.5').ok).toBe(true)
    expect(validate(tol, '31.6').ok).toBe(false)
  })
  it('accepts repeating-decimal fraction entry for exact thirds', () => {
    const third: AnswerSpec = { type: 'numeric', answer: 1 / 3 }
    expect(validate(third, '1/3').ok).toBe(true)
    expect(validate(third, '0.3333').ok).toBe(false) // not equal; fraction entry is the way
  })
})

describe('fraction validation', () => {
  const spec: AnswerSpec = { type: 'fraction', n: 2, d: 3 }
  it('accepts any equivalent form', () => {
    expect(validate(spec, '2/3').ok).toBe(true)
    expect(validate(spec, '4/6').ok).toBe(true)
    expect(validate(spec, '-4/-6').ok).toBe(true)
  })
  it('rejects non-equivalent and malformed', () => {
    expect(validate(spec, '3/4').ok).toBe(false)
    expect(validate(spec, '2/0').ok).toBe(false)
    expect(validate(spec, '0.667').ok).toBe(false)
  })
  it('can require lowest terms', () => {
    const low: AnswerSpec = { type: 'fraction', n: 2, d: 3, requireLowest: true }
    const v = validate(low, '4/6')
    expect(v.ok).toBe(false)
    expect(v.formatError).toContain('lowest')
  })
  it('accepts whole numbers for integral fractions', () => {
    const whole: AnswerSpec = { type: 'fraction', n: 3, d: 1 }
    expect(validate(whole, '3').ok).toBe(true)
  })
})

describe('text/mcq/multi/order/classify/rubric', () => {
  it('normalizes text', () => {
    const spec: AnswerSpec = { type: 'text', accept: ['Back rank'] }
    expect(validate(spec, '  back-rank!').ok).toBe(false) // hyphen differs
    expect(validate(spec, ' BACK   RANK ').ok).toBe(true)
  })
  it('validates the rest via canonical responses', () => {
    const specs: AnswerSpec[] = [
      { type: 'mcq', options: ['a', 'b', 'c'], correct: 1 },
      { type: 'multi', options: ['a', 'b', 'c', 'd'], correct: [0, 2] },
      { type: 'order', options: ['x', 'y', 'z'], correct: [2, 0, 1] },
      {
        type: 'classify',
        categories: ['A', 'B'],
        statements: [
          { text: 's1', category: 0 },
          { text: 's2', category: 1 },
        ],
      },
    ]
    for (const s of specs) {
      expect(validate(s, correctResponse(s)).ok).toBe(true)
      expect(validate(s, wrongResponse(s)).ok).toBe(false)
    }
  })
  it('a blank response never grades as option 0 (exam-blank regression)', () => {
    const s: AnswerSpec = { type: 'mcq', options: ['right', 'wrong'], correct: 0 }
    expect(validate(s, '').ok).toBe(false)
    expect(validate(s, '  ').ok).toBe(false)
    expect(validate(s, '0').ok).toBe(true)
  })
  it('multi ignores order and duplicates', () => {
    const s: AnswerSpec = { type: 'multi', options: ['a', 'b', 'c'], correct: [2, 0] }
    expect(validate(s, '0,2').ok).toBe(true)
    expect(validate(s, '2,0,0').ok).toBe(true)
    expect(validate(s, '0').ok).toBe(false)
  })
  it('classify grants partial credit but ok only when perfect', () => {
    const s: AnswerSpec = {
      type: 'classify',
      categories: ['A', 'B'],
      statements: [
        { text: '1', category: 0 },
        { text: '2', category: 0 },
        { text: '3', category: 1 },
        { text: '4', category: 1 },
      ],
    }
    const half = validate(s, '0,0,0,0')
    expect(half.ok).toBe(false)
    expect(half.score).toBe(0.5)
  })
  it('rubric self-score maps to fraction of criteria', () => {
    const s: AnswerSpec = { type: 'rubric', criteria: ['a', 'b', 'c', 'd'], model: 'm' }
    expect(validate(s, '0,1,2,3').score).toBe(1)
    expect(validate(s, '0,1,2').ok).toBe(true) // 0.75 passes
    expect(validate(s, '0').ok).toBe(false)
  })
})
