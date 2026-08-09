/**
 * Math tracks: real courses mapped onto the skill tree.
 *
 * A track is the course a learner is actually sitting in (or preparing for),
 * so "raise my grades" can mean something concrete: the planner knows WHICH
 * skills their class is walking through, and the coach can say how much of
 * the course is owned rather than gesturing at "math".
 *
 * Laws, in the app's usual spirit:
 *
 *  - A track is a TILT, never a filter. Track skills get a small, visible
 *    score bonus in the planner (`TRACK_BONUS`, with a plain-language reason
 *    attached to every selection). Everything outside the track keeps being
 *    scheduled; the allocation sliders and their 5% floors still rule.
 *  - Tracks carry a `next` pointer, because acceleration is the point: once
 *    the current course's skills are owned, the coach points at the next
 *    course rather than declaring victory.
 *  - Unit ORDER within a track approximates a typical course sequence; the
 *    planner treats earlier unfinished units as the course frontier.
 *
 * Sources (full ledger: docs/RESEARCH.md): the official 2013 CA CCSSM course
 * overviews and standards, plus the SBE-adopted 2023 Mathematics Framework.
 * The standard pathway is Math 6 → Math 7 → Math 8 → Algebra I → Geometry →
 * Algebra II. A separate readiness-dependent Math 7+ → accelerated Algebra I
 * branch is retained; acceleration never makes a California cluster vanish.
 *
 * The audit verifies every id exists, every math track covers only math
 * skills, and `next` pointers resolve.
 */

export interface MathTrack {
  id: string
  /** Course name as a learner would recognise it. */
  name: string
  /** One line of what this course is, shown in onboarding and Settings. */
  blurb: string
  /** Learner-facing standards label; null means beyond the state course floor. */
  standard: string | null
  /** Ordered units: earlier units are earlier in the course. */
  units: { name: string; skillIds: string[] }[]
  /** The course this one feeds into, or null at the top of the ladder. */
  next: string | null
}

export const MATH_TRACKS: MathTrack[] = [
  {
    id: 'ca-6',
    name: 'Math 6 (review)',
    blurb: 'California Grade 6 — ratios and rates, number-system fluency, expressions, equations and inequalities, variables, geometry, and distributions.',
    standard: 'California Grade 6 (CA CCSSM)',
    units: [
      { name: 'Ratios, rates & percent', skillIds: ['m-ratio', 'm-units', 'm-percent'] },
      { name: 'Fractions, decimals & negatives', skillIds: ['m-fractions', 'm-decimals', 'm-integers'] },
      { name: 'Expressions, equations & inequalities', skillIds: ['m-expressions', 'm-lineq1', 'm-ineqintro'] },
      { name: 'Dependent & independent variables', skillIds: ['m-variables'] },
      { name: 'Coordinate plane', skillIds: ['m-coord'] },
      { name: 'Area, surface area & volume', skillIds: ['m-area', 'm-volume'] },
      { name: 'Data & distributions', skillIds: ['m-stats', 'm-variability'] },
    ],
    next: 'ca-7',
  },
  {
    id: 'ca-7',
    name: 'Math 7',
    blurb: 'California Grade 7 — proportional relationships, signed rational-number operations, equations and inequalities, geometric constructions, probability, sampling, and comparison.',
    standard: 'California Grade 7 (CA CCSSM)',
    units: [
      { name: 'Proportional relationships', skillIds: ['m-ratio', 'm-proportion', 'm-scale'] },
      { name: 'Rational number operations', skillIds: ['m-rationalops', 'm-fractions', 'm-decimals'] },
      { name: 'Percent applications', skillIds: ['m-percent'] },
      { name: 'Expressions, equations & inequalities', skillIds: ['m-expressions', 'm-lineq1', 'm-inequal'] },
      { name: 'Geometry: constructions, angles, circles, solids', skillIds: ['m-scale', 'm-geoconstruct', 'm-angles', 'm-circles', 'm-area', 'm-volume'] },
      { name: 'Probability & sampling', skillIds: ['m-prob', 'm-counting', 'm-sampling', 'm-variability'] },
    ],
    next: 'ca-8',
  },
  {
    id: 'ca-8',
    name: 'Math 8',
    blurb: 'California Grade 8 — irrational numbers, exponents, linear equations and systems, functions, transformations, Pythagorean reasoning, solid volume, and bivariate data.',
    standard: 'California Grade 8 (CA CCSSM)',
    units: [
      { name: 'Irrational numbers & roots', skillIds: ['m-roots', 'm-decimals'] },
      { name: 'Exponents & scientific notation', skillIds: ['m-exponents'] },
      { name: 'Linear equations & proportional lines', skillIds: ['m-lineqmulti', 'm-linear', 'm-linfunc'] },
      { name: 'Systems of equations', skillIds: ['m-systems'] },
      { name: 'Functions', skillIds: ['m-functions'] },
      { name: 'Congruence, similarity & Pythagorean theorem', skillIds: ['m-transform', 'm-triangles'] },
      { name: 'Cylinders, cones & spheres', skillIds: ['m-volume'] },
      { name: 'Bivariate data', skillIds: ['m-data', 'm-bestfit'] },
    ],
    next: 'hs-alg1',
  },
  {
    id: 'ca-7plus',
    name: 'Math 7+ (accelerated)',
    blurb: 'The compacted course: all of Math 7 plus the first half of Math 8 — exponents and scientific notation, roots and irrationals, linear equations and slope, transformations, and solid volume.',
    standard: 'California accelerated Grade 7/8 preparation',
    units: [
      { name: 'Rational numbers & exponents', skillIds: ['m-rationalops', 'm-fractions', 'm-decimals', 'm-exponents', 'm-roots'] },
      { name: 'Proportionality & percent', skillIds: ['m-ratio', 'm-proportion', 'm-scale', 'm-percent'] },
      { name: 'Linear equations & slope', skillIds: ['m-expressions', 'm-lineq1', 'm-lineqmulti', 'm-inequal', 'm-coord', 'm-linear', 'm-linfunc'] },
      { name: 'Sampling & probability', skillIds: ['m-sampling', 'm-prob', 'm-counting', 'm-variability'] },
      { name: 'Geometric figures', skillIds: ['m-angles', 'm-geoconstruct', 'm-transform', 'm-circles', 'm-area', 'm-volume'] },
    ],
    next: 'ca-78alg',
  },
  {
    id: 'ca-78alg',
    name: 'Algebra I (accelerated)',
    blurb: 'California Algebra I taken early, with the remaining Math 8 clusters first. The Algebra I content floor stays the same regardless of the grade in which it is taken.',
    standard: 'California Algebra I (accelerated placement)',
    units: [
      { name: 'Quantities & expression structure', skillIds: ['m-units', 'm-expressions'] },
      { name: 'Equation fluency', skillIds: ['m-lineqmulti', 'm-wordeq', 'm-absolute'] },
      { name: 'Linear equations in every form', skillIds: ['m-linear', 'm-linfunc', 'm-linforms'] },
      { name: 'Systems of equations', skillIds: ['m-systems'] },
      { name: 'Inequalities: graphs & systems', skillIds: ['m-inequal', 'm-ineq2d'] },
      { name: 'Functions, piecewise rules & sequences', skillIds: ['m-functions', 'm-piecewise', 'm-sequences'] },
      { name: 'Radicals, exponents & exponential models', skillIds: ['m-exponents', 'm-roots', 'm-radicals', 'm-exponential'] },
      { name: 'Geometry: Pythagorean theorem', skillIds: ['m-triangles'] },
      { name: 'Data, residuals & modeling', skillIds: ['m-stats', 'm-variability', 'm-bestfit', 'm-hsdata', 'm-model'] },
      { name: 'Polynomials & quadratics', skillIds: ['m-polys', 'm-quadratic'] },
    ],
    next: 'hs-geo',
  },
  {
    id: 'hs-alg1',
    name: 'Algebra I (HS)',
    blurb: 'The full California Algebra I course — quantities, equations and systems, functions, linear/quadratic/exponential models, rational exponents, polynomials, sequences, and data modeling.',
    standard: 'California Algebra I (traditional pathway)',
    units: [
      { name: 'Quantities, expressions & equations', skillIds: ['m-units', 'm-expressions', 'm-wordeq', 'm-lineqmulti'] },
      { name: 'Linear equations, inequalities & systems', skillIds: ['m-linforms', 'm-inequal', 'm-ineq2d', 'm-systems'] },
      { name: 'Functions & piecewise models', skillIds: ['m-functions', 'm-piecewise', 'm-absolute'] },
      { name: 'Radicals & rational exponents', skillIds: ['m-exponents', 'm-roots', 'm-radicals'] },
      { name: 'Polynomials & quadratics', skillIds: ['m-polys', 'm-quadratic'] },
      { name: 'Sequences & exponential models', skillIds: ['m-sequences', 'm-exponential'] },
      { name: 'Data, residuals & modeling', skillIds: ['m-stats', 'm-variability', 'm-bestfit', 'm-hsdata', 'm-model'] },
    ],
    next: 'hs-geo',
  },
  {
    id: 'hs-geo',
    name: 'Geometry (HS)',
    blurb: 'California Geometry — rigid-motion congruence, constructions and proof, similarity and trigonometry, circle theorems, coordinate geometry, solids, modeling, and conditional probability.',
    standard: 'California Geometry (traditional pathway)',
    units: [
      { name: 'Angles & parallel lines', skillIds: ['m-angles'] },
      { name: 'Triangles & the Pythagorean theorem', skillIds: ['m-triangles'] },
      { name: 'Transformations, congruence & constructions', skillIds: ['m-transform', 'm-congruence'] },
      { name: 'Similarity & triangle trigonometry', skillIds: ['m-scale', 'm-trig', 'm-nonrighttrig'] },
      { name: 'Circle theorems, arcs & sectors', skillIds: ['m-circles', 'm-circleproof'] },
      { name: 'Coordinate geometry & conics', skillIds: ['m-coord', 'm-coordinategeometry', 'm-conics'] },
      { name: 'Area, volume, cross-sections & modeling', skillIds: ['m-area', 'm-volume', 'm-solidgeometry', 'm-model'] },
      { name: 'Conditional probability & decisions', skillIds: ['m-conditionalprob', 'm-ev'] },
      { name: 'Proof & argument', skillIds: ['m-proof', 'm-congruence', 'm-circleproof', 'm-coordinategeometry'] },
    ],
    next: 'hs-alg2',
  },
  {
    id: 'hs-alg2',
    name: 'Algebra II + Precalculus',
    blurb: 'The full California Algebra II floor plus useful precalculus — complex numbers, advanced polynomials, rational and radical equations, logarithms, trigonometric functions, conics, inference, and modeling.',
    standard: 'California Algebra II (traditional pathway) + extensions',
    units: [
      { name: 'Complex numbers & quadratics', skillIds: ['m-complex', 'm-quadratic'] },
      { name: 'Polynomial structure & division', skillIds: ['m-polys', 'm-polyadvanced'] },
      { name: 'Rational expressions & functions', skillIds: ['m-rationalfunc'] },
      { name: 'Radical & rational equations', skillIds: ['m-radicals', 'm-radicaleq', 'm-absolute'] },
      { name: 'Functions & their moves', skillIds: ['m-functions', 'm-piecewise'] },
      { name: 'Exponentials & logarithms', skillIds: ['m-exponential', 'm-exponents', 'm-logarithms'] },
      { name: 'Unit-circle & periodic trigonometry', skillIds: ['m-trigfunctions', 'm-nonrighttrig'] },
      { name: 'Conic sections', skillIds: ['m-conics'] },
      { name: 'Sequences & series', skillIds: ['m-sequences'] },
      { name: 'Counting & probability', skillIds: ['m-counting', 'm-prob', 'm-conditionalprob', 'm-ev'] },
      { name: 'Data, inference & modeling', skillIds: ['m-bestfit', 'm-variability', 'm-hsdata', 'm-inference', 'm-model'] },
    ],
    next: 'college-quant',
  },
  {
    id: 'college-quant',
    name: 'College & beyond',
    blurb: 'For students past high school and adults refreshing: quantitative fluency across algebra, functions, probability and statistics, estimation, and modeling — the math that keeps showing up.',
    standard: null,
    units: [
      { name: 'Algebra fluency', skillIds: ['m-lineqmulti', 'm-systems', 'm-linforms', 'm-inequal'] },
      { name: 'Functions & growth', skillIds: ['m-functions', 'm-exponential', 'm-sequences'] },
      { name: 'Probability & statistics', skillIds: ['m-prob', 'm-ev', 'm-variability', 'm-sampling', 'm-bestfit'] },
      { name: 'Estimation & modeling', skillIds: ['m-units', 'm-model', 'm-nonroutine'] },
      { name: 'Geometry & trig refresh', skillIds: ['m-triangles', 'm-trig'] },
    ],
    next: null,
  },
]

export const TRACK_BY_ID: Map<string, MathTrack> = new Map(MATH_TRACKS.map((t) => [t.id, t]))

/** Every skill id referenced by any track, for audits and quick membership tests. */
export function trackSkillIds(track: MathTrack): string[] {
  return [...new Set(track.units.flatMap((u) => u.skillIds))]
}
