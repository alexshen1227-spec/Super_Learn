/**
 * Onboarding: short, purposeful, privacy-first. Collects only what the
 * planner actually uses; everything is editable later in Settings.
 */
import { useState } from 'react'
import type { AgeBand, CoachTone, Profile } from '../../domain/types'
import { defaultProfile, defaultSettings } from '../../domain/types'
import { useStore } from '../../store/store'
import { useNav } from '../nav'
import { Button, Chip, Segmented } from '../components'
import { MATH_TRACKS } from '../../content/tracks'
import { GOAL_PRESETS } from '../../engine/goals'

/** Shares the honesty note with Settings; see engine/goals.ts. */
const REASONING_GOAL = 'Everyday reasoning & judgement'


const COURSE_PRESETS = ['Math 8', 'Algebra 1', 'Pre-Algebra', 'Physical Science', 'Life Science', 'Computer Science']

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Onboarding() {
  const { dispatch } = useStore()
  const { go } = useNav()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Profile>(defaultProfile())
  const set = (p: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...p }))
  const selectedMathTrack = MATH_TRACKS.find((track) => track.id === profile.mathTrack) ?? null

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const finish = (thenPlacement: boolean) => {
    dispatch({ type: 'onboard', profile, settings: defaultSettings() })
    go(thenPlacement ? { name: 'placement' } : { name: 'today' })
  }

  const steps = [
    // 0 — welcome & privacy
    <div key="w">
      <div className="flex items-center gap-3 mb-5">
        <svg width="44" height="44" viewBox="0 0 512 512" aria-hidden>
          <rect width="512" height="512" rx="112" fill="#0d1420" />
          <g stroke="#3a4a63" strokeWidth="18" strokeLinecap="round">
            <line x1="154" y1="348" x2="256" y2="164" />
            <line x1="256" y1="164" x2="368" y2="318" />
          </g>
          <circle cx="154" cy="348" r="40" fill="#4ade80" />
          <circle cx="256" cy="164" r="44" fill="#22d3ee" />
          <circle cx="368" cy="318" r="36" fill="#f5a524" />
        </svg>
        <h1 className="font-display text-[26px] font-bold leading-tight">Axiom Lab</h1>
      </div>
      <p className="text-muted leading-relaxed">
        A private lab for building real, lasting skill: math, physics, coding, scientific reasoning — and the thinking
        crafts around them: observation, deduction, strategy, and self-knowledge.
      </p>
      <div className="bg-surface border border-line rounded-2xl p-4 mt-5 text-sm leading-relaxed">
        <p className="font-semibold mb-1.5">Private by architecture</p>
        <p className="text-muted">
          Everything stays in this browser's storage on this device. No account, no cloud, no analytics, no network
          calls. You can export, import, or delete all data anytime. One honest caveat: browser storage is not
          protected from someone else using this device unlocked.
        </p>
      </div>
      <label className="block mt-6">
        <span className="text-sm font-medium text-muted">What should the coach call you? (optional)</span>
        <input
          value={profile.name}
          onChange={(e) => set({ name: e.target.value.slice(0, 40) })}
          placeholder="Name or nickname"
          className="mt-1.5 w-full bg-surface border border-line rounded-xl px-4 py-3 text-[16px] outline-none focus:border-accent"
        />
      </label>
      <div className="mt-4">
        <span className="text-sm font-medium text-muted">Age band (never your birth date)</span>
        <div className="mt-1.5">
          <Segmented<AgeBand>
            ariaLabel="Age band"
            value={profile.ageBand}
            onChange={(v) => set({ ageBand: v })}
            options={[
              { value: 'under13', label: 'Under 13' },
              { value: '13-17', label: '13–17' },
              { value: '18plus', label: '18+' },
              { value: 'unspecified', label: 'Skip' },
            ]}
          />
        </div>
      </div>
    </div>,

    // 1 — school context
    <div key="s">
      <h2 className="font-display text-xl font-bold">School picture</h2>
      <p className="text-muted text-sm mt-1">This routes the placement and keeps practice relevant to real class work.</p>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Grade level</span>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {[6, 7, 8, 9, 10, 11, 12].map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => set({ gradeLevel: g })}
              aria-pressed={profile.gradeLevel === g}
              className={`min-h-11 px-4 rounded-xl border text-[15px] font-medium transition-colors ${
                profile.gradeLevel === g ? 'bg-accent text-bg border-accent' : 'bg-surface border-line text-muted hover:border-line-strong'
              }`}
            >
              {g}th
            </button>
          ))}
          <button
            type="button"
            onClick={() => set({ gradeLevel: null })}
            aria-pressed={profile.gradeLevel === null}
            className={`min-h-11 px-4 rounded-xl border text-[15px] font-medium transition-colors ${
              profile.gradeLevel === null ? 'bg-accent text-bg border-accent' : 'bg-surface border-line text-muted hover:border-line-strong'
            }`}
          >
            Not in school
          </button>
        </div>
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">What math course are you in right now?</span>
        <p className="text-[12px] text-faint mt-0.5">
          Works for any stage, middle school to long-out-of-school. Course skills get a small, openly-labeled priority
          bump — nothing outside the course is dropped, and harder or easier material still flows in as you earn it.
        </p>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          <button
            type="button"
            className="min-h-11"
            onClick={() => set({ mathTrack: null, trackConfirmedAt: Date.now() })}
            aria-pressed={profile.mathTrack === null}
          >
            <Chip tone={profile.mathTrack === null ? 'accent' : 'neutral'} className="!py-2 !px-3 !text-sm cursor-pointer">
              None right now
            </Chip>
          </button>
          {MATH_TRACKS.map((t) => (
            <button
              type="button"
              className="min-h-11"
              key={t.id}
              onClick={() => set({ mathTrack: t.id, trackConfirmedAt: Date.now() })}
              aria-pressed={profile.mathTrack === t.id}
              title={t.blurb}
            >
              <Chip tone={profile.mathTrack === t.id ? 'accent' : 'neutral'} className="!py-2 !px-3 !text-sm cursor-pointer">
                {t.name}
              </Chip>
            </button>
          ))}
        </div>
        {selectedMathTrack ? (
          <div className="mt-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
            <p className="text-[12px] font-semibold text-accent">{selectedMathTrack.standard ?? 'Beyond the California high-school course floor'}</p>
            <p className="text-[12px] text-muted mt-0.5">{selectedMathTrack.blurb}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Current courses (tap any that apply)</span>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {COURSE_PRESETS.map((c) => (
            <button type="button" className="min-h-11" key={c} onClick={() => set({ courses: toggle(profile.courses, c) })} aria-pressed={profile.courses.includes(c)}>
              <Chip tone={profile.courses.includes(c) ? 'accent' : 'neutral'} className="!py-2 !px-3 !text-sm cursor-pointer">
                {c}
              </Chip>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Goals (pick any)</span>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {GOAL_PRESETS.map((g) => (
            <button type="button" className="min-h-11" key={g} onClick={() => set({ goals: toggle(profile.goals, g) })} aria-pressed={profile.goals.includes(g)}>
              <Chip tone={profile.goals.includes(g) ? 'good' : 'neutral'} className="!py-2 !px-3 !text-sm cursor-pointer">
                {g}
              </Chip>
            </button>
          ))}
        </div>
        {/*
          The same honesty note Settings shows. A goal that names what it can
          and cannot do belongs at the moment it is CHOSEN, not only where it is
          later edited — otherwise the first impression is the promise and the
          correction is buried.
        */}
        {profile.goals.includes(REASONING_GOAL) ? (
          <p className="text-[12px] text-muted mt-2 leading-snug bg-surface2 border border-line rounded-lg p-2.5">
            <span className="font-medium">About “{REASONING_GOAL}”.</span> It leans practice toward a short list of
            topics where a study has actually measured the skill working on a problem the learner had not practised. It
            does not promise to make anyone a better thinker in general — no app can, and the research on that is not
            close.
          </p>
        ) : null}
      </div>
    </div>,

    // 2 — rhythm & style
    <div key="r">
      <h2 className="font-display text-xl font-bold">Your rhythm</h2>
      <p className="text-muted text-sm mt-1">Sessions adapt to the time you actually have — no streaks, no guilt.</p>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Usual session length</span>
        <div className="mt-1.5">
          <Segmented
            ariaLabel="Session length"
            value={String(profile.sessionMinutes) as '25'}
            onChange={(v) => set({ sessionMinutes: Number(v) as Profile['sessionMinutes'] })}
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
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Days you usually have time</span>
        <div className="flex gap-1.5 mt-1.5">
          {DAYS.map((d, i) => (
            <button
              type="button"
              key={d}
              onClick={() => set({ activeDays: profile.activeDays.includes(i) ? profile.activeDays.filter((x) => x !== i) : [...profile.activeDays, i] })}
              aria-pressed={profile.activeDays.includes(i)}
              className={`flex-1 min-h-11 rounded-lg border text-[13px] font-medium transition-colors ${
                profile.activeDays.includes(i) ? 'bg-accent-soft border-accent/40 text-accent' : 'bg-surface border-line text-faint'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Chess experience</span>
        <div className="mt-1.5">
          <Segmented
            ariaLabel="Chess experience"
            value={profile.chessExperience}
            onChange={(v) => set({ chessExperience: v })}
            options={[
              { value: 'none', label: 'New to it' },
              { value: 'casual', label: 'Casual' },
              { value: 'experienced', label: 'Experienced' },
            ]}
          />
        </div>
      </div>
      <div className="mt-5">
        <span className="text-sm font-medium text-muted">Coach tone</span>
        <div className="mt-1.5">
          <Segmented<CoachTone>
            ariaLabel="Coach tone"
            value={profile.coachTone}
            onChange={(v) => set({ coachTone: v })}
            options={[
              { value: 'concise', label: 'Concise' },
              { value: 'socratic', label: 'Socratic' },
              { value: 'supportive', label: 'Supportive' },
              { value: 'balanced', label: 'Balanced' },
            ]}
          />
        </div>
      </div>
    </div>,

    // 3 — placement offer
    <div key="p">
      <h2 className="font-display text-xl font-bold">Find your starting line</h2>
      <p className="text-muted leading-relaxed mt-2 text-[15px]">
        A short adaptive placement (about 12–18 minutes) probes math around your grade level plus a taste of physics,
        code reading, logic, and observation. It moves up or down quickly and you can skip any question.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        <li className="flex gap-2"><span className="text-good">✓</span> Maps what you already own, so practice starts at your real frontier</li>
        <li className="flex gap-2"><span className="text-good">✓</span> Reports what it measured AND what it didn't — no fake precision</li>
        <li className="flex gap-2"><span className="text-good">✓</span> Never produces an IQ score or a ranking</li>
      </ul>
      <p className="text-sm text-faint mt-4">
        Skipping is fine — the coach will start conservatively and learn from your first sessions instead.
      </p>
    </div>,
  ]

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="max-w-md mx-auto px-5 pt-safe pb-8">
        <div
          className="flex gap-1.5 pt-6 mb-6"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
        >
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-surface3'}`} />
          ))}
        </div>
        <div className="anim-in" key={step}>
          {steps[step]}
        </div>
        <div className="flex gap-2 mt-8">
          {step > 0 ? (
            <Button kind="secondary" onClick={() => setStep(step - 1)} className="flex-[0.6]">
              Back
            </Button>
          ) : null}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1">
              Continue
            </Button>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              <Button onClick={() => finish(true)}>Start placement</Button>
              <Button kind="ghost" onClick={() => finish(false)}>
                Skip for now — start conservatively
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
