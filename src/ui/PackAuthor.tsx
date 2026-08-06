/**
 * Pack Author — build, validate, export, and install content packs entirely
 * in-app. Everything runs through the same validatePack gate as imports, so
 * an authored pack is exactly as trustworthy as the schema allows.
 */
import { useMemo, useState } from 'react'
import type { AnswerSpec, BucketId, ContentPackJson, PackItemJson } from '../domain/types'
import { validatePack } from '../engine/contentSchema'
import { validate, correctResponse } from '../engine/validate'
import { DIFFICULTY_INFO } from '../content/difficulty'
import { SKILLS } from '../content/skills'
import { useStore } from '../store/store'
import { Button, Card, Chip, Modal, Segmented } from './components'

type AnswerKind = 'numeric' | 'text' | 'mcq'

interface DraftItem {
  name: string
  skillId: string
  difficulty: 1 | 2 | 3 | 4 | 5
  prompt: string
  answerKind: AnswerKind
  numericAnswer: string
  textAnswer: string
  mcqOptions: string[]
  mcqCorrect: number
  hint1: string
  hint2: string
  explanation: string
}

function emptyItem(): DraftItem {
  return {
    name: '',
    skillId: 'm-lineq1',
    difficulty: 2,
    prompt: '',
    answerKind: 'numeric',
    numericAnswer: '',
    textAnswer: '',
    mcqOptions: ['', '', '', ''],
    mcqCorrect: 0,
    hint1: '',
    hint2: '',
    explanation: '',
  }
}

function toAnswerSpec(d: DraftItem): AnswerSpec | null {
  if (d.answerKind === 'numeric') {
    const n = Number(d.numericAnswer)
    return Number.isFinite(n) ? { type: 'numeric', answer: n } : null
  }
  if (d.answerKind === 'text') {
    return d.textAnswer.trim() ? { type: 'text', accept: [d.textAnswer.trim()] } : null
  }
  const opts = d.mcqOptions.map((o) => o.trim()).filter(Boolean)
  if (opts.length < 2 || d.mcqCorrect >= opts.length) return null
  return { type: 'mcq', options: opts, correct: d.mcqCorrect }
}

export function PackAuthor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const [packName, setPackName] = useState('My practice pack')
  const [author, setAuthor] = useState('me')
  const [items, setItems] = useState<PackItemJson[]>([])
  const [draft, setDraft] = useState<DraftItem>(emptyItem())
  const [message, setMessage] = useState<string | null>(null)

  const academicSkills = useMemo(() => SKILLS.filter((s) => ['math', 'physics', 'coding', 'science'].includes(s.bucket)), [])

  const buildPack = (): ContentPackJson | null => {
    const pack = {
      schema: 'axiomlab-pack@1' as const,
      meta: {
        id: 'user-' + packName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40),
        name: packName.trim() || 'My pack',
        version: 1,
        description: 'Authored in-app',
        author: author.trim() || 'me',
      },
      items,
    }
    const verdict = validatePack(pack)
    if (!verdict.ok) {
      setMessage('Pack failed validation: ' + verdict.errors[0])
      return null
    }
    return verdict.pack
  }

  const addItem = () => {
    const spec = toAnswerSpec(draft)
    if (!spec) {
      setMessage('The answer is incomplete — a numeric value, accepted text, or 2+ options with a correct pick.')
      return
    }
    // Self-check: the stated answer must pass the real validator.
    if (!validate(spec, correctResponse(spec)).ok) {
      setMessage('Something is off with that answer spec — it fails its own validator.')
      return
    }
    if (draft.prompt.trim().length < 10 || draft.explanation.trim().length < 10 || !draft.hint1.trim()) {
      setMessage('Every item needs a real prompt, at least one hint, and an explanation — that is the pack law.')
      return
    }
    const skill = academicSkills.find((s) => s.id === draft.skillId)!
    const item: PackItemJson = {
      id: 'item-' + (items.length + 1) + '-' + Date.now().toString(36),
      version: 1,
      name: draft.name.trim() || draft.prompt.trim().slice(0, 40),
      skillIds: [draft.skillId],
      bucket: skill.bucket as BucketId,
      difficulty: draft.difficulty,
      prompt: draft.prompt.trim(),
      answer: spec,
      hints: [draft.hint1.trim(), draft.hint2.trim()].filter(Boolean),
      explanation: draft.explanation.trim(),
      provenance: `Authored in-app by ${author.trim() || 'the user'}`,
      minutes: 2,
    }
    setItems((prev) => [...prev, item])
    setDraft(emptyItem())
    setMessage(`Added — ${items.length + 1} item${items.length ? 's' : ''} in the pack.`)
  }

  const exportPack = () => {
    const pack = buildPack()
    if (!pack) return
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pack.meta.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Exported — share it or re-import it anywhere.')
  }

  const installPack = () => {
    const pack = buildPack()
    if (!pack) return
    dispatch({ type: 'add-pack', pack })
    setMessage(`Installed "${pack.meta.name}" — its items now appear in Practice.`)
  }

  const inputCls = 'w-full bg-surface2 border border-line rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-accent'

  return (
    <Modal open={open} onClose={onClose} title="Pack author" wide>
      <p className="text-[13px] text-muted leading-relaxed">
        Build your own practice items (from a textbook, a class worksheet, anything). Packs pass the same validation
        gate as imports; solve each item yourself before trusting it — the validator checks format, not truth.
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <input value={packName} onChange={(e) => setPackName(e.target.value.slice(0, 60))} placeholder="Pack name" aria-label="Pack name" className={inputCls} />
        <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 40))} placeholder="Author" aria-label="Author" className={inputCls} />
      </div>

      <Card className="p-4 mt-3 bg-surface2">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">New item</p>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Skill" value={draft.skillId} onChange={(e) => setDraft({ ...draft, skillId: e.target.value })} className={inputCls}>
              {academicSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select aria-label="Difficulty" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) as DraftItem['difficulty'] })} className={inputCls}>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}★ — {DIFFICULTY_INFO[d as DraftItem['difficulty']].name}
                </option>
              ))}
            </select>
          </div>
          <textarea value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value.slice(0, 2000) })} rows={2} placeholder="Problem prompt" aria-label="Prompt" className={inputCls} />
          <Segmented<AnswerKind>
            ariaLabel="Answer kind"
            value={draft.answerKind}
            onChange={(v) => setDraft({ ...draft, answerKind: v })}
            options={[
              { value: 'numeric', label: 'Number' },
              { value: 'text', label: 'Text' },
              { value: 'mcq', label: 'Choices' },
            ]}
          />
          {draft.answerKind === 'numeric' ? (
            <input value={draft.numericAnswer} onChange={(e) => setDraft({ ...draft, numericAnswer: e.target.value })} placeholder="Correct number (e.g. 42 or 0.75)" aria-label="Correct number" className={inputCls} />
          ) : draft.answerKind === 'text' ? (
            <input value={draft.textAnswer} onChange={(e) => setDraft({ ...draft, textAnswer: e.target.value.slice(0, 200) })} placeholder="Accepted answer text" aria-label="Accepted text" className={inputCls} />
          ) : (
            <div className="space-y-1.5">
              {draft.mcqOptions.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    aria-label={`Mark option ${i + 1} correct`}
                    aria-pressed={draft.mcqCorrect === i}
                    onClick={() => setDraft({ ...draft, mcqCorrect: i })}
                    className={`h-6 w-6 rounded-full border grid place-items-center text-[11px] shrink-0 ${draft.mcqCorrect === i ? 'bg-good text-bg border-good' : 'border-line-strong text-faint'}`}
                  >
                    ✓
                  </button>
                  <input value={o} onChange={(e) => setDraft({ ...draft, mcqOptions: draft.mcqOptions.map((x, j) => (j === i ? e.target.value.slice(0, 200) : x)) })} placeholder={`Option ${i + 1}${i > 1 ? ' (optional)' : ''}`} aria-label={`Option ${i + 1}`} className={inputCls} />
                </div>
              ))}
            </div>
          )}
          <input value={draft.hint1} onChange={(e) => setDraft({ ...draft, hint1: e.target.value.slice(0, 500) })} placeholder="Hint 1 (required)" aria-label="Hint 1" className={inputCls} />
          <input value={draft.hint2} onChange={(e) => setDraft({ ...draft, hint2: e.target.value.slice(0, 500) })} placeholder="Hint 2 (optional)" aria-label="Hint 2" className={inputCls} />
          <textarea value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value.slice(0, 2000) })} rows={2} placeholder="Worked explanation (shown after the attempt)" aria-label="Explanation" className={inputCls} />
          <Button kind="secondary" className="w-full" onClick={addItem}>
            Add item to pack
          </Button>
        </div>
      </Card>

      {items.length ? (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">In this pack ({items.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((it, i) => (
              <Chip key={it.id} tone="accent">
                {it.name.slice(0, 24)}
                <button className="ml-1 opacity-70 hover:opacity-100" aria-label={`Remove ${it.name}`} onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                  ×
                </button>
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="text-[13px] text-muted mt-2" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex gap-2 mt-4">
        <Button kind="secondary" className="flex-1" onClick={exportPack} disabled={!items.length}>
          Export JSON
        </Button>
        <Button className="flex-1" onClick={installPack} disabled={!items.length}>
          Install to my library
        </Button>
      </div>
    </Modal>
  )
}
