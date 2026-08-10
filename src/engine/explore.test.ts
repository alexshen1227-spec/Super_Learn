/**
 * The manipulable diagram, checked where a browser cannot help.
 *
 * The content audit already proves every FRAME is drawable and honest. What it
 * cannot reach is the behaviour around the diagram: what a resumed draft does
 * when the saved phase no longer fits the part, and whether exploring can ever
 * turn into evidence on its own.
 */
import { describe, expect, it } from 'vitest'
import { resumePhase } from './activity'
import { BUILTIN_TEMPLATES } from '../content/registry'
import type { ExploreSpec } from '../domain/types'

type P = 'study' | 'answer' | 'wrong'
const F = { study: 'study', answer: 'answer' } as const

describe('resuming an activity', () => {
  it('opens in the study phase when the part has something to study', () => {
    expect(resumePhase<P>(undefined, true, F)).toBe('study')
    expect(resumePhase<P>(undefined, false, F)).toBe('answer')
  })

  it('honours whatever phase the draft saved', () => {
    expect(resumePhase<P>('wrong', true, F)).toBe('wrong')
    expect(resumePhase<P>('answer', true, F)).toBe('answer')
    expect(resumePhase<P>('study', true, F)).toBe('study')
  })

  /**
   * The stranding case. Before this rule, a draft saying `study` on a part
   * with no study content rendered a study screen with no content and no way
   * out — a parked session the learner could never finish. Reachable by
   * editing content between two sessions, which happens on every release.
   */
  it('refuses a saved study phase the part cannot show, instead of stranding the learner', () => {
    expect(resumePhase<P>('study', false, F)).toBe('answer')
  })
})

describe('exploring is exposure, never evidence', () => {
  const specs: { id: string; spec: ExploreSpec }[] = []
  for (const t of BUILTIN_TEMPLATES) {
    for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
      for (const p of t.generate(seed).parts ?? []) {
        if (p.explore) specs.push({ id: `${t.id}#${seed}`, spec: p.explore })
      }
    }
  }

  it('found the diagrams', () => {
    expect(specs.length).toBeGreaterThanOrEqual(13)
  })

  /**
   * Nothing the learner does with the slider may be gradeable, so the spec
   * carries no correct stop, no target, and no scoring of any kind. If a field
   * like that ever appears, the diagram has quietly become a test and the
   * evidence ladder can be climbed by dragging.
   */
  it('carries nothing that could be marked right or wrong', () => {
    // Not "points": a plot's points are coordinates, not a tally. The rest
    // have no innocent reading inside a diagram spec.
    const forbidden = ['correct', 'answer', 'target', 'score', 'goal', 'solution', 'reward', 'streak']
    for (const { id, spec } of specs) {
      const keys = new Set<string>()
      const walk = (v: unknown) => {
        if (Array.isArray(v)) return v.forEach(walk)
        if (v && typeof v === 'object') {
          for (const [k, inner] of Object.entries(v)) {
            keys.add(k.toLowerCase())
            walk(inner)
          }
        }
      }
      walk(spec)
      for (const bad of forbidden) {
        expect([...keys].filter((k) => k.includes(bad)), `${id}: explore spec has a "${bad}" field`).toEqual([])
      }
    }
  })

  /**
   * The learner may always move on. Blocking the button until every stop is
   * visited would make the app coerce exploration, which is the machinery the
   * founding brief refuses — and there is no field here that could express it.
   */
  it('has no way to express "you may not continue yet"', () => {
    for (const { id, spec } of specs) {
      const keys = Object.keys(spec)
      expect(keys.sort(), `${id}: unexpected field on an explore spec`).toEqual(
        ['initial', 'invitation', 'label', 'stops'].sort(),
      )
    }
  })
})
