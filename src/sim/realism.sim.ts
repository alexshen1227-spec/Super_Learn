/**
 * Aggregate delivery gates for the machinery the uniform simulated learner
 * never touched.
 *
 * Every spec before 2026-08-19 wrote events with `correct === firstCorrect`
 * (no corrective retries ever), `confidence: null` (calibration never
 * exercised), `errorTags: []` (mal-rules never fire), and hint use drawn
 * independently of difficulty. Four subsystems therefore had ZERO aggregate
 * measurement: the corrective/repair loop (guided credit), the misconception
 * block (confident miss ≥ 80 → block → repair), the calibration readouts, and
 * the error-tag profile. This file plays learner shapes that exercise each
 * one through real `buildSessionPlan` calls and gates on what the ENGINE
 * derives — deriveEvidence, calibrationGap, malRuleProfile — never only on
 * the harness's own mirrors, because a mirror shares its own blind spots.
 *
 * Gate thresholds were MEASURED FIRST (the honest numbers are quoted beside
 * each pin) and set with margin, so the gate catches the mechanism breaking
 * rather than the noise moving.
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type AttemptContext, type LearnerSpec } from './harness'
import { calibrationGap } from '../engine/calibration'
import { malRuleProfile } from '../engine/malRules'
import { deriveEvidence, formsRequired, stateRank } from '../engine/mastery'
import { isPflTemplate } from '../engine/pflId'
import { isSpontaneousTemplate } from '../engine/probeId'
import type { AttemptEvent, ErrorTag } from '../domain/types'

const DAY = 86_400_000
const report: string[] = []

/** The app records confidence in these steps (ItemPlayer / PlacementScreen). */
const CONFIDENCE_STEPS = [20, 40, 60, 80, 95]
function snap(v: number): number {
  return CONFIDENCE_STEPS.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), CONFIDENCE_STEPS[0])
}

/** Gets good quickly, then stops — same shape as fiveYear's `plateau`. */
const plateau = (c: AttemptContext) => Math.min(0.8, 0.45 + 0.14 * Math.min(c.priorAttempts, 3))
/** Improves slowly; hard items stay out of reach (fiveYear's `struggling`). */
const struggling = (c: AttemptContext) => Math.min(0.62, 0.28 + 0.07 * c.priorAttempts - 0.08 * (c.difficulty - 3))
/** Strong from the start (fiveYear's `strong`) — owns skills early, so the
 * planner's interleaved core blocks actually happen. */
const strong = (c: AttemptContext) => Math.min(0.97, 0.78 + 0.06 * c.priorAttempts)

function learner(name: string, seed: number, p: LearnerSpec['p'], over: Partial<LearnerSpec> = {}): LearnerSpec {
  return { name, seed, p, hintRate: () => 0.15, daySessions: () => [30], goals: [], mathTrack: 'ca-8', grade: 8, ...over }
}

/** Events are probe-stripped during replay; any mirror of engine rules must skip them too. */
function isProbe(e: AttemptEvent): boolean {
  return isPflTemplate(e.templateId) || isSpontaneousTemplate(e.templateId)
}

/** Same-skill run lengths inside one played block. */
function maxRun(seq: string[]): number {
  let best = 1
  let cur = 1
  for (let i = 1; i < seq.length; i++) {
    cur = seq[i] === seq[i - 1] ? cur + 1 : 1
    best = Math.max(best, cur)
  }
  return best
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

/** Shared with the mal-rule canary below, so it need not re-simulate. */
let untaggedEvents: AttemptEvent[] | null = null

describe('delivery of the repair / calibration / error-tag machinery', () => {
  it('overconfident learner: the calibration readout sees the gap and misconception blocks arm and clear', () => {
    /*
     * Rates every item ~15 points above own accuracy, snapped to the app's
     * steps. plateau() caps at 0.8, so stated confidence lands at 60/80/95
     * against 45-80% accuracy — overconfident at every rung of the climb,
     * with plenty of ≥80-confidence misses to arm misconception blocks.
     */
    const spec = learner('overconfident (+15 vs accuracy)', 9001, plateau, {
      confidence: (ctx) => snap(100 * plateau(ctx) + 15),
    })
    const run = simulate(spec, 365)
    const events = run.eventsForExport
    const origin = events[0]!.t
    const endT = events[events.length - 1]!.t + 60_000

    const events60 = events.filter((e) => e.t < origin + 60 * DAY)
    const gap60 = calibrationGap(events60)
    const gapAll = calibrationGap(events)
    report.push(
      `\noverconfident learner, 365 days, ${run.attempts} attempts, ${run.confidenceRatedEvents} rated` +
        `\n  calibrationGap at 60 days: ${gap60 === null ? 'null' : `+${(gap60 * 100).toFixed(1)} points`} on ${events60.length} events` +
        `\n  calibrationGap at 1 year:  ${gapAll === null ? 'null' : `+${(gapAll * 100).toFixed(1)} points`}` +
        `\n  misconception blocks: ${run.misconceptionArmed} armed, ${run.misconceptionCleared} cleared`,
    )

    /*
     * MEASURED 2026-08-19 before pinning: +15.2 points at 60 days (on 514
     * rated events) and +15.2 at one year — the designed +15 survives the
     * snap to the app's five steps. Pinned at +5: a third of the measured
     * value, still unambiguous overconfidence, and below the planner's own
     * ±12-point miscalibration bar so this gate trips well before the
     * readout would go quiet.
     */
    expect(run.confidenceRatedEvents).toBeGreaterThan(0)
    expect(gap60, 'calibration gap invisible inside 60 days').not.toBeNull()
    expect(gap60!).toBeGreaterThan(0.05)
    expect(gapAll).not.toBeNull()
    expect(gapAll!).toBeGreaterThan(0.05)

    /*
     * Second derivation, through the ENGINE rather than the harness mirror:
     * nominate arm/clear instants from the raw stream, then ask
     * deriveEvidence whether the skill really was blocked at the arm instant
     * and really unblocked at the clear instant. The mirror only nominates;
     * the engine decides.
     */
    interface Episode {
      skillId: string
      armAt: number
      clearAt: number | null
    }
    const live = new Map<string, Episode>()
    const episodes: Episode[] = []
    for (const e of events) {
      if (isProbe(e)) continue
      const confidentMiss = e.firstCorrect === false && e.confidence !== null && e.confidence >= 80
      const firstSuccess = e.firstCorrect === true && e.hintLevel === 0
      for (const id of e.skillIds) {
        if (confidentMiss && !live.has(id)) {
          const ep = { skillId: id, armAt: e.t, clearAt: null }
          live.set(id, ep)
          episodes.push(ep)
        } else if (firstSuccess && live.has(id)) {
          live.get(id)!.clearAt = e.t
          live.delete(id)
        }
      }
    }
    const completed = episodes.filter((ep) => ep.clearAt !== null)
    report.push(
      `  episodes (mirror): ${episodes.length} armed, ${completed.length} later cleared by unaided success` +
        `\n  still blocked at end: ${episodes.length - completed.length}`,
    )
    for (const ep of completed.slice(0, 3)) {
      const atArm = deriveEvidence(
        events.filter((e) => e.t <= ep.armAt),
        ep.armAt,
      )
      expect(atArm.get(ep.skillId)?.blockedByMisconception, `${ep.skillId} blocked at arm instant`).toBe(true)
      const atClear = deriveEvidence(
        events.filter((e) => e.t <= ep.clearAt!),
        ep.clearAt!,
      )
      expect(atClear.get(ep.skillId)?.blockedByMisconception, `${ep.skillId} unblocked at clear instant`).toBe(false)
    }
    expect(completed.length).toBeGreaterThan(0)

    /*
     * MEASURED 2026-08-19: 599 blocks armed and 596 cleared across the year
     * — the block is a busy mechanism for a confidently-wrong learner, not a
     * corner case. Pinned at 20/20, a 30x margin: the gate asks whether the
     * arm→repair loop is ALIVE at aggregate scale, and a count that fell
     * from ~600 to below 20 means the machinery, not the noise, changed.
     */
    expect(run.misconceptionArmed).toBeGreaterThanOrEqual(20)
    expect(run.misconceptionCleared).toBeGreaterThanOrEqual(20)

    const evidence = deriveEvidence(events, endT)
    const blockedAtEnd = [...evidence.values()].filter((v) => v.blockedByMisconception).length
    report.push(`  engine at end of year: ${blockedAtEnd} skills currently blocked`)
    // Mirror-vs-engine agreement: transitions counted from the raw stream
    // must land exactly on the engine's end state (measured: 599 − 596 = 3
    // blocked, and the engine reported 3). Any drift here means the harness
    // mirror and mastery.ts no longer speak the same rules.
    expect(run.misconceptionArmed - run.misconceptionCleared, 'mirror vs engine end-state').toBe(blockedAtEnd)
  })

  it('repairing learner: guided credit accrues and repaired work never counts as independence', () => {
    const spec = learner('repairing (60% of misses corrected on retry)', 9002, plateau, {
      repair: () => 0.6,
    })
    const run = simulate(spec, 365)
    const events = run.eventsForExport
    const endT = events[events.length - 1]!.t + 60_000

    const misses = events.filter((e) => e.firstCorrect === false).length
    const ratio = misses ? run.repairedEvents / misses : 0
    const evidence = deriveEvidence(events, endT)
    const skillsWithGuided = [...evidence.values()].filter((v) => v.guidedSuccesses > 0).length
    const totalGuided = [...evidence.values()].reduce((a, v) => a + v.guidedSuccesses, 0)
    const repairedNonProbe = events.filter((e) => !isProbe(e) && e.correct === true && e.firstCorrect === false).length
    report.push(
      `\nrepairing learner, 365 days, ${run.attempts} attempts` +
        `\n  misses ${misses}, repaired ${run.repairedEvents} (${(100 * ratio).toFixed(1)}% of misses; spec says 60%)` +
        `\n  guided-credit events ${run.guidedCreditEvents} (repairs + hinted successes)` +
        `\n  skills with guidedSuccesses > 0: ${skillsWithGuided} of ${evidence.size} touched` +
        `\n  engine guidedSuccesses total ${totalGuided} vs ${repairedNonProbe} non-probe repairs`,
    )

    /*
     * MEASURED 2026-08-19: 692 misses, 416 repaired — 60.1% against the
     * spec's 60%, so the corrective draw is wired to misses and to nothing
     * else. Bounds pinned at ±10 points: over ~700 draws the binomial noise
     * is under ±2 points, so a breach means the wiring moved (a repair
     * overwriting firstCorrect would drive the measured ratio to 0, a repair
     * firing on successes would push it past the bound the other way).
     */
    expect(run.repairedEvents).toBeGreaterThanOrEqual(100) // measured 416
    expect(ratio).toBeGreaterThan(0.5)
    expect(ratio).toBeLessThan(0.7)
    /*
     * MEASURED 2026-08-19: 128 of 133 touched skills ended the year holding
     * guided credit. Pinned at 40 — still "many skills" by any reading, and
     * a mechanism that suddenly delivered fewer has stopped reaching the
     * breadth of the curriculum rather than wobbled.
     */
    expect(skillsWithGuided, 'guided evidence failed to accrue broadly').toBeGreaterThanOrEqual(40)
    // Engine agreement: every non-probe repair earns guided credit on at
    // least one skill, so the engine total cannot sit below the repair count
    // (measured: 1002 engine guided successes vs 410 non-probe repairs).
    expect(totalGuided).toBeGreaterThanOrEqual(repairedNonProbe)

    /*
     * The law under test, stated on the whole log and checked through the
     * engine: a skill whose unaided first-try successes span fewer distinct
     * question families than its bar (2, 3 for Path buckets) must NOT be at
     * Independent or above — however many repaired or hinted successes it
     * holds. If a repair ever leaked into `firstCorrect`, skills would cross
     * this line and the list below would fill.
     */
    const unaidedFamilies = new Map<string, Set<string>>()
    const firstBucket = new Map<string, string>()
    for (const e of events) {
      for (const id of e.skillIds) {
        if (!firstBucket.has(id)) firstBucket.set(id, e.bucket)
      }
      if (isProbe(e)) continue
      if (e.firstCorrect === true && e.hintLevel === 0 && e.mode !== 'placement') {
        for (const id of e.skillIds) {
          if (!unaidedFamilies.has(id)) unaidedFamilies.set(id, new Set())
          unaidedFamilies.get(id)!.add(e.templateId)
        }
      }
    }
    const overclaimed: string[] = []
    let underBar = 0
    for (const [id, v] of evidence) {
      const families = unaidedFamilies.get(id)?.size ?? 0
      if (families < formsRequired(firstBucket.get(id) ?? null)) {
        underBar += 1
        if (stateRank(v.bestState) >= stateRank('independent')) overclaimed.push(id)
      }
    }
    report.push(`  skills under the family bar: ${underBar}; overclaimed to independent: ${overclaimed.length}`)
    expect(overclaimed, 'repaired/hinted-only skills promoted to independent').toEqual([])
    // The invariant must actually bite: MEASURED 4 skills sat under the
    // family bar at year's end, so the empty list above is a verdict about
    // real cases rather than about an empty set.
    expect(underBar).toBeGreaterThan(0)

    untaggedEvents = events
  })

  it('tag-emitting learner: the mal-rule profile names a recurring cause', () => {
    /*
     * Tags misses on a fixed cycle — 60% slip, 20% misread, 10% concept, 10%
     * untagged — deterministic on the attempt counter so it draws nothing
     * from the shared PRNG. struggling() keeps the miss supply steady all
     * year, the way a real struggling learner would meet the tag picker.
     */
    const cycle: (ErrorTag | null)[] = ['slip', 'slip', 'slip', 'slip', 'slip', 'slip', 'misread', 'misread', 'concept', null]
    const spec = learner('tags their misses', 9003, struggling, {
      errorTag: (ctx) => cycle[ctx.attempts % cycle.length],
    })
    const run = simulate(spec, 365)
    const events = run.eventsForExport
    const origin = events[0]!.t

    let checkpoints = 0
    let withRule = 0
    let maxTagged = 0
    const ruleNames = new Set<string>()
    for (let week = 4; week <= 52; week++) {
      const t = origin + week * 7 * DAY
      const profile = malRuleProfile(
        events.filter((e) => e.t <= t),
        t,
      )
      checkpoints += 1
      maxTagged = Math.max(maxTagged, profile.tagged)
      if (profile.rules.length > 0) {
        withRule += 1
        for (const r of profile.rules) ruleNames.add(r.tag)
      }
    }
    report.push(
      `\ntag-emitting learner, 365 days, ${run.attempts} attempts` +
        `\n  weekly checkpoints with ≥1 named rule: ${withRule} of ${checkpoints}` +
        `\n  max tagged misses in any 28-day window: ${maxTagged} (floor is 8)` +
        `\n  rules ever named: ${[...ruleNames].join(', ') || 'none'}`,
    )
    /*
     * MEASURED 2026-08-19: every one of the 49 weekly checkpoints from week
     * 4 onward named at least one rule, the busiest 28-day window held 111
     * tagged misses (floor: 8), and both 'slip' (60% of tags) and 'misread'
     * (20%, right at MIN_SHARE) were named. Pins: half the checkpoints and
     * ~a third of the window volume — a profile that goes quiet for most of
     * the year under a steadily-tagging learner has lost the signal, while
     * volume proportional to the (growing) content bank keeps headroom.
     * 'slip' at a 3x share margin must always be nameable.
     */
    expect(withRule, 'mal-rule profile mostly silent under a tagging learner').toBeGreaterThanOrEqual(25)
    expect(maxTagged).toBeGreaterThanOrEqual(40)
    expect(ruleNames.has('slip'), 'the dominant cause was never named').toBe(true)

    // Canary: a learner who tags nothing must never grow a profile — the
    // repairing learner's whole year is on hand and carries zero tags.
    const clean = malRuleProfile(untaggedEvents!, untaggedEvents![untaggedEvents!.length - 1]!.t)
    expect(clean.rules).toEqual([])
    expect(clean.tagged).toBe(0)
  })

  it('established learner: core blocks that claim to interleave are genuinely mixed', () => {
    const run = simulate(learner('established (strong two years)', 9004, strong), 730)
    const seqs = run.coreBlockSkillSequences
    const mixed = seqs.filter((s) => new Set(s).size >= 2)
    const runs = mixed.map(maxRun)
    const hist = new Map<number, number>()
    for (const r of runs) hist.set(r, (hist.get(r) ?? 0) + 1)
    const histStr = [...hist.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([len, n]) => `${len}:${n}`)
      .join('  ')
    report.push(
      `\nestablished learner, 730 days: ${seqs.length} core blocks, ${mixed.length} with 2+ distinct skills` +
        `\n  max same-skill run per mixed block — ${histStr}` +
        `\n  median ${mixed.length ? median(runs) : 'n/a'}, worst ${runs.length ? Math.max(...runs) : 'n/a'}`,
    )
    /*
     * MEASURED 2026-08-19 over 730 days: 729 core blocks, 431 of them
     * carrying 2+ distinct skills, with max same-skill runs distributed
     *   1: 244   2: 122   3: 50   4: 15   (median 1, worst 4)
     * — i.e. interleaveOrder genuinely alternates, and runs above 2 are the
     * arithmetic of a lopsided pick (4 items of one skill + 1 of another
     * cannot avoid a tail). Pins: median ≤ 2 (measured 1) and at least 85%
     * of mixed blocks at run ≤ 3 (measured 96.5%). Blocked practice wearing
     * the interleaved label — the failure this order fix removed — measures
     * as median ≥ 3 with long tails, far beyond both pins. The volume floor
     * (150, measured 431) keeps the gate from passing vacuously on a
     * learner whose blocks never interleave at all.
     */
    expect(mixed.length, 'too few interleaved core blocks to judge').toBeGreaterThanOrEqual(150)
    expect(median(runs)).toBeLessThanOrEqual(2)
    const tame = runs.filter((r) => r <= 3).length / runs.length
    expect(tame).toBeGreaterThanOrEqual(0.85)
  })

  it('lopsided learner over five years: the dial serves hard where strong, gentle where weak, and nothing starves', () => {
    /*
     * Same shape as lopsided.sim.ts (strong academic areas, ceiling 0.97;
     * weak lab areas, ceiling 0.55), played for five years instead of 120
     * days. NOT added to fiveYear.sim.ts's SPECS — its pinned gates must not
     * shift under it.
     */
    const STRONG = new Set(['math', 'physics', 'coding', 'science'])
    const lopsided = (c: AttemptContext): number => {
      const s = STRONG.has(c.bucket)
      const base = s ? 0.84 : 0.3
      const growth = s ? 0.03 : 0.012
      const ceiling = s ? 0.97 : 0.55
      return Math.max(0.05, Math.min(ceiling, base + growth * c.priorAttempts - 0.07 * (c.difficulty - 3)))
    }
    const run = simulate(learner('lopsided (five years)', 4242, lopsided, { hintRate: () => 0.12 }), 365 * 5)

    const diff = new Map<string, { n: number; sum: number }>()
    for (const e of run.eventsForExport) {
      const row = diff.get(e.bucket) ?? { n: 0, sum: 0 }
      row.n += 1
      row.sum += e.difficulty
      diff.set(e.bucket, row)
    }
    const meanOf = (strongSide: boolean) => {
      const rows = [...diff.entries()].filter(([id]) => STRONG.has(id) === strongSide)
      const n = rows.reduce((a, [, v]) => a + v.n, 0)
      return rows.reduce((a, [, v]) => a + v.sum, 0) / n
    }
    const separation = meanOf(true) - meanOf(false)
    const shares = Object.entries(run.share)
      .sort((a, b) => a[1] - b[1])
      .map(([b, s]) => `${b} ${s.toFixed(1)}%`)
    report.push(
      `\nlopsided learner, five years, ${run.attempts} attempts, plannerFailures ${run.plannerFailures}` +
        `\n  served difficulty: strong ${meanOf(true).toFixed(2)}★ vs weak ${meanOf(false).toFixed(2)}★ → separation ${separation.toFixed(2)}★` +
        `\n  bucket shares, thinnest first: ${shares.slice(0, 4).join(', ')}`,
    )

    /*
     * MEASURED 2026-08-19: strong areas served at 3.43★ against 2.65★ for
     * the weak ones — a 0.78★ separation, held over five years and 14,540
     * attempts, with zero planner failures and the thinnest bucket at 3.1%.
     * Pinned at the 0.25★ the per-area dial was built to clear: a third of
     * the measured value, and a level a single global difficulty signal
     * (which serves both sides the SAME difficulty) cannot reach. The
     * thinnest buckets are the STRONG ones, which is the planner moving
     * minutes to where work remains once courses complete — recorded here
     * so nobody reads 3.1% coding as starvation later.
     */
    expect(run.plannerFailures).toBe(0)
    for (const [b, s] of Object.entries(run.share)) {
      expect(s, `${b} starved over five years`).toBeGreaterThanOrEqual(2)
    }
    expect(separation, 'difficulty dial no longer separates strong from weak areas').toBeGreaterThanOrEqual(0.25)
  })

  it('writes the report', () => {
    writeFileSync('sim-realism.txt', `${report.join('\n')}\n`)
    expect(report.length).toBeGreaterThan(0)
  })
})
