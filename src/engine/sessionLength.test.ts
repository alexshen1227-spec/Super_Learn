import { describe, expect, it } from 'vitest'
import { buildExtensionBlock, buildSessionPlan, estimatedPlanMinutes, reviewsPerSession, SESSION_GRACE_MIN } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { initialState, type AppState, type CheckIn } from '../domain/types'

const NOW = Date.UTC(2026, 7, 7, 12)

function ctxFor(minutes: number) {
  const state: AppState = { ...initialState(), onboarded: true }
  const checkIn: CheckIn = { minutes, energy: 'ok', focus: null }
  return { index: DEFAULT_INDEX, evidence: deriveEvidence([], NOW), state, now: NOW, checkIn }
}

/**
 * Planned minutes are per-item ESTIMATES, so a session could exhaust a "30
 * minute" plan in a fraction of that and end early. A chosen dose should be
 * the dose actually served.
 */
describe('a session runs to the length that was chosen', () => {
  it('tops up when the plan ran short', () => {
    const ctx = ctxFor(30)
    const plan = buildSessionPlan(ctx)
    const extra = buildExtensionBlock(ctx, plan, 12)
    expect(extra, 'eighteen minutes short should be topped up').toBeTruthy()
    expect(extra!.activities.length).toBeGreaterThan(0)
    expect(extra!.why).toMatch(/30 minutes/)
  })

  it('stops once inside the grace window rather than padding forever', () => {
    const ctx = ctxFor(30)
    const plan = buildSessionPlan(ctx)
    expect(buildExtensionBlock(ctx, plan, 30 - SESSION_GRACE_MIN)).toBeNull()
    expect(buildExtensionBlock(ctx, plan, 30)).toBeNull()
    expect(buildExtensionBlock(ctx, plan, 44)).toBeNull()
  })

  it('never overshoots the far edge of the window', () => {
    const ctx = ctxFor(30)
    const plan = buildSessionPlan(ctx)
    const elapsed = 20
    const extra = buildExtensionBlock(ctx, plan, elapsed)
    expect(extra).toBeTruthy()
    // 10 minutes remain; the block may not plan more than 10 + grace.
    expect(extra!.minutes).toBeLessThanOrEqual(10 + SESSION_GRACE_MIN)
  })

  it('never repeats a question the session already served', () => {
    const ctx = ctxFor(30)
    const plan = buildSessionPlan(ctx)
    const served = new Set<string>()
    plan.blocks.forEach((b) => b.activities.forEach((a) => served.add(`${a.templateId}:${a.seed}`)))
    const servedTemplates = new Set(plan.blocks.flatMap((b) => b.activities.map((a) => a.templateId)))

    const extra = buildExtensionBlock(ctx, plan, 10)
    expect(extra).toBeTruthy()
    for (const a of extra!.activities) {
      expect(served.has(`${a.templateId}:${a.seed}`), `${a.templateId} form repeated`).toBe(false)
      expect(servedTemplates.has(a.templateId), `${a.templateId} family repeated`).toBe(false)
    }
  })

  /**
   * THE OTHER DIRECTION, which nothing tested.
   *
   * Every test above checks that a short plan gets topped up. None checked that
   * a plan respects the ceiling, and it did not: a ten-minute session was
   * planned at 15.1 minutes on 99% of days, and a twenty-minute one overran on
   * 38%. Three separate causes, all arithmetic:
   *
   *  - `coreBudget` on a short session did not subtract `labBudget`, while the
   *    comment beside `labBudget` claimed it did;
   *  - the warm-up tested its budget BEFORE adding an item, so it could always
   *    overshoot by one whole item;
   *  - the every-third-session "explain it back" exit costs 4 minutes but was
   *    chosen after the rest of the plan had been sized against a guess of 2.
   *
   * A learner who picks ten minutes has ten minutes. Overrunning them by half
   * is the "just one more" pattern the founding brief rules out, and it lands
   * hardest on the person with the least time.
   */
  it('never plans more than the chosen length plus the grace window', () => {
    for (const minutes of [10, 20, 25, 30, 45] as const) {
      const base = initialState()
      const state: AppState = { ...base, onboarded: true, profile: { ...base.profile, sessionMinutes: minutes } }
      // Walk several sessions so the every-third-session exit is included.
      for (let session = 0; session < 6; session++) {
        const withHistory: AppState = { ...state, sessions: Array.from({ length: session }, () => ({}) as never) }
        const plan = buildSessionPlan({
          index: DEFAULT_INDEX,
          evidence: deriveEvidence([], NOW),
          state: withHistory,
          now: NOW,
          checkIn: { minutes, energy: 'ok', focus: null },
        })
        const planned = estimatedPlanMinutes(plan)
        expect(
          planned,
          `${minutes}-minute session #${session + 1} planned ${planned} minutes: ` +
            plan.blocks.map((b) => `${b.kind}=${b.minutes}`).join(' + '),
        ).toBeLessThanOrEqual(minutes + SESSION_GRACE_MIN)
      }
    }
  })

  it('does not open brand-new material at the end of a session', () => {
    const ctx = ctxFor(30)
    const plan = buildSessionPlan(ctx)
    const extra = buildExtensionBlock(ctx, plan, 10)
    expect(extra).toBeTruthy()
    // With no evidence at all, candidates can only come from skills this
    // session already touched — never a cold-start skill.
    const touched = new Set(
      plan.blocks.flatMap((b) =>
        b.activities.flatMap((a) => DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? []),
      ),
    )
    for (const a of extra!.activities) {
      const skills = DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? []
      expect(skills.some((s) => touched.has(s)), `${a.templateId} is unrelated to this session`).toBe(true)
    }
  })
})

/**
 * The Today screen states how many reviews a session will take, so that number
 * has to be the planner's own — a second copy of the rule would drift, and the
 * whole point is that the figure shown is true.
 *
 * Why it is shown at all: §32c stabilised the review queue at roughly forty for
 * a learner who owns a lot of skills. Printed as a bare count that is a wall no
 * session can clear, which reads as falling behind — the manufactured urgency
 * the founding brief rules out, arrived at by accident.
 */
describe('the reviews-per-session figure the learner is shown', () => {
  it('widens under pressure and never exceeds what a warm-up can hold', () => {
    // A short session takes fewer, whatever the queue.
    expect(reviewsPerSession(0, 10)).toBe(2)
    expect(reviewsPerSession(80, 10)).toBe(2)
    // A normal session takes more once the queue is genuinely long.
    expect(reviewsPerSession(0, 30)).toBe(3)
    expect(reviewsPerSession(5, 30)).toBe(3)
    expect(reviewsPerSession(40, 30)).toBe(5)
    // Monotonic, and bounded — a longer queue never makes the session shorter,
    // and never turns the whole session into review.
    let previous = 0
    for (const due of [0, 5, 10, 14, 15, 20, 40, 200]) {
      const n = reviewsPerSession(due, 30)
      expect(n, `queue ${due} served fewer than a shorter queue`).toBeGreaterThanOrEqual(previous)
      expect(n, `queue ${due} would take over the session`).toBeLessThanOrEqual(5)
      previous = n
    }
  })

  it('the triage line is only ever shown when it is true', () => {
    // Today renders "today takes the N most urgent" only while `due > N`.
    // Mirroring that guard here is what stops the screen ever claiming to take
    // five when three are waiting — the figure itself is allowed to exceed a
    // short queue, the SENTENCE is not.
    for (const due of [0, 1, 2, 3, 4, 6, 12, 30, 80]) {
      const n = reviewsPerSession(due, 30)
      const shown = due > n
      if (shown) {
        expect(n, `with ${due} due the line would claim ${n}`).toBeLessThan(due)
        expect(n, 'the line must name a real number of reviews').toBeGreaterThan(0)
      }
    }
  })
})
