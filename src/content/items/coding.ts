/**
 * Coding items — tracing, prediction, and debugging in plain JavaScript.
 * No code is executed; every answer was computed by hand-tracing during
 * authoring AND is re-derived programmatically where the generator computes
 * the result (loops/accumulators), keeping keys honest.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { fixed, mcq, numeric, tpl } from '../lib'

const code = (s: string) => '```\n' + s + '\n```'

const varsTrace = tpl(
  { id: 'c-vars-trace', name: 'Variable tracing', skillIds: ['c-vars'], bucket: 'coding', difficulty: 1, variants: 16, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 9)
    const b = rint(rng, 2, 9)
    // Compute the final value by actually simulating the assignments.
    let x = a
    let y = b
    x = x + y
    y = x - y
    const askX = rng() < 0.5
    return {
      title: 'Trace the values',
      prompt: `${code(`let x = ${a}\nlet y = ${b}\nx = x + y\ny = x - y`)}\nAfter this runs, what is **${askX ? 'x' : 'y'}**?`,
      answer: numeric(askX ? x : y),
      hints: [
        'Run it line by line; each assignment uses the CURRENT values.',
        `Line 3 first: x becomes ${a} + ${b} = ${a + b}. THEN line 4 uses that new x.`,
        `Worked path: x = ${x}, y = ${y} → answer **${askX ? x : y}**.`,
      ],
      explanation: `Line 3: x = ${a}+${b} = ${a + b}. Line 4 uses the NEW x: y = ${a + b}−${b} = ${a}. Final: x=${x}, y=${y}. (This pair of moves is the classic swap-without-a-temp trick — y ends up with x's old value.)`,
      commonErrors: { concept: 'Using the original x in line 4 assumes assignments happen simultaneously — they run in order, each seeing prior effects.' },
    }
  },
)

const exprOrder = tpl(
  { id: 'c-expr-order', name: 'Expression evaluation', skillIds: ['c-vars'], bucket: 'coding', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 6)
    const b = rint(rng, 2, 6)
    const c = rint(rng, 2, 5)
    const result = a + b * c
    const intDiv = rint(rng, 7, 17)
    const modCase = rng() < 0.5
    if (modCase) {
      const d = rint(rng, 3, 5)
      return {
        title: 'The % operator',
        prompt: `${code(`let r = ${intDiv} % ${d}`)}\nWhat is **r**? (In JavaScript, % gives the remainder.)`,
        answer: numeric(intDiv % d),
        hints: [
          `How many whole ${d}s fit into ${intDiv}?`,
          `${Math.floor(intDiv / d)} × ${d} = ${Math.floor(intDiv / d) * d}. What is left over?`,
          `Worked path: ${intDiv} % ${d} = **${intDiv % d}**.`,
        ],
        explanation: `${intDiv} = ${Math.floor(intDiv / d)}×${d} + ${intDiv % d}, so the remainder is **${intDiv % d}**. The %-remainder is the workhorse of "every Nth" logic (even/odd, cycles, wrapping).`,
      }
    }
    return {
      title: 'Operator precedence',
      prompt: `${code(`let r = ${a} + ${b} * ${c}`)}\nWhat is **r**?`,
      answer: numeric(result),
      hints: [
        'Code follows math precedence: * before +.',
        `${b} * ${c} happens first.`,
        `Worked path: ${a} + ${b * c} = **${result}**.`,
      ],
      explanation: `Multiplication binds tighter: ${a} + (${b} × ${c}) = **${result}**, not (${a}+${b})×${c} = ${(a + b) * c}.`,
    }
  },
)

const boolEval = tpl(
  { id: 'c-bool-eval', name: 'Boolean logic', skillIds: ['c-bool'], bucket: 'coding', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const x = rint(rng, 1, 10)
    const y = rint(rng, 1, 10)
    const op = pick(rng, ['&&', '||'] as const)
    const c1 = x > 4
    const c2 = y <= 6
    const result = op === '&&' ? c1 && c2 : c1 || c2
    return {
      title: 'True or false?',
      prompt: `${code(`let x = ${x}\nlet y = ${y}\nlet r = x > 4 ${op} y <= 6`)}\nIs **r** true or false?`,
      answer: mcq(rng, String(result), [String(!result)]),
      hints: [
        'Evaluate each comparison separately first.',
        `x > 4 is ${c1}; y <= 6 is ${c2}.`,
        `Worked path: ${c1} ${op} ${c2} = **${result}**.`,
      ],
      explanation: `x > 4 → ${c1}; y <= 6 → ${c2}. ${op === '&&' ? 'AND needs both true' : 'OR needs at least one true'}: **${result}**.`,
    }
  },
)

const condTrace = tpl(
  { id: 'c-cond-trace', name: 'Conditional branches', skillIds: ['c-bool'], bucket: 'coding', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const score = rint(rng, 40, 100)
    // The bug-free reference chain:
    const label = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'F'
    return {
      title: 'Which branch runs?',
      prompt: `${code(`let score = ${score}\nlet grade\nif (score >= 90) grade = "A"\nelse if (score >= 75) grade = "B"\nelse if (score >= 60) grade = "C"\nelse grade = "F"`)}\nWhat is **grade**?`,
      answer: mcq(rng, `"${label}"`, ['"A"', '"B"', '"C"', '"F"'].filter((o) => o !== `"${label}"`)),
      hints: [
        'An if/else-if chain stops at the FIRST true condition.',
        `Walk from the top: is ${score} >= 90? Then is it >= 75? …`,
        `Worked path: **"${label}"**.`,
      ],
      explanation: `Checks run top-down and stop at the first hit: ${score} ${score >= 90 ? '≥ 90 → "A"' : score >= 75 ? '< 90 but ≥ 75 → "B"' : score >= 60 ? '< 75 but ≥ 60 → "C"' : '< 60 → "F"'}. Later conditions never even run — order is part of the logic.`,
    }
  },
)

const loopSum = tpl(
  { id: 'c-loop-sum', name: 'Loop accumulation', skillIds: ['c-loops'], bucket: 'coding', difficulty: 2, variants: 16, minutes: 2.5 },
  (rng) => {
    const start = rint(rng, 1, 3)
    const end = rint(rng, 4, 7)
    const step = pick(rng, [1, 2])
    // Simulate honestly:
    let total = 0
    const iters: number[] = []
    for (let i = start; i <= end; i += step) {
      total += i
      iters.push(i)
    }
    return {
      title: 'What does the loop print?',
      prompt: `${code(`let total = 0\nfor (let i = ${start}; i <= ${end}; i += ${step}) {\n  total += i\n}\nconsole.log(total)`)}\nWhat is printed?`,
      answer: numeric(total),
      hints: [
        'Make a table: each row is one loop pass with i and total.',
        `i takes the values ${iters.join(', ')}.`,
        `Worked path: ${iters.join(' + ')} = **${total}**.`,
      ],
      explanation: `i runs ${iters.join(', ')} (stopping when i ≤ ${end} fails), accumulating ${iters.join(' + ')} = **${total}**. A state table beats mental juggling every time.`,
      commonErrors: { slip: `Off-by-one: including ${end + step} or stopping before ${iters[iters.length - 1]} are the two standard boundary errors.` },
    }
  },
)

const loopCount = tpl(
  { id: 'c-loop-count', name: 'Iteration counting', skillIds: ['c-loops'], bucket: 'coding', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    let n = rint(rng, 10, 40)
    const div = pick(rng, [2, 3])
    // Simulate:
    let count = 0
    let cur = n
    while (cur > 1) {
      cur = Math.floor(cur / div)
      count++
    }
    return {
      title: 'How many passes?',
      prompt: `${code(`let n = ${n}\nlet count = 0\nwhile (n > 1) {\n  n = Math.floor(n / ${div})\n  count += 1\n}\nconsole.log(count)`)}\nWhat is printed?`,
      answer: numeric(count),
      hints: [
        'Track n each pass until the condition fails.',
        `n goes ${(() => { const seq = [n]; let c = n; while (c > 1) { c = Math.floor(c / div); seq.push(c) } return seq.join(' → ') })()}.`,
        `Worked path: **${count}** passes.`,
      ],
      explanation: `Each pass divides n by ${div} (flooring): the sequence shrinks to 1 in **${count}** steps. Repeated division shrinks numbers FAST — this is the heartbeat of binary search and why log-time algorithms feel instant.`,
    }
  },
)

const funcReturn = tpl(
  { id: 'c-func-return', name: 'Function calls', skillIds: ['c-funcs'], bucket: 'coding', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const m = rint(rng, 2, 5)
    const b = rint(rng, 1, 9)
    const x = rint(rng, 2, 7)
    const nested = rng() < 0.4
    const inner = m * x + b
    const result = nested ? m * inner + b : inner
    return {
      title: 'Follow the call',
      prompt: `${code(`function f(x) {\n  return ${m} * x + ${b}\n}\nconsole.log(${nested ? 'f(f(' + x + '))' : 'f(' + x + ')'})`)}\nWhat is printed?`,
      answer: numeric(result),
      hints: [
        nested ? 'Inside-out: evaluate the inner call first, then feed its RESULT to the outer call.' : 'Substitute the argument for x in the body.',
        nested ? `f(${x}) = ${inner}. Now compute f(${inner}).` : `${m} × ${x} + ${b}.`,
        `Worked path: **${result}**.`,
      ],
      explanation: nested
        ? `f(${x}) = ${m}·${x}+${b} = ${inner}; then f(${inner}) = ${m}·${inner}+${b} = **${result}**. A function's return value is just a value — it can flow straight into another call.`
        : `f(${x}) = ${m}·${x} + ${b} = **${result}**.`,
    }
  },
)

const scopeConcept = fixed(
  { id: 'c-scope', name: 'Variable scope', skillIds: ['c-funcs'], bucket: 'coding', difficulty: 3, minutes: 2.5 },
  {
    title: 'Which x?',
    prompt: `${code(`let x = 10\nfunction bump(x) {\n  x = x + 1\n  return x\n}\nlet y = bump(3)\nconsole.log(x, y)`)}\nWhat is printed?`,
    answer: { type: 'mcq', options: ['10 4', '11 4', '10 11', '4 4'], correct: 0 },
    hints: [
      'The parameter x inside bump is a NEW variable that only exists during the call.',
      'bump(3): the inner x starts at 3, becomes 4, is returned. What happened to the outer x? Nothing.',
      'Worked path: outer x still 10, y = 4 → **10 4**.',
    ],
    explanation:
      'The parameter x shadows the outer x: inside bump, x is a fresh box holding 3 → 4. The outer x = 10 is untouched. Output: **10 4**. Scope is the reason two functions can both use "i" without colliding.',
    commonErrors: { concept: 'Expecting 11 assumes the function reached out and changed the global — parameters are copies (for numbers).' },
  },
)

const arrayIndex = tpl(
  { id: 'c-array-index', name: 'Array indexing', skillIds: ['c-arrays'], bucket: 'coding', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const len = rint(rng, 4, 6)
    const arr = Array.from({ length: len }, () => rint(rng, 1, 20))
    const kind = pick(rng, ['index', 'last', 'mutate'] as const)
    if (kind === 'mutate') {
      const i = rint(rng, 0, len - 2)
      const copy = [...arr]
      copy[i] = copy[i] + copy[i + 1]
      return {
        title: 'Array update',
        prompt: `${code(`let a = [${arr.join(', ')}]\na[${i}] = a[${i}] + a[${i + 1}]\nconsole.log(a[${i}])`)}\nWhat is printed?`,
        answer: numeric(copy[i]),
        hints: [
          'Indexes start at 0.',
          `a[${i}] is ${arr[i]} and a[${i + 1}] is ${arr[i + 1]}.`,
          `Worked path: ${arr[i]} + ${arr[i + 1]} = **${copy[i]}**.`,
        ],
        explanation: `a[${i}] (= ${arr[i]}) plus a[${i + 1}] (= ${arr[i + 1]}) is stored back into slot ${i}: **${copy[i]}**.`,
      }
    }
    const i = kind === 'last' ? len - 1 : rint(rng, 0, len - 1)
    return {
      title: 'Array access',
      prompt: `${code(`let a = [${arr.join(', ')}]\nconsole.log(${kind === 'last' ? 'a[a.length - 1]' : `a[${i}]`})`)}\nWhat is printed?`,
      answer: numeric(arr[i]),
      hints: [
        'Indexes start at 0, so a[0] is the FIRST element.',
        kind === 'last' ? `a.length is ${len}, so a.length − 1 = ${len - 1}.` : `Count from 0: position ${i}.`,
        `Worked path: **${arr[i]}**.`,
      ],
      explanation: kind === 'last'
        ? `a.length = ${len}; the last slot is index ${len - 1} → **${arr[i]}**. (a[a.length] is past the end — undefined.)`
        : `Index ${i} counting from zero → **${arr[i]}**.`,
      commonErrors: { concept: 'Off-by-one from counting positions starting at 1 is the most common array error in existence.' },
    }
  },
)

const arrayLoop = tpl(
  { id: 'c-array-loop', name: 'Array + loop', skillIds: ['c-arrays'], bucket: 'coding', difficulty: 3, variants: 14, minutes: 3 },
  (rng) => {
    const len = 5
    const arr = Array.from({ length: len }, () => rint(rng, 1, 12))
    const kind = pick(rng, ['max', 'evens'] as const)
    const maxV = Math.max(...arr)
    const evens = arr.filter((v) => v % 2 === 0).length
    return kind === 'max'
      ? {
          title: 'Find the pattern',
          prompt: `${code(`let a = [${arr.join(', ')}]\nlet m = a[0]\nfor (let i = 1; i < a.length; i++) {\n  if (a[i] > m) m = a[i]\n}\nconsole.log(m)`)}\nWhat is printed?`,
          answer: numeric(maxV),
          hints: [
            'Watch what m does as the loop scans the array.',
            'm only changes when a bigger value appears — it is tracking something.',
            `Worked path: m ends at the maximum, **${maxV}**.`,
          ],
          explanation: `m holds the largest value seen so far; after scanning everything it is the maximum: **${maxV}**. Naming the INVARIANT ("m = biggest so far") turns eight lines of trace into one sentence.`,
        }
      : {
          title: 'Count with a condition',
          prompt: `${code(`let a = [${arr.join(', ')}]\nlet c = 0\nfor (let i = 0; i < a.length; i++) {\n  if (a[i] % 2 === 0) c++\n}\nconsole.log(c)`)}\nWhat is printed?`,
          answer: numeric(evens),
          hints: [
            'What does the % 2 === 0 test detect?',
            `Check each: ${arr.map((v) => `${v}${v % 2 === 0 ? '✓' : '✗'}`).join(', ')}.`,
            `Worked path: **${evens}** even value${evens === 1 ? '' : 's'}.`,
          ],
          explanation: `The condition tests evenness; c counts hits: ${arr.filter((v) => v % 2 === 0).join(', ') || '(none)'} → **${evens}**.`,
        }
  },
)

const debugOffByOne = fixed(
  { id: 'c-debug-boundary', name: 'Find the bug: boundary', skillIds: ['c-trace'], bucket: 'coding', difficulty: 3, minutes: 3, calibration: true },
  {
    title: 'The missing element',
    prompt: `This should sum ALL elements of the array (the correct total is 25), but it prints **22**:\n${code(`let a = [7, 3, 8, 4, 3]\nlet total = 0\nfor (let i = 0; i < a.length - 1; i++) {\n  total += a[i]\n}\nconsole.log(total)`)}\nWhat is the bug?`,
    answer: {
      type: 'mcq',
      options: [
        'The loop stops before the last element (i < a.length - 1 should be i < a.length)',
        'The loop should start at i = 1',
        'total should start at 1, not 0',
        'a[i] should be a[i + 1]',
      ],
      correct: 0,
    },
    hints: [
      'Which indexes does the loop actually visit? List them.',
      'i runs 0, 1, 2, 3 — that is only four elements of a five-element array, and 25 − 22 = 3, exactly the value of a[4].',
      'Worked path: the condition excludes index 4; **i < a.length** fixes it.',
    ],
    explanation:
      'With i < a.length − 1, the loop visits indexes 0–3, summing 7+3+8+4 = 22 and never adding a[4] = 3. The gap between expected and actual (25 − 22 = 3) even fingerprints the missing element. Fix the bound to **i < a.length**. Debugging move: use the size of the error to locate it.',
    commonErrors: { misread: 'The pattern "< length − 1" is sometimes correct (pairwise comparisons) — the bug is using it where every element is needed.' },
  },
)

const debugSwap = fixed(
  { id: 'c-debug-logic', name: 'Find the bug: logic', skillIds: ['c-trace'], bucket: 'coding', difficulty: 3, minutes: 3 },
  {
    title: 'Always the same answer',
    prompt: `This should return the bigger of a and b, but callers report it returns b every time:\n${code(`function bigger(a, b) {\n  if (a > b) {\n    return b\n  }\n  return b\n}`)}\nWhat is the fix?`,
    answer: {
      type: 'mcq',
      options: [
        'The first return should be a (return the one the condition selected)',
        'The condition should be a < b',
        'The second return should be a',
        'Add an else branch that returns a',
      ],
      correct: 0,
    },
    hints: [
      'Trace both paths: what returns when a > b? When a ≤ b?',
      'Both paths return b — the condition changes nothing.',
      'Worked path: when a > b, we meant to return **a**.',
    ],
    explanation:
      'Both branches return b, so the if is decorative. The condition a > b correctly detects "a is bigger" — that branch must **return a**. Debugging move: test each path with concrete values (a=5,b=2 and a=2,b=5) and compare against intent.',
  },
)

const tracePredict = fixed(
  { id: 'c-trace-state', name: 'State table trace', skillIds: ['c-trace'], bucket: 'coding', difficulty: 3, minutes: 3, transfer: true },
  {
    title: 'Two variables, one loop',
    prompt: `${code(`let a = 1\nlet b = 1\nfor (let i = 0; i < 4; i++) {\n  let next = a + b\n  a = b\n  b = next\n}\nconsole.log(b)`)}\nWhat is printed?`,
    answer: numeric(8),
    hints: [
      'Build the table: after each pass, record a and b.',
      'Pass 1: next=2, a=1, b=2. Pass 2: next=3, a=2, b=3. Keep going.',
      'Worked path: passes give b = 2, 3, 5, **8**.',
    ],
    explanation:
      'State table — pass: (a, b): start (1,1) → (1,2) → (2,3) → (3,5) → (5,8). Printed: **8**. You are watching the Fibonacci sequence being computed with two sliding variables; the temp `next` prevents overwriting a value still needed.',
  },
)

const algoSearch = fixed(
  { id: 'c-binary-search', name: 'Search step counting', skillIds: ['c-algo'], bucket: 'coding', difficulty: 3, minutes: 3, calibration: true },
  {
    title: 'Guess my number',
    prompt:
      'I pick a number from **1 to 1000**. After each guess I say "higher" or "lower". Using the best strategy, how many guesses do you need to be **certain** of finding it? (Each guess halves the range: 1000 → 500 → 250 → 125 → 63 → 32 → 16 → 8 → 4 → 2 → 1.)',
    answer: numeric(10),
    hints: [
      'What is the best possible guess each time, and what does it do to the range?',
      'Count the halvings listed in the prompt until the range is a single number.',
      'Worked path: 10 halvings reach certainty → **10** guesses.',
    ],
    explanation:
      'Guessing the middle halves the candidates every time: 1000 → 500 → 250 → 125 → 63 → 32 → 16 → 8 → 4 → 2 → 1 is **10** steps (2¹⁰ = 1024 ≥ 1000). This is binary search — the reason sorted data is so valuable. Linear checking could need 1000 guesses; structure buys a 100× saving.',
  },
)

const algoCompare = fixed(
  { id: 'c-algo-compare', name: 'Algorithm choice', skillIds: ['c-algo'], bucket: 'coding', difficulty: 3, minutes: 2.5 },
  {
    title: 'Which approach scales?',
    prompt:
      'You must check whether a name is in a list of 1,000,000 **sorted** names, many times per second. Which approach is best?',
    answer: {
      type: 'mcq',
      options: [
        'Binary search — about 20 comparisons per lookup',
        'Check every name from the start — up to 1,000,000 comparisons',
        'Check every second name to halve the work',
        'Shuffle the list first so lucky hits come faster',
      ],
      correct: 0,
    },
    hints: [
      'The list is SORTED — what does that let you skip?',
      'Compare the middle name: half the list is instantly eliminated.',
      'Worked path: repeated halving needs only ~log₂(1,000,000) ≈ **20** comparisons.',
    ],
    explanation:
      'Sorted order lets each comparison discard half the remaining names: ~20 steps instead of up to a million. Checking every second name still scales linearly (500,000), and shuffling destroys the order that made the fast method possible. The lesson: exploit structure, don’t average over it.',
  },
)

const decompose = fixed(
  { id: 'c-decompose', name: 'Decompose the task', skillIds: ['c-decomp'], bucket: 'coding', difficulty: 2, minutes: 2.5 },
  {
    title: 'Break it down',
    prompt:
      'You want a program that reads a list of quiz scores and reports the class average, highest score, and how many students passed (≥ 60). Which decomposition is cleanest?',
    answer: {
      type: 'mcq',
      options: [
        'Functions: average(scores), maximum(scores), countPassing(scores, cutoff) — then a small report that calls all three',
        'One long function that does everything in a single loop with many variables',
        'Three copies of the program, one per statistic',
        'A function per student that computes all three statistics for that student',
      ],
      correct: 0,
    },
    hints: [
      'Good pieces can be understood, tested, and reused ALONE.',
      'Could you test "average" without the report existing? That is the sign of a good boundary.',
      'Worked path: three single-purpose functions + a thin coordinator.',
    ],
    explanation:
      'Each statistic is an independent question about the same data — so each gets a function with one job, testable by itself (average([2,4]) must be 3). The single-loop monolith works but every change risks every feature; per-student functions put the boundary in the wrong place (the statistics are about the WHOLE list).',
  },
)

const invariant = fixed(
  { id: 'c-invariant', name: 'Spot the invariant', skillIds: ['c-decomp'], bucket: 'coding', difficulty: 4, minutes: 3, transfer: true },
  {
    title: 'What stays true?',
    prompt: `${code(`// moves all zeros to the end, keeping other order\nlet a = [0, 5, 0, 3, 8]\nlet w = 0\nfor (let r = 0; r < a.length; r++) {\n  if (a[r] !== 0) {\n    a[w] = a[r]\n    w++\n  }\n}\n// then fill from w to the end with zeros`)}\nWhich statement stays true after EVERY loop pass (the invariant)?`,
    answer: {
      type: 'mcq',
      options: [
        'a[0..w-1] holds all the nonzero values seen so far, in their original order',
        'a[w] is always zero',
        'r and w are always equal',
        'The array is fully sorted up to position r',
      ],
      correct: 0,
    },
    hints: [
      'Run two or three passes on paper and look at the region before w.',
      'w only advances when a nonzero value was just written at it.',
      'Worked path: the prefix a[0..w-1] = nonzeros so far, in order — that is what makes the final fill-with-zeros step valid.',
    ],
    explanation:
      'Every pass either copies a nonzero into position w (extending the clean prefix) or skips a zero (leaving the prefix intact) — so "the first w slots are exactly the nonzeros seen so far, in order" survives every pass. Invariants are how you KNOW a loop is right without simulating every input.',
  },
)

export const CODING_TEMPLATES: ItemTemplate[] = [
  varsTrace,
  exprOrder,
  boolEval,
  condTrace,
  loopSum,
  loopCount,
  funcReturn,
  scopeConcept,
  arrayIndex,
  arrayLoop,
  debugOffByOne,
  debugSwap,
  tracePredict,
  algoSearch,
  algoCompare,
  decompose,
  invariant,
]
