/**
 * Advanced tier — difficulty 4 and 5, placed where the bank measurably ran out.
 *
 * Written after measuring the ceiling per skill rather than guessing: 57 of 97
 * skills topped out at difficulty 3 or below, Meta Lab had NO item above 3 at
 * all, and core math skills (`m-expressions`, `m-lineq1`, `m-coord`) capped at
 * 2 — so however well the learner did, the planner had nothing harder to give
 * them. That is a content ceiling, not a planner problem, and only content
 * fixes it.
 *
 * What "harder" means here, per `difficulty.ts`: 4 is multi-step reasoning or
 * an unfamiliar context; 5 is synthesising several constraints under
 * uncertainty. Never a speed trick, never an obscure fact — the difficulty is
 * in the reasoning, and every numeric answer is COMPUTED from the generated
 * values so it cannot drift from the question.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, fracStr, mcq, numeric, simplify, tpl } from '../lib'

// ================================================================ math

/**
 * The classic double trap: a negative distributed across a difference, then
 * evaluated at a negative value. Both signs have to survive.
 */
const negativeDistribute = tpl(
  { id: 'adv-neg-distribute', name: 'Sign discipline', skillIds: ['m-expressions'], bucket: 'math', difficulty: 4, variants: 24, minutes: 3, calibration: true },
  (_rng, seed) => {
    const a = 2 + (seed % 4)
    const b = 3 + (Math.floor(seed / 4) % 3)
    const c = 1 + (Math.floor(seed / 12) % 2)
    const x = -(1 + (Math.floor(seed / 4) % 3))
    // 5 - a(x - b) - c(2x + 1), fully computed at x.
    const value = 5 - a * (x - b) - c * (2 * x + 1)
    const xCoef = -a - 2 * c
    const constant = 5 + a * b - c
    return {
      title: 'Simplify, then evaluate',
      prompt: `Simplify **5 − ${a}(x − ${b}) − ${c}(2x + 1)**, then evaluate it at **x = ${x}**.\n\nEnter the final value.`,
      answer: numeric(value),
      hints: [
        'Distribute each bracket completely before combining anything — including the minus sign in front of it.',
        `The second bracket is subtracted, so both of its terms flip: −${c}(2x + 1) = −${2 * c}x − ${c}.`,
        `Simplified: ${xCoef}x + ${constant}. At x = ${x}: ${xCoef}(${x}) + ${constant} = **${value}**.`,
      ],
      explanation: `−${a}(x − ${b}) = −${a}x + ${a * b} (the minus meets the −${b} and the sign turns), and −${c}(2x + 1) = −${2 * c}x − ${c}.\n\nCollecting: **${xCoef}x + ${constant}**. Substituting x = ${x} gives **${value}**.\n\nSubstituting before simplifying works too and is a good check. What does not work is distributing the number but not the sign — that is the single most common way this goes wrong, and it survives all the way to a confident wrong answer.`,
      commonErrors: {
        slip: `Distributing −${a} as +${a} over the −${b}, which lands on ${5 - a * (x - b) + 0} before the second bracket is even touched.`,
      },
    }
  },
)

/**
 * Equations that do not have one solution. Most practice guarantees exactly one
 * answer, which quietly teaches that an equation always has one.
 */
const equationNature = tpl(
  { id: 'adv-eq-nature', name: 'One, none, or all', skillIds: ['m-lineq1'], bucket: 'math', difficulty: 4, variants: 18, minutes: 3 },
  (rng, seed) => {
    const kind = seed % 3
    const a = 2 + (Math.floor(seed / 3) % 3)
    const b = 1 + (Math.floor(seed / 9) % 4)
    const c = 3 + (seed % 5)
    let prompt: string
    let correct: string
    let why: string
    if (kind === 0) {
      // a(x + b) = ax + ab  → identity
      prompt = `${a}(x + ${b}) = ${a}x + ${a * b}`
      correct = 'Every number — the two sides are the same expression'
      why = `Distributing the left gives ${a}x + ${a * b}, which is exactly the right. The variable cancels and leaves a statement that is simply true, so every x works.`
    } else if (kind === 1) {
      // ax + b = ax + (b+c) → no solution
      prompt = `${a}x + ${b} = ${a}x + ${b + c}`
      correct = 'No number — the equation contradicts itself'
      why = `Subtracting ${a}x from both sides leaves ${b} = ${b + c}, which is false. Nothing about x can rescue it, so there is no solution.`
    } else {
      // ax + b = (a+1)x + (b-c) → single solution x = c
      prompt = `${a}x + ${b} = ${a + 1}x + ${b - c}`
      correct = `Exactly one number, x = ${c}`
      why = `The x terms do not match, so they do not cancel: subtracting ${a}x gives ${b} = x + ${b - c}, hence x = ${c}.`
    }
    const wrong = [
      kind === 0 ? 'No number — the equation contradicts itself' : 'Every number — the two sides are the same expression',
      kind === 2 ? 'No number — the equation contradicts itself' : `Exactly one number, x = ${c}`,
      'Exactly two numbers, since the variable appears on both sides',
    ]
    return {
      title: 'How many solutions?',
      prompt: `**${prompt}**\n\nHow many numbers satisfy this?`,
      answer: mcq(rng, correct, wrong),
      hints: [
        'Do not hunt for a value yet. Collect the x terms on one side and see what is left.',
        'If the x terms cancel, the equation has become a claim about numbers only — and that claim is either always true or never true.',
        `Worked path: ${why}`,
      ],
      explanation: `**${correct}.** ${why}\n\nAlmost all practice equations have exactly one solution, which quietly teaches that they always do. They do not: cancelling the variable is not a dead end, it is the answer arriving in a different form.`,
      commonErrors: {
        concept: 'Treating a vanished variable as "no solution" every time. A vanished variable leaving a TRUE statement means every number works; leaving a FALSE one means none do.',
      },
    }
  },
)

/** Successive percent change — where intuition says the trip cancels out. */
const successivePercent = tpl(
  { id: 'adv-percent-chain', name: 'There and back', skillIds: ['m-percent'], bucket: 'math', difficulty: 4, variants: 20, minutes: 3, transfer: true, calibration: true },
  (_rng, seed) => {
    const start = 200 + 20 * (seed % 5)
    const up = 10 + 5 * (Math.floor(seed / 5) % 4)
    const after = start * (1 + up / 100) * (1 - up / 100)
    const value = Math.round(after * 100) / 100
    return {
      title: 'Up then down by the same percent',
      prompt: `A price of **$${start}** rises by **${up}%**, then falls by **${up}%**.\n\nWhat is the final price, to the nearest cent?`,
      answer: numeric(value, { tolerance: 0.02 }),
      hints: [
        'The two percentages are taken of DIFFERENT amounts — write down what each one is a percentage of.',
        `The rise is ${up}% of $${start}. The fall is ${up}% of the NEW, larger price, so it removes more than the rise added.`,
        `$${start} × ${1 + up / 100} × ${1 - up / 100} = **$${value}**.`,
      ],
      explanation: `$${start} × ${(1 + up / 100).toFixed(2)} = $${(start * (1 + up / 100)).toFixed(2)}, then × ${(1 - up / 100).toFixed(2)} = **$${value}**.\n\nIt does not return to $${start}, and it never will: the two changes are percentages of different bases. Algebraically the pair multiplies to (1 + r)(1 − r) = 1 − r², always less than 1 — so the round trip loses ${(up * up) / 100}% no matter which order you do it in.`,
      commonErrors: {
        concept: `Expecting $${start} back, on the reasoning that the same percent went up and came down. The percent is the same; the amount it is taken of is not.`,
      },
    }
  },
)

/** Reverse coordinate geometry: given the midpoint, find the far endpoint. */
const reverseMidpoint = tpl(
  { id: 'adv-midpoint-reverse', name: 'Work backwards from the middle', skillIds: ['m-coord'], bucket: 'math', difficulty: 4, variants: 24, minutes: 2.5 },
  (_rng, seed) => {
    const ax = -6 + (seed % 7)
    const ay = -4 + (Math.floor(seed / 7) % 6)
    const mx = ax + 2 + (Math.floor(seed / 42) % 3)
    const my = ay + 3
    const bx = 2 * mx - ax
    const by = 2 * my - ay
    return {
      title: 'Find the other end',
      prompt: `A segment runs from **A(${ax}, ${ay})** to **B**, and its midpoint is **M(${mx}, ${my})**.\n\nWhat is the **x-coordinate** of B?`,
      answer: numeric(bx),
      hints: [
        'The midpoint formula averages the endpoints. You know the average and one of the two numbers.',
        `(${ax} + Bx) ÷ 2 = ${mx}, so ${ax} + Bx = ${2 * mx}.`,
        `Bx = ${2 * mx} − (${ax}) = **${bx}**.`,
      ],
      explanation: `From (Ax + Bx)/2 = Mx: Bx = 2Mx − Ax = 2(${mx}) − (${ax}) = **${bx}**. (For completeness, By = 2(${my}) − (${ay}) = ${by}.)\n\nThe useful reframe is that M is not "between" A and B in some vague sense — it is exactly the average, so going backwards is subtraction, not guesswork. A quick check: M should now sit the same distance from each end.`,
      commonErrors: {
        strategy: `Halving instead of doubling — computing ${mx} − ${ax} = ${mx - ax} and stopping. That is the distance from A to M, which is only half the trip.`,
      },
    }
  },
)

/** Exponent laws colliding: negative, zero, and a power of a product. */
const exponentCombine = tpl(
  { id: 'adv-exponent-combine', name: 'Laws in collision', skillIds: ['m-exponents'], bucket: 'math', difficulty: 4, variants: 18, minutes: 3 },
  (rng, seed) => {
    const a = 2 + (seed % 3)
    const m = 2 + (Math.floor(seed / 3) % 3)
    const n = 1 + (Math.floor(seed / 9) % 2)
    // (a^m · a^-n)^2 ÷ a^0  →  a^(2(m-n))
    const exp = 2 * (m - n)
    const value = Math.pow(a, exp)
    const correct = `${a}^${exp} = ${value}`
    return {
      title: 'Evaluate exactly',
      prompt: `Evaluate **(${a}^${m} · ${a}^−${n})² ÷ ${a}⁰**.`,
      answer: mcq(rng, correct, [
        `${a}^${2 * (m + n)} = ${Math.pow(a, 2 * (m + n))}`,
        `${a}^${m - n} = ${Math.pow(a, m - n)}`,
        `0, because dividing by ${a}⁰ removes the expression entirely`,
      ]),
      hints: [
        'Work inside the bracket first: multiplying powers of the same base ADDS the exponents, and one of them is negative.',
        `Inside: ${a}^(${m} + (−${n})) = ${a}^${m - n}. Raising a power to a power MULTIPLIES.`,
        `(${a}^${m - n})² = ${a}^${exp}, and dividing by ${a}⁰ = 1 changes nothing. **${value}**.`,
      ],
      explanation: `Inside the bracket the exponents add: ${m} + (−${n}) = ${m - n}. Squaring multiplies: ${m - n} × 2 = ${exp}. And ${a}⁰ = 1, so the division does nothing. **${a}^${exp} = ${value}**.\n\nThe trap is ${a}⁰. It looks like it should either delete the expression or be zero; it is 1, because dividing ${a}^k by itself must give 1 and the exponent rule says that is ${a}^0.`,
      commonErrors: {
        concept: `Treating ${a}⁰ as 0. Anything nonzero to the power 0 is 1 — the rule exists so that ${a}^k ÷ ${a}^k works out.`,
      },
    }
  },
)

/** Shaded-region area: a composite that has to be decomposed. */
const shadedArea = tpl(
  { id: 'adv-shaded-area', name: 'What is left over', skillIds: ['m-area'], bucket: 'math', difficulty: 4, variants: 20, minutes: 3, transfer: true },
  (_rng, seed) => {
    const w = 10 + 2 * (seed % 5)
    const h = 6 + 2 * (Math.floor(seed / 5) % 4)
    // Two congruent triangles cut from opposite corners, each base w/2, height h.
    const base = w / 2
    const shaded = w * h - 2 * (0.5 * base * h)
    return {
      title: 'Area of the shaded part',
      prompt: `A rectangle is **${w} cm** wide and **${h} cm** tall.\n\nTwo triangles are removed, one from each of the bottom corners. Each has a base of **${base} cm** along the bottom edge and a height of **${h} cm**.\n\nWhat area remains, in cm²?`,
      answer: numeric(shaded),
      hints: [
        'Find the whole first, then subtract what was taken — do not try to see the leftover shape directly.',
        `Rectangle: ${w} × ${h} = ${w * h} cm². One triangle: ½ × ${base} × ${h} = ${0.5 * base * h} cm².`,
        `${w * h} − 2 × ${0.5 * base * h} = **${shaded} cm²**.`,
      ],
      explanation: `Whole rectangle ${w} × ${h} = ${w * h} cm². Each triangle is ½ × ${base} × ${h} = ${0.5 * base * h} cm², and there are two, so ${2 * (0.5 * base * h)} cm² is removed. Remaining: **${shaded} cm²**.\n\nWorth noticing: the two bases add to ${base * 2} = the full width, and both triangles have the full height — so together they are exactly half the rectangle, every time. Spotting that turns the whole problem into "half of ${w * h}".`,
      commonErrors: {
        slip: `Subtracting only one triangle (${w * h - 0.5 * base * h} cm²), or forgetting the ½ in the triangle area.`,
      },
    }
  },
)

/** Ratios that change when one part is added to. */
const ratioChange = tpl(
  { id: 'adv-ratio-change', name: 'When one side grows', skillIds: ['m-ratio'], bucket: 'math', difficulty: 5, variants: 16, minutes: 3.5, transfer: true, calibration: true },
  (_rng, seed) => {
    const k = 2 + (seed % 4)
    const r1 = 2 + (Math.floor(seed / 4) % 2)
    const r2 = r1 + 1 + (Math.floor(seed / 8) % 2)
    const red = r1 * k
    const blue = r2 * k
    const added = k * 2
    const [sn, sd] = simplify(red + added, blue)
    return {
      title: 'Ratio after a change',
      prompt: `A box holds red and blue counters in the ratio **${r1} : ${r2}**, and there are **${blue} blue** counters.\n\n**${added} more red** counters are added.\n\nWhat is the new ratio of red to blue, in simplest form? Write it as a fraction, red over blue.`,
      answer: { type: 'fraction', n: sn, d: sd },
      hints: [
        'A ratio is not a count. Find the actual number of red counters before changing anything.',
        `${blue} blue corresponds to ${r2} parts, so one part is ${k} counters, and red = ${r1} × ${k} = ${red}.`,
        `New red = ${red} + ${added} = ${red + added}; blue is unchanged at ${blue}. Simplify ${red + added} : ${blue} → **${fracStr(sn, sd)}**.`,
      ],
      explanation: `${blue} blue is ${r2} parts, so a part is ${blue} ÷ ${r2} = ${k}. Red starts at ${r1} × ${k} = ${red}, becomes ${red + added}, and blue stays ${blue}.\n\n${red + added} : ${blue} simplifies to **${fracStr(sn, sd)}**.\n\nThe move that makes this hard is that you cannot work in ratio units the whole way — adding a fixed COUNT to one side breaks the parts, so you have to convert to actual numbers, change them, and convert back.`,
      commonErrors: {
        concept: `Adding to the ratio directly (${r1} + ${added} : ${r2}), which treats ratio parts as if they were counters.`,
      },
    }
  },
)

// ================================================================ meta lab

/**
 * Meta Lab had NO item above difficulty 3 before this. These are the hard
 * versions: judging study evidence, not reciting study advice.
 */
const studyEvidence = tpl(
  { id: 'adv-meta-evidence', name: 'Judge the study claim', skillIds: ['x-learn'], bucket: 'meta', difficulty: 4, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        setup: 'You reread a chapter and it feels familiar and easy. A friend closes the book and struggles to recall the same material.',
        q: 'Who is more likely to do better on a test in two weeks, and why?',
        correct: 'Your friend — the struggle is retrieval, and the ease you felt was familiarity rather than memory',
        wrong: [
          'You — feeling fluent with material is the clearest sign it has been learned properly',
          'Your friend, but only because rereading works better for some people than for others',
          'Neither can be predicted, because study methods work differently for every learner',
        ],
        why: 'Fluency during study is a poor guide to later recall — rereading raises the feeling and not much else, while effortful retrieval raises the memory. This is also why the harder method feels worse while working better, which is a genuinely uncomfortable fact about studying.',
      },
      {
        setup: 'A revision app reports you answered 95% of its questions correctly this week.',
        q: 'What is the biggest limitation of that number as evidence you have learned the material?',
        correct: 'It says nothing about how spaced or how hard the questions were — the same easy item repeated scores 95% too',
        wrong: [
          'It is self-reported, so the app may simply be inflating the figure',
          'Percentages are meaningless without knowing how many questions there were in total',
          'It measures speed rather than understanding, which is what actually matters',
        ],
        why: 'A high score across easy, immediate, repeated items measures very little. The properties that make practice predict retention — delay, variety, and difficulty near your limit — are exactly the ones a raw percentage hides.',
      },
      {
        setup: 'You have four hours before a test in three days and you know all four topics roughly equally.',
        q: 'What is the best-supported use of those hours?',
        correct: 'Split them across the three days and mix the topics within each block',
        wrong: [
          'Use all four hours the night before, while the material is freshest in memory',
          'Spend all four hours on the single topic you find least interesting',
          'Use two hours to reread everything and two hours to make summary notes',
        ],
        why: 'Spacing and mixing both help retention, and they compound. Massing the night before produces the strongest feeling of readiness and the weakest retention, which is precisely why it survives as a habit.',
      },
      {
        setup: 'You got a question wrong, read the correct answer, and understood it immediately.',
        q: 'What still needs to happen for that to become learning?',
        correct: 'Attempting a different question on the same idea later, without the answer in front of you',
        wrong: [
          'Rereading the explanation once more to make sure it is fully understood',
          'Writing the correct answer out several times so it becomes automatic',
          'Nothing further — the misunderstanding has been identified and corrected',
        ],
        why: 'Understanding an explanation is recognition, and recognition is much easier than retrieval. The repair is only demonstrated when the idea is produced again, later, from nothing — which is why this app re-tests a repaired idea instead of moving on.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'What does the evidence support?',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Separate how a method FEELS from what it later produces. They frequently disagree.',
        'Ask which option would still look good if the test were two weeks away rather than tomorrow.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
      transferBridge: 'The same question applies to how you revise for school: which of these would still look like a good idea if the exam moved two weeks later?',
    }
  },
)

const calibrationHard = tpl(
  { id: 'adv-meta-calibration', name: 'Read your own confidence', skillIds: ['x-calib'], bucket: 'meta', difficulty: 4, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Across 40 questions where you said you were 90% sure, you were right 62% of the time.',
        q: 'What does that pattern mean?',
        correct: 'You are overconfident in this area — your 90% should be read as roughly 60%',
        wrong: [
          'You are unlucky, since 62% is well within normal variation for 40 questions',
          'Your knowledge is fine and only your arithmetic on the questions is failing',
          'Confidence ratings are subjective, so the comparison does not mean anything',
        ],
        why: 'Calibration compares stated probability to observed frequency, and 40 items is enough for a 28-point gap to be a signal rather than noise. The fix is not studying harder — it is lowering the number you say until it matches what happens.',
      },
      {
        setup: 'You said 60% on twenty questions and got 19 of them right.',
        q: 'What is the honest read?',
        correct: 'You are underconfident here — you know this better than you are claiming',
        wrong: [
          'You are well calibrated, since being right more often is always the goal',
          'You got lucky, and the true rate will fall back towards 60% with more questions',
          'The questions were too easy to tell you anything about your calibration',
        ],
        why: 'Underconfidence is a real miscalibration, not modesty. It costs you: it makes you re-study things you already own and hesitate on answers you would have got right.',
      },
      {
        setup: 'Your confidence matches your accuracy almost exactly across every topic — except one, where you are badly overconfident.',
        q: 'What does the single exception most likely indicate?',
        correct: 'A specific misconception in that topic that feels like knowledge from the inside',
        wrong: [
          'A general tendency to overrate yourself that only shows up sometimes',
          'That the questions in that topic are unfairly written or ambiguous',
          'Random variation, since one topic out of many will always look unusual',
        ],
        why: 'Good calibration everywhere else rules out a general habit. A confident wrong belief is exactly what produces high confidence and low accuracy in one place — and it feels identical to knowing, which is what makes it dangerous.',
      },
      {
        setup: 'You want to improve your calibration score quickly.',
        q: 'Which approach actually improves calibration rather than just the number?',
        correct: 'Predict before checking, then look at where your confidence and results disagreed',
        wrong: [
          'Say 50% on everything, since that can never be badly wrong in either direction',
          'Only rate confidence on questions you are certain about',
          'Raise every confidence rating, since higher confidence shows stronger knowledge',
        ],
        why: 'Hedging at 50% makes the score look tolerable while destroying its usefulness — a forecast that never commits cannot be informative. Calibration improves by comparing predictions to outcomes and adjusting, which needs real predictions to compare.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Confidence versus accuracy',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Compare the number you stated with the fraction that turned out right. Calibration is only ever that comparison.',
        'Ask whether the gap is large enough, over enough questions, to be a pattern rather than noise.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const explainHard = tpl(
  { id: 'adv-meta-explain', name: 'Diagnose the explanation', skillIds: ['x-explain'], bucket: 'meta', difficulty: 4, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        setup: '"To divide fractions you flip the second one and multiply. That is just the rule."',
        q: 'What is missing that would make this an explanation rather than an instruction?',
        correct: 'Why flipping works — that dividing by ½ asks how many halves fit, which is why the answer grows',
        wrong: [
          'A worked example with numbers substituted into the rule',
          'A statement of which order the two fractions must be written in',
          'A reminder to simplify the result once the multiplication is done',
        ],
        why: 'An instruction tells you what to do; an explanation tells you why it could not be otherwise. Only the first option supplies a reason that would let someone reconstruct the rule after forgetting it.',
      },
      {
        setup: '"Objects fall at the same rate because gravity is constant."',
        q: 'What is wrong with this explanation?',
        correct: 'It hides the actual reason — heavier objects are pulled harder AND resist more, and the two cancel',
        wrong: [
          'Nothing is wrong; this is the standard and correct account',
          'It should specify the value 9.8 m/s² to be complete',
          'It ignores air resistance, which is the only reason objects fall differently',
        ],
        why: 'A constant gravitational field alone does not explain why MASS drops out — you would still expect a heavier thing to accelerate more. The cancellation is the whole point, and skipping it leaves a sentence that sounds explanatory while explaining nothing.',
      },
      {
        setup: 'A classmate explains a topic to you fluently, and you follow every step. Later you cannot reproduce any of it.',
        q: 'What does that most likely show?',
        correct: 'Following an explanation is recognition, which is far easier than generating it yourself',
        wrong: [
          'Your classmate explained it badly, in a way that only made sense at the time',
          'You were not concentrating hard enough while they were speaking',
          'The topic is too advanced for you at your current level',
        ],
        why: 'Comprehension while listening runs on the explanation being present. Nothing about it requires you to store the structure — which is why "I understood it in class" and "I can do it" come apart so reliably.',
      },
      {
        setup: 'You are asked to explain why a negative times a negative is positive.',
        q: 'Which response is a real explanation?',
        correct: 'Continue the pattern 3×(−2), 2×(−2), 1×(−2)… each step rises by 2, so (−1)×(−2) must be +2',
        wrong: [
          'Because two negatives cancel each other out, like in English grammar',
          'Because the rule says that multiplying two negatives gives a positive',
          'Because a calculator returns a positive number when you try it',
        ],
        why: 'The pattern argument shows that any other answer would break arithmetic that already works. The grammar analogy is a memory aid rather than a reason, the rule restates the question, and the calculator reports the answer without justifying it.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Is that an explanation?',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'An explanation lets you rebuild the rule after forgetting it. An instruction only tells you what to do.',
        'Check whether the reason given would rule OUT the alternatives, or merely restate the fact.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
      transferBridge: 'Run this on your own explanations. If yours restates the rule instead of ruling out alternatives, you have found the part you do not actually understand yet.',
    }
  },
)

// ================================================================ observer

const observerHard = tpl(
  { id: 'adv-obs-layers', name: 'Separate the layers', skillIds: ['o-obsinf'], bucket: 'observer', difficulty: 4, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        report: '"The window was open, the room was freezing, and whoever left last clearly could not be bothered to close it."',
        q: 'How many separate claims are being made, and which is the weakest?',
        correct: 'Three: two observations plus a claim about someone\'s attitude, which nothing in the room supports',
        wrong: [
          'Two: the open window and the cold, which together prove carelessness',
          'One: a single description of a cold room with an open window',
          'Three, and the weakest is the temperature, since "freezing" is exaggerated',
        ],
        why: 'Open window and cold room are checkable. "Could not be bothered" is a claim about a mind, and it arrives welded to the facts so it inherits their credibility. Note the temperature IS loose language, but it is still a report of something observed.',
      },
      {
        report: '"He looked at his phone twice during our conversation, so the topic clearly bored him."',
        q: 'What would need to be true for the conclusion to follow?',
        correct: 'That looking at a phone reliably indicates boredom rather than any of its other causes',
        wrong: [
          'That he looked at his phone more than twice during the conversation',
          'That the conversation lasted long enough for boredom to develop',
          'That he has a history of losing interest in conversations quickly',
        ],
        why: 'The inference needs a link between the behaviour and the state. Phone-checking has many causes — a waited-for message, the time, a habit — so the observation is real and the link is the unsupported part.',
      },
      {
        report: 'Two people describe the same room. One says "cluttered", the other "lived-in".',
        q: 'What is the most useful thing to conclude?',
        correct: 'Both are judgments layered on the same observations, so ask what is actually in the room',
        wrong: [
          'One of them is not describing the room honestly',
          'The room changed between the two visits',
          'Whichever description came first is more likely to be accurate',
        ],
        why: 'Neither word is an observation — both compress a set of facts plus an attitude. The recoverable content is the objects and their positions, which is what you would ask for if you needed to know anything about the room.',
      },
      {
        report: '"The email came in at 2am, so they must have been up all night working."',
        q: 'Which single alternative most weakens this?',
        correct: 'The message could have been scheduled, or sent from a different time zone',
        wrong: [
          'People sometimes wake briefly in the night and check their messages',
          'The recipient may have misread the timestamp on the email',
          'Working late does not necessarily mean working all night',
        ],
        why: 'Scheduling and time zones break the link between timestamp and behaviour entirely, rather than merely softening it. The other options weaken the strength of the conclusion; this one removes its basis.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Pull the claims apart',
      prompt: `${c.report}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Underline the parts a camera could have recorded. Whatever is left is inference.',
        'Inferences about someone\'s inner state are the ones that arrive disguised as observations.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nNothing here says the inference is wrong — it may well be right. It says the inference is a separate claim that has not been checked, and that reporting it in the same breath as the facts is what makes it hard to notice.`,
    }
  },
)

// ================================================================ insight / guardian

const insightHard = tpl(
  { id: 'adv-guard-pressure', name: 'Pressure under a friendly surface', skillIds: ['h-influence'], bucket: 'insight', difficulty: 4, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        setup: '"I already told everyone you were coming — you would not make me look stupid, would you?"',
        q: 'What is the mechanism here, underneath the friendly tone?',
        correct: 'A cost has been manufactured and attached to your refusal, so declining now looks like an act against them',
        wrong: [
          'They are simply excited and want you to come along',
          'They are lying about having told other people',
          'They are being rude by assuming your answer in advance',
        ],
        why: 'The decision was made on your behalf and the consequence was created afterwards, so "no" now carries a bill it did not carry before. Naming it makes the reply easy: "I never agreed to that, so that is not mine to fix."',
      },
      {
        setup: '"Everyone else in the group has already sent theirs. You are the only one holding it up."',
        q: 'What should you check first?',
        correct: 'Whether it is true — this only works if you cannot verify it, and it is easy to verify',
        wrong: [
          'Whether the deadline they mentioned is the real one',
          'Whether the others did a better job than you would',
          'Whether you can finish quickly enough to avoid the delay',
        ],
        why: 'Claims about what everybody else has done are load-bearing and checkable, and they lose all force the moment you check. The other options accept the framing and negotiate inside it.',
      },
      {
        setup: 'Someone does you an unrequested favour, then asks for something much larger, referring back to the favour.',
        q: 'What is the honest way to think about it?',
        correct: 'A gift you did not ask for does not create a debt, and the two things can be judged separately',
        wrong: [
          'You owe them proportionally, since they helped you first',
          'You should refuse purely because the request is larger than the favour',
          'You should accept the favour but avoid that person in future',
        ],
        why: 'Reciprocity is real and mostly good, which is exactly why it can be used as a lever. Judging the request on its own merits keeps the good version — you can still be grateful, and still say no.',
      },
      {
        setup: '"If you actually cared about this, you would not need to think about it."',
        q: 'What is being attacked?',
        correct: 'The act of deliberating itself, by making thinking evidence of not caring',
        wrong: [
          'Your commitment to the group and its goals',
          'Your competence at making decisions quickly',
          'Your honesty about how much you care',
        ],
        why: 'The sentence makes considering the decision into proof of a character flaw, which removes the step where you would notice anything wrong. Any line that punishes thinking is worth slowing down for, whoever says it — and taking time is not evidence about how much you care.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Name the move',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what the sentence is doing rather than what it is saying.',
        'The pattern to look for: something that makes the conditions of deciding worse, without arguing for the proposal.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nNaming the mechanism is the defence, and it works without deciding whether the other person meant it. Most of these are used unthinkingly by people who are not scheming — which is why the response is to slow the decision down, not to accuse anyone.`,
      transferBridge:
        'If a line makes taking time feel like an insult, that is the cue. "I will get back to you tomorrow" is a complete sentence and costs nothing when the request is genuine.',
    }
  },
)

export const ADVANCED_TEMPLATES: ItemTemplate[] = [
  negativeDistribute,
  equationNature,
  successivePercent,
  reverseMidpoint,
  exponentCombine,
  shadedArea,
  ratioChange,
  studyEvidence,
  calibrationHard,
  explainHard,
  observerHard,
  insightHard,
]
