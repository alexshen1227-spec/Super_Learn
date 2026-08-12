/**
 * Why a skill is never reached. Coverage numbers say WHICH skills a five-year
 * learner never meets; this says why — an unmet prerequisite, a prerequisite
 * chain that bottoms out somewhere unreachable, or simply never scoring high
 * enough to be chosen.
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { SKILLS, SKILL_BY_ID } from '../content/skills'
import { DEFAULT_INDEX } from '../content/registry'
import { MATH_TRACKS } from '../content/tracks'

describe('skill reachability', () => {
  it('maps the prerequisite graph and the track coverage', () => {
    const templatesPerSkill = new Map<string, number>()
    for (const t of DEFAULT_INDEX.templates.values())
      for (const s of t.skillIds) templatesPerSkill.set(s, (templatesPerSkill.get(s) ?? 0) + 1)

    const inTrack = new Map<string, string[]>()
    for (const track of MATH_TRACKS)
      for (const u of track.units)
        for (const s of u.skillIds) inTrack.set(s, [...(inTrack.get(s) ?? []), track.id])

    // Longest prerequisite chain to each skill: depth is what makes a topic
    // arrive late, and anything unreachable shows up as a broken edge.
    const depth = new Map<string, number>()
    const broken: { skill: string; missingPrereq: string }[] = []
    const visiting = new Set<string>()
    const cycles: string[] = []
    function depthOf(id: string): number {
      if (depth.has(id)) return depth.get(id)!
      if (visiting.has(id)) {
        cycles.push(id)
        return 0
      }
      visiting.add(id)
      const s = SKILL_BY_ID.get(id)
      let d = 0
      for (const p of s?.prereqs ?? []) {
        if (!SKILL_BY_ID.has(p)) {
          broken.push({ skill: id, missingPrereq: p })
          continue
        }
        d = Math.max(d, depthOf(p) + 1)
      }
      visiting.delete(id)
      depth.set(id, d)
      return d
    }
    for (const s of SKILLS) depthOf(s.id)

    const rows = SKILLS.map((s) => ({
      id: s.id,
      bucket: s.bucket,
      name: s.name,
      templates: templatesPerSkill.get(s.id) ?? 0,
      prereqs: s.prereqs ?? [],
      depth: depth.get(s.id) ?? 0,
      tracks: inTrack.get(s.id) ?? [],
    }))

    writeFileSync(
      'sim-reach.json',
      JSON.stringify(
        {
          brokenPrereqEdges: broken,
          cycles,
          deepest: [...rows].sort((a, b) => b.depth - a.depth).slice(0, 25),
          notInAnyTrack: rows.filter((r) => r.bucket === 'math' && !r.tracks.length),
          byBucketDepth: Object.fromEntries(
            [...new Set(rows.map((r) => r.bucket))].map((b) => [
              b,
              { maxDepth: Math.max(...rows.filter((r) => r.bucket === b).map((r) => r.depth)) },
            ]),
          ),
          rows,
          tracks: MATH_TRACKS.map((t) => ({ id: t.id, name: t.name, next: t.next ?? null, skills: t.units.flatMap((u) => u.skillIds) })),
        },
        null,
        1,
      ),
    )
  })
})
