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

export function dailyTemplateScore(
  template: ItemTemplate,
  wantDifficulty: number,
  coverage: TemplateCoverage | undefined,
  preferCalibration = false,
): number {
  return (
    -(template.difficulty < wantDifficulty ? 2.6 : 1.4) * Math.abs(template.difficulty - wantDifficulty) +
    coverageAdjustment(coverage) +
    Math.min(1, template.variants / 4) * 0.5 +
    (preferCalibration && template.calibration ? 1.2 : 0)
  )
}
