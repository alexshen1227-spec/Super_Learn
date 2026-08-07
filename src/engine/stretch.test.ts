import { describe, expect, it } from 'vitest'
import { MIN_SAMPLE, stretchSignal } from './stretch'
import { targetDifficulty } from './planner'
import type { AttemptEvent, SkillEvidence } from '../domain/types'

const NOW = Date.UTC(2026, 7, 8, 12)
const DAY = 86_400_000
let n = 0
const at = (correct: boolean, over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `s${n++}`, t: NOW - DAY, sessionId: 's', templateId: `t${n}`, itemVersion: 1, seed: n,
  skillIds: ['sk'], bucket: 'math', mode: 'independent', firstResponse: 'x', finalResponse: 'x',
  correct, firstCorrect: correct, score: null, validator: 'numeric', hintLevel: 0,
  confidence: null, elapsedSec: 40, errorTags: [], difficulty: 3, ...over,
})
const run = (hits: number, misses: number, over: Partial<AttemptEvent> = {}) => [
  ...Array.from({ length: hits }, () => at(true, over)),
  ...Array.from({ length: misses }, () => at(false, over)),
]

const base: SkillEvidence = {
  skillId: 'sk', state: 'guided', bestState: 'guided', recentMisses: 0,
} as unknown as SkillEvidence

describe('the stretch signal refuses to speak too early', () => {
  it('says nothing below the minimum sample', () => {
    const s = stretchSignal(run(MIN_SAMPLE - 1, 0), NOW)
    expect(s.accuracy).toBeNull()
    expect(s.adjust).toBe(0)
    expect(s.why).toBeNull()
  })

  it('ignores hinted work and placement entirely', () => {
    // 20 perfect attempts that should not count: all hinted or placement.
    const noisy = [...run(10, 0, { hintLevel: 2 }), ...run(10, 0, { mode: 'placement' })]
    expect(stretchSignal(noisy, NOW).accuracy).toBeNull()
  })

  it('ignores attempts older than the lookback window', () => {
    const stale = run(20, 0, { t: NOW - 60 * DAY })
    expect(stretchSignal(stale, NOW).accuracy).toBeNull()
  })
})

describe('the stretch signal moves in both directions', () => {
  it('pushes up when the learner is cruising', () => {
    const s = stretchSignal(run(19, 1), NOW)
    expect(s.accuracy).toBeGreaterThan(0.9)
    expect(s.adjust).toBeGreaterThan(0)
    expect(s.why).toMatch(/steps up/)
  })

  it('holds in the productive middle', () => {
    const s = stretchSignal(run(14, 6), NOW) // 70%
    expect(s.adjust).toBe(0)
    expect(s.why).toMatch(/holds/)
  })

  it('eases when the work is beyond reach', () => {
    const s = stretchSignal(run(5, 15), NOW) // 25%
    expect(s.adjust).toBeLessThan(0)
    expect(s.why).toMatch(/too hard/)
  })
})

/**
 * The bug this whole mechanism exists for: a 120-day simulation had a learner
 * at ~95% first-try accuracy still being served difficulty 2.4 in week 17,
 * identical to week 3. Difficulty could not rise, because nothing was watching.
 */
describe('difficulty actually responds', () => {
  it('a cruising learner is asked for harder work on the same evidence', () => {
    const flat = targetDifficulty(base, 'ok', false, undefined, 0)
    const cruising = targetDifficulty(base, 'ok', false, undefined, stretchSignal(run(19, 1), NOW).adjust)
    expect(cruising).toBeGreaterThan(flat)
  })

  it('a struggling learner is asked for easier work', () => {
    const flat = targetDifficulty(base, 'ok', false, undefined, 0)
    const struggling = targetDifficulty(base, 'ok', false, undefined, stretchSignal(run(5, 15), NOW).adjust)
    expect(struggling).toBeLessThan(flat)
  })

  it('recent misses on THIS skill still pull down while cruising elsewhere', () => {
    const cruisingAdjust = stretchSignal(run(19, 1), NOW).adjust
    const struggling = { ...base, recentMisses: 3 } as SkillEvidence
    expect(targetDifficulty(struggling, 'ok', false, undefined, cruisingAdjust)).toBeLessThan(
      targetDifficulty(base, 'ok', false, undefined, cruisingAdjust),
    )
  })

  it('never exceeds the difficulty scale in either direction', () => {
    const top = { ...base, state: 'transferred' } as SkillEvidence
    expect(targetDifficulty(top, 'high', false, 'strong', 1.5)).toBeLessThanOrEqual(5)
    const bottom = { ...base, state: 'unseen', recentMisses: 5 } as SkillEvidence
    expect(targetDifficulty(bottom, 'low', false, undefined, -1)).toBeGreaterThanOrEqual(1)
  })
})
