/**
 * Which templates had their answer text put in front of the learner?
 *
 * This app has one user, and it is built alongside them in a coding assistant
 * whose transcript they read. Any option text printed there is text they may
 * be recalling rather than deriving.
 *
 * Detects by EXACT MATCH rather than from memory of which files were touched:
 * every multiple-choice option of 40 characters or more is searched for
 * verbatim across the transcripts on disk. Distractors count as well as keys —
 * in a four-option item, seeing three wrong answers is seeing the right one.
 *
 * Writes src/content/burned.ts. Prints IDs and counts only, never the text.
 *
 *   node scripts/find-burned.mjs [transcriptDir]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIR = process.argv[2] ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '.', '.claude/projects/C--Dev-Super-Learn')
const MIN_LEN = 40
const SEEDS = 8
const OUT = 'src/content/burned.ts'
const TODAY = '2026-08-10'

const { BUILTIN_TEMPLATES } = await import('../src/content/registry.ts')

let files = []
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.jsonl'))
} catch {
  console.error(`no transcripts at ${DIR}`)
  process.exit(1)
}
const hay = files.map((f) => readFileSync(join(DIR, f), 'utf8')).join('\n')
console.log(`scanned ${files.length} transcripts, ${(hay.length / 1e6).toFixed(1)} MB`)

const burned = new Map()
let eligible = 0
for (const t of BUILTIN_TEMPLATES) {
  let long = 0
  let hits = 0
  let keyShown = false
  for (let seed = 0; seed < Math.min(SEEDS, Math.max(1, t.variants)); seed++) {
    let item
    try {
      item = t.generate(seed)
    } catch {
      continue
    }
    for (const part of item.parts ?? [{ answer: item.answer }]) {
      const a = part.answer ?? item.answer
      if (!a || a.type !== 'mcq') continue
      for (const [i, opt] of a.options.entries()) {
        if (opt.length < MIN_LEN) continue
        long++
        if (hay.includes(JSON.stringify(opt).slice(1, -1))) {
          hits++
          if (i === a.correct) keyShown = true
        }
      }
    }
  }
  if (long) eligible++
  if (hits) burned.set(t.id, { bucket: t.bucket, keyShown })
}

const rows = [...burned.entries()].sort((a, b) => a[0].localeCompare(b[0]))
const keyed = rows.filter(([, v]) => v.keyShown).length
const byBucket = new Map()
for (const [, v] of rows) byBucket.set(v.bucket, (byBucket.get(v.bucket) ?? 0) + 1)

console.log(`eligible for detection (any option >= ${MIN_LEN} chars): ${eligible}`)
console.log(`matched (any option seen):  ${rows.length}`)
console.log(`   of which the key itself: ${keyed}`)
console.log(`clean: ${eligible - rows.length}`)
console.log('by bucket:', [...byBucket].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '))

const lines = [
  '/**',
  ' * BURNED ITEMS: the answer was in front of the learner before they met it.',
  ' *',
  ' * This app has exactly one user, and it is built alongside them in a coding',
  ' * assistant whose transcript they read. Option text from these templates was',
  ' * printed into that conversation — while fixing a bias where the longest',
  ' * option was the right one, and while authoring items inline. The reason does',
  ' * not matter to the record: a correct answer here may be recall of a',
  ' * transcript rather than a demonstration of the skill.',
  ' *',
  " * The app's north star is proving what can still be done unaided weeks later.",
  ' * A number that cannot tell "I can do this" from "I read this" is worse than',
  ' * no number, so these attempts count as REVIEW — real practice, real exposure,',
  ' * real spacing, but never unaided evidence and never a rung.',
  ' *',
  ' * Detected by exact match rather than from memory: every multiple-choice',
  ` * option of ${MIN_LEN} characters or more, searched for verbatim across the`,
  ' * transcripts on disk. Distractors count as well as keys — in a four-option',
  ' * item, seeing three wrong answers is seeing the right one.',
  ' *',
  ` * Generated ${TODAY} by scripts/find-burned.mjs. Regenerate rather than`,
  ' * hand-edit, and treat as append-only: an item cannot become un-read.',
  ' */',
  'export const BURNED_TEMPLATE_IDS: ReadonlySet<string> = new Set([',
  ...rows.map(([id]) => `  '${id}',`),
  '])',
  '',
]
writeFileSync(OUT, lines.join('\n'))
console.log(`wrote ${OUT} with ${rows.length} ids`)
