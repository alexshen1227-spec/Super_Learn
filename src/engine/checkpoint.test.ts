import { describe, expect, it } from 'vitest'
import { checkpointAvailable, checkpointSkills, findUnitCheckpoint } from './checkpoint'
import { buildCheckpointPlan } from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { initialState, type AppState, type AttemptEvent } from '../domain/types'

const DAY = 86_400_000
const T0 = Date.UTC(2026, 6, 1)
const NOW = T0 + 40 * DAY
let n = 0
const at = (days: number, skill: string, tpl: string, ok = true): AttemptEvent => ({
  id: `c${n++}`, t: T0 + days * DAY, sessionId: 's', templateId: tpl, itemVersion: 1, seed: n,
  skillIds: [skill], bucket: 'math', mode: 'independent', firstResponse: 'x', finalResponse: 'x',
  correct: ok, firstCorrect: ok, score: null, validator: 'numeric', hintLevel: 0,
  confidence: null, elapsedSec: 60, errorTags: [], difficulty: 2,
})

/** Own several skills in one unit, long enough ago that retrieval is due. */
function ownUnit(skills: string[]): AttemptEvent[] {
  const out: AttemptEvent[] = []
  for (const s of skills) out.push(at(0, s, `${s}-a`), at(1, s, `${s}-b`))
  return out
}

const withSessions = (events: AttemptEvent[], sessions = 5): AppState => ({
  ...initialState(),
  events,
  onboarded: true,
  sessions: Array.from({ length: sessions }, () => ({}) as never),
})

describe('unit checkpoints are offered only when they would mean something', () => {
  const unitSkills = ['m-integers', 'm-fractions', 'm-decimals']

  it('offers a checkpoint once several skills are owned and retrieval is due', () => {
    const events = ownUnit(unitSkills)
    const cp = checkpointAvailable(withSessions(events), DEFAULT_INDEX, deriveEvidence(events, NOW), NOW)
    expect(cp).not.toBeNull()
    expect(cp!.ownedSkillIds.length).toBeGreaterThanOrEqual(3)
    expect(cp!.dueSkillIds.length).toBeGreaterThanOrEqual(2)
  })

  it('offers nothing when the skills were only just practised', () => {
    // Same evidence, but checked immediately — nothing has come due yet.
    //
    // "Immediately" means BEFORE the first family's 1-day due, not after it.
    // This used to sit 60 seconds past that due and passed anyway, because
    // the first success was (wrongly) counted into the stability factor and
    // stretched the interval to 1.15 days — a 3.6-hour artifact margin. The
    // spaced-only counting removed the artifact, and the probe time now says
    // what the comment always meant.
    const events = ownUnit(unitSkills)
    const soon = T0 + 1 * DAY - 60_000
    expect(findUnitCheckpoint(DEFAULT_INDEX, deriveEvidence(events, soon), soon)).toBeNull()
  })

  it('offers nothing to a learner with almost no history', () => {
    const events = ownUnit(unitSkills)
    const cp = checkpointAvailable(withSessions(events, 1), DEFAULT_INDEX, deriveEvidence(events, NOW), NOW)
    expect(cp, 'a cumulative check needs something cumulative to check').toBeNull()
  })

  it('offers nothing when only one skill in the unit is owned', () => {
    const events = ownUnit(['m-integers'])
    expect(findUnitCheckpoint(DEFAULT_INDEX, deriveEvidence(events, NOW), NOW)).toBeNull()
  })
})

describe('a checkpoint asks two questions per skill', () => {
  const unitSkills = ['m-integers', 'm-fractions', 'm-decimals']
  const events = ownUnit(unitSkills)
  const evidence = deriveEvidence(events, NOW)
  const cp = findUnitCheckpoint(DEFAULT_INDEX, evidence, NOW)!
  const plan = buildCheckpointPlan(
    { index: DEFAULT_INDEX, evidence, state: withSessions(events), now: NOW, checkIn: { minutes: 20, energy: 'ok', focus: null } },
    checkpointSkills(cp),
    cp.unitName,
  )

  it('covers up to three skills, two items each', () => {
    const acts = plan.blocks.flatMap((b) => b.activities)
    expect(acts.length).toBeGreaterThanOrEqual(4)
    // Count by the skill each item was SELECTED FOR — a template's primary
    // skill is often a different one, since templates list several.
    for (const skillId of checkpointSkills(cp)) {
      const covering = acts.filter((a) =>
        (DEFAULT_INDEX.templates.get(a.templateId)?.skillIds ?? []).includes(skillId),
      ).length
      // Two is the decision rule: one question cannot separate knowing from luck.
      expect(covering, `${skillId} should be asked twice`).toBeGreaterThanOrEqual(2)
    }
  })

  it('every item is a review, not new material', () => {
    for (const a of plan.blocks.flatMap((b) => b.activities)) expect(a.mode).toBe('review')
  })

  it('explains itself', () => {
    expect(plan.rationale.join(' ')).toMatch(/checkpoint/i)
    expect(plan.blocks[0].why).toMatch(/two/i)
  })
})
