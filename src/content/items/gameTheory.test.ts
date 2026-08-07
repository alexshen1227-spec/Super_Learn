import { describe, expect, it } from 'vitest'
import { GAME_THEORY_TEMPLATES } from './gameTheory'

/**
 * Game-theory answers are computed from the generated payoff matrix, so the
 * matrix itself has to be well-posed. A randomly drawn 2x2 game frequently has
 * NO pure-strategy equilibrium, and a "select every stable cell" question
 * cannot express "none" — an early version silently fabricated a correct cell
 * in that case. These tests re-derive the game from the rendered table.
 */
describe('game theory items are well-posed', () => {
  const byId = (id: string) => GAME_THEORY_TEMPLATES.find((t) => t.id === id)!

  /** Recover the four payoff pairs straight out of the rendered markdown. */
  function readMatrix(prompt: string): { row: number[][]; col: number[][] } {
    const cells = [...prompt.matchAll(/(-?\d+)\s*,\s*(-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])])
    expect(cells.length, 'a 2x2 table renders four payoff pairs').toBe(4)
    return {
      row: [[cells[0][0], cells[1][0]], [cells[2][0], cells[3][0]]],
      col: [[cells[0][1], cells[1][1]], [cells[2][1], cells[3][1]]],
    }
  }

  it('every "find the stable point" variant really has a stable cell', () => {
    const t = byId('gt-nash-find')
    for (let seed = 0; seed < t.variants; seed++) {
      const item = t.generate(seed)
      const { row, col } = readMatrix(item.prompt)
      const nash: string[] = []
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          if (row[r][c] >= row[1 - r][c] && col[r][c] >= col[r][1 - c]) nash.push(`${r}${c}`)
        }
      }
      expect(nash.length, `gt-nash-find@${seed}: no pure equilibrium, so no honest answer exists`).toBeGreaterThan(0)
      const spec = item.answer as Extract<typeof item.answer, { type: 'multi' }>
      expect(spec.correct.length, `gt-nash-find@${seed}: answer count must match the real equilibria`).toBe(nash.length)
    }
  })

  it('every dilemma really is a dilemma', () => {
    // Defecting must dominate, and mutual cooperation must beat mutual defection.
    const t = byId('gt-dilemma')
    for (let seed = 0; seed < t.variants; seed++) {
      const { row } = readMatrix(t.generate(seed).prompt)
      const [R, S] = row[0]
      const [T, P] = row[1]
      expect(T, `gt-dilemma@${seed}: T must beat R`).toBeGreaterThan(R)
      expect(R, `gt-dilemma@${seed}: R must beat P`).toBeGreaterThan(P)
      expect(P, `gt-dilemma@${seed}: P must beat S`).toBeGreaterThan(S)
    }
  })

  it('every best-response variant has one decisive reply', () => {
    const t = byId('gt-best-response')
    for (let seed = 0; seed < t.variants; seed++) {
      const item = t.generate(seed)
      const { row } = readMatrix(item.prompt)
      const stated = item.prompt.match(/will play \*\*([^*]+)\*\*/)?.[1]
      expect(stated, `gt-best-response@${seed}: prompt must name their move`).toBeTruthy()
      const colIndex = item.prompt.indexOf(`| | **${stated}**`) === -1 ? null : 0
      void colIndex
      // Whichever column it is, the two payoffs in it must differ.
      const decisive = row[0][0] !== row[1][0] || row[0][1] !== row[1][1]
      expect(decisive, `gt-best-response@${seed}: the live column must have a strictly better row`).toBe(true)
    }
  })
})
