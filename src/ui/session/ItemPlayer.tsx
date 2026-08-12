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
import { describeAnswer, describeResponse, firstFailedStep, validate, validatorName } from '../../engine/validate'
import { checkHolds, parseConstruct, serializeConstruct } from '../../engine/construct'
import type { ContentIndex } from '../../engine/content-index'
import { KB_BY_SKILL } from '../../content/kb'
import type { ActivityRecord } from '../../store/draft'
import { Button, Card, Chip, DifficultyBadge, Modal } from '../components'
import { Rich } from '../richtext'
import { IconFlag, IconHint } from '../icons'
import { useStore } from '../../store/store'
import { uid } from '../../engine/rng'
import type { ActivityResult } from './SessionScreen'
import { aggregateParts, resumePhase, verdictMessage, type PartOutcome } from '../../engine/activity'
import { isPflTemplate } from '../../engine/pfl'
import { diagnose, type RepairPath } from '../../engine/diagnose'
import { ExplorePlot } from './ExplorePlot'

type Phase = 'study' | 'answer' | 'wrong' | 'retry' | 'revealed' | 'final'

interface SavedItemPlayerState {
  kind: 'item-player-v3'
  partIndex: number
  partOutcomes: PartOutcome[]
  phase: Phase
  response: string
  draftStage: 'write' | 'compare'
  firstResponse: string | null
  retryVerdictOk: boolean | null
  confidence: number | null
  /** Mid-repair state for the CURRENT part, so a reload cannot skip a repair. */
  partFirstResponse: string | null
  partWasWrongFirst: boolean
}

function savedItemPlayerState(extra: unknown): SavedItemPlayerState | null {
  if (!extra || typeof extra !== 'object') return null
  const candidate = extra as Partial<SavedItemPlayerState>
  // Earlier shapes predate ungraded drafts and per-part repair; a partially
  // restored repair would be worse than starting the activity cleanly.
  if (candidate.kind !== 'item-player-v3' || typeof candidate.partIndex !== 'number') return null
  return candidate as SavedItemPlayerState
}

export function ItemPlayer({
  item,
  template,
  mode,
  record,
  attemptId,
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
  /** Id the attempt will be logged under, known before the event is written. */
  attemptId: string
  askConfidence: boolean
  onSnapshot: (r: Partial<ActivityRecord>) => void
  onFinish: (result: ActivityResult, elapsedSec: number) => void
  onContinue: () => void
  scratch: string
  setScratch: (s: string) => void
  kbIndex: ContentIndex
}) {
  const parts = item.kind === 'multi' ? item.parts! : null
  const saved = savedItemPlayerState(record.extra)
  const initialPartIndex = parts ? Math.max(0, Math.min(parts.length - 1, saved?.partIndex ?? 0)) : 0
  const [partIndex, setPartIndex] = useState(initialPartIndex)
  const spec: AnswerSpec = parts ? parts[partIndex].answer : item.answer!
  const hasStudy = parts ? Boolean(parts[partIndex].study || parts[partIndex].explore) : false

  // A resumed draft can name a phase the resumed part cannot show, which would
  // strand the learner on an empty study screen. `resumePhase` is the rule.
  const [phase, setPhase] = useState<Phase>(() =>
    resumePhase<Phase>(saved?.phase, hasStudy, { study: 'study', answer: 'answer' }),
  )
  const [response, setResponse] = useState(saved?.response ?? '')
  const [hintsShown, setHintsShown] = useState(record.hintsUsed ?? 0)
  const [hintOpen, setHintOpen] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(saved?.confidence ?? record.confidence)
  const [firstResponse, setFirstResponse] = useState<string | null>(saved?.firstResponse ?? record.firstResponse)
  const [twinSeed, setTwinSeed] = useState<number | null>(null)
  const [retryVerdictOk, setRetryVerdictOk] = useState<boolean | null>(saved?.retryVerdictOk ?? null)
  const [errorTag, setErrorTag] = useState<ErrorTag | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [partOutcomes, setPartOutcomes] = useState<PartOutcome[]>(saved?.partOutcomes ?? [])
  const [draftStage, setDraftStage] = useState<'write' | 'compare'>(saved?.draftStage ?? 'write')
  // Per-part repair state. Multi-part items used to skip the corrective loop
  // entirely — a wrong checkpoint went straight to the explanation — so ~30%
  // of graded work never required a correction. These track the CURRENT part.
  const [partFirstResponse, setPartFirstResponse] = useState<string | null>(saved?.partFirstResponse ?? null)
  const [partWasWrongFirst, setPartWasWrongFirst] = useState(saved?.partWasWrongFirst ?? false)
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

  // Multi-stage work can take most of a session. Preserve the exact
  // checkpoint, draft text, and comparison state if a phone backgrounds or
  // reloads the app midway through the artifact.
  useEffect(() => {
    if (!parts) return
    const extra: SavedItemPlayerState = {
      kind: 'item-player-v3',
      partIndex,
      partOutcomes,
      phase,
      response,
      draftStage,
      firstResponse,
      retryVerdictOk,
      confidence,
      partFirstResponse,
      partWasWrongFirst,
    }
    onSnapshot({ extra, hintsUsed: hintsShown, firstResponse })
  }, [parts, partIndex, partOutcomes, phase, response, draftStage, firstResponse, retryVerdictOk, confidence, hintsShown, partFirstResponse, partWasWrongFirst, onSnapshot])

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
  const needsConfidence = askConfidence && isFirstAttemptPhase && spec.type !== 'draft'

  // A multi-part activity asks a different question at every checkpoint, so
  // prefer that checkpoint's own ladder when the content provides one.
  const activeHints = (parts && parts[partIndex].hints?.length ? parts[partIndex].hints : item.hints) as string[]

  const revealHint = () => {
    if (hintsShown < activeHints.length) {
      const next = hintsShown + 1
      setHintsShown(next)
      onSnapshot({ hintsUsed: next })
    }
    setHintOpen(true)
  }

  const finishSingle = (opts: {
    firstOk: boolean
    eventualOk: boolean | null
    score: number | null
    finalResp: string
    /** Diagnosis resolved at THIS moment; state updates are async, so the tag
     *  cannot be read back out of `errorTag` in the same tick. */
    tag?: ErrorTag | null
  }) => {
    if (finished.current) return
    finished.current = true
    onFinish(
      {
        firstResponse: firstResponse ?? opts.finalResp,
        finalResponse: opts.finalResp,
        correct: opts.eventualOk,
        firstCorrect: spec.type === 'draft' ? null : opts.firstOk && hintsShown === 0,
        score: opts.score,
        hintLevel: hintsShown,
        confidence,
        errorTag: opts.tag !== undefined ? opts.tag : errorTag,
        validator: validatorName(spec),
      },
      activeSec.current || (Date.now() - startAt.current) / 1000,
    )
  }

  /**
   * For a worked chain, the FIRST broken link names the misconception — so the
   * error tag is derived from the work itself instead of asking the learner to
   * diagnose their own mistake (which is self-assessment by another name).
   */
  const diagnoseFrom = (submitted: string): ErrorTag | null => {
    if (activeSpec.type !== 'steps') return null
    const i = firstFailedStep(activeSpec, submitted)
    return i === null ? null : activeSpec.steps[i].diagnoses
  }

  /** The cause authored on the option the learner actually picked, if any. */
  const distractorTagFor = (submitted: string): ErrorTag | null => {
    if (activeSpec.type !== 'mcq') return null
    const tags = (twinItem ?? item).distractorTags
    if (!tags) return null
    const i = Number(submitted)
    return Number.isInteger(i) ? (tags[i] ?? null) : null
  }

  /**
   * What the first submission on THIS checkpoint told us, captured at the miss.
   * `diagnose` combines it with how the repair then went — see engine/diagnose.
   */
  const missSignal = useRef<{ stepTag: ErrorTag | null; distractorTag: ErrorTag | null; validator: string } | null>(null)

  /** Every cause observed across a multi-part activity, earliest first. */
  const activityTags = useRef<ErrorTag[]>([])

  /**
   * Resolve the cause once the repair has played out.
   *
   * `hintsShown === 0` is the test for "unaided" rather than a separate flag:
   * every route that shows help — the hint sheet and "Walk me through it" alike
   * — raises it, so a zero here means the learner re-derived the answer with
   * nothing revealed.
   */
  const resolveCause = (repair: RepairPath): ErrorTag | null => {
    const signal = missSignal.current
    if (!signal) return null
    const { tag } = diagnose({ ...signal, repair })
    if (tag) {
      setErrorTag(tag)
      activityTags.current.push(tag)
      onSnapshot({ errorTag: tag })
    }
    return tag
  }

  const repairPath = (succeeded: boolean): RepairPath =>
    !succeeded ? 'still-wrong' : hintsShown === 0 ? 'unaided-retry' : 'after-hints'

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
      const derived = diagnoseFrom(response)
      missSignal.current = {
        stepTag: derived,
        distractorTag: distractorTagFor(response),
        validator: validatorName(activeSpec),
      }
      if (derived) {
        setErrorTag(derived)
        onSnapshot({ errorTag: derived })
      }
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
    const tag = resolveCause(repairPath(verdict.ok))
    finishSingle({ firstOk: false, eventualOk: verdict.ok, score: verdict.score, finalResp: response, tag })
  }

  /**
   * Defensive only: the content audit forbids a `draft` as a single item's
   * whole answer, because a draft can never produce evidence. If one ever
   * slipped through, it must log as exposure — never as a score.
   */
  const submitDraftSingle = () => {
    setPhase('final')
    setRetryVerdictOk(null)
    if (finished.current) return
    finished.current = true
    onFinish(
      {
        firstResponse: response,
        finalResponse: response,
        correct: null,
        firstCorrect: null,
        score: null,
        hintLevel: hintsShown,
        confidence: null,
        errorTag: null,
        validator: 'draft',
      },
      activeSec.current,
    )
  }

  // ----- multi-part flow -----

  /** Close out the current part. `firstCorrect` always reflects the FIRST
   *  submission, never the corrected one — a repair earns guided evidence,
   *  never independent evidence. */
  const resolvePart = (firstCorrect: boolean, eventualScore: number, eventualOk: boolean | null) => {
    setPartOutcomes((prev) => [...prev, { firstCorrect, eventualOk, score: eventualScore, graded: true }])
    setRetryVerdictOk(eventualOk)
    setPhase('final')
  }

  const submitPart = () => {
    // A draft is never validated and never scored. It is recorded as an
    // ungraded outcome so the aggregation below can skip it entirely.
    if (spec.type === 'draft') {
      if (firstResponse === null) setFirstResponse(response)
      setPartOutcomes((prev) => [...prev, { firstCorrect: null, eventualOk: null, score: 0, graded: false }])
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
    if (partFirstResponse === null) setPartFirstResponse(response)
    if (verdict.ok) {
      resolvePart(!partWasWrongFirst, verdict.score, true)
      return
    }
    // WRONG on the first look at this checkpoint: enter the repair fork rather
    // than revealing the answer and moving on. The corrected attempt is the
    // part of the loop that the evidence actually supports (RESEARCH.md §5).
    const derived = diagnoseFrom(response)
    missSignal.current = {
      stepTag: derived,
      distractorTag: distractorTagFor(response),
      validator: validatorName(spec),
    }
    if (derived) {
      setErrorTag(derived)
      onSnapshot({ errorTag: derived })
    }
    setPartWasWrongFirst(true)
    setPhase('wrong')
  }

  /** Corrected attempt on a part after an error. */
  const submitPartRetry = () => {
    const verdict = validate(spec, response)
    if (verdict.formatError && !verdict.ok) {
      setFormatError(verdict.formatError)
      return
    }
    setFormatError(null)
    resolveCause(repairPath(verdict.ok))
    resolvePart(false, verdict.ok ? verdict.score : 0, verdict.ok)
  }

  /** After a full reveal there is nothing left to prove on this checkpoint —
   *  the miss is already logged and the scheduler will resurface the skill. */
  const resolvePartAfterReveal = () => {
    resolveCause('full-reveal')
    resolvePart(false, 0, false)
  }

  const nextPart = () => {
    if (!parts) return
    if (partIndex + 1 < parts.length) {
      setPartIndex(partIndex + 1)
      setResponse('')
      setDraftStage('write')
      setRetryVerdictOk(null)
      setPartFirstResponse(null)
      setPartWasWrongFirst(false)
      setFormatError(null)
      missSignal.current = null
      setPhase(parts[partIndex + 1].study || parts[partIndex + 1].explore ? 'study' : 'answer')
    } else {
      // Evidence rules live in engine/activity.ts so they can be tested
      // without a DOM — see activity.test.ts.
      const agg = aggregateParts(partOutcomes, hintsShown)
      if (!finished.current) {
        finished.current = true
        onFinish(
          {
            firstResponse: firstResponse ?? '',
            finalResponse: `${partOutcomes.length} parts (${agg.gradedCount} graded)`,
            correct: agg.correct,
            firstCorrect: agg.firstCorrect,
            score: agg.score,
            hintLevel: hintsShown,
            confidence,
            // The FIRST checkpoint that broke, not the last: everything after a
            // failed link in a case file tends to be downstream of it, and the
            // whole app already speaks in terms of the first meaningful error.
            // This used to be hard-coded null, so multi-part activities — case
            // files, studios, the method drill — contributed no cause at all
            // however clearly they had diagnosed one.
            errorTag: activityTags.current[0] ?? null,
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
          <DifficultyBadge difficulty={template.difficulty} showName />
          {parts ? <Chip tone="accent">{parts[partIndex].stage ? `${parts[partIndex].stage} · ` : ''}{partIndex + 1}/{parts.length}</Chip> : null}
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

      {/* Credit where the problem came from. CC BY requires attribution, and
          ATTRIBUTIONS.md promises it is visible to the learner rather than only
          to whoever reads the repository — which was not true until now. Quiet
          by design: it is a credit line, not a badge. */}
      {template.source ? (
        <p className="text-[11px] text-faint leading-snug mb-3">
          Problem from <span className="font-medium">{template.source.title}</span> by {template.source.author}, used
          under {template.source.licence}
          {template.source.adapted ? ' and adapted' : ''}.
        </p>
      ) : null}

      {template.authentic && parts ? (
        <Card className="p-4 mb-3 border-accent/30 bg-accent-soft/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-accent uppercase tracking-wide">{template.authentic.format} simulation</p>
              <p className="text-[14px] font-medium mt-0.5">Deliverable: {template.authentic.deliverable}</p>
            </div>
            <span className="text-[12px] text-faint shrink-0">~{Math.round(template.minutes)}m</span>
          </div>
          <div className="grid gap-1 mt-3" style={{ gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))` }} aria-label={`Checkpoint ${partIndex + 1} of ${parts.length}`}>
            {parts.map((part, i) => (
              <div key={`${part.stage ?? 'part'}-${i}`} className={`h-1.5 rounded-full ${i < partIndex ? 'bg-good' : i === partIndex ? 'bg-accent' : 'bg-surface3'}`} title={part.stage ?? `Part ${i + 1}`} />
            ))}
          </div>
          {partIndex === 0 ? <p className="text-[12px] text-muted mt-2 leading-snug">{template.authentic.simulationNote} Every graded checkpoint is auto-checked; the written artifact is compared with an explicit model and is never scored.</p> : null}
        </Card>
      ) : null}

      {showConcept && kbCard && partIndex === 0 && !twinItem ? (
        <Card className="p-4 mb-3 border-accent/30">
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Concept · {kbCard.title}</p>
          <Rich text={kbCard.card} className="text-[14px] text-muted" />
        </Card>
      ) : null}

      {/*
        THE SETUP for a multi-part item.

        `item.prompt` frames the whole activity — the observation to explain,
        the payoff matrix, the plan being pre-mortemed — while each part
        carries only its own question. The player rendered `parts[i].prompt`
        and never the top-level one, so that framing was invisible: "Write
        three different plausible explanations for this observation" appeared
        with no observation anywhere on screen. Reported by a learner as "For
        what observation? It didn't gave me any observation or story?", and
        41 of 55 multi-part templates were carrying something up there.

        The content audit had it right all along — `visibleText()` already
        treats `item.prompt` as learner-facing and checks its markup and
        wording. The renderer was the half that disagreed.

        Shown on every part, because a payoff matrix is needed in part three
        as much as in part one, and skipped when it would merely repeat the
        question directly below it.
      */}
      {parts && !twinItem && item.prompt?.trim() && item.prompt.trim() !== parts[partIndex].prompt.trim() ? (
        <Card className="p-4 mb-3 bg-surface2">
          <Rich text={item.prompt} className="text-[15px]" />
        </Card>
      ) : null}

      {phase === 'study' && parts && parts[partIndex].explore ? (
        <ExplorePlot
          // Remount per part: two explore parts in a row would otherwise
          // inherit the previous one's slider position and "seen" count.
          key={`explore-${partIndex}`}
          spec={parts[partIndex].explore!}
          study={parts[partIndex].study}
          onDone={() => setPhase('answer')}
        />
      ) : phase === 'study' && parts ? (
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
              {spec.type === 'draft' ? (
                <DraftInput
                  spec={spec}
                  stage={draftStage}
                  setStage={setDraftStage}
                  attempt={response}
                  setAttempt={setResponse}
                  onDone={parts ? submitPart : submitDraftSingle}
                  gradedNext={Boolean(parts && partIndex + 1 < parts.length)}
                />
              ) : (
                <>
                  <AnswerInput
                    spec={activeSpec}
                    value={response}
                    onChange={(v) => { setResponse(v); setFormatError(null) }}
                    onSubmit={() => {
                      if (!response.trim() || (needsConfidence && confidence === null)) return
                      if (phase === 'retry') (parts ? submitPartRetry : submitRetry)()
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
                      onClick={phase === 'retry' ? (parts ? submitPartRetry : submitRetry) : parts ? submitPart : submitFirst}
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
              {activeSpec.type === 'steps' ? (
                (() => {
                  // Point straight at the broken link. Everything after the
                  // first failure is downstream of it, so that is the only
                  // step worth re-examining.
                  const submitted = (parts ? partFirstResponse : firstResponse) ?? ''
                  const i = firstFailedStep(activeSpec, submitted)
                  if (i === null) return null
                  const step = activeSpec.steps[i]
                  return (
                    <p className="text-muted text-[14px] mt-1">
                      Steps 1–{i} check out. It breaks at{' '}
                      <span className="font-medium text-ink">step {i + 1}, {step.label}</span> — everything after that
                      follows from it, so this is the only line worth redoing.
                    </p>
                  )
                })()
              ) : (
                <p className="text-muted text-[14px] mt-1">
                  Your answer:{' '}
                  <span className="font-medium text-ink">
                    {describeResponse(activeSpec, (parts ? partFirstResponse : firstResponse) ?? '')}
                  </span>
                  . The attempt is the valuable part — now find the first place it went off.
                </p>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  onClick={() => {
                    setResponse('')
                    setPhase('retry')
                  }}
                >
                  Try again{hintsShown < activeHints.length ? ' (hints available)' : ''}
                </Button>
                <Button
                  kind="secondary"
                  onClick={() => {
                    setHintsShown(activeHints.length)
                    onSnapshot({ hintsUsed: activeHints.length })
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
              {/* A twin regenerates the whole template, so it only makes sense
                  for a single item — inside a multi-part activity it would
                  silently swap every other checkpoint too. */}
              {!parts && template.variants > 1 ? (
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
              ) : parts ? (
                <>
                  <p className="text-[13px] text-muted mt-3">
                    This checkpoint is logged as a miss, so the skill behind it comes back on a shorter review
                    schedule — that delayed re-test is what makes the repair stick.
                  </p>
                  <Button className="w-full mt-2" onClick={resolvePartAfterReveal}>
                    Got it
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full mt-3"
                  onClick={() => {
                    setRetryVerdictOk(false)
                    setPhase('final')
                    const tag = resolveCause('full-reveal')
                    finishSingle({ firstOk: false, eventualOk: false, score: 0, finalResp: firstResponse ?? '', tag })
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
                (parts ? partFirstResponse : firstResponse) !== null && activeSpec.type === 'mcq'
                  ? ((twinItem ?? item).distractorNotes?.[Number(parts ? partFirstResponse : firstResponse)] ?? null)
                  : null
              }
              parts={Boolean(parts)}
              supported={isPflTemplate(template.id)}
              ok={parts ? retryVerdictOk : retryVerdictOk === null ? true : retryVerdictOk}
              firstTry={parts
                ? partOutcomes[partOutcomes.length - 1]?.firstCorrect === true
                : retryVerdictOk === null && firstResponse === response}
              hintsUsed={hintsShown}
              spec={spec.type === 'draft' ? null : activeSpec}
              explanation={currentExplanation}
              commonErrors={item.commonErrors}
              wasWrongFirst={parts ? partWasWrongFirst : firstResponse !== null && retryVerdictOk !== null}
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
      {(['math', 'physics', 'coding', 'science'].includes(template.bucket) && !parts) || Boolean(template.authentic) ? (
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

      <HintSheet open={hintOpen} onClose={() => setHintOpen(false)} hints={activeHints} shown={hintsShown} onMore={revealHint} />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} templateId={template.id} version={template.version} seed={item.seed} attemptId={attemptId} graded={firstResponse !== null} />
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
          {/*
            Reserve the slot only once something is IN it.
            `min-h-10` was unconditional, so before the first tap the item drew
            a 40-pixel empty band between the instruction and the options —
            which reads as a component that failed to load rather than as an
            empty list. Same defect class as the all-empty weekly chart on
            Progress, and caught the same way: by screenshotting it rather than
            by reading the DOM, where the markup looked perfectly correct.
          */}
          <ol className={`space-y-1.5 ${chosen.length ? 'mb-3 min-h-10' : ''}`}>
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
    case 'steps': {
      // A worked chain. Every intermediate value is its own checked box, so a
      // wrong final answer can be traced to the link that actually broke.
      const given: string[] = (() => {
        try {
          const v = JSON.parse(value)
          return Array.isArray(v) ? (v as string[]) : spec.steps.map(() => '')
        } catch {
          return spec.steps.map(() => '')
        }
      })()
      const setStep = (i: number, v: string) => {
        const next = spec.steps.map((_, k) => given[k] ?? '')
        next[i] = v
        onChange(JSON.stringify(next))
      }
      return (
        <div className="space-y-3">
          {spec.steps.map((step, i) => (
            <div key={step.label}>
              <label className="text-[13px] font-medium text-muted flex items-center gap-2" htmlFor={`step-${i}`}>
                <span className="h-5 w-5 shrink-0 rounded-full bg-surface2 border border-line grid place-items-center text-[11px] font-mono">
                  {i + 1}
                </span>
                {step.label}
              </label>
              {step.answer.type === 'mcq' ? (
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {step.answer.options.map((opt, oi) => (
                    <button
                      type="button"
                      key={opt}
                      aria-pressed={given[i] === String(oi)}
                      onClick={() => setStep(i, String(oi))}
                      className={`min-h-11 px-3 rounded-lg border text-[14px] text-left transition-colors ${
                        given[i] === String(oi) ? 'bg-accent-soft border-accent/50 text-accent' : 'bg-surface border-line text-muted'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  id={`step-${i}`}
                  value={given[i] ?? ''}
                  onChange={(e) => setStep(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onSubmit) onSubmit()
                  }}
                  inputMode={step.answer.type === 'text' ? 'text' : 'decimal'}
                  autoComplete="off"
                  className="mt-1.5 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
                />
              )}
            </div>
          ))}
          <p className="text-[12px] text-faint leading-snug">
            Every line is checked. If the final answer is wrong, this shows which step it came from.
          </p>
        </div>
      )
    }
    case 'construct': {
      // Build an object rather than recall a value. The constraint list stays
      // on screen while you type, because the work here is search, and hiding
      // the target would make it a memory test instead.
      const given = parseConstruct(value) ?? {}
      const setSlot = (key: string, v: string) => {
        const next = { ...(parseConstruct(latest.current) ?? {}) }
        next[key] = v
        emit(serializeConstruct(next))
      }
      const live: Record<string, number> = {}
      for (const s of spec.slots) {
        const n = Number((given[s.key] ?? '').trim())
        if ((given[s.key] ?? '').trim() !== '' && Number.isFinite(n)) live[s.key] = n
      }
      const complete = spec.slots.every((s) => s.key in live)
      return (
        <div className="space-y-3">
          {/* Grid, not flex-wrap: with five slots on a phone the fifth wrapped
              onto its own row and stretched to the full width, so one box was
              four times the size of the others and read as the important one. */}
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))' }}>
            {spec.slots.map((s) => (
              <div key={s.key}>
                <label className="text-[12px] font-medium text-muted" htmlFor={`slot-${s.key}`}>
                  {s.label}
                </label>
                <input
                  id={`slot-${s.key}`}
                  value={given[s.key] ?? ''}
                  onChange={(e) => setSlot(s.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onSubmit) onSubmit()
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  className="mt-1 w-full bg-surface border border-line rounded-xl px-3 py-3 text-[16px] text-center outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
          <ul className="space-y-1.5" aria-label="Conditions your answer must satisfy">
            {spec.checks.map((c, i) => {
              // Ticks appear only once every box holds a number. Grading a
              // half-filled row would flash "wrong" at someone mid-typing.
              const state = !complete ? 'idle' : checkHolds(c, live) ? 'met' : 'unmet'
              return (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                  <span
                    aria-hidden
                    className={`mt-px h-4 w-4 shrink-0 rounded-full border grid place-items-center text-[10px] ${
                      state === 'met'
                        ? 'bg-ok/15 border-ok/50 text-ok'
                        : state === 'unmet'
                          ? 'border-line-strong text-faint'
                          : 'border-line text-faint'
                    }`}
                  >
                    {state === 'met' ? '✓' : ''}
                  </span>
                  <span className={state === 'met' ? 'text-muted' : ''}>
                    {c.label}
                    {complete ? <span className="sr-only">{state === 'met' ? ' — satisfied' : ' — not yet satisfied'}</span> : null}
                  </span>
                </li>
              )
            })}
          </ul>
          {/* Conditional, because it is a factual claim. `nr-integer-pair` had
              exactly one answer at three of eight seeds while this line
              promised otherwise. The generators now guarantee a second answer,
              and this stops the copy asserting it regardless. */}
          <p className="text-[12px] text-faint leading-snug">
            {spec.solutionCount === 1
              ? 'There is exactly one set of values that works here.'
              : 'More than one answer works. Any set of values meeting every condition is correct.'}
          </p>
        </div>
      )
    }
    case 'draft':
      return null // drafts render through DraftInput, never as a graded input
  }
}

/**
 * The written artifact. Two stages: write it from your own head, then read it
 * beside the model. There is deliberately NO rating control — the app does not
 * score this and neither do you. The evidence lives in the graded part that
 * follows, which is the only thing that can move a skill.
 */
function DraftInput({
  spec,
  stage,
  setStage,
  attempt,
  setAttempt,
  onDone,
  gradedNext,
}: {
  spec: Extract<AnswerSpec, { type: 'draft' }>
  stage: 'write' | 'compare'
  setStage: (s: 'write' | 'compare') => void
  attempt: string
  setAttempt: (s: string) => void
  onDone: () => void
  gradedNext: boolean
}) {
  const wordCount = attempt.trim() ? attempt.trim().split(/\s+/).length : 0
  const minWords = Math.max(3, spec.minWords ?? 3)
  if (stage === 'write') {
    return (
      <div>
        <textarea
          value={attempt}
          onChange={(e) => setAttempt(e.target.value.slice(0, 6000))}
          rows={spec.minWords && spec.minWords >= 80 ? 9 : 5}
          placeholder={spec.placeholder ?? 'Write your answer here — the honest attempt is what makes the comparison work.'}
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent resize-y"
        />
        <div className="flex items-center justify-between gap-3 mt-1.5 px-1 text-[12px] text-faint">
          <span>{wordCount} word{wordCount === 1 ? '' : 's'}</span>
          <span>{wordCount >= minWords ? 'Ready to compare' : `${minWords - wordCount} more for a complete attempt`}</span>
        </div>
        <p className="text-[12px] text-faint mt-2 px-1 leading-snug">
          Not scored — writing it is the point. Get it out of your own head before the model appears.
        </p>
        <Button className="w-full mt-3" onClick={() => setStage('compare')} disabled={wordCount < minWords}>
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
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">What a strong version contains</p>
        <ul className="space-y-2">
          {spec.criteria.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-[14px] leading-snug">
              <span className="text-faint mt-0.5" aria-hidden>
                •
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-faint mt-3 leading-snug">
          Read these against your draft. Nothing here is scored — not by the app, not by you.
          {gradedNext ? ' The graded part is next.' : ''}
        </p>
      </Card>
      <Button className="w-full mt-3" onClick={onDone}>
        {gradedNext ? 'Continue to the graded part' : 'Done'}
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
  supported,
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
  supported: boolean
}) {
  const suggested = commonErrors ? (Object.keys(commonErrors)[0] as ErrorTag | undefined) : undefined
  return (
    <div className="mt-4 anim-in" role="status" aria-live="polite">
      <Card className={`p-4 ${ok ? 'border-good/40' : 'border-warn/40'}`}>
        <p className={`font-semibold text-[15px] ${ok ? 'text-good' : 'text-warn'}`}>
          {verdictMessage({ ok, firstTry, hintsUsed, supported })}
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

function ReportDialog({ open, onClose, templateId, version, seed, attemptId, graded }: { open: boolean; onClose: () => void; templateId: string; version: number; seed: number; attemptId: string; graded: boolean }) {
  const { dispatch } = useStore()
  const [note, setNote] = useState('')
  const [contest, setContest] = useState(false)
  // `attemptId` is the id this activity WILL be logged under, handed down from
  // the session rather than looked up. The lookup version could never find
  // anything: the event is not written until the activity finishes, so the
  // contest option was unreachable at the only moment a learner wants it —
  // right after seeing a mark they disagree with. `graded` gates it on an
  // answer actually having been submitted; there is nothing to contest before.
  return (
    <Modal open={open} onClose={onClose} title="Report a problem">
      <p className="text-muted text-sm">
        Describe what's wrong (unclear wording, wrong answer, broken interaction). Reports are stored locally and go
        out only if you export them — nothing is transmitted.
      </p>
      {graded ? (
        <label className="mt-3 flex items-start gap-2.5 bg-surface2 border border-line rounded-xl p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={contest}
            onChange={(e) => setContest(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-[14px] leading-snug">
            <span className="font-medium">This was marked against me and it should not have been.</span>
            <span className="block text-muted text-[13px] mt-0.5">
              The attempt stops counting straight away — no effect on mastery, difficulty or your practice balance —
              and stays out until you say what happened. You do not have to decide now.
            </span>
          </span>
        </label>
      ) : null}
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
          const t = Date.now()
          dispatch({ type: 'add-report', report: { id: uid('pr'), t, templateId, itemVersion: version, seed, note: note.trim() } })
          if (contest) {
            dispatch({
              type: 'raise-dispute',
              dispute: { id: uid('dp'), t, kind: 'raised', attemptId, templateId, itemVersion: version, seed, note: note.trim() },
            })
          }
          setNote('')
          setContest(false)
          onClose()
        }}
      >
        {contest ? 'Save report and stop it counting' : 'Save report'}
      </Button>
    </Modal>
  )
}
