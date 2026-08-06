/**
 * Expansion bank — deeper game theory, algebra, physics, coding, science,
 * and lab activities. Same law as everywhere: answers computed or solved
 * during authoring, audited by the test suite.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint, rnz } from '../../engine/rng'
import { fixed, mcq, mcqNoted, numeric, round, tpl } from '../lib'

// ---------------------------------------------------------------- game theory

const zeroSum = tpl(
  { id: 'g-zero-sum', name: 'Zero-sum or not?', skillIds: ['i-game'], bucket: 'investigator', difficulty: 2, variants: 2, minutes: 2.5 },
  (_rng, seed) => {
    const sets = [
      {
        statements: [
          { text: 'Two players split a fixed prize pool', category: 0 },
          { text: 'Classmates form a study group before a hard exam', category: 1 },
          { text: 'Arguing over who gets the last slice', category: 0 },
          { text: 'Two shops on one street draw a bigger crowd together', category: 1 },
          { text: 'A chess game', category: 0 },
          { text: 'Teaching a friend a skill you both then use', category: 1 },
        ],
      },
      {
        statements: [
          { text: 'Bidding against one other buyer for the same used bike', category: 0 },
          { text: 'Trading cards each of you values differently', category: 1 },
          { text: 'A tug-of-war', category: 0 },
          { text: 'Two musicians rehearsing a duet', category: 1 },
          { text: 'Racing for a single trophy', category: 0 },
          { text: 'Sharing notes so both essays improve', category: 1 },
        ],
      },
    ]
    const s = sets[seed % sets.length]
    return {
      title: 'Fixed pie or growing pie?',
      prompt:
        'Label each situation. **Zero-sum**: one side\'s gain is exactly the other\'s loss. **Positive-sum**: the total can grow, so both can win.\n\nMisreading this is the classic strategic error — treating a growable pie as fixed turns partners into opponents.',
      answer: { type: 'classify', categories: ['Zero-sum', 'Positive-sum'], statements: s.statements },
      hints: [
        'Ask: can BOTH sides end up better than they started?',
        'Fixed prizes, single trophies, and pure conflicts are zero-sum; trade, teams, and shared work usually are not.',
        'Worked path: the fixed-prize items are zero-sum; every trade/cooperation item grows the pie.',
      ],
      explanation:
        'Zero-sum: fixed pools, single prizes, direct opposition — every point you take, someone loses. Positive-sum: trade works because valuations differ; cooperation works because effort compounds. The strategic habit: before competing, check whether the pie is actually fixed. Most of life is positive-sum, and playing it zero-sum burns real value (and relationships) for nothing.',
      commonErrors: { strategy: 'Treating every interaction as a contest is not "hard-nosed" — it is a measurable error about the payoff structure.' },
    }
  },
)

const coordination = fixed(
  { id: 'g-coordination', name: 'Coordination & focal points', skillIds: ['i-game'], bucket: 'investigator', difficulty: 3, minutes: 3 },
  {
    title: 'Meet me… where?',
    prompt:
      'You and a friend get separated at a huge fair with no phones. You never picked a meeting spot. Both of you want to find each other, and both know the other is reasoning the same way.\n\nWhat is the best strategy?',
    answer: {
      type: 'mcq',
      options: [
        'Go to the single most obvious landmark (the main gate) and stay there',
        'Search the fair in a random pattern — coverage beats standing still',
        'Go wherever YOU like best; your friend should adapt',
        'Keep switching spots every few minutes to maximize encounters',
      ],
      correct: 0,
    },
    hints: [
      'This is a coordination game: you win only by CHOOSING THE SAME thing.',
      'Ask: what would they think that I would think that they would think? The answer converges on the most obvious option.',
      'Worked path: the main gate is the focal point — obvious to both, and staying put makes you findable.',
    ],
    explanation:
      'Coordination games are won by convergence, not cleverness: each player should pick what is most obviously pickable — the **focal point** (Schelling\'s classic idea). Random search and constant switching can miss forever; "my favorite spot" ignores that your friend cannot read your favorites. Focal points are why defaults, conventions, and "everyone knows" landmarks carry real strategic weight. Transfer: agreeing on file names, meeting times, and standards are all focal-point problems.',
  },
)

const commitment = fixed(
  { id: 'g-commitment', name: 'Commitment devices', skillIds: ['i-game', 'st-decomp'], bucket: 'investigator', difficulty: 3, minutes: 3 },
  {
    title: 'Making your future self behave',
    prompt:
      'You keep planning to study at 7 pm and then not doing it. Which arrangement uses a real **commitment device** — something that changes tomorrow\'s payoffs, not just tonight\'s mood?',
    answer: {
      type: 'mcq',
      options: [
        'Tell a friend you\'ll send them a photo of your finished problem set at 8 pm, every day this week',
        'Feel really determined about it tonight',
        'Write "STUDY!!" in your notes app again',
        'Promise yourself a reward you can also just take anyway',
      ],
      correct: 0,
    },
    hints: [
      'A commitment device makes breaking the plan COST something you actually care about.',
      'Test each option: on a lazy evening, which one still bites?',
      'Worked path: the friend-and-photo arrangement adds a real social cost to skipping — the others evaporate exactly when needed.',
    ],
    explanation:
      'Commitment devices work by changing the future game, not the present feeling: the photo promise makes skipping visible and mildly costly, so your 7-pm self faces different payoffs. Determination and notes change nothing your lazy self must answer to, and self-administered rewards are self-cancelable. This is game theory pointed at yourself — the same logic behind deadlines, deposits, and public pledges. (Used FOR yourself, with consent — never as a trap for others.)',
  },
)

const titForTat = fixed(
  { id: 'g-tit-for-tat', name: 'Responding to defection', skillIds: ['i-game', 'st-ethics'], bucket: 'investigator', difficulty: 3, minutes: 3 },
  {
    title: 'The lab partner who coasted',
    prompt:
      'Your lab partner coasted last week and you covered for them. You will work together all term. Game-theoretically AND ethically, what is the strongest response?',
    answer: {
      type: 'mcq',
      options: [
        'Name it plainly, cooperate this week, and make clear that coasting again changes how you split work',
        'Say nothing and quietly do everything yourself all term',
        'Coast harder than they did, forever, to teach them',
        'Report them to the teacher immediately, before talking to them',
      ],
      correct: 0,
    },
    hints: [
      'In repeated games, strategies that are NICE (start cooperative), PROVOCABLE (respond to defection), and FORGIVING (return to cooperation) dominate.',
      'Check each option against those three properties.',
      'Worked path: name it + one clear consequence + an open door back = provocable and forgiving.',
    ],
    explanation:
      'Axelrod\'s tournaments found the enduring winners were nice, provocable, forgiving, and CLEAR — tit-for-tat-like strategies. Silent martyrdom teaches that defection is free; permanent revenge locks both of you into mutual loss; instant escalation to authority skips the cheapest repair. The strong move is transparent reciprocity: cooperation as the default, defection answered once and specifically, and the way back left open. That is not softness — it is the strategy that wins long games.',
  },
)

// ---------------------------------------------------------------- algebra depth

const negExponents = tpl(
  { id: 'exp-negative', name: 'Zero & negative exponents', skillIds: ['m-exponents'], bucket: 'math', difficulty: 3, variants: 14, minutes: 2 },
  (rng) => {
    const base = pick(rng, [2, 3, 4, 5, 10])
    const kind = pick(rng, ['zero', 'neg'] as const)
    const n = rint(rng, 1, base === 10 ? 3 : 2)
    const correct = kind === 'zero' ? '1' : `1/${base ** n}`
    const noted =
      kind === 'zero'
        ? mcqNoted(rng, '1', [
            ['0', '"Zero exponent = zero" — but the dividing ladder shows each step divides by the base, and it lands on 1.'],
            [String(base), 'x⁰ read as x¹ — the exponent counts factors, and zero factors multiplied is the empty product, 1.'],
            [`1/${base}`, 'One reciprocal step too far — that is x⁻¹; x⁰ sits exactly at 1.'],
          ])
        : mcqNoted(rng, correct, [
            [`-${base ** n}`, 'Negative exponent read as negative VALUE — the minus means reciprocal, so the result is small, never negative.'],
            [`-${base * n}`, 'Two mix-ups at once: the minus is a reciprocal, and the exponent multiplies factors, not the base.'],
            [String(base ** n), 'The minus vanished — the reciprocal step is the whole point of a negative exponent.'],
          ])
    return {
      title: 'Below zero exponents',
      prompt: `Evaluate: **${base}^${kind === 'zero' ? 0 : -n}**`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      hints: [
        `Follow the pattern downward: ${base}³, ${base}², ${base}¹ — each step DIVIDES by ${base}. Keep going past ${base}¹.`,
        `${base}¹ = ${base}, so ${base}⁰ = ${base}/${base} = 1, and each negative step divides again.`,
        `Worked path: **${correct}**.`,
      ],
      explanation:
        kind === 'zero'
          ? `The ladder ${base}³ → ${base}² → ${base}¹ divides by ${base} each step, so ${base}⁰ = **1** (not 0!). The rule exists so that x^a · x^b = x^(a+b) keeps working: x⁰ · x² must equal x².`
          : `Negative exponents mean reciprocal: ${base}^-${n} = 1/${base}^${n} = **1/${base ** n}**. A negative exponent NEVER makes the value negative — it makes it small.`,
      commonErrors: { concept: kind === 'zero' ? 'x⁰ = 0 is the classic trap — the dividing-ladder shows why it must be 1.' : 'Reading the minus as "negative number" instead of "reciprocal" is THE error here.' },
    }
  },
)

const gcfFactor = tpl(
  { id: 'poly-gcf', name: 'Factor out the GCF', skillIds: ['m-polys', 'm-expressions'], bucket: 'math', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const g = pick(rng, [2, 3, 4, 5, 6])
    const a = rint(rng, 2, 6)
    let b = rint(rng, 1, 7)
    if (b === a) b = b + 1
    const correct = `${g}x(${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)})`
    return {
      title: 'Greatest common factor',
      prompt: `Factor completely: **${g * a}x² ${b >= 0 ? '+' : '−'} ${Math.abs(g * b)}x**`,
      answer: mcq(rng, correct, [
        `x(${g * a}x ${b >= 0 ? '+' : '−'} ${Math.abs(g * b)})`,
        `${g}(${a}x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x)`,
        `${g * a}x(x ${b >= 0 ? '+' : '−'} ${Math.abs((g * b) / (g * a)) === Math.abs(b / a) ? Math.abs(b) : Math.abs(b)})`,
      ]),
      hints: [
        'Find the largest number AND the highest power of x that divide BOTH terms.',
        `Numbers: gcd(${g * a}, ${g * b}) = ${g}. Both terms contain at least one x.`,
        `Worked path: pull out ${g}x → **${correct}**.`,
      ],
      explanation: `Both terms share ${g} and one x: ${g * a}x² ${b >= 0 ? '+' : '−'} ${Math.abs(g * b)}x = **${correct}**. "Completely" means the leftover binomial shares no further factor — check by re-distributing. Partial factoring (pulling only x, or only ${g}) is the standard slip.`,
    }
  },
)

const absValue = tpl(
  { id: 'abs-equation', name: 'Absolute value equations', skillIds: ['m-lineqmulti', 'm-integers'], bucket: 'math', difficulty: 3, variants: 14, minutes: 2.5 },
  (rng) => {
    const a = rint(rng, 1, 8)
    const k = rint(rng, 2, 9)
    return {
      title: 'Two ways to be far',
      prompt: `Solve **|x − ${a}| = ${k}**. Enter the **larger** solution. (How many solutions exist?)`,
      answer: numeric(a + k),
      hints: [
        `|x − ${a}| is the DISTANCE between x and ${a}. Which numbers sit ${k} away from ${a}?`,
        `Two directions: ${a} + ${k} and ${a} − ${k}.`,
        `Worked path: solutions ${a - k} and ${a + k}; larger = **${a + k}**.`,
      ],
      explanation: `Distance ${k} from ${a} happens twice: x = ${a + k} and x = ${a - k}. The larger is **${a + k}**. Absolute-value equations nearly always split into two cases — reporting one solution is the standard incompleteness error.`,
      commonErrors: { incomplete: 'One equation, two solutions — the distance picture makes the second one impossible to forget.' },
    }
  },
)

const ineqWord = tpl(
  { id: 'ineq-word', name: 'Inequalities in context', skillIds: ['m-inequal', 'm-wordeq'], bucket: 'math', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const budget = pick(rng, [30, 40, 50, 60])
    const fee = rint(rng, 4, 9)
    const per = pick(rng, [2, 2.5, 3, 3.5])
    const maxRides = Math.floor((budget - fee) / per)
    return {
      title: 'How many can you afford?',
      prompt: `A fair charges **$${fee}** to enter plus **$${per} per ride**. You have **$${budget}**. What is the greatest number of rides you can afford?`,
      answer: numeric(maxRides),
      hints: [
        `Model it: ${fee} + ${per}r ≤ ${budget}.`,
        `Solve: r ≤ ${round((budget - fee) / per, 2)}.`,
        `Worked path: rides must be a WHOLE number, so round DOWN: **${maxRides}**.`,
      ],
      explanation: `${fee} + ${per}r ≤ ${budget} → r ≤ ${round((budget - fee) / per, 2)}. Rides are whole, so the answer floors to **${maxRides}**. The rounding DIRECTION comes from the story, not from rounding rules — you cannot afford ${maxRides + 1} rides even if the decimal was ${round((budget - fee) / per, 2)}.`,
      commonErrors: { misread: 'Rounding to the NEAREST whole number can buy a ride you cannot pay for — context chooses the direction.' },
    }
  },
)

const slopeIntercept = tpl(
  { id: 'linfunc-from-points', name: 'Build y = mx + b', skillIds: ['m-linfunc', 'm-linear'], bucket: 'math', difficulty: 3, variants: 14, minutes: 3 },
  (rng) => {
    const m = rnz(rng, 5)
    const b = rint(rng, -6, 8)
    const x1 = rint(rng, 1, 4)
    const x2 = x1 + rint(rng, 1, 3)
    const correct = `y = ${m === 1 ? '' : m === -1 ? '-' : m}x ${b >= 0 ? '+ ' + b : '− ' + -b}`
    return {
      title: 'Recover the rule',
      prompt: `A line passes through **(${x1}, ${m * x1 + b})** and **(${x2}, ${m * x2 + b})**. Which equation is the line?`,
      answer: mcq(rng, correct, [
        `y = ${m === 1 ? '' : m === -1 ? '-' : m}x ${b + 1 >= 0 ? '+ ' + (b + 1) : '− ' + -(b + 1)}`,
        `y = ${m + 1 === 1 ? '' : m + 1 === -1 ? '-' : m + 1 === 0 ? '0' : m + 1}x ${b >= 0 ? '+ ' + b : '− ' + -b}`,
        `y = ${b === 1 ? '' : b === -1 ? '-' : b === 0 ? '0' : b}x ${m >= 0 ? '+ ' + m : '− ' + -m}`,
      ]),
      hints: [
        'Slope first: rise over run between the two points.',
        `m = (${m * x2 + b} − ${m * x1 + b})/(${x2} − ${x1}) = ${m}. Then substitute one point to find b.`,
        `Worked path: b = ${m * x1 + b} − ${m}·${x1} = ${b} → **${correct}**.`,
      ],
      explanation: `Slope m = ${m}; substituting (${x1}, ${m * x1 + b}): ${m * x1 + b} = ${m}(${x1}) + b → b = ${b}. Line: **${correct}**. Verify with the OTHER point — a free full check almost nobody uses.`,
    }
  },
)

// ---------------------------------------------------------------- physics depth

const freeFall = tpl(
  { id: 'p-free-fall', name: 'Free fall', skillIds: ['p-accel'], bucket: 'physics', difficulty: 3, variants: 10, minutes: 2.5 },
  (rng) => {
    const t = rint(rng, 1, 4)
    const d = 5 * t * t // g≈10: d = ½gt²
    const askD = rng() < 0.6
    return {
      title: 'Dropping it',
      prompt: askD
        ? `A stone is dropped from rest off a cliff. Using **g ≈ 10 m/s²**, how far does it fall in **${t} s**, in meters? (d = ½gt²)`
        : `A stone dropped from rest falls for **${t} s** (g ≈ 10 m/s²). How fast is it moving at that moment, in m/s?`,
      answer: numeric(askD ? d : 10 * t),
      hints: [
        askD ? 'd = ½ g t² — square the time first.' : 'Speed gained = g × t (it gains 10 m/s every second).',
        askD ? `t² = ${t * t}.` : `${t} seconds × 10 m/s each second.`,
        `Worked path: **${askD ? d : 10 * t}**.`,
      ],
      explanation: askD
        ? `d = ½ × 10 × ${t}² = 5 × ${t * t} = **${d} m**. The square means the second second adds MORE distance than the first — falling compounds.`
        : `v = g·t = 10 × ${t} = **${10 * t} m/s**. Speed grows linearly; distance grows with the square — keep the two formulas distinct.`,
    }
  },
)

const power = tpl(
  { id: 'p-power', name: 'Power', skillIds: ['p-energy'], bucket: 'physics', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const w = pick(rng, [200, 300, 400, 600, 900])
    const t = pick(rng, [5, 10, 20, 30])
    return {
      title: 'How fast is the energy moving?',
      prompt: `A motor does **${w} J** of work in **${t} s**. What is its power, in watts?`,
      answer: numeric(w / t),
      hints: [
        'Power = energy per time: P = W/t.',
        `${w} ÷ ${t}.`,
        `Worked path: **${w / t} W**.`,
      ],
      explanation: `P = W/t = ${w}/${t} = **${w / t} W** — a watt is one joule per second. Power is a RATE: the same work done twice as fast is twice the power, same energy.`,
    }
  },
)

const seriesResistors = tpl(
  { id: 'p-series-r', name: 'Series circuits', skillIds: ['p-circuits'], bucket: 'physics', difficulty: 3, variants: 12, minutes: 2.5 },
  (rng) => {
    const r1 = pick(rng, [2, 3, 4, 6])
    const r2 = pick(rng, [2, 4, 5, 6])
    const i = pick(rng, [1, 2, 3])
    const v = i * (r1 + r2)
    return {
      title: 'Two resistors, one loop',
      prompt: `A **${v} V** battery drives a series circuit with resistors of **${r1} Ω** and **${r2} Ω**. What current flows, in amps?`,
      answer: numeric(i),
      hints: [
        'In series, resistances simply add — the current has to fight both.',
        `Total R = ${r1} + ${r2} = ${r1 + r2} Ω, then I = V/R.`,
        `Worked path: ${v}/${r1 + r2} = **${i} A**.`,
      ],
      explanation: `Series: R_total = ${r1} + ${r2} = ${r1 + r2} Ω; I = V/R = ${v}/${r1 + r2} = **${i} A**. The SAME current passes through both resistors — series means one path, one current.`,
    }
  },
)

const efficiency = tpl(
  { id: 'p-efficiency', name: 'Efficiency', skillIds: ['p-energy', 'm-percent'], bucket: 'physics', difficulty: 3, variants: 12, minutes: 2.5, transfer: true },
  (rng) => {
    const inputE = pick(rng, [200, 400, 500, 800])
    const eff = pick(rng, [20, 25, 40, 60])
    const useful = (inputE * eff) / 100
    return {
      title: 'Where did the energy go?',
      prompt: `A motor takes in **${inputE} J** of electrical energy and delivers **${useful} J** of useful lifting work. What is its efficiency, as a percent? (Enter just the number.)`,
      answer: numeric(eff),
      hints: [
        'Efficiency = useful out ÷ total in.',
        `${useful} ÷ ${inputE} = ${useful / inputE}.`,
        `Worked path: **${eff}%** — the rest became heat and sound.`,
      ],
      explanation: `Efficiency = ${useful}/${inputE} = ${eff}%. The missing ${inputE - useful} J did not vanish — energy never does — it left as heat and sound. Every real machine is a leaky pipe for energy; efficiency measures the leak.`,
    }
  },
)

// ---------------------------------------------------------------- coding depth

const shadowBug = fixed(
  { id: 'c-debug-shadow', name: 'Find the bug: shadowing', skillIds: ['c-trace', 'c-funcs'], bucket: 'coding', difficulty: 3, minutes: 3 },
  {
    title: 'The total that stays zero',
    prompt:
      'This should add up the scores, but prints 0:\n```\nlet total = 0\nfunction addScore(s) {\n  let total = total + s\n}\naddScore(5)\naddScore(7)\nconsole.log(total)\n```\nWhat is the bug?',
    answer: {
      type: 'mcq',
      options: [
        'The `let` inside the function creates a NEW local `total` that shadows the outer one, which never changes',
        'Functions cannot read numbers passed as parameters',
        'console.log runs before the two calls',
        'You cannot call the same function twice',
      ],
      correct: 0,
    },
    hints: [
      'Count how many variables named `total` exist. (Hint: more than one.)',
      'A `let` declaration inside a function makes a fresh box, no matter what it is named.',
      'Worked path: remove the inner `let` (assign with `total = total + s`) so the outer box updates.',
    ],
    explanation:
      'Line 3\'s `let total` declares a brand-new local variable that merely SHARES A NAME with the outer one — the outer `total` is never touched, so 0 prints. Fix: `total = total + s` (assignment, not declaration). Shadowing bugs are invisible precisely because everything is spelled right; the discipline is knowing which BOX each name points to in each scope.',
  },
)

const mapFilter = tpl(
  { id: 'c-map-filter', name: 'Transform pipelines', skillIds: ['c-arrays', 'c-algo'], bucket: 'coding', difficulty: 3, variants: 12, minutes: 3 },
  (rng) => {
    const arr = Array.from({ length: 5 }, () => rint(rng, 1, 9))
    const cut = rint(rng, 3, 6)
    const result = arr.filter((v) => v > cut).map((v) => v * 2)
    const sum = result.reduce((a, b) => a + b, 0)
    return {
      title: 'Follow the pipeline',
      prompt:
        `\`\`\`\nlet a = [${arr.join(', ')}]\nlet out = a.filter(v => v > ${cut})\n           .map(v => v * 2)\nlet total = 0\nfor (const v of out) total += v\nconsole.log(total)\n\`\`\`\nWhat is printed?`,
      answer: numeric(sum),
      hints: [
        'Two stages: filter KEEPS values passing the test; map TRANSFORMS the survivors.',
        `Survivors of "> ${cut}": ${arr.filter((v) => v > cut).join(', ') || '(none)'}; doubled: ${result.join(', ') || '(none)'}.`,
        `Worked path: total = **${sum}**.`,
      ],
      explanation: `filter(> ${cut}) keeps [${arr.filter((v) => v > cut).join(', ')}]; map(×2) gives [${result.join(', ')}]; summing → **${sum}**. Pipelines read left-to-right as data flowing through sieves and transformers — trace the ARRAY between stages, not the code.`,
    }
  },
)

// ---------------------------------------------------------------- science depth

const sampleSize = fixed(
  { id: 's-sample-size', name: 'Small samples lie', skillIds: ['s-measure', 's-sources'], bucket: 'science', difficulty: 3, minutes: 2.5 },
  {
    title: 'The 100% success story',
    prompt:
      'An ad: "In a study, **100% of users** said SharpFocus gum improved their concentration!" Fine print: the study had **3 participants**, recruited by the company.\n\nWhat is the strongest reason to distrust the claim?',
    answer: {
      type: 'mcq',
      options: [
        'Three hand-picked people produce results that chance and selection can fully explain — the percentage is theater',
        '100% is impossible in any real study',
        'Gum can never affect anything',
        'Studies must have exactly 100 people to count',
      ],
      correct: 0,
    },
    hints: [
      'Flip 3 coins: how surprising is 3 heads? Now add that the company chose which coins to flip.',
      'A percentage hides its denominator — always drag it back into view.',
      'Worked path: n=3 + company recruiting = a result compatible with the gum doing nothing at all.',
    ],
    explanation:
      'With n = 3, "100%" is 3 people — an outcome chance alone produces often, before even counting the selection bias of company-recruited participants and the vagueness of "said it improved". Percentages borrow authority from large numbers; the denominator is where the authority actually lives. Reflex to build: hear a percent → ask "of how many, chosen how?"',
  },
)

const blinding = fixed(
  { id: 's-blinding', name: 'Placebos & blinding', skillIds: ['s-hypo', 's-measure'], bucket: 'science', difficulty: 3, minutes: 3 },
  {
    title: 'Why the sugar pill?',
    prompt:
      'In a headache-remedy trial, the control group gets an identical-looking pill with no medicine in it, and NEITHER patients NOR the raters know who got which until the end. What does this design actually accomplish?',
    answer: {
      type: 'mcq',
      options: [
        'It subtracts expectation effects and rater bias, isolating what the MEDICINE itself adds',
        'It tricks the control group for fun',
        'It proves the medicine works before testing it',
        'It makes the study cheaper',
      ],
      correct: 0,
    },
    hints: [
      'Believing you were treated can genuinely shift symptoms — for everyone, in both groups.',
      'If raters know who got the real pill, their judgments drift — honestly and invisibly.',
      'Worked path: identical pill + double blind = both groups share the expectation effect, so the DIFFERENCE is the medicine.',
    ],
    explanation:
      'Expectation alone moves self-reported symptoms (the placebo response), and knowing the assignment quietly bends even honest raters. Giving both groups the same belief and hiding the assignment from everyone means both groups carry identical psychology — so any remaining gap belongs to the medicine. Blinding is not distrust of people; it is engineering around a bias every human has. The same logic applies to taste tests and grading your own predictions.',
  },
)

// ---------------------------------------------------------------- observer / insight / meta depth

const conversationRecall = tpl(
  {
    id: 'o-dialogue-recall',
    name: 'Conversation Recall',
    skillIds: ['o-listen', 'o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: 2,
    minutes: 4,
    kind: 'multi',
  },
  (_rng, seed) => {
    const dialogues = [
      {
        study:
          'OVERHEARD AT THE BUS STOP\n\nMaya: "Practice moved to Thursday this week — coach has a thing Wednesday."\nJon: "Thursday?! I have dentist at 4."\nMaya: "It\'s at 5:30, you\'re fine. Bring the blue jerseys, we\'re photographing."\nJon: "Blue, got it. Front gate after?"\nMaya: "Side gate — front\'s closed for repairs."',
        parts: [
          { prompt: 'What day is practice this week?', answer: { type: 'mcq' as const, options: ['Thursday', 'Wednesday', 'Friday', 'Unchanged'], correct: 0 }, explanation: 'Moved to Thursday because the coach is busy Wednesday — two days were mentioned; the SWAP direction is the detail.' },
          { prompt: 'Why is Jon actually fine despite the dentist?', answer: { type: 'mcq' as const, options: ['Practice is at 5:30, after his 4:00 appointment', 'The dentist canceled', 'He\'s skipping practice', 'The coach excused him'], correct: 0 }, explanation: 'The times resolve the conflict: 4:00 dentist, 5:30 practice. Recalling WHY, not just THAT, is comprehension-grade listening.' },
          { prompt: 'Where do they meet after?', answer: { type: 'mcq' as const, options: ['Side gate', 'Front gate', 'The parking lot', 'It wasn\'t said'], correct: 0 }, explanation: 'Front gate was PROPOSED then corrected to side gate — conversations overwrite themselves, and memory must track the final state.' },
        ],
      },
      {
        study:
          'PLANNING CALL (SPEAKERPHONE)\n\nAva: "Bake sale is Saturday, setup at 8, sale at 9."\nSam: "I\'ll bring the folding table. Can you do the cashbox?"\nAva: "Dad has one. Oh — Priya\'s allergic to peanuts, so label everything."\nSam: "Labels, yes. And napkins?"\nAva: "Already bought. Just don\'t forget the table this time."',
        parts: [
          { prompt: 'What time is SETUP?', answer: { type: 'mcq' as const, options: ['8:00', '9:00', 'Saturday noon', 'Not stated'], correct: 0 }, explanation: 'Setup 8, sale 9 — two adjacent numbers, easy to swap. Anchoring each number to its noun is the encoding move.' },
          { prompt: 'Why must everything be labeled?', answer: { type: 'mcq' as const, options: ['Priya has a peanut allergy', 'School rules require it', 'For pricing', 'It wasn\'t explained'], correct: 0 }, explanation: 'The REASON (allergy) matters more than the instruction — safety-relevant details deserve priority encoding.' },
          { prompt: 'What is Sam responsible for bringing?', answer: { type: 'mcq' as const, options: ['The folding table', 'The cashbox', 'Napkins', 'The labels only'], correct: 0 }, explanation: 'Sam: table (with a pointed reminder). Ava: cashbox via her dad; napkins already handled. Tracking WHO owns WHAT is the skill meetings quietly test.' },
        ],
      },
    ]
    const d = dialogues[seed % dialogues.length]
    return {
      title: 'Listen like it matters',
      prompt: 'Study the conversation. Then answer from memory — including who owns what and what got corrected.',
      parts: [
        { study: d.study, studySeconds: 35, prompt: d.parts[0].prompt, answer: d.parts[0].answer, explanation: d.parts[0].explanation },
        { prompt: d.parts[1].prompt, answer: d.parts[1].answer, explanation: d.parts[1].explanation },
        { prompt: d.parts[2].prompt, answer: d.parts[2].answer, explanation: d.parts[2].explanation },
      ],
      hints: [
        'Conversations overwrite themselves — track the FINAL state of each fact.',
        'Anchor numbers to their nouns ("setup-8, sale-9") and note who owns each task.',
        'No worked path for memory — the explanations follow your answers.',
      ],
      explanation:
        'Real listening tracks a changing state: proposals get corrected, times attach to events, tasks attach to people, and reasons outrank instructions. If you missed the correction ("side gate"), you heard the words and lost the state — the exact failure mode of half-listening.',
    }
  },
)

const apologyQuality = fixed(
  { id: 'h-apology', name: 'Real vs. non-apology', skillIds: ['h-boundary', 'h-emotion'], bucket: 'insight', difficulty: 2, minutes: 2.5 },
  {
    title: 'Spot the real one',
    prompt: 'You were left waiting an hour. Which of these is an actual apology?',
    answer: {
      type: 'mcq',
      options: [
        '"I\'m sorry — I lost track of time and left you waiting an hour. Next time I\'ll message the moment I\'m running late."',
        '"I\'m sorry you feel that way."',
        '"I\'m sorry, BUT you\'re honestly too sensitive about time."',
        '"Mistakes were made, I guess."',
      ],
      correct: 0,
    },
    hints: [
      'A real apology has three parts: names the act, owns it, and changes something.',
      '"Sorry you feel", "sorry but", and the passive voice each delete one of those parts.',
      'Worked path: only the first names the act, takes ownership, and commits to a change.',
    ],
    explanation:
      'Anatomy of a real apology: the ACT named plainly, ownership without a "but", and a concrete repair. "Sorry you feel that way" relocates the problem into your feelings; "sorry but" retracts the apology mid-sentence; "mistakes were made" removes the person who made them. Knowing the anatomy cuts both ways: it helps you GIVE clean apologies and calmly notice when you are being handed an empty one.',
  },
)

const assertiveness = fixed(
  { id: 'h-assertive', name: 'Passive, aggressive, assertive', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 2, minutes: 3 },
  {
    title: 'Three voices',
    prompt:
      'A friend keeps borrowing your calculator and returning it late. Label each possible response.',
    answer: {
      type: 'classify',
      categories: ['Passive', 'Aggressive', 'Assertive'],
      statements: [
        { text: 'Say nothing and quietly buy a second calculator', category: 0 },
        { text: '"You ALWAYS do this — you\'re so selfish!"', category: 1 },
        { text: '"I need it back by Friday. If that doesn\'t work, I can\'t lend it."', category: 2 },
        { text: 'Lend it while sighing loudly and complaining to others later', category: 0 },
        { text: 'Grab it back from their bag without a word', category: 1 },
        { text: '"I\'m glad to share it — returning it late leaves me stuck, so Friday is the deal."', category: 2 },
      ],
    },
    hints: [
      'Passive erases YOUR needs; aggressive erases THEIRS; assertive states yours while leaving them intact.',
      'Check each: whose needs survived the sentence?',
      'Worked path: the two clear-request options are assertive; silence and sighing are passive; attacks and grabbing are aggressive.',
    ],
    explanation:
      'Passive responses trade your needs for surface peace (and leak out as resentment); aggressive ones defend your needs by attacking the person; assertive ones state the need, the limit, and the consequence — no insult, no essay. Assertiveness is also the strategic optimum: it is the only style that solves the problem while keeping the relationship.',
  },
)

const spacingPlanner = fixed(
  { id: 'x-spacing-plan', name: 'Plan the spacing', skillIds: ['x-learn'], bucket: 'meta', difficulty: 2, minutes: 2.5 },
  {
    title: 'Place your reviews',
    prompt:
      'You learn a topic Monday; the test is in two weeks. You will review it three times. Order these plans from what the spacing research supports most to least.',
    answer: {
      type: 'order',
      options: [
        'Tue · Fri · next Wed (expanding gaps across both weeks)',
        'Tue · Wed · Thu (all reviews immediately after learning)',
        'Three reviews the night before the test',
      ],
      correct: [0, 1, 2],
    },
    hints: [
      'Spacing beats massing; gaps that grow with the retention target beat tight clusters.',
      'The night-before plan can pass tomorrow\'s quiz and lose the two-week test.',
      'Worked path: expanding across the window > early cluster > final-night cram.',
    ],
    explanation:
      'Distributed practice with gaps scaled to the retention interval is among the best-replicated effects in learning research (Cepeda et al.; the IES guide\'s first recommendation). The early cluster at least repeats retrieval but wastes the second week; the cram maximizes forgetting before the test and confidence during it — the worst combination. This app\'s review ladder automates exactly the first plan.',
  },
)

export const EXPANSION_TEMPLATES: ItemTemplate[] = [
  zeroSum,
  coordination,
  commitment,
  titForTat,
  negExponents,
  gcfFactor,
  absValue,
  ineqWord,
  slopeIntercept,
  freeFall,
  power,
  seriesResistors,
  efficiency,
  shadowBug,
  mapFilter,
  sampleSize,
  blinding,
  conversationRecall,
  apologyQuality,
  assertiveness,
  spacingPlanner,
]
