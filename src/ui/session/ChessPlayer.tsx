/**
 * Chess tactic player: tap-to-move board with legal-move validation via
 * chess.js. Mate goals accept ANY move preserving the forced mate (verified
 * by search); line tactics accept exactly the authored continuation.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AttemptMode, ItemTemplate, RenderedItem } from '../../domain/types'
import {
  applySan,
  boardOf,
  isCheckmateFen,
  matingMoves,
  movesFrom,
  movesKeepingMate,
  toughestReply,
  turnOf,
} from '../../engine/chessTools'
import type { ActivityRecord } from '../../store/draft'
import { Button, Card, Chip, Modal } from '../components'
import { Rich } from '../richtext'
import { IconHint } from '../icons'
import type { ActivityResult } from './SessionScreen'

const GLYPH: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
}

interface ChessProgress {
  fen: string
  plyDone: number
  firstMove: string | null
  missCount: number
  solved: boolean
}

export function ChessPlayer({
  item,
  template,
  mode,
  record,
  onSnapshot,
  onFinish,
  onContinue,
}: {
  item: RenderedItem
  template: ItemTemplate
  mode: AttemptMode
  record: ActivityRecord
  askConfidence: boolean
  onSnapshot: (r: Partial<ActivityRecord>) => void
  onFinish: (result: ActivityResult, elapsedSec: number) => void
  onContinue: () => void
}) {
  const spec = item.chess!
  const saved = (record.extra as ChessProgress | null) ?? null
  const [progress, setProgress] = useState<ChessProgress>(
    saved ?? { fen: spec.fen, plyDone: 0, firstMove: null, missCount: 0, solved: false },
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [hintsShown, setHintsShown] = useState(record.hintsUsed ?? 0)
  const [hintOpen, setHintOpen] = useState(false)
  const [flipped] = useState(turnOf(spec.fen) === 'b')
  const finished = useRef(false)
  const activeSec = useRef(record.elapsedSec ?? 0)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') activeSec.current += 1
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const board = useMemo(() => boardOf(progress.fen), [progress.fen])
  const myTurn = turnOf(progress.fen) === turnOf(spec.fen)
  const legalTargets = useMemo(
    () => (selected ? movesFrom(progress.fen, selected).map((m) => m.to) : []),
    [selected, progress.fen],
  )

  const persist = (p: ChessProgress) => {
    setProgress(p)
    onSnapshot({ extra: p, hintsUsed: hintsShown })
  }

  const complete = (p: ChessProgress) => {
    if (finished.current) return
    finished.current = true
    onFinish(
      {
        firstResponse: p.firstMove ?? '',
        finalResponse: `${spec.line[0]} line completed`,
        correct: true,
        firstCorrect: p.missCount === 0 && hintsShown === 0,
        score: null,
        hintLevel: hintsShown,
        confidence: null,
        errorTag: p.missCount > 0 ? 'strategy' : null,
        validator: `chess-${spec.goal}`,
      },
      activeSec.current,
    )
    persist({ ...p, solved: true })
  }

  const tryMove = (from: string, to: string) => {
    const candidates = movesFrom(progress.fen, from).filter((m) => m.to === to)
    if (!candidates.length) return
    // auto-queen on promotion: prefer the SAN containing '=Q' if present
    const san = candidates.find((c) => c.san.includes('=Q'))?.san ?? candidates[0].san
    setSelected(null)

    const firstMove = progress.firstMove ?? san
    if (spec.goal === 'line') {
      const expected = spec.line[progress.plyDone]
      if (san.replace(/[+#]/g, '') !== expected.replace(/[+#]/g, '')) {
        setMessage(`Not ${san} — in this position there is a stronger idea. (${spec.theme})`)
        persist({ ...progress, firstMove, missCount: progress.missCount + 1 })
        return
      }
      let fen = applySan(progress.fen, san)!
      let ply = progress.plyDone + 1
      // engine plays the scripted reply
      if (ply < spec.line.length) {
        const replyFen = applySan(fen, spec.line[ply])
        if (replyFen) {
          fen = replyFen
          ply++
        }
      }
      const done = ply >= spec.line.length
      const next = { ...progress, fen, plyDone: ply, firstMove }
      if (done) {
        setMessage(null)
        complete(next)
      } else {
        setMessage('Good — continue the sequence.')
        persist(next)
      }
      return
    }

    // mate goals
    const ownMovesLeft = spec.goal === 'mate1' ? 1 : progress.plyDone === 0 ? 2 : 1
    const keeping = ownMovesLeft === 1 ? matingMoves(progress.fen) : movesKeepingMate(progress.fen, 2)
    const bare = (s: string) => s.replace(/[+#]/g, '')
    if (!keeping.map(bare).includes(bare(san))) {
      const fenAfter = applySan(progress.fen, san)
      const note =
        fenAfter && isCheckmateFen(fenAfter)
          ? null // actually mate (should be in list, safety)
          : spec.goal === 'mate2' && progress.plyDone === 0
            ? 'That move lets the defense escape the forced mate. Look for the most forcing continuation.'
            : 'Not mate — the king still has a resource. Check every escape square, block, and capture.'
      if (note) {
        setMessage(note)
        persist({ ...progress, firstMove, missCount: progress.missCount + 1 })
        return
      }
    }
    let fen = applySan(progress.fen, san)!
    let ply = progress.plyDone + 1
    if (isCheckmateFen(fen)) {
      setMessage(null)
      complete({ ...progress, fen, plyDone: ply, firstMove })
      return
    }
    // mate-in-2: engine plays the toughest defense, then it's mate-in-1 for you
    const reply = toughestReply(fen)
    if (reply) {
      fen = applySan(fen, reply)!
      ply++
      setMessage(`Defense: ${reply}. Now finish it.`)
    }
    persist({ ...progress, fen, plyDone: ply, firstMove })
  }

  const onSquareTap = (sq: string, piece: { color: string } | null) => {
    if (progress.solved || !myTurn) return
    if (selected && legalTargets.includes(sq)) {
      tryMove(selected, sq)
      return
    }
    if (piece && piece.color === turnOf(spec.fen)) {
      setSelected(sq === selected ? null : sq)
    } else {
      setSelected(null)
    }
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]

  return (
    <div className="max-w-xl mx-auto anim-in pb-6">
      <div className="flex items-center gap-2 mt-4 mb-2 flex-wrap">
        <Chip tone="accent">{spec.theme}</Chip>
        <Chip tone="neutral">{turnOf(spec.fen) === 'w' ? 'White' : 'Black'} to move</Chip>
        {mode === 'review' ? <Chip tone="warn">review</Chip> : null}
      </div>
      <Card className="p-4">
        <Rich text={item.prompt} className="text-[15px]" />
      </Card>

      <div className="mt-4 mx-auto w-full max-w-[420px] select-none" role="grid" aria-label="Chess board">
        <div className="grid grid-cols-8 rounded-xl overflow-hidden border-2 border-line-strong">
          {ranks.map((r) =>
            files.map((f, fi) => {
              const sq = `${f}${r}`
              const cell = board[8 - r][fi]
              const dark = (fi + r) % 2 === 0
              const isSel = selected === sq
              const isTarget = legalTargets.includes(sq)
              return (
                <button
                  type="button"
                  key={sq}
                  role="gridcell"
                  aria-label={`${sq}${cell ? ` ${cell.color === 'w' ? 'white' : 'black'} ${cell.type}` : ''}`}
                  onClick={() => onSquareTap(sq, cell)}
                  className={`aspect-square relative grid place-items-center text-[min(7.2vw,34px)] leading-none transition-colors
                    ${dark ? 'bg-[#8a9bb8] dark:bg-[#3d4f6e]' : 'bg-[#e8ecf3] dark:bg-[#8fa2c0]'}
                    ${isSel ? '!bg-accent/70' : ''}`}
                >
                  {isTarget ? (
                    <span
                      className={`absolute inset-0 grid place-items-center pointer-events-none ${cell ? '' : ''}`}
                      aria-hidden
                    >
                      {cell ? (
                        <span className="absolute inset-1 rounded-full border-[3px] border-accent/80" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full bg-accent/80" />
                      )}
                    </span>
                  ) : null}
                  <span className={cell?.color === 'w' ? 'text-white drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.55)]' : 'text-[#161a22] drop-shadow-[0_1px_1px_rgba(255,255,255,0.25)]'}>
                    {cell ? GLYPH[`${cell.color}${cell.type}`] : ''}
                  </span>
                </button>
              )
            }),
          )}
        </div>
        <p className="text-[11px] text-faint mt-1.5 text-center">Tap a piece, then its destination. Legal moves are shown.</p>
      </div>

      {message ? (
        <Card className="mt-3 p-3 border-warn/40">
          <p className="text-[14px] text-muted">{message}</p>
        </Card>
      ) : null}

      {progress.solved ? (
        <div className="anim-in">
          <Card className="mt-3 p-4 border-good/40">
            <p className="font-semibold text-good text-[15px]">
              {progress.missCount === 0 && hintsShown === 0 ? 'Solved clean — first try, no hints.' : 'Solved.'}
            </p>
            <div className="mt-3 pt-3 border-t border-line">
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1">The idea</p>
              <Rich text={spec.explanation} className="text-[15px]" />
            </div>
          </Card>
          {item.transferBridge ? (
            <Card className="p-4 mt-3 border-accent/30">
              <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Transfer bridge</p>
              <Rich text={item.transferBridge} className="text-[14px] text-muted" />
            </Card>
          ) : null}
          <Button className="w-full mt-4" onClick={onContinue}>
            Continue
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 mt-3">
          <Button
            kind="secondary"
            className="flex-1"
            onClick={() => {
              const next = Math.min(hintsShown + 1, item.hints.length)
              setHintsShown(next)
              onSnapshot({ hintsUsed: next })
              setHintOpen(true)
            }}
          >
            <IconHint size={17} /> Hint{hintsShown ? ` (${hintsShown})` : ''}
          </Button>
          <Button
            kind="ghost"
            className="flex-1"
            onClick={() => persist({ fen: spec.fen, plyDone: 0, firstMove: progress.firstMove, missCount: progress.missCount, solved: false })}
          >
            Reset position
          </Button>
        </div>
      )}

      <Modal open={hintOpen} onClose={() => setHintOpen(false)} title="Hints">
        <div className="space-y-2.5">
          {item.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="bg-surface2 border border-line rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] font-mono text-faint mb-0.5">hint {i + 1}</p>
              <Rich text={h} className="text-[14px]" />
            </div>
          ))}
        </div>
        <p className="text-[12px] text-faint mt-3">Hint use is recorded — a hinted solve counts as guided, not independent.</p>
      </Modal>
      <span className="sr-only" aria-live="polite">
        {message ?? ''}
      </span>
      <span className="hidden">{template.id}</span>
    </div>
  )
}
