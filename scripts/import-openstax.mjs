/**
 * Import human-authored problems from an openly licensed source.
 *
 * WHY A SCRIPT AND NOT AN EDIT. This app has one user, who reads the coding
 * assistant's transcript. Anything an assistant types into that transcript is
 * an answer the learner has seen — 204 templates are already flagged burned
 * for exactly that reason. So imported problems must never pass through the
 * conversation: this script fetches, extracts, verifies and writes the content
 * file itself, and prints ONLY counts. Nobody reads the output file.
 *
 * LICENCE RULE, enforced not assumed. Only CC BY and public domain may be
 * adapted here; ShareAlike would propagate to this whole repository. OpenStax
 * licences vary PER BOOK, and the pattern is a trap: first editions are
 * CC BY 4.0 and second editions are CC BY-NC-SA. Measured across their
 * catalogue on 2026-08-11 — 129 books, 46 CC BY, 72 NC-SA. This script
 * verifies the licence of the source it actually downloaded before writing
 * anything, and refuses otherwise.
 *
 * WHAT IT ACCEPTS. Only exercises whose printed solution is a bare number.
 * That is a small fraction of the book and deliberately so: it is the subset
 * where the parse can be checked. A misaligned problem/answer pair would put
 * a wrong answer in front of the learner, and on an app whose whole purpose is
 * an honest record, a wrong key is worse than no new content. Everything with
 * prose answers, figures, tables or cross-references is dropped.
 *
 *   npx tsx scripts/import-openstax.mjs [--keep]
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SKILL_BY_ID } from '../src/content/skills.ts'

const SOURCE = {
  repo: 'openstax/osbooks-statistics',
  title: 'Statistics',
  author: 'OpenStax',
  licence: 'CC BY 4.0',
  url: 'https://openstax.org/details/books/statistics',
  tarball: 'https://codeload.github.com/openstax/osbooks-statistics/tar.gz/refs/heads/main',
}
const OUT = 'src/content/items/imported.ts'
const WORK = join(process.env.TEMP ?? '/tmp', 'axiom-import')

/**
 * Keyword → existing skill. Deliberately narrow: the goal is the skills whose
 * pools are thinnest, and a loose map would scatter imports across skills that
 * did not need them. No new skills are invented.
 */
const TAGS = [
  { skill: 's-corr', words: ['correlation coefficient', 'scatter plot', 'scatterplot', 'least-squares', 'least squares', 'line of best fit'] },
  { skill: 'm-bestfit', words: ['regression', 'predicted value', 'slope of the line'] },
  { skill: 's-hypo', words: ['null hypothesis', 'alternative hypothesis', 'p-value', 'significance level', 'type i error', 'type ii error'] },
  { skill: 'm-sampling', words: ['random sample', 'sampling', 'sample size', 'population mean', 'sampling distribution'] },
  { skill: 's-design', words: ['experiment', 'control group', 'treatment group', 'explanatory variable', 'lurking variable', 'blinding'] },
  { skill: 's-graphs', words: ['histogram', 'box plot', 'boxplot', 'bar graph', 'frequency table', 'stem plot'] },
  { skill: 'm-prob', words: ['probability that', 'independent events', 'mutually exclusive', 'conditional probability'] },
  { skill: 'm-variability', words: ['standard deviation', 'variance', 'interquartile', 'percentile'] },
  { skill: 'm-stats', words: ['mean of', 'median of', 'the mode', 'average of'] },
]

/** Anything the learner could not answer from the text alone. */
const UNUSABLE = [
  /figure|table|graph above|shown below|previous (problem|exercise)|refer to|use the data|see (the )?example/i,
  /<(?:m:)?math|<media|<image|<table|<list/i,
]

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#\d+;|&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }).toString()
}

function download() {
  // An already-extracted tree may be passed in. Useful on Windows, where the
  // shell `tar` behind execSync is not always the one on PATH.
  const argDir = process.argv.find((a) => a.startsWith('--dir='))
  if (argDir) return argDir.slice('--dir='.length)
  mkdirSync(WORK, { recursive: true })
  const tgz = join(WORK, 'src.tgz')
  const dir = join(WORK, 'src')
  if (!existsSync(dir) || !readdirSync(dir).length) {
    if (!existsSync(tgz) || statSync(tgz).size < 1000) sh(`curl -sL --max-time 300 "${SOURCE.tarball}" -o "${tgz}"`)
    mkdirSync(dir, { recursive: true })
    sh(`tar xzf "${tgz}" -C "${dir}"`)
  }
  return dir
}

/** Refuse to write anything unless the downloaded source really is CC BY. */
function verifyLicence(dir) {
  const found = []
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) {
        if (name !== '.git') walk(p)
      } else if (/^licen[cs]e/i.test(name)) found.push(p)
    }
  }
  walk(dir)
  const text = found.map((p) => readFileSync(p, 'utf8')).join('\n').toLowerCase()
  const isCcBy = /attribution 4\.0 international/.test(text)
  const isShareAlike = /sharealike|noncommercial|non-commercial/.test(text)
  return { ok: isCcBy && !isShareAlike, files: found.length, isCcBy, isShareAlike }
}

function* modules(dir) {
  const walk = function* (d) {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) yield* walk(p)
      else if (name.endsWith('.cnxml')) yield p
    }
  }
  yield* walk(dir)
}

/** Half a unit in the last printed decimal place — never a global fudge. */
function toleranceFor(raw) {
  const dot = raw.indexOf('.')
  return dot < 0 ? 0.5 : 0.5 * 10 ** -(raw.length - dot - 1)
}

function extract(dir) {
  const stats = { exercises: 0, withSolution: 0, numeric: 0, selfContained: 0, tagged: 0, kept: 0 }
  const out = []
  const seen = new Set()
  for (const file of modules(dir)) {
    const src = readFileSync(file, 'utf8')
    for (const ex of src.match(/<exercise\b[\s\S]*?<\/exercise>/g) ?? []) {
      stats.exercises++
      const problemRaw = (ex.match(/<problem\b[\s\S]*?<\/problem>/) ?? [])[0]
      const solutionRaw = (ex.match(/<solution\b[\s\S]*?<\/solution>/) ?? [])[0]
      if (!problemRaw || !solutionRaw) continue
      stats.withSolution++

      const answerText = strip(solutionRaw)
      if (!/^-?[\d,]+(\.\d+)?$/.test(answerText)) continue
      const answer = Number(answerText.replace(/,/g, ''))
      if (!Number.isFinite(answer)) continue
      stats.numeric++

      const prompt = strip(problemRaw)
      if (prompt.length < 40 || prompt.length > 600) continue
      if (UNUSABLE.some((re) => re.test(problemRaw) || re.test(prompt))) continue
      // The problem must contain numbers of its own, or the answer cannot have
      // come from it and the pairing is unverifiable.
      if ((prompt.match(/\d/g) ?? []).length < 2) continue
      stats.selfContained++

      const hay = prompt.toLowerCase()
      const tag = TAGS.find((t) => t.words.some((w) => hay.includes(w)))
      if (!tag) continue
      const skill = SKILL_BY_ID.get(tag.skill)
      if (!skill) continue
      stats.tagged++

      const key = prompt.slice(0, 90)
      if (seen.has(key)) continue
      seen.add(key)

      out.push({ id: `os-stat-${out.length + 1}`, prompt, answer, tolerance: toleranceFor(answerText), skill: tag.skill, bucket: skill.bucket })
      stats.kept++
    }
  }
  return { out, stats }
}

function emit(items) {
  const head = `/**
 * IMPORTED PROBLEMS — human-authored, openly licensed, not generated.
 *
 * Generated by scripts/import-openstax.mjs. DO NOT EDIT BY HAND and do not
 * paste its contents anywhere a learner might read them: the whole value of
 * these items is that the answers have not been seen. Regenerate instead.
 *
 * Source: ${SOURCE.title} by ${SOURCE.author}, ${SOURCE.licence}
 *   ${SOURCE.url}
 * Adapted: problem text taken verbatim; answers taken from the book's own
 * solutions; skill tags, difficulty and answer tolerances added by this app.
 * See ATTRIBUTIONS.md.
 *
 * Only exercises whose printed solution is a BARE NUMBER are imported, which
 * is a small fraction of the book. That is the subset where a misaligned
 * parse can be detected, and a wrong answer key on an app built to keep an
 * honest record is worse than having less content.
 *
 * Difficulty is a flat 3 — the source does not grade its exercises, and
 * inventing a spread would be a number with nothing behind it.
 */
import type { ItemTemplate } from '../../domain/types'
import { tpl } from '../lib'

const SOURCE = {
  title: ${JSON.stringify(SOURCE.title)},
  author: ${JSON.stringify(SOURCE.author)},
  licence: 'CC BY 4.0' as const,
  url: ${JSON.stringify(SOURCE.url)},
  adapted: true,
}

interface Imported {
  id: string
  prompt: string
  answer: number
  tolerance: number
  skill: string
  bucket: ItemTemplate['bucket']
}

const ITEMS: Imported[] = ${JSON.stringify(items.map((i) => ({ id: i.id, prompt: i.prompt, answer: i.answer, tolerance: i.tolerance, skill: i.skill, bucket: i.bucket })), null, 2)}

export const IMPORTED_TEMPLATES: ItemTemplate[] = ITEMS.map((it) =>
  tpl(
    {
      id: it.id,
      name: 'Imported exercise',
      skillIds: [it.skill],
      bucket: it.bucket,
      difficulty: 3,
      variants: 1,
      minutes: 2.5,
      source: SOURCE,
      provenance: \`\${SOURCE.title} by \${SOURCE.author} (\${SOURCE.licence}). Problem text verbatim; tags and tolerance added here.\`,
    },
    () => ({
      title: 'From a textbook',
      prompt: it.prompt,
      answer: { type: 'numeric', answer: it.answer, tolerance: it.tolerance },
      hints: [
        'Read it once for what is being asked, then once for the numbers.',
        'Name the quantity you need before computing anything.',
      ],
      explanation: \`The answer is **\${it.answer}**. This problem was written by people making a textbook, not generated from a pattern, so the wording will not match the shapes the rest of this app uses — which is the point of having it.\`,
    }),
  ),
)
`
  writeFileSync(OUT, head)
}

// ------------------------------------------------------------------ run
const dir = download()
const licence = verifyLicence(dir)
console.log(`source        : ${SOURCE.repo}`)
console.log(`licence files : ${licence.files}  CC BY: ${licence.isCcBy}  ShareAlike/NC: ${licence.isShareAlike}`)
if (!licence.ok) {
  console.error('REFUSED: the downloaded source is not CC BY. Nothing written.')
  process.exit(1)
}
const { out, stats } = extract(dir)
console.log(`exercises seen        : ${stats.exercises}`)
console.log(`  with a solution     : ${stats.withSolution}`)
console.log(`  solution is numeric : ${stats.numeric}`)
console.log(`  self-contained      : ${stats.selfContained}`)
console.log(`  tagged to a skill   : ${stats.tagged}`)
console.log(`  KEPT (deduped)      : ${stats.kept}`)
const byTag = new Map()
for (const i of out) byTag.set(i.skill, (byTag.get(i.skill) ?? 0) + 1)
console.log('tag distribution      :', [...byTag].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || '(none)')
if (!out.length) {
  console.error('Nothing survived verification. Not writing a file.')
  process.exit(1)
}
emit(out)
console.log(`wrote ${OUT} with ${out.length} items`)
