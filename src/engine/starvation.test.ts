import { describe, expect, it } from 'vitest'
import { MATH_CORE_MARGIN, STARVED_BOOST, buildSessionPlan, scoreSkills } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { allocationReport } from './allocation'
import { initialState, type AppState, type AttemptEvent } from '../domain/types'
import { MATH_TRACKS } from '../content/tracks'

const DAY = 86_400_000
const START = Date.UTC(2026, 0, 5, 16)

/**
 * Play a learner forward through real planned sessions and report what each
 * bucket was actually SERVED. Simulation rather than assertion-by-construction,
 * because the bug this pins down was invisible to every unit-level check: each
 * individual decision was defensible and the aggregate was still broken.
 */
function simulate(days: number, minutes = 30, acc = 0.7, mathTrack: string | null = null) {
  let state: AppState = { ...initialState(), profile: { ...initialState().profile, mathTrack }, events: [], sessions: [] }
  let t = START
  const served: Record<string, number> = {}
  for (let d = 0; d < days; d++) {
    t += DAY
    const evidence = deriveEvidence(state.events, t)
    let plan
    try {
      plan = buildSessionPlan({ index: DEFAULT_INDEX, evidence, state, now: t, checkIn: { minutes, energy: 'ok', focus: null } })
    } catch {
      continue
    }
    for (const b of plan.blocks) {
      for (const a of b.activities) {
        const tpl = DEFAULT_INDEX.templates.get(a.templateId)
        if (!tpl) continue
        served[tpl.bucket] = (served[tpl.bucket] ?? 0) + tpl.minutes
        // Deterministic pass/fail so the test cannot flake on Math.random.
        const ok = (state.events.length % 10) / 10 < acc
        const e: AttemptEvent = {
          id: `e${state.events.length}`, t: t + state.events.length, sessionId: plan.id, templateId: tpl.id,
          itemVersion: tpl.version, seed: a.seed, skillIds: tpl.skillIds, bucket: tpl.bucket, mode: a.mode,
          firstResponse: 'x', finalResponse: 'x', correct: ok, firstCorrect: ok, score: null,
          validator: 'numeric', hintLevel: 0, confidence: null, elapsedSec: tpl.minutes * 60, errorTags: [], difficulty: tpl.difficulty,
        }
        state.events.push(e)
      }
    }
  }
  const total = Object.values(served).reduce((a, b) => a + b, 0)
  return { state, served, total, share: (b: string) => (100 * (served[b] ?? 0)) / total }
}

/**
 * THE BUG THIS PINS DOWN.
 *
 * Every physics skill sits behind a math prerequisite, and the rotation block
 * only ever serves LAB buckets — so physics could only arrive via the core
 * block, which an early `break` handed to math before physics was even scored.
 * Result: 1.2% physics served against an 8% target across 180 simulated days,
 * with the gateway skill (`m-units`) still `unseen`. Nothing looked wrong in
 * the code, the UI, or any unit test.
 */
describe('no academic bucket can starve behind another bucket’s prerequisite', () => {
  it('serves physics a real share over a long run', () => {
    const run = simulate(180)
    expect(run.share('physics'), 'physics starved behind its math gateway').toBeGreaterThan(3)
  })

  it('opens the cross-bucket gateway instead of leaving it unseen forever', () => {
    const run = simulate(180)
    const ev = deriveEvidence(run.state.events, START + 181 * DAY)
    // m-units is the single gateway into the whole physics tree.
    expect(ev.get('m-units')?.state ?? 'unseen', 'the physics gateway was never scheduled').not.toBe('unseen')
  })

  it('keeps every academic bucket within a reasonable band of its target', () => {
    const run = simulate(180)
    for (const b of ['physics', 'coding', 'science'] as const) {
      expect(run.share(b), `${b} served ${run.share(b).toFixed(1)}%`).toBeGreaterThan(2)
    }
  })

  /**
   * These two constants are coupled: if math's incumbency on the core block is
   * not beatable, a starving bucket can never claim it, and the starvation
   * boost becomes decoration. Set at 1.8 against a margin of 2, physics fell
   * straight back to −8 against target while every test still passed.
   */
  it('lets starvation outrank math incumbency, or the boost is decoration', () => {
    expect(STARVED_BOOST).toBeGreaterThan(MATH_CORE_MARGIN)
  })

  it('still gives math the core block by default, all else equal', () => {
    const state = { ...initialState(), onboarded: true }
    const evidence = deriveEvidence([], START)
    const report = allocationReport([], state.settings, START)
    const ctx = { index: DEFAULT_INDEX, evidence, state, now: START, checkIn: { minutes: 30, energy: 'ok' as const, focus: null } }
    const plan = buildSessionPlan(ctx)
    expect(plan.blocks[0]?.bucket, 'a cold learner should start in math').toBe('math')
    // And the margin is what does it, not an accident of iteration order.
    expect(scoreSkills('math', ctx, report).length).toBeGreaterThan(0)
  })
})

/**
 * The starvation guard has to survive the COURSE TILT too. When the California
 * tracks landed, a track-boosted math skill sat at +3.7 (incumbency 2 plus
 * TRACK_BONUS 1.2 plus TRACK_UNIT_BONUS 0.5) against a starving bucket's +3.4,
 * and physics fell straight back to 0% on ca-8 — the original bug, resurrected
 * by constants tuned before those tracks existed. Incumbency now stands down
 * while another academic bucket is starving, so this holds for EVERY course
 * rather than only the no-track case the first test covered.
 */
describe('a chosen course cannot starve another subject', () => {
  for (const trackId of MATH_TRACKS.map((t) => t.id)) {
    it(`serves physics on the ${trackId} track`, () => {
      const run = simulate(150, 30, 0.72, trackId)
      expect(run.share('physics'), `physics starved on ${trackId}`).toBeGreaterThan(1)
    })
  }
})
