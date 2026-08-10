/**
 * The explain-back retention check has to rotate.
 *
 * It used to pick the OLDEST RETAINED skill, and explaining a skill does not
 * change when it was retained — so the oldest retained skill stayed the oldest
 * retained skill and was picked every third session forever. Measured over a
 * simulated year, a learner at 30-60% accuracy met the same explain-back 89
 * times while the other 50 eligible skills were never checked once.
 */
import { describe, expect, it } from 'vitest'
import { lastExplainedAt, pickExplainTarget } from '../content/items/methodDrills'
import { buildSessionPlan } from './planner'
import { deriveEvidence } from './mastery'
import { DEFAULT_INDEX } from '../content/registry'
import { initialState, type AppState, type AttemptEvent, type SessionRecord, type SkillEvidence } from '../domain/types'

const DAY = 86_400_000

function retained(skillId: string, retainedAt: number): SkillEvidence {
  return {
    skillId,
    state: 'retained',
    retainedAt,
    independentForms: [],
    guidedForms: [],
    attempts: 0,
    firstCorrect: 0,
    lastAttemptAt: retainedAt,
    needsReview: false,
    blockedByMisconception: false,
    ability: null,
    abilitySamples: 0,
  } as unknown as SkillEvidence
}

describe('picking a skill to explain back', () => {
  // Real ids that qualify as explain targets (concept card + probes exist).
  const a = 'm-fractions'
  const b = 'm-percent'
  const c = 'm-ratio'

  it('falls back to oldest-retained when nothing has been explained yet', () => {
    const ev = new Map([
      [a, retained(a, 300)],
      [b, retained(b, 100)],
      [c, retained(c, 200)],
    ])
    expect(pickExplainTarget(ev, new Map())).toBe(b)
  })

  /** The defect, stated directly. */
  it('does not pick the same skill again once it has been explained', () => {
    const ev = new Map([
      [a, retained(a, 300)],
      [b, retained(b, 100)],
      [c, retained(c, 200)],
    ])
    const first = pickExplainTarget(ev, new Map())!
    const second = pickExplainTarget(ev, new Map([[first, 5_000]]))
    expect(second).not.toBe(first)
  })

  it('works around the whole set before repeating any of it', () => {
    const ev = new Map([
      [a, retained(a, 300)],
      [b, retained(b, 100)],
      [c, retained(c, 200)],
    ])
    const explained = new Map<string, number>()
    const order: string[] = []
    for (let i = 0; i < 3; i++) {
      const pick = pickExplainTarget(ev, explained)!
      order.push(pick)
      explained.set(pick, 1000 + i)
    }
    expect(new Set(order).size, `rotated through ${order.join(' → ')}`).toBe(3)
    // Fourth time round returns to the one explained longest ago.
    expect(pickExplainTarget(ev, explained)).toBe(order[0])
  })

  it('reads the target from the event, not from the seed', () => {
    const events = [
      { templateId: 'x-explain-back', t: 10, aboutSkillIds: [a] },
      { templateId: 'x-explain-back', t: 40, aboutSkillIds: [a] },
      { templateId: 'int-ops', t: 99, aboutSkillIds: [b] },
    ] as unknown as AttemptEvent[]
    const map = lastExplainedAt(events)
    expect(map.get(a)).toBe(40)
    expect(map.has(b), 'only explain-back events count').toBe(false)
  })
})

/**
 * The aggregate claim, simulated: over a year the retention check must reach
 * many skills rather than hammering one.
 */
describe('over a simulated year', () => {
  it('spreads the retention check across many skills', () => {
    const state: AppState = { ...initialState(), onboarded: true }
    let t = Date.UTC(2026, 0, 5, 16)
    const targets = new Set<string>()
    let servings = 0
    for (let d = 0; d < 300; d++) {
      t += DAY
      let plan
      try {
        plan = buildSessionPlan({
          index: DEFAULT_INDEX,
          evidence: deriveEvidence(state.events, t),
          state,
          now: t,
          checkIn: { minutes: 30, energy: 'ok', focus: null },
        })
      } catch {
        continue
      }
      for (const block of plan.blocks) {
        for (const act of block.activities) {
          const tpl = DEFAULT_INDEX.templates.get(act.templateId)
          if (!tpl) continue
          const item = tpl.generate(act.seed)
          if (tpl.id === 'x-explain-back') {
            servings++
            for (const id of item.extraSkillIds ?? []) targets.add(id)
          }
          const ok = (state.events.length % 10) / 10 < 0.6
          state.events.push({
            id: `e${state.events.length}`,
            t: t + state.events.length,
            sessionId: plan.id,
            templateId: tpl.id,
            itemVersion: tpl.version,
            seed: act.seed,
            skillIds: tpl.skillIds,
            bucket: tpl.bucket,
            ...(item.extraSkillIds?.length ? { aboutSkillIds: item.extraSkillIds } : {}),
            mode: act.mode,
            firstResponse: 'x',
            finalResponse: 'x',
            correct: ok,
            firstCorrect: ok,
            score: null,
            validator: 'numeric',
            hintLevel: 0,
            confidence: null,
            elapsedSec: tpl.minutes * 60,
            errorTags: [],
            difficulty: tpl.difficulty,
          } as AttemptEvent)
        }
      }
      state.sessions.push({
        id: plan.id,
        startedAt: t,
        endedAt: t,
        activeMinutes: 30,
        checkIn: { minutes: 30, energy: 'ok', focus: null },
        attempts: 0,
        correctFirst: 0,
        bucketMinutes: {},
        learned: [],
        exitPrinciple: null,
        interrupted: false,
      } as SessionRecord)
    }
    expect(servings, 'the explain-back never ran').toBeGreaterThan(20)
    // Before the fix this was exactly 1, whatever the number of servings.
    // Measured after: 73 servings reaching 26 distinct skills.
    expect(targets.size, `only reached ${targets.size} skill(s) across ${servings} servings`).toBeGreaterThanOrEqual(8)
  }, 120_000)
})
