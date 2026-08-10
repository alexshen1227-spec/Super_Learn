/**
 * Preparation for Future Learning — how well you learn something NEW.
 *
 * Every rung in this app is what Bransford & Schwartz (1999) call *sequestered
 * problem solving*: you are cut off from resources and asked to apply what you
 * already have. They argue that this systematically underestimates what prior
 * learning bought, because a large part of what practice buys is being READY TO
 * LEARN the next thing — and a cold test cannot see that at all.
 *
 * A PFL probe is the other measurement. It hands the learner a short resource
 * on an idea they have never been taught, then asks machine-graded questions
 * about that idea. The score is not "do you know this" — of course you did not,
 * an hour ago. It is *how much of a brand-new idea did you pick up from a short
 * explanation, unaided*.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THREE RULES THAT MAKE THIS HONEST RATHER THAN A GROWTH NUMBER
 *
 * 1. IT IS NEVER A RUNG — IN EITHER DIRECTION. A probe cannot promote a skill,
 *    schedule a review, or produce independent evidence; equally, a failed
 *    probe is never recorded as a miss, because failing to absorb an idea you
 *    met ninety seconds ago says nothing about what you own.
 *
 *    So probes are written as EXPOSURE: `correct` and `firstCorrect` both null,
 *    the shape mastery already treats as "seen, nothing proven". The outcome
 *    survives only in `score`, which nothing outside this module reads.
 *    `SessionScreen.logEvent` imposes that shape at the single line every
 *    attempt passes through, and `mastery.replayEvidence` re-imposes it during
 *    replay so the guarantee survives a legacy or imported event that claims a
 *    graded verdict. Neither trusts content to be well-behaved.
 *
 *    This matters beyond the ladder: several readouts (the coach's per-bucket
 *    accuracy, the weekly accuracy figure) treat `firstCorrect` as unaided
 *    success WITHOUT re-checking hints. Writing probes as exposure drops them
 *    out of every such reader at once. See RESEARCH.md §23.
 *
 * 2. THE COMPARISON IS WITHIN-LEARNER AND DERIVED. A pick-up rate on its own
 *    means nothing. What Bransford & Schwartz actually predict is that prior
 *    knowledge shows up as *better learning from the resource*, so the readout
 *    splits probes by whether the learner already owned the target's
 *    prerequisites at the time of the probe. That split is computed from the
 *    event log and the skill graph, never asked about.
 *
 * 3. IT REFUSES TO EXIST. Under `MIN_PROBES` it reports nothing, and it will
 *    not report the prerequisite comparison until BOTH sides have samples. A
 *    number here would be worse than silence, because it is exactly the kind of
 *    number that feels like progress without being it.
 *
 * See RESEARCH.md §23. This measures readiness to learn. It is not a transfer
 * claim, not an aptitude claim, and it is never combined with the ladder.
 */
import type { AttemptEvent, SkillEvidence, SkillNode } from '../domain/types'
import { stateRank } from './mastery'
import { PFL_PREFIX, isPflTemplate } from './pflId'

// Re-exported so callers keep importing the concept from `engine/pfl`; the
// definition lives in `pflId.ts` only to break a cycle with mastery.
export { PFL_PREFIX, isPflTemplate }

/** Below this many probes the readout says nothing at all. */
export const MIN_PROBES = 4
/** Below this many per side, the prerequisite comparison stays silent. */
const MIN_PER_SIDE = 3

export interface PflProbe {
  t: number
  skillId: string
  /** Fraction of the probe's graded checkpoints answered correctly first try. */
  score: number
  /**
   * Did the learner already own this target's prerequisites when probed?
   *
   * `null` when the question does not apply — a probe attached to a skill with
   * NO prerequisites cannot be evidence about prerequisite ownership either
   * way. It used to be recorded as `false`, which put `pfl-modular`
   * (`m-integers`, no prerequisites) permanently on the "without" side of the
   * comparison for every learner who ever met it: one probe in nine, silently
   * biasing the split it was supposed to inform. Excluding it is the honest
   * shape — the same refusal the rest of this module makes when it cannot say.
   */
  prereqsOwned: boolean | null
}

export interface PflReport {
  probes: number
  /** Mean pick-up rate across all probes, or null under MIN_PROBES. */
  pickUp: number | null
  /** Pick-up when prerequisites were already owned, or null if too few. */
  withPrereqs: number | null
  /** Pick-up when they were not, or null if too few. */
  withoutPrereqs: number | null
  /** Plain-language readout. Always safe to show; says "not yet" when unsure. */
  summary: string
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/**
 * Rebuild the probe history from the event log.
 *
 * `prereqsOwned` is evaluated against evidence AT THE TIME OF THE PROBE, not
 * today — otherwise every old probe would be re-judged against knowledge the
 * learner has since acquired, which would quietly invent the very correlation
 * this is supposed to test.
 */
export function pflProbes(
  events: AttemptEvent[],
  skills: Map<string, SkillNode>,
  evidenceAt: (upTo: number) => Map<string, SkillEvidence>,
): PflProbe[] {
  const probes: PflProbe[] = []
  /*
   * FIRST ENCOUNTER ONLY, per template.
   *
   * The second time a learner meets an idea they are recalling it, not picking
   * it up, so a repeat is not a probe — it is a memory test wearing a probe's
   * clothes. Different seeds do not help: the numbers change but the IDEA is
   * the same, and the idea is what is being measured.
   *
   * This also removes the only way to inflate the readout. Without it, tapping
   * one probe four times would satisfy MIN_PROBES and produce a pick-up figure
   * built entirely from re-reads.
   */
  const seenTemplates = new Set<string>()
  for (const e of [...events].sort((a, b) => a.t - b.t)) {
    if (!isPflTemplate(e.templateId)) continue
    if (e.firstCorrect === null && e.score === null) continue
    if (seenTemplates.has(e.templateId)) continue
    seenTemplates.add(e.templateId)
    const skillId = e.skillIds[0]
    if (!skillId) continue
    const prereqs = skills.get(skillId)?.prereqs ?? []
    const before = evidenceAt(e.t - 1)
    const owned: boolean | null =
      prereqs.length === 0
        ? null
        : prereqs.every((p) => {
            const ev = before.get(p)
            return ev ? stateRank(ev.state) >= stateRank('independent') : false
          })
    probes.push({
      t: e.t,
      skillId,
      // Multi-part probes carry a fractional score; single ones are all-or-nothing.
      score: e.score !== null ? e.score : e.firstCorrect === true ? 1 : 0,
      prereqsOwned: owned,
    })
  }
  return probes
}

export function pflReport(probes: PflProbe[]): PflReport {
  if (probes.length < MIN_PROBES) {
    return {
      probes: probes.length,
      pickUp: null,
      withPrereqs: null,
      withoutPrereqs: null,
      summary: `Not enough yet — ${probes.length} of ${MIN_PROBES} probes. This measures how much of a brand-new idea you pick up from a short explanation, and it needs a few before the number means anything.`,
    }
  }

  const pickUp = mean(probes.map((p) => p.score))
  // `null` means the question does not apply to that probe, so it belongs on
  // neither side. `!p.prereqsOwned` would have swept those onto the "without"
  // side, which is what the old boolean did.
  const withArr = probes.filter((p) => p.prereqsOwned === true).map((p) => p.score)
  const withoutArr = probes.filter((p) => p.prereqsOwned === false).map((p) => p.score)
  const withPrereqs = withArr.length >= MIN_PER_SIDE ? mean(withArr) : null
  const withoutPrereqs = withoutArr.length >= MIN_PER_SIDE ? mean(withoutArr) : null

  const pct = (x: number) => `${Math.round(x * 100)}%`
  let summary = `Across ${probes.length} probes you picked up ${pct(pickUp)} of ideas you had never been taught, from a short explanation and nothing else.`

  if (withPrereqs !== null && withoutPrereqs !== null) {
    const gap = withPrereqs - withoutPrereqs
    summary +=
      Math.abs(gap) < 0.08
        ? ` Owning the groundwork first made little measurable difference here (${pct(withPrereqs)} versus ${pct(withoutPrereqs)}) — which is worth knowing, and is not the result this idea predicts.`
        : gap > 0
          ? ` When you already owned the groundwork you picked up ${pct(withPrereqs)}, against ${pct(withoutPrereqs)} when you did not. That gap is the point: part of what practice buys is learning the next thing faster.`
          : ` Oddly, you did better without the groundwork (${pct(withoutPrereqs)} versus ${pct(withPrereqs)}). With samples this small that is most likely noise rather than a finding.`
  } else {
    summary += ` Not enough probes yet on both sides to compare whether owning the groundwork first helps.`
  }

  return { probes: probes.length, pickUp, withPrereqs, withoutPrereqs, summary }
}
