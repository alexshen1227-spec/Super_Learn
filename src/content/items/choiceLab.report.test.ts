import { describe, it } from 'vitest'
import { CHOICE_TEMPLATES } from './choiceLab'
import type { AnswerSpec, RenderedItem } from '../../domain/types'

function mcqsOf(item: RenderedItem): Extract<AnswerSpec, { type: 'mcq' }>[] {
  const specs: AnswerSpec[] = [item.answer, ...(item.parts ?? []).map((p) => p.answer)].filter(Boolean) as AnswerSpec[]
  const out: Extract<AnswerSpec, { type: 'mcq' }>[] = []
  for (const spec of specs) {
    if (spec.type === 'mcq') out.push(spec)
    if (spec.type === 'steps') for (const st of spec.steps) if (st.answer.type === 'mcq') out.push(st.answer)
  }
  return out
}

describe('report', () => {
  it("prints option lengths", async () => {
    const lines: string[] = []
    for (const t of CHOICE_TEMPLATES) {
      let longest = 0
      let shortest = 0
      let sets = 0
      const detail: string[] = []
      for (let s = 0; s < t.variants; s++) {
        for (const spec of mcqsOf(t.generate(s))) {
          const lens = spec.options.map((o) => o.length)
          const k = lens[spec.correct]
          const others = lens.filter((_, i) => i !== spec.correct)
          const isLongest = others.every((l) => l < k)
          const isShortest = others.every((l) => l > k)
          sets++
          if (isLongest) longest++
          if (isShortest) shortest++
          // The audit's own definition of a VISIBLE cue: >15% and >=8 chars.
          const hi = Math.max(...others)
          const lo = Math.min(...others)
          const visLong = k > hi * 1.15 && k - hi >= 8
          const visShort = k * 1.15 < lo && lo - k >= 8
          const rank = others.filter((l) => l < k).length
          detail.push(
            `   #${s} rank ${rank}/${others.length} key=${k} others=[${[...others].sort((a, b) => a - b).join(',')}]` +
              `${isLongest ? ' LONGEST' : ''}${isShortest ? ' shortest' : ''}${visLong ? ' VISIBLE-LONG' : ''}${visShort ? ' VISIBLE-SHORT' : ''}`,
          )
        }
      }
      lines.push(`${t.id}: ${sets} sets, longest ${longest}, shortest ${shortest}`)
      lines.push(...detail)
    }
    const fs = await import('node:fs')
    fs.writeFileSync('C:/Users/dtm92/AppData/Local/Temp/claude/C--Dev-Super-Learn/b9266acc-c1c4-4551-ba28-98a72f2e2441/scratchpad/lenreport.txt', lines.join('\n'))
  })
})
