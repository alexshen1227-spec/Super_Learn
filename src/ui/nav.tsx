/** In-app navigation: state-driven views with history integration so the
 *  Android/browser back button behaves inside the installed PWA. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AttemptMode } from '../domain/types'

export type SessionLaunch =
  | { kind: 'daily' }
  | { kind: 'resume' }
  | { kind: 'focus'; skillId: string }
  | { kind: 'mixed' }
  | { kind: 'challenge' }
  | { kind: 'single'; templateId: string; mode?: AttemptMode }
  | { kind: 'error-clinic' }

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

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ name: 'today' })
  useEffect(() => {
    // Seed a base history entry so back inside the app has somewhere to go.
    history.replaceState({ axiom: true, view: { name: 'today' } }, '')
    const onPop = (e: PopStateEvent) => {
      const v = (e.state && (e.state as { view?: View }).view) || { name: 'today' as const }
      setView(v)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const go = (v: View) => {
    setView(v)
    history.pushState({ axiom: true, view: v }, '')
    window.scrollTo(0, 0)
  }
  const back = () => history.back()
  return <NavCtx.Provider value={{ view, go, back }}>{children}</NavCtx.Provider>
}

export function useNav(): Nav {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error('useNav outside provider')
  return ctx
}
