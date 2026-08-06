/**
 * Calendar-date helpers for user-entered deadlines.
 *
 * A date-only value (YYYY-MM-DD) is a local calendar promise, not a UTC
 * timestamp. Comparing Date.parse(dateISO) with Date.now() makes the same
 * deadline appear one day farther away in western time zones. These helpers
 * compare calendar ordinals instead, so every screen and planner agrees.
 */
const DAY = 86_400_000

function dateParts(dateISO: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const check = new Date(Date.UTC(year, month - 1, day))
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  return [year, month, day]
}

function localOrdinal(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY
}

/** Whole local calendar days until a date. Today is 0; tomorrow is 1. */
export function calendarDaysUntil(dateISO: string, now: number): number {
  const parts = dateParts(dateISO)
  if (!parts) return Number.NaN
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) / DAY - localOrdinal(now)
}

/** Format a timestamp as its local YYYY-MM-DD calendar date. */
export function localDateISO(timestamp = Date.now()): string {
  const d = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Add calendar days locally (DST-safe) and return YYYY-MM-DD. */
export function addLocalDaysISO(timestamp: number, days: number): string {
  const d = new Date(timestamp)
  d.setDate(d.getDate() + days)
  return localDateISO(d.getTime())
}
