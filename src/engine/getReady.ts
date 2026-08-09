/**
 * "Get ready for X": the prerequisite-only path into a course you are not in yet.
 *
 * Inspired by the on-ramp packaging Khan Academy uses for its "Get ready for…"
 * courses (RESEARCH.md §25) — a short course that is nothing but the
 * prerequisites of a named goal course. Here it is DERIVED rather than
 * authored: the skill tree already knows what depends on what, so the honest
 * answer to "what stands between me and Algebra 2?" is a graph query, not a
 * curriculum decision.
 *
 * Two rules keep it truthful:
 *
 *  - It counts only what the learner does NOT already own. A ready learner
 *    gets "you are ready", not a busywork list.
 *  - "Own" means independent-or-better, the same bar the course readout uses.
 *    Guided exposure is not readiness, and a mini-course built on guided
 *    evidence would send someone into a course they cannot hold.
 */
import type { SkillEvidence, SkillNode } from '../domain/types'
import { evidenceFor, stateRank } from './mastery'
import { TRACK_BY_ID, trackSkillIds, type MathTrack } from '../content/tracks'

export interface ReadyReport {
  track: MathTrack
  /** Unmet prerequisites, in dependency order (foundations first). */
  missing: SkillNode[]
  /** Course skills already owned — context, so the list is not read as "all of it". */
  ownedInCourse: number
  courseSize: number
  /** True when nothing stands in the way. */
  ready: boolean
  /** Plain-language summary; never a promise about time. */
  summary: string
}

/**
 * Walk the prerequisite closure of a track's skills and keep the ones not yet
 * owned. Skills IN the course are excluded — this answers "what do I need
 * BEFORE the course", not "what is the course".
 */
export function getReadyReport(
  trackId: string,
  skills: Map<string, SkillNode>,
  evidence: Map<string, SkillEvidence>,
): ReadyReport | null {
  const track = TRACK_BY_ID.get(trackId)
  if (!track) return null
  const courseIds = new Set(trackSkillIds(track))
  const owns = (id: string) => stateRank(evidenceFor(evidence, id).state) >= stateRank('independent')

  // Breadth-first over prerequisites, collecting the unmet ones outside the course.
  const seen = new Set<string>()
  const missing: SkillNode[] = []
  const queue = [...courseIds]
  while (queue.length) {
    const id = queue.shift()!
    const node = skills.get(id)
    if (!node) continue
    for (const p of node.prereqs) {
      if (seen.has(p)) continue
      seen.add(p)
      queue.push(p)
      const pre = skills.get(p)
      if (!pre || courseIds.has(p) || owns(p)) continue
      missing.push(pre)
    }
  }

  // Foundations first: a skill whose own prereqs are all met is reachable now.
  const depth = (node: SkillNode, guard = 0): number =>
    guard > 20 || !node.prereqs.length
      ? 0
      : 1 + Math.max(...node.prereqs.map((p) => (skills.get(p) ? depth(skills.get(p)!, guard + 1) : 0)))
  missing.sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name))

  const ownedInCourse = [...courseIds].filter(owns).length
  const ready = missing.length === 0
  return {
    track,
    missing,
    ownedInCourse,
    courseSize: courseIds.size,
    ready,
    summary: ready
      ? `Nothing stands between you and ${track.name} — every prerequisite outside the course is already independent or better.`
      : `${missing.length} skill${missing.length === 1 ? '' : 's'} outside ${track.name} ${missing.length === 1 ? 'is' : 'are'} not yet independent, starting with ${missing[0].name}.`,
  }
}
