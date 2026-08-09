import { describe, expect, it } from 'vitest'
import type { ItemTemplate, SkillEvidence } from '../domain/types'
import { nextProofForSkill } from './nextProof'

function evidence(overrides: Partial<SkillEvidence> = {}): SkillEvidence {
  return {
    skillId: 'skill', state: 'unseen', needsReview: false, bestState: 'unseen', exposure: 0,
    guidedSuccesses: 0, independentForms: [], retainedAt: null, transferredAt: null,
    transferCrossed: null, lastCorrectAt: null, lastAttemptAt: null, lastOutcomeCorrect: null,
    recentMisses: 0, blockedByMisconception: false, hintDependence: null, review: null,
    forms: [], attempts: 0, ...overrides,
  }
}

const template = (transfer = false): ItemTemplate => ({
  id: 'family', version: 1, kind: 'single', name: 'Family', skillIds: ['skill'],
  bucket: 'math', difficulty: 2, variants: 3, minutes: 2, transfer,
  provenance: 'test',
  generate: () => { throw new Error('not needed') },
})

describe('nextProofForSkill', () => {
  it('uses the stricter three-family rule for Path skills', () => {
    const next = nextProofForSkill(evidence({ state: 'guided', attempts: 2, independentForms: ['one'] }), 'observer', [template()])
    expect(next.title).toContain('2 more')
  })

  it('states an honest ceiling when no transfer task exists', () => {
    const next = nextProofForSkill(evidence({ state: 'retained', attempts: 5, retainedAt: 1 }), 'math', [template()])
    expect(next.available).toBe(false)
    expect(next.title).toContain('honest ceiling')
  })

  it('points retained skills toward an available transfer task', () => {
    const next = nextProofForSkill(evidence({ state: 'retained', attempts: 5, retainedAt: 1 }), 'math', [template(true)])
    expect(next.available).toBe(true)
    expect(next.title).toContain('unfamiliar')
  })
})
