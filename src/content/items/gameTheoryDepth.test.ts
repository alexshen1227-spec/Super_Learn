/**
 * Independent verification of the part-two game theory keys.
 *
 * The content audit checks that every item is well-formed, fair and answerable.
 * It cannot check that a game-theory answer is game-theoretically RIGHT — a
 * generator that computed dominance with a flipped comparison would produce a
 * perfectly well-formed item with a wrong key, and every audit gate would pass.
 *
 * So this re-derives the answers from the RENDERED prompt rather than from the
 * generator's own variables: it parses the payoff table or the tree back out of
 * the text the learner actually sees, runs the analysis a second time from
 * scratch, and checks the option marked correct is the one that analysis picks.
 * A shared bug would have to exist in both directions to survive that.
 */
import { describe, expect, it } from 'vitest'
import { DEFAULT_INDEX } from '../registry'

const template = (id: string) => {
  const t = DEFAULT_INDEX.templates.get(id)
  if (!t) throw new Error(`missing template ${id}`)
  return t
}

/** Every variant of a template, rendered. */
function variants(id: string, cap = 40) {
  const t = template(id)
  return Array.from({ length: Math.min(t.variants, cap) }, (_, s) => t.generate(s))
}

function correctText(body: { answer?: unknown }): string {
  const a = body.answer as { type: string; options: string[]; correct: number }
  expect(a.type, 'expected a single-answer multiple choice').toBe('mcq')
  return a.options[a.correct]
}

/** Pull a 3x3 "you , them" markdown grid back out of a prompt. */
function parseGrid(prompt: string): { rows: string[]; cols: string[]; cells: [number, number][][] } {
  const lines = prompt.split('\n').filter((l) => l.trim().startsWith('|'))
  const header = lines[0]
  const cols = header
    .split('|')
    .slice(2, 5)
    .map((c) => c.replace(/\*/g, '').trim())
  const bodyLines = lines.slice(2, 5)
  const rows: string[] = []
  const cells: [number, number][][] = []
  for (const line of bodyLines) {
    const parts = line.split('|').map((c) => c.trim())
    rows.push(parts[1].replace(/\*/g, '').trim())
    cells.push(
      parts.slice(2, 5).map((cell) => {
        const [a, b] = cell.split(',').map((x) => Number(x.trim()))
        return [a, b] as [number, number]
      }),
    )
  }
  return { rows, cols, cells }
}

describe('iterated elimination keys are actually right', () => {
  const bodies = variants('gtd-iterated')

  it('parses a complete 3x3 grid out of every prompt', () => {
    for (const b of bodies) {
      const g = parseGrid(b.prompt)
      expect(g.rows).toHaveLength(3)
      expect(g.cols).toHaveLength(3)
      for (const row of g.cells) {
        expect(row).toHaveLength(3)
        for (const cell of row) for (const v of cell) expect(Number.isFinite(v)).toBe(true)
      }
    }
  })

  it('names the column that is dominated only after a row is removed', () => {
    for (const [i, b] of bodies.entries()) {
      const { rows, cols, cells } = parseGrid(b.prompt)

      // Re-derive step one: which row is strictly dominated for the row player?
      const deadRows = [0, 1, 2].filter((r) =>
        [0, 1, 2].some((other) => other !== r && [0, 1, 2].every((c) => cells[other][c][0] > cells[r][c][0])),
      )
      expect(deadRows, `variant ${i}: exactly one of my options should be dominated`).toHaveLength(1)
      const live = [0, 1, 2].filter((r) => r !== deadRows[0])

      // Re-derive step two: which column is dominated for the column player
      // ONLY once that row is gone? That "only" is the whole lesson, so it is
      // asserted rather than assumed.
      const deadBefore = [0, 1, 2].filter((c) =>
        [0, 1, 2].some((other) => other !== c && [0, 1, 2].every((r) => cells[r][other][1] > cells[r][c][1])),
      )
      const deadAfter = [0, 1, 2].filter((c) =>
        [0, 1, 2].some((other) => other !== c && live.every((r) => cells[r][other][1] > cells[r][c][1])),
      )
      expect(deadBefore, `variant ${i}: nothing of theirs should be dead before the elimination`).toEqual([])
      expect(deadAfter, `variant ${i}: exactly one of theirs should die after it`).toHaveLength(1)

      const key = correctText(b)
      expect(key, `variant ${i}: key should name ${cols[deadAfter[0]]}`).toContain(cols[deadAfter[0]])
      expect(key, `variant ${i}: key should name the eliminated row ${rows[deadRows[0]]}`).toContain(rows[deadRows[0]])
    }
  })

  it('entry variants name a genuinely dominated row', () => {
    for (const [i, b] of variants('gtd-iterated-entry', 24).entries()) {
      const { rows, cells } = parseGrid(b.prompt)
      const dead = [0, 1, 2].filter((r) =>
        [0, 1, 2].some((other) => other !== r && [0, 1, 2].every((c) => cells[other][c][0] > cells[r][c][0])),
      )
      expect(dead, `variant ${i}`).toHaveLength(1)
      expect(correctText(b)).toContain(rows[dead[0]])
    }
  })
})

describe('backward induction keys are actually right', () => {
  /** Pull the four leaves back out of the bullet list. */
  function parseTree(prompt: string): { you: number; them: number }[][] {
    const nums = [...prompt.matchAll(/you (\d+), them (\d+)/g)].map((m) => ({
      you: Number(m[1]),
      them: Number(m[2]),
    }))
    expect(nums, 'expected four leaves').toHaveLength(4)
    return [
      [nums[0], nums[1]],
      [nums[2], nums[3]],
    ]
  }

  it('picks the branch that survives their reply', () => {
    for (const [i, b] of variants('gtd-backward').entries()) {
      const leaf = parseTree(b.prompt)
      // Fold from the bottom, independently of how the generator did it.
      const reply = [0, 1].map((y) => (leaf[y][0].them > leaf[y][1].them ? 0 : 1))
      const value = [0, 1].map((y) => leaf[y][reply[y]].you)
      expect(value[0], `variant ${i}: the two branches must be distinguishable`).not.toBe(value[1])
      const best = value[0] > value[1] ? 0 : 1

      const key = correctText(b)
      expect(key, `variant ${i}: key should quote the folded value ${value[best]}`).toContain(String(value[best]))
      // And it must NOT be the branch that merely contains the biggest number.
      const naiveMax = Math.max(...leaf.flat().map((l) => l.you))
      if (naiveMax !== value[best]) {
        expect(key, `variant ${i}: key should not quote the unreachable maximum`).not.toContain(
          `leaves me ${naiveMax}`,
        )
      }
    }
  })

  it('the entry variant reads their payoff, not yours', () => {
    for (const [i, b] of variants('gtd-backward-entry', 32).entries()) {
      const m = [...b.prompt.matchAll(/you get (\d+), they get (\d+)/g)].map((x) => ({
        you: Number(x[1]),
        them: Number(x[2]),
      }))
      expect(m, `variant ${i}`).toHaveLength(2)
      const pick = m[0].them > m[1].them ? 0 : 1
      const key = correctText(b)
      expect(key, `variant ${i}: key must justify itself with their number`).toContain(
        `${m[pick].them} beats ${m[1 - pick].them}`,
      )
    }
  })
})

describe('selection keys are arithmetically right', () => {
  it('the winner overpays by exactly the stated gap', () => {
    for (const [i, b] of variants('gtd-selection-entry', 24).entries()) {
      const list = b.prompt.match(/estimates are:\s+\*\*([\d, ]+)\*\*/)
      expect(list, `variant ${i}: expected the estimate list`).toBeTruthy()
      const guesses = list![1].split(',').map((x) => Number(x.trim()))
      const truthMatch = b.prompt.match(/true weight is \*\*(\d+)\*\*/)
      expect(truthMatch, `variant ${i}: expected the true value`).toBeTruthy()
      const truth = Number(truthMatch![1])
      const top = Math.max(...guesses)
      const answer = b.answer as { type: string; answer: number }
      expect(answer.type).toBe('numeric')
      expect(answer.answer, `variant ${i}`).toBe(top - truth)
      // The point of the item: the highest guess is above the truth.
      expect(top, `variant ${i}: the highest estimate must actually overshoot`).toBeGreaterThan(truth)
    }
  })

  it('the auction item always makes the winner the highest estimate', () => {
    for (const [i, b] of variants('gtd-winners-curse').entries()) {
      const list = b.prompt.match(/turn out to be: \*\*([\d, ]+)\*\*/)
      expect(list, `variant ${i}: expected the estimate list`).toBeTruthy()
      const guesses = list![1].split(',').map((x) => Number(x.trim()))
      const winner = b.prompt.match(/guessed \*\*(\d+)\*\*/)
      expect(winner, `variant ${i}`).toBeTruthy()
      expect(Number(winner![1]), `variant ${i}: the winner must be the top estimate`).toBe(Math.max(...guesses))
      expect(correctText(b)).toContain('overpaid')
    }
  })
})

describe('the commons arithmetic is right', () => {
  it('states an individual gain and a collective loss from the same numbers', () => {
    for (const [i, b] of variants('gtd-commons', 20).entries()) {
      const gain = Number(b.prompt.match(/worth \*\*\+(\d+)\*\*/)![1])
      const each = Number(b.prompt.match(/costs \*\*(\d+)\*\*/)![1])
      const n = Number(b.prompt.match(/every one of the \*\*?(\d+)/)?.[1] ?? 6)
      const answer = b.answer as { type: string; options: string[]; correct: number[] }
      expect(answer.type).toBe('multi')
      const keys = answer.correct.map((k) => answer.options[k])
      // The two numbers the item turns on, re-derived here.
      expect(keys.join(' '), `variant ${i}: individual net ${gain - each}`).toContain(String(gain - each))
      expect(keys.join(' '), `variant ${i}: collective net ${gain - each * n}`).toContain(String(gain - each * n))
      // And the shape has to hold, or the item teaches nothing.
      expect(gain - each, `variant ${i}: taking must pay the individual`).toBeGreaterThan(0)
      expect(gain - each * n, `variant ${i}: taking must cost the group`).toBeLessThan(0)
    }
  })
})

describe('the unpredictability item is arithmetically honest', () => {
  it('scores exactly the rounds spent on the uncovered side', () => {
    for (const [i, b] of variants('gtd-unpredictable', 32).entries()) {
      const m = b.prompt.match(/\*\* (\d+) times and \*\*[^*]+\*\* (\d+) times/)
      expect(m, `variant ${i}: expected both counts`).toBeTruthy()
      const right = Number(m![2])
      const answer = b.answer as { type: string; answer: number }
      expect(answer.type).toBe('numeric')
      expect(answer.answer, `variant ${i}`).toBe(right)
    }
  })
})
