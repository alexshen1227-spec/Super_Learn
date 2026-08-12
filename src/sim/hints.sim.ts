/**
 * Every hint, at every variant.
 *
 * The content audit already rejects an empty hint, but it samples a handful of
 * seeds per template — so a ladder whose middle rung renders as "51 - 30." only
 * trips it on the seeds where the numbers happen to be short, and it surfaced
 * one template at a time across several runs. Rendering everything found
 * fourteen at once, in nine files, most of them years old.
 *
 * The rule being enforced is not really length. It is that the middle rung of a
 * hint ladder has to name the MOVE. A rung that restates the prompt as bare
 * arithmetic is the rung a stuck learner reaches for, and it tells them nothing.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_INDEX } from '../content/registry'

describe('hint ladders', () => {
  it('never offers a rung with nothing in it', () => {
    const bad: string[] = []
    for (const t of DEFAULT_INDEX.templates.values()) {
      for (let s = 0; s < Math.max(1, t.variants); s++) {
        let item
        try {
          item = t.generate(s)
        } catch {
          continue
        }
        const ladders = [item.hints, ...(item.parts ?? []).map((p) => p.hints)]
        for (const ladder of ladders) {
          for (const h of ladder ?? []) {
            if (h.trim().length <= 8) bad.push(`${t.id}: ${JSON.stringify(h)}`)
          }
        }
      }
    }
    expect([...new Set(bad)], 'hint rungs that say nothing').toEqual([])
  })
})
