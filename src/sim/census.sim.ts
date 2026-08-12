/**
 * Content census. Renders the real index and counts it, because reading the
 * source and estimating has been wrong before — a regex once counted 307
 * templates as 161 and produced the wrong conclusion about which areas were
 * starved.
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { DEFAULT_INDEX } from '../content/registry'
import { SKILLS } from '../content/skills'

describe('content census', () => {
  it('counts what actually exists', () => {
    const byBucket: Record<string, {
      templates: number
      skills: Set<string>
      variants: number
      minutes: number
      byDifficulty: Record<number, number>
      nonRoutine: number
      transfer: number
      withStudy: number
      kinds: Record<string, number>
      authentic: number
    }> = {}

    for (const t of DEFAULT_INDEX.templates.values()) {
      const b = (byBucket[t.bucket] ??= {
        templates: 0, skills: new Set(), variants: 0, minutes: 0,
        byDifficulty: {}, nonRoutine: 0, transfer: 0, withStudy: 0, kinds: {}, authentic: 0,
      })
      b.templates += 1
      for (const s of t.skillIds) b.skills.add(s)
      b.variants += t.variants
      b.minutes += t.minutes
      b.byDifficulty[t.difficulty] = (b.byDifficulty[t.difficulty] ?? 0) + 1
      if (t.novelty === 'nonRoutine') b.nonRoutine += 1
      if (t.transfer) b.transfer += 1
      if (t.authentic) b.authentic += 1
      b.kinds[t.kind] = (b.kinds[t.kind] ?? 0) + 1
    }

    // Skills with no template at all cannot be proved; skills with one template
    // cannot reach `independent` (two distinct forms are required).
    const templatesPerSkill = new Map<string, number>()
    for (const t of DEFAULT_INDEX.templates.values())
      for (const s of t.skillIds) templatesPerSkill.set(s, (templatesPerSkill.get(s) ?? 0) + 1)

    const skillRows = SKILLS.map((s) => ({
      id: s.id,
      name: s.name,
      bucket: s.bucket,
      templates: templatesPerSkill.get(s.id) ?? 0,
      prereqs: s.prereqs?.length ?? 0,
    })).sort((a, b) => a.templates - b.templates)

    const out = {
      totals: {
        templates: DEFAULT_INDEX.templates.size,
        skills: SKILLS.length,
        skillsWithTemplates: [...templatesPerSkill.keys()].length,
        variants: [...DEFAULT_INDEX.templates.values()].reduce((a, t) => a + t.variants, 0),
      },
      buckets: Object.fromEntries(
        Object.entries(byBucket).map(([k, v]) => [k, {
          templates: v.templates,
          skills: v.skills.size,
          variants: v.variants,
          avgMinutes: Math.round((10 * v.minutes) / v.templates) / 10,
          byDifficulty: v.byDifficulty,
          nonRoutine: v.nonRoutine,
          transfer: v.transfer,
          authentic: v.authentic,
          kinds: v.kinds,
        }]),
      ),
      unprovableSkills: skillRows.filter((r) => r.templates < 2),
      thinnestSkills: skillRows.slice(0, 60),
    }
    writeFileSync('sim-census.json', JSON.stringify(out, null, 1))
  })
})
