/**
 * The rules for handing a learner's own problem back, and for offering to let
 * them write one.
 *
 * The behaviour worth protecting here is mostly about RESTRAINT: not asking
 * too soon, not asking for more while something is owed, and not turning a
 * declined offer into something the app reacts to.
 */
import { describe, expect, it } from 'vitest'
import {
  COLD_READ_DAYS,
  INVITE_EVERY_SESSIONS,
  coldReadBacklog,
  dueForColdRead,
  shouldInviteCreator,
} from './authoredReview'
import type { AuthoredProblem } from '../domain/types'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 7, 10, 12)

function problem(over: Partial<AuthoredProblem> = {}): AuthoredProblem {
  return {
    id: 'a1',
    t: NOW - 10 * DAY,
    shapeId: 'price-swing',
    slots: { start: 100, up: 20, down: 20 },
    prompt: 'x',
    answer: 96,
    unit: '£',
    skillId: 'm-percent',
    predictedOk: false,
    sensible: null,
    reviewedAt: null,
    ...over,
  }
}

describe('handing a problem back for a cold read', () => {
  it('waits until the details have had time to fade', () => {
    const fresh = problem({ t: NOW - 60_000 })
    expect(dueForColdRead([fresh], NOW), 'a problem written minutes ago is not a cold read').toBeNull()
    const almost = problem({ t: NOW - (COLD_READ_DAYS * DAY - 1000) })
    expect(dueForColdRead([almost], NOW)).toBeNull()
    const ready = problem({ t: NOW - COLD_READ_DAYS * DAY })
    expect(dueForColdRead([ready], NOW)?.id).toBe('a1')
  })

  it('never returns one that has already been judged', () => {
    expect(dueForColdRead([problem({ sensible: true })], NOW)).toBeNull()
    expect(dueForColdRead([problem({ sensible: false })], NOW)).toBeNull()
  })

  it('offers the oldest first, one at a time', () => {
    const list = [
      problem({ id: 'new', t: NOW - 4 * DAY }),
      problem({ id: 'old', t: NOW - 30 * DAY }),
      problem({ id: 'mid', t: NOW - 9 * DAY }),
    ]
    expect(dueForColdRead(list, NOW)?.id).toBe('old')
    expect(coldReadBacklog(list, NOW)).toBe(3)
  })

  it('is empty when nothing has been written', () => {
    expect(dueForColdRead([], NOW)).toBeNull()
    expect(coldReadBacklog([], NOW)).toBe(0)
  })
})

describe('offering to write one', () => {
  it('appears on a steady cadence of finished sessions', () => {
    const opts = { authored: [], now: NOW }
    expect(shouldInviteCreator({ ...opts, sessionCount: INVITE_EVERY_SESSIONS })).toBe(true)
    expect(shouldInviteCreator({ ...opts, sessionCount: INVITE_EVERY_SESSIONS * 2 })).toBe(true)
    for (let n = 1; n < INVITE_EVERY_SESSIONS; n++) {
      expect(shouldInviteCreator({ ...opts, sessionCount: n }), `session ${n}`).toBe(false)
    }
  })

  it('never fires before the first session is finished', () => {
    expect(shouldInviteCreator({ sessionCount: 0, authored: [], now: NOW })).toBe(false)
  })

  /**
   * The suppression that keeps this from becoming a pile of homework: do not
   * ask for another one while a previous one is still waiting to be judged.
   */
  it('stays quiet while a problem is waiting to be re-read', () => {
    const waiting = [problem({ t: NOW - 20 * DAY })]
    expect(shouldInviteCreator({ sessionCount: INVITE_EVERY_SESSIONS, authored: waiting, now: NOW })).toBe(false)
  })

  it('stays quiet for a week after one was written', () => {
    const justWritten = [problem({ t: NOW - 2 * DAY, sensible: true })]
    expect(shouldInviteCreator({ sessionCount: INVITE_EVERY_SESSIONS, authored: justWritten, now: NOW })).toBe(false)
    const older = [problem({ t: NOW - 8 * DAY, sensible: true })]
    expect(shouldInviteCreator({ sessionCount: INVITE_EVERY_SESSIONS, authored: older, now: NOW })).toBe(true)
  })

  /**
   * Declining must cost nothing and change nothing. If the cadence responded
   * to refusals — backing off, or pressing harder — the offer would start
   * behaving like a nag, which is the machinery the founding brief refuses.
   * Nothing is recorded when it is ignored, so the same session count always
   * produces the same answer.
   */
  it('is not affected by having been ignored before', () => {
    const a = shouldInviteCreator({ sessionCount: 14, authored: [], now: NOW })
    const b = shouldInviteCreator({ sessionCount: 14, authored: [], now: NOW + 5 * DAY })
    expect(a).toBe(true)
    expect(b).toBe(true)
  })
})
