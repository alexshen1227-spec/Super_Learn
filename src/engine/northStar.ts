/**
 * The only number this app exists to produce.
 *
 * Retained skills per focused minute, where RETAINED means re-demonstrated
 * with no hints, at least a fortnight later, on a different question family
 * from the one it was learned on. Not items completed, not minutes logged,
 * not sessions, not streaks.
 *
 * DELIBERATELY STRICTER THAN THE LADDER, and computed separately rather than
 * replacing it. `mastery.ts` awards its `retained` rung after 48 hours, which
 * is a reasonable scheduling signal and much too generous to be called proof
 * that something survived. Rather than redefine a rung that the planner, the
 * coach and the review scheduler all depend on, this derives a second, harder
 * number alongside it. Two measures that disagree is the honest situation: one
 * decides what to practise next, the other decides what may be claimed.
 *
 * Everything here is derived by replay, adds no event fields, and applies the
 * same exclusions as the ladder — hinted work, placement, burned items whose
 * answers were read elsewhere, and disputed attempts under quarantine.
 *
 * EVERY NUMBER CAN REFUSE TO EXIST. A rate computed from two skills is noise
 * wearing a decimal point, so thin evidence returns null and the dashboard
 * says so rather than printing a confident figure.
 */
import type { AttemptEvent, DisputeEvent } from '../domain/types'
import { BURNED_TEMPLATE_IDS } from '../content/burned'
import { evidenceEvents } from './dispute'

const DAY = 86_400_000

/**
 * How long something must survive before it counts. HEURISTIC in its exact
 * value — no study fixes a fortnight — but the direction is well supported:
 * performance during or just after instruction badly overpredicts what remains
 * later, which is the entire reason this app is built around delayed testing
 * rather than session scores (RESEARCH.md §1).
 */
export const DURABLE_GAP_DAYS = 14
export const QUARTER_DAYS = 90
/** Below this, a per-skill cost is an average of too little to mean anything. */
const MIN_SKILLS_FOR_RATE = 5

export interface DurableSkill {
  skillId: string
  /** First unaided, unhinted success on this skill. */
  learnedAt: number
  /** The later success that proved it survived. */
  provedAt: number
  gapDays: number
  /** Focused seconds spent on this skill, across every graded attempt. */
  seconds: number
}

export interface NorthStar {
  /** Skills that have survived the gap, newest proof first. */
  durable: DurableSkill[]
  /** Unaided-capable at all (a first unhinted success), whether or not proved. */
  everUnaided: number
  /** Durable skills whose FIRST unaided success falls inside the window. */
  gainedThisQuarter: number
  /**
   * Skills shown unaided before the window AND again inside it. The direct
   * answer to "what has survived from three months ago".
   */
  survivedFromLastQuarter: number
  /** Shown unaided before the window and NOT since. Not proof of loss — see below. */
  untestedSinceLastQuarter: number
  /** Focused minutes per durable skill, or null when too few to average. */
  minutesPerDurableSkill: number | null
  /** Total focused minutes across every graded attempt in the log. */
  totalMinutes: number
  /** Transfer is its own claim and is counted separately, never folded in. */
  transferred: number
  /** Whether there is enough history for the quarter comparison to mean anything. */
  hasQuarterOfHistory: boolean
}

function usable(e: AttemptEvent): boolean {
  return e.mode !== 'placement' && !BURNED_TEMPLATE_IDS.has(e.templateId)
}

/** Unaided means first submission, zero hints. Repaired never counts here. */
function unaidedSuccess(e: AttemptEvent): boolean {
  return usable(e) && e.hintLevel === 0 && e.firstCorrect === true
}

/**
 * Compute the north star from the event log.
 *
 * `now` is passed rather than read, so the same history always produces the
 * same answer — a dashboard that drifts as the clock moves cannot be tested.
 */
export function northStar(events: readonly AttemptEvent[], disputes: readonly DisputeEvent[], now: number): NorthStar {
  const log = [...evidenceEvents(events, disputes)].sort((a, b) => a.t - b.t)
  const windowStart = now - QUARTER_DAYS * DAY

  const seconds = new Map<string, number>()
  const firstUnaided = new Map<string, { t: number; templateId: string }>()
  const unaidedTimes = new Map<string, number[]>()
  const durable = new Map<string, DurableSkill>()
  let transferred = 0
  let totalSeconds = 0
  let earliest = Number.POSITIVE_INFINITY

  for (const e of log) {
    if (!usable(e)) continue
    totalSeconds += e.elapsedSec ?? 0
    earliest = Math.min(earliest, e.t)
    for (const skillId of e.skillIds) {
      seconds.set(skillId, (seconds.get(skillId) ?? 0) + (e.elapsedSec ?? 0))
      if (!unaidedSuccess(e)) continue
      const times = unaidedTimes.get(skillId) ?? []
      times.push(e.t)
      unaidedTimes.set(skillId, times)
      const first = firstUnaided.get(skillId)
      if (!first) {
        firstUnaided.set(skillId, { t: e.t, templateId: e.templateId })
        continue
      }
      // The proof: far enough later, and on a DIFFERENT question family, so
      // that recognising one specific question cannot be what is measured.
      if (durable.has(skillId)) continue
      if (e.templateId === first.templateId) continue
      const gapDays = (e.t - first.t) / DAY
      if (gapDays < DURABLE_GAP_DAYS) continue
      durable.set(skillId, { skillId, learnedAt: first.t, provedAt: e.t, gapDays, seconds: 0 })
    }
    if (e.mode === 'transfer' && unaidedSuccess(e)) transferred++
  }

  for (const d of durable.values()) d.seconds = seconds.get(d.skillId) ?? 0
  const list = [...durable.values()].sort((a, b) => b.provedAt - a.provedAt)

  let survived = 0
  let untested = 0
  for (const [skillId, times] of unaidedTimes) {
    const before = times.some((t) => t < windowStart)
    if (!before) continue
    if (times.some((t) => t >= windowStart)) survived++
    else untested++
    void skillId
  }

  const durableSeconds = list.reduce((a, d) => a + d.seconds, 0)
  return {
    durable: list,
    everUnaided: firstUnaided.size,
    gainedThisQuarter: list.filter((d) => d.learnedAt >= windowStart).length,
    survivedFromLastQuarter: survived,
    untestedSinceLastQuarter: untested,
    minutesPerDurableSkill: list.length >= MIN_SKILLS_FOR_RATE ? durableSeconds / 60 / list.length : null,
    totalMinutes: totalSeconds / 60,
    transferred,
    hasQuarterOfHistory: Number.isFinite(earliest) && now - earliest >= QUARTER_DAYS * DAY,
  }
}

/**
 * Durable skills proved per week, oldest first.
 *
 * A trend, not a score. If nothing survived a given week the entry is zero and
 * the chart shows a flat line, which is the honest picture and the one a
 * streak counter is designed to hide.
 */
export function durableByWeek(star: NorthStar, now: number, weeks = 12): { weekStart: number; proved: number }[] {
  const out: { weekStart: number; proved: number }[] = []
  const week = 7 * DAY
  const end = now - (now % week)
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = end - i * week
    out.push({ weekStart, proved: star.durable.filter((d) => d.provedAt >= weekStart && d.provedAt < weekStart + week).length })
  }
  return out
}
