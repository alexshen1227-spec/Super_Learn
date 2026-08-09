/**
 * The mal-rule profile: which mistakes keep coming back, named.
 *
 * "Practise more" only fixes execution gaps. A learner who reliably misreads
 * constraints, or reliably picks the wrong method, or reliably slips on signs,
 * needs three different repairs — and volume fixes none of them. Sorting
 * errors by CAUSE rather than by topic is the highest-leverage study move
 * there is (it is why `x-focus` exists as a Meta Lab skill), so the coach
 * should be able to do it from the evidence it already has.
 *
 * Honesty rules, same as every other readout:
 *
 *  - It refuses to exist below `MIN_ERRORS` tagged mistakes. Two sign slips is
 *    not a habit; it is Tuesday.
 *  - A pattern must RECUR (`MIN_OCCURRENCES`) and must be a real share of the
 *    learner's errors before it is named — otherwise the top of a short list
 *    is just noise wearing a label.
 *  - It reports what was TAGGED, never what was inferred. Untagged errors are
 *    counted as unknown rather than quietly assigned to the nearest pattern.
 */
import type { AttemptEvent, ErrorTag } from '../domain/types'
import { ERROR_TAGS } from '../domain/types'

/** Below this many tagged errors in the window, the profile says nothing. */
export const MIN_ERRORS = 8
/** A pattern must appear at least this often to be called a habit. */
export const MIN_OCCURRENCES = 3
/** …and account for at least this share of tagged errors. */
export const MIN_SHARE = 0.2

const WINDOW_DAYS = 28

export interface MalRule {
  tag: ErrorTag
  name: string
  /** What this cause means, from the shared vocabulary. */
  hint: string
  count: number
  /** Share of all tagged errors in the window, 0..1. */
  share: number
  /** Skills where this pattern showed up most, most-frequent first. */
  topSkillIds: string[]
  /** The repair this cause actually needs — not "more practice". */
  repair: string
}

export interface MalRuleProfile {
  /** Named recurring patterns, strongest first. Empty when not enough evidence. */
  rules: MalRule[]
  /** Tagged errors considered. */
  tagged: number
  /** Errors with no cause recorded — stated, never redistributed. */
  untagged: number
  /** Plain-language summary, including the refusal case. */
  summary: string
}

/**
 * The repair each cause needs. These are HEURISTIC study advice consistent
 * with the error-analysis literature, not measured effects — the copy stays
 * concrete and avoids promising a result.
 */
const REPAIR: Record<ErrorTag, string> = {
  concept: 'Re-learn the idea before drilling it — go back to the concept card and a worked example, then one problem.',
  strategy: 'Practise CHOOSING, not solving: mixed sets where you name the method before touching the algebra.',
  slip: 'Slow the mechanical steps and install a check — substitute your answer back before moving on.',
  misread: 'Read the prompt twice and underline the constraint words ("at least", "not", "each") before starting.',
  representation: 'Draw or tabulate the situation first, and check the picture against the words before solving.',
  inference: 'Ask what the evidence licenses: name the claim, then name what would have to be true for it to hold.',
  overconfident: 'Rate your confidence before checking, then compare — the gap is the thing to shrink.',
  underconfident: 'Notice where you were right but unsure; that is knowledge you are not yet counting.',
  incomplete: 'Finish the reasoning out loud — an answer without its justification is half an answer.',
  unknown: 'Tag the cause when an error happens; an unsorted error cannot be targeted.',
}

export function malRuleProfile(events: AttemptEvent[], now: number): MalRuleProfile {
  const cutoff = now - WINDOW_DAYS * 86_400_000
  // Only genuine misses, and never placement (which routes rather than proves).
  const misses = events.filter((e) => e.t >= cutoff && e.mode !== 'placement' && e.firstCorrect === false)
  const counts = new Map<ErrorTag, { n: number; skills: Map<string, number> }>()
  let untagged = 0
  for (const e of misses) {
    const tags = e.errorTags.filter((t) => t !== 'unknown')
    if (!tags.length) {
      untagged++
      continue
    }
    for (const tag of tags) {
      const entry = counts.get(tag) ?? { n: 0, skills: new Map<string, number>() }
      entry.n++
      for (const sid of e.skillIds) entry.skills.set(sid, (entry.skills.get(sid) ?? 0) + 1)
      counts.set(tag, entry)
    }
  }
  const tagged = [...counts.values()].reduce((sum, c) => sum + c.n, 0)

  if (tagged < MIN_ERRORS) {
    return {
      rules: [],
      tagged,
      untagged,
      summary: `Not enough yet — ${tagged} tagged mistake${tagged === 1 ? '' : 's'} in the last ${WINDOW_DAYS} days, and it takes ${MIN_ERRORS} before a pattern is worth naming. A couple of slips is not a habit.`,
    }
  }

  const rules: MalRule[] = []
  for (const [tag, entry] of counts) {
    const share = entry.n / tagged
    if (entry.n < MIN_OCCURRENCES || share < MIN_SHARE) continue
    const meta = ERROR_TAGS.find((t) => t.id === tag)
    rules.push({
      tag,
      name: meta?.name ?? tag,
      hint: meta?.hint ?? '',
      count: entry.n,
      share,
      topSkillIds: [...entry.skills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id),
      repair: REPAIR[tag],
    })
  }
  rules.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))

  return {
    rules,
    tagged,
    untagged,
    summary: rules.length
      ? `${rules.length} recurring pattern${rules.length === 1 ? '' : 's'} across ${tagged} tagged mistake${tagged === 1 ? '' : 's'} in ${WINDOW_DAYS} days${untagged ? ` (${untagged} more had no cause recorded)` : ''}.`
      : `${tagged} tagged mistakes in ${WINDOW_DAYS} days, but none recurring enough to call a habit — they are spread across different causes, which is what scattered slips look like.`,
  }
}
