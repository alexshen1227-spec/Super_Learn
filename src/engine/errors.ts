/** Open-error detection shared by Practice and the Error Clinic planner. */
import type { AppState, ErrorTag, SkillEvidence } from '../domain/types'
import { evidenceEvents } from './dispute'

const DAY = 86_400_000

export interface RepairTarget {
  skillId: string
  lastMissAt: number
  templateId: string
  confidence: number | null
  tags: ErrorTag[]
  blockedByMisconception: boolean
}

export function openRepairTargets(
  state: AppState,
  evidence: Map<string, SkillEvidence>,
  now: number,
  windowDays = 28,
): RepairTarget[] {
  const cutoff = now - windowDays * DAY
  const latest = new Map<string, RepairTarget>()
  // Disputed attempts are quarantined from everything evidential (the app-wide
  // rule in types.ts). This walked the RAW log, so the Error Clinic could
  // build a repair block around the very attempt the learner has contested.
  for (const event of evidenceEvents(state.events, state.disputes)) {
    if (event.t < cutoff || event.firstCorrect !== false) continue
    for (const skillId of event.skillIds) {
      const ev = evidence.get(skillId)
      if (!ev || !(ev.needsReview || ev.recentMisses > 0 || ev.blockedByMisconception)) continue
      const prior = latest.get(skillId)
      if (!prior || event.t > prior.lastMissAt) {
        latest.set(skillId, {
          skillId,
          lastMissAt: event.t,
          templateId: event.templateId,
          confidence: event.confidence,
          tags: event.errorTags,
          blockedByMisconception: ev.blockedByMisconception,
        })
      }
    }
  }
  return [...latest.values()].sort((a, b) => {
    const priority = (x: RepairTarget) =>
      (x.blockedByMisconception ? 1000 : 0) +
      ((x.confidence ?? 0) >= 80 ? 200 : 0) +
      (x.tags.includes('concept') || x.tags.includes('strategy') || x.tags.includes('representation') ? 50 : 0) +
      x.lastMissAt / 1e12
    return priority(b) - priority(a)
  })
}
