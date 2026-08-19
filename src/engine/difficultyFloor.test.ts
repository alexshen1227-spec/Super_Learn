import { describe, expect, it } from 'vitest'
import { buildSessionPlan, targetDifficulty } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { initialState, type AppState, type SkillEvidence } from '../domain/types'

const NOW = Date.UTC(2026, 7, 7, 12)

const base: SkillEvidence = {
  skillId: 'x', state: 'unseen', bestState: 'unseen', exposure: 0, guidedSuccesses: 0,
  independentForms: 0, independentAt: null, retainedAt: null, transferredAt: null,
  lastCorrectAt: null, due: null, needsReview: false, recentMisses: 0, hintDependence: 0,
  attempts: 0, blockedByMisconception: false, misconceptionAt: null, reviewSuccesses: 0,
  lapses: 0, intervalIndex: 0, forms: [],
} as unknown as SkillEvidence

function strongMathState(): AppState {
  const mathSkills = DEFAULT_INDEX.skillList.filter((s) => s.bucket === 'math').map((s) => s.id)
  return {
    ...initialState(),
    onboarded: true,
    placement: {
      completedAt: NOW - 3_600_000,
      minutes: 15,
      signals: mathSkills.map((skillId) => ({ skillId, signal: 'strong' as const, fromManual: false })),
      measuredSkillIds: mathSkills,
      unmeasuredNote: '',
      summary: [],
    },
  }
}

function planFor(state: AppState) {
  return buildSessionPlan({
    index: DEFAULT_INDEX,
    evidence: deriveEvidence([], NOW),
    state,
    now: NOW,
    checkIn: { minutes: 30, energy: 'ok', focus: null },
  })
}

/**
 * Reported from real use: "the sessions are too easy... if you wanna learn the
 * problems must be challenging (especially the math ones)".
 */
describe('a strong placement starts the learner high', () => {
  it('raises the difficulty floor for skills practice has not contradicted', () => {
    expect(targetDifficulty(base, 'ok', false)).toBeLessThan(2)
    expect(targetDifficulty(base, 'ok', false, 'strong')).toBeGreaterThanOrEqual(3)
    expect(targetDifficulty(base, 'ok', false, 'ok')).toBeGreaterThanOrEqual(2.5)
    // ...but never above what real evidence would justify once it exists.
    const independent = { ...base, state: 'independent' } as SkillEvidence
    expect(targetDifficulty(independent, 'ok', false, 'strong')).toBe(3)
  })

  it('does not park the frontier on material placement already cleared', () => {
    const cold = planFor({ ...initialState(), onboarded: true })
    const strong = planFor(strongMathState())
    /*
     * MATHS items only, because that is what this test is actually about: the
     * fixture marks every MATHS skill 'strong' and asks that the frontier not
     * park on material placement already cleared.
     *
     * It used to average the WHOLE plan, which conflates the claim with the
     * lab rotation — and a rotation item's difficulty is aimed at ITS OWN
     * skill, so being strong at maths correctly does not make an Observer
     * question harder. Averaging them together meant any change to the
     * breadth/core balance moved this number for reasons that have nothing to
     * do with the frontier. Narrowed to the subject; the canary below proves
     * it still catches the thing it was written for.
     */
    const mathMeanOf = (plan: ReturnType<typeof planFor>) => {
      const d = plan.blocks
        .flatMap((b) => b.activities)
        .map((a) => DEFAULT_INDEX.templates.get(a.templateId))
        .filter((t): t is NonNullable<typeof t> => Boolean(t) && t!.bucket === 'math')
        .map((t) => t.difficulty as number)
      return d.reduce((x, y) => x + y, 0) / Math.max(1, d.length)
    }
    expect(mathMeanOf(strong)).toBeGreaterThan(mathMeanOf(cold))
  })

  it('never fills a block with clones of one question family', () => {
    for (const state of [{ ...initialState(), onboarded: true }, strongMathState()]) {
      const plan = planFor(state)
      for (const block of plan.blocks) {
        const counts = new Map<string, number>()
        for (const a of block.activities) counts.set(a.templateId, (counts.get(a.templateId) ?? 0) + 1)
        for (const [templateId, n] of counts) {
          expect(n, `${block.label}: ${templateId} appears ${n} times`).toBeLessThanOrEqual(2)
        }
      }
    }
  })
})

describe('rust easing: the aim stops trusting stale evidence', () => {
  const DAY = 86_400_000
  const NOW2 = Date.UTC(2026, 7, 7, 12)
  const retained = (idleDays: number): SkillEvidence =>
    ({
      ...base,
      state: 'retained',
      lastAttemptAt: NOW2 - idleDays * DAY,
      lastCorrectAt: NOW2 - idleDays * DAY,
    }) as SkillEvidence

  it('recent practice keeps the full aim', () => {
    expect(targetDifficulty(retained(2), 'ok', false, undefined, 0, NOW2)).toBe(4)
    // Ordinary review spacing (under three weeks) is not rust.
    expect(targetDifficulty(retained(20), 'ok', false, undefined, 0, NOW2)).toBe(4)
  })

  it('a long-idle skill comes back a notch easier, bounded at one star', () => {
    const nineWeeks = targetDifficulty(retained(63), 'ok', false, undefined, 0, NOW2)
    expect(nineWeeks).toBe(3)
    // The ease is bounded: a year idle is not harder-eased than nine weeks.
    expect(targetDifficulty(retained(365), 'ok', false, undefined, 0, NOW2)).toBe(3)
    // And it ramps rather than cliffs.
    const sixWeeks = targetDifficulty(retained(42), 'ok', false, undefined, 0, NOW2)
    expect(sixWeeks).toBeGreaterThan(3)
    expect(sixWeeks).toBeLessThan(4)
  })

  it('without a clock the behavior is exactly the old one', () => {
    expect(targetDifficulty(retained(365), 'ok', false)).toBe(4)
  })

  it('an unseen skill is untouched — there is nothing to be rusty at', () => {
    expect(targetDifficulty(base, 'ok', false, undefined, 0, NOW2)).toBeLessThan(2)
  })
})
