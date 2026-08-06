import { describe, expect, it } from 'vitest'
import { correctResponse, validate, wrongResponse } from '../../engine/validate'
import type { AnswerSpec } from '../../domain/types'
import { PATH_QUESTION_TEMPLATES } from './pathQuestionExpansion'

function answerSpecs(templateIndex: number, seed: number): AnswerSpec[] {
  const item = PATH_QUESTION_TEMPLATES[templateIndex].generate(seed)
  return item.kind === 'multi' ? (item.parts ?? []).map((part) => part.answer) : item.answer ? [item.answer] : []
}

describe('four-Path question expansion', () => {
  it('adds four substantial question families to each Path bucket', () => {
    for (const bucket of ['observer', 'investigator', 'strategist', 'insight'] as const) {
      const templates = PATH_QUESTION_TEMPLATES.filter((template) => template.bucket === bucket)
      expect(templates).toHaveLength(4)
      expect(templates.reduce((sum, template) => sum + template.variants, 0)).toBeGreaterThanOrEqual(24)
    }
    expect(PATH_QUESTION_TEMPLATES.reduce((sum, template) => sum + template.variants, 0)).toBe(126)
  })

  it('makes every new variant machine-gradable with a passing key and failing wrong answer', () => {
    PATH_QUESTION_TEMPLATES.forEach((template, templateIndex) => {
      for (let seed = 0; seed < template.variants; seed++) {
        const specs = answerSpecs(templateIndex, seed)
        expect(specs.length, `${template.id}@${seed} needs an answer`).toBeGreaterThan(0)
        for (const spec of specs) {
          expect(spec.type, `${template.id}@${seed} must not self-grade`).not.toBe('rubric')
          expect(validate(spec, correctResponse(spec)).ok, `${template.id}@${seed} key must pass`).toBe(true)
          expect(validate(spec, wrongResponse(spec)).ok, `${template.id}@${seed} wrong answer must fail`).toBe(false)
        }
      }
    })
  })
})
