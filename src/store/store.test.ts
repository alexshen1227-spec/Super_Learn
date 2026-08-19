import { describe, expect, it } from 'vitest'
import { initialState, type AttemptEvent, type ReasoningCase, type SessionRecord } from '../domain/types'
import { reduceState } from './store'

const event: AttemptEvent = {
  id: 'stable-event', t: 1, sessionId: 'session', templateId: 'family', itemVersion: 1, seed: 1,
  skillIds: ['skill'], bucket: 'math', mode: 'independent', firstResponse: '1', finalResponse: '1',
  correct: true, firstCorrect: true, score: null, validator: 'numeric', hintLevel: 0, confidence: null,
  elapsedSec: 30, errorTags: [], difficulty: 2,
}

const session: SessionRecord = {
  id: 'stable-session', startedAt: 1, endedAt: 2, activeMinutes: 1,
  checkIn: { minutes: 10, energy: 'ok', focus: null }, attempts: 1, correctFirst: 1,
  bucketMinutes: { math: 1 }, learned: [], exitPrinciple: null, interrupted: false,
}

const reasoningCase: ReasoningCase = {
  id: 'case-1', createdAt: 1, updatedAt: 1, kind: 'claim', status: 'draft', stage: 0,
  question: 'Will this change improve the result?', stakes: '', observations: [], inferences: [], alternatives: [],
  assumptions: [], disconfirmingTest: '', conclusion: '', confidence: 50, resolution: null,
}

describe('idempotent durable transitions', () => {
  it('does not duplicate an attempt when a completion callback fires twice', () => {
    const once = reduceState(initialState(), { type: 'append-events', events: [event] })
    const twice = reduceState(once, { type: 'append-events', events: [event] })
    expect(twice.events).toHaveLength(1)
  })

  it('does not duplicate a resumed session that finishes again', () => {
    const once = reduceState(initialState(), { type: 'complete-session', record: session })
    const twice = reduceState(once, { type: 'complete-session', record: session })
    expect(twice.sessions).toHaveLength(1)
  })

  it('updates a reasoning case in place instead of duplicating its history', () => {
    const once = reduceState(initialState(), { type: 'upsert-reasoning-case', reasoningCase })
    const twice = reduceState(once, {
      type: 'upsert-reasoning-case',
      reasoningCase: { ...reasoningCase, updatedAt: 2, status: 'committed', conclusion: 'Run the smaller test first.' },
    })
    expect(twice.reasoningCases).toHaveLength(1)
    expect(twice.reasoningCases[0].status).toBe('committed')
    expect(twice.reasoningCases[0].conclusion).toBe('Run the smaller test first.')
  })

  it('locks a commitment against hindsight edits but still accepts its outcome', () => {
    const committed = { ...reasoningCase, status: 'committed' as const, conclusion: 'Run the smaller test first.' }
    const state = reduceState(initialState(), { type: 'upsert-reasoning-case', reasoningCase: committed })
    const rewritten = reduceState(state, {
      type: 'upsert-reasoning-case',
      reasoningCase: { ...committed, conclusion: 'Pretend this was always the plan.' },
    })
    expect(rewritten.reasoningCases[0].conclusion).toBe('Run the smaller test first.')

    const resolved = reduceState(rewritten, {
      type: 'upsert-reasoning-case',
      reasoningCase: {
        ...committed,
        status: 'resolved',
        resolution: { outcome: 'mixed', note: 'The test was partly positive.', lesson: 'Segment first.', resolvedAt: 3 },
      },
    })
    expect(resolved.reasoningCases[0].status).toBe('resolved')
    expect(resolved.reasoningCases[0].resolution?.lesson).toBe('Segment first.')
  })
})
