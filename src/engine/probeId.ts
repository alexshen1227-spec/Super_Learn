/**
 * Identifying a spontaneity probe, and nothing else.
 *
 * Lives apart for the same reason `pflId.ts` does: `mastery.ts` has to
 * recognise a probe during REPLAY so it can never move the ladder, and it
 * cannot reach the content index from there without an import cycle. A
 * dependency-free predicate over the id is the smallest thing that works.
 *
 * The prefix and the template's `spontaneous` flag must agree, and an audit
 * pins that in both directions — a probe that lost its prefix would silently
 * start counting toward mastery, which is precisely the failure this exists to
 * prevent, and it would look completely normal.
 */

/** Spontaneity probes are identified by id prefix, as PFL probes are. */
export const SPONTANEOUS_PREFIX = 'sp-'

export function isSpontaneousTemplate(templateId: string): boolean {
  return templateId.startsWith(SPONTANEOUS_PREFIX)
}
