/**
 * Imports are hostile (CLAUDE.md correctness rule 5), and so are old saves,
 * clocks that jump, and values a user typed into Settings.
 *
 * The rule this file enforces is narrower and stronger than "does not crash":
 * whatever comes in, every DOWNSTREAM reader must still work. A sanitizer that
 * returns a technically-valid state which then makes the coach print "NaN%" or
 * the planner throw has not done its job. So each case is fed all the way
 * through evidence replay, the allocation report, the coach and the planner.
 */
import { describe, expect, it } from 'vitest'
import { exportState, importState } from '../engine/exportImport'
import { sanitizeState } from './sanitize'
import { allocationReport } from '../engine/allocation'
import { effectiveAllocation } from '../engine/allocationPlus'
import { calibrationBands, calibrationGap, brierScore } from '../engine/calibration'
import { dueForms, dueReviews, nextReviewAt, reviewBurden } from '../engine/scheduler'
import { activityIntake, coachBeliefs, todayInsight, weeklyObjective } from '../engine/coach'
import { deriveEvidence } from '../engine/mastery'
import { buildSessionPlan } from '../engine/planner'
import { DEFAULT_INDEX } from '../content/registry'
import { BUCKETS, initialState, type AppState, type AttemptEvent } from '../domain/types'

const NOW = Date.UTC(2026, 7, 9, 12)

function ev(over: Partial<AttemptEvent> = {}): AttemptEvent {
  return {
    id: `e${over.id ?? 0}`, t: NOW - 1000, sessionId: 's', templateId: 'int-ops', itemVersion: 1,
    seed: 1, skillIds: ['m-rationalops'], bucket: 'math', mode: 'independent',
    firstResponse: '1', finalResponse: '1', correct: true, firstCorrect: true, score: null,
    validator: 'numeric', hintLevel: 0, confidence: 60, elapsedSec: 30, errorTags: [], difficulty: 2,
    ...over,
  } as AttemptEvent
}

/** Run a state past every reader that touches it. Throwing here is the failure. */
function exerciseEveryReader(state: AppState) {
  const evidence = deriveEvidence(state.events, NOW)
  allocationReport(state.events, state.settings, NOW)
  effectiveAllocation(state, evidence, DEFAULT_INDEX, NOW)
  dueReviews(evidence, NOW)
  dueForms(evidence, NOW)
  nextReviewAt(evidence, NOW)
  reviewBurden(evidence, NOW, 7)
  calibrationBands(state.events)
  calibrationGap(state.events)
  brierScore(state.forecasts)
  activityIntake(state.events, NOW)
  const texts = [
    ...coachBeliefs(DEFAULT_INDEX, evidence, state, NOW).flatMap((b) => [b.statement, ...b.evidence, b.unknown ?? '', b.resolve ?? '']),
    weeklyObjective(DEFAULT_INDEX, evidence, state, NOW),
    todayInsight(DEFAULT_INDEX, evidence, state, NOW),
    ...buildSessionPlan({ index: DEFAULT_INDEX, evidence, state, now: NOW, checkIn: { minutes: 30, energy: 'ok', focus: null } }).rationale,
  ]
  return texts
}

const BAD_NUMBER = /\bNaN\b|Infinity|undefined|\[object |\bnull\b/

describe('an import can degrade the state, never corrupt it', () => {
  it('accepts its own export without losing anything', () => {
    const state: AppState = { ...initialState(), onboarded: true, events: [ev({ id: '1' }), ev({ id: '2' })] }
    const result = importState(exportState(state))
    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (result.ok) expect(result.state.events.length).toBe(2)
  })

  const payloads: [string, string][] = [
    ['null', 'null'],
    ['a bare array', '[]'],
    ['a bare string', '"hello"'],
    ['a bare number', '42'],
    ['an empty object', '{}'],
    ['truncated JSON', '{"app":"axiomlab","schema":1,"state":{'],
    ['right envelope, events not an array', '{"app":"axiomlab","schema":1,"state":{"events":"not an array"}}'],
    ['events full of nulls', '{"app":"axiomlab","schema":1,"state":{"events":[null,null,null]}}'],
    ['events full of wrong shapes', '{"app":"axiomlab","schema":1,"state":{"events":[1,"x",[],{"t":"soon"}]}}'],
    ['deeply nested state', `{"app":"axiomlab","schema":1,"state":${'{"a":'.repeat(60)}1${'}'.repeat(60)}}`],
    ['astronomically large numbers', '{"app":"axiomlab","schema":1,"state":{"createdAt":1e300,"events":[]}}'],
    ['a negative schema version', '{"app":"axiomlab","schema":1,"state":{"version":-5,"events":[]}}'],
    ['a prototype-pollution attempt', '{"app":"axiomlab","schema":1,"state":{"__proto__":{"polluted":true},"events":[]}}'],
    ['allocations as a string', '{"app":"axiomlab","schema":1,"state":{"settings":{"allocations":"x"},"events":[]}}'],
    ['allocations with nulls and text', '{"app":"axiomlab","schema":1,"state":{"settings":{"allocations":{"math":null,"physics":"abc"}},"events":[]}}'],
    ['a profile of the wrong type', '{"app":"axiomlab","schema":1,"state":{"profile":42,"events":[]}}'],
    ['deadlines that are not dates', '{"app":"axiomlab","schema":1,"state":{"deadlines":[{"id":"x","title":"t","dateISO":"soon"}],"events":[]}}'],
  ]

  for (const [label, payload] of payloads) {
    it(`survives ${label}`, () => {
      const result = importState(payload)
      if (!result.ok) return // refusing outright is a fine answer
      const state = result.state
      expect(({} as Record<string, unknown>).polluted, 'Object.prototype was polluted').toBeUndefined()
      const total = Object.values(state.settings.allocations).reduce((a, b) => a + b, 0)
      expect(Number.isFinite(total), `allocations not finite: ${JSON.stringify(state.settings.allocations)}`).toBe(true)
      expect(Math.abs(total - 100), `allocations sum to ${total}`).toBeLessThan(0.5)
      const texts = exerciseEveryReader(state)
      const bad = texts.find((t) => BAD_NUMBER.test(t))
      expect(bad, `a reader printed a broken value: "${String(bad).slice(0, 140)}"`).toBeUndefined()
    })
  }
})

describe('settings a user could type in', () => {
  it('always normalises allocations to 100 with no negative share', () => {
    const cases: Record<string, number>[] = [
      Object.fromEntries(BUCKETS.map((b) => [b.id, 0])),
      Object.fromEntries(BUCKETS.map((b) => [b.id, 1000])),
      Object.fromEntries(BUCKETS.map((b, i) => [b.id, i === 0 ? 100 : 0])),
      Object.fromEntries(BUCKETS.map((b) => [b.id, -5])),
      Object.fromEntries(BUCKETS.map((b, i) => [b.id, i === 0 ? Number.NaN : 10])),
      Object.fromEntries(BUCKETS.map((b, i) => [b.id, i === 0 ? Number.POSITIVE_INFINITY : 10])),
    ]
    for (const allocations of cases) {
      const state = sanitizeState({ settings: { allocations } })
      const total = Object.values(state.settings.allocations).reduce((a, b) => a + b, 0)
      expect(Number.isFinite(total), `input ${JSON.stringify(allocations).slice(0, 70)} → ${total}`).toBe(true)
      expect(Math.abs(total - 100), `input ${JSON.stringify(allocations).slice(0, 70)} → ${total}`).toBeLessThan(0.5)
      for (const b of BUCKETS) {
        expect(state.settings.allocations[b.id], `${b.id} went negative`).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('clocks and confidences that make no sense', () => {
  it('handles out-of-order, duplicate, zero and future timestamps', () => {
    const events = [
      ev({ id: 'a', t: NOW }),
      ev({ id: 'b', t: NOW - 100_000_000 }),
      ev({ id: 'c', t: NOW }),
      ev({ id: 'd', t: 0 }),
      ev({ id: 'f', t: NOW + 10 * 86_400_000 }),
    ]
    const state: AppState = { ...initialState(), onboarded: true, events }
    const evidence = deriveEvidence(events, NOW)
    const record = evidence.get('m-rationalops')
    expect(record, 'no evidence derived at all').toBeTruthy()
    if (record?.review) expect(Number.isFinite(record.review.due), 'review due is not finite').toBe(true)
    const bad = exerciseEveryReader(state).find((t) => BAD_NUMBER.test(t))
    expect(bad, `a reader printed a broken value: "${String(bad).slice(0, 140)}"`).toBeUndefined()
  })

  it('keeps calibration inside 0..1 whatever confidence arrives', () => {
    const events = [
      ev({ id: 'p', confidence: 500 }),
      ev({ id: 'q', confidence: -20, firstCorrect: false, correct: false }),
      ev({ id: 'r', confidence: Number.NaN }),
      ev({ id: 's', confidence: 50 }),
      ev({ id: 't', confidence: 50, firstCorrect: false, correct: false }),
      ev({ id: 'u', confidence: 50 }),
      ev({ id: 'v', confidence: 90 }),
      ev({ id: 'w', confidence: 90 }),
      ev({ id: 'x', confidence: 90 }),
    ]
    const gap = calibrationGap(events)
    if (gap !== null) {
      expect(Number.isFinite(gap), `gap ${gap}`).toBe(true)
      expect(Math.abs(gap), `gap ${gap} is outside anything meaningful`).toBeLessThanOrEqual(1.5)
    }
    for (const band of calibrationBands(events)) {
      if (band.accuracy === null) continue
      expect(band.accuracy, `band ${band.label}`).toBeGreaterThanOrEqual(0)
      expect(band.accuracy, `band ${band.label}`).toBeLessThanOrEqual(1)
    }
  })
})
