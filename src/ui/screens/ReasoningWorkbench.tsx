import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ReasoningCase, ReasoningCaseKind } from '../../domain/types'
import { uid } from '../../engine/rng'
import {
  RIVAL_PROMPTS,
  auditReasoningCase,
  reasoningCaseBlockers,
  reasoningCaseCompleteness,
  splitReasoningLines,
} from '../../engine/reasoningCase'
import { useStore } from '../../store/store'
import { Button, Chip, Modal, ProgressBar, Segmented } from '../components'

type Panel = 'list' | 'edit' | 'review' | 'resolve'

const KIND_LABEL: Record<ReasoningCaseKind, string> = {
  claim: 'Claim',
  decision: 'Decision',
  explanation: 'Explanation',
}

const STEPS = ['Frame it', 'Separate it', 'Rival it', 'Test it']

function blankCase(): ReasoningCase {
  const now = Date.now()
  return {
    id: uid('rc'),
    createdAt: now,
    updatedAt: now,
    kind: 'claim',
    status: 'draft',
    stage: 0,
    question: '',
    stakes: '',
    observations: [],
    inferences: [],
    alternatives: [],
    assumptions: [],
    disconfirmingTest: '',
    conclusion: '',
    confidence: 50,
    resolution: null,
  }
}

export function ReasoningWorkbench({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [panel, setPanel] = useState<Panel>('list')
  const [draft, setDraft] = useState<ReasoningCase | null>(null)
  const [step, setStep] = useState(0)
  const [resolveOutcome, setResolveOutcome] = useState<'held-up' | 'mixed' | 'wrong'>('mixed')
  const [resolveNote, setResolveNote] = useState('')
  const [resolveLesson, setResolveLesson] = useState('')

  const cases = useMemo(
    () => [...state.reasoningCases].sort((a, b) => {
      if (a.status === 'resolved' && b.status !== 'resolved') return 1
      if (a.status !== 'resolved' && b.status === 'resolved') return -1
      return b.updatedAt - a.updatedAt
    }),
    [state.reasoningCases],
  )

  const persist = (value: ReasoningCase) => {
    dispatch({ type: 'upsert-reasoning-case', reasoningCase: { ...value, updatedAt: Date.now() } })
  }

  const close = () => {
    // A framed case is valuable even if the sheet is dismissed halfway. Save
    // it automatically so a real interruption does not erase the reasoning.
    if (draft && draft.question.trim().length >= 3 && panel === 'edit') {
      persist({ ...draft, stage: Math.max(draft.stage, step) })
    }
    setDraft(null)
    setPanel('list')
    onClose()
  }

  const start = () => {
    setDraft(blankCase())
    setStep(0)
    setPanel('edit')
  }

  const edit = (value: ReasoningCase) => {
    setDraft(value)
    setStep(Math.min(3, value.stage))
    setPanel(value.status === 'draft' ? 'edit' : 'review')
  }

  const resolve = (value: ReasoningCase) => {
    setDraft(value)
    setResolveOutcome('mixed')
    setResolveNote('')
    setResolveLesson('')
    setPanel('resolve')
  }

  const saveDraft = () => {
    if (!draft) return
    if (draft.question.trim().length < 3) {
      setDraft(null)
      setPanel('list')
      return
    }
    const saved = { ...draft, stage: Math.max(draft.stage, step) }
    persist(saved)
    setDraft(null)
    setPanel('list')
  }

  const commit = () => {
    if (!draft || reasoningCaseBlockers(draft).length) return
    persist({ ...draft, status: 'committed', stage: 3 })
    setDraft(null)
    setPanel('list')
  }

  const finishResolution = () => {
    if (!draft || !resolveNote.trim() || !resolveLesson.trim()) return
    persist({
      ...draft,
      status: 'resolved',
      resolution: {
        outcome: resolveOutcome,
        note: resolveNote.trim().slice(0, 1000),
        lesson: resolveLesson.trim().slice(0, 1000),
        resolvedAt: Date.now(),
      },
    })
    setDraft(null)
    setPanel('list')
  }

  return (
    <Modal open={open} onClose={close} title="Reasoning workbench" wide>
      {panel === 'list' ? (
        <CaseList cases={cases} onStart={start} onEdit={edit} onResolve={resolve} />
      ) : panel === 'resolve' && draft ? (
        <ResolutionPanel
          reasoningCase={draft}
          outcome={resolveOutcome}
          note={resolveNote}
          lesson={resolveLesson}
          onOutcome={setResolveOutcome}
          onNote={setResolveNote}
          onLesson={setResolveLesson}
          onBack={() => { setDraft(null); setPanel('list') }}
          onSave={finishResolution}
        />
      ) : panel === 'review' && draft ? (
        <ReviewPanel reasoningCase={draft} onBack={() => { setDraft(null); setPanel('list') }} />
      ) : draft ? (
        <Editor
          value={draft}
          step={step}
          onChange={setDraft}
          onStep={setStep}
          onBackToList={() => { saveDraft() }}
          onCommit={commit}
        />
      ) : null}
    </Modal>
  )
}

function CaseList({
  cases,
  onStart,
  onEdit,
  onResolve,
}: {
  cases: ReasoningCase[]
  onStart: () => void
  onEdit: (value: ReasoningCase) => void
  onResolve: (value: ReasoningCase) => void
}) {
  return (
    <div className="pb-4">
      <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
        <p className="font-semibold text-[15px]">Use it on something real</p>
        <p className="text-[13px] text-muted mt-1 leading-relaxed">
          Break a claim or decision into facts, interpretations, rival possibilities, and a check that could change
          your mind. The app checks the structure—not whether your conclusion is “right.”
        </p>
        <Button className="w-full mt-4" onClick={onStart}>Start a reasoning case</Button>
      </div>

      {cases.length ? (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-muted">Your cases</h3>
            <span className="text-[11px] text-faint">Saved only on this device</span>
          </div>
          {cases.map((value) => {
            const completeness = reasoningCaseCompleteness(value)
            return (
              <div key={value.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <Chip tone={value.status === 'resolved' ? 'good' : value.status === 'committed' ? 'accent' : 'neutral'}>
                        {value.status === 'resolved' ? 'Resolved' : value.status === 'committed' ? 'Committed' : 'Draft'}
                      </Chip>
                      <Chip>{KIND_LABEL[value.kind]}</Chip>
                    </div>
                    <p className="font-medium text-[15px] leading-snug">{value.question}</p>
                    <p className="text-[11px] text-faint mt-1">
                      Updated {new Date(value.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {value.status === 'draft' ? ` · ${completeness}% structured` : ` · committed at ${value.confidence}%`}
                    </p>
                  </div>
                </div>
                {value.status === 'draft' ? <div className="mt-3"><ProgressBar value={completeness} max={100} label={`${completeness}% structured`} /></div> : null}
                {value.resolution ? (
                  <p className="text-[12px] text-muted mt-3 border-l-2 border-good pl-3">
                    <span className="font-medium text-ink">What happened:</span> {value.resolution.note}
                  </p>
                ) : null}
                <div className="flex gap-2 mt-3">
                  <Button kind="secondary" className="flex-1" onClick={() => onEdit(value)}>
                    {value.status === 'draft' ? 'Resume' : 'Review reasoning'}
                  </Button>
                  {value.status === 'committed' ? (
                    <Button className="flex-1" onClick={() => onResolve(value)}>Resolve outcome</Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-faint py-8">No cases yet. Start with a choice or claim that matters this week.</p>
      )}
      <p className="text-[11px] text-faint leading-relaxed mt-4 px-1">
        Cases are self-authored and never count as mastery evidence. Their value is in making your reasoning explicit
        before the outcome is known.
      </p>
    </div>
  )
}

function Editor({
  value,
  step,
  onChange,
  onStep,
  onBackToList,
  onCommit,
}: {
  value: ReasoningCase
  step: number
  onChange: (value: ReasoningCase) => void
  onStep: (step: number) => void
  onBackToList: () => void
  onCommit: () => void
}) {
  const update = (patch: Partial<ReasoningCase>) => onChange({ ...value, ...patch })
  const blockers = reasoningCaseBlockers(value)
  const canNext =
    step === 0 ? value.question.trim().length >= 8 :
      step === 1 ? value.observations.length > 0 && value.inferences.length > 0 :
        step === 2 ? value.alternatives.length >= 2 && value.assumptions.length > 0 :
          blockers.length === 0

  return (
    <div className="pb-5">
      <div className="grid grid-cols-4 gap-1.5 mb-5" role="progressbar" aria-label="Reasoning case progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1}>
        {STEPS.map((label, i) => (
          <button
            type="button"
            key={label}
            onClick={() => { if (i <= value.stage || i <= step) onStep(i) }}
            className={`text-left min-w-0 ${i <= step ? 'text-accent' : 'text-faint'}`}
          >
            <span className={`block h-1 rounded-full mb-1.5 ${i <= step ? 'bg-accent' : 'bg-surface3'}`} />
            <span className="text-[10px] sm:text-[11px] font-medium truncate block">{label}</span>
          </button>
        ))}
      </div>

      {step === 0 ? <FrameStep value={value} update={update} /> : null}
      {step === 1 ? <SeparateStep value={value} update={update} /> : null}
      {step === 2 ? <RivalStep value={value} update={update} /> : null}
      {step === 3 ? <TestStep value={value} update={update} /> : null}

      {!canNext ? (
        <p className="text-[12px] text-warn mt-4" role="status">
          {step === 0 ? 'Make the question specific enough to investigate.' :
            step === 1 ? 'Add at least one observation and one interpretation.' :
              step === 2 ? 'Keep two alternatives alive and expose one assumption.' : blockers[0]}
        </p>
      ) : null}

      <div className="flex gap-2 mt-5">
        <Button kind="secondary" className="flex-[0.7]" onClick={() => step > 0 ? onStep(step - 1) : onBackToList()}>
          {step > 0 ? 'Back' : value.question.trim().length >= 3 ? 'Save draft' : 'Cancel'}
        </Button>
        {step < 3 ? (
          <Button
            className="flex-1"
            disabled={!canNext}
            onClick={() => {
              update({ stage: Math.max(value.stage, step + 1) })
              onStep(step + 1)
            }}
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1" disabled={!canNext || value.status === 'resolved'} onClick={onCommit}>
            {value.status === 'committed' ? 'Update commitment' : value.status === 'resolved' ? 'Already resolved' : 'Commit this reasoning'}
          </Button>
        )}
      </div>
      {step > 0 && value.status !== 'resolved' ? (
        <button type="button" className="w-full min-h-11 mt-1 text-sm text-muted hover:text-ink" onClick={onBackToList}>
          Save draft & close
        </button>
      ) : null}
    </div>
  )
}

function FrameStep({ value, update }: StepProps) {
  return (
    <div>
      <StepHeading number="01" title="Frame the real question" body="A vague concern cannot be tested. Choose whether you are evaluating a claim, making a choice, or explaining what happened." />
      <Segmented
        ariaLabel="Reasoning case type"
        value={value.kind}
        onChange={(kind) => update({ kind })}
        options={[
          { value: 'claim', label: 'Evaluate a claim' },
          { value: 'decision', label: 'Make a decision' },
          { value: 'explanation', label: 'Explain what happened' },
        ]}
      />
      <Field label={value.kind === 'decision' ? 'What choice are you making?' : value.kind === 'explanation' ? 'What are you trying to explain?' : 'What claim are you evaluating?'}>
        <textarea
          autoFocus
          rows={3}
          value={value.question}
          onChange={(e) => update({ question: e.target.value.slice(0, 500) })}
          placeholder={value.kind === 'decision' ? 'Should I…?' : value.kind === 'explanation' ? 'Why did…?' : 'Is it true that…?'}
          className={TEXTAREA}
        />
      </Field>
      <Field label="What is at stake if your reasoning is wrong?" optional>
        <textarea rows={2} value={value.stakes} onChange={(e) => update({ stakes: e.target.value.slice(0, 500) })} placeholder="Time, money, trust, a missed opportunity…" className={TEXTAREA} />
      </Field>
    </div>
  )
}

function SeparateStep({ value, update }: StepProps) {
  return (
    <div>
      <StepHeading number="02" title="Separate signal from story" body="Write one item per line. Observations should be camera-checkable; inferences are the meaning you are adding." />
      <Field label="What did you directly observe?" hint="Numbers, dates, actions, exact words—without “probably,” motives, or causes.">
        <textarea rows={5} value={value.observations.join('\n')} onChange={(e) => update({ observations: splitReasoningLines(e.target.value) })} placeholder={'Traffic fell 12%\nThe release went out Tuesday\nThree users reported a blank screen'} className={TEXTAREA} />
      </Field>
      <Field label="What are you inferring from those observations?" hint="These may be reasonable. The important move is labeling them.">
        <textarea rows={4} value={value.inferences.join('\n')} onChange={(e) => update({ inferences: splitReasoningLines(e.target.value) })} placeholder={'The release may have caused the drop\nThe reports may share one browser bug'} className={TEXTAREA} />
      </Field>
      {auditReasoningCase(value).filter((a) => a.id === 'observation-inference').map((a) => <AuditCard key={a.id} audit={a} />)}
    </div>
  )
}

function RivalStep({ value, update }: StepProps) {
  return (
    <div>
      <StepHeading number="03" title="Keep rival possibilities alive" body="The first plausible story gets an unfair head start. Force at least one genuine competitor onto the page." />
      <Field label="Alternatives" hint="One per line. For a decision, list real options; for a claim or explanation, list competing accounts.">
        <textarea rows={5} value={value.alternatives.join('\n')} onChange={(e) => update({ alternatives: splitReasoningLines(e.target.value, 6) })} placeholder={'The release introduced a bug\nTraffic quality changed\nThe measurement itself broke'} className={TEXTAREA} />
      </Field>
      <div className="rounded-xl bg-surface2 border border-line p-3 mt-3">
        <p className="text-[11px] uppercase tracking-wide text-faint font-semibold">Prompts if you are stuck</p>
        <ul className="mt-1.5 space-y-1.5">
          {RIVAL_PROMPTS[value.kind].map((prompt) => <li key={prompt} className="text-[12px] text-muted leading-snug flex gap-2"><span className="text-accent">→</span><span>{prompt}</span></li>)}
        </ul>
      </div>
      <Field label="What assumptions are carrying your current favorite?" hint="One per line. Prefer assumptions that could actually fail.">
        <textarea rows={4} value={value.assumptions.join('\n')} onChange={(e) => update({ assumptions: splitReasoningLines(e.target.value) })} placeholder={'The analytics are complete\nNothing else changed that week'} className={TEXTAREA} />
      </Field>
    </div>
  )
}

function TestStep({ value, update }: StepProps) {
  const audits = auditReasoningCase(value)
  return (
    <div>
      <StepHeading number="04" title="Choose a test, then commit" body="Decide what could change your mind before you see it. That is what makes the later outcome informative." />
      <Field label="What next check would best separate the alternatives?" hint="A good check could come out more than one way—and those results would point in different directions.">
        <textarea rows={3} value={value.disconfirmingTest} onChange={(e) => update({ disconfirmingTest: e.target.value.slice(0, 1000) })} placeholder="If I saw ___, I would lower confidence because ___." className={TEXTAREA} />
      </Field>
      <Field label="Your current conclusion or next move">
        <textarea rows={3} value={value.conclusion} onChange={(e) => update({ conclusion: e.target.value.slice(0, 1000) })} placeholder="Given what I know now, I will…" className={TEXTAREA} />
      </Field>
      <div className="mt-4 rounded-xl border border-line bg-surface2 p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="case-confidence" className="text-sm font-medium">Confidence in this conclusion</label>
          <span className="font-mono text-lg font-semibold text-accent">{value.confidence}%</span>
        </div>
        <input id="case-confidence" type="range" min={5} max={95} step={5} value={value.confidence} onChange={(e) => update({ confidence: Number(e.target.value) })} className="w-full mt-2 min-h-8" />
        <p className="text-[11px] text-faint">Not “how sure do I feel?”—how often would conclusions this strong hold up in similar cases?</p>
      </div>
      <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-muted mt-5 mb-2">Structure check</h3>
      <div className="space-y-2">{audits.map((audit) => <AuditCard key={audit.id} audit={audit} />)}</div>
    </div>
  )
}

function ReviewPanel({ reasoningCase, onBack }: { reasoningCase: ReasoningCase; onBack: () => void }) {
  return (
    <div className="pb-5">
      <div className="flex flex-wrap gap-1.5">
        <Chip tone={reasoningCase.status === 'resolved' ? 'good' : 'accent'}>
          {reasoningCase.status === 'resolved' ? 'Resolved' : 'Committed'}
        </Chip>
        <Chip>{KIND_LABEL[reasoningCase.kind]}</Chip>
        <Chip tone="accent">{reasoningCase.confidence}% confidence</Chip>
      </div>
      <h3 className="font-display text-xl font-semibold mt-3">{reasoningCase.question}</h3>
      {reasoningCase.stakes ? <p className="text-[13px] text-muted mt-1"><span className="font-medium text-ink">Stakes:</span> {reasoningCase.stakes}</p> : null}

      <ReviewSection title="Observed" items={reasoningCase.observations} />
      <ReviewSection title="Inferred" items={reasoningCase.inferences} />
      <ReviewSection title="Rival alternatives" items={reasoningCase.alternatives} />
      <ReviewSection title="Assumptions" items={reasoningCase.assumptions} />

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-line bg-surface2 p-3.5">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-faint">Would change my mind</p>
          <p className="text-[13px] mt-1 leading-relaxed">{reasoningCase.disconfirmingTest}</p>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-3.5">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-accent">Committed move</p>
          <p className="text-[13px] mt-1 leading-relaxed">{reasoningCase.conclusion}</p>
        </div>
      </div>

      {reasoningCase.resolution ? (
        <div className="rounded-xl border border-good/35 bg-good-soft p-4 mt-4">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-good">Outcome · {reasoningCase.resolution.outcome.replace('-', ' ')}</p>
          <p className="text-[13px] mt-1"><span className="font-medium">What happened:</span> {reasoningCase.resolution.note}</p>
          <p className="text-[13px] mt-1"><span className="font-medium">Update:</span> {reasoningCase.resolution.lesson}</p>
        </div>
      ) : (
        <p className="text-[12px] text-faint mt-4 leading-relaxed">Locked at commitment so the original reasoning cannot be rewritten after the outcome. Resolve it from the case list when you know what happened.</p>
      )}
      <Button kind="secondary" className="w-full mt-5" onClick={onBack}>Back to cases</Button>
    </div>
  )
}

function ReviewSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-faint">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => <li key={`${title}-${i}`} className="text-[13px] leading-relaxed flex gap-2"><span className="text-accent">·</span><span>{item}</span></li>)}
      </ul>
    </div>
  )
}

function ResolutionPanel({
  reasoningCase,
  outcome,
  note,
  lesson,
  onOutcome,
  onNote,
  onLesson,
  onBack,
  onSave,
}: {
  reasoningCase: ReasoningCase
  outcome: 'held-up' | 'mixed' | 'wrong'
  note: string
  lesson: string
  onOutcome: (value: 'held-up' | 'mixed' | 'wrong') => void
  onNote: (value: string) => void
  onLesson: (value: string) => void
  onBack: () => void
  onSave: () => void
}) {
  return (
    <div className="pb-5">
      <Chip tone="accent">Committed at {reasoningCase.confidence}%</Chip>
      <h3 className="font-display text-lg font-semibold mt-3">{reasoningCase.question}</h3>
      <p className="text-[13px] text-muted mt-1"><span className="font-medium text-ink">Your move:</span> {reasoningCase.conclusion}</p>
      <div className="mt-5">
        <p className="text-sm font-medium mb-1.5">How did the conclusion hold up?</p>
        <Segmented
          ariaLabel="Case outcome"
          value={outcome}
          onChange={onOutcome}
          options={[
            { value: 'held-up', label: 'Held up' },
            { value: 'mixed', label: 'Mixed' },
            { value: 'wrong', label: 'Wrong' },
          ]}
        />
      </div>
      <Field label="What actually happened?">
        <textarea rows={4} value={note} onChange={(e) => onNote(e.target.value.slice(0, 1000))} placeholder="Record the outcome before explaining it away." className={TEXTAREA} />
      </Field>
      <Field label="What should future-you update?" hint="Name a cue, assumption, or test—not a personality verdict.">
        <textarea rows={4} value={lesson} onChange={(e) => onLesson(e.target.value.slice(0, 1000))} placeholder="Next time, I should check…" className={TEXTAREA} />
      </Field>
      <div className="flex gap-2 mt-5">
        <Button kind="secondary" className="flex-[0.7]" onClick={onBack}>Back</Button>
        <Button className="flex-1" disabled={!note.trim() || !lesson.trim()} onClick={onSave}>Save outcome</Button>
      </div>
    </div>
  )
}

interface StepProps {
  value: ReasoningCase
  update: (patch: Partial<ReasoningCase>) => void
}

function StepHeading({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[11px] text-accent font-semibold">{number} / 04</p>
      <h3 className="font-display text-xl font-semibold mt-1">{title}</h3>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">{body}</p>
    </div>
  )
}

function Field({ children, label, hint, optional }: { children: ReactNode; label: string; hint?: string; optional?: boolean }) {
  return (
    <label className="block mt-4">
      <span className="text-sm font-medium">{label}</span>
      {optional ? <span className="text-[11px] text-faint ml-1">optional</span> : null}
      {hint ? <span className="block text-[11px] text-faint mt-0.5 leading-snug">{hint}</span> : null}
      <span className="block mt-1.5">{children}</span>
    </label>
  )
}

function AuditCard({ audit }: { audit: ReturnType<typeof auditReasoningCase>[number] }) {
  const styles = audit.tone === 'warn' ? 'border-warn/35 bg-warn-soft' : audit.tone === 'good' ? 'border-good/30 bg-good-soft' : 'border-line bg-surface2'
  const icon = audit.tone === 'warn' ? '!' : audit.tone === 'good' ? '✓' : '·'
  return (
    <div className={`rounded-xl border p-3 flex gap-2.5 ${styles}`}>
      <span className={`h-5 w-5 rounded-full grid place-items-center shrink-0 text-[11px] font-bold ${audit.tone === 'warn' ? 'bg-warn text-bg' : audit.tone === 'good' ? 'bg-good text-bg' : 'bg-surface3 text-muted'}`}>{icon}</span>
      <div>
        <p className="text-[12px] font-semibold">{audit.title}</p>
        <p className="text-[11px] text-muted mt-0.5 leading-snug">{audit.detail}</p>
      </div>
    </div>
  )
}

const TEXTAREA = 'w-full resize-y bg-surface border border-line rounded-xl px-3.5 py-3 text-[15px] leading-relaxed outline-none focus:border-accent placeholder:text-faint/80'
