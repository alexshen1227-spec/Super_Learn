/**
 * Exploratory probe, not a gate. Finds where a five-year learner runs out of
 * app: which skills are never reached, which templates are worn out, whether
 * the review queue converges, and how the picture differs by session shape.
 *
 * Run: npm run sim
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type LearnerSpec } from './harness'

const FIVE_YEARS = 365 * 5

/** Steady improver: meets a skill cold at 45%, climbs with practice. */
const climbing = (ctx: { priorAttempts: number; difficulty: number }) =>
  Math.min(0.93, 0.5 + 0.1 * ctx.priorAttempts - 0.05 * (ctx.difficulty - 3))

const base: Omit<LearnerSpec, 'name' | 'daySessions' | 'goals' | 'seed'> = {
  p: climbing,
  hintRate: () => 0.15,
  mathTrack: 'ca-8',
  grade: 8,
}

const SPECS: LearnerSpec[] = [
  { ...base, name: '30m daily', goals: [], seed: 1, daySessions: () => [30] },
  { ...base, name: '10m daily', goals: [], seed: 2, daySessions: () => [10] },
  { ...base, name: '45m daily', goals: [], seed: 3, daySessions: () => [45] },
  {
    ...base,
    name: '3 x 20m daily',
    goals: [],
    seed: 4,
    daySessions: () => [20, 20, 20],
  },
  {
    ...base,
    name: '30m, weekends off, occasional week away',
    goals: [],
    seed: 5,
    daySessions: (d, rand) => {
      const dow = (d + 1) % 7
      if (dow === 0 || dow === 6) return []
      if (Math.floor(d / 7) % 13 === 12) return []
      return rand() < 0.1 ? [] : [30]
    },
  },
  {
    ...base,
    name: '30m daily, all-in on chess',
    goals: ['Improve at chess'],
    seed: 6,
    daySessions: () => [30],
  },
]

describe('five years of use', () => {
  it('reports where the app runs out', () => {
    const out = SPECS.map((s) => {
      const started = process.hrtime.bigint()
      const r = simulate(s, FIVE_YEARS)
      const secs = Number(process.hrtime.bigint() - started) / 1e9
      return { ...r, wallSeconds: Math.round(secs) }
    })
    writeFileSync('sim-explore.json', JSON.stringify(out, null, 1))
  })
})
