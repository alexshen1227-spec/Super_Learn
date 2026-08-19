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
import { MATH_THIN_DEPTH_TEMPLATES } from './items/mathThinDepth'
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
import { GENERATED_PUZZLE_TEMPLATES } from './items/generatedPuzzles'
import { GENERATED_LAB_TEMPLATES } from './items/generatedLabs'
import { GAME_THEORY_TEMPLATES } from './items/gameTheory'
import { ALGEBRA_DEPTH_TEMPLATES } from './items/algebraDepth'
import { PHYSICS_DEPTH_TEMPLATES } from './items/physicsDepth'
import { WORKED_CHAIN_TEMPLATES } from './items/workedChains'
import { HS_BRIDGE_TEMPLATES } from './items/hsBridge'
import { ABDUCTION_TEMPLATES } from './items/abduction'
import { TRANSFER_BRIDGE_TEMPLATES } from './items/transferBridge'
import { ADVANCED_TEMPLATES } from './items/advanced'
import { ADVANCED_STEM_TEMPLATES } from './items/advancedStem'
import { ADVANCED_SCIENCE_TEMPLATES } from './items/advancedScience'
import { PFL_TEMPLATES } from './items/pflProbes'
import { CASEFILE_TEMPLATES } from './items/caseFiles'
import { CASEFILE2_TEMPLATES } from './items/caseFiles2'
import { EXPANSION_TEMPLATES } from './items/expansion'
import { METHOD_DRILL_TEMPLATES } from './items/methodDrills'
import { ADVANCED_CURRICULUM_TEMPLATES } from './items/advancedCurriculum'
import { PATH_QUESTION_TEMPLATES } from './items/pathQuestionExpansion'
import { PATH_DEPTH_TEMPLATES } from './items/pathQuestionDepth'
import { AUTHENTIC_WORK_TEMPLATES } from './items/authenticWork'
import { REAL_WORLD_TEMPLATES } from './items/realWorldPractice'
import { CONSTRUCT_TEMPLATES } from './items/construct'
import { CASE_COMPARISON_TEMPLATES } from './items/caseComparison'
import { TRANSFER_LAB_TEMPLATES } from './items/transferLab'
import { ALGORITHMS_TEMPLATES } from './items/algorithmsLab'
import { META_DEPTH_TEMPLATES } from './items/metaDepth'
import { OBSERVER_DEPTH_TEMPLATES } from './items/observerDepth'
import { DECISIONS_DEPTH_TEMPLATES } from './items/decisionsDepth'
import { INQUIRY_DEPTH_TEMPLATES } from './items/inquiryDepth'
import { UNCERTAINTY_TEMPLATES } from './items/uncertaintyLab'
import { UNSEEN_TEMPLATES } from './items/unseenLab'
import { CHOICE_TEMPLATES } from './items/choiceLab'
import { READING_TEMPLATES } from './items/readingSituations'
import { OTHER_MINDS_TEMPLATES } from './items/otherMinds'
import { GAME_DEPTH_TEMPLATES } from './items/gameTheoryDepth'
import { SPONTANEITY_TEMPLATES } from './items/spontaneityProbes'
import { GAME_LAB_TEMPLATES } from './items/gameTheoryLab'
import { GAME_THEORY_TAIL_TEMPLATES } from './items/gameTheoryTail'
import { SEARCH_TEMPLATES } from './items/searchLab'
import { RUNGS_AND_METHODS_TEMPLATES } from './items/rungsAndMethods'
import { DATA_LITERACY_TEMPLATES } from './items/dataLiteracy'
import { IMPORTED_TEMPLATES } from './items/imported'
import { GRADE_CORE_TEMPLATES } from './items/gradeCore'
import { ALGEBRA_ONE_TEMPLATES } from './items/algebraOne'
import { MIDDLE_DEPTH_TEMPLATES } from './items/middleDepth'
import { NON_ROUTINE_TEMPLATES } from './items/nonRoutine'
import { BEYOND_CORE_TEMPLATES } from './items/beyondCore'
import { LABS_DEPTH_TEMPLATES } from './items/labsDepth'
import { HS_DENSITY_TEMPLATES } from './items/hsDensity'
import { CONSTRAINT_PUZZLE_TEMPLATES } from './items/constraintPuzzles'
import { COUNTEREXAMPLE_TEMPLATES } from './items/counterexamples'
import { CALIFORNIA_STANDARDS_TEMPLATES } from './items/californiaStandards'
import { PHYSICS_REASONING_TEMPLATES } from './items/physicsReasoning'
import { ONRAMP_TEMPLATES } from './items/onRamps'
import { ONRAMP_B_TEMPLATES } from './items/onRampsB'
import { exploreItems } from './items/explore'
import { exploreBItems } from './items/exploreB'
import { exploreCItems } from './items/exploreC'
import { DISCERNMENT_TEMPLATES } from './items/discernment'
import { STUCK_TEMPLATES } from './items/stuck'

export const BUILTIN_TEMPLATES: ItemTemplate[] = [
  ...MATH_NUMBER_TEMPLATES,
  ...MATH_ALGEBRA_TEMPLATES,
  ...MATH_THIN_DEPTH_TEMPLATES,
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
  ...GENERATED_PUZZLE_TEMPLATES,
  ...GENERATED_LAB_TEMPLATES,
  ...GAME_THEORY_TEMPLATES,
  ...ALGEBRA_DEPTH_TEMPLATES,
  ...PHYSICS_DEPTH_TEMPLATES,
  ...WORKED_CHAIN_TEMPLATES,
  ...HS_BRIDGE_TEMPLATES,
  ...ABDUCTION_TEMPLATES,
  ...TRANSFER_BRIDGE_TEMPLATES,
  ...ADVANCED_TEMPLATES,
  ...ADVANCED_STEM_TEMPLATES,
  ...ADVANCED_SCIENCE_TEMPLATES,
  ...PFL_TEMPLATES,
  ...CASEFILE_TEMPLATES,
  ...CASEFILE2_TEMPLATES,
  ...EXPANSION_TEMPLATES,
  ...METHOD_DRILL_TEMPLATES,
  ...ADVANCED_CURRICULUM_TEMPLATES,
  ...PATH_QUESTION_TEMPLATES,
  ...PATH_DEPTH_TEMPLATES,
  ...AUTHENTIC_WORK_TEMPLATES,
  ...REAL_WORLD_TEMPLATES,
  ...CONSTRUCT_TEMPLATES,
  ...CASE_COMPARISON_TEMPLATES,
  ...TRANSFER_LAB_TEMPLATES,
  ...ALGORITHMS_TEMPLATES,
  ...META_DEPTH_TEMPLATES,
  ...OBSERVER_DEPTH_TEMPLATES,
  ...DECISIONS_DEPTH_TEMPLATES,
  ...INQUIRY_DEPTH_TEMPLATES,
  ...UNCERTAINTY_TEMPLATES,
  ...UNSEEN_TEMPLATES,
  ...CHOICE_TEMPLATES,
  ...READING_TEMPLATES,
  ...OTHER_MINDS_TEMPLATES,
  ...GAME_DEPTH_TEMPLATES,
  ...SPONTANEITY_TEMPLATES,
  ...GAME_LAB_TEMPLATES,
  ...GAME_THEORY_TAIL_TEMPLATES,
  ...SEARCH_TEMPLATES,
  ...RUNGS_AND_METHODS_TEMPLATES,
  ...DATA_LITERACY_TEMPLATES,
  ...IMPORTED_TEMPLATES,
  ...GRADE_CORE_TEMPLATES,
  ...ALGEBRA_ONE_TEMPLATES,
  ...MIDDLE_DEPTH_TEMPLATES,
  ...NON_ROUTINE_TEMPLATES,
  ...BEYOND_CORE_TEMPLATES,
  ...LABS_DEPTH_TEMPLATES,
  ...HS_DENSITY_TEMPLATES,
  ...CONSTRAINT_PUZZLE_TEMPLATES,
  ...COUNTEREXAMPLE_TEMPLATES,
  ...CALIFORNIA_STANDARDS_TEMPLATES,
  ...PHYSICS_REASONING_TEMPLATES,
  ...ONRAMP_TEMPLATES,
  ...ONRAMP_B_TEMPLATES,
  ...exploreItems,
  ...exploreBItems,
  ...exploreCItems,
  ...DISCERNMENT_TEMPLATES,
  ...STUCK_TEMPLATES,
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
