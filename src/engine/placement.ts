/**
 * Adaptive placement: ~12–18 minutes, starting near 8th-grade math and
 * moving quickly in both directions, plus short breadth probes.
 *
 * Placement ROUTES the curriculum; it never proves mastery. Its outputs are
 * per-skill signals (gap / ok / strong / skipped) plus an honest summary of
 * what was and was not measured.
 */
import type {
  PlacementResult,
  PlacementSkillSignal,
  Profile,
} from '../domain/types'
import type { ContentIndex } from './content-index'

/** Math ladder ordered easy → hard. Placement walks it adaptively. */
export const MATH_LADDER: string[] = [
  'm-fractions',
  'm-ratio',
  'm-proportion',
  'm-lineq1',
  'm-lineqmulti',
  'm-linear',
  'm-systems',
  'm-quadratic',
]

/** Breadth probes: one item each, after the math ladder settles. */
export const BREADTH_PROBES: string[] = [
  'm-percent',
  'm-triangles',
  'm-prob',
  'p-motion',
  'c-vars',
  's-corr',
  'i-logic',
  'st-decomp',
  'o-obsinf',
]

export const PLACEMENT_MAX_ITEMS = 15

export interface ProbeResult {
  skillId: string
  correct: boolean | null
  skipped: boolean
  confidence: number | null
  aboveStart: boolean
}

export interface PlacementProgress {
  phase: 'math' | 'breadth' | 'done'
  ladderIndex: number
  lowestGap: number | null
  highestOk: number | null
  breadthIndex: number
  results: ProbeResult[]
  startedAt: number
}

export function startPlacement(profile: Profile, now: number): PlacementProgress {
  // Start near the reported grade: grade 8 → m-lineqmulti (index 4).
  const grade = profile.gradeLevel ?? 8
  const ladderIndex = grade <= 6 ? 0 : grade === 7 ? 2 : grade === 8 ? 4 : grade === 9 ? 5 : 6
  return {
    phase: 'math',
    ladderIndex,
    lowestGap: null,
    highestOk: null,
    breadthIndex: 0,
    results: [],
    startedAt: now,
  }
}

/** Next skill to probe, or null when placement is complete. */
export function nextProbe(p: PlacementProgress, index: ContentIndex): string | null {
  if (p.results.length >= PLACEMENT_MAX_ITEMS) return null
  if (p.phase === 'math') {
    const id = MATH_LADDER[p.ladderIndex]
    if (id && index.bySkill.get(id)?.length) return id
    return null
  }
  if (p.phase === 'breadth') {
    while (p.breadthIndex < BREADTH_PROBES.length) {
      const id = BREADTH_PROBES[p.breadthIndex]
      const already = p.results.some((r) => r.skillId === id)
      if (!already && index.bySkill.get(id)?.length) return id
      p = { ...p, breadthIndex: p.breadthIndex + 1 }
    }
    return null
  }
  return null
}

/** Apply one probe outcome and advance the state machine. Pure. */
export function applyProbe(
  p: PlacementProgress,
  skillId: string,
  outcome: { correct: boolean | null; skipped: boolean; confidence: number | null },
): PlacementProgress {
  const startIdx = MATH_LADDER.indexOf(skillId)
  const result: ProbeResult = {
    skillId,
    correct: outcome.correct,
    skipped: outcome.skipped,
    confidence: outcome.confidence,
    aboveStart: false,
  }
  const next: PlacementProgress = { ...p, results: [...p.results, result] }

  if (p.phase === 'math' && startIdx >= 0) {
    if (outcome.correct === true) {
      next.highestOk = Math.max(next.highestOk ?? -1, startIdx)
      // climb until the top; a correct answer above the start marks 'strong'
      result.aboveStart = startIdx > p.ladderIndex
      if (startIdx >= MATH_LADDER.length - 1) {
        next.phase = 'breadth'
      } else if (next.lowestGap !== null && startIdx + 1 >= next.lowestGap) {
        // We already found a gap right above — the frontier is bracketed.
        next.phase = 'breadth'
      } else {
        next.ladderIndex = startIdx + 1
      }
    } else if (outcome.correct === false || outcome.skipped) {
      next.lowestGap = next.lowestGap === null ? startIdx : Math.min(next.lowestGap, startIdx)
      if (startIdx === 0 || (next.highestOk !== null && startIdx - 1 <= next.highestOk)) {
        // Bracketed (or bottomed out): stop drilling downward.
        next.phase = 'breadth'
      } else {
        next.ladderIndex = startIdx - 1
      }
    }
    if (next.results.length >= PLACEMENT_MAX_ITEMS) next.phase = 'done'
    return next
  }

  // breadth phase: advance the pointer past this probe
  const bIdx = BREADTH_PROBES.indexOf(skillId)
  if (bIdx >= 0) next.breadthIndex = Math.max(next.breadthIndex, bIdx + 1)
  if (next.breadthIndex >= BREADTH_PROBES.length || next.results.length >= PLACEMENT_MAX_ITEMS) {
    next.phase = 'done'
  }
  return next
}

export function summarizePlacement(
  p: PlacementProgress,
  index: ContentIndex,
  now: number,
): PlacementResult {
  const signals: PlacementSkillSignal[] = []
  const strengths: string[] = []
  const gaps: string[] = []
  for (const r of p.results) {
    const name = index.skills.get(r.skillId)?.name ?? r.skillId
    if (r.skipped || r.correct === null) {
      signals.push({ skillId: r.skillId, signal: 'skipped', fromManual: false })
    } else if (r.correct) {
      signals.push({ skillId: r.skillId, signal: r.aboveStart ? 'strong' : 'ok', fromManual: false })
      if (r.aboveStart) strengths.push(name)
    } else {
      signals.push({ skillId: r.skillId, signal: 'gap', fromManual: false })
      gaps.push(name)
    }
  }
  // Skills below the highest-ok rung are assumed 'ok' FOR ROUTING ONLY —
  // the summary is explicit that these were inferred, not measured.
  const inferred: string[] = []
  if (p.highestOk !== null) {
    for (let i = 0; i < p.highestOk; i++) {
      const id = MATH_LADDER[i]
      if (!signals.some((s) => s.skillId === id)) {
        signals.push({ skillId: id, signal: 'ok', fromManual: false })
        inferred.push(index.skills.get(id)?.name ?? id)
      }
    }
  }
  const measured = p.results.filter((r) => !r.skipped && r.correct !== null)
  const summary: string[] = []
  summary.push(
    `Measured ${measured.length} skills directly across ${new Set(measured.map((r) => index.skills.get(r.skillId)?.bucket)).size} areas.`,
  )
  if (gaps.length) summary.push(`Prerequisite gaps to close first: ${gaps.join(', ')}.`)
  else summary.push('No prerequisite gaps surfaced in the probed range.')
  if (strengths.length) summary.push(`Above-level strengths: ${strengths.join(', ')}.`)
  if (inferred.length)
    summary.push(`Assumed solid for routing (not measured): ${inferred.join(', ')}. These get verified the first time they appear in practice.`)
  summary.push(
    'Everything not probed remains unmeasured — the map will fill in from real practice evidence, and one placement item never proves lasting mastery.',
  )
  return {
    completedAt: now,
    minutes: Math.max(1, Math.round((now - p.startedAt) / 60000)),
    signals,
    measuredSkillIds: measured.map((r) => r.skillId),
    unmeasuredNote:
      'Skills outside the probe set are unmeasured. The coach treats them as unknown, not as weaknesses.',
    summary,
  }
}
