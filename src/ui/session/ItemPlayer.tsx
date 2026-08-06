/**
 * Single & multi-part item player.
 * The non-negotiables live here: retrieval before answers, a hint ladder
 * whose use is recorded, corrective repair with a required re-attempt (or a
 * fresh twin problem after a full reveal), confidence capture on calibration
 * items, and an honest distinction between first-try and eventual success.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AnswerSpec, AttemptMode, ErrorTag, ItemTemplate, RenderedItem } from '../../domain/types'
import { ERROR_TAGS } from '../../domain/types'
import { describeAnswer, validate, validatorName } from '../../engine/validate'
import type { ContentIndex } from '../../engine/content-index'
import { KB_BY_SKILL } from '../../content/kb'
import type { ActivityRecord } from '../../store/draft'
import { Button, Card, Chip, Modal } from '../components'
import { Rich } from '../richtext'
import { IconFlag, IconHint } from '../icons'
import { useStore } from '../../store/store'
import { uid } from '../../engine/rng'
import type { ActivityResult } from './SessionScreen'

type Phase = 'study' | 'answer' | 'wrong' | 'retry' | 'revealed' | 'final'

interface PartOutcome {
  firstCorrect: boolean | null
  score: number
}

export function ItemPlayer({
  item,
  template,
  mode,
  record,
  askConfidence,
  onSnapshot,
  onFinish,
  onContinue,
  scratch,
  setScratch,
  kbIndex,
}: {
  item: RenderedItem
  template: ItemTemplate
  mode: AttemptMode
  record: ActivityRecord
  askConfidence: boolean
  onSnapshot: (r: Partial<ActivityRecord>) => void
  onFinish: (result: ActivityResult, elapsedSec: number) => void
  onContinue: () => void
  scratch: string
  setScratch: (s: string) => void
  kbIndex: ContentIndex
}) {
  const parts = item.kind === 'multi' ? item.parts! : null
  const [partIndex, setPartIndex] = useState(0)
  const spec: AnswerSpec = parts ? parts[partIndex].answer : item.answer!
  const hasStudy = parts ? Boolean(parts[partIndex].study) : false

  const [phase, setPhase] = useState<Phase>(hasStudy ? 'study' : 'answer')
  const [response, setResponse] = useState('')
  const [hintsShown, setHintsShown] = useState(record.hintsUsed ?? 0)
  const [hintOpen, setHintOpen] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(record.confidence)
  const [firstResponse, setFirstResponse] = useState<string | null>(record.firstResponse)
  const [twinSeed, setTwinSeed] = useState<number | null>(null)
  const [retryVerdictOk, setRetryVerdictOk] = useState<boolean | null>(null)
  const [errorTag, setErrorTag] = useState<ErrorTag | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [partOutcomes, setPartOutcomes] = useState<PartOutcome[]>([])
  const [rubricSelfChecked, setRubricSelfChecked] = useState<number[]>([])
  const [rubricStage, setRubricStage] = useState<'attempt' | 'compare'>('attempt')
  const [scratchOpen, setScratchOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const finished = useRef(false)
  const startAt = useRef(Date.now())
  const activeSec = useRef(record.elapsedSec ?? 0)

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') activeSec.current += 1
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Twin item after a reveal: same template, different variant.
  const twinItem = useMemo(
    () => (twinSeed !== null ? template.generate(twinSeed) : null),
    [twinSeed, template],
  )
  const activeSpec: AnswerSpec = twinItem ? (twinItem.answer ?? spec) : spec
  const kbCard = KB_BY_SKILL.get(template.skillIds[0])
  const showConcept = mode === 'guided'
  void kbIndex

  const isFirstAttemptPhase = phase === 'answer'
  const needsConfidence = askConfidence && isFirstAttemptPhase && spec.type !== 'rubric'

  const revealHint = () => {
    if (hintsShown < item.hints.length) {
      const next = hintsShown + 1
      setHintsShown(next)
      onSnapshot({ hintsUsed: next })
    }
    setHintOpen(true)
  }

  const finishSingle = (opts: { firstOk: boolean; eventualOk: boolean | null; score: number | null; finalResp: string }) => {
    if (finished.current) return
    finished.current = true
    onFinish(
      {
        firstResponse: firstResponse ?? opts.finalResp,
        finalResponse: opts.finalResp,
        correct: opts.eventualOk,
        firstCorrect: spec.type === 'rubric' ? null : opts.firstOk && hintsShown === 0,
        score: opts.score,
        hintLevel: hintsShown,
        confidence,
        errorTag,
        validator: validatorName(spec),
      },
      activeSec.current || (Date.now() - startAt.current) / 1000,
    )
  }

  // ----- submit handlers -----
  const submitFirst = () => {
    const verdict = validate(activeSpec, response)
    if (verdict.formatError && !verdict.ok) {
      setFormatError(verdict.formatError)
      return
    }
    setFormatError(null)
    setFirstResponse(response)
    onSnapshot({ firstResponse: response, submitted: true })
    if (verdict.ok) {
      setPhase('final')
      setRetryVerdictOk(null)
      finishSingle({ firstOk: true, eventualOk: true, score: verdict.score, finalResp: response })
    } else {
      setPhase('wrong')
    }
  }

  const submitRetry = () => {
    const verdict = validate(activeSpec, response)
    if (verdict.formatError && !verdict.ok) {
      setFormatError(verdict.formatError)
      return
    }
    setFormatError(null)
    setRetryVerdictOk(verdict.ok)
    setPhase('final')
    finishSingle({ firstOk: false, eventualOk: verdict.ok, score: verdict.score, finalResp: response })
  }

  const submitRubric = () => {
    const score = spec.type === 'rubric' ? Math.min(1, rubricSelfChecked.length / spec.criteria.length) : 0
    setPhase('final')
    setRetryVerdictOk(null)
    if (finished.current) return
    finished.current = true
    onFinish(
      {
        firstResponse: response || '(self-assessed)',
        finalResponse: rubricSelfChecked.join(','),
        correct: null,
        firstCorrect: null,
        score,
        hintLevel: hintsShown,
        confidence,
        errorTag: null,
        validator: 'rubric',
      },
      activeSec.current,
    )
  }

  // ----- multi-part flow -----
  const submitPart = () => {
    // Rubric parts are SELF-scored from the checked criteria — the free-text
    // attempt must never be run through the deterministic validator.
    if (spec.type === 'rubric') {
      const score = Math.min(1, rubricSelfChecked.length / spec.criteria.length)
      if (firstResponse === null) setFirstResponse(response || '(self-assessed)')
      setPartOutcomes((prev) => [...prev, { firstCorrect: null, score }])
      setRetryVerdictOk(null)
      setPhase('final')
      return
    }
    const verdict = validate(spec, response)
    if (verdict.formatError && !verdict.ok) {
      setFormatError(verdict.formatError)
      return
    }
    setFormatError(null)
    if (firstResponse === null) setFirstResponse(response)
    setPartOutcomes((prev) => [...prev, { firstCorrect: verdict.ok, score: verdict.score }])
    setRetryVerdictOk(verdict.ok)
    setPhase('final')
  }

  const nextPart = () => {
    if (!parts) return
    if (partIndex + 1 < parts.length) {
      setPartIndex(partIndex + 1)
      setResponse('')
      setRubricSelfChecked([])
      setRubricStage('attempt')
      setRetryVerdictOk(null)
      setPhase(parts[partIndex + 1].study ? 'study' : 'answer')
    } else {
      // aggregate the whole case
      const scores = partOutcomes.map((p) => p.score)
      const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)
      const deterministic = partOutcomes.filter((p) => p.firstCorrect !== null)
      const allFirst = deterministic.length > 0 && deterministic.every((p) => p.firstCorrect)
      if (!finished.current) {
        finished.current = true
        onFinish(
          {
            firstResponse: firstResponse ?? '',
            finalResponse: `${partOutcomes.length} parts`,
            correct: deterministic.length ? deterministic.every((p) => p.firstCorrect) : null,
            firstCorrect: deterministic.length ? allFirst && hintsShown === 0 : null,
            score: avg,
            hintLevel: hintsShown,
            confidence,
            errorTag: null,
            validator: 'multi',
          },
          activeSec.current,
        )
      }
      onContinue()
    }
  }

  // ----- render helpers -----
  const currentPrompt = twinItem ? twinItem.prompt : parts ? parts[partIndex].prompt : item.prompt
  const currentExplanation = twinItem ? twinItem.explanation : parts ? parts[partIndex].explanation : item.explanation

  return (
    <div className="max-w-xl mx-auto anim-in pb-6" key={`${partIndex}-${twinSeed ?? 'base'}`}>
      <div className="flex items-center justify-between mt-4 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Chip tone="neutral">{item.title}</Chip>
          {parts ? <Chip tone="accent">part {partIndex + 1}/{parts.length}</Chip> : null}
          {mode === 'review' ? <Chip tone="warn">review</Chip> : mode === 'transfer' ? <Chip tone="good">transfer</Chip> : null}
          {twinItem ? <Chip tone="accent">twin problem</Chip> : null}
        </div>
        <span className="flex items-center">
          {'speechSynthesis' in window ? (
            <button
              type="button"
              aria-label="Read the problem aloud"
              title="Read aloud"
              onClick={() => {
                const text = (parts ? (parts[partIndex].study ? parts[partIndex].study + '. ' : '') + parts[partIndex].prompt : currentPrompt)
                  .replace(/[*`>#|]/g, ' ')
                  .replace(/\s+/g, ' ')
                speechSynthesis.cancel()
                speechSynthesis.speak(new SpeechSynthesisUtterance(text))
              }}
              className="h-11 w-11 grid place-items-center rounded-full text-faint hover:text-muted hover:bg-surface2 text-[15px] leading-none"
            >
              🔊
            </button>
          ) : null}
          <button type="button" aria-label="Report a problem with this item" onClick={() => setReportOpen(true)} className="h-11 w-11 grid place-items-center rounded-full text-faint hover:text-muted hover:bg-surface2">
            <IconFlag size={16} />
          </button>
        </span>
      </div>

      {showConcept && kbCard && partIndex === 0 && !twinItem ? (
        <Card className="p-4 mb-3 border-accent/30">
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Concept · {kbCard.title}</p>
          <Rich text={kbCard.card} className="text-[14px] text-muted" />
        </Card>
      ) : null}

      {phase === 'study' && parts ? (
        <StudyPhase
          study={parts[partIndex].study!}
          seconds={parts[partIndex].studySeconds ?? 30}
          onDone={() => setPhase('answer')}
        />
      ) : (
        <>
          <Card className="p-4">
            <Rich text={currentPrompt} className="text-[16px]" />
          </Card>

          {/* ---------- input area ---------- */}
          {(phase === 'answer' || phase === 'retry') && (
            <div className="mt-4">
              {spec.type === 'rubric' ? (
                <RubricInput
                  spec={spec}
                  stage={rubricStage}
                  setStage={setRubricStage}
                  attempt={response}
                  setAttempt={setResponse}
                  checked={rubricSelfChecked}
                  setChecked={setRubricSelfChecked}
                  onDone={parts ? submitPart : submitRubric}
                />
              ) : (
                <>
                  <AnswerInput
                    spec={activeSpec}
                    value={response}
                    onChange={(v) => { setResponse(v); setFormatError(null) }}
                    onSubmit={() => {
                      if (!response.trim() || (needsConfidence && confidence === null)) return
                      if (phase === 'retry') (parts ? submitPart : submitRetry)()
                      else (parts ? submitPart : submitFirst)()
                    }}
                  />
                  {formatError ? (
                    <p className="text-warn text-[13px] mt-2" role="alert">
                      {formatError}
                    </p>
                  ) : null}
                  {needsConfidence ? (
                    <div className="mt-4">
                      <span className="text-[13px] text-muted font-medium">How sure are you?</span>
                      <div className="flex gap-1.5 mt-1.5" role="radiogroup" aria-label="Confidence">
                        {[20, 40, 60, 80, 95].map((c) => (
                          <button
                            type="button"
                            key={c}
                            role="radio"
                            aria-checked={confidence === c}
                            onClick={() => setConfidence(c)}
                            className={`flex-1 min-h-11 rounded-lg border text-[13px] font-medium transition-colors ${
                              confidence === c ? 'bg-accent-soft border-accent/50 text-accent' : 'bg-surface border-line text-faint'
                            }`}
                          >
                            {c}%
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      onClick={phase === 'retry' ? (parts ? submitPart : submitRetry) : parts ? submitPart : submitFirst}
                      disabled={!response.trim() || (needsConfidence && confidence === null)}
                    >
                      {phase === 'retry' ? 'Submit corrected answer' : 'Submit'}
                    </Button>
                    <Button kind="secondary" onClick={revealHint} ariaLabel="Get a hint" className="!px-3.5">
                      <IconHint size={18} />
                      {hintsShown > 0 ? <span className="text-xs">{hintsShown}</span> : null}
                    </Button>
                  </div>
                  {needsConfidence && confidence === null && response.trim() ? (
                    <p className="text-[12px] text-faint mt-2">Pick a confidence to submit — calibration is part of this one.</p>
                  ) : null}
                </>
              )}
            </div>
          )}

          {/* ---------- wrong: repair fork ---------- */}
          {phase === 'wrong' && (
            <Card className="mt-4 p-4 border-warn/40 bg-warn-soft">
              <p className="font-semibold text-[15px]">Not yet.</p>
              <p className="text-muted text-[14px] mt-1">
                Your answer: <span className="font-mono">{firstResponse}</span>. The attempt is the valuable part —
                now find the first place it went off.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  onClick={() => {
                    setResponse('')
                    setPhase('retry')
                  }}
                >
                  Try again{hintsShown < item.hints.length ? ' (hints available)' : ''}
                </Button>
                <Button
                  kind="secondary"
                  onClick={() => {
                    setHintsShown(item.hints.length)
                    onSnapshot({ hintsUsed: item.hints.length })
                    setPhase('revealed')
                  }}
                >
                  Walk me through it
                </Button>
              </div>
            </Card>
          )}

          {/* ---------- full reveal + twin ---------- */}
          {phase === 'revealed' && (
            <Card className="mt-4 p-4">
              <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">The full path</p>
              <Rich text={currentExplanation} className="text-[15px]" />
              <p className="text-[13px] text-muted mt-2">
                Answer: <span className="font-mono font-semibold text-ink">{describeAnswer(activeSpec)}</span>
              </p>
              {template.variants > 1 ? (
                <>
                  <p className="text-[13px] text-muted mt-3">
                    A worked example only becomes yours when you use it — here is a twin with different numbers.
                  </p>
                  <Button
                    className="w-full mt-2"
                    onClick={() => {
                      const fresh = ((twinSeed ?? item.seed) + 1) % Math.max(2, template.variants)
                      setTwinSeed(fresh === item.seed % template.variants ? fresh + 1 : fresh)
                      setResponse('')
                      setPhase('retry')
                    }}
                  >
                    Try the twin problem
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full mt-3"
                  onClick={() => {
                    setRetryVerdictOk(false)
                    setPhase('final')
                    finishSingle({ firstOk: false, eventualOk: false, score: 0, finalResp: firstResponse ?? '' })
                  }}
                >
                  Got it
                </Button>
              )}
            </Card>
          )}

          {/* ---------- final feedback ---------- */}
          {phase === 'final' && (
            <FinalFeedback
              misconceptionNote={
                firstResponse !== null && activeSpec.type === 'mcq'
                  ? ((twinItem ?? item).distractorNotes?.[Number(firstResponse)] ?? null)
                  : null
              }
              parts={Boolean(parts)}
              ok={parts ? retryVerdictOk : retryVerdictOk === null ? true : retryVerdictOk}
              firstTry={retryVerdictOk === null && firstResponse === response}
              hintsUsed={hintsShown}
              spec={spec.type === 'rubric' ? null : activeSpec}
              explanation={currentExplanation}
              commonErrors={item.commonErrors}
              wasWrongFirst={parts ? retryVerdictOk === false : firstResponse !== null && retryVerdictOk !== null}
              errorTag={errorTag}
              setErrorTag={(t) => {
                setErrorTag(t)
                onSnapshot({ errorTag: t })
              }}
              transferBridge={!parts || partIndex === parts.length - 1 ? item.transferBridge : undefined}
              onContinue={parts ? nextPart : onContinue}
              continueLabel={parts && partIndex + 1 < parts.length ? 'Next part' : 'Continue'}
            />
          )}
        </>
      )}

      {/* scratchpad */}
      {['math', 'physics', 'coding', 'science'].includes(template.bucket) && !parts ? (
        <div className="mt-4">
          <button type="button" className="text-[13px] text-faint hover:text-muted underline min-h-11" onClick={() => setScratchOpen(!scratchOpen)}>
            {scratchOpen ? 'Hide scratchpad' : 'Open scratchpad'}
          </button>
          {scratchOpen ? (
            <textarea
              value={scratch}
              onChange={(e) => setScratch(e.target.value.slice(0, 4000))}
              placeholder="Working space — saved with the session, never graded."
              rows={4}
              className="mt-2 w-full bg-surface2 border border-line rounded-xl px-3 py-2.5 text-[15px] font-mono outline-none focus:border-accent resize-y scroll-thin"
            />
          ) : null}
        </div>
      ) : null}

      <HintSheet open={hintOpen} onClose={() => setHintOpen(false)} hints={item.hints} shown={hintsShown} onMore={revealHint} />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} templateId={template.id} version={template.version} seed={item.seed} />
    </div>
  )
}

// ---------------------------------------------------------------- pieces

function StudyPhase({ study, seconds, onDone }: { study: string; seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <Card className="p-4 border-accent/40">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] font-semibold text-accent uppercase tracking-wide">Study phase — it disappears after this</p>
        <span className="font-mono text-[13px] text-muted" aria-label={`suggested ${left} more seconds`}>
          {left}s
        </span>
      </div>
      <Rich text={study} className="text-[15px]" />
      <p className="text-[12px] text-faint mt-3">The timer is a suggestion, not a cutoff — take what you need.</p>
      <Button className="w-full mt-3" onClick={onDone}>
        I'm ready — hide it
      </Button>
    </Card>
  )
}

export function AnswerInput({
  spec,
  value,
  onChange,
  onSubmit,
}: {
  spec: AnswerSpec
  value: string
  onChange: (v: string) => void
  /** Enter key on single-line inputs triggers this (when submission is valid). */
  onSubmit?: () => void
}) {
  // Batch-safety: base compound edits (multi/order/classify) on the latest
  // emitted value, not the possibly-stale prop, so rapid same-tick events
  // (automation, some assistive tech) compose instead of clobbering.
  const latest = useRef(value)
  latest.current = value
  const emit = (v: string) => {
    latest.current = v
    onChange(v)
  }
  switch (spec.type) {
    case 'numeric':
    case 'fraction':
      return (
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit?.()
            }}
            autoFocus
            inputMode="text"
            autoComplete="off"
            enterKeyHint="done"
            aria-label="Your answer"
            placeholder={spec.type === 'fraction' ? 'e.g. 3/4' : 'Your answer'}
            className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-[17px] font-mono outline-none focus:border-accent"
          />
          {spec.type === 'numeric' && spec.unit ? <span className="text-muted font-mono text-[15px]">{spec.unit}</span> : null}
        </div>
      )
    case 'text':
      return (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit?.()
          }}
          autoFocus
          enterKeyHint="done"
          aria-label="Your answer"
          placeholder={spec.placeholder ?? 'Your answer'}
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
        />
      )
    case 'mcq':
      return (
        <div className="space-y-2" role="radiogroup" aria-label="Choices">
          {spec.options.map((o, i) => (
            <button
              type="button"
              key={i}
              role="radio"
              aria-checked={value === String(i)}
              onClick={() => onChange(String(i))}
              className={`w-full text-left min-h-12 px-4 py-3 rounded-xl border text-[15px] leading-snug transition-colors ${
                value === String(i) ? 'bg-accent-soft border-accent/60 text-ink' : 'bg-surface border-line hover:border-line-strong'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )
    case 'multi': {
      const picked = value ? value.split(',').map(Number) : []
      const toggle = (i: number) => {
        const cur = latest.current ? latest.current.split(',').map(Number) : []
        const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]
        emit(next.sort((a, b) => a - b).join(','))
      }
      return (
        <div className="space-y-2">
          <p className="text-[12px] text-muted">Select every answer that applies.</p>
          {spec.options.map((o, i) => (
            <button
              type="button"
              key={i}
              aria-pressed={picked.includes(i)}
              onClick={() => toggle(i)}
              className={`w-full text-left min-h-12 px-4 py-3 rounded-xl border text-[15px] leading-snug transition-colors flex items-start gap-2.5 ${
                picked.includes(i) ? 'bg-accent-soft border-accent/60' : 'bg-surface border-line hover:border-line-strong'
              }`}
            >
              <span
                className={`mt-0.5 h-4.5 w-4.5 min-w-4 h-4 w-4 rounded border grid place-items-center text-[10px] ${picked.includes(i) ? 'bg-accent text-bg border-accent' : 'border-line-strong'}`}
                aria-hidden
              >
                {picked.includes(i) ? '✓' : ''}
              </span>
              <span>{o}</span>
            </button>
          ))}
        </div>
      )
    }
    case 'order': {
      const chosen = value ? value.split(',').map(Number) : []
      const remaining = spec.options.map((_, i) => i).filter((i) => !chosen.includes(i))
      const chosenNow = () => (latest.current ? latest.current.split(',').map(Number) : [])
      return (
        <div>
          <p className="text-[12px] text-muted mb-2">Tap in order — first step first. Tap a placed step to remove it.</p>
          <ol className="space-y-1.5 mb-3 min-h-10">
            {chosen.map((i, pos) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => emit(chosenNow().filter((x) => x !== i).join(','))}
                  className="w-full min-h-11 text-left px-3 py-2.5 rounded-lg bg-accent-soft border border-accent/40 text-[14px] flex gap-2"
                >
                  <span className="font-mono text-accent shrink-0">{pos + 1}.</span> {spec.options[i]}
                </button>
              </li>
            ))}
          </ol>
          <div className="space-y-1.5">
            {remaining.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => emit([...chosenNow(), i].join(','))}
                className="w-full min-h-11 text-left px-3 py-2.5 rounded-lg bg-surface border border-line hover:border-line-strong text-[14px]"
              >
                {spec.options[i]}
              </button>
            ))}
          </div>
        </div>
      )
    }
    case 'classify': {
      const picks = value ? value.split(',').map(Number) : spec.statements.map(() => -1)
      const setPick = (si: number, cat: number) => {
        const next = latest.current ? latest.current.split(',').map(Number) : spec.statements.map(() => -1)
        while (next.length < spec.statements.length) next.push(-1)
        next[si] = cat
        emit(next.join(','))
      }
      return (
        <div className="space-y-3">
          {spec.statements.map((s, si) => (
            <div key={si} className="bg-surface border border-line rounded-xl p-3">
              <p className="text-[14px] leading-snug mb-2">{s.text}</p>
              <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label={`Category for: ${s.text}`}>
                {spec.categories.map((c, ci) => (
                  <button
                    type="button"
                    key={ci}
                    role="radio"
                    aria-checked={picks[si] === ci}
                    onClick={() => setPick(si, ci)}
                    className={`min-h-11 px-3 rounded-lg border text-[13px] font-medium transition-colors ${
                      picks[si] === ci ? 'bg-accent text-bg border-accent' : 'bg-surface2 border-line text-muted'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    case 'rubric':
      return null
  }
}

function RubricInput({
  spec,
  stage,
  setStage,
  attempt,
  setAttempt,
  checked,
  setChecked,
  onDone,
}: {
  spec: Extract<AnswerSpec, { type: 'rubric' }>
  stage: 'attempt' | 'compare'
  setStage: (s: 'attempt' | 'compare') => void
  attempt: string
  setAttempt: (s: string) => void
  checked: number[]
  setChecked: (c: number[]) => void
  onDone: () => void
}) {
  if (stage === 'attempt') {
    return (
      <div>
        <textarea
          value={attempt}
          onChange={(e) => setAttempt(e.target.value.slice(0, 2000))}
          rows={5}
          placeholder="Write your answer here — the honest attempt is what makes the comparison work."
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent resize-y"
        />
        <Button className="w-full mt-3" onClick={() => setStage('compare')} disabled={attempt.trim().length < 10}>
          Compare with the model answer
        </Button>
      </div>
    )
  }
  return (
    <div>
      <Card className="p-4 bg-surface2">
        <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Model answer</p>
        <Rich text={spec.model} className="text-[14px]" />
      </Card>
      <Card className="p-4 mt-3">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">Score yourself honestly</p>
        <div className="space-y-2">
          {spec.criteria.map((c, i) => (
            <button
              type="button"
              key={i}
              aria-pressed={checked.includes(i)}
              onClick={() => setChecked(checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i])}
              className={`w-full min-h-11 text-left px-3 py-2.5 rounded-lg border text-[14px] leading-snug flex items-start gap-2.5 transition-colors ${
                checked.includes(i) ? 'bg-good-soft border-good/40' : 'bg-surface border-line'
              }`}
            >
              <span className={`mt-0.5 min-w-4 h-4 w-4 rounded border grid place-items-center text-[10px] ${checked.includes(i) ? 'bg-good text-bg border-good' : 'border-line-strong'}`} aria-hidden>
                {checked.includes(i) ? '✓' : ''}
              </span>
              <span>{c}</span>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-faint mt-2">Self-scored work never counts as independent mastery evidence — it guides, it doesn't grade.</p>
      </Card>
      <Button className="w-full mt-3" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}

function FinalFeedback({
  ok,
  firstTry,
  hintsUsed,
  spec,
  explanation,
  commonErrors,
  misconceptionNote,
  wasWrongFirst,
  errorTag,
  setErrorTag,
  transferBridge,
  onContinue,
  continueLabel,
  parts,
}: {
  ok: boolean | null
  firstTry: boolean
  hintsUsed: number
  spec: AnswerSpec | null
  explanation: string
  commonErrors?: Partial<Record<ErrorTag, string>>
  misconceptionNote?: string | null
  wasWrongFirst: boolean
  errorTag: ErrorTag | null
  setErrorTag: (t: ErrorTag) => void
  transferBridge?: string
  onContinue: () => void
  continueLabel: string
  parts: boolean
}) {
  const suggested = commonErrors ? (Object.keys(commonErrors)[0] as ErrorTag | undefined) : undefined
  return (
    <div className="mt-4 anim-in" role="status" aria-live="polite">
      <Card className={`p-4 ${ok ? 'border-good/40' : 'border-warn/40'}`}>
        <p className={`font-semibold text-[15px] ${ok ? 'text-good' : 'text-warn'}`}>
          {ok === null
            ? 'Recorded.'
            : ok
              ? firstTry && hintsUsed === 0
                ? 'Correct — unaided, first try. That is the evidence that advances skills.'
                : hintsUsed > 0
                  ? 'Correct — with hints, so this counts as guided evidence (independence comes next).'
                  : 'Corrected. The repair is real learning; a fresh version of this idea will come back later.'
              : 'Still not there — read the path below closely; this idea will return as a new problem.'}
        </p>
        <div className="mt-3 pt-3 border-t border-line">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1">Why</p>
          <Rich text={explanation} className="text-[15px]" />
          {spec && !ok ? (
            <p className="text-[13px] text-muted mt-2">
              Answer: <span className="font-mono font-semibold text-ink">{describeAnswer(spec)}</span>
            </p>
          ) : null}
        </div>
        {wasWrongFirst && misconceptionNote ? (
          <div className="mt-3 bg-warn-soft border border-warn/30 rounded-lg px-3 py-2">
            <p className="text-[11px] font-semibold text-warn uppercase tracking-wide mb-0.5">Named trap</p>
            <p className="text-[13px] text-warn leading-snug">{misconceptionNote}</p>
          </div>
        ) : wasWrongFirst && commonErrors && suggested && commonErrors[suggested] ? (
          <div className="mt-3 bg-warn-soft border border-warn/30 rounded-lg px-3 py-2">
            <p className="text-[13px] text-warn leading-snug">{commonErrors[suggested]}</p>
          </div>
        ) : null}
      </Card>

      {wasWrongFirst && !parts ? (
        <Card className="p-4 mt-3">
          <p className="text-[13px] font-medium text-muted mb-2">What kind of error was it? (your call — this steers the Error Clinic)</p>
          <div className="flex flex-wrap gap-1.5">
            {ERROR_TAGS.filter((t) => ['concept', 'strategy', 'slip', 'misread', 'representation', 'unknown'].includes(t.id)).map((t) => (
              <button type="button" className="min-h-11" key={t.id} onClick={() => setErrorTag(t.id)} aria-pressed={errorTag === t.id} title={t.hint}>
                <Chip tone={errorTag === t.id ? 'warn' : 'neutral'} className="cursor-pointer !py-1.5">
                  {t.name}
                </Chip>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {transferBridge ? (
        <Card className="p-4 mt-3 border-accent/30">
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Transfer bridge</p>
          <Rich text={transferBridge} className="text-[14px] text-muted" />
        </Card>
      ) : null}

      <Button className="w-full mt-4" onClick={onContinue}>
        {continueLabel}
      </Button>
    </div>
  )
}

function HintSheet({ open, onClose, hints, shown, onMore }: { open: boolean; onClose: () => void; hints: string[]; shown: number; onMore: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Hints">
      <p className="text-[12px] text-faint mb-3">
        Hints are honest helpers: using one moves this attempt from “independent” to “guided” evidence — still progress, just labeled truthfully.
      </p>
      <div className="space-y-2.5">
        {hints.slice(0, shown).map((h, i) => (
          <div key={i} className="bg-surface2 border border-line rounded-xl px-3.5 py-2.5">
            <p className="text-[11px] font-mono text-faint mb-0.5">hint {i + 1}</p>
            <Rich text={h} className="text-[14px]" />
          </div>
        ))}
      </div>
      {shown < hints.length ? (
        <Button kind="secondary" className="w-full mt-3" onClick={onMore}>
          Next hint ({shown}/{hints.length} used)
        </Button>
      ) : (
        <p className="text-[13px] text-muted mt-3">That's the whole ladder — the last rung is the full path.</p>
      )}
    </Modal>
  )
}

function ReportDialog({ open, onClose, templateId, version, seed }: { open: boolean; onClose: () => void; templateId: string; version: number; seed: number }) {
  const { dispatch } = useStore()
  const [note, setNote] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Report a problem">
      <p className="text-muted text-sm">
        Describe what's wrong (unclear wording, wrong answer, broken interaction). Reports are stored locally and go
        out only if you export them — nothing is transmitted.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        rows={3}
        className="mt-3 w-full bg-surface2 border border-line rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-accent"
      />
      <Button
        className="w-full mt-3"
        disabled={note.trim().length < 4}
        onClick={() => {
          dispatch({ type: 'add-report', report: { id: uid('pr'), t: Date.now(), templateId, itemVersion: version, seed, note: note.trim() } })
          setNote('')
          onClose()
        }}
      >
        Save report
      </Button>
    </Modal>
  )
}
