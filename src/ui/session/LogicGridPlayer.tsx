/**
 * Logic-grid player: clue list + assignment table. Validation is exact —
 * the audit proved each puzzle has one solution, so "check" compares against
 * it and, when wrong, names a violated clue (teaching, not just judging).
 */
import { useEffect, useRef, useState } from 'react'
import type { ItemTemplate, RenderedItem } from '../../domain/types'
import { assignmentCorrect, clueHolds, type Assignment } from '../../engine/logicGrid'
import type { ActivityRecord } from '../../store/draft'
import { Button, Card, Chip, HintLadder, TransferBridge } from '../components'
import { Rich } from '../richtext'
import type { ActivityResult } from './SessionScreen'

interface LGProgress {
  assignment: number[][]
  checks: number
  struck: number[]
  solved: boolean
}

export function LogicGridPlayer({
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
  const spec = item.logicgrid!
  const n = spec.values[0].length
  const nonKey = spec.categories.length - 1
  const saved = (record.extra as LGProgress | null) ?? null
  const [assignment, setAssignment] = useState<number[][]>(
    saved?.assignment ?? Array.from({ length: nonKey }, () => Array.from({ length: n }, () => -1)),
  )
  const [checks, setChecks] = useState(saved?.checks ?? 0)
  const [struck, setStruck] = useState<number[]>(saved?.struck ?? [])
  const [solved, setSolved] = useState(saved?.solved ?? false)
  const [message, setMessage] = useState<string | null>(null)
  const [hintsShown, setHintsShown] = useState(record.hintsUsed ?? 0)
  const finished = useRef(false)
  const activeSec = useRef(record.elapsedSec ?? 0)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') activeSec.current += 1
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const persist = (p: Partial<LGProgress>) => {
    onSnapshot({ extra: { assignment, checks, struck, solved, ...p }, hintsUsed: hintsShown })
  }

  const revealHint = () => {
    const next = Math.min(hintsShown + 1, item.hints.length)
    setHintsShown(next)
    onSnapshot({ hintsUsed: next })
  }

  const setCell = (cat: number, key: number, val: number) => {
    if (solved) return
    const next = assignment.map((row) => [...row])
    // a value can live with only one key: clear duplicates
    if (val >= 0) {
      for (let k = 0; k < n; k++) if (next[cat][k] === val) next[cat][k] = -1
    }
    next[cat][key] = val
    setAssignment(next)
    setMessage(null)
    persist({ assignment: next })
  }

  const complete = assignment.every((row) => row.every((v) => v >= 0))

  const check = () => {
    const nextChecks = checks + 1
    setChecks(nextChecks)
    if (assignmentCorrect(spec, assignment as Assignment)) {
      setSolved(true)
      persist({ checks: nextChecks, solved: true })
      if (!finished.current) {
        finished.current = true
        onFinish(
          {
            firstResponse: `check ${nextChecks}`,
            finalResponse: 'solved',
            correct: true,
            firstCorrect: nextChecks === 1 && hintsShown === 0,
            score: null,
            hintLevel: hintsShown,
            confidence: null,
            errorTag: nextChecks > 1 ? 'inference' : null,
            validator: 'logicgrid',
          },
          activeSec.current,
        )
      }
      return
    }
    // name one violated clue (teaching feedback)
    const violated = spec.clues.find((c) => !clueHolds(c.spec, assignment as Assignment))
    setMessage(
      violated
        ? `Not yet — this clue is broken by your grid: “${violated.text}”`
        : 'Not yet — every clue reads consistent, but the assignment is not the unique solution. Re-examine what each clue really pins down.',
    )
    persist({ checks: nextChecks })
  }

  return (
    <div className="max-w-2xl mx-auto anim-in pb-6">
      <div className="flex items-center gap-2 mt-4 mb-2">
        <Chip tone="accent">Logic grid</Chip>
        <Chip tone="neutral">{spec.clues.length} clues</Chip>
      </div>
      <Card className="p-4">
        <Rich text={item.prompt} className="text-[15px]" />
      </Card>

      {/* clues with strike-through tracking */}
      <Card className="mt-3 p-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">Clues — tap to strike through when used</p>
        <ol className="space-y-1.5">
          {spec.clues.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  const next = struck.includes(i) ? struck.filter((x) => x !== i) : [...struck, i]
                  setStruck(next)
                  persist({ struck: next })
                }}
                className={`text-left text-[14px] leading-snug w-full min-h-11 px-2 py-2 rounded transition-colors ${
                  struck.includes(i) ? 'line-through text-faint' : 'text-ink hover:bg-surface2'
                }`}
              >
                <span className="font-mono text-faint mr-1.5">{i + 1}.</span>
                {c.text}
              </button>
            </li>
          ))}
        </ol>
      </Card>

      {/* assignment table */}
      <div className="mt-3 overflow-x-auto scroll-thin">
        <table className="w-full border-collapse min-w-[340px]">
          <thead>
            <tr>
              {spec.categories.map((c) => (
                <th key={c} className="text-left text-[12px] font-semibold text-muted uppercase tracking-wide px-2 py-2 border-b border-line">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.values[0].map((keyName, k) => (
              <tr key={keyName} className="border-b border-line/60">
                <td className="px-2 py-2.5 font-medium text-[14px]">{keyName}</td>
                {Array.from({ length: nonKey }, (_, cat) => (
                  <td key={cat} className="px-1.5 py-1.5">
                    <select
                      aria-label={`${spec.categories[cat + 1]} for ${keyName}`}
                      value={assignment[cat][k]}
                      disabled={solved}
                      onChange={(e) => setCell(cat, k, Number(e.target.value))}
                      className="w-full min-h-10 bg-surface border border-line rounded-lg px-2 text-[14px] outline-none focus:border-accent"
                    >
                      <option value={-1}>—</option>
                      {spec.values[cat + 1].map((v, vi) => (
                        <option key={v} value={vi}>
                          {v}
                          {assignment[cat].includes(vi) && assignment[cat][k] !== vi ? ' (used)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message ? (
        <Card className="mt-3 p-3 border-warn/40">
          <p className="text-[14px] text-muted" role="alert">
            {message}
          </p>
        </Card>
      ) : null}

      {!solved ? (
        <>
          <div className="flex gap-2 mt-3">
            <Button className="flex-1" onClick={check} disabled={!complete}>
              Check solution{checks > 0 ? ` (attempt ${checks + 1})` : ''}
            </Button>
            <Button kind="secondary" onClick={revealHint}>
              Hint{hintsShown ? ` (${hintsShown})` : ''}
            </Button>
          </div>
          {!complete ? <p className="text-[12px] text-faint mt-2">Fill every cell to check — partial grids are where the deductions live.</p> : null}
          {hintsShown > 0 ? <HintLadder presentation="inline" hints={item.hints} shown={hintsShown} onMore={revealHint} /> : null}
        </>
      ) : (
        <div className="anim-in">
          <Card className="mt-3 p-4 border-good/40">
            <p className="font-semibold text-good text-[15px]">
              Solved{checks === 1 && hintsShown === 0 ? ' — first check, no hints' : ` in ${checks} checks`}.
            </p>
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
