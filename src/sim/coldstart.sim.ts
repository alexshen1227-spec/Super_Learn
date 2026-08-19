/**
 * The first fortnight, day by day.
 *
 * Every other sim in this directory reports multi-year aggregates, and the
 * one defect they structurally cannot see is the OPENING: OPEN.md measured a
 * fresh 25-minute learner receiving 7-8 maths items out of 10 on each of days
 * one to three, because every balancing mechanism keys off DEBT and no debt
 * exists until ~60 minutes of history. The app introduces itself as ten areas
 * and then spends the first three days on one of them.
 *
 * This sim makes that visible per day, so the cold-start behaviour has a gate
 * of its own instead of living in a chat scrollback.
 */
import { describe, expect, it } from 'vitest'
import { simulate, type LearnerSpec } from './harness'
import { DEFAULT_INDEX } from '../content/registry'

const DAY = 86_400_000
const START = Date.UTC(2026, 0, 5, 16)

function freshLearner(minutes: number, track: string | null): LearnerSpec {
  return {
    name: `fresh ${minutes}m${track ? ` on ${track}` : ''}`,
    // A middling-plausible new user: mostly right, occasionally hinted.
    p: () => 0.7,
    hintRate: () => 0.1,
    daySessions: () => [minutes],
    goals: [],
    mathTrack: track,
    grade: 7,
    seed: 11,
  }
}

interface DayMix {
  items: number
  perBucket: Record<string, number>
  buckets: number
}

function dayMix(events: { t: number; bucket: string }[], days: number): DayMix[] {
  const out: DayMix[] = []
  for (let d = 0; d < days; d++) {
    const dayEvents = events.filter((e) => e.t >= START + d * DAY && e.t < START + (d + 1) * DAY)
    const perBucket: Record<string, number> = {}
    for (const e of dayEvents) perBucket[e.bucket] = (perBucket[e.bucket] ?? 0) + 1
    out.push({ items: dayEvents.length, perBucket, buckets: Object.keys(perBucket).length })
  }
  return out
}

function fmt(mix: DayMix[]): string {
  return mix
    .map((m, i) => {
      const parts = Object.entries(m.perBucket)
        .sort((a, b) => b[1] - a[1])
        .map(([b, n]) => `${b}:${n}`)
        .join(' ')
      return `  day ${i + 1}: ${m.items} items across ${m.buckets} areas — ${parts}`
    })
    .join('\n')
}

describe('the first fortnight', () => {
  it('does not open as a single-subject app', () => {
    for (const track of [null, 'ca-7']) {
      const r = simulate(freshLearner(25, track), 14)
      const mix = dayMix(r.eventsForExport, 14)

      console.log(`\n[coldstart] ${r.name}`)
      console.log(fmt(mix.slice(0, 7)))
      const week1Buckets = new Set(
        r.eventsForExport.filter((e) => e.t < START + 7 * DAY).map((e) => e.bucket),
      )
      console.log(`  areas met in week 1: ${week1Buckets.size} of 10`)

      for (let d = 0; d < 3; d++) {
        const m = mix[d]
        if (!m.items) continue
        const maths = m.perBucket['math'] ?? 0
        /*
         * The line being held: no single area may be more than 60% of any of
         * the learner's first three days. Maths may still LEAD — its skills
         * gate physics and the chosen course tilts toward it, and both of
         * those are correct — but 7 or 8 items in 10 is not a lead, it is the
         * whole day, and the app promised ten areas on the previous screen.
         */
        expect(maths / m.items, `${r.name} day ${d + 1}: ${maths}/${m.items} maths`).toBeLessThanOrEqual(0.6)
        // A day must touch at least three distinct areas.
        expect(m.buckets, `${r.name} day ${d + 1} touched ${m.buckets} areas`).toBeGreaterThanOrEqual(3)
      }

      // Breadth must not be bought with shorter sessions: the plan still has
      // to fill the chosen length. Sessions are ~10 items at 25 minutes.
      for (let d = 0; d < 3; d++) {
        expect(mix[d].items, `${r.name} day ${d + 1} items`).toBeGreaterThanOrEqual(8)
      }

      // And it must not be bought with easier mathematics for a learner the
      // placement has never seen: the conservative first-session cap is 3,
      // so the maths served should still average solidly above floor level.
      const week1MathDiff = r.eventsForExport
        .filter((e) => e.t < START + 7 * DAY && e.bucket === 'math')
        .map((e) => e.difficulty)
      const meanMath = week1MathDiff.reduce((a, b) => a + b, 0) / Math.max(1, week1MathDiff.length)
      console.log(`  week-1 maths difficulty: mean ${meanMath.toFixed(2)} over ${week1MathDiff.length} items`)
      expect(meanMath).toBeGreaterThanOrEqual(1.5)

      void DEFAULT_INDEX
    }
  })
})
