/**
 * Auditable California mathematics course floor.
 *
 * This is deliberately topic-cluster metadata rather than a claim that one
 * generated question equals one standard. A course is aligned only when each
 * official cluster has mapped skills, reachable question families, an
 * accessible entry point, and at least one appropriately demanding task.
 */

export const CALIFORNIA_STANDARDS_URL =
  'https://www.cde.ca.gov/be/st/ss/documents/ccssmathstandardaug2013.pdf'
export const CALIFORNIA_FRAMEWORK_URL =
  'https://www.cde.ca.gov/ci/ma/cf/index.asp'

export interface CaliforniaTopicCluster {
  id: string
  name: string
  /** Official domain/cluster codes covered by this topic group. */
  standards: string[]
  /** App skills that collectively cover the cluster. */
  skillIds: string[]
}

export interface CaliforniaCourseAlignment {
  trackId: string
  course: string
  pathway: 'middle-school' | 'accelerated' | 'traditional-high-school'
  source: '2013 CA CCSSM + 2023 California Mathematics Framework'
  /** At least one task in every cluster must reach this reasoning level. */
  challengeFloor: 2 | 3 | 4 | 5
  /** Every cluster must also have an on-ramp no harder than this. */
  accessCeiling: 2 | 3 | 4 | 5
  clusters: CaliforniaTopicCluster[]
}

const grade6: CaliforniaTopicCluster[] = [
  { id: '6-rp', name: 'Ratios, rates, percent, and unit conversion', standards: ['6.RP.A.1–3'], skillIds: ['m-ratio', 'm-percent', 'm-units'] },
  { id: '6-ns', name: 'Fraction division, decimal fluency, factors, and rational numbers', standards: ['6.NS.A.1', '6.NS.B.2–4', '6.NS.C.5–8'], skillIds: ['m-fractions', 'm-decimals', 'm-integers', 'm-coord'] },
  { id: '6-ee', name: 'Expressions, equations, inequalities, and variables', standards: ['6.EE.A.1–4', '6.EE.B.5–8', '6.EE.C.9'], skillIds: ['m-expressions', 'm-lineq1', 'm-ineqintro', 'm-variables'] },
  { id: '6-g', name: 'Area, surface area, volume, and coordinate polygons', standards: ['6.G.A.1–4'], skillIds: ['m-area', 'm-volume', 'm-coord'] },
  { id: '6-sp', name: 'Statistical questions, center, variability, and distributions', standards: ['6.SP.A.1–3', '6.SP.B.4–5'], skillIds: ['m-stats', 'm-variability'] },
]

const grade7: CaliforniaTopicCluster[] = [
  { id: '7-rp', name: 'Proportional relationships and multistep percent applications', standards: ['7.RP.A.1–3'], skillIds: ['m-ratio', 'm-proportion', 'm-percent'] },
  { id: '7-ns', name: 'Operations with signed rational numbers', standards: ['7.NS.A.1–3'], skillIds: ['m-rationalops', 'm-fractions', 'm-decimals'] },
  { id: '7-ee', name: 'Equivalent expressions, equations, and inequalities', standards: ['7.EE.A.1–2', '7.EE.B.3–4'], skillIds: ['m-expressions', 'm-lineq1', 'm-inequal'] },
  { id: '7-g', name: 'Scale drawings, constructions, slices, angles, circles, area, and volume', standards: ['7.G.A.1–3', '7.G.B.4–6'], skillIds: ['m-scale', 'm-geoconstruct', 'm-angles', 'm-circles', 'm-area', 'm-volume'] },
  { id: '7-sp', name: 'Random samples, comparative inference, and probability models', standards: ['7.SP.A.1–2', '7.SP.B.3–4', '7.SP.C.5–8'], skillIds: ['m-sampling', 'm-variability', 'm-prob'] },
]

const grade8: CaliforniaTopicCluster[] = [
  { id: '8-ns', name: 'Irrational numbers and rational approximations', standards: ['8.NS.A.1–2'], skillIds: ['m-roots', 'm-decimals'] },
  { id: '8-ee', name: 'Integer exponents, scientific notation, lines, equations, and systems', standards: ['8.EE.A.1–4', '8.EE.B.5–6', '8.EE.C.7–8'], skillIds: ['m-exponents', 'm-lineqmulti', 'm-linear', 'm-linfunc', 'm-systems'] },
  { id: '8-f', name: 'Define, compare, and model with functions', standards: ['8.F.A.1–3', '8.F.B.4–5'], skillIds: ['m-functions'] },
  { id: '8-g', name: 'Transformations, congruence, similarity, Pythagorean theorem, and solid volume', standards: ['8.G.A.1–5', '8.G.B.6–8', '8.G.C.9'], skillIds: ['m-transform', 'm-triangles', 'm-volume'] },
  { id: '8-sp', name: 'Bivariate data, scatter plots, linear models, and two-way tables', standards: ['8.SP.A.1–4'], skillIds: ['m-data', 'm-bestfit'] },
]

const algebra1: CaliforniaTopicCluster[] = [
  { id: 'a1-nq', name: 'Real numbers, rational exponents, radicals, quantities, and units', standards: ['N-RN.1–3', 'N-Q.1–3'], skillIds: ['m-exponents', 'm-roots', 'm-radicals', 'm-units'] },
  { id: 'a1-expressions', name: 'Expression structure and polynomial arithmetic', standards: ['A-SSE.1–3', 'A-APR.1'], skillIds: ['m-expressions', 'm-polys'] },
  { id: 'a1-equations', name: 'Creating, solving, and graphing equations, inequalities, and systems', standards: ['A-CED.1–4', 'A-REI.1,3–6,10–12'], skillIds: ['m-wordeq', 'm-lineqmulti', 'm-inequal', 'm-ineq2d', 'm-systems'] },
  { id: 'a1-functions', name: 'Function notation, domain, representations, transformations, and piecewise rules', standards: ['F-IF.1–9', 'F-BF.1–4'], skillIds: ['m-functions', 'm-piecewise', 'm-absolute'] },
  { id: 'a1-models', name: 'Linear, quadratic, exponential, and sequence models', standards: ['F-LE.1–6', 'A-SSE.3', 'F-BF.2'], skillIds: ['m-linforms', 'm-quadratic', 'm-exponential', 'm-sequences', 'm-model'] },
  { id: 'a1-data', name: 'Distributions, two-way data, regression, and residuals', standards: ['S-ID.1–9'], skillIds: ['m-stats', 'm-variability', 'm-bestfit', 'm-hsdata'] },
]

const geometry: CaliforniaTopicCluster[] = [
  { id: 'g-co', name: 'Rigid motions, congruence, theorem proof, and constructions', standards: ['G-CO.1–13'], skillIds: ['m-transform', 'm-congruence', 'm-proof'] },
  { id: 'g-srt', name: 'Similarity, right triangles, and trigonometry', standards: ['G-SRT.1–8', 'G-SRT.9–11 (+)'], skillIds: ['m-scale', 'm-trig', 'm-nonrighttrig'] },
  { id: 'g-c', name: 'Circle theorems, arcs, and sectors', standards: ['G-C.1–5'], skillIds: ['m-circles', 'm-circleproof'] },
  { id: 'g-gpe', name: 'Conic equations and coordinate proofs', standards: ['G-GPE.1–7'], skillIds: ['m-conics', 'm-coordinategeometry'] },
  { id: 'g-gmd-mg', name: 'Volume, cross-sections, rotations, and geometric modeling', standards: ['G-GMD.1–7', 'G-MG.1–3'], skillIds: ['m-volume', 'm-solidgeometry', 'm-model'] },
  { id: 'g-sp', name: 'Conditional probability, compound events, and decision models', standards: ['S-CP.1–9', 'S-IC.1–3', 'S-MD.6–7'], skillIds: ['m-conditionalprob', 'm-ev'] },
]

const algebra2: CaliforniaTopicCluster[] = [
  { id: 'a2-cn', name: 'Complex-number arithmetic and complex quadratic roots', standards: ['N-CN.1–2,7–9'], skillIds: ['m-complex', 'm-quadratic'] },
  { id: 'a2-apr', name: 'Polynomial arithmetic, division, zeros, identities, and rational expressions', standards: ['A-APR.1–7'], skillIds: ['m-polyadvanced', 'm-rationalfunc'] },
  { id: 'a2-rei', name: 'Radical, rational, exponential, and absolute-value equations', standards: ['A-CED.1–4', 'A-REI.1–2,4,10–11', 'CA A-CED.1'], skillIds: ['m-radicaleq', 'm-logarithms', 'm-absolute'] },
  { id: 'a2-functions', name: 'Polynomial, rational, radical, exponential, logarithmic, and inverse functions', standards: ['F-IF.4–9', 'F-BF.1,3–5', 'F-LE.4'], skillIds: ['m-functions', 'm-rationalfunc', 'm-radicals', 'm-exponential', 'm-logarithms'] },
  { id: 'a2-trig', name: 'Unit-circle trigonometry, periodic models, and identities', standards: ['F-TF.1–9'], skillIds: ['m-trigfunctions'] },
  { id: 'a2-conics', name: 'Circle and parabola equations', standards: ['G-GPE.1–3', 'CA G-GPE.3.1'], skillIds: ['m-conics'] },
  { id: 'a2-series', name: 'Arithmetic and geometric sequences and series', standards: ['A-SSE.4', 'F-BF.2'], skillIds: ['m-sequences'] },
  { id: 'a2-statistics', name: 'Random processes, study design, inference, and probability decisions', standards: ['S-ID.4', 'S-IC.1–6', 'S-MD.6–7'], skillIds: ['m-hsdata', 'm-inference', 'm-ev'] },
]

const entry = (
  trackId: string,
  course: string,
  pathway: CaliforniaCourseAlignment['pathway'],
  challengeFloor: CaliforniaCourseAlignment['challengeFloor'],
  accessCeiling: CaliforniaCourseAlignment['accessCeiling'],
  clusters: CaliforniaTopicCluster[],
): CaliforniaCourseAlignment => ({
  trackId,
  course,
  pathway,
  source: '2013 CA CCSSM + 2023 California Mathematics Framework',
  challengeFloor,
  accessCeiling,
  clusters,
})

export const CALIFORNIA_COURSE_ALIGNMENTS: CaliforniaCourseAlignment[] = [
  entry('ca-6', 'Grade 6', 'middle-school', 2, 3, grade6),
  entry('ca-7', 'Grade 7', 'middle-school', 3, 3, grade7),
  entry('ca-8', 'Grade 8', 'middle-school', 3, 4, grade8),
  entry(
    'ca-7plus',
    'Accelerated Grade 7/8 preparation',
    'accelerated',
    3,
    4,
    [
      ...grade7,
      { id: '7plus-8-ns', name: 'Irrational numbers and rational approximations', standards: ['8.NS.A.1–2'], skillIds: ['m-roots', 'm-decimals'] },
      { id: '7plus-8-ee', name: 'Integer exponents, scientific notation, lines, and linear equations', standards: ['8.EE.A.1–4', '8.EE.B.5–6', '8.EE.C.7'], skillIds: ['m-exponents', 'm-lineqmulti', 'm-linear', 'm-linfunc'] },
      { id: '7plus-8-g', name: 'Transformations, congruence, similarity, and solid volume', standards: ['8.G.A.1–5', '8.G.C.9'], skillIds: ['m-transform', 'm-volume'] },
    ],
  ),
  entry('ca-78alg', 'Algebra I (accelerated)', 'accelerated', 4, 4, algebra1),
  entry('hs-alg1', 'Algebra I', 'traditional-high-school', 4, 4, algebra1),
  entry('hs-geo', 'Geometry', 'traditional-high-school', 4, 4, geometry),
  entry('hs-alg2', 'Algebra II', 'traditional-high-school', 4, 5, algebra2),
]

export const CALIFORNIA_ALIGNMENT_BY_TRACK = new Map(
  CALIFORNIA_COURSE_ALIGNMENTS.map((alignment) => [alignment.trackId, alignment]),
)
