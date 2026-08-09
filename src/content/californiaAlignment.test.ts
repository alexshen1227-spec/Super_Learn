import { describe, expect, it } from 'vitest'
import { CALIFORNIA_ALIGNMENT_BY_TRACK, CALIFORNIA_COURSE_ALIGNMENTS } from './californiaAlignment'
import { DEFAULT_INDEX } from './registry'
import { MATH_TRACKS, TRACK_BY_ID, trackSkillIds } from './tracks'

/**
 * California alignment is a release gate, not menu copy. A topic cluster can
 * only be claimed when its skills are actually in the course and the question
 * bank contains both a reachable on-ramp and a task at the course's intended
 * reasoning demand. Extra topics and harder extensions remain welcome.
 */
describe('California mathematics course floor', () => {
  it('maps every standards-labeled course and only real tracks', () => {
    for (const track of MATH_TRACKS.filter((candidate) => candidate.standard !== null)) {
      expect(
        CALIFORNIA_ALIGNMENT_BY_TRACK.has(track.id),
        `${track.id} is standards-labeled but has no auditable alignment`,
      ).toBe(true)
    }
    for (const alignment of CALIFORNIA_COURSE_ALIGNMENTS) {
      expect(TRACK_BY_ID.has(alignment.trackId), `${alignment.trackId}: alignment has no track`).toBe(true)
    }
  })

  it('keeps every required topic in its course with reachable, course-level work', () => {
    for (const alignment of CALIFORNIA_COURSE_ALIGNMENTS) {
      const track = TRACK_BY_ID.get(alignment.trackId)!
      const inTrack = new Set(trackSkillIds(track))
      expect(alignment.clusters.length, `${alignment.trackId}: no topic clusters`).toBeGreaterThan(0)

      for (const cluster of alignment.clusters) {
        expect(cluster.standards.length, `${alignment.trackId}/${cluster.id}: no standard codes`).toBeGreaterThan(0)
        expect(cluster.skillIds.length, `${alignment.trackId}/${cluster.id}: no mapped skills`).toBeGreaterThan(0)

        for (const skillId of cluster.skillIds) {
          expect(DEFAULT_INDEX.skills.has(skillId), `${alignment.trackId}/${cluster.id}: unknown ${skillId}`).toBe(true)
          expect(inTrack.has(skillId), `${alignment.trackId}/${cluster.id}: ${skillId} missing from course`).toBe(true)
          expect(
            DEFAULT_INDEX.bySkill.get(skillId)?.length ?? 0,
            `${alignment.trackId}/${cluster.id}: ${skillId} has no normal-flow questions`,
          ).toBeGreaterThan(0)
        }

        const templates = [
          ...new Map(
            cluster.skillIds
              .flatMap((skillId) => DEFAULT_INDEX.bySkill.get(skillId) ?? [])
              .map((template) => [template.id, template]),
          ).values(),
        ]
        const easiest = Math.min(...templates.map((template) => template.difficulty))
        const hardest = Math.max(...templates.map((template) => template.difficulty))
        expect(
          easiest,
          `${alignment.trackId}/${cluster.id}: easiest task is above the ${alignment.accessCeiling}-star on-ramp`,
        ).toBeLessThanOrEqual(alignment.accessCeiling)
        expect(
          hardest,
          `${alignment.trackId}/${cluster.id}: bank never reaches the ${alignment.challengeFloor}-star course demand`,
        ).toBeGreaterThanOrEqual(alignment.challengeFloor)
      }
    }
  })

  it('keeps the complete standard and accelerated progressions explicit', () => {
    expect(TRACK_BY_ID.get('ca-6')?.next).toBe('ca-7')
    expect(TRACK_BY_ID.get('ca-7')?.next).toBe('ca-8')
    expect(TRACK_BY_ID.get('ca-8')?.next).toBe('hs-alg1')
    expect(TRACK_BY_ID.get('hs-alg1')?.next).toBe('hs-geo')
    expect(TRACK_BY_ID.get('ca-7plus')?.next).toBe('ca-78alg')
    expect(TRACK_BY_ID.get('ca-78alg')?.next).toBe('hs-geo')
    expect(TRACK_BY_ID.get('hs-geo')?.next).toBe('hs-alg2')
  })
})
