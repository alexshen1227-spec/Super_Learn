/**
 * The backup gate: a year of real use must survive its own export/import.
 *
 * Everything this app knows about a learner derives from the event log, so
 * the export file IS the learner's history — and the import path deliberately
 * treats that file as hostile (store/sanitize.ts rebuilds every field and
 * DROPS what it cannot validate). Dropping a crafted field is safety;
 * dropping or bending a legitimate one is a learner quietly losing part of a
 * year. No aggregate check ever proved the difference: unit tests feed
 * sanitize hand-made events, not the stream a year of real planning writes.
 *
 * So this simulates a year, pushes the log through the REAL
 * `exportState` → `importState` pair, and asserts `deriveEvidence` over the
 * imported events equals `deriveEvidence` over the originals — same skills,
 * same rungs, same review dues to the minute, same per-family schedules.
 * Twice: once for the plain climbing learner, once for a learner using the
 * realism fields (repairs, confidence ratings, error tags), because a real
 * user's backup carries all three and `deriveEvidence` alone would not
 * notice a stripped error tag (only malRules reads those — the field-level
 * check below is what covers them).
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { simulate, type AttemptContext, type LearnerSpec } from './harness'
import { exportState, importState } from '../engine/exportImport'
import { deriveEvidence } from '../engine/mastery'
import { initialState, type AppState, type AttemptEvent, type ErrorTag, type SkillEvidence } from '../domain/types'

const climbing = (c: AttemptContext) => Math.min(0.93, 0.5 + 0.1 * c.priorAttempts - 0.05 * (c.difficulty - 3))
const CONFIDENCE_STEPS = [20, 40, 60, 80, 95]
const snap = (v: number) =>
  CONFIDENCE_STEPS.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), CONFIDENCE_STEPS[0])

const report: string[] = []

/** The fields evidence and the coach readouts are built from, key order normalized. */
function projectEvent(e: AttemptEvent): unknown {
  return {
    t: e.t,
    templateId: e.templateId,
    bucket: e.bucket,
    mode: e.mode,
    skillIds: e.skillIds,
    firstCorrect: e.firstCorrect,
    correct: e.correct,
    hintLevel: e.hintLevel,
    confidence: e.confidence,
    errorTags: e.errorTags,
    difficulty: e.difficulty,
    validator: e.validator,
  }
}

/** EVERY field, for the stricter nothing-bent-at-all count. */
function projectFull(e: AttemptEvent): unknown {
  return {
    ...(projectEvent(e) as Record<string, unknown>),
    id: e.id,
    sessionId: e.sessionId,
    seed: e.seed,
    itemVersion: e.itemVersion,
    elapsedSec: e.elapsedSec,
    score: e.score,
    firstResponse: e.firstResponse,
    finalResponse: e.finalResponse,
    aboutSkillIds: e.aboutSkillIds ?? null,
    interrupted: e.interrupted ?? false,
  }
}

/**
 * SkillEvidence, canonicalized for comparison. Review dues are compared TO
 * THE MINUTE — the resolution `deriveEvidence`'s own cache buckets at, and
 * the resolution the schedule is honest to — everything else exactly.
 */
function canon(v: SkillEvidence): unknown {
  return {
    state: v.state,
    bestState: v.bestState,
    needsReview: v.needsReview,
    exposure: v.exposure,
    guidedSuccesses: v.guidedSuccesses,
    independentForms: [...v.independentForms].sort(),
    retainedAt: v.retainedAt,
    transferredAt: v.transferredAt,
    transferCrossed: v.transferCrossed,
    lastCorrectAt: v.lastCorrectAt,
    lastAttemptAt: v.lastAttemptAt,
    lastOutcomeCorrect: v.lastOutcomeCorrect,
    recentMisses: v.recentMisses,
    blockedByMisconception: v.blockedByMisconception,
    hintDependence: v.hintDependence,
    ability: v.ability,
    abilitySamples: v.abilitySamples,
    attempts: v.attempts,
    review: v.review ? { dueMinute: Math.round(v.review.due / 60_000), intervalIndex: v.review.intervalIndex } : null,
    forms: [...v.forms]
      .sort((a, b) => a.templateId.localeCompare(b.templateId))
      .map((f) => ({
        templateId: f.templateId,
        dueMinute: f.due === null ? null : Math.round(f.due / 60_000),
        intervalIndex: f.intervalIndex,
        successes: f.successes,
        lapses: f.lapses,
        lastOutcomeCorrect: f.lastOutcomeCorrect,
      })),
  }
}

function roundtrip(spec: LearnerSpec): void {
  const run = simulate(spec, 365)
  const events = run.eventsForExport
  const now = events[events.length - 1]!.t + 60_000

  // The real path, both directions: the export the Settings screen writes,
  // the import the sanitizer rebuilds.
  const state: AppState = {
    ...initialState(),
    onboarded: true,
    profile: { ...initialState().profile, mathTrack: spec.mathTrack, gradeLevel: spec.grade, goals: spec.goals },
    events,
  }
  const res = importState(exportState(state))
  expect(res.ok, 'import rejected its own export').toBe(true)
  if (!res.ok) return
  expect(res.counts.events, 'events lost or invented in the round trip').toBe(events.length)

  // Field-level survival, event by event (import re-sorts by t; the stream
  // is strictly time-ordered, so index i speaks to index i).
  const imported = res.state.events
  let coreMismatch = 0
  let fullMismatch = 0
  for (let i = 0; i < events.length; i++) {
    if (JSON.stringify(projectEvent(events[i])) !== JSON.stringify(projectEvent(imported[i]))) coreMismatch += 1
    if (JSON.stringify(projectFull(events[i])) !== JSON.stringify(projectFull(imported[i]))) fullMismatch += 1
  }

  // The gate itself: derived evidence identical on both sides of the backup.
  const before = deriveEvidence(events, now)
  const after = deriveEvidence(imported, now)
  const mismatched: string[] = []
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(id)
    const b = after.get(id)
    if (!a || !b || JSON.stringify(canon(a)) !== JSON.stringify(canon(b))) mismatched.push(id)
  }

  const rated = events.filter((e) => e.confidence !== null).length
  const tagged = events.filter((e) => e.errorTags.length > 0).length
  const repaired = events.filter((e) => e.correct === true && e.firstCorrect === false).length
  report.push(
    `\n${spec.name}: ${events.length} events (${rated} rated, ${tagged} tagged, ${repaired} repaired)` +
      `\n  evidence-field event mismatches: ${coreMismatch}; any-field mismatches: ${fullMismatch}` +
      `\n  skills before ${before.size}, after ${after.size}, divergent ${mismatched.length}` +
      (mismatched.length ? `\n  divergent: ${mismatched.slice(0, 12).join(', ')}` : ''),
  )

  /*
   * MEASURED 2026-08-19 before pinning: zero mismatches of any kind, for
   * both learners — every field of every event survives byte-for-byte, so
   * the pins are exact zeros rather than tolerances. If `fullMismatch`
   * alone ever fires, sanitize has started bending a legitimate field that
   * evidence does not read (elapsedSec, say) — a milder defect than losing
   * evidence, but still a backup quietly editing history: report it, do not
   * widen the pin.
   */
  expect(coreMismatch, 'evidence-bearing event fields altered by the round trip').toBe(0)
  expect(fullMismatch, 'some event field altered by the round trip').toBe(0)
  expect(before.size, 'skills appeared or vanished across the round trip').toBe(after.size)
  expect(mismatched, 'derived evidence changed across the round trip').toEqual([])
}

describe('export → import round trip (one simulated year each)', () => {
  it('preserves a plain climbing learner exactly', () => {
    roundtrip({
      name: '30m daily climbing',
      seed: 5,
      p: climbing,
      hintRate: () => 0.15,
      daySessions: () => [30],
      goals: [],
      mathTrack: 'ca-8',
      grade: 8,
    })
  })

  it('preserves repairs, confidence ratings and error tags exactly', () => {
    const cycle: (ErrorTag | null)[] = ['slip', 'misread', 'concept', null]
    roundtrip({
      name: '30m daily, repairing + rating + tagging',
      seed: 9010,
      p: climbing,
      hintRate: () => 0.15,
      daySessions: () => [30],
      goals: [],
      mathTrack: 'ca-8',
      grade: 8,
      repair: () => 0.5,
      confidence: (ctx) => snap(100 * climbing(ctx) + 10),
      errorTag: (ctx) => cycle[ctx.attempts % cycle.length],
    })
  })

  it('writes the report', () => {
    writeFileSync('sim-roundtrip.txt', `${report.join('\n')}\n`)
    expect(report.length).toBeGreaterThan(0)
  })
})
