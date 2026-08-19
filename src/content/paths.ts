/**
 * The four Paths — original archetypes for the thinking labs. Each names a
 * mastery arc over real skills; progress is DERIVED from skill evidence, so a
 * rank can go stale honestly when skills fall into needs-review.
 *
 * Design law: these are crafts with ethical cores, not characters to imitate.
 * The Observer sees; the Investigator weighs; the Strategist builds wins that
 * survive daylight; the Guardian understands people in order to protect them.
 */
import type { BucketId, SkillEvidence } from '../domain/types'
import { stateRank } from '../engine/mastery'

export interface PathDef {
  id: 'observer' | 'investigator' | 'strategist' | 'guardian'
  name: string
  bucket: BucketId
  tagline: string
  essence: string
  /** The path's code of practice — trained, tested, and enforced by content. */
  code: string[]
  /** Rank names, lowest → highest. */
  ranks: string[]
  skillIds: string[]
  /** Accent hue for the emblem (kept inside the app palette). */
  hue: 'accent' | 'good' | 'warn' | 'ink'
}

export const PATHS: PathDef[] = [
  {
    id: 'observer',
    name: 'The Observer',
    bucket: 'observer',
    tagline: 'See what is actually there.',
    essence:
      'Most errors of thought begin as errors of seeing: inferences smuggled in as facts, details lost because they were never encoded, confidence untethered from accuracy. The Observer trains the split between what happened and what you concluded — and knows exactly which one they are reporting.',
    code: [
      'Separate the observed from the inferred, always.',
      'Encode deliberately: order, numbers, exact words.',
      'Hold three explanations before believing one.',
      'Calibrate: your certainty is itself a claim to check.',
      'Never practice on people without their consent.',
    ],
    ranks: ['Looker', 'Noticer', 'Witness', 'Analyst', 'Observer'],
    skillIds: ['o-obsinf', 'o-recall', 'o-listen', 'o-bias', 'o-memory'],
    hue: 'accent',
  },
  {
    id: 'investigator',
    name: 'The Investigator',
    bucket: 'investigator',
    tagline: 'Believe in proportion to the evidence.',
    essence:
      'The Investigator treats beliefs as cases under construction: hypotheses held loosely, tests chosen for their power to separate, base rates respected, and "insufficient evidence" spoken without shame. The craft is not being right — it is updating fast when wrong.',
    code: [
      'List the rival explanations before defending one.',
      'Choose the test that could prove you wrong.',
      'Respect the base rate; count the worlds.',
      'State your probability, then score it against reality.',
      'When the evidence is thin, say so — that is a finding.',
    ],
    ranks: ['Curious', 'Examiner', 'Reasoner', 'Case-Builder', 'Investigator'],
    skillIds: ['i-logic', 'i-bayes', 'i-hypo', 'i-forecast', 'i-game'],
    hue: 'good',
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    bucket: 'strategist',
    tagline: 'Win in ways that survive daylight.',
    essence:
      'The Strategist plans backward from the goal, prices every option in its best alternative, assumes the plan will meet reality and armors it in advance. And one law above the rest: a strategy that requires darkness — deception, exclusion, coercion — is a weak strategy wearing a costume.',
    code: [
      'Start at the goal; walk backward to today.',
      'Price choices in their best alternative, not in effort.',
      'Pre-mortem everything that matters.',
      'Match decision speed to reversibility.',
      'Win clean, or the win costs more than it pays.',
    ],
    ranks: ['Planner', 'Tactician', 'Foreseer', 'Architect', 'Strategist'],
    skillIds: ['st-decomp', 'st-ev', 'st-premortem', 'st-estimate', 'st-ethics'],
    hue: 'warn',
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    bucket: 'insight',
    tagline: 'Understand people — to protect them.',
    essence:
      'Insight into people is power, and the Guardian points it one direction: defense. Reading a room to de-escalate it. Naming a manipulation to disarm it. Holding a boundary without cruelty. Knowing precisely when a situation is no longer a game — and bringing in help without hesitation.',
    code: [
      'Read feelings as hypotheses; ask before concluding.',
      'Name the tactic and its power collapses.',
      'A boundary is your limit plus your action — no essay.',
      'De-escalate downward: lower, slower, specific.',
      'Safety outranks secrecy. Always.',
    ],
    ranks: ['Aware', 'Steady', 'Boundary-Keeper', 'Advocate', 'Guardian'],
    skillIds: ['h-emotion', 'h-influence', 'h-boundary'],
    hue: 'ink',
  },
]

export interface PathProgress {
  rankIndex: number
  rankName: string
  /** 0..1 progress across the whole arc. */
  progress: number
  nextStep: string
}

/**
 * Progress = mean evidence rank across the path's skills (unseen 0 …
 * transferred 5), mapped onto the rank ladder. Needs-review skills drag the
 * mean down naturally because their current state reflects the flag.
 */
export function pathProgress(path: PathDef, evidence: Map<string, SkillEvidence>): PathProgress {
  const ranks = path.skillIds.map((id) => {
    const ev = evidence.get(id)
    return ev ? stateRank(ev.state) : 0
  })
  const mean = ranks.reduce((a, b) => a + b, 0) / (ranks.length * 5)
  const thresholds = [0, 0.18, 0.42, 0.68, 0.9]
  let rankIndex = 0
  for (let i = 0; i < thresholds.length; i++) if (mean >= thresholds[i]) rankIndex = i
  // find the weakest skill as the next step
  let weakest = path.skillIds[0]
  let weakestRank = Infinity
  for (const id of path.skillIds) {
    const r = evidence.get(id) ? stateRank(evidence.get(id)!.state) : 0
    if (r < weakestRank) {
      weakestRank = r
      weakest = id
    }
  }
  return {
    rankIndex,
    rankName: path.ranks[rankIndex],
    progress: mean,
    nextStep: weakest,
  }
}

/**
 * The skills living in a Path's bucket BEYOND its named arc.
 *
 * The arc (`skillIds`) is the Path's spine and carries its rank — five
 * stations, deliberately stable. Every depth pass since the arcs were named
 * added skills to the same buckets (game theory, uncertainty, reading
 * situations, other minds…), until 37 of the 55 skills in the four Path
 * buckets appeared in no arc and nowhere the Paths present themselves. The
 * rank stays on the spine on purpose: recomputing it over a growing roster
 * would move a real learner's rank every time content ships, which reads as
 * demotion by update. The depth is surfaced BESIDE the rank instead.
 *
 * Takes the skill list as an argument so this stays derivable in tests
 * without importing the whole bank here.
 */
export function pathBeyondArc(
  path: PathDef,
  allSkills: readonly { id: string; bucket: string }[],
  evidence: Map<string, SkillEvidence>,
): { owned: number; total: number } {
  const arc = new Set(path.skillIds)
  let total = 0
  let owned = 0
  for (const s of allSkills) {
    if (s.bucket !== path.bucket || arc.has(s.id)) continue
    total++
    const ev = evidence.get(s.id)
    if (ev && stateRank(ev.state) >= stateRank('independent')) owned++
  }
  return { owned, total }
}
