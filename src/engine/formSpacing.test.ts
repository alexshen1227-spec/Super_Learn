import { describe, expect, it } from 'vitest'
import { deriveEvidence, evidenceFor } from './mastery'
import { dueForms, dueReviews } from './scheduler'
import type { AttemptEvent } from '../domain/types'

const DAY = 86_400_000
const T0 = Date.parse('2026-06-01T09:00:00Z')
let n = 0
const at = (days: number, tpl: string, ok: boolean, over: Partial<AttemptEvent> = {}): AttemptEvent => ({
  id: `f${n++}`,
  t: T0 + days * DAY,
  sessionId: 's1',
  templateId: tpl,
  itemVersion: 1,
  seed: n,
  skillIds: ['m-percent'],
  bucket: 'math',
  mode: 'independent',
  firstResponse: 'x',
  finalResponse: 'x',
  correct: ok,
  firstCorrect: ok,
  score: null,
  validator: 'numeric',
  hintLevel: 0,
  confidence: null,
  elapsedSec: 60,
  errorTags: [],
  difficulty: 2,
  ...over,
})

/**
 * THE MASKING BUG this feature exists to fix.
 *
 * A skill spans many question families. With only a skill-level schedule, a
 * learner could fail one family, then satisfy the skill's review with an easy
 * family — pushing the interval out to 30 and then 60 days while the family
 * they actually failed went untested.
 */
describe('a strong question family cannot hide a weak one', () => {
  // Owns "easy"; keeps failing "hard".
  const events = [
    at(0, 'easy', true),
    at(1, 'easy', true),
    at(2, 'hard', false),
    at(3, 'easy', true),
    at(6, 'easy', true),
    at(13, 'easy', true),
  ]
  const NOW = T0 + 30 * DAY

  it('the skill reads RETAINED — which is exactly the trap', () => {
    const ev = evidenceFor(deriveEvidence(events, NOW), 'm-percent')
    // Worse than "looks fine": the delayed successes on the easy family earn
    // the retention rung outright, so the skill advertises durable mastery
    // while a family the learner failed has never been retested.
    expect(ev.state).toBe('retained')
    // The skill-level schedule was pushed out by the easy family's successes.
    expect(ev.review!.due).toBeGreaterThan(T0 + 13 * DAY)
  })

  it('but the failed family is tracked separately and is overdue', () => {
    const ev = evidenceFor(deriveEvidence(events, NOW), 'm-percent')
    const hard = ev.forms.find((f) => f.templateId === 'hard')!
    const easy = ev.forms.find((f) => f.templateId === 'easy')!
    expect(hard.lapses).toBe(1)
    expect(hard.lastOutcomeCorrect).toBe(false)
    expect(hard.due).toBeLessThan(NOW) // overdue
    // The easy family climbed the ladder; the hard one did not.
    expect(easy.intervalIndex).toBeGreaterThan(hard.intervalIndex)
  })

  it('dueForms names the failed family and ranks it first', () => {
    const due = dueForms(deriveEvidence(events, NOW), NOW)
    expect(due.length).toBeGreaterThan(0)
    expect(due[0].templateId).toBe('hard')
    expect(due[0].reason).toBe('lapsed')
  })

  it('answering the easy family again does NOT clear the hard one', () => {
    const more = [...events, at(29, 'easy', true)]
    const due = dueForms(deriveEvidence(more, NOW), NOW)
    expect(due.some((f) => f.templateId === 'hard'), 'the weak family must survive an easy success').toBe(true)
  })

  it('answering the hard family reschedules it forward', () => {
    const repairedAt = 29
    const repaired = [...events, at(repairedAt, 'hard', true)]
    const ev = evidenceFor(deriveEvidence(repaired, NOW), 'm-percent')
    const hard = ev.forms.find((f) => f.templateId === 'hard')!
    // No longer a lapse, and pushed into the future from the moment of repair.
    expect(hard.lastOutcomeCorrect).toBe(true)
    expect(hard.due).toBeGreaterThan(T0 + repairedAt * DAY)
    const due = dueForms(deriveEvidence(repaired, T0 + 29.5 * DAY), T0 + 29.5 * DAY)
    expect(due.some((f) => f.templateId === 'hard'), 'repaired family should not be due same-day').toBe(false)
  })
})

describe('family scheduling stays honest', () => {
  it('families never attempted have no schedule, so they cannot flood the queue', () => {
    // Only 'easy' was ever attempted; the skill has many other families.
    const ev = evidenceFor(deriveEvidence([at(0, 'easy', true), at(1, 'easy', true)], T0 + 2 * DAY), 'm-percent')
    expect(ev.forms.map((f) => f.templateId)).toEqual(['easy'])
  })

  it('placement schedules nothing — it routes, it does not teach', () => {
    const ev = evidenceFor(
      deriveEvidence([at(0, 'probe', true, { mode: 'placement' })], T0 + DAY),
      'm-percent',
    )
    expect(ev.forms).toEqual([])
  })

  it('below guided there is nothing to re-test', () => {
    const due = dueForms(deriveEvidence([at(0, 'easy', false)], T0 + 5 * DAY), T0 + 5 * DAY)
    expect(due).toEqual([])
  })

  it('the queue is capped so review load cannot run away', () => {
    const many: AttemptEvent[] = []
    for (let i = 0; i < 40; i++) {
      many.push(at(0, `fam${i}`, true), at(1, `fam${i}`, true), at(2, `fam${i}`, false))
    }
    const due = dueForms(deriveEvidence(many, T0 + 40 * DAY), T0 + 40 * DAY)
    expect(due.length).toBeLessThanOrEqual(12)
  })

  it('skill-level review still works and is unchanged', () => {
    const ev = evidenceFor(deriveEvidence([at(0, 'easy', true)], T0 + DAY), 'm-percent')
    expect(ev.review).not.toBeNull()
    expect(dueReviews(deriveEvidence([at(0, 'easy', true)], T0 + 10 * DAY), T0 + 10 * DAY)).toBeDefined()
  })
})
