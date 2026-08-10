/**
 * The two things a learner's own problems can add to the end of a session.
 *
 * Both are deliberately quiet. They sit ABOVE "Leave the lab" and neither one
 * blocks it, so ignoring either costs exactly one tap on the button you were
 * heading for anyway. Nothing records that you ignored it.
 *
 * They are mutually exclusive, and the review wins: clearing something you owe
 * beats being asked for more.
 */
import { useState } from 'react'
import { CREATOR_BY_ID } from '../../content/creators'
import type { AuthoredProblem } from '../../domain/types'
import { useStore } from '../../store/store'
import { Button, Card, Confirm } from '../components'

/**
 * One of your own problems, handed back cold.
 *
 * The verdict is the whole feature. Re-reading a question you wrote days ago
 * and noticing it does not hold up is the same skill as noticing it in
 * someone else's work — and it is the only quality control an app with no
 * server can honestly offer.
 */
export function AuthoredColdRead({ problem, backlog }: { problem: AuthoredProblem; backlog: number }) {
  const { dispatch } = useStore()
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState<'kept' | 'deleted' | null>(null)
  const shape = CREATOR_BY_ID.get(problem.shapeId)
  const days = Math.max(1, Math.round((Date.now() - problem.t) / 86_400_000))

  if (done) {
    return (
      <Card className="mt-3 p-4">
        <p className="text-[14px] text-muted">
          {done === 'kept' ? 'Kept. It is still in Practice → Challenge Creator.' : 'Deleted.'}
          {backlog > 1 ? ' Another one is waiting for a look next time.' : ''}
        </p>
      </Card>
    )
  }

  return (
    <Card className="mt-3 p-4 border-accent/30">
      <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">
        A problem you wrote {days} day{days === 1 ? '' : 's'} ago
      </p>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">
        Read it cold, the way someone else would. Does it actually make sense?
      </p>
      <p className="text-[15px] mt-2">{problem.prompt}</p>
      <p className="text-[13px] text-muted mt-1">
        Your answer:{' '}
        <span className="font-mono font-semibold text-ink">
          {problem.unit === '£' ? '£' : ''}
          {problem.answer}
          {problem.unit === '£' ? '' : problem.unit}
        </span>
      </p>
      <div className="flex gap-2 mt-3">
        <Button
          kind="secondary"
          className="flex-1"
          onClick={() => {
            dispatch({ type: 'judge-authored', id: problem.id, sensible: true, t: Date.now() })
            setDone('kept')
          }}
        >
          It makes sense
        </Button>
        <Button kind="danger" className="flex-1" onClick={() => setConfirming(true)}>
          It does not — delete
        </Button>
      </div>
      {/* No third "skip" button: leaving the screen already skips it, and the
          problem simply comes back next time. An explicit dismiss would only
          add a way to bury it. */}
      <Confirm
        open={confirming}
        title="Delete this problem?"
        body={`"${problem.prompt}" is removed from your device. Nothing else changes — problems you write are kept separate from your progress, so deleting one cannot undo anything you have learned.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          dispatch({ type: 'delete-authored', id: problem.id })
          setConfirming(false)
          setDone('deleted')
        }}
        onCancel={() => setConfirming(false)}
      />
      {shape ? <p className="text-[11px] text-faint mt-2">{shape.name}</p> : null}
    </Card>
  )
}

/**
 * An offer, on a fixed cadence, to write one.
 *
 * Phrased as a question with a real answer either way. There is no counter, no
 * "you haven't written one in a while", and no record of declining — the
 * cadence is keyed to finished sessions, so refusing changes nothing about
 * when it next appears.
 */
export function CreatorInvite({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <Card className="mt-3 p-4">
      <p className="text-[15px] font-semibold">Fancy writing one yourself?</p>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">
        Pick a shape, choose the numbers, and say what your own problem does before it is worked out. Takes
        two minutes, counts towards nothing, and is a genuinely different kind of thinking from answering.
      </p>
      <div className="flex gap-2 mt-3">
        <Button kind="secondary" className="flex-1" onClick={() => setDismissed(true)}>
          Not today
        </Button>
        <Button className="flex-1" onClick={onOpen}>
          Write one
        </Button>
      </div>
    </Card>
  )
}
