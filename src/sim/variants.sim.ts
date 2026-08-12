/**
 * Do templates produce as many DIFFERENT questions as they claim?
 *
 * `variants` drives novelty tracking, the review ladder's sense of a fresh
 * form, and the planner's exposure caps. A template that declares 20 and
 * renders 6 distinct questions is telling the whole system a false number, and
 * a five-year learner is the one who finds out: 259 templates wore their entire
 * declared pool out in a single simulated five years.
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { DEFAULT_INDEX } from '../content/registry'
import type { RenderedItem } from '../domain/types'

/** A stable fingerprint of what the learner actually sees. */
function fingerprint(item: RenderedItem): string {
  const parts: string[] = [item.prompt ?? '']
  if (item.parts) for (const p of item.parts) parts.push(p.prompt ?? '', JSON.stringify(p.answer ?? null))
  parts.push(JSON.stringify(item.answer ?? null))
  return parts.join('␟')
}

describe('variant honesty', () => {
  it('renders every declared variant and counts the distinct ones', () => {
    const rows: {
      id: string
      bucket: string
      declared: number
      distinct: number
      ratio: number
      error?: string
    }[] = []

    for (const t of DEFAULT_INDEX.templates.values()) {
      // The chess bank re-runs a real search per render; auditing it here would
      // add minutes for a template family whose positions are fixed anyway.
      if (t.bucket === 'puzzle' && t.id.startsWith('chess')) continue
      const seen = new Set<string>()
      let error: string | undefined
      const n = Math.max(1, t.variants)
      for (let s = 0; s < n; s++) {
        try {
          seen.add(fingerprint(t.generate(s)))
        } catch (e) {
          error = String(e).slice(0, 160)
          break
        }
      }
      rows.push({
        id: t.id,
        bucket: t.bucket,
        declared: n,
        distinct: seen.size,
        ratio: Math.round((100 * seen.size) / n) / 100,
        ...(error ? { error } : {}),
      })
    }

    rows.sort((a, b) => a.ratio - b.ratio)
    const overstated = rows.filter((r) => !r.error && r.distinct < r.declared)
    const byBucket: Record<string, { templates: number; declared: number; distinct: number }> = {}
    for (const r of rows) {
      const b = (byBucket[r.bucket] ??= { templates: 0, declared: 0, distinct: 0 })
      b.templates += 1
      b.declared += r.declared
      b.distinct += r.distinct
    }

    writeFileSync(
      'sim-variants.json',
      JSON.stringify(
        {
          checked: rows.length,
          crashed: rows.filter((r) => r.error),
          overstatedCount: overstated.length,
          worst: overstated.slice(0, 50),
          byBucket,
        },
        null,
        1,
      ),
    )
  })
})
