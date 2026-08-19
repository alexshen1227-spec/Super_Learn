import { describe, expect, it } from 'vitest'
import type { ReasoningCase } from '../domain/types'
import { auditReasoningCase, reasoningCaseBlockers, reasoningCaseCompleteness, splitReasoningLines } from './reasoningCase'

const complete = (patch: Partial<ReasoningCase> = {}): ReasoningCase => ({
  id: 'rc-1',
  createdAt: 1,
  updatedAt: 1,
  kind: 'explanation',
  status: 'draft',
  stage: 3,
  question: 'Why did signups fall this week?',
  stakes: 'We might ship the wrong fix.',
  observations: ['Signups fell 12%', 'Traffic was unchanged'],
  inferences: ['The new form may be blocking people'],
  alternatives: ['The form added friction', 'The traffic mix changed'],
  assumptions: ['Analytics events are firing correctly'],
  disconfirmingTest: 'Compare completion by browser before and after the release.',
  conclusion: 'Inspect browser-level form completion before reverting.',
  confidence: 65,
  resolution: null,
  ...patch,
})

describe('reasoning workbench checks', () => {
  it('parses line lists safely', () => {
    expect(splitReasoningLines(' - first\n• second\n\n third')).toEqual(['first', 'second', 'third'])
  })

  it('requires the structural parts needed for a revisable commitment', () => {
    expect(reasoningCaseCompleteness(complete())).toBe(100)
    expect(reasoningCaseBlockers(complete())).toEqual([])
    expect(reasoningCaseBlockers(complete({ alternatives: ['Only one'] }))).toContain('Keep at least two live alternatives.')
  })

  it('flags interpretations disguised as observations', () => {
    const checks = auditReasoningCase(complete({ observations: ['They clearly wanted the launch to fail'] }))
    expect(checks.some((c) => c.id === 'observation-inference' && c.tone === 'warn')).toBe(true)
  })

  it('flags confidence that outruns the available structure', () => {
    const checks = auditReasoningCase(complete({ confidence: 90, observations: ['One fact'], alternatives: ['One story'] }))
    expect(checks.some((c) => c.id === 'confidence-ahead')).toBe(true)
  })
})

