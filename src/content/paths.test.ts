import { describe, expect, it } from 'vitest'
import { PATHS, pathProgress } from './paths'
import { SKILL_BY_ID } from './skills'
import { deriveEvidence } from '../engine/mastery'
import type { AttemptEvent } from '../domain/types'

const T0 = Date.parse('2026-07-01T12:00:00Z')

function success(skillId: string, seed: number, t: number): AttemptEvent {
  return {
    id: `p${skillId}${seed}`,
    t,
    sessionId: 's',
    templateId: 'tpl',
    itemVersion: 1,
    seed,
    skillIds: [skillId],
    bucket: 'observer',
    mode: 'independent',
    firstResponse: 'x',
    finalResponse: 'x',
    correct: true,
    firstCorrect: true,
    score: null,
    validator: 'mcq',
    hintLevel: 0,
    confidence: null,
    elapsedSec: 60,
    errorTags: [],
    difficulty: 2,
  }
}

describe('paths', () => {
  it('every path references real skills in its bucket', () => {
    for (const p of PATHS) {
      expect(p.skillIds.length).toBeGreaterThanOrEqual(3)
      expect(p.ranks.length).toBe(5)
      expect(p.code.length).toBeGreaterThanOrEqual(4)
      for (const id of p.skillIds) {
        const skill = SKILL_BY_ID.get(id)
        expect(skill, `${p.id}: missing skill ${id}`).toBeTruthy()
        expect(skill!.bucket, `${p.id}: ${id} bucket mismatch`).toBe(p.bucket)
      }
    }
  })
  it('progress starts at rank 0 and climbs with evidence', () => {
    const observer = PATHS.find((p) => p.id === 'observer')!
    const empty = pathProgress(observer, deriveEvidence([], T0))
    expect(empty.rankIndex).toBe(0)
    expect(empty.progress).toBe(0)
    // make every observer skill independent (2 distinct successes each)
    const events = observer.skillIds.flatMap((id, i) => [
      success(id, 1, T0 + i * 1000),
      success(id, 2, T0 + i * 1000 + 500),
    ])
    const full = pathProgress(observer, deriveEvidence(events, T0 + 86_400_000))
    expect(full.rankIndex).toBeGreaterThanOrEqual(2)
    expect(full.progress).toBeGreaterThan(0.5)
    expect(observer.skillIds).toContain(full.nextStep)
  })
})
