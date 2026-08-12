/**
 * Does the reasoning goal actually DO anything?
 *
 * A goal that is collected and read by nothing is worse than not asking, and
 * this app has made that mistake before. The bucket tilt is easy to verify;
 * the harder claim is the one this goal alone makes — that it favours SPECIFIC
 * skills, the handful with measured carry-over, rather than whole areas.
 *
 * So this runs the same learner twice, changing only the goal, and compares
 * minutes spent on the named skills against minutes spent on their unnamed
 * neighbours in the very same buckets. If the goal worked, the named skills
 * gain and the neighbours do not lose their floor.
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type AttemptContext, type LearnerSpec } from './harness'
import { goalSkillIds } from '../engine/goals'
import { SKILL_BY_ID } from '../content/skills'

const REASONING = 'Everyday reasoning & judgement'
const climbing = (c: AttemptContext) => Math.min(0.93, 0.5 + 0.1 * c.priorAttempts - 0.05 * (c.difficulty - 3))

function learner(name: string, goals: string[]): LearnerSpec {
  return { name, seed: 77, p: climbing, hintRate: () => 0.15, daySessions: () => [30], goals, mathTrack: 'ca-8', grade: 8 }
}

describe('the reasoning goal', () => {
  const named = goalSkillIds([REASONING])
  // The buckets the named skills live in, so the comparison is like-for-like:
  // a named skill should beat its NEIGHBOURS, not merely beat mathematics.
  const buckets = new Set([...named].map((id) => SKILL_BY_ID.get(id)?.bucket))
  const neighbours = [...SKILL_BY_ID.values()]
    .filter((s) => buckets.has(s.bucket) && !named.has(s.id))
    .map((s) => s.id)

  const YEAR = 365
  const off = simulate(learner('no goal', []), YEAR)
  const on = simulate(learner('reasoning goal', [REASONING]), YEAR)

  const sum = (m: Record<string, number>, ids: Iterable<string>) => {
    let t = 0
    for (const id of ids) t += m[id] ?? 0
    return t
  }

  it('spends measurably more time on the skills it names', () => {
    const before = sum(off.skillMinutes, named)
    const after = sum(on.skillMinutes, named)
    writeFileSync(
      'sim-goaleffect.json',
      JSON.stringify(
        {
          namedMinutes: { off: before, on: after },
          neighbourMinutes: { off: sum(off.skillMinutes, neighbours), on: sum(on.skillMinutes, neighbours) },
          perSkill: [...named]
            .map((id) => ({
              id,
              name: SKILL_BY_ID.get(id)?.name ?? id,
              bucket: SKILL_BY_ID.get(id)?.bucket,
              off: Math.round(off.skillMinutes[id] ?? 0),
              on: Math.round(on.skillMinutes[id] ?? 0),
              firstDayOff: off.firstReachedDay[id] ?? null,
              firstDayOn: on.firstReachedDay[id] ?? null,
            }))
            .sort((a, b) => b.on - b.off - (a.on - a.off)),
          totalMinutes: { off: off.focusedMinutes, on: on.focusedMinutes },
        },
        null,
        1,
      ),
    )
    // A real, visible shift — not a rounding difference.
    expect(after / before, 'the goal barely moved time toward the skills it names').toBeGreaterThan(1.15)
  })

  it('reaches the named skills sooner', () => {
    const reached = [...named].filter((id) => on.firstReachedDay[id] !== undefined && off.firstReachedDay[id] !== undefined)
    const sooner = reached.filter((id) => on.firstReachedDay[id]! < off.firstReachedDay[id]!).length
    const later = reached.filter((id) => on.firstReachedDay[id]! > off.firstReachedDay[id]!).length
    expect(sooner, `named skills reached sooner (${sooner}) should beat later (${later})`).toBeGreaterThan(later)
  })

  it('is a tilt and not a filter — nothing gets erased', () => {
    // The founding brief is explicit that urgent work must never permanently
    // erase the rest of the plan. Every bucket must still be taught.
    for (const [bucket, share] of Object.entries(on.share)) {
      expect(share, `${bucket} was erased by a goal`).toBeGreaterThan(1.5)
    }
    // And the unnamed neighbours must not collapse.
    const ratio = sum(on.skillMinutes, neighbours) / sum(off.skillMinutes, neighbours)
    expect(ratio, 'unnamed skills in the same buckets collapsed').toBeGreaterThan(0.7)
  })
})
