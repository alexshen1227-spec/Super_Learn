import { describe, expect, it } from 'vitest'
import { buildExtensionBlock, buildSessionPlan, SESSION_GRACE_MIN } from './planner'
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
