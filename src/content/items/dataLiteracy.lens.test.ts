import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { DATA_LITERACY_TEMPLATES } from './dataLiteracy'
import type { AnswerSpec } from '../../domain/types'

const specsOf = (item: { answer?: AnswerSpec; parts?: { answer: AnswerSpec }[] }): AnswerSpec[] =>
  item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []

describe('length report', () => {
  it('reports strict violations and rank spread', () => {
    const lines: string[] = []
    for (const t of DATA_LITERACY_TEMPLATES) {
      const rankCount = new Map<number, number>()
      let sets = 0
      let strict = 0
      const worst: string[] = []
      for (let s = 0; s < t.variants; s++) {
        const item = t.generate(s)
        specsOf(item).forEach((spec, pi) => {
          if (!spec || spec.type !== 'mcq') return
          sets++
          const lens = spec.options.map((o) => o.length)
          const key = lens[spec.correct]
          const others = lens.filter((_, i) => i !== spec.correct)
          // rank = how many options are STRICTLY longer than the key
          const rank = others.filter((l) => l > key).length
          rankCount.set(rank, (rankCount.get(rank) ?? 0) + 1)
          if (key > Math.max(...others)) {
            strict++
            if (worst.length < 3) {
              const longestOther = spec.options
                .filter((_, i) => i !== spec.correct)
                .sort((a, b) => b.length - a.length)[0]
              worst.push(
                `  #${s} p${pi} key=${key} vs ${Math.max(...others)}\n    KEY: ${spec.options[spec.correct]}\n    MAX: ${longestOther}`,
              )
            }
          }
        })
      }
      if (sets) {
        const ranks = [...rankCount.entries()].sort().map(([r, c]) => `${r}:${c}`).join(' ')
        lines.push(`${strict > 0 ? 'FAIL' : 'ok  '} ${t.id} sets=${sets} strict=${strict} ranks(${ranks})`)
        lines.push(...worst)
      }
    }
    writeFileSync('lens-report.txt', lines.join('\n'))
  })
})
