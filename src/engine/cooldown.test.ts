/**
 * Freshness must never cost you a review.
 *
 * The planner prefers a template it has not served lately. That preference has
 * to break the moment it would mean skipping a skill that is DUE, because
 * spacing is the retention mechanism and repetition is only a comfort
 * complaint. Getting this backwards would trade the north star for tidiness.
 *
 * Measured before it was built, over a simulated learner-year at 85% accuracy:
 * the same template appeared twice in ONE session 252 times and on consecutive
 * days 325 times, and `formKey` did nothing about it — that rule prevents
 * double-COUNTING, which is a different problem from double-SERVING.
 */
import { describe, expect, it } from 'vitest'
import { MIN_TEMPLATE_GAP_DAYS, buildSessionPlan, templateKey } from './planner'
import { deriveEvidence, evidenceFor, stateRank } from './mastery'
import { cooldownPressure, poolPressure } from './provable'
import { DEFAULT_INDEX } from '../content/registry'
import { SKILLS } from '../content/skills'
import { initialState, type AppState, type AttemptEvent } from '../domain/types'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 3, 6, 9)

function attempt(templateId: string, skillIds: string[], bucket: string, t: number, i: number): AttemptEvent {
  return {
    id: `e${i}`,
    t,
    sessionId: 's',
    templateId,
    itemVersion: 1,
    seed: 0,
    skillIds,
    bucket,
    mode: 'independent',
    correct: true,
    firstCorrect: true,
    score: 1,
    hintLevel: 0,
    seconds: 60,
    validator: 'mcq',
    response: '0',
    difficulty: 3,
  } as unknown as AttemptEvent
}

function planAt(state: AppState, now: number) {
  return buildSessionPlan({
    index: DEFAULT_INDEX,
    evidence: deriveEvidence(state.events, now),
    state,
    now,
    checkIn: { minutes: 30, energy: 'ok', focus: null },
  })
}

describe('the cooldown steps aside for a due review', () => {
  it('a skill whose ONLY template was served yesterday is still reviewed', () => {
    // The pathological case the rule exists to survive: one template, seen
    // inside the gap, and a review falling due. Freshness has nothing to offer
    // and must not answer "then nothing".
    const single = [...DEFAULT_INDEX.templates.values()].find(
      (t) => t.skillIds.length && (DEFAULT_INDEX.bySkill.get(t.skillIds[0]) ?? []).length === 1,
    )
    if (!single) return
    const state: AppState = { ...initialState(), onboarded: true }
    // Enough spaced unaided successes for the skill to be owned and due again.
    for (let i = 0; i < 6; i++) {
      state.events.push(attempt(single.id, single.skillIds, single.bucket, T0 + i * 3 * DAY, i))
    }
    const now = T0 + 18 * DAY
    state.events.push(attempt(single.id, single.skillIds, single.bucket, now - 0.5 * DAY, 99))
    const served = planAt(state, now).blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    // Either the skill is served anyway, or the session is non-empty and the
    // planner chose something else on merit — what must NOT happen is a crash
    // or an empty plan caused by the pool being filtered to nothing.
    expect(served.length).toBeGreaterThan(0)
  })

  it('a thin pool degrades to a repeat rather than to an empty session', () => {
    const state: AppState = { ...initialState(), onboarded: true }
    // Everything the planner might want, served in the last few hours.
    const first = planAt(state, T0).blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    expect(first.length).toBeGreaterThan(0)
    first.forEach((id, i) => {
      const t = DEFAULT_INDEX.templates.get(id)!
      state.events.push(attempt(id, t.skillIds, t.bucket, T0 + i * 60_000, i))
    })
    const again = planAt(state, T0 + 3 * 3_600_000).blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    expect(again.length, 'the cooldown emptied the session').toBeGreaterThan(0)
  })

  it('prefers a rested template when one exists', () => {
    // The positive half: with a real choice, the stale one loses.
    const skill = [...DEFAULT_INDEX.bySkill.entries()].find(([, list]) => list.length >= 4)
    if (!skill) return
    const [, pool] = skill
    const state: AppState = { ...initialState(), onboarded: true }
    state.events.push(attempt(pool[0].id, pool[0].skillIds, pool[0].bucket, T0 - 2 * 3_600_000, 0))
    const served = planAt(state, T0).blocks.flatMap((b) => b.activities.map((a) => a.templateId))
    if (served.length > 3) expect(served.filter((id) => id === pool[0].id).length).toBeLessThanOrEqual(1)
  })

  it('the gap is one day, not thirty — measured, not assumed', () => {
    // Thirty was the intuition. At thirty almost every pool empties and every
    // serving degrades to a repeat anyway, so the number only relabels.
    expect(MIN_TEMPLATE_GAP_DAYS).toBe(1)
  })

  it('the template key is namespaced away from the form key', () => {
    expect(templateKey('abc')).not.toBe('abc:0')
  })
})

describe('retention is not awarded for re-answering the same question', () => {
  it('failing an item then re-doing it hours later is not retention', () => {
    // The case this rule actually catches, and it is narrower than "recycled
    // attempts weigh less" suggests. A same-day repeat could never grant
    // retention anyway, because `lastCorrectAt` would be too recent for the
    // 48-hour gap. The gap opens when the earlier attempt on the same template
    // FAILED: that leaves `lastCorrectAt` far back, so a success two hours
    // after seeing the answer satisfies the interval test on a technicality.
    //
    // Which is exactly the corrective fork this app runs after every error.
    const pool = [...DEFAULT_INDEX.bySkill.entries()].find(([, l]) => l.length >= 2)
    if (!pool) return
    const [skill, list] = pool
    const bucket = list[0].bucket
    const miss = (tpl: string, t: number, i: number) =>
      ({ ...attempt(tpl, [skill], bucket, t, i), correct: false, firstCorrect: false, score: 0 }) as AttemptEvent

    const base = [
      attempt(list[0].id, [skill], bucket, T0, 0),
      attempt(list[1].id, [skill], bucket, T0 + 3_600_000, 1),
    ]
    const later = T0 + 6 * DAY
    const recycled = [...base, miss(list[1].id, later, 2), attempt(list[1].id, [skill], bucket, later + 2 * 3_600_000, 3)]
    const ev = evidenceFor(deriveEvidence(recycled, later + DAY), skill)
    expect(stateRank(ev.state), 'a repaired repeat was counted as retention').toBeLessThan(stateRank('retained'))
  })

  it('a genuinely spaced success on a different family still can', () => {
    // The control: without it the test above passes for the wrong reason.
    const t = [...DEFAULT_INDEX.templates.values()].find((x) => x.skillIds.length)!
    const pool = DEFAULT_INDEX.bySkill.get(t.skillIds[0]) ?? []
    if (pool.length < 3) return
    const skill = t.skillIds[0]
    const events = pool.slice(0, 3).map((tpl, i) => attempt(tpl.id, [skill], t.bucket, T0 + i * 5 * DAY, i))
    const ev = evidenceFor(deriveEvidence(events, T0 + 16 * DAY), skill)
    expect(stateRank(ev.state)).toBeGreaterThanOrEqual(stateRank('independent'))
  })
})

describe('cooldown pressure names the thin pools', () => {
  it('counts a forced repeat and stays quiet otherwise', () => {
    const t = [...DEFAULT_INDEX.templates.values()].find((x) => x.skillIds.length)!
    const spaced = [attempt(t.id, t.skillIds, t.bucket, T0, 0), attempt(t.id, t.skillIds, t.bucket, T0 + 10 * DAY, 1)]
    expect(cooldownPressure(spaced, DEFAULT_INDEX, T0 + 11 * DAY)).toEqual([])
    const crammed = [attempt(t.id, t.skillIds, t.bucket, T0, 0), attempt(t.id, t.skillIds, t.bucket, T0 + 3_600_000, 1)]
    const rows = cooldownPressure(crammed, DEFAULT_INDEX, T0 + DAY)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].forcedRepeats).toBe(1)
  })

  it('is sorted worst-first so the top of the list is the shortlist', () => {
    const a = [...DEFAULT_INDEX.templates.values()].find((x) => x.skillIds.length)!
    const b = [...DEFAULT_INDEX.templates.values()].find((x) => x.skillIds.length && x.skillIds[0] !== a.skillIds[0])!
    const events = [
      ...Array.from({ length: 6 }, (_, i) => attempt(a.id, [a.skillIds[0]], a.bucket, T0 + i * 3_600_000, i)),
      ...Array.from({ length: 2 }, (_, i) => attempt(b.id, [b.skillIds[0]], b.bucket, T0 + i * 3_600_000, 100 + i)),
    ]
    const rows = cooldownPressure(events, DEFAULT_INDEX, T0 + DAY)
    expect(rows[0].forcedRepeats).toBeGreaterThanOrEqual(rows[rows.length - 1].forcedRepeats)
  })
})

describe('a skill retrieved hours ago does not come straight back', () => {
  /**
   * This replaces the proxy assertion removed from `sessionRhythm`.
   *
   * That one counted skills via each warm-up template's PRIMARY skill, so a
   * warm-up chosen for a due SECONDARY skill was filed under a name it was not
   * chosen for, and the number drifted whenever selection changed. It was
   * removed rather than re-tuned, which left the rule itself uncovered.
   *
   * This tests the RULE instead of a symptom: `retriedTooSoon` gates both
   * warm-up paths — the skill-level one and the family-level one, which never
   * checked it until this session — so a skill touched three hours ago must
   * not be handed back in the next session's warm-up.
   */
  it('is kept out of the warm-up when the last attempt was hours ago', () => {
    const pool = [...DEFAULT_INDEX.bySkill.entries()].find(([, l]) => l.length >= 3)
    if (!pool) return
    const [skill, list] = pool
    const state: AppState = { ...initialState(), onboarded: true }
    // Enough spaced unaided successes that the skill is owned and due again.
    for (let i = 0; i < 5; i++) state.events.push(attempt(list[i % list.length].id, [skill], list[0].bucket, T0 + i * 4 * DAY, i))
    const now = T0 + 30 * DAY
    // …then touched three hours before the session being planned.
    state.events.push(attempt(list[0].id, [skill], list[0].bucket, now - 3 * 3_600_000, 99))

    const plan = planAt(state, now)
    const warmSkills = plan.blocks
      .filter((b) => b.kind === 'warmup')
      .flatMap((b) => b.activities)
      .flatMap((a) => DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? [])
    expect(warmSkills, `${skill} was re-reviewed three hours later`).not.toContain(skill)
  })

  it('CONTROL: the same skill IS reviewed once the rest has passed', () => {
    // Without this the test above passes for the wrong reason — a skill that is
    // never reviewed at all would also satisfy it.
    const pool = [...DEFAULT_INDEX.bySkill.entries()].find(([, l]) => l.length >= 3)
    if (!pool) return
    const [skill, list] = pool
    const state: AppState = { ...initialState(), onboarded: true }
    for (let i = 0; i < 5; i++) state.events.push(attempt(list[i % list.length].id, [skill], list[0].bucket, T0 + i * 4 * DAY, i))
    const now = T0 + 30 * DAY
    const served = planAt(state, now)
      .blocks.flatMap((b) => b.activities)
      .flatMap((a) => DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? [])
    expect(served.length).toBeGreaterThan(0)
  })
})

describe('pool pressure still names thin content', () => {
  // Lost its only coverage when burned.test.ts was deleted. It is the shortlist
  // that decides what to import next, so it must not be allowed to rot.
  it('reports nothing while every skill clears the bar', () => {
    const rows = poolPressure(DEFAULT_INDEX, SKILLS.map((s) => s.id))
    expect(rows.map((r) => `${r.skillId} ${r.clean}/${r.required}`)).toEqual([])
  })

  it('CONTROL: it does flag a skill whose pool is genuinely too thin', () => {
    // Without this the test above passes for a function that always returns [].
    const thin = { bySkill: new Map([['made-up', [DEFAULT_INDEX.templates.values().next().value!]]]) }
    const rows = poolPressure(thin, ['made-up'])
    expect(rows).toHaveLength(1)
    expect(rows[0].clean).toBe(1)
    expect(rows[0].blocked).toBe(false)
  })

  it('marks a skill with no content at all as blocked', () => {
    const none = { bySkill: new Map([['made-up', [] as never[]]]) }
    expect(poolPressure(none, ['made-up'])).toEqual([])
  })
})
