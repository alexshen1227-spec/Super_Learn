import { describe, expect, it } from 'vitest'
import { TRACK_BONUS, TRACK_PREREQ_BONUS, TRACK_UNIT_BONUS, scoreSkills, trackFrontierUnit } from './planner'
import { TRACK_BY_ID, trackSkillIds } from '../content/tracks'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { initialState, type AppState, type AttemptEvent, type CheckIn } from '../domain/types'
import { allocationReport } from './allocation'

const NOW = Date.UTC(2026, 7, 8, 16)
const CHECKIN: CheckIn = { minutes: 25, energy: 'ok', focus: null }

function ctxFor(state: AppState) {
  return {
    index: DEFAULT_INDEX,
    evidence: deriveEvidence(state.events, NOW),
    state,
    now: NOW,
    checkIn: CHECKIN,
  }
}

function report(state: AppState) {
  return allocationReport(state.events, state.settings, NOW)
}

/**
 * The track is a TILT, never a filter — the same law the goals engine follows.
 * If choosing a course could remove non-course math from the pool, or quietly
 * outweigh a due review, the "no bias toward these" promise would be broken.
 */
describe('the math track tilts openly and never filters', () => {
  it('gives course skills a visible, bounded bonus', () => {
    const base = { ...initialState() }
    const withTrack: AppState = {
      ...initialState(),
      profile: { ...initialState().profile, mathTrack: 'ca-78alg' },
    }
    const plain = scoreSkills('math', ctxFor(base), report(base))
    const tilted = scoreSkills('math', ctxFor(withTrack), report(withTrack))
    const track = TRACK_BY_ID.get('ca-78alg')!
    const inTrack = new Set(trackSkillIds(track))

    // Compare the same skill's score with and without the track.
    for (const t of tilted) {
      const p = plain.find((x) => x.skill.id === t.skill.id)
      if (!p) continue
      const delta = t.score - p.score
      if (inTrack.has(t.skill.id)) {
        expect(delta, `${t.skill.id}: expected a track bonus`).toBeGreaterThanOrEqual(TRACK_BONUS - 1e-9)
        expect(delta, `${t.skill.id}: bonus larger than declared`).toBeLessThanOrEqual(TRACK_BONUS + TRACK_UNIT_BONUS + 1e-9)
        expect(
          t.reasons.some((r) => r.includes('course')),
          `${t.skill.id}: the tilt must state itself in the why`,
        ).toBe(true)
      } else if (delta > 1e-9) {
        // Outside the course, only the unlock boost is allowed, and it must
        // state itself in the why like every other tilt.
        expect(delta, `${t.skill.id}: unexpected off-course boost`).toBeCloseTo(TRACK_PREREQ_BONUS, 6)
        expect(
          t.reasons.some((r) => r.includes('unlocks')),
          `${t.skill.id}: the unlock boost must state itself`,
        ).toBe(true)
      }
    }
  })

  it('does not remove non-course skills from the pool', () => {
    const withTrack: AppState = {
      ...initialState(),
      profile: { ...initialState().profile, mathTrack: 'ca-6' },
    }
    const tilted = scoreSkills('math', ctxFor(withTrack), report(withTrack))
    const track = TRACK_BY_ID.get('ca-6')!
    const inTrack = new Set(trackSkillIds(track))
    expect(tilted.some((s) => !inTrack.has(s.skill.id)), 'non-course math vanished from the pool').toBe(true)
  })

  it('stays below the weight of a due review', () => {
    // A course tie-breaker that outranked "this is due" would trade retention
    // for course cosmetics. The review weight in scoreSkills is 3.
    expect(TRACK_BONUS + TRACK_UNIT_BONUS).toBeLessThan(3)
  })
})

describe('the course frontier is the earliest unfinished unit', () => {
  it('moves forward only when a unit is fully independent', () => {
    const track = TRACK_BY_ID.get('ca-6')!
    const empty = deriveEvidence([], NOW)
    expect(trackFrontierUnit(track, empty)?.name).toBe(track.units[0].name)

    // Own every skill of unit 0 (2 distinct forms each, unaided), then the
    // frontier must be unit 1.
    let n = 0
    const events: AttemptEvent[] = track.units[0].skillIds.flatMap((sid) =>
      [0, 1].map((f) => ({
        id: `e${n++}`, t: NOW - 86_400_000 + n * 60_000, sessionId: 's', templateId: `tpl-${sid}-${f}`,
        itemVersion: 1, seed: n, skillIds: [sid], bucket: 'math' as const, mode: 'independent' as const,
        firstResponse: 'x', finalResponse: 'x', correct: true, firstCorrect: true, score: null,
        validator: 'numeric', hintLevel: 0, confidence: null, elapsedSec: 60, errorTags: [], difficulty: 2,
      })),
    )
    const owned = deriveEvidence(events, NOW)
    expect(trackFrontierUnit(track, owned)?.name).toBe(track.units[1].name)
  })
})
