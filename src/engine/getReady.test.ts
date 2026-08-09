import { describe, expect, it } from 'vitest'
import { getReadyReport } from './getReady'
import { SKILL_BY_ID } from '../content/skills'
import { TRACK_BY_ID, trackSkillIds } from '../content/tracks'
import { deriveEvidence } from './mastery'
import type { AttemptEvent } from '../domain/types'

const NOW = Date.UTC(2026, 7, 9, 12)
let n = 0
/** Two unaided first-try successes on distinct forms = independent. */
function ownEvents(skillIds: string[]): AttemptEvent[] {
  return skillIds.flatMap((sid) =>
    [0, 1].map(() => ({
      id: `e${n++}`,
      t: NOW - 86_400_000 + n * 60_000,
      sessionId: 's',
      templateId: `own-${sid}-${n}`,
      itemVersion: 1,
      seed: n,
      skillIds: [sid],
      bucket: 'math' as const,
      mode: 'independent' as const,
      firstResponse: 'x',
      finalResponse: 'x',
      correct: true,
      firstCorrect: true,
      score: null,
      validator: 'numeric',
      hintLevel: 0,
      confidence: null,
      elapsedSec: 60,
      errorTags: [],
      difficulty: 2,
    })),
  )
}

describe('get-ready reports only what actually stands in the way', () => {
  it('lists unmet prerequisites for a course the learner has not started', () => {
    const r = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence([], NOW))!
    expect(r).toBeTruthy()
    expect(r.ready).toBe(false)
    expect(r.missing.length).toBeGreaterThan(0)
    expect(r.summary).toMatch(/not yet independent/)
  })

  it('never lists a skill that is IN the course — those are the course, not the on-ramp', () => {
    const track = TRACK_BY_ID.get('hs-alg2')!
    const inCourse = new Set(trackSkillIds(track))
    const r = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence([], NOW))!
    for (const s of r.missing) {
      expect(inCourse.has(s.id), `${s.id} is part of the course itself`).toBe(false)
    }
  })

  it('drops a prerequisite once it is genuinely owned', () => {
    const empty = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence([], NOW))!
    const first = empty.missing[0]
    const after = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence(ownEvents([first.id]), NOW))!
    expect(after.missing.some((s) => s.id === first.id)).toBe(false)
    expect(after.missing.length).toBe(empty.missing.length - 1)
  })

  it('says READY rather than inventing busywork when nothing is missing', () => {
    const empty = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence([], NOW))!
    const all = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence(ownEvents(empty.missing.map((s) => s.id)), NOW))!
    expect(all.ready).toBe(true)
    expect(all.missing).toEqual([])
    expect(all.summary).toMatch(/Nothing stands between you/)
  })

  it('orders foundations before the skills that depend on them', () => {
    const r = getReadyReport('ca-78alg', SKILL_BY_ID, deriveEvidence([], NOW))!
    const position = new Map(r.missing.map((s, i) => [s.id, i]))
    for (const s of r.missing) {
      for (const p of s.prereqs) {
        if (!position.has(p)) continue
        expect(
          position.get(p)! < position.get(s.id)!,
          `${p} is a prerequisite of ${s.id} but appears after it`,
        ).toBe(true)
      }
    }
  })

  it('returns null for an unknown track rather than guessing', () => {
    expect(getReadyReport('not-a-track', SKILL_BY_ID, deriveEvidence([], NOW))).toBeNull()
  })

  /**
   * Guided exposure is not readiness. If a partially-practised prerequisite
   * dropped off the list, the mini-course would send someone into a course
   * standing on evidence this app refuses to call ownership.
   */
  it('does not count guided evidence as owning a prerequisite', () => {
    const empty = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence([], NOW))!
    const first = empty.missing[0]
    const hinted: AttemptEvent[] = ownEvents([first.id]).map((e) => ({ ...e, hintLevel: 2, firstCorrect: false }))
    const after = getReadyReport('hs-alg2', SKILL_BY_ID, deriveEvidence(hinted, NOW))!
    expect(after.missing.some((s) => s.id === first.id), 'hinted work was treated as readiness').toBe(true)
  })
})
