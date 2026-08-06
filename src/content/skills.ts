/**
 * The skill graph: courses → units → skills with prerequisite edges.
 * Grade bands are routing hints for placement, not judgments.
 * The content audit verifies: every prereq exists, no cycles, every skill
 * belongs to exactly one unit, and every skill has at least one item.
 */
import type { Course, SkillNode } from '../domain/types'

type S = Omit<SkillNode, 'courseId' | 'unitId' | 'kbIds'> & { kbIds?: string[] }

function defineCourse(
  course: { id: string; name: string; bucket: Course['bucket'] },
  units: { id: string; name: string; skills: S[] }[],
): { course: Course; skills: SkillNode[] } {
  const skills: SkillNode[] = []
  const courseUnits = units.map((u) => {
    for (const s of u.skills) {
      skills.push({ ...s, courseId: course.id, unitId: u.id, kbIds: s.kbIds ?? [s.id] })
    }
    return { id: u.id, name: u.name, skillIds: u.skills.map((s) => s.id) }
  })
  return { course: { ...course, units: courseUnits }, skills }
}

const mathFoundations = defineCourse(
  { id: 'math-foundations', name: 'Foundations & Pre-Algebra', bucket: 'math' },
  [
    {
      id: 'u-number',
      name: 'Number sense',
      skills: [
        { id: 'm-integers', name: 'Integer operations', bucket: 'math', prereqs: [], gradeBand: 6, blurb: 'Add, subtract, multiply, and divide with negative numbers; order of operations.' },
        { id: 'm-fractions', name: 'Fraction arithmetic', bucket: 'math', prereqs: ['m-integers'], gradeBand: 6, blurb: 'Add, subtract, multiply, and divide fractions and mixed numbers.' },
        { id: 'm-decimals', name: 'Decimals & rational forms', bucket: 'math', prereqs: ['m-fractions'], gradeBand: 6, blurb: 'Convert between fractions, decimals, and percents; compare rationals.' },
        { id: 'm-exponents', name: 'Exponents & scientific notation', bucket: 'math', prereqs: ['m-integers'], gradeBand: 8, blurb: 'Exponent rules, powers of ten, and scientific notation.' },
        { id: 'm-roots', name: 'Squares & roots', bucket: 'math', prereqs: ['m-exponents'], gradeBand: 8, blurb: 'Perfect squares, square roots, and estimating irrationals.' },
      ],
    },
    {
      id: 'u-proportional',
      name: 'Proportional reasoning',
      skills: [
        { id: 'm-ratio', name: 'Ratios & rates', bucket: 'math', prereqs: ['m-fractions'], gradeBand: 6, blurb: 'Ratios, unit rates, and comparing rates.' },
        { id: 'm-proportion', name: 'Proportional relationships', bucket: 'math', prereqs: ['m-ratio'], gradeBand: 7, blurb: 'Set up and solve proportions; recognize proportionality.' },
        { id: 'm-percent', name: 'Percent problems', bucket: 'math', prereqs: ['m-proportion', 'm-decimals'], gradeBand: 7, blurb: 'Percent of a number, percent change, discounts, and interest.' },
        { id: 'm-units', name: 'Units & dimensional reasoning', bucket: 'math', prereqs: ['m-ratio'], gradeBand: 7, blurb: 'Convert units with conversion factors; reason about dimensions.' },
      ],
    },
    {
      id: 'u-data-prob',
      name: 'Data & probability',
      skills: [
        { id: 'm-stats', name: 'Descriptive statistics', bucket: 'math', prereqs: ['m-decimals'], gradeBand: 6, blurb: 'Mean, median, mode, range, and what each summary hides.' },
        { id: 'm-data', name: 'Data interpretation', bucket: 'math', prereqs: ['m-stats'], gradeBand: 7, blurb: 'Read and question tables, bar charts, line graphs, and scatter plots.' },
        { id: 'm-counting', name: 'Counting principles', bucket: 'math', prereqs: ['m-integers'], gradeBand: 7, blurb: 'Systematic counting, the multiplication principle, simple arrangements.' },
        { id: 'm-prob', name: 'Probability', bucket: 'math', prereqs: ['m-fractions', 'm-counting'], gradeBand: 7, blurb: 'Single and compound events, complements, and sample spaces.' },
        { id: 'm-ev', name: 'Expected value', bucket: 'math', prereqs: ['m-prob'], gradeBand: 9, blurb: 'Average long-run outcomes; when a bet or plan is worth it.' },
      ],
    },
  ],
)

const algebra = defineCourse(
  { id: 'math-algebra', name: 'Algebra', bucket: 'math' },
  [
    {
      id: 'u-expressions',
      name: 'Expressions & equations',
      skills: [
        { id: 'm-expressions', name: 'Algebraic expressions', bucket: 'math', prereqs: ['m-integers'], gradeBand: 7, blurb: 'Translate, evaluate, and simplify expressions; combine like terms.' },
        { id: 'm-lineq1', name: 'One & two-step equations', bucket: 'math', prereqs: ['m-expressions'], gradeBand: 7, blurb: 'Solve ax + b = c and friends, with inverse operations.' },
        { id: 'm-lineqmulti', name: 'Multi-step equations', bucket: 'math', prereqs: ['m-lineq1', 'm-fractions'], gradeBand: 8, blurb: 'Variables on both sides, distribution, and fraction coefficients.' },
        { id: 'm-inequal', name: 'Inequalities', bucket: 'math', prereqs: ['m-lineq1'], gradeBand: 8, blurb: 'Solve and graph inequalities; the sign-flip rule and why it works.' },
        { id: 'm-wordeq', name: 'Situations → equations', bucket: 'math', prereqs: ['m-lineqmulti'], gradeBand: 8, blurb: 'Choose the equation that models a story, then solve it.' },
      ],
    },
    {
      id: 'u-linear',
      name: 'Linear relationships',
      skills: [
        { id: 'm-coord', name: 'Coordinate plane', bucket: 'math', prereqs: ['m-integers'], gradeBand: 7, blurb: 'Plot points, read graphs, and find distances on the grid.' },
        { id: 'm-linear', name: 'Slope & linear patterns', bucket: 'math', prereqs: ['m-coord', 'm-proportion'], gradeBand: 8, blurb: 'Rate of change, slope from points and graphs.' },
        { id: 'm-linfunc', name: 'Linear equations & graphs', bucket: 'math', prereqs: ['m-linear', 'm-lineqmulti'], gradeBand: 8, blurb: 'y = mx + b: build, graph, and interpret linear models.' },
        { id: 'm-systems', name: 'Systems of equations', bucket: 'math', prereqs: ['m-linfunc'], gradeBand: 9, blurb: 'Solve pairs of linear equations; what a solution means.' },
        { id: 'm-functions', name: 'Functions', bucket: 'math', prereqs: ['m-linfunc'], gradeBand: 9, blurb: 'Function notation, inputs/outputs, and reading f(x).' },
      ],
    },
    {
      id: 'u-nonlinear',
      name: 'Beyond linear',
      skills: [
        { id: 'm-polys', name: 'Polynomials & factoring', bucket: 'math', prereqs: ['m-expressions', 'm-exponents'], gradeBand: 9, blurb: 'Multiply binomials, factor simple quadratics.' },
        { id: 'm-quadratic', name: 'Intro quadratics', bucket: 'math', prereqs: ['m-functions', 'm-roots', 'm-polys'], gradeBand: 9, blurb: 'Solve by factoring and square roots; parabola basics.' },
      ],
    },
  ],
)

const geometry = defineCourse(
  { id: 'math-geometry', name: 'Geometry & Measurement', bucket: 'math' },
  [
    {
      id: 'u-figures',
      name: 'Figures & angles',
      skills: [
        { id: 'm-angles', name: 'Angles & parallel lines', bucket: 'math', prereqs: [], gradeBand: 7, blurb: 'Angle pairs, triangle angle sum, parallel-line angle rules.' },
        { id: 'm-triangles', name: 'Triangles & Pythagorean theorem', bucket: 'math', prereqs: ['m-angles', 'm-roots'], gradeBand: 8, blurb: 'Right-triangle relationships and distance applications.' },
        { id: 'm-transform', name: 'Transformations & similarity', bucket: 'math', prereqs: ['m-coord', 'm-proportion'], gradeBand: 8, blurb: 'Translations, reflections, rotations, dilations, and similar figures.' },
      ],
    },
    {
      id: 'u-measure',
      name: 'Area & volume',
      skills: [
        { id: 'm-area', name: 'Area & perimeter', bucket: 'math', prereqs: ['m-fractions'], gradeBand: 6, blurb: 'Rectangles, triangles, parallelograms, and composite figures.' },
        { id: 'm-circles', name: 'Circles', bucket: 'math', prereqs: ['m-area'], gradeBand: 7, blurb: 'Circumference and area; where π shows up and why.' },
        { id: 'm-volume', name: 'Volume & surface area', bucket: 'math', prereqs: ['m-area'], gradeBand: 7, blurb: 'Prisms, cylinders, and composite solids.' },
      ],
    },
    {
      id: 'u-advanced-think',
      name: 'Mathematical thinking',
      skills: [
        { id: 'm-model', name: 'Mathematical modeling', bucket: 'math', prereqs: ['m-wordeq', 'm-data'], gradeBand: 9, blurb: 'Turn a messy situation into math, then check the model against reality.' },
        { id: 'm-proof', name: 'Proof & counterexample', bucket: 'math', prereqs: ['m-expressions'], gradeBand: 9, blurb: 'Justify claims for all cases, or kill them with one counterexample.' },
        { id: 'm-nonroutine', name: 'Non-routine problem solving', bucket: 'math', prereqs: ['m-lineqmulti', 'm-area'], gradeBand: 8, blurb: 'Problems with no obvious method: represent, simplify, look for structure.' },
      ],
    },
  ],
)

const physics = defineCourse(
  { id: 'physics-intro', name: 'Introductory Physics', bucket: 'physics' },
  [
    {
      id: 'u-measure-motion',
      name: 'Measurement & motion',
      skills: [
        { id: 'p-measure', name: 'Measurement & units', bucket: 'physics', prereqs: ['m-units'], gradeBand: 8, blurb: 'SI units, unit algebra, and dimensional checks that catch wrong answers.' },
        { id: 'p-motion', name: 'Speed & velocity', bucket: 'physics', prereqs: ['p-measure'], gradeBand: 8, blurb: 'Position, displacement, speed vs velocity, and d = vt reasoning.' },
        { id: 'p-graphs', name: 'Motion graphs', bucket: 'physics', prereqs: ['p-motion', 'm-linear'], gradeBand: 8, blurb: 'Read position-time and velocity-time graphs; slope as rate.' },
        { id: 'p-accel', name: 'Acceleration', bucket: 'physics', prereqs: ['p-graphs'], gradeBand: 9, blurb: 'Changing velocity, a = Δv/Δt, and simple kinematics.' },
      ],
    },
    {
      id: 'u-forces-energy',
      name: 'Forces & energy',
      skills: [
        { id: 'p-forces', name: 'Forces & Newton’s laws', bucket: 'physics', prereqs: ['p-accel'], gradeBand: 9, blurb: 'Net force, F = ma, and free-body reasoning.' },
        { id: 'p-energy', name: 'Work & energy', bucket: 'physics', prereqs: ['p-forces'], gradeBand: 9, blurb: 'Work, kinetic and potential energy, and conservation reasoning.' },
        { id: 'p-momentum', name: 'Momentum', bucket: 'physics', prereqs: ['p-forces'], gradeBand: 9, blurb: 'p = mv, impulse, and simple collisions.' },
      ],
    },
    {
      id: 'u-matter-electric',
      name: 'Matter & circuits',
      skills: [
        { id: 'p-density', name: 'Density & pressure', bucket: 'physics', prereqs: ['p-measure', 'm-proportion'], gradeBand: 8, blurb: 'ρ = m/V, pressure as force over area, and floating/sinking.' },
        { id: 'p-circuits', name: 'Simple circuits', bucket: 'physics', prereqs: ['p-measure'], gradeBand: 9, blurb: 'Current, voltage, resistance, and Ohm’s law in series circuits.' },
        { id: 'p-estimate', name: 'Estimation & orders of magnitude', bucket: 'physics', prereqs: ['m-exponents'], gradeBand: 8, blurb: 'Sanity-check the world with powers of ten.' },
      ],
    },
  ],
)

const coding = defineCourse(
  { id: 'coding-core', name: 'Computational Thinking', bucket: 'coding' },
  [
    {
      id: 'u-code-basics',
      name: 'Code fundamentals',
      skills: [
        { id: 'c-vars', name: 'Variables & expressions', bucket: 'coding', prereqs: [], gradeBand: 7, blurb: 'Assignment, evaluation order, and tracking values by hand.' },
        { id: 'c-bool', name: 'Booleans & conditionals', bucket: 'coding', prereqs: ['c-vars'], gradeBand: 7, blurb: 'Truth values, comparisons, and if/else branching.' },
        { id: 'c-loops', name: 'Loops', bucket: 'coding', prereqs: ['c-bool'], gradeBand: 8, blurb: 'for/while iteration and loop variables over time.' },
        { id: 'c-funcs', name: 'Functions', bucket: 'coding', prereqs: ['c-vars'], gradeBand: 8, blurb: 'Parameters, return values, and scope.' },
      ],
    },
    {
      id: 'u-code-structures',
      name: 'Data & algorithms',
      skills: [
        { id: 'c-arrays', name: 'Arrays & state', bucket: 'coding', prereqs: ['c-loops'], gradeBand: 8, blurb: 'Indexing, mutation, and building results across a loop.' },
        { id: 'c-trace', name: 'Tracing & debugging', bucket: 'coding', prereqs: ['c-loops', 'c-funcs'], gradeBand: 8, blurb: 'Predict output, find the bug, and reason about state tables.' },
        { id: 'c-algo', name: 'Search & sort concepts', bucket: 'coding', prereqs: ['c-arrays'], gradeBand: 9, blurb: 'Linear vs binary search, sorting ideas, and why steps matter.' },
        { id: 'c-decomp', name: 'Decomposition & invariants', bucket: 'coding', prereqs: ['c-funcs'], gradeBand: 9, blurb: 'Break problems down; find what stays true while code runs.' },
      ],
    },
  ],
)

const science = defineCourse(
  { id: 'science-reasoning', name: 'Scientific Reasoning', bucket: 'science' },
  [
    {
      id: 'u-experiments',
      name: 'Experiments & evidence',
      skills: [
        { id: 's-hypo', name: 'Hypotheses & controls', bucket: 'science', prereqs: [], gradeBand: 7, blurb: 'Testable claims, variables, and what a control is for.' },
        { id: 's-measure', name: 'Measurement error & reliability', bucket: 'science', prereqs: ['m-stats'], gradeBand: 8, blurb: 'Noise, repeatability, and why one measurement is never enough.' },
        { id: 's-corr', name: 'Correlation vs causation', bucket: 'science', prereqs: ['s-hypo'], gradeBand: 8, blurb: 'Confounds, reverse causation, and what would settle it.' },
      ],
    },
    {
      id: 'u-quant-literacy',
      name: 'Quantitative literacy',
      skills: [
        { id: 's-graphs', name: 'Graph & claim evaluation', bucket: 'science', prereqs: ['m-data'], gradeBand: 8, blurb: 'Axes tricks, cherry-picking, and whether the chart supports the claim.' },
        { id: 's-fermi', name: 'Fermi estimation', bucket: 'science', prereqs: ['m-units'], gradeBand: 8, blurb: 'Rough answers from decomposition — and knowing how rough.' },
        { id: 's-sources', name: 'Source quality & stats traps', bucket: 'science', prereqs: ['s-corr'], gradeBand: 9, blurb: 'Percent vs points, base rates, survivorship, and who is telling you this.' },
      ],
    },
  ],
)

const observer = defineCourse(
  { id: 'lab-observer', name: 'Observer Lab', bucket: 'observer' },
  [
    {
      id: 'u-observe',
      name: 'Seeing clearly',
      skills: [
        { id: 'o-obsinf', name: 'Observation vs inference', bucket: 'observer', prereqs: [], gradeBand: 7, blurb: 'Separate what you saw from what you concluded.' },
        { id: 'o-recall', name: 'Scene recall', bucket: 'observer', prereqs: [], gradeBand: 7, blurb: 'Hold details accurately; know which details matter.' },
        { id: 'o-listen', name: 'Listening & paraphrase', bucket: 'observer', prereqs: [], gradeBand: 7, blurb: 'Restate what was actually said — without adding or losing meaning.' },
        { id: 'o-bias', name: 'Bias & calibration', bucket: 'observer', prereqs: ['o-obsinf'], gradeBand: 8, blurb: 'Catch confirmation bias and cold-reading tricks; rate your own certainty.' },
        { id: 'o-memory', name: 'Memory techniques', bucket: 'observer', prereqs: ['o-recall'], gradeBand: 7, blurb: 'Method of loci and structured encoding, tested with delayed recall.' },
      ],
    },
  ],
)

const investigator = defineCourse(
  { id: 'lab-investigator', name: 'Investigator Lab', bucket: 'investigator' },
  [
    {
      id: 'u-investigate',
      name: 'Reasoning under uncertainty',
      skills: [
        { id: 'i-logic', name: 'Deduction & logic', bucket: 'investigator', prereqs: [], gradeBand: 8, blurb: 'Valid vs invalid arguments, contrapositives, and counterexamples.' },
        { id: 'i-bayes', name: 'Base rates & updating', bucket: 'investigator', prereqs: ['m-fractions'], gradeBand: 9, blurb: 'Natural-frequency Bayes: what a positive test really means.' },
        { id: 'i-hypo', name: 'Competing hypotheses', bucket: 'investigator', prereqs: ['i-logic'], gradeBand: 8, blurb: 'Hold several explanations; find the test that separates them.' },
        { id: 'i-forecast', name: 'Forecasting', bucket: 'investigator', prereqs: [], gradeBand: 8, blurb: 'Probabilities you can be scored on; Brier feedback over time.' },
        { id: 'i-game', name: 'Game & cooperation lab', bucket: 'investigator', prereqs: ['m-ev'], gradeBand: 9, blurb: 'Payoff tables, dominant choices, and when cooperation wins.' },
      ],
    },
  ],
)

const strategist = defineCourse(
  { id: 'lab-strategist', name: 'Strategist Lab', bucket: 'strategist' },
  [
    {
      id: 'u-strategy',
      name: 'Plans that survive reality',
      skills: [
        { id: 'st-decomp', name: 'Backward planning', bucket: 'strategist', prereqs: [], gradeBand: 7, blurb: 'Start from the goal; find the step order that actually works.' },
        { id: 'st-ev', name: 'Decision trees & expected value', bucket: 'strategist', prereqs: ['m-ev'], gradeBand: 9, blurb: 'Compare risky options with numbers instead of vibes.' },
        { id: 'st-premortem', name: 'Pre-mortems & plan repair', bucket: 'strategist', prereqs: ['st-decomp'], gradeBand: 8, blurb: 'Assume it failed — why? Then fix the plan before it does.' },
        { id: 'st-estimate', name: 'Estimation & tracking', bucket: 'strategist', prereqs: [], gradeBand: 8, blurb: 'Predict how long things take; score your predictions.' },
        { id: 'st-ethics', name: 'Ethical strategy', bucket: 'strategist', prereqs: ['st-decomp'], gradeBand: 8, blurb: 'Win while keeping honesty, consent, and other people’s agency intact.' },
      ],
    },
  ],
)

const insight = defineCourse(
  { id: 'lab-insight', name: 'Human Insight', bucket: 'insight' },
  [
    {
      id: 'u-insight',
      name: 'Understanding & protecting people',
      skills: [
        { id: 'h-emotion', name: 'Perspective-taking', bucket: 'insight', prereqs: [], gradeBand: 7, blurb: 'Name emotions precisely; hold multiple readings of a situation.' },
        { id: 'h-influence', name: 'Influence defense', bucket: 'insight', prereqs: [], gradeBand: 8, blurb: 'Recognize pressure tactics, false urgency, and dark patterns.' },
        { id: 'h-boundary', name: 'Boundaries & de-escalation', bucket: 'insight', prereqs: [], gradeBand: 8, blurb: 'Say no clearly, cool conflicts down, and know when to get help.' },
      ],
    },
  ],
)

const meta = defineCourse(
  { id: 'lab-meta', name: 'Meta Lab', bucket: 'meta' },
  [
    {
      id: 'u-meta',
      name: 'Learning how to learn',
      skills: [
        { id: 'x-learn', name: 'Study science', bucket: 'meta', prereqs: [], gradeBand: 7, blurb: 'Retrieval beats rereading; spacing beats cramming — and why.' },
        { id: 'x-method', name: 'Strategy recognition', bucket: 'meta', prereqs: [], gradeBand: 8, blurb: 'See a problem and name the method it calls for — before solving anything.' },
        { id: 'x-calib', name: 'Self-calibration', bucket: 'meta', prereqs: [], gradeBand: 8, blurb: 'Match confidence to evidence; make “I don’t know” a power move.' },
        { id: 'x-explain', name: 'Explanation & compression', bucket: 'meta', prereqs: [], gradeBand: 8, blurb: 'Compress ideas into one sentence, one example, one trap.' },
        { id: 'x-focus', name: 'Focus & error diagnosis', bucket: 'meta', prereqs: [], gradeBand: 7, blurb: 'Plan deep work; sort your errors by cause, not by topic.' },
      ],
    },
  ],
)

const puzzle = defineCourse(
  { id: 'lab-puzzle', name: 'Puzzle Lab', bucket: 'puzzle' },
  [
    {
      id: 'u-puzzle',
      name: 'Structured challenge',
      skills: [
        { id: 'z-chess', name: 'Chess tactics', bucket: 'puzzle', prereqs: [], gradeBand: 7, blurb: 'Forcing moves, candidate discipline, and the opponent’s best reply.' },
        { id: 'z-spatial', name: 'Spatial assembly', bucket: 'puzzle', prereqs: [], gradeBand: 6, blurb: 'Fit pieces under rotation — plan placements before committing.' },
        { id: 'z-deduce', name: 'Constraint deduction', bucket: 'puzzle', prereqs: [], gradeBand: 7, blurb: 'Logic grids: squeeze certainty out of overlapping constraints.' },
      ],
    },
  ],
)

const defined = [
  mathFoundations,
  algebra,
  geometry,
  physics,
  coding,
  science,
  observer,
  investigator,
  strategist,
  insight,
  meta,
  puzzle,
]

export const COURSES: Course[] = defined.map((d) => d.course)
export const SKILLS: SkillNode[] = defined.flatMap((d) => d.skills)
export const SKILL_BY_ID: Map<string, SkillNode> = new Map(SKILLS.map((s) => [s.id, s]))
