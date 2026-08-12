/**
 * The same seed must always render the same item.
 *
 * Everything downstream assumes it: novelty tracking keys off `seed % variants`,
 * the review ladder treats a template id as a stable question family, and a
 * resumed draft re-renders the item the learner was halfway through. A
 * generator holding state between calls breaks all three, and it breaks them
 * silently — the learner just sees a different question after a reload.
 *
 * Found because the five-year gate passed alone and failed when it ran after
 * the other simulations in the same process.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_INDEX } from '../content/registry'

function fingerprint(item: unknown): string {
  return JSON.stringify(item)
}

describe('generators hold no state between calls', () => {
  it('renders the same item for the same seed, before and after rendering everything else', () => {
    const templates = [...DEFAULT_INDEX.templates.values()]
    const before = new Map<string, string>()
    for (const t of templates) {
      try {
        before.set(t.id, fingerprint(t.generate(3)))
      } catch {
        /* generators that throw on a seed are a different test's problem */
      }
    }
    // Exercise the whole bank the way the other simulations do.
    for (const t of templates) {
      for (let s = 0; s < Math.min(12, Math.max(1, t.variants)); s++) {
        try {
          t.generate(s)
        } catch {
          /* ignore */
        }
      }
    }
    const drifted: string[] = []
    for (const t of templates) {
      if (!before.has(t.id)) continue
      let after: string
      try {
        after = fingerprint(t.generate(3))
      } catch {
        continue
      }
      if (after !== before.get(t.id)) drifted.push(t.id)
    }
    expect(drifted, 'these templates render differently for the same seed after other work').toEqual([])
  })
})
