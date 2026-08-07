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

/**
 * THE GATE THAT WAS MISSING. `pfl-growth` taught asymptotic growth while the
 * tree already taught it in `complexity-count` and `complexity-choose`, so for
 * any learner who had met those the probe measured recall, not pick-up. It was
 * caught by grepping the rendered bank, never by reading the source — so the
 * grep is now the release gate.
 *
 * Each probe declares terms distinctive to the IDEA it teaches. Two assertions
 * keep that list honest: the terms must appear in the probe's own resource (so
 * the list cannot rot into vacuous strings), and they must appear nowhere in
 * ordinary content (so the idea is genuinely untaught).
 */
const CONCEPT_TERMS: Record<string, string[]> = {
  'pfl-modular': ['clock arithmetic'],
  'pfl-simpson': ['overall winner loses'],
  'pfl-pigeonhole': ['pigeonhole'],
  'pfl-regression': ['regression to the mean'],
  'pfl-network': ['handshake'],
  'pfl-benford': ['first-digit rule'],
}

describe('probes teach ideas the tree never teaches', () => {
  it('every probe declares concept terms, and they appear in its own resource', () => {
    for (const t of PFL_TEMPLATES) {
      const terms = CONCEPT_TERMS[t.id]
      expect(terms, `${t.id}: no concept terms declared — add them or the gate is vacuous`).toBeTruthy()
      const own = JSON.stringify(t.generate(0)).toLowerCase()
      for (const term of terms) {
        expect(own.includes(term.toLowerCase()), `${t.id}: declares "${term}" but never says it`).toBe(true)
      }
    }
  })

  it('no ordinary item anywhere in the bank teaches a probe concept', () => {
    const offences: string[] = []
    for (const ordinary of BUILTIN_TEMPLATES) {
      if (isPflTemplate(ordinary.id)) continue
      for (let seed = 0; seed < Math.min(4, Math.max(1, ordinary.variants)); seed++) {
        let text = ''
        try { text = JSON.stringify(ordinary.generate(seed)).toLowerCase() } catch { continue }
        for (const [probeId, terms] of Object.entries(CONCEPT_TERMS)) {
          for (const term of terms) {
            if (text.includes(term.toLowerCase())) offences.push(`${ordinary.id} teaches "${term}" (${probeId})`)
          }
        }
      }
    }
    expect([...new Set(offences)], 'a probe would measure recall rather than pick-up').toEqual([])
  })
})

/**
 * The network probe teaches the learner to tell a possible degree list from an
 * impossible one, so every list it SHOWS must itself be possible. An earlier
 * generator varied the first degree upward and pushed it above n − 1,
 * producing four impossible networks out of twelve seeds. Erdős–Gallai decides
 * this exactly, so it is checked rather than eyeballed.
 */
describe('the network probe never shows an impossible network', () => {
  const graphical = (seq: number[]): boolean => {
    const d = [...seq].sort((a, b) => b - a)
    const n = d.length
    if (d.reduce((a, b) => a + b, 0) % 2 !== 0) return false
    if (d[0] > n - 1) return false
    for (let k = 1; k <= n; k++) {
      const lhs = d.slice(0, k).reduce((a, b) => a + b, 0)
      const rhs = k * (k - 1) + d.slice(k).reduce((a, b) => a + Math.min(b, k), 0)
      if (lhs > rhs) return false
    }
    return true
  }

  it('sanity-checks itself against a list known to be impossible', () => {
    expect(graphical([4, 2, 3, 3])).toBe(false) // degree 4 among only 4 dots
    expect(graphical([1, 2, 2])).toBe(false) // odd sum
    expect(graphical([2, 2, 3, 3])).toBe(true)
  })

  it('every degree list it renders can actually be built', () => {
    const t = PFL_TEMPLATES.find((x) => x.id === 'pfl-network')!
    for (let seed = 0; seed < t.variants; seed++) {
      const prompt = t.generate(seed).parts![0].prompt
      const listed = prompt.match(/\*\*([\d, ]+)\*\*/)
      expect(listed, `seed ${seed}: no degree list found in the prompt`).toBeTruthy()
      const degrees = listed![1].split(',').map((s) => Number(s.trim()))
      expect(graphical(degrees), `seed ${seed}: [${degrees}] describes a network that cannot exist`).toBe(true)
    }
  })
})
