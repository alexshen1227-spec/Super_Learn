/** In-app navigation: state-driven views with history integration so the
 *  Android/browser back button behaves inside the installed PWA. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AttemptMode } from '../domain/types'

export type SessionLaunch =
  | { kind: 'daily' }
  | { kind: 'resume' }
  | { kind: 'focus'; skillId: string }
  | { kind: 'mixed' }
  | { kind: 'challenge' }
  | { kind: 'single'; templateId: string; mode?: AttemptMode }
  | { kind: 'error-clinic' }
  | { kind: 'checkpoint'; skillIds: string[]; unitName: string }

export type Tab = 'today' | 'path' | 'coach' | 'practice' | 'progress'

export type View =
  | { name: Tab }
  | { name: 'settings' }
  | { name: 'session'; launch: SessionLaunch }
  | { name: 'placement' }
  | { name: 'exam' }

interface Nav {
  view: View
  go: (v: View) => void
  back: () => void
}

const NavCtx = createContext<Nav | null>(null)

function initialView(): View {
  const saved = history.state?.axiom ? (history.state.view as View | undefined) : undefined
  // Active learning surfaces restore through their own crash-safe drafts.
  // Reloading directly into a stale launch would bypass the Resume path.
  if (saved && ['today', 'path', 'coach', 'practice', 'progress', 'settings'].includes(saved.name)) return saved
  return { name: 'today' }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const initial = initialView()
  const [view, setView] = useState<View>(initial)
  const depth = useRef(Number(history.state?.depth) || 0)
  useEffect(() => {
    // Seed a base history entry so back inside the app has somewhere to go.
    history.replaceState({ axiom: true, view: initial, depth: depth.current }, '')
    const onPop = (e: PopStateEvent) => {
      const v = (e.state && (e.state as { view?: View }).view) || { name: 'today' as const }
      depth.current = Number(e.state?.depth) || 0
      setView(v)
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const go = (v: View) => {
    if (v.name === view.name && ['today', 'path', 'coach', 'practice', 'progress'].includes(v.name)) {
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      return
    }
    depth.current += 1
    setView(v)
    history.pushState({ axiom: true, view: v, depth: depth.current }, '')
    window.scrollTo(0, 0)
  }
  const back = () => {
    if (depth.current > 0) history.back()
    else {
      const today = { name: 'today' } as const
      setView(today)
      history.replaceState({ axiom: true, view: today, depth: 0 }, '')
      window.scrollTo(0, 0)
    }
  }
  return <NavCtx.Provider value={{ view, go, back }}>{children}</NavCtx.Provider>
}

export function useNav(): Nav {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error('useNav outside provider')
  return ctx
}
