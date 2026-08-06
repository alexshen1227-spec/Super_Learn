/** Indexes over the template registry, built once at startup. */
import type { BucketId, ItemTemplate, SkillNode } from '../domain/types'

export interface ContentIndex {
  templates: Map<string, ItemTemplate>
  bySkill: Map<string, ItemTemplate[]>
  byBucket: Map<BucketId, ItemTemplate[]>
  skills: Map<string, SkillNode>
  skillList: SkillNode[]
}

export function buildIndex(templates: ItemTemplate[], skills: SkillNode[]): ContentIndex {
  const tmap = new Map<string, ItemTemplate>()
  const bySkill = new Map<string, ItemTemplate[]>()
  const byBucket = new Map<BucketId, ItemTemplate[]>()
  for (const t of templates) {
    tmap.set(t.id, t)
    for (const s of t.skillIds) {
      const arr = bySkill.get(s) ?? []
      arr.push(t)
      bySkill.set(s, arr)
    }
    const arr = byBucket.get(t.bucket) ?? []
    arr.push(t)
    byBucket.set(t.bucket, arr)
  }
  const smap = new Map<string, SkillNode>()
  for (const s of skills) smap.set(s.id, s)
  return { templates: tmap, bySkill, byBucket, skills: smap, skillList: skills }
}
