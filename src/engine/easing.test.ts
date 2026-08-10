/**
 * THE BUG THIS PINS DOWN — the difficulty dial could not lower the difficulty.
 *
 * `stretchSignal` reads recent unaided accuracy and asks for easier work when a
 * learner is over their head. It was asking, and nothing was answering.
 *
 * Simulated over a year with a learner whose accuracy RESPONDS to difficulty
 * (the fixed-accuracy harnesses elsewhere cannot see this, because in them the
 * dial has no effect by construction): a struggling learner sat at **14-19%
 * first-try accuracy for twelve straight months** while the signal reported its
 * maximum easing every single month, and the mean difficulty actually served
 * **rose** from 2.6 to 2.9. The core block computed a target of 2.06★ and was
 * handed 2.8★.
 *
 * Two causes, both fixed:
 *
 *  1. `dailyTemplateScore` penalised easier-than-target at 2.6 per star and
 *     harder-than-target at only 1.4 — a deliberate lean toward productive
 *     difficulty that is exactly wrong for someone drowning. A two-star
 *     overshoot cost 2.8 while an unseen family was worth +3.25 of coverage
 *     debt, so novelty out-bid appropriateness.
 *  2. Forty-four of 122 skills had no task easier than 3★ and fourteen started
 *     at 4★, so on those skills there was nothing easier to serve at all. That
 *     half is gated in `contentAudit.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import { buildSessionPlan, targetDifficulty } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { stretchSignal } from './stretch'
import { dailyTemplateScore } from './plannerPolicy'
import { mulberry32 } from './rng'
import { initialState, type AppState, type AttemptEvent, type ItemTemplate, type SessionRecord, type SkillEvidence } from '../domain/types'

const DAY = 86_400_000
const START = Date.UTC(2026, 0, 5, 16)

/** A learner who gets easier work right and harder work wrong. */
function simulate(ability: number, days: number) {
  const base = initialState()
  const state: AppState = { ...base, onboarded: true, events: [], sessions: [] }
  const rng = mulberry32(4242)
  let t = START
  let diffSum = 0
  let diffN = 0
  let hits = 0
  for (let d = 0; d < days; d++) {
    t += DAY
    const evidence = deriveEvidence(state.events, t)
    let plan
    try {
      plan = buildSessionPlan({ index: DEFAULT_INDEX, evidence, state, now: t, checkIn: { minutes: 30, energy: 'ok', focus: null } })
    } catch { continue }
    for (const b of plan.blocks) for (const a of b.activities) {
      const tpl = DEFAULT_INDEX.templates.get(a.templateId)
      if (!tpl) continue
      const ok = rng() < 1 / (1 + Math.exp(-(ability - tpl.difficulty) * 1.1))
      if (ok) hits++
      // Only the second half is measured: the first months are the learner
      // arriving at their level, not the steady state the dial is judged on.
      if (d >= days / 2) { diffSum += tpl.difficulty; diffN++ }
      state.events.push({
        id: `e${state.events.length}`, t: t + state.events.length, sessionId: plan.id, templateId: tpl.id,
        itemVersion: tpl.version, seed: a.seed, skillIds: tpl.skillIds, bucket: tpl.bucket, mode: a.mode,
        firstResponse: 'x', finalResponse: 'x', correct: ok, firstCorrect: ok, score: null,
        validator: 'numeric', hintLevel: 0, confidence: null, elapsedSec: tpl.minutes * 60,
        errorTags: [], difficulty: tpl.difficulty,
      } as AttemptEvent)
    }
    state.sessions.push({
      id: plan.id, startedAt: t, endedAt: t, activeMinutes: 30,
      checkIn: { minutes: 30, energy: 'ok', focus: null }, attempts: 0, correctFirst: 0,
      bucketMinutes: {}, learned: [], exitPrinciple: null, interrupted: false,
    } as SessionRecord)
  }
  return {
    meanDifficulty: diffSum / Math.max(1, diffN),
    accuracy: hits / Math.max(1, state.events.length),
    adjust: stretchSignal(state.events, t).adjust,
  }
}

describe('the difficulty dial can actually lower the difficulty', () => {
  it('serves a struggling learner easier work than a strong one', () => {
    const weak = simulate(1.0, 180)
    const strong = simulate(4.0, 180)
    expect(weak.adjust, 'the signal should be asking for easier work').toBeLessThan(0)
    expect(
      weak.meanDifficulty,
      `struggling learner served ${weak.meanDifficulty.toFixed(2)}★ vs strong learner ${strong.meanDifficulty.toFixed(2)}★`,
    ).toBeLessThan(strong.meanDifficulty - 0.5)
    // Pre-fix this sat at 2.9 and rose over the year while the dial asked for 1.
    expect(weak.meanDifficulty, `struggling learner still served ${weak.meanDifficulty.toFixed(2)}★`).toBeLessThan(2.75)
  })

  it('flips the mismatch penalty rather than merely shrinking it', () => {
    const tpl = (difficulty: 1 | 2 | 3 | 4 | 5): ItemTemplate =>
      ({ id: `t${difficulty}`, version: 1, kind: 'single', name: '', skillIds: [], bucket: 'math', difficulty, variants: 4, minutes: 2, provenance: '', generate: () => ({}) as never })
    // Same distance from the target in both directions, so only the LEAN is
    // being measured and not the size of the gap.
    const want = 2
    const seen = { lifetime: 3, recent: 0, daysSince: 30 }
    const normalHard = dailyTemplateScore(tpl(3), want, seen, false, false)
    const normalEasy = dailyTemplateScore(tpl(1), want, seen, false, false)
    expect(normalHard, 'normally the lean is toward productive difficulty').toBeGreaterThan(normalEasy)
    const easingHard = dailyTemplateScore(tpl(3), want, seen, false, true)
    const easingEasy = dailyTemplateScore(tpl(1), want, seen, false, true)
    expect(easingEasy, 'while easing the lean must reverse, not merely soften').toBeGreaterThan(easingHard)
  })

  it('does not make an unseen hard item beat an appropriate one while easing', () => {
    const tpl = (difficulty: 1 | 2 | 3 | 4 | 5): ItemTemplate =>
      ({ id: `t${difficulty}`, version: 1, kind: 'single', name: '', skillIds: [], bucket: 'math', difficulty, variants: 4, minutes: 2, provenance: '', generate: () => ({}) as never })
    // The exact shape that defeated the dial: a brand-new 4★ carrying the full
    // +3.25 unseen-coverage bonus, against a right-level 2★ the learner met a
    // week ago, when the target is 2.
    const unseenHard = dailyTemplateScore(tpl(4), 2, undefined, false, true)
    const rightLevel = dailyTemplateScore(tpl(2), 2, { lifetime: 10, recent: 0, daysSince: 7 }, false, true)
    expect(rightLevel, 'coverage debt must not out-bid appropriateness while easing').toBeGreaterThan(unseenHard)
    // …and under the normal lean it genuinely did, which is the regression.
    const unseenHardNormal = dailyTemplateScore(tpl(4), 2, undefined, false, false)
    const rightLevelNormal = dailyTemplateScore(tpl(2), 2, { lifetime: 10, recent: 0, daysSince: 7 }, false, false)
    expect(unseenHardNormal, 'documents the old behaviour this replaced').toBeGreaterThan(rightLevelNormal)
  })
})

/**
 * ABILITY, not rung, decides what problem comes next.
 *
 * The evidence ladder answers "what has this learner PROVED?" and was doing
 * double duty as "what should they get next" — a five-value lookup that cannot
 * tell a learner who is Retained on a skill and comfortable there from one who
 * is Retained and still failing its hard items.
 *
 * `mastery.ts` now fits a logistic ability per skill from unaided outcomes at
 * known difficulties (the model AoPS Alcumus uses), and the planner targets the
 * difficulty that learner clears about 60% of the time. Measured over simulated
 * years at five ability levels, second-half first-try accuracy rose at every
 * one — 19/34/46/59/77% to 22/42/55/66/77% — and coverage rose with it rather
 * than being traded away (see RESEARCH.md §37).
 */
describe('the planner aims at what the learner can currently do', () => {
  const base = (over: Partial<SkillEvidence> = {}): SkillEvidence => ({
    skillId: 's', state: 'retained', bestState: 'retained', needsReview: false, exposure: 10,
    guidedSuccesses: 0, independentForms: ['a', 'b'], retainedAt: 1, transferredAt: null,
    transferCrossed: null, lastCorrectAt: 1, lastAttemptAt: 1, lastOutcomeCorrect: true,
    recentMisses: 0, blockedByMisconception: false, hintDependence: null,
    ability: null, abilitySamples: 0, review: null, forms: [], attempts: 10, ...over,
  })

  it('separates two learners the rung cannot tell apart', () => {
    // Both Retained. One is comfortable at 4-star work, one is not.
    const strong = targetDifficulty(base({ ability: 4.5, abilitySamples: 20 }), 'ok', false)
    const shaky = targetDifficulty(base({ ability: 1.8, abilitySamples: 20 }), 'ok', false)
    expect(strong, 'a strong learner on a Retained skill should be stretched').toBeGreaterThan(shaky + 1)
    // The rung alone gives both of them exactly the same number.
    const rungOnly = targetDifficulty(base(), 'ok', false)
    expect(rungOnly, 'rung fallback still applies when ability has no samples').toBe(4)
  })

  it('refuses to use an ability estimate built from too little', () => {
    // Below the sample floor `mastery.ts` reports null, and the rung takes over.
    expect(targetDifficulty(base({ ability: null, abilitySamples: 2 }), 'ok', false)).toBe(4)
  })

  it('never lets a missing or broken estimate produce NaN', () => {
    // A SkillEvidence from an older cached shape or a hand-built fixture can
    // carry `undefined` here; `difficultyForRate(undefined)` is NaN, and NaN
    // silently loses every difficulty comparison downstream.
    for (const bad of [undefined, Number.NaN, Number.POSITIVE_INFINITY] as unknown[]) {
      const d = targetDifficulty(base({ ability: bad as number }), 'ok', false)
      expect(Number.isFinite(d), `ability=${String(bad)} produced ${d}`).toBe(true)
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(5)
    }
  })
})
