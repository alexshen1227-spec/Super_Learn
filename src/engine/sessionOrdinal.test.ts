import { describe, expect, it } from 'vitest'
import { sessionOrdinal } from './sessionOrdinal'
import { initialState, type AppState, type AttemptEvent, type SessionRecord } from '../domain/types'

function attempt(sessionId: string, i: number, mode: AttemptEvent['mode'] = 'independent'): AttemptEvent {
  return {
    id: `e${i}`, t: 1_000 + i, sessionId, templateId: 't', itemVersion: 1, seed: i,
    skillIds: ['s'], bucket: 'math', mode, firstResponse: 'x', finalResponse: 'x',
    correct: true, firstCorrect: true, score: null, validator: 'numeric', hintLevel: 0,
    confidence: null, elapsedSec: 60, errorTags: [], difficulty: 3,
  }
}

function record(id: string): SessionRecord {
  return {
    id, startedAt: 0, endedAt: 0, activeMinutes: 10,
    checkIn: { minutes: 10, energy: 'ok', focus: null },
    attempts: 1, correctFirst: 1, bucketMinutes: {}, learned: [], exitPrinciple: null, interrupted: false,
  }
}

function stateWith(sessions: number, capped: number): AppState {
  const events: AttemptEvent[] = []
  for (let s = 0; s < sessions; s++) events.push(attempt(`s${s}`, s))
  return {
    ...initialState(),
    events,
    // Mirrors the reducer: sessions are kept to the most recent `capped`.
    sessions: Array.from({ length: sessions }, (_, i) => record(`s${i}`)).slice(-capped),
  }
}

describe('sessionOrdinal', () => {
  it('counts distinct sessions from the event log', () => {
    expect(sessionOrdinal(stateWith(7, 2000))).toBe(7)
  })

  it('keeps growing after the session list hits its 2000 cap', () => {
    // THE BUG. `state.sessions.length` freezes at 2000, and both planner
    // cadences read it: `% 3 === 2` becomes permanently true (the retention
    // exit every session forever) and `% 4 === 3` permanently false (applied
    // work never scheduled again).
    const frozen = stateWith(5475, 2000)
    expect(frozen.sessions.length, 'the cap is what makes this a bug').toBe(2000)
    expect(sessionOrdinal(frozen)).toBe(5475)
  })

  it('does not let a capped list turn a cadence permanently on', () => {
    let fired = 0
    for (let n = 2000; n < 2100; n++) if (sessionOrdinal(stateWith(n, 2000)) % 3 === 2) fired += 1
    // A third of them, not all of them.
    expect(fired).toBeGreaterThan(28)
    expect(fired).toBeLessThan(38)
  })

  it('does not let a capped list turn a cadence permanently off', () => {
    let fired = 0
    for (let n = 2000; n < 2100; n++) if (sessionOrdinal(stateWith(n, 2000)) % 4 === 3) fired += 1
    expect(fired).toBeGreaterThan(20)
  })

  it('ignores placement, which routes rather than being a study session', () => {
    const s = stateWith(3, 2000)
    s.events.push(attempt('placement-run', 99, 'placement'))
    expect(sessionOrdinal(s)).toBe(3)
  })

  it('never moves backwards when an import trimmed the events', () => {
    // Session records restored without their events must not rewind the
    // cadence and make the learner repeat work.
    const s: AppState = { ...initialState(), events: [], sessions: [record('a'), record('b')] }
    expect(sessionOrdinal(s)).toBe(2)
  })
})
