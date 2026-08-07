/** Allocation, calibration, planner, placement, coach, puzzles, persistence. */
import { describe, expect, it } from 'vitest'
import type { AppState, AttemptEvent, BucketId, CheckIn, SkillEvidence } from '../domain/types'
import { initialState } from '../domain/types'
import { allocationReport, relativeDebt } from './allocation'
import { brierScore, calibrationBands, calibrationGap, highConfidenceErrors } from './calibration'
import { deriveEvidence } from './mastery'
import { buildChallengePlan, buildFocusPlan, buildMixedReviewPlan, buildSessionPlan, estimatedPlanMinutes, prereqsMet, scoreSkills, targetDifficulty } from './planner'
import { applyProbe, nextProbe, PLACEMENT_MAX_ITEMS, startPlacement, summarizePlacement, MATH_LADDER } from './placement'
import { activityIntake, coachBeliefs, findBottleneck, todayInsight, weeklyObjective } from './coach'
import { assignmentCorrect, countSolutions, puzzleValid } from './logicGrid'
import { fits, isComplete, occupiedCells, rotateCells, solutionValid, specFromDrawing } from './polyomino'
import { applySan, isForcedMate, matingMoves, movesFrom, movesKeepingMate, toughestReply } from './chessTools'
import { exportState, importState } from './exportImport'
import { sanitizeState } from '../store/sanitize'
import { validatePack } from './contentSchema'
import { DEFAULT_INDEX } from '../content/registry'
import { buildSampleState } from '../content/sample'

const DAY = 86_400_000
const NOW = Date.parse('2026-07-01T18:00:00Z')

let n = 0
function attempt(bucket: BucketId, skillId: string, over: Partial<AttemptEvent> = {}): AttemptEvent {
  n++
  return {
    id: `a${n}`,
    t: NOW - 10 * DAY + n * 3_600_000,
    sessionId: 's',
    templateId: `t-${skillId}`,
    itemVersion: 1,
    seed: n,
    skillIds: [skillId],
    bucket,
    mode: 'independent',
    firstResponse: '1',
    finalResponse: '1',
    correct: true,
    firstCorrect: true,
    score: null,
    validator: 'numeric',
    hintLevel: 0,
    confidence: null,
    elapsedSec: 300,
    errorTags: [],
    difficulty: 2,
    ...over,
  }
}

function stateWith(events: AttemptEvent[]): AppState {
  return { ...initialState(), onboarded: true, events }
}

describe('allocation', () => {
  it('tracks minutes per bucket in the window and computes debt', () => {
    const events = [
      attempt('math', 'm-lineq1', { elapsedSec: 1200 }),
      attempt('math', 'm-lineq1', { elapsedSec: 1200 }),
      attempt('observer', 'o-obsinf', { elapsedSec: 600 }),
      attempt('math', 'm-lineq1', { t: NOW - 40 * DAY, elapsedSec: 9000 }), // outside window
      attempt('math', 'm-lineq1', { mode: 'placement', elapsedSec: 9000 }), // placement excluded
    ]
    const s = stateWith(events)
    const report = allocationReport(events, s.settings, NOW)
    expect(report.minutes.math).toBe(40)
    expect(report.minutes.observer).toBe(10)
    expect(report.totalMinutes).toBe(50)
    // math target 30% of 50 = 15 min → surplus; observer target 10% = 5 → surplus too;
    // untouched buckets carry positive debt.
    expect(report.debtMinutes.math).toBeLessThan(0)
    expect(report.debtMinutes.investigator).toBeGreaterThan(0)
    expect(relativeDebt(report, 'investigator')).toBe(1)
    expect(report.underserved[0]).not.toBe('math')
  })
  it('owes nothing with almost no data', () => {
    const one = [attempt('math', 'm-lineq1', { elapsedSec: 120 })]
    const report = allocationReport(one, initialState().settings, NOW)
    expect(relativeDebt(report, 'observer')).toBe(0)
  })
})

describe('calibration', () => {
  it('bands refuse to report accuracy under 3 samples and flag confident misses', () => {
    const events = [
      attempt('math', 'sk', { confidence: 90, firstCorrect: false, correct: false }),
      attempt('math', 'sk', { confidence: 85, firstCorrect: true }),
      attempt('math', 'sk', { confidence: 88, firstCorrect: true }),
      attempt('math', 'sk', { confidence: 45, firstCorrect: true }),
    ]
    const bands = calibrationBands(events)
    const top = bands.find((b) => b.lo === 80)!
    expect(top.n).toBe(3)
    expect(top.accuracy).toBeCloseTo(2 / 3)
    const mid = bands.find((b) => b.lo === 40)!
    expect(mid.accuracy).toBeNull()
    expect(highConfidenceErrors(events).length).toBe(1)
  })
  it('gap needs 8 rated attempts; brier averages resolved forecasts', () => {
    expect(calibrationGap([])).toBeNull()
    const eight = Array.from({ length: 8 }, (_, i) =>
      attempt('math', 'sk', { confidence: 90, firstCorrect: i < 4 }),
    )
    expect(calibrationGap(eight)).toBeCloseTo(0.4)
    expect(brierScore([])).toBeNull()
    const b = brierScore([
      { id: 'f', createdAt: 0, question: 'q', probability: 0.8, dueISO: '2026-01-01', resolved: { outcome: true, resolvedAt: 1, note: '' }, revisions: [] },
      { id: 'g', createdAt: 0, question: 'q', probability: 0.8, dueISO: '2026-01-01', resolved: { outcome: false, resolvedAt: 1, note: '' }, revisions: [] },
    ])!
    expect(b.score).toBeCloseTo((0.04 + 0.64) / 2)
  })
})

describe('planner', () => {
  const checkIn: CheckIn = { minutes: 25, energy: 'ok', focus: null }

  it('respects prerequisites for frontier eligibility', () => {
    const s = stateWith([])
    const evidence = deriveEvidence([], NOW)
    const linfunc = DEFAULT_INDEX.skills.get('m-linfunc')!
    expect(prereqsMet(linfunc, evidence, s)).toBe(false)
    const integers = DEFAULT_INDEX.skills.get('m-integers')!
    expect(prereqsMet(integers, evidence, s)).toBe(true)
    // placement 'ok' satisfies routing
    s.placement = {
      completedAt: NOW,
      minutes: 10,
      signals: [
        { skillId: 'm-linear', signal: 'ok', fromManual: false },
        { skillId: 'm-lineqmulti', signal: 'ok', fromManual: false },
      ],
      measuredSkillIds: [],
      unmeasuredNote: '',
      summary: [],
    }
    expect(prereqsMet(linfunc, deriveEvidence([], NOW), s)).toBe(true)
  })

  it('builds a session with warmup (when due), core, rotation, exit', () => {
    // Make m-lineq1 independent 5 days ago so review is due; leave frontier open.
    const events = [
      attempt('math', 'm-lineq1', { t: NOW - 6 * DAY }),
      attempt('math', 'm-lineq1', { t: NOW - 5 * DAY, seed: 999 }),
    ]
    const s = stateWith(events)
    const evidence = deriveEvidence(events, NOW)
    const plan = buildSessionPlan({ index: DEFAULT_INDEX, evidence, state: s, now: NOW, checkIn })
    const kinds = plan.blocks.map((b) => b.kind)
    expect(kinds).toContain('warmup')
    expect(kinds).toContain('core')
    expect(kinds).toContain('rotation')
    expect(kinds).toContain('exit')
    expect(plan.rationale.length).toBeGreaterThan(0)
    expect(plan.rationale.join(' ')).toContain('calibrating') // <3 sessions
    // every activity references a real template
    for (const b of plan.blocks) {
      for (const a of b.activities) expect(DEFAULT_INDEX.templates.has(a.templateId)).toBe(true)
    }
    // warmup contains the due review skill
    const warm = plan.blocks.find((b) => b.kind === 'warmup')!
    const warmSkills = warm.activities.flatMap((a) => DEFAULT_INDEX.templates.get(a.templateId)!.skillIds)
    expect(warmSkills).toContain('m-lineq1')
  })

  it('short sessions skip the rotation block', () => {
    const s = stateWith([])
    const plan = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence([], NOW),
      state: s,
      now: NOW,
      checkIn: { minutes: 10, energy: 'ok', focus: null },
    })
    expect(plan.blocks.some((b) => b.kind === 'rotation')).toBe(false)
  })

  it('fills a 30-minute session with a realistic amount of planned work and no duplicate forms', () => {
    const s = stateWith([])
    const plan = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence([], NOW),
      state: s,
      now: NOW,
      checkIn: { minutes: 30, energy: 'ok', focus: null },
    })
    expect(estimatedPlanMinutes(plan)).toBeGreaterThanOrEqual(24)
    expect(estimatedPlanMinutes(plan)).toBeLessThanOrEqual(33)
    const forms = plan.blocks.flatMap((block) => block.activities.map((activity) => {
      const template = DEFAULT_INDEX.templates.get(activity.templateId)!
      return `${activity.templateId}:${activity.seed % template.variants}`
    }))
    expect(new Set(forms).size).toBe(forms.length)
  })

  it('rotates a whole authentic workflow through its existing percentage category', () => {
    const events = [
      attempt('math', 'm-lineq1', { elapsedSec: 1800 }),
      attempt('coding', 'c-decomp', { seed: 401, elapsedSec: 60 }),
      attempt('coding', 'c-decomp', { seed: 402, elapsedSec: 60 }),
    ]
    const s = stateWith(events)
    s.sessions = Array.from({ length: 3 }, (_, i) => ({
      id: `session-${i}`,
      startedAt: NOW - (i + 1) * DAY,
      endedAt: NOW - (i + 1) * DAY + 30 * 60_000,
      activeMinutes: 30,
      checkIn: { minutes: 30, energy: 'ok', focus: null },
      attempts: 2,
      correctFirst: 2,
      bucketMinutes: { math: 30 },
      learned: [],
      exitPrinciple: null,
      interrupted: false,
    }))
    const plan = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence(events, NOW),
      state: s,
      now: NOW,
      checkIn: { minutes: 30, energy: 'ok', focus: null },
    })
    const applied = plan.blocks.find((block) => block.label.includes('applied work'))
    expect(applied).toBeTruthy()
    const template = DEFAULT_INDEX.templates.get(applied!.activities[0].templateId)!
    expect(template.authentic).toBeTruthy()
    expect(applied!.bucket).toBe(template.bucket)
    expect(applied!.why).toContain('balance target')
    expect(plan.rationale.join(' ')).toContain('counts toward')
  })

  it('honors an explicit lab focus request', () => {
    const s = stateWith([])
    const plan = buildSessionPlan({
      index: DEFAULT_INDEX,
      evidence: deriveEvidence([], NOW),
      state: s,
      now: NOW,
      checkIn: { minutes: 30, energy: 'ok', focus: 'strategist' },
    })
    const rotation = plan.blocks.find((b) => b.kind === 'rotation')
    expect(rotation?.bucket).toBe('strategist')
  })

  it('deadline within 14 days boosts matching skills', () => {
    const s = stateWith([])
    s.deadlines = [{ id: 'd', title: 'Math test', dateISO: new Date(NOW + 4 * DAY).toISOString().slice(0, 10), bucket: 'math', note: '' }]
    const evidence = deriveEvidence([], NOW)
    const report = allocationReport([], s.settings, NOW)
    const scored = scoreSkills('math', { index: DEFAULT_INDEX, evidence, state: s, now: NOW, checkIn }, report)
    expect(scored[0].reasons.join(' ')).toContain('Math test')
  })

  it('focus/mixed/challenge modes produce sane plans', () => {
    const events = [
      attempt('math', 'm-fractions', { t: NOW - 9 * DAY }),
      attempt('math', 'm-fractions', { t: NOW - 8 * DAY, seed: 77 }),
      attempt('math', 'm-integers', { t: NOW - 7 * DAY }),
      attempt('math', 'm-integers', { t: NOW - 6 * DAY, seed: 78 }),
    ]
    const s = stateWith(events)
    const evidence = deriveEvidence(events, NOW)
    const ctx = { index: DEFAULT_INDEX, evidence, state: s, now: NOW, checkIn }
    const focus = buildFocusPlan(ctx, 'm-percent')
    expect(focus.blocks[0].activities.length).toBeGreaterThan(0)
    expect(focus.blocks[0].label).toBe('Percent problems')
    const mixed = buildMixedReviewPlan(ctx)
    expect(mixed.blocks[0].activities.length).toBeGreaterThan(1)
    const challenge = buildChallengePlan(ctx)
    for (const b of challenge.blocks) {
      for (const a of b.activities) {
        expect(DEFAULT_INDEX.templates.get(a.templateId)!.difficulty).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('exam builder', () => {
  it('refuses honestly below the eligibility floor', async () => {
    const { buildExam } = await import('./exam')
    const result = buildExam(stateWith([]), deriveEvidence([], NOW), DEFAULT_INDEX, 'standard', 42)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('practiced skills')
  })
  it('builds a mixed, one-item-per-skill blind exam from practiced skills', async () => {
    const { buildExam } = await import('./exam')
    const skills = ['m-lineq1', 'm-percent', 'm-fractions', 'm-integers', 'm-prob', 'm-stats', 'p-motion']
    const events = skills.flatMap((sk, i) => [
      attempt(sk.startsWith('p') ? 'physics' : 'math', sk, { seed: i * 2, t: NOW - 5 * DAY }),
      attempt(sk.startsWith('p') ? 'physics' : 'math', sk, { seed: i * 2 + 1, t: NOW - 5 * DAY + 3_600_000 }),
    ])
    const s = stateWith(events)
    const result = buildExam(s, deriveEvidence(events, NOW), DEFAULT_INDEX, 'short', 42)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.plan.items.length).toBeGreaterThanOrEqual(5)
      // one template max once; every template exists and is single-kind
      const ids = result.plan.items.map((i) => i.templateId)
      expect(new Set(ids).size).toBe(ids.length)
      for (const it of result.plan.items) {
        const t = DEFAULT_INDEX.templates.get(it.templateId)!
        expect(t.kind).toBe('single')
      }
      expect(result.plan.suggestedMinutes).toBeGreaterThan(0)
      // deterministic per seed
      const again = buildExam(s, deriveEvidence(events, NOW), DEFAULT_INDEX, 'short', 42)
      expect(again.ok && JSON.stringify(again.plan.items)).toBe(JSON.stringify(result.plan.items))
    }
  })
})

describe('personal forgetting curves', () => {
  it('stretches intervals after review successes and shrinks after lapses', async () => {
    const { stabilityFactor } = await import('./mastery')
    expect(stabilityFactor(0, 0)).toBe(1)
    expect(stabilityFactor(4, 0)).toBeCloseTo(1.6)
    expect(stabilityFactor(0, 2)).toBeCloseTo(0.5) // floored
    expect(stabilityFactor(20, 0)).toBe(2) // capped
    // integration: third unaided success schedules 7d × 1.15
    const events = [
      attempt('math', 'sk-fc', { seed: 1, t: NOW - 10 * DAY }),
      attempt('math', 'sk-fc', { seed: 2, t: NOW - 9 * DAY }),
      attempt('math', 'sk-fc', { seed: 3, t: NOW - 5 * DAY }),
    ]
    const ev = deriveEvidence(events, NOW).get('sk-fc')!
    const expected = events[2].t + 7 * 1.15 * DAY
    expect(ev.review!.due).toBeCloseTo(expected, -4)
  })
})

describe('placement follow-ups', () => {
  it('a held-level pass marks ok, stops climbing, and supersedes the miss', () => {
    let p = startPlacement({ ...initialState().profile, gradeLevel: 8 }, NOW)
    const skill = nextProbe(p, DEFAULT_INDEX)!
    // hard form missed → UI runs follow-up → easier form passed:
    p = applyProbe(p, skill, { correct: true, skipped: false, confidence: null, heldLevel: true })
    expect(p.phase).toBe('breadth')
    const summary = summarizePlacement(p, DEFAULT_INDEX, NOW)
    const sig = summary.signals.find((s) => s.skillId === skill)!
    expect(sig.signal).toBe('ok')
    expect(summary.summary.join(' ')).toContain('follow-up')
  })
})

describe('five-level difficulty routing', () => {
  it('moves retained and transferred skills into advanced and expert work', () => {
    const base: SkillEvidence = {
      skillId: 'o-obsinf', state: 'unseen', bestState: 'unseen', needsReview: false, exposure: 0,
      guidedSuccesses: 0, independentForms: [], retainedAt: null, transferredAt: null,
      lastCorrectAt: null, lastAttemptAt: null, lastOutcomeCorrect: null, recentMisses: 0,
      blockedByMisconception: false, hintDependence: null, review: null, forms: [], attempts: 0,
    }
    expect(targetDifficulty({ ...base, state: 'independent', bestState: 'independent' }, 'ok', false)).toBe(3)
    expect(targetDifficulty({ ...base, state: 'retained', bestState: 'retained' }, 'ok', false)).toBe(4)
    expect(targetDifficulty({ ...base, state: 'transferred', bestState: 'transferred' }, 'ok', false)).toBe(5)
    expect(targetDifficulty({ ...base, state: 'transferred', bestState: 'transferred' }, 'ok', true)).toBe(3)
  })
})

describe('coach-tuned allocations', () => {
  it('boosts a deadline bucket, preserves a true 5% floor, and discloses', async () => {
    const { tuneTargets } = await import('./allocationPlus')
    const s = stateWith([])
    s.deadlines = [{ id: 'd', title: 'Physics quiz', dateISO: new Date(NOW + 3 * DAY).toISOString().slice(0, 10), bucket: 'physics', note: '' }]
    const tuned = tuneTargets(s, deriveEvidence([], NOW), DEFAULT_INDEX, NOW)
    expect(tuned.tuned).toBe(true)
    expect(tuned.targets.physics).toBe(s.settings.allocations.physics + 8)
    expect(Object.values(tuned.targets).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(tuned.notes.join(' ')).toContain('Physics quiz')
    for (const v of Object.values(tuned.targets)) {
      expect(v).toBeGreaterThanOrEqual(5)
    }
  })
  it('boosts buckets with piled-up due reviews', async () => {
    const { tuneTargets } = await import('./allocationPlus')
    // Two observer skills independent 10 days ago → both overdue.
    const events = ['o-obsinf', 'o-recall'].flatMap((sk, i) => [
      attempt('observer', sk, { t: NOW - 10 * DAY, seed: 100 + i }),
      attempt('observer', sk, { t: NOW - 10 * DAY + 3_600_000, seed: 200 + i }),
    ])
    const s = stateWith(events)
    const tuned = tuneTargets(s, deriveEvidence(events, NOW), DEFAULT_INDEX, NOW)
    expect(tuned.tuned).toBe(true)
    expect(tuned.targets.observer).toBeGreaterThan(s.settings.allocations.observer)
    expect(tuned.notes.join(' ')).toContain('review')
  })
  it('is inert when the user turns coach management off', async () => {
    const { tuneTargets } = await import('./allocationPlus')
    const s = stateWith([])
    s.settings.coachManagedAllocations = false
    s.deadlines = [{ id: 'd', title: 'Quiz', dateISO: new Date(NOW + 2 * DAY).toISOString().slice(0, 10), bucket: 'math', note: '' }]
    const tuned = tuneTargets(s, deriveEvidence([], NOW), DEFAULT_INDEX, NOW)
    expect(tuned.tuned).toBe(false)
    expect(tuned.targets).toEqual(s.settings.allocations)
  })
})

describe('placement', () => {
  const profile = { ...initialState().profile, gradeLevel: 8 }
  it('starts near grade level, climbs on success, brackets on failure', () => {
    let p = startPlacement(profile, NOW)
    expect(MATH_LADDER[p.ladderIndex]).toBe('m-lineqmulti')
    const first = nextProbe(p, DEFAULT_INDEX)!
    expect(first).toBe('m-lineqmulti')
    p = applyProbe(p, first, { correct: true, skipped: false, confidence: null })
    expect(nextProbe(p, DEFAULT_INDEX)).toBe('m-linear')
    p = applyProbe(p, 'm-linear', { correct: false, skipped: false, confidence: null })
    // gap right above highestOk → bracketed → breadth
    expect(p.phase).toBe('breadth')
    const summary = summarizePlacement(p, DEFAULT_INDEX, NOW)
    expect(summary.signals.find((s) => s.skillId === 'm-linear')!.signal).toBe('gap')
    expect(summary.signals.find((s) => s.skillId === 'm-lineqmulti')!.signal).toBe('ok')
    // routing assumption below the ladder is labeled in the summary
    expect(summary.summary.join(' ')).toContain('not measured')
  })
  it('descends on failure and stops at the floor', () => {
    let p = startPlacement({ ...profile, gradeLevel: 6 }, NOW)
    expect(p.ladderIndex).toBe(0)
    p = applyProbe(p, 'm-fractions', { correct: false, skipped: false, confidence: null })
    expect(p.phase).toBe('breadth')
    const sum = summarizePlacement(p, DEFAULT_INDEX, NOW)
    expect(sum.signals[0].signal).toBe('gap')
  })
  it('never exceeds the item cap', () => {
    let p = startPlacement(profile, NOW)
    let guard = 0
    while (p.phase !== 'done' && guard < 40) {
      const probe = nextProbe(p, DEFAULT_INDEX)
      if (!probe) break
      p = applyProbe(p, probe, { correct: guard % 3 !== 0, skipped: false, confidence: null })
      guard++
    }
    expect(p.results.length).toBeLessThanOrEqual(PLACEMENT_MAX_ITEMS)
  })
})

describe('coach', () => {
  it('admits ignorance with sparse data', () => {
    const beliefs = coachBeliefs(DEFAULT_INDEX, deriveEvidence([], NOW), stateWith([]), NOW)
    expect(beliefs[0].id).toBe('sparse')
    expect(beliefs[0].statement).toContain('do not know')
  })
  it('finds strengths, weaknesses, and the bottleneck with data', () => {
    const good = Array.from({ length: 16 }, (_, i) => attempt('math', 'm-lineq1', { seed: i, t: NOW - 5 * DAY + i * 3_600_000 }))
    const bad = Array.from({ length: 8 }, (_, i) =>
      attempt('coding', 'c-loops', { seed: 100 + i, correct: false, firstCorrect: false, t: NOW - 4 * DAY + i * 3_600_000 }),
    )
    const events = [...good, ...bad]
    const s = stateWith(events)
    const evidence = deriveEvidence(events, NOW)
    const beliefs = coachBeliefs(DEFAULT_INDEX, evidence, s, NOW)
    expect(beliefs.find((b) => b.id === 'strong-math')).toBeTruthy()
    expect(beliefs.find((b) => b.id === 'weak-coding')).toBeTruthy()
    const bn = findBottleneck(DEFAULT_INDEX, evidence, s)
    expect(bn).not.toBeNull()
    expect(weeklyObjective(DEFAULT_INDEX, evidence, s, NOW)).toContain('This week')
    expect(todayInsight(DEFAULT_INDEX, evidence, s, NOW).length).toBeGreaterThan(10)
  })
  it('intake counts every source: academic, labs, puzzles, reviews, written', () => {
    const events = [
      attempt('math', 'm-lineq1', { t: NOW - DAY }),
      attempt('puzzle', 'z-chess', { t: NOW - DAY }),
      attempt('puzzle', 'z-chess', { t: NOW - DAY, firstCorrect: false, correct: false }),
      attempt('observer', 'o-obsinf', { t: NOW - DAY, mode: 'review' }),
      attempt('strategist', 'st-premortem', { t: NOW - DAY, correct: null, firstCorrect: null, score: null, validator: 'draft' }),
      attempt('math', 'm-percent', { t: NOW - DAY, mode: 'transfer' }),
      attempt('math', 'm-percent', { t: NOW - 40 * DAY }), // outside window
      attempt('math', 'm-percent', { t: NOW - DAY, mode: 'placement' }), // excluded
    ]
    const intake = activityIntake(events, NOW, 7)
    expect(intake.total).toBe(6)
    expect(intake.academic).toBe(2) // m-lineq1 + the m-percent transfer
    expect(intake.puzzles).toBe(2)
    expect(intake.labs).toBe(2) // observer review + strategist draft
    expect(intake.reviews).toBe(1)
    expect(intake.transfers).toBe(1)
    expect(intake.written).toBe(1)
    expect(intake.graded).toBe(5)
    expect(intake.skillsTouched).toBe(5)
  })
})

describe('logic grid engine', () => {
  const puzzle = {
    categories: ['Kid', 'Pet'],
    values: [
      ['Ann', 'Ben'],
      ['cat', 'dog'],
    ],
    clues: [{ text: 'Ann has the cat.', spec: { kind: 'is', key: 0, cat: 1, val: 0 } as const }],
    solution: [[0, 1]],
  }
  it('validates unique solutions', () => {
    expect(puzzleValid(puzzle).ok).toBe(true)
    expect(assignmentCorrect(puzzle, [[0, 1]])).toBe(true)
    expect(assignmentCorrect(puzzle, [[1, 0]])).toBe(false)
  })
  it('rejects ambiguous and contradictory puzzles', () => {
    const ambiguous = { ...puzzle, clues: [] }
    expect(puzzleValid(ambiguous).ok).toBe(false)
    expect(puzzleValid(ambiguous).reason).toContain('unique')
    const impossible = {
      ...puzzle,
      clues: [
        { text: 'a', spec: { kind: 'is', key: 0, cat: 1, val: 0 } as const },
        { text: 'b', spec: { kind: 'is', key: 0, cat: 1, val: 1 } as const },
      ],
    }
    expect(puzzleValid(impossible).ok).toBe(false)
    expect(countSolutions(impossible, 2).count).toBe(0)
  })
})

describe('polyomino engine', () => {
  const spec = specFromDrawing(['AAB', 'ABB'], { A: 0, B: 1 })
  it('rotation normalizes and occupies correctly', () => {
    const L: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
    ]
    expect(rotateCells(L, 1)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ])
    expect(rotateCells(L, 4)).toEqual(rotateCells(L, 0))
    expect(occupiedCells(L, { x: 2, y: 3, rot: 0 })).toContainEqual([2, 3])
  })
  it('authored drawing is solvable and detects completion, overlap, outside', () => {
    expect(solutionValid(spec)).toBe(true)
    const solved = Object.fromEntries(
      Object.entries(spec.solution).map(([id, s]) => [id, { x: s.x, y: s.y, rot: s.rot as 0 }]),
    )
    expect(isComplete(spec, solved)).toBe(true)
    expect(isComplete(spec, {})).toBe(false)
    const a = spec.pieces.find((p) => p.id === 'A')!
    expect(fits(spec, a.id, { x: 5, y: 5, rot: 0 }, {}).reason).toBe('outside')
    const bOnA = fits(spec, 'B', spec.solution.A as never, { A: spec.solution.A as never })
    expect(bOnA.ok).toBe(false)
  })
})

describe('chess tools', () => {
  it('finds mates, keeps forced mates, rejects illegal SAN', () => {
    const backRank = '6k1/5ppp/8/8/8/8/3R4/2K5 w - - 0 1'
    expect(matingMoves(backRank)).toContain('Rd8#')
    expect(isForcedMate(backRank, 1)).toBe(true)
    expect(applySan(backRank, 'Rd9')).toBeNull()
    expect(applySan(backRank, 'Rd8#')).not.toBeNull()
    const m2 = '8/R7/4R3/3K4/8/8/8/5k2 w - - 0 1'
    expect(matingMoves(m2).length).toBe(0)
    const keys = movesKeepingMate(m2, 2)
    expect(keys).toContain('Ra2')
    // after the key move the toughest reply exists and mate-in-1 follows
    const after = applySan(m2, 'Ra2')!
    const reply = toughestReply(after)!
    const afterReply = applySan(after, reply)!
    expect(matingMoves(afterReply).length).toBeGreaterThan(0)
    expect(movesFrom(backRank, 'd2').some((m) => m.to === 'd8')).toBe(true)
  })
})

describe('export / import / sanitize', () => {
  it('round-trips a real state', () => {
    const sample = buildSampleState()
    const json = exportState(sample)
    const back = importState(json)
    expect(back.ok).toBe(true)
    if (back.ok) {
      expect(back.state.events.length).toBe(sample.events.length)
      expect(back.state.sessions.length).toBe(sample.sessions.length)
      expect(back.state.profile.name).toBe('Sample Learner')
      // derived state identical after round trip
      const a = deriveEvidence(sample.events, NOW)
      const b = deriveEvidence(back.state.events, NOW)
      expect(b.get('m-lineq1')?.state).toBe(a.get('m-lineq1')?.state)
    }
  })
  it('rejects malformed payloads without crashing', () => {
    expect(importState('not json').ok).toBe(false)
    expect(importState('{}').ok).toBe(false)
    expect(importState(JSON.stringify({ app: 'other', schema: 1, state: {} })).ok).toBe(false)
    const evil = importState(
      JSON.stringify({
        app: 'axiomlab',
        schema: 1,
        state: {
          events: [{ templateId: 'x' }, null, 5, { templateId: 'ok', t: NOW, skillIds: ['s'], bucket: 'math' }],
          sessions: 'nope',
          profile: { name: 12345, sessionMinutes: 999 },
          settings: { allocations: { math: 'NaN', physics: 3, bogus: 50 } },
        },
      }),
    )
    expect(evil.ok).toBe(true)
    if (evil.ok) {
      expect(evil.state.events.length).toBe(1)
      expect(evil.state.sessions.length).toBe(0)
      expect(evil.state.profile.name).toBe('')
      expect(evil.state.profile.sessionMinutes).toBe(30)
      expect(evil.state.settings.allocations.math).toBeGreaterThanOrEqual(5)
      expect(evil.state.settings.allocations.physics).toBe(5)
      expect(Object.values(evil.state.settings.allocations).reduce((sum, value) => sum + value, 0)).toBe(100)
      expect('bogus' in evil.state.settings.allocations).toBe(false)
    }
  })
  it('sanitize never throws on garbage', () => {
    for (const garbage of [null, 42, 'str', [], { events: [{}] }, { profile: [] }]) {
      expect(() => sanitizeState(garbage)).not.toThrow()
    }
  })
})

describe('content pack schema', () => {
  const goodPack = {
    schema: 'axiomlab-pack@1',
    meta: { id: 'p1', name: 'Extra practice', version: 1, description: '', author: 'me' },
    items: [
      {
        id: 'x1',
        version: 1,
        name: 'Add',
        skillIds: ['m-integers'],
        bucket: 'math',
        difficulty: 1,
        prompt: 'What is 2+2?',
        answer: { type: 'numeric', answer: 4 },
        hints: ['count'],
        explanation: '2+2=4',
        provenance: 'me',
        minutes: 1,
      },
    ],
  }
  it('accepts a valid pack', () => {
    const v = validatePack(goodPack)
    expect(v.ok).toBe(true)
  })
  it('rejects script content, bad answers, wrong schema', () => {
    expect(validatePack({ ...goodPack, schema: 'nope' }).ok).toBe(false)
    const script = JSON.parse(JSON.stringify(goodPack))
    script.items[0].prompt = 'hello <script>alert(1)</script>'
    expect(validatePack(script).ok).toBe(false)
    const badAnswer = JSON.parse(JSON.stringify(goodPack))
    badAnswer.items[0].answer = { type: 'mcq', options: ['a'], correct: 5 }
    expect(validatePack(badAnswer).ok).toBe(false)
    const dupe = JSON.parse(JSON.stringify(goodPack))
    dupe.items = [dupe.items[0], dupe.items[0]]
    expect(validatePack(dupe).ok).toBe(false)
  })
})

describe('sample data', () => {
  it('is deterministic, internally consistent, and non-trivial', () => {
    const a = buildSampleState()
    const b = buildSampleState()
    expect(a.events.length).toBe(b.events.length)
    expect(a.events.length).toBeGreaterThan(40)
    expect(a.sessions.length).toBeGreaterThan(8)
    // events marked correct actually validate as correct was enforced at build
    const evidence = deriveEvidence(a.events, Date.now())
    expect(evidence.size).toBeGreaterThan(10)
    // some skill should have progressed beyond guided
    const states = [...evidence.values()].map((e) => e.state)
    expect(states).toContain('independent')
  })
})
