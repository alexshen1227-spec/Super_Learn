/**
 * The maths track has to actually decide something.
 *
 * It was a real setting with a real picker in Settings that changed WHICH
 * skills were in scope and had no say in how hard they should be, while the
 * two places that decide how high to aim both read the school year typed on
 * the first screen. For an accelerated learner those two numbers disagree, and
 * the app followed the less informative one.
 */
import { describe, expect, it } from 'vitest'
import { MATH_TRACKS } from '../content/tracks'
import { SKILL_BY_ID } from '../content/skills'
import { DEFAULT_GRADE, effectiveGrade, trackCeiling } from './effectiveGrade'
import { startPlacement, MATH_LADDER } from './placement'
import { initialState, type Profile } from '../domain/types'

const profile = (p: Partial<Profile>): Profile => ({ ...initialState().profile, ...p })

describe('effective grade', () => {
  it('falls back to the typed year, then to a default', () => {
    expect(effectiveGrade(profile({ gradeLevel: 6, mathTrack: null }))).toBe(6)
    expect(effectiveGrade(profile({ gradeLevel: null, mathTrack: null }))).toBe(DEFAULT_GRADE)
  })

  it('follows the chosen track over the typed year, in both directions', () => {
    // The case that motivated this: year 7, taking Algebra I.
    const accelerated = profile({ gradeLevel: 7, mathTrack: 'ca-78alg' })
    expect(effectiveGrade(accelerated)).toBeGreaterThan(7)
    // And the reverse: choosing a review track is an instruction too, not an
    // error to be corrected by the year they typed.
    const reviewing = profile({ gradeLevel: 11, mathTrack: 'ca-6' })
    expect(effectiveGrade(reviewing)).toBeLessThan(11)
  })

  it('is derived from what the track teaches, not a hand-written table', () => {
    for (const t of MATH_TRACKS) {
      const bands = t.units
        .flatMap((u) => u.skillIds)
        .map((id) => SKILL_BY_ID.get(id)?.gradeBand)
        .filter((b): b is number => typeof b === 'number')
      expect(trackCeiling(t.id), t.id).toBe(Math.max(...bands))
    }
  })

  it('ignores a track id that is not real', () => {
    expect(effectiveGrade(profile({ gradeLevel: 9, mathTrack: 'not-a-track' }))).toBe(9)
  })
})

describe('the reach cap no longer pins an accelerated learner below their own course', () => {
  it('every track can reach its own hardest material', () => {
    // The cap is min(skill.gradeBand, effectiveGrade + 1). If effectiveGrade
    // were the school year, a year-7 Algebra I learner capped at 8 while their
    // track teaches grade band 9 — the tie-break could never prefer the top of
    // the course they had chosen.
    const short: string[] = []
    for (const t of MATH_TRACKS) {
      const ceiling = trackCeiling(t.id)!
      const reachable = effectiveGrade(profile({ gradeLevel: 7, mathTrack: t.id })) + 1
      if (reachable < ceiling) short.push(`${t.id}: reach ${reachable} < track top ${ceiling}`)
    }
    expect(short, `tracks the learner cannot reach the top of: ${short.join('; ')}`).toEqual([])
  })
})

describe('placement starts where the learner actually is', () => {
  const at = (p: Partial<Profile>) => startPlacement(profile(p), 0).ladderIndex

  it('an accelerated learner is not made to climb from year-7 material', () => {
    const plain = at({ gradeLevel: 7, mathTrack: null })
    const algebra = at({ gradeLevel: 7, mathTrack: 'ca-78alg' })
    expect(algebra).toBeGreaterThan(plain)
  })

  it('a review track starts lower than the typed year would', () => {
    expect(at({ gradeLevel: 11, mathTrack: 'ca-6' })).toBeLessThan(at({ gradeLevel: 11, mathTrack: null }))
  })

  it('never walks off either end of the ladder', () => {
    for (const track of [null, ...MATH_TRACKS.map((t) => t.id)]) {
      for (const gradeLevel of [null, 5, 6, 7, 8, 9, 10, 11, 12]) {
        const i = at({ gradeLevel, mathTrack: track })
        expect(i, `${track}/${gradeLevel}`).toBeGreaterThanOrEqual(0)
        expect(i, `${track}/${gradeLevel}`).toBeLessThan(MATH_LADDER.length)
      }
    }
  })
})
