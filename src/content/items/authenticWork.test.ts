import { describe, expect, it } from 'vitest'
import type { AuthenticFormat, BucketId } from '../../domain/types'
import { AUTHENTIC_WORK_TEMPLATES } from './authenticWork'
import { REAL_WORLD_TEMPLATES } from './realWorldPractice'

describe('authentic work studios', () => {
  it('covers every promised real-work format with substantial staged artifacts', () => {
    const required: AuthenticFormat[] = ['project', 'writing', 'program', 'experiment', 'book', 'dialogue', 'fieldwork', 'decision']
    const formats = new Set(AUTHENTIC_WORK_TEMPLATES.map((template) => template.authentic?.format))
    required.forEach((format) => expect(formats.has(format), `missing ${format} studio`).toBe(true))

    expect(AUTHENTIC_WORK_TEMPLATES.length).toBeGreaterThanOrEqual(9)
    expect(AUTHENTIC_WORK_TEMPLATES.reduce((sum, template) => sum + template.variants, 0)).toBeGreaterThanOrEqual(70)
    for (const template of AUTHENTIC_WORK_TEMPLATES) {
      expect(template.kind).toBe('multi')
      expect(template.transfer).toBe(true)
      expect(template.minutes).toBeGreaterThanOrEqual(18)
      expect(template.minutes).toBeLessThanOrEqual(30)
      const item = template.generate(0)
      expect(item.parts?.length, `${template.id}: needs a real workflow`).toBeGreaterThanOrEqual(5)
      expect(item.parts?.every((part) => Boolean(part.stage)), `${template.id}: every checkpoint needs a stage label`).toBe(true)
      const rubrics = item.parts?.filter((part) => part.answer.type === 'rubric') ?? []
      const objective = item.parts?.filter((part) => part.answer.type !== 'rubric') ?? []
      expect(rubrics.length, `${template.id}: needs an artifact`).toBeGreaterThanOrEqual(1)
      expect(objective.length, `${template.id}: needs objective process checks`).toBeGreaterThanOrEqual(4)
      expect(rubrics[0].answer.type === 'rubric' ? rubrics[0].answer.minWords : 0).toBeGreaterThanOrEqual(50)
    }
  })

  it('gives every thinking Path at least one long-form simulation', () => {
    const pathBuckets: BucketId[] = ['observer', 'investigator', 'strategist', 'insight']
    for (const bucket of pathBuckets) {
      expect(AUTHENTIC_WORK_TEMPLATES.some((template) => template.bucket === bucket), `missing ${bucket} studio`).toBe(true)
    }
  })
})

describe('short real-world practice', () => {
  it('adds broad, checkable transfer practice rather than one-off anecdotes', () => {
    expect(REAL_WORLD_TEMPLATES.length).toBeGreaterThanOrEqual(18)
    expect(REAL_WORLD_TEMPLATES.reduce((sum, template) => sum + template.variants, 0)).toBeGreaterThanOrEqual(270)
    expect(new Set(REAL_WORLD_TEMPLATES.map((template) => template.bucket)).size).toBeGreaterThanOrEqual(8)
    expect(REAL_WORLD_TEMPLATES.every((template) => template.transfer)).toBe(true)
    expect(REAL_WORLD_TEMPLATES.every((template) => template.generate(0).answer?.type !== 'rubric')).toBe(true)
  })

  it('adds real-world questions to all four thinking Paths', () => {
    const pathBuckets: BucketId[] = ['observer', 'investigator', 'strategist', 'insight']
    for (const bucket of pathBuckets) {
      expect(REAL_WORLD_TEMPLATES.filter((template) => template.bucket === bucket).length, `${bucket} needs multiple families`).toBeGreaterThanOrEqual(2)
    }
  })
})
