/**
 * Algebra 1 core depth — the problem kinds every major source assigns.
 *
 * Modeled on the consensus core across Khan Academy's Algebra 1 units, the
 * AoPS Introduction to Algebra chapters, and CPM Core Connections Algebra
 * (docs/RESEARCH.md §25): systems by every method with the classic word-problem
 * genres, function notation/domain/rate-of-change/inverses, sequences in both
 * explicit and recursive form, exponential model building, compound
 * inequalities, and parameter ("find k") reasoning.
 *
 * All problems original; every answer computed. Distractors encode the
 * DOCUMENTED mal-rules where the literature names them (transposition slips,
 * flip omission, off-by-one in (n−1), factor-vs-rate confusions) — the point
 * of a wrong option is to catch a real habit, not to fill space.
 */
import { rint, rnz } from '../../engine/rng'
import type { ItemTemplate } from '../../domain/types'
import { cycle, fraction, mcq, mcqNoted, numeric, tpl } from '../lib'

// ---------------------------------------------------------------- systems

const sysElimination = tpl(
  { id: 'sys-elimination', name: 'Eliminate a variable', skillIds: ['m-systems'], bucket: 'math', difficulty: 3, variants: 40, minutes: 3 },
  (rng, seed) => {
    const x = rnz(rng, 6)
    const y = rnz(rng, 6)
    const a1 = rint(rng, 2, 5)
    const b1 = rnz(rng, 4)
    const mult = rint(rng, 2, 3)
    // Second equation shares the x-coefficient scaled, so subtracting after one
    // multiplication kills x — the canonical one-multiplier elimination.
    const a2 = a1 * mult
    let b2 = rnz(rng, 5)
    if (b2 === b1 * mult) b2 = b2 === 4 ? 5 : b2 + 1 // keep the system independent
    const c1 = a1 * x + b1 * y
    const c2 = a2 * x + b2 * y
    const askX = seed % 2 === 0
    const eq = (a: number, b: number, c: number) => `${a}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}y = ${c}`
    return {
      title: 'Solve by elimination',
      prompt: `Solve the system:\n\n${eq(a1, b1, c1)}\n\n${eq(a2, b2, c2)}\n\nWhat is **${askX ? 'x' : 'y'}**?`,
      answer: numeric(askX ? x : y),
      hints: [
        `Multiply the first equation by ${mult} and the x-terms will match.`,
        `Subtracting then gives (${b1 * mult} − ${b2 >= 0 ? b2 : `(${b2})`})y = ${c1 * mult - c2}.`,
        `Worked path: y = ${y}, then x = **${x}**.`,
      ],
      explanation: `Scale the first equation by ${mult}: ${eq(a1 * mult, b1 * mult, c1 * mult)}. Subtract the second: the x-terms cancel, leaving ${b1 * mult - b2}y = ${c1 * mult - c2}, so y = **${y}**. Back-substitute for x = **${x}**. The classic slip is multiplying only one side of the equation — the scaling must hit all three numbers.`,
    }
  },
)

const sysClassify = tpl(
  { id: 'sys-classify', name: 'One, none, or infinitely many?', skillIds: ['m-systems'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const m = rnz(rng, 4)
    const b = rint(rng, -6, 6)
    const k = rint(rng, 2, 4)
    const kind = cycle(seed, ['one', 'none', 'many'] as const)
    // Written as A1x + B1y = C1 style but derived from y = mx + b lines.
    const m2 = kind === 'one' ? (m === 1 ? 2 : m - 1) : m
    const b2 = kind === 'none' ? b + rint(rng, 1, 5) : b
    const line = (mm: number, bb: number, scale: number) =>
      `${-mm * scale}x + ${scale}y = ${bb * scale}`
    const correct =
      kind === 'one' ? 'Exactly one solution' : kind === 'none' ? 'No solution' : 'Infinitely many solutions'
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [kind === 'none' ? 'Infinitely many solutions' : 'No solution',
        kind === 'none'
          ? 'same slope with DIFFERENT intercepts is parallel lines — they never meet'
          : kind === 'many'
            ? 'these are the same line scaled, not parallel lines'
            : 'different slopes always cross exactly once'],
      [kind === 'one' ? 'Infinitely many solutions' : 'Exactly one solution',
        kind === 'one'
          ? 'different slopes cannot coincide everywhere'
          : 'equal slopes mean the lines never cross just once'],
    ])
    return {
      title: 'Classify the system',
      prompt: `How many solutions does this system have?\n\n${line(m, b, 1)}\n\n${line(m2, b2, kind === 'many' ? k : 1)}`,
      answer,
      distractorNotes,
      hints: [
        'Compare slopes first; compare intercepts only if the slopes match.',
        kind === 'many' ? 'Try dividing the second equation by its common factor.' : 'Put both in y = mx + b if unsure.',
      ],
      explanation:
        kind === 'one'
          ? `The slopes differ (${m} vs ${m2}), so the lines cross exactly once: **one solution**.`
          : kind === 'none'
            ? `Both lines have slope ${m} but different intercepts (${b} vs ${b2}) — parallel, so **no solution**. Reaching 0 = ${b2 - b} algebraically says the same thing.`
            : `The second equation is the first multiplied by ${k} — the SAME line in disguise, so **infinitely many solutions**. Scaled clones are the trap: same slope AND same intercept, not merely "different-looking equations".`,
    }
  },
)

const sysMixture = tpl(
  { id: 'sys-mixture', name: 'Mix to a target', skillIds: ['m-systems', 'm-percent'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3.5, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { strong: 'the 60% juice blend', weak: 'the 20% juice blend', pS: 60, pW: 20, unit: 'liters' },
      { strong: 'the 50% nut mix', weak: 'the 10% nut mix', pS: 50, pW: 10, unit: 'kg' },
      { strong: 'the 80% wool yarn', weak: 'the 30% wool yarn', pS: 80, pW: 30, unit: 'kg' },
      { strong: 'the 40% cocoa blend', weak: 'the 15% cocoa blend', pS: 40, pW: 15, unit: 'kg' },
    ] as const)
    // Choose integer amounts first, restricted to pairs whose blended percent
    // is a whole number — the audit rightly refuses float dust like 23.333….
    const pairs: [number, number][] = []
    for (let ss = 2; ss <= 6; ss++)
      for (let ww = 2; ww <= 6; ww++)
        if ((c.pS * ss + c.pW * ww) % (ss + ww) === 0) pairs.push([ss, ww])
    const [s, w] = pairs[rint(rng, 0, pairs.length - 1)]
    const total = s + w
    const target = (c.pS * s + c.pW * w) / total
    return {
      title: 'Mixture by system',
      prompt: `You blend ${c.strong} with ${c.weak} to make **${total} ${c.unit}** at **${target}%**. How many ${c.unit} of ${c.strong} do you use?`,
      answer: numeric(s),
      hints: [
        `Two equations: amounts (s + w = ${total}) and strength (${c.pS}s + ${c.pW}w = ${target} × ${total}).`,
        `Substitute w = ${total} − s into the strength equation.`,
        `Worked path: **${s}**.`,
      ],
      explanation: `Amounts: s + w = ${total}. Strength counts the pure stuff: ${c.pS}s + ${c.pW}w = ${target} × ${total} = ${target * total}. Substituting w = ${total} − s: ${c.pS - c.pW}s = ${target * total - c.pW * total}, so s = **${s}**. The classic error is averaging the two percents as if amounts didn't matter — the strength equation is a WEIGHTED average, weighted by exactly the unknowns you're solving for.`,
    }
  },
)

const sysRate = tpl(
  { id: 'sys-rate', name: 'Catch-up and meet', skillIds: ['m-systems', 'm-wordeq'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3.5, transfer: true },
  (rng, seed) => {
    const meet = seed % 2 === 0
    const slow = rint(rng, 3, 7)
    const fast = slow + rint(rng, 2, 5)
    if (meet) {
      // Opposite directions from the same start: gap grows at the SUM.
      const t = rint(rng, 2, 5)
      const gap = (slow + fast) * t
      const who = cycle(Math.floor(seed / 2), [
        ['two cyclists', 'ride away from the same corner in opposite directions', 'km/h', 'km'],
        ['two hikers', 'leave the same trailhead in opposite directions', 'km/h', 'km'],
        ['two drones', 'fly from the same pad in opposite directions', 'm/s', 'm'],
      ] as const)
      return {
        title: 'Moving apart',
        prompt: `${who[0][0].toUpperCase()}${who[0].slice(1)} ${who[1]} at **${slow} ${who[2]}** and **${fast} ${who[2]}**. After how many ${who[2] === 'm/s' ? 'seconds' : 'hours'} are they **${gap} ${who[3]}** apart?`,
        answer: numeric(t),
        hints: [
          'Moving in opposite directions, the gap grows at the SUM of the speeds.',
          `Gap rate = ${slow} + ${fast} = ${slow + fast}.`,
          `Worked path: **${t}**.`,
        ],
        explanation: `Opposite directions → the separation grows at ${slow} + ${fast} = ${slow + fast} per unit time, so t = ${gap} ÷ ${slow + fast} = **${t}**. Adding vs subtracting speeds is the whole game: apart → add, chasing → subtract.`,
      }
    }
    // Catch-up: head start closed at the DIFFERENCE.
    const head = rint(rng, 1, 3)
    const lead = slow * head
    const diff = fast - slow
    // Ensure integer catch time by construction: choose t then lead? lead = slow*head fixed;
    // catch time = lead/diff — force divisibility by regenerating head.
    const t2 = lead % diff === 0 ? lead / diff : null
    const headFixed = t2 === null ? diff : head
    const leadFixed = slow * headFixed
    const tCatch = leadFixed / diff
    return {
      title: 'The chase',
      prompt: `A walker sets off at **${slow} km/h**. **${headFixed} hour${headFixed === 1 ? '' : 's'}** later, a runner follows the same route at **${fast} km/h**. How many hours does the runner take to catch up?`,
      answer: numeric(tCatch),
      hints: [
        `The walker's head start is ${slow} × ${headFixed} = ${leadFixed} km.`,
        `The gap closes at ${fast} − ${slow} = ${diff} km/h.`,
        `Worked path: **${tCatch}**.`,
      ],
      explanation: `Head start: ${leadFixed} km. Chasing closes the gap at the DIFFERENCE of speeds, ${diff} km/h, so t = ${leadFixed} ÷ ${diff} = **${tCatch}** hours. Equivalently set positions equal: ${fast}t = ${slow}(t + ${headFixed}). The classic slip is adding the speeds — that models moving apart, not chasing.`,
    }
  },
)

const sysAge = tpl(
  { id: 'sys-age', name: 'Ages across time', skillIds: ['m-systems', 'm-wordeq'], bucket: 'math', difficulty: 4, variants: 30, minutes: 3 },
  (rng, seed) => {
    // Construct from the answer: child age c, multiplier k now; in y years the
    // multiplier becomes k2 < k. Solve pairs guaranteed integral by building
    // forward from (c, k2, y).
    const names = cycle(seed, [
      ['Maya', 'her aunt'],
      ['Leo', 'his neighbor'],
      ['Priya', 'her coach'],
      ['Sam', 'their uncle'],
      ['Ana', 'her grandmother'],
    ] as const)
    const y = rint(rng, 3, 8)
    const k2 = rint(rng, 2, 3)
    const c = rint(rng, 4, 9)
    const adultFuture = k2 * (c + y)
    const adult = adultFuture - y
    return {
      title: 'A system of ages',
      prompt: `${names[1][0].toUpperCase()}${names[1].slice(1)} is ${adult - c} years older than ${names[0]}. In **${y} years**, ${names[1]} will be exactly **${k2} times** ${names[0]}'s age. How old is ${names[0]} now?`,
      answer: numeric(c),
      hints: [
        `Let ${names[0]}'s age be a. The older person is a + ${adult - c}.`,
        `In ${y} years BOTH are ${y} older: a + ${adult - c} + ${y} = ${k2}(a + ${y}).`,
        `Worked path: **${c}**.`,
      ],
      explanation: `Now: a and a + ${adult - c}. In ${y} years: (a + ${y}) and (a + ${adult - c + y}), and the relation says a + ${adult - c + y} = ${k2}(a + ${y}). Solving: ${adult - c + y} − ${k2 * y} = ${k2 - 1}a → a = **${c}**. The standard trap is shifting only one person's age by ${y} — time passes for both.`,
    }
  },
)

const sysConstruct = tpl(
  { id: 'sys-construct', name: 'Build the system (no solving)', skillIds: ['m-systems'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { a: 'adult tickets', b: 'student tickets', pa: 9, pb: 5, count: 'tickets', value: 'dollars' },
      { a: 'large boxes', b: 'small boxes', pa: 12, pb: 7, count: 'boxes', value: 'kilograms' },
      { a: 'premium seats', b: 'regular seats', pa: 25, pb: 15, count: 'seats', value: 'dollars' },
      { a: 'thick planks', b: 'thin planks', pa: 8, pb: 3, count: 'planks', value: 'kilograms' },
    ] as const)
    const na = rint(rng, 3, 9)
    const nb = rint(rng, 4, 11)
    const total = na + nb
    const totalVal = c.pa * na + c.pb * nb
    const correct = `x + y = ${total} and ${c.pa}x + ${c.pb}y = ${totalVal}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`x + y = ${totalVal} and ${c.pa}x + ${c.pb}y = ${total}`, 'the totals swapped homes — the plain count belongs with x + y'],
      [`x + y = ${total} and ${c.pb}x + ${c.pa}y = ${totalVal}`, 'the prices swapped owners — each price must multiply its own count'],
      [`${c.pa}x + ${c.pb}y = ${total + totalVal}`, 'one equation cannot carry two separate facts; a system needs both'],
    ])
    return {
      title: 'Translate, then stop',
      prompt: `${total} ${c.count} were sold: x ${c.a} at ${c.pa} ${c.value} each and y ${c.b} at ${c.pb} ${c.value} each, for ${totalVal} ${c.value} in all. Which system says exactly that?`,
      answer,
      distractorNotes,
      hints: [
        'One equation counts things; the other adds up value.',
        `The count fact: x + y = ${total}. The value fact: ${c.pa}x + ${c.pb}y = ${totalVal}.`,
      ],
      explanation: `**${correct}**. Every classic ticket/box problem is these two sentences: a COUNT equation with bare x + y, and a VALUE equation where each count is weighted by its price. Translation errors, not algebra errors, are where these problems are usually lost — which is why this one stops before the solving starts.`,
    }
  },
)

// ---------------------------------------------------------------- functions

const funcDomain = tpl(
  { id: 'func-domain', name: 'What inputs are allowed?', skillIds: ['m-functions'], bucket: 'math', difficulty: 3, variants: 13, minutes: 2.5 },
  (rng, seed) => {
    const formula = seed % 2 === 0
    if (formula) {
      const a = rnz(rng, 8)
      const k = rnz(rng, 6)
      const bad = a / 1 // the excluded input for denominator x - a
      const { answer, distractorNotes } = mcqNoted(rng, `All numbers except x = ${bad}`, [
        [`All numbers except x = ${-bad}`, 'sign slipped — the denominator is zero where x − a equals zero, at x = a'],
        [`All numbers except x = 0`, 'x = 0 is only forbidden when it actually zeroes the denominator — check, don\'t assume'],
        [`All numbers except x = ${k}`, 'that zeroes the NUMERATOR, which is allowed — a fraction may equal zero'],
      ])
      return {
        title: 'Domain from a formula',
        prompt: `For f(x) = (x ${k >= 0 ? '− ' + k : '+ ' + Math.abs(k)})/(x ${bad >= 0 ? '− ' + bad : '+ ' + Math.abs(bad)}), which inputs are allowed?`,
        answer,
        distractorNotes,
        hints: [
          'Only one thing breaks a formula like this: dividing by zero.',
          `The denominator is zero when x = ${bad}.`,
        ],
        explanation: `The only illegal input is the one that zeroes the DENOMINATOR: x = **${bad}**. A zero numerator is fine (the output is just 0), and x = 0 has no special status unless it happens to be the bad point. Domain questions are "what breaks this?", not "what looks suspicious?".`,
      }
    }
    const c = cycle(Math.floor(seed / 2), [
      { fn: 'the number of buses needed for x students', dom: 'Whole numbers 0, 1, 2, …', why: 'you cannot have a fraction of a student' },
      { fn: 'the area of a square with side length x cm', dom: 'All numbers x > 0', why: 'a length must be positive, but need not be whole' },
      { fn: 'the cost of x identical pencils', dom: 'Whole numbers 0, 1, 2, …', why: 'pencils come in whole counts' },
      { fn: 'the height of a ball x seconds after launch, until it lands at 6 s', dom: 'All numbers from 0 to 6', why: 'time runs continuously but the model ends at landing' },
    ] as const)
    const all = ['Whole numbers 0, 1, 2, …', 'All numbers x > 0', 'All numbers from 0 to 6', 'All numbers']
    return {
      title: 'Domain from context',
      prompt: `A function gives ${c.fn}. Which describes its sensible domain?`,
      answer: mcq(rng, c.dom, all.filter((d) => d !== c.dom)),
      hints: [
        'Ask what inputs MEAN something, not what the formula tolerates.',
        c.why.charAt(0).toUpperCase() + c.why.slice(1) + '.',
      ],
      explanation: `**${c.dom}** — ${c.why}. Context restricts harder than algebra: the formula would happily accept −3 students, but the situation will not. Real modeling is exactly this discipline of refusing inputs the story cannot cash.`,
    }
  },
)

const funcRate = tpl(
  { id: 'func-rate', name: 'Average rate of change', skillIds: ['m-functions'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng) => {
    // Quadratic-ish table so no single step equals the interval rate.
    const a = rint(rng, 1, 3)
    const b = rint(rng, -4, 4)
    const x1 = rint(rng, 0, 3)
    const x2 = x1 + rint(rng, 2, 4)
    const f = (x: number) => a * x * x + b * x
    const rate = (f(x2) - f(x1)) / (x2 - x1)
    return {
      title: 'Rate over an interval',
      prompt: `For f(x) = ${a === 1 ? '' : a}x² ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}x, what is the **average rate of change** from x = ${x1} to x = ${x2}?`,
      answer: numeric(rate),
      hints: [
        'Average rate of change = (change in output) ÷ (change in input).',
        `f(${x2}) = ${f(x2)} and f(${x1}) = ${f(x1)}.`,
        `Worked path: (${f(x2)} − ${f(x1)})/(${x2} − ${x1}) = **${rate}**.`,
      ],
      explanation: `(f(${x2}) − f(${x1})) / (${x2} − ${x1}) = (${f(x2)} − ${f(x1)})/${x2 - x1} = **${rate}**. It is the slope of the line joining the two endpoints — the curve's behavior between them, compressed to one number. Dividing by ${x2} instead of by the CHANGE ${x2 - x1} is the standard slip.`,
    }
  },
)

const funcNotation = tpl(
  { id: 'func-notation', name: 'What f(3) = 12 says', skillIds: ['m-functions'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2, calibration: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { f: 'C', inp: 'tickets bought', out: 'total cost in dollars' },
      { f: 'h', inp: 'seconds after launch', out: 'height in meters' },
      { f: 'p', inp: 'chapters read', out: 'pages turned' },
      { f: 'w', inp: 'weeks of growth', out: 'height of the plant in cm' },
    ] as const)
    const x = rint(rng, 2, 9)
    const y = rint(rng, 10, 60)
    const correct = `${x} ${c.inp} correspond to ${y} ${c.out.replace(/ in .*/, '')}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`${y} ${c.inp} correspond to ${x} ${c.out.replace(/ in .*/, '')}`, 'input and output swapped roles — the number in the parentheses is always the input'],
      [`${c.f} multiplied by ${x} equals ${y}`, `function notation is not multiplication: ${c.f}(${x}) means "${c.f} evaluated at ${x}"`],
      [`The function has the value ${x} everywhere`, `one input-output pair says nothing about other inputs`],
    ])
    return {
      title: 'Read the notation',
      prompt: `${c.f}(x) gives ${c.out} after x ${c.inp}. What does **${c.f}(${x}) = ${y}** say?`,
      answer,
      distractorNotes,
      hints: [
        'The number inside the parentheses is the INPUT.',
        `So ${x} is the ${c.inp} and ${y} is the resulting ${c.out}.`,
      ],
      explanation: `**${correct}** — the parenthesized number is the input, the equals side is the output. Reading ${c.f}(${x}) as "${c.f} times ${x}" is the misreading this notation exists to survive; a function is a machine, and ${c.f}(${x}) is what the machine emits when fed ${x}.`,
    }
  },
)

const funcInverse = tpl(
  { id: 'func-inverse', name: 'Run the machine backwards', skillIds: ['m-functions'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const m = rnz(rng, 5)
    const b = rint(rng, -8, 8)
    const evalMode = seed % 2 === 0
    const x = rint(rng, -5, 6)
    const y = m * x + b
    return evalMode
      ? {
          title: 'Invert one value',
          prompt: `f(x) = ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}. Find **f⁻¹(${y})** — the input that produces ${y}.`,
          answer: numeric(x),
          hints: [
            'f⁻¹(y) asks: which x makes f(x) equal this?',
            `Solve ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} = ${y}.`,
            `Worked path: **${x}**.`,
          ],
          explanation: `f⁻¹(${y}) is the x with f(x) = ${y}: solve ${m}x = ${y - b}, so x = **${x}**. The inverse is not 1/f(${y}) — reciprocal and inverse are different animals. One undoes the machine; the other divides by its output.`,
        }
      : {
          title: 'Undo in reverse order',
          prompt: `f(x) = ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} multiplies by ${m}, then ${b >= 0 ? 'adds' : 'subtracts'} ${Math.abs(b)}. What does f⁻¹ do?`,
          answer: mcq(rng, `${b >= 0 ? 'Subtracts' : 'Adds'} ${Math.abs(b)}, then divides by ${m}`, [
            `Divides by ${m}, then ${b >= 0 ? 'subtracts' : 'adds'} ${Math.abs(b)}`,
            `Multiplies by ${m}, then ${b >= 0 ? 'subtracts' : 'adds'} ${Math.abs(b)}`,
            `${b >= 0 ? 'Subtracts' : 'Adds'} ${Math.abs(b)}, then multiplies by ${m}`,
          ]),
          hints: [
            'Undo the LAST operation first, like unwrapping a package.',
            `f's last act was ${b >= 0 ? 'adding' : 'subtracting'} ${Math.abs(b)}, so f⁻¹ starts by undoing that.`,
          ],
          explanation: `**${b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} first, then divide by ${m}** — inverses undo operations in REVERSE order. Socks on before shoes; shoes off before socks. Undoing in the original order is the standard slip, and it fails on any input you test.`,
        }
  },
)

// ---------------------------------------------------------------- sequences

const seqRecursive = tpl(
  { id: 'seq-recursive', name: 'Follow the rule forward', skillIds: ['m-sequences'], bucket: 'math', difficulty: 3, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const plain = seed % 2 === 0
    if (plain) {
      const a1 = rint(rng, 1, 8)
      const mult = rint(rng, 2, 3)
      const sub = rint(rng, 1, 5)
      const step = (v: number) => mult * v - sub
      const a2 = step(a1), a3 = step(a2), a4 = step(a3)
      return {
        title: 'Iterate the rule',
        prompt: `A sequence starts at a₁ = ${a1} and follows **aₙ = ${mult}·aₙ₋₁ − ${sub}**. What is **a₄**?`,
        answer: numeric(a4),
        hints: [
          'Apply the rule to the PREVIOUS term, one step at a time.',
          `a₂ = ${mult}(${a1}) − ${sub} = ${a2}, then a₃ = ${a3}.`,
          `Worked path: **${a4}**.`,
        ],
        explanation: `a₂ = ${a2}, a₃ = ${a3}, a₄ = ${mult}(${a3}) − ${sub} = **${a4}**. A recursive rule eats the previous TERM, not the index n — feeding it n = 4 instead of a₃ is the standard misfire.`,
      }
    }
    const a1 = rint(rng, 2, 9)
    const d = rnz(rng, 6)
    const correct = `a₁ = ${a1}, aₙ = aₙ₋₁ ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`aₙ = aₙ₋₁ ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}`, 'no starting value — a recursion without a base case describes infinitely many sequences'],
      [`a₁ = ${a1}, aₙ = ${d >= 0 ? d : Math.abs(d)}·aₙ₋₁`, 'that multiplies each term — a geometric rule for an arithmetic pattern'],
      [`a₁ = ${a1}, aₙ = aₙ₋₁ ${d >= 0 ? '− ' + d : '+ ' + Math.abs(d)}`, 'the step runs the wrong direction'],
    ])
    const terms = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d]
    return {
      title: 'Write the recursive rule',
      prompt: `Which recursive definition produces **${terms.join(', ')}, …**?`,
      answer,
      distractorNotes,
      hints: [
        'Two pieces are mandatory: where it starts, and how each term comes from the last.',
        `Each term is the previous ${d >= 0 ? 'plus' : 'minus'} ${Math.abs(d)}.`,
      ],
      explanation: `**${correct}**. A recursive definition is a starting value PLUS a step rule; drop either and the sequence is unpinned. The base case is the piece most often forgotten — without a₁ = ${a1}, the same step rule could start anywhere.`,
    }
  },
)

const seqConvert = tpl(
  { id: 'seq-convert', name: 'Recursive ↔ explicit', skillIds: ['m-sequences'], bucket: 'math', difficulty: 4, variants: 36, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const a1 = rint(rng, 2, 9)
    const d = rnz(rng, 5)
    const toExplicit = seed % 2 === 0
    if (toExplicit) {
      const correct = `aₙ = ${a1} ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}(n − 1)`
      const { answer, distractorNotes } = mcqNoted(rng, correct, [
        [`aₙ = ${a1} ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}n`, 'the canonical off-by-one: at n = 1 this gives ' + (a1 + d) + ', not the actual first term ' + a1],
        [`aₙ = ${d >= 0 ? d : '−' + Math.abs(d)} ${a1 >= 0 ? '+ ' + a1 : '− ' + Math.abs(a1)}(n − 1)`, 'start value and step swapped seats'],
        [`aₙ = ${a1}·${Math.abs(d)}ⁿ⁻¹`, 'that is the geometric shape — this sequence ADDS each step'],
      ])
      return {
        title: 'Make it explicit',
        prompt: `A sequence is defined by a₁ = ${a1}, aₙ = aₙ₋₁ ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}. Which explicit formula matches?`,
        answer,
        distractorNotes,
        hints: [
          `Reaching term n takes n − 1 steps from a₁ — count GAPS, not terms.`,
          `Check n = 1: the formula must return ${a1}.`,
        ],
        explanation: `**${correct}**. From a₁, the nth term has taken n − 1 steps of ${d >= 0 ? '+' : ''}${d}. The instant check is n = 1: only the right formula returns ${a1}. The (n − 1) is not decoration — it is the gap count, and writing n instead is THE sequence error.`,
      }
    }
    const far = rint(rng, 12, 30)
    const value = a1 + (far - 1) * d
    return {
      title: 'Jump straight to a far term',
      prompt: `A sequence has a₁ = ${a1} and each term is the previous ${d >= 0 ? 'plus' : 'minus'} ${Math.abs(d)}. What is **a${far.toString().split('').map((ch) => '₀₁₂₃₄₅₆₇₈₉'[Number(ch)]).join('')}**?`,
      answer: numeric(value),
      hints: [
        `Iterating ${far} times invites slips — use a₁ + (n − 1)d.`,
        `${a1} + ${far - 1} × ${d >= 0 ? d : `(${d})`}.`,
        `Worked path: **${value}**.`,
      ],
      explanation: `aₙ = a₁ + (n − 1)d = ${a1} + ${far - 1}·${d >= 0 ? d : `(${d})`} = **${value}**. This is the payoff of converting: the explicit form reaches term ${far} in one move where the recursion takes ${far - 1}. Using n instead of n − 1 lands exactly one step off (${value + d}), which is why that distractor exists in the wild.`,
    }
  },
)

const seqTermNumber = tpl(
  { id: 'seq-term-number', name: 'Which term is it?', skillIds: ['m-sequences'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng) => {
    const a1 = rint(rng, 2, 9)
    const d = rint(rng, 3, 8)
    const n = rint(rng, 8, 20)
    const v = a1 + (n - 1) * d
    return {
      title: 'Find n',
      prompt: `The sequence ${a1}, ${a1 + d}, ${a1 + 2 * d}, … eventually reaches **${v}**. Which term number is that?`,
      answer: numeric(n),
      hints: [
        `Set a₁ + (n − 1)d = ${v} and solve for n.`,
        `${v} − ${a1} = ${v - a1}, and each step is ${d}.`,
        `Worked path: **${n}**.`,
      ],
      explanation: `${a1} + (n − 1)·${d} = ${v} → n − 1 = ${(v - a1) / d} → n = **${n}**. The total climb is ${v - a1}, taken in steps of ${d}, which is ${(v - a1) / d} GAPS — and gaps + 1 = terms. Reporting ${n - 1} (the gap count) as the term number is the mirror image of the usual off-by-one.`,
    }
  },
)

const seqWord = tpl(
  { id: 'seq-word', name: 'Sequences in the wild', skillIds: ['m-sequences', 'm-wordeq'], bucket: 'math', difficulty: 3, variants: 24, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { thing: 'theater rows', start: 'the front row has', step: 'each row behind adds', unit: 'seats', q: 'row' },
      { thing: 'a staircase pattern of tiles', start: 'the first step uses', step: 'each next step adds', unit: 'tiles', q: 'step' },
      { thing: 'a savings plan', start: 'week 1 banks', step: 'each later week adds', unit: 'dollars', q: 'week' },
      { thing: 'fence sections', start: 'the first section needs', step: 'each added section needs', unit: 'posts', q: 'section' },
    ] as const)
    const a1 = rint(rng, 4, 12)
    const d = rint(rng, 2, 6)
    const n = rint(rng, 7, 15)
    const v = a1 + (n - 1) * d
    return {
      title: 'Model, then jump',
      prompt: `In ${c.thing}, ${c.start} **${a1}** ${c.unit} and ${c.step} **${d}**. How many ${c.unit} does ${c.q} **${n}** use?`,
      answer: numeric(v),
      hints: [
        `This is arithmetic: a₁ = ${a1}, d = ${d}.`,
        `${c.q} ${n} is term n = ${n}: a₁ + (n − 1)d.`,
        `Worked path: **${v}**.`,
      ],
      explanation: `Term ${n} = ${a1} + (${n} − 1)·${d} = ${a1} + ${(n - 1) * d} = **${v}** ${c.unit}. Two live traps: counting ${n} steps instead of ${n - 1} (the first ${c.q} took none), and answering the running TOTAL when the question asked for one ${c.q}'s amount — read which one is wanted before computing either.`,
    }
  },
)

// ---------------------------------------------------------------- exponential

const expModel = tpl(
  { id: 'exp-model', name: 'Write the growth model', skillIds: ['m-exponential'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const grow = seed % 2 === 0
    const p = cycle(Math.floor(seed / 2), grow ? ([4, 6, 12, 25] as const) : ([5, 10, 20, 30] as const))
    const a = cycle(Math.floor(seed / 8), [200, 500, 800, 1500] as const)
    const factor = grow ? 1 + p / 100 : 1 - p / 100
    const thing = grow
      ? cycle(seed, ['a colony of bacteria', 'a town\'s population', 'an investment', 'a subscriber count'] as const)
      : cycle(seed, ['a medicine dose in the blood', 'a car\'s value', 'a lake\'s algae cover', 'a phone battery\'s capacity'] as const)
    const correct = `y = ${a}(${factor.toFixed(2).replace(/0$/, '')})ᵗ`
    const wrongFactor = grow ? (p / 100).toFixed(2).replace(/^0\./, '0.') : (1 + p / 100).toFixed(2)
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [`y = ${a}(${wrongFactor})ᵗ`, grow ? `the factor is 1 + rate — ${(p / 100).toFixed(2)} alone would SHRINK it to ${p}% of its size each step` : 'that factor grows — decay keeps 1 − rate'],
      [`y = ${a} + ${grow ? '' : '−'}${(a * p) / 100}t`, 'that is linear — the same absolute amount each step, not the same PERCENT'],
      [`y = ${a}(${grow ? 1 + p : 1 - p / 1000})ᵗ`, 'the percent was never converted — a rate of ' + p + '% is ' + p / 100 + ', not ' + p],
    ])
    return {
      title: grow ? 'Percent growth, compounded' : 'Percent decay, compounded',
      prompt: `${thing[0].toUpperCase()}${thing.slice(1)} starts at **${a}** and ${grow ? 'grows' : 'shrinks'} **${p}% per period**. Which model gives its size after t periods?`,
      answer,
      distractorNotes,
      hints: [
        `Each period multiplies by the same factor: 1 ${grow ? '+' : '−'} ${p}/100.`,
        `That factor is ${factor}.`,
      ],
      explanation: `**${correct}**. "${p}% ${grow ? 'growth' : 'decay'} per period" means each period multiplies by ${factor} — keep the 1 (the amount you still have) and ${grow ? 'add' : 'subtract'} the rate. Writing the bare rate as the factor, or adding a fixed amount each period, are the two ways this model most often goes wrong.`,
    }
  },
)

const expRead = tpl(
  { id: 'exp-read', name: 'Read a·bᵗ', skillIds: ['m-exponential'], bucket: 'math', difficulty: 3, variants: 8, minutes: 2, calibration: true },
  (rng, seed) => {
    const decay = seed % 2 === 0
    const pct = cycle(Math.floor(seed / 2), [3, 7, 12, 18] as const)
    const b = decay ? (100 - pct) / 100 : (100 + pct) / 100
    const a = cycle(seed, [120, 340, 900, 2500] as const)
    const correct = decay ? `It shrinks ${pct}% per step, starting from ${a}` : `It grows ${pct}% per step, starting from ${a}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [decay ? `It shrinks ${100 - pct}% per step, starting from ${a}` : `It grows ${100 + pct}% per step, starting from ${a}`,
        decay ? `${b} means ${100 - pct}% REMAINS — the loss is the other ${pct}%` : `${b} is the whole factor; the growth is only the part above 1`],
      [decay ? `It grows ${pct}% per step, starting from ${a}` : `It shrinks ${pct}% per step, starting from ${a}`, 'direction read backwards — compare the factor with 1'],
      [`It ${decay ? 'shrinks' : 'grows'} ${pct}% per step, starting from ${b}`, `a and b swapped jobs: ${a} is the start, ${b} is the per-step factor`],
    ])
    return {
      title: 'Parameters mean things',
      prompt: `A quantity follows **y = ${a}(${b})ᵗ**. What does that say?`,
      answer,
      distractorNotes,
      hints: [
        'Compare the factor with 1: above grows, below shrinks.',
        `${b} = 1 ${decay ? '−' : '+'} ${pct / 100}, so the per-step change is ${pct}%.`,
      ],
      explanation: `**${correct}**. The factor ${b} sits ${decay ? 'below' : 'above'} 1 by ${pct / 100}, so each step ${decay ? 'loses' : 'gains'} ${pct}%. The classic misread of decay: 0.${100 - pct} is what SURVIVES each step, not what is lost — a "93% decrease" per step would flatten anything in a step or two.`,
    }
  },
)

const expTable = tpl(
  { id: 'exp-table', name: 'Model from a table', skillIds: ['m-exponential'], bucket: 'math', difficulty: 4, variants: 32, minutes: 3 },
  (rng) => {
    const a = rint(rng, 3, 9)
    const b = rint(rng, 2, 4)
    const rows = [0, 1, 2, 3].map((x) => ({ x, y: a * b ** x }))
    const far = rint(rng, 4, 6)
    const target = a * b ** far
    return {
      title: 'Ratios, not differences',
      prompt: `A table shows x: ${rows.map((r) => r.x).join(', ')} and y: ${rows.map((r) => r.y).join(', ')}. If the pattern continues, what is y at **x = ${far}**?`,
      answer: numeric(target),
      hints: [
        'Check successive RATIOS: each y divided by the one before.',
        `Every ratio is ${b}, and the x = 0 row gives the start ${a}. So y = ${a}·${b}ˣ.`,
        `Worked path: **${target}**.`,
      ],
      explanation: `Successive ratios are ${rows[1].y}/${rows[0].y} = ${b}, ${rows[2].y}/${rows[1].y} = ${b} — constant ratio means exponential, with y = ${a}·${b}ˣ. At x = ${far}: ${a}·${b}^${far} = **${target}**. Differences (${rows[1].y - rows[0].y}, ${rows[2].y - rows[1].y}, …) keep changing, which is exactly how you know a LINEAR model is the wrong tool here.`,
    }
  },
)

const expInterest = tpl(
  { id: 'exp-interest', name: 'Simple vs compound', skillIds: ['m-exponential', 'm-percent'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, transfer: true },
  (rng, seed) => {
    const P = cycle(seed, [200, 400, 500, 1000] as const)
    const r = cycle(Math.floor(seed / 4), [10, 20, 25] as const)
    const t = rint(rng, 2, 3)
    const simple = P * (1 + (r / 100) * t)
    const compound = P * (1 + r / 100) ** t
    const askCompound = seed % 2 === 0
    const val = askCompound ? compound : simple
    return {
      title: 'Two kinds of interest',
      prompt: `$${P} earns **${r}% per year, ${askCompound ? 'compounded yearly (interest earns interest)' : 'simple interest (on the original only)'}**, for ${t} years. What is the final balance, in dollars?`,
      answer: numeric(Math.round(val * 100) / 100),
      hints: [
        askCompound ? `Each year multiplies the WHOLE balance by ${1 + r / 100}.` : `Each year adds the same ${(P * r) / 100} (interest on the original ${P} only).`,
        askCompound ? `${P} × ${1 + r / 100}^${t}.` : `${P} + ${t} × ${(P * r) / 100}.`,
        `Worked path: **${Math.round(val * 100) / 100}**.`,
      ],
      explanation: askCompound
        ? `Compound: ${P} × ${1 + r / 100}^${t} = **$${Math.round(compound * 100) / 100}**. Each year's interest joins the base for the next year — repeated multiplication, so the exponential model. (Simple interest would have given $${simple}: the gap of $${Math.round((compound - simple) * 100) / 100} IS the interest-on-interest.)`
        : `Simple: interest is ${r}% of the ORIGINAL each year = $${(P * r) / 100}, so ${P} + ${t}·${(P * r) / 100} = **$${simple}**. That is the linear model — same absolute amount each year. (Compounding would give $${Math.round(compound * 100) / 100}.) Mixing the two formulas is the classic finance-class error, and the difference is exactly the exponential-vs-linear distinction.`,
    }
  },
)

// ---------------------------------------------------------------- equations & inequalities depth

const compoundInequality = tpl(
  { id: 'ineq-compound', name: 'Between, or outside', skillIds: ['m-inequal'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const m = rint(rng, 2, 5)
    const b = rint(rng, -6, 6)
    const x1 = rint(rng, -4, 2)
    const width = rint(rng, 2, 5)
    const lo = m * x1 + b
    const hi = m * (x1 + width) + b
    const askLow = seed % 2 === 0
    return {
      title: 'A three-part inequality',
      prompt: `Solve **${lo} ${'<'} ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} ${'<'} ${hi}** for x. What is the ${askLow ? 'LOWER' : 'UPPER'} end of the solution band?`,
      answer: numeric(askLow ? x1 : x1 + width),
      hints: [
        'Whatever you do, do it to ALL THREE parts.',
        `Subtract ${b >= 0 ? b : `(${b})`} everywhere, then divide everything by ${m}.`,
        `Worked path: ${x1} < x < ${x1 + width}, so **${askLow ? x1 : x1 + width}**.`,
      ],
      explanation: `Subtract ${b} from all three parts: ${lo - b} < ${m}x < ${hi - b}. Divide all three by ${m}: **${x1} < x < ${x1 + width}**. A compound inequality is one statement with three lanes — operating on only two of them silently changes which numbers it is talking about.`,
    }
  },
)

const findK = tpl(
  { id: 'eq-find-k', name: 'Choose k to break it', skillIds: ['m-lineqmulti', 'm-proof'], bucket: 'math', difficulty: 5, variants: 36, minutes: 3, calibration: true },
  (rng, seed) => {
    const a = rint(rng, 2, 6)
    const b = rint(rng, 1, 9)
    const c = rint(rng, 1, 9)
    const wantNone = seed % 2 === 0
    // ax + b = kx + c: one solution unless k = a; then none (b≠c) or all (b=c).
    return wantNone
      ? {
          title: 'Make it unsolvable',
          prompt: `For which value of **k** does ${a}x + ${b} = kx + ${c === b ? c + 1 : c} have **no solution**?`,
          answer: numeric(a),
          hints: [
            'Collect the x-terms: (a − k)x = constant.',
            `If a − k = 0 the x vanishes, leaving ${b} = ${c === b ? c + 1 : c} — false.`,
            `Worked path: k = **${a}**.`,
          ],
          explanation: `Rearranged: (${a} − k)x = ${(c === b ? c + 1 : c) - b}. For any k ≠ ${a} you can divide and get one solution. At k = **${a}** the x-term dies and the equation collapses to ${b} = ${c === b ? c + 1 : c}, which is false for every x — no solution. (Had the constants matched, the same k would give infinitely many: the constants, not k, decide WHICH degenerate case you get.)`,
        }
      : {
          title: 'Make everything a solution',
          prompt: `For which value of **k** does ${a}(x + ${b}) = ${a}x + k hold for **every** x?`,
          answer: numeric(a * b),
          hints: [
            'Expand the left side and compare the two sides piece by piece.',
            `Left side: ${a}x + ${a * b}. Identical sides means identical constants.`,
            `Worked path: k = **${a * b}**.`,
          ],
          explanation: `Expanding: ${a}x + ${a * b} = ${a}x + k. The x-terms already match, so the sides are identical exactly when k = **${a * b}** — and then EVERY x works. Choosing k to make an equation true for all x (or for none) is the first taste of thinking about equations as objects, which is where algebra starts becoming interesting.`,
        }
  },
)

const literalSolve = tpl(
  { id: 'eq-literal', name: 'Solve for the letter asked', skillIds: ['m-lineqmulti', 'm-model'], bucket: 'math', difficulty: 4, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const c = cycle(seed, [
      { formula: 'P = 2l + 2w', target: 'w', correct: 'w = (P − 2l)/2', bads: [['w = P/2 − 2l', 'only P was divided by 2 — the whole side must be divided'], ['w = (P + 2l)/2', 'the 2l crossed the equals sign without changing sign'], ['w = 2(P − l)', 'multiplied instead of divided at the last step']] },
      { formula: 'A = (1/2)bh', target: 'h', correct: 'h = 2A/b', bads: [['h = A/(2b)', 'the 1/2 must be UNDONE — multiply by 2, not divide again'], ['h = 2Ab', 'b crossed over as multiplication instead of division'], ['h = A/2 − b', 'subtraction cannot undo multiplication']] },
      { formula: 'd = rt', target: 't', correct: 't = d/r', bads: [['t = r/d', 'the division ran upside down'], ['t = d − r', 'subtraction cannot undo multiplication'], ['t = dr', 'that computes a distance-rate product, not a time']] },
      { formula: 'C = (5/9)(F − 32)', target: 'F', correct: 'F = (9/5)C + 32', bads: [['F = (9/5)(C + 32)', 'the 32 must be added AFTER undoing the fraction — order of undoing is reversed'], ['F = (5/9)C + 32', 'the fraction was never inverted'], ['F = (9/5)C − 32', 'undoing "subtract 32" means ADDING 32']] },
    ] as const)
    const { answer, distractorNotes } = mcqNoted(rng, c.correct, c.bads.map(([t, n]) => [t, n] as [string, string]))
    return {
      title: 'Rearrange the formula',
      prompt: `Solve **${c.formula}** for **${c.target}**.`,
      answer,
      distractorNotes,
      hints: [
        `Treat every other letter as a known number and undo operations in reverse order.`,
        `Isolate the term containing ${c.target} first, then strip its coefficient.`,
      ],
      explanation: `**${c.correct}**. Solving for a letter is the same balance game as solving for x — the other letters just refuse to become numbers. The payoff is real: a formula solved once for ${c.target} answers every future "${c.target} = ?" question without re-deriving, which is why science classes live on rearranged formulas.`,
    }
  },
)

// ---------------------------------------------------------------- linear depth

const parallelPerp = tpl(
  { id: 'lin-parallel-perp', name: 'Parallel or perpendicular', skillIds: ['m-linforms', 'm-linear'], bucket: 'math', difficulty: 4, variants: 40, minutes: 2.5 },
  (rng, seed) => {
    const perp = seed % 2 === 0
    const m = rnz(rng, 4)
    const b = rint(rng, -6, 6)
    const x1 = rnz(rng, 4)
    if (perp) {
      // Perpendicular slope is -1/m; pick the point so b2 is a clean fraction or integer:
      // choose x1 divisible by m for an integer y-step.
      const px = m * rint(rng, 1, 3)
      const py = rint(rng, -5, 5)
      const b2n = py * m + px // from y = (-1/m)x + b2 → b2 = py + px/m; scale by m: (m·py + px)/m
      return {
        title: 'Build the perpendicular',
        prompt: `A line through **(${px}, ${py})** is perpendicular to **y = ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}**. What is its slope? Answer as a fraction.`,
        answer: fraction(-1, m),
        hints: [
          'Perpendicular slopes multiply to −1.',
          `So the new slope is −1 divided by ${m}.`,
          `Worked path: −1/${m}.`,
        ],
        explanation: `Perpendicular slope = −1/m = **−1/${m}** (flip AND negate). Two half-fixes both fail: −${m} negates without flipping, and 1/${m} flips without negating — a quick check is that ${m} × (−1/${m}) = −1, and neither half-fix passes it. (The b₂ for the full equation would be ${b2n}/${m}, but the slope is the perpendicularity.)`,
      }
    }
    const py2 = rint(rng, -6, 6)
    const b2 = py2 - m * x1
    return {
      title: 'Build the parallel',
      prompt: `A line through **(${x1}, ${py2})** is parallel to **y = ${m}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)}**. What is its y-intercept?`,
      answer: numeric(b2),
      hints: [
        'Parallel lines share the SAME slope; only b changes.',
        `y = ${m}x + b₂ through (${x1}, ${py2}): solve ${py2} = ${m}·${x1 < 0 ? `(${x1})` : x1} + b₂.`,
        `Worked path: **${b2}**.`,
      ],
      explanation: `Parallel keeps m = ${m}. Push the point through: ${py2} = ${m}(${x1}) + b₂ → b₂ = **${b2}**. Reusing the ORIGINAL line's b is the standard slip — the new line shares direction, not position, and the point is what pins the position down.`,
    }
  },
)

const compareRates = tpl(
  { id: 'lin-compare-rates', name: 'Same idea, three costumes', skillIds: ['m-linfunc', 'm-proportion'], bucket: 'math', difficulty: 3, variants: 32, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const c = cycle(seed, [
      { a: 'Plan A charges y = RATEx + BASE', b: 'Plan B', unit: '$ per GB' },
      { a: 'Printer A prints y = RATEx + BASE pages by minute x', b: 'Printer B', unit: 'pages per minute' },
      { a: 'Pool A fills y = RATEx + BASE liters by minute x', b: 'Pool B', unit: 'liters per minute' },
      { a: 'Walker A follows y = RATEx + BASE meters at second x', b: 'Walker B', unit: 'meters per second' },
    ] as const)
    const mA = rint(rng, 3, 9)
    const gap = rint(rng, 1, 3)
    const fasterIsB = seed % 2 === 0
    const mB = fasterIsB ? mA + gap : mA - gap
    const bA = rint(rng, 5, 30)
    const x1 = rint(rng, 2, 5)
    const step = rint(rng, 2, 4)
    const rows = [0, 1, 2].map((i) => ({ x: x1 + i * step, y: 100 + mB * (x1 + i * step) }))
    const correct = fasterIsB ? `${c.b}, at ${mB} vs ${mA} ${c.unit}` : `${c.a.split(' ')[0]} ${c.a.split(' ')[1]}, at ${mA} vs ${mB} ${c.unit}`
    const { answer, distractorNotes } = mcqNoted(rng, correct, [
      [fasterIsB ? `${c.a.split(' ')[0]} ${c.a.split(' ')[1]}, at ${mA} vs ${mB} ${c.unit}` : `${c.b}, at ${mB} vs ${mA} ${c.unit}`, 'the rates compare the other way — recompute the table\'s per-step change'],
      [`${c.b}, because its y-values are larger`, 'bigger CURRENT values are the head start (intercept), not the rate — the question asks which grows faster'],
      [`They grow at the same rate`, `the table's rate works out to ${mB}, which differs from ${mA}`],
    ])
    return {
      title: 'Compare growth rates',
      prompt: `${c.a.replace('RATE', String(mA)).replace('BASE', String(bA))}. ${c.b} is a table — x: ${rows.map((r) => r.x).join(', ')}; y: ${rows.map((r) => r.y).join(', ')}. **Which grows faster**, and at what rates?`,
      answer,
      distractorNotes,
      hints: [
        `The equation's rate is its x-coefficient: ${mA}.`,
        `The table's rate is Δy/Δx = ${mB * step}/${step} — mind that x steps by ${step}, not 1.`,
      ],
      explanation: `**${correct}**. From the equation the rate is the coefficient ${mA}; from the table it is Δy/Δx = ${(rows[1].y - rows[0].y)}/${step} = ${mB}. Two traps live here: dividing by 1 when the table steps by ${step}, and comparing y-VALUES (a head start) when the question asks about growth. Rates compare slopes, never positions.`,
    }
  },
)

export const ALGEBRA_ONE_TEMPLATES: ItemTemplate[] = [
  sysElimination,
  sysClassify,
  sysMixture,
  sysRate,
  sysAge,
  sysConstruct,
  funcDomain,
  funcRate,
  funcNotation,
  funcInverse,
  seqRecursive,
  seqConvert,
  seqTermNumber,
  seqWord,
  expModel,
  expRead,
  expTable,
  expInterest,
  compoundInequality,
  findK,
  literalSolve,
  parallelPerp,
  compareRates,
]
