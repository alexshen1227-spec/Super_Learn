/**
 * Spatial assembly player. Touch-first: drag pieces from the tray onto the
 * grid with live snapping; rotate the selected piece with a button (or R).
 * Full keyboard alternative: Tab/arrow selection, arrows move the ghost,
 * R rotates, Enter places, Backspace lifts. Completion is deterministic.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItemTemplate, RenderedItem } from '../../domain/types'
import {
  cellKey,
  fits,
  isComplete,
  occupiedCells,
  regionBounds,
  rotateCells,
  type Placement,
} from '../../engine/polyomino'
import type { ActivityRecord } from '../../store/draft'
import { Button, Card, Chip, HintLadder, TransferBridge } from '../components'
import { Rich } from '../richtext'
import { IconRotate } from '../icons'
import type { ActivityResult } from './SessionScreen'

const PIECE_COLORS = ['#22d3ee', '#4ade80', '#f5a524', '#c084fc', '#fb7185', '#60a5fa', '#facc15', '#34d399']

interface PolyProgress {
  placed: Record<string, Placement>
  rotations: Record<string, number>
  moves: number
  solved: boolean
}

export function PolyominoPlayer({
  item,
  template,
  record,
  onSnapshot,
  onFinish,
  onContinue,
}: {
  item: RenderedItem
  template: ItemTemplate
  mode: string
  record: ActivityRecord
  askConfidence: boolean
  onSnapshot: (r: Partial<ActivityRecord>) => void
  onFinish: (result: ActivityResult, elapsedSec: number) => void
  onContinue: () => void
}) {
  const spec = item.polyomino!
  const bounds = useMemo(() => regionBounds(spec), [spec])
  const saved = (record.extra as PolyProgress | null) ?? null
  const [placed, setPlaced] = useState<Record<string, Placement>>(saved?.placed ?? {})
  const [rotations, setRotations] = useState<Record<string, number>>(saved?.rotations ?? {})
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [drag, setDrag] = useState<{ id: string; px: number; py: number } | null>(null)
  const [moves, setMoves] = useState(saved?.moves ?? 0)
  const [solved, setSolved] = useState(saved?.solved ?? false)
  const [hintsShown, setHintsShown] = useState(record.hintsUsed ?? 0)
  const [message, setMessage] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const finished = useRef(false)
  const activeSec = useRef(record.elapsedSec ?? 0)

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') activeSec.current += 1
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const CELL = 42
  const regionSet = useMemo(() => new Set(spec.region), [spec.region])

  const persist = (p: Partial<PolyProgress>) => {
    const next: PolyProgress = { placed, rotations, moves, solved, ...p }
    onSnapshot({ extra: next, hintsUsed: hintsShown })
  }

  const rotOf = (id: string): Placement['rot'] => (((rotations[id] ?? 0) % 4) as Placement['rot'])

  const revealHint = () => {
    const next = Math.min(hintsShown + 1, item.hints.length)
    setHintsShown(next)
    onSnapshot({ hintsUsed: next })
  }

  const checkComplete = (nextPlaced: Record<string, Placement>) => {
    if (isComplete(spec, nextPlaced) && !finished.current) {
      finished.current = true
      setSolved(true)
      persist({ placed: nextPlaced, solved: true })
      onFinish(
        {
          firstResponse: `${moves + 1} placements`,
          finalResponse: 'solved',
          correct: true,
          firstCorrect: hintsShown === 0,
          score: null,
          hintLevel: hintsShown,
          confidence: null,
          errorTag: null,
          validator: 'polyomino',
        },
        activeSec.current,
      )
    }
  }

  const tryPlace = (id: string, x: number, y: number): boolean => {
    const p: Placement = { x, y, rot: rotOf(id) }
    const verdict = fits(spec, id, p, placed)
    if (!verdict.ok) {
      setMessage(verdict.reason === 'overlap' ? 'Overlaps another piece.' : 'That hangs outside the target region.')
      return false
    }
    const nextPlaced = { ...placed, [id]: p }
    setPlaced(nextPlaced)
    setMoves((m) => m + 1)
    setMessage(null)
    setSelectedPiece(null)
    setGhost(null)
    persist({ placed: nextPlaced, moves: moves + 1 })
    checkComplete(nextPlaced)
    return true
  }

  const lift = (id: string) => {
    if (solved) return
    const nextPlaced = { ...placed }
    delete nextPlaced[id]
    setPlaced(nextPlaced)
    setSelectedPiece(id)
    setGhost(null)
    persist({ placed: nextPlaced })
  }

  const rotateSelected = () => {
    if (!selectedPiece || !spec.allowRotation) return
    setRotations((r) => {
      const next = { ...r, [selectedPiece]: ((r[selectedPiece] ?? 0) + 1) % 4 }
      persist({ rotations: next })
      return next
    })
  }

  // pointer drag from tray or board
  const pointerToCell = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null
    const gx = Math.floor((clientX - rect.left) / CELL) + bounds.minX
    const gy = Math.floor((clientY - rect.top) / CELL) + bounds.minY
    return { x: gx, y: gy }
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d))
      const cell = pointerToCell(e.clientX, e.clientY)
      if (cell) setGhost(cell)
    }
    const up = (e: PointerEvent) => {
      const cell = pointerToCell(e.clientX, e.clientY)
      if (cell && drag) {
        tryPlace(drag.id, cell.x, cell.y)
      }
      setDrag(null)
      setGhost(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, placed, rotations, moves])

  // keyboard support
  const onKey = (e: React.KeyboardEvent) => {
    if (solved) return
    if (e.key.toLowerCase() === 'r') {
      rotateSelected()
      e.preventDefault()
      return
    }
    if (!selectedPiece) return
    const g = ghost ?? { x: bounds.minX, y: bounds.minY }
    if (e.key === 'ArrowLeft') setGhost({ x: g.x - 1, y: g.y })
    else if (e.key === 'ArrowRight') setGhost({ x: g.x + 1, y: g.y })
    else if (e.key === 'ArrowUp') setGhost({ x: g.x, y: g.y - 1 })
    else if (e.key === 'ArrowDown') setGhost({ x: g.x, y: g.y + 1 })
    else if (e.key === 'Enter' && ghost) tryPlace(selectedPiece, ghost.x, ghost.y)
    else return
    e.preventDefault()
  }

  const trayPieces = spec.pieces.filter((p) => !placed[p.id])
  const ghostCells =
    selectedPiece && ghost
      ? occupiedCells(spec.pieces.find((p) => p.id === selectedPiece)!.cells, { x: ghost.x, y: ghost.y, rot: rotOf(selectedPiece) })
      : []
  const ghostOk =
    selectedPiece && ghost ? fits(spec, selectedPiece, { x: ghost.x, y: ghost.y, rot: rotOf(selectedPiece) }, placed).ok : false

  return (
    <div className="max-w-xl mx-auto anim-in pb-6" onKeyDown={onKey}>
      <div className="flex items-center gap-2 mt-4 mb-2">
        <Chip tone="accent">Spatial assembly</Chip>
        <Chip tone="neutral">{spec.pieces.length} pieces</Chip>
      </div>
      <Card className="p-4">
        <Rich text={item.prompt} className="text-[15px]" />
      </Card>

      {/* board */}
      <div className="mt-4 overflow-x-auto scroll-thin pb-1">
        <div
          ref={gridRef}
          className="relative mx-auto touch-none"
          style={{ width: bounds.w * CELL, height: bounds.h * CELL }}
          aria-label="Puzzle board"
        >
          {/* region cells */}
          {[...regionSet].map((k) => {
            const [x, y] = k.split(',').map(Number)
            return (
              <div
                key={k}
                className="absolute border border-line bg-surface2"
                style={{ left: (x - bounds.minX) * CELL, top: (y - bounds.minY) * CELL, width: CELL, height: CELL }}
              />
            )
          })}
          {/* placed pieces */}
          {Object.entries(placed).map(([id, p]) => {
            const piece = spec.pieces.find((pc) => pc.id === id)!
            return occupiedCells(piece.cells, p).map((c) => (
              <button
                type="button"
                key={`${id}-${cellKey(c)}`}
                aria-label={`Piece ${id} at ${cellKey(c)} — tap to lift`}
                onClick={() => lift(id)}
                className="absolute rounded-[4px] border border-black/20"
                style={{
                  left: (c[0] - bounds.minX) * CELL + 1,
                  top: (c[1] - bounds.minY) * CELL + 1,
                  width: CELL - 2,
                  height: CELL - 2,
                  background: PIECE_COLORS[piece.color % PIECE_COLORS.length],
                  opacity: solved ? 1 : 0.92,
                }}
              />
            ))
          })}
          {/* ghost */}
          {ghostCells.map((c) => (
            <div
              key={`g-${cellKey(c)}`}
              className="absolute rounded-[4px] pointer-events-none"
              style={{
                left: (c[0] - bounds.minX) * CELL + 1,
                top: (c[1] - bounds.minY) * CELL + 1,
                width: CELL - 2,
                height: CELL - 2,
                background: ghostOk ? 'var(--c-green)' : 'var(--c-red)',
                opacity: 0.45,
              }}
            />
          ))}
        </div>
      </div>

      {message ? <p className="text-[13px] text-warn text-center mt-2" role="alert">{message}</p> : null}

      {/* tray */}
      {!solved ? (
        <>
          <div className="flex items-center justify-between mt-4 mb-1 px-1">
            {/*
              The keyboard route is a requirement, not a nicety — the founding
              brief asks for a keyboard alternative to every drag. It existed
              (arrows move, R rotates, Enter places) and was undiscoverable: the
              only mention anywhere was the aria-label on the Rotate button, so
              a keyboard-only learner had to already know. It is named here, and
              only once a piece is selected, so it appears exactly when it is
              usable rather than as permanent clutter.
            */}
            <p className="text-[13px] text-muted font-medium">
              {selectedPiece
                ? 'Arrow keys move it · R rotates · Enter places it — or drag it across'
                : 'Tray — drag a piece onto the board, or tap to select one'}
            </p>
            {spec.allowRotation ? (
              <Button kind="secondary" onClick={rotateSelected} disabled={!selectedPiece} className="!px-3 !text-[13px]" ariaLabel="Rotate selected piece (R)">
                <IconRotate size={15} /> Rotate
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 p-3 bg-surface border border-line rounded-2xl min-h-[76px]">
            {trayPieces.length === 0 ? <p className="text-[13px] text-faint">All pieces placed…</p> : null}
            {trayPieces.map((piece) => {
              const cells = rotateCells(piece.cells, rotOf(piece.id))
              const w = Math.max(...cells.map((c) => c[0])) + 1
              const h = Math.max(...cells.map((c) => c[1])) + 1
              const mini = 17
              const isSel = selectedPiece === piece.id
              return (
                <button
                  type="button"
                  key={piece.id}
                  aria-label={`Piece ${piece.id}${isSel ? ' (selected)' : ''}`}
                  aria-pressed={isSel}
                  onClick={() => {
                    setSelectedPiece(isSel ? null : piece.id)
                    setGhost(null)
                  }}
                  onPointerDown={(e) => {
                    setSelectedPiece(piece.id)
                    setDrag({ id: piece.id, px: e.clientX, py: e.clientY })
                  }}
                  className={`relative p-1.5 rounded-xl border transition-colors touch-none ${isSel ? 'border-accent bg-accent-soft' : 'border-line bg-surface2'}`}
                  style={{ width: Math.max(44, w * mini + 12), height: Math.max(44, h * mini + 12) }}
                >
                  {cells.map((c) => (
                    <span
                      key={cellKey(c)}
                      className="absolute rounded-[3px]"
                      style={{
                        left: c[0] * mini + 6,
                        top: c[1] * mini + 6,
                        width: mini - 2,
                        height: mini - 2,
                        background: PIECE_COLORS[piece.color % PIECE_COLORS.length],
                      }}
                    />
                  ))}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-faint mt-2">
            Keyboard: Tab to a piece, arrows move the ghost, R rotates, Enter places, tap/click a placed piece to lift it.
          </p>
          {drag ? (
            <div className="fixed z-50 pointer-events-none" style={{ left: drag.px - 20, top: drag.py - 30 }} aria-hidden>
              {rotateCells(spec.pieces.find((p) => p.id === drag.id)!.cells, rotOf(drag.id)).map((c) => (
                <span
                  key={cellKey(c)}
                  className="absolute rounded-[3px] opacity-80"
                  style={{ left: c[0] * 22, top: c[1] * 22, width: 20, height: 20, background: PIECE_COLORS[spec.pieces.find((p) => p.id === drag.id)!.color % PIECE_COLORS.length] }}
                />
              ))}
            </div>
          ) : null}
          <div className="flex gap-2 mt-3">
            <Button kind="secondary" className="flex-1" onClick={revealHint}>
              Hint {hintsShown > 0 ? `(${hintsShown}/${item.hints.length})` : ''}
            </Button>
            <Button
              kind="ghost"
              className="flex-1"
              onClick={() => {
                setPlaced({})
                persist({ placed: {} })
              }}
            >
              Clear board
            </Button>
          </div>
          {hintsShown > 0 ? <HintLadder presentation="inline" hints={item.hints} shown={hintsShown} onMore={revealHint} /> : null}
        </>
      ) : (
        <div className="anim-in">
          <Card className="mt-4 p-4 border-good/40">
            <p className="font-semibold text-good text-[15px]">Solved{hintsShown === 0 ? ' — unaided' : ''}.</p>
            <div className="mt-3 pt-3 border-t border-line">
              <Rich text={item.explanation} className="text-[15px]" />
            </div>
          </Card>
          {item.transferBridge ? <TransferBridge text={item.transferBridge} /> : null}
          <Button className="w-full mt-4" onClick={onContinue}>
            Continue
          </Button>
        </div>
      )}
      <span className="hidden">{template.id}</span>
    </div>
  )
}
