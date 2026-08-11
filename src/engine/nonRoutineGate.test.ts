/**
 * Who gets a non-routine problem.
 *
 * A construction item states a goal and makes the learner search for something
 * that meets it. That is productive once there is any foothold on the skill and
 * counter-productive with none — unassisted discovery is the one instructional
 * move with a clearly negative effect size (Alfieri et al. 2011, d = −0.38
 * unassisted against +0.30 assisted; RESEARCH.md §14).
 *
 * This was not reasoned out in advance. Adding seven construction items broke
 * `difficultyFloor`: a COLD learner started receiving difficulty-4 and -5
 * constructions and out-scored the strong-placement learner on mean difficulty.
 * The content was fine. There was no rule about who it was for.
 */
import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES, DEFAULT_INDEX } from '../content/registry'
import { buildSessionPlan } from './planner'
import { deriveEvidence } from './mastery'
import { nonRoutineTooEarly, withoutTooEarlyNonRoutine } from './plannerPolicy'
import { initialState, type AppState } from '../domain/types'

const NOW = Date.UTC(2026, 5, 1, 9)
const nonRoutine = BUILTIN_TEMPLATES.filter((t) => t.novelty === 'nonRoutine')

describe('non-routine work waits for a foothold', () => {
  it('there is non-routine content to gate in the first place', () => {
    // A gate over an empty set passes for the wrong reason.
    expect(nonRoutine.length).toBeGreaterThan(0)
  })

  it('is withheld while every one of its skills is unseen', () => {
    for (const t of nonRoutine) expect(nonRoutineTooEarly(t, () => 'unseen'), t.id).toBe(true)
    for (const t of nonRoutine) expect(nonRoutineTooEarly(t, () => undefined), t.id).toBe(true)
  })

  it('is released as soon as ONE of its skills has any evidence at all', () => {
    // Deliberately the lowest rung: the point is somewhere to search from, not
    // readiness. Requiring mastery would make this content unreachable.
    for (const t of nonRoutine) expect(nonRoutineTooEarly(t, () => 'introduced'), t.id).toBe(false)
  })

  it('never gates ordinary content', () => {
    const routine = BUILTIN_TEMPLATES.filter((t) => t.novelty !== 'nonRoutine')
    expect(routine.every((t) => !nonRoutineTooEarly(t, () => 'unseen'))).toBe(true)
    expect(routine.length).toBeGreaterThan(500)
  })

  it('the filtered index drops exactly those templates and nothing else', () => {
    const gated = withoutTooEarlyNonRoutine(DEFAULT_INDEX, () => 'unseen')
    const survivors = new Set([...gated.bySkill.values()].flat().map((t) => t.id))
    for (const t of nonRoutine) expect(survivors.has(t.id), `${t.id} should be withheld`).toBe(false)
    const before = new Set([...DEFAULT_INDEX.bySkill.values()].flat().map((t) => t.id))
    const removed = [...before].filter((id) => !survivors.has(id))
    expect(new Set(removed)).toEqual(new Set(nonRoutine.map((t) => t.id)))
  })

  it('returns the original index untouched when nothing is gated', () => {
    expect(withoutTooEarlyNonRoutine(DEFAULT_INDEX, () => 'independent')).toBe(DEFAULT_INDEX)
  })

  it('a brand-new learner is never handed one', () => {
    const cold: AppState = { ...initialState(), onboarded: true }
    const plan = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence([], NOW),
      state: cold,
      now: NOW,
      checkIn: { minutes: 45, energy: 'ok', focus: null },
    })
    const served = plan.blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    const early = served.filter((id) => nonRoutine.some((t) => t.id === id))
    expect(early, `served to a cold learner: ${early.join(', ')}`).toEqual([])
  })
})
