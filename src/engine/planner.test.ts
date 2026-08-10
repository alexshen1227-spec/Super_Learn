import { describe, expect, it } from 'vitest'
import { buildSessionPlan } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence, evidenceFor } from './mastery'
import { initialState, type AppState, type AttemptEvent } from '../domain/types'

const NOW = Date.UTC(2026, 7, 6, 12)
const DAY = 86_400_000
let n = 0
const ev = (skill: string, tpl: string, over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `pe${n++}`, t: NOW - 4 * DAY + n * 60_000, sessionId: 's1', templateId: tpl, itemVersion: 1,
  seed: n, skillIds: [skill], bucket: 'math', mode: 'independent', firstResponse: '1', finalResponse: '1',
  correct: true, firstCorrect: true, score: null, validator: 'numeric', hintLevel: 0,
  confidence: 60, elapsedSec: 60, errorTags: [], difficulty: 2, ...over,
})

function planFor(events: AttemptEvent[]) {
  const state: AppState = { ...initialState(), events, onboarded: true, sessions: [1, 2, 3, 4].map(() => ({} as never)) }
  return buildSessionPlan({
    index: DEFAULT_INDEX,
    evidence: deriveEvidence(events, NOW),
    state,
    now: NOW,
    checkIn: { minutes: 30, energy: 'ok', focus: null },
  })
}

/**
 * RESEARCH.md §3: blocked practice at first exposure, interleaved after
 * acquisition. The core block used to be blocked unconditionally.
 */
describe('core block interleaves only after acquisition', () => {
  it('a brand-new learner gets blocked practice', () => {
    const plan = planFor([])
    const core = plan.blocks.find((b) => b.kind === 'core')
    expect(core).toBeTruthy()
    expect(core!.label).not.toMatch(/interleaved/)
    expect(plan.rationale.some((r) => /nterleav/.test(r))).toBe(false)
  })

  it('an acquired skill due for review is interleaved with its neighbours', () => {
    const events: AttemptEvent[] = []
    /*
     * The subject here is INTERLEAVING, so the setup has to guarantee that an
     * acquired skill actually wins the core block — otherwise the test silently
     * measures skill selection instead.
     *
     * The extra skills below are the CROSS-BUCKET GATEWAYS — the math skills
     * that physics, coding and scientific reasoning are waiting behind. While
     * one of those is unowned it correctly outranks a skill the learner already
     * holds (a door nobody can get through beats a door already open; see
     * `prereqLeverage` and GATEWAY_BONUS), so the test opens them first and
     * leaves the acquired skill on top.
     */
    for (const s of [
      'm-integers', 'm-fractions', 'm-decimals', 'm-ratio', 'm-percent',
      'm-exponents', 'm-proportion', 'm-stats', 'm-units', 'm-data', 'm-expressions',
    ]) {
      events.push(ev(s, `${s}-a`), ev(s, `${s}-b`))
    }
    // Two recent misses make m-integers the top-scoring skill while leaving it
    // independent — exactly the state where mixing neighbours is supported.
    events.push(ev('m-integers', 'm-integers-a', { firstCorrect: false, correct: false, t: NOW - 60_000 }))
    events.push(ev('m-integers', 'm-integers-b', { firstCorrect: false, correct: false, t: NOW - 30_000 }))

    const evidence = deriveEvidence(events, NOW)
    expect(evidenceFor(evidence, 'm-integers').state).toBe('independent')

    const plan = planFor(events)
    const core = plan.blocks.find((b) => b.kind === 'core')!
    const spanned = new Set(
      core.activities.flatMap((a) => DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? []),
    )
    expect(core.label).toMatch(/interleaved/)
    expect(spanned.size, 'core should span more than the one target skill').toBeGreaterThan(1)
    expect(plan.rationale.some((r) => /nterleav/.test(r))).toBe(true)
  })
})

describe('calibration steers the plan', () => {
  it('says so when confidence is running well ahead of accuracy', () => {
    const events: AttemptEvent[] = []
    for (const s of ['m-integers', 'm-fractions']) events.push(ev(s, `${s}-a`), ev(s, `${s}-b`))
    // Confident and wrong, repeatedly.
    for (let i = 0; i < 14; i++) {
      events.push(ev('m-integers', `m-integers-t${i}`, { firstCorrect: false, correct: false, confidence: 95 }))
    }
    const plan = planFor(events)
    expect(plan.rationale.some((r) => /onfidence/.test(r))).toBe(true)
  })

  it('stays quiet when there is not enough rated history to judge', () => {
    // calibrationGap refuses below its sample floor; the plan must not invent
    // a calibration story from three attempts.
    const events = [ev('m-integers', 'a'), ev('m-integers', 'b'), ev('m-fractions', 'c')]
    const plan = planFor(events)
    expect(plan.rationale.some((r) => /onfidence/.test(r))).toBe(false)
  })
})
