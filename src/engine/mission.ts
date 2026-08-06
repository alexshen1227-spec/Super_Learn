/**
 * Skill-scoped learning missions.
 *
 * A mission is stored as an extended Deadline for backward compatibility,
 * but unlike a broad deadline it names the exact skills the learner wants to
 * make independent/retained. All readiness claims come from replayed evidence.
 */
import type { AppState, Deadline, SkillEvidence } from '../domain/types'
import type { ContentIndex } from './content-index'
import { evidenceFor, stateRank } from './mastery'
import { calendarDaysUntil } from './time'

export interface MissionReadiness {
  mission: Deadline
  daysRemaining: number
  targetIds: string[]
  prerequisiteIds: string[]
  independent: number
  retained: number
  transferred: number
  needsReview: number
  sessionsAvailable: number
  plannedMinutes: number
  nextSkillIds: string[]
}

export function upcomingMissions(state: AppState, now: number): Deadline[] {
  return state.deadlines
    .filter((d) => calendarDaysUntil(d.dateISO, now) >= 0)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
}

export function activeMission(state: AppState, now: number): Deadline | null {
  return upcomingMissions(state, now)[0] ?? null
}

export function missionTargetIds(mission: Deadline, index: ContentIndex): string[] {
  return [...new Set(mission.skillIds ?? [])].filter((id) => index.skills.has(id))
}

/** All unmet ancestors of the selected targets, nearest ancestors first. */
export function missionPrerequisiteIds(
  mission: Deadline,
  index: ContentIndex,
  evidence?: Map<string, SkillEvidence>,
): string[] {
  const targets = missionTargetIds(mission, index)
  const seen = new Set<string>(targets)
  const out: string[] = []
  const visit = (id: string) => {
    const skill = index.skills.get(id)
    if (!skill) return
    for (const prereq of skill.prereqs) {
      if (seen.has(prereq)) continue
      seen.add(prereq)
      if (!evidence || stateRank(evidenceFor(evidence, prereq).state) < stateRank('independent')) {
        out.push(prereq)
      }
      visit(prereq)
    }
  }
  for (const id of targets) visit(id)
  return out
}

function availableSessionDays(state: AppState, now: number, dateISO: string): number {
  const remaining = calendarDaysUntil(dateISO, now)
  if (!Number.isFinite(remaining) || remaining < 0) return 0
  const active = new Set(state.profile.activeDays.length ? state.profile.activeDays : [0, 1, 2, 3, 4, 5, 6])
  let count = 0
  const start = new Date(now)
  start.setHours(12, 0, 0, 0)
  for (let offset = 0; offset <= remaining; offset++) {
    const day = new Date(start)
    day.setDate(start.getDate() + offset)
    if (active.has(day.getDay())) count++
  }
  return count
}

export function missionReadiness(
  mission: Deadline,
  state: AppState,
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
  now: number,
): MissionReadiness {
  const targetIds = missionTargetIds(mission, index)
  const prerequisiteIds = missionPrerequisiteIds(mission, index, evidence)
  const targetEvidence = targetIds.map((id) => evidenceFor(evidence, id))
  const daysRemaining = calendarDaysUntil(mission.dateISO, now)
  const sessionsAvailable = availableSessionDays(state, now, mission.dateISO)
  const dailyMinutes = mission.dailyMinutes ?? 30
  const nextSkillIds = [...prerequisiteIds, ...targetIds]
    .filter((id, i, all) => all.indexOf(id) === i)
    .sort((a, b) => {
      const ea = evidenceFor(evidence, a)
      const eb = evidenceFor(evidence, b)
      if (ea.needsReview !== eb.needsReview) return ea.needsReview ? -1 : 1
      return stateRank(ea.state) - stateRank(eb.state)
    })
    .filter((id) => {
      const ev = evidenceFor(evidence, id)
      return stateRank(ev.state) < stateRank('retained') || ev.needsReview
    })
    .slice(0, 3)

  return {
    mission,
    daysRemaining: Math.max(0, daysRemaining),
    targetIds,
    prerequisiteIds,
    independent: targetEvidence.filter((ev) => stateRank(ev.state) >= stateRank('independent')).length,
    retained: targetEvidence.filter((ev) => stateRank(ev.state) >= stateRank('retained') && !ev.needsReview).length,
    transferred: targetEvidence.filter((ev) => stateRank(ev.state) >= stateRank('transferred')).length,
    needsReview: targetEvidence.filter((ev) => ev.needsReview).length,
    sessionsAvailable,
    plannedMinutes: sessionsAvailable * dailyMinutes,
    nextSkillIds,
  }
}

/** Exact-target and prerequisite boost for the planner. Broad bucket deadlines
 * remain supported by planner.ts for old data and unscoped goals. */
export function missionPriority(
  skillId: string,
  state: AppState,
  index: ContentIndex,
  now: number,
): { boost: number; reason: string | null } {
  let best = { boost: 0, reason: null as string | null }
  for (const mission of upcomingMissions(state, now)) {
    const days = Math.max(0, calendarDaysUntil(mission.dateISO, now))
    if (days > 60) continue
    const targets = missionTargetIds(mission, index)
    if (!targets.length) continue
    const urgency = days <= 5 ? 2 : days <= 14 ? 1.25 : 0.5
    if (targets.includes(skillId)) {
      const candidate = {
        boost: 3.5 + urgency,
        reason: `it is a target for “${mission.title}” (${days} days)`,
      }
      if (candidate.boost > best.boost) best = candidate
      continue
    }
    if (missionPrerequisiteIds(mission, index).includes(skillId)) {
      const candidate = {
        boost: 2.5 + urgency,
        reason: `it unlocks a target for “${mission.title}”`,
      }
      if (candidate.boost > best.boost) best = candidate
    }
  }
  return best
}
