/**
 * "Go deeper" links — optional, online-only, clearly labeled. Strategy for
 * link durability: Khan Academy SEARCH deep-links (stable for a decade and
 * always land on current content) plus channel-level links to well-known
 * educators. The app never requires these; core learning is fully offline.
 */
import type { BucketId, SkillNode } from '../domain/types'

export interface ExternalResource {
  label: string
  url: string
  source: string
}

/** Skill-name tweaks that search better than our internal names. */
const QUERY_OVERRIDES: Record<string, string> = {
  'm-lineq1': 'two step equations',
  'm-lineqmulti': 'equations variables both sides',
  'm-wordeq': 'linear equation word problems',
  'm-linfunc': 'slope intercept form',
  'm-nonroutine': 'math problem solving strategies',
  'm-ev': 'expected value',
  'p-measure': 'units dimensional analysis',
  'p-graphs': 'position time graphs',
  'c-vars': 'intro to programming variables',
  'c-trace': 'debugging code',
  's-corr': 'correlation and causation',
  's-sources': 'misleading statistics',
  'i-bayes': 'conditional probability bayes',
  'i-logic': 'logical arguments deductive reasoning',
  'z-chess': 'chess tactics',
}

const CHANNEL_PICKS: Partial<Record<BucketId, ExternalResource[]>> = {
  math: [
    { label: '3Blue1Brown — math you can see', url: 'https://www.youtube.com/@3blue1brown', source: 'YouTube' },
    { label: 'Khan Academy Grade 8 hub', url: 'https://www.khanacademy.org/commoncore/grade-8', source: 'Khan Academy' },
  ],
  physics: [
    { label: 'Veritasium — physics of everything', url: 'https://www.youtube.com/@veritasium', source: 'YouTube' },
    { label: 'Physics Girl', url: 'https://www.youtube.com/@physicsgirl', source: 'YouTube' },
  ],
  coding: [
    { label: 'The Coding Train', url: 'https://www.youtube.com/@TheCodingTrain', source: 'YouTube' },
  ],
  science: [
    { label: 'Crash Course Statistics', url: 'https://www.youtube.com/@crashcourse', source: 'YouTube' },
    { label: 'Veritasium', url: 'https://www.youtube.com/@veritasium', source: 'YouTube' },
  ],
  puzzle: [
    { label: 'GothamChess — lessons & analysis', url: 'https://www.youtube.com/@GothamChess', source: 'YouTube' },
    { label: 'Lichess practice (free)', url: 'https://lichess.org/practice', source: 'lichess.org' },
  ],
  investigator: [
    { label: '3Blue1Brown — Bayes theorem, visually', url: 'https://www.youtube.com/@3blue1brown', source: 'YouTube' },
  ],
  meta: [
    { label: 'Veritasium — the science of learning', url: 'https://www.youtube.com/@veritasium', source: 'YouTube' },
  ],
}

const KA_BUCKETS: BucketId[] = ['math', 'physics', 'science', 'coding']

export function resourcesFor(skill: SkillNode): ExternalResource[] {
  const out: ExternalResource[] = []
  if (KA_BUCKETS.includes(skill.bucket)) {
    const q = QUERY_OVERRIDES[skill.id] ?? skill.name
    out.push({
      label: `Khan Academy: “${q}”`,
      url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}`,
      source: 'Khan Academy',
    })
  }
  for (const pick of CHANNEL_PICKS[skill.bucket] ?? []) {
    if (out.length >= 3) break
    out.push(pick)
  }
  return out.slice(0, 3)
}
