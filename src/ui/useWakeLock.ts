import { useEffect } from 'react'

/**
 * Hold the screen awake while `active` is true.
 *
 * A learner reading a multi-part case file or working a problem on paper can
 * easily go a minute without touching the screen, and the phone locking
 * mid-thought is a genuine interruption to the one thing this app is for.
 *
 * The lock is released automatically by the browser whenever the page is
 * hidden, so it has to be re-acquired on the way back. Everything here is
 * best-effort: the API is missing on older iOS Safari and the request is
 * rejected outright on a hidden or backgrounded page, so every failure is
 * swallowed rather than surfaced. Nothing about the session depends on it.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
    }
    if (!nav.wakeLock) return

    let sentinel: { release: () => Promise<void> } | null = null
    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        sentinel = await nav.wakeLock!.request('screen')
        // The effect may have been torn down while the request was in flight.
        if (cancelled) {
          void sentinel.release().catch(() => undefined)
          sentinel = null
        }
      } catch {
        /* denied, unsupported, or the page was backgrounded — not worth telling anyone */
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
      else sentinel = null // the browser already dropped it for us
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      const held = sentinel
      sentinel = null
      if (held) void held.release().catch(() => undefined)
    }
  }, [active])
}
