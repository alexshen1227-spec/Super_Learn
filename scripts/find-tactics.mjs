// Searches for VERIFIED chess tactic positions (mate-in-1 / forced mate-in-2)
// by sampling piece placements and exhaustively checking with chess.js.
// Output: JSON lines to curate into src/content/items/chessTactics.ts.
import { Chess } from 'chess.js'

const FILES = 'abcdefgh'
const sq = (f, r) => FILES[f] + (r + 1)

function rand(n) {
  return Math.floor(Math.random() * n)
}

function matingMoves(game) {
  const out = []
  for (const m of game.moves()) {
    game.move(m)
    if (game.isCheckmate()) out.push(m)
    game.undo()
  }
  return out
}

function hasMate1(game) {
  return matingMoves(game).length > 0
}

/** White to move: moves that FORCE mate on white's 2nd move (and no immediate mate exists). */
function mate2Keys(game) {
  const keys = []
  for (const m of game.moves()) {
    game.move(m)
    if (game.isCheckmate()) {
      game.undo()
      return [] // it's a mate-in-1 position; caller filters
    }
    if (!game.isStalemate() && !game.isDraw()) {
      const replies = game.moves()
      let forced = replies.length > 0
      for (const r of replies) {
        game.move(r)
        if (!hasMate1(game)) forced = false
        game.undo()
        if (!forced) break
      }
      if (forced) keys.push(m)
    }
    game.undo()
  }
  return keys
}

function tryPosition(pieces) {
  // pieces: [{p:'K'|'Q'|..., color, square}]
  const board = {}
  for (const pc of pieces) {
    if (board[pc.square]) return null
    board[pc.square] = pc
  }
  // build FEN
  let fen = ''
  for (let r = 7; r >= 0; r--) {
    let empty = 0
    for (let f = 0; f < 8; f++) {
      const pc = board[sq(f, r)]
      if (!pc) empty++
      else {
        if (empty) fen += empty
        empty = 0
        fen += pc.color === 'w' ? pc.p.toUpperCase() : pc.p.toLowerCase()
      }
    }
    if (empty) fen += empty
    fen += r > 0 ? '/' : ''
  }
  fen += ' w - - 0 1'
  let game
  try {
    game = new Chess(fen)
  } catch {
    return null
  }
  // Black must not already be in check (illegal with white to move).
  const flipped = fen.replace(' w ', ' b ')
  try {
    const gb = new Chess(flipped)
    if (gb.isCheck()) return null
  } catch {
    return null
  }
  if (game.isCheck()) return null // avoid starting-in-check puzzles
  return { fen, game }
}

function kingsAdjacent(a, b) {
  const df = Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0]))
  const dr = Math.abs(Number(a[1]) - Number(b[1]))
  return df <= 1 && dr <= 1
}

const CONFIGS = [
  // Back-rank flavored: black king g8/h8 with pawn shield, white heavy pieces.
  () => {
    const bk = ['g8', 'h8'][rand(2)]
    const shield = [
      { p: 'p', color: 'b', square: 'f7' },
      { p: 'p', color: 'b', square: 'g7' },
      { p: 'p', color: 'b', square: 'h7' },
    ].filter(() => Math.random() < 0.9)
    const wk = sq(rand(8), rand(3))
    const heavy = ['q', 'r'][rand(2)]
    const w1 = sq(rand(8), rand(7))
    const extras = []
    if (Math.random() < 0.5) extras.push({ p: 'r', color: 'w', square: sq(rand(8), rand(7)) })
    if (Math.random() < 0.3) extras.push({ p: 'r', color: 'b', square: sq(rand(8), 7) })
    return [
      { p: 'k', color: 'b', square: bk },
      ...shield,
      { p: 'k', color: 'w', square: wk },
      { p: heavy, color: 'w', square: w1 },
      ...extras,
    ]
  },
  // King hunt: bare black king on edge, white K + Q (+ optional minor).
  () => {
    const edge = []
    for (let i = 0; i < 8; i++) {
      edge.push(sq(i, 7), sq(i, 0), sq(0, i), sq(7, i))
    }
    const bk = edge[rand(edge.length)]
    const wk = sq(rand(8), rand(8))
    const pieces = [
      { p: 'k', color: 'b', square: bk },
      { p: 'k', color: 'w', square: wk },
      { p: 'q', color: 'w', square: sq(rand(8), rand(8)) },
    ]
    if (Math.random() < 0.4) pieces.push({ p: ['n', 'b'][rand(2)], color: 'w', square: sq(rand(8), rand(8)) })
    return pieces
  },
  // Two rooks vs king.
  () => [
    { p: 'k', color: 'b', square: sq(rand(8), rand(2) === 0 ? 7 : 0) },
    { p: 'k', color: 'w', square: sq(rand(8), 2 + rand(4)) },
    { p: 'r', color: 'w', square: sq(rand(8), rand(8)) },
    { p: 'r', color: 'w', square: sq(rand(8), rand(8)) },
  ],
  // Smothered-ish: black king h8/g8 boxed by own pieces, white N + Q.
  () => {
    const bk = 'h8'
    const pieces = [
      { p: 'k', color: 'b', square: bk },
      { p: 'r', color: 'b', square: 'g8' },
      { p: 'p', color: 'b', square: 'g7' },
      { p: 'p', color: 'b', square: 'h7' },
      { p: 'k', color: 'w', square: sq(rand(8), rand(3)) },
      { p: 'n', color: 'w', square: sq(rand(8), 3 + rand(5)) },
    ]
    if (Math.random() < 0.6) pieces.push({ p: 'q', color: 'w', square: sq(rand(8), rand(8)) })
    return pieces
  },
]

const found = { m1: [], m2: [] }
const seen = new Set()
const TRIES = 250000

for (let i = 0; i < TRIES && (found.m1.length < 40 || found.m2.length < 30); i++) {
  const config = CONFIGS[rand(CONFIGS.length)]
  const pieces = config()
  const kings = pieces.filter((p) => p.p === 'k')
  if (kings.length !== 2 || kingsAdjacent(kings[0].square, kings[1].square)) continue
  const pos = tryPosition(pieces)
  if (!pos || seen.has(pos.fen)) continue
  const m1 = matingMoves(pos.game)
  if (m1.length > 0) {
    if (found.m1.length < 40) {
      seen.add(pos.fen)
      found.m1.push({ fen: pos.fen, keys: m1, pieces: pieces.length })
    }
    continue
  }
  if (found.m2.length < 30 && pieces.length <= 8) {
    const keys = mate2Keys(pos.game)
    // Prefer instructive positions: few key moves (forcing, not trivial).
    if (keys.length >= 1 && keys.length <= 3) {
      seen.add(pos.fen)
      found.m2.push({ fen: pos.fen, keys, pieces: pieces.length })
    }
  }
}

console.log('MATE IN 1 (' + found.m1.length + '):')
for (const f of found.m1) console.log(JSON.stringify(f))
console.log('MATE IN 2 (' + found.m2.length + '):')
for (const f of found.m2) console.log(JSON.stringify(f))
