/**
 * Practice: labs, modes, and the browsable activity catalog. Every visible
 * card launches something real — deferred areas simply don't appear.
 */
import { useMemo, useState } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { useNav } from '../nav'
import { buildContentIndex } from '../../content/registry'
import { dueReviews } from '../../engine/scheduler'
import type { AuthenticFormat, BucketId, ItemTemplate } from '../../domain/types'
import { BUCKET_BY_ID } from '../../domain/types'
import { Button, Card, Chip, DifficultyBadge, DifficultyGuide, EmptyState, HeaderBar, Modal, SectionTitle } from '../components'
import { DIFFICULTY_INFO } from '../../content/difficulty'
import { KB_BY_SKILL } from '../../content/kb'
import { openRepairTargets } from '../../engine/errors'
import { isPflTemplate } from '../../engine/pfl'
import { effectiveAllocation } from '../../engine/allocationPlus'

const LAB_ORDER: BucketId[] = ['observer', 'investigator', 'strategist', 'puzzle', 'insight', 'meta']
const ACADEMIC_ORDER: BucketId[] = ['math', 'physics', 'coding', 'science']
const FORMAT_LABEL: Record<AuthenticFormat, string> = {
  project: 'Projects',
  writing: 'Writing',
  program: 'Programs',
  experiment: 'Experiments',
  book: 'Books',
  dialogue: 'Expert dialogue',
  fieldwork: 'Fieldwork',
  decision: 'Decisions',
}

export function Practice() {
  const { state } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const [browse, setBrowse] = useState<BucketId | null>(null)
  const [homework, setHomework] = useState(false)
  const [workOpen, setWorkOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return [...index.templates.values()]
      .filter((t) => {
        const hay = (t.name + ' ' + (t.authentic ? `${t.authentic.format} ${t.authentic.deliverable}` : '') + ' ' + t.skillIds.map((s) => index.skills.get(s)?.name ?? '').join(' ')).toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 8)
  }, [query, index])
  const due = useMemo(() => dueReviews(evidence, Date.now()), [evidence])
  const repairs = useMemo(() => openRepairTargets(state, evidence, Date.now()), [state, evidence])
  /** Prefer a probe never attempted; fall back to the least-recently used. */
  const nextProbe = useMemo(() => {
    const probes = [...index.templates.values()].filter((t) => isPflTemplate(t.id))
    const usedAt = new Map<string, number>()
    for (const e of state.events) if (isPflTemplate(e.templateId)) usedAt.set(e.templateId, Math.max(usedAt.get(e.templateId) ?? 0, e.t))
    return probes.sort((a, b) => (usedAt.get(a.id) ?? 0) - (usedAt.get(b.id) ?? 0))[0] ?? null
  }, [index, state.events])
  const confidentRepairs = repairs.filter((r) => r.blockedByMisconception).length
  const authenticWork = useMemo(
    () => [...index.templates.values()].filter((t) => t.authentic).sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name)),
    [index],
  )
  const effectiveTargets = useMemo(
    () => effectiveAllocation(state, evidence, index, Date.now()).targets,
    [state, evidence, index],
  )

  return (
    <div>
      <HeaderBar title="Practice" subtitle="Choose your arena" />

      <input
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search activities — slope, fork, pre-mortem…"
        aria-label="Search activities"
        className="mt-2 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent"
      />
      {searchResults.length ? (
        <div className="mt-2 space-y-1.5">
          {searchResults.map((t) => (
            <button
              type="button"
              key={t.id}
              className="w-full text-left bg-surface border border-line rounded-xl px-3.5 py-2.5 hover:border-line-strong transition-colors flex items-center justify-between gap-2"
              onClick={() => go({ name: 'session', launch: { kind: 'single', templateId: t.id } })}
            >
              <span className="text-[14px] font-medium truncate">{t.name}</span>
              <DifficultyBadge difficulty={t.difficulty} />
            </button>
          ))}
        </div>
      ) : query.trim().length >= 2 ? (
        <p className="text-[13px] text-faint mt-2 px-1">No activities match.</p>
      ) : null}

      <SectionTitle>Modes</SectionTitle>
      <div className="grid grid-cols-2 gap-3 auto-rows-fr">
        <ModeCard title="Coach chooses" sub="The full adaptive session" onClick={() => go({ name: 'session', launch: { kind: 'daily' } })} accent />
        <ModeCard title="Mixed review" sub={due.length ? `${due.length} due now` : 'Interleaved retrieval'} onClick={() => go({ name: 'session', launch: { kind: 'mixed' } })} />
        <ModeCard title="Challenge" sub="Non-routine, near your ceiling" onClick={() => go({ name: 'session', launch: { kind: 'challenge' } })} />
        <ModeCard title="Exam simulator" sub="Blind, timed, cumulative — like the real thing" onClick={() => go({ name: 'exam' })} accent />
        <ModeCard
          title="Error Clinic"
          sub={repairs.length ? `${repairs.length} open repair${repairs.length === 1 ? '' : 's'}${confidentRepairs ? ` · ${confidentRepairs} confidence trap${confidentRepairs === 1 ? '' : 's'}` : ''}` : 'Nothing to repair — clean slate'}
          onClick={() => go({ name: 'session', launch: { kind: 'error-clinic' } })}
        />
        <ModeCard title="Homework support" sub="A coach, not an answer machine" onClick={() => setHomework(true)} />
        {/* Launched deliberately and never by the planner: a probe re-served
            measures memory rather than pick-up, so the learner chooses when to
            spend one. Offers an unused probe first. See engine/pfl.ts. */}
        {nextProbe ? (
          <ModeCard
            title="Learn something new"
            sub="An idea this app never teaches, explained once — then questions. Not a rung."
            onClick={() => go({ name: 'session', launch: { kind: 'single', templateId: nextProbe.id } })}
          />
        ) : null}
        <ModeCard
          title="Authentic Work"
          sub="Projects, writing, programs, experiments, books & dialogue"
          onClick={() => setWorkOpen(true)}
          className="col-span-2 sm:col-span-1"
          accent
        />
      </div>

      <SectionTitle>Academic core</SectionTitle>
      <div className="grid grid-cols-2 gap-3 auto-rows-fr">
        {ACADEMIC_ORDER.map((b) => (
          <BucketCard key={b} bucket={b} onClick={() => setBrowse(b)} />
        ))}
      </div>

      <SectionTitle>Thinking labs</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-6 auto-rows-fr">
        {LAB_ORDER.map((b) => (
          <BucketCard key={b} bucket={b} onClick={() => setBrowse(b)} />
        ))}
      </div>

      <BrowseSheet bucket={browse} onClose={() => setBrowse(null)} />
      <HomeworkSheet open={homework} onClose={() => setHomework(false)} />
      {workOpen ? (
        <WorkChooser
          work={authenticWork}
          targets={effectiveTargets}
          onClose={() => setWorkOpen(false)}
          onPick={(id) => {
            setWorkOpen(false)
            go({ name: 'session', launch: { kind: 'single', templateId: id } })
          }}
        />
      ) : null}
    </div>
  )
}

function ModeCard({ title, sub, onClick, accent, className = '' }: { title: string; sub: string; onClick?: () => void; accent?: boolean; className?: string }) {
  return (
    <Card className={`p-4 h-full ${accent ? 'border-accent/40' : ''} ${onClick ? '' : 'opacity-60'} ${className}`} onClick={onClick}>
      <p className="font-semibold text-[15px]">{title}</p>
      <p className="text-[12px] text-muted mt-0.5 leading-snug">{sub}</p>
    </Card>
  )
}

function BucketCard({ bucket, onClick }: { bucket: BucketId; onClick: () => void }) {
  const meta = BUCKET_BY_ID[bucket]
  return (
    <Card className="p-4 h-full" onClick={onClick}>
      <p className="font-semibold text-[15px]">{meta.name}</p>
      <p className="text-[12px] text-muted mt-0.5 leading-snug">{meta.blurb}</p>
    </Card>
  )
}

function BrowseSheet({ bucket, onClose }: { bucket: BucketId | null; onClose: () => void }) {
  const { state } = useStore()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const [diff, setDiff] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  if (!bucket) return null
  const templates = (index.byBucket.get(bucket) ?? [])
    .filter((t) => (diff === 0 ? true : t.difficulty === diff))
    .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name))
  return (
    <Modal open={true} onClose={onClose} title={BUCKET_BY_ID[bucket].name} wide>
      <DifficultyGuide />
      <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mt-4 mb-2">Filter by difficulty</p>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {([0, 1, 2, 3, 4, 5] as const).map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setDiff(d)}
            aria-pressed={diff === d}
            aria-label={d === 0 ? 'All difficulties' : `${d} star ${DIFFICULTY_INFO[d].name}`}
            title={d === 0 ? 'All difficulties' : DIFFICULTY_INFO[d].description}
            className={`min-h-11 px-3 rounded-full border text-[13px] font-medium ${diff === d ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-muted'}`}
          >
            {d === 0 ? 'All' : `${d}★`}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {templates.map((t) => (
          <button
            type="button"
            key={t.id}
            className="w-full text-left border border-line rounded-xl px-3.5 py-3 hover:border-line-strong transition-colors"
            onClick={() => {
              onClose()
              go({ name: 'session', launch: { kind: 'single', templateId: t.id } })
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[14px]">{t.name}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <DifficultyBadge difficulty={t.difficulty} showName />
                <Chip tone="neutral">~{Math.round(t.minutes)}m</Chip>
              </span>
            </div>
            <p className="text-[12px] text-faint mt-1">
              {t.skillIds
                .slice(0, 2)
                .map((s) => index.skills.get(s)?.name ?? s)
                .join(' · ')}
              {t.variants > 1 ? ` · ${t.variants} variants` : ''}
            </p>
            {t.authentic ? <p className="text-[12px] text-accent mt-1">{FORMAT_LABEL[t.authentic.format]} · {t.authentic.deliverable}</p> : null}
          </button>
        ))}
        {templates.length === 0 ? <p className="text-muted text-sm py-4 text-center">Nothing at this difficulty.</p> : null}
      </div>
    </Modal>
  )
}

/**
 * Homework support — a structured thinking scaffold. It never solves the
 * problem and says so; it walks the student's OWN first step forward and
 * links to matching skill practice. Honest about having no OCR/CAS.
 */
function HomeworkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  const { go } = useNav()
  const [kind, setKind] = useState<'practice' | 'homework' | 'assignment' | 'test' | null>(null)
  const [problem, setProblem] = useState('')
  const [step, setStep] = useState(0)
  const results = useMemo(() => (problem.trim().length > 3 ? searchMatchingSkills(problem) : []), [problem])
  void state

  const reset = () => {
    setKind(null)
    setProblem('')
    setStep(0)
  }

  if (!open) return null
  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Homework support"
      wide
    >
      {kind === null ? (
        <div>
          <p className="text-muted text-sm leading-relaxed">What is this task?</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(
              [
                ['practice', 'Practice problems'],
                ['homework', 'Homework'],
                ['assignment', 'Take-home assignment'],
                ['test', 'A test or exam happening now'],
              ] as const
            ).map(([k, label]) => (
              <Button key={k} kind="secondary" onClick={() => setKind(k)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : kind === 'test' ? (
        <div>
          <p className="text-[15px] leading-relaxed">
            Not this one. Working a live test together wouldn't be learning — it would be borrowing a grade you'd have
            to pay back later, with interest, in a harder class.
          </p>
          <p className="text-muted text-sm mt-2">
            Right after it ends, come back: we'll rebuild every problem you weren't sure about, and THAT sticks.
          </p>
          <Button className="w-full mt-4" onClick={() => { reset(); onClose() }}>
            Understood
          </Button>
        </div>
      ) : step === 0 ? (
        <div>
          <p className="text-muted text-sm leading-relaxed">
            Type (or paste) the problem. I won't solve it — I'll help you find where YOUR solving stalls, which is the
            part worth fixing.
          </p>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder="e.g. A shirt costs $34 after a 15% discount. What was the original price?"
            className="mt-3 w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent"
          />
          <Button className="w-full mt-3" disabled={problem.trim().length < 8} onClick={() => setStep(1)}>
            Next: my first step
          </Button>
        </div>
      ) : (
        <div>
          <div className="bg-surface2 border border-line rounded-xl px-3.5 py-2.5 text-[14px]">{problem}</div>
          <div className="mt-4 space-y-3">
            <ScaffoldStep n={1} title="Say what it's asking" body="In your own words: what quantity must exist at the end, and in what unit? If you can't say it, that IS the block — reread just the final sentence." />
            <ScaffoldStep n={2} title="Name what you know" body="List each given number WITH its meaning. A number without a label is a trap." />
            <ScaffoldStep n={3} title="Attempt one step" body="Write the first move you'd try — even if unsure. The first stalled step tells you exactly which skill to sharpen." />
            <ScaffoldStep n={4} title="Check against the question" body="Does your result answer step 1's question, in its unit, at a sane size? Explain the method to yourself in one sentence — if the sentence won't form, the understanding isn't there yet." />
          </div>
          {results.length ? (
            <div className="mt-4">
              <p className="text-[13px] font-medium text-muted mb-1.5">This looks related to — practice a twin skill instead of this exact problem:</p>
              <div className="flex flex-wrap gap-1.5">
                {results.map((r) => (
                  <button
                    type="button"
                    key={r.skillId}
                    className="min-h-11"
                    onClick={() => {
                      reset()
                      onClose()
                      go({ name: 'session', launch: { kind: 'focus', skillId: r.skillId } })
                    }}
                  >
                    <Chip tone="accent" className="cursor-pointer !py-1.5">
                      {r.title}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-[12px] text-faint mt-4">
            Typed problems only for now — there's no camera/OCR, and this coach never generates answer keys for your
            actual homework. Practicing the matching skill above builds the muscle the homework is testing.
          </p>
          <Button kind="secondary" className="w-full mt-3" onClick={() => setStep(0)}>
            Different problem
          </Button>
        </div>
      )}
    </Modal>
  )
}

function ScaffoldStep({ n, title, body }: { n: number; title: string; body: string }) {
  const [open, setOpen] = useState(n === 1)
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <button type="button" className="w-full min-h-11 text-left px-3.5 py-2.5 flex items-center gap-2.5" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="h-6 w-6 rounded-full bg-accent-soft text-accent grid place-items-center text-[12px] font-bold shrink-0">{n}</span>
        <span className="font-medium text-[14px]">{title}</span>
      </button>
      {open ? <p className="px-3.5 pb-3 text-[13px] text-muted leading-relaxed">{body}</p> : null}
    </div>
  )
}

function searchMatchingSkills(problem: string): { skillId: string; title: string }[] {
  const p = problem.toLowerCase()
  const rules: { skillId: string; title: string; keys: string[] }[] = [
    { skillId: 'm-percent', title: 'Percent problems', keys: ['%', 'percent', 'discount', 'tax', 'tip', 'off', 'interest'] },
    { skillId: 'm-fractions', title: 'Fractions', keys: ['fraction', '/2', '/3', '/4', '/5', '/8', 'half', 'third', 'quarter'] },
    { skillId: 'm-lineqmulti', title: 'Equations', keys: ['solve', 'equation', 'x =', '= x', 'unknown'] },
    { skillId: 'm-wordeq', title: 'Word problems → equations', keys: ['costs', 'total', 'each', 'per ', 'fee', 'how many', 'how much'] },
    { skillId: 'm-proportion', title: 'Proportions', keys: ['ratio', 'proportion', 'scale', 'map', 'recipe', 'rate'] },
    { skillId: 'm-triangles', title: 'Right triangles', keys: ['triangle', 'hypotenuse', 'ladder', 'diagonal', 'pythag'] },
    { skillId: 'm-area', title: 'Area & perimeter', keys: ['area', 'perimeter', 'rectangle', 'square meters'] },
    { skillId: 'm-volume', title: 'Volume', keys: ['volume', 'prism', 'cylinder', 'cubic'] },
    { skillId: 'm-prob', title: 'Probability', keys: ['probability', 'chance', 'dice', 'coin', 'marble', 'random'] },
    { skillId: 'm-stats', title: 'Mean & median', keys: ['mean', 'average', 'median', 'mode'] },
    { skillId: 'm-linfunc', title: 'Linear models', keys: ['slope', 'y =', 'graph', 'intercept', 'per month', 'per hour'] },
    { skillId: 'm-systems', title: 'Systems of equations', keys: ['two equations', 'both', 'adult', 'child', 'tickets'] },
    { skillId: 'p-motion', title: 'Speed & motion', keys: ['speed', 'velocity', 'm/s', 'km/h', 'travel'] },
    { skillId: 'p-forces', title: 'Forces', keys: ['force', 'newton', 'acceleration', 'friction'] },
    { skillId: 'p-energy', title: 'Energy', keys: ['energy', 'work', 'joule', 'kinetic'] },
    { skillId: 'c-trace', title: 'Code tracing', keys: ['loop', 'function', 'print', 'code', 'variable', 'array'] },
    { skillId: 's-corr', title: 'Correlation vs causation', keys: ['correlat', 'caus', 'study shows', 'linked to'] },
  ]
  const hits = rules.filter((r) => r.keys.some((k) => p.includes(k)))
  const seen = new Set<string>()
  return hits
    .filter((h) => {
      if (seen.has(h.skillId)) return false
      seen.add(h.skillId)
      return KB_BY_SKILL.has(h.skillId)
    })
    .slice(0, 4)
    .map(({ skillId, title }) => ({ skillId, title }))
}

function WorkChooser({ work, targets, onPick, onClose }: { work: ItemTemplate[]; targets: Record<BucketId, number>; onPick: (id: string) => void; onClose: () => void }) {
  const [format, setFormat] = useState<AuthenticFormat | 'all'>('all')
  const visible = format === 'all' ? work : work.filter((item) => item.authentic?.format === format)
  const formats = [...new Set(work.map((item) => item.authentic?.format).filter(Boolean))] as AuthenticFormat[]
  return (
    <Modal open onClose={onClose} title="Authentic Work" wide>
      <p className="text-muted text-sm leading-relaxed">
        Compressed, realistic workflows with a clear brief, checkable decisions, a substantial artifact, critique, and revision. Every graded checkpoint is objective; the writing and code you produce are compared against models and never scored.
      </p>
      <p className="text-[12px] text-faint mt-2 leading-relaxed">
        Authentic Work is not a separate allocation category. Each studio belongs to one of your existing percentage categories, and completed time counts toward that target.
      </p>
      <div className="flex gap-1.5 mt-3 mb-3 overflow-x-auto pb-1 scroll-thin">
        <button type="button" onClick={() => setFormat('all')} aria-pressed={format === 'all'} className={`min-h-11 px-3 rounded-full border text-[13px] font-medium shrink-0 ${format === 'all' ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-muted'}`}>All</button>
        {formats.map((value) => (
          <button type="button" key={value} onClick={() => setFormat(value)} aria-pressed={format === value} className={`min-h-11 px-3 rounded-full border text-[13px] font-medium shrink-0 ${format === value ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-muted'}`}>
            {FORMAT_LABEL[value]}
          </button>
        ))}
      </div>
      {work.length === 0 ? (
        <EmptyState title="No authentic work" body="Work simulations ship with the app — if you see this, content failed to load." />
      ) : (
        <div className="space-y-2">
          {visible.map((c) => (
            <button type="button" key={c.id} className="w-full min-h-11 text-left border border-line rounded-xl px-4 py-3 hover:border-line-strong" onClick={() => onPick(c.id)}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-[15px]">{c.name.replace('Case File: ', '')}</p>
                <DifficultyBadge difficulty={c.difficulty} />
              </div>
              <p className="text-[12px] text-accent mt-1">{c.authentic ? FORMAT_LABEL[c.authentic.format] : 'Case'} · {c.authentic?.deliverable ?? 'cross-domain recommendation'}</p>
              <p className="text-[12px] text-muted mt-0.5">{BUCKET_BY_ID[c.bucket].name} · counts toward your current {targets[c.bucket]}% target</p>
              <p className="text-[12px] text-faint mt-0.5">~{Math.round(c.minutes)} min · {c.generate(0).parts?.length ?? 1} checkpoints · {c.variants} scenario{c.variants === 1 ? '' : 's'}</p>
            </button>
          ))}
          {visible.length === 0 ? <p className="text-muted text-sm py-5 text-center">No work simulations in this format yet.</p> : null}
        </div>
      )}
    </Modal>
  )
}
