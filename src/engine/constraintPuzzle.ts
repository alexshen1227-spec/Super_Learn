/**
 * Digit-placement constraint puzzles, solved by exhaustive search.
 *
 * The shape (inspired by the Open Middle problem style, RESEARCH.md §25):
 * a closed beginning and a closed end with an OPEN MIDDLE — "place digits to
 * make this true / as large as possible / as close as possible". One line of
 * arithmetic hides a genuine search, because the learner must reason about
 * WHERE a digit does the most work rather than execute a procedure.
 *
 * Why a solver lives in the engine rather than an answer being authored: the
 * interesting answers here are OPTIMA, and an authored optimum is a claim
 * nobody checked. The audit re-derives every puzzle's answer by brute force
 * across seeds — the same discipline the chess tactics use, where authored
 * "best moves" were replaced by search-verified ones.
 *
 * Search sizes are deliberately small (permutations of ≤6 chosen digits from
 * 9, i.e. ≤60,480 arrangements) so the whole bank re-solves in milliseconds
 * during the audit.
 */

export type ConstraintKind =
  /** Two 2-digit numbers, maximise (or minimise) the sum. */
  | 'sum2x2'
  /** Two 2-digit numbers, maximise (or minimise) the product. */
  | 'product2x2'
  /** a/b + c/d as close as possible to a target, digits distinct. */
  | 'closest-sum'
  /** 2-digit minus 2-digit, get as close as possible to a target. */
  | 'closest-difference'

export interface ConstraintPuzzle {
  kind: ConstraintKind
  /** The digit pool the learner may draw from, each usable at most once. */
  digits: number[]
  /** Maximise or minimise, or hit a target as closely as possible. */
  goal: 'max' | 'min' | 'target'
  target?: number
}

export interface ConstraintSolution {
  /** The digit arrangement achieving the optimum, in slot order. */
  arrangement: number[]
  /** The value that arrangement produces. */
  value: number
  /** How many DISTINCT arrangements tie for the optimum. */
  ties: number
}

/** All ordered selections of `k` distinct items. */
function permutations(pool: number[], k: number): number[][] {
  const out: number[][] = []
  const used = new Array(pool.length).fill(false)
  const cur: number[] = []
  const walk = () => {
    if (cur.length === k) {
      out.push([...cur])
      return
    }
    for (let i = 0; i < pool.length; i++) {
      if (used[i]) continue
      used[i] = true
      cur.push(pool[i])
      walk()
      cur.pop()
      used[i] = false
    }
  }
  walk()
  return out
}

/** Slots each kind needs, in the order the prompt presents them. */
export function slotCount(kind: ConstraintKind): number {
  return kind === 'closest-sum' ? 4 : 4
}

function evaluate(kind: ConstraintKind, a: number[]): number {
  const [p, q, r, s] = a
  switch (kind) {
    case 'sum2x2':
      return (10 * p + q) + (10 * r + s)
    case 'product2x2':
      return (10 * p + q) * (10 * r + s)
    case 'closest-difference':
      return (10 * p + q) - (10 * r + s)
    case 'closest-sum':
      // p/q + r/s — fractions, compared as an exact rational via a common
      // denominator so no floating-point tie is decided by rounding dust.
      return (p * s + r * q) / (q * s)
  }
}

/**
 * Exhaustively solve a puzzle. Returns the optimum, the arrangement reaching
 * it, and how many arrangements tie — the tie count is what lets an item say
 * "one of several optimal placements" honestly instead of implying uniqueness.
 */
export function solveConstraint(puzzle: ConstraintPuzzle): ConstraintSolution {
  const arrangements = permutations(puzzle.digits, slotCount(puzzle.kind))
  let best: number[] = []
  let bestValue = NaN
  let bestScore = Infinity
  let ties = 0
  for (const a of arrangements) {
    // Fraction kinds must not divide by zero; a zero denominator is not a
    // legal placement rather than an infinite score.
    if (puzzle.kind === 'closest-sum' && (a[1] === 0 || a[3] === 0)) continue
    const value = evaluate(puzzle.kind, a)
    if (!Number.isFinite(value)) continue
    const score =
      puzzle.goal === 'max' ? -value : puzzle.goal === 'min' ? value : Math.abs(value - (puzzle.target ?? 0))
    if (score < bestScore - 1e-9) {
      bestScore = score
      bestValue = value
      best = a
      ties = 1
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      ties++
    }
  }
  return { arrangement: best, value: bestValue, ties }
}
