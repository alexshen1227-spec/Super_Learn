import { describe, expect, it } from 'vitest'
import { initialState, type AttemptEvent, type SessionRecord } from '../domain/types'
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
})
