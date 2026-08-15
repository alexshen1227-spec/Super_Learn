/**
 * Does a taught rule fire when nothing points at it?
 *
 * This is the gap the app was not measuring. Every other checkpoint tells the
 * learner which skill it belongs to simply by existing inside that skill's
 * practice — so a correct answer shows the method can be EXECUTED once
 * selected, and says nothing about whether it would be selected.
 *
 * RESEARCH.md §41c: Barnett & Ceci's "memory demands" dimension is exactly
 * this, and §21 mapped it onto answer format, which is really the modality
 * dimension. Gick & Holyoak size what is being missed — roughly 30% solve after
 * reading a structurally identical story, 75-80% once told to use it — so about
 * two thirds of people who already hold the answer fail to retrieve it
 * unprompted. Detterman, quoted in Barnett & Ceci: "Telling subjects to use a
 * principle is not transfer. It is following instructions."
 *
 * WHAT THIS IS NOT. It is not a rung, it is not mastery, and it does not feed
 * the planner. A probe the planner optimised for would stop measuring anything,
 * which is the same reasoning that keeps placement out of the evidence ladder.
 * It is a separate, honest readout with its own refusal to speak.
 *
 * HEURISTIC. The thresholds below are product judgment. What is not judgment is
 * the direction: an app that only ever asks prompted questions cannot tell the
 * difference between a learner who has the rule and one who can follow an
 * instruction, and those are not the same person.
 */
import type { AttemptEvent, SkillEvidence } from '../domain/types'
import type { ContentIndex } from './content-index'
import { stateRank } from './mastery'

/** Below this many probe attempts the readout refuses to exist. */
export const MIN_PROBES = 5

export interface SpontaneityReport {
  /** Unaided, first-try attempts at spontaneity probes. */
  attempts: number
  /** How many of those were right first time with no hint. */
  hits: number
  /** hits/attempts, or null under MIN_PROBES. */
  rate: number | null
  /**
   * The same learner's unaided first-try rate on ORDINARY items for the skills
   * those probes covered — the fair comparison, and the whole point. Null when
   * there is not enough of either to compare.
   */
  promptedRate: number | null
  /** How many ordinary attempts that comparison rests on. */
  promptedAttempts: number
  /** Skills that have been proved to Independent and have never met a probe. */
  untested: string[]
  /** Plain-language readout, or null while there is nothing honest to say. */
  summary: string | null
}

function unaidedGraded(e: AttemptEvent): boolean {
  return e.mode !== 'placement' && e.hintLevel === 0 && e.firstCorrect !== null
}

export function spontaneityReport(
  events: readonly AttemptEvent[],
  index: ContentIndex,
  evidence: Map<string, SkillEvidence>,
): SpontaneityReport {
  const isProbe = (templateId: string) => index.templates.get(templateId)?.spontaneous === true

  const probes = events.filter((e) => unaidedGraded(e) && isProbe(e.templateId))
  const hits = probes.filter((e) => e.firstCorrect === true).length
  const rate = probes.length >= MIN_PROBES ? hits / probes.length : null

  // The comparison group: ordinary attempts on the very skills the probes
  // covered. Comparing against the whole diet would be comparing difficulty as
  // much as spontaneity.
  const probedSkills = new Set<string>()
  for (const e of probes) for (const s of e.skillIds) probedSkills.add(s)
  const prompted = events.filter(
    (e) => unaidedGraded(e) && !isProbe(e.templateId) && e.skillIds.some((s) => probedSkills.has(s)),
  )
  const promptedRate = prompted.length >= MIN_PROBES ? prompted.filter((e) => e.firstCorrect === true).length / prompted.length : null

  // Which owned skills have never been probed at all. Worth surfacing: an
  // unprobed skill is one the app cannot say this about either way.
  const probeSkills = new Set<string>()
  for (const t of index.templates.values()) {
    if (t.spontaneous) for (const s of t.skillIds) probeSkills.add(s)
  }
  const untested: string[] = []
  for (const [skillId, ev] of evidence) {
    if (stateRank(ev.state) < stateRank('independent')) continue
    if (!probeSkills.has(skillId)) continue
    if (!probedSkills.has(skillId)) untested.push(skillId)
  }

  let summary: string | null = null
  if (rate === null) {
    summary = null
  } else if (promptedRate === null) {
    summary = `${hits} of ${probes.length} unprompted questions right first try. There is not yet enough ordinary practice on the same topics to say whether that is high or low for you.`
  } else {
    const gap = Math.round((promptedRate - rate) * 100)
    const pct = Math.round(rate * 100)
    const promptedPct = Math.round(promptedRate * 100)
    summary =
      gap >= 15
        ? `${pct}% right when nothing tells you which idea to use, against ${promptedPct}% on the same topics when the question sits inside its own practice. That gap is the ordinary one — most people who know a method still do not reach for it unprompted — and closing it is what the practice is for.`
        : gap <= -5
          ? `${pct}% right when nothing tells you which idea to use, which is at or above your ${promptedPct}% on the same topics inside their own practice. Unusual, and worth trusting only once there are more than ${probes.length} of these.`
          : `${pct}% right when nothing tells you which idea to use, against ${promptedPct}% on the same topics when the question announces itself. Close to level, which is the thing worth having.`
  }

  return {
    attempts: probes.length,
    hits,
    rate,
    promptedRate,
    promptedAttempts: prompted.length,
    untested,
    summary,
  }
}
