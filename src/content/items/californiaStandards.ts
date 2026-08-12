/**
 * California course-floor coverage.
 *
 * These original generators close topic gaps found by auditing the app against
 * the 2013 CA CCSSM course overviews and the 2023 California Mathematics
 * Framework. They are grouped by standards cluster, not by textbook chapter:
 * the planner can interleave them with the rest of the bank while each course
 * track guarantees that the cluster itself is present.
 */
import type { ItemTemplate } from '../../domain/types'
import { rint, rnz } from '../../engine/rng'
import { cycle, fracStr, fraction, mcq, mcqNoted, numeric, round, tpl } from '../lib'

// ---------------------------------------------------------------- Grade 6

const decimalOperations = tpl(
  { id: 'ca6-decimal-operations', name: 'Decimal operations in context', skillIds: ['m-decimals'], bucket: 'math', difficulty: 2, variants: 40, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const mode = cycle(seed, ['add', 'subtract', 'multiply', 'divide'] as const)
    if (mode === 'add' || mode === 'subtract') {
      const a = rint(rng, 120, 900) / 10
      const b = rint(rng, 10, Math.floor(a * 10) - 1) / 100
      const answer = round(mode === 'add' ? a + b : a - b, 2)
      return {
        title: 'Line up the value, not the digits',
        prompt: `A lab records **${a.toFixed(1)} mL** and then ${mode === 'add' ? `adds **${b.toFixed(2)} mL**` : `uses **${b.toFixed(2)} mL**`}. What is the ${mode === 'add' ? 'new total' : 'amount left'}, in mL?`,
        answer: numeric(answer, { tolerance: 0.005, unit: 'mL' }),
        hints: ['Line up decimal points so ones meet ones and hundredths meet hundredths.', `${a.toFixed(2)} ${mode === 'add' ? '+' : '−'} ${b.toFixed(2)}.`, `Worked path: **${answer} mL**.`],
        explanation: `${a.toFixed(2)} ${mode === 'add' ? '+' : '−'} ${b.toFixed(2)} = **${answer} mL**. Decimal places name value; lining up the decimal points preserves that value.`
      }
    }
    if (mode === 'multiply') {
      const a = rint(rng, 12, 49) / 10
      const b = rint(rng, 2, 8) / 10
      const answer = round(a * b, 2)
      return {
        title: 'Multiply measured amounts',
        prompt: `A small panel is **${a} m** by **${b} m**. What is its area, in square metres?`,
        answer: numeric(answer, { tolerance: 0.005, unit: 'm²' }),
        hints: ['Area is length × width.', `Compute ${Math.round(a * 10)} × ${Math.round(b * 10)}, then account for two decimal places.`, `Worked path: **${answer} m²**.`],
        explanation: `${a} × ${b} = **${answer} m²**. Estimating first catches a misplaced decimal: the answer must be smaller than ${a} because ${b} is below 1.`
      }
    }
    const divisor = rint(rng, 2, 9)
    const quotient = rint(rng, 12, 60) / 10
    const dividend = round(divisor * quotient, 1)
    return {
      title: 'Share a decimal amount',
      prompt: `A **${dividend} L** batch is split equally among **${divisor}** containers. How many litres go in each?`,
      answer: numeric(quotient, { tolerance: 0.005, unit: 'L' }),
      hints: ['Equal sharing means division.', `Divide the whole amount by the number of shares: ${dividend} ÷ ${divisor}.`, `Worked path: **${quotient} L**.`],
      explanation: `${dividend} ÷ ${divisor} = **${quotient} L**. Multiplying ${quotient} by ${divisor} rebuilds the full batch, which is the clean check.`
    }
  },
)

const introInequalitySolve = tpl(
  { id: 'ca6-inequality-solve', name: 'A whole set of solutions', skillIds: ['m-ineqintro'], bucket: 'math', difficulty: 2, variants: 36, minutes: 2 },
  (rng, seed) => {
    const add = rint(rng, 2, 12)
    const boundary = rint(rng, -5, 15)
    const inclusive = seed % 2 === 0
    const total = boundary + add
    return {
      title: 'Solve the inequality',
      prompt: `Solve **x + ${add} ${inclusive ? '≥' : '>'} ${total}**. What is the boundary value for x?`,
      answer: numeric(boundary),
      hints: ['Undo the addition on both sides.', `Subtract ${add}: x ${inclusive ? '≥' : '>'} ${total} − ${add}.`, `Boundary: **${boundary}**.`],
      explanation: `Subtracting ${add} from both sides gives **x ${inclusive ? '≥' : '>'} ${boundary}**. The boundary is ${boundary}; ${inclusive ? 'a closed point includes it' : 'an open point excludes it'}, and the arrow continues toward larger values.`
    }
  },
)

const introInequalityModel = tpl(
  { id: 'ca6-inequality-model', name: 'Constraint to inequality', skillIds: ['m-ineqintro'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const entry = rint(rng, 2, 8)
    const each = rint(rng, 2, 6)
    const count = rint(rng, 4, 10)
    const cap = entry + each * count
    const atMost = seed % 2 === 0
    const correct = `${entry} + ${each}x ${atMost ? '≤' : '≥'} ${cap}`
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, correct, [
      [`${entry} + ${each}x ${atMost ? '≥' : '≤'} ${cap}`, 'the direction reverses the meaning of the limit', 'misread'],
      [`${entry}x + ${each} ${atMost ? '≤' : '≥'} ${cap}`, 'the one-time amount and per-item amount have traded jobs', 'representation'],
      [`${entry} + ${each}x ${atMost ? '<' : '>'} ${cap}`, 'the strict sign wrongly excludes reaching the limit exactly', 'misread'],
    ])
    return {
      title: 'Write the limit',
      prompt: `A plan has a one-time cost of **${entry}** plus **${each}** per item x. The total must be **${atMost ? 'at most' : 'at least'} ${cap}**. Which inequality models it?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: ['Build the total first: one-time amount + rate × count.', `“${atMost ? 'At most' : 'At least'}” includes equality.`],
      explanation: `The total is ${entry} + ${each}x, and “${atMost ? 'at most' : 'at least'} ${cap}” means **${correct}**. An inequality models every allowed count, not just one answer.`
    }
  },
)

const variableTable = tpl(
  { id: 'ca6-variable-table', name: 'Equation, table, relationship', skillIds: ['m-variables'], bucket: 'math', difficulty: 2, variants: 32, minutes: 2 },
  (rng) => {
    const rate = rint(rng, 2, 9)
    const start = rint(rng, 0, 12)
    const x = rint(rng, 3, 10)
    const y = start + rate * x
    return {
      title: 'Fill the relationship table',
      prompt: `The relationship is **y = ${start} + ${rate}x**. A table row has x = **${x}**. What y belongs in that row?`,
      answer: numeric(y),
      hints: [`Replace x with ${x}.`, `${start} + ${rate}(${x}).`, `Worked path: **${y}**.`],
      explanation: `y = ${start} + ${rate}(${x}) = **${y}**. Each table row, graph point, and equation statement describes the same input-output relationship.`
    }
  },
)

const variableRoles = tpl(
  { id: 'ca6-variable-roles', name: 'What depends on what?', skillIds: ['m-variables'], bucket: 'math', difficulty: 2, variants: 4, minutes: 2, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { story: 'A taxi fare changes with the number of miles traveled.', independent: 'miles traveled', dependent: 'taxi fare' },
      { story: 'The height of a plant is recorded each week.', independent: 'weeks since planting', dependent: 'plant height' },
      { story: 'A tank drains as the pump runs longer.', independent: 'time the pump has run', dependent: 'water remaining' },
      { story: 'The total price changes with the number of tickets purchased.', independent: 'tickets purchased', dependent: 'total price' },
    ] as const)
    const correct = `${c.dependent} is dependent; ${c.independent} is independent`
    return {
      title: 'Name the variable roles',
      prompt: `${c.story} Which statement correctly names the variables?`,
      answer: mcq(rng, correct, [`${c.independent} is dependent; ${c.dependent} is independent`, 'Both variables are independent', 'Neither variable can be represented on a graph']),
      hints: ['The independent variable is the input chosen or observed first.', `Ask which quantity changes because ${c.independent} changes.`],
      explanation: `**${correct}.** The input goes on the horizontal axis; the output that responds goes on the vertical axis.`
    }
  },
)

// ---------------------------------------------------------------- Grade 7 and 8 geometry

const rationalOperationChain = tpl(
  { id: 'ca7-rational-operation-chain', name: 'Signed rational operation chain', skillIds: ['m-rationalops'], bucket: 'math', difficulty: 3, variants: 36, minutes: 2.5, transfer: true },
  (rng) => {
    const start = rnz(rng, 12)
    const change = rnz(rng, 9)
    const repeats = rint(rng, 2, 5)
    const answer = start + repeats * change
    return {
      title: 'Repeated signed change',
      prompt: `An account starts at **${start} credits** and changes by **${change} credits** on each of ${repeats} rounds. What is the final balance?`,
      answer: numeric(answer, { unit: 'credits' }),
      hints: ['Represent the repeated change with multiplication.', `${start} + ${repeats}(${change}).`, `Worked path: **${answer} credits**.`],
      explanation: `${repeats} changes of ${change} contribute ${repeats * change}; adding the starting ${start} gives **${answer} credits**. The sign belongs to the change before the multiplication happens.`
    }
  },
)

const triangleConstruction = tpl(
  { id: 'ca7-triangle-construction', name: 'Can these sides make a triangle?', skillIds: ['m-geoconstruct'], bucket: 'math', difficulty: 3, variants: 30, minutes: 2.5 },
  (rng, seed) => {
    const a = rint(rng, 3, 10)
    const b = rint(rng, 3, 10)
    const valid = seed % 3 !== 0
    const c = valid ? rint(rng, Math.abs(a - b) + 1, a + b - 1) : a + b + (seed % 2)
    const correct = valid ? 'Yes — one SSS triangle is determined' : 'No — the two shorter sides cannot meet'
    return {
      title: 'Triangle from three lengths',
      prompt: `You try to construct a triangle with side lengths **${a}, ${b}, and ${c}**. What happens?`,
      answer: mcq(rng, correct, valid ? ['No — the lengths are incompatible', 'Infinitely many noncongruent triangles are possible', 'Only a right triangle is possible'] : ['Yes — one SSS triangle is determined', 'Exactly two triangles are possible', 'Only an equilateral triangle is possible']),
      hints: ['For a triangle, each pair of sides must add to more than the third.', `Check the decisive comparison: ${Math.min(a, b, c)} plus the next side versus the longest side.`],
      explanation: `${valid ? `The two shorter lengths sum to more than the longest, so the segments close; three side lengths then fix one congruence class.` : `The two shorter lengths add to ${a + b}, which is not greater than ${c}, so they cannot bend enough to meet.`}`
    }
  },
)

const crossSection = tpl(
  { id: 'ca7-solid-cross-section', name: 'Slice the solid', skillIds: ['m-geoconstruct', 'm-solidgeometry'], bucket: 'math', difficulty: 3, variants: 6, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { solid: 'right circular cylinder', cut: 'parallel to its circular base', shape: 'circle' },
      { solid: 'right circular cylinder', cut: 'parallel to its axis', shape: 'rectangle' },
      { solid: 'rectangular prism', cut: 'parallel to one rectangular face', shape: 'rectangle' },
      { solid: 'square pyramid', cut: 'parallel to its base', shape: 'square' },
      { solid: 'cone', cut: 'parallel to its circular base', shape: 'circle' },
      { solid: 'sphere', cut: 'by any plane that intersects it', shape: 'circle' },
    ] as const)
    return {
      title: 'Cross-section',
      prompt: `A plane slices a **${c.solid}** ${c.cut}. What shape is the cross-section?`,
      answer: mcq(rng, c.shape, ['triangle', 'rectangle', 'circle', 'square'].filter((x) => x !== c.shape)),
      hints: ['Imagine the plane leaving a flat “stamp” where it passes through the solid.', `Keep the cut ${c.cut}.`],
      explanation: `The intersection is a **${c.shape}**. A cross-section records only the flat boundary made by the slicing plane, not the outline of the whole solid.`
    }
  },
)

const rigidVsDilation = tpl(
  { id: 'ca8-rigid-vs-dilation', name: 'Congruent or merely similar?', skillIds: ['m-transform'], bucket: 'math', difficulty: 3, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const scale = cycle(seed, [2, 3, 0.5, 1] as const)
    const rigid = scale === 1
    const correct = rigid ? 'Congruent — all lengths and angles are preserved' : 'Similar but not congruent — angles stay equal while lengths scale'
    return {
      title: 'What the transformation preserves',
      prompt: `A figure is translated, rotated, and then dilated by scale factor **${scale}**. How does the image compare with the original?`,
      answer: mcq(rng, correct, rigid ? ['Similar but not congruent — lengths change', 'Neither similar to it nor congruent with it', 'Congruent only if it began at the origin'] : ['Congruent — every transformation of this kind preserves length', 'Neither similar to it nor congruent with it', 'Congruent, because the corresponding angles all match']),
      hints: ['Translations and rotations are rigid motions.', `A dilation multiplies every length by ${scale}.`],
      explanation: `${rigid ? 'A scale factor of 1 changes no length, so the entire composition is rigid and the figures are congruent.' : `The dilation changes lengths by a factor of ${scale}, so the result remains similar but is not congruent.`}`
    }
  },
)

// ---------------------------------------------------------------- Algebra I

const piecewiseEvaluate = tpl(
  { id: 'ca-a1-piecewise-evaluate', name: 'Choose the rule, then evaluate', skillIds: ['m-piecewise'], bucket: 'math', difficulty: 3, variants: 36, minutes: 2.5 },
  (rng, seed) => {
    const cut = rint(rng, -3, 4)
    const x = seed % 2 === 0 ? cut - rint(rng, 0, 5) : cut + rint(rng, 1, 5)
    const a = rnz(rng, 4)
    const b = rint(rng, -6, 6)
    const c = rnz(rng, 5)
    const answer = x <= cut ? a * x + b : x * x + c
    return {
      title: 'Piecewise function',
      prompt: `f(x) = **${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}** when x ≤ ${cut}, and **x² ${c >= 0 ? '+' : '−'} ${Math.abs(c)}** when x > ${cut}. Find f(${x}).`,
      answer: numeric(answer),
      hints: [`First decide whether ${x} is ≤ ${cut} or > ${cut}.`, `Use only the ${x <= cut ? 'first' : 'second'} rule.`, `Worked path: **${answer}**.`],
      explanation: `${x} ${x <= cut ? 'is' : 'is not'} in the x ≤ ${cut} interval, so the ${x <= cut ? 'linear' : 'quadratic'} rule applies and gives **${answer}**. Evaluating both rules and choosing later is how boundary errors sneak in.`
    }
  },
)

const piecewiseContext = tpl(
  { id: 'ca-a1-piecewise-context', name: 'A rule that changes', skillIds: ['m-piecewise'], bucket: 'math', difficulty: 4, variants: 30, minutes: 3, transfer: true },
  (rng) => {
    const included = rint(rng, 2, 5)
    const base = rint(rng, 5, 15)
    const extra = rint(rng, 2, 6)
    const hours = included + rint(rng, 1, 5)
    const answer = base + extra * (hours - included)
    return {
      title: 'Tiered cost',
      prompt: `A rental costs **$${base}** for up to ${included} hours, then **$${extra} for each additional hour**. What does a ${hours}-hour rental cost?`,
      answer: numeric(answer, { unit: 'dollars' }),
      hints: [`The first ${included} hours are already inside the $${base} base price.`, `Only ${hours - included} hours use the extra rate.`, `Worked path: ${base} + ${extra}(${hours - included}) = **$${answer}**.`],
      explanation: `The piecewise rule switches after ${included} hours. There are ${hours - included} extra hours, so the cost is ${base} + ${extra}(${hours - included}) = **$${answer}**.`
    }
  },
)

const residual = tpl(
  { id: 'ca-a1-residual', name: 'Actual minus predicted', skillIds: ['m-hsdata'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5 },
  (rng) => {
    const slope = rint(rng, 2, 7)
    const intercept = rint(rng, 3, 15)
    const x = rint(rng, 2, 12)
    const predicted = slope * x + intercept
    const residualValue = rnz(rng, 8)
    const actual = predicted + residualValue
    return {
      title: 'Read a residual',
      prompt: `A model predicts y = **${slope}x + ${intercept}**. At x = ${x}, the observed y is **${actual}**. Using residual = observed − predicted, find the residual.`,
      answer: numeric(residualValue),
      hints: [`Prediction: ${slope}(${x}) + ${intercept} = ${predicted}.`, `Observed − predicted = ${actual} − ${predicted}.`, `Worked path: **${residualValue}**.`],
      explanation: `The prediction is ${predicted}; observed − predicted is ${actual} − ${predicted} = **${residualValue}**. A ${residualValue > 0 ? 'positive' : 'negative'} residual means the model ${residualValue > 0 ? 'underpredicted' : 'overpredicted'} this point.`
    }
  },
)

const standardDeviationCompare = tpl(
  { id: 'ca-a1-standard-deviation', name: 'Same center, different spread', skillIds: ['m-hsdata', 'm-variability'], bucket: 'math', difficulty: 4, variants: 24, minutes: 2.5, calibration: true },
  (rng) => {
    const mean = rint(rng, 10, 30)
    const small = rint(rng, 1, 3)
    const large = small + rint(rng, 3, 7)
    const a = [mean - small, mean, mean, mean, mean + small]
    const b = [mean - large, mean, mean, mean, mean + large]
    const correct = 'Set B — its values sit farther from the shared mean'
    return {
      title: 'Compare standard deviations',
      prompt: `Set A: **${a.join(', ')}**. Set B: **${b.join(', ')}**. Both have mean ${mean}. Which has the larger standard deviation?`,
      answer: mcq(rng, correct, ['Set A — it has the same mean', 'They have equal standard deviations because their means match', 'Cannot compare spread without changing the sample sizes']),
      hints: ['Standard deviation measures typical distance from the mean.', `Compare the outer values: ±${small} in A versus ±${large} in B.`],
      explanation: `**Set B** has the larger standard deviation because its noncentral values are ${large} away from the mean rather than ${small}. Equal means say nothing about equal spread.`
    }
  },
)

const twoWayConditional = tpl(
  { id: 'ca-hs-two-way-conditional', name: 'Condition changes the denominator', skillIds: ['m-hsdata', 'm-conditionalprob'], bucket: 'math', difficulty: 4, variants: 36, minutes: 3, transfer: true },
  (rng) => {
    const inGroupYes = rint(rng, 12, 40)
    const inGroupNo = rint(rng, 8, 35)
    const outsideYes = rint(rng, 10, 40)
    const outsideNo = rint(rng, 10, 40)
    const totalGroup = inGroupYes + inGroupNo
    const pct = round((100 * inGroupYes) / totalGroup, 1)
    return {
      title: 'Read a two-way table conditionally',
      prompt: `A table records: club members — ${inGroupYes} chose yes, ${inGroupNo} chose no; nonmembers — ${outsideYes} yes, ${outsideNo} no. Among **club members**, what percent chose yes?`,
      answer: numeric(pct, { tolerance: 0.05, unit: '%' }),
      hints: ['“Among club members” restricts the denominator to the club-member row.', `Use ${inGroupYes}/(${inGroupYes} + ${inGroupNo}).`, `Worked path: **${pct}%**.`],
      explanation: `Conditioning on membership leaves ${totalGroup} people in the denominator, so P(yes | member) = ${inGroupYes}/${totalGroup} = **${pct}%**. Using everyone would answer a different question.`
    }
  },
)

// ---------------------------------------------------------------- Geometry

const congruenceCriterion = tpl(
  { id: 'ca-geo-congruence-criterion', name: 'Enough information for congruence?', skillIds: ['m-congruence'], bucket: 'math', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { facts: 'all three pairs of corresponding sides are equal', result: 'SSS proves the triangles congruent', valid: true },
      { facts: 'two sides and the included angle are equal', result: 'SAS proves the triangles congruent', valid: true },
      { facts: 'two angles and any corresponding side are equal', result: 'AAS/ASA proves the triangles congruent', valid: true },
      { facts: 'two sides and a non-included angle are equal', result: 'SSA is not a general congruence criterion', valid: false },
    ] as const)
    return {
      title: 'Triangle congruence evidence',
      prompt: `Two triangles have this information: **${c.facts}**. What can you conclude?`,
      answer: mcq(rng, c.result, c.valid ? ['SSA is the only valid reason', 'The triangles must be similar but never congruent', 'No conclusion is possible from side or angle data'] : ['SAS proves the triangles congruent', 'SSS proves the triangles congruent', 'Equal angles force equal size']),
      hints: ['A valid criterion must rule out every second shape.', c.valid ? 'Match the facts to SSS, SAS, ASA, AAS, or HL.' : 'Try swinging the unfixed side: can two different triangles fit?'],
      explanation: `**${c.result}.** Congruence criteria are compressed proofs: each names exactly enough measurements to force one size and shape.`
    }
  },
)

const congruenceRigidMotion = tpl(
  { id: 'ca-geo-rigid-motion-proof', name: 'Congruence through rigid motion', skillIds: ['m-congruence'], bucket: 'math', difficulty: 4, variants: 3, minutes: 3, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { move: 'reflection across the y-axis followed by a translation', conclusion: 'Congruent, because both moves preserve distance and angle' },
      { move: 'a 90° rotation followed by a translation', conclusion: 'Congruent, because both moves preserve distance and angle' },
      { move: 'a dilation by 2 followed by a rotation', conclusion: 'Similar but not congruent, because the dilation changes every length' },
    ] as const)
    return {
      title: 'Rigid-motion argument',
      prompt: `Figure B is obtained from Figure A by **${c.move}**. Which conclusion is justified?`,
      answer: mcq(rng, c.conclusion, ['Congruent only if both figures cross the origin', 'Neither similar to it nor congruent with it because the position changed', 'Congruent because every transformation preserves length'].filter((x) => x !== c.conclusion)),
      hints: ['A rigid motion preserves all distances and angle measures.', 'A dilation is rigid only when its scale factor is 1.'],
      explanation: `**${c.conclusion}.** The proof rests on what each transformation preserves, not on how the picture happens to look.`
    }
  },
)

const inscribedAngle = tpl(
  { id: 'ca-geo-inscribed-angle', name: 'Inscribed angle theorem', skillIds: ['m-circleproof'], bucket: 'math', difficulty: 4, variants: 30, minutes: 2.5 },
  (rng, seed) => {
    const inscribed = rint(rng, 15, 80)
    const askArc = seed % 2 === 0
    const answer = askArc ? 2 * inscribed : inscribed
    const arc = 2 * inscribed
    return {
      title: 'Angle on a circle',
      prompt: askArc ? `An inscribed angle measures **${inscribed}°**. What is the measure of its intercepted arc?` : `An arc measures **${arc}°**. What is the inscribed angle that intercepts it?`,
      answer: numeric(answer, { unit: 'degrees' }),
      hints: ['An inscribed angle is half its intercepted arc.', askArc ? 'Reverse the half by multiplying by 2.' : 'Divide the arc measure by 2.', `Worked path: **${answer}°**.`],
      explanation: `The inscribed-angle theorem gives angle = arc/2, so the requested measure is **${answer}°**. The corresponding central angle would equal the full arc measure.`
    }
  },
)

const tangentLength = tpl(
  { id: 'ca-geo-tangent-radius', name: 'Radius meets tangent', skillIds: ['m-circleproof'], bucket: 'math', difficulty: 4, variants: 4, minutes: 3, transfer: true },
  (rng) => {
    const k = rint(rng, 1, 6)
    const radius = 3 * k
    const tangent = 4 * k
    const centerDistance = 5 * k
    return {
      title: 'Tangent from an outside point',
      prompt: `A point is **${centerDistance} cm** from a circle's center. The circle's radius is **${radius} cm**. A tangent segment runs from the point to the circle. How long is it?`,
      answer: numeric(tangent, { unit: 'cm' }),
      hints: ['A radius to a tangent point is perpendicular to the tangent.', `The radius and tangent are legs; ${centerDistance} is the hypotenuse.`, `Worked path: √(${centerDistance}² − ${radius}²) = **${tangent} cm**.`],
      explanation: `The radius-tangent right angle gives t² + ${radius}² = ${centerDistance}², so t = **${tangent} cm**. The theorem creates the right triangle; the Pythagorean theorem finishes it.`
    }
  },
)

const coordinateSlopeProof = tpl(
  { id: 'ca-geo-coordinate-slope-proof', name: 'Prove a line relationship with slope', skillIds: ['m-coordinategeometry'], bucket: 'math', difficulty: 4, variants: 8, minutes: 3 },
  (rng, seed) => {
    const m = rnz(rng, 4)
    const perpendicular = seed % 2 === 0
    const secondLabel = perpendicular ? fracStr(-1, m) : String(m)
    const correct = perpendicular ? 'Perpendicular — the slopes are negative reciprocals' : 'Parallel — the slopes are equal'
    return {
      title: 'Coordinate proof by slope',
      prompt: `Line ℓ has slope **${m}**. Line n has slope **${secondLabel}**. What relationship is proved?`,
      answer: mcq(rng, correct, perpendicular ? ['Parallel — the two slopes have opposite signs', 'Neither — slopes on their own cannot prove an angle', 'Coincident — every single point is shared between them'] : ['Perpendicular — equal slopes form a right angle', 'Neither — slopes cannot prove parallel lines', 'The lines must intersect at the origin']),
      hints: ['Parallel nonvertical lines have equal slopes.', 'Perpendicular nonvertical lines have slopes whose product is −1.'],
      explanation: `The slopes ${perpendicular ? `multiply to ${m}(${secondLabel}) = −1` : 'are equal'}, so the lines are **${perpendicular ? 'perpendicular' : 'parallel'}**. This is an algebraic proof of a geometric relationship.`
    }
  },
)

const coordinateDiagonalProof = tpl(
  { id: 'ca-geo-coordinate-diagonals', name: 'Prove diagonals bisect', skillIds: ['m-coordinategeometry'], bucket: 'math', difficulty: 5, variants: 30, minutes: 3 },
  (rng) => {
    const x = rint(rng, -6, 3)
    const y = rint(rng, -6, 3)
    const w = rint(rng, 2, 8)
    const h = rint(rng, 2, 8)
    const midpoint = `(${x + w / 2}, ${y + h / 2})`
    const correct = `Both diagonals have midpoint ${midpoint}, so they bisect each other`
    return {
      title: 'Coordinate parallelogram proof',
      prompt: `A quadrilateral has vertices A(${x}, ${y}), B(${x + w}, ${y}), C(${x + w}, ${y + h}), D(${x}, ${y + h}). Which calculation proves its diagonals bisect each other?`,
      answer: mcq(rng, correct, [`Both diagonals have slope ${round(h / w, 2)}, so they are parallel`, `All four vertices have different coordinates, so the figure is a parallelogram`, `The diagonal lengths add to ${round(2 * Math.sqrt(w * w + h * h), 2)}, so they are perpendicular`]),
      hints: ['Segments bisect each other when they share the same midpoint.', 'Compute the midpoint of AC and of BD separately.'],
      explanation: `Midpoint AC = midpoint BD = **${midpoint}**, so each diagonal cuts the other in half. Matching midpoints proves bisection directly.`
    }
  },
)

const lawOfCosines = tpl(
  { id: 'ca-geo-law-cosines', name: 'Law of Cosines', skillIds: ['m-nonrighttrig'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3 },
  (rng) => {
    const a = rint(rng, 3, 10)
    const b = rint(rng, 3, 10)
    const cSquared = a * a + b * b - a * b // cos 60 = 1/2
    return {
      title: 'Two sides and the included angle',
      prompt: `A triangle has sides a = **${a}**, b = **${b}**, with included angle C = **60°**. By c² = a² + b² − 2ab cos C, what is **c²**?`,
      answer: numeric(cSquared),
      hints: ['cos 60° = 1/2.', `The final term becomes 2(${a})(${b})(1/2) = ${a * b}.`, `Worked path: **${cSquared}**.`],
      explanation: `c² = ${a * a} + ${b * b} − ${a * b} = **${cSquared}**. The Law of Cosines is the Pythagorean theorem with an angle correction; at 90°, the correction becomes zero.`
    }
  },
)

const lawOfSines = tpl(
  { id: 'ca-geo-law-sines', name: 'Law of Sines', skillIds: ['m-nonrighttrig'], bucket: 'math', difficulty: 5, variants: 16, minutes: 3, transfer: true },
  (rng, seed) => {
    const a = rint(rng, 4, 12)
    const A = cycle(seed, [30, 45, 60] as const)
    const B = cycle(seed + 1, [45, 60, 90] as const)
    const b = round((a * Math.sin((B * Math.PI) / 180)) / Math.sin((A * Math.PI) / 180), 2)
    return {
      title: 'An opposite pair unlocks the triangle',
      prompt: `In a triangle, side a = **${a}** is opposite A = **${A}°**. Angle B = **${B}°**. Using a/sin A = b/sin B, find b to the nearest hundredth.`,
      answer: numeric(b, { tolerance: 0.01 }),
      hints: [`b = ${a}·sin(${B}°)/sin(${A}°).`, 'Keep full calculator values until the final rounding.', `Worked path: **${b}**.`],
      explanation: `b = ${a} sin(${B}°)/sin(${A}°) = **${b}**. The Law of Sines works because one known side-angle opposite pair fixes the scale of the whole triangle.`
    }
  },
)

// ---------------------------------------------------------------- Algebra II

const complexAdd = tpl(
  { id: 'ca-a2-complex-add', name: 'Combine complex parts', skillIds: ['m-complex'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2 },
  (rng, seed) => {
    const a = rnz(rng, 9)
    const b = rnz(rng, 9)
    const c = rnz(rng, 9)
    const d = rnz(rng, 9)
    const subtract = seed % 2 === 0
    const imag = subtract ? b - d : b + d
    return {
      title: 'Real with real, imaginary with imaginary',
      prompt: `For (${a} + ${b}i) ${subtract ? '−' : '+'} (${c} + ${d}i), what is the coefficient of i in simplified form?`,
      answer: numeric(imag),
      hints: ['Treat i terms as like terms.', `Combine only the i coefficients: ${b} ${subtract ? '−' : '+'} ${d}.`, `Worked path: **${imag}**.`],
      explanation: `The imaginary parts combine independently: ${b} ${subtract ? '−' : '+'} ${d} = **${imag}**, so the coefficient of i is ${imag}.`
    }
  },
)

const complexMultiply = tpl(
  { id: 'ca-a2-complex-multiply', name: 'Multiply with i² = −1', skillIds: ['m-complex'], bucket: 'math', difficulty: 4, variants: 36, minutes: 3 },
  (rng) => {
    const a = rnz(rng, 6)
    const b = rnz(rng, 6)
    const c = rnz(rng, 6)
    const d = rnz(rng, 6)
    const real = a * c - b * d
    return {
      title: 'Complex product',
      prompt: `Multiply (${a} + ${b}i)(${c} + ${d}i). What is the **real part** of the result?`,
      answer: numeric(real),
      hints: ['Distribute all four products.', `The real terms are ${a * c} + ${b * d}i².`, `Since i² = −1, real part = **${real}**.`],
      explanation: `(${a} + ${b}i)(${c} + ${d}i) has real part ac − bd = ${a * c} − ${b * d} = **${real}**. Replacing i² with −1 is the step that brings the product back to a + bi form.`
    }
  },
)

const polynomialRemainder = tpl(
  { id: 'ca-a2-polynomial-remainder', name: 'Remainder theorem', skillIds: ['m-polyadvanced'], bucket: 'math', difficulty: 4, variants: 40, minutes: 3 },
  (rng) => {
    const a = rnz(rng, 5)
    const b = rint(rng, -8, 8)
    const c = rint(rng, -8, 8)
    const d = rint(rng, -8, 8)
    const x = rnz(rng, 4)
    const remainder = a * x ** 3 + b * x ** 2 + c * x + d
    return {
      title: 'Remainder without long division',
      prompt: `What is the remainder when p(x) = **${a}x³ ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x² ${c >= 0 ? '+' : '−'} ${Math.abs(c)}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}** is divided by (x ${x >= 0 ? '−' : '+'} ${Math.abs(x)})?`,
      answer: numeric(remainder),
      hints: ['The Remainder Theorem says the remainder on division by x − a is p(a).', `Substitute x = ${x}.`, `Worked path: **${remainder}**.`],
      explanation: `The divisor is x − (${x}), so the remainder is p(${x}) = **${remainder}**. A zero remainder would also prove that x − (${x}) is a factor.`
    }
  },
)

const polynomialDivision = tpl(
  { id: 'ca-a2-polynomial-division', name: 'Divide a polynomial by a factor', skillIds: ['m-polyadvanced'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3.5, transfer: true },
  (rng) => {
    const r = rnz(rng, 5)
    const b = rnz(rng, 6)
    const c = rnz(rng, 8)
    // (x-r)(x²+bx+c) = x³ + (b-r)x² + (c-rb)x - rc
    const q2 = b - r
    const q1 = c - r * b
    const q0 = -r * c
    return {
      title: 'Recover the quotient',
      prompt: `Divide **x³ ${q2 >= 0 ? '+' : '−'} ${Math.abs(q2)}x² ${q1 >= 0 ? '+' : '−'} ${Math.abs(q1)}x ${q0 >= 0 ? '+' : '−'} ${Math.abs(q0)}** by **x ${r >= 0 ? '−' : '+'} ${Math.abs(r)}**. The quotient is x² + ${b}x + c. What is c?`,
      answer: numeric(c),
      hints: ['Use synthetic division with the zero of the divisor.', `The zero is ${r}; bring down 1 and repeat multiply-add.`, `The quotient is x² + ${b}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}, so c = **${c}**.`],
      explanation: `Synthetic or long division gives quotient x² + ${b}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}, so **c = ${c}**. Multiplying the quotient by the divisor reconstructs the original polynomial and verifies every coefficient.`
    }
  },
)

const rationalRestriction = tpl(
  { id: 'ca-a2-rational-restriction', name: 'Simplify without losing the hole', skillIds: ['m-rationalfunc'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5 },
  (rng) => {
    const excluded = rnz(rng, 7)
    const b = rnz(rng, 7)
    return {
      title: 'A canceled factor still matters',
      prompt: `The expression ((x ${excluded >= 0 ? '−' : '+'} ${Math.abs(excluded)})(x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}))/(x ${excluded >= 0 ? '−' : '+'} ${Math.abs(excluded)}) simplifies algebraically. Which x-value must still be excluded from its domain?`,
      answer: numeric(excluded),
      hints: ['Use the ORIGINAL denominator to find restrictions.', `A denominator cannot equal zero: x − (${excluded}) ≠ 0.`, `Excluded value: **${excluded}**.`],
      explanation: `The factor cancels only where it was defined. At x = **${excluded}**, the original denominator is zero, so the simplified graph has a hole there.`
    }
  },
)

const rationalAsymptote = tpl(
  { id: 'ca-a2-rational-asymptote', name: 'End behavior from leading terms', skillIds: ['m-rationalfunc'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3 },
  (rng) => {
    const a = rnz(rng, 8)
    const c = rnz(rng, 8)
    const b = rint(rng, -9, 9)
    const d = rint(rng, -9, 9)
    return {
      title: 'Horizontal asymptote',
      prompt: `For f(x) = (${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)})/(${c}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}), what is the horizontal asymptote y = ?`,
      answer: fraction(a, c),
      hints: ['The numerator and denominator have the same degree.', `Compare leading coefficients: ${a}/${c}.`, `Worked path: y = **${a}/${c}**.`],
      explanation: `For very large |x|, the lower-degree constants matter less and the ratio approaches ${a}x/${c}x = **${a}/${c}**. That leading-coefficient ratio is the horizontal asymptote.`
    }
  },
)

const radicalEquation = tpl(
  { id: 'ca-a2-radical-equation', name: 'Solve and check a radical equation', skillIds: ['m-radicaleq'], bucket: 'math', difficulty: 4, variants: 4, minutes: 3 },
  (rng) => {
    const root = rint(rng, 2, 9)
    const inside = root * root - root
    return {
      title: 'Squaring can create a fake answer',
      prompt: `Solve **√(x + ${inside}) = x**. What is the valid real solution?`,
      answer: numeric(root),
      hints: ['The right side must be nonnegative.', `Square: x + ${inside} = x², then factor.`, `Check candidates in the ORIGINAL equation; valid solution: **${root}**.`],
      explanation: `Squaring gives x² − x − ${inside} = 0 = (x − ${root})(x + ${root - 1}). The negative candidate ${1 - root} cannot equal a square root, while x = **${root}** checks in the original equation.`
    }
  },
)

const rationalEquation = tpl(
  { id: 'ca-a2-rational-equation', name: 'Solve with a forbidden value', skillIds: ['m-radicaleq'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3 },
  (rng) => {
    const excluded = rnz(rng, 6)
    let solution = rnz(rng, 8)
    while (solution === excluded) solution = rnz(rng, 8)
    const multiple = cycle(solution, [2, 3, -2] as const)
    const add = multiple * (solution - excluded) - solution
    return {
      title: 'Rational equation with a domain check',
      prompt: `Solve **(x ${add >= 0 ? '+' : '−'} ${Math.abs(add)})/(x ${excluded >= 0 ? '−' : '+'} ${Math.abs(excluded)}) = ${multiple}**. What is x?`,
      answer: numeric(solution),
      hints: [`First record the forbidden value x ≠ ${excluded}.`, 'Multiply both sides by the denominator, then solve the linear equation.', `Check the result is allowed: **x = ${solution}**.`],
      explanation: `Cross-multiplying gives x + (${add}) = ${multiple}(x − (${excluded})), whose solution is **${solution}**. Since ${solution} ≠ ${excluded}, it does not zero the original denominator and is valid.`
    }
  },
)

const logarithmSolve = tpl(
  { id: 'ca-a2-log-equation', name: 'Solve for an exponent', skillIds: ['m-logarithms'], bucket: 'math', difficulty: 4, variants: 30, minutes: 2.5 },
  (rng) => {
    const base = cycle(rint(rng, 0, 2), [2, 3, 5] as const)
    const a = rnz(rng, 4)
    const solution = rnz(rng, 6)
    const b = rint(rng, -5, 5)
    const exponent = a * solution + b
    return {
      title: 'Equal bases expose the exponent',
      prompt: `Solve **${base}^(${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}) = ${base}^${exponent}**. What is x?`,
      answer: numeric(solution),
      hints: ['A one-to-one exponential function gives equal outputs only from equal exponents.', `${a}x + (${b}) = ${exponent}.`, `Worked path: **${solution}**.`],
      explanation: `Because the positive base ${base} is not 1, set exponents equal: ${a}x + (${b}) = ${exponent}, giving **x = ${solution}**. Logarithms extend this same inverse move when the other side cannot be written with a matching base.`
    }
  },
)

const unitCircle = tpl(
  { id: 'ca-a2-unit-circle', name: 'Unit-circle coordinates', skillIds: ['m-trigfunctions'], bucket: 'math', difficulty: 4, variants: 8, minutes: 2.5 },
  (_rng, seed) => {
    const angle = cycle(seed, [0, 30, 45, 60, 90, 120, 180, 270] as const)
    const askSin = seed % 2 === 0
    const raw = askSin ? Math.sin((angle * Math.PI) / 180) : Math.cos((angle * Math.PI) / 180)
    const answer = round(Math.abs(raw) < 1e-10 ? 0 : raw, 3)
    return {
      title: 'Read the unit circle',
      prompt: `On the unit circle, what is **${askSin ? 'sin' : 'cos'}(${angle}°)**? Give a decimal to the nearest thousandth if needed.`,
      answer: numeric(answer, { tolerance: 0.001 }),
      hints: ['A unit-circle point has coordinates (cos θ, sin θ).', `Locate ${angle}° and read the ${askSin ? 'y' : 'x'}-coordinate.`, `Worked path: **${answer}**.`],
      explanation: `At ${angle}°, the ${askSin ? 'y' : 'x'}-coordinate is **${answer}**, so ${askSin ? 'sin' : 'cos'}(${angle}°) = ${answer}. The unit circle extends trigonometry beyond acute triangle angles.`
    }
  },
)

const periodicModel = tpl(
  { id: 'ca-a2-periodic-model', name: 'Read a sinusoidal model', skillIds: ['m-trigfunctions'], bucket: 'math', difficulty: 5, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    const midline = rint(rng, 5, 25)
    const amplitude = rint(rng, 2, 9)
    const period = cycle(seed, [6, 8, 12, 24] as const)
    const askPeriod = seed % 2 === 0
    return {
      title: 'Periodic behavior',
      prompt: `A cycle is modeled by y = **${midline} + ${amplitude} sin(2πt/${period})**. What is the ${askPeriod ? 'period' : 'amplitude'}?`,
      answer: numeric(askPeriod ? period : amplitude),
      hints: [askPeriod ? 'In sin(2πt/P), P is one full period.' : 'The coefficient outside sine is the distance from midline to peak.', `Read it directly from ${askPeriod ? `the denominator under 2πt` : 'the sine coefficient'}.`, `Answer: **${askPeriod ? period : amplitude}**.`],
      explanation: `The model has midline ${midline}, amplitude ${amplitude}, and period ${period}. Therefore the requested ${askPeriod ? 'period' : 'amplitude'} is **${askPeriod ? period : amplitude}**.`
    }
  },
)

const circleEquation = tpl(
  { id: 'ca-a2-conic-circle', name: 'Read a circle equation', skillIds: ['m-conics'], bucket: 'math', difficulty: 3, variants: 30, minutes: 2 },
  (rng) => {
    const h = rnz(rng, 7)
    const k = rnz(rng, 7)
    const radius = rint(rng, 2, 12)
    return {
      title: 'Circle in standard form',
      prompt: `For **(x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² + (y ${k >= 0 ? '−' : '+'} ${Math.abs(k)})² = ${radius * radius}**, what is the radius?`,
      answer: numeric(radius),
      hints: ['Circle form is (x − h)² + (y − k)² = r².', `Here r² = ${radius * radius}.`, `Worked path: r = **${radius}**.`],
      explanation: `The right side is r² = ${radius * radius}, so the radius is **${radius}**. The center is (${h}, ${k}); the signs inside each square are opposite the center coordinates.`
    }
  },
)

const parabolaFocus = tpl(
  { id: 'ca-a2-conic-parabola', name: 'Parabola from focus geometry', skillIds: ['m-conics'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3 },
  (rng) => {
    const h = rint(rng, -6, 6)
    const k = rint(rng, -6, 6)
    const p = rnz(rng, 5)
    const focusY = k + p
    return {
      title: 'Focus of a vertical parabola',
      prompt: `A parabola has equation **(x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})² = ${4 * p}(y ${k >= 0 ? '−' : '+'} ${Math.abs(k)})**. What is the y-coordinate of its focus?`,
      answer: numeric(focusY),
      hints: ['Compare with (x − h)² = 4p(y − k).', `Here p = ${p}; the focus is (h, k + p).`, `Worked path: ${k} + (${p}) = **${focusY}**.`],
      explanation: `The equation gives vertex (${h}, ${k}) and p = ${p}. A vertical parabola's focus is (h, k + p), so its y-coordinate is **${focusY}**.`
    }
  },
)

const inferenceDesign = tpl(
  { id: 'ca-a2-inference-design', name: 'What conclusion can the design support?', skillIds: ['m-inference'], bucket: 'math', difficulty: 4, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { design: 'randomly assign volunteers to two study methods, then compare test scores', conclusion: 'A difference can support a causal claim for people like the volunteers' },
      { design: 'survey a random sample of all students about commute time', conclusion: 'The result can estimate commute time for the student population' },
      { design: 'compare students who chose music class with those who did not', conclusion: 'An association may be described, but self-selection blocks a causal claim' },
      { design: 'post an optional poll link on a sports fan page', conclusion: 'The result describes respondents, not all fans, because the sample self-selected' },
    ] as const)
    return {
      title: 'Design licenses the conclusion',
      prompt: `A study will **${c.design}**. Which conclusion is justified?`,
      answer: mcq(rng, c.conclusion, ['The result proves causation for every person', 'Any numerical difference automatically represents the full population', 'No conclusion of any kind can be drawn'].filter((x) => x !== c.conclusion)),
      hints: ['Random sampling supports generalization; random assignment supports causal comparison.', 'Check separately who was selected and how treatments were assigned.'],
      explanation: `**${c.conclusion}.** The strength of an inference comes from the data-collection design, not from how impressive the difference looks.`
    }
  },
)

const inferenceSimulation = tpl(
  { id: 'ca-a2-inference-simulation', name: 'Use randomization to test a claim', skillIds: ['m-inference'], bucket: 'math', difficulty: 5, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    const trials = cycle(seed, [100, 200, 500, 1000] as const)
    const atLeast = rint(rng, 1, Math.max(2, Math.floor(trials * 0.08)))
    const pct = round((100 * atLeast) / trials, 1)
    const rare = pct <= 5
    const correct = rare
      ? 'The observed difference would be unusual under chance alone, so it is evidence against the chance model'
      : 'The observed difference is not unusual under chance alone, so this is not strong evidence against that model'
    return {
      title: 'Read a randomization simulation',
      prompt: `Under a chance-only model, a simulation produced a difference at least as large as the observed one in **${atLeast} of ${trials} trials (${pct}%)**. What is the careful interpretation?`,
      answer: mcq(rng, correct, rare ? ['Chance as an explanation has now been proved to be impossible by the results of the simulation', 'The treatment demonstrably works for every single individual person in the study', 'The simulation proves that all of the original measurements were recorded correctly'] : ['The result proves that there really is an effect here, because the two observed groups differed', 'Chance has now been proved to be the one true explanation of what was seen here', 'A sample of that size automatically creates a causal conclusion all on its own here']),
      hints: ['Ask how often the chance-only model produced a result this extreme.', 'Rare under the model is evidence against it; common under the model is not.'],
      explanation: `**${correct}.** A simulation measures compatibility with a specified chance model; it does not by itself prove causation, universalize to a population, or make chance literally impossible.`
    }
  },
)

export const CALIFORNIA_STANDARDS_TEMPLATES: ItemTemplate[] = [
  decimalOperations,
  introInequalitySolve,
  introInequalityModel,
  variableTable,
  variableRoles,
  rationalOperationChain,
  triangleConstruction,
  crossSection,
  rigidVsDilation,
  piecewiseEvaluate,
  piecewiseContext,
  residual,
  standardDeviationCompare,
  twoWayConditional,
  congruenceCriterion,
  congruenceRigidMotion,
  inscribedAngle,
  tangentLength,
  coordinateSlopeProof,
  coordinateDiagonalProof,
  lawOfCosines,
  lawOfSines,
  complexAdd,
  complexMultiply,
  polynomialRemainder,
  polynomialDivision,
  rationalRestriction,
  rationalAsymptote,
  radicalEquation,
  rationalEquation,
  logarithmSolve,
  unitCircle,
  periodicModel,
  circleEquation,
  parabolaFocus,
  inferenceDesign,
  inferenceSimulation,
]
