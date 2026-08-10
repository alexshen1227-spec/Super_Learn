/**
 * Challenge Creator — write the problem, predict what it does, then keep or
 * bin it.
 *
 * Three screens in one sheet:
 *
 *  1. **Build.** Pick a shape and set its numbers. The shape reports its own
 *     degenerate cases ("both legs are at the same speed, so there is nothing
 *     to notice here"), which is the part with the learning in it — recognising
 *     that a question you wrote does not actually ask anything.
 *  2. **Predict.** Before the answer is computed, say what your own problem
 *     will do. The tempting answer is wrong in every shape, and meeting that in
 *     a problem you built is harder to shrug off than meeting it in one handed
 *     to you.
 *  3. **Yours.** Everything you have written, each with the verdict control:
 *     it makes sense, or it does not and goes.
 *
 * Nothing here produces evidence, and the UI says so rather than implying it.
 * These problems are not audited content — no check has looked at their
 * wording or their fairness — so letting them move a rung would break the one
 * rule the whole progress model rests on.
 */
import { useMemo, useState } from 'react'
import { CREATOR_BY_ID, CREATOR_SHAPES, defaultSlots, type CreatorShape } from '../../content/creators'
import { SKILL_BY_ID } from '../../content/skills'
import type { AuthoredProblem } from '../../domain/types'
import { uid } from '../../engine/rng'
import { useStore } from '../../store/store'
import { Button, Card, Chip, Confirm, Modal, SectionTitle } from '../components'

type Stage = 'pick' | 'build' | 'predict' | 'done'

export function ChallengeCreator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [stage, setStage] = useState<Stage>('pick')
  const [shapeId, setShapeId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Record<string, number>>({})
  const [guess, setGuess] = useState<number | null>(null)
  const [tab, setTab] = useState<'make' | 'mine'>('make')

  const shape = shapeId ? (CREATOR_BY_ID.get(shapeId) ?? null) : null
  const flaw = shape ? shape.flaw(slots) : null
  const note = shape && !flaw ? (shape.note?.(slots) ?? null) : null
  const prediction = useMemo(() => (shape && !flaw ? shape.predict(slots) : null), [shape, slots, flaw])

  const reset = () => {
    setStage('pick')
    setShapeId(null)
    setSlots({})
    setGuess(null)
  }

  const start = (s: CreatorShape) => {
    setShapeId(s.id)
    setSlots(defaultSlots(s))
    setGuess(null)
    setStage('build')
  }

  const save = () => {
    if (!shape || !prediction || guess === null) return
    const problem: AuthoredProblem = {
      id: uid('ap'),
      t: Date.now(),
      shapeId: shape.id,
      slots: { ...slots },
      prompt: shape.render(slots),
      // Computed by the shape. Nothing here is ever typed by a person.
      answer: shape.solve(slots),
      unit: shape.unit,
      skillId: shape.skillId,
      predictedOk: guess === prediction.correct,
      sensible: null,
      reviewedAt: null,
    }
    dispatch({ type: 'add-authored', problem })
    setStage('done')
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        setTab('make')
        onClose()
      }}
      title="Challenge Creator"
      wide
    >
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTab('make')}
          aria-pressed={tab === 'make'}
          className={`min-h-11 flex-1 text-[13px] rounded-xl border ${tab === 'make' ? 'border-accent text-accent font-semibold' : 'border-line text-muted'}`}
        >
          Write one
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          aria-pressed={tab === 'mine'}
          className={`min-h-11 flex-1 text-[13px] rounded-xl border ${tab === 'mine' ? 'border-accent text-accent font-semibold' : 'border-line text-muted'}`}
        >
          Yours ({state.authored.length})
        </button>
      </div>

      {tab === 'mine' ? (
        <YourProblems />
      ) : stage === 'pick' ? (
        <div>
          <p className="text-[14px] text-muted leading-relaxed">
            Writing a problem asks something different from solving one: you have to know what makes the
            question work. Pick a shape, choose the numbers, then say what you think your own problem does
            before it is worked out.
          </p>
          <p className="text-[12px] text-faint mt-2 leading-relaxed">
            Nothing you write here counts towards any skill. It has not been checked the way the app's own
            questions are, so it stays out of your progress entirely.
          </p>
          <div className="grid gap-2 mt-3">
            {CREATOR_SHAPES.map((s) => (
              <button key={s.id} type="button" onClick={() => start(s)} className="text-left">
                <Card className="p-3 hover:border-accent/50">
                  <p className="text-[15px] font-semibold">{s.name}</p>
                  <p className="text-[13px] text-muted mt-0.5">{s.blurb}</p>
                  <p className="text-[11px] text-faint mt-1">
                    {SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId}
                  </p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      ) : stage === 'build' && shape ? (
        <div>
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">Step 1 · Build it</p>
          <p className="text-[15px] font-semibold mt-1">{shape.name}</p>

          <div className="mt-3 grid gap-3">
            {shape.slots.map((slot) => (
              <label key={slot.key} className="block">
                <span className="text-[13px] text-muted">
                  {slot.label}:{' '}
                  <span className="font-mono font-semibold text-ink">
                    {slots[slot.key]}
                    {slot.suffix ?? ''}
                  </span>
                </span>
                <input
                  type="range"
                  min={slot.min}
                  max={slot.max}
                  step={slot.step}
                  value={slots[slot.key] ?? slot.min}
                  onChange={(e) => setSlots((s) => ({ ...s, [slot.key]: Number(e.target.value) }))}
                  aria-label={slot.label}
                  aria-valuetext={`${slots[slot.key] ?? slot.min}${slot.suffix ?? ''}`}
                  className="w-full mt-1 h-11 accent-accent cursor-pointer touch-manipulation"
                />
              </label>
            ))}
          </div>

          <Card className="p-3 mt-3 bg-surface2">
            <p className="text-[11px] text-faint uppercase tracking-wide mb-1">Your problem reads</p>
            <p className="text-[15px]">{shape.render(slots)}</p>
          </Card>

          {flaw ? (
            <Card className="p-3 mt-2 border-warn/50">
              <p className="text-[12px] font-semibold text-warn uppercase tracking-wide mb-1">
                This one does not ask anything yet
              </p>
              <p className="text-[14px] text-muted">{flaw}</p>
            </Card>
          ) : note ? (
            /* Advisory only. Nothing here is disabled — the problem works. */
            <Card className="p-3 mt-2">
              <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1">Worth knowing</p>
              <p className="text-[14px] text-muted">{note}</p>
            </Card>
          ) : null}

          <div className="flex gap-2 mt-3">
            <Button kind="secondary" className="flex-1" onClick={reset}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStage('predict')} disabled={Boolean(flaw)}>
              {flaw ? 'Fix it first' : 'I am happy with it'}
            </Button>
          </div>
        </div>
      ) : stage === 'predict' && shape && prediction ? (
        <div>
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">
            Step 2 · Say what it does
          </p>
          <Card className="p-3 mt-2 bg-surface2">
            <p className="text-[15px]">{shape.render(slots)}</p>
          </Card>
          <p className="text-[15px] mt-3">{prediction.question}</p>
          <div className="grid gap-2 mt-2">
            {prediction.options.map((o, i) => (
              <button
                key={o}
                type="button"
                onClick={() => setGuess(i)}
                // A colour change alone does not tell a screen reader which
                // option is chosen.
                aria-pressed={guess === i}
                className={`text-left p-3 rounded-xl border text-[14px] min-h-11 ${
                  guess === i ? 'border-accent bg-accent/10' : 'border-line'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button kind="secondary" className="flex-1" onClick={() => setStage('build')}>
              Back
            </Button>
            <Button className="flex-1" onClick={save} disabled={guess === null}>
              Work it out
            </Button>
          </div>
        </div>
      ) : stage === 'done' && shape && prediction ? (
        <div>
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">Step 3 · What it does</p>
          <Card className="p-3 mt-2 bg-surface2">
            <p className="text-[15px]">{shape.render(slots)}</p>
          </Card>
          <Card className="p-3 mt-2">
            <p className="text-[13px] text-muted">{shape.answerLabel}</p>
            <p className="text-[22px] font-semibold font-mono mt-0.5">
              {shape.unit === '£' ? '£' : ''}
              {shape.solve(slots)}
              {shape.unit === '£' ? '' : shape.unit}
            </p>
          </Card>
          <Card className={`p-3 mt-2 ${guess === prediction.correct ? 'border-accent/50' : 'border-warn/50'}`}>
            <p className="text-[14px] font-semibold">
              {guess === prediction.correct
                ? 'Your prediction was right.'
                : `Not what you predicted — it is "${prediction.options[prediction.correct]}".`}
            </p>
            <p className="text-[14px] text-muted mt-1 leading-relaxed">{prediction.why}</p>
            <p className="text-[12px] text-faint mt-2">
              This is not recorded as progress on any skill. You wrote the problem, so getting it right
              cannot show what getting one right normally shows.
            </p>
          </Card>
          <div className="flex gap-2 mt-3">
            <Button kind="secondary" className="flex-1" onClick={reset}>
              Write another
            </Button>
            <Button className="flex-1" onClick={() => setTab('mine')}>
              See all of yours
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

/**
 * The review queue. Re-reading your own problem cold is where the quality
 * control lives: an app with no server cannot judge whether a learner's
 * question makes sense, and the learner can.
 */
function YourProblems() {
  const { state, dispatch } = useStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const list = [...state.authored].sort((a, b) => b.t - a.t)
  const unjudged = list.filter((a) => a.sensible === null)

  if (!list.length) {
    return (
      <div>
        <p className="text-[14px] text-muted leading-relaxed">
          Nothing written yet. Anything you write appears here so you can look at it again later and decide
          whether it actually holds up.
        </p>
      </div>
    )
  }

  return (
    <div>
      {unjudged.length ? (
        <p className="text-[13px] text-muted leading-relaxed mb-2">
          {unjudged.length === 1
            ? 'One of these has not been looked at again yet.'
            : `${unjudged.length} of these have not been looked at again yet.`}{' '}
          Read it cold and decide: does it actually make sense?
        </p>
      ) : null}
      <SectionTitle>Problems you wrote</SectionTitle>
      <div className="grid gap-2 mt-1">
        {list.map((a) => {
          const shape = CREATOR_BY_ID.get(a.shapeId)
          return (
            <Card key={a.id} className={`p-3 ${a.sensible === false ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-faint">
                  {shape?.name ?? a.shapeId} · {new Date(a.t).toLocaleDateString()}
                </p>
                {a.sensible === true ? <Chip tone="good">kept</Chip> : null}
                {a.sensible === null ? <Chip tone="warn">not reviewed</Chip> : null}
              </div>
              <p className="text-[15px] mt-1">{a.prompt}</p>
              <p className="text-[13px] text-muted mt-1">
                Answer: <span className="font-mono font-semibold text-ink">
                  {a.unit === '£' ? '£' : ''}
                  {a.answer}
                  {a.unit === '£' ? '' : a.unit}
                </span>
              </p>
              {a.sensible === null ? (
                <div className="flex gap-2 mt-2">
                  <Button
                    kind="secondary"
                    className="flex-1"
                    onClick={() => dispatch({ type: 'judge-authored', id: a.id, sensible: true, t: Date.now() })}
                  >
                    It makes sense
                  </Button>
                  <Button kind="danger" className="flex-1" onClick={() => setConfirmId(a.id)}>
                    It does not — delete
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Button kind="danger" className="flex-1" onClick={() => setConfirmId(a.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
      <Confirm
        open={confirmId !== null}
        title="Delete this problem?"
        body="It is removed from your device. Nothing else changes — problems you write are kept separate from your progress, so deleting one cannot undo anything you have learned."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (confirmId) dispatch({ type: 'delete-authored', id: confirmId })
          setConfirmId(null)
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
