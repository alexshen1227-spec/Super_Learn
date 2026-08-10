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
import type { AppState, AttemptEvent, ExploreSpec } from '../domain/types'
import { initialState } from '../domain/types'
import { DEFAULT_INDEX } from '../content/registry'
import { buildSessionPlan } from './planner'
import { deriveEvidence } from './mastery'
import { EXPLORE_SERVE_LIMIT, isExploreTemplate } from './plannerPolicy'
import { clippedMarks, overlappingDots, overlappingLabels, plotLayout } from './plotGeometry'

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

/**
 * A manipulable diagram is exposure, and exposure does not repeat well.
 *
 * This is a simulation rather than an assertion-by-construction because that
 * is the only level at which the failure was visible: every scoring decision
 * was defensible and a struggling learner was still served ONE diagram 45
 * times in a simulated year while never meeting the other fourteen.
 */
describe('diagrams do not repeat like retrieval items', () => {
  const DAY = 86_400_000

  function run(days: number, acc: number) {
    const state: AppState = { ...initialState(), onboarded: true }
    let t = Date.UTC(2026, 0, 5, 16)
    const served = new Map<string, number>()
    let worstInOneSession = 0
    for (let d = 0; d < days; d++) {
      t += DAY
      let plan
      try {
        plan = buildSessionPlan({
          index: DEFAULT_INDEX,
          evidence: deriveEvidence(state.events, t),
          state,
          now: t,
          checkIn: { minutes: 30, energy: 'ok', focus: null },
        })
      } catch {
        continue
      }
      const today = new Map<string, number>()
      for (const block of plan.blocks) {
        for (const a of block.activities) {
          const tpl = DEFAULT_INDEX.templates.get(a.templateId)
          if (!tpl) continue
          if (isExploreTemplate(tpl.id)) {
            served.set(tpl.id, (served.get(tpl.id) ?? 0) + 1)
            today.set(tpl.id, (today.get(tpl.id) ?? 0) + 1)
          }
          const ok = (state.events.length % 10) / 10 < acc
          state.events.push({
            id: `e${state.events.length}`,
            t: t + state.events.length,
            sessionId: plan.id,
            templateId: tpl.id,
            itemVersion: tpl.version,
            seed: a.seed,
            skillIds: tpl.skillIds,
            bucket: tpl.bucket,
            mode: a.mode,
            firstResponse: 'x',
            finalResponse: 'x',
            correct: ok,
            firstCorrect: ok,
            score: null,
            validator: 'numeric',
            hintLevel: 0,
            confidence: null,
            elapsedSec: tpl.minutes * 60,
            errorTags: [],
            difficulty: tpl.difficulty,
          } as AttemptEvent)
        }
      }
      worstInOneSession = Math.max(worstInOneSession, 0, ...today.values())
    }
    return { served, worstInOneSession }
  }

  it('never serves the same diagram twice in one session', () => {
    for (const acc of [0.3, 0.7]) {
      const { worstInOneSession } = run(120, acc)
      expect(worstInOneSession, `accuracy ${acc}: a session repeated a diagram`).toBeLessThanOrEqual(1)
    }
    // Two 120-day plan simulations. Slow by nature, so it gets a real budget
    // rather than flaking the release gate under parallel load.
  }, 60_000)

  it('stops offering a diagram once it has been explored a few times', () => {
    for (const acc of [0.3, 0.7]) {
      const { served } = run(240, acc)
      const worst = [...served.entries()].sort((a, b) => b[1] - a[1])[0]
      if (!worst) continue
      // The cap is soft (counts come from events already written), so this
      // allows headroom — but 45, the number that prompted the fix, is far out.
      expect(worst[1], `accuracy ${acc}: ${worst[0]} served ${worst[1]} times`).toBeLessThanOrEqual(
        EXPLORE_SERVE_LIMIT * 3,
      )
    }
  }, 120_000)
})

/**
 * Canaries for the pixel-space detectors.
 *
 * A gate that passes might be checking nothing. Each of these hands the
 * detector a picture with the defect deliberately present, so a future change
 * that quietly breaks the detector fails here rather than shipping silently.
 */
describe('the pixel-space checks actually detect things', () => {
  const base = { xMin: 0, xMax: 10, yMin: 0, yMax: 100, series: [] }

  it('sees two dots drawn on the same spot', () => {
    expect(overlappingDots({ ...base, dots: [{ x: 5, y: 50 }, { x: 5, y: 50 }] })).toHaveLength(1)
    expect(overlappingDots({ ...base, dots: [{ x: 1, y: 50 }, { x: 9, y: 50 }] })).toEqual([])
  })

  /**
   * The real case: a y-axis name in the top-left corner and the topmost tick
   * label on the same line, which rendered as "test1(0core". The fix is a
   * reserved band, so what this guards is that the band still exists — take it
   * away and the two print on top of each other again.
   */
  it('reserves a band for the y-axis name, which is what stops the collision', () => {
    const withName = plotLayout({ ...base, yLabel: 'test score' })
    const without = plotLayout({ ...base })
    expect(withName.padT, 'the headroom that prevents the collision is gone').toBeGreaterThan(without.padT)
    expect(overlappingLabels({ ...base, yLabel: 'test score' })).toEqual([])
  })

  /**
   * Marker labels point inward from their own line, so they leave the frame
   * only when the text is longer than half the plot is wide. That is the
   * condition worth detecting — and writing this canary is what showed the
   * first version of it was asserting the wrong thing.
   */
  it('sees a marker label too long to fit inside the frame', () => {
    const off = clippedMarks({
      ...base,
      marks: [{ x: 5, label: 'a marker label so long that it could not possibly fit inside the frame' }],
    })
    expect(off.length).toBeGreaterThan(0)
    expect(clippedMarks({ ...base, marks: [{ x: 5, label: 'mean 50' }] })).toEqual([])
  })
})
