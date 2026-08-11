/**
 * The number this app exists to produce has to be hard to fake.
 *
 * Every test here is an attempt to earn a durable skill without actually
 * retaining anything: with hints, on the same question twice, too soon, on an
 * item whose answer was read elsewhere, or on an attempt under dispute. All of
 * them must fail. The one honest route must succeed, or the metric is measuring
 * nothing and the failures pass for the wrong reason.
 */
import { describe, expect, it } from 'vitest'
import type { AttemptEvent, DisputeEvent } from '../domain/types'
import { BURNED_TEMPLATE_IDS } from '../content/burned'
import { BUILTIN_TEMPLATES } from '../content/registry'
import { DURABLE_GAP_DAYS, QUARTER_DAYS, durableByWeek, northStar } from './northStar'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 0, 6, 9)
const SKILL = 'm-fractions'
const CLEAN = BUILTIN_TEMPLATES.filter((t) => !BURNED_TEMPLATE_IDS.has(t.id)).map((t) => t.id)

let n = 0
function ev(over: Partial<AttemptEvent> & { t: number; templateId: string }): AttemptEvent {
  return {
    id: `e${n++}`,
    sessionId: 's',
    itemVersion: 1,
    seed: 0,
    skillIds: [SKILL],
    bucket: 'math',
    mode: 'independent',
    correct: true,
    firstCorrect: true,
    score: 1,
    hintLevel: 0,
    elapsedSec: 120,
    validator: 'numeric',
    response: '1',
    difficulty: 3,
    ...over,
  } as unknown as AttemptEvent
}

const NOW = T0 + 40 * DAY
const star = (events: AttemptEvent[], disputes: DisputeEvent[] = [], now = NOW) => northStar(events, disputes, now)

describe('a durable skill is hard to earn', () => {
  it('CONTROL: unaided, a fortnight apart, different family — this one counts', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 20 * DAY, templateId: CLEAN[1] })])
    expect(s.durable.map((d) => d.skillId)).toEqual([SKILL])
    expect(s.durable[0].gapDays).toBeCloseTo(20, 5)
  })

  it('the same question twice does not count, however long the gap', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 30 * DAY, templateId: CLEAN[0] })])
    expect(s.durable).toEqual([])
  })

  it('two days is not a fortnight', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 2 * DAY, templateId: CLEAN[1] })])
    expect(s.durable).toEqual([])
  })

  it('a hinted re-demonstration does not count', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 20 * DAY, templateId: CLEAN[1], hintLevel: 1 })])
    expect(s.durable).toEqual([])
  })

  it('a repaired answer does not count — first submission or nothing', () => {
    const s = star([
      ev({ t: T0, templateId: CLEAN[0] }),
      ev({ t: T0 + 20 * DAY, templateId: CLEAN[1], firstCorrect: false, correct: true }),
    ])
    expect(s.durable).toEqual([])
  })

  it('placement cannot establish or prove it', () => {
    const s = star([
      ev({ t: T0, templateId: CLEAN[0], mode: 'placement' }),
      ev({ t: T0 + 20 * DAY, templateId: CLEAN[1], mode: 'placement' }),
    ])
    expect(s.durable).toEqual([])
    expect(s.everUnaided).toBe(0)
  })

  it('an item whose answer was read elsewhere cannot prove it', () => {
    const burned = [...BURNED_TEMPLATE_IDS][0]
    expect(burned).toBeTruthy()
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 20 * DAY, templateId: burned })])
    expect(s.durable).toEqual([])
  })

  it('a disputed attempt cannot prove it while it is quarantined', () => {
    const proof = ev({ t: T0 + 20 * DAY, templateId: CLEAN[1] })
    const events = [ev({ t: T0, templateId: CLEAN[0] }), proof]
    expect(star(events).durable).toHaveLength(1)
    const disputes: DisputeEvent[] = [
      { id: 'd1', t: NOW, kind: 'raised', attemptId: proof.id, templateId: CLEAN[1], itemVersion: 1, seed: 0, note: 'x' },
    ]
    expect(star(events, disputes).durable).toEqual([])
  })

  it('the gap is measured from the FIRST unaided success, not the latest', () => {
    // Practising every day for a fortnight and then succeeding is not the same
    // as leaving it alone for a fortnight, but both should qualify — the claim
    // is that it survived from when it was learned.
    const events = [ev({ t: T0, templateId: CLEAN[0] })]
    for (let d = 1; d <= 20; d++) events.push(ev({ t: T0 + d * DAY, templateId: CLEAN[d % 5] }))
    expect(star(events).durable).toHaveLength(1)
    expect(star(events).durable[0].learnedAt).toBe(T0)
  })
})

describe('the numbers refuse to exist when the evidence is thin', () => {
  it('a per-skill cost is null below five durable skills', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 20 * DAY, templateId: CLEAN[1] })])
    expect(s.durable).toHaveLength(1)
    expect(s.minutesPerDurableSkill).toBeNull()
  })

  it('…and appears once there are enough to average', () => {
    const events: AttemptEvent[] = []
    for (let i = 0; i < 6; i++) {
      const skill = `skill-${i}`
      events.push(ev({ t: T0, templateId: CLEAN[i], skillIds: [skill] }))
      events.push(ev({ t: T0 + 20 * DAY, templateId: CLEAN[i + 10], skillIds: [skill] }))
    }
    const s = star(events)
    expect(s.durable).toHaveLength(6)
    // Two attempts of 120s each, all on one skill.
    expect(s.minutesPerDurableSkill).toBeCloseTo(4, 5)
  })

  it('says outright when there is not a quarter of history', () => {
    expect(star([ev({ t: T0, templateId: CLEAN[0] })]).hasQuarterOfHistory).toBe(false)
    const old = star([ev({ t: T0, templateId: CLEAN[0] })], [], T0 + (QUARTER_DAYS + 1) * DAY)
    expect(old.hasQuarterOfHistory).toBe(true)
  })

  it('an empty log produces zeroes and nulls, not a crash', () => {
    const s = star([])
    expect(s.durable).toEqual([])
    expect(s.minutesPerDurableSkill).toBeNull()
    expect(s.totalMinutes).toBe(0)
  })
})

describe('the three-month questions', () => {
  const now = T0 + 200 * DAY
  const long = () => {
    const events: AttemptEvent[] = []
    // Learned long ago and shown again recently: SURVIVED.
    events.push(ev({ t: T0, templateId: CLEAN[0], skillIds: ['kept'] }))
    events.push(ev({ t: now - 5 * DAY, templateId: CLEAN[1], skillIds: ['kept'] }))
    // Learned long ago and never revisited: UNTESTED, not "lost".
    events.push(ev({ t: T0 + DAY, templateId: CLEAN[2], skillIds: ['dormant'] }))
    // Learned inside the window and proved inside it: GAINED.
    events.push(ev({ t: now - 40 * DAY, templateId: CLEAN[3], skillIds: ['new'] }))
    events.push(ev({ t: now - 5 * DAY, templateId: CLEAN[4], skillIds: ['new'] }))
    return events
  }

  it('separates what survived from what simply has not been asked', () => {
    const s = star(long(), [], now)
    expect(s.survivedFromLastQuarter).toBe(1)
    expect(s.untestedSinceLastQuarter).toBe(1)
  })

  it('counts what was gained inside the window', () => {
    const s = star(long(), [], now)
    expect(s.gainedThisQuarter).toBe(1)
    expect(s.durable.map((d) => d.skillId).sort()).toEqual(['kept', 'new'])
  })
})

describe('transfer is counted separately and never folded in', () => {
  it('is its own number', () => {
    const events = [
      ev({ t: T0, templateId: CLEAN[0] }),
      ev({ t: T0 + 20 * DAY, templateId: CLEAN[1], mode: 'transfer' }),
    ]
    const s = star(events)
    expect(s.transferred).toBe(1)
    expect(s.durable).toHaveLength(1)
  })
})

describe('the weekly trend is allowed to be flat', () => {
  it('reports zeroes rather than hiding empty weeks', () => {
    const s = star([ev({ t: T0, templateId: CLEAN[0] }), ev({ t: T0 + 20 * DAY, templateId: CLEAN[1] })])
    const weeks = durableByWeek(s, NOW, 8)
    expect(weeks).toHaveLength(8)
    expect(weeks.filter((w) => w.proved === 0).length).toBeGreaterThan(4)
    expect(weeks.map((w) => w.weekStart)).toEqual([...weeks.map((w) => w.weekStart)].sort((a, b) => a - b))
  })
})

describe('the gap constant is the stated one', () => {
  it('is a fortnight, and the ladder’s 48 hours is deliberately not reused', () => {
    expect(DURABLE_GAP_DAYS).toBe(14)
  })
})
