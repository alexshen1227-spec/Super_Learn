import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useStore } from './store/store'
import { NavProvider, useNav, type Tab } from './ui/nav'
import { IconCoach, IconPath, IconPractice, IconProgress, IconSettings, IconToday } from './ui/icons'
import { Button } from './ui/components'
import { exportState } from './engine/exportImport'
import { Onboarding } from './ui/screens/Onboarding'
import { maybeNotifyReviews } from './ui/notify'
import { dueReviews } from './engine/scheduler'
import { deriveEvidence } from './engine/mastery'
import { Today } from './ui/screens/Today'
import { PathScreen } from './ui/screens/Path'
import { CoachScreen } from './ui/screens/CoachScreen'
import { Practice } from './ui/screens/Practice'
import { ProgressScreen } from './ui/screens/ProgressScreen'
import { SettingsScreen } from './ui/screens/SettingsScreen'
import { SessionScreen } from './ui/session/SessionScreen'
import { PlacementScreen } from './ui/screens/PlacementScreen'
import { ExamScreen } from './ui/session/ExamScreen'

/** Render-error safety net: never a white screen; data export stays reachable. */
class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh grid place-items-center p-6 bg-bg text-ink">
          <div className="max-w-sm text-center">
            <h1 className="font-display text-xl font-semibold">Something broke.</h1>
            <p className="text-muted mt-2 text-sm">
              Your data is safe on this device. Reload to continue — if this repeats, export your data from Settings and report the issue.
            </p>
            <pre className="text-xs text-faint mt-3 overflow-x-auto">{String(this.state.error)}</pre>
            <Button className="mt-4 w-full" onClick={() => location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function applyTheme(theme: 'light' | 'dark' | 'system', spaced: boolean) {
  const root = document.documentElement
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  root.classList.toggle('spaced', spaced)
  try {
    localStorage.setItem('axiomlab.theme', theme === 'system' ? '' : theme)
  } catch {
    /* preference only */
  }
}

const TABS: { id: Tab; label: string; icon: typeof IconToday }[] = [
  { id: 'today', label: 'Today', icon: IconToday },
  { id: 'path', label: 'Path', icon: IconPath },
  { id: 'practice', label: 'Practice', icon: IconPractice },
  { id: 'coach', label: 'Coach', icon: IconCoach },
  { id: 'progress', label: 'Progress', icon: IconProgress },
]

function Shell() {
  const { state, ready, exitSample } = useStore()
  const { view, go } = useNav()
  const [offline, setOffline] = useState(!navigator.onLine)
  const inSession = view.name === 'session' || view.name === 'placement' || view.name === 'exam'

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => undefined,
    // Installed-app update coverage: phones rarely "navigate", so besides the
    // launch-time check we re-check when the app resumes from background,
    // when the network comes back, and hourly while running. The banner (and
    // the never-mid-session rule) handles the rest identically to a tab.
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      const check = () => void registration.update().catch(() => undefined)
      setInterval(check, 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('online', check)
    },
  })

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    applyTheme(state.settings.theme, state.settings.textSpacing)
  }, [state.settings.theme, state.settings.textSpacing])

  // Opt-in review reminder: on launch/resume, at most once per day.
  useEffect(() => {
    if (!ready || !state.onboarded || state.sampleMode) return
    const check = () => {
      const due = dueReviews(deriveEvidence(state.events, Date.now()), Date.now())
      maybeNotifyReviews(state.settings, due.length)
    }
    check()
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [ready, state.onboarded, state.sampleMode, state.events, state.settings])

  const screen = useMemo(() => {
    switch (view.name) {
      case 'today':
        return <Today />
      case 'path':
        return <PathScreen />
      case 'coach':
        return <CoachScreen />
      case 'practice':
        return <Practice />
      case 'progress':
        return <ProgressScreen />
      case 'settings':
        return <SettingsScreen />
      case 'session':
        return <SessionScreen launch={view.launch} />
      case 'placement':
        return <PlacementScreen />
      case 'exam':
        return <ExamScreen />
    }
  }, [view])

  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center text-faint font-display tracking-widest">AXIOM LAB</div>
    )
  }
  if (!state.onboarded) {
    return <Onboarding />
  }

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      {offline ? (
        <div className="bg-surface2 border-b border-line text-center text-xs text-muted py-1.5 pt-safe" role="status">
          Offline — everything here works without a connection.
        </div>
      ) : null}
      {state.sampleMode ? (
        <div className="bg-warn-soft border-b border-warn/30 text-warn text-xs py-1.5 px-4 flex items-center justify-between gap-2 pt-safe" role="status">
          <span className="font-medium">Sample data — this is a demo profile.</span>
          <button className="underline font-semibold" onClick={() => void exitSample()}>
            Exit
          </button>
        </div>
      ) : null}
      {/* Update prompt: NEVER during an active session. */}
      {needRefresh && !inSession ? (
        <div className="bg-accent-soft border-b border-accent/30 text-accent text-[13px] py-2 px-4 flex items-center justify-between gap-3" role="status">
          <span>A new version is ready.</span>
          <span className="flex gap-3 shrink-0">
            <button className="underline font-semibold" onClick={() => void updateServiceWorker(true)}>
              Update now
            </button>
            <button className="opacity-80" onClick={() => setNeedRefresh(false)}>
              Later
            </button>
          </span>
        </div>
      ) : null}

      <main className={`flex-1 w-full mx-auto ${inSession ? 'max-w-2xl' : 'max-w-2xl lg:max-w-5xl'} px-4 ${inSession ? '' : 'pb-24'}`}>
        {screen}
      </main>

      {!inSession ? (
        <nav
          aria-label="Main"
          className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-line pb-safe z-40"
        >
          <div className="max-w-2xl lg:max-w-5xl mx-auto flex">
            {TABS.map((t) => {
              const active = view.name === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => go({ name: t.id })}
                  aria-current={active ? 'page' : undefined}
                  className={`flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                    active ? 'text-accent' : 'text-faint hover:text-muted'
                  }`}
                >
                  <Icon size={22} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </nav>
      ) : null}
    </div>
  )
}

/** Small helper other screens use for the header settings button. */
export function HeaderBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { go, view } = useNav()
  return (
    <header className="pt-safe">
      <div className="flex items-start justify-between pt-5 pb-1">
        <div>
          <h1 className="font-display text-[24px] font-bold leading-tight">{title}</h1>
          {subtitle ? <p className="text-muted text-sm mt-0.5">{subtitle}</p> : null}
        </div>
        {view.name !== 'settings' ? (
          <button
            aria-label="Settings"
            onClick={() => go({ name: 'settings' })}
            className="h-10 w-10 grid place-items-center rounded-full text-muted hover:text-ink hover:bg-surface2 transition-colors mt-1"
          >
            <IconSettings size={21} />
          </button>
        ) : null}
      </div>
    </header>
  )
}

export function App() {
  return (
    <Boundary>
      <NavProvider>
        <Shell />
      </NavProvider>
    </Boundary>
  )
}

// Re-export for Settings' emergency data path in the boundary text above.
export { exportState }
