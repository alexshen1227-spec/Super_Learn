/**
 * Path: the skill map. Course → unit → skill with evidence states,
 * prerequisite visibility, and honest "not enough evidence" defaults.
 */
import { useMemo, useState } from 'react'
import { useEvidence, useStore } from '../../store/store'
import { useNav } from '../nav'
import { COURSES } from '../../content/skills'
import { buildContentIndex } from '../../content/registry'
import { KB_BY_SKILL } from '../../content/kb'
import { evidenceFor, formsRequired, stateRank, STATE_LABEL } from '../../engine/mastery'
import { prereqsMet } from '../../engine/planner'
import { nextProofForSkill } from '../../engine/nextProof'
import type { BucketId, SkillNode } from '../../domain/types'
import { BUCKET_BY_ID } from '../../domain/types'
import { Button, Card, Chip, DifficultyBadge, Divider, HeaderBar, Modal, ProgressBar, Row, StateBadge } from '../components'
import { Rich } from '../richtext'
import { PATHS, pathBeyondArc, pathProgress, type PathDef } from '../../content/paths'
import { SKILLS } from '../../content/skills'
import { resourcesFor } from '../../content/resources'
import { TACTICS } from '../../content/items/chessTactics'

const FILTERS: { id: 'all' | 'academic' | 'labs'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'academic', label: 'Academic' },
  { id: 'labs', label: 'Thinking labs' },
]

export function PathScreen() {
  const { state } = useStore()
  const evidence = useEvidence()
  const { go } = useNav()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  const [filter, setFilter] = useState<'all' | 'academic' | 'labs'>('all')
  const [openCourse, setOpenCourse] = useState<string | null>('math-foundations')
  const [detail, setDetail] = useState<SkillNode | null>(null)
  const [pathDetail, setPathDetail] = useState<PathDef | null>(null)

  const isAcademic = (b: BucketId) => ['math', 'physics', 'coding', 'science'].includes(b)
  const courses = COURSES.filter((c) =>
    filter === 'all' ? true : filter === 'academic' ? isAcademic(c.bucket) : !isAcademic(c.bucket),
  )

  return (
    <div>
      <HeaderBar title="Path" subtitle="Your skill map — evidence, not vibes" />
      {/* A brand-new learner used to land on a full tree of grey "Unseen"
          badges with no orientation — a wall, not a map. One card, gone the
          moment any evidence exists. */}
      {state.events.length === 0 ? (
        <Card className="mt-3 p-4 border-accent/30">
          <p className="font-semibold text-[15px]">Everything starts grey on purpose.</p>
          <p className="text-[13px] text-muted mt-1 leading-relaxed">
            This map only colours in what you have proved — never what you say you know. A placement gives it a
            first sketch in about ten minutes; a normal session starts filling it in for real.
          </p>
          <Button className="w-full mt-3" onClick={() => go({ name: 'placement' })}>
            Find my starting line
          </Button>
        </Card>
      ) : null}
      <div className="flex gap-1.5 mt-2">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`min-h-11 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${
              filter === f.id ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter !== 'academic' ? (
        <>
          <p className="text-[11px] font-semibold text-faint uppercase tracking-widest mt-5 mb-2 px-1">The four paths</p>
          <div className="grid grid-cols-2 gap-3">
            {PATHS.map((p) => {
              const prog = pathProgress(p, evidence)
              const beyond = pathBeyondArc(p, SKILLS, evidence)
              return (
                <Card key={p.id} className="p-4" onClick={() => setPathDetail(p)}>
                  <PathEmblem path={p} size={26} />
                  <p className="font-display font-semibold text-[15px] mt-2">{p.name}</p>
                  <p className="text-[11px] text-faint italic leading-snug mt-0.5">{p.tagline}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={prog.progress} max={1} tone="accent" label={`${p.name} arc`} />
                    </div>
                    <span className="text-[10px] font-mono text-muted shrink-0">{prog.rankName}</span>
                  </div>
                  {/* The rank rides the named arc only, on purpose — see
                      pathBeyondArc. The depth around it still deserves to
                      exist somewhere the Path presents itself. */}
                  {beyond.total > 0 ? (
                    <p className="text-[10px] text-faint mt-1.5">
                      beyond the arc: {beyond.owned}/{beyond.total} advanced skills
                    </p>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </>
      ) : null}

      <div className="mt-4 space-y-3 mb-6">
        {courses.map((course) => {
          const allSkills = course.units.flatMap((u) => u.skillIds)
          const independent = allSkills.filter((id) => stateRank(evidenceFor(evidence, id).state) >= 3).length
          const open = openCourse === course.id
          return (
            <Card key={course.id} className="overflow-hidden">
              <button type="button" className="w-full min-h-14 text-left px-4 py-3.5 flex items-center gap-3" onClick={() => setOpenCourse(open ? null : course.id)} aria-expanded={open}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-[16px]">{course.name}</h3>
                    <Chip tone="neutral">{BUCKET_BY_ID[course.bucket].short}</Chip>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={independent} max={allSkills.length} tone="good" label={`${course.name} progress`} />
                    </div>
                    <span className="text-[11px] font-mono text-faint shrink-0">
                      {independent}/{allSkills.length}
                    </span>
                  </div>
                </div>
                <span className={`text-faint transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>
                  ›
                </span>
              </button>
              {open ? (
                <div className="border-t border-line">
                  {course.units.map((unit) => (
                    <div key={unit.id}>
                      <p className="text-[11px] font-semibold text-faint uppercase tracking-widest px-4 pt-3 pb-1">{unit.name}</p>
                      {unit.skillIds.map((id) => {
                        const skill = index.skills.get(id)!
                        const ev = evidenceFor(evidence, id)
                        const unlocked = prereqsMet(skill, evidence, state)
                        return (
                          <Row
                            key={id}
                            onClick={() => setDetail(skill)}
                            label={
                              <span className={unlocked || ev.state !== 'unseen' ? '' : 'text-faint'}>
                                {skill.name}
                                {!unlocked && ev.state === 'unseen' ? ' 🔒' : ''}
                              </span>
                            }
                            sub={ev.state === 'unseen' && !ev.attempts ? (unlocked ? 'ready to start' : 'prerequisites first') : undefined}
                            right={<StateBadge state={ev.state} needsReview={ev.needsReview} />}
                          />
                        )
                      })}
                    </div>
                  ))}
                  <div className="h-2" />
                </div>
              ) : null}
            </Card>
          )
        })}
      </div>

      <SkillDetail skill={detail} onClose={() => setDetail(null)} onPractice={(id) => { setDetail(null); go({ name: 'session', launch: { kind: 'focus', skillId: id } }) }} />
      <PathDetailSheet
        path={pathDetail}
        onClose={() => setPathDetail(null)}
        onTrain={(skillId) => {
          setPathDetail(null)
          go({ name: 'session', launch: { kind: 'focus', skillId } })
        }}
        onSkill={(s) => {
          setPathDetail(null)
          setDetail(s)
        }}
      />
    </div>
  )
}

function ChessThemeStats() {
  const { state } = useStore()
  const stats = useMemo(() => {
    const themeOf = new Map(TACTICS.map((t) => [t.id, t.theme]))
    const byTheme = new Map<string, { tries: number; clean: number }>()
    for (const e of state.events) {
      const theme = themeOf.get(e.templateId)
      if (!theme || e.firstCorrect === null) continue
      const s = byTheme.get(theme) ?? { tries: 0, clean: 0 }
      s.tries++
      if (e.firstCorrect && e.hintLevel === 0) s.clean++
      byTheme.set(theme, s)
    }
    return [...byTheme.entries()].sort((a, b) => b[1].tries - a[1].tries)
  }, [state.events])
  if (!stats.length) return null
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">By theme</p>
      <div className="space-y-1.5">
        {stats.map(([theme, s]) => (
          <div key={theme} className="flex items-center gap-2.5">
            <span className="text-[13px] w-40 shrink-0 truncate">{theme}</span>
            <div className="flex-1 h-2 rounded bg-surface2 overflow-hidden">
              <div className="h-full bg-good/80 rounded" style={{ width: `${(s.clean / s.tries) * 100}%` }} />
            </div>
            <span className="text-[11px] font-mono text-faint w-12 text-right shrink-0">
              {s.clean}/{s.tries}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-faint mt-1.5">Clean solves (first try, no hints) per theme — your tactical fingerprint.</p>
    </div>
  )
}

function PathEmblem({ path, size }: { path: PathDef; size: number }) {
  const color = path.hue === 'accent' ? 'var(--c-accent)' : path.hue === 'good' ? 'var(--c-green)' : path.hue === 'warn' ? 'var(--c-amber)' : 'var(--c-ink)'
  const common = { fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {path.id === 'observer' ? (
        <g {...common}>
          <path d="M2.5 12c2.6-4.4 5.8-6.6 9.5-6.6s6.9 2.2 9.5 6.6c-2.6 4.4-5.8 6.6-9.5 6.6S5.1 16.4 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </g>
      ) : path.id === 'investigator' ? (
        <g {...common}>
          <circle cx="10.2" cy="10.2" r="6" />
          <path d="M14.6 14.6 21 21" />
          <path d="M7.5 10.2h5.4M10.2 7.5v5.4" />
        </g>
      ) : path.id === 'strategist' ? (
        <g {...common}>
          <path d="M12 20.5v-6M12 14.5 6 8.5M12 14.5l6-6" />
          <circle cx="6" cy="6.5" r="2.4" />
          <circle cx="18" cy="6.5" r="2.4" />
          <circle cx="12" cy="20.5" r="0.4" />
        </g>
      ) : (
        <g {...common}>
          <path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6l-7-3Z" />
          <path d="M9 11.8l2.1 2.1 4-4.2" />
        </g>
      )}
    </svg>
  )
}

function PathDetailSheet({
  path,
  onClose,
  onTrain,
  onSkill,
}: {
  path: PathDef | null
  onClose: () => void
  onTrain: (skillId: string) => void
  onSkill: (s: SkillNode) => void
}) {
  const { state } = useStore()
  const evidence = useEvidence()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  if (!path) return null
  const prog = pathProgress(path, evidence)
  const nextSkill = index.skills.get(prog.nextStep)
  const pathTemplates = [
    ...new Map(
      path.skillIds.flatMap((skillId) =>
        (index.bySkill.get(skillId) ?? []).map((template) => [template.id, template] as const),
      ),
    ).values(),
  ]
  const autoGradedTemplates = pathTemplates.filter((template) => {
      const item = template.generate(0)
      if (item.kind === 'single') return Boolean(item.answer && item.answer.type !== 'draft')
      // A multi-part item counts once it has ANY deterministically graded part.
      // An ungraded draft alongside real checkpoints does not disqualify it —
      // the draft simply contributes nothing to the evidence.
      if (item.kind === 'multi') return Boolean(item.parts?.some((part) => part.answer.type !== 'draft'))
      return true
    })
  const autoGradedForms = autoGradedTemplates.reduce((sum, template) => sum + template.variants, 0)
  const difficultyForms = ([1, 2, 3, 4, 5] as const).map((difficulty) => ({
    difficulty,
    forms: autoGradedTemplates
      .filter((template) => template.difficulty === difficulty)
      .reduce((sum, template) => sum + template.variants, 0),
  }))
  return (
    <Modal open onClose={onClose} title={path.name} wide>
      <div className="flex items-center gap-3">
        <PathEmblem path={path} size={34} />
        <div className="min-w-0">
          <p className="text-[15px] italic text-muted">“{path.tagline}”</p>
          <Chip tone="good">{autoGradedForms} auto-graded forms</Chip>
        </div>
      </div>
      <p className="text-[14px] text-muted leading-relaxed mt-3">{path.essence}</p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">The arc</p>
          <span className="text-[12px] font-mono text-accent">{prog.rankName}</span>
        </div>
        <div className="flex gap-1">
          {path.ranks.map((r, i) => (
            <div key={r} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= prog.rankIndex ? 'bg-accent' : 'bg-surface3'}`} />
              <p className={`text-[9px] mt-1 text-center truncate ${i <= prog.rankIndex ? 'text-accent font-medium' : 'text-faint'}`}>{r}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-faint mt-1.5">
          Rank derives from live skill evidence — it can fall when skills need review. That is the system being honest,
          not cruel.
        </p>
        {(() => {
          const beyond = pathBeyondArc(path, SKILLS, evidence)
          return beyond.total > 0 ? (
            <p className="text-[12px] text-muted mt-2 leading-relaxed">
              Beyond the arc, this Path's area holds {beyond.total} more advanced skills — you own{' '}
              {beyond.owned} of them. The rank stays on the named arc so it cannot drop just because new
              material shipped; the depth is all in the course tree below.
            </p>
          ) : null
        })()}
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">The code</p>
        <ol className="space-y-1.5">
          {path.code.map((c, i) => (
            <li key={i} className="text-[14px] flex gap-2 leading-snug">
              <span className="font-mono text-faint shrink-0">{i + 1}.</span> {c}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Difficulty ladder</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {difficultyForms.map(({ difficulty, forms }) => (
            <div key={difficulty} className="flex items-center justify-between gap-2 rounded-xl bg-surface2 px-2.5 py-2">
              <DifficultyBadge difficulty={difficulty} showName />
              <span className="text-[11px] font-mono text-faint">{forms} forms</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-faint mt-1.5">The coach moves up only when evidence supports it; five stars means synthesis, never speed.</p>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Disciplines</p>
        <div className="space-y-1">
          {path.skillIds.map((id) => {
            const skill = index.skills.get(id)
            if (!skill) return null
            const ev = evidence.get(id)
            return (
              <button type="button" key={id} className="w-full min-h-11 flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-surface2 text-left" onClick={() => onSkill(skill)}>
                <span className="text-[14px] font-medium">{skill.name}</span>
                <StateBadge state={ev?.state ?? 'unseen'} needsReview={ev?.needsReview} />
              </button>
            )
          })}
        </div>
      </div>

      <Button className="w-full mt-4" onClick={() => onTrain(prog.nextStep)}>
        Train the weakest discipline{nextSkill ? ` — ${nextSkill.name}` : ''}
      </Button>
    </Modal>
  )
}

function SkillDetail({ skill, onClose, onPractice }: { skill: SkillNode | null; onClose: () => void; onPractice: (id: string) => void }) {
  const { state } = useStore()
  const evidence = useEvidence()
  const index = useMemo(() => buildContentIndex(state.customPacks), [state.customPacks])
  if (!skill) return null
  const ev = evidenceFor(evidence, skill.id)
  const requiredForms = formsRequired(skill.bucket)
  const kb = KB_BY_SKILL.get(skill.id)
  const unlocked = prereqsMet(skill, evidence, state)
  const placementSignal = state.placement?.signals.find((s) => s.skillId === skill.id)
  const templates = index.bySkill.get(skill.id) ?? []
  const nextProof = nextProofForSkill(ev, skill.bucket, templates)
  return (
    <Modal open={true} onClose={onClose} title={skill.name} wide>
      <div className="flex items-center gap-2 flex-wrap">
        <StateBadge state={ev.state} needsReview={ev.needsReview} />
        {ev.bestState !== ev.state ? <Chip tone="neutral">once reached {STATE_LABEL[ev.bestState]}</Chip> : null}
        {placementSignal ? <Chip tone={placementSignal.signal === 'gap' ? 'warn' : 'accent'}>placement: {placementSignal.signal}</Chip> : null}
      </div>
      <p className="text-muted text-[14px] mt-3 leading-relaxed">{skill.blurb}</p>

      <Card className="p-4 mt-3 border-accent/25 bg-accent-soft/40">
        <p className="text-[11px] font-semibold text-accent uppercase tracking-wide">Next proof</p>
        <p className="text-[14px] font-semibold mt-1">{nextProof.title}</p>
        <p className="text-[12px] text-muted mt-1 leading-relaxed">{nextProof.detail}</p>
      </Card>

      {kb ? (
        <Card className="p-4 mt-3 bg-surface2">
          <p className="text-[12px] font-semibold text-accent uppercase tracking-wide mb-1">Concept card</p>
          <Rich text={kb.card} className="text-[14px]" />
        </Card>
      ) : null}

      <div className="mt-4">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Evidence</p>
        {ev.attempts === 0 ? (
          <p className="text-[13px] text-faint">
            Not enough evidence — nothing measured yet.{' '}
            {placementSignal ? 'The placement gave a routing signal, which practice will confirm or overturn.' : ''}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
            <span className="text-muted">Attempts</span>
            <span className="font-mono">{ev.attempts}</span>
            <span className="text-muted">Unaided first-try successes</span>
            <span className="font-mono">
              {ev.independentForms.length}/{requiredForms} distinct question families
            </span>
            <span className="text-muted">Guided successes</span>
            <span className="font-mono">{ev.guidedSuccesses}</span>
            <span className="text-muted">Delayed retention</span>
            <span className="font-mono">{ev.retainedAt ? '✓ shown' : 'not yet shown'}</span>
            <span className="text-muted">Novel transfer</span>
            <span className="font-mono">{ev.transferredAt ? '✓ shown' : 'not yet shown'}</span>
            {ev.hintDependence !== null ? (
              <>
                <span className="text-muted">Recent hint use</span>
                <span className="font-mono">{Math.round(ev.hintDependence * 100)}%</span>
              </>
            ) : null}
            {ev.review ? (
              <>
                <span className="text-muted">Next review</span>
                <span className="font-mono">{new Date(ev.review.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </>
            ) : null}
          </div>
        )}
        {ev.blockedByMisconception ? (
          <p className="text-[13px] text-warn mt-2 bg-warn-soft border border-warn/30 rounded-lg px-3 py-2">
            A high-confidence error is blocking promotion — one clean unaided solve clears it.
          </p>
        ) : null}
        <p className="text-[11px] text-faint mt-2">
          Promotion rules are heuristics, stated plainly: {requiredForms} unaided first-try successes on distinct question families → Independent;
          a later success ≥48h after the previous → Retained. Transferred needs distance on{' '}
          <span className="font-medium">two</span> counts at once — an unfamiliar question form plus a different
          subject, a different answer format, or a real delay. A new question form on its own is near transfer, and
          the app used to call that Transferred.
        </p>
      </div>

      {skill.id === 'z-chess' ? <ChessThemeStats /> : null}

      {resourcesFor(skill).length ? (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Go deeper (online)</p>
          <div className="space-y-1.5">
            {resourcesFor(skill).map((r) => (
              <a
                key={r.url + r.label}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 border border-line rounded-xl px-3.5 py-2.5 hover:border-line-strong transition-colors"
              >
                <span className="text-[13px] text-accent underline underline-offset-2">{r.label}</span>
                <span className="text-[11px] text-faint shrink-0">{r.source} ↗</span>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-faint mt-1.5">
            External links — they need a connection and open outside the app. Everything else here works offline.
          </p>
        </div>
      ) : null}

      {skill.prereqs.length ? (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-1.5">Builds on</p>
          <div className="flex flex-wrap gap-1.5">
            {skill.prereqs.map((p) => {
              const pev = evidenceFor(evidence, p)
              const ok = stateRank(pev.state) >= 3 || state.placement?.signals.some((s) => s.skillId === p && (s.signal === 'ok' || s.signal === 'strong'))
              return (
                <Chip key={p} tone={ok ? 'good' : 'neutral'}>
                  {index.skills.get(p)?.name ?? p}
                </Chip>
              )
            })}
          </div>
        </div>
      ) : null}

      <Divider />
      <div className="pt-3 pb-1">
        <Button className="w-full" onClick={() => onPractice(skill.id)} disabled={templates.length === 0}>
          {unlocked || ev.state !== 'unseen' ? 'Practice this skill' : 'Practice anyway (prereqs pending)'}
        </Button>
      </div>
    </Modal>
  )
}
