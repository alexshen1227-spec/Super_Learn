/**
 * ALGORITHMS LAB — offline-gradeable depth for the `coding` bucket.
 *
 * WHY THIS FILE EXISTS. The coding bucket was 34 templates / 302 variants for
 * nine skills, with `c-vars` on 2 families and `c-complexity` on 3. A learner
 * simulated over five years exhausted most of those variant pools, after which
 * "practice" was recall of a specific rendered item rather than execution of a
 * method. This file adds 27 families whose answers are all COMPUTED by running
 * the algorithm in the generator, so the variant pools are genuinely deep.
 *
 * WHAT IT TARGETS. The assessable core of the CSTA K-12 CS Standards (revised
 * 2017), levels 3A/3B — the subset whose answers are exactly checkable without
 * a compiler, a grader, or a human reader:
 *
 *   3A-DA-09  "Translate between different bit representations of real-world
 *              phenomena, such as characters, numbers, and images."   → c-vars
 *   3A-AP-17  "Decompose problems into smaller components through systematic
 *              analysis, using constructs such as procedures, modules, and/or
 *              objects."                                              → c-decomp
 *   3B-AP-09  "Implement an artificial intelligence algorithm to play a game
 *              against a human opponent or solve a problem."          → c-algo
 *   3B-AP-10  "Use and adapt classic algorithms to solve computational
 *              problems."                                             → c-algo
 *   3B-AP-11  "Evaluate algorithms in terms of their efficiency, correctness,
 *              and clarity."                                          → c-complexity
 *   3B-AP-12  "Compare and contrast fundamental data structures and their
 *              uses."                                                 → c-arrays
 *   3B-AP-13  "Illustrate the flow of execution of a recursive algorithm."
 *                                                                     → c-trace
 *   3B-AP-18  "Explain security issues that might lead to compromised computer
 *              programs."                                             → c-trace
 *   3B-CS-02  "Illustrate ways computing systems implement logic, input, and
 *              output through hardware components."                   → c-bool
 *
 * Standard wording checked against the CSTA 2017 revision (csteachers.org) and
 * the CodeHS 3A/3B framework listings, 2026-08-11. 3B-AP-09 is implementation
 * of a game-playing algorithm; a paper trace of minimax is a proper subset of
 * it, not the whole standard, and is labelled as a trace throughout.
 *
 * THE CARDINAL RULE, APPLIED. Nothing here is hand-computed. `bsearch` runs and
 * reports its own probe list; `dijkstra` enumerates every route and takes the
 * minimum; `classifyGrowth` executes each loop nest at four input sizes and
 * fits the growth class from the measured counts; the greedy-coin counter-
 * example is confirmed against an exact dynamic-programming optimum before it
 * is offered as an option. Degenerate instances (tied shortest paths, a
 * non-integer crossover, a truth table with too few false rows to build
 * distractors from) are REJECTED by resampling rather than papered over.
 *
 * PSEUDOCODE STYLE. Language-neutral and identical across the file:
 *   - assignment `x = 3`, comparison `==` / `!=` / `<=`
 *   - `for i from a to b:` is INCLUSIVE of b; `for i from a to b step s:`
 *   - `while cond:` / `if cond:` / `else:` with 4-space block indentation
 *   - arrays are ZERO-indexed, `A[0]` first, `A[n-1]` last
 *   - `#` starts a comment; `floor(x)` and `x mod y` are spelled out
 * Everything the learner reads is markdown-lite: fenced blocks, `**bold**`,
 * newlines. No tables, no HTML, no single-asterisk emphasis (the renderer
 * emits those literally).
 *
 * OPTION-LENGTH DISCIPLINE. Bank-wide, "always pick the longest option" was
 * once worth 52.8% against a 25% baseline, and "comparable lengths" is NOT the
 * fix: a key that is 15% longer EVERY time is still a free 100%. The rule here
 * is the strict one — in every option set the key must not be strictly the
 * longest option — and it is enforced structurally rather than by eye:
 *
 *   - Most sets are length-IDENTICAL by construction. Truth-table rows render
 *     as `A = 1, B = 0, C = 1`; probe orders and traversal orders carry a fixed
 *     token count over single-character labels; coin amounts are all two digits;
 *     `Move 1` / `Move 2` / `Move 3` are the same string but for one digit.
 *   - Where option texts genuinely differ in length (growth classes, prose
 *     scenarios), `balancedMcq` guarantees at least one distractor at least as
 *     long as the key, and the prose banks were written decoys-first so the key
 *     is often the SHORTEST of the four.
 *
 * The temporary self-check asserted `keyLength <= max(otherLengths)` on every
 * option set of every variant before this file was accepted.
 */
import type { AnswerSpec, ItemPart, ItemTemplate, McqAnswer } from '../../domain/types'
import { rint, shuffle, type Rng } from '../../engine/rng'
import { cycle, mcq, mcqNoted, numeric, text, tpl } from '../lib'

const code = (s: string) => '```\n' + s + '\n```'

/**
 * A value that cannot collide with another variant's: split [lo, hi] into
 * `buckets` slices and draw inside slice `i`. Drawing freely from the whole
 * range instead makes `variants: 24` a claim the generator cannot keep — two
 * seeds land on the same number and the audit's distinctness floor catches it.
 */
function slice(rng: Rng, i: number, buckets: number, lo: number, hi: number): number {
  const width = (hi - lo + 1) / buckets
  const a = lo + Math.round(i * width)
  const b = Math.min(hi, lo + Math.round((i + 1) * width) - 1)
  return rint(rng, a, Math.max(a, b))
}

/** Ordering answer: display order is shuffled, the key is derived from it. */
function orderAnswer(rng: Rng, correctOrder: string[]): Extract<AnswerSpec, { type: 'order' }> {
  const options = shuffle(rng, correctOrder)
  return { type: 'order', options, correct: correctOrder.map((s) => options.indexOf(s)) }
}

/**
 * An MCQ that cannot be answered by length.
 *
 * Where the option texts are genuinely different lengths, a key that is the
 * longest one is a free mark — and being the longest only 15% of the time over
 * and over is still a free mark. This draws distractors from `pool` but forces
 * at least one of them to be at least as long as the key, so `keyLength <=
 * max(otherLengths)` holds in every set this builds.
 */
function balancedMcq(rng: Rng, correct: string, pool: string[], want = 3): McqAnswer {
  const available = shuffle(
    rng,
    pool.filter((o) => o !== correct),
  )
  const chosen = available.slice(0, want)
  if (!chosen.some((o) => o.length >= correct.length)) {
    const longEnough = available.find((o) => o.length >= correct.length)
    // Replace the shortest pick, so the set keeps its widest spread.
    if (longEnough) {
      let shortestAt = 0
      chosen.forEach((o, i) => {
        if (o.length < chosen[shortestAt].length) shortestAt = i
      })
      chosen[shortestAt] = longEnough
    }
  }
  return mcq(rng, correct, chosen)
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

// ------------------------------------------------------------------ c-vars
// 3A-DA-09 — bit representations. The largest variant pools in the file: the
// mapping between a number and its bit pattern is exactly checkable, endlessly
// parameterisable, and the boundary case (an exact power of two) is where the
// off-by-one lives.

/** Binary string of a non-negative integer, no padding. */
const toBin = (n: number) => n.toString(2)
/** Binary string padded to `w` bits. */
const padBin = (n: number, w: number) => toBin(n).padStart(w, '0')
/** Groups of four, for a learner who types "1011 0101". */
const grouped = (s: string) => (s.match(/.{1,4}(?=(.{4})*$)/g) ?? [s]).join(' ')

const binDec = tpl(
  {
    id: 'alab-bin-dec',
    name: 'Binary and decimal',
    skillIds: ['c-vars'],
    bucket: 'coding',
    difficulty: 2,
    variants: 30,
    minutes: 2,
  },
  (rng, seed) => {
    const dir = seed % 2
    const value = slice(rng, Math.floor(seed / 2), 15, 9, 250)
    const bin = toBin(value)
    // Place-value table, computed from the pattern itself.
    const places = bin
      .split('')
      .map((b, i) => ({ bit: b, weight: 2 ** (bin.length - 1 - i) }))
      .filter((p) => p.bit === '1')
    const sum = places.map((p) => p.weight).join(' + ')
    if (dir === 0) {
      return {
        title: 'Read the bit pattern',
        prompt: `Each place in a binary number is worth twice the place to its right: 1, 2, 4, 8, 16, 32, 64, 128.\n${code(
          `pattern = ${bin}`,
        )}\nWhat is this as an ordinary decimal number?`,
        answer: numeric(value),
        hints: [
          'Write the place values above the digits, starting from 1 on the right and doubling leftwards.',
          `The 1s sit in the ${places.map((p) => p.weight).join(', ')} ${plural(places.length, 'place', 'places')}.`,
          `Worked path: ${sum} = **${value}**.`,
        ],
        explanation: `Add the place value of every 1: ${sum} = **${value}**. The 0s contribute nothing, which is the whole trick — a bit pattern is a sum of powers of two, and reading it is addition, not translation. A pattern ${bin.length} bits wide can hold ${2 ** bin.length} different values (0 to ${2 ** bin.length - 1}).`,
        commonErrors: {
          slip: 'Starting the place values at 1 on the LEFT reverses the pattern and gives a completely different number.',
        },
      }
    }
    return {
      title: 'Write the bit pattern',
      prompt: `A byte holds eight bits, each worth twice the one to its right: 128, 64, 32, 16, 8, 4, 2, 1.\n\nWrite **${value}** as an 8-bit pattern. Type eight digits, for example 00101101.`,
      answer: text([padBin(value, 8), grouped(padBin(value, 8)), toBin(value)], 'eight 0s and 1s'),
      hints: [
        'Work from the LARGEST place value down: does 128 fit? Subtract it if it does, then try 64.',
        `Greedy subtraction: ${places.map((p) => p.weight).join(' fits, then ')} fits, and nothing is left.`,
        `Worked path: ${sum} = ${value}, so the pattern is **${padBin(value, 8)}**.`,
      ],
      explanation: `Take the place values from the top: ${sum} = ${value}, so those places get a 1 and the rest get a 0 — **${padBin(value, 8)}**. Padding to eight bits matters: a byte is always eight wide, so ${toBin(value)} and ${padBin(value, 8)} are the same value stored differently.`,
    }
  },
)

const hexConvert = tpl(
  {
    id: 'alab-hex-convert',
    name: 'Hexadecimal conversion',
    skillIds: ['c-vars'],
    bucket: 'coding',
    difficulty: 3,
    variants: 24,
    minutes: 2.5,
  },
  (rng, seed) => {
    const dir = seed % 3
    const value = slice(rng, Math.floor(seed / 3), 8, 26, 250)
    const hex = value.toString(16).toUpperCase()
    const hi = Math.floor(value / 16)
    const lo = value % 16
    const digit = (d: number) => d.toString(16).toUpperCase()
    const table = 'A = 10, B = 11, C = 12, D = 13, E = 14, F = 15'
    if (dir === 0) {
      return {
        title: 'Hex to decimal',
        prompt: `Hexadecimal counts in sixteens. The right digit is worth 1 each, the next is worth 16 each, and the letters carry on past 9: ${table}.\n${code(
          `colour = 0x${hex}`,
        )}\nWhat is this as a decimal number?`,
        answer: numeric(value),
        hints: [
          'Two hex digits: the left one counts sixteens, the right one counts ones.',
          `Left digit ${digit(hi)} means ${hi}, so that is ${hi} × 16 = ${hi * 16}. Right digit ${digit(lo)} means ${lo}.`,
          `Worked path: ${hi * 16} + ${lo} = **${value}**.`,
        ],
        explanation: `${digit(hi)} is ${hi} and ${digit(lo)} is ${lo}, so the value is ${hi} × 16 + ${lo} = ${hi * 16} + ${lo} = **${value}**. Hex exists because one hex digit is exactly four bits, so a byte is always two hex digits — that is why colours and memory addresses are written this way.`,
        commonErrors: {
          concept: `Reading ${digit(hi)}${digit(lo)} as the decimal number ${hi}${lo} ignores that the left digit counts SIXTEENS.`,
        },
      }
    }
    if (dir === 1) {
      return {
        title: 'Decimal to hex',
        prompt: `Hexadecimal counts in sixteens, and the digits past 9 are letters: ${table}.\n\nWrite **${value}** in hexadecimal. Two digits, for example 3F.`,
        answer: text([hex, `0x${hex}`], 'two hex digits'),
        hints: [
          'How many whole 16s fit inside the number? That is the left digit.',
          `${value} = ${hi} × 16 + ${lo}, so the left digit is ${hi} and the right digit is ${lo}.`,
          `Worked path: ${hi} is written ${digit(hi)} and ${lo} is written ${digit(lo)}, giving **${hex}**.`,
        ],
        explanation: `Divide by 16: ${value} = ${hi} × 16 + ${lo}. The quotient ${hi} is the left digit (${digit(hi)}) and the remainder ${lo} is the right digit (${digit(lo)}), so the answer is **${hex}**. Any base conversion is this same divide-and-keep-the-remainder loop.`,
      }
    }
    return {
      title: 'Hex to bits',
      prompt: `Each hexadecimal digit stands for exactly four bits, which is the only reason hex is used at all: ${table}.\n${code(
        `mask = 0x${hex}`,
      )}\nWrite this as an 8-bit binary pattern. Eight digits, for example 00101101.`,
      answer: text([padBin(value, 8), grouped(padBin(value, 8))], 'eight 0s and 1s'),
      hints: [
        'Convert each hex digit on its own into four bits, then put the two halves side by side.',
        `${digit(hi)} is ${hi}, which is ${padBin(hi, 4)}. ${digit(lo)} is ${lo}, which is ${padBin(lo, 4)}.`,
        `Worked path: ${padBin(hi, 4)} then ${padBin(lo, 4)} gives **${padBin(value, 8)}**.`,
      ],
      explanation: `Each digit becomes its own four bits: ${digit(hi)} → ${padBin(hi, 4)} and ${digit(lo)} → ${padBin(lo, 4)}, so the byte is **${padBin(value, 8)}**. No arithmetic is needed across the boundary, because 16 is 2 to the fourth — the two halves never interfere.`,
    }
  },
)

/** Smallest k with 2^k >= n, computed by doubling rather than by log(). */
function bitsFor(n: number): number {
  let bits = 0
  let cap = 1
  while (cap < n) {
    cap *= 2
    bits++
  }
  return bits
}

const bitsNeeded = tpl(
  {
    id: 'alab-bits-needed',
    name: 'How many bits?',
    skillIds: ['c-vars'],
    bucket: 'coding',
    difficulty: 3,
    variants: 24,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const form = seed % 3
    const k = Math.floor(seed / 3)
    if (form === 0) {
      const n = slice(rng, k, 8, 40, 4000)
      const bits = bitsFor(n)
      return {
        title: 'Bits for a code',
        prompt: `A school gives every one of its **${n}** books a different bit pattern, all the same length.\n\nWhat is the smallest number of bits that pattern can be?`,
        answer: numeric(bits),
        hints: [
          'A pattern of k bits has 2 to the power k different values. Keep doubling until you have enough.',
          `Doubling: ${[...Array(bits + 1).keys()].map((i) => 2 ** i).join(', ')}. Which is the first one that reaches ${n}?`,
          `Worked path: ${2 ** (bits - 1)} is too few and ${2 ** bits} is enough, so **${bits}** bits.`,
        ],
        explanation: `With ${bits - 1} bits there are only ${2 ** (bits - 1)} patterns, which is fewer than ${n} books. With ${bits} bits there are ${2 ** bits}, which is enough (${2 ** bits - n} patterns spare). So **${bits}** bits. Bits grow by one every time the collection DOUBLES, which is why a thousandfold more books needs only ten more bits.`,
        commonErrors: {
          concept: 'Dividing by 2 repeatedly and counting the divisions gives roughly the right size but drops the "round UP" step when the count is not a power of two.',
        },
      }
    }
    if (form === 1) {
      const bits = 4 + k
      return {
        title: 'Patterns from bits',
        prompt: `A sensor sends a reading as a **${bits}-bit** value.\n\nHow many different readings can it possibly send?`,
        answer: numeric(2 ** bits),
        hints: [
          'Each extra bit doubles the number of patterns, because each old pattern can now end in 0 or in 1.',
          `Start at 1 pattern with 0 bits and double ${bits} times.`,
          `Worked path: 2 to the power ${bits} = **${2 ** bits}**.`,
        ],
        explanation: `Each of the ${bits} bits is an independent yes/no, so there are 2 × 2 × … = 2 to the power ${bits} = **${2 ** bits}** patterns (the readings 0 up to ${2 ** bits - 1}). Doubling is the whole story: ${bits - 1} bits would give ${2 ** (bits - 1)}, exactly half.`,
      }
    }
    const exact = 2 ** (5 + k)
    const bits = bitsFor(exact)
    return {
      title: 'Exactly a power of two',
      prompt: `A game gives every one of its **${exact}** tiles a different bit pattern, all the same length.\n\nWhat is the smallest number of bits that pattern can be?`,
      answer: numeric(bits),
      hints: [
        'Careful here: the count is itself a power of two, which is exactly where the off-by-one hides.',
        `${bits} bits give ${2 ** bits} patterns. Is that enough for ${exact} tiles, or one short?`,
        `Worked path: ${2 ** bits} patterns for ${exact} tiles fits exactly, so **${bits}** bits.`,
      ],
      explanation: `${bits} bits give exactly ${2 ** bits} patterns, which is exactly ${exact} — a perfect fit, so **${bits}** bits, not ${bits + 1}. The trap is thinking you need one spare: you do not, because the patterns start at 0. ${bits} bits number the tiles 0 to ${exact - 1}, and that is all ${exact} of them.`,
        commonErrors: {
          slip: `Answering ${bits + 1} treats the last pattern as unusable. Counting from 0 means ${2 ** bits} patterns really do cover ${exact} items.`,
        },
    }
  },
)

const imageBytes = tpl(
  {
    id: 'alab-image-bytes',
    name: 'Storage size',
    skillIds: ['c-vars'],
    bucket: 'coding',
    difficulty: 3,
    variants: 20,
    minutes: 3,
  },
  (rng, seed) => {
    const form = seed % 2
    const k = Math.floor(seed / 2)
    if (form === 0) {
      const w = 8 * slice(rng, k, 10, 4, 40)
      const h = 10 * rint(rng, 2, 24)
      const depth = [1, 2, 4, 8, 16, 24][rint(rng, 0, 5)]
      const pixels = w * h
      const bits = pixels * depth
      const bytes = bits / 8
      return {
        title: 'Bytes for an image',
        prompt: `An uncompressed image is **${w} by ${h}** pixels and stores **${depth} ${plural(depth, 'bit', 'bits')} per pixel**. A byte is 8 bits.\n\nHow many bytes does the raw image take?`,
        answer: numeric(bytes),
        hints: [
          'Three steps: count the pixels, multiply by the bits each pixel needs, then turn bits into bytes.',
          `${w} × ${h} = ${pixels} pixels, and ${pixels} × ${depth} = ${bits} bits.`,
          `Worked path: ${bits} ÷ 8 = **${bytes}** bytes.`,
        ],
        explanation: `Pixels: ${w} × ${h} = ${pixels}. Bits: ${pixels} × ${depth} = ${bits}. Bytes: ${bits} ÷ 8 = **${bytes}**. Depth is the part people forget — at ${depth} ${plural(depth, 'bit', 'bits')} per pixel this image can show ${2 ** depth} different ${plural(2 ** depth, 'colour', 'colours')}, and halving the depth halves the file exactly.`,
        commonErrors: {
          slip: `Stopping at ${bits} answers in BITS. The question asks bytes, which is eight times smaller.`,
        },
      }
    }
    const chars = 40 * slice(rng, k, 10, 3, 60)
    const perChar = [8, 16][rint(rng, 0, 1)]
    const bits = chars * perChar
    const bytes = bits / 8
    return {
      title: 'Bytes for text',
      prompt: `A message is **${chars} characters** long and each character is stored in **${perChar} bits**. A byte is 8 bits.\n\nHow many bytes does the message take?`,
      answer: numeric(bytes),
      hints: [
        'Every character costs the same, so this is one multiplication and then a conversion to bytes.',
        `${chars} × ${perChar} = ${bits} bits in total.`,
        `Worked path: ${bits} ÷ 8 = **${bytes}** bytes.`,
      ],
      explanation: `Total bits: ${chars} × ${perChar} = ${bits}. In bytes that is ${bits} ÷ 8 = **${bytes}**. At ${perChar} bits a character the encoding can distinguish ${2 ** perChar} different characters — ${perChar === 8 ? 'enough for one alphabet and its punctuation' : 'enough for most of the world at once, at exactly double the cost'}.`,
    }
  },
)

// ------------------------------------------------------------------ c-bool
// 3B-CS-02 — how a machine implements logic. Everything below is derived by
// enumerating all eight rows of a three-variable truth table, so equivalence
// claims are proved rather than asserted.

type Expr =
  | { k: 'var'; i: number }
  | { k: 'not'; a: Expr }
  | { k: 'and'; a: Expr; b: Expr }
  | { k: 'or'; a: Expr; b: Expr }

const VARS = ['A', 'B', 'C']

function evalExpr(e: Expr, v: boolean[]): boolean {
  switch (e.k) {
    case 'var':
      return v[e.i]
    case 'not':
      return !evalExpr(e.a, v)
    case 'and':
      return evalExpr(e.a, v) && evalExpr(e.b, v)
    case 'or':
      return evalExpr(e.a, v) || evalExpr(e.b, v)
  }
}

function showExpr(e: Expr): string {
  const wrap = (x: Expr) => (x.k === 'var' ? showExpr(x) : `(${showExpr(x)})`)
  switch (e.k) {
    case 'var':
      return VARS[e.i]
    case 'not':
      return e.a.k === 'var' ? `NOT ${VARS[e.a.i]}` : `NOT (${showExpr(e.a)})`
    case 'and':
      return `${wrap(e.a)} AND ${wrap(e.b)}`
    case 'or':
      return `${wrap(e.a)} OR ${wrap(e.b)}`
  }
}

/** The eight rows of a three-variable table, in a fixed published order. */
const ROWS: boolean[][] = Array.from({ length: 8 }, (_, m) => [
  ((m >> 2) & 1) === 1,
  ((m >> 1) & 1) === 1,
  (m & 1) === 1,
])

const rowLabel = (r: boolean[]) => `A = ${r[0] ? 1 : 0}, B = ${r[1] ? 1 : 0}, C = ${r[2] ? 1 : 0}`
const truthRows = (e: Expr) => ROWS.map((r) => evalExpr(e, r))
const sameTable = (x: Expr, y: Expr) => truthRows(x).every((v, i) => v === truthRows(y)[i])

/** Deterministic expression #combo: two operators, a shape, and a negation mask. */
function boolExpr(combo: number): Expr {
  const op1 = combo % 2
  const op2 = Math.floor(combo / 2) % 2
  const shape = Math.floor(combo / 4) % 2
  const negMask = Math.floor(combo / 8) % 8
  const v = (i: number): Expr => (((negMask >> i) & 1) === 1 ? { k: 'not', a: { k: 'var', i } } : { k: 'var', i })
  const mk = (op: number, a: Expr, b: Expr): Expr => (op === 0 ? { k: 'and', a, b } : { k: 'or', a, b })
  return shape === 0 ? mk(op2, mk(op1, v(0), v(1)), v(2)) : mk(op2, v(0), mk(op1, v(1), v(2)))
}

/** The full table as fenced text, so an explanation can SHOW the trace. */
function tableText(e: Expr): string {
  return ROWS.map((r, i) => `${rowLabel(r)}   ->   ${truthRows(e)[i] ? 'TRUE' : 'false'}`).join('\n')
}

const truthCount = tpl(
  {
    id: 'alab-truth-count',
    name: 'Counting true rows',
    skillIds: ['c-bool'],
    bucket: 'coding',
    difficulty: 3,
    variants: 24,
    minutes: 3,
  },
  (_rng, seed) => {
    const e = boolExpr(seed)
    const rows = truthRows(e)
    const trues = rows.filter(Boolean).length
    return {
      title: 'How often is it true?',
      prompt: `Three switches A, B and C are each either on (1) or off (0), so there are eight possible settings.\n${code(
        `r = ${showExpr(e)}`,
      )}\nIn how many of the eight settings is **r** true?`,
      answer: numeric(trues),
      hints: [
        'Do not reason about it in your head — write all eight rows out, 000 through 111, and evaluate each one.',
        'Evaluate the bracketed part first for each row, then apply the outer operator. AND needs both sides, OR needs one.',
        `Worked path: the table comes out true in **${trues}** of the eight ${plural(trues, 'row', 'rows')}.`,
      ],
      explanation: `The complete table:\n${code(tableText(e))}\nThat is **${trues}** true ${plural(trues, 'row', 'rows')} out of 8. Counting rows is how hardware designers compare two circuits: two expressions that look nothing alike are the SAME circuit exactly when their tables match, and the table is the only reliable way to see it.`,
      commonErrors: {
        strategy: 'Trying to see the answer without writing the table is the error itself — eight rows take a minute and never lie.',
      },
    }
  },
)

/** Combos whose table has at least one true row and at least three false ones. */
const ROW_CASES: number[] = (() => {
  const out: number[] = []
  for (let combo = 0; combo < 64 && out.length < 18; combo++) {
    const t = truthRows(boolExpr(combo)).filter(Boolean).length
    if (t >= 1 && t <= 5) out.push(combo)
  }
  return out
})()

const truthRow = tpl(
  {
    id: 'alab-truth-row',
    name: 'Find the row that fires',
    skillIds: ['c-bool'],
    bucket: 'coding',
    difficulty: 3,
    variants: ROW_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const e = boolExpr(cycle(seed, ROW_CASES))
    const rows = truthRows(e)
    const trueRows = ROWS.filter((_, i) => rows[i])
    const falseRows = ROWS.filter((_, i) => !rows[i])
    const correct = trueRows[rint(rng, 0, trueRows.length - 1)]
    const wrong = shuffle(rng, falseRows).slice(0, 3)
    return {
      title: 'Which setting turns it on?',
      prompt: `A circuit switches on exactly when **r** is true. 1 means on, 0 means off.\n${code(
        `r = ${showExpr(e)}`,
      )}\nWhich of these settings switches it on?`,
      answer: mcq(
        rng,
        rowLabel(correct),
        wrong.map(rowLabel),
      ),
      hints: [
        'Test the options one at a time rather than solving the expression in general — four substitutions is the whole job.',
        'Substitute the three values, evaluate the bracket first, then the outer operator.',
        `Worked path: **${rowLabel(correct)}** makes it true; the other three settings all come out false.`,
      ],
      explanation: `Substituting **${rowLabel(correct)}** into ${showExpr(e)} gives true. The full table:\n${code(
        tableText(e),
      )}\nThis expression fires on ${trueRows.length} of the 8 settings, so a lucky guess is worth less than it looks. Substituting into an expression is faster than simplifying it, and it cannot go wrong.`,
    }
  },
)

/**
 * De Morgan bases, ENUMERATED rather than derived from an index.
 *
 * The first version of this packed the operator and the negation mask into one
 * counter and read them back with `% 2` and `/ 2 % 4`, which is not injective:
 * cases 8-11 rendered exactly the same four expressions as cases 0-3, so the
 * template declared 12 variants and produced 8. Listing the axes makes the
 * count something the compiler can see rather than something an author has to
 * keep true in their head.
 */
const DEMORGAN_CASES: { isAnd: boolean; negAt: number; i: number; j: number }[] = (() => {
  const out: { isAnd: boolean; negAt: number; i: number; j: number }[] = []
  for (const [i, j] of [
    [0, 1],
    [1, 2],
    [0, 2],
  ]) {
    for (const isAnd of [true, false]) {
      // negAt: 0 = neither side already negated, 1 = the left, 2 = the right.
      for (const negAt of [0, 1, 2]) out.push({ isAnd, negAt, i, j })
    }
  }
  return out
})()

const deMorgan = tpl(
  {
    id: 'alab-demorgan',
    name: 'Pushing NOT inside',
    skillIds: ['c-bool'],
    bucket: 'coding',
    difficulty: 4,
    variants: DEMORGAN_CASES.length,
    minutes: 3.5,
  },
  (rng, seed) => {
    const { isAnd, negAt, i, j } = cycle(seed, DEMORGAN_CASES)
    const leaf = (v: number, negated: boolean): Expr =>
      negated ? { k: 'not', a: { k: 'var', i: v } } : { k: 'var', i: v }
    const x = leaf(i, negAt === 1)
    const y = leaf(j, negAt === 2)
    const inner: Expr = isAnd ? { k: 'and', a: x, b: y } : { k: 'or', a: x, b: y }
    const base: Expr = { k: 'not', a: inner }
    const nx: Expr = { k: 'not', a: x }
    const ny: Expr = { k: 'not', a: y }
    const mk = (and: boolean, a: Expr, b: Expr): Expr => (and ? { k: 'and', a, b } : { k: 'or', a, b })
    // The De Morgan transform: negate both sides AND flip the operator.
    const key = mk(!isAnd, nx, ny)
    // Every candidate below is checked against the base's own truth table. The
    // last one is the whole rule applied WITH the outer NOT left in place — a
    // real double-negation slip, and always longer than the key, so the answer
    // can never be found by picking the longest option.
    const candidates: Expr[] = [
      mk(isAnd, nx, ny),
      { k: 'not', a: mk(!isAnd, nx, ny) },
      mk(!isAnd, nx, y),
      mk(!isAnd, x, ny),
      mk(isAnd, x, y),
    ]
    const wrong = candidates.filter((c) => !sameTable(c, base)).map(showExpr)
    return {
      title: 'The same circuit, written differently',
      prompt: `Two expressions are the same circuit when they give the same answer for every setting of ${VARS[i]} and ${VARS[j]}.\n${code(
        `r = ${showExpr(base)}`,
      )}\nWhich of these is the same circuit as **r**?`,
      answer: mcq(rng, showExpr(key), wrong),
      hints: [
        'Build the four-row table for the original, then test each option against it. One mismatched row is enough to rule an option out.',
        `When a NOT moves inside a bracket, TWO things change, not one: each side gets its own NOT, and ${
          isAnd ? 'AND becomes OR' : 'OR becomes AND'
        }.`,
        `Worked path: **${showExpr(key)}** matches the original on all four rows.`,
      ],
      explanation: `Moving the NOT inside changes the operator as well as the sides: **${showExpr(
        key,
      )}**. Check it — "not (both)" is true whenever at least one side fails, which is an OR of the two failures; "not (either)" is true only when both fail, which is an AND. Two wrong answers are the two halves of the rule done alone: keeping ${
        isAnd ? 'AND' : 'OR'
      } while negating the parts, and pushing the NOT in while ALSO leaving it outside, which flips the whole answer over. Hardware uses this rule constantly, because a chip built from one kind of gate has to rewrite every other kind into it.`,
      commonErrors: {
        concept: 'Negating each side but leaving the operator alone is the classic half-move; it produces a genuinely different circuit.',
      },
    }
  },
)

const shortCircuit = tpl(
  {
    id: 'alab-short-circuit',
    name: 'Short-circuit evaluation',
    skillIds: ['c-bool'],
    bucket: 'coding',
    difficulty: 3,
    variants: 16,
    minutes: 3,
  },
  (rng, seed) => {
    const limit = 4 + (seed % 4)
    const a = slice(rng, Math.floor(seed / 4), 4, 1, 9)
    const b = rint(rng, 1, 9)
    const c = rint(rng, 1, 9)
    const d = rint(rng, 1, 9)
    // Simulate the evaluator once, recording every call that actually happens.
    // JavaScript short-circuits exactly as the displayed pseudocode does, so
    // running the condition IS the trace — nothing here is reasoned out.
    const order: string[] = []
    let calls = 0
    const check = (v: number, name: string) => {
      calls++
      const r = v > limit
      order.push(`check(${name}) is ${r}`)
      return r
    }
    const left = check(a, 'a') && check(b, 'b')
    const result = left || (check(c, 'c') && check(d, 'd'))
    return {
      title: 'Which checks actually run?',
      prompt: `AND stops the moment it meets a false, and OR stops the moment it meets a true — the rest of the line is never looked at.\n${code(
        `function check(x):\n    calls = calls + 1\n    return x > ${limit}\n\na = ${a}\nb = ${b}\nc = ${c}\nd = ${d}\nif (check(a) AND check(b)) OR (check(c) AND check(d)):\n    print "yes"`,
      )}\nHow many times does **check** run?`,
      answer: numeric(calls),
      hints: [
        'Work strictly left to right and stop the instant an operator has enough information to decide.',
        `check(a) is ${a > limit}. ${a > limit ? 'So the AND has to look at b as well.' : 'A false inside an AND settles that whole bracket, so b is never looked at.'}`,
        `Worked path: the calls that actually happen are ${order.join('; ')} — that is **${calls}**.`,
      ],
      explanation: `Trace: ${order.join('; ')}. The left bracket ${
        left ? 'came out true, so the OR already knows the answer and the right bracket is never evaluated' : 'came out false, so the OR has to try the right bracket'
      }. Total calls: **${calls}**, and the whole condition is ${result}. This is not a speed trick — code like "if the list is not empty AND list[0] is big" is only SAFE because the right side never runs when the left is false.`,
      commonErrors: {
        concept: 'Counting all four calls assumes both sides of every operator are always evaluated. They are not, and programs depend on that.',
      },
    }
  },
)

// ------------------------------------------------------------------ c-algo
// 3B-AP-10 (classic algorithms) and 3B-AP-09 (game search). Every count below
// comes back from a real run of the algorithm on the displayed data.

interface Probe {
  probes: number[]
  found: boolean
}

/** Textbook binary search, instrumented to report the indexes it looked at. */
function bsearch(arr: number[], target: number): Probe {
  const probes: number[] = []
  let lo = 0
  let hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    probes.push(mid)
    if (arr[mid] === target) return { probes, found: true }
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return { probes, found: false }
}

/** Same search with the midpoint rounded UP — a real alternative implementation. */
function bsearchCeil(arr: number[], target: number): number[] {
  const probes: number[] = []
  let lo = 0
  let hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.ceil((lo + hi) / 2)
    probes.push(mid)
    if (arr[mid] === target) return probes
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return probes
}

/** Same search with the two branches swapped — a real bug, capped so it ends. */
function bsearchFlipped(arr: number[], target: number): number[] {
  const probes: number[] = []
  let lo = 0
  let hi = arr.length - 1
  while (lo <= hi && probes.length < arr.length) {
    const mid = Math.floor((lo + hi) / 2)
    probes.push(mid)
    if (arr[mid] === target) return probes
    if (arr[mid] < target) hi = mid - 1
    else lo = mid + 1
  }
  return probes
}

const BSEARCH_CODE = `lo = 0\nhi = n - 1\nwhile lo <= hi:\n    mid = floor((lo + hi) / 2)     # one comparison per pass\n    if A[mid] == target:\n        return mid\n    if A[mid] < target:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nreturn NOT_FOUND`

const binarySearchTrace = tpl(
  {
    id: 'alab-binary-search',
    name: 'Trace a binary search',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 3,
    variants: 24,
    minutes: 3.5,
  },
  (rng, seed) => {
    const form = seed % 3
    const k = Math.floor(seed / 3)
    // The probe-order form is capped at 9 elements on purpose: every index is
    // then a single digit, so all four option strings are the same length and
    // the key cannot be picked out by size.
    const n = form === 1 ? 7 + (k % 3) : 7 + (k % 8)
    const start = slice(rng, k, 8, 2, 30)
    const step = rint(rng, 2, 7)
    const arr = Array.from({ length: n }, (_, i) => start + i * step)
    const shown = `A = ${arr.join(', ')}       (indexes 0 to ${n - 1})`
    if (form === 2) {
      // Absent target: strictly between two neighbours, so the search must fail.
      const gapAt = rint(rng, 0, n - 2)
      const target = arr[gapAt] + 1
      const run = bsearch(arr, target)
      return {
        title: 'When the value is not there',
        prompt: `${code(BSEARCH_CODE)}\n${code(shown)}\nThe search runs with **target = ${target}**, which is not in the array. How many comparisons happen before it reports NOT_FOUND?`,
        answer: numeric(run.probes.length),
        hints: [
          'Keep a note of lo and hi after every pass. The loop ends when lo passes hi.',
          `First pass: lo = 0, hi = ${n - 1}, so mid = ${run.probes[0]} and A[${run.probes[0]}] = ${arr[run.probes[0]]}.`,
          `Worked path: it looks at indexes ${run.probes.join(', ')} — **${run.probes.length}** comparisons, then lo passes hi.`,
        ],
        explanation: `The probes are indexes ${run.probes.join(' → ')} (values ${run.probes
          .map((p) => arr[p])
          .join(', ')}), so **${run.probes.length}** comparisons happen before the range empties. A failed search costs the SAME as a successful one in the worst case — the range still has to shrink to nothing, and that takes about log2(${n}) halvings either way.`,
      }
    }
    const at = rint(rng, 0, n - 1)
    const target = arr[at]
    const run = bsearch(arr, target)
    if (form === 0) {
      return {
        title: 'Count the comparisons',
        prompt: `${code(BSEARCH_CODE)}\n${code(shown)}\nThe search runs with **target = ${target}**. How many comparisons does it make before it returns?`,
        answer: numeric(run.probes.length),
        hints: [
          'Track lo and hi on paper. Each pass looks at one element and then throws away half of what is left.',
          `First pass: lo = 0, hi = ${n - 1}, mid = ${run.probes[0]}, and A[${run.probes[0]}] = ${arr[run.probes[0]]} against target ${target}.`,
          `Worked path: indexes ${run.probes.join(', ')} — **${run.probes.length}** ${plural(run.probes.length, 'comparison', 'comparisons')}.`,
        ],
        explanation: `The search looks at indexes ${run.probes.join(' → ')}, holding values ${run.probes
          .map((p) => arr[p])
          .join(', ')}, so it takes **${run.probes.length}** ${plural(run.probes.length, 'comparison', 'comparisons')}. Where the target SITS matters: the middle element is found in one, and the worst position in this array of ${n} still takes only ${bitsFor(n + 1)}. A scan from the left would take ${at + 1} here.`,
        commonErrors: {
          slip: 'Counting the halvings rather than the looks gives one too few — the final pass that finds the value is a comparison too.',
        },
      }
    }
    // Probe-order MCQ. Every distractor is another algorithm actually run, and
    // the nudge keeps the option strings the same length so nothing leaks.
    const nudge = (p: number[]) => {
      const out = [...p]
      const at2 = Math.floor(out.length / 2)
      out[at2] = out[at2] > 0 ? out[at2] - 1 : out[at2] + 1
      return out
    }
    const show = (p: number[]) => p.join(' → ')
    const alts = [bsearchCeil(arr, target), bsearchFlipped(arr, target), nudge(run.probes)]
      .filter((p) => p.length === run.probes.length && show(p) !== show(run.probes))
      .map(show)
    const noted = mcqNoted(rng, show(run.probes), [
      [alts[0] ?? show(nudge(run.probes)), 'Rounded the middle up — a real variant of the algorithm, but not this one', 'slip'],
      [alts[1] ?? show(nudge(nudge(run.probes))), 'Went the wrong way after the comparison — the classic direction bug', 'concept'],
      [alts[2] ?? show([...run.probes].reverse()), 'Right shape, wrong midpoint arithmetic on one pass', 'slip'],
    ])
    return {
      title: 'Which indexes get looked at?',
      prompt: `${code(BSEARCH_CODE)}\n${code(shown)}\nThe search runs with **target = ${target}**. Which indexes does it look at, in order?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Compute the first midpoint from lo = 0 and hi = n − 1, then update whichever end the comparison rules out.',
        `First: mid = floor((0 + ${n - 1}) / 2) = ${run.probes[0]}, and A[${run.probes[0]}] = ${arr[run.probes[0]]} against ${target}.`,
        `Worked path: **${show(run.probes)}**.`,
      ],
      explanation: `Running it: ${run.probes
        .map((p) => `index ${p} holds ${arr[p]}`)
        .join(', then ')} — the order is **${show(run.probes)}**. Every wrong option is another algorithm actually executed on this array: rounding the midpoint up gives a different but still valid search, and swapping the two branches sends the search away from the target instead of towards it.`,
    }
  },
)

/** Merge two sorted lists, counting the element-to-element comparisons. */
function mergeCompares(left: number[], right: number[]): { merged: number[]; compares: number } {
  const merged: number[] = []
  let i = 0
  let j = 0
  let compares = 0
  while (i < left.length && j < right.length) {
    compares++
    if (left[i] <= right[j]) merged.push(left[i++])
    else merged.push(right[j++])
  }
  while (i < left.length) merged.push(left[i++])
  while (j < right.length) merged.push(right[j++])
  return { merged, compares }
}

/** A real merge sort, reporting both totals. */
function mergeSort(list: number[]): { sorted: number[]; compares: number; merges: number } {
  if (list.length <= 1) return { sorted: list, compares: 0, merges: 0 }
  const mid = Math.floor(list.length / 2)
  const l = mergeSort(list.slice(0, mid))
  const r = mergeSort(list.slice(mid))
  const m = mergeCompares(l.sorted, r.sorted)
  return { sorted: m.merged, compares: l.compares + r.compares + m.compares, merges: l.merges + r.merges + 1 }
}

const mergeSortSteps = tpl(
  {
    id: 'alab-merge-sort',
    name: 'Merge sort by hand',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 4,
    variants: 15,
    minutes: 4,
  },
  (rng, seed) => {
    const form = seed % 3
    const k = Math.floor(seed / 3)
    const MERGE_CODE = `merge(L, R):\n    while L and R both still have items:\n        compare their front items          # one comparison\n        move the smaller one to the output\n    move whatever is left over to the output`
    if (form === 0) {
      const len = 4 + (k % 3)
      const left: number[] = []
      const right: number[] = []
      let a = slice(rng, k, 5, 1, 12)
      let b = a + rint(rng, 1, 4)
      for (let i = 0; i < len; i++) {
        left.push(a)
        right.push(b)
        a += rint(rng, 2, 9)
        b += rint(rng, 2, 9)
      }
      const run = mergeCompares(left, right)
      return {
        title: 'Comparisons in one merge',
        prompt: `${code(MERGE_CODE)}\nTwo already-sorted lists are merged:\n${code(
          `L = ${left.join(', ')}\nR = ${right.join(', ')}`,
        )}\nHow many comparisons does the merge make?`,
        answer: numeric(run.compares),
        hints: [
          'Only the two FRONT items are ever compared. The winner is removed and the loser stays at the front.',
          'The comparing stops the moment one list runs out — the rest is copied across with no comparisons at all.',
          `Worked path: the merged result is ${run.merged.join(', ')}, reached in **${run.compares}** comparisons.`,
        ],
        explanation: `Merging gives ${run.merged.join(
          ', ',
        )} and costs **${run.compares}** comparisons. The count is not simply ${left.length} + ${right.length} = ${
          left.length + right.length
        }: once one list empties, the tail of the other is copied with no comparison at all, so merging costs at most (length − 1) and often less. That is why merge sort beats comparing every pair.`,
        commonErrors: {
          slip: `Answering ${left.length + right.length} counts the items moved rather than the comparisons made.`,
        },
      }
    }
    if (form === 1) {
      const list = Array.from({ length: 6 }, () => rint(rng, 10, 99))
      // Guarantee this variant's list differs from the others.
      list[0] = slice(rng, k, 5, 10, 99)
      const run = mergeSort(list)
      return {
        title: 'A whole sort, counted',
        prompt: `Merge sort splits the list in half, sorts each half the same way, then merges the two sorted halves. A merge compares the two front items and moves the smaller.\n${code(
          `list = ${list.join(', ')}`,
        )}\nHow many comparisons does the whole sort make?`,
        answer: numeric(run.compares),
        hints: [
          'Draw the split tree first: 6 splits into 3 and 3, each 3 splits into 1 and 2, each 2 splits into 1 and 1.',
          'Then count upwards. Merging two single items costs 1 comparison; merging a 1 with a 2 costs 1 or 2 depending on the values.',
          `Worked path: the sorted list is ${run.sorted.join(', ')}, and the merges cost **${run.compares}** comparisons in total.`,
        ],
        explanation: `Running the sort gives ${run.sorted.join(', ')} at a cost of **${run.compares}** comparisons across ${run.merges} ${plural(
          run.merges,
          'merge',
          'merges',
        )}. The exact number depends on the DATA — a merge stops comparing as soon as one side empties — which is why the honest way to answer is to run it rather than to use a formula. Comparing every pair of 6 items would cost 15.`,
      }
    }
    const n = 6 + k * 2
    const run = mergeSort(Array.from({ length: n }, (_, i) => n - i))
    return {
      title: 'How many merges?',
      prompt: `Merge sort splits a list in half over and over until every piece holds one item, then merges the pieces back together in pairs.\n\nFor a list of **${n} items**, how many merge operations happen in total?`,
      answer: numeric(run.merges),
      hints: [
        'Every merge takes two pieces and returns one, so each merge reduces the number of pieces by exactly one.',
        `Splitting all the way down gives ${n} single-item pieces, and the sort finishes with 1 piece.`,
        `Worked path: going from ${n} pieces to 1 piece needs **${run.merges}** merges.`,
      ],
      explanation: `Each merge turns two pieces into one, so the piece count falls by one every time: from ${n} singles down to 1 finished list is **${run.merges}** merges, whatever order they happen in. The number of LEVELS is different — that is about ${bitsFor(
        n,
      )}, since the list halves each level — and mixing up "how many merges" with "how many levels" is the usual slip.`,
      commonErrors: {
        concept: `Answering ${bitsFor(n)} counts the LEVELS of splitting, not the merges. Levels grow like log n; merges grow like n.`,
      },
    }
  },
)

interface Graph {
  nodes: string[]
  adj: Record<string, string[]>
}

function bfsOrder(g: Graph, start: string): string[] {
  const seen = new Set([start])
  const order: string[] = []
  const queue = [start]
  while (queue.length) {
    const cur = queue.shift() as string
    order.push(cur)
    for (const nb of g.adj[cur]) {
      if (!seen.has(nb)) {
        seen.add(nb)
        queue.push(nb)
      }
    }
  }
  return order
}

function dfsOrder(g: Graph, start: string, reverse = false): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  const walk = (u: string) => {
    if (seen.has(u)) return
    seen.add(u)
    order.push(u)
    const nbs = reverse ? [...g.adj[u]].reverse() : g.adj[u]
    for (const nb of nbs) walk(nb)
  }
  walk(start)
  return order
}

/** BFS with the queue mistakenly used as a stack — a common real bug. */
function stackBfs(g: Graph, start: string): string[] {
  const seen = new Set([start])
  const order: string[] = []
  const stack = [start]
  while (stack.length) {
    const cur = stack.pop() as string
    order.push(cur)
    for (const nb of g.adj[cur]) {
      if (!seen.has(nb)) {
        seen.add(nb)
        stack.push(nb)
      }
    }
  }
  return order
}

function makeGraph(rng: Rng, n: number): Graph {
  const nodes = 'ABCDEFG'.slice(0, n).split('')
  const edges: [string, string][] = []
  for (let i = 1; i < n; i++) edges.push([nodes[rint(rng, 0, i - 1)], nodes[i]])
  for (let extra = 0; extra < 2; extra++) {
    const u = rint(rng, 0, n - 1)
    const v = rint(rng, 0, n - 1)
    if (u !== v && !edges.some(([p, q]) => (p === nodes[u] && q === nodes[v]) || (p === nodes[v] && q === nodes[u]))) {
      edges.push([nodes[u], nodes[v]])
    }
  }
  const adj: Record<string, string[]> = {}
  for (const x of nodes) adj[x] = []
  for (const [u, v] of edges) {
    adj[u].push(v)
    adj[v].push(u)
  }
  for (const x of nodes) adj[x].sort()
  return { nodes, adj }
}

const traversal = tpl(
  {
    id: 'alab-graph-traversal',
    name: 'Breadth-first or depth-first',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 3,
    variants: 16,
    minutes: 3.5,
  },
  (rng, seed) => {
    const wantBfs = seed % 2 === 0
    let g = makeGraph(rng, 6 + (seed % 2))
    let bfs = bfsOrder(g, 'A')
    let dfs = dfsOrder(g, 'A')
    let tries = 0
    // Reject graphs where the two traversals agree: the item would have no
    // distractor worth offering, and nothing would be tested.
    while (bfs.join('') === dfs.join('') && tries++ < 40) {
      g = makeGraph(rng, 6 + (seed % 2))
      bfs = bfsOrder(g, 'A')
      dfs = dfsOrder(g, 'A')
    }
    const show = (o: string[]) => o.join(' → ')
    const correct = wantBfs ? bfs : dfs
    const others = [
      wantBfs ? dfs : bfs,
      dfsOrder(g, 'A', true),
      stackBfs(g, 'A'),
      [...g.nodes],
    ]
      .map(show)
      .filter((o) => o !== show(correct))
    const adjText = g.nodes.map((x) => `${x}: ${g.adj[x].join(', ')}`).join('\n')
    return {
      title: wantBfs ? 'Breadth first' : 'Depth first',
      prompt: `A graph, with each node's neighbours listed in the order the algorithm will try them:\n${code(
        adjText,
      )}\n${
        wantBfs
          ? '**Breadth-first search** starts at A, visits every neighbour of A, then every neighbour of those, and so on. It uses a QUEUE: nodes come out in the order they went in.'
          : '**Depth-first search** starts at A and follows the first unvisited neighbour as far as it can go, backing up only when it is stuck. It uses a STACK.'
      }\n\nStarting at A, in what order are the nodes first visited?`,
      answer: mcq(rng, show(correct), others),
      hints: [
        wantBfs
          ? 'Write the queue down as you go. Add a node when you first see it, never twice.'
          : 'Follow one path all the way to a dead end before you consider anything else, and mark nodes as you arrive.',
        `A's neighbours are ${g.adj['A'].join(' and ')}, so the second node visited is ${correct[1]}.`,
        `Worked path: **${show(correct)}**.`,
      ],
      explanation: `${wantBfs ? 'Breadth' : 'Depth'}-first from A gives **${show(
        correct,
      )}**. The tempting wrong answer is the OTHER traversal on the same graph — ${show(
        wantBfs ? dfs : bfs,
      )} — and the only difference between them is the container: a queue hands back the oldest waiting node (staying close to the start), a stack hands back the newest (running away from it). Breadth-first therefore finds the fewest-hops route; depth-first does not.`,
      commonErrors: {
        concept: 'Reading the neighbour lists top to bottom produces alphabetical order, which is neither traversal — it ignores where you currently are.',
      },
    }
  },
)

interface WGraph {
  edges: { from: string; to: string; w: number }[]
}

/** Every route from `from` to `to` in a small forward-only graph. */
function allRoutes(g: WGraph, from: string, to: string): { path: string[]; cost: number }[] {
  const out: { path: string[]; cost: number }[] = []
  const walk = (node: string, path: string[], cost: number) => {
    if (node === to) {
      out.push({ path: [...path], cost })
      return
    }
    for (const e of g.edges) {
      if (e.from === node && !path.includes(e.to)) walk(e.to, [...path, e.to], cost + e.w)
    }
  }
  walk(from, [from], 0)
  return out
}

/** Nearest-neighbour walk: always take the cheapest edge out of the current node. */
function greedyRoute(g: WGraph, from: string, to: string): number | null {
  let node = from
  let cost = 0
  const seen = new Set([from])
  for (let step = 0; step < 8; step++) {
    if (node === to) return cost
    const outs = g.edges.filter((e) => e.from === node && !seen.has(e.to)).sort((a, b) => a.w - b.w)
    if (!outs.length) return null
    cost += outs[0].w
    node = outs[0].to
    seen.add(node)
  }
  return null
}

const dijkstra = tpl(
  {
    id: 'alab-shortest-path',
    name: 'Cheapest route',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 4,
    variants: 16,
    minutes: 4,
  },
  (rng, seed) => {
    const layout: [string, string][] = [
      ['S', 'A'],
      ['S', 'B'],
      ['S', 'C'],
      ['A', 'C'],
      ['A', 'D'],
      ['B', 'C'],
      ['B', 'D'],
      ['C', 'T'],
      ['D', 'T'],
    ]
    let g: WGraph = { edges: [] }
    let routes: { path: string[]; cost: number }[] = []
    let best = { path: [] as string[], cost: 0 }
    let tries = 0
    // Resample until the instance is not degenerate: exactly one cheapest
    // route, and neither "fewest hops" nor "cheapest first step" finds it.
    for (;;) {
      const bias = tries === 0 ? slice(rng, seed % 8, 8, 1, 9) : rint(rng, 1, 9)
      g = { edges: layout.map(([from, to], i) => ({ from, to, w: i === 0 ? bias : rint(rng, 1, 9) })) }
      routes = allRoutes(g, 'S', 'T')
      const min = Math.min(...routes.map((r) => r.cost))
      const winners = routes.filter((r) => r.cost === min)
      best = winners[0]
      const shortHop = routes.filter((r) => r.path.length === 3)
      const greedy = greedyRoute(g, 'S', 'T')
      const hopTrap = shortHop.length > 0 && shortHop.every((r) => r.cost > min)
      if (winners.length === 1 && hopTrap && greedy !== null && greedy !== min) break
      if (++tries > 200) break
    }
    const edgeText = g.edges.map((e) => `${e.from} -> ${e.to}    cost ${e.w}`).join('\n')
    const twoHop = routes.filter((r) => r.path.length === 3).sort((a, b) => a.cost - b.cost)[0]
    return {
      title: 'The cheapest route is not the shortest',
      prompt: `A one-way road network. Every arrow can only be travelled in the direction shown.\n${code(
        edgeText,
      )}\nWhat is the total cost of the **cheapest** route from S to T?`,
      answer: numeric(best.cost),
      hints: [
        'There are only a handful of complete routes. List them all and add each one up rather than guessing from the picture.',
        `Do not stop at the fewest-arrows route: ${twoHop ? `${twoHop.path.join(' → ')} costs ${twoHop.cost}` : 'the direct-looking route is not always cheapest'}.`,
        `Worked path: **${best.path.join(' → ')}** totals ${best.path
          .slice(1)
          .map((to, i) => String(g.edges.find((e) => e.from === best.path[i] && e.to === to)?.w ?? 0))
          .join(' + ')} = **${best.cost}**.`,
      ],
      explanation: `Every route, added up: ${routes
        .sort((a, b) => a.cost - b.cost)
        .map((r) => `${r.path.join('→')} = ${r.cost}`)
        .join(', ')}. The cheapest is **${best.path.join(' → ')}** at **${best.cost}**. Two traps are live here: the route with the FEWEST arrows${
        twoHop ? ` (${twoHop.path.join('→')}, cost ${twoHop.cost})` : ''
      } is not the cheapest, and taking the cheapest first arrow leads somewhere worse. That is exactly why a real shortest-path algorithm settles the nearest node completely before moving on, instead of committing to a direction early.`,
      commonErrors: {
        strategy: 'Picking the cheapest edge at each step is a greedy walk, and greedy walks can be beaten whenever a slightly worse first move opens a much cheaper second one.',
      },
    }
  },
)

const minimax = tpl(
  {
    id: 'alab-minimax',
    name: 'Look-ahead in a game',
    skillIds: ['c-algo'],
    bucket: 'coding',
    difficulty: 4,
    variants: 18,
    minutes: 4,
  },
  (rng, seed) => {
    const form = seed % 3
    const k = Math.floor(seed / 3)
    if (form === 2) {
      // Three plies: you move, they reply, you move again.
      const tree = Array.from({ length: 2 }, (_, mi) =>
        Array.from({ length: 2 }, () => [
          mi === 0 ? slice(rng, k, 6, 1, 18) : rint(rng, 1, 20),
          rint(rng, 1, 20),
        ]),
      )
      const replyValues = tree.map((move) => move.map((reply) => Math.max(...reply)))
      const moveValues = replyValues.map((rs) => Math.min(...rs))
      const rootValue = Math.max(...moveValues)
      const text3 = tree
        .map(
          (move, mi) =>
            `Your move ${mi + 1}:\n` +
            move
              .map((reply, ri) => `    their reply ${String.fromCharCode(97 + ri)} -> you then pick from: ${reply.join(', ')}`)
              .join('\n'),
        )
        .join('\n')
      return {
        title: 'Three moves deep',
        prompt: `You want the score as HIGH as possible; your opponent wants it as LOW as possible. Both play perfectly. You move, they reply, then you move once more and the game ends on the number you pick.\n${code(
          text3,
        )}\nWhat score does the game end on?`,
        answer: numeric(rootValue),
        hints: [
          'Start at the bottom, where the numbers are, and work upwards one layer at a time.',
          'Bottom layer is your choice, so take the largest of each pair. The layer above is theirs, so take the smallest of those results.',
          `Worked path: your final picks give ${replyValues
            .map((rs) => rs.join(' and '))
            .join('; ')}; their replies force ${moveValues.join(' and ')}; you choose **${rootValue}**.`,
        ],
        explanation: `Bottom up. Your last choice takes the bigger number in each pair: ${replyValues
          .map((rs, i) => `move ${i + 1} → ${rs.join(', ')}`)
          .join('; ')}. Your opponent then picks the reply that leaves you worst off, so each of your moves is really worth ${moveValues.join(
          ' and ',
        )}. You take the best of those: **${rootValue}**. The order matters — evaluating top-down gives the wrong answer, because a move is only worth what survives the opponent's best reply.`,
      }
    }
    const anchor = slice(rng, k, 6, 1, 15)
    let tree: number[][] = []
    let moveValues: number[] = []
    let rootValue = 0
    for (let attempt = 0; attempt < 60; attempt++) {
      tree = [
        [anchor, rint(rng, 1, 20), rint(rng, 1, 20)],
        [rint(rng, 1, 20), rint(rng, 1, 20), rint(rng, 1, 20)],
        [rint(rng, 1, 20), rint(rng, 1, 20), rint(rng, 1, 20)],
      ]
      moveValues = tree.map((leaves) => Math.min(...leaves))
      rootValue = Math.max(...moveValues)
      // "Which move should you play" has TWO right answers when two moves are
      // worth the same, so that instance is rejected rather than graded.
      if (form === 0 || moveValues.filter((v) => v === rootValue).length === 1) break
    }
    const treeText = tree
      .map((leaves, mi) => `Your move ${mi + 1} -> they choose from: ${leaves.join(', ')}`)
      .join('\n')
    if (form === 0) {
      return {
        title: 'What is the position worth?',
        prompt: `You want the score as HIGH as possible; your opponent wants it as LOW as possible, and they will always take the worst number available for you.\n${code(
          treeText,
        )}\nWith best play from both sides, what score does the game end on?`,
        answer: numeric(rootValue),
        hints: [
          'Do not look for the biggest number on the board — you do not get to choose it, they do.',
          'For each of your moves, ask what the opponent will leave you: the smallest number under that move.',
          `Worked path: your moves are really worth ${moveValues.join(', ')}, and the best of those is **${rootValue}**.`,
        ],
        explanation: `Each move is worth what SURVIVES the opponent's reply, which is the smallest number under it: ${moveValues.join(
          ', ',
        )}. You pick the best of those, so the game ends on **${rootValue}**. The biggest number anywhere on the board is ${Math.max(
          ...tree.flat(),
        )}, and you can never reach it — the opponent simply refuses. This is what a chess engine is doing when it "looks ahead": it scores your options by the opponent's best answer, not by your best hope.`,
        commonErrors: {
          concept: `Answering ${Math.max(...tree.flat())} assumes both players want the same thing. Search only works when you assume the opponent plays well.`,
        },
      }
    }
    // Best-move form: the loop above guarantees exactly one move attains it.
    const uniqueBest = moveValues.indexOf(rootValue)
    const options = tree.map((_, i) => `Move ${i + 1}`)
    return {
      title: 'Which move should you play?',
      prompt: `You want the score as HIGH as possible; your opponent wants it as LOW as possible, and they will always take the worst number available for you.\n${code(
        treeText,
      )}\nWhich move should you play?`,
      answer: mcq(rng, options[uniqueBest], options.filter((_, i) => i !== uniqueBest)),
      hints: [
        'Score each move by the WORST outcome it allows, since that is the one the opponent will choose.',
        `The three moves are worth ${moveValues.join(', ')} once the opponent has replied.`,
        `Worked path: the best of ${moveValues.join(', ')} is ${rootValue}, which is **${options[uniqueBest]}**.`,
      ],
      explanation: `Score each move by the smallest number under it — that is what the opponent will pick — giving ${moveValues.join(
        ', ',
      )}. **${options[uniqueBest]}** is worth ${rootValue}, the best of the three. Choosing by the biggest number available under a move is the standard error: it picks the move with the nicest dream rather than the best guarantee.`,
    }
  },
)

// ------------------------------------------------------------ c-complexity
// 3B-AP-11 — efficiency, correctness, clarity. Counts come from executing the
// loop nest; growth classes come from measuring the executed counts at four
// input sizes and fitting; the greedy counterexample is checked against an
// exact optimum.

interface Nest {
  render: (a: number, b: number) => string
  run: (a: number, b: number) => number
  note: string
}

const NESTS: Nest[] = [
  {
    render: (a, b) => `steps = 0\nfor i from 1 to ${a}:\n    for j from 1 to ${b}:\n        steps = steps + 1`,
    run: (a, b) => {
      let s = 0
      for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) s++
      return s
    },
    note: 'Two independent loops multiply: the inner one runs from scratch on every pass of the outer one.',
  },
  {
    render: (a) => `steps = 0\nfor i from 1 to ${a}:\n    for j from i to ${a}:\n        steps = steps + 1`,
    run: (a) => {
      let s = 0
      for (let i = 1; i <= a; i++) for (let j = i; j <= a; j++) s++
      return s
    },
    note: 'The inner loop starts at i, so it shrinks as the outer loop advances — this is the "every pair once" shape.',
  },
  {
    render: (a, b) => `steps = 0\nfor i from 1 to ${a}:\n    if i mod ${b} == 0:\n        for j from 1 to ${a}:\n            steps = steps + 1`,
    run: (a, b) => {
      let s = 0
      for (let i = 1; i <= a; i++) if (i % b === 0) for (let j = 1; j <= a; j++) s++
      return s
    },
    note: 'The guard means the inner loop only runs on some passes, so count how many pass the test first.',
  },
  {
    render: (a, b) => `steps = 0\nfor i from 1 to ${a}:\n    for j from 1 to ${b}:\n        for k from 1 to ${b}:\n            steps = steps + 1`,
    run: (a, b) => {
      let s = 0
      for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) for (let k = 1; k <= b; k++) s++
      return s
    },
    note: 'Three nested loops multiply all three bounds together.',
  },
]

const nestedOps = tpl(
  {
    id: 'alab-nested-ops',
    name: 'Count the operations',
    skillIds: ['c-complexity'],
    bucket: 'coding',
    difficulty: 3,
    variants: 24,
    minutes: 3,
  },
  (rng, seed) => {
    const nest = NESTS[seed % NESTS.length]
    const k = Math.floor(seed / NESTS.length)
    const a = slice(rng, k, 6, 6, 20)
    const which = seed % NESTS.length
    const b = which === 2 ? rint(rng, 2, 4) : which === 3 ? rint(rng, 2, 5) : rint(rng, 3, 9)
    const total = nest.run(a, b)
    return {
      title: 'Exactly how much work?',
      prompt: `${code(nest.render(a, b))}\nWhat is the value of **steps** when this finishes?`,
      answer: numeric(total),
      hints: [
        'Count the inner loop for ONE pass of the outer loop first, then work out how many outer passes there are.',
        nest.note,
        `Worked path: **${total}** steps.`,
      ],
      explanation: `Running it gives **${total}** steps. ${nest.note} Exact counts matter more than they look: two pieces of code can share the same growth class and still differ by a factor of ${
        total > 100 ? 'ten' : 'several'
      }, and it is the exact count that decides whether something finishes before the user gives up.`,
      commonErrors: {
        slip: 'Multiplying the two bounds together works only when the inner loop is independent of the outer one. Where the inner bound mentions i, or sits behind a guard, the product is an overestimate.',
      },
    }
  },
)

const crossover = tpl(
  {
    id: 'alab-crossover',
    name: 'Where the faster one changes',
    skillIds: ['c-complexity'],
    bucket: 'coding',
    difficulty: 4,
    variants: 18,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const form = seed % 3
    const k = Math.floor(seed / 3)
    const p = slice(rng, k, 6, 3, 14)
    const q = 10 * rint(rng, 2, 9)
    const stepsA = (n: number) => p * n + q
    const stepsB = (n: number) => (n * (n - 1)) / 2
    // The crossover, found by running the two formulas rather than by algebra.
    let cross = 0
    for (let n = 1; n <= 5000; n++) {
      if (stepsB(n) > stepsA(n)) {
        cross = n
        break
      }
    }
    const spec = `Algorithm A walks the list once and then does a fixed tidy-up:\n    steps = ${p} * n + ${q}\n\nAlgorithm B compares every pair of items exactly once:\n    steps = n * (n - 1) / 2`
    if (form === 0) {
      return {
        title: 'The crossover point',
        prompt: `Two algorithms solve the same problem on a list of **n** items.\n${code(
          spec,
        )}\nWhat is the smallest n at which **B** does MORE steps than A?`,
        answer: numeric(cross),
        hints: [
          'Neither formula wins everywhere. Put a few values of n into both and watch which one is ahead.',
          `At n = ${cross - 1}: A does ${stepsA(cross - 1)} and B does ${stepsB(cross - 1)}. Try one more.`,
          `Worked path: at n = ${cross}, A does ${stepsA(cross)} and B does ${stepsB(cross)}, so B is finally behind — **${cross}**.`,
        ],
        explanation: `At n = ${cross - 1}, B does ${stepsB(cross - 1)} steps against A's ${stepsA(
          cross - 1,
        )} — B is still winning. At n = ${cross}, B does ${stepsB(cross)} against A's ${stepsA(
          cross,
        )}, so B has fallen behind: the answer is **${cross}**. The quadratic algorithm is genuinely FASTER on small inputs, because A pays ${q} steps of setup no matter what. "Which is faster" has no answer without an n attached.`,
        commonErrors: {
          concept: `Assuming the linear one always wins ignores the ${q}-step overhead. Growth class decides the end of the story, not the beginning.`,
        },
      }
    }
    if (form === 1) {
      const n = cross + 5 + k
      const diff = stepsB(n) - stepsA(n)
      return {
        title: 'How far apart at this size?',
        prompt: `Two algorithms solve the same problem on a list of **n** items.\n${code(
          spec,
        )}\nAt **n = ${n}**, how many MORE steps does B do than A?`,
        answer: numeric(diff),
        hints: [
          'Work out each formula separately at this n, then subtract. There is no shortcut worth taking.',
          `A: ${p} × ${n} + ${q} = ${stepsA(n)}. Now do B.`,
          `Worked path: B is ${n} × ${n - 1} ÷ 2 = ${stepsB(n)}, so the gap is ${stepsB(n)} − ${stepsA(n)} = **${diff}**.`,
        ],
        explanation: `A takes ${p} × ${n} + ${q} = ${stepsA(n)} steps; B takes ${n} × ${n - 1} ÷ 2 = ${stepsB(
          n,
        )}. The gap is **${diff}** steps. The two were level back at n = ${cross}, and the gap has been widening ever since — doubling n roughly doubles A's work but roughly quadruples B's, so this distance grows faster the longer you wait.`,
      }
    }
    const n = cross + 4 + k
    let aWins = 0
    for (let i = 1; i <= n; i++) if (stepsA(i) < stepsB(i)) aWins++
    return {
      title: 'How often does A win?',
      prompt: `Two algorithms solve the same problem on a list of **n** items.\n${code(
        spec,
      )}\nFor how many of the sizes n = 1, 2, 3, …, ${n} does **A** do strictly fewer steps than B?`,
      answer: numeric(aWins),
      hints: [
        'Find the size where the winner changes first, then count the sizes on each side of it.',
        `The two cross at n = ${cross}: below that B is ahead, from there on A is ahead.`,
        `Worked path: A wins from n = ${cross} up to n = ${n}, which is **${aWins}** ${plural(aWins, 'size', 'sizes')}.`,
      ],
      explanation: `The winner changes exactly once, at n = ${cross}. Below it B is cheaper (A is still paying its ${q}-step setup); from n = ${cross} to n = ${n} A is cheaper, which is **${aWins}** ${plural(
        aWins,
        'size',
        'sizes',
      )} out of ${n}. Notice how much of the small-n range belongs to the "slow" algorithm — for genuinely small inputs the simple quadratic method is often the right engineering choice.`,
    }
  },
)

interface GrowthShape {
  render: string
  run: (n: number) => number
  why: string
}

const GROWTH_SHAPES: GrowthShape[] = [
  {
    render: `for i from 1 to n:\n    work()`,
    run: (n) => n,
    why: 'One pass over the input.',
  },
  {
    render: `for i from 1 to n:\n    for j from 1 to n:\n        work()`,
    run: (n) => n * n,
    why: 'A full inner pass for every outer pass.',
  },
  {
    render: `i = 1\nwhile i < n:\n    work()\n    i = i * 2`,
    run: (n) => {
      let c = 0
      for (let i = 1; i < n; i *= 2) c++
      return c
    },
    why: 'Doubling reaches n in about log2(n) steps.',
  },
  {
    render: `for i from 1 to n:\n    j = 1\n    while j < n:\n        work()\n        j = j * 2`,
    run: (n) => {
      let c = 0
      for (let i = 1; i <= n; i++) for (let j = 1; j < n; j *= 2) c++
      return c
    },
    why: 'A doubling loop nested inside a full pass.',
  },
  {
    render: `for i from 1 to n:\n    for j from 1 to 12:\n        work()`,
    run: (n) => n * 12,
    why: 'The inner bound is a constant, so it never grows with n.',
  },
  {
    render: `for i from 1 to n:\n    for j from i to n:\n        work()`,
    run: (n) => {
      let c = 0
      for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) c++
      return c
    },
    why: 'Every pair once is still about half of n squared.',
  },
  {
    render: `for i from 1 to 500:\n    work()`,
    run: () => 500,
    why: 'The loop bound has nothing to do with n at all.',
  },
  {
    render: `for i from 1 to n:\n    work()\nfor k from 1 to n:\n    work()`,
    run: (n) => 2 * n,
    why: 'Two loops one after the other ADD, they do not multiply.',
  },
  {
    render: `for i from 1 to n:\n    for j from 1 to n:\n        for k from 1 to n:\n            work()`,
    run: (n) => n * n * n,
    why: 'Three full nested passes.',
  },
  {
    render: `i = n\nwhile i > 1:\n    work()\n    i = floor(i / 3)`,
    run: (n) => {
      let c = 0
      for (let i = n; i > 1; i = Math.floor(i / 3)) c++
      return c
    },
    why: 'Dividing by a constant each pass reaches 1 in a logarithmic number of steps.',
  },
  {
    render: `for i from 1 to n step 2:\n    work()`,
    run: (n) => Math.ceil(n / 2),
    why: 'Skipping every other item halves the count but does not change how it grows.',
  },
  {
    render: `for i from 1 to n * n:\n    work()`,
    run: (n) => n * n,
    why: 'A single loop can still be quadratic if its BOUND is.',
  },
  {
    render: `for i from 1 to n:\n    for j from 1 to n:\n        for k from 1 to 5:\n            work()`,
    run: (n) => n * n * 5,
    why: 'Only two of the three loops depend on n.',
  },
  {
    render: `for i from 1 to 8:\n    for j from 1 to n:\n        work()`,
    run: (n) => 8 * n,
    why: 'The OUTER bound is the constant one here, which is easy to misread.',
  },
  {
    render: `for i from 1 to n:\n    j = 1\n    while j < n:\n        work()\n        j = j * 3`,
    run: (n) => {
      let c = 0
      for (let i = 1; i <= n; i++) for (let j = 1; j < n; j *= 3) c++
      return c
    },
    why: 'Tripling instead of doubling changes the constant, not the class.',
  },
  {
    render: `for i from 1 to n:\n    for j from 1 to i:\n        for k from 1 to j:\n            work()`,
    run: (n) => {
      let c = 0
      for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) for (let k = 1; k <= j; k++) c++
      return c
    },
    why: 'Three nested triangles are still cubic, just with a smaller constant.',
  },
]

const GROWTH_CLASSES: { label: string; g: (n: number) => number }[] = [
  { label: 'O(1)', g: () => 1 },
  { label: 'O(log n)', g: (n) => Math.log2(n) },
  { label: 'O(n)', g: (n) => n },
  { label: 'O(n log n)', g: (n) => n * Math.log2(n) },
  { label: 'O(n²)', g: (n) => n * n },
  { label: 'O(n³)', g: (n) => n * n * n },
]

/**
 * Wrong-answer pool for the growth-class item. It carries one class no shape in
 * this file produces — `O(n² log n)` — purely so that a key of `O(n log n)`,
 * the longest label the classifier can return, still has something longer than
 * itself to sit beside. It is a real class and a plausible misread of a
 * doubling loop inside a nested one, not a filler option.
 */
const GROWTH_DISTRACTORS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(n² log n)']

/**
 * Derive the growth class by EXECUTING the loop nest at four sizes and asking
 * which candidate keeps count/candidate closest to constant. Typing the label
 * in by hand is exactly the failure this file exists to avoid.
 */
function classifyGrowth(run: (n: number) => number): string {
  const ns = [8, 16, 32, 64]
  const counts = ns.map(run)
  let best = GROWTH_CLASSES[0].label
  let bestSpread = Infinity
  for (const cls of GROWTH_CLASSES) {
    const ratios = ns.map((n, i) => counts[i] / cls.g(n))
    const spread = Math.max(...ratios) / Math.min(...ratios)
    if (spread < bestSpread - 1e-9) {
      bestSpread = spread
      best = cls.label
    }
  }
  return best
}

const bigO = tpl(
  {
    id: 'alab-growth-class',
    name: 'How does the work grow?',
    skillIds: ['c-complexity'],
    bucket: 'coding',
    difficulty: 3,
    variants: GROWTH_SHAPES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const shape = cycle(seed, GROWTH_SHAPES)
    const label = classifyGrowth(shape.run)
    const measured = [10, 20, 40].map((n) => `n = ${n} → ${shape.run(n)} calls`).join('\n')
    return {
      title: 'Growth, not speed',
      prompt: `A growth class says how the work GROWS as n grows, ignoring constant factors: O(1) does not grow at all, O(log n) grows very slowly, O(n) grows in step with n, O(n log n) a little faster, O(n²) grows with the square, O(n³) with the cube.\n${code(
        shape.render,
      )}\nHow many times does **work()** run, as a growth class?`,
      answer: balancedMcq(rng, label, GROWTH_DISTRACTORS),
      hints: [
        'Do not read the shape of the code — count the calls at two or three sizes and see what happens when n doubles.',
        'Doubling n: does the count stay the same, go up by a fixed amount, double, a bit more than double, quadruple, or multiply by eight?',
        `Worked path: counting the calls gives\n${code(measured)}\nThat is **${label}**.`,
      ],
      explanation: `Counting the calls directly:\n${code(
        measured,
      )}\nThat is **${label}**. ${shape.why} The reliable method is the one used here — count at n, then at 2n, and look at the RATIO — because the shape of the code misleads: a nested loop is not automatically quadratic, and a single loop is not automatically linear.`,
      commonErrors: {
        strategy: 'Counting the levels of indentation is the usual shortcut, and it is wrong whenever a bound is a constant, depends on i, or grows by multiplying.',
      },
    }
  },
)

/** Greedy change-making: always take the largest coin that fits. */
function greedyCoins(coins: number[], amount: number): number {
  let left = amount
  let used = 0
  for (const c of [...coins].sort((a, b) => b - a)) {
    while (left >= c) {
      left -= c
      used++
    }
  }
  return left === 0 ? used : Infinity
}

/** Exact optimum by dynamic programming — the standard the greedy is judged against. */
function optimalCoins(coins: number[], amount: number): number {
  const best = Array(amount + 1).fill(Infinity)
  best[0] = 0
  for (let v = 1; v <= amount; v++) {
    for (const c of coins) if (c <= v && best[v - c] + 1 < best[v]) best[v] = best[v - c] + 1
  }
  return best[amount]
}

/** Coin sets that really do break the greedy method, with the proof precomputed. */
const COIN_CASES: { coins: number[]; bad: number; good: number[] }[] = (() => {
  const sets = [
    [1, 3, 4],
    [1, 4, 5],
    [1, 6, 7],
    [1, 5, 12],
    [1, 7, 10],
    [1, 4, 9],
    [1, 3, 7],
    [1, 8, 9],
    [1, 5, 11],
    [1, 6, 10],
    [1, 9, 13],
    [1, 4, 11],
    [1, 7, 15],
    [1, 5, 13],
  ]
  const out: { coins: number[]; bad: number; good: number[] }[] = []
  for (const coins of sets) {
    const bad: number[] = []
    const good: number[] = []
    for (let amount = 10; amount <= 39; amount++) {
      const g = greedyCoins(coins, amount)
      const o = optimalCoins(coins, amount)
      if (g > o) bad.push(amount)
      else good.push(amount)
    }
    if (bad.length >= 1 && good.length >= 3) out.push({ coins, bad: bad[0], good })
  }
  return out
})()

const greedyFails = tpl(
  {
    id: 'alab-greedy-fails',
    name: 'Break the greedy method',
    skillIds: ['c-complexity'],
    bucket: 'coding',
    difficulty: 4,
    variants: COIN_CASES.length,
    minutes: 3.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const cs = cycle(seed, COIN_CASES)
    const bad = cs.bad
    const others = shuffle(rng, cs.good).slice(0, 3)
    const greedyPath = (amount: number) => {
      let left = amount
      const taken: number[] = []
      for (const c of [...cs.coins].sort((a, b) => b - a)) {
        while (left >= c) {
          left -= c
          taken.push(c)
        }
      }
      return taken
    }
    const path = greedyPath(bad)
    const opt = optimalCoins(cs.coins, bad)
    return {
      title: 'Where the obvious method loses',
      prompt: `A machine pays out change using coins worth **${cs.coins.join(
        ', ',
      )}**, and it always grabs the largest coin that still fits, over and over, until the amount is paid.\n\nFor which of these amounts does that method use MORE coins than necessary?`,
      answer: mcq(
        rng,
        String(bad),
        others.map(String),
      ),
      hints: [
        'Test an option properly: run the largest-coin-first method on it, then try to beat the result by hand.',
        `A good place to look is an amount just above a large coin, where grabbing it strands an awkward remainder.`,
        `Worked path: for ${bad} the method takes ${path.join(' + ')} = ${path.length} coins, but ${opt} coins are enough.`,
      ],
      explanation: `For **${bad}**, largest-first takes ${path.join(' + ')} — that is ${path.length} coins — while ${opt} coins are enough. For the other three amounts the greedy answer happens to be optimal, which is exactly what makes this method so convincing and so unsafe: it is right most of the time. One counterexample settles it, and finding one is the whole method for testing a greedy idea. (With ordinary 1/5/10/25 coins greedy IS always optimal, which is why the habit forms.)`,
      commonErrors: {
        inference: 'Checking a few amounts and finding no problem does not prove a greedy method correct — it only means the counterexample is elsewhere.',
      },
    }
  },
)

// ----------------------------------------------------------------- c-trace
// 3B-AP-13 — the flow of a recursive algorithm, and 3B-AP-18 — recognising a
// security flaw. Every recursion number below comes from an instrumented run.

interface RecRun {
  value: number
  calls: number
  maxDepth: number
  returns: string[]
  labels: string[]
}

function traceFactorial(n: number): RecRun {
  const returns: string[] = []
  const labels: string[] = []
  let calls = 0
  let maxDepth = 0
  const go = (k: number, depth: number): number => {
    calls++
    maxDepth = Math.max(maxDepth, depth)
    labels.push(`f(${k})`)
    const r = k <= 1 ? 1 : k * go(k - 1, depth + 1)
    returns.push(`f(${k})`)
    return r
  }
  return { value: go(n, 1), calls, maxDepth, returns, labels }
}

function traceFib(n: number): RecRun {
  const returns: string[] = []
  const labels: string[] = []
  let calls = 0
  let maxDepth = 0
  const go = (k: number, depth: number): number => {
    calls++
    maxDepth = Math.max(maxDepth, depth)
    labels.push(`f(${k})`)
    const r = k <= 1 ? k : go(k - 1, depth + 1) + go(k - 2, depth + 1)
    returns.push(`f(${k})`)
    return r
  }
  return { value: go(n, 1), calls, maxDepth, returns, labels }
}

function traceHalve(n: number): RecRun {
  const returns: string[] = []
  const labels: string[] = []
  let calls = 0
  let maxDepth = 0
  const go = (k: number, depth: number): number => {
    calls++
    maxDepth = Math.max(maxDepth, depth)
    labels.push(`f(${k})`)
    const r = k === 0 ? 0 : 1 + go(Math.floor(k / 2), depth + 1)
    returns.push(`f(${k})`)
    return r
  }
  return { value: go(n, 1), calls, maxDepth, returns, labels }
}

const REC_FAMILIES = [
  {
    name: 'factorial',
    src: `function f(n):\n    if n <= 1:\n        return 1\n    return n * f(n - 1)`,
    trace: traceFactorial,
    arg: (k: number) => 4 + k,
    what: 'multiplies every whole number from n down to 1',
  },
  {
    name: 'pair sum',
    src: `function f(n):\n    if n <= 1:\n        return n\n    return f(n - 1) + f(n - 2)`,
    trace: traceFib,
    arg: (k: number) => 4 + k,
    what: 'adds the two results below it, which means it calls itself TWICE on every pass',
  },
  {
    name: 'halving',
    src: `function f(n):\n    if n == 0:\n        return 0\n    return 1 + f(floor(n / 2))`,
    trace: traceHalve,
    arg: (k: number) => [9, 17, 33, 40, 65, 100][k],
    what: 'halves n until nothing is left, counting the halvings',
  },
]

const recursionTrace = tpl(
  {
    id: 'alab-recursion-trace',
    name: 'Trace a recursion',
    skillIds: ['c-trace'],
    bucket: 'coding',
    difficulty: 4,
    variants: 18,
    minutes: 5,
    kind: 'multi',
  },
  (rng, seed) => {
    const fam = REC_FAMILIES[seed % 3]
    const k = Math.floor(seed / 3)
    const n = fam.arg(k)
    const run = fam.trace(n)
    const distinct = [...new Set(run.labels)]
    const secondBack = run.returns[1]
    const wrongLabels = distinct.filter((l) => l !== secondBack).slice(0, 3)
    const parts: ItemPart[] = [
      {
        stage: 'Value',
        prompt: `What does **f(${n})** return?`,
        answer: numeric(run.value),
        hints: [
          'Work from the base case upwards: find the smallest call, then build back up.',
          `The chain of calls starts f(${n}) → ${run.labels[1] ?? 'the base case'} → …`,
        ],
        explanation: `f(${n}) returns **${run.value}**. The function ${fam.what}, and the return value only exists once the innermost call has finished — every level above it is waiting.`,
      },
      {
        stage: 'Calls',
        prompt: `How many times is **f** called in total, counting the first call?`,
        answer: numeric(run.calls),
        hints: [
          'Count calls, not levels. A call that immediately hits the base case still counts.',
          seed % 3 === 1
            ? 'Each call makes TWO more (except the base cases), so the count grows much faster than n.'
            : 'Each call makes exactly one more, so the calls form a single chain.',
        ],
        explanation: `There are **${run.calls}** calls in total. ${
          seed % 3 === 1
            ? 'Because each call makes two more, the count roughly doubles for every step up in n — this is the shape that makes plain recursion unusable on large inputs.'
            : 'Each call makes one more, so the calls form a single chain and the count is easy to predict.'
        }`,
      },
      {
        stage: 'Stack',
        prompt: `At the deepest moment, how many calls to **f** are unfinished at the same time?`,
        answer: numeric(run.maxDepth),
        hints: [
          'A call stays unfinished until everything it called has returned, so the depth is the length of the longest chain.',
          'Sideways calls do not add depth — only calls that are inside one another do.',
        ],
        explanation: `The deepest point has **${run.maxDepth}** unfinished calls stacked up. Depth is what actually runs out of memory: total calls can be huge while the stack stays shallow, and it is the DEPTH that decides whether the program crashes.`,
      },
      {
        stage: 'Order',
        prompt: `Which call is the **second** to return a value?`,
        answer: mcq(rng, secondBack, wrongLabels),
        hints: [
          'Nothing returns until the very first base case is reached, so start there.',
          `The first return of all is ${run.returns[0]}. What finishes immediately after it?`,
        ],
        explanation: `The returns happen in the order ${run.returns.slice(0, 5).join(', ')}${
          run.returns.length > 5 ? ', …' : ''
        }, so the second is **${secondBack}**. Calls go IN outermost-first and come OUT innermost-first — the reverse order is the whole reason a stack is the right structure for this.`,
      },
    ]
    return {
      title: 'A function that calls itself',
      prompt: `${code(fam.src)}\nThe call **f(${n})** is made. Answer four questions about what happens.`,
      parts,
      hints: [
        'Draw the calls as a tree, with the first call at the top and each call it makes underneath it.',
        'Then answer the questions off the tree: the value comes from the bottom up, the count is every node, the depth is the longest path down.',
        `Worked path: f(${n}) returns ${run.value}, with ${run.calls} calls and a deepest stack of ${run.maxDepth}.`,
      ],
      explanation: `f(${n}) returns ${run.value} after ${run.calls} calls, stacking ${run.maxDepth} deep at its deepest, with returns in the order ${run.returns
        .slice(0, 5)
        .join(', ')}${run.returns.length > 5 ? ', …' : ''}. Those four numbers describe recursion completely, and they answer different questions — a recursion can be cheap in depth and ruinous in calls, or the other way round.`,
    }
  },
)

const MEMO_FAMILIES = [
  {
    src: `function f(n):\n    if n <= 1:\n        return n\n    return f(n - 1) + f(n - 2)`,
    naive: (r: number) => {
      let calls = 0
      const go = (k: number): number => {
        calls++
        return k <= 1 ? k : go(k - 1) + go(k - 2)
      }
      go(r)
      return calls
    },
    memo: (r: number) => {
      let calls = 0
      const cache = new Map<number, number>()
      const go = (k: number): number => {
        calls++
        if (cache.has(k)) return cache.get(k) as number
        const v = k <= 1 ? k : go(k - 1) + go(k - 2)
        cache.set(k, v)
        return v
      }
      go(r)
      return calls
    },
    label: (r: number) => `f(${r})`,
    note: 'f(n − 2) is computed once inside f(n − 1) and then again directly, and that duplication repeats all the way down.',
  },
  {
    src: `function ways(r, c):\n    if r == 0 or c == 0:\n        return 1\n    return ways(r - 1, c) + ways(r, c - 1)`,
    naive: (r: number, c: number) => {
      let calls = 0
      const go = (a: number, b: number): number => {
        calls++
        return a === 0 || b === 0 ? 1 : go(a - 1, b) + go(a, b - 1)
      }
      go(r, c)
      return calls
    },
    memo: (r: number, c: number) => {
      let calls = 0
      const cache = new Map<string, number>()
      const go = (a: number, b: number): number => {
        calls++
        const key = `${a},${b}`
        if (cache.has(key)) return cache.get(key) as number
        const v = a === 0 || b === 0 ? 1 : go(a - 1, b) + go(a, b - 1)
        cache.set(key, v)
        return v
      }
      go(r, c)
      return calls
    },
    label: (r: number, c: number) => `ways(${r}, ${c})`,
    note: 'The same square of the grid is reached along many different paths, and each arrival recomputes everything below it.',
  },
]

const memoised = tpl(
  {
    id: 'alab-memoisation',
    name: 'Remembering what you already computed',
    skillIds: ['c-trace'],
    bucket: 'coding',
    difficulty: 4,
    variants: 14,
    minutes: 3.5,
  },
  (_rng, seed) => {
    const fam = MEMO_FAMILIES[seed % 2]
    const k = Math.floor(seed / 2)
    // Grid sizes are rectangular so all seven variants differ, and small enough
    // that the naive count stays a number a learner can reason about.
    const r = seed % 2 === 0 ? 6 + k : 3 + (k % 3)
    const c = 4 + Math.floor(k / 3)
    const naive = fam.naive(r, c)
    const memo = fam.memo(r, c)
    return {
      title: 'The same work, twice',
      prompt: `${code(fam.src)}\nRun as written, **${fam.label(
        r,
        c,
      )}** makes ${naive} calls. Now the function is given a cache: before doing any work it checks whether it has already answered for these arguments, and if so it returns the saved answer at once. Every answer it does compute is saved.\n\nWith the cache, how many calls happen in total?`,
      answer: numeric(memo),
      hints: [
        'A call still HAPPENS when the answer is cached — it just returns immediately instead of calling anything further.',
        'Count the distinct arguments that ever get computed, then add the calls that arrive to find an answer already waiting.',
        `Worked path: **${memo}** calls, against ${naive} without the cache.`,
      ],
      explanation: `With the cache the total is **${memo}** calls, down from ${naive} — a saving of ${
        naive - memo
      }. ${fam.note} The cache does not make any single call faster; it removes whole subtrees of repeated work. This is the one change that turns an exponential recursion into a practical one, and the cost is memory: every saved answer has to be kept.`,
      commonErrors: {
        concept: 'Expecting the cached version to make no calls at all misses that a cache HIT is still a call — it just stops there instead of spreading.',
      },
    }
  },
)

const SECURITY_CASES: { title: string; src: string; correct: string; wrong: string[]; fix: string }[] = [
  {
    title: 'A password in the file',
    src: `function login(entered):\n    if entered == "spring2026!":\n        return true\n    return false`,
    correct: 'The password is written into the code, so anyone reading the file learns it',
    wrong: [
      'The function returns a value rather than printing the result to the screen',
      'The comparison happens before the function has checked for an empty input',
      'The function name is too general to describe what the check actually does',
    ],
    fix: 'store only a one-way hash of the password, and keep secrets out of the source entirely',
  },
  {
    title: 'Building a query from typed text',
    src: `name = read_from_user()\nquery = "SELECT * FROM users WHERE name = '" + name + "'"\nrun(query)`,
    correct: 'Text typed by the user is glued straight into the command that gets run',
    wrong: [
      'The query asks for every column when only the name column is needed here',
      'The result of running the query is never stored in a variable afterwards',
      'The user input is read before the query string has been built up properly',
    ],
    fix: 'pass the value as a separate parameter so the database never treats it as part of the command',
  },
  {
    title: 'An index that came from outside',
    src: `i = read_number_from_user()\nprint(records[i])`,
    correct: 'The index is used without checking that it lands inside the array',
    wrong: [
      'The record is printed instead of being returned to the caller of the code',
      'The number is read as text and never converted into a numeric value first',
      'The array is looked up once when it could have been cached in a variable',
    ],
    fix: 'reject the request unless the index is at least 0 and less than the length'
  },
  {
    title: 'A price sent by the page',
    src: `price = read_from_web_page("price")\ntotal = price * quantity\ncharge(total)`,
    correct: 'The price is taken from the page, which the customer can change before sending',
    wrong: [
      'The total is worked out before the quantity has been checked for being zero',
      'The charge happens in the same step rather than after a confirmation screen',
      'The price is read as a single value rather than as a list of item prices',
    ],
    fix: 'look the price up on the server from the product id, and ignore whatever the page claims',
  },
  {
    title: 'A helpful log line',
    src: `function login(user, password):\n    log("login attempt: " + user + " / " + password)\n    return check(user, password)`,
    correct: 'The password is written into the log, where it is stored in readable form',
    wrong: [
      'The log line runs before the check, so failed attempts are recorded as well',
      'The user name and password are joined with a slash rather than with a comma',
      'The function logs every attempt, which will make the log file grow quickly',
    ],
    fix: 'log the user name and the outcome, never the secret itself',
  },
  {
    title: 'A check that only the browser does',
    src: `# in the page, before sending:\nif age >= 18:\n    send_order()\n\n# on the server:\naccept_order()`,
    correct: 'The only check happens in the page, which a sender can simply skip',
    wrong: [
      'The check uses greater-than-or-equal where it should use a strict comparison',
      'The order is sent immediately rather than being queued for later processing',
      'The age is read once at the start instead of being checked again on sending',
    ],
    fix: 'repeat the check on the server, and treat the page as a convenience only',
  },
]

const securityFlaw = tpl(
  {
    id: 'alab-security-flaw',
    name: 'Spot the security flaw',
    skillIds: ['c-trace'],
    bucket: 'coding',
    difficulty: 3,
    variants: SECURITY_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const cs = cycle(seed, SECURITY_CASES)
    return {
      title: cs.title,
      prompt: `This code does what it was asked to do, and it still has a security problem.\n${code(
        cs.src,
      )}\nWhat is the problem?`,
      answer: mcq(rng, cs.correct, cs.wrong),
      hints: [
        'Ask who else can see this, and which of these values a stranger gets to choose.',
        'The other three options describe things that are untidy or debatable. Only one of them lets an outsider get something they should not have.',
        `Worked path: **${cs.correct}**.`,
      ],
      explanation: `The problem is that **${cs.correct.charAt(0).toLowerCase()}${cs.correct.slice(
        1,
      )}**. The usual repair is to ${cs.fix}. The other three options are style points at best — code can be perfectly tidy and still hand something away, which is why security is reviewed as its own question rather than folded into "does it work".`,
      commonErrors: {
        misread: 'Reading for correctness answers "does it do the right thing for a cooperative user", which is a different question from "what can a hostile one do with it".',
      },
    }
  },
)

// ---------------------------------------------------------------- c-arrays
// 3B-AP-12 — comparing data structures. The stack and the queue are traced by
// running the operation list through real implementations of both.

interface Op {
  kind: 'in' | 'out'
  v: number
}

function runOps(ops: Op[], mode: 'stack' | 'queue'): { removed: number[]; final: number[] } {
  const store: number[] = []
  const removed: number[] = []
  for (const op of ops) {
    if (op.kind === 'in') store.push(op.v)
    else removed.push((mode === 'stack' ? store.pop() : store.shift()) as number)
  }
  return { removed, final: store }
}

/**
 * Operation patterns, fixed rather than sampled.
 *
 * A sampled sequence produced runs where every push preceded every pop, and on
 * those the stack order, the reverse of the queue order, the arrival order and
 * the sorted order all COLLAPSE into one string — the option builder
 * deduplicated them and left a two-way coin flip at seeds 6 and 18. Each
 * pattern below interleaves at least one push after the first pop, which keeps
 * the four rules genuinely different, and each holds four removals so an
 * adjacent-swap fallback always has room to work. Never removes from empty.
 */
const OP_PATTERNS = ['IIOIOIOIO', 'IIIOOIOIO', 'IIOIIOOIO', 'IIIOIOOIO', 'IIOIOIIOO']

/**
 * A nine-step operation list. Values stay inside 11..99 deliberately: every
 * option in the ordering form is then the same number of characters, so length
 * carries no information about which is right.
 */
function makeOps(rng: Rng, bucket: number): Op[] {
  const pattern = OP_PATTERNS[bucket % OP_PATTERNS.length]
  let next = slice(rng, bucket % 5, 5, 11, 40)
  return pattern.split('').map((c) => {
    if (c === 'O') return { kind: 'out' as const, v: 0 }
    const op = { kind: 'in' as const, v: next }
    next += rint(rng, 3, 7)
    return op
  })
}



const stackQueue = tpl(
  {
    id: 'alab-stack-queue',
    name: 'Stack against queue',
    skillIds: ['c-arrays'],
    bucket: 'coding',
    difficulty: 3,
    variants: 20,
    minutes: 3.5,
  },
  (rng, seed) => {
    const form = seed % 4
    const ops = makeOps(rng, Math.floor(seed / 4))
    const isStack = form % 2 === 0
    const mode = isStack ? 'stack' : 'queue'
    const other = isStack ? 'queue' : 'stack'
    const run = runOps(ops, mode)
    const alt = runOps(ops, other)
    const opText = ops
      .map((o) => (o.kind === 'in' ? `${isStack ? 'push' : 'enqueue'} ${o.v}` : isStack ? 'pop' : 'dequeue'))
      .join('\n')
    const rule = isStack
      ? 'A **stack** hands back the item added most recently (last in, first out).'
      : 'A **queue** hands back the item that has been waiting longest (first in, first out).'
    if (form < 2) {
      const last = run.removed[run.removed.length - 1]
      return {
        title: isStack ? 'The last thing off the stack' : 'The last thing out of the queue',
        prompt: `${rule}\n${code(opText)}\nWhat value comes out on the FINAL ${isStack ? 'pop' : 'dequeue'}?`,
        answer: numeric(last),
        hints: [
          'Keep the contents written down after every single line, not just at the end.',
          isStack
            ? 'A stack only ever gives back the item on top, so an item added late can leave early.'
            : 'A queue only ever gives back the front item, so items leave in exactly the order they arrived.',
          `Worked path: the values come out in the order ${run.removed.join(', ')}, so the last is **${last}**.`,
        ],
        explanation: `Values leave in the order ${run.removed.join(', ')}, so the final one is **${last}**, and ${
          run.final.length ? `${run.final.join(', ')} ${plural(run.final.length, 'is', 'are')} still held` : 'nothing is left'
        }. The same lines run on a ${other} would give ${alt.removed.join(
          ', ',
        )} instead. Same operations, same data, different structure, different answer — which is the entire reason the choice of structure is a design decision.`,
      }
    }
    const show = (xs: number[]) => xs.join(', ')
    // Every distractor is another rule actually run over the same operations,
    // and each holds the same count of two-digit values as the key.
    const wrong = [
      show(alt.removed),
      show([...run.removed].reverse()),
      show(
        ops
          .filter((o) => o.kind === 'in')
          .map((o) => o.v)
          .slice(0, run.removed.length),
      ),
      show([...run.removed].sort((x, y) => x - y)),
    ]
    return {
      title: isStack ? 'Everything off the stack' : 'Everything out of the queue',
      prompt: `${rule}\n${code(opText)}\nIn what order do the values come out?`,
      answer: mcq(rng, show(run.removed), wrong),
      hints: [
        'Write the contents down after every line. Four lines in, you should be able to say exactly what is held.',
        isStack ? 'Each pop takes the most recently added item still present.' : 'Each dequeue takes the oldest item still present.',
        `Worked path: **${show(run.removed)}**.`,
      ],
      explanation: `Tracing the ${mode} gives **${show(run.removed)}**, with ${
        run.final.length ? `${show(run.final)} left holding` : 'nothing left'
      }. On a ${other} the very same lines produce ${show(
        alt.removed,
      )}. Undo history needs the stack answer and a print queue needs the queue answer — pick the wrong one and the program is wrong in a way no amount of testing one item at a time will reveal.`,
    }
  },
)

const STRUCTURE_CASES: { need: string; correct: string; wrong: string[]; why: string }[] = [
  {
    need: 'An editor must undo the most recent change first, then the one before it, and so on back',
    correct: 'A stack, because the newest item is always the one wanted next',
    wrong: [
      'A queue, because the oldest item is always the one wanted next',
      'A dictionary, because each change can be looked up by its own name',
      'A sorted list, because the changes stay in order of how big they were',
    ],
    why: 'Undo is "most recent first", which is the definition of a stack.',
  },
  {
    need: 'A printer must serve documents strictly in the order they were sent to it',
    correct: 'A queue, because the oldest item is always the one wanted next',
    wrong: [
      'A stack, because the newest item is always the one wanted next',
      'A dictionary, because each document can be looked up by its own name',
      'A sorted list, because documents stay in order of how large they are',
    ],
    why: 'Fairness by arrival time is exactly first-in-first-out.',
  },
  {
    need: 'A site holds two million members and must fetch one member instantly by their id',
    correct: 'A dictionary, because a key goes straight to its value in one step',
    wrong: [
      'A queue, because members can be served in the order they signed up',
      'A stack, because the most recently added member is the cheapest to reach',
      'A plain list, because every member can be found by walking from the start',
    ],
    why: 'Lookup by key with no scanning is what a hash-backed dictionary is for.',
  },
  {
    need: 'A program keeps scores in order and repeatedly asks how many are below a given value',
    correct: 'A sorted array, because halving finds any cut-off in a few steps',
    wrong: [
      'A dictionary, because each score can be looked up straight from its value',
      'A stack, because the most recently added score is the cheapest to reach',
      'A queue, because the earliest score added is the cheapest one to reach',
    ],
    why: 'Order-based questions need order; a dictionary throws exactly that away.',
  },
  {
    need: 'A maze solver must always explore the newest branch it found before older ones',
    correct: 'A stack, because the newest branch is always the one wanted next',
    wrong: [
      'A queue, because the oldest branch is always the one wanted next',
      'A dictionary, because every branch can be looked up by its own name',
      'A sorted list, because branches stay in order of how long they were',
    ],
    why: 'Newest-first exploration is depth-first search, and a stack is what makes it so.',
  },
  {
    need: 'A router must find the fewest-hops route, so nearer places must be explored first',
    correct: 'A queue, because everything one hop away is handled before anything further',
    wrong: [
      'A stack, because everything found most recently is handled before the rest',
      'A dictionary, because each place can be looked up straight from its name',
      'A sorted list, because the places stay in order of how far away they are',
    ],
    why: 'Fewest hops needs breadth-first order, which the queue provides for free.',
  },
  {
    need: 'A spell checker must answer "is this word in the dictionary" for every word of a long essay',
    correct: 'A dictionary, because each check is one step whatever the size',
    wrong: [
      'A queue, because words can be checked in the order they appear in the essay',
      'A stack, because the most recently checked word is the cheapest to reach',
      'A plain list, because every word can be found by walking from the start',
    ],
    why: 'Millions of membership tests is exactly where constant-time lookup pays.',
  },
  {
    need: 'A game replays the last twenty moves in reverse, most recent first, when a player rewinds',
    correct: 'A stack, because the newest move is always the one wanted next',
    wrong: [
      'A queue, because the oldest move is always the one wanted next',
      'A dictionary, because every move can be looked up by its own name',
      'A sorted list, because the moves stay in order of how strong they were',
    ],
    why: 'Reverse-of-arrival is the stack order, and nothing else gives it for free.',
  },
  {
    need: 'A shop serves online orders in the order they were placed, however large each one is',
    correct: 'A queue, because the earliest order is always the one served next',
    wrong: [
      'A stack, because the latest order is always the one that is served next',
      'A dictionary, because every order can be looked up by its own number',
      'A sorted list, because the orders stay in order of how large they were',
    ],
    why: 'Arrival order is the requirement, so the structure must preserve it.',
  },
  {
    need: 'A program must repeatedly report the median of a fixed set of ten thousand measurements',
    correct: 'A sorted array, because the middle position is read straight off',
    wrong: [
      'A dictionary, because each measurement can be looked up straight by value',
      'A stack, because the most recent measurement is the cheapest one to reach',
      'A queue, because the earliest measurement is the cheapest one to reach',
    ],
    why: 'The median is a position, and only an ordered structure has positions.',
  },
  {
    need: 'A parser must check that every opening bracket is closed by the right kind, in the right order',
    correct: 'A stack, because the newest opening is the one that must close first',
    wrong: [
      'A queue, because the oldest opening is the one that must close first',
      'A dictionary, because each bracket can be looked up by the kind it is',
      'A sorted list, because the brackets stay in the order that they opened',
    ],
    why: 'Nesting is last-opened-first-closed, which is a stack by definition.',
  },
  {
    need: 'A cache must count how many times each of a hundred thousand pages has been requested',
    correct: 'A dictionary, because a page name goes straight to its count',
    wrong: [
      'A queue, because pages can be counted in the order they were requested',
      'A stack, because the page requested most recently is the cheapest to reach',
      'A plain list, because every page can be found by walking from the start',
    ],
    why: 'A count PER key is the dictionary shape; a list would rescan for every request.',
  },
]

const structureFit = tpl(
  {
    id: 'alab-structure-fit',
    name: 'Which structure fits',
    skillIds: ['c-arrays'],
    bucket: 'coding',
    difficulty: 3,
    variants: STRUCTURE_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const cs = cycle(seed, STRUCTURE_CASES)
    return {
      title: 'Fit the structure to the need',
      prompt: `${cs.need}.\n\nWhich data structure fits this best?`,
      answer: mcq(rng, cs.correct, cs.wrong),
      hints: [
        'Ask one question only: which item does this job need NEXT, every time?',
        'A stack gives back the newest, a queue the oldest, a dictionary whatever key you name, a sorted array whatever position you name.',
        `Worked path: **${cs.correct}**.`,
      ],
      explanation: `**${cs.correct.charAt(0).toUpperCase()}${cs.correct.slice(1)}.** ${
        cs.why
      } Choosing a structure is choosing which question is cheap to ask: every structure makes one access pattern nearly free and the others expensive, so the requirement decides the structure rather than the other way round.`,
    }
  },
)

const lookupCost = tpl(
  {
    id: 'alab-lookup-cost',
    name: 'What a lookup costs',
    skillIds: ['c-arrays'],
    bucket: 'coding',
    difficulty: 2,
    variants: 14,
    minutes: 2.5,
  },
  (rng, seed) => {
    const form = seed % 2
    const k = Math.floor(seed / 2)
    if (form === 0) {
      const n = 2 * slice(rng, k, 7, 20, 400) + 1
      // Average position, computed by summing every position rather than by formula.
      let sum = 0
      for (let i = 1; i <= n; i++) sum += i
      const avg = sum / n
      return {
        title: 'Scanning from the start',
        prompt: `A program looks for a record by walking the list from the beginning and stopping when it matches. The list holds **${n} records**, the record is definitely there, and it is equally likely to be in any position.\n\nOn average, how many records are examined?`,
        answer: numeric(avg),
        hints: [
          'The best case is 1 and the worst is the whole list. Averaging over every position is the honest way to do it.',
          `Add up 1 + 2 + … + ${n} and divide by ${n}.`,
          `Worked path: ${sum} ÷ ${n} = **${avg}**.`,
        ],
        explanation: `Adding every position and dividing: (1 + 2 + … + ${n}) ÷ ${n} = ${sum} ÷ ${n} = **${avg}**, which is a shade over half the list. Halving the average cost sounds good until you notice it still grows in step with the list — a list ten times longer costs ten times more to search, both on average and at worst.`,
      }
    }
    const n = slice(rng, k, 7, 60, 4000)
    // Worst case over every possible target, found by running the search.
    const arr = Array.from({ length: n }, (_, i) => i * 2 + 1)
    let worst = 0
    for (let i = 0; i < n; i++) worst = Math.max(worst, bsearch(arr, arr[i]).probes.length)
    worst = Math.max(worst, bsearch(arr, -1).probes.length)
    return {
      title: 'Halving instead of walking',
      prompt: `The same **${n} records**, but now sorted, and searched by looking at the middle of whatever range is left and throwing away the half that cannot contain the target.\n\nIn the WORST case, how many records are examined?`,
      answer: numeric(worst),
      hints: [
        'Each look throws away half of what is left, so ask how many halvings it takes to get from the whole list down to one record.',
        `Halving ${n}: ${(() => {
          const seq: number[] = [n]
          let c = n
          while (c > 1) {
            c = Math.floor(c / 2)
            seq.push(c)
          }
          return seq.join(' → ')
        })()}.`,
        `Worked path: **${worst}** looks in the worst case.`,
      ],
      explanation: `Running the search against every possible target, the most it ever needs is **${worst}** looks — because ${n} records survive only ${worst} halvings. Compare the plain scan: up to ${n} records examined, ${Math.round(
        n / worst,
      )} times more. Sorting is not free, but it is paid once and then every single lookup collects the discount.`,
      commonErrors: {
        concept: 'Halving the number of records examined is not the same as halving the RANGE each step. The first saves a constant factor; the second changes the growth class entirely.',
      },
    }
  },
)

// ------------------------------------------------- c-loops, c-funcs, c-decomp

interface LoopShape {
  render: (a: number, b: number, s: number) => string
  run: (a: number, b: number, s: number) => number
  hint: string
}

const LOOP_SHAPES: LoopShape[] = [
  {
    render: (a, b) => `count = 0\nfor i from ${a} to ${b}:\n    count = count + 1`,
    run: (a, b) => {
      let c = 0
      for (let i = a; i <= b; i++) c++
      return c
    },
    hint: '"from a to b" includes BOTH ends, so subtracting is one short.',
  },
  {
    render: (a, b, s) => `count = 0\nfor i from ${a} to ${b} step ${s}:\n    count = count + 1`,
    run: (a, b, s) => {
      let c = 0
      for (let i = a; i <= b; i += s) c++
      return c
    },
    hint: 'List the values i actually takes; the last one may not be b itself.',
  },
  {
    render: (a, b, s) => `count = 0\ni = ${a}\nwhile i < ${b}:\n    count = count + 1\n    i = i + ${s}`,
    run: (a, b, s) => {
      let c = 0
      for (let i = a; i < b; i += s) c++
      return c
    },
    hint: 'This test is "less than", not "less than or equal" — the boundary value never runs.',
  },
  {
    render: (a, b, s) => `count = 0\nfor i from ${a} to ${b}:\n    if i mod ${s} == 0:\n        count = count + 1`,
    run: (a, b, s) => {
      let c = 0
      for (let i = a; i <= b; i++) if (i % s === 0) c++
      return c
    },
    hint: 'The loop runs every time; the counter only moves on the multiples.',
  },
]

const loopBounds = tpl(
  {
    id: 'alab-loop-bounds',
    name: 'Loop boundaries',
    skillIds: ['c-loops'],
    bucket: 'coding',
    difficulty: 2,
    variants: 24,
    minutes: 2,
  },
  (rng, seed) => {
    const shape = LOOP_SHAPES[seed % LOOP_SHAPES.length]
    const k = Math.floor(seed / LOOP_SHAPES.length)
    const a = slice(rng, k, 6, 1, 12)
    const b = a + rint(rng, 12, 40)
    const s = rint(rng, 2, 6)
    const count = shape.run(a, b, s)
    const values: number[] = []
    if (seed % LOOP_SHAPES.length === 1) for (let i = a; i <= b; i += s) values.push(i)
    if (seed % LOOP_SHAPES.length === 2) for (let i = a; i < b; i += s) values.push(i)
    const listed = values.length ? values.slice(0, 6).join(', ') + (values.length > 6 ? ', …' : '') : ''
    return {
      title: 'How many times?',
      prompt: `${code(shape.render(a, b, s))}\nWhat is **count** when this finishes?`,
      answer: numeric(count),
      hints: [
        'Write out the first three values of i and the last one. The boundary is where these go wrong.',
        listed ? `i takes the values ${listed}. ${shape.hint}` : shape.hint,
        `Worked path: **${count}**.`,
      ],
      explanation: `Running it gives **${count}**. ${shape.hint} Off-by-one is the most common error in programming and it is almost never a thinking failure — it is a failure to CHECK the two ends. Test the first value and the last value every time and the class of bug disappears.`,
      commonErrors: {
        slip: 'Subtracting the two bounds and stopping there drops or adds one, depending on whether the end is included.',
      },
    }
  },
)

interface FuncShape {
  render: (p: number[]) => string
  call: (p: number[]) => string
  run: (p: number[]) => number
  hint: (p: number[]) => string
}

const FUNC_SHAPES: FuncShape[] = [
  {
    render: () => `function f(a, b):\n    if a > b:\n        return a - b\n    return b - a`,
    call: (p) => `f(${p[0]}, ${p[1]})`,
    run: (p) => Math.abs(p[0] - p[1]),
    hint: (p) => `Is ${p[0]} greater than ${p[1]}? That decides which of the two returns runs.`,
  },
  {
    render: () => `function f(n):\n    total = 0\n    for i from 1 to n:\n        total = total + i * i\n    return total`,
    call: (p) => `f(${p[0]})`,
    run: (p) => {
      let t = 0
      for (let i = 1; i <= p[0]; i++) t += i * i
      return t
    },
    hint: (p) => `The squares being added are ${Array.from({ length: p[0] }, (_, i) => (i + 1) * (i + 1)).join(' + ')}.`,
  },
  {
    render: (p) => `function f(n):\n    return ${p[1]} * n + ${p[2]}\n\nfunction g(n):\n    return f(f(n))`,
    call: (p) => `g(${p[0]})`,
    run: (p) => p[1] * (p[1] * p[0] + p[2]) + p[2],
    hint: (p) => `Inside out: f(${p[0]}) = ${p[1]} × ${p[0]} + ${p[2]} = ${p[1] * p[0] + p[2]}. Now feed THAT into f again.`,
  },
  {
    render: (p) => `function f(list):\n    for i from 0 to length(list) - 1:\n        if list[i] > ${p[1]}:\n            return i\n    return -1`,
    call: (p) => `f([${p.slice(2).join(', ')}])`,
    run: (p) => {
      const list = p.slice(2)
      for (let i = 0; i < list.length; i++) if (list[i] > p[1]) return i
      return -1
    },
    hint: (p) => `Walk the list from index 0 and stop at the FIRST value above ${p[1]} — the function returns immediately, it does not finish the loop.`,
  },
]

const funcSimulate = tpl(
  {
    id: 'alab-function-value',
    name: 'What does the call return?',
    skillIds: ['c-funcs'],
    bucket: 'coding',
    difficulty: 2,
    variants: 20,
    minutes: 2.5,
  },
  (rng, seed) => {
    const shapeIndex = seed % FUNC_SHAPES.length
    const shape = FUNC_SHAPES[shapeIndex]
    const k = Math.floor(seed / FUNC_SHAPES.length)
    const p: number[] = []
    if (shapeIndex === 0) p.push(slice(rng, k, 5, 3, 30), rint(rng, 2, 30))
    else if (shapeIndex === 1) p.push(slice(rng, k, 5, 4, 9))
    else if (shapeIndex === 2) p.push(slice(rng, k, 5, 2, 9), rint(rng, 2, 5), rint(rng, 1, 9))
    else {
      const limit = slice(rng, k, 5, 8, 30)
      p.push(0, limit)
      for (let i = 0; i < 5; i++) p.push(rint(rng, 2, limit + 12))
    }
    const value = shape.run(p)
    return {
      title: 'Follow the call',
      prompt: `${code(shape.render(p))}\nWhat does **${shape.call(p)}** return?`,
      answer: numeric(value),
      hints: [
        'Substitute the arguments into the body and run it line by line. A return ends the function immediately.',
        shape.hint(p),
        `Worked path: **${value}**.`,
      ],
      explanation: `${shape.call(p)} returns **${value}**. ${shape.hint(
        p,
      )} A function is only ever a promise about its OUTPUT for a given input — reading it that way is what lets you use one without re-reading its body every time.`,
    }
  },
)

const DECOMP_ORDER_CASES: { goal: string; steps: string[]; why: string }[] = [
  {
    goal: 'A program that reports the three most common words in a book',
    steps: [
      'Read the file into one long piece of text',
      'Split that text into a list of separate words',
      'Count how many times each word appears',
      'Sort those counts from largest to smallest',
      'Print the top three entries of the sorted list',
    ],
    why: 'Nothing can be split until it has been read, nothing counted until it is split, nothing sorted until it is counted.',
  },
  {
    goal: 'A program that emails a weekly summary of a class register',
    steps: [
      'Load the register file for the week',
      'Drop the rows that belong to other weeks',
      'Work out the attendance rate for each student',
      'Write those rates into a short summary message',
      'Send that message to the class teacher',
    ],
    why: 'Each step consumes what the step before it produced; none of them can move earlier.',
  },
  {
    goal: 'A program that draws a chart of a bank statement',
    steps: [
      'Open the statement file and read every line',
      'Turn each line into a date and an amount',
      'Add the amounts up within each month',
      'Choose a scale that fits the largest month',
      'Draw one bar per month at that scale',
    ],
    why: 'The scale cannot be chosen before the monthly totals exist, and the totals need parsed amounts.',
  },
  {
    goal: 'A program that finds duplicate photos in a folder',
    steps: [
      'List every photo file in the folder',
      'Compute a short fingerprint of each photo',
      'Group the photos that share a fingerprint',
      'Compare the photos inside each group properly',
      'Report the groups that really are duplicates',
    ],
    why: 'Fingerprints need files, groups need fingerprints, and the careful comparison only makes sense inside a group.',
  },
  {
    goal: 'A program that marks a multiple-choice test',
    steps: [
      'Read the answer key for the test',
      'Read one student sheet at a time',
      'Compare each answer against the key',
      'Total the marks for that student',
      'Write the totals into a results file',
    ],
    why: 'Comparing needs both the key and a sheet; a total needs the comparisons; the file needs the totals.',
  },
  {
    goal: 'A program that suggests the quickest route to school',
    steps: [
      'Load the map of streets and their lengths',
      'Find where the home and school sit on the map',
      'Search the map for the cheapest route between them',
      'Turn that route into a list of street names',
      'Print the directions one line at a time',
    ],
    why: 'A search needs a map and two endpoints; directions need the route the search produced.',
  },
  {
    goal: 'A program that backs up changed files overnight',
    steps: [
      'Read the record of what was backed up last time',
      'List the files that have changed since then',
      'Copy each changed file to the backup drive',
      'Check that every copy can be read back',
      'Update the record with tonight is date',
    ],
    why: 'You cannot know what changed without the old record, and the record must not be updated before the copies are verified.',
  },
  {
    goal: 'A program that prints name badges for an event',
    steps: [
      'Read the list of people who signed up',
      'Remove the entries that were cancelled',
      'Sort the remaining names alphabetically',
      'Lay the names out onto badge-sized pages',
      'Send the finished pages to the printer',
    ],
    why: 'Sorting before removing cancellations wastes work and leaves gaps; laying out needs the final list.',
  },
]

const decompOrder = tpl(
  {
    id: 'alab-decomp-order',
    name: 'Order the sub-tasks',
    skillIds: ['c-decomp'],
    bucket: 'coding',
    difficulty: 3,
    variants: DECOMP_ORDER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const cs = cycle(seed, DECOMP_ORDER_CASES)
    return {
      title: 'Which piece has to come first?',
      prompt: `${cs.goal}.\n\nThe job has been broken into five pieces. Each piece needs something that an earlier piece produced. Put them in the only order that works.`,
      answer: orderAnswer(rng, cs.steps),
      hints: [
        'Do not order these by what feels important. For each piece, ask what it needs to already exist before it can run.',
        'Find the one piece that needs nothing from the others and start there, then repeat.',
        `Worked path: ${cs.steps.map((s, i) => `${i + 1}. ${s}`).join('  ')}`,
      ],
      explanation: `The order is forced by what each piece consumes: ${cs.steps
        .map((s, i) => `${i + 1}. ${s}`)
        .join('  ')}. ${cs.why} Decomposition is not just cutting a job into pieces — it is naming what each piece needs and what it hands on, and that is what turns a plan into something you can build one piece at a time.`,
    }
  },
)

const DECOMP_TEST_CASES: { goal: string; correct: string; wrong: string[]; why: string }[] = [
  {
    goal: 'A program that grades quizzes and reports the class average, the top score, and how many passed',
    correct: 'One function per statistic, each taking the list of scores and returning a number',
    wrong: [
      'One long function that computes all three statistics inside a single pass',
      'One function per student that works out all three statistics for that student',
      'Three copies of the whole program, each one printing a different statistic',
    ],
    why: 'Each statistic is a separate question about the same data, so each can be checked alone: average of [2, 4] must be 3.',
  },
  {
    goal: 'A program that reads sensor readings from a file, removes bad ones, and plots the rest',
    correct: 'Separate reading, cleaning, and plotting functions passing data between them',
    wrong: [
      'One function that reads and cleans, and a second that reads again and plots',
      'One function per file format, each doing its own reading, cleaning, and plotting',
      'One function that does everything so the file is only ever opened a single time',
    ],
    why: 'Cleaning can be tested on a made-up list with no file and no chart anywhere in sight.',
  },
  {
    goal: 'A program that converts a recipe between metric and imperial units',
    correct: 'A pure conversion function, plus separate functions to read and to print',
    wrong: [
      'A single function that reads a line, converts it, and prints it straight away',
      'One function per ingredient, each with its own conversion built into it',
      'A conversion function that also prints the result so callers do not have to',
    ],
    why: 'A conversion that only returns a number can be checked against known values without any input or output.',
  },
  {
    goal: 'A game that must move a character, check for collisions, and redraw the screen',
    correct: 'Movement, collision checking, and drawing as three functions over shared state',
    wrong: [
      'One update function that moves, checks, and draws in one pass per frame',
      'One function per character, each moving, checking, and drawing itself',
      'A drawing function that also moves things so the two can never disagree',
    ],
    why: 'Collision checking is a question about positions, so it can be tested with made-up positions and no screen.',
  },
  {
    goal: 'A program that finds the cheapest flight from a list of routes and prices',
    correct: 'A search function returning the best route, and a separate one to display it',
    wrong: [
      'A search function that prints the best route as soon as it has found it',
      'One function per airline, each searching only that airline is own routes',
      'A display function that also searches, so the two can never fall out of step',
    ],
    why: 'A search that RETURNS its answer can be tested against a tiny list with a known winner.',
  },
  {
    goal: 'A program that checks whether a password meets four separate rules',
    correct: 'One small function per rule, and one that reports which rules failed',
    wrong: [
      'One function containing all four rules with a single true or false result',
      'One function per user, each applying whichever rules that account needs',
      'A checking function that also asks the user to type a new password in',
    ],
    why: 'A rule per function means a failing rule is located instantly, and each rule is testable on its own.',
  },
]

const decompTestable = tpl(
  {
    id: 'alab-decomp-testable',
    name: 'Pieces you can test alone',
    skillIds: ['c-decomp'],
    bucket: 'coding',
    difficulty: 2,
    variants: DECOMP_TEST_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const cs = cycle(seed, DECOMP_TEST_CASES)
    return {
      title: 'The cut that can be checked',
      prompt: `${cs.goal}.\n\nWhich way of breaking it up lets you test each piece on its own?`,
      answer: mcq(rng, cs.correct, cs.wrong),
      hints: [
        'Take each option and ask: could I check that one piece with made-up input and no rest of the program?',
        'A piece that RETURNS a value can be checked. A piece that prints, or reads a file, or draws, has to be run inside everything else.',
        `Worked path: **${cs.correct}**.`,
      ],
      explanation: `**${cs.correct}.** ${cs.why} The test for a good boundary is not how tidy the code looks — it is whether the piece can be handed input and checked against an expected output by itself. Pieces that mix computing with reading or printing always fail that test, which is why "return, do not print" is the most useful decomposition habit there is.`,
    }
  },
)

export const ALGORITHMS_TEMPLATES: ItemTemplate[] = [
  // c-vars — 3A-DA-09, bit representations
  binDec,
  hexConvert,
  bitsNeeded,
  imageBytes,
  // c-bool — 3B-CS-02, logic
  truthCount,
  truthRow,
  deMorgan,
  shortCircuit,
  // c-algo — 3B-AP-10 and 3B-AP-09, classic algorithms and game search
  binarySearchTrace,
  mergeSortSteps,
  traversal,
  dijkstra,
  minimax,
  // c-complexity — 3B-AP-11, efficiency and correctness
  nestedOps,
  crossover,
  bigO,
  greedyFails,
  // c-trace — 3B-AP-13 recursion, 3B-AP-18 security recognition
  recursionTrace,
  memoised,
  securityFlaw,
  // c-arrays — 3B-AP-12, data structures
  stackQueue,
  structureFit,
  lookupCost,
  // c-loops, c-funcs, c-decomp — 3A-AP-17 and the boundary work beneath it
  loopBounds,
  funcSimulate,
  decompOrder,
  decompTestable,
]
