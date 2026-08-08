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
 * Sources (full ledger: docs/RESEARCH.md §25):
 *  - ca-6 / ca-7: the CCSS-M grade 6 and 7 standards verbatim (California
 *    adopted CCSS-M), cross-checked against Khan Academy's 6th/7th courses.
 *  - ca-7plus: CCSS Appendix A "Accelerated 7th Grade" — the model the CA
 *    State Board circulated — which is ALL of grade 7 plus the first half of
 *    grade 8 (8.NS.1-2, 8.EE.1-7, 8.G.1-5, 8.G.9). Systems (8.EE.8),
 *    functions (8.F), Pythagorean (8.G.6-8), and bivariate data (8.SP) stay
 *    for the next year in that model; some districts (e.g. Cupertino) pull
 *    them down too, which is why they lead the NEXT track rather than being
 *    dropped anywhere.
 *  - ca-78alg: the accelerated 8th-grade Algebra 1 year — the remaining
 *    grade-8 clusters plus the CCSS Appendix A Algebra 1 units, matching the
 *    Khan/AoPS/CPM consensus core.
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
  /** Ordered units: earlier units are earlier in the course. */
  units: { name: string; skillIds: string[] }[]
  /** The course this one feeds into, or null at the top of the ladder. */
  next: string | null
}

export const MATH_TRACKS: MathTrack[] = [
  {
    id: 'ca-6',
    name: 'Math 6 (review)',
    blurb: 'The full 6th-grade year — ratios and rates, fractions and negatives, expressions and first equations, area and volume, data and distributions.',
    units: [
      { name: 'Ratios, rates & percent', skillIds: ['m-ratio', 'm-units', 'm-percent'] },
      { name: 'Fractions, decimals & negatives', skillIds: ['m-fractions', 'm-decimals', 'm-integers'] },
      { name: 'Expressions & first equations', skillIds: ['m-expressions', 'm-lineq1'] },
      { name: 'Coordinate plane', skillIds: ['m-coord'] },
      { name: 'Area, surface area & volume', skillIds: ['m-area', 'm-volume'] },
      { name: 'Data & distributions', skillIds: ['m-stats', 'm-variability'] },
    ],
    next: 'ca-7',
  },
  {
    id: 'ca-7',
    name: 'Math 7',
    blurb: 'The standard 7th-grade year — proportional relationships, rational-number operations, percent applications, equations and inequalities, geometry, probability and sampling.',
    units: [
      { name: 'Proportional relationships', skillIds: ['m-ratio', 'm-proportion', 'm-scale'] },
      { name: 'Rational number operations', skillIds: ['m-integers', 'm-fractions', 'm-decimals'] },
      { name: 'Percent applications', skillIds: ['m-percent'] },
      { name: 'Expressions, equations & inequalities', skillIds: ['m-expressions', 'm-lineq1', 'm-inequal'] },
      { name: 'Geometry: angles, circles, solids', skillIds: ['m-angles', 'm-circles', 'm-area', 'm-volume'] },
      { name: 'Probability & sampling', skillIds: ['m-prob', 'm-counting', 'm-sampling', 'm-variability'] },
    ],
    next: 'ca-7plus',
  },
  {
    id: 'ca-7plus',
    name: 'Math 7+ (accelerated)',
    blurb: 'The compacted course: all of Math 7 plus the first half of Math 8 — exponents and scientific notation, roots and irrationals, linear equations and slope, transformations, and solid volume.',
    units: [
      { name: 'Rational numbers & exponents', skillIds: ['m-integers', 'm-fractions', 'm-decimals', 'm-exponents', 'm-roots'] },
      { name: 'Proportionality & percent', skillIds: ['m-ratio', 'm-proportion', 'm-scale', 'm-percent'] },
      { name: 'Linear equations & slope', skillIds: ['m-expressions', 'm-lineq1', 'm-lineqmulti', 'm-inequal', 'm-coord', 'm-linear', 'm-linfunc'] },
      { name: 'Sampling & probability', skillIds: ['m-sampling', 'm-prob', 'm-counting'] },
      { name: 'Geometric figures', skillIds: ['m-angles', 'm-transform', 'm-circles', 'm-volume'] },
    ],
    next: 'ca-78alg',
  },
  {
    id: 'ca-78alg',
    name: '7/8 Algebra',
    blurb: 'Algebra 1 taken early: the rest of Math 8 (systems, functions, Pythagorean theorem, scatter plots) plus the full Algebra 1 core — forms of linear equations, inequalities in the plane, sequences, exponential models, quadratics.',
    units: [
      { name: 'Equation fluency', skillIds: ['m-lineqmulti', 'm-wordeq', 'm-absolute'] },
      { name: 'Linear equations in every form', skillIds: ['m-linear', 'm-linfunc', 'm-linforms'] },
      { name: 'Systems of equations', skillIds: ['m-systems'] },
      { name: 'Inequalities: graphs & systems', skillIds: ['m-inequal', 'm-ineq2d'] },
      { name: 'Functions & sequences', skillIds: ['m-functions', 'm-sequences'] },
      { name: 'Exponents & exponential models', skillIds: ['m-exponents', 'm-exponential'] },
      { name: 'Geometry: Pythagorean theorem', skillIds: ['m-triangles'] },
      { name: 'Data & modeling', skillIds: ['m-bestfit', 'm-model'] },
      { name: 'Polynomials & quadratics', skillIds: ['m-polys', 'm-quadratic'] },
    ],
    next: null,
  },
]

export const TRACK_BY_ID: Map<string, MathTrack> = new Map(MATH_TRACKS.map((t) => [t.id, t]))

/** Every skill id referenced by any track, for audits and quick membership tests. */
export function trackSkillIds(track: MathTrack): string[] {
  return [...new Set(track.units.flatMap((u) => u.skillIds))]
}
