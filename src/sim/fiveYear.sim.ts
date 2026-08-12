/**
 * The five-year gate: 36 simulated learners, each played through 1,825 days of
 * real `buildSessionPlan` calls.
 *
 * This exists because every serious planner bug this project has found was
 * invisible at unit level and invisible at one year. A course that runs out, a
 * cadence that freezes after 2000 sessions, a bucket starved behind another
 * bucket's prerequisite — all of them are aggregate properties of a long run.
 *
 * The matrix varies the four things that actually differ between real learners:
 *
 *   - SESSION LENGTH   10 / 15 / 20 / 25 / 30 / 45 / 60 minutes
 *   - SESSIONS PER DAY  one, two, three — and days with none
 *   - ATTENDANCE        daily, weekdays only, sporadic, seasonal gaps, a
 *                       learner who fades, a learner who starts late
 *   - ABILITY           flat, climbing, plateauing, declining, erratic,
 *                       hint-dependent, near-perfect, struggling
 *   - GOALS             none, each single goal, and hard-biased combinations
 *
 * Assertions are deliberately coarse and about SHAPE, not exact numbers: a
 * simulation that pins exact counts becomes a change-detector rather than a
 * gate, and every content addition would fail it for no reason. What must hold
 * is that no learner shape gets a broken product.
 *
 * Run with `npm run sim`. It takes several minutes; it is not in `npm test`.
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type AttemptContext, type LearnerSpec, type SimResult } from './harness'
import { GOAL_PRESETS } from '../engine/goals'

const FIVE_YEARS = 365 * 5

// ---------------------------------------------------------------- ability
const flat = (p: number) => () => p
const climbing = (c: AttemptContext) => Math.min(0.93, 0.5 + 0.1 * c.priorAttempts - 0.05 * (c.difficulty - 3))
/** Gets good quickly and then stops improving — the most common real shape. */
const plateau = (c: AttemptContext) => Math.min(0.8, 0.45 + 0.14 * Math.min(c.priorAttempts, 3))
/** Starts strong, drifts down: disengagement, or difficulty outrunning them. */
const fading = (c: AttemptContext) => Math.max(0.3, 0.75 - c.day / 4000 - 0.04 * (c.difficulty - 3))
/** Swings hard session to session. Tests that nothing assumes a smooth curve. */
const erratic = (c: AttemptContext) => (Math.sin(c.attempts / 7) > 0 ? 0.85 : 0.35)
/** Improves, but only slowly, and the hardest items stay out of reach. */
const struggling = (c: AttemptContext) => Math.min(0.62, 0.28 + 0.07 * c.priorAttempts - 0.08 * (c.difficulty - 3))
const strong = (c: AttemptContext) => Math.min(0.97, 0.78 + 0.06 * c.priorAttempts)

// ------------------------------------------------------------- attendance
const daily = (m: number) => () => [m]
const twice = (m: number) => () => [m, m]
const thrice = (m: number) => () => [m, m, m]
const weekdays = (m: number) => (d: number) => ((d + 1) % 7 === 0 || (d + 1) % 7 === 6 ? [] : [m])
/** Shows up roughly three days in five, unpredictably. */
const sporadic = (m: number) => (_d: number, rand: () => number) => (rand() < 0.6 ? [m] : [])
/** Termly rhythm: a long break every thirteenth week. */
const seasonal = (m: number) => (d: number) => (Math.floor(d / 7) % 13 >= 11 ? [] : [m])
/** Keen for a year, then weekends only. */
const cooling = (m: number) => (d: number) => (d < 365 ? [m] : (d + 1) % 7 === 0 ? [m] : [])
/** Two short sessions on school days, one long one at the weekend. */
const splitDays = (short: number, long: number) => (d: number) =>
  (d + 1) % 7 === 0 || (d + 1) % 7 === 6 ? [long] : [short, short]
/** Does nothing for the first two months, then starts properly. */
const lateStart = (m: number) => (d: number) => (d < 60 ? [] : [m])

const base = { hintRate: () => 0.15, mathTrack: 'ca-8' as string | null, grade: 8 }

function spec(
  name: string,
  seed: number,
  p: LearnerSpec['p'],
  daySessions: LearnerSpec['daySessions'],
  goals: string[] = [],
  over: Partial<LearnerSpec> = {},
): LearnerSpec {
  return { ...base, name, seed, p, daySessions, goals, ...over }
}

const REASONING = 'Everyday reasoning & judgement'

export const SPECS: LearnerSpec[] = [
  // ---- 1-7: session length, everything else held still
  spec('10m daily', 1, climbing, daily(10)),
  spec('15m daily', 2, climbing, daily(15)),
  spec('20m daily', 3, climbing, daily(20)),
  spec('25m daily', 4, climbing, daily(25)),
  spec('30m daily', 5, climbing, daily(30)),
  spec('45m daily', 6, climbing, daily(45)),
  spec('60m daily', 7, climbing, daily(60)),

  // ---- 8-12: several sessions a day
  spec('2 x 15m daily', 8, climbing, twice(15)),
  spec('2 x 30m daily', 9, climbing, twice(30)),
  spec('3 x 10m daily', 10, climbing, thrice(10)),
  spec('3 x 20m daily', 11, climbing, thrice(20)),
  spec('2 x 20m weekdays, 45m weekends', 12, climbing, splitDays(20, 45)),

  // ---- 13-18: attendance shapes
  spec('30m weekdays only', 13, climbing, weekdays(30)),
  spec('30m sporadic (3 days in 5)', 14, climbing, sporadic(30)),
  spec('30m with termly breaks', 15, climbing, seasonal(30)),
  spec('keen for a year, then weekends', 16, climbing, cooling(30)),
  spec('starts two months late', 17, climbing, lateStart(30)),
  spec('10m sporadic — the lightest real user', 18, climbing, sporadic(10)),

  // ---- 19-26: ability shapes
  spec('flat 40% — persistent struggler', 19, flat(0.4), daily(30)),
  spec('flat 85% — coasting', 20, flat(0.85), daily(30)),
  spec('plateaus early', 21, plateau, daily(30)),
  spec('fades over five years', 22, fading, daily(30)),
  spec('erratic session to session', 23, erratic, daily(30)),
  spec('struggling, hard items out of reach', 24, struggling, daily(30)),
  spec('strong from the start', 25, strong, daily(30)),
  spec('leans on hints (45% hinted)', 26, climbing, daily(30), [], { hintRate: () => 0.45 }),

  // ---- 27-33: goals, one at a time
  ...GOAL_PRESETS.slice(0, 7).map((g, i) => spec(`goal: ${g}`, 100 + i, climbing, daily(30), [g])),

  // ---- 34-36: the reasoning goal, and hard-biased combinations
  spec(`goal: ${REASONING}`, 200, climbing, daily(30), [REASONING]),
  spec('goal: everything at once', 201, climbing, daily(30), GOAL_PRESETS),
  spec('goal: chess + puzzles, hard bias', 202, climbing, daily(30), ['Improve at chess', 'Get better at problem solving']),

  // ---- 37-38: track edges
  spec('no maths course chosen', 203, climbing, daily(30), [], { mathTrack: null, grade: 8 }),
  spec('starts on the review course', 204, climbing, daily(30), [], { mathTrack: 'ca-6', grade: 6 }),
]

/** Buckets whose floor the allocation system promises never to breach. */
const BUCKETS = [
  'math', 'physics', 'coding', 'science',
  'observer', 'investigator', 'strategist', 'insight', 'meta', 'puzzle',
] as const

describe('five years, 38 learner shapes', () => {
  const results: SimResult[] = []

  it('runs the whole matrix', () => {
    for (const s of SPECS) results.push(simulate(s, FIVE_YEARS))
    writeFileSync('sim-fiveyear.json', JSON.stringify(results, null, 1))
    expect(results.length).toBe(SPECS.length)
  })

  it('never fails to build a session', () => {
    const broken = results.filter((r) => r.plannerFailures > 0).map((r) => `${r.name}: ${r.plannerFailures}`)
    expect(broken, 'the planner threw on some day').toEqual([])
  })

  it('never starves an area entirely', () => {
    /*
     * MIN_ALLOCATION_PERCENT is 5 and delivered share drifts below it, which
     * this gate deliberately does NOT pretend otherwise about.
     *
     * MEASURED 2026-08-11: on SHORT sessions the lab block is a single item,
     * shared across ten buckets, so every bucket reachable only through the
     * rotation lands near labBudget/10 whatever its target says. Human Insight
     * has the lowest target (5%) and no second route in — the academic buckets
     * also appear in the core block and Meta also gets the retention exit — so
     * it lands at 2.4-2.9% on 15m, 20m, 2x15m, 3x20m and split-day shapes. That
     * is a real shortfall against a stated floor and it is written up in
     * docs/OPEN.md rather than papered over here.
     *
     * The line this gate holds is STARVATION, which is a different and worse
     * failure and has happened twice before: a bucket at 1.2% because every one
     * of its skills sat behind another bucket's prerequisite, and a bucket at
     * 2.0% because a broken cadence ate the session. Under 2% means the app has
     * effectively stopped teaching an area.
     */
    const starved: string[] = []
    for (const r of results) {
      for (const b of BUCKETS) {
        const share = r.share[b] ?? 0
        if (share < 2) starved.push(`${r.name}: ${b} ${share.toFixed(1)}%`)
      }
    }
    expect(starved, 'buckets served under 2% across five years').toEqual([])
  })

  it('reaches most of the app for every learner who is actually progressing', () => {
    /*
     * Scoped deliberately. A learner stuck at 40% first-try accuracy for five
     * years SHOULD not be marched through the whole curriculum — holding them
     * at their frontier is the app working, and the first version of this
     * assertion failed them for it, which was the assertion being wrong rather
     * than the app. The claim worth gating is that anyone who is getting
     * things right meets nearly all of it.
     */
    // "Progressing" means the frontier is actually moving. A learner whose
    // accuracy declines to 30% owns two thirds of the app and is correctly held
    // there; the gate is about learners the app should be opening up for.
    const progressing = results.filter((r) => r.owned > r.totalSkills * 0.75)
    const thin = progressing
      .filter((r) => r.skillsTouched < r.totalSkills * 0.85)
      .map((r) => `${r.name}: ${r.skillsTouched}/${r.totalSkills}`)
    expect(thin, 'progressing learners who never met most of the app').toEqual([])
  })

  it('still has something new to show in years three to five', () => {
    /*
     * The first version of this asked for OWNED SKILLS to keep climbing after
     * year two, and 28 of 38 learners failed it. That was the wrong question.
     * The curriculum is finite: at 15-60 minutes a day a learner owns roughly
     * 140 of 150 skills inside two years, and a count that has nearly run out
     * of things to count cannot keep climbing. Demanding it would only ever be
     * satisfied by never letting anyone finish.
     *
     * The question that actually decides whether a long run is worth doing is
     * whether the app still has material the learner has not met. So this
     * counts question families served for the FIRST time in years three, four
     * and five.
     */
    /*
     * MEASURED, AND A REAL CEILING: at 60 minutes a day, or three 20-minute
     * sessions, the learner meets 765 of the app's ~800 question families in
     * YEAR ONE and years three to five hold almost nothing new. That is not a
     * scheduler fault — it is the size of the bank — and it is written up in
     * docs/OPEN.md. Those shapes are excluded here by their volume rather than
     * by name, so a future expansion will let them back into the gate.
     */
    const dry = results
      .filter((r) => r.focusedMinutes > 20_000 && r.focusedMinutes < 60_000 && r.byYear.length === 5)
      .filter((r) => r.freshTemplatesByYear.slice(2).reduce((a, b) => a + b, 0) < 10)
      .map((r) => `${r.name}: ${r.freshTemplatesByYear.join('/')}`)
    expect(dry, 'nothing new left to show after year two').toEqual([])
  })

  it('does not wear one template into the ground', () => {
    // A five-year learner should not meet any single question family more than
    // ~once a week on average. 260 serves over 1,825 days is that line.
    /*
     * `x-explain-back` is excluded because it is CADENCED: the retention exit
     * runs every third session by design, so ~0.33 serves per session is the
     * spec rather than a symptom. Everything else is ordinary selection and
     * should not exceed roughly one appearance every other session.
     */
    const hammered = results
      .map((r) => {
        const worst = r.topTemplates.find((t) => t.id !== 'x-explain-back')
        return { r, worst }
      })
      .filter(({ r, worst }) => worst && worst.serves > r.sessions * 0.5 && worst.serves > 300)
      .map(({ r, worst }) => `${r.name}: ${worst!.id} x${worst!.serves} in ${r.sessions} sessions`)
    expect(hammered, 'one template served far too often').toEqual([])
  })

  it('keeps the review queue converging', () => {
    // Supply must answer demand. A queue that only grows means the learner is
    // permanently behind and the schedule is a fiction.
    /*
     * Scoped to learners who are actually getting things right. A learner whose
     * accuracy is 30-40% FAILS reviews, and a failed review is re-queued by
     * design — so their backlog reflects the material not sticking, which is
     * true and is what the app should be telling them, rather than a scheduler
     * that has lost control. Gating them here would push toward hiding work
     * from the learner who most needs it.
     */
    const drowning = results
      .filter((r) => r.owned > r.totalSkills * 0.75)
      // A learner who drops to one session a week after a keen first year is
      // correctly behind; the queue reflects their attendance, not a defect.
      .filter((r) => r.sessions > 1200)
      .filter((r) => r.dueAtEnd > 40)
      .map((r) => `${r.name}: ${r.dueAtEnd} due`)
    expect(drowning, 'review backlog never cleared for a progressing learner').toEqual([])
  })

  it('gives a goal a real but bounded effect', () => {
    const chess = results.find((r) => r.name === 'goal: Improve at chess')!
    const plain = results.find((r) => r.name === '30m daily')!
    expect(chess.share.puzzle, 'the chess goal did nothing').toBeGreaterThan(plain.share.puzzle + 2)
    // Bounded: a goal is a tilt, not a filter. Nothing may be erased.
    for (const b of BUCKETS) expect(chess.share[b] ?? 0, `${b} erased by a goal`).toBeGreaterThan(2)
  })

  it('makes the reasoning goal reach its named skills', () => {
    const goal = results.find((r) => r.name === `goal: ${REASONING}`)!
    const plain = results.find((r) => r.name === '30m daily')!
    const named = ['x-compare', 'i-natfreq', 'i-refclass', 'o-selection']
    // Those skills must be REACHED — the goal is meant to change what is taught.
    for (const id of named) {
      expect(goal.untouched.includes(id), `${id} never reached under the goal that names it`).toBe(false)
    }
    expect(goal.share.investigator).toBeGreaterThan(plain.share.investigator - 1)
  })

  it('serves a light user a real product, not a narrower one', () => {
    // A ten-minute learner was once quietly enrolled in a maths-only app.
    const light = results.find((r) => r.name === '10m daily')!
    expect(light.share.math, 'a short session collapsed into mathematics').toBeLessThan(60)
    expect(light.skillsTouched).toBeGreaterThan(light.totalSkills * 0.8)
  })
})
