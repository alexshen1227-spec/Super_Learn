/** Honest 28-day training-dose and learning-outcome summary. */
import type { AppState, AttemptEvent, SkillState } from '../domain/types'
import { deriveEvidence, stateRank } from './mastery'
import { isPflTemplate } from './pfl'

const DAY = 86_400_000

export interface OutcomeReport {
  daysPracticed: number
  focusedMinutes: number
  averageMinutesPerDay: number
  dosePercent: number
  newIndependent: number
  newRetained: number
  newTransferred: number
  gradedAttempts: number
  enoughEvidence: boolean
  verdict: string
}

export interface QualityRate {
  n: number
  rate: number | null
}

export interface LearningQualityReport {
  review: QualityRate
  transfer: QualityRate
  matched: { early: QualityRate; recent: QualityRate; templateCount: number } | null
}

const reached = (state: SkillState | undefined, rung: SkillState) =>
  state !== undefined && stateRank(state) >= stateRank(rung)

export function outcomeReport(state: AppState, now: number, days = 28, dailyTarget = 30): OutcomeReport {
  const cutoff = now - days * DAY
  const sessions = state.sessions.filter((s) => s.endedAt >= cutoff && !s.interrupted)
  const focusedMinutes = sessions.reduce((sum, s) => sum + s.activeMinutes, 0)
  const dayKeys = new Set(
    sessions.map((s) => {
      const d = new Date(s.endedAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }),
  )
  const events = state.events.filter((e) => e.t >= cutoff && e.mode !== 'placement')
  // A PFL probe carries a `score` but no graded verdict, so the `score !== null`
  // clause would otherwise let probes help unlock this report. They must not:
  // this count is the gate deciding whether the app may judge learning at all,
  // and a probe is a measurement of readiness, not evidence of ownership.
  const gradedAttempts = events.filter(
    (e) => !isPflTemplate(e.templateId) && (e.firstCorrect !== null || e.score !== null),
  ).length
  const before = deriveEvidence(state.events.filter((e) => e.t < cutoff), cutoff)
  const current = deriveEvidence(state.events, now)
  const ids = new Set([...before.keys(), ...current.keys()])
  let newIndependent = 0
  let newRetained = 0
  let newTransferred = 0
  for (const id of ids) {
    const was = before.get(id)?.state
    const is = current.get(id)?.state
    if (!reached(was, 'independent') && reached(is, 'independent')) newIndependent++
    if (!reached(was, 'retained') && reached(is, 'retained')) newRetained++
    if (!reached(was, 'transferred') && reached(is, 'transferred')) newTransferred++
  }
  const enoughEvidence = dayKeys.size >= 4 && gradedAttempts >= 12
  const durable = newRetained + newTransferred
  const verdict = !enoughEvidence
    ? 'Too early to judge. Complete at least 4 days and 12 graded attempts so the signal is not built from noise.'
    : durable > 0
      ? `${durable} durable gain${durable === 1 ? '' : 's'} reached retained or transferred evidence in this window.`
      : newIndependent > 0
        ? `${newIndependent} skill${newIndependent === 1 ? '' : 's'} reached independent evidence; delayed retrieval is still needed to prove retention.`
        : 'No skill crossed an evidence threshold yet. The app should change the plan, not call time-on-task progress.'

  return {
    daysPracticed: dayKeys.size,
    focusedMinutes: Math.round(focusedMinutes),
    averageMinutesPerDay: dayKeys.size ? Math.round(focusedMinutes / dayKeys.size) : 0,
    dosePercent: Math.round((focusedMinutes / Math.max(1, days * dailyTarget)) * 100),
    newIndependent,
    newRetained,
    newTransferred,
    gradedAttempts,
    enoughEvidence,
    verdict,
  }
}

function unaidedRate(events: AttemptEvent[], minimum = 3): QualityRate {
  const graded = events.filter((event) => event.firstCorrect !== null)
  if (graded.length < minimum) return { n: graded.length, rate: null }
  const wins = graded.filter((event) => event.firstCorrect === true && event.hintLevel === 0).length
  return { n: graded.length, rate: wins / graded.length }
}

/** Apples-to-apples quality signals. The matched trend compares only template
 * families attempted in both halves of the window, reducing curriculum-mix
 * distortion; every rate refuses to appear below its sample floor. */
export function learningQualityReport(events: AttemptEvent[], now: number): LearningQualityReport {
  const cutoff = now - 28 * DAY
  const midpoint = now - 14 * DAY
  const recent = events.filter((event) => event.t >= cutoff && event.mode !== 'placement')
  const earlyHalf = recent.filter((event) => event.t < midpoint && event.firstCorrect !== null)
  const lateHalf = recent.filter((event) => event.t >= midpoint && event.firstCorrect !== null)
  const earlyTemplates = new Set(earlyHalf.map((event) => event.templateId))
  const lateTemplates = new Set(lateHalf.map((event) => event.templateId))
  const matchedTemplates = new Set([...earlyTemplates].filter((id) => lateTemplates.has(id)))
  const matchedEarly = earlyHalf.filter((event) => matchedTemplates.has(event.templateId))
  const matchedRecent = lateHalf.filter((event) => matchedTemplates.has(event.templateId))
  const matched = matchedTemplates.size >= 2 && matchedEarly.length >= 5 && matchedRecent.length >= 5
    ? {
        early: unaidedRate(matchedEarly, 5),
        recent: unaidedRate(matchedRecent, 5),
        templateCount: matchedTemplates.size,
      }
    : null
  return {
    review: unaidedRate(recent.filter((event) => event.mode === 'review')),
    transfer: unaidedRate(recent.filter((event) => event.mode === 'transfer')),
    matched,
  }
}
