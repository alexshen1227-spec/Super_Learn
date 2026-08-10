/**
 * Every Practice mode, against every shape of learner.
 *
 * The daily plan is heavily simulated elsewhere; the modes a learner reaches by
 * TAPPING something were not, and they behave differently — Mixed review needs
 * skills you already own, Challenge needs work near a ceiling you may not have
 * reached, the Error Clinic needs open errors.
 *
 * WHAT THIS FOUND. Challenge produced an empty plan for a cold learner, a
 * one-event learner AND a learner who had got everything wrong; Mixed review
 * produced one for two of those. The session screen already fell back to the
 * ordinary daily plan, so nothing crashed — but it did so SILENTLY, so tapping
 * a card that promises "non-routine, near your ceiling" gave an ordinary
 * session with the ordinary session's rationale, which reads as the app
 * ignoring the request. Substitutions now say what was missing
 * (`EMPTY_MODE_NOTE` in SessionScreen).
 */
import { describe, expect, it } from 'vitest'
import {
  buildChallengePlan, buildCheckpointPlan, buildErrorClinicPlan, buildFocusPlan,
  buildMixedReviewPlan, buildReadyPlan, buildSessionPlan, estimatedPlanMinutes,
} from './planner'
import { DEFAULT_INDEX } from '../content/registry'
import { deriveEvidence } from './mastery'
import { openRepairTargets } from './errors'
import { buildExam, type ExamSize } from './exam'
import { getReadyReport } from './getReady'
import { MATH_TRACKS } from '../content/tracks'
import { checkpointAvailable, checkpointSkills } from './checkpoint'
import { activeMission } from './mission'
import { SKILLS } from '../content/skills'
import { initialState, type AppState, type AttemptEvent, type CheckIn, type SessionPlan } from '../domain/types'

const NOW = Date.UTC(2026, 7, 9, 12)
const CHECK_IN: CheckIn = { minutes: 30, energy: 'ok', focus: null }

function ev(over: Partial<AttemptEvent> = {}): AttemptEvent {
  return {
    id: `e${over.id ?? '0'}`, t: NOW - 1000, sessionId: 's', templateId: 'int-ops', itemVersion: 1,
    seed: 1, skillIds: ['m-rationalops'], bucket: 'math', mode: 'independent',
    firstResponse: '1', finalResponse: '1', correct: true, firstCorrect: true, score: null,
    validator: 'numeric', hintLevel: 0, confidence: 60, elapsedSec: 30, errorTags: [], difficulty: 2,
    ...over,
  } as AttemptEvent
}

/** Deliberately awkward learner shapes, not just the comfortable middle. */
function histories(): { name: string; state: AppState }[] {
  return [
    { name: 'cold', state: { ...initialState(), onboarded: true } },
    { name: 'one event', state: { ...initialState(), onboarded: true, events: [ev()] } },
    {
      name: 'everything wrong',
      state: {
        ...initialState(), onboarded: true,
        events: Array.from({ length: 40 }, (_, i) =>
          ev({ id: `w${i}`, t: NOW - i * 3_600_000, firstCorrect: false, correct: false, confidence: 90, errorTags: ['concept'] })),
      },
    },
    {
      name: 'broad ownership',
      state: {
        ...initialState(), onboarded: true,
        events: SKILLS.slice(0, 60).flatMap((s, i) =>
          ['a', 'b', 'c'].map((k) => ev({
            id: `r${i}${k}`, t: NOW - (60 - i) * 86_400_000, skillIds: [s.id], bucket: s.bucket, templateId: `${s.id}-${k}`,
          }))),
      },
    },
    {
      name: 'mixed 300 attempts',
      state: {
        ...initialState(), onboarded: true,
        events: Array.from({ length: 300 }, (_, i) =>
          ev({
            id: `m${i}`, t: NOW - (300 - i) * 3_600_000,
            skillIds: [SKILLS[i % SKILLS.length].id], bucket: SKILLS[i % SKILLS.length].bucket,
            templateId: `t${i % 40}`, firstCorrect: i % 3 !== 0, correct: i % 3 !== 0,
            errorTags: i % 3 === 0 ? ['slip'] : [],
          })),
      },
    },
  ]
}

function ctxFor(state: AppState) {
  return { index: DEFAULT_INDEX, evidence: deriveEvidence(state.events, NOW), state, now: NOW, checkIn: CHECK_IN }
}

/**
 * A plan is either usable or empty. What it may never be is half-built: a block
 * with no activities reaches the player, where the fallback guard (which checks
 * BLOCKS, not activities) does not catch it.
 */
function assertUsableOrEmpty(label: string, plan: SessionPlan) {
  if (!plan.blocks.length) return // empty is a legitimate answer; the caller substitutes
  for (const b of plan.blocks) {
    expect(b.activities.length, `${label}: block "${b.kind}" reached the player with no activities`).toBeGreaterThan(0)
    expect(Number.isFinite(b.minutes) && b.minutes > 0, `${label}: block "${b.kind}" minutes ${b.minutes}`).toBe(true)
    expect(b.why.length, `${label}: block "${b.kind}" has no explanation`).toBeGreaterThan(4)
  }
  for (const a of plan.blocks.flatMap((b) => b.activities)) {
    const tpl = DEFAULT_INDEX.templates.get(a.templateId)
    expect(tpl, `${label}: unknown template ${a.templateId}`).toBeTruthy()
    expect(Number.isInteger(a.seed) && a.seed >= 0, `${label}: bad seed ${a.seed} on ${a.templateId}`).toBe(true)
    tpl!.generate(a.seed) // must render without throwing
  }
}

describe('every Practice mode survives every learner', () => {
  for (const { name, state } of histories()) {
    it(`daily, mixed, challenge — ${name}`, () => {
      const ctx = ctxFor(state)
      // The daily plan is the fallback for everything else, so it may never be empty.
      const daily = buildSessionPlan(ctx)
      expect(daily.blocks.length, `${name}: the daily plan is the fallback and must never be empty`).toBeGreaterThan(0)
      assertUsableOrEmpty(`daily/${name}`, daily)
      assertUsableOrEmpty(`mixed/${name}`, buildMixedReviewPlan(ctx))
      assertUsableOrEmpty(`challenge/${name}`, buildChallengePlan(ctx))
    })

    it(`focus on every skill — ${name}`, () => {
      const ctx = ctxFor(state)
      for (const s of SKILLS) assertUsableOrEmpty(`focus:${s.id}/${name}`, buildFocusPlan(ctx, s.id))
    })

    it(`error clinic, get-ready, checkpoint — ${name}`, () => {
      const ctx = ctxFor(state)
      const targets = openRepairTargets(state, ctx.evidence, NOW)
      assertUsableOrEmpty(`clinic/${name}`, buildErrorClinicPlan(ctx, targets))
      for (const t of MATH_TRACKS) {
        if (!getReadyReport(t.id, DEFAULT_INDEX.skills, ctx.evidence)) continue
        assertUsableOrEmpty(`ready:${t.id}/${name}`, buildReadyPlan(ctx, t.id))
      }
      const cp = checkpointAvailable(state, DEFAULT_INDEX, ctx.evidence, NOW)
      if (cp) {
        const ids = checkpointSkills(cp)
        expect(ids.length, `${name}: a checkpoint was offered with no skills in it`).toBeGreaterThan(0)
        assertUsableOrEmpty(`checkpoint/${name}`, buildCheckpointPlan(ctx, ids, cp.unitName))
      }
    })

    it(`no mode overruns the chosen length — ${name}`, () => {
      const ctx = ctxFor(state)
      for (const [label, plan] of [
        ['daily', buildSessionPlan(ctx)],
        ['mixed', buildMixedReviewPlan(ctx)],
        ['challenge', buildChallengePlan(ctx)],
      ] as const) {
        if (!plan.blocks.length) continue
        expect(estimatedPlanMinutes(plan), `${label}/${name} planned too long`).toBeLessThanOrEqual(CHECK_IN.minutes + 5)
      }
    })

    it(`deadlines, including malformed ones — ${name}`, () => {
      const withDeadlines: AppState = {
        ...state,
        deadlines: [
          { id: 'd1', title: 'Test', dateISO: new Date(NOW + 3 * 86_400_000).toISOString().slice(0, 10), bucket: 'math', note: '', skillIds: ['m-rationalops'], dailyMinutes: 30 },
          { id: 'd2', title: 'Long past', dateISO: '2020-01-01', bucket: null, note: '' },
          { id: 'd3', title: 'Not a date at all', dateISO: 'not-a-date', bucket: null, note: '' },
        ],
      }
      activeMission(withDeadlines, NOW)
      assertUsableOrEmpty(`mission/${name}`, buildSessionPlan(ctxFor(withDeadlines)))
    })

    it(`exam simulator — ${name}`, () => {
      const evd = deriveEvidence(state.events, NOW)
      for (const size of ['short', 'standard', 'long'] as ExamSize[]) {
        for (const seed of [1, 2, 99]) {
          const built = buildExam(state, evd, DEFAULT_INDEX, size, seed)
          if (!built.ok) continue // refusing on thin history is the honest answer
          const { items, suggestedMinutes, note } = built.plan
          expect(items.length, `${name}/${size}: said ok with no items`).toBeGreaterThan(0)
          expect(suggestedMinutes, `${name}/${size}: bad minutes`).toBeGreaterThan(0)
          expect(note.length, `${name}/${size}: no note`).toBeGreaterThan(0)
          const seen = new Set<string>()
          for (const it of items) {
            const tpl = DEFAULT_INDEX.templates.get(it.templateId)
            expect(tpl, `${name}/${size}: unknown template ${it.templateId}`).toBeTruthy()
            // A blind timed exam has to be a sequence of self-contained
            // questions; a multi-stage project inside one would not be gradeable
            // the same way and would blow the time estimate.
            expect(tpl!.kind, `${name}/${size}: ${tpl!.id} is a ${tpl!.kind}, not a single item`).toBe('single')
            const key = `${it.templateId}:${it.seed}`
            expect(seen.has(key), `${name}/${size}: repeats question ${key}`).toBe(false)
            seen.add(key)
            tpl!.generate(it.seed)
          }
        }
      }
    })
  }
})
