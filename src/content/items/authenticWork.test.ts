import { describe, expect, it } from 'vitest'
import { BUCKETS, type AuthenticFormat, type BucketId } from '../../domain/types'
import { SKILL_BY_ID } from '../skills'
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
      const drafts = item.parts?.filter((part) => part.answer.type === 'draft') ?? []
      const objective = item.parts?.filter((part) => part.answer.type !== 'draft') ?? []
      expect(drafts.length, `${template.id}: needs an artifact`).toBeGreaterThanOrEqual(1)
      expect(objective.length, `${template.id}: needs objective process checks`).toBeGreaterThanOrEqual(4)
      expect(drafts[0].answer.type === 'draft' ? drafts[0].answer.minWords : 0).toBeGreaterThanOrEqual(50)
      // The artifact must never be the last word: something graded follows it.
      const lastDraft = item.parts!.findLastIndex((part) => part.answer.type === 'draft')
      expect(
        item.parts!.slice(lastDraft + 1).some((part) => part.answer.type !== 'draft'),
        `${template.id}: the artifact must be followed by a graded checkpoint`,
      ).toBe(true)
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
    expect(REAL_WORLD_TEMPLATES.length).toBeGreaterThanOrEqual(19)
    // Was 280 when variant counts were inflated. Every count is now verified
    // to equal the number of genuinely distinct forms the generator produces.
    expect(REAL_WORLD_TEMPLATES.reduce((sum, template) => sum + template.variants, 0)).toBeGreaterThanOrEqual(210)
    expect(new Set(REAL_WORLD_TEMPLATES.map((template) => template.bucket)).size).toBeGreaterThanOrEqual(9)
    expect(REAL_WORLD_TEMPLATES.every((template) => template.transfer)).toBe(true)
    expect(REAL_WORLD_TEMPLATES.every((template) => template.generate(0).answer?.type !== 'draft')).toBe(true)
  })

  it('adds real-world questions to all four thinking Paths', () => {
    const pathBuckets: BucketId[] = ['observer', 'investigator', 'strategist', 'insight']
    for (const bucket of pathBuckets) {
      expect(REAL_WORLD_TEMPLATES.filter((template) => template.bucket === bucket).length, `${bucket} needs multiple families`).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('percentage-category integration', () => {
  const expanded = [...AUTHENTIC_WORK_TEMPLATES, ...REAL_WORLD_TEMPLATES]

  it('places the expanded work across every existing allocation category', () => {
    for (const bucket of BUCKETS) {
      expect(expanded.some((template) => template.bucket === bucket.id), `missing ${bucket.name}`).toBe(true)
    }
  })

  it('uses a primary skill from the category that receives the minutes', () => {
    for (const template of expanded) {
      expect(SKILL_BY_ID.get(template.skillIds[0])?.bucket, `${template.id}: primary allocation mismatch`).toBe(template.bucket)
    }
  })
})
