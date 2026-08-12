import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { DECISIONS_DEPTH_TEMPLATES } from './decisionsDepth'
import type { AnswerSpec, RenderedItem } from '../../domain/types'

const specsOf = (item: RenderedItem): AnswerSpec[] =>
  item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []

describe('scan', () => {
  it('prints key length ranks and counts', () => {
    const lines: string[] = []
    let mcqs = 0
    let chance = 0
    let longWins = 0
    let secondShortWins = 0
    const bySkill = new Map<string, number>()
    const byBucket = new Map<string, number>()

    for (const t of DECISIONS_DEPTH_TEMPLATES) {
      bySkill.set(t.skillIds[0], (bySkill.get(t.skillIds[0]) ?? 0) + 1)
      byBucket.set(t.bucket, (byBucket.get(t.bucket) ?? 0) + 1)
      const ranks: number[] = []
      for (let s = 0; s < t.variants; s++) {
        for (const spec of specsOf(t.generate(s))) {
          if (!spec || spec.type !== 'mcq') continue
          mcqs++
          chance += 1 / spec.options.length
          const lens = spec.options.map((o) => o.length)
          const max = Math.max(...lens)
          if (lens.filter((l) => l === max).length === 1 && lens.indexOf(max) === spec.correct) longWins++
          const sorted = [...lens].sort((a, b) => b - a)
          const r = sorted.indexOf(lens[spec.correct])
          ranks.push(r)
          if (r === sorted.length - 2) secondShortWins++
        }
      }
      for (let s = 0; s < t.variants; s++) {
        for (const spec of specsOf(t.generate(s))) {
          if (!spec || spec.type !== 'mcq') continue
          const lens = spec.options.map((o) => o.length)
          const sorted = [...lens].sort((a, b) => b - a)
          if (sorted.indexOf(lens[spec.correct]) !== sorted.length - 2) continue
          const others = spec.options
            .map((o, i) => (i === spec.correct ? null : `${o.length}:${o.slice(0, 34)}`))
            .filter(Boolean)
          lines.push(`  RANK2 ${t.id}#${s} key=${lens[spec.correct]} :: ${spec.options[spec.correct].slice(0, 34)} || ${others.join(' || ')}`)
        }
      }
      const dist = ranks.reduce<Record<number, number>>((a, r) => ({ ...a, [r]: (a[r] ?? 0) + 1 }), {})
      lines.push(`${t.id} | ${t.skillIds.join(',')} | ${t.bucket} | d${t.difficulty} | v${t.variants} | ${t.minutes}m | ${t.kind ?? 'single'} | ranks ${JSON.stringify(dist)}`)
    }
    lines.push('')
    lines.push(`templates ${DECISIONS_DEPTH_TEMPLATES.length}  buckets ${JSON.stringify([...byBucket])}`)
    lines.push(`skills ${JSON.stringify([...bySkill])}`)
    lines.push(`mcq sets ${mcqs}  chance ${((chance / mcqs) * 100).toFixed(1)}%  longest-wins ${((longWins / mcqs) * 100).toFixed(1)}%  second-shortest-wins ${((secondShortWins / mcqs) * 100).toFixed(1)}%`)
    const dump: string[] = []
    for (const t of DECISIONS_DEPTH_TEMPLATES) {
      for (const s of [0, 1]) {
        const item = t.generate(s)
        dump.push(`===== ${t.id}#${s} — ${item.title}`)
        dump.push(item.prompt)
        for (const p of item.parts ?? []) dump.push(`--- ${p.stage ?? ''}: ${p.prompt}\n    ANS ${JSON.stringify(p.answer)}`)
        if (item.answer) dump.push(`ANS ${JSON.stringify(item.answer)}`)
        dump.push(`EXPL ${item.explanation}`)
        dump.push('')
      }
    }
    writeFileSync('scan-out.txt', lines.join('\n'))
    writeFileSync('render-out.txt', dump.join('\n'))
  })
})
