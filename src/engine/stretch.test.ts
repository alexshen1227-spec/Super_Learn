import { describe, expect, it } from 'vitest'
import { areaStretch, MIN_SAMPLE, stretchSignal } from './stretch'
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

describe('the per-area dial', () => {
  /*
   * Mathematics at 90%, physics at 20%, INTERLEAVED.
   *
   * The order matters and the first version of this fixture got it wrong: the
   * global signal reads the last 25 events, so appending one area after the
   * other put a single area in the whole window and the "global" figure was
   * really that area's. Alternating is also what a real log looks like, since
   * a session mixes areas.
   */
  const interleave = (a: AttemptEvent[], b: AttemptEvent[]): AttemptEvent[] => {
    const out: AttemptEvent[] = []
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i]) out.push(a[i])
      if (b[i]) out.push(b[i])
    }
    return out
  }
  const lopsided = interleave(
    // Unbroken in mathematics. Shrinkage pulls this down toward the global
    // figure, so anything less than emphatic does not clear a band and the
    // test would be measuring the prior rather than the signal.
    Array.from({ length: 30 }, () => at(true, { bucket: 'math' })),
    // 20% correct in physics: one hit every five.
    Array.from({ length: 30 }, (_, i) => at(i % 5 === 0, { bucket: 'physics' })),
  )

  it('stays silent whenever the global signal is silent', () => {
    const thin = run(3, 1, { bucket: 'math' })
    const dial = areaStretch(thin, NOW)
    expect(stretchSignal(thin, NOW).accuracy, 'fixture should be under the global floor').toBeNull()
    expect(dial('math').adjust).toBe(0)
    expect(dial('math').why).toBeNull()
  })

  it('pulls a strong area up and a weak one down from the same log', () => {
    const dial = areaStretch(lopsided, NOW)
    const global = stretchSignal(lopsided, NOW)
    expect(dial('math').adjust).toBeGreaterThan(global.adjust)
    expect(dial('physics').adjust).toBeLessThan(global.adjust)
    // Each area's sentence names itself, or the plan could not explain why one
    // block got harder while another got easier.
    expect(dial('math').why).toContain('mathematics')
    expect(dial('physics').why).toContain('physics')
  })

  it('falls back to the global figure for an area with too little of its own', () => {
    const dial = areaStretch(lopsided, NOW)
    const global = stretchSignal(lopsided, NOW)
    // Nothing at all in coding.
    expect(dial('coding')).toEqual(global)
    // A handful is still not enough to speak on its own. Note the global
    // figure has to be recomputed from the SAME log: appending events moves
    // the 25-attempt window, so comparing against the other log's figure would
    // be testing the fixture rather than the fallback.
    const withTrace = interleave(lopsided, Array.from({ length: 3 }, () => at(false, { bucket: 'coding' })))
    expect(areaStretch(withTrace, NOW)('coding')).toEqual(stretchSignal(withTrace, NOW))
  })

  it('shrinks a thin area toward the global figure rather than believing it', () => {
    // Eight misses in a row in coding. Believed raw that is 0%, the hardest
    // easing there is; shrunk toward a strong global figure it is milder.
    const events = interleave(lopsided, Array.from({ length: 8 }, () => at(false, { bucket: 'coding' })))
    const dial = areaStretch(events, NOW)
    const global = stretchSignal(events, NOW)
    const coding = dial('coding')
    // Believed raw, eight misses is 0%. Shrunk toward the global figure it sits
    // strictly between the two — pulled down, but not all the way.
    expect(coding.accuracy!).toBeGreaterThan(0)
    expect(coding.accuracy!).toBeLessThan(global.accuracy!)
  })

  it('does not let a first meeting be made harder by success elsewhere', () => {
    const unseen = { ...base, state: 'unseen', ability: null } as unknown as SkillEvidence
    const seen = { ...base, state: 'independent', ability: null } as unknown as SkillEvidence
    const flat = targetDifficulty(unseen, 'ok', false, undefined, 0)
    const pushed = targetDifficulty(unseen, 'ok', false, undefined, 1.5)
    expect(pushed, 'a brand-new skill must not arrive harder because another area is going well').toBe(flat)
    // Easing still reaches it, and an established skill still moves both ways.
    expect(targetDifficulty(unseen, 'ok', false, undefined, -1)).toBeLessThan(flat)
    expect(targetDifficulty(seen, 'ok', false, undefined, 1.5)).toBeGreaterThan(
      targetDifficulty(seen, 'ok', false, undefined, 0),
    )
  })
})
