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
    const meanOf = (plan: ReturnType<typeof planFor>) => {
      const d: number[] = plan.blocks.flatMap((b) =>
        b.activities.map((a) => (DEFAULT_INDEX.templates.get(a.templateId)?.difficulty ?? 0) as number),
      )
      return d.reduce((x: number, y: number) => x + y, 0) / Math.max(1, d.length)
    }
    expect(meanOf(strong)).toBeGreaterThan(meanOf(cold))
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
