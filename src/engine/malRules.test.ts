import { describe, expect, it } from 'vitest'
import { MIN_ERRORS, MIN_OCCURRENCES, malRuleProfile } from './malRules'
import type { AttemptEvent, ErrorTag } from '../domain/types'

const NOW = Date.UTC(2026, 7, 9, 12)
let n = 0
const miss = (tags: ErrorTag[], over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `e${n++}`,
  t: NOW - 86_400_000 + n * 60_000,
  sessionId: 's',
  templateId: 'tpl',
  itemVersion: 1,
  seed: n,
  skillIds: ['m-lineqmulti'],
  bucket: 'math',
  mode: 'independent',
  firstResponse: 'x',
  finalResponse: 'x',
  correct: false,
  firstCorrect: false,
  score: null,
  validator: 'numeric',
  hintLevel: 0,
  confidence: null,
  elapsedSec: 60,
  errorTags: tags,
  difficulty: 3,
  ...over,
})

describe('the mal-rule profile refuses to name a habit from noise', () => {
  it('says nothing below the minimum evidence', () => {
    const p = malRuleProfile(Array.from({ length: MIN_ERRORS - 1 }, () => miss(['slip'])), NOW)
    expect(p.rules).toEqual([])
    expect(p.summary).toMatch(/Not enough yet/)
  })

  it('names a pattern once it genuinely recurs', () => {
    const p = malRuleProfile(Array.from({ length: MIN_ERRORS + 2 }, () => miss(['misread'])), NOW)
    expect(p.rules.length).toBe(1)
    expect(p.rules[0].tag).toBe('misread')
    expect(p.rules[0].count).toBe(MIN_ERRORS + 2)
    expect(p.rules[0].share).toBeCloseTo(1)
  })

  it('will not promote a rare cause just because the list is short', () => {
    // Nine slips and one lone misread: the misread is not a habit.
    const events = [...Array.from({ length: 9 }, () => miss(['slip'])), miss(['misread'])]
    const p = malRuleProfile(events, NOW)
    expect(p.rules.map((r) => r.tag)).toEqual(['slip'])
  })

  it('stays silent when errors are scattered across causes', () => {
    const events: AttemptEvent[] = [
      ...Array.from({ length: 2 }, () => miss(['slip'])),
      ...Array.from({ length: 2 }, () => miss(['misread'])),
      ...Array.from({ length: 2 }, () => miss(['concept'])),
      ...Array.from({ length: 2 }, () => miss(['strategy'])),
      ...Array.from({ length: 2 }, () => miss(['representation'])),
    ]
    const p = malRuleProfile(events, NOW)
    // Each cause is 20% but only 2 occurrences — under MIN_OCCURRENCES.
    expect(MIN_OCCURRENCES).toBeGreaterThan(2)
    expect(p.rules).toEqual([])
    expect(p.summary).toMatch(/none recurring enough/)
  })

  it('counts untagged misses separately instead of guessing a cause', () => {
    const events = [...Array.from({ length: MIN_ERRORS }, () => miss(['slip'])), miss([]), miss(['unknown'])]
    const p = malRuleProfile(events, NOW)
    expect(p.untagged).toBe(2)
    expect(p.tagged).toBe(MIN_ERRORS)
    expect(p.summary).toMatch(/no cause recorded/)
  })

  it('reports where the pattern actually happens', () => {
    const events = [
      ...Array.from({ length: 6 }, () => miss(['slip'], { skillIds: ['m-fractions'] })),
      ...Array.from({ length: 3 }, () => miss(['slip'], { skillIds: ['m-percent'] })),
    ]
    const p = malRuleProfile(events, NOW)
    expect(p.rules[0].topSkillIds[0]).toBe('m-fractions')
  })

  it('ignores placement and correct attempts', () => {
    const events = [
      ...Array.from({ length: MIN_ERRORS }, () => miss(['slip'], { mode: 'placement' })),
      ...Array.from({ length: 4 }, () => miss(['slip'], { firstCorrect: true, correct: true })),
    ]
    const p = malRuleProfile(events, NOW)
    expect(p.tagged).toBe(0)
    expect(p.rules).toEqual([])
  })

  it('gives every named pattern a repair that is not just "practise more"', () => {
    const p = malRuleProfile(Array.from({ length: 10 }, () => miss(['strategy'])), NOW)
    expect(p.rules[0].repair.length).toBeGreaterThan(20)
    expect(p.rules[0].repair.toLowerCase()).not.toMatch(/practise more|practice more/)
  })
})
