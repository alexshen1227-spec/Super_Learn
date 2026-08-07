import { describe, expect, it } from 'vitest'
import { initialState, type AttemptEvent, type SessionRecord } from '../domain/types'
import { learningQualityReport, outcomeReport } from './outcomes'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 7, 6, 12)

function event(i: number): AttemptEvent {
  const age = 13 - i
  const mode = i === 3 ? 'review' : i === 8 ? 'transfer' : 'independent'
  return {
    id: `e${i}`,
    t: NOW - age * DAY,
    sessionId: `s${i % 4}`,
    // Transfer is now MEASURED: it only counts on a template family this skill
    // has not been practiced on, so the transfer attempt uses a novel family.
    templateId: mode === 'transfer' ? 'int-word-novel' : 'int-ops',
    itemVersion: 1,
    seed: i,
    skillIds: ['m-integers'],
    bucket: 'math',
    mode,
    firstResponse: '1',
    finalResponse: '1',
    correct: true,
    firstCorrect: true,
    score: null,
    validator: 'numeric',
    hintLevel: 0,
    confidence: 70,
    elapsedSec: 60,
    errorTags: [],
    difficulty: 2,
  }
}

function session(i: number): SessionRecord {
  const endedAt = NOW - (i + 1) * DAY
  return {
    id: `s${i}`,
    startedAt: endedAt - 30 * 60_000,
    endedAt,
    activeMinutes: 30,
    checkIn: { minutes: 30, energy: 'ok', focus: null },
    attempts: 3,
    correctFirst: 3,
    bucketMinutes: { math: 30 },
    learned: [],
    exitPrinciple: null,
    interrupted: false,
  }
}

describe('outcome report', () => {
  it('counts dose separately from threshold-based learning gains', () => {
    const state = initialState()
    state.events = Array.from({ length: 12 }, (_, i) => event(i)).sort((a, b) => a.t - b.t)
    state.sessions = Array.from({ length: 4 }, (_, i) => session(i))
    const report = outcomeReport(state, NOW)
    expect(report.daysPracticed).toBe(4)
    expect(report.focusedMinutes).toBe(120)
    expect(report.newIndependent).toBe(1)
    expect(report.newRetained).toBe(1)
    expect(report.newTransferred).toBe(1)
    expect(report.enoughEvidence).toBe(true)
  })

  it('compares repeated activity families and refuses tiny mode samples', () => {
    const early = Array.from({ length: 6 }, (_, i) => ({
      ...event(i),
      t: NOW - (20 - i) * DAY,
      templateId: i % 2 ? 'int-word' : 'int-ops',
      mode: 'review' as const,
      firstCorrect: i < 2,
      correct: i < 2,
    }))
    const recent = Array.from({ length: 6 }, (_, i) => ({
      ...event(i + 20),
      t: NOW - (6 - i) * DAY,
      templateId: i % 2 ? 'int-word' : 'int-ops',
      mode: i < 2 ? 'transfer' as const : 'independent' as const,
      firstCorrect: i < 5,
      correct: i < 5,
    }))
    const report = learningQualityReport([...early, ...recent], NOW)
    expect(report.review.rate).not.toBeNull()
    expect(report.transfer.rate).toBeNull()
    expect(report.matched).not.toBeNull()
    expect(report.matched!.recent.rate!).toBeGreaterThan(report.matched!.early.rate!)
  })
})
