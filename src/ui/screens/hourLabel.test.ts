import { describe, expect, it } from 'vitest'
import { hourLabel } from './SettingsScreen'

describe('quiet-hours clock labels', () => {
  it('reads on the 12-hour clock, with midnight and noon spelled out', () => {
    // The two that people read backwards, which is why they are not left as
    // bare "12 AM" / "12 PM".
    expect(hourLabel(0)).toBe('12 AM (midnight)')
    expect(hourLabel(12)).toBe('12 PM (noon)')

    expect(hourLabel(1)).toBe('1 AM')
    expect(hourLabel(7)).toBe('7 AM')
    expect(hourLabel(11)).toBe('11 AM')
    expect(hourLabel(13)).toBe('1 PM')
    expect(hourLabel(21)).toBe('9 PM')
    expect(hourLabel(23)).toBe('11 PM')
  })

  it('never emits a 0 or a 24-hour value across the whole day', () => {
    for (let h = 0; h < 24; h++) {
      const label = hourLabel(h)
      expect(label, `hour ${h}`).toMatch(/^(1[0-2]|[1-9]) (AM|PM)( \((midnight|noon)\))?$/)
      // The default quiet window is 21 -> 7; both ends must survive the trip.
      expect(label.startsWith('0'), `hour ${h} shows a leading zero`).toBe(false)
    }
  })
})
