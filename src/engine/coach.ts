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
import { dueForms, dueReviews } from './scheduler'
import { prereqLeverage, prereqsMet, scoreSkills } from './planner'
import { calendarDaysUntil } from './time'
import { stretchSignal } from './stretch'

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
  /** Written artifacts: logged as practice, never graded, never evidence. */
  written: number
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
    written: recent.filter((e) => e.firstCorrect === null).length,
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

  /*
   * Say what the difficulty dial is doing and why.
   *
   * The planner now raises or lowers difficulty from recent unaided accuracy,
   * and a coach that silently changes the work is worse than one that does
   * not change it — the learner cannot check a decision they were never told
   * about. Stated as a belief with its evidence, like everything else here.
   */
  const stretch = stretchSignal(state.events, now)
  if (stretch.accuracy !== null && stretch.why) {
    const cruising = stretch.adjust > 0
    const easing = stretch.adjust < 0
    beliefs.push({
      id: 'difficulty-dial',
      statement: cruising
        ? 'The work has been easier than it should be, so I am raising the difficulty.'
        : easing
          ? 'The work has been beyond reach lately, so I am lowering the difficulty.'
          : 'The difficulty is about right, so I am leaving it alone.',
      confidence: stretch.n >= 20 ? 'high' : 'medium',
      evidence: [
        `${Math.round(stretch.accuracy * 100)}% first-try correct across your last ${stretch.n} unaided attempts.`,
        cruising
          ? 'Consistently high accuracy means the material is under you — comfortable practice is pleasant and teaches little.'
          : easing
            ? 'Accuracy this low means too much is being spent on problems you cannot yet get into.'
            : 'This range is where difficulty is high enough to be worth doing and low enough to be winnable.',
      ],
      unknown:
        'Where exactly your limit is. The thresholds are a rule of thumb, not a measured optimum, and they move the dial rather than jumping to a conclusion.',
      resolve: 'Keep practising normally — the dial re-reads your accuracy every session and moves back if it overshot.',
    })
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
  // Written artifacts are exposure, not evidence. Report the volume so the
  // work is visible, and be explicit that it moved nothing.
  const written = recent.filter((e) => e.validator === 'draft' || e.firstCorrect === null)
  if (written.length >= 3) {
    beliefs.push({
      id: 'written-work',
      statement: `${written.length} written artifacts in 28 days — drafted and compared, never scored.`,
      confidence: 'high',
      evidence: [
        'Pre-mortems, explanations, and perspective writing are logged as practice; nothing here advanced a skill.',
        'Every rung you hold was earned on a deterministically graded problem.',
      ],
      unknown: 'How good the writing actually was — the app deliberately does not judge it, and neither does a self-rating.',
      resolve: 'The graded probe that follows each draft is where that evidence comes from.',
    })
  }

  // A specific question family that keeps failing. This is sharper than
  // "percent problems need review": it names the KIND of percent problem,
  // which is what the learner can actually act on.
  const lapsed = dueForms(evidence, now, 4).filter((f) => f.reason === 'lapsed')
  if (lapsed.length) {
    const named = lapsed
      .map((f) => {
        const skill = index.skills.get(f.skillId)?.name ?? f.skillId
        const family = index.templates.get(f.templateId)?.name
        return family ? `${family} (${skill})` : skill
      })
      .slice(0, 3)
    beliefs.push({
      id: 'weak-forms',
      statement: `${lapsed.length} question type${lapsed.length > 1 ? 's are' : ' is'} failing while the surrounding skill looks fine.`,
      confidence: 'high',
      evidence: named.map((nm) => `Last attempt at ${nm} was wrong.`),
      unknown: 'Whether the difficulty is the idea itself or just this presentation of it.',
      resolve: 'Each clears when you get that exact question type right unaided — a different question from the same skill will not do it.',
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
