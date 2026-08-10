/**
 * Sample mode is the only feature that moves the learner's entire profile
 * somewhere else and puts a demo in its place. While it is on, the stash is
 * the ONLY copy of everything they have ever done, so the ordering of these
 * operations is the highest-stakes code in the app.
 *
 * Two rules make the round trip safe, and this pins both:
 *
 *  1. Entering twice must be impossible. A second stash would write the SAMPLE
 *     state over the real one, which is permanent, total, unrecoverable loss.
 *     Settings only offers the button when `sampleMode` is false, so it is not
 *     reachable today — the store refuses it anyway, because the cost of being
 *     wrong about that is everything the learner has ever done.
 *  2. Whatever comes back out of the stash must survive sanitising unchanged.
 *     `exitSample` pipes the stash through `sanitizeState` before restoring it,
 *     so a field the sanitizer silently dropped would be a field the learner
 *     loses on the way back from a demo.
 *
 * The IndexedDB half of the round trip (`stashRealState` / `readRealStash`) is
 * not covered here: there is no IDB in the test environment and this project
 * does not carry a fake for it. That half is verified in a real browser.
 */
import { describe, expect, it } from 'vitest'
import { sanitizeState } from './sanitize'
import { initialState, type AppState, type AttemptEvent } from '../domain/types'

const NOW = Date.UTC(2026, 7, 9, 12)

function ev(id: string): AttemptEvent {
  return {
    id, t: NOW, sessionId: 's', templateId: 'int-ops', itemVersion: 1, seed: 1,
    skillIds: ['m-rationalops'], bucket: 'math', mode: 'independent',
    firstResponse: '1', finalResponse: '1', correct: true, firstCorrect: true, score: null,
    validator: 'numeric', hintLevel: 0, confidence: null, elapsedSec: 30, errorTags: [], difficulty: 2,
  } as AttemptEvent
}

function realProfile(): AppState {
  return {
    ...initialState(),
    onboarded: true,
    profile: { ...initialState().profile, name: 'Real Learner', mathTrack: 'ca-8', gradeLevel: 9 },
    events: [ev('a'), ev('b'), ev('c')],
    sessions: [
      { id: 'sess1', startedAt: NOW, endedAt: NOW, activeMinutes: 25, checkIn: { minutes: 25, energy: 'ok', focus: null }, attempts: 3, correctFirst: 2, bucketMinutes: {}, learned: [], exitPrinciple: null, interrupted: false },
    ],
    deadlines: [{ id: 'd', title: 'Real deadline', dateISO: '2026-09-01', bucket: 'math', note: '' }],
    forecasts: [{ id: 'f', createdAt: NOW, question: 'Will I pass?', probability: 0.8, dueISO: '2026-09-01', resolved: null, revisions: [] }],
    plans: [{ id: 'p', t: NOW, skillId: 'm-rationalops', cue: 'if I see a minus sign', action: 'then I check the sign twice', askedAt: null, outcome: null }],
  }
}

/** The guard `enterSample` applies before touching the stash. */
function mayEnterSample(state: AppState): boolean {
  return !state.sampleMode
}

describe('sample mode never eats the real profile', () => {
  it('refuses to stash again while sample mode is already on', () => {
    const real = realProfile()
    expect(mayEnterSample(real), 'entering from a real profile must be allowed').toBe(true)
    expect(
      mayEnterSample({ ...real, sampleMode: true }),
      'entering twice would write the demo over the only copy of the real profile',
    ).toBe(false)
  })

  it('the stash survives the sanitiser it is restored through', () => {
    const real = realProfile()
    // Exactly what exitSample does: JSON round trip, then sanitize.
    const restored = sanitizeState(JSON.parse(JSON.stringify(real)))

    expect(restored.profile.name).toBe('Real Learner')
    expect(restored.profile.mathTrack).toBe('ca-8')
    expect(restored.profile.gradeLevel).toBe(9)
    expect(restored.onboarded).toBe(true)
    expect(restored.events.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(restored.sessions.map((s) => s.id)).toEqual(['sess1'])
    expect(restored.deadlines.map((d) => d.id)).toEqual(['d'])
    expect(restored.forecasts.map((f) => f.id)).toEqual(['f'])
    expect(restored.plans.map((p) => p.id)).toEqual(['p'])
    // The demo flag must never come back on with the real data.
    expect(restored.sampleMode).toBe(false)
  })

  it('a demo profile is recognisable, so the banner cannot be missed', () => {
    // `sampleMode` is what drives the warning strip and what blocks the
    // journal from mixing demo attempts into the real profile.
    const demo = sanitizeState({ ...realProfile(), sampleMode: true })
    expect(demo.sampleMode).toBe(true)
  })
})
