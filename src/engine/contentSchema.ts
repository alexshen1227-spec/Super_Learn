/**
 * Content-pack import validation. Packs are pure JSON — no code, no HTML.
 * The renderer escapes everything, but defense-in-depth: any string that
 * looks like markup is rejected outright so a malicious pack cannot even
 * try to smuggle script content into a future renderer change.
 */
import type { AnswerSpec, BucketId, ContentPackJson, PackItemJson } from '../domain/types'
import { BUCKETS } from '../domain/types'

const BUCKET_IDS = new Set<string>(BUCKETS.map((b) => b.id))
const MAX_ITEMS = 500

export type PackVerdict = { ok: true; pack: ContentPackJson } | { ok: false; errors: string[] }

const UNSAFE = /<\s*(script|iframe|object|embed|link|style|img|svg|on\w+\s*=)/i

function safeStr(v: unknown, max: number): string | null {
  if (typeof v !== 'string' || v.length === 0 || v.length > max) return null
  if (UNSAFE.test(v)) return null
  return v
}

function validAnswer(a: unknown): a is AnswerSpec {
  if (typeof a !== 'object' || a === null) return false
  const s = a as Record<string, unknown>
  switch (s.type) {
    case 'numeric':
      return typeof s.answer === 'number' && Number.isFinite(s.answer) &&
        (s.tolerance === undefined || (typeof s.tolerance === 'number' && s.tolerance >= 0)) &&
        (s.unit === undefined || typeof s.unit === 'string')
    case 'fraction':
      return Number.isInteger(s.n) && Number.isInteger(s.d) && (s.d as number) !== 0
    case 'text':
      return Array.isArray(s.accept) && s.accept.length > 0 && s.accept.every((x) => typeof x === 'string' && x.length <= 200)
    case 'mcq':
      return (
        Array.isArray(s.options) && s.options.length >= 2 && s.options.length <= 8 &&
        s.options.every((o) => typeof o === 'string' && o.length <= 400) &&
        Number.isInteger(s.correct) && (s.correct as number) >= 0 && (s.correct as number) < s.options.length
      )
    case 'multi':
      return (
        Array.isArray(s.options) && s.options.length >= 2 && s.options.length <= 10 &&
        s.options.every((o) => typeof o === 'string' && o.length <= 400) &&
        Array.isArray(s.correct) && (s.correct as unknown[]).length >= 1 &&
        (s.correct as unknown[]).every((c) => Number.isInteger(c) && (c as number) >= 0 && (c as number) < (s.options as unknown[]).length)
      )
    case 'order':
      return (
        Array.isArray(s.options) && s.options.length >= 2 && s.options.length <= 8 &&
        s.options.every((o) => typeof o === 'string' && o.length <= 400) &&
        Array.isArray(s.correct) && (s.correct as unknown[]).length === (s.options as unknown[]).length &&
        [...(s.correct as number[])].sort((x, y) => x - y).every((v, i) => v === i)
      )
    default:
      return false // classify/rubric not supported in JSON packs (V1)
  }
}

function validItem(raw: unknown, i: number, errors: string[]): PackItemJson | null {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`item ${i}: not an object`)
    return null
  }
  const it = raw as Record<string, unknown>
  const id = safeStr(it.id, 80)
  const name = safeStr(it.name, 120)
  const prompt = safeStr(it.prompt, 4000)
  const explanation = safeStr(it.explanation, 6000)
  const provenance = safeStr(it.provenance, 300)
  if (!id || !name || !prompt || !explanation || !provenance) {
    errors.push(`item ${i}: missing/unsafe id, name, prompt, explanation, or provenance`)
    return null
  }
  if (!Array.isArray(it.skillIds) || !it.skillIds.length || !it.skillIds.every((s) => typeof s === 'string')) {
    errors.push(`item ${i} (${id}): skillIds must be a non-empty string array`)
    return null
  }
  if (!BUCKET_IDS.has(it.bucket as string)) {
    errors.push(`item ${i} (${id}): unknown bucket '${String(it.bucket)}'`)
    return null
  }
  if (![1, 2, 3, 4, 5].includes(it.difficulty as number)) {
    errors.push(`item ${i} (${id}): difficulty must be 1–5`)
    return null
  }
  if (!validAnswer(it.answer)) {
    errors.push(`item ${i} (${id}): invalid answer spec`)
    return null
  }
  const hints = Array.isArray(it.hints) ? it.hints : null
  if (!hints || hints.length < 1 || !hints.every((h) => typeof h === 'string' && h.length <= 1000 && !UNSAFE.test(h))) {
    errors.push(`item ${i} (${id}): hints must be 1+ safe strings`)
    return null
  }
  return {
    id,
    version: Number.isInteger(it.version) && (it.version as number) > 0 ? (it.version as number) : 1,
    name,
    skillIds: (it.skillIds as string[]).slice(0, 6).map((s) => s.slice(0, 60)),
    bucket: it.bucket as BucketId,
    difficulty: it.difficulty as PackItemJson['difficulty'],
    prompt,
    answer: it.answer as AnswerSpec,
    hints: hints.slice(0, 8),
    explanation,
    provenance,
    minutes: typeof it.minutes === 'number' && it.minutes >= 0.5 && it.minutes <= 30 ? (it.minutes as number) : 3,
  }
}

export function validatePack(raw: unknown): PackVerdict {
  const errors: string[] = []
  if (typeof raw !== 'object' || raw === null) return { ok: false, errors: ['not a JSON object'] }
  const p = raw as Record<string, unknown>
  if (p.schema !== 'axiomlab-pack@1') return { ok: false, errors: ["schema must be 'axiomlab-pack@1'"] }
  const metaRaw = p.meta as Record<string, unknown> | undefined
  const id = safeStr(metaRaw?.id, 60)
  const name = safeStr(metaRaw?.name, 120)
  if (!metaRaw || !id || !name) return { ok: false, errors: ['meta.id and meta.name are required and must be safe strings'] }
  if (!Array.isArray(p.items)) return { ok: false, errors: ['items must be an array'] }
  if (p.items.length === 0) return { ok: false, errors: ['pack has no items'] }
  if (p.items.length > MAX_ITEMS) return { ok: false, errors: [`too many items (max ${MAX_ITEMS})`] }
  const items: PackItemJson[] = []
  const seen = new Set<string>()
  p.items.forEach((it, i) => {
    const v = validItem(it, i, errors)
    if (v) {
      if (seen.has(v.id)) errors.push(`duplicate item id '${v.id}'`)
      else {
        seen.add(v.id)
        items.push(v)
      }
    }
  })
  if (errors.length) return { ok: false, errors: errors.slice(0, 20) }
  return {
    ok: true,
    pack: {
      schema: 'axiomlab-pack@1',
      meta: {
        id,
        name,
        version: Number.isInteger(metaRaw.version) && (metaRaw.version as number) > 0 ? (metaRaw.version as number) : 1,
        description: safeStr(metaRaw.description, 500) ?? '',
        author: safeStr(metaRaw.author, 120) ?? 'unknown',
      },
      items,
    },
  }
}
