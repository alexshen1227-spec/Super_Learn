import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { UNSEEN_TEMPLATES } from './unseenLab'
import type { AnswerSpec, RenderedItem } from '../../domain/types'

const specsOf = (item: RenderedItem): AnswerSpec[] => [
  ...(item.answer ? [item.answer] : []),
  ...(item.parts ?? []).map((p) => p.answer),
]
const OUT = 'C:/Users/dtm92/AppData/Local/Temp/claude/C--Dev-Super-Learn/b9266acc-c1c4-4551-ba28-98a72f2e2441/scratchpad/measure.txt'

describe('measure', () => {
  it('reports rank spread, the longest-option strategy rate, and coverage', () => {
    const out: string[] = []

    // ---- key length rank, per template
    let mcqs = 0
    let chance = 0
    let longestWins = 0
    let shortestWins = 0
    out.push('KEY LENGTH RANK (1 = longest)  +  strategy tally')
    for (const t of UNSEEN_TEMPLATES) {
      const ranks: number[] = []
      for (let s = 0; s < t.variants; s++) {
        for (const spec of specsOf(t.generate(s))) {
          if (!spec || spec.type !== 'mcq') continue
          const lens = spec.options.map((o) => o.length)
          const k = lens[spec.correct]
          ranks.push(lens.filter((l) => l > k).length + 1)
          mcqs++
          chance += 1 / lens.length
          const max = Math.max(...lens)
          const min = Math.min(...lens)
          if (lens.filter((l) => l === max).length === 1 && lens.indexOf(max) === spec.correct) longestWins++
          if (lens.filter((l) => l === min).length === 1 && lens.indexOf(min) === spec.correct) shortestWins++
        }
      }
      if (!ranks.length) continue
      const hist = new Map<number, number>()
      for (const r of ranks) hist.set(r, (hist.get(r) ?? 0) + 1)
      const spread = [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([r, n]) => `r${r}:${n}`).join(' ')
      out.push(`  ${t.id.padEnd(28)} n=${String(ranks.length).padStart(3)}  ${spread}`)
    }
    out.push('')
    out.push(`mcq option sets: ${mcqs}`)
    out.push(`"always pick the longest"  wins ${longestWins}/${mcqs} = ${((100 * longestWins) / mcqs).toFixed(1)}%`)
    out.push(`"always pick the shortest" wins ${shortestWins}/${mcqs} = ${((100 * shortestWins) / mcqs).toFixed(1)}%`)
    out.push(`guessing baseline               = ${((100 * chance) / mcqs).toFixed(1)}%`)

    // ---- per-skill coverage, entry points, transfer routes
    out.push('')
    out.push('PER-SKILL COVERAGE')
    const bySkill = new Map<string, { fams: string[]; easiest: number; transfer: boolean }>()
    for (const t of UNSEEN_TEMPLATES) {
      for (const id of t.skillIds) {
        const e = bySkill.get(id) ?? { fams: [], easiest: 99, transfer: false }
        e.fams.push(t.id)
        e.easiest = Math.min(e.easiest, t.difficulty)
        e.transfer = e.transfer || !!t.transfer
        bySkill.set(id, e)
      }
    }
    for (const [id, e] of [...bySkill].sort()) {
      out.push(`  ${id.padEnd(14)} families=${e.fams.length}  easiest=${e.easiest}*  transfer=${e.transfer}`)
    }

    // ---- template table
    out.push('')
    out.push('TEMPLATE TABLE  id | skillIds | difficulty | variants | minutes | kind')
    for (const t of UNSEEN_TEMPLATES) {
      out.push(
        `  ${t.id} | ${t.skillIds.join(',')} | ${t.difficulty} | ${t.variants} | ${t.minutes} | ${t.kind}` +
          `${t.transfer ? ' | transfer' : ''}${t.calibration ? ' | calibration' : ''}`,
      )
    }
    out.push('')
    out.push(`TOTAL templates: ${UNSEEN_TEMPLATES.length}   TOTAL variants: ${UNSEEN_TEMPLATES.reduce((a, t) => a + t.variants, 0)}`)

    writeFileSync(OUT, out.join('\n'))
  })
})
