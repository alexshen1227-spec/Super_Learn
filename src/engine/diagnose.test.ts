import { describe, expect, it } from 'vitest'
import { diagnose, isConstructedFormat } from './diagnose'

describe('error causes come from the work, not from asking', () => {
  it('a broken chain link outranks everything else', () => {
    expect(
      diagnose({ stepTag: 'representation', distractorTag: 'slip', validator: 'steps', repair: 'unaided-retry' }),
    ).toEqual({ tag: 'representation', basis: 'broken-step' })
  })

  it('the chosen distractor outranks the repair path', () => {
    expect(
      diagnose({ distractorTag: 'misread', validator: 'mcq', repair: 'after-hints' }),
    ).toEqual({ tag: 'misread', basis: 'chosen-distractor' })
  })

  it('fixing a constructed answer unaided reads as an execution slip', () => {
    expect(diagnose({ validator: 'numeric', repair: 'unaided-retry' })).toEqual({
      tag: 'slip',
      basis: 'repair-path',
    })
  })

  it('needing the explanation reads as a missing concept', () => {
    for (const repair of ['after-hints', 'full-reveal', 'still-wrong'] as const) {
      expect(diagnose({ validator: 'numeric', repair }).tag, repair).toBe('concept')
    }
  })

  /**
   * The boundary that keeps the fallback honest. A second pick among four
   * options succeeds by luck about a third of the time, so treating a lucky
   * retry as "you had the method" would manufacture slips out of guesses.
   */
  it('refuses to guess a cause from a lucky second pick', () => {
    for (const validator of ['mcq', 'multi', 'order', 'classify']) {
      expect(diagnose({ validator, repair: 'unaided-retry' }), validator).toEqual({
        tag: null,
        basis: null,
      })
    }
    expect(isConstructedFormat('mcq')).toBe(false)
    expect(isConstructedFormat('numeric')).toBe(true)
  })

  it('leaves a choice-format miss untagged rather than inventing a cause', () => {
    expect(diagnose({ validator: 'mcq', repair: 'full-reveal' })).toEqual({ tag: null, basis: null })
  })
})
