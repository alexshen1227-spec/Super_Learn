/**
 * An item whose answer you have already read cannot prove you retained it.
 *
 * This app has one user and is built alongside them in a transcript they read.
 * Option text from 204 templates ended up in that transcript. The app's whole
 * purpose is answering "what can I still do unaided weeks later", and a number
 * that cannot tell "I can do this" from "I read this" is worse than no number.
 *
 * So the claim under test is narrow and absolute: a burned template can never
 * carry a rung. It can still be practised, still be scheduled, still be got
 * wrong — it just cannot be the thing that says you know something.
 */
import { describe, expect, it } from 'vitest'
import { BURNED_TEMPLATE_IDS } from '../content/burned'
import { BUILTIN_TEMPLATES } from '../content/registry'
import { deriveEvidence, evidenceFor, formsRequired, isBurned, stateRank } from './mastery'
import type { AttemptEvent } from '../domain/types'
import { DEFAULT_INDEX } from '../content/registry'
import { SKILLS } from '../content/skills'
import { isProvable, poolPressure } from './provable'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 0, 5, 9)

const clean = BUILTIN_TEMPLATES.filter((t) => !BURNED_TEMPLATE_IDS.has(t.id) && t.skillIds.length)
const burned = BUILTIN_TEMPLATES.filter((t) => BURNED_TEMPLATE_IDS.has(t.id) && t.skillIds.length)

function attempt(templateId: string, skillId: string, bucket: string, t: number, ok = true): AttemptEvent {
  return {
    id: `e-${templateId}-${t}`,
    t,
    sessionId: 's',
    templateId,
    itemVersion: 1,
    seed: 0,
    skillIds: [skillId],
    bucket,
    mode: 'independent',
    correct: ok,
    firstCorrect: ok,
    score: ok ? 1 : 0,
    hintLevel: 0,
    seconds: 60,
    validator: 'mcq',
    response: '0',
    firstResponse: '0',
    finalResponse: '0',
    confidence: null,
    elapsedSec: 60,
    errorTags: [],
    difficulty: 3,
  } as unknown as AttemptEvent
}

/** Perfect unaided runs on `n` distinct templates for one skill, well spaced. */
function run(templates: typeof BUILTIN_TEMPLATES, skillId: string, bucket: string, n: number): AttemptEvent[] {
  return templates.slice(0, n).map((t, i) => attempt(t.id, skillId, bucket, T0 + i * 5 * DAY))
}

describe('burned items cannot carry a rung', () => {
  it('the list is real and was not silently emptied', () => {
    expect(BURNED_TEMPLATE_IDS.size).toBeGreaterThan(100)
    expect(burned.length).toBeGreaterThan(100)
    // …and it is not the whole bank, or the flag would mean nothing.
    expect(clean.length).toBeGreaterThan(burned.length)
  })

  it('every burned id is a template that actually exists', () => {
    const known = new Set(BUILTIN_TEMPLATES.map((t) => t.id))
    const ghosts = [...BURNED_TEMPLATE_IDS].filter((id) => !known.has(id))
    expect(ghosts, `burned ids with no template: ${ghosts.join(', ')}`).toEqual([])
  })

  it('CONTROL: clean templates do reach independent, so the test can fail', () => {
    // Without this the next test passes for the wrong reason.
    const t = clean[0]
    const skill = t.skillIds[0]
    const pool = clean.filter((x) => x.skillIds.includes(skill) && x.bucket === t.bucket)
    const need = formsRequired(t.bucket)
    if (pool.length < need) return // not enough clean families for this skill
    const ev = deriveEvidence(run(pool, skill, t.bucket, need), T0 + 90 * DAY)
    expect(stateRank(evidenceFor(ev, skill).state)).toBeGreaterThanOrEqual(stateRank('independent'))
  })

  it('a perfect unaided run on burned templates alone never reaches independent', () => {
    const failures: string[] = []
    for (const t of burned.slice(0, 40)) {
      const skill = t.skillIds[0]
      const pool = burned.filter((x) => x.skillIds.includes(skill) && x.bucket === t.bucket)
      const events = run(pool, skill, t.bucket, Math.max(pool.length, 6))
      if (!events.length) continue
      const ev = evidenceFor(deriveEvidence(events, T0 + 90 * DAY), skill)
      if (stateRank(ev.state) >= stateRank('independent')) failures.push(`${skill} reached ${ev.state} on burned items only`)
    }
    expect(failures, failures.join('; ')).toEqual([])
  })

  it('a burned success is guided practice, not a miss', () => {
    // Scoring a correct answer as a failure would be dishonest in the other
    // direction, and would drag difficulty down for no reason.
    const t = burned[0]
    const skill = t.skillIds[0]
    const ev = evidenceFor(deriveEvidence([attempt(t.id, skill, t.bucket, T0)], T0 + DAY), skill)
    expect(ev.recentMisses).toBe(0)
    expect(stateRank(ev.state)).toBeGreaterThanOrEqual(stateRank('guided'))
  })

  it('a burned MISS still counts against you', () => {
    const t = burned[0]
    const skill = t.skillIds[0]
    const ev = evidenceFor(deriveEvidence([attempt(t.id, skill, t.bucket, T0, false)], T0 + DAY), skill)
    expect(ev.recentMisses).toBeGreaterThan(0)
  })

  it('burned successes do not inflate the ability estimate', () => {
    const t = burned[0]
    const c = clean.find((x) => x.bucket === t.bucket) ?? clean[0]
    const skill = 'z-ability-probe'
    const many = (tpl: string) => Array.from({ length: 8 }, (_, i) => attempt(tpl, skill, t.bucket, T0 + i * DAY))
    const burnedAbility = evidenceFor(deriveEvidence(many(t.id), T0 + 30 * DAY), skill).ability
    const cleanAbility = evidenceFor(deriveEvidence(many(c.id), T0 + 30 * DAY), skill).ability
    // Stronger than "lower": burned attempts contribute no ability SAMPLES at
    // all, so the estimate stays null — the app declines to have an opinion
    // rather than forming a flattering one. Eight perfect runs, still null.
    expect(burnedAbility).toBeNull()
    expect(cleanAbility).not.toBeNull()
  })

  it('isBurned agrees with the list', () => {
    expect(isBurned({ templateId: burned[0].id })).toBe(true)
    expect(isBurned({ templateId: clean[0].id })).toBe(false)
  })
})

describe('pool pressure names what to import next', () => {
  const pressure = poolPressure(DEFAULT_INDEX, SKILLS.map((s) => s.id))

  it('reports the skills the content can no longer prove', () => {
    // Not zero — marking 204 templates burned had to cost something, and a
    // report claiming otherwise would be the dishonest version of this.
    expect(pressure.length).toBeGreaterThan(0)
    // …but a minority, or the app has stopped being able to measure anything.
    expect(pressure.length).toBeLessThan(SKILLS.length / 2)
  })

  it('is sorted worst-first, so the top of the list is the shortlist', () => {
    for (let i = 1; i < pressure.length; i++) expect(pressure[i].clean).toBeGreaterThanOrEqual(pressure[i - 1].clean)
    expect(pressure.filter((p) => p.blocked).every((p) => p.clean === 0)).toBe(true)
  })

  it('never lists a skill that is actually provable', () => {
    const wrong = pressure.filter((p) => isProvable(DEFAULT_INDEX, p.skillId, p.bucket))
    expect(wrong.map((p) => p.skillId)).toEqual([])
  })

  it('agrees with isProvable across every skill', () => {
    const listed = new Set(pressure.map((p) => p.skillId))
    const mismatched = SKILLS.filter((s) => {
      const pool = DEFAULT_INDEX.bySkill.get(s.id) ?? []
      if (!pool.length) return false
      return isProvable(DEFAULT_INDEX, s.id, pool[0].bucket) === listed.has(s.id)
    })
    expect(mismatched.map((s) => s.id)).toEqual([])
  })
})
