import { describe, expect, it } from 'vitest'
import { addLocalDaysISO, calendarDaysUntil, localDateISO } from './time'

describe('deadline calendar math', () => {
  it('treats a date-only deadline as a local calendar date', () => {
    const lateToday = new Date(2026, 7, 6, 23, 55).getTime()
    expect(calendarDaysUntil('2026-08-06', lateToday)).toBe(0)
    expect(calendarDaysUntil('2026-08-11', lateToday)).toBe(5)
  })

  it('handles month boundaries and rejects invalid dates', () => {
    const now = new Date(2026, 7, 31, 8).getTime()
    expect(calendarDaysUntil('2026-09-01', now)).toBe(1)
    expect(Number.isNaN(calendarDaysUntil('2026-02-30', now))).toBe(true)
  })

  it('formats and advances local dates without crossing through UTC', () => {
    const late = new Date(2026, 11, 31, 23, 30).getTime()
    expect(localDateISO(late)).toBe('2026-12-31')
    expect(addLocalDaysISO(late, 1)).toBe('2027-01-01')
  })
})
