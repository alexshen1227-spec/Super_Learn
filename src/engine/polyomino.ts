/**
 * Polyomino assembly puzzle model. Pure geometry — the UI layers pointer and
 * keyboard interaction on top. Puzzles are authored as SOLVED layouts, so
 * solvability is guaranteed by construction and completion detection is
 * deterministic (every region cell covered, no overlap, all inside).
 */
import type { PolyominoSpec } from '../domain/types'

export type Cell = [number, number]

export interface Placement {
  x: number
  y: number
  rot: 0 | 1 | 2 | 3
}

/** Rotate a cell 90° clockwise `rot` times, then normalize to min (0,0). */
export function rotateCells(cells: Cell[], rot: number): Cell[] {
  let out = cells.map(([x, y]) => [x, y] as Cell)
  for (let r = 0; r < ((rot % 4) + 4) % 4; r++) {
    out = out.map(([x, y]) => [-y, x] as Cell)
  }
  const minX = Math.min(...out.map(([x]) => x))
  const minY = Math.min(...out.map(([, y]) => y))
  return out
    .map(([x, y]) => [x - minX, y - minY] as Cell)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

/** Absolute cells occupied by a piece at a placement. */
export function occupiedCells(cells: Cell[], p: Placement): Cell[] {
  return rotateCells(cells, p.rot).map(([x, y]) => [x + p.x, y + p.y])
}

export function cellKey(c: Cell): string {
  return `${c[0]},${c[1]}`
}

export interface FitResult {
  ok: boolean
  reason: 'ok' | 'outside' | 'overlap'
}

/** Can `pieceId` sit at `p` given other current placements? */
export function fits(
  spec: PolyominoSpec,
  pieceId: string,
  p: Placement,
  placed: Record<string, Placement>,
): FitResult {
  const region = new Set(spec.region)
  const piece = spec.pieces.find((pc) => pc.id === pieceId)
  if (!piece) return { ok: false, reason: 'outside' }
  const mine = occupiedCells(piece.cells, p)
  for (const c of mine) if (!region.has(cellKey(c))) return { ok: false, reason: 'outside' }
  const taken = new Set<string>()
  for (const [id, pl] of Object.entries(placed)) {
    if (id === pieceId) continue
    const other = spec.pieces.find((pc) => pc.id === id)
    if (!other) continue
    for (const c of occupiedCells(other.cells, pl)) taken.add(cellKey(c))
  }
  for (const c of mine) if (taken.has(cellKey(c))) return { ok: false, reason: 'overlap' }
  return { ok: true, reason: 'ok' }
}

/** Puzzle complete = every region cell covered exactly once by placed pieces. */
export function isComplete(spec: PolyominoSpec, placed: Record<string, Placement>): boolean {
  const covered = new Set<string>()
  for (const [id, pl] of Object.entries(placed)) {
    const piece = spec.pieces.find((pc) => pc.id === id)
    if (!piece) return false
    for (const c of occupiedCells(piece.cells, pl)) {
      const k = cellKey(c)
      if (covered.has(k)) return false
      covered.add(k)
    }
  }
  if (covered.size !== spec.region.length) return false
  return spec.region.every((k) => covered.has(k))
}

/** Verify the authored solution actually solves the puzzle (content audit). */
export function solutionValid(spec: PolyominoSpec): boolean {
  const placed: Record<string, Placement> = {}
  for (const piece of spec.pieces) {
    const sol = spec.solution[piece.id]
    if (!sol) return false
    const p: Placement = { x: sol.x, y: sol.y, rot: (((sol.rot % 4) + 4) % 4) as Placement['rot'] }
    if (!fits(spec, piece.id, p, placed).ok) return false
    placed[piece.id] = p
  }
  return isComplete(spec, placed)
}

/** Bounding box of the region, for rendering. */
export function regionBounds(spec: PolyominoSpec): { minX: number; minY: number; w: number; h: number } {
  const cells = spec.region.map((k) => k.split(',').map(Number) as Cell)
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  const maxX = Math.max(...cells.map(([x]) => x))
  const maxY = Math.max(...cells.map(([, y]) => y))
  return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Build a spec from a solved layout drawing: rows of characters where each
 * distinct letter is a piece and '.' is empty. Guarantees solvable content.
 */
export function specFromDrawing(rows: string[], colors: Record<string, number>, allowRotation = true): PolyominoSpec {
  const byPiece = new Map<string, Cell[]>()
  const region: string[] = []
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      region.push(cellKey([x, y]))
      const arr = byPiece.get(ch) ?? []
      arr.push([x, y])
      byPiece.set(ch, arr)
    })
  })
  const pieces = [...byPiece.entries()].map(([id, cells]) => {
    const minX = Math.min(...cells.map(([x]) => x))
    const minY = Math.min(...cells.map(([, y]) => y))
    return {
      id,
      cells: rotateCells(
        cells.map(([x, y]) => [x - minX, y - minY] as Cell),
        0,
      ),
      color: colors[id] ?? 0,
    }
  })
  const solution: Record<string, { x: number; y: number; rot: number }> = {}
  for (const [id, cells] of byPiece.entries()) {
    solution[id] = {
      x: Math.min(...cells.map(([x]) => x)),
      y: Math.min(...cells.map(([, y]) => y)),
      rot: 0,
    }
  }
  return { region, pieces, solution, allowRotation }
}
