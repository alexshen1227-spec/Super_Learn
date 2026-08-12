/**
 * Do templates produce as many DIFFERENT questions as they claim?
 *
 * `variants` drives novelty tracking, the review ladder's sense of a fresh
 * form, and the planner's exposure caps. A template that declares 20 and
 * renders 6 distinct questions is telling the whole system a false number, and
 * a five-year learner is the one who finds out: 259 templates wore their entire
 * declared pool out in a single simulated five years.
 */
import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { DEFAULT_INDEX } from '../content/registry'
import type { RenderedItem } from '../domain/types'

/**
 * A fingerprint of what the LEARNER ACTUALLY SEES.
 *
 * Two earlier versions of this got it wrong in opposite directions, which is
 * the whole reason it is written out carefully now:
 *
 *  - Omitting `polyomino`/`logicgrid`/`chess` reported the puzzle generators as
 *    rendering 1 distinct item out of 30 declared. They carry their entire
 *    problem outside prompt and answer. False alarm.
 *  - Including the raw `answer` object counted HIDDEN state as novelty. A
 *    constructed-answer template whose prompt only varies by one number looked
 *    fully distinct because its stored witness differed. False reassurance.
 *
 * So: prompt text, study text, part prompts, the visible option TEXTS sorted
 * (a reshuffle is not a new question), and the puzzle payloads. Nothing the
 * learner cannot see.
 */
function visible(spec: unknown): string {
  const s = spec as { type?: string; options?: string[]; categories?: string[]; statements?: { text: string }[]; criteria?: string[]; model?: string; slots?: unknown; checks?: unknown }
  if (!s || typeof s !== 'object') return ''
  const bits: string[] = [String(s.type ?? '')]
  if (Array.isArray(s.options)) bits.push([...s.options].sort().join('|'))
  if (Array.isArray(s.categories)) bits.push(s.categories.join('|'))
  if (Array.isArray(s.statements)) bits.push([...s.statements.map((x) => x.text)].sort().join('|'))
  if (Array.isArray(s.criteria)) bits.push(s.criteria.join('|'))
  if (typeof s.model === 'string') bits.push(s.model)
  if (s.slots) bits.push(JSON.stringify(s.slots))
  if (s.checks) bits.push(JSON.stringify(s.checks))
  return bits.join('~')
}

function fingerprint(item: RenderedItem): string {
  const parts: string[] = [item.prompt ?? '', item.title ?? '']
  if (item.parts) {
    for (const p of item.parts) parts.push(p.prompt ?? '', p.study ?? '', visible(p.answer))
  }
  parts.push(visible(item.answer))
  if (item.polyomino) parts.push(JSON.stringify(item.polyomino))
  if (item.logicgrid) parts.push(JSON.stringify(item.logicgrid))
  if (item.chess) parts.push(JSON.stringify(item.chess))
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

    // A template that renders a small fraction of what it declares is lying to
    // novelty tracking, to the review ladder's sense of a fresh form, and to the
    // planner's exposure caps. Ordinary collisions between random draws are
    // fine; a generator whose visible output barely varies is not.
    const badly = overstated.filter((r) => r.distinct < Math.max(2, r.declared * 0.6))
    expect(
      badly.map((r) => `${r.id} renders ${r.distinct} of ${r.declared}`),
      'templates declaring far more variants than they render',
    ).toEqual([])
    expect(rows.filter((r) => r.error).map((r) => `${r.id}: ${r.error}`), 'a generator threw').toEqual([])

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
