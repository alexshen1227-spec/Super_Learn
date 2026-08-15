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
        { id: 'm-integers', name: 'Integers, factors & the number line', bucket: 'math', prereqs: [], gradeBand: 6, blurb: 'Order signed numbers, use absolute value, and work with factors, multiples, and coordinates.' },
        { id: 'm-rationalops', name: 'Rational-number operations', bucket: 'math', prereqs: ['m-integers', 'm-fractions'], gradeBand: 7, blurb: 'Add, subtract, multiply, and divide positive and negative rational numbers in context.' },
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
        { id: 'm-percent', name: 'Percent problems', bucket: 'math', prereqs: ['m-ratio', 'm-decimals'], gradeBand: 6, blurb: 'Interpret percent as a rate per 100, then solve percent change, discount, tax, tip, and interest problems.' },
        { id: 'm-units', name: 'Units & dimensional reasoning', bucket: 'math', prereqs: ['m-ratio'], gradeBand: 6, blurb: 'Convert units with conversion factors; reason about dimensions.' },
        { id: 'm-scale', name: 'Scale drawings & maps', bucket: 'math', prereqs: ['m-proportion'], gradeBand: 7, blurb: 'Scale factors between drawings and reality; how lengths and areas scale differently.' },
      ],
    },
    {
      id: 'u-data-prob',
      name: 'Data & probability',
      skills: [
        { id: 'm-stats', name: 'Descriptive statistics', bucket: 'math', prereqs: ['m-decimals'], gradeBand: 6, blurb: 'Mean, median, mode, range, and what each summary hides.' },
        // gradeBand corrected 8 → 6 (2026-08-08): IQR/MAD and distribution shape
        // are 6.SP.5 in the verbatim CCSS text; comparing two populations via
        // center-vs-spread is then 7.SP.3-4. The 8 was a guess that survived
        // until the standards were actually read.
        { id: 'm-variability', name: 'Variability & distributions', bucket: 'math', prereqs: ['m-stats'], gradeBand: 6, blurb: 'Spread, quartiles, IQR, and why equal averages can hide very different data.' },
        { id: 'm-data', name: 'Data interpretation', bucket: 'math', prereqs: ['m-stats'], gradeBand: 7, blurb: 'Read and question tables, bar charts, line graphs, and scatter plots.' },
        { id: 'm-bestfit', name: 'Scatter plots & trend lines', bucket: 'math', prereqs: ['m-data', 'm-linear'], gradeBand: 8, blurb: 'Read association from a scatter plot and use a trend line without overclaiming it.' },
        { id: 'm-counting', name: 'Counting principles', bucket: 'math', prereqs: ['m-integers'], gradeBand: 7, blurb: 'Systematic counting, the multiplication principle, simple arrangements.' },
        { id: 'm-prob', name: 'Probability', bucket: 'math', prereqs: ['m-fractions', 'm-counting'], gradeBand: 7, blurb: 'Single and compound events, complements, and sample spaces.' },
        { id: 'm-sampling', name: 'Sampling & inference', bucket: 'math', prereqs: ['m-stats', 'm-prob'], gradeBand: 7, blurb: 'What a random sample can and cannot tell you about the whole population.' },
        { id: 'm-ev', name: 'Expected value', bucket: 'math', prereqs: ['m-prob'], gradeBand: 9, blurb: 'Average long-run outcomes; when a bet or plan is worth it.' },
        { id: 'm-hsdata', name: 'High-school data analysis', bucket: 'math', prereqs: ['m-bestfit', 'm-variability'], gradeBand: 9, blurb: 'Standard deviation, two-way tables, residuals, and judging how well a model fits data.' },
        { id: 'm-conditionalprob', name: 'Conditional probability', bucket: 'math', prereqs: ['m-prob'], gradeBand: 10, blurb: 'Independence, conditional probability, two-way tables, and compound-event rules.' },
        { id: 'm-inference', name: 'Statistical inference', bucket: 'math', prereqs: ['m-sampling', 'm-hsdata'], gradeBand: 11, blurb: 'Surveys, experiments, observational studies, simulations, and conclusions the design can support.' },
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
        { id: 'm-expressions', name: 'Algebraic expressions', bucket: 'math', prereqs: ['m-integers'], gradeBand: 6, blurb: 'Translate, evaluate, and simplify expressions; combine like terms.' },
        { id: 'm-lineq1', name: 'One & two-step equations', bucket: 'math', prereqs: ['m-expressions'], gradeBand: 6, blurb: 'Solve ax + b = c and friends, with inverse operations.' },
        { id: 'm-ineqintro', name: 'Intro inequalities', bucket: 'math', prereqs: ['m-lineq1'], gradeBand: 6, blurb: 'Read, write, solve, and graph simple one-variable inequalities as sets of possible values.' },
        { id: 'm-lineqmulti', name: 'Multi-step equations', bucket: 'math', prereqs: ['m-lineq1', 'm-fractions'], gradeBand: 8, blurb: 'Variables on both sides, distribution, and fraction coefficients.' },
        { id: 'm-inequal', name: 'Inequality operations', bucket: 'math', prereqs: ['m-ineqintro', 'm-rationalops'], gradeBand: 7, blurb: 'Solve multi-step inequalities, including the sign-flip rule and why it works.' },
        { id: 'm-absolute', name: 'Absolute value', bucket: 'math', prereqs: ['m-integers', 'm-inequal'], gradeBand: 8, blurb: 'Distance from zero: equations and inequalities that split into two cases.' },
        { id: 'm-wordeq', name: 'Situations → equations', bucket: 'math', prereqs: ['m-lineqmulti'], gradeBand: 8, blurb: 'Choose the equation that models a story, then solve it.' },
      ],
    },
    {
      id: 'u-linear',
      name: 'Linear relationships',
      skills: [
        { id: 'm-coord', name: 'Coordinate plane', bucket: 'math', prereqs: ['m-integers'], gradeBand: 6, blurb: 'Plot points in all four quadrants, read graphs, and find axis-aligned distances on the grid.' },
        { id: 'm-variables', name: 'Dependent & independent variables', bucket: 'math', prereqs: ['m-expressions'], gradeBand: 6, blurb: 'Connect a real relationship across an equation, table, and graph; identify what depends on what.' },
        { id: 'm-linear', name: 'Slope & linear patterns', bucket: 'math', prereqs: ['m-coord', 'm-proportion'], gradeBand: 8, blurb: 'Rate of change, slope from points and graphs.' },
        { id: 'm-linfunc', name: 'Linear equations & graphs', bucket: 'math', prereqs: ['m-linear', 'm-lineqmulti'], gradeBand: 8, blurb: 'y = mx + b: build, graph, and interpret linear models.' },
        { id: 'm-linforms', name: 'Forms of linear equations', bucket: 'math', prereqs: ['m-linfunc'], gradeBand: 9, blurb: 'Slope-intercept, point-slope, and standard form: pick the right one, convert between them.' },
        { id: 'm-systems', name: 'Systems of equations', bucket: 'math', prereqs: ['m-linfunc'], gradeBand: 8, blurb: 'Solve pairs of linear equations; what a solution means.' },
        { id: 'm-ineq2d', name: 'Two-variable inequalities', bucket: 'math', prereqs: ['m-linfunc', 'm-inequal'], gradeBand: 9, blurb: 'Half-planes, boundary lines, and the region where several inequalities all hold.' },
        { id: 'm-functions', name: 'Functions', bucket: 'math', prereqs: ['m-linfunc'], gradeBand: 8, blurb: 'Define, evaluate, compare, and model with functions; add formal function notation in Algebra I.' },
        { id: 'm-piecewise', name: 'Piecewise & absolute-value functions', bucket: 'math', prereqs: ['m-functions', 'm-absolute'], gradeBand: 9, blurb: 'Evaluate and interpret functions whose rule changes by input interval, including step and absolute-value models.' },
      ],
    },
    {
      id: 'u-nonlinear',
      name: 'Beyond linear',
      skills: [
        { id: 'm-polys', name: 'Polynomials & factoring', bucket: 'math', prereqs: ['m-expressions', 'm-exponents'], gradeBand: 9, blurb: 'Multiply binomials, factor simple quadratics.' },
        { id: 'm-quadratic', name: 'Intro quadratics', bucket: 'math', prereqs: ['m-functions', 'm-roots', 'm-polys'], gradeBand: 9, blurb: 'Solve by factoring and square roots; parabola basics.' },
        { id: 'm-radicals', name: 'Radicals & rational exponents', bucket: 'math', prereqs: ['m-roots', 'm-exponents'], gradeBand: 9, blurb: 'Rewrite and simplify expressions using radicals and rational exponents.' },
        { id: 'm-sequences', name: 'Sequences & patterns', bucket: 'math', prereqs: ['m-linear'], gradeBand: 9, blurb: 'Arithmetic and geometric sequences; find the rule, then the nth term.' },
        { id: 'm-exponential', name: 'Exponential growth & decay', bucket: 'math', prereqs: ['m-functions', 'm-exponents', 'm-percent'], gradeBand: 9, blurb: 'Repeated multiplication, growth factors, half-lives, and linear-vs-exponential models.' },
        { id: 'm-polyadvanced', name: 'Advanced polynomial structure', bucket: 'math', prereqs: ['m-polys', 'm-quadratic'], gradeBand: 11, blurb: 'Polynomial division, zeros and factors, identities, and graphs beyond quadratics.' },
        { id: 'm-rationalfunc', name: 'Rational expressions & functions', bucket: 'math', prereqs: ['m-functions', 'm-polyadvanced'], gradeBand: 11, blurb: 'Rewrite rational expressions and reason about restrictions, asymptotes, and rational-function models.' },
        { id: 'm-radicaleq', name: 'Radical & rational equations', bucket: 'math', prereqs: ['m-radicals', 'm-lineqmulti'], gradeBand: 11, blurb: 'Solve equations with roots or rational expressions and reject extraneous or forbidden solutions.' },
        { id: 'm-logarithms', name: 'Logarithms', bucket: 'math', prereqs: ['m-exponential'], gradeBand: 11, blurb: 'Use logarithms as inverse exponents, apply log properties, and solve exponential equations.' },
        { id: 'm-complex', name: 'Complex numbers', bucket: 'math', prereqs: ['m-quadratic'], gradeBand: 11, blurb: 'Compute with a + bi and solve real-coefficient quadratics whose roots are complex.' },
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
        { id: 'm-geoconstruct', name: 'Geometric construction & slicing', bucket: 'math', prereqs: ['m-angles'], gradeBand: 7, blurb: 'Reason from triangle side/angle conditions and identify plane slices of three-dimensional figures.' },
        { id: 'm-triangles', name: 'Triangles & Pythagorean theorem', bucket: 'math', prereqs: ['m-angles', 'm-roots'], gradeBand: 8, blurb: 'Right-triangle relationships and distance applications.' },
        { id: 'm-trig', name: 'Right-triangle trigonometry', bucket: 'math', prereqs: ['m-triangles'], gradeBand: 10, blurb: 'Sine, cosine, tangent as side ratios — the gateway into the high-school sequence.' },
        { id: 'm-transform', name: 'Transformations & similarity', bucket: 'math', prereqs: ['m-coord', 'm-proportion'], gradeBand: 8, blurb: 'Translations, reflections, rotations, dilations, and similar figures.' },
        { id: 'm-congruence', name: 'Congruence, constructions & proof', bucket: 'math', prereqs: ['m-transform', 'm-proof'], gradeBand: 10, blurb: 'Use rigid motions, triangle criteria, constructions, and theorem chains to prove figures congruent.' },
        { id: 'm-nonrighttrig', name: 'Trigonometry in general triangles', bucket: 'math', prereqs: ['m-trig', 'm-transform'], gradeBand: 10, blurb: 'Solve non-right triangles with the Laws of Sines and Cosines and explain when each applies.' },
        { id: 'm-trigfunctions', name: 'Trigonometric functions', bucket: 'math', prereqs: ['m-trig', 'm-functions'], gradeBand: 11, blurb: 'Use the unit circle, model periodic behavior, and apply fundamental trigonometric identities.' },
      ],
    },
    {
      id: 'u-measure',
      name: 'Area & volume',
      skills: [
        { id: 'm-area', name: 'Area & perimeter', bucket: 'math', prereqs: ['m-fractions'], gradeBand: 6, blurb: 'Rectangles, triangles, parallelograms, and composite figures.' },
        { id: 'm-circles', name: 'Circles', bucket: 'math', prereqs: ['m-area'], gradeBand: 7, blurb: 'Circumference and area; where π shows up and why.' },
        { id: 'm-volume', name: 'Volume & surface area', bucket: 'math', prereqs: ['m-area'], gradeBand: 7, blurb: 'Prisms, cylinders, and composite solids.' },
        { id: 'm-circleproof', name: 'Circle theorems', bucket: 'math', prereqs: ['m-circles', 'm-triangles', 'm-proof'], gradeBand: 10, blurb: 'Reason with chords, tangents, secants, inscribed angles, arcs, and sectors.' },
        { id: 'm-coordinategeometry', name: 'Coordinate geometry & proof', bucket: 'math', prereqs: ['m-linforms', 'm-triangles', 'm-proof'], gradeBand: 10, blurb: 'Use slope, distance, midpoint, and equations to prove geometric claims algebraically.' },
        { id: 'm-solidgeometry', name: 'Geometric measurement & solids', bucket: 'math', prereqs: ['m-volume', 'm-proof'], gradeBand: 10, blurb: 'Explain volume formulas, use Cavalieri-style reasoning, and connect solids to cross-sections and rotations.' },
        { id: 'm-conics', name: 'Conic sections', bucket: 'math', prereqs: ['m-quadratic', 'm-coord'], gradeBand: 10, blurb: 'Translate between geometric definitions and equations of circles and parabolas, then extend them in Algebra II.' },
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
        { id: 'p-waves', name: 'Waves & sound', bucket: 'physics', prereqs: ['p-motion', 'm-proportion'], gradeBand: 9, blurb: 'Frequency, wavelength, amplitude, and the relationship v = fλ.' },
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
        { id: 'c-complexity', name: 'Algorithmic complexity', bucket: 'coding', prereqs: ['c-algo', 'c-decomp'], gradeBand: 10, blurb: 'Compare how algorithms scale; distinguish constant, logarithmic, linear, and quadratic work.' },
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
        { id: 's-design', name: 'Experimental design', bucket: 'science', prereqs: ['s-hypo', 's-measure', 's-corr'], gradeBand: 9, blurb: 'Random assignment, blinding, replication, and designs that support causal conclusions.' },
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
    {
      /*
       * Seeing what is NOT there. Each of these is a specific, nameable way a
       * scene or a dataset can mislead someone who is looking carefully — which
       * is the Observer Lab's whole subject, extended past the single scene.
       */
      id: 'u-unseen',
      name: 'What is not in front of you',
      skills: [
        { id: 'o-selection', name: 'Who is missing from the data', bucket: 'observer', prereqs: ['o-obsinf'], gradeBand: 9, blurb: 'Survivors, volunteers and reviewers are not a random sample — find the filter before reading the result.' },
        { id: 'o-expect', name: 'What would I see if it were false?', bucket: 'observer', prereqs: ['o-obsinf'], gradeBand: 8, blurb: 'Evidence only counts when it would have looked different had the claim been wrong.' },
        { id: 'o-anchor', name: 'First numbers and first impressions', bucket: 'observer', prereqs: ['o-bias'], gradeBand: 9, blurb: 'Notice when an opening figure has quietly set the range you are arguing inside.' },
        { id: 'o-frame', name: 'Same fact, different framing', bucket: 'observer', prereqs: ['o-obsinf'], gradeBand: 8, blurb: 'Restate a claim in its opposite frame and check whether your reaction survives.' },
        /* CCSS RH.6-8.8 and RST.6-8.8: distinguish fact, reasoned judgment
         * based on findings, and speculation. A three-way classification with a
         * real key, and one of very few reasoning lines in US standards that a
         * machine can grade honestly. */
        { id: 'o-claimtype', name: 'Fact, judgement, or guess', bucket: 'observer', prereqs: ['o-obsinf'], gradeBand: 8, blurb: 'Sort a passage into what was measured, what was concluded from it, and what was simply supposed.' },
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
        { id: 'i-equilibrium', name: 'Best response & equilibrium', bucket: 'investigator', prereqs: ['i-game'], gradeBand: 9, blurb: 'Find each side\'s best reply and the stable point where neither wants to move.' },
        { id: 'i-commit', name: 'Commitment & bargaining', bucket: 'investigator', prereqs: ['i-equilibrium'], gradeBand: 10, blurb: 'Why removing your own options can win, and how repetition changes the game.' },
        { id: 'i-abduce', name: 'Best explanation', bucket: 'investigator', prereqs: ['i-hypo'], gradeBand: 9, blurb: 'Generate the explanations, then rank them by what they cover and what they assume.' },
      ],
    },
    {
      /*
       * Numbers under uncertainty, chosen for evidence rather than for looking
       * rigorous (RESEARCH.md §40).
       *
       * `i-natfreq`: counts out of a whole group, never bare percentages.
       * Meta-analysed at 24% correct vs 4% for the same problems written as
       * conditional probabilities (McDowell & Jacobs 2017, 35 articles) — and
       * the frequency TREE is what survives 15 weeks where the formula decays
       * from 86% to 50% (Sedlmeier & Gigerenzer 2001).
       *
       * `i-refclass`: the outside view. The one component of the Good Judgment
       * Project's training that correlated with actual forecasting accuracy
       * inside a randomised four-year tournament (Mellers 2014, Chang 2016).
       *
       * `i-samplesize`: the law of large numbers, taught as an abstract rule
       * plus worked examples across several unrelated settings. Fong, Krantz &
       * Nisbett (1986) found the improvement was as large in UNTAUGHT domains
       * as in taught ones — one of very few genuine domain-general results.
       */
      id: 'u-uncertainty',
      name: 'Numbers under uncertainty',
      skills: [
        { id: 'i-natfreq', name: 'Counting people, not percentages', bucket: 'investigator', prereqs: ['i-bayes'], gradeBand: 9, blurb: 'Rewrite any probability question as a count out of a group, and the hard ones stop being hard.' },
        { id: 'i-refclass', name: 'Reference classes & the outside view', bucket: 'investigator', prereqs: ['i-forecast'], gradeBand: 9, blurb: 'Before reasoning about this case, ask how similar cases actually turned out.' },
        { id: 'i-samplesize', name: 'How much a sample can tell you', bucket: 'investigator', prereqs: ['i-forecast'], gradeBand: 8, blurb: 'Small samples swing wildly. Know when a difference is a finding and when it is the sample size.' },
        { id: 'i-diagnostic', name: 'How much this evidence moves things', bucket: 'investigator', prereqs: ['i-natfreq'], gradeBand: 10, blurb: 'Evidence is only strong when it is much likelier under one explanation than the others.' },
        { id: 'i-conditional', name: 'If-then and what follows', bucket: 'investigator', prereqs: ['i-logic'], gradeBand: 9, blurb: 'Which check actually tests a rule, and which one only looks like it does.' },
        /*
         * The ONE place the app's reasoning content has a genuine, citable
         * standards hook. CCSS ELA RI.9-10.8 requires students to "identify
         * false statements and fallacious reasoning" outright, and RI.8.8 to
         * "recognize when irrelevant evidence is introduced". There is no
         * adopted K-12 reasoning standard beyond this; everything else in the
         * Paths is the app's own construction and says so.
         */
        { id: 'i-fallacy', name: 'Named ways an argument breaks', bucket: 'investigator', prereqs: ['i-logic'], gradeBand: 9, blurb: 'A closed list of specific, nameable faults — and the practice of finding which one is present.' },
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
    {
      id: 'u-choosing',
      name: 'Choosing under constraint',
      skills: [
        { id: 'st-tradeoff', name: 'Trade-offs & dominated options', bucket: 'strategist', prereqs: ['st-decomp'], gradeBand: 8, blurb: 'Drop the options that lose on every count, then trade what you want least for what you want most.' },
        { id: 'st-reversible', name: 'Reversibility & keeping options', bucket: 'strategist', prereqs: ['st-decomp'], gradeBand: 8, blurb: 'A cheap mistake you can undo is worth more than a careful one you cannot.' },
        { id: 'st-secondorder', name: 'And then what happens?', bucket: 'strategist', prereqs: ['st-premortem'], gradeBand: 9, blurb: 'Follow a plan past its first effect to what people do in response to it.' },
        { id: 'st-sunk', name: 'What is already spent', bucket: 'strategist', prereqs: ['st-ev'], gradeBand: 9, blurb: 'Decide from here forward. What it already cost cannot be recovered by continuing.' },
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
    {
      /*
       * Reading situations, still strictly DEFENSIVE. Every skill here is about
       * correcting your OWN reading of a situation — situation vs character,
       * assuming others share your view, hearing the interest under a demand.
       * None of it teaches reading other people for advantage, which the
       * founding brief rules out as content law.
       *
       * Attribution and projection are two of the three biases with the
       * clearest replicated training effects (Morewedge et al. 2015; Heerma van
       * Voss et al. 2025). Confirmation bias is deliberately NOT given its own
       * skill here: the 2025 meta-analysis of 54 RCTs singles it out as the one
       * education essentially fails to shift, and a skill the app cannot move
       * would be a promise it cannot keep.
       */
      id: 'u-reading',
      name: 'Reading situations honestly',
      skills: [
        { id: 'h-attribution', name: 'Situation or person?', bucket: 'insight', prereqs: ['h-emotion'], gradeBand: 8, blurb: 'We explain our own behaviour by circumstances and other people’s by character. Check which one the evidence supports.' },
        { id: 'h-projection', name: 'Assuming they see it as you do', bucket: 'insight', prereqs: ['h-emotion'], gradeBand: 8, blurb: 'Your own view feels like the obvious one. Estimate how many people actually share it.' },
        { id: 'h-interests', name: 'The interest under the position', bucket: 'insight', prereqs: ['h-emotion'], gradeBand: 9, blurb: 'What someone demands and what they need are different things — and only one of them is negotiable.' },
        { id: 'h-repair', name: 'Repair after it goes wrong', bucket: 'insight', prereqs: ['h-boundary'], gradeBand: 8, blurb: 'What an apology has to contain to actually work, and what turns one into a second injury.' },
      ],
    },
    {
      /*
       * Requested as "theory of mind / mentalizing". RESEARCH.md §42 explains at
       * length why that is NOT what this unit claims to train, and the short
       * version belongs here where the skills are defined.
       *
       * The training evidence people cite (Hofmann et al. 2016, g = .75) is on
       * children of mean age 63 months acquiring first-order false belief —
       * a milestone this app's learner passed a decade ago — and the Cochrane
       * review of ToM interventions found poor evidence that taught gains are
       * maintained or generalise at all. So none of these skills promises that
       * the learner will understand people better.
       *
       * What they teach is the EPISTEMICS of reading people: how reliable your
       * reading is, what actually improves it, and what only feels like it does.
       * That rests on Eyal, Steffel & Epley (2018), 25 experiments in which
       * being told to take someone's perspective did not improve accuracy,
       * sometimes worsened it, and raised confidence — while ASKING worked.
       *
       * Direction is content law, as everywhere in Insight. This is defence and
       * self-correction: it makes the learner doubt their own confident reads,
       * which is the opposite of a technique for reading people.
       */
      id: 'u-minds',
      name: 'Other minds, honestly',
      skills: [
        { id: 'h-mindread', name: 'How good is your read?', bucket: 'insight', prereqs: ['h-projection'], gradeBand: 9, blurb: 'Imagining someone’s point of view makes you more confident without making you more right. Know which moves actually help.' },
        { id: 'h-nested', name: 'What they think you think', bucket: 'insight', prereqs: ['h-mindread'], gradeBand: 9, blurb: 'Track a belief about a belief without losing the thread. This is nested logic wearing a social costume.' },
        { id: 'h-asking', name: 'Asking instead of guessing', bucket: 'insight', prereqs: ['h-mindread'], gradeBand: 9, blurb: 'The question that would settle it, phrased so it can actually be asked out loud.' },
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
        { id: 'x-stuck', name: 'Working while stuck', bucket: 'meta', prereqs: [], gradeBand: 7, blurb: 'Tell progress-that-feels-bad from genuinely stuck — and know what each one asks you to do.' },
      ],
    },
    {
      /*
       * The transfer unit. Every skill here is chosen because a controlled study
       * measured it moving to a NEW case, which is a much shorter list than the
       * one most learning apps work from (RESEARCH.md §40).
       *
       * `x-compare` is the load-bearing one: reading two surface-different cases
       * that share a structure and writing what they have in common transferred
       * 2-3x better than studying the same two cases separately, with an active
       * control holding the content identical (Gentner, Loewenstein & Thompson
       * 2003). Guided comparison beat a bare "compare these" 90% to 70%, which
       * is why the written comparison here is prompted rather than open.
       */
      id: 'u-transfer',
      name: 'Making it travel',
      skills: [
        { id: 'x-compare', name: 'Two cases, one structure', bucket: 'meta', prereqs: [], gradeBand: 8, blurb: 'Read two situations that look nothing alike, find what they share, and state the principle underneath.' },
        { id: 'x-transfer', name: 'Noticing when a method applies', bucket: 'meta', prereqs: ['x-compare'], gradeBand: 9, blurb: 'Most people are reminded of old problems by surface details. Practise being reminded by structure instead.' },
        { id: 'x-interleave', name: 'Mixing practice on purpose', bucket: 'meta', prereqs: ['x-learn'], gradeBand: 8, blurb: 'Why practice that jumps between problem types feels worse and works better.' },
        { id: 'x-desirable', name: 'Difficulty that helps', bucket: 'meta', prereqs: ['x-learn'], gradeBand: 8, blurb: 'Tell the effort that builds memory from the effort that just wastes time.' },
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
    {
      /*
       * Puzzle Lab had three skills carrying 49 templates, which is a whole
       * area of the app resting on almost no structure. These four are the
       * METHODS that puzzles teach, framed as skills in their own right —
       * never as a route to general intelligence, which the meta-analytic
       * record is clear does not follow from puzzle practice (Sala & Gobet
       * 2016/2017: effects collapse to nothing against active controls).
       */
      id: 'u-search',
      name: 'Search & structure',
      skills: [
        { id: 'z-invariant', name: 'Invariants & parity', bucket: 'puzzle', prereqs: ['z-deduce'], gradeBand: 8, blurb: 'Find the quantity that never changes, and a whole class of attempts is ruled out at once.' },
        { id: 'z-search', name: 'Systematic search & pruning', bucket: 'puzzle', prereqs: ['z-deduce'], gradeBand: 8, blurb: 'Order the possibilities so that checking one kills many, instead of guessing and restarting.' },
        { id: 'z-extremal', name: 'Start from the extreme case', bucket: 'puzzle', prereqs: ['z-deduce'], gradeBand: 9, blurb: 'The largest, smallest or first thing is often forced — and forces everything else.' },
        { id: 'z-sequence', name: 'Patterns & sequences', bucket: 'puzzle', prereqs: [], gradeBand: 7, blurb: 'Find the rule that generates a run, and check it against the case you did not use to find it.' },
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
