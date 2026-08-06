/**
 * Opt-in local review reminders. Zero-server honesty: these fire from the
 * running app itself (foreground or backgrounded tab/installed app) — there
 * is no push infrastructure and none is pretended. Quiet hours are honored,
 * at most one reminder per day, and the copy never shames.
 */
import type { AppSettings } from '../domain/types'

const LAST_KEY = 'axiomlab.lastNotified'

export function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined'
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

function inQuietHours(quiet: AppSettings['quietHours'], now: Date): boolean {
  if (!quiet) return false
  const h = now.getHours()
  // Window may wrap midnight (e.g. 21 → 7).
  return quiet.start <= quiet.end ? h >= quiet.start && h < quiet.end : h >= quiet.start || h < quiet.end
}

/** Fire at most one gentle due-review reminder per day. */
export function maybeNotifyReviews(settings: AppSettings, dueCount: number): void {
  if (!settings.notifications || dueCount <= 0) return
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (inQuietHours(settings.quietHours, new Date())) return
  try {
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(LAST_KEY) === today) return
    localStorage.setItem(LAST_KEY, today)
    new Notification('Axiom Lab', {
      body: `${dueCount} review${dueCount === 1 ? ' is' : 's are'} ready when you are — a few minutes keeps them yours.`,
      tag: 'axiomlab-reviews',
      silent: true,
    })
  } catch {
    /* never let a reminder break the app */
  }
}
