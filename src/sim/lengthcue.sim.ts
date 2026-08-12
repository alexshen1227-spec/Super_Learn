/**
 * Which templates carry a length cue, and in which direction.
 *
 * The bucket-level audit says a bucket is leaking; this says which templates to
 * edit and whether the key is running long or short. Both directions are
 * exploitable: "always pick the longest" and "always pick the shortest" are the
 * same strategy wearing different clothes.
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { DEFAULT_INDEX } from '../content/registry'

const CUE_MARGIN = 0.15
const CUE_CHARS = 8

describe('length cue by template', () => {
  it('reports direction and size', () => {
    const rows: { id: string; bucket: string; n: number; long: number; short: number; worst: string }[] = []
    for (const t of DEFAULT_INDEX.templates.values()) {
      let n = 0
      let long = 0
      let short = 0
      let worst = ''
      for (let seed = 0; seed < Math.max(1, t.variants); seed++) {
        let item
        try {
          item = t.generate(seed)
        } catch {
          continue
        }
        for (const part of item.parts ?? [{ answer: item.answer }]) {
          const a = part.answer ?? item.answer
          if (!a || a.type !== 'mcq' || a.options.length < 3) continue
          const lens = a.options.map((o) => o.length)
          const others = lens.filter((_, j) => j !== a.correct)
          const hi = Math.max(...others)
          const lo = Math.min(...others)
          n++
          if (lens[a.correct] > hi * (1 + CUE_MARGIN) && lens[a.correct] - hi >= CUE_CHARS) long++
          if (lens[a.correct] * (1 + CUE_MARGIN) < lo && lo - lens[a.correct] >= CUE_CHARS) {
            short++
            if (!worst) worst = `key(${lens[a.correct]}) vs shortest decoy(${lo}): ${a.options[a.correct].slice(0, 70)}`
          }
        }
      }
      if (n) rows.push({ id: t.id, bucket: t.bucket, n, long, short, worst })
    }
    rows.sort((a, b) => b.short + b.long - (a.short + a.long))
    writeFileSync('sim-lengthcue.json', JSON.stringify(rows.filter((r) => r.long + r.short > 0), null, 1))
  })
})
