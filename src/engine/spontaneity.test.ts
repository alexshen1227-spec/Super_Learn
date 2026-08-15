/**
 * The spontaneity readout's refusal branches.
 *
 * Correctness rule 4 in CLAUDE.md: every number must be able to refuse to
 * exist. This one has more reason than most — it compares two rates, and a
 * comparison built on three attempts either side would produce a confident
 * sentence about nothing.
 */
import { describe, expect, it } from 'vitest'
import { MIN_PROBES, spontaneityReport } from './spontaneity'
import { DEFAULT_INDEX } from '../content/registry'
import type { AttemptEvent, ItemTemplate, SkillEvidence } from '../domain/types'

let n = 0
const at = (templateId: string, ok: boolean, over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `e${n++}`, t: 1000 + n, sessionId: 's', templateId, itemVersion: 1, seed: n,
  skillIds: ['x-method'], bucket: 'meta', mode: 'independent', firstResponse: 'x', finalResponse: 'x',
  correct: ok, firstCorrect: ok, score: null, validator: 'mcq', hintLevel: 0,
  confidence: null, elapsedSec: 30, errorTags: [], difficulty: 4, ...over,
})

/** A tiny index holding one probe and one ordinary item on the same skill. */
const index = {
  ...DEFAULT_INDEX,
  templates: new Map<string, ItemTemplate>([
    ['probe', { id: 'probe', skillIds: ['x-method'], spontaneous: true } as unknown as ItemTemplate],
    ['plain', { id: 'plain', skillIds: ['x-method'] } as unknown as ItemTemplate],
  ]),
} as unknown as Parameters<typeof spontaneityReport>[1]

const noEvidence = new Map<string, SkillEvidence>()

const probes = (hits: number, misses: number) => [
  ...Array.from({ length: hits }, () => at('probe', true)),
  ...Array.from({ length: misses }, () => at('probe', false)),
]
const ordinary = (hits: number, misses: number) => [
  ...Array.from({ length: hits }, () => at('plain', true)),
  ...Array.from({ length: misses }, () => at('plain', false)),
]

describe('the spontaneity readout refuses to speak too early', () => {
  it('says nothing at all with no probes', () => {
    const r = spontaneityReport([], index, noEvidence)
    expect(r.rate).toBeNull()
    expect(r.summary).toBeNull()
  })

  it('says nothing below the minimum number of probes', () => {
    const r = spontaneityReport(probes(MIN_PROBES - 1, 0), index, noEvidence)
    expect(r.attempts).toBe(MIN_PROBES - 1)
    expect(r.rate, 'a rate on four attempts would be a guess wearing a percentage').toBeNull()
    expect(r.summary).toBeNull()
  })

  it('reports the rate but refuses the comparison when ordinary practice is thin', () => {
    const r = spontaneityReport([...probes(3, 3), ...ordinary(2, 0)], index, noEvidence)
    expect(r.rate).toBeCloseTo(0.5)
    expect(r.promptedRate, 'two ordinary attempts cannot anchor a comparison').toBeNull()
    expect(r.summary).toContain('not yet enough ordinary practice')
  })

  it('compares against the same skills once both sides have enough', () => {
    const r = spontaneityReport([...probes(2, 4), ...ordinary(9, 1)], index, noEvidence)
    expect(r.rate).toBeCloseTo(1 / 3)
    expect(r.promptedRate).toBeCloseTo(0.9)
    expect(r.summary).toContain('33%')
    expect(r.summary).toContain('90%')
  })
})

describe('what the readout counts', () => {
  it('ignores hinted and placement attempts, as every other unaided figure does', () => {
    const events = [
      ...probes(5, 0),
      ...Array.from({ length: 5 }, () => at('probe', false, { hintLevel: 2 })),
      ...Array.from({ length: 5 }, () => at('probe', false, { mode: 'placement' as const })),
    ]
    const r = spontaneityReport(events, index, noEvidence)
    expect(r.attempts, 'hinted and placement probes must not dilute the figure').toBe(5)
    expect(r.rate).toBe(1)
  })

  it('compares only against skills the probes actually covered', () => {
    // An ordinary item on an UNRELATED skill must not enter the comparison.
    const unrelated = Array.from({ length: 20 }, () =>
      at('plain', false, { skillIds: ['m-proportion'] }),
    )
    const r = spontaneityReport([...probes(5, 0), ...ordinary(5, 0), ...unrelated], index, noEvidence)
    expect(r.promptedAttempts, 'the comparison group is per-skill, not the whole diet').toBe(5)
    expect(r.promptedRate).toBe(1)
  })
})

describe('the real bank', () => {
  it('ships probes, and they are marked so nothing else has to know about them', () => {
    const marked = [...DEFAULT_INDEX.templates.values()].filter((t) => t.spontaneous)
    expect(marked.length).toBeGreaterThan(0)
    // The load-bearing claim: a probe is never also a ladder item.
    for (const t of marked) {
      expect(t.transfer, `${t.id}: a probe must not double as a transfer proof`).not.toBe(true)
    }
  })
})

/**
 * The guarantee the whole design rests on, tested through the real replay.
 *
 * The `spontaneous` flag alone was decorative when this shipped: nothing
 * enforced it, so the app told the learner "this does not count" while the
 * event advanced the skill exactly like any other. Caught on the production
 * build, where the feedback banner read "that is the evidence that advances
 * skills" directly above an explanation saying the opposite.
 */
describe('a probe never moves the ladder', () => {
  it('leaves the skill untouched however many probes are answered', async () => {
    const { evidenceFor, deriveEvidence } = await import('./mastery')
    const skill = 'x-method'
    const probeEvents = Array.from({ length: 12 }, (_, i) =>
      at('sp-everyday', true, { t: 1_000_000 + i * 86_400_000, skillIds: [skill] }),
    )
    const { stateRank } = await import('./mastery')
    const ev = evidenceFor(deriveEvidence(probeEvents, 1_000_000 + 20 * 86_400_000), skill)
    // `introduced` is the honest outcome and the one PFL exposure produces
    // too: the learner HAS met material touching this skill. What must never
    // happen is ownership — guided or above — from probes alone.
    expect(
      stateRank(ev.state) < stateRank('guided'),
      `twelve unaided probe hits proved a skill (${ev.state})`,
    ).toBe(true)
  })

  it('does not count them against the skill either', async () => {
    const { evidenceFor, deriveEvidence } = await import('./mastery')
    const skill = 'x-method'
    const mixed = [
      ...Array.from({ length: 4 }, (_, i) =>
        at('sp-everyday', false, { t: 1_000_000 + i * 3600_000, skillIds: [skill] }),
      ),
    ]
    const ev = evidenceFor(deriveEvidence(mixed, 2_000_000), skill)
    expect(ev.recentMisses, 'a probe miss says the rule did not fire, not that the skill is weak').toBe(0)
  })
})
