/**
 * Can this skill still be PROVEN with the content that exists?
 *
 * Independence requires unaided first-attempt success on `formsRequired`
 * distinct template families. Burned templates cannot supply one (see
 * `content/burned.ts`), so a skill whose clean pool is smaller than that
 * threshold cannot reach Independent however well the learner does.
 *
 * Left alone, such a skill becomes a permanent frontier squatter. The planner
 * keeps choosing it because it is never satisfied, the learner keeps being
 * served it, and the rest of the curriculum goes unvisited — the exact failure
 * recorded in RESEARCH.md §31, arriving by a new route. Marking 204 templates
 * burned dropped a simulated year's coverage from 95 skills to 78 through
 * precisely this mechanism, which is a bug and not an honest cost.
 *
 * So the app has to know the difference between "you have not proved this yet"
 * and "this cannot be proved here". The second is a statement about the
 * CONTENT, is the app's fault rather than the learner's, and is exactly the
 * signal that should decide what gets imported next.
 */
import type { ItemTemplate } from '../domain/types'
import { BURNED_TEMPLATE_IDS } from '../content/burned'
import { formsRequired } from './mastery'

export interface PoolPressure {
  skillId: string
  bucket: string
  /** Template families tagged to this skill. */
  total: number
  /** Families that can still carry unaided evidence. */
  clean: number
  /** Distinct families independence needs. */
  required: number
  /** No clean family at all — the skill is unreachable, not merely hard. */
  blocked: boolean
}

interface IndexLike {
  bySkill: Map<string, ItemTemplate[]>
}

/** Families for a skill that can still carry unaided evidence. */
export function cleanPool(index: IndexLike, skillId: string): ItemTemplate[] {
  return (index.bySkill.get(skillId) ?? []).filter((t) => !BURNED_TEMPLATE_IDS.has(t.id))
}

/**
 * Every skill whose clean pool cannot reach the independence bar, worst first.
 *
 * This is the import shortlist. A skill at 0 clean families needs content
 * before any amount of practice can move it.
 */
export function poolPressure(index: IndexLike, skillIds: Iterable<string>): PoolPressure[] {
  const out: PoolPressure[] = []
  for (const skillId of skillIds) {
    const all = index.bySkill.get(skillId) ?? []
    if (!all.length) continue
    const bucket = all[0].bucket
    const required = formsRequired(bucket)
    const clean = cleanPool(index, skillId).length
    if (clean >= required) continue
    out.push({ skillId, bucket, total: all.length, clean, required, blocked: clean === 0 })
  }
  return out.sort((a, b) => a.clean - b.clean || b.total - a.total)
}

/**
 * Could a perfect learner reach Independent on this skill today?
 *
 * Deliberately about the CONTENT only. It says nothing about whether the
 * learner is ready, and it must never be read as a judgement about them.
 */
export function isProvable(index: IndexLike, skillId: string, bucket: string): boolean {
  return cleanPool(index, skillId).length >= formsRequired(bucket)
}
