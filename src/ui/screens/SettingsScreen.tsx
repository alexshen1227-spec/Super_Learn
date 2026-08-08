/**
 * Settings: profile, deadlines, allocations, appearance, privacy, data tools
 * (export / import / sample / full reset), storage status, and About with the
 * research grounding. Every claim about data lives here in plain language.
 */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/store'
import { useNav } from '../nav'
import { exportState, importState } from '../../engine/exportImport'
import { storageInfo, type StorageInfo } from '../../store/persist'
import { validatePack } from '../../engine/contentSchema'
import { BUCKETS, DEFAULT_ALLOCATIONS, MIN_ALLOCATION_PERCENT, type BucketId, type Deadline } from '../../domain/types'
import { uid } from '../../engine/rng'
import { Button, Card, Chip, Confirm, Divider, GrabSlider, Modal, Row, SectionTitle, Segmented, Toggle } from '../components'
import { MATH_TRACKS } from '../../content/tracks'
import { IconBack } from '../icons'
import { CHANGELOG } from '../../content/changelog'
import { requestNotificationPermission } from '../notify'
import { PackAuthor } from '../PackAuthor'
import { SKILLS } from '../../content/skills'
import { addLocalDaysISO, localDateISO } from '../../engine/time'
import { rebalanceAllocationPercentage } from '../../engine/allocationTargets'

/**
 * Quiet hours are stored as a 0-23 hour so the comparison stays trivial, but
 * they are DISPLAYED on the 12-hour clock the learner actually reads times in.
 * Midnight and noon are spelled out rather than shown as "12 AM"/"12 PM",
 * which people routinely read backwards.
 */
export function hourLabel(h: number): string {
  if (h === 0) return '12 AM (midnight)'
  if (h === 12) return '12 PM (noon)'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export function SettingsScreen() {
  const { state, dispatch, enterSample, exitSample, resetAll } = useStore()
  const { back, go } = useNav()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmReset2, setConfirmReset2] = useState(false)
  const [confirmSample, setConfirmSample] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof importState> | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [authorOpen, setAuthorOpen] = useState(false)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const packRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void storageInfo().then(setStorage)
  }, [])

  const download = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImportFile = async (file: File) => {
    const text = await file.text()
    const result = importState(text)
    if (!result.ok) {
      setImportMsg(result.error)
      return
    }
    setPendingImport(result)
  }

  const onImportPack = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const v = validatePack(parsed)
      if (!v.ok) {
        setImportMsg(`Pack rejected: ${v.errors[0]}`)
        return
      }
      dispatch({ type: 'add-pack', pack: v.pack })
      setImportMsg(`Pack "${v.pack.meta.name}" added (${v.pack.items.length} items) — its activities appear in Practice.`)
    } catch {
      setImportMsg('That file is not valid JSON.')
    }
  }

  const allocations = state.settings.allocations
  const allocTotal = Object.values(allocations).reduce((a, b) => a + b, 0)
  const allocationsDrifted = BUCKETS.some((b) => allocations[b.id] !== DEFAULT_ALLOCATIONS[b.id])

  return (
    <div>
      <header className="pt-safe">
        <div className="flex items-center gap-2 pt-5 pb-1">
          <button type="button" aria-label="Back" onClick={back} className="h-11 w-11 grid place-items-center rounded-full text-muted hover:bg-surface2 -ml-2">
            <IconBack size={20} />
          </button>
          <h1 className="font-display text-[24px] font-bold">Settings</h1>
        </div>
      </header>

      <SectionTitle>Profile</SectionTitle>
      <Card>
        <div className="p-4 space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-muted">Display name</span>
            <input
              value={state.profile.name}
              onChange={(e) => dispatch({ type: 'update-profile', profile: { name: e.target.value.slice(0, 40) } })}
              className="mt-1 w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-accent"
              placeholder="Optional"
            />
          </label>
          <div>
            <span className="text-[13px] font-medium text-muted">Grade level</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1.5">
              {[6, 7, 8, 9, 10, 11].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => dispatch({ type: 'update-profile', profile: { gradeLevel: g } })}
                  aria-pressed={state.profile.gradeLevel === g}
                  className={`min-h-11 px-3 rounded-lg border text-[14px] font-medium ${state.profile.gradeLevel === g ? 'bg-accent text-bg border-accent' : 'bg-surface2 border-line text-muted'}`}
                >
                  {g}th
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[13px] font-medium text-muted">Math course</span>
            <p className="text-[12px] text-faint mt-0.5">
              Course skills get a small, openly-labeled priority bump; nothing outside it is dropped. The coach reports course progress from real evidence.
            </p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => dispatch({ type: 'update-profile', profile: { mathTrack: null } })}
                aria-pressed={state.profile.mathTrack === null}
                className={`min-h-11 px-3 rounded-lg border text-[14px] font-medium ${state.profile.mathTrack === null ? 'bg-accent text-bg border-accent' : 'bg-surface2 border-line text-muted'}`}
              >
                None
              </button>
              {MATH_TRACKS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => dispatch({ type: 'update-profile', profile: { mathTrack: t.id } })}
                  aria-pressed={state.profile.mathTrack === t.id}
                  title={t.blurb}
                  className={`min-h-11 px-3 rounded-lg border text-[14px] font-medium ${state.profile.mathTrack === t.id ? 'bg-accent text-bg border-accent' : 'bg-surface2 border-line text-muted'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[13px] font-medium text-muted">Default session length</span>
            <div className="mt-1.5">
              <Segmented
                ariaLabel="Session length"
                value={String(state.profile.sessionMinutes) as '25'}
                onChange={(v) => dispatch({ type: 'update-profile', profile: { sessionMinutes: Number(v) as 10 | 20 | 25 | 30 | 45 } })}
                options={[
                  { value: '10', label: '10m' },
                  { value: '20', label: '20m' },
                  { value: '25', label: '25m' },
                  { value: '30', label: '30m' },
                  { value: '45', label: '45m' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle
        right={
          <button type="button" className="text-[13px] text-accent underline min-h-11 -my-2 px-1" onClick={() => setDeadlineOpen(true)}>
            add
          </button>
        }
      >
        Learning missions
      </SectionTitle>
      <Card>
        {state.deadlines.length === 0 ? (
          <p className="text-[13px] text-muted p-4">
            Create a mission around an upcoming test or real-world goal. Pick the exact skills; the daily plan will
            teach prerequisites, repair weak spots, and schedule retention before the date.
          </p>
        ) : (
          state.deadlines
            .slice()
            .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
            .map((d, i) => (
              <div key={d.id}>
                {i > 0 ? <Divider /> : null}
                <Row
                  label={d.title}
                  sub={`${d.dateISO}${d.bucket ? ` · ${BUCKETS.find((b) => b.id === d.bucket)?.name}` : ''}${d.skillIds?.length ? ` · ${d.skillIds.length} target skill${d.skillIds.length === 1 ? '' : 's'} · ${d.dailyMinutes ?? 30} min/day` : ''}`}
                  right={
                    <button type="button" className="text-[13px] text-bad underline min-h-11 px-1" onClick={() => dispatch({ type: 'remove-deadline', id: d.id })}>
                      remove
                    </button>
                  }
                />
              </div>
            ))
        )}
      </Card>

      <SectionTitle>Practice balance</SectionTitle>
      <Card className="p-4">
        <p className="text-[13px] text-muted mb-3">
          Real percentages that always total 100%. Every area keeps at least 5%, reserving half the program for breadth
          while the other half can follow your priorities. Moving one slider rebalances the others automatically.
          Math starts higher because middle-grade mastery is a strong lever on later readiness.
        </p>
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-line">
          <div>
            <p className="text-[14px] font-medium">Let the coach tune the balance</p>
            <p className="text-[12px] text-muted leading-snug">
              Temporary, disclosed nudges around your base — toward a near deadline or a bucket with piled-up reviews.
              Never below a true 5% share for any area, and reviews surface in sessions regardless, so nothing gets
              forgotten. Off = your sliders rule exactly.
            </p>
          </div>
          <Toggle
            checked={state.settings.coachManagedAllocations}
            onChange={(v) => dispatch({ type: 'update-settings', settings: { coachManagedAllocations: v } })}
            label="Let the coach tune the balance"
          />
        </div>
        <div className="space-y-3">
          {BUCKETS.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <span className="text-[13px] w-24 shrink-0 font-medium">{b.short}</span>
              <GrabSlider
                min={MIN_ALLOCATION_PERCENT}
                max={55}
                value={allocations[b.id]}
                label={`${b.name} target percentage`}
                onChange={(next) =>
                  dispatch({
                    type: 'update-settings',
                    settings: { allocations: rebalanceAllocationPercentage(allocations, b.id, next) },
                  })
                }
              />
              <span className="text-[12px] font-mono text-muted w-9 text-right">{allocations[b.id]}%</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          {/* A nudged slider rebalances every other bucket at once, and there is
              no undo. Offer the way back — but only once something has actually
              moved, so the control does not sit there inviting a reset. */}
          {allocationsDrifted ? (
            <button
              type="button"
              className="text-[12px] text-accent underline min-h-11 -my-2"
              onClick={() => dispatch({ type: 'update-settings', settings: { allocations: { ...DEFAULT_ALLOCATIONS } } })}
            >
              Reset to recommended
            </button>
          ) : (
            <span />
          )}
          <p className="text-[11px] text-faint">Total: {allocTotal}%</p>
        </div>
      </Card>

      <SectionTitle>Appearance & accessibility</SectionTitle>
      <Card>
        <div className="p-4 space-y-4">
          <div>
            <span className="text-[13px] font-medium text-muted">Theme</span>
            <div className="mt-1.5">
              <Segmented
                ariaLabel="Theme"
                value={state.settings.theme}
                onChange={(v) => dispatch({ type: 'update-settings', settings: { theme: v } })}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium">Relaxed text spacing</p>
              <p className="text-[12px] text-muted">Wider letter/line spacing. A readability preference — no font cures dyslexia, and this claims nothing of the sort.</p>
            </div>
            <Toggle checked={state.settings.textSpacing} onChange={(v) => dispatch({ type: 'update-settings', settings: { textSpacing: v } })} label="Relaxed text spacing" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium">Confidence prompts</p>
              <p className="text-[12px] text-muted">"Minimal" asks only on explicitly calibration-tagged items.</p>
            </div>
            <Segmented
              ariaLabel="Confidence prompts"
              value={state.settings.confidencePrompts}
              onChange={(v) => dispatch({ type: 'update-settings', settings: { confidencePrompts: v } })}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'minimal', label: 'Minimal' },
              ]}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium">Review reminders</p>
              <p className="text-[12px] text-muted leading-snug">
                At most one gentle local notification a day when reviews are due — fired by the app itself, no server,
                no shame copy. Honors quiet hours below.
              </p>
            </div>
            <Toggle
              checked={state.settings.notifications}
              onChange={(v) => {
                if (v) {
                  void requestNotificationPermission().then((granted) => {
                    dispatch({ type: 'update-settings', settings: { notifications: granted } })
                    if (!granted) setImportMsg('Notifications stay off — the browser did not grant permission.')
                  })
                } else {
                  dispatch({ type: 'update-settings', settings: { notifications: false } })
                }
              }}
              label="Review reminders"
            />
          </div>
          {state.settings.notifications ? (
            /* Label on its own line and both dropdowns free to shrink
               (`min-w-0` — without it a select refuses to go below the width of
               its longest option). Squeezing a label, two hour pickers and the
               word "to" onto one line pushed the second picker clean out of the
               card once relaxed text spacing widened everything. */
            <div className="text-[13px]">
              <span className="text-muted font-medium">Quiet hours</span>
              <div className="flex items-center gap-2 mt-1.5">
                <select
                  aria-label="Quiet hours start"
                  value={state.settings.quietHours?.start ?? 21}
                  onChange={(e) =>
                    dispatch({
                      type: 'update-settings',
                      settings: { quietHours: { start: Number(e.target.value), end: state.settings.quietHours?.end ?? 7 } },
                    })
                  }
                  className="bg-surface2 border border-line rounded-lg px-2 py-1.5 flex-1 min-w-0"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
                <span className="text-faint shrink-0">to</span>
                <select
                  aria-label="Quiet hours end"
                  value={state.settings.quietHours?.end ?? 7}
                  onChange={(e) =>
                    dispatch({
                      type: 'update-settings',
                      settings: { quietHours: { start: state.settings.quietHours?.start ?? 21, end: Number(e.target.value) } },
                    })
                  }
                  className="bg-surface2 border border-line rounded-lg px-2 py-1.5 flex-1 min-w-0"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          <p className="text-[12px] text-faint">
            Reduced motion follows your system setting automatically. Timers in activities are suggestions, never
            cutoffs — speed is trained last, after accuracy, retention, and transfer.
          </p>
        </div>
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card>
        <Row
          label="Export everything"
          sub="One JSON file: profile, history, evidence — yours"
          onClick={() => download(`axiom-lab-export-${localDateISO()}.json`, exportState(state))}
        />
        <Divider />
        <Row label="Import from export" sub="Replaces current data after a preview" onClick={() => fileRef.current?.click()} />
        <Divider />
        <Row label="Import a content pack" sub="Validated JSON items — never code" onClick={() => packRef.current?.click()} />
        <Divider />
        <Row label="Pack author" sub="Build, validate, export, and install your own items" onClick={() => setAuthorOpen(true)} />
        {state.customPacks.length ? (
          <>
            <Divider />
            <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
              {state.customPacks.map((p) => (
                <Chip key={p.meta.id} tone="accent">
                  {p.meta.name} ({p.items.length})
                  <button type="button" className="ml-1 opacity-70 hover:opacity-100 min-h-11 min-w-11" aria-label={`Remove pack ${p.meta.name}`} onClick={() => dispatch({ type: 'remove-pack', id: p.meta.id })}>
                    ×
                  </button>
                </Chip>
              ))}
            </div>
          </>
        ) : null}
        <Divider />
        <Row
          label={state.sampleMode ? 'Exit sample data' : 'Load sample data'}
          sub={state.sampleMode ? 'Restore your real profile' : 'Preview weeks of plausible use — your data is kept safe aside'}
          onClick={() => (state.sampleMode ? void exitSample() : setConfirmSample(true))}
        />
        <Divider />
        <Row
          label={<span className="text-bad">Delete everything</span>}
          sub="Full local wipe — export first if in doubt"
          onClick={() => setConfirmReset(true)}
        />
        <Divider />
        {/* Always present, never a dead button: with no reports filed this is
            static text saying where reports come from, because the row used to
            appear only after the first report and was impossible to find when
            you went looking for it. */}
        {state.reports.length ? (
          <Row
            label="Export problem reports"
            sub={`${state.reports.length} item report${state.reports.length === 1 ? '' : 's'} you filed`}
            onClick={() => download('axiom-lab-reports.json', JSON.stringify(state.reports, null, 2))}
          />
        ) : (
          <Row
            label={<span className="text-muted">Export problem reports</span>}
            sub="Nothing filed yet. Tap the flag icon at the top of any question to report a wrong answer or confusing wording — reports collect here and stay on this device until you export them."
          />
        )}
      </Card>
      {importMsg ? (
        <p className="text-[13px] mt-2 px-1 text-muted" role="status">
          {importMsg}
        </p>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onImportFile(f)
          e.target.value = ''
        }}
      />
      <input
        ref={packRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onImportPack(f)
          e.target.value = ''
        }}
      />

      <SectionTitle>Privacy & storage</SectionTitle>
      <Card className="p-4">
        <p className="text-[13px] text-muted leading-relaxed">
          Axiom Lab is local-first by architecture: no account, no server, no analytics, no tracking, and no network
          requests during use (the only network activity is downloading app updates you approve). Learning data lives
          in this browser's IndexedDB with a redundant backup copy and, when small enough, a localStorage mirror.
        </p>
        <p className="text-[13px] text-muted leading-relaxed mt-2">
          Honest caveat: browser storage is not protected from another person using this device unlocked, and the
          browser can evict storage under extreme disk pressure —{' '}
          {storage?.persisted === true
            ? 'persistent storage is GRANTED for this app, which protects against eviction.'
            : 'this app has requested persistent storage; installing it to your home screen strengthens that protection.'}{' '}
          {storage?.usageBytes != null ? `Current usage: ${(storage.usageBytes / 1024 / 1024).toFixed(1)} MB.` : ''}
        </p>
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card>
        <Row label="Axiom Lab" sub={`Build ${typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'} · private adaptive learning lab`} onClick={() => setAboutOpen(true)} />
      </Card>
      <div className="h-8" />

      {/* dialogs */}
      <Confirm
        open={confirmSample}
        onCancel={() => setConfirmSample(false)}
        onConfirm={() => {
          setConfirmSample(false)
          void enterSample()
          go({ name: 'today' })
        }}
        title="Load sample data?"
        body="A demo profile with weeks of plausible history will load so you can explore every screen. Your real data is stashed safely and restored the moment you exit sample mode."
        confirmLabel="Load sample"
      />
      <Confirm
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          setConfirmReset2(true)
        }}
        title="Delete all data?"
        body="Everything — profile, history, evidence, forecasts — will be permanently removed from this device. Consider exporting first."
        confirmLabel="Continue"
        danger
      />
      <Confirm
        open={confirmReset2}
        onCancel={() => setConfirmReset2(false)}
        onConfirm={() => {
          setConfirmReset2(false)
          void resetAll()
        }}
        title="Really delete everything?"
        body="This is the point of no return. There is no cloud copy to recover from — that's the privacy model working as designed."
        confirmLabel="Delete it all"
        danger
      />
      {pendingImport?.ok ? (
        <Confirm
          open={true}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            dispatch({ type: 'replace', state: pendingImport.state })
            setPendingImport(null)
            setImportMsg('Import complete — progress recomputed from the imported evidence.')
          }}
          title="Replace current data?"
          body={`The file contains ${pendingImport.counts.events} attempts and ${pendingImport.counts.sessions} sessions. Importing replaces what's currently on this device.`}
          confirmLabel="Import"
          danger
        />
      ) : null}
      <AboutSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
      {authorOpen ? <PackAuthor open={authorOpen} onClose={() => setAuthorOpen(false)} /> : null}
      <AddDeadline
        open={deadlineOpen}
        onClose={() => setDeadlineOpen(false)}
        onAdd={(d) => {
          dispatch({ type: 'add-deadline', deadline: d })
          setDeadlineOpen(false)
        }}
      />
    </div>
  )
}

function AddDeadline({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (d: Deadline) => void }) {
  const [title, setTitle] = useState('')
  const [dateISO, setDateISO] = useState(() => addLocalDaysISO(Date.now(), 7))
  const [bucket, setBucket] = useState<BucketId | null>('math')
  const [skillIds, setSkillIds] = useState<string[]>([])
  const [dailyMinutes, setDailyMinutes] = useState<10 | 20 | 25 | 30 | 45>(30)
  const skills = SKILLS.filter((s) => s.bucket === bucket).sort((a, b) => a.gradeBand - b.gradeBand || a.name.localeCompare(b.name))
  return (
    <Modal open={open} onClose={onClose} title="Create a learning mission" wide>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 80))}
        placeholder='e.g. "Math unit test — linear equations"'
        className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent"
      />
      <label className="block mt-3">
        <span className="text-[13px] text-muted font-medium">Date</span>
        <input
          type="date"
          value={dateISO}
          onChange={(e) => setDateISO(e.target.value)}
          className="mt-1 w-full bg-surface2 border border-line rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-accent"
        />
      </label>
      <div className="mt-3">
        <span className="text-[13px] text-muted font-medium">Subject</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {BUCKETS.filter((b) => ['math', 'physics', 'coding', 'science'].includes(b.id)).map((b) => (
            <button type="button" className="min-h-11" key={b.id} onClick={() => { setBucket(b.id); setSkillIds([]) }} aria-pressed={bucket === b.id}>
              <Chip tone={bucket === b.id ? 'accent' : 'neutral'} className="cursor-pointer !py-1.5">
                {b.short}
              </Chip>
            </button>
          ))}
          <button type="button" className="min-h-11" onClick={() => { setBucket(null); setSkillIds([]) }} aria-pressed={bucket === null}>
            <Chip tone={bucket === null ? 'accent' : 'neutral'} className="cursor-pointer !py-1.5">
              Other
            </Chip>
          </button>
        </div>
      </div>
      {bucket ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] text-muted font-medium">Target skills</span>
            <span className="text-[11px] text-faint">Choose what the goal actually covers</span>
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto scroll-thin grid sm:grid-cols-2 gap-1.5 pr-1">
            {skills.map((s) => {
              const selected = skillIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSkillIds(selected ? skillIds.filter((id) => id !== s.id) : [...skillIds, s.id])}
                  className={`min-h-11 text-left rounded-lg border px-3 py-2 ${selected ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface2 text-muted'}`}
                >
                  <span className="block text-[13px] font-medium">{s.name}</span>
                  <span className="block text-[11px] text-faint">Grade {s.gradeBand} · {s.blurb}</span>
                </button>
              )
            })}
          </div>
          {!skillIds.length ? <p className="text-[12px] text-warn mt-1.5">Select at least one skill so the plan can be precise.</p> : null}
        </div>
      ) : null}
      <div className="mt-4">
        <span className="text-[13px] text-muted font-medium">Daily focused dose</span>
        <div className="mt-1.5">
          <Segmented
            ariaLabel="Mission daily minutes"
            value={String(dailyMinutes) as '30'}
            onChange={(v) => setDailyMinutes(Number(v) as 10 | 20 | 25 | 30 | 45)}
            options={[
              { value: '20', label: '20m' },
              { value: '30', label: '30m' },
              { value: '45', label: '45m' },
            ]}
          />
        </div>
        <p className="text-[11px] text-faint mt-1.5">30 minutes is the program default, not a magic threshold. The check-in can still shorten a hard day.</p>
      </div>
      <Button
        className="w-full mt-4"
        disabled={title.trim().length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || (bucket !== null && skillIds.length === 0)}
        onClick={() => onAdd({ id: uid('dl'), title: title.trim(), dateISO, bucket, note: '', skillIds, dailyMinutes })}
      >
        Create mission
      </Button>
    </Modal>
  )
}

function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="About Axiom Lab" wide>
      <div className="space-y-3 text-[14px] leading-relaxed text-muted">
        <p>
          <span className="text-ink font-medium">What this is:</span> a private, offline-first lab for durable learning —
          math, physics, coding, and scientific reasoning at the core, surrounded by deliberately-trained thinking
          skills: observation, deduction, strategy, influence-defense, and learning-how-to-learn.
        </p>
        <p>
          <span className="text-ink font-medium">The method</span> is built on well-replicated learning science:
          retrieval practice and spacing (the two highest-utility techniques in the Dunlosky et&nbsp;al. 2013 review and
          the IES practice guide), interleaving, worked-example fading, corrective feedback with re-attempts, and
          metacognitive calibration. Where the app uses a specific number — review intervals, promotion thresholds —
          those are labeled heuristics, not findings.
        </p>
        <p>
          <span className="text-ink font-medium">What it refuses to claim:</span> no single IQ score, no "brain
          training raises intelligence" promises (the meta-analytic evidence says task-specific gains don't transfer
          that way), no learning-styles matching, no lie-detection "tells". Chess and puzzles are taught as real skills
          plus explicitly-bridged strategies — and the app tests whether YOUR transfer actually happened rather than
          asserting it.
        </p>
        <p>
          <span className="text-ink font-medium">Mastery model:</span> skills climb Unseen → Introduced → Guided →
          Independent (2 unaided first-try successes, distinct forms) → Retained (a success ≥48h later) → Transferred
          (novel context). Hints are honest: hinted solves count as guided. High-confidence errors block promotion
          until repaired. Everything derives from an append-only evidence log — delete or import history and every
          number honestly recomputes.
        </p>
        <p>
          <span className="text-ink font-medium">Research ledger:</span> the full claims-and-sources ledger (with what
          each source does and does NOT support) ships in the repository as <code className="font-mono text-[12px]">docs/RESEARCH.md</code>.
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-line">
        <h3 className="font-display font-semibold text-[16px] mb-3">Update log</h3>
        <div className="space-y-4">
          {CHANGELOG.map((e) => (
            <div key={e.version}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[13px] font-bold text-accent">v{e.version}</span>
                <span className="font-medium text-[14px]">{e.title}</span>
                <span className="text-[11px] text-faint ml-auto">{e.date}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {e.points.map((p, i) => (
                  <li key={i} className="text-[13px] text-muted leading-relaxed flex gap-2">
                    <span className="text-faint shrink-0">·</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
