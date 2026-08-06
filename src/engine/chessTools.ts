/**
 * Chess tactic validation on top of chess.js (battle-tested legal move
 * generation: castling, en passant, pins, promotion — all handled).
 *
 * Mate goals are verified by exhaustive search, so the player is credited for
 * ANY move that keeps the forced mate, not only the authored line. Exact-move
 * ("line") tactics accept only the listed continuation.
 */
import { Chess } from 'chess.js'

export type { Square } from 'chess.js'

export function legalFen(fen: string): boolean {
  try {
    new Chess(fen)
    return true
  } catch {
    return false
  }
}

/** All SAN moves that give immediate checkmate. */
export function matingMoves(fen: string): string[] {
  const out: string[] = []
  const game = new Chess(fen)
  for (const m of game.moves()) {
    game.move(m)
    if (game.isCheckmate()) out.push(m)
    game.undo()
  }
  return out
}

/** Does the side to move have a forced mate in ≤ plies half-moves (own moves counted)? */
function hasForcedMate(game: Chess, ownMovesLeft: number): boolean {
  if (ownMovesLeft <= 0) return false
  for (const m of game.moves()) {
    game.move(m)
    if (game.isCheckmate()) {
      game.undo()
      return true
    }
    if (ownMovesLeft > 1 && !game.isDraw() && !game.isStalemate()) {
      // every opponent reply must allow us to continue the mate
      const replies = game.moves()
      let allRefuted = replies.length > 0
      for (const r of replies) {
        game.move(r)
        const ok = hasForcedMate(game, ownMovesLeft - 1)
        game.undo()
        if (!ok) {
          allRefuted = false
          break
        }
      }
      if (allRefuted) {
        game.undo()
        return true
      }
    }
    game.undo()
  }
  return false
}

/** SAN moves that keep a forced mate within `ownMoves` of the mover's moves. */
export function movesKeepingMate(fen: string, ownMoves: number): string[] {
  const game = new Chess(fen)
  const out: string[] = []
  for (const m of game.moves()) {
    game.move(m)
    if (game.isCheckmate()) {
      out.push(m)
      game.undo()
      continue
    }
    if (ownMoves > 1 && !game.isStalemate() && !game.isDraw()) {
      const replies = game.moves()
      let forced = replies.length > 0
      for (const r of replies) {
        game.move(r)
        if (!hasForcedMate(game, ownMoves - 1)) forced = false
        game.undo()
        if (!forced) break
      }
      if (forced) out.push(m)
    }
    game.undo()
  }
  return out
}

export function isForcedMate(fen: string, ownMoves: number): boolean {
  return movesKeepingMate(fen, ownMoves).length > 0
}

/**
 * Opponent's most resilient defense after the player's correct key move in a
 * mate-in-2: prefer a reply that leaves the fewest immediate mating answers
 * (fights hardest), breaking ties deterministically by SAN order.
 */
export function toughestReply(fen: string): string | null {
  const game = new Chess(fen)
  const replies = game.moves().sort()
  if (!replies.length) return null
  let best: string | null = null
  let bestCount = Infinity
  for (const r of replies) {
    game.move(r)
    const mates = matingMoves(game.fen()).length
    game.undo()
    if (mates < bestCount) {
      bestCount = mates
      best = r
    }
  }
  return best
}

/** Apply a SAN move to a FEN; returns the new FEN or null when illegal. */
export function applySan(fen: string, san: string): string | null {
  const game = new Chess(fen)
  try {
    game.move(san)
    return game.fen()
  } catch {
    return null
  }
}

export interface BoardCell {
  square: string
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  color: 'w' | 'b'
}

/** 8×8 board (rank 8 first), for rendering. */
export function boardOf(fen: string): (BoardCell | null)[][] {
  return new Chess(fen).board() as (BoardCell | null)[][]
}

export function turnOf(fen: string): 'w' | 'b' {
  return new Chess(fen).turn()
}

/** Legal destination squares from a square (for tap-to-move UI). */
export function movesFrom(fen: string, square: string): { to: string; san: string }[] {
  const game = new Chess(fen)
  return game
    .moves({ square: square as never, verbose: true })
    .map((m) => ({ to: m.to as string, san: m.san }))
}

export function isCheckmateFen(fen: string): boolean {
  return new Chess(fen).isCheckmate()
}

export function isCheckFen(fen: string): boolean {
  return new Chess(fen).isCheck()
}
