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
 */
export function coverageAdjustment(coverage: TemplateCoverage | undefined): number {
  if (!coverage) return 3.25
  const staleReturn = Math.min(2.5, coverage.daysSince / 14)
  const lifetimeBreadth = Math.log2(1 + coverage.lifetime) * 0.3
  return staleReturn - coverage.recent * 1.5 - lifetimeBreadth
}

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
    coverageAdjustment(coverage) +
    Math.min(1, template.variants / 4) * 0.5 +
    (preferCalibration && template.calibration ? 1.2 : 0)
  )
}
