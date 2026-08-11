import { evidenceEvents } from './engine/dispute'
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useStore } from './store/store'
import { NavProvider, useNav, type Tab } from './ui/nav'
import { IconCoach, IconPath, IconPractice, IconProgress, IconToday } from './ui/icons'
import { Button } from './ui/components'
import { exportState } from './engine/exportImport'
import { maybeNotifyReviews } from './ui/notify'
import { dueReviews } from './engine/scheduler'
import { deriveEvidence } from './engine/mastery'

// Screens are loaded when entered. This keeps the initial shell quick while
// retaining every screen in the offline precache after installation.
const Onboarding = lazy(() => import('./ui/screens/Onboarding').then((m) => ({ default: m.Onboarding })))
const Today = lazy(() => import('./ui/screens/Today').then((m) => ({ default: m.Today })))
const PathScreen = lazy(() => import('./ui/screens/Path').then((m) => ({ default: m.PathScreen })))
const CoachScreen = lazy(() => import('./ui/screens/CoachScreen').then((m) => ({ default: m.CoachScreen })))
const Practice = lazy(() => import('./ui/screens/Practice').then((m) => ({ default: m.Practice })))
const ProgressScreen = lazy(() => import('./ui/screens/ProgressScreen').then((m) => ({ default: m.ProgressScreen })))
const SettingsScreen = lazy(() => import('./ui/screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
const SessionScreen = lazy(() => import('./ui/session/SessionScreen').then((m) => ({ default: m.SessionScreen })))
const PlacementScreen = lazy(() => import('./ui/screens/PlacementScreen').then((m) => ({ default: m.PlacementScreen })))
const ExamScreen = lazy(() => import('./ui/session/ExamScreen').then((m) => ({ default: m.ExamScreen })))

function ScreenFallback() {
  return (
    <div className="min-h-[45dvh] grid place-items-center" role="status" aria-live="polite">
      <span className="font-display text-xs tracking-[0.22em] text-faint">PREPARING YOUR LAB</span>
    </div>
  )
}

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
              Your data is safe on this device. Reload to continue. If this repeats, export from Settings after the app opens and report the issue.
            </p>
            <details className="text-left mt-3 rounded-xl border border-line bg-surface px-3 py-2">
              <summary className="text-xs text-muted cursor-pointer">Technical details</summary>
              <pre className="text-xs text-faint mt-2 overflow-x-auto whitespace-pre-wrap">{String(this.state.error)}</pre>
            </details>
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
  const { state, ready, exitSample, staleTab } = useStore()
  const { view, go } = useNav()
  const [offline, setOffline] = useState(!navigator.onLine)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const inSession = view.name === 'session' || view.name === 'placement' || view.name === 'exam'

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => undefined,
    onRegisteredSW: (_url, registration) => {
      setSwRegistration(registration ?? null)
    },
  })

  // Installed-app update coverage with cleanup: phones rarely navigate, so
  // re-check on resume, reconnection, and hourly without leaking listeners.
  useEffect(() => {
    if (!swRegistration) return
    const check = () => void swRegistration.update().catch(() => undefined)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    const interval = window.setInterval(check, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', check)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', check)
    }
  }, [swRegistration])

  // Auto-update BEFORE setup, prompt after it.
  //
  // Onboarding returns early (below), so the refresh banner is not even in the
  // tree until a profile exists — a waiting update would sit there permanently
  // unreachable. There is also nothing to protect yet: no session in progress,
  // no answers, no history. So apply it silently and let the reload land the
  // learner back on the same first screen, now running the new build.
  //
  // Once onboarded the banner takes over and the choice is the user's, because
  // from that point a reload can interrupt real work.
  const autoUpdated = useRef(false)
  useEffect(() => {
    if (!ready || state.onboarded || !needRefresh || autoUpdated.current) return
    // Once per page load: if the update somehow fails, this must not become a
    // reload loop on the very first screen of the app.
    autoUpdated.current = true
    void updateServiceWorker(true)
  }, [ready, state.onboarded, needRefresh, updateServiceWorker])

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
    if (state.settings.theme !== 'system') return
    const preference = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system', state.settings.textSpacing)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [state.settings.theme, state.settings.textSpacing])

  // Opt-in review reminder: on launch/resume, at most once per day.
  useEffect(() => {
    if (!ready || !state.onboarded || state.sampleMode) return
    const check = () => {
      const due = dueReviews(deriveEvidence(evidenceEvents(state.events, state.disputes), Date.now()), Date.now())
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
    return <Suspense fallback={<ScreenFallback />}><Onboarding /></Suspense>
  }

  return (
    <div className="app-backdrop min-h-dvh bg-bg text-ink flex flex-col">
      {offline ? (
        <div className="bg-surface2 border-b border-line text-center text-xs text-muted py-1.5 pt-safe" role="status">
          Offline — everything here works without a connection.
        </div>
      ) : null}
      {/*
        Two tabs, one learner. Saving is a whole-state overwrite from memory, so
        the tab that writes last wins. Attempt EVENTS survive either way — the
        append-only journal is unioned back on the next launch, which is what it
        is for — but session records, deadlines and forecasts from the other tab
        would be lost. Merging automatically would resurrect deleted deadlines
        and reports, which is worse, so the collision is named instead of
        silently resolved. Suppressed during a session: nothing is more
        disruptive than a data warning mid-question, and the session's own
        draft is written separately.
      */}
      {staleTab && !inSession ? (
        <div className="bg-warn-soft border-b border-warn/30 text-warn text-xs py-1.5 px-4 flex items-center justify-between gap-2 pt-safe" role="status">
          <span className="font-medium">Open in another tab, which has newer work. Reload to catch up before saving here.</span>
          <button type="button" className="underline font-semibold min-h-11 -my-2 px-2" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      ) : null}
      {state.sampleMode ? (
        <div className="bg-warn-soft border-b border-warn/30 text-warn text-xs py-1.5 px-4 flex items-center justify-between gap-2 pt-safe" role="status">
          <span className="font-medium">Sample data — this is a demo profile.</span>
          <button type="button" className="underline font-semibold min-h-11 -my-2 px-2" onClick={() => void exitSample()}>
            Exit
          </button>
        </div>
      ) : null}
      {/* Update prompt: NEVER during an active session. Before onboarding
          completes this is unreachable by design — updates apply themselves
          there instead (see the auto-update effect above). */}
      {needRefresh && !inSession ? (
        <div className="bg-accent-soft border-b border-accent/30 text-accent text-[13px] py-2 px-4 flex items-center justify-between gap-3" role="status">
          <span>A new version is ready.</span>
          <span className="flex gap-3 shrink-0">
            <button type="button" className="underline font-semibold min-h-11 -my-2" onClick={() => void updateServiceWorker(true)}>
              Update now
            </button>
            <button type="button" className="opacity-80 min-h-11 -my-2 px-1" onClick={() => setNeedRefresh(false)}>
              Later
            </button>
          </span>
        </div>
      ) : null}

      <main className={`flex-1 w-full mx-auto ${inSession ? 'max-w-2xl' : 'max-w-2xl lg:max-w-5xl'} px-4 sm:px-5 ${inSession ? '' : 'pb-24 sm:pb-28'}`}>
        <Suspense fallback={<ScreenFallback />}>{screen}</Suspense>
      </main>

      {!inSession ? (
        <nav
          aria-label="Main"
          className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-xl border-t border-line pb-safe z-40 sm:bottom-4 sm:inset-x-4 sm:max-w-2xl sm:mx-auto sm:rounded-2xl sm:border sm:pb-0 sm:shadow-modal"
        >
          <div className="mx-auto flex px-2 pt-1 sm:p-1">
            {TABS.map((t) => {
              const active = view.name === t.id
              const Icon = t.icon
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => go({ name: t.id })}
                  aria-current={active ? 'page' : undefined}
                  className={`flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
                    active ? 'text-accent bg-accent-soft' : 'text-faint hover:text-muted hover:bg-surface2'
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
