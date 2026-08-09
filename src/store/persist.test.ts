import { describe, expect, it } from 'vitest'
import { isLoadableStateJson } from './persist'

describe('persistence candidate validation', () => {
  it('rejects a corrupt primary so fallback loading can continue', () => {
    expect(isLoadableStateJson('{broken')).toBe(false)
    expect(isLoadableStateJson('[]')).toBe(false)
    expect(isLoadableStateJson('{"version":1}')).toBe(false)
    expect(isLoadableStateJson(JSON.stringify({
      version: 1, createdAt: 1, onboarded: true, profile: {}, settings: {}, events: [],
    }))).toBe(true)
  })
})
