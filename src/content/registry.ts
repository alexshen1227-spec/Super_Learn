/**
 * The assembled content registry: every built-in template + any validated
 * custom packs, indexed for the planner. Custom-pack items are wrapped into
 * ItemTemplates at load time (fixed items, JSON only, no code).
 */
import type { ContentPackJson, ItemTemplate, RenderedItem } from '../domain/types'
import { buildIndex, type ContentIndex } from '../engine/content-index'
import { SKILLS } from './skills'
import { MATH_NUMBER_TEMPLATES } from './items/mathNumber'
import { MATH_ALGEBRA_TEMPLATES } from './items/mathAlgebra'
import { PHYSICS_TEMPLATES } from './items/physics'
import { CODING_TEMPLATES } from './items/coding'
import { SCIENCE_TEMPLATES } from './items/science'
import { OBSERVER_TEMPLATES } from './items/observer'
import { INVESTIGATOR_TEMPLATES } from './items/investigator'
import { STRATEGIST_TEMPLATES } from './items/strategist'
import { INSIGHT_TEMPLATES } from './items/insight'
import { META_TEMPLATES } from './items/meta'
import { CHESS_TEMPLATES } from './items/chessTactics'
import { POLYOMINO_TEMPLATES } from './items/polyominoPuzzles'
import { LOGIC_TEMPLATES } from './items/logicPuzzles'
import { CASEFILE_TEMPLATES } from './items/caseFiles'
import { CASEFILE2_TEMPLATES } from './items/caseFiles2'
import { EXPANSION_TEMPLATES } from './items/expansion'
import { METHOD_DRILL_TEMPLATES } from './items/methodDrills'
import { ADVANCED_CURRICULUM_TEMPLATES } from './items/advancedCurriculum'

export const BUILTIN_TEMPLATES: ItemTemplate[] = [
  ...MATH_NUMBER_TEMPLATES,
  ...MATH_ALGEBRA_TEMPLATES,
  ...PHYSICS_TEMPLATES,
  ...CODING_TEMPLATES,
  ...SCIENCE_TEMPLATES,
  ...OBSERVER_TEMPLATES,
  ...INVESTIGATOR_TEMPLATES,
  ...STRATEGIST_TEMPLATES,
  ...INSIGHT_TEMPLATES,
  ...META_TEMPLATES,
  ...CHESS_TEMPLATES,
  ...POLYOMINO_TEMPLATES,
  ...LOGIC_TEMPLATES,
  ...CASEFILE_TEMPLATES,
  ...CASEFILE2_TEMPLATES,
  ...EXPANSION_TEMPLATES,
  ...METHOD_DRILL_TEMPLATES,
  ...ADVANCED_CURRICULUM_TEMPLATES,
]

export function packItemToTemplate(pack: ContentPackJson, i: number): ItemTemplate {
  const item = pack.items[i]
  return {
    id: `pack:${pack.meta.id}:${item.id}`,
    version: item.version,
    kind: 'single',
    name: item.name,
    skillIds: item.skillIds,
    bucket: item.bucket,
    difficulty: item.difficulty,
    variants: 1,
    minutes: item.minutes,
    provenance: `Imported pack "${pack.meta.name}" by ${pack.meta.author}: ${item.provenance}`,
    generate: (seed: number): RenderedItem => ({
      templateId: `pack:${pack.meta.id}:${item.id}`,
      version: item.version,
      seed,
      kind: 'single',
      title: item.name,
      prompt: item.prompt,
      answer: item.answer,
      hints: item.hints,
      explanation: item.explanation,
    }),
  }
}

/** Build the full index including custom packs (called when packs change). */
export function buildContentIndex(customPacks: ContentPackJson[]): ContentIndex {
  const packTemplates = customPacks.flatMap((p) => p.items.map((_, i) => packItemToTemplate(p, i)))
  return buildIndex([...BUILTIN_TEMPLATES, ...packTemplates], SKILLS)
}

export const DEFAULT_INDEX: ContentIndex = buildIndex(BUILTIN_TEMPLATES, SKILLS)
