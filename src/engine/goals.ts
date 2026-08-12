/**
 * Onboarding goals, wired to something real.
 *
 * They were collected and then read by nothing at all: picking "Improve at
 * chess" or "Raise my grades" changed not one thing about what the app served
 * you. That is worse than not asking, because it implies a promise.
 *
 * What they now do is nudge the long-run BALANCE — a bounded tilt, not a
 * filter. The brief is explicit that urgent work must never permanently erase
 * other areas, and there is a real learning reason too: a learner is a poor
 * judge of what they most need, so a goal should shift emphasis rather than
 * decide the curriculum. Nothing chosen is dropped; the unchosen areas keep
 * their floor and keep being taught, just less often.
 *
 * The floors in `rebalanceAllocationPercentage` still apply after this, so no
 * bucket can be pushed under its ≥5% share however many goals point elsewhere.
 */
import type { BucketId } from '../domain/types'

/** Total percentage points a full set of goals may move. Deliberately modest. */
const GOAL_BUDGET = 12

/**
 * Which areas each preset leans on. Several goals touch several buckets,
 * because that is honest — "think more clearly about people and claims" is
 * not one subject.
 */
const GOAL_WEIGHTS: Record<string, Partial<Record<BucketId, number>>> = {
  'Raise my grades': { math: 3, science: 1, physics: 1 },
  'Move up in my math course': { math: 4, meta: 1 },
  'Be ready for high-school math': { math: 4, physics: 1 },
  'Get better at problem solving': { math: 2, investigator: 1, puzzle: 1, strategist: 1 },
  'Sharpen focus and memory': { observer: 2, meta: 2 },
  'Improve at chess': { puzzle: 4 },
  'Think more clearly about people and claims': { insight: 2, observer: 1, science: 1, investigator: 1 },
  'Walk the four Paths': { observer: 1, investigator: 1, strategist: 1, insight: 1 },
  'Learn how to learn': { meta: 3, science: 1 },
  'Stronger science & physics': { science: 2, physics: 2 },
  'Everyday reasoning & judgement': { investigator: 2, observer: 1, meta: 1, science: 1, strategist: 1 },
}

/**
 * Goals that also point at SPECIFIC SKILLS, not only at areas.
 *
 * A bucket tilt is too blunt for "everyday reasoning". The Investigator Lab
 * holds both natural-frequency Bayes and equilibrium game theory; only one of
 * those has evidence of carrying into a new situation, and a bucket-level
 * nudge cannot tell them apart. So this goal names the skills.
 *
 * THE SELECTION RULE IS EVIDENCE, NOT PLAUSIBILITY. Every skill below is here
 * because a controlled study measured the thing moving to a case the learner
 * had not trained on (docs/RESEARCH.md §40):
 *
 *   - comparing two surface-different cases to extract the shared structure
 *     (Gentner, Loewenstein & Thompson 2003 — .59 vs .22 transfer against an
 *     active control that held the content identical);
 *   - natural frequencies instead of percentages (McDowell & Jacobs 2017,
 *     meta-analysis, 24% vs 4%; Sedlmeier & Gigerenzer 2001 for the durability);
 *   - reference classes and the outside view (Mellers et al. 2014, Chang et al.
 *     2016 — the one training component that correlated with real forecasting
 *     accuracy inside a randomised four-year tournament);
 *   - the law of large numbers taught as an abstract rule with worked examples
 *     across unrelated settings (Fong, Krantz & Nisbett 1986 — improvement as
 *     large in untaught domains as in taught ones);
 *   - fallacy and evidence evaluation, which is also the only part of this
 *     that any adopted US standard actually names (CCSS ELA RI.9-10.8).
 *
 * DELIBERATELY ABSENT: confirmation bias. The 2025 meta-analysis of 54 RCTs
 * singles it out as the bias education essentially fails to shift, and a goal
 * that promised to fix it would be promising something the app cannot do.
 * Also absent: anything resting on puzzle, memory or "brain training"
 * practice, where effects collapse to nothing against active controls.
 *
 * The bonus this produces is small and always carries its reason on screen —
 * the same law as the course tilt. It cannot exclude anything.
 */
const GOAL_SKILLS: Record<string, string[]> = {
  'Everyday reasoning & judgement': [
    'x-compare',
    'x-transfer',
    'i-natfreq',
    'i-refclass',
    'i-samplesize',
    'i-conditional',
    'i-fallacy',
    'i-bayes',
    'o-selection',
    'o-expect',
    'o-claimtype',
    'o-frame',
    'st-tradeoff',
    'st-secondorder',
    'st-sunk',
    'h-attribution',
    'h-projection',
    's-corr',
    's-design',
    's-sources',
  ],
  // The existing goals keep bucket-level tilts only. Naming skills for them
  // would be inventing precision the evidence does not support.
}

/**
 * Skills the chosen goals point at directly. Empty for every goal that has no
 * evidence-backed skill list, which is most of them.
 */
export function goalSkillIds(goals: string[]): Set<string> {
  const out = new Set<string>()
  for (const g of goals) for (const id of GOAL_SKILLS[g] ?? []) out.add(id)
  return out
}

/** Plain-language note for the goals that name skills. Null when none do. */
export function goalSkillNote(goals: string[]): string | null {
  const named = goals.filter((g) => GOAL_SKILLS[g]?.length)
  if (!named.length) return null
  return 'This goal also favours specific topics, not just areas — the handful where a study has actually measured the skill carrying over to a situation the learner had not practised. It is a nudge, and nothing else is dropped.'
}

/**
 * The canonical list shown wherever goals are picked (onboarding, Settings).
 * Derived from the weights so a preset can never exist without a real effect —
 * the original sin of goals was being collected and read by nothing.
 */
export const GOAL_PRESETS: string[] = Object.keys(GOAL_WEIGHTS)

export interface GoalTilt {
  /** Percentage points to add per bucket (before floors and renormalisation). */
  deltas: Partial<Record<BucketId, number>>
  /** Plain-language note, or null when no goals were chosen. */
  note: string | null
}

/**
 * Turn chosen goals into a bounded allocation tilt.
 *
 * Returns zero deltas for an empty or unrecognised selection — an unknown
 * string from an imported profile must not be able to move anything.
 */
export function goalTilt(goals: string[]): GoalTilt {
  const known = goals.filter((g) => GOAL_WEIGHTS[g])
  if (!known.length) return { deltas: {}, note: null }

  const raw: Partial<Record<BucketId, number>> = {}
  let total = 0
  for (const g of known) {
    for (const [bucket, w] of Object.entries(GOAL_WEIGHTS[g]) as [BucketId, number][]) {
      raw[bucket] = (raw[bucket] ?? 0) + w
      total += w
    }
  }
  // Scale to the fixed budget so picking six goals does not tilt six times as
  // hard as picking one — more goals means the same emphasis spread wider,
  // which is what choosing everything should mean.
  const deltas: Partial<Record<BucketId, number>> = {}
  for (const [bucket, w] of Object.entries(raw) as [BucketId, number][]) {
    deltas[bucket] = (w / total) * GOAL_BUDGET
  }
  return {
    deltas,
    /*
     * Kept short on purpose: this shows in a list of adjustments, and a
     * paragraph there reads as an error message rather than an explanation.
     *
     * The multi-goal wording is not decoration. The budget is SHARED, so
     * picking everything lands you near the default — measured: all ten goals
     * net about two points of movement. Saying "your goals tilt ~12 points"
     * there would be a promise the mechanism does not keep, and a learner who
     * picked six goals deserves to know why nothing much moved.
     */
    note:
      known.length === 1
        ? `Your goal tilts the balance about ${GOAL_BUDGET} points. Nothing else is dropped — every area keeps its floor.`
        : `Your ${known.length} goals share about ${GOAL_BUDGET} points of tilt — more goals spread it wider rather than pushing harder. Nothing is dropped; every area keeps its floor.`,
  }
}
