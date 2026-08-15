/**
 * The rules that make a spontaneity probe a probe.
 *
 * A probe is only measuring spontaneity while its prompt does not tell the
 * learner which method to use. That property is invisible — the item looks fine
 * either way — and it erodes one helpful edit at a time, which is exactly the
 * kind of thing that needs pinning rather than trusting.
 *
 * Note on the banned list: it is written as plain literals and checked against
 * a known-matching string below, because a previous audit in this codebase was
 * built by assembling a regex programmatically, picked up a stray escape, and
 * silently matched nothing at all for weeks. A permission that matches nothing
 * looks identical to a permission nobody needed.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_INDEX } from './registry'
import { SPONTANEITY_TEMPLATES } from './items/spontaneityProbes'
import { isSpontaneousTemplate } from '../engine/probeId'

/**
 * Words and phrases that would name the method for the learner. Deliberately
 * includes the app's own topic names as well as the textbook terms.
 */
const NAMES_THE_METHOD = [
  'base rate',
  'base-rate',
  'expected value',
  'reference class',
  'outside view',
  'sunk cost',
  'survivorship',
  'selection effect',
  'dominated',
  'dominant strategy',
  'best response',
  'equilibrium',
  'backward induction',
  'common knowledge',
  'winner\'s curse',
  'natural frequenc',
  'law of large numbers',
  'sample size',
  'regression to the mean',
  'confirmation bias',
  'anchoring',
  'false positive',
  'conditional probability',
  'bayes',
  'prior',
  'posterior',
  'game theory',
  'commons',
  'perspective-taking',
  'fallacy',
]

const probes = () => [...DEFAULT_INDEX.templates.values()].filter((t) => t.spontaneous)

describe('spontaneity probes', () => {
  it('the banned list actually matches something', () => {
    // The canary. If this ever passes vacuously the whole file is decorative.
    const sample = 'You should consider the base rate here, and the expected value.'
    const hit = NAMES_THE_METHOD.filter((w) => sample.toLowerCase().includes(w))
    expect(hit).toContain('base rate')
    expect(hit).toContain('expected value')
  })

  it('exists at all and is registered', () => {
    expect(SPONTANEITY_TEMPLATES.length).toBeGreaterThan(0)
    expect(probes().length, 'probes must be reachable through the real index').toBe(SPONTANEITY_TEMPLATES.length)
  })

  /**
   * The flag and the id prefix must agree, in BOTH directions.
   *
   * `mastery.ts` keeps probes off the evidence ladder during replay, and it
   * recognises them by prefix — it cannot reach the content index from there
   * without an import cycle, exactly as with PFL probes. So a probe that lost
   * its prefix would keep its flag, keep looking correct in every audit, and
   * quietly start advancing skills; and a non-probe that gained the prefix
   * would silently stop counting. Neither is visible by reading the item.
   */
  it('marks every probe with the prefix the ladder exclusion recognises', () => {
    for (const t of probes()) {
      expect(isSpontaneousTemplate(t.id), `${t.id} is flagged spontaneous but has no "sp-" prefix`).toBe(true)
    }
  })

  it('gives the prefix to nothing that is not a probe', () => {
    const wrongly = [...DEFAULT_INDEX.templates.values()].filter((t) => isSpontaneousTemplate(t.id) && !t.spontaneous)
    expect(wrongly.map((t) => t.id), 'these carry the probe prefix and so silently never count').toEqual([])
  })

  it('never names the method in the prompt or the options', () => {
    const offences: string[] = []
    for (const t of probes()) {
      for (let s = 0; s < t.variants; s++) {
        const b = t.generate(s)
        const answer = b.answer as { type: string; options?: string[] } | undefined
        // The EXPLANATION is allowed to name the idea — that is where the
        // learner finds out what was being probed. The prompt and options are
        // not, because that is the whole measurement.
        const visible = [b.prompt, b.title ?? '', ...(answer?.options ?? [])].join(' ').toLowerCase()
        for (const w of NAMES_THE_METHOD) {
          if (visible.includes(w)) offences.push(`${t.id}@${s}: "${w}"`)
        }
      }
    }
    expect(offences, 'a spontaneity probe named its own method').toEqual([])
  })

  /**
   * Checked PER TEMPLATE, not pooled.
   *
   * The first version of this counted across all probes together and passed
   * while the design was broken: the probes lived in two templates, and the
   * "nothing applies" answer was correct in every variant of one and none of
   * the other. Pooled, that reads as a healthy mix. In the app it meant
   * recognising which template you were in gave you the answer.
   */
  const isNullOption = (o: string) => /nothing (here )?(needs|clever|special)|none of these/i.test(o)

  it('always offers a real "nothing applies" option', () => {
    for (const t of probes()) {
      for (let s = 0; s < t.variants; s++) {
        const a = t.generate(s).answer as { type: string; options: string[] }
        expect(a.type, `${t.id}@${s}`).toBe('mcq')
        expect(a.options.some(isNullOption), `${t.id}@${s}: no "nothing applies" option offered`).toBe(true)
      }
    }
  })

  it('makes that option correct sometimes and not always, within each template', () => {
    for (const t of probes()) {
      let nullKeys = 0
      for (let s = 0; s < t.variants; s++) {
        const a = t.generate(s).answer as { options: string[]; correct: number }
        if (isNullOption(a.options[a.correct])) nullKeys++
      }
      // Never correct → a free elimination every time.
      // Always correct → the template is answerable without reading it.
      expect(nullKeys, `${t.id}: "nothing applies" is never the answer, so it can always be ruled out`).toBeGreaterThan(0)
      expect(nullKeys, `${t.id}: "nothing applies" is always the answer`).toBeLessThan(t.variants)
    }
  })

  it('offers several live options rather than one plausible answer and filler', () => {
    for (const t of probes()) {
      for (let s = 0; s < t.variants; s++) {
        const a = t.generate(s).answer as { options: string[] }
        expect(a.options.length, `${t.id}@${s}`).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('carries no length cue in either direction', () => {
    for (const t of probes()) {
      for (let s = 0; s < t.variants; s++) {
        const a = t.generate(s).answer as { options: string[]; correct: number }
        const lens = a.options.map((o) => o.length)
        const key = lens[a.correct]
        const others = lens.filter((_, i) => i !== a.correct)
        expect(key - Math.max(...others), `${t.id}@${s}: key is much the longest`).toBeLessThan(10)
        expect(Math.min(...others) - key, `${t.id}@${s}: key is much the shortest`).toBeLessThan(10)
      }
    }
  })

  it('says plainly that it does not count toward progress', () => {
    for (const t of probes()) {
      for (let s = 0; s < t.variants; s++) {
        const b = t.generate(s)
        expect(
          (b.explanation ?? '').toLowerCase(),
          `${t.id}@${s}: a probe that silently did not count would be worse than one that did`,
        ).toContain('not count toward your progress')
      }
    }
  })
})
