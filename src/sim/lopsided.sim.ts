/**
 * Does the difficulty dial aim correctly at a LOPSIDED learner?
 *
 * Every learner spec written before this one was uniformly able: one accuracy
 * across all ten areas. That is the single case where a global difficulty
 * signal cannot be caught being wrong, and it is not what real learners look
 * like — this app's owner is a strong maths student who has never touched
 * formal logic.
 *
 * `stretchSignal` reads unaided first-try accuracy over the last 25 graded
 * attempts across EVERY area and returns one adjustment, which `buildSessionPlan`
 * then applies to every block. So a learner at 92% in mathematics and 40% in
 * physics produces a blend near 70% — a number that describes neither area, and
 * that leaves the easy area easy and the hard area hard.
 *
 * This measures the size of that mis-aim rather than asserting it. If per-area
 * accuracy comes out close to the global figure the fix is not worth building.
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type AttemptContext, type LearnerSpec } from './harness'
import { stretchSignal } from '../engine/stretch'
import { BUCKETS } from '../domain/types'
import { DEFAULT_INDEX } from '../content/registry'

/** Areas this learner finds easy; everything else is hard for them. */
const STRONG = new Set(['math', 'physics', 'coding', 'science'])

/**
 * A learner who is genuinely good at the academic side and genuinely lost on
 * the reasoning side.
 *
 * The first version of this function set a low BASE for the weak areas and let
 * the usual `+0.04 * priorAttempts` improvement term run — which after a few
 * dozen repetitions put the "weak" areas at 92%, higher than some strong ones.
 * The probe then reported no lopsidedness at all, because there was none: the
 * model had quietly cured the learner. A per-area weakness has to be expressed
 * as a lower CEILING and slower growth, not just a lower starting point.
 */
const lopsided = (c: AttemptContext): number => {
  const strong = STRONG.has(c.bucket)
  const base = strong ? 0.84 : 0.3
  const growth = strong ? 0.03 : 0.012
  const ceiling = strong ? 0.97 : 0.55
  return Math.max(0.05, Math.min(ceiling, base + growth * c.priorAttempts - 0.07 * (c.difficulty - 3)))
}

/** The control: the same overall ability, spread evenly. */
const even = (c: AttemptContext): number =>
  Math.max(0.05, Math.min(0.8, 0.6 + 0.02 * c.priorAttempts - 0.07 * (c.difficulty - 3)))

function learner(name: string, p: (c: AttemptContext) => number): LearnerSpec {
  return {
    name,
    seed: 4242,
    p,
    hintRate: () => 0.12,
    daySessions: () => [30],
    goals: [],
    mathTrack: 'ca-8',
    grade: 8,
  }
}

describe('the difficulty dial on a lopsided learner', () => {
  const DAYS = 120
  const report: string[] = []

  it('reports how far the one global signal sits from each area it is aimed at', () => {
    const run = simulate(learner('lopsided', lopsided), DAYS)
    const events = run.eventsForExport
    const now = events[events.length - 1]!.t

    const global = stretchSignal(events, now)

    // Per-area accuracy over the same window rule the global signal uses.
    const perArea = new Map<string, { n: number; acc: number }>()
    for (const b of BUCKETS) {
      const mine = events.filter((e) => e.bucket === b.id)
      const s = stretchSignal(mine, now)
      if (s.accuracy !== null) perArea.set(b.id, { n: s.n, acc: s.accuracy })
    }

    const rows = [...perArea.entries()]
      .map(([id, v]) => ({ id, ...v, gap: Math.abs(v.acc - (global.accuracy ?? 0)) }))
      .sort((a, b) => b.gap - a.gap)

    report.push(
      `\nlopsided learner, ${DAYS} days, ${run.attempts} attempts\n` +
        `global signal: ${global.accuracy === null ? 'none' : `${Math.round(global.accuracy * 100)}%`}` +
        ` on n=${global.n}, adjust ${global.adjust >= 0 ? '+' : ''}${global.adjust}\n` +
        rows
          .map(
            (r) =>
              `  ${r.id.padEnd(12)} ${String(Math.round(r.acc * 100)).padStart(3)}%  n=${String(r.n).padStart(2)}` +
              `  off by ${String(Math.round(r.gap * 100)).padStart(2)} points` +
              `  ${STRONG.has(r.id) ? '(strong)' : '(weak)'}`,
          )
          .join('\n'),
    )

    // The number that decides whether this is worth fixing: how many areas the
    // one global figure misdescribes badly enough to point the dial the wrong
    // way. The signal's own bands are 0.90 / 0.82 / 0.50 / 0.35, so a 15-point
    // error can cross two of them.
    const misaimed = rows.filter((r) => r.gap >= 0.15)
    report.push(
      `  → ${misaimed.length} of ${rows.length} areas are 15+ points from the global figure` +
        ` (worst ${Math.round((rows[0]?.gap ?? 0) * 100)})`,
    )

    // The constraint any fix has to survive: how much evidence each area
    // actually has. A per-area signal that goes silent for most of the app is
    // not an improvement on a blend.
    const counts = BUCKETS.map((b) => {
      const mine = events.filter(
        (e) => e.bucket === b.id && e.mode !== 'placement' && e.hintLevel === 0 && e.firstCorrect !== null,
      )
      const recent = mine.filter((e) => e.t >= now - 21 * 86_400_000)
      return { id: b.id, all: mine.length, recent: recent.length }
    }).sort((a, b) => b.recent - a.recent)
    report.push(
      `\nunaided graded attempts per area (21-day window / all ${DAYS} days):\n` +
        counts.map((c) => `  ${c.id.padEnd(12)} ${String(c.recent).padStart(3)} / ${c.all}`).join('\n') +
        `\n  → ${counts.filter((c) => c.recent >= 12).length} of 10 areas clear the 12-sample floor in 21 days` +
        `; ${counts.filter((c) => c.all >= 12).length} of 10 clear it over the whole run`,
    )

    // What the dial is FOR: strong areas should be served harder work than
    // weak ones. Under a single global figure they are served the same.
    const diff = new Map<string, { n: number; sum: number }>()
    for (const e of events) {
      const t = DEFAULT_INDEX.templates.get(e.templateId)
      if (!t) continue
      const row = diff.get(e.bucket) ?? { n: 0, sum: 0 }
      row.n += 1
      row.sum += t.difficulty
      diff.set(e.bucket, row)
    }
    const served = [...diff.entries()]
      .map(([id, v]) => ({ id, mean: v.sum / v.n, n: v.n, strong: STRONG.has(id) }))
      .sort((a, b) => b.mean - a.mean)
    const meanOf = (strong: boolean) => {
      const rows = served.filter((r) => r.strong === strong)
      return rows.reduce((acc, r) => acc + r.mean * r.n, 0) / rows.reduce((acc, r) => acc + r.n, 0)
    }
    report.push(
      `\nmean difficulty served per area:\n` +
        served
          .map(
            (r) =>
              `  ${r.id.padEnd(12)} ${r.mean.toFixed(2)}★  over ${String(r.n).padStart(3)} items` +
              `  ${r.strong ? '(strong)' : '(weak)'}`,
          )
          .join('\n') +
        `\n  strong areas ${meanOf(true).toFixed(2)}★  vs  weak areas ${meanOf(false).toFixed(2)}★` +
        `  → separation ${(meanOf(true) - meanOf(false)).toFixed(2)}★`,
    )

    expect(rows.length).toBeGreaterThan(1)
  })

  it('shows the control learner does NOT trigger it, so the probe is measuring lopsidedness', () => {
    const run = simulate(learner('even', even), DAYS)
    const events = run.eventsForExport
    const now = events[events.length - 1]!.t
    const global = stretchSignal(events, now)

    const gaps: number[] = []
    for (const b of BUCKETS) {
      const s = stretchSignal(
        events.filter((e) => e.bucket === b.id),
        now,
      )
      if (s.accuracy !== null) gaps.push(Math.abs(s.accuracy - (global.accuracy ?? 0)))
    }
    const worst = Math.max(...gaps)

    // The canary. This learner has NO real strong/weak divide — the same
    // ability everywhere by construction — so any difficulty separation the
    // dial produces here is noise being amplified into the plan. Split them
    // the same arbitrary way the lopsided learner is split, which for this
    // learner means nothing at all.
    const diff = new Map<string, { n: number; sum: number }>()
    for (const e of events) {
      const t = DEFAULT_INDEX.templates.get(e.templateId)
      if (!t) continue
      const row = diff.get(e.bucket) ?? { n: 0, sum: 0 }
      row.n += 1
      row.sum += t.difficulty
      diff.set(e.bucket, row)
    }
    const meanOf = (strong: boolean) => {
      const rows = [...diff.entries()].filter(([id]) => STRONG.has(id) === strong)
      const n = rows.reduce((acc, [, v]) => acc + v.n, 0)
      return rows.reduce((acc, [, v]) => acc + v.sum, 0) / n
    }
    const spurious = meanOf(true) - meanOf(false)
    report.push(
      `\neven learner: global ${Math.round((global.accuracy ?? 0) * 100)}%,` +
        ` worst area gap ${Math.round(worst * 100)} points across ${gaps.length} areas with enough samples\n` +
        `  spurious difficulty separation: ${spurious.toFixed(2)}★` +
        ` (should be near zero — this learner has no real divide)`,
    )
    expect(gaps.length).toBeGreaterThan(0)
  })

  it('writes the report', () => {
    writeFileSync('sim-lopsided.txt', `${report.join('\n')}\n`)
    expect(report.length).toBeGreaterThan(0)
  })
})
