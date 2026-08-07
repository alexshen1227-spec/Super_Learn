import { describe, expect, it } from 'vitest'
import { PFL_TEMPLATES } from './pflProbes'
import { BUILTIN_TEMPLATES } from '../registry'
import { isPflTemplate } from '../../engine/pfl'

/**
 * A preparation-for-future-learning probe has one job: measure how much of an
 * idea the learner had never met they can pick up from a short explanation.
 * Several ordinary-looking authoring slips destroy that job silently, so each
 * gets a gate here.
 */
describe('PFL probes are shaped so they measure pick-up', () => {
  it('every probe carries the id prefix the engine identifies them by', () => {
    for (const t of PFL_TEMPLATES) {
      expect(isPflTemplate(t.id), `${t.id} would not be recognised as a probe`).toBe(true)
    }
  })

  it('every probe leads with a substantial resource, then grades from it', () => {
    for (const t of PFL_TEMPLATES) {
      const item = t.generate(0)
      expect(item.parts, `${t.id}: a probe needs parts`).toBeTruthy()
      const withStudy = item.parts!.filter((p) => p.study)
      expect(withStudy.length, `${t.id}: needs exactly one study resource`).toBe(1)
      // Short "resources" would make this a prior-knowledge test instead.
      expect(withStudy[0].study!.length, `${t.id}: resource too thin to learn from`).toBeGreaterThan(400)
      const graded = item.parts!.filter((p) => p.answer && p.answer.type !== 'draft')
      expect(graded.length, `${t.id}: needs at least 2 graded checkpoints`).toBeGreaterThanOrEqual(2)
    }
  })

  /**
   * NEVER A RUNG. A probe must not be flagged as transfer evidence — the
   * learner had the explanation in front of them. The player additionally
   * forces these events to hinted, so they cannot produce independent
   * evidence either; this covers the authoring half.
   */
  it('no probe claims to be transfer evidence', () => {
    for (const t of BUILTIN_TEMPLATES) {
      if (!isPflTemplate(t.id)) continue
      expect(t.transfer, `${t.id} must not carry transfer:true`).toBeFalsy()
    }
  })

  it('probes are not repeats — each declares more than one real form', () => {
    for (const t of PFL_TEMPLATES) {
      const seen = new Set<string>()
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        const item = t.generate(seed)
        seen.add(JSON.stringify(item.parts?.map((p) => [p.prompt, p.study ?? '', p.answer])))
      }
      // Re-serving an identical probe measures memory, not pick-up.
      expect(seen.size, `${t.id}: only ${seen.size} distinct forms`).toBeGreaterThan(1)
    }
  })
})

/**
 * The Simpson's paradox probe only teaches anything if the paradox actually
 * holds in the numbers shown. Hand-checking one seed and trusting the rest is
 * exactly how a generator drifts from its own explanation, so every seed is
 * re-derived from the rendered study text.
 */
describe('the reversing-average probe genuinely reverses', () => {
  it('A wins both groups and B wins the total, on every seed', () => {
    const t = PFL_TEMPLATES.find((x) => x.id === 'pfl-simpson')!
    for (let seed = 0; seed < t.variants; seed++) {
      const study = t.generate(seed).parts![0].study!
      // Pull the four fractions straight out of the text the learner reads.
      const fracs = [...study.matchAll(/\*\*(\d+)\/(\d+)\*\*/g)].map((m) => ({ ok: Number(m[1]), n: Number(m[2]) }))
      expect(fracs.length, `seed ${seed}: expected four fractions in the resource`).toBe(4)
      const [aEasy, aHard, bEasy, bHard] = fracs
      const rate = (f: { ok: number; n: number }) => f.ok / f.n

      expect(rate(aEasy), `seed ${seed}: A must win the easy group`).toBeGreaterThan(rate(bEasy))
      expect(rate(aHard), `seed ${seed}: A must win the hard group`).toBeGreaterThan(rate(bHard))

      const aTotal = (aEasy.ok + aHard.ok) / (aEasy.n + aHard.n)
      const bTotal = (bEasy.ok + bHard.ok) / (bEasy.n + bHard.n)
      expect(bTotal, `seed ${seed}: B must win overall — otherwise there is no paradox`).toBeGreaterThan(aTotal)
    }
  })
})
