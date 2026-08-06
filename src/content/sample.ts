/**
 * Sample-data profile: several weeks of plausible use, generated
 * DETERMINISTICALLY through the real templates and validators so every
 * derived number (mastery, calibration, allocation) is internally
 * consistent. Loaded via Settings → Sample data; the real profile is
 * stashed and restored on exit.
 */
import type { AppState, AttemptEvent, BucketId, SessionRecord } from '../domain/types'
import { initialState } from '../domain/types'
import { mulberry32, pick, rint } from '../engine/rng'
import { correctResponse, validate, validatorName, wrongResponse } from '../engine/validate'
import { BUILTIN_TEMPLATES } from './registry'
import { addLocalDaysISO } from '../engine/time'

const DAY = 86_400_000

/** Bucket rotation approximating the default allocation. */
const SESSION_BUCKETS: BucketId[][] = [
  ['math', 'observer', 'math'],
  ['math', 'investigator', 'physics'],
  ['math', 'puzzle', 'meta'],
  ['physics', 'strategist', 'math'],
  ['math', 'coding', 'observer'],
  ['science', 'investigator', 'math'],
  ['math', 'puzzle', 'strategist'],
  ['math', 'insight', 'coding'],
]

export function buildSampleState(): AppState {
  const rng = mulberry32(20260805)
  const state = initialState()
  const now = Date.now()
  const start = now - 26 * DAY

  state.onboarded = true
  state.sampleMode = true
  state.profile = {
    ...state.profile,
    name: 'Sample Learner',
    ageBand: '13-17',
    gradeLevel: 8,
    courses: ['Math 8', 'Physical Science'],
    goals: ['Raise my math grade to an A', 'Get better at chess tactics'],
    strongAreas: ['mental math'],
    weakAreas: ['word problems'],
    chessExperience: 'casual',
    coachTone: 'balanced',
    sessionMinutes: 25,
  }
  state.deadlines = [
    {
      id: 'dl-sample-1',
      title: 'Math unit test',
      dateISO: addLocalDaysISO(now, 6),
      bucket: 'math',
      note: 'Linear equations & graphs',
    },
  ]
  state.placement = {
    completedAt: start - DAY,
    minutes: 14,
    signals: [
      { skillId: 'm-lineqmulti', signal: 'ok', fromManual: false },
      { skillId: 'm-linear', signal: 'gap', fromManual: false },
      { skillId: 'm-proportion', signal: 'ok', fromManual: false },
      { skillId: 'm-percent', signal: 'ok', fromManual: false },
      { skillId: 'm-fractions', signal: 'ok', fromManual: false },
      { skillId: 'm-ratio', signal: 'ok', fromManual: false },
      { skillId: 'm-lineq1', signal: 'ok', fromManual: false },
      { skillId: 'm-triangles', signal: 'strong', fromManual: false },
      { skillId: 'm-prob', signal: 'ok', fromManual: false },
      { skillId: 'p-motion', signal: 'ok', fromManual: false },
      { skillId: 'c-vars', signal: 'strong', fromManual: false },
      { skillId: 's-corr', signal: 'ok', fromManual: false },
      { skillId: 'i-logic', signal: 'ok', fromManual: false },
      { skillId: 'st-decomp', signal: 'ok', fromManual: false },
      { skillId: 'o-obsinf', signal: 'gap', fromManual: false },
    ],
    measuredSkillIds: ['m-lineqmulti', 'm-linear', 'm-proportion', 'm-percent', 'm-triangles', 'm-prob', 'p-motion', 'c-vars', 's-corr', 'i-logic', 'st-decomp', 'o-obsinf'],
    unmeasuredNote: 'Skills outside the probe set are unmeasured. The coach treats them as unknown, not as weaknesses.',
    summary: [
      'Measured 12 skills directly across 7 areas.',
      'Prerequisite gaps to close first: Slope & linear patterns, Observation vs inference.',
      'Above-level strengths: Triangles & Pythagorean theorem, Variables & expressions.',
      'Everything not probed remains unmeasured — the map fills in from real practice evidence.',
    ],
  }

  const byBucket = new Map<BucketId, typeof BUILTIN_TEMPLATES>()
  for (const t of BUILTIN_TEMPLATES) {
    const arr = byBucket.get(t.bucket) ?? []
    arr.push(t)
    byBucket.set(t.bucket, arr)
  }

  const events: AttemptEvent[] = []
  const sessions: SessionRecord[] = []
  let sessionCount = 0

  for (let day = 0; day < 26; day++) {
    // ~5 sessions/week; skill improves over time.
    if (rng() > 0.68) continue
    const dayStart = start + day * DAY + (16 + rint(rng, 0, 4)) * 3_600_000
    const skillLevel = 0.62 + (day / 26) * 0.24 // accuracy drifts up
    const buckets = SESSION_BUCKETS[sessionCount % SESSION_BUCKETS.length]
    const sessionId = `sample-s${sessionCount}`
    let t = dayStart
    let attempts = 0
    let correctFirst = 0
    const bucketMinutes: Partial<Record<BucketId, number>> = {}

    for (const bucket of buckets) {
      const pool = (byBucket.get(bucket) ?? []).filter((tp) => tp.difficulty <= (day < 8 ? 3 : 4))
      if (!pool.length) continue
      const nItems = bucket === 'math' ? rint(rng, 2, 3) : 1
      for (let i = 0; i < nItems; i++) {
        const template = pick(rng, pool)
        const seed = rint(rng, 0, Math.max(0, template.variants - 1))
        const item = template.generate(seed)
        // Multi-part and puzzle kinds: log one event per activity (simplified).
        const spec = item.answer ?? item.parts?.[0]?.answer
        const elapsed = rint(rng, 45, Math.max(60, Math.round(template.minutes * 60)))
        const isCorrect = rng() < skillLevel + (template.difficulty <= 2 ? 0.12 : 0)
        const hinted = !isCorrect && rng() < 0.45
        const conf = template.calibration || rng() < 0.3 ? rint(rng, 3, 9) * 10 + (isCorrect ? 5 : -5) : null
        let firstResponse = ''
        let finalResponse = ''
        let correct: boolean | null = isCorrect
        let score: number | null = null
        if (item.kind === 'chess') {
          firstResponse = isCorrect ? item.chess!.line[0] : 'wrong-move'
          finalResponse = item.chess!.line[0]
        } else if (item.kind === 'polyomino' || item.kind === 'logicgrid') {
          firstResponse = isCorrect ? 'solved' : 'incomplete'
          finalResponse = 'solved'
        } else if (spec) {
          if (spec.type === 'rubric') {
            correct = null
            score = isCorrect ? 1 : 0.5
            firstResponse = correctResponse(spec)
            finalResponse = firstResponse
          } else {
            firstResponse = isCorrect ? correctResponse(spec) : wrongResponse(spec)
            finalResponse = correctResponse(spec)
            // Keep the log honest: re-validate what we claim was correct.
            if (isCorrect && !validate(spec, firstResponse).ok) correct = false
          }
        }
        events.push({
          id: `sample-e${events.length}`,
          t,
          sessionId,
          templateId: template.id,
          itemVersion: template.version,
          seed,
          skillIds: item.kind === 'multi' ? template.skillIds : template.skillIds.slice(0, 2),
          bucket: template.bucket,
          mode: day < 4 ? 'guided' : rng() < 0.22 ? 'review' : template.transfer && rng() < 0.3 ? 'transfer' : 'independent',
          firstResponse,
          finalResponse,
          correct,
          firstCorrect: correct === null ? null : isCorrect && !hinted,
          score,
          validator: spec ? validatorName(spec) : item.kind,
          hintLevel: hinted ? rint(rng, 1, 3) : 0,
          confidence: conf === null ? null : Math.max(0, Math.min(100, conf)),
          elapsedSec: elapsed,
          errorTags: !isCorrect ? [pick(rng, ['concept', 'strategy', 'slip', 'misread'] as const)] : [],
          difficulty: template.difficulty,
        })
        t += elapsed * 1000 + rint(rng, 5, 20) * 1000
        attempts++
        if (isCorrect && !hinted) correctFirst++
        bucketMinutes[bucket] = (bucketMinutes[bucket] ?? 0) + elapsed / 60
      }
    }
    sessions.push({
      id: sessionId,
      startedAt: dayStart,
      endedAt: t,
      activeMinutes: Math.round((t - dayStart) / 60000),
      checkIn: { minutes: 25, energy: pick(rng, ['ok', 'ok', 'high', 'low'] as const), focus: null },
      attempts,
      correctFirst,
      bucketMinutes,
      learned: [],
      exitPrinciple: pick(rng, [
        'Percent change compares to the ORIGINAL.',
        'List every check before evaluating any.',
        'Slope is a rate wearing geometry.',
        'Units cancel like algebra.',
        'The first story is not the only story.',
        null,
      ] as const),
      interrupted: false,
    })
    sessionCount++
  }

  state.events = events
  state.sessions = sessions
  state.forecasts = [
    {
      id: 'sample-f1',
      createdAt: start + 5 * DAY,
      question: 'I will score 85%+ on the math unit test',
      probability: 0.7,
      dueISO: addLocalDaysISO(now, 6),
      resolved: null,
      revisions: [{ t: start + 12 * DAY, probability: 0.75 }],
    },
    {
      id: 'sample-f2',
      createdAt: start + 2 * DAY,
      question: 'I will finish the science project by Friday',
      probability: 0.8,
      dueISO: addLocalDaysISO(start, 9),
      resolved: { outcome: false, resolvedAt: start + 10 * DAY, note: 'Underestimated the write-up — classic planning fallacy.' },
      revisions: [],
    },
    {
      id: 'sample-f3',
      createdAt: start + 8 * DAY,
      question: 'I will beat my friend in our weekend chess game',
      probability: 0.55,
      dueISO: addLocalDaysISO(start, 13),
      resolved: { outcome: true, resolvedAt: start + 13 * DAY, note: 'Back-rank tactic from practice actually appeared!' },
      revisions: [],
    },
  ]
  state.coachLog = [
    {
      id: 'sample-cd1',
      t: start + 3 * DAY,
      kind: 'plan',
      summary: 'Prioritized Slope & linear patterns — placement flagged a gap and 3 skills wait on it.',
      evidence: ['Placement: incorrect on the slope probe.', 'm-linfunc, m-systems, p-graphs list it as a prerequisite.'],
      confidence: 'medium',
      wouldChange: 'Two unaided successes on slope items would clear the gap and shift focus to linear equations.',
    },
    {
      id: 'sample-cd2',
      t: start + 14 * DAY,
      kind: 'difficulty',
      summary: 'Raised math difficulty toward multi-step problems.',
      evidence: ['First-attempt accuracy over the last week: 82% at difficulty 2.'],
      confidence: 'medium',
      wouldChange: 'Two consecutive missed sessions or accuracy under 50% would lower it again.',
    },
    {
      id: 'sample-cd3',
      t: now - 2 * DAY,
      kind: 'deadline',
      summary: 'Math unit test in 6 days: session mix temporarily favors linear equations and review.',
      evidence: ['Deadline: Math unit test.', 'm-linfunc is Guided; the test covers it.'],
      confidence: 'high',
      wouldChange: 'After the test date passes, allocation drifts back toward the long-term balance.',
    },
  ]
  return state
}
