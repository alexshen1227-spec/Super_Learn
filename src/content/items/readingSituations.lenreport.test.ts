import { describe, it } from 'vitest'
import { READING_TEMPLATES } from './readingSituations'

describe('length report', () => {
  it('prints option length bands', () => {
    const lines: string[] = []
    let obsL = 0
    let expL = 0
    let obsS = 0
    let expS = 0
    let n = 0
    for (const t of READING_TEMPLATES) {
      const per: string[] = []
      let longest = 0
      let shortest = 0
      let sets = 0
      const ranks = new Set<number>()
      for (let s = 0; s < t.variants; s++) {
        const item = t.generate(s)
        for (const spec of [item.answer, ...(item.parts ?? []).map((p) => p.answer)]) {
          if (!spec || spec.type !== 'mcq') continue
          const lens = spec.options.map((o) => o.length)
          const k = lens.length
          const others = (i: number) => lens.filter((_, j) => j !== i)
          const isLong = (i: number) => lens[i] > Math.max(...others(i)) * 1.15 && lens[i] - Math.max(...others(i)) >= 8
          const isShort = (i: number) => lens[i] * 1.15 < Math.min(...others(i)) && Math.min(...others(i)) - lens[i] >= 8
          n++
          sets++
          if (lens.some((_, i) => isLong(i))) expL += 1 / k
          if (lens.some((_, i) => isShort(i))) expS += 1 / k
          if (isLong(spec.correct)) obsL++
          if (isShort(spec.correct)) obsS++
          const key = lens[spec.correct]
          const maxOther = Math.max(...others(spec.correct))
          const sorted = [...lens].sort((a, b) => b - a)
          ranks.add(sorted.indexOf(key))
          if (key > maxOther) longest++
          if (isShort(spec.correct)) shortest++
          per.push(
            `  #${String(s).padStart(2)} key ${String(key).padStart(3)} others [${others(spec.correct)
              .sort((a, b) => a - b)
              .join(' ')}]${key > maxOther ? '  <<KEY-LONGEST' : ''}${isShort(spec.correct) ? '  <<KEY-SHORT-OUTLIER' : ''}`,
          )
        }
      }
      if (!sets) continue
      lines.push(
        `\n### ${t.id}  sets=${sets} keyLongest=${longest} keyShortOutlier=${shortest} ranks={${[...ranks].sort().join(',')}}`,
      )
      lines.push(...per)
    }
    lines.push(
      `\n\nBUCKET TOTALS over ${n} sets: obsLongest=${obsL} (expected ${expL.toFixed(1)})  obsShortest=${obsS} (expected ${expS.toFixed(1)})`,
    )
    const fs = require('node:fs') as typeof import('node:fs')
    fs.writeFileSync('lenreport.txt', lines.join('\n'))
  })
})
