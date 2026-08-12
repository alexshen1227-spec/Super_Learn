import { describe, expect, it } from 'vitest'
import { curriculumEnd } from './curriculumEnd'
import type { AttemptEvent, SkillNode } from '../domain/types'

const DAY = 86_400_000
const NOW = Date.UTC(2027, 0, 1)

function skills(n: number): SkillNode[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`, name: `Skill ${i}`, bucket: 'meta', prereqs: [], gradeBand: 8,
    blurb: '', courseId: 'c', unitId: 'u', kbIds: [`s${i}`],
  })) as SkillNode[]
}

let seq = 0
function attempt(skillId: string, t: number, templateId: string): AttemptEvent {
  seq += 1
  return {
    id: `e${seq}`, t, sessionId: `sess${seq}`, templateId, itemVersion: 1, seed: seq,
    skillIds: [skillId], bucket: 'meta', mode: 'independent', firstResponse: 'x', finalResponse: 'x',
    correct: true, firstCorrect: true, score: null, validator: 'numeric', hintLevel: 0,
    confidence: null, elapsedSec: 120, errorTags: [], difficulty: 3,
  }
}

/** Two unaided passes on DIFFERENT families, 30 days apart: durable. */
function proved(skillId: string): AttemptEvent[] {
  return [attempt(skillId, NOW - 60 * DAY, `${skillId}-a`), attempt(skillId, NOW - 20 * DAY, `${skillId}-b`)]
}

describe('curriculum end', () => {
  it('says nothing while the picture is thin', () => {
    // Ten skills proved out of a hundred is not "nearly finished", however
    // clean the ratio of proved-to-met looks.
    const events = Array.from({ length: 10 }, (_, i) => proved(`s${i}`)).flat()
    const r = curriculumEnd(events, [], skills(100), NOW)
    expect(r.stage).toBe('early')
    expect(r.remaining).toBe(90)
  })

  it('will not call it complete on a high proved-of-met ratio alone', () => {
    // 100% of what was MET is durable, but only half the app was ever met.
    const events = Array.from({ length: 50 }, (_, i) => proved(`s${i}`)).flat()
    expect(curriculumEnd(events, [], skills(100), NOW).stage).toBe('early')
  })

  it('sees the end coming without claiming it', () => {
    const events = Array.from({ length: 82 }, (_, i) => proved(`s${i}`)).flat()
    const r = curriculumEnd(events, [], skills(100), NOW)
    expect(r.stage).toBe('most-of-the-way')
    expect(r.durable).toBe(82)
  })

  it('says it plainly once the ground has run out', () => {
    const events = Array.from({ length: 96 }, (_, i) => proved(`s${i}`)).flat()
    const r = curriculumEnd(events, [], skills(100), NOW)
    expect(r.stage).toBe('complete')
    expect(r.remaining).toBe(4)
  })

  it('does not count work that never cleared the retention bar', () => {
    // Ninety-six skills MET, all recent, none of them proved across a gap.
    const events = Array.from({ length: 96 }, (_, i) => [
      attempt(`s${i}`, NOW - 3 * DAY, `s${i}-a`),
      attempt(`s${i}`, NOW - DAY, `s${i}-b`),
    ]).flat()
    const r = curriculumEnd(events, [], skills(100), NOW)
    expect(r.met).toBe(96)
    expect(r.durable).toBe(0)
    expect(r.stage).toBe('early')
  })

  it('ignores placement, which routes rather than proving', () => {
    const events = Array.from({ length: 96 }, (_, i) => proved(`s${i}`)).flat()
    for (const e of events.slice(0, 20)) e.mode = 'placement'
    expect(curriculumEnd(events, [], skills(100), NOW).stage).not.toBe('complete')
  })

  it('handles an empty app without dividing by zero', () => {
    const r = curriculumEnd([], [], [], NOW)
    expect(r.stage).toBe('early')
    expect(r.total).toBe(0)
  })
})
