import { describe, expect, it } from 'vitest'
import type { SessionPlan } from '../domain/types'
import { nextSessionStep } from './sessionFlow'

const plan: SessionPlan = {
  id: 'session', createdAt: 1, targetMinutes: 10, rationale: [],
  blocks: [
    { id: 'a', kind: 'core', bucket: 'math', label: 'A', minutes: 5, why: '', activities: [
      { templateId: 'one', seed: 1, mode: 'guided' },
      { templateId: 'two', seed: 2, mode: 'independent' },
    ] },
    { id: 'b', kind: 'exit', bucket: 'meta', label: 'B', minutes: 2, why: '', activities: [
      { templateId: 'three', seed: 3, mode: 'review' },
    ] },
  ],
}

describe('session navigation', () => {
  it('advances within a block', () => {
    expect(nextSessionStep(plan, 0, 0)).toEqual({ kind: 'activity', blockIndex: 0, actIndex: 1 })
  })
  it('moves to an interstitial at a block boundary', () => {
    expect(nextSessionStep(plan, 0, 1)).toEqual({ kind: 'block', blockIndex: 1, actIndex: 0 })
  })
  it('ends safely at the last activity or an invalid position', () => {
    expect(nextSessionStep(plan, 1, 0)).toEqual({ kind: 'end' })
    expect(nextSessionStep(plan, 99, 0)).toEqual({ kind: 'end' })
  })
})
