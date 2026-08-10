import { describe, expect, it } from 'vitest'
import { MIN_PROBES, isPflTemplate, pflProbes, pflReport } from './pfl'
import { deriveEvidence } from './mastery'
import { SKILL_BY_ID } from '../content/skills'
import { initialState, type AttemptEvent } from '../domain/types'
import { coachBeliefs } from './coach'
import { DEFAULT_INDEX } from '../content/registry'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 6, 1, 12)
let n = 0
const ev = (over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `p${n++}`, t: T0 + n * 60_000, sessionId: 's', templateId: 'tpl', itemVersion: 1, seed: n,
  skillIds: ['m-integers'], bucket: 'math', mode: 'independent', firstResponse: 'x', finalResponse: 'x',
  correct: true, firstCorrect: true, score: null, validator: 'numeric', hintLevel: 0,
  confidence: null, elapsedSec: 60, errorTags: [], difficulty: 2, ...over,
})
/**
 * A probe in exactly the shape SessionScreen.logEvent writes: no graded
 * verdict at all (exposure), the outcome carried in `score`, and hintLevel
 * raised as defence in depth. Built to match the player deliberately — an
 * earlier version of this helper hand-set `firstCorrect: false`, which made
 * these tests pass against a player that was in fact writing `true`.
 *
 * Each call gets its own template id by default, because only a learner's FIRST
 * encounter with an idea counts — reusing one id would collapse to a single
 * probe, which is the behaviour its own test below pins down.
 */
let probeN = 0
const probe = (score: number, over: Partial<AttemptEvent> = {}): AttemptEvent =>
  ev({ templateId: `pfl-idea${probeN++}`, hintLevel: 1, score, firstCorrect: null, correct: null, ...over })

const evidenceAt = (events: AttemptEvent[]) => (upTo: number) =>
  deriveEvidence(events.filter((e) => e.t <= upTo), upTo)

const report = (events: AttemptEvent[]) => pflReport(pflProbes(events, SKILL_BY_ID, evidenceAt(events)))

describe('PFL probes are identified and collected', () => {
  it('recognises probes by prefix and ignores ordinary work', () => {
    expect(isPflTemplate('pfl-modular')).toBe(true)
    expect(isPflTemplate('int-ops')).toBe(false)
    const mixed = [ev(), probe(1), ev(), probe(0.5)]
    expect(pflProbes(mixed, SKILL_BY_ID, evidenceAt(mixed)).length).toBe(2)
  })
})

describe('the readout refuses to exist without enough evidence', () => {
  it('says nothing under the minimum', () => {
    const events = Array.from({ length: MIN_PROBES - 1 }, () => probe(1))
    const r = report(events)
    expect(r.pickUp).toBeNull()
    expect(r.summary).toMatch(/Not enough yet/)
  })

  it('reports a pick-up rate once there are enough', () => {
    const events = Array.from({ length: MIN_PROBES }, (_, i) => probe(i % 2 === 0 ? 1 : 0.5))
    const r = report(events)
    expect(r.pickUp).toBeCloseTo(0.75)
    expect(r.summary).toMatch(/picked up 75%/)
  })

  it('stays silent on the prerequisite comparison until both sides have samples', () => {
    // All probes with prerequisites unowned: one side is empty.
    const events = Array.from({ length: 6 }, () => probe(0.5))
    const r = report(events)
    expect(r.pickUp).not.toBeNull()
    expect(r.withPrereqs).toBeNull()
    expect(r.summary).toMatch(/Not enough probes yet on both sides/)
  })
})

/**
 * THE LOAD-BEARING TEST. A PFL probe hands the learner the explanation before
 * asking, so it is not evidence of ownership in EITHER direction: it must not
 * promote a skill, and it must not be recorded as a miss either. If a probe can
 * move the ladder at all, the measure has become the soft growth number this
 * app exists to refuse.
 *
 * Probes are therefore written as exposure (no graded verdict), so a skill
 * touched only by probes stays at `introduced` — seen, nothing proven.
 */
describe('a probe is never a rung', () => {
  it('cannot produce independent evidence however many are answered perfectly', () => {
    const many = Array.from({ length: 10 }, (_, i) => probe(1, { templateId: `pfl-x${i}` }))
    const e = deriveEvidence(many, T0 + 30 * DAY).get('m-integers')!
    expect(e.independentForms.length).toBe(0)
    expect(e.state).toBe('introduced')
    expect(e.transferredAt).toBeNull()
  })

  it('adds no evidence of any kind alongside real practice', () => {
    // One genuine independent success, then a pile of perfect probes.
    const real = [ev({ templateId: 'real-a' })]
    const withProbes = [
      ...real,
      ...Array.from({ length: 8 }, (_, i) => probe(1, { templateId: `pfl-y${i}` })),
    ]
    const alone = deriveEvidence(real, T0 + 30 * DAY).get('m-integers')!
    const mixed = deriveEvidence(withProbes, T0 + 30 * DAY).get('m-integers')!
    // The probes changed nothing the ladder can see.
    expect(mixed.independentForms.length).toBe(alone.independentForms.length)
    expect(mixed.state).toBe(alone.state)
    expect(mixed.guidedSuccesses).toBe(alone.guidedSuccesses)
  })

  it('a failed probe is not held against the learner', () => {
    const flunked = Array.from({ length: 6 }, (_, i) => probe(0, { templateId: `pfl-w${i}` }))
    const e = deriveEvidence(flunked, T0 + DAY).get('m-integers')!
    expect(e.recentMisses).toBe(0)
    expect(e.state).toBe('introduced')
  })

  it('never schedules a review of its own', () => {
    const only = Array.from({ length: 5 }, (_, i) => probe(1, { templateId: `pfl-z${i}` }))
    const e = deriveEvidence(only, T0 + DAY).get('m-integers')!
    expect(e.state).toBe('introduced')
    expect(e.transferredAt).toBeNull()
  })
})

describe('the prerequisite split is judged at the time of the probe', () => {
  it('does not credit knowledge the learner only acquired later', () => {
    // m-fractions requires m-integers. Probe FIRST, own the prereq afterwards.
    const events = [
      probe(1, { t: T0, skillIds: ['m-fractions'], templateId: 'pfl-a' }),
      ev({ t: T0 + DAY, skillIds: ['m-integers'], templateId: 'later-1' }),
      ev({ t: T0 + DAY + 1000, skillIds: ['m-integers'], templateId: 'later-2' }),
    ]
    const probes = pflProbes(events, SKILL_BY_ID, evidenceAt(events))
    expect(probes.length).toBe(1)
    // Judged against what was true before the probe, not against today.
    expect(probes[0].prereqsOwned).toBe(false)
  })
})

/**
 * The regression that motivated writing probes as exposure. The coach reads
 * `firstCorrect` for per-bucket accuracy WITHOUT re-checking hintLevel, so
 * while probes carried a graded verdict a perfect run of them could talk the
 * coach into "Math is currently a strength" on the strength of work where the
 * learner had been handed the explanation.
 */
describe('probes are invisible to the derived readouts', () => {
  it('cannot move the coach off what real practice says', () => {
    const real = Array.from({ length: 12 }, (_, i) =>
      // A deliberately mixed record: the coach should not call this a strength.
      ev({ templateId: `real-${i}`, firstCorrect: i % 2 === 0, correct: i % 2 === 0, t: T0 + i * 60_000 }),
    )
    // Enough perfect probes to drag 50% real accuracy over the 80% "strength"
    // threshold if they were ever counted: (6 + 24) / (12 + 24) = 83%.
    const probes = Array.from({ length: 24 }, (_, i) =>
      probe(1, { templateId: `pfl-c${i}`, t: T0 + (100 + i) * 60_000 }),
    )
    const at = T0 + 2 * DAY
    const base = { ...initialState(), events: real }
    const withProbes = { ...initialState(), events: [...real, ...probes] }
    const a = coachBeliefs(DEFAULT_INDEX, deriveEvidence(real, at), base, at)
    const b = coachBeliefs(DEFAULT_INDEX, deriveEvidence([...real, ...probes], at), withProbes, at)
    const strengths = (bs: typeof a) => bs.filter((x) => x.id.startsWith('strong-')).map((x) => x.id)
    expect(strengths(b)).toEqual(strengths(a))
  })
})

/**
 * Events are append-only and never mutated, and imports are treated as
 * hostile. A probe event carrying a graded verdict — written by an older
 * build, or arriving from another device — must still be inert. The guarantee
 * is re-imposed during replay so it does not depend on who wrote the event.
 */
describe('a probe stays inert even when the event claims otherwise', () => {
  const forged = (over: Partial<AttemptEvent> = {}): AttemptEvent =>
    ev({ templateId: 'pfl-modular', hintLevel: 0, firstCorrect: true, correct: true, ...over })

  it('ignores a graded verdict on an imported or legacy probe event', () => {
    const many = Array.from({ length: 10 }, (_, i) => forged({ templateId: `pfl-forged${i}` }))
    const e = deriveEvidence(many, T0 + 30 * DAY).get('m-integers')!
    expect(e.independentForms.length).toBe(0)
    expect(e.state).toBe('introduced')
  })

  it('ignores a forged miss too, so a probe cannot be used to damage a skill', () => {
    const real = [ev({ templateId: 'real-a' }), ev({ templateId: 'real-b' })]
    const attacked = [...real, ...Array.from({ length: 8 }, (_, i) =>
      forged({ templateId: `pfl-bad${i}`, firstCorrect: false, correct: false, t: T0 + (50 + i) * 60_000 }))]
    const at = T0 + 2 * DAY
    const clean = deriveEvidence(real, at).get('m-integers')!
    const dirty = deriveEvidence(attacked, at).get('m-integers')!
    expect(dirty.state).toBe(clean.state)
    expect(dirty.recentMisses).toBe(clean.recentMisses)
  })
})

/**
 * Repeating one probe is a memory test, not a pick-up measurement. Before this
 * rule, tapping a single probe four times satisfied MIN_PROBES and produced a
 * pick-up figure built entirely from re-reads — with only three probes shipped
 * against a threshold of four, that was the ONLY way to reach the readout.
 */
describe('only a first encounter with an idea counts', () => {
  it('collapses repeats of the same probe to one', () => {
    const same = Array.from({ length: 6 }, (_, i) =>
      probe(1, { templateId: 'pfl-modular', t: T0 + i * 60_000 }))
    expect(pflProbes(same, SKILL_BY_ID, evidenceAt(same)).length).toBe(1)
    expect(report(same).pickUp).toBeNull()
    expect(report(same).summary).toMatch(/Not enough yet/)
  })

  it('keeps the FIRST attempt, not the best or the latest', () => {
    // Fumbled it cold, then aced the re-read. Only the cold attempt is real.
    const events = [
      probe(0, { templateId: 'pfl-modular', t: T0 }),
      probe(1, { templateId: 'pfl-modular', t: T0 + DAY }),
    ]
    const got = pflProbes(events, SKILL_BY_ID, evidenceAt(events))
    expect(got.length).toBe(1)
    expect(got[0].score).toBe(0)
  })

  it('still counts distinct ideas separately', () => {
    const distinct = [
      probe(1, { templateId: 'pfl-modular' }),
      probe(1, { templateId: 'pfl-simpson' }),
      probe(1, { templateId: 'pfl-pigeonhole' }),
    ]
    expect(pflProbes(distinct, SKILL_BY_ID, evidenceAt(distinct)).length).toBe(3)
  })
})

/**
 * A probe whose skill has NO prerequisites cannot be evidence about
 * prerequisite ownership in either direction. It used to be recorded as
 * `prereqsOwned: false`, which put `pfl-modular` (attached to `m-integers`,
 * which has none) permanently on the "without prerequisites" side for every
 * learner — one probe in nine, quietly biasing the comparison it fed.
 */
describe('probes that cannot answer the prerequisite question are excluded from it', () => {
  const probe = (score: number, prereqsOwned: boolean | null) => ({ t: 0, skillId: 's', score, prereqsOwned })

  it('counts a no-prerequisite probe in the overall rate but on neither side', () => {
    const report = pflReport([
      probe(1, null), probe(1, null), probe(1, null),
      probe(0, true), probe(0, true), probe(0, true),
    ])
    expect(report.probes).toBe(6)
    // Overall includes every probe: three 1s and three 0s.
    expect(report.pickUp).toBeCloseTo(0.5, 5)
    // The "with" side has its three samples; the "without" side has none, so
    // it refuses rather than reporting the null-prerequisite probes as 100%.
    expect(report.withPrereqs).toBeCloseTo(0, 5)
    expect(report.withoutPrereqs).toBeNull()
  })

  it('still splits normally when both sides have real samples', () => {
    const report = pflReport([
      probe(1, true), probe(1, true), probe(1, true),
      probe(0, false), probe(0, false), probe(0, false),
    ])
    expect(report.withPrereqs).toBeCloseTo(1, 5)
    expect(report.withoutPrereqs).toBeCloseTo(0, 5)
  })
})
