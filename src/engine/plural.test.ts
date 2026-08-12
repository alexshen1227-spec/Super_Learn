import { describe, expect, it } from 'vitest'
import { count, has, s, was } from './plural'

describe('counts read like English', () => {
  it('does not say "1 skills"', () => {
    // The bug this exists for, seen in the production build: the placement
    // summary read "Measured 1 skills directly across 1 areas."
    expect(count(1, 'skill')).toBe('1 skill')
    expect(count(0, 'skill')).toBe('0 skills')
    expect(count(2, 'skill')).toBe('2 skills')
    expect(count(1, 'area')).toBe('1 area')
  })

  it('takes an explicit plural rather than guessing one', () => {
    expect(count(1, 'try', 'tries')).toBe('1 try')
    expect(count(3, 'try', 'tries')).toBe('3 tries')
  })

  it('agrees the verb too', () => {
    expect(`${count(1, 'review')} ${was(1)} due`).toBe('1 review was due')
    expect(`${count(4, 'review')} ${was(4)} due`).toBe('4 reviews were due')
    expect(has(1)).toBe('has')
    expect(has(2)).toBe('have')
    expect(s(1)).toBe('')
    expect(s(0)).toBe('s')
  })
})
