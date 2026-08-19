import { describe, expect, it } from 'vitest'
import { exportState, importState } from '../engine/exportImport'
import { initialState, type ReasoningCase } from '../domain/types'
import { sanitizeState } from './sanitize'

const reasoningCase: ReasoningCase = {
  id: 'case-1', createdAt: 10, updatedAt: 20, kind: 'decision', status: 'committed', stage: 3,
  question: 'Should we run the smaller pilot first?', stakes: 'A full rollout is expensive.',
  observations: ['The pilot costs one tenth as much'], inferences: ['It may expose the main failure mode'],
  alternatives: ['Run the pilot', 'Ship to everyone'], assumptions: ['The pilot population is representative'],
  disconfirmingTest: 'Compare the pilot population with the launch population.',
  conclusion: 'Run the pilot first.', confidence: 70, resolution: null,
}

describe('reasoning case persistence', () => {
  it('keeps cases in a normal export/import round trip', () => {
    const state = { ...initialState(), reasoningCases: [reasoningCase] }
    const imported = importState(exportState(state))
    expect(imported.ok).toBe(true)
    if (imported.ok) expect(imported.state.reasoningCases).toEqual([reasoningCase])
  })

  it('drops malformed cases and bounds imported text', () => {
    const state = sanitizeState({
      reasoningCases: [
        { question: '' },
        { ...reasoningCase, observations: Array.from({ length: 30 }, (_, i) => `${i}`.repeat(700)), confidence: 900 },
      ],
    })
    expect(state.reasoningCases).toHaveLength(1)
    expect(state.reasoningCases[0].observations).toHaveLength(8)
    expect(state.reasoningCases[0].observations[0].length).toBe(500)
    expect(state.reasoningCases[0].confidence).toBe(100)
  })

  it('adds an empty case collection to legacy states', () => {
    expect(sanitizeState({ onboarded: true }).reasoningCases).toEqual([])
  })

  it('downgrades an incomplete imported commitment to a resumable draft', () => {
    const state = sanitizeState({ reasoningCases: [{ ...reasoningCase, alternatives: [], status: 'committed' }] })
    expect(state.reasoningCases[0].status).toBe('draft')
    expect(state.reasoningCases[0].resolution).toBeNull()
  })
})
