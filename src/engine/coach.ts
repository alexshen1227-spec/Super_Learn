/**
 * The offline coach: deterministic beliefs and explanations derived from
 * evidence. It must never pretend certainty — every belief carries its
 * evidence, a confidence grade based on sample size, and what observation
 * would change it. Sparse data yields "not enough evidence", not filler.
 */
import type {
  AppState,
  AttemptEvent,
  CoachBelief,
  SkillEvidence,
} from '../domain/types'
import { ACADEMIC_BUCKETS, BUCKETS } from '../domain/types'
import type { ContentIndex } from './content-index'
import { evidenceFor, stateRank } from './mastery'
import { effectiveAllocation } from './allocationPlus'
import { calibrationGap, highConfidenceErrors } from './calibration'
import { dueReviews } from './scheduler'
import { prereqLeverage, prereqsMet, scoreSkills } from './planner'
import { calendarDaysUntil } from './time'

function recentEvents(events: AttemptEvent[], now: number, days: number): AttemptEvent[] {
  const cutoff = now - days * 86_400_000
  return events.filter((e) => e.t >= cutoff && e.mode !== 'placement')
}

/**
 * Everything the coach is counting, made visible. All evidence flows through
 * the same append-only log — daily sessions, Practice launches, reviews,
 * puzzles, case files — and this summary proves it to the learner.
 */
export interface ActivityIntake {
  days: number
  total: number
  graded: number
  selfAssessed: number
  academic: number
  labs: number
  puzzles: number
  reviews: number
  transfers: number
  skillsTouched: number
}

export function activityIntake(events: AttemptEvent[], now: number, days = 7): ActivityIntake {
  const recent = recentEvents(events, now, days)
  const academicSet = new Set<string>(ACADEMIC_BUCKETS)
  return {
    days,
    total: recent.length,
    graded: recent.filter((e) => e.firstCorrect !== null).length,
    selfAssessed: recent.filter((e) => e.firstCorrect === null && e.score !== null).length,
    academic: recent.filter((e) => academicSet.has(e.bucket)).length,
    labs: recent.filter((e) => !academicSet.has(e.bucket) && e.bucket !== 'puzzle').length,
    puzzles: recent.filter((e) => e.bucket === 'puzzle').length,
    reviews: recent.filter((e) => e.mode === 'review').length,
    transfers: recent.filter((e) => e.mode === 'transfer').length,
    skillsTouched: new Set(recent.flatMap((e) => e.skillIds)).size,
  }
}

/** The single highest-leverage blocked skill, or null. */
export function findBottleneck(
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
): { skillId: string; name: string; dependents: number; why: string } | null {
  let best: { skillId: string; name: string; dependents: number; why: string } | null = null
  for (const s of index.skillList) {
    const ev = evidenceFor(evidence, s.id)
    if (stateRank(ev.state) >= stateRank('independent') && !ev.needsReview) continue
    if (!prereqsMet(s, evidence, state)) continue
    const dependents = prereqLeverage(s.id, index, evidence)
    if (dependents === 0) continue
    if (!best || dependents > best.dependents) {
      best = {
        skillId: s.id,
        name: s.name,
        dependents,
        why: ev.needsReview
          ? `${s.name} needs repair and ${dependents} later skills build on it.`
          : `${s.name} is not yet independent and ${dependents} later skills build on it.`,
      }
    }
  }
  return best
}

/** Model of Me: what the coach believes, with evidence and uncertainty. */
export function coachBeliefs(
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
  now: number,
): CoachBelief[] {
  const beliefs: CoachBelief[] = []
  const recent = recentEvents(state.events, now, 28)
  const graded = recent.filter((e) => e.firstCorrect !== null)

  if (graded.length < 5) {
    beliefs.push({
      id: 'sparse',
      statement: 'I do not know much about you yet.',
      confidence: 'high',
      evidence: [`Only ${graded.length} graded attempts in the last 28 days.`],
      unknown: 'Almost everything — strengths, weaknesses, pace, and calibration are all unmeasured.',
      resolve: 'A few sessions of normal practice will replace this with real evidence.',
    })
    return beliefs
  }

  // Per-bucket accuracy → strengths / weaknesses (refuses below 6 samples).
  for (const b of BUCKETS) {
    const inBucket = graded.filter((e) => e.bucket === b.id)
    if (inBucket.length < 6) continue
    const acc = inBucket.filter((e) => e.firstCorrect).length / inBucket.length
    if (acc >= 0.8) {
      beliefs.push({
        id: `strong-${b.id}`,
        statement: `${b.name} is currently a strength.`,
        confidence: inBucket.length >= 15 ? 'high' : 'medium',
        evidence: [`${Math.round(acc * 100)}% first-attempt accuracy across ${inBucket.length} recent items.`],
        resolve: 'A run of misses at this difficulty would soften this.',
      })
    } else if (acc <= 0.45) {
      beliefs.push({
        id: `weak-${b.id}`,
        statement: `${b.name} is a live struggle right now.`,
        confidence: inBucket.length >= 15 ? 'high' : 'medium',
        evidence: [`${Math.round(acc * 100)}% first-attempt accuracy across ${inBucket.length} recent items.`],
        unknown: 'Whether the cause is a concept gap or item difficulty running ahead of evidence.',
        resolve: 'Error tags on your next misses will separate concept gaps from slips.',
      })
    }
  }

  // Calibration
  const gap = calibrationGap(recent)
  if (gap !== null) {
    if (Math.abs(gap) < 0.08) {
      beliefs.push({
        id: 'calib',
        statement: 'Your confidence is fairly well calibrated.',
        confidence: 'medium',
        evidence: [`Average confidence tracks accuracy within ${Math.round(Math.abs(gap) * 100)} points.`],
        resolve: 'This is re-checked as more rated attempts accumulate.',
      })
    } else {
      beliefs.push({
        id: 'calib',
        statement: gap > 0 ? 'You tend to be overconfident.' : 'You tend to be underconfident.',
        confidence: 'medium',
        evidence: [
          `Stated confidence runs ${Math.round(Math.abs(gap) * 100)} points ${gap > 0 ? 'above' : 'below'} actual accuracy.`,
        ],
        unknown: 'Whether this holds across every subject or concentrates in one.',
        resolve: 'More confidence-rated items, especially outside your comfort areas.',
      })
    }
  }
  const hce = highConfidenceErrors(recent)
  if (hce.length > 0) {
    beliefs.push({
      id: 'hce',
      statement: `${hce.length} recent high-confidence error${hce.length > 1 ? 's' : ''} — the most costly kind.`,
      confidence: 'high',
      evidence: hce.slice(0, 3).map((e) => {
        const sk = e.skillIds[0] ? (index.skills.get(e.skillIds[0])?.name ?? e.skillIds[0]) : e.templateId
        return `Confident miss in ${sk}.`
      }),
      resolve: 'Each clears when you solve a fresh unaided item on that skill.',
    })
  }

  // Hint dependence
  const hinted = recent.filter((e) => e.hintLevel > 0).length
  if (recent.length >= 10) {
    const rate = hinted / recent.length
    if (rate > 0.4) {
      beliefs.push({
        id: 'hints',
        statement: 'Hint use is high — independence is the next milestone.',
        confidence: 'medium',
        evidence: [`${Math.round(rate * 100)}% of recent attempts used at least one hint.`],
        resolve: 'Falling hint use on the same skills over the next week.',
      })
    }
  }

  // Lab & puzzle work is first-class evidence — say so when it's happening.
  const puzzleSolves = recent.filter((e) => e.bucket === 'puzzle' && e.firstCorrect === true).length
  const puzzleTries = recent.filter((e) => e.bucket === 'puzzle' && e.firstCorrect !== null).length
  if (puzzleTries >= 3) {
    beliefs.push({
      id: 'puzzles',
      statement: `Puzzle work is counted here too: ${puzzleSolves}/${puzzleTries} clean solves in 28 days.`,
      confidence: puzzleTries >= 8 ? 'medium' : 'low',
      evidence: [`Chess, spatial, and logic-grid attempts flow into the same evidence log as everything else.`],
      resolve: 'Transfer bridges test whether the strategies travel beyond the board — that evidence is tracked separately.',
    })
  }
  const rubricWork = recent.filter((e) => e.firstCorrect === null && e.score !== null)
  if (rubricWork.length >= 3) {
    beliefs.push({
      id: 'self-assessed',
      statement: `${rubricWork.length} self-assessed lab activities in 28 days — these guide the plan but never grade you.`,
      confidence: 'high',
      evidence: [`Average self-score ${Math.round((rubricWork.reduce((a, e) => a + (e.score ?? 0), 0) / rubricWork.length) * 100)}% across pre-mortems, explanations, and perspective work.`],
      unknown: 'Self-scores measure your standards as much as your work — the deterministic items are the anchor.',
    })
  }

  // Bottleneck
  const bn = findBottleneck(index, evidence, state)
  if (bn) {
    beliefs.push({
      id: 'bottleneck',
      statement: `Current bottleneck: ${bn.name}.`,
      confidence: 'medium',
      evidence: [bn.why],
      resolve: `Two unaided successes on distinct ${bn.name} problems would clear it.`,
    })
  }

  return beliefs
}

/** This week's objective, stated from evidence rather than motivation. */
export function weeklyObjective(
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
  now: number,
): string {
  const due = dueReviews(evidence, now)
  const report = effectiveAllocation(state, evidence, index, now).report
  const ctx = { index, evidence, state, now, checkIn: { minutes: 25, energy: 'ok' as const, focus: null } }
  let top: ReturnType<typeof scoreSkills>[number] | null = null
  for (const bucket of ACADEMIC_BUCKETS) {
    const scored = scoreSkills(bucket, ctx, report)
    if (scored.length && (!top || scored[0].score > top.score)) top = scored[0]
  }
  const parts: string[] = []
  if (top) {
    const ev = evidenceFor(evidence, top.skill.id)
    const goal = stateRank(ev.state) >= stateRank('independent') ? 'Retained' : 'Independent'
    parts.push(`move ${top.skill.name} to ${goal}`)
  }
  if (due.length) parts.push(`clear ${Math.min(due.length, 9)} due review${due.length > 1 ? 's' : ''}`)
  const deadline = state.deadlines
    .map((d) => ({ d, days: calendarDaysUntil(d.dateISO, now) }))
    .filter((x) => x.days >= 0 && x.days <= 10)
    .sort((a, b) => a.days - b.days)[0]
  if (deadline) parts.push(`prepare for ${deadline.d.title} (${deadline.days}d)`)
  if (!parts.length) return 'Build first evidence: a placement or a first session will set the map.'
  return `This week: ${parts.join(' · ')}.`
}

/** One-line insight for the Today screen, grounded in a real number. */
export function todayInsight(
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  state: AppState,
  now: number,
): string {
  const hce = highConfidenceErrors(recentEvents(state.events, now, 14))
  if (hce.length)
    return `You have ${hce.length} confident error${hce.length > 1 ? 's' : ''} waiting for repair — clearing those beats new material today.`
  const due = dueReviews(evidence, now)
  if (due.length >= 3) return `${due.length} reviews are due; retrieval first, then new ground.`
  const bn = findBottleneck(index, evidence, state)
  if (bn) return `${bn.name} is blocking ${bn.dependents} downstream skill${bn.dependents > 1 ? 's' : ''} — today's core targets it.`
  const gap = calibrationGap(recentEvents(state.events, now, 28))
  if (gap !== null && gap > 0.12) return 'Recent confidence has run ahead of accuracy — slow down before you commit an answer.'
  const retained = [...evidence.values()].filter((e) => stateRank(e.state) >= stateRank('retained')).length
  if (retained > 0) return `${retained} skill${retained > 1 ? 's' : ''} now show delayed retention — the kind of learning that lasts.`
  return 'Early days: every attempt right now teaches the coach how you learn.'
}
