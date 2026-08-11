/**
 * Foundation rungs for skills that had no way in.
 *
 * ## The gap this closes
 *
 * Measured across the whole bank: **44 of 122 skills offered nothing easier
 * than 3★ ("Combining — combine ideas without scaffolding or choose the method
 * yourself"), and 14 of them started at 4★ ("Advanced — multi-step reasoning
 * or transfer into a less familiar context").** For those skills the first
 * thing a learner ever met was an advanced problem.
 *
 * That is not a tuning problem, it is a hole. Simulated over a year with a
 * learner whose accuracy responds to difficulty: someone struggling sat at
 * **14–19% first-try accuracy for twelve straight months** while
 * `stretchSignal` reported its maximum easing (`adjust = −1`) every single
 * month and the mean difficulty actually served **rose** from 2.6 to 2.9. The
 * dial was hard over and the content could not follow it, because on those
 * skills there was nothing easier to serve.
 *
 * It also contradicts the app's own instructional model. RESEARCH.md §4 (worked
 * examples, expertise reversal) is the reason the support ladder exists at all:
 * novices need a low-load entry and the advantage of scaffolding reverses only
 * as expertise grows. A skill whose easiest task is "combine ideas without
 * scaffolding" has no novice rung.
 *
 * ## What these are
 *
 * One 1★ or 2★ item per skill: a single idea, in a familiar form, answerable
 * by recognising or applying one definition — deliberately NOT a small version
 * of the hard task. Every answer is computed. They are the first rung, not the
 * curriculum: the existing 3★ and 4★ families remain the destination.
 *
 * The 30 skills whose easiest item is 3★ are recorded as open work in
 * RESEARCH.md §32 rather than fixed here; the audit gate added alongside this
 * file holds the line at "nothing starts above 3★".
 */
import type { ItemTemplate } from '../../domain/types'
import { rint } from '../../engine/rng'
import { cycle, mcq, numeric, tpl } from '../lib'

/* ------------------------------------------------------------ probability */

const condProbRead = tpl(
  { id: 'onramp-condprob', name: 'Read a two-way table', skillIds: ['m-conditionalprob'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2 },
  (rng) => {
    const a = rint(rng, 6, 20)
    const b = rint(rng, 4, 18)
    const c = rint(rng, 5, 15)
    const d = rint(rng, 3, 14)
    const table =
      `|  | Plays an instrument | Does not | Total |\n| --- | --- | --- | --- |\n` +
      `| Year 8 | ${a} | ${b} | ${a + b} |\n| Year 9 | ${c} | ${d} | ${c + d} |\n` +
      `| Total | ${a + c} | ${b + d} | ${a + b + c + d} |`
    return {
      title: 'Two-way table',
      prompt:
        `${table}\n\nOf the **Year 8** students only, how many play an instrument?\n\n` +
        `(Just read the table — no calculation beyond finding the right cell.)`,
      answer: numeric(a),
      hints: [
        'Find the Year 8 row first, then move across to the "plays an instrument" column.',
        'The cell where that row and that column meet is the answer — not a total.',
        `Worked path: Year 8 row, instrument column = **${a}**.`,
      ],
      explanation:
        `**${a}**. The row picks the group (Year 8), the column picks the property (plays an instrument), and the cell where they cross is the count of people with both.\n\n` +
        `This is the whole foundation of conditional probability: "given Year 8" means **look only at that row**. Once you can find the cell, P(instrument | Year 8) is just ${a} ÷ ${a + b}.`,
    }
  },
)

const inferenceScope = tpl(
  { id: 'onramp-inference', name: 'Sample or population?', skillIds: ['m-inference'], bucket: 'math', difficulty: 1, variants: 6, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { text: 'A school has 800 students. A researcher asks 60 of them about screen time.', pop: 'All 800 students', samp: 'The 60 students asked' },
      { text: 'A factory makes 5,000 bulbs a day. An inspector tests 40 of them.', pop: 'All 5,000 bulbs made that day', samp: 'The 40 bulbs tested' },
      { text: 'A city has 12,000 households. A survey reaches 300 of them.', pop: 'All 12,000 households', samp: 'The 300 households surveyed' },
      { text: 'A farm has 250 apple trees. A grower weighs the apples from 15 trees.', pop: 'All 250 trees', samp: 'The 15 trees weighed' },
      { text: 'A library holds 9,000 books. A volunteer checks 120 for damage.', pop: 'All 9,000 books', samp: 'The 120 books checked' },
      { text: 'A league has 40 teams. A reporter interviews players from 6 teams.', pop: 'All 40 teams', samp: 'The 6 teams interviewed' },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Sample vs population',
      prompt: `${c.text}\n\nWhich group is the **sample**?`,
      answer: mcq(rng, c.samp, [c.pop, 'Both groups together', 'Neither — this is not a study']),
      hints: [
        'The population is everyone you want to know about. The sample is the part you actually looked at.',
        'Which group was actually measured?',
        `Worked path: **${c.samp}**.`,
      ],
      explanation:
        `**${c.samp}** is the sample: the part actually measured. ${c.pop} is the population — everyone the conclusion is meant to be about.\n\n` +
        `Every inference question is the same shape underneath: you measured the sample and you want to say something about the population. Naming which is which is the first move, and mixing them up is where most bad statistics starts.`,
    }
  },
)

/* --------------------------------------------------------------- algebra */

const radicalMeaning = tpl(
  { id: 'onramp-radicals', name: 'What a fractional exponent means', skillIds: ['m-radicals'], bucket: 'math', difficulty: 1, variants: 8, minutes: 2 },
  (_rng, seed) => {
    const bases = [4, 9, 16, 25, 36, 49, 64, 81]
    const b = cycle(seed, bases)
    const root = Math.sqrt(b)
    return {
      title: 'Fractional exponents',
      prompt: `A power of one half means a square root: x^(1/2) = √x.\n\nWhat is **${b}^(1/2)**?`,
      answer: numeric(root),
      hints: [
        'The exponent 1/2 is another way of writing the square root sign.',
        `So this is asking: what number times itself gives ${b}?`,
        `Worked path: √${b} = **${root}**.`,
      ],
      explanation:
        `${b}^(1/2) = √${b} = **${root}**, because ${root} × ${root} = ${b}.\n\n` +
        `Why the notation is worth trusting: exponents add when you multiply, so x^(1/2) × x^(1/2) = x^1 = x. The only thing that can multiply by itself to give x IS the square root of x. The rule is not an extra convention to memorise — it is forced by the exponent rules you already have.`,
    }
  },
)

const polyDegree = tpl(
  { id: 'onramp-polyadvanced', name: 'Degree and leading term', skillIds: ['m-polyadvanced'], bucket: 'math', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const deg = rint(rng, 3, 6)
    const lead = rint(rng, 2, 9)
    const mid = rint(rng, 1, 8)
    const con = rint(rng, 1, 9)
    const midDeg = rint(rng, 1, deg - 1)
    const poly = `${lead}x^${deg} + ${mid}x^${midDeg} − ${con}`
    return {
      title: 'Degree of a polynomial',
      prompt: `Consider **${poly}**.\n\nWhat is its **degree** (the highest power of x)?`,
      answer: numeric(deg),
      hints: [
        'Look only at the exponents on x. Ignore the numbers in front.',
        `The powers present are ${deg} and ${midDeg} (the last term is a constant, power 0).`,
        `Worked path: the highest is **${deg}**.`,
      ],
      explanation:
        `The powers of x are ${deg}, ${midDeg} and 0, so the degree is **${deg}**.\n\n` +
        `Degree is the single most useful number about a polynomial: it caps how many real zeros it can have (at most ${deg}), it decides the end behaviour of the graph, and it tells you how far a division will go. Everything later in this skill starts from reading it off correctly.`,
    }
  },
)

const rationalRestriction = tpl(
  { id: 'onramp-rationalfunc', name: 'Where a fraction breaks', skillIds: ['m-rationalfunc'], bucket: 'math', difficulty: 1, variants: 10, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 12)
    const num = rint(rng, 1, 9)
    return {
      title: 'Forbidden value',
      prompt: `A fraction is undefined when its denominator is zero.\n\nFor what value of x is **${num} / (x − ${a})** undefined?`,
      answer: numeric(a),
      hints: [
        'Ask what makes the bottom equal zero — the top never matters for this.',
        `Solve x − ${a} = 0.`,
        `Worked path: x = **${a}**.`,
      ],
      explanation:
        `The denominator x − ${a} is zero when x = **${a}**, so the expression is undefined there.\n\n` +
        `Dividing by zero is not "infinity" and not "zero" — it is undefined, meaning no number satisfies it. Every later question about restrictions, holes and asymptotes is built on finding these values first, and forgetting them is the standard way to produce an answer that does not exist.`,
    }
  },
)

const radicalCheck = tpl(
  { id: 'onramp-radicaleq', name: 'Check a proposed solution', skillIds: ['m-radicaleq'], bucket: 'math', difficulty: 2, variants: 10, minutes: 2 },
  (rng, seed) => {
    const root = rint(rng, 2, 9)
    const inside = root * root
    const shift = rint(rng, 1, 6)
    const claimed = cycle(seed, [true, false, true, false, true, false, true, false, true, false])
    const x = claimed ? inside + shift : inside + shift + rint(rng, 1, 5)
    const lhs = Math.sqrt(x - shift)
    const works = Math.abs(lhs - root) < 1e-9
    return {
      title: 'Does it actually work?',
      prompt:
        `Someone says **x = ${x}** solves the equation **√(x − ${shift}) = ${root}**.\n\n` +
        `Substitute it and check. Is it correct? Answer **1** for yes, **0** for no.`,
      answer: numeric(works ? 1 : 0),
      hints: [
        'Put the number in wherever x appears, then work the left side out.',
        `Left side: √(${x} − ${shift}) = √${x - shift}.`,
        `Worked path: √${x - shift} = ${Number(lhs.toFixed(4))}, and the right side is ${root}, so the answer is **${works ? 1 : 0}**.`,
      ],
      explanation:
        `√(${x} − ${shift}) = √${x - shift} = ${Number(lhs.toFixed(4))}, against a right side of ${root}. So the claim is **${works ? 'correct' : 'wrong'}**.\n\n` +
        `Substituting back is not optional politeness in this topic — it is part of the method. Squaring both sides of an equation can create solutions the original never had (extraneous roots), and the ONLY way to catch one is to put it back in and look.`,
    }
  },
)

const logMeaning = tpl(
  { id: 'onramp-logarithms', name: 'A logarithm asks for the exponent', skillIds: ['m-logarithms'], bucket: 'math', difficulty: 1, variants: 9, minutes: 2 },
  (_rng, seed) => {
    const pairs = [
      { b: 2, e: 3 }, { b: 2, e: 5 }, { b: 3, e: 2 }, { b: 3, e: 4 }, { b: 5, e: 2 },
      { b: 5, e: 3 }, { b: 10, e: 2 }, { b: 10, e: 3 }, { b: 4, e: 3 },
    ]
    const c = cycle(seed, pairs)
    const val = c.b ** c.e
    return {
      title: 'Reading a logarithm',
      prompt:
        `**log_b(y)** asks one question: **what power of b gives y?**\n\n` +
        `What is **log_${c.b}(${val})**?`,
      answer: numeric(c.e),
      hints: [
        `Rewrite it as a question: ${c.b} to the power of what equals ${val}?`,
        `Try counting up: ${c.b}, ${c.b ** 2}, ${c.b ** 3}…`,
        `Worked path: ${c.b}^${c.e} = ${val}, so the answer is **${c.e}**.`,
      ],
      explanation:
        `${c.b}^${c.e} = ${val}, so log_${c.b}(${val}) = **${c.e}**.\n\n` +
        `A logarithm is not a new operation to fear — it is the exponent, extracted. Every log property you will meet later is an exponent rule wearing different clothes: log(xy) = log x + log y is just "multiply powers, add exponents" read backwards.`,
    }
  },
)

/* -------------------------------------------------------------- geometry */

const trigNameRatio = tpl(
  { id: 'onramp-trig', name: 'Which side is which?', skillIds: ['m-trig'], bucket: 'math', difficulty: 1, variants: 3, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { ask: 'the **hypotenuse**', correct: 'The side opposite the right angle — always the longest', wrong: ['The side next to angle A', 'The side across from angle A', 'The shortest side'] },
      { ask: 'the side **opposite** angle A', correct: 'The side that does not touch angle A at all', wrong: ['The longest side of the triangle', 'The side between angle A and the right angle', 'The side opposite the right angle'] },
      { ask: 'the side **adjacent** to angle A', correct: 'The side touching angle A that is not the hypotenuse', wrong: ['The side across from angle A', 'The side opposite the right angle', 'Either of the two shorter sides'] },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Naming the sides',
      prompt:
        `In a right triangle with one angle marked **A** (not the right angle), which side is ${c.ask}?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Stand at angle A and look around: one side runs away from you, two touch you.',
        'The hypotenuse is fixed by the right angle; "opposite" and "adjacent" are relative to the angle you picked.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**\n\n` +
        `Sine, cosine and tangent are only ratios of these three sides, so naming them is the entire prerequisite. The one thing to hold onto: the hypotenuse never moves, but which side is "opposite" and which is "adjacent" changes the moment you look from the other acute angle — which is exactly why sin and cos swap places.`,
    }
  },
)

const congruenceMeaning = tpl(
  { id: 'onramp-congruence', name: 'Congruent or just similar?', skillIds: ['m-congruence'], bucket: 'math', difficulty: 2, variants: 6, minutes: 2 },
  (rng, seed) => {
    const k = rint(rng, 2, 4)
    const a = rint(rng, 3, 9)
    const cases = [
      {
        text: `Triangle P has sides ${a}, ${a + 2}, ${a + 3}. Triangle Q has sides ${a}, ${a + 2}, ${a + 3}.`,
        correct: 'Congruent — same shape and same size',
        why: 'Every side matches exactly, so one can be slid, turned or flipped onto the other with nothing stretched.',
      },
      {
        text: `Triangle P has sides ${a}, ${a + 2}, ${a + 3}. Triangle Q has sides ${a * k}, ${(a + 2) * k}, ${(a + 3) * k}.`,
        correct: 'Similar but not congruent — same shape, different size',
        why: `Every side of Q is exactly ${k} times the matching side of P, so the angles match but the sizes do not.`,
      },
      {
        text: `Triangle P has sides ${a}, ${a + 2}, ${a + 3}. Triangle Q has sides ${a}, ${a + 2}, ${a + 5}.`,
        correct: 'Neither — the shapes are genuinely different',
        why: 'Two sides match but the third does not, and no single scale factor relates them, so the angles differ.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Congruent, similar, or neither?',
      prompt: `${c.text}\n\nWhat is the relationship?`,
      answer: mcq(rng, c.correct, [
        'Congruent — same shape and same size',
        'Similar but not congruent — same shape, different size',
        'Neither — the shapes are genuinely different',
      ].filter((x) => x !== c.correct)),
      hints: [
        'Congruent means identical: every matching side equal. Similar means every side multiplied by the SAME number.',
        'Divide each side of Q by the matching side of P and see whether you get the same answer three times.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nCongruence proof is built entirely on this distinction: a proof establishes that a rigid motion (slide, turn, flip — never a stretch) carries one figure exactly onto the other. Anything that changes size is a different claim.`,
    }
  },
)

const lawChoice = tpl(
  { id: 'onramp-nonrighttrig', name: 'Sines or Cosines?', skillIds: ['m-nonrighttrig'], bucket: 'math', difficulty: 2, variants: 6, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { given: 'two angles and one side (AAS)', correct: 'Law of Sines', why: 'you have a complete angle-and-opposite-side pair, which is exactly what the Law of Sines needs.' },
      { given: 'all three sides (SSS)', correct: 'Law of Cosines', why: 'no angle is known, so no angle-side pair exists — the Law of Sines has nothing to start from.' },
      { given: 'two sides and the angle BETWEEN them (SAS)', correct: 'Law of Cosines', why: 'the known angle sits between the known sides, so it is not opposite either of them.' },
      { given: 'one angle and the side opposite it, plus one more side (SSA)', correct: 'Law of Sines', why: 'you already have a matched angle-opposite-side pair to build the ratio from.' },
      { given: 'two angles and the side between them (ASA)', correct: 'Law of Sines', why: 'the third angle follows from the angle sum, which then gives you a matched pair.' },
      { given: 'two sides and the included angle, and you want the third side', correct: 'Law of Cosines', why: 'it is the direct generalisation of Pythagoras for exactly this arrangement.' },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Choosing the law',
      prompt:
        `The Law of Sines needs an angle **paired with the side opposite it**. The Law of Cosines does not.\n\n` +
        `You know ${c.given}. Which law can you start with?`,
      answer: mcq(rng, c.correct, ['Law of Sines', 'Law of Cosines', 'Neither — the triangle is not determined'].filter((x) => x !== c.correct)),
      hints: [
        'Ask one question: do I have an angle together with the side directly across from it?',
        'If yes, Sines. If no, Cosines.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}** — ${c.why}\n\nAlmost every mistake in this topic is choosing the wrong law, not the algebra afterwards. The test is one question long: is there a matched angle-and-opposite-side pair? Sines needs one; Cosines was built for when there isn't.`,
    }
  },
)

const unitCircleQuadrant = tpl(
  { id: 'onramp-trigfunctions', name: 'Sine and cosine are coordinates', skillIds: ['m-trigfunctions'], bucket: 'math', difficulty: 1, variants: 8, minutes: 2 },
  (_rng, seed) => {
    const cases = [
      { ang: 0, x: 1, y: 0 }, { ang: 90, x: 0, y: 1 }, { ang: 180, x: -1, y: 0 }, { ang: 270, x: 0, y: -1 },
      { ang: 360, x: 1, y: 0 }, { ang: 90, x: 0, y: 1 }, { ang: 180, x: -1, y: 0 }, { ang: 0, x: 1, y: 0 },
    ]
    const c = cycle(seed, cases)
    const wantCos = (seed % 2) === 0
    return {
      title: 'The unit circle',
      prompt:
        `On the unit circle, the point at angle θ has coordinates **(cos θ, sin θ)** — cosine is the x, sine is the y.\n\n` +
        `At **θ = ${c.ang}°** the point is at (${c.x}, ${c.y}). What is **${wantCos ? 'cos' : 'sin'} ${c.ang}°**?`,
      answer: numeric(wantCos ? c.x : c.y),
      hints: [
        'Cosine is the first coordinate (across), sine is the second (up).',
        `The point is (${c.x}, ${c.y}).`,
        `Worked path: **${wantCos ? c.x : c.y}**.`,
      ],
      explanation:
        `${wantCos ? 'Cosine' : 'Sine'} is the ${wantCos ? 'x' : 'y'}-coordinate, so ${wantCos ? 'cos' : 'sin'} ${c.ang}° = **${wantCos ? c.x : c.y}**.\n\n` +
        `This one definition replaces a table of memorised values. Once sine and cosine are coordinates on a circle, the periodicity is obvious (go round again and you land in the same place), the sign in each quadrant is obvious, and sin²θ + cos²θ = 1 is just Pythagoras on a radius of 1.`,
    }
  },
)

const circleParts = tpl(
  { id: 'onramp-circleproof', name: 'Naming the parts of a circle', skillIds: ['m-circleproof'], bucket: 'math', difficulty: 1, variants: 6, minutes: 2 },
  (rng, seed) => {
    const cases = [
      { term: 'chord', correct: 'A straight line joining two points ON the circle', wrong: ['A line touching the circle at exactly one point', 'A line from the centre to the edge', 'A piece of the curved edge'] },
      { term: 'tangent', correct: 'A straight line touching the circle at exactly one point', wrong: ['A line joining two points on the circle', 'A line through the centre', 'A piece of the curved edge'] },
      { term: 'arc', correct: 'A piece of the curved edge itself', wrong: ['A straight line joining two points on the circle', 'A line touching at one point', 'The region between two radii'] },
      { term: 'radius', correct: 'A line from the centre to a point on the circle', wrong: ['A line joining two points on the circle', 'A line all the way across through the centre', 'A line touching at one point'] },
      { term: 'diameter', correct: 'A chord that passes through the centre', wrong: ['Any line joining two points on the circle', 'A line from the centre to the edge', 'A line touching at one point'] },
      { term: 'sector', correct: 'The pie-slice region between two radii and an arc', wrong: ['The region cut off by a chord', 'A piece of the curved edge', 'A line touching at one point'] },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Circle vocabulary',
      prompt: `In circle geometry, what is a **${c.term}**?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Sort the words into three families: straight lines, pieces of the curve, and regions.',
        'Ask whether the thing touches the circle at one point, two points, or is part of the curve.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `A **${c.term}** is ${c.correct.charAt(0).toLowerCase()}${c.correct.slice(1)}.\n\n` +
        `Circle theorems are almost entirely statements about how these parts relate — the angle in a semicircle, the tangent–radius right angle, equal angles on the same arc. A theorem you cannot parse is usually a vocabulary problem rather than a reasoning one, which is why this comes first.`,
    }
  },
)

const midpointDistance = tpl(
  { id: 'onramp-coordinategeometry', name: 'Midpoint of a segment', skillIds: ['m-coordinategeometry'], bucket: 'math', difficulty: 1, variants: 12, minutes: 2 },
  (rng, seed) => {
    const x1 = rint(rng, -8, 8) * 2
    const y1 = rint(rng, -8, 8) * 2
    const x2 = rint(rng, -8, 8) * 2
    const y2 = rint(rng, -8, 8) * 2
    const wantX = (seed % 2) === 0
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    return {
      title: 'Midpoint',
      prompt:
        `The midpoint of a segment is the **average** of the endpoints, one coordinate at a time.\n\n` +
        `A(${x1}, ${y1}) and B(${x2}, ${y2}). What is the **${wantX ? 'x' : 'y'}-coordinate** of the midpoint?`,
      answer: numeric(wantX ? mx : my),
      hints: [
        'Average the two x-values for the x of the midpoint; average the two y-values for the y.',
        wantX ? `(${x1} + ${x2}) ÷ 2` : `(${y1} + ${y2}) ÷ 2`,
        `Worked path: **${wantX ? mx : my}**.`,
      ],
      explanation:
        wantX
          ? `(${x1} + ${x2}) ÷ 2 = **${mx}**.`
          : `(${y1} + ${y2}) ÷ 2 = **${my}**.\n`,
    }
  },
)

/* ------------------------------------------------------------ investigator */

const commitmentIdea = tpl(
  { id: 'onramp-commit', name: 'Why burning a bridge can help', skillIds: ['i-commit'], bucket: 'investigator', difficulty: 2, variants: 4, minutes: 2 },
  (rng, seed) => {
    const cases = [
      {
        text: 'A shop advertises "prices fixed — staff cannot negotiate, and they have no authority to change them."',
        correct: 'It removes the shop\'s own option to lower the price, so haggling stops being worth trying',
        why: 'A promise you COULD break invites pressure. A promise you cannot break ends the argument, because the other side gains nothing by pushing.',
      },
      {
        text: 'A friend hands you their phone before studying and asks you not to give it back for two hours.',
        correct: 'They remove their own ability to give in later, when the temptation will be stronger',
        why: 'The person deciding now and the person tempted in twenty minutes want different things. Taking the option away in advance settles it while the calm version is in charge.',
      },
      {
        text: 'A country signs a public treaty with a penalty for breaking it.',
        correct: 'The public penalty makes the promise costly to break, which is what makes others believe it',
        why: 'A commitment is only worth something to the OTHER side if breaking it would hurt you. That is what turns a statement into evidence.',
      },
      {
        text: 'A seller lists a house at a price and publicly refuses all offers below it for 30 days.',
        correct: 'Making the refusal public raises the cost of backing down, so low offers stop arriving',
        why: 'Announcing it converts a private preference into a reputational stake, which is precisely what makes it credible.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Commitment',
      prompt: `${c.text}\n\nWhy might deliberately removing your own options be an advantage here?`,
      answer: mcq(rng, c.correct, [
        'It is never an advantage of any kind, because having more options is always better',
        'It hides useful information from the other side of the table',
        'It makes the other side feel guilty enough to agree to whatever it is',
      ]),
      hints: [
        'Normally more choices are better. Ask what changes when the OTHER side can see which choices you no longer have.',
        'What would the other side do differently if they knew you genuinely could not back down?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.why}\n\n` +
        `The counter-intuitive core of this whole topic: in a decision made alone, options can only help. In a situation where someone is reacting to you, an option you visibly cannot take is an option they cannot push you toward. Note the boundary — this only works when the commitment is genuine and visible. Pretending to be committed is a bluff, which is a different thing and a worse one.`,
    }
  },
)

export const ONRAMP_TEMPLATES: ItemTemplate[] = [
  condProbRead,
  inferenceScope,
  radicalMeaning,
  polyDegree,
  rationalRestriction,
  radicalCheck,
  logMeaning,
  trigNameRatio,
  congruenceMeaning,
  lawChoice,
  unitCircleQuadrant,
  circleParts,
  midpointDistance,
  commitmentIdea,
]
