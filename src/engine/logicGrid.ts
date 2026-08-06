/**
 * Logic-grid (Zebra-style) puzzle engine with a brute-force solver used by
 * the content audit to prove every authored puzzle has exactly one solution
 * and that the stored solution satisfies every clue.
 */
import type { LogicClueSpec, LogicGridSpec } from '../domain/types'

/** assignment[c-1][k] = value index in category c for key k. */
export type Assignment = number[][]

/** Which key entity holds (cat, val)? cat 0 → val IS the key. -1 if none. */
function entityOf(assignment: Assignment, cat: number, val: number): number {
  if (cat === 0) return val
  const perm = assignment[cat - 1]
  for (let k = 0; k < perm.length; k++) if (perm[k] === val) return k
  return -1
}

export function clueHolds(spec: LogicClueSpec, assignment: Assignment): boolean {
  switch (spec.kind) {
    case 'is':
      return assignment[spec.cat - 1][spec.key] === spec.val
    case 'not':
      return assignment[spec.cat - 1][spec.key] !== spec.val
    case 'link': {
      const a = entityOf(assignment, spec.cat1, spec.val1)
      const b = entityOf(assignment, spec.cat2, spec.val2)
      return a !== -1 && a === b
    }
    case 'notlink': {
      const a = entityOf(assignment, spec.cat1, spec.val1)
      const b = entityOf(assignment, spec.cat2, spec.val2)
      return a === -1 || b === -1 || a !== b
    }
    case 'order': {
      const a = entityOf(assignment, spec.less.cat, spec.less.val)
      const b = entityOf(assignment, spec.greater.cat, spec.greater.val)
      if (a === -1 || b === -1) return false
      const av = assignment[spec.catOrd - 1][a]
      const bv = assignment[spec.catOrd - 1][b]
      return av < bv
    }
  }
}

export function allCluesHold(puzzle: LogicGridSpec, assignment: Assignment): boolean {
  return puzzle.clues.every((c) => clueHolds(c.spec, assignment))
}

function* permutations(n: number): Generator<number[]> {
  const arr = Array.from({ length: n }, (_, i) => i)
  function* permute(k: number): Generator<number[]> {
    if (k === arr.length) {
      yield arr.slice()
      return
    }
    for (let i = k; i < arr.length; i++) {
      ;[arr[k], arr[i]] = [arr[i], arr[k]]
      yield* permute(k + 1)
      ;[arr[k], arr[i]] = [arr[i], arr[k]]
    }
  }
  yield* permute(0)
}

/** Count solutions (early-exit above `cap`). Feasible for n ≤ 5, ≤ 3 non-key cats. */
export function countSolutions(puzzle: LogicGridSpec, cap = 2): { count: number; first: Assignment | null } {
  const n = puzzle.values[0].length
  const nonKey = puzzle.categories.length - 1
  let count = 0
  let first: Assignment | null = null
  const perms: number[][][] = []
  for (let c = 0; c < nonKey; c++) perms.push([...permutations(n)])
  const idx = new Array(nonKey).fill(0)
  const total = perms.reduce((a, p) => a * p.length, 1)
  for (let i = 0; i < total; i++) {
    let rem = i
    const assignment: Assignment = []
    for (let c = 0; c < nonKey; c++) {
      assignment.push(perms[c][rem % perms[c].length])
      rem = Math.floor(rem / perms[c].length)
    }
    void idx
    if (allCluesHold(puzzle, assignment)) {
      count++
      if (!first) first = assignment.map((p) => p.slice())
      if (count >= cap) return { count, first }
    }
  }
  return { count, first }
}

/** Audit helper: unique solution AND it equals the stored one. */
export function puzzleValid(puzzle: LogicGridSpec): { ok: boolean; reason: string } {
  const n = puzzle.values[0].length
  if (!puzzle.values.every((v) => v.length === n)) return { ok: false, reason: 'ragged values' }
  if (puzzle.solution.length !== puzzle.categories.length - 1)
    return { ok: false, reason: 'solution shape mismatch' }
  const { count, first } = countSolutions(puzzle, 2)
  if (count === 0) return { ok: false, reason: 'no solution satisfies the clues' }
  if (count > 1) return { ok: false, reason: 'solution is not unique' }
  const matches =
    first !== null &&
    first.every((perm, c) => perm.every((v, k) => v === puzzle.solution[c][k]))
  if (!matches) return { ok: false, reason: 'stored solution differs from solver result' }
  return { ok: true, reason: 'ok' }
}

/** Runtime check of a user assignment (complete + equals unique solution). */
export function assignmentCorrect(puzzle: LogicGridSpec, assignment: Assignment): boolean {
  return puzzle.solution.every((perm, c) => perm.every((v, k) => assignment[c]?.[k] === v))
}
