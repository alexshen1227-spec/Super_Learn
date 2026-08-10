/**
 * Math items — number sense, proportional reasoning, data & probability.
 * Every answer is computed from the generated values.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { pick, rint, type Rng } from '../../engine/rng'
import { cycle, fracStr, fraction, gcd, mcq, mcqNoted, money, numeric, round, tpl} from '../lib'

// ---------------------------------------------------------------- integers

const intOps = tpl(
  {
    id: 'int-ops',
    name: 'Signed arithmetic',
    skillIds: ['m-rationalops'],
    bucket: 'math',
    difficulty: 1,
    variants: 24,
    minutes: 1.5,
  },
  (rng) => {
    const a = rint(rng, -12, 12)
    const bRaw = rint(rng, 2, 12)
    const b = rng() < 0.5 ? -bRaw : bRaw
    const op = pick(rng, ['+', '-', '×'] as const)
    const value = op === '+' ? a + b : op === '-' ? a - b : a * b
    const bStr = b < 0 ? `(${b})` : `${b}`
    return {
      title: 'Signed arithmetic',
      prompt: `Compute: **${a} ${op} ${bStr}**`,
      answer: numeric(value),
      hints: [
        'Think of a number line: adding a negative moves left; subtracting a negative moves right.',
        op === '×'
          ? 'Multiply the sizes first, then decide the sign: same signs → positive, different signs → negative.'
          : `Rewrite it as a single move on the number line starting at ${a}.`,
        `Worked path: ${a} ${op} ${bStr} = **${value}**.`,
      ],
      explanation:
        op === '×'
          ? `|${a}| × |${b}| = ${Math.abs(a * b)}. The signs are ${a < 0 === b < 0 ? 'the same, so the product is positive' : 'different, so the product is negative'}: **${value}**.`
          : `Start at ${a} and ${op === '+' ? (b >= 0 ? `move right ${b}` : `move left ${-b}`) : b >= 0 ? `move left ${b}` : `move right ${-b}`}: **${value}**.`,
      commonErrors: { slip: 'Sign slips are the classic error here — track the sign separately from the size.' },
    }
  },
)

const intOrderOps = tpl(
  {
    id: 'int-order-ops',
    name: 'Order of operations',
    skillIds: ['m-integers'],
    bucket: 'math',
    difficulty: 2,
    variants: 16,
    minutes: 2,
  },
  (rng) => {
    const a = rint(rng, 2, 9)
    const b = rint(rng, 2, 6)
    const c = rint(rng, 1, 10)
    const d = rint(rng, 2, 4)
    const value = a + b * c - d * d
    return {
      title: 'Order of operations',
      prompt: `Compute: **${a} + ${b} × ${c} − ${d}²**`,
      answer: numeric(value),
      hints: [
        'Which operations happen before addition and subtraction?',
        `Evaluate the power and the product first: ${d}² = ${d * d} and ${b} × ${c} = ${b * c}.`,
        `Worked path: ${a} + ${b * c} − ${d * d} = **${value}**.`,
      ],
      explanation: `Exponents and multiplication come before addition/subtraction: ${a} + ${b}×${c} − ${d}² = ${a} + ${b * c} − ${d * d} = **${value}**.`,
      commonErrors: {
        strategy: `Working left to right gives ${(a + b) * c - d * d} or similar — the order of operations exists exactly to prevent that ambiguity.`,
      },
    }
  },
)

const intWord = tpl(
  {
    id: 'int-word',
    name: 'Integers in context',
    skillIds: ['m-rationalops'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 2,
  },
  (rng) => {
    const drop = rint(rng, 5, 18)
    const start = rint(rng, -5, 8)
    const rise = rint(rng, 3, 12)
    const value = start - drop + rise
    return {
      title: 'Temperature change',
      prompt: `At sunset the temperature is **${start}°C**. Overnight it falls **${drop}°** and by noon it has risen **${rise}°** from the overnight low. What is the temperature at noon, in °C?`,
      answer: numeric(value),
      hints: [
        'Track one change at a time — what is the overnight low?',
        `Overnight low: ${start} − ${drop} = ${start - drop}°C. Now apply the rise.`,
        `Worked path: ${start} − ${drop} + ${rise} = **${value}**°C.`,
      ],
      explanation: `Falling ${drop}° from ${start}°C reaches ${start - drop}°C; rising ${rise}° gives ${start - drop} + ${rise} = **${value}°C**.`,
      commonErrors: { misread: 'The rise is measured from the overnight low, not from the sunset temperature.' },
    }
  },
)

// ---------------------------------------------------------------- fractions

const fracAddSub = tpl(
  {
    id: 'frac-addsub',
    name: 'Add & subtract fractions',
    skillIds: ['m-fractions'],
    bucket: 'math',
    difficulty: 2,
    variants: 18,
    minutes: 2,
  },
  (rng) => {
    const d1 = pick(rng, [2, 3, 4, 5, 6, 8])
    let d2 = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12])
    if (d2 === d1) d2 = d1 === 12 ? 8 : d1 + 1 === 7 ? 8 : d1 + 1
    const n1 = rint(rng, 1, d1 - 1)
    const n2 = rint(rng, 1, d2 - 1)
    const add = rng() < 0.6
    const lcm = (d1 * d2) / gcd(d1, d2)
    const rn = add ? n1 * (lcm / d1) + n2 * (lcm / d2) : n1 * (lcm / d1) - n2 * (lcm / d2)
    return {
      title: 'Fraction sum',
      prompt: `Compute: **${n1}/${d1} ${add ? '+' : '−'} ${n2}/${d2}**\n\nGive your answer as a fraction (any equivalent form counts).`,
      answer: fraction(rn, lcm),
      hints: [
        'You can only add or subtract fractions when the pieces are the same size. What denominator works for both?',
        `A common denominator is ${lcm}: rewrite as ${n1 * (lcm / d1)}/${lcm} and ${n2 * (lcm / d2)}/${lcm}.`,
        `Worked path: ${n1 * (lcm / d1)}/${lcm} ${add ? '+' : '−'} ${n2 * (lcm / d2)}/${lcm} = **${fracStr(rn, lcm)}**.`,
      ],
      explanation: `Rewrite over the common denominator ${lcm}: ${n1}/${d1} = ${n1 * (lcm / d1)}/${lcm} and ${n2}/${d2} = ${n2 * (lcm / d2)}/${lcm}. ${add ? 'Adding' : 'Subtracting'} numerators gives ${rn}/${lcm}${gcd(rn, lcm) > 1 ? ` = ${fracStr(rn, lcm)}` : ''}.`,
      commonErrors: {
        concept: `Adding tops and bottoms separately (${n1 + n2}/${d1 + d2}) treats different-sized pieces as equal — that is the core misconception this practices.`,
      },
    }
  },
)

const fracMulDiv = tpl(
  {
    id: 'frac-muldiv',
    name: 'Multiply & divide fractions',
    skillIds: ['m-fractions'],
    bucket: 'math',
    difficulty: 2,
    variants: 20,
    minutes: 2,
  },
  (rng) => {
    const n1 = rint(rng, 1, 7)
    const d1 = rint(rng, 2, 8)
    const n2 = rint(rng, 1, 7)
    const d2 = rint(rng, 2, 8)
    const div = rng() < 0.5
    const rn = div ? n1 * d2 : n1 * n2
    const rd = div ? d1 * n2 : d1 * d2
    return {
      title: div ? 'Fraction division' : 'Fraction multiplication',
      prompt: `Compute: **${n1}/${d1} ${div ? '÷' : '×'} ${n2}/${d2}**\n\nAnswer as a fraction.`,
      answer: fraction(rn, rd),
      hints: [
        div
          ? 'Dividing by a fraction asks "how many of that piece fit?" — it is the same as multiplying by its reciprocal.'
          : 'Multiply straight across: numerator × numerator, denominator × denominator.',
        div ? `Rewrite: ${n1}/${d1} × ${d2}/${n2}.` : `${n1} × ${n2} = ${n1 * n2} and ${d1} × ${d2} = ${d1 * d2}.`,
        `Worked path: result = ${rn}/${rd}${gcd(rn, rd) > 1 ? ` = **${fracStr(rn, rd)}**` : ''}.`,
      ],
      explanation: div
        ? `Dividing by ${n2}/${d2} = multiplying by ${d2}/${n2}: (${n1} × ${d2})/(${d1} × ${n2}) = ${fracStr(rn, rd)}.`
        : `Multiply across: (${n1} × ${n2})/(${d1} × ${d2}) = ${fracStr(rn, rd)}.`,
      commonErrors: { strategy: div ? 'Flipping the FIRST fraction instead of the second changes the answer.' : 'Cross-multiplying belongs to equation solving, not fraction multiplication.' },
    }
  },
)

const fracWord = tpl(
  {
    id: 'frac-word',
    name: 'Fractions in context',
    skillIds: ['m-fractions'],
    bucket: 'math',
    difficulty: 3,
    variants: 10,
    minutes: 3,
    transfer: true,
  },
  (rng) => {
    const d = pick(rng, [3, 4, 5, 6, 8])
    const n = rint(rng, 1, d - 1)
    const total = d * rint(rng, 2, 6)
    const used = (total * n) / d
    return {
      title: 'Fraction of a batch',
      prompt: `A batch uses **${total}** grams of flour. You only want to make **${n}/${d}** of the batch. How many grams do you need?`,
      answer: numeric(used),
      hints: [
        `"${n}/${d} of" means multiply by ${n}/${d}.`,
        `One ${d}th of ${total} is ${total / d} — you need ${n} of those parts.`,
        `Worked path: ${total} × ${n}/${d} = ${total / d} × ${n} = **${used}** g.`,
      ],
      explanation: `${total} ÷ ${d} = ${total / d} grams per ${d}th; × ${n} parts = **${used} g**.`,
    }
  },
)

const fracCompare = tpl(
  {
    id: 'frac-compare',
    name: 'Compare fractions',
    skillIds: ['m-fractions'],
    bucket: 'math',
    difficulty: 1,
    variants: 15,
    minutes: 1.5,
  },
  (rng) => {
    const pairs: [number, number][] = [
      [3, 4],
      [2, 3],
      [5, 8],
      [4, 5],
      [5, 6],
      [7, 10],
      [3, 5],
      [7, 8],
      [5, 12],
      [2, 5],
    ]
    const chosen: [number, number][] = []
    while (chosen.length < 3) {
      const p = pick(rng, pairs)
      if (!chosen.some((c) => c[0] * p[1] === p[0] * c[1])) chosen.push(p)
    }
    const best = chosen.reduce((a, b) => (a[0] / a[1] >= b[0] / b[1] ? a : b))
    const correctText = `${best[0]}/${best[1]}`
    return {
      title: 'Which is largest?',
      prompt: `Which fraction is **largest**?`,
      answer: mcq(rng, correctText, chosen.filter((c) => c !== best).map(([a, b]) => `${a}/${b}`)),
      hints: [
        'Compare each to a benchmark like 1/2 or 1 — how far below 1 is each?',
        `Put them over a common denominator, or compare "distance from 1": ${chosen.map(([a, b]) => `${a}/${b} is ${b - a}/${b} below 1`).join('; ')}.`,
        `Worked path: the largest is **${correctText}** (${round((best[0] / best[1]) * 100, 1)}% of a whole).`,
      ],
      explanation: `As decimals: ${chosen.map(([a, b]) => `${a}/${b} ≈ ${round(a / b, 3)}`).join(', ')} — the largest is **${correctText}**.`,
    }
  },
)

// ---------------------------------------------------------------- decimals

const decConvert = tpl(
  {
    id: 'dec-convert',
    name: 'Fraction → decimal',
    skillIds: ['m-decimals'],
    bucket: 'math',
    difficulty: 1,
    variants: 7,
    minutes: 1,
  },
  (_rng, seed) => {
    const nice: [number, number][] = [
      [1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [7, 10], [9, 20],
    ]
    const [n, d] = cycle(seed, nice)
    return {
      title: 'Convert to a decimal',
      prompt: `Write **${n}/${d}** as a decimal.`,
      answer: numeric(n / d),
      hints: [
        'A fraction is a division problem in disguise.',
        `Scale the denominator to a power of ten: ${d} × ${100 / d % 1 === 0 ? 100 / d : 1000 / d} = ${100 / d % 1 === 0 ? 100 : 1000}.`,
        `Worked path: ${n} ÷ ${d} = **${n / d}**.`,
      ],
      explanation: `${n}/${d} = ${n} ÷ ${d} = **${n / d}**.`,
    }
  },
)

const decPercent = tpl(
  {
    id: 'dec-percent',
    name: 'Decimal ↔ percent',
    skillIds: ['m-decimals'],
    bucket: 'math',
    difficulty: 1,
    variants: 9,
    minutes: 1,
  },
  (rng) => {
    const v = pick(rng, [0.05, 0.4, 0.35, 0.08, 0.625, 0.9, 0.15, 1.2, 0.375, 0.02, 0.85, 0.06, 0.7, 0.28])
    const toPct = rng() < 0.5
    return {
      title: 'Percent conversion',
      prompt: toPct
        ? `Write **${v}** as a percent. (Enter just the number.)`
        : `Write **${round(v * 100, 2)}%** as a decimal.`,
      answer: numeric(toPct ? round(v * 100, 4) : v),
      hints: [
        '"Percent" means "per hundred".',
        toPct ? 'Multiply by 100 — the decimal point slides two places right.' : 'Divide by 100 — the decimal point slides two places left.',
        `Worked path: **${toPct ? round(v * 100, 4) : v}**.`,
      ],
      explanation: toPct
        ? `${v} = ${v} × 100% = **${round(v * 100, 4)}%**.`
        : `${round(v * 100, 2)}% = ${round(v * 100, 2)}/100 = **${v}**.`,
    }
  },
)

const decOrder = tpl(
  {
    id: 'dec-order',
    name: 'Order rational numbers',
    skillIds: ['m-decimals'],
    bucket: 'math',
    difficulty: 2,
    variants: 5,
    minutes: 1.5,
  },
  (rng, seed) => {
    const sets: { items: [string, number][] }[] = [
      { items: [['0.45', 0.45], ['2/5', 0.4], ['0.405', 0.405], ['44%', 0.44]] },
      { items: [['0.7', 0.7], ['5/8', 0.625], ['68%', 0.68], ['0.665', 0.665]] },
      { items: [['1/3', 1 / 3], ['0.3', 0.3], ['32%', 0.32], ['0.303', 0.303]] },
      { items: [['3/4', 0.75], ['0.7', 0.7], ['72%', 0.72], ['0.745', 0.745]] },
      { items: [['0.09', 0.09], ['1/8', 0.125], ['11%', 0.11], ['0.1', 0.1]] },
    ]
    const set = cycle(seed, sets)
    const best = set.items.reduce((a, b) => (a[1] >= b[1] ? a : b))
    return {
      title: 'Which is largest?',
      prompt: `Which value is **largest**?`,
      answer: mcq(rng, best[0], set.items.filter((i) => i !== best).map((i) => i[0])),
      hints: [
        'Convert everything to the same form — decimals are usually fastest.',
        `As decimals: ${set.items.map(([s, v]) => `${s} = ${round(v, 3)}`).join(', ')}.`,
        `Worked path: the largest is **${best[0]}**.`,
      ],
      explanation: `Convert all to decimals: ${set.items.map(([s, v]) => `${s} → ${round(v, 3)}`).join(', ')}. Largest: **${best[0]}**.`,
    }
  },
)

// ---------------------------------------------------------------- exponents & roots

const expPower = tpl(
  {
    id: 'exp-evaluate',
    name: 'Evaluate powers',
    skillIds: ['m-exponents'],
    bucket: 'math',
    difficulty: 1,
    variants: 15,
    minutes: 1,
  },
  (_rng, seed) => {
    // Enumerated, not sampled: random draws from a small space collided and
    // this template produced only 3 distinct powers while claiming more.
    const PAIRS: [number, number][] = [
      [2, 3], [2, 4], [2, 5], [2, 6],
      [3, 2], [3, 3], [3, 4],
      [4, 2], [4, 3],
      [5, 2], [5, 3],
      [10, 2], [10, 3], [10, 4], [10, 5],
    ]
    const [base, exp] = PAIRS[seed % PAIRS.length]
    const value = base ** exp
    return {
      title: 'Evaluate the power',
      prompt: `Compute: **${base}^${exp}**`,
      answer: numeric(value),
      hints: [
        `${base}^${exp} means ${exp} copies of ${base} multiplied together — not ${base} × ${exp}.`,
        `Build up: ${Array.from({ length: exp - 1 }, (_, i) => `${base ** (i + 2)}`).join(' → ')}.`,
        `Worked path: **${value}**.`,
      ],
      explanation: `${base}^${exp} = ${Array.from({ length: exp }, () => base).join(' × ')} = **${value}**. The exponent counts how many copies of the base are multiplied, so it grows far faster than multiplying by the exponent would.`,
      commonErrors: { concept: `${base} × ${exp} = ${base * exp} confuses repeated multiplication with multiplication.` },
    }
  },
)

const expRules = tpl(
  {
    id: 'exp-rules',
    name: 'Exponent rules',
    skillIds: ['m-exponents'],
    bucket: 'math',
    difficulty: 2,
    variants: 16,
    minutes: 2,
  },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rint(rng, 2, 5)
    const kind = pick(rng, ['product', 'quotient', 'power'] as const)
    const big = kind === 'quotient' ? a + b : a
    const correct = kind === 'product' ? `x^${a + b}` : kind === 'quotient' ? `x^${b}` : `x^${a * b}`
    const promptExpr =
      kind === 'product' ? `x^${a} · x^${b}` : kind === 'quotient' ? `x^${big} ÷ x^${a}` : `(x^${a})^${b}`
    const noted =
      kind === 'product'
        ? mcqNoted(rng, correct, [
            [`x^${a * b}`, 'Rule mix-up — multiplying the exponents is the POWER-of-a-power rule; multiplying same-base powers ADDS the factor counts.'],
            [`x^${Math.abs(a - b)}`, 'Subtracting belongs to DIVISION of powers, not multiplication.'],
            [`2x^${a + b}`, 'Phantom coefficient — combining powers never invents a 2; only counting factors happens here.'],
          ])
        : kind === 'quotient'
          ? mcqNoted(rng, correct, [
              [`x^${big + a}`, 'Adding belongs to MULTIPLYING powers; division cancels factors, so counts subtract.'],
              [`x^${Math.round(big / a)}`, 'Dividing the exponents — but the exponents count factors; cancellation subtracts them.'],
              [`1/x^${b}`, 'Reciprocal reflex — the larger power is on top here, so the result stays above the line.'],
            ])
          : mcqNoted(rng, correct, [
              [`x^${a + b}`, 'Adding belongs to multiplying two powers; a power OF a power repeats whole groups, so counts multiply.', 'strategy'],
              [`x^${a ** b > 999 ? a + b + 1 : a ** b}`, 'Exponentiating the exponents — the group of factors repeats, it does not tower.', 'strategy'],
              [`${b}x^${a}`, 'The outer exponent became a coefficient — it repeats the whole group, it never multiplies out front.', 'concept'],
            ])
    return {
      title: 'Simplify with exponent rules',
      prompt: `Simplify: **${promptExpr}** (x ≠ 0)`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Write a tiny example out in full — x·x·x style — and count the factors.',
        kind === 'product'
          ? 'Multiplying powers of the same base: the factor counts ADD.'
          : kind === 'quotient'
            ? 'Dividing cancels matching factors: the counts SUBTRACT.'
            : 'A power of a power repeats the whole group: the counts MULTIPLY.',
        `Worked path: ${promptExpr} = **${correct}**.`,
      ],
      explanation:
        kind === 'product'
          ? `x^${a} · x^${b} has ${a} + ${b} = ${a + b} factors of x: **x^${a + b}**.`
          : kind === 'quotient'
            ? `x^${big} ÷ x^${a} cancels ${a} factors, leaving ${big} − ${a} = ${b}: **x^${b}**.`
            : `(x^${a})^${b} is ${b} groups of ${a} factors: ${a} × ${b} = ${a * b}, so **x^${a * b}**.`,
    }
  },
)

const sciNot = tpl(
  {
    id: 'exp-scinot',
    name: 'Scientific notation',
    skillIds: ['m-exponents'],
    bucket: 'math',
    difficulty: 2,
    variants: 14,
    minutes: 2,
  },
  (rng) => {
    const mant = pick(rng, [1.5, 2.4, 3.2, 4.7, 5.1, 6.8, 7.3, 8.6, 9.2, 2.05])
    const exp = rint(rng, 3, 8)
    const value = mant * 10 ** exp
    const correct = `${mant} × 10^${exp}`
    return {
      title: 'Scientific notation',
      prompt: `Write **${value.toLocaleString('en-US')}** in scientific notation.`,
      answer: mcq(rng, correct, [
        `${mant} × 10^${exp + 1}`,
        `${mant} × 10^${exp - 1}`,
        `${round(mant * 10, 2)} × 10^${exp - 1 === exp ? exp - 2 : exp}`,
        `0.${String(mant).replace('.', '')} × 10^${exp + 1}`,
      ]),
      hints: [
        'Scientific notation: one nonzero digit before the decimal point, times a power of ten.',
        `How many places does the decimal move to turn ${mant} into ${value.toLocaleString('en-US')}?`,
        `Worked path: **${correct}**.`,
      ],
      explanation: `The decimal in ${mant} moves ${exp} places right to reach ${value.toLocaleString('en-US')}, so the answer is **${correct}**.`,
    }
  },
)

const rootPerfect = tpl(
  {
    id: 'root-perfect',
    name: 'Square roots',
    skillIds: ['m-roots'],
    bucket: 'math',
    difficulty: 1,
    variants: 12,
    minutes: 1,
  },
  (_rng, seed) => {
    // Enumerated so all 12 perfect squares in range really appear.
    const r = 4 + (seed % 12)
    return {
      title: 'Square root',
      prompt: `Compute: **√${r * r}**`,
      answer: numeric(r),
      hints: [
        'Which number times itself gives this?',
        `Bracket it: ${r - 1}² = ${(r - 1) ** 2} and ${r + 1}² = ${(r + 1) ** 2}.`,
        `Worked path: ${r}² = ${r * r}, so √${r * r} = **${r}**.`,
      ],
      explanation: `${r} × ${r} = ${r * r}, so √${r * r} = **${r}**.`,
    }
  },
)

const rootEstimate = tpl(
  {
    id: 'root-estimate',
    name: 'Estimate roots',
    skillIds: ['m-roots'],
    bucket: 'math',
    difficulty: 2,
    variants: 14,
    minutes: 1.5,
    calibration: true,
  },
  (rng) => {
    const lo = rint(rng, 4, 11)
    const n = rint(rng, lo * lo + 1, (lo + 1) * (lo + 1) - 1)
    const correct = `${lo} and ${lo + 1}`
    return {
      title: 'Between which integers?',
      prompt: `**√${n}** lies between which two consecutive integers?`,
      answer: mcq(rng, correct, [
        `${lo - 1} and ${lo}`,
        `${lo + 1} and ${lo + 2}`,
        `${Math.max(2, lo - 2)} and ${Math.max(3, lo - 1)}`,
      ]),
      hints: [
        'Find the perfect squares just below and just above.',
        `${lo}² = ${lo * lo} and ${lo + 1}² = ${(lo + 1) ** 2}. Where does ${n} sit?`,
        `Worked path: ${lo * lo} < ${n} < ${(lo + 1) ** 2}, so √${n} is between **${correct}**.`,
      ],
      explanation: `${lo}² = ${lo * lo} < ${n} < ${(lo + 1) ** 2} = ${lo + 1}², so √${n} is between **${lo} and ${lo + 1}**.`,
    }
  },
)

// ---------------------------------------------------------------- ratios & rates

const unitRate = tpl(
  {
    id: 'ratio-unitrate',
    name: 'Unit rates',
    skillIds: ['m-ratio'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 2,
  },
  (rng) => {
    const per = pick(rng, [3, 4, 5, 6, 8])
    const rate = pick(rng, [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0.75, 1.25])
    const total = round(per * rate, 2)
    return {
      title: 'Unit rate',
      prompt: `**${per}** notebooks cost **${money(total)}**. What is the cost per notebook, in dollars?`,
      answer: numeric(rate),
      hints: [
        '"Per notebook" means the cost of exactly one.',
        `Divide the total cost by the count: ${total} ÷ ${per}.`,
        `Worked path: ${money(total)} ÷ ${per} = **${money(rate)}** each.`,
      ],
      explanation: `Unit rate = total ÷ count = ${total} ÷ ${per} = **${money(rate)}** per notebook.`,
    }
  },
)

const ratioShare = tpl(
  {
    id: 'ratio-share',
    name: 'Divide in a ratio',
    skillIds: ['m-ratio'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (rng) => {
    const a = rint(rng, 1, 5)
    let b = rint(rng, 1, 5)
    if (b === a) b = a + 1
    const partSize = rint(rng, 3, 12)
    const total = (a + b) * partSize
    const first = a * partSize
    return {
      title: 'Sharing in a ratio',
      prompt: `Ana and Bo split **${total}** stickers in the ratio **${a} : ${b}** (Ana : Bo). How many does **Ana** get?`,
      answer: numeric(first),
      hints: [
        `The ratio ${a}:${b} means every "round" hands out ${a + b} stickers.`,
        `How many rounds? ${total} ÷ ${a + b} = ${partSize}.`,
        `Worked path: Ana gets ${a} × ${partSize} = **${first}**.`,
      ],
      explanation: `${a} + ${b} = ${a + b} parts; each part is ${total} ÷ ${a + b} = ${partSize} stickers; Ana's share is ${a} × ${partSize} = **${first}**.`,
      commonErrors: { strategy: `Splitting ${total} in half ignores the ratio; dividing by ${a} or ${b} alone ignores the total parts.` },
    }
  },
)

const bestBuy = tpl(
  {
    id: 'ratio-best-buy',
    name: 'Better buy',
    skillIds: ['m-ratio'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 2,
    transfer: true,
  },
  (rng) => {
    const sizeA = pick(rng, [6, 8, 10, 12])
    const sizeB = sizeA + pick(rng, [4, 6, 8])
    const rateA = pick(rng, [0.5, 0.6, 0.75, 0.8])
    const cheaperB = rng() < 0.6
    const rateB = cheaperB ? rateA - 0.05 : rateA + 0.07
    const priceA = round(sizeA * rateA, 2)
    const priceB = round(sizeB * rateB, 2)
    const correct = round(priceA / sizeA, 4) <= round(priceB / sizeB, 4) ? `The ${sizeA}-pack` : `The ${sizeB}-pack`
    return {
      title: 'Which is the better buy?',
      prompt: `A **${sizeA}-pack** costs **${money(priceA)}**. A **${sizeB}-pack** costs **${money(priceB)}**. Which is the better buy per item?`,
      answer: mcq(rng, correct, [
        correct === `The ${sizeA}-pack` ? `The ${sizeB}-pack` : `The ${sizeA}-pack`,
        'They cost the same per item',
      ]),
      hints: [
        'Bigger is not automatically cheaper per item — check the unit price.',
        `Unit prices: ${money(priceA)} ÷ ${sizeA} vs ${money(priceB)} ÷ ${sizeB}.`,
        `Worked path: ${round(priceA / sizeA, 3)} vs ${round(priceB / sizeB, 3)} dollars per item → **${correct}**.`,
      ],
      explanation: `Per item: ${sizeA}-pack → ${money(round(priceA / sizeA, 3))}, ${sizeB}-pack → ${money(round(priceB / sizeB, 3))}. **${correct}** is cheaper per item.`,
    }
  },
)

// ---------------------------------------------------------------- proportions

const propSolve = tpl(
  {
    id: 'prop-solve',
    name: 'Solve a proportion',
    skillIds: ['m-proportion'],
    bucket: 'math',
    difficulty: 2,
    variants: 14,
    minutes: 2,
  },
  (rng) => {
    const a = rint(rng, 2, 9)
    const b = rint(rng, 2, 9)
    const k = rint(rng, 2, 6)
    const num = a * k
    const den = b * k
    return {
      title: 'Solve the proportion',
      prompt: `Solve for x: **x / ${b} = ${num} / ${den}**`,
      answer: numeric(a),
      hints: [
        'Two equal ratios: what factor connects the denominators?',
        `${den} ÷ ${b} = ${k}, so the numerators are related by the same factor.`,
        `Worked path: x = ${num} ÷ ${k} = **${a}**.`,
      ],
      explanation: `The denominators are linked by ×${k} (${b} × ${k} = ${den}), so the numerators are too: x = ${num} ÷ ${k} = **${a}**. Cross-multiplying (${den}x = ${b} × ${num}) gives the same result.`,
    }
  },
)

const propWord = tpl(
  {
    id: 'prop-word',
    name: 'Proportional scaling',
    skillIds: ['m-proportion'],
    bucket: 'math',
    difficulty: 3,
    variants: 11,
    minutes: 2.5,
    transfer: true,
  },
  (rng) => {
    const cm = rint(rng, 2, 6)
    const km = cm * pick(rng, [15, 20, 25, 40])
    const cm2 = cm + rint(rng, 2, 7)
    const ans = (km / cm) * cm2
    return {
      title: 'Map scale',
      prompt: `On a map, **${cm} cm** represents **${km} km**. How many km does **${cm2} cm** represent?`,
      answer: numeric(ans),
      hints: [
        'Find what ONE cm represents first.',
        `1 cm ↔ ${km} ÷ ${cm} = ${km / cm} km.`,
        `Worked path: ${cm2} × ${km / cm} = **${ans}** km.`,
      ],
      explanation: `Scale: ${km} ÷ ${cm} = ${km / cm} km per cm. Then ${cm2} cm ↔ ${cm2} × ${km / cm} = **${ans} km**.`,
    }
  },
)

const propIdentify = tpl(
  {
    id: 'prop-identify',
    name: 'Is it proportional?',
    skillIds: ['m-proportion'],
    bucket: 'math',
    difficulty: 2,
    variants: 8,
    minutes: 2,
  },
  (rng) => {
    const k = rint(rng, 2, 5)
    const xs = [1, 2, 3, 4]
    const shift = rint(rng, 1, 4)
    const propTable = xs.map((x) => `(${x}, ${k * x})`).join(', ')
    const addTable = xs.map((x) => `(${x}, ${k * x + shift})`).join(', ')
    const correct = `${propTable}`
    const noted = mcqNoted(rng, correct, [
      [addTable, `Additive ≠ proportional — adding ${shift} keeps a constant DIFFERENCE, but proportionality needs a constant RATIO through (0, 0).`, 'concept'],
      [xs.map((x) => `(${x}, ${x * x})`).join(', '), 'Squaring — the ratio y/x changes every row, so no single scale factor exists.', 'concept'],
      [xs.map((x) => `(${x}, ${k * x + (x === 1 ? 0 : 1)})`).join(', '), 'Almost-proportional — one broken row breaks it; proportionality is an every-row property.', 'incomplete'],
    ])
    return {
      title: 'Spot the proportional table',
      prompt: `Which table shows y **proportional** to x?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Proportional means y ÷ x is the SAME for every row (and (0,0) would fit the pattern).',
        `Check y/x row by row — the proportional table gives ${k} every time.`,
        `Worked path: **${correct}** (constant ratio ${k}).`,
      ],
      explanation: `In the correct table every y/x = ${k}. The others fail: adding ${shift} breaks the ratio at x=1 vs x=2, and squaring changes the ratio each row.`,
      commonErrors: { concept: 'A constant ADDED amount (linear, +b) is not proportionality — proportional lines pass through (0,0).' },
    }
  },
)

// ---------------------------------------------------------------- percent

const pctOf = tpl(
  {
    id: 'pct-of',
    name: 'Percent of a number',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 1,
    variants: 12,
    minutes: 1.5,
  },
  (rng) => {
    const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 60, 75, 80])
    const n = pick(rng, [40, 60, 80, 120, 160, 200, 240, 300])
    const ans = (p / 100) * n
    return {
      title: 'Percent of a number',
      prompt: `What is **${p}%** of **${n}**?`,
      answer: numeric(ans),
      hints: [
        'Anchor on 10%: one decimal shift left.',
        `10% of ${n} is ${n / 10}. Build ${p}% from that.`,
        `Worked path: ${p}% × ${n} = ${p / 100} × ${n} = **${ans}**.`,
      ],
      explanation: `${p}% = ${p / 100}; ${p / 100} × ${n} = **${ans}**.`,
    }
  },
)

const pctChange = tpl(
  {
    id: 'pct-change',
    name: 'Percent change',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 2,
    variants: 11,
    minutes: 2,
  },
  (rng) => {
    const oldV = pick(rng, [40, 50, 60, 80, 120, 150, 200])
    const pct = pick(rng, [10, 20, 25, 40, 50])
    const up = rng() < 0.5
    const newV = up ? oldV * (1 + pct / 100) : oldV * (1 - pct / 100)
    return {
      title: 'Percent change',
      prompt: `A price changes from **${money(oldV)}** to **${money(newV)}**. What is the percent ${up ? 'increase' : 'decrease'}? (Enter just the number.)`,
      answer: numeric(pct),
      hints: [
        'Percent change compares the CHANGE to the ORIGINAL.',
        `Change = ${money(Math.abs(newV - oldV))}; original = ${money(oldV)}.`,
        `Worked path: ${Math.abs(newV - oldV)} ÷ ${oldV} = ${Math.abs(newV - oldV) / oldV} = **${pct}%**.`,
      ],
      explanation: `Change ÷ original = ${round(Math.abs(newV - oldV), 2)} ÷ ${oldV} = ${pct / 100} = **${pct}%**.`,
      commonErrors: { concept: 'Dividing by the NEW value is the classic trap — percent change is measured against where you started.' },
    }
  },
)

const pctMulti = tpl(
  {
    id: 'pct-discount-tax',
    name: 'Discount then tax',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 3,
    variants: 8,
    minutes: 3,
  },
  (rng) => {
    const price = pick(rng, [40, 60, 80, 120, 200])
    const disc = pick(rng, [10, 20, 25, 50])
    const tax = pick(rng, [5, 10])
    const afterDisc = price * (1 - disc / 100)
    const final = round(afterDisc * (1 + tax / 100), 2)
    return {
      title: 'Discount, then tax',
      prompt: `A **${money(price)}** jacket is **${disc}% off**. Then **${tax}% tax** is added to the discounted price. What is the final cost, in dollars?`,
      answer: numeric(final, { tolerance: 0.005 }),
      hints: [
        'Two separate percent steps — do them in order.',
        `After the discount: ${money(price)} × ${1 - disc / 100} = ${money(afterDisc)}.`,
        `Worked path: ${money(afterDisc)} × ${1 + tax / 100} = **${money(final)}**.`,
      ],
      explanation: `Discounted price: ${price} × ${(100 - disc) / 100} = ${afterDisc}. With tax: ${afterDisc} × ${(100 + tax) / 100} = **${money(final)}**. Note ${disc}% − ${tax}% ≠ ${disc - tax}% net: the percents act on different bases.`,
      commonErrors: { strategy: `Subtracting the percents (${disc}% − ${tax}%) applies both to the original price — but tax applies to the discounted price.` },
    }
  },
)

const pctReverse = tpl(
  {
    id: 'pct-reverse',
    name: 'Find the original',
    skillIds: ['m-percent'],
    bucket: 'math',
    difficulty: 4,
    variants: 7,
    minutes: 3,
    transfer: true,
    calibration: true,
  },
  (rng) => {
    const orig = pick(rng, [40, 60, 80, 120, 150, 250])
    const pct = pick(rng, [20, 25, 40, 50])
    const sale = orig * (1 - pct / 100)
    return {
      title: 'Reverse percent',
      prompt: `After a **${pct}% discount**, a game costs **${money(sale)}**. What was the **original** price, in dollars?`,
      answer: numeric(orig),
      hints: [
        `The sale price is what percent of the original?`,
        `${money(sale)} is ${100 - pct}% of the original — set up: 0.${100 - pct} × original = ${sale}.`,
        `Worked path: original = ${sale} ÷ ${(100 - pct) / 100} = **${money(orig)}**.`,
      ],
      explanation: `Sale price = ${100 - pct}% of original, so original = ${sale} ÷ ${(100 - pct) / 100} = **${money(orig)}**.`,
      commonErrors: {
        strategy: `Adding ${pct}% to ${money(sale)} gives ${money(round(sale * (1 + pct / 100), 2))} — wrong, because the ${pct}% was taken from the LARGER original, not from the sale price.`,
      },
    }
  },
)

// ---------------------------------------------------------------- units

const unitConvert = tpl(
  {
    id: 'unit-convert',
    name: 'Unit conversion',
    skillIds: ['m-units'],
    bucket: 'math',
    difficulty: 2,
    variants: 2,
    minutes: 2,
  },
  (rng, seed) => {
    const conversions = [
      { from: 'cm', to: 'm', factor: 0.01, vals: [150, 240, 375, 480, 625] },
      { from: 'kg', to: 'g', factor: 1000, vals: [1.2, 2.5, 3.4, 0.75, 4.2] },
      { from: 'hours', to: 'minutes', factor: 60, vals: [1.5, 2.25, 3.5, 0.75, 4.25] },
      { from: 'mL', to: 'L', factor: 0.001, vals: [1500, 2400, 750, 3250, 500] },
    ]
    const c = cycle(seed, conversions)
    const v = pick(rng, c.vals)
    const ans = round(v * c.factor, 6)
    return {
      title: 'Convert units',
      prompt: `Convert **${v} ${c.from}** to **${c.to}**. (Enter just the number.)`,
      answer: numeric(ans),
      hints: [
        `Is a ${c.to} bigger or smaller than a ${c.from}? That tells you whether the number grows or shrinks.`,
        `The conversion factor is ${c.factor >= 1 ? `×${c.factor}` : `÷${1 / c.factor}`}.`,
        `Worked path: ${v} × ${c.factor} = **${ans} ${c.to}**.`,
      ],
      explanation: `${v} ${c.from} × (${c.factor} ${c.to} / 1 ${c.from}) = **${ans} ${c.to}** — the ${c.from} units cancel.`,
    }
  },
)

const unitRateConvert = tpl(
  {
    id: 'unit-rate-convert',
    name: 'Convert a rate',
    skillIds: ['m-units'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 3,
    transfer: true,
  },
  (_rng, seed) => {
    // Enumerate speed x direction so all 12 combinations really occur; random
    // draws from six speeds collapsed this to a single form.
    const SPEEDS = [5, 10, 15, 20, 25, 30]
    const mps = SPEEDS[seed % SPEEDS.length]
    const toKmh = Math.floor(seed / SPEEDS.length) % 2 === 0
    const kmh = mps * 3.6
    return {
      title: 'Rate conversion',
      prompt: toKmh
        ? `A cyclist moves at **${mps} m/s**. What is that in **km/h**?`
        : `A car moves at **${kmh} km/h**. What is that in **m/s**?`,
      answer: numeric(toKmh ? round(kmh, 2) : mps, { tolerance: 0.01 }),
      hints: [
        'Convert the distance unit and the time unit separately.',
        toKmh
          ? `${mps} m/s = ${mps * 3600} m per hour. Now convert meters to km.`
          : `${kmh} km/h = ${kmh * 1000} m per hour. Now convert hours to seconds.`,
        `Worked path: ${toKmh ? `${mps} × 3.6 = **${round(kmh, 2)} km/h**` : `${kmh} ÷ 3.6 = **${mps} m/s**`}.`,
      ],
      explanation: toKmh
        ? `${mps} m/s × 3600 s/h = ${mps * 3600} m/h = ${(mps * 3600) / 1000} km/h = **${round(kmh, 2)} km/h** (shortcut: ×3.6).`
        : `${kmh} km/h × 1000 m/km ÷ 3600 s/h = **${mps} m/s** (shortcut: ÷3.6).`,
    }
  },
)

const unitFactor = tpl(
  {
    id: 'unit-dimensional',
    name: 'Pick the conversion factor',
    skillIds: ['m-units'],
    bucket: 'math',
    difficulty: 2,
    variants: 4,
    minutes: 1.5,
  },
  (rng, seed) => {
    const cases = [
      { q: 'minutes → seconds', correct: '× 60 s / 1 min', wrong: ['÷ 60 s / 1 min', '× 1 min / 60 s', '× 100 s / 1 min'] },
      { q: 'grams → kilograms', correct: '× 1 kg / 1000 g', wrong: ['× 1000 kg / 1 g', '÷ 1 kg / 100 g', '× 100 g / 1 kg'] },
      { q: 'kilometers → meters', correct: '× 1000 m / 1 km', wrong: ['× 1 km / 1000 m', '× 100 m / 1 km', '÷ 1000 m / 1 km'] },
      { q: 'days → hours', correct: '× 24 h / 1 day', wrong: ['× 1 day / 24 h', '× 60 h / 1 day', '÷ 24 h / 1 day'] },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Conversion factor',
      prompt: `To convert **${c.q}**, which factor do you multiply by?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A conversion factor is a fraction equal to 1 — the two quantities must be equal.',
        'Put the unit you want to CANCEL on the bottom.',
        `Worked path: **${c.correct}** — the starting unit cancels, the target unit remains.`,
      ],
      explanation: `Choose the factor equal to 1 with the starting unit in the denominator so it cancels: **${c.correct}**.`,
    }
  },
)

// ---------------------------------------------------------------- statistics & data

const statsMean = tpl(
  {
    id: 'stats-mean',
    name: 'Mean of a data set',
    skillIds: ['m-stats'],
    bucket: 'math',
    difficulty: 1,
    variants: 13,
    minutes: 2,
  },
  (rng) => {
    const n = rint(rng, 4, 6)
    const mean = rint(rng, 5, 15)
    // Build values that sum to n*mean exactly.
    const vals: number[] = []
    let remaining = n * mean
    for (let i = 0; i < n - 1; i++) {
      const v = rint(rng, Math.max(1, mean - 6), mean + 6)
      vals.push(v)
      remaining -= v
    }
    if (remaining < 0 || remaining > mean * 3) return statsMeanFallback(rng)
    vals.push(remaining)
    return {
      title: 'Find the mean',
      prompt: `Find the **mean** of: **${vals.join(', ')}**`,
      answer: numeric(mean),
      hints: [
        'The mean is the "fair share" if the total were split evenly.',
        `Total: ${vals.join(' + ')} = ${n * mean}.`,
        `Worked path: ${n * mean} ÷ ${n} = **${mean}**.`,
      ],
      explanation: `Sum = ${n * mean}; divide by the ${n} values: ${n * mean} ÷ ${n} = **${mean}**.`,
    }
  },
)
function statsMeanFallback(rng: Rng) {
  const vals = [6, 9, 11, 14]
  void rng
  return {
    title: 'Find the mean',
    prompt: `Find the **mean** of: **${vals.join(', ')}**`,
    answer: numeric(10),
    hints: ['The mean is the total split evenly.', `Total: ${vals.join(' + ')} = 40.`, 'Worked path: 40 ÷ 4 = **10**.'],
    explanation: `Sum = 40; 40 ÷ 4 = **10**.`,
  }
}

const statsMedian = tpl(
  {
    id: 'stats-median',
    name: 'Median & outliers',
    skillIds: ['m-stats'],
    bucket: 'math',
    difficulty: 2,
    variants: 14,
    minutes: 2,
  },
  (rng) => {
    const base = rint(rng, 8, 20)
    const vals = [base, base + rint(rng, 1, 3), base + rint(rng, 4, 6), base + rint(rng, 7, 9), base + rint(rng, 30, 60)]
    const shuffled = [...vals].sort(() => rng() - 0.5)
    const median = vals[2]
    return {
      title: 'Median with an outlier',
      prompt: `Find the **median** of: **${shuffled.join(', ')}**`,
      answer: numeric(median),
      hints: [
        'Sort first — the median is a POSITION, not a calculation.',
        `Sorted: ${vals.join(', ')}. Which value sits in the middle?`,
        `Worked path: middle of 5 values = 3rd = **${median}**.`,
      ],
      explanation: `Sorted: ${vals.join(', ')} → the middle (3rd of 5) is **${median}**. Note the outlier ${vals[4]} barely moves the median but would drag the mean to ${round(vals.reduce((a, b) => a + b, 0) / 5, 1)} — that is why medians resist outliers.`,
      commonErrors: { strategy: 'Taking the middle of the UNSORTED list is the standard slip.' },
    }
  },
)

const statsMissing = tpl(
  {
    id: 'stats-mean-missing',
    name: 'Missing value from a mean',
    skillIds: ['m-stats'],
    bucket: 'math',
    difficulty: 3,
    variants: 12,
    minutes: 3,
    transfer: true,
  },
  (rng) => {
    const n = 4
    const target = rint(rng, 10, 20)
    const known = [rint(rng, 5, 20), rint(rng, 5, 20), rint(rng, 5, 20)]
    const missing = n * target - known.reduce((a, b) => a + b, 0)
    if (missing < 0 || missing > 40) {
      const k2 = [target - 2, target + 1, target - 1]
      const m2 = n * target - k2.reduce((a, b) => a + b, 0)
      return {
        title: 'Score needed for a target mean',
        prompt: `Your first three quiz scores are **${k2.join(', ')}**. What score on the 4th quiz makes the **mean exactly ${target}**?`,
        answer: numeric(m2),
        hints: [
          `A mean of ${target} across 4 quizzes fixes the TOTAL.`,
          `Needed total: 4 × ${target} = ${4 * target}. You have ${k2.reduce((a, b) => a + b, 0)}.`,
          `Worked path: ${4 * target} − ${k2.reduce((a, b) => a + b, 0)} = **${m2}**.`,
        ],
        explanation: `Mean ${target} over 4 quizzes needs total ${4 * target}; subtract the current sum ${k2.reduce((a, b) => a + b, 0)}: **${m2}**.`,
      }
    }
    return {
      title: 'Score needed for a target mean',
      prompt: `Your first three quiz scores are **${known.join(', ')}**. What score on the 4th quiz makes the **mean exactly ${target}**?`,
      answer: numeric(missing),
      hints: [
        `A mean of ${target} across 4 quizzes fixes the TOTAL, not any single score.`,
        `Needed total: 4 × ${target} = ${4 * target}. Current sum: ${known.reduce((a, b) => a + b, 0)}.`,
        `Worked path: ${4 * target} − ${known.reduce((a, b) => a + b, 0)} = **${missing}**.`,
      ],
      explanation: `Working backward from the definition: mean = total ÷ 4, so total = ${4 * target}. Missing score = ${4 * target} − ${known.reduce((a, b) => a + b, 0)} = **${missing}**.`,
    }
  },
)

const dataTable = tpl(
  {
    id: 'data-table-read',
    name: 'Read a table carefully',
    skillIds: ['m-data'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (rng) => {
    const mon = rint(rng, 20, 60)
    const tue = rint(rng, 20, 60)
    const wed = rint(rng, 20, 60)
    const thu = rint(rng, 20, 60)
    const q = pick(rng, ['diff', 'total', 'mean'] as const)
    const table = `| Day | Visitors |\n| --- | --- |\n| Mon | ${mon} |\n| Tue | ${tue} |\n| Wed | ${wed} |\n| Thu | ${thu} |`
    const ans = q === 'diff' ? Math.abs(wed - mon) : q === 'total' ? mon + tue + wed + thu : (mon + tue + wed + thu) / 4
    return {
      title: 'Table reading',
      prompt:
        `A library logs visitors:\n\n${table}\n\n` +
        (q === 'diff'
          ? 'How many **more or fewer** visitors came Wednesday than Monday? (Give the positive difference.)'
          : q === 'total'
            ? 'How many visitors came in **total** across the four days?'
            : 'What is the **mean** number of visitors per day?'),
      answer: numeric(ans),
      hints: [
        'Pull out exactly the rows the question asks about.',
        q === 'diff' ? `Wed = ${wed}, Mon = ${mon}.` : `The four values are ${mon}, ${tue}, ${wed}, ${thu}.`,
        `Worked path: **${ans}**.`,
      ],
      explanation:
        q === 'diff'
          ? `Pull only the rows named: Wed = ${wed}, Mon = ${mon}; the positive difference is |${wed} − ${mon}| = **${Math.abs(wed - mon)}**. Reading the RIGHT cells is most of table skill.`
          : q === 'total'
            ? `Sum every row: ${mon} + ${tue} + ${wed} + ${thu} = **${mon + tue + wed + thu}**. Adding in easy pairs reduces slips.`
            : `Mean = total ÷ count: (${mon} + ${tue} + ${wed} + ${thu}) ÷ 4 = ${mon + tue + wed + thu} ÷ 4 = **${ans}** visitors per day.`,
    }
  },
)

/*
 * `m-data` promises "tables, bar charts, line graphs, and scatter plots" and
 * shipped exactly one family, on tables. That was not only a thin topic: with a
 * single family reachable from an ordinary daily block, the skill could never
 * satisfy its own promotion rule (Independent needs two distinct FAMILIES), so
 * it sat at `guided` permanently — and a permanently-unpromotable skill keeps
 * the frontier bonus forever. Measured over a simulated year: `data-table-read`
 * was served 611 times, roughly a fifth of every attempt the learner made.
 *
 * The three families below finish the promise and let the skill graduate. A
 * chart is drawn in a fenced block so it renders in the monospace column the
 * markdown-lite renderer already supports — no images, no new dependency, and
 * it stays readable at 320px.
 */

/** Fixed-width bar row, e.g. "Mon │████████ 40". */
function barRow(label: string, value: number, max: number, width = 18): string {
  const filled = Math.max(1, Math.round((value / max) * width))
  return `${label.padEnd(4)}│${'█'.repeat(filled).padEnd(width)} ${value}`
}

const dataBarRead = tpl(
  {
    id: 'data-bar-read',
    name: 'Read a bar chart',
    skillIds: ['m-data'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const values = labels.map(() => rint(rng, 8, 48))
    const max = Math.max(...values)
    const chart = labels.map((l, i) => barRow(l, values[i], max)).join('\n')
    const q = cycle(seed, ['range', 'above', 'total'] as const)
    const min = Math.min(...values)
    const total = values.reduce((a, b) => a + b, 0)
    const mean = total / values.length
    const above = values.filter((v) => v > mean).length
    const ans = q === 'range' ? max - min : q === 'above' ? above : total
    const ask =
      q === 'range'
        ? 'What is the **range** (largest bar minus smallest bar)?'
        : q === 'above'
          ? 'How many days were **above the mean** of the five days?'
          : 'What is the **total** across all five days?'
    return {
      title: 'Bar chart',
      prompt: `Bikes rented per day:\n\n\`\`\`\n${chart}\n\`\`\`\n\n${ask}`,
      answer: numeric(ans),
      hints: [
        'Read the NUMBER at the end of each bar, not the length of the bar — the bar is the picture, the number is the data.',
        q === 'range'
          ? `Largest = ${max}, smallest = ${min}.`
          : q === 'above'
            ? `Total = ${total}, so the mean is ${total} ÷ 5 = ${round(mean, 2)}.`
            : `The five values are ${values.join(', ')}.`,
        `Worked path: **${ans}**.`,
      ],
      explanation:
        q === 'range'
          ? `Range = ${max} − ${min} = **${ans}**. Range measures SPREAD, not size: two charts can share a mean and look nothing alike.`
          : q === 'above'
            ? `Mean = ${total} ÷ 5 = ${round(mean, 2)}, and ${ans} of the five bars sit above it. Notice that "above average" is usually not half — a single tall bar drags the mean up past most of the others.`
            : `Sum every bar: ${values.join(' + ')} = **${ans}**. Totals come from the numbers; the picture only tells you where to look.`,
    }
  },
)

const dataLineRead = tpl(
  {
    id: 'data-line-read',
    name: 'Read a line graph',
    skillIds: ['m-data'],
    bucket: 'math',
    difficulty: 2,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const start = rint(rng, 20, 40)
    const steps = [rint(rng, -8, 12), rint(rng, -8, 12), rint(rng, -8, 12), rint(rng, -8, 12)]
    const series = steps.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s], [start])
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    const table = `| Month | ${months.join(' | ')} |\n| --- | ${months.map(() => '---').join(' | ')} |\n| Value | ${series.join(' | ')} |`
    const q = cycle(seed, ['steepest', 'netchange', 'peak'] as const)
    // The steepest SEGMENT is about the change between points, not the height.
    let steepIdx = 0
    for (let i = 1; i < steps.length; i++) {
      if (Math.abs(steps[i]) > Math.abs(steps[steepIdx])) steepIdx = i
    }
    const net = series[series.length - 1] - series[0]
    const peakIdx = series.indexOf(Math.max(...series))
    const correct =
      q === 'steepest'
        ? `${months[steepIdx]}→${months[steepIdx + 1]}`
        : q === 'netchange'
          ? String(net)
          : months[peakIdx]
    const ask =
      q === 'steepest'
        ? 'Between which two months did the value change the **most** (in either direction)?'
        : q === 'netchange'
          ? 'What is the **net change** from Jan to May? (Negative if it fell.)'
          : 'In which month was the value **highest**?'
    // Distractors are drawn from the data itself, so they are always distinct
    // from the key and always plausible: the other three segments, or the other
    // four months. Hand-listed alternatives could collide with the answer once
    // the random series happened to peak in the wrong place, which is what the
    // "mcq needs 3+ options" gate caught here.
    const segments = months.slice(0, 4).map((m, i) => `${m}→${months[i + 1]}`)
    const distractors =
      q === 'steepest'
        ? segments.filter((s) => s !== correct)
        : q === 'netchange'
          ? []
          : months.filter((m) => m !== correct)
    return {
      title: 'Line graph',
      prompt: `Weekly signups, plotted month by month:\n\n${table}\n\n${ask}`,
      answer: q === 'netchange' ? numeric(net) : mcq(rng, correct, distractors),
      hints: [
        'A line graph carries two different facts: the HEIGHT at each point, and the CHANGE between points. Decide which the question wants.',
        q === 'steepest'
          ? `The four changes are ${steps.map((s, i) => `${months[i]}→${months[i + 1]}: ${s > 0 ? '+' : ''}${s}`).join(', ')}.`
          : q === 'netchange'
            ? `Jan = ${series[0]}, May = ${series[4]}.`
            : `The five values are ${series.join(', ')}.`,
        `Worked path: **${correct}**.`,
      ],
      explanation:
        q === 'steepest'
          ? `Steepness is about the SEGMENT, not the point: the changes are ${steps.map((s, i) => `${months[i]}→${months[i + 1]}: ${s > 0 ? '+' : ''}${s}`).join(', ')}, so the biggest move is **${correct}**. The highest point and the steepest climb are different questions, and mixing them is the usual slip.`
          : q === 'netchange'
            ? `Net change = last − first = ${series[4]} − ${series[0]} = **${net}**. Net change ignores the route: a line that rises, falls, and rises again can still have a net change of zero.`
            : `The tallest value is ${Math.max(...series)} in **${correct}**. "Highest" is about level; it says nothing about which month grew fastest.`,
    }
  },
)

const dataChartChoose = tpl(
  {
    id: 'data-chart-choose',
    name: 'Which display fits the question?',
    skillIds: ['m-data'],
    bucket: 'math',
    difficulty: 3,
    variants: 6,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        q: 'You want to know whether students who sleep longer tend to score higher on a test. You have both numbers for 40 students.',
        correct: 'Scatter plot',
        why: 'Two numeric measurements on the same individuals, and the question is whether they move together — that is exactly what a scatter plot shows.',
        wrong: [
          ['Bar chart', 'Bar charts compare separate categories. Sleep hours are not categories, and a bar chart would hide the pairing between the two numbers.'],
          ['Line graph', 'A line graph implies the horizontal axis is an ordered sequence you travel along, usually time. These 40 students are not a sequence.'],
          ['Pie chart', 'Pie charts show parts of one whole. Nothing here adds up to a whole.'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'You want to show how one city\'s rainfall changed across the twelve months of last year.',
        correct: 'Line graph',
        why: 'One measurement over an ordered time sequence: the line between points is meaningful because the months really do follow one another.',
        wrong: [
          ['Pie chart', 'A pie would treat the months as slices of a total and throw away the order — you could no longer see when the wet season was.', 'concept'],
          ['Scatter plot', 'A scatter plot is for the relationship between two measured variables; here time is the axis, not a second measurement.', 'concept'],
          ['Histogram', 'A histogram bins one variable to show its distribution. It would tell you how often each rainfall amount happened, not when.', 'concept'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'You want to compare total recycling collected by four different schools last term.',
        correct: 'Bar chart',
        why: 'Four separate, unordered categories with one number each — the comparison you want is length against length.',
        wrong: [
          ['Line graph', 'Connecting the schools with a line would suggest school B sits "between" A and C in some real sequence. It does not; the order is arbitrary.'],
          ['Scatter plot', 'A scatter plot needs two numeric measurements per case. There is only one number per school.'],
          ['Histogram', 'A histogram bins a numeric variable. School name is a label, not a quantity to bin.'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'You want to see the shape of 200 reaction times — whether most cluster together and whether there is a long tail.',
        correct: 'Histogram',
        why: 'One numeric variable, many values, and the question is about the DISTRIBUTION: where the values pile up and how far the tail runs.',
        wrong: [
          ['Bar chart', 'A bar chart compares categories. Two hundred individual reaction times are not two hundred categories, and the bars would carry no shape.'],
          ['Line graph', 'A line graph would imply the 200 measurements arrived in a meaningful order and that the values between them mean something.'],
          ['Scatter plot', 'A scatter plot needs a second variable to plot against. Here there is only one.'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'You want to show what share of a school\'s budget goes to each of five departments.',
        correct: 'Pie chart',
        why: 'Five parts of one whole that genuinely sums to 100% — the one situation a pie is actually built for.',
        wrong: [
          ['Line graph', 'There is no sequence to travel along; the departments do not follow one another in any order.'],
          ['Scatter plot', 'A scatter plot needs two numeric measurements per case, and there is one number per department.'],
          ['Histogram', 'A histogram bins a numeric variable to show a distribution. Department is a label.'],
        ] as [string, string, ErrorTag?][],
      },
      {
        q: 'You want to know whether a town\'s daily high temperature and its ice-cream sales rise and fall together across one summer.',
        correct: 'Scatter plot',
        why: 'Two numeric measurements paired on the same days, and the question is about the relationship between them rather than about either one over time.',
        wrong: [
          ['Line graph', 'Two lines over time would show each series, but reading the relationship off two lines is guesswork — pairing the values directly is what answers the question.'],
          ['Bar chart', 'Bar charts compare categories; days are ordered and there are far too many of them.'],
          ['Pie chart', 'Nothing here is a share of a whole.'],
        ] as [string, string, ErrorTag?][],
      },
    ]
    const c = cycle(seed, cases)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Choosing the display',
      prompt: `${c.q}\n\nWhich display answers that question best?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Ask what KIND of data you have before you think about pictures: how many variables, are they numbers or labels, and is there a real order?',
        'One number per category → bars. One number over time → line. Two numbers per case → scatter. One number, many cases, shape → histogram. Parts of one whole → pie.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nPicking the display is not decoration — the wrong chart can make a real pattern invisible or invent one that is not there.`,
    }
  },
)

// ---------------------------------------------------------------- counting & probability

const countMult = tpl(
  {
    id: 'count-mult',
    name: 'Multiplication principle',
    skillIds: ['m-counting'],
    bucket: 'math',
    difficulty: 2,
    variants: 9,
    minutes: 2,
  },
  (rng) => {
    const shirts = rint(rng, 3, 6)
    const pants = rint(rng, 2, 5)
    const shoes = rint(rng, 2, 4)
    const ans = shirts * pants * shoes
    return {
      title: 'Counting outfits',
      prompt: `You have **${shirts}** shirts, **${pants}** pairs of pants, and **${shoes}** pairs of shoes. How many different outfits (one of each) can you make?`,
      answer: numeric(ans),
      hints: [
        'For EACH shirt, how many pants choices exist? For each of those, how many shoes?',
        `Choices multiply: ${shirts} × ${pants} gives the shirt-pants combos.`,
        `Worked path: ${shirts} × ${pants} × ${shoes} = **${ans}**.`,
      ],
      explanation: `Independent choices multiply: ${shirts} × ${pants} × ${shoes} = **${ans}** outfits.`,
      commonErrors: { concept: `Adding (${shirts + pants + shoes}) counts the items, not the combinations.` },
    }
  },
)

const countArrange = tpl(
  {
    id: 'count-arrange',
    name: 'Arrangements',
    skillIds: ['m-counting'],
    bucket: 'math',
    difficulty: 3,
    variants: 1,
    minutes: 2,
  },
  (rng) => {
    const n = rint(rng, 3, 5)
    const ans = Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1)
    return {
      title: 'Line them up',
      prompt: `**${n}** different books go on a shelf. In how many **orders** can they be arranged?`,
      answer: numeric(ans),
      hints: [
        'Fill the positions one at a time: how many choices for the first spot?',
        `First spot: ${n} choices; second: ${n - 1} (one book is used); and so on.`,
        `Worked path: ${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = **${ans}**.`,
      ],
      explanation: `${Array.from({ length: n }, (_, i) => n - i).join(' × ')} = **${ans}** (each placement uses up a book, so choices shrink by one).`,
    }
  },
)

const probSingle = tpl(
  {
    id: 'prob-single',
    name: 'Single-event probability',
    skillIds: ['m-prob'],
    bucket: 'math',
    difficulty: 1,
    variants: 14,
    minutes: 1.5,
  },
  (rng) => {
    const red = rint(rng, 2, 6)
    const blue = rint(rng, 2, 6)
    const green = rint(rng, 1, 5)
    const total = red + blue + green
    const target = pick(rng, ['red', 'blue', 'green'] as const)
    const count = target === 'red' ? red : target === 'blue' ? blue : green
    return {
      title: 'One draw',
      prompt: `A bag holds **${red} red**, **${blue} blue**, and **${green} green** marbles. You draw one at random. What is P(**${target}**)? Answer as a fraction.`,
      answer: fraction(count, total),
      hints: [
        'Probability = favorable outcomes ÷ total equally-likely outcomes.',
        `Total marbles: ${red} + ${blue} + ${green} = ${total}.`,
        `Worked path: ${count}/${total}${gcd(count, total) > 1 ? ` = **${fracStr(count, total)}**` : ''}.`,
      ],
      explanation: `${count} favorable out of ${total} total: **${fracStr(count, total)}**.`,
    }
  },
)

const probComplement = tpl(
  {
    id: 'prob-complement',
    name: 'Complement rule',
    skillIds: ['m-prob'],
    bucket: 'math',
    difficulty: 2,
    variants: 2,
    minutes: 2,
  },
  (rng) => {
    const n = pick(rng, [6, 8, 10, 12])
    const bad = rint(rng, 1, Math.min(5, n - 2))
    return {
      title: 'At least one way to avoid it',
      prompt: `A spinner has **${n}** equal sections, and **${bad}** of them say "lose a turn". What is the probability you do **NOT** lose a turn? Answer as a fraction.`,
      answer: fraction(n - bad, n),
      hints: [
        'Sometimes counting what you DON’T want is easier.',
        `P(lose) = ${bad}/${n}. The two probabilities must total 1.`,
        `Worked path: 1 − ${bad}/${n} = **${fracStr(n - bad, n)}**.`,
      ],
      explanation: `P(not lose) = 1 − ${bad}/${n} = ${n - bad}/${n}${gcd(n - bad, n) > 1 ? ` = **${fracStr(n - bad, n)}**` : ''}.`,
    }
  },
)

const probCompound = tpl(
  {
    id: 'prob-compound',
    name: 'Independent events',
    skillIds: ['m-prob'],
    bucket: 'math',
    difficulty: 3,
    variants: 1,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng) => {
    const sides = pick(rng, [4, 6, 8])
    const flips = 2
    const ans: [number, number] = [1, sides * 2 ** flips]
    void flips
    return {
      title: 'Two independent events',
      prompt: `You flip a fair coin **twice** and roll a fair **${sides}-sided** die once. What is the probability of getting **heads both times AND rolling a ${sides}**? Answer as a fraction.`,
      answer: fraction(ans[0], ans[1]),
      hints: [
        'Independent events: multiply the individual probabilities.',
        `P(heads twice) = 1/2 × 1/2 = 1/4. P(rolling ${sides}) = 1/${sides}.`,
        `Worked path: 1/4 × 1/${sides} = **1/${4 * sides}**.`,
      ],
      explanation: `The coin flips and die roll do not influence each other, so multiply: (1/2)(1/2)(1/${sides}) = **1/${4 * sides}**.`,
      commonErrors: { concept: 'Adding the probabilities describes "either/or", not "all together".' },
    }
  },
)

const evGame = tpl(
  {
    id: 'ev-game',
    name: 'Expected value of a game',
    skillIds: ['m-ev'],
    bucket: 'math',
    difficulty: 3,
    variants: 7,
    minutes: 3,
    calibration: true,
  },
  (rng) => {
    const sides = 6
    const winFaces = rint(rng, 1, 2)
    const winAmt = pick(rng, [6, 9, 12])
    const loseAmt = pick(rng, [1, 2, 3])
    const evNum = winFaces * winAmt - (sides - winFaces) * loseAmt
    const ev = round(evNum / sides, 4)
    return {
      title: 'Is this game worth playing?',
      prompt: `A die game: roll a fair 6-sided die. On ${winFaces === 1 ? 'a **6**' : 'a **5 or 6**'} you win **${money(winAmt)}**; on anything else you lose **${money(loseAmt)}**. What is the expected value of one roll, in dollars? (Negative allowed, e.g. -0.5)`,
      answer: numeric(ev, { tolerance: 0.001 }),
      hints: [
        'Expected value = each outcome × its probability, summed.',
        `Win: ${winFaces}/6 × ${winAmt}. Lose: ${sides - winFaces}/6 × (−${loseAmt}).`,
        `Worked path: (${winFaces}×${winAmt} − ${sides - winFaces}×${loseAmt})/6 = **${ev}**.`,
      ],
      explanation: `EV = (${winFaces}/6)(${winAmt}) + (${sides - winFaces}/6)(−${loseAmt}) = ${evNum}/6 = **${money(ev).replace('$-', '-$')}** per roll — over many rolls you average ${ev >= 0 ? 'a gain' : 'a loss'}, even though any single roll varies.`,
    }
  },
)

export const MATH_NUMBER_TEMPLATES: ItemTemplate[] = [
  intOps,
  intOrderOps,
  intWord,
  fracAddSub,
  fracMulDiv,
  fracWord,
  fracCompare,
  decConvert,
  decPercent,
  decOrder,
  expPower,
  expRules,
  sciNot,
  rootPerfect,
  rootEstimate,
  unitRate,
  ratioShare,
  bestBuy,
  propSolve,
  propWord,
  propIdentify,
  pctOf,
  pctChange,
  pctMulti,
  pctReverse,
  unitConvert,
  unitRateConvert,
  unitFactor,
  statsMean,
  statsMedian,
  statsMissing,
  dataTable,
  dataBarRead,
  dataLineRead,
  dataChartChoose,
  countMult,
  countArrange,
  probSingle,
  probComplement,
  probCompound,
  evGame,
]
