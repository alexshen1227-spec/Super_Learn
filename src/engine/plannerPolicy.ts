import type { AttemptEvent, ItemTemplate } from '../domain/types'
import { isPflTemplate } from './pflId'

const DAY = 86_400_000
const RECENT_WINDOW = 3 * DAY

export type DailyRoute = 'daily-practice' | 'application-day' | 'readiness-probe'

/** Every template has one explicit, learner-appropriate route into Today. */
export function dailyRoute(template: ItemTemplate): DailyRoute {
  if (isPflTemplate(template.id)) return 'readiness-probe'
  if (template.authentic) return 'application-day'
  return 'daily-practice'
}

export interface TemplateCoverage {
  lifetime: number
  recent: number
  daysSince: number
}

/** Manipulable diagrams are identified by id prefix, as PFL probes are. */
export const EXPLORE_PREFIX = 'explore-'

export function isExploreTemplate(templateId: string): boolean {
  return templateId.startsWith(EXPLORE_PREFIX)
}

/**
 * How many times one manipulable diagram is worth serving. HEURISTIC — no
 * study fixes this number.
 *
 * The reasoning: an exploration is EXPOSURE. "Notice what stayed fixed while
 * everything else moved" happens once; dragging the same slider again mostly
 * re-reads a caption. The graded checkpoints attached to it are ordinary
 * retrieval and do benefit from spacing, which is why the cap is three rather
 * than one — an initial meeting plus two spaced revisits — and not higher.
 *
 * Measured, which is the only reason this exists: a simulated learner-year at
 * 30% accuracy served ONE diagram 45 times and never reached the other
 * fourteen. Heavy repetition is normal for this planner and defensible for
 * retrieval (`exp-evaluate` runs 123 times in the same year); it is not
 * defensible for exposure. The same argument is why PFL probes are excluded
 * from ordinary pools outright.
 */
export const EXPLORE_SERVE_LIMIT = 3

/**
 * True once a diagram has delivered everything a diagram can deliver.
 *
 * A SOFT cap: the count comes from events already written, so a plan built
 * before this session's events land can push a family a little past the limit.
 * Measured over a simulated year that lands between three and six servings,
 * and never twice in one session — which is the number that would actually
 * read as a bug.
 */
export function exploreExhausted(templateId: string, use: TemplateCoverage | undefined): boolean {
  return isExploreTemplate(templateId) && (use?.lifetime ?? 0) >= EXPLORE_SERVE_LIMIT
}

/** Lifetime coverage prevents a deterministic tie-break from starving a family forever. */
export function buildTemplateCoverage(events: readonly AttemptEvent[], now: number): Map<string, TemplateCoverage> {
  const coverage = new Map<string, TemplateCoverage>()
  for (const event of events) {
    const current = coverage.get(event.templateId) ?? { lifetime: 0, recent: 0, daysSince: Number.POSITIVE_INFINITY }
    current.lifetime++
    if (event.t >= now - RECENT_WINDOW) current.recent++
    current.daysSince = Math.min(current.daysSince, Math.max(0, (now - event.t) / DAY))
    coverage.set(event.templateId, current)
  }
  return coverage
}

/**
 * Coverage debt is a bounded nudge, not randomisation. Unseen families lead
 * comparable work; recently repeated families step back; old work slowly
 * becomes eligible again. Difficulty and readiness still decide what is
 * appropriate in the first place.
 *
 * `variants` is accepted but deliberately UNUSED — see the note below.
 */
export function coverageAdjustment(coverage: TemplateCoverage | undefined, variants = 1): number {
  void variants
  if (!coverage) return 3.25
  const staleReturn = Math.min(2.5, coverage.daysSince / 14)
  const lifetimeBreadth = Math.log2(1 + coverage.lifetime) * 0.3
  return staleReturn - coverage.recent * 1.5 - lifetimeBreadth
}

/*
 * MEASURED AND REJECTED (2026-08-10): penalising repeats-per-FORM.
 *
 * A simulated learner-year showed single-form content repeating hard — the
 * same chess position 34 times at 30% accuracy, and 82 of this bank's 622
 * templates have exactly one form because a verified tactic cannot be
 * randomised. Four shapes of penalty were built and measured:
 *
 *   variant                  owned @30%   owned @60%   worst repeat
 *   unchanged                     43           65        34 / 19 / 15
 *   replace breadth term          40           65        23 / 13 / 13
 *   extra term, all templates     42           62        24 / 15.5 / 12
 *   extra term, finite only       39           62        23 / 16 / 13.3
 *
 * Every version cut repetition and every version cost OWNED SKILLS. The
 * mechanism is legible: promotion needs repeated unaided successes on a skill,
 * so pushing the planner off a well-fitting template scatters attempts thinner
 * and leaves fewer skills crossing their threshold.
 *
 * So the repetition is load-bearing, and the trade is the wrong way round:
 * skills genuinely owned is the north star, while "I have seen that puzzle a
 * lot" is a comfort complaint. Left unchanged on purpose. If this is revisited,
 * the thing to fix is the SUPPLY of single-form puzzles, not the scorer.
 */

/**
 * How hard the mismatch penalty bites, per star of difference.
 *
 * NORMALLY the asymmetry favours slightly-hard work: repeatedly easy practice
 * is pleasant and does not move the frontier, so being under the target costs
 * more than being over it.
 *
 * When the learner is OVER THEIR HEAD that reasoning inverts, and it has to,
 * because the normal setting made the difficulty dial unable to do its job.
 * Measured over a simulated year with a learner whose accuracy responds to
 * difficulty: at 14-19% first-try accuracy, `stretchSignal` asked for its
 * maximum easing every month for twelve months, the core block computed a
 * target of 2.06★ — and the selector served 2.8★, because a 2-star overshoot
 * cost only 2.8 while an unseen family was worth +3.25 in coverage debt.
 * Novelty out-bid appropriateness on exactly the learner it hurt most.
 *
 * HEURISTIC, like the rest of the difficulty constants. What is not a judgment
 * call is the direction: a dial that cannot lower the work is not a dial.
 */
const MISMATCH_NORMAL = { tooEasy: 2.6, tooHard: 1.4 }
const MISMATCH_EASING = { tooEasy: 1.2, tooHard: 2.8 }

export function dailyTemplateScore(
  template: ItemTemplate,
  wantDifficulty: number,
  coverage: TemplateCoverage | undefined,
  preferCalibration = false,
  /** True while the global stretch signal is asking for easier work. */
  easing = false,
): number {
  const weights = easing ? MISMATCH_EASING : MISMATCH_NORMAL
  const penalty = template.difficulty < wantDifficulty ? weights.tooEasy : weights.tooHard
  return (
    -penalty * Math.abs(template.difficulty - wantDifficulty) +
    coverageAdjustment(coverage, template.variants) +
    Math.min(1, template.variants / 4) * 0.5 +
    (preferCalibration && template.calibration ? 1.2 : 0)
  )
}
