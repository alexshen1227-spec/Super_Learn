import { describe, expect, it } from 'vitest'
import type { AnswerSpec, BucketId } from '../../domain/types'
import { correctResponse, validate, wrongResponse } from '../../engine/validate'
import { BUILTIN_TEMPLATES } from '../registry'
import { PATH_DEPTH_TEMPLATES } from './pathQuestionDepth'

function specsAt(templateIndex: number, seed: number): AnswerSpec[] {
  const item = PATH_DEPTH_TEMPLATES[templateIndex].generate(seed)
  return item.kind === 'multi' ? (item.parts ?? []).map((part) => part.answer) : item.answer ? [item.answer] : []
}

describe('Path difficulty depth', () => {
  const buckets: BucketId[] = ['observer', 'investigator', 'strategist', 'insight']

  it('gives every Path auto-graded practice at all five difficulty levels', () => {
    for (const bucket of buckets) {
      for (const difficulty of [1, 2, 3, 4, 5]) {
        const templates = BUILTIN_TEMPLATES.filter((template) => template.bucket === bucket && template.difficulty === difficulty)
        expect(templates.length, `${bucket} needs ${difficulty}-star practice`).toBeGreaterThan(0)
      }
    }
  })

  it('adds 100 new variants with deterministic passing keys', () => {
    expect(PATH_DEPTH_TEMPLATES.reduce((sum, template) => sum + template.variants, 0)).toBe(100)
    PATH_DEPTH_TEMPLATES.forEach((template, templateIndex) => {
      for (let seed = 0; seed < template.variants; seed++) {
        for (const spec of specsAt(templateIndex, seed)) {
          expect(spec.type).not.toBe('rubric')
          expect(validate(spec, correctResponse(spec)).ok, `${template.id}@${seed} key`).toBe(true)
          expect(validate(spec, wrongResponse(spec)).ok, `${template.id}@${seed} wrong`).toBe(false)
        }
      }
    })
  })
})
