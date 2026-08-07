/**
 * Identifying a PFL probe, and nothing else.
 *
 * This lives apart from `engine/pfl.ts` purely to break an import cycle:
 * `pfl.ts` needs `stateRank` from `mastery.ts`, and `mastery.ts` needs to
 * recognise probes during replay so a probe can never move the ladder even
 * when the event was written by an older build or arrived from an import.
 * A dependency-free predicate is the smallest thing that satisfies both.
 */

/** PFL content is identified by id prefix, as case files and studios are. */
export const PFL_PREFIX = 'pfl-'

export function isPflTemplate(templateId: string): boolean {
  return templateId.startsWith(PFL_PREFIX)
}
