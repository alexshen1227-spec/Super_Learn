/**
 * SEARCH LAB — four puzzle skills that are METHODS, not games.
 *
 * Puzzle Lab carried 49 templates on three skills (chess, spatial assembly,
 * logic grids). All three are *arenas*; none of them names a transferable move
 * a learner can apply on purpose. These four do:
 *
 *  - `z-invariant`  find the quantity every move preserves, and a whole class
 *                   of attempts dies at once;
 *  - `z-search`     order the possibilities so checking one kills many;
 *  - `z-extremal`   the largest/smallest/first thing is usually forced, and
 *                   forces the rest;
 *  - `z-sequence`   find the generating rule, then CHECK it on a case that was
 *                   not used to find it.
 *
 * WHAT THESE ITEMS MAY AND MAY NOT CLAIM. The meta-analytic record on puzzle
 * and game instruction is negative for far transfer once an active control is
 * used: Sala & Gobet (2016, Educational Research Review 18) found chess-
 * instruction effect sizes shrink toward zero as design quality rises, and
 * Sala & Gobet (2017, Learning & Behavior 45(4)) ran two experiments with
 * active controls — checkers in the first, Go in the second (N = 52) — and
 * found no statistically significant difference in mathematical ability at
 * posttest. So the explanations here say what a method is good for WITHIN
 * puzzles, and name the other PUZZLE settings where the same move appears.
 * Nothing in this file may suggest that solving puzzles makes anyone generally
 * smarter, and none of it does.
 *
 * COMPUTED, NOT ASSERTED. Every reachability claim is decided by exhaustive
 * search inside this file, never by quoting a theorem:
 *  - `jarFinalColours`, `machineTargets`, `diagonalReach` enumerate the whole
 *    reachable state space and report the SET of outcomes; the parity/mod-3
 *    argument is what the explanation teaches, not what the key relies on.
 *  - `canTile` is an exact broken-profile DP, so a "yes, it tiles" answer is a
 *    constructed cover, not an inference from equal colour counts. That
 *    distinction is the whole lesson of the domino family: an invariant rules
 *    OUT and never guarantees.
 *  - `weighingsNeeded`, `twoSampleTests`, `minMakespan`, `fixedStepWorst` and
 *    the ordering solver are DPs or exhaustive searches over the real space.
 *  - Every sequence family verifies that exactly ONE offered rule reproduces
 *    every shown term before it ships the item. A sequence question with two
 *    fitting rules is a defect unless the ambiguity IS the question, and where
 *    it is (`zq-separate`) the item asks about the ambiguity itself.
 *
 * OPTION LENGTH. The bank has shipped a length cue before (the key was
 * uniquely the longest option often enough to be worth guessing). Here every
 * multiple-choice set carries at least one decoy no shorter than the key, and
 * the fixed-key sets rotate their decoys with `rotate()` so the key's length
 * RANK is not a constant across variants.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { mcq, mcqNoted, numeric, tpl } from '../lib'
import { rint, shuffle, type Rng } from '../../engine/rng'

// ===================================================================== shared

/** Ceiling division on non-negative integers, with no floating point. */
export function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b)
}

/**
 * Rotate which decoys appear with the variant.
 *
 * A fixed-key multiple choice cannot vary WHICH option is right, so if its
 * option set never changes the key sits at a constant length rank — and a rank
 * is exactly as learnable as a position. Drawing a window from a longer pool
 * moves the key up and down the ordering between variants.
 */
function rotate<T>(seed: number, pool: readonly T[], take: number): T[] {
  const out: T[] = []
  for (let i = 0; i < take; i++) out.push(pool[(seed + i) % pool.length])
  return out
}

type Decoy = [text: string, note: string | null, tag?: 'concept' | 'strategy' | 'slip' | 'misread' | 'inference']

// ================================================================= INVARIANTS

/**
 * Every final stone the two-stone jar can produce, by exhausting the state
 * space rather than quoting the parity result.
 *
 * State (w, b). A draw removes two stones and returns one:
 *   two blacks  → (w, b − 1)      two whites → (w − 2, b + 1)
 *   one of each → (w, b − 1)
 * Total falls by exactly one per draw, so the process always ends on one
 * stone. If the returned set has a single member, the outcome is forced.
 */
export function jarFinalColours(w0: number, b0: number): { white: boolean; black: boolean } {
  const out = { white: false, black: false }
  const seen = new Set<number>()
  const stack: [number, number][] = [[w0, b0]]
  while (stack.length) {
    const [w, b] = stack.pop()!
    const k = w * 1000 + b
    if (seen.has(k)) continue
    seen.add(k)
    if (w + b === 1) {
      if (w === 1) out.white = true
      else out.black = true
      continue
    }
    if (b >= 2) stack.push([w, b - 1])
    if (w >= 2) stack.push([w - 2, b + 1])
    if (w >= 1 && b >= 1) stack.push([w, b - 1])
  }
  return out
}

const jarParity = tpl(
  {
    id: 'zi-jar-parity',
    name: 'The last stone',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 24,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — the final stone is found by exhausting every reachable jar state (jarFinalColours), not by asserting the parity theorem.',
  },
  (rng, seed) => {
    const w = 4 + (seed % 12)
    const b = 5 + ((seed * 5) % 13)
    const outcome = jarFinalColours(w, b)
    const last = outcome.white ? 'White' : 'Black'
    const other = outcome.white ? 'Black' : 'White'
    const draws = w + b - 1

    const invariantPool: Decoy[] = [
      ['The number of black stones still in the jar', 'blacks change on every single draw — up by one or down by one', 'concept'],
      ['Whether the black count is odd or even', 'black parity flips every draw, so it carries no information forward', 'concept'],
      ['The total number of stones left in the jar', 'the total falls by exactly one each draw, which is why the process ends', 'misread'],
      ['Whether the total is odd or even', 'the total changes by one each time, so its parity flips every draw', 'concept'],
      ['The gap between the two colour counts', 'the gap moves around freely — only the white parity is pinned', 'concept'],
    ]
    const invariant = mcqNoted(rng, 'Whether the white count is odd or even', rotate(seed, invariantPool, 4))

    const parts: ItemPart[] = [
      {
        prompt:
          'One of these is the same after every draw, no matter which two stones came out. Which one?',
        answer: invariant.answer,
        hints: [
          'Write down what each of the three cases does to the WHITE count specifically.',
          'Two whites out, one black in: whites drop by 2. Any other case: whites are unchanged.',
          'A quantity that only ever changes by 0 or 2 keeps its odd/even status forever.',
        ],
        explanation:
          `Whites change by 0 or by 2 and never by 1: two whites out and a black in costs exactly two whites, ` +
          `and every other draw leaves the white count alone. So "odd or even" is locked from the start. ` +
          `Blacks and the total both change by one on some draws, so neither is fixed.`,
      },
      {
        prompt: 'How many draws happen before a single stone is left?',
        answer: numeric(draws),
        hints: [
          'Count what one draw does to the TOTAL: two stones out, one stone in.',
          `The total falls by exactly one per draw, from ${w + b} down to 1.`,
          `So the count is ${w + b} − 1 = ${draws}.`,
        ],
        explanation:
          `Every draw removes two stones and returns one, so the total drops by exactly one. ` +
          `From ${w + b} stones down to 1 that is ${draws} draws — and it never stalls, because any two stones can be drawn.`,
      },
      {
        prompt: 'What colour is the single stone that is left at the end?',
        answer: mcq(rng, last, [
          other,
          'It depends on the order of draws',
          'The jar can end with two stones',
        ]),
        hints: [
          'You already know the white count keeps its odd/even status.',
          'At the end only one stone remains, so the white count is either 0 or 1.',
          `${w} whites is ${w % 2 === 1 ? 'odd, so the final white count cannot be 0' : 'even, so the final white count cannot be 1'}.`,
        ],
        explanation:
          `**${last}.** The jar starts with ${w} white stones, which is ${w % 2 === 1 ? 'odd' : 'even'}, and white parity never ` +
          `changes. At the end exactly one stone remains, so the white count is 0 or 1 — and only ` +
          `${w % 2 === 1 ? '1' : '0'} has the right parity. The order of draws cannot matter, which is the surprising part: ` +
          `an invariant answers the question without simulating anything.`,
      },
    ]

    return {
      title: 'The last stone',
      prompt:
        `A jar holds **${w} white** stones and **${b} black** stones. Repeat this until one stone is left:\n\n` +
        `- Take out two stones without looking.\n` +
        `- If they are the SAME colour, drop one **black** stone in.\n` +
        `- If they are DIFFERENT colours, drop one **white** stone in.\n\n` +
        `There is a bag of spare stones, so you never run out of replacements.`,
      parts,
      distractorNotes: invariant.distractorNotes,
      distractorTags: invariant.distractorTags,
      hints: [
        'Do not simulate. Ask what each of the three cases does to one particular count.',
        'Track the WHITE count through all three cases and write down the change each time.',
        'Whites move by 0 or 2 only, so their odd/even status is fixed for the whole process.',
      ],
      explanation:
        `The white count changes by 0 or by 2 on every draw, never by 1, so whether it is odd or even is fixed ` +
        `before you start. The total falls by exactly one per draw, so exactly one stone survives — and its colour ` +
        `is forced by that parity. This is the shape of every invariant argument: find the thing the moves cannot ` +
        `touch, and the question collapses. The same move settles sliding-tile puzzles (a permutation parity) and ` +
        `the domino-covering puzzles in this bucket.`,
    }
  },
)

/**
 * Exact domino-tiling test: broken-profile DP over the w×h grid.
 *
 * The point of doing this properly is that equal colour counts do NOT
 * guarantee a cover. An item that answered "yes" from balanced colours alone
 * would be teaching the exact overreach the family exists to warn against.
 */
export function canTile(w: number, h: number, blocked: (i: number) => boolean): boolean {
  const n = w * h
  let cur = new Set<number>([0])
  for (let i = 0; i < n; i++) {
    const next = new Set<number>()
    const x = i % w
    for (const mask of cur) {
      if (mask & 1) {
        next.add(mask >> 1)
        continue
      }
      if (blocked(i)) {
        next.add(mask >> 1)
        continue
      }
      if (x + 1 < w && !(mask & 2) && !blocked(i + 1)) next.add((mask | 2) >> 1)
      if (i + w < n && !blocked(i + w)) next.add((mask >> 1) | (1 << (w - 1)))
    }
    if (!next.size) return false
    cur = next
  }
  return cur.has(0)
}

/** Boards with at least one even side, so a cover is never blocked by an odd cell count. */
const BOARDS: readonly [number, number][] = [
  [4, 4],
  [5, 4],
  [6, 4],
  [4, 5],
  [6, 5],
  [5, 6],
]

const dominoColouring = tpl(
  {
    id: 'zi-domino-colouring',
    name: 'Two squares gone',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 24,
    minutes: 5,
    kind: 'multi',
    transfer: true,
    provenance:
      'Original — the cover question is decided by an exact broken-profile DP (canTile), so a "yes" is a real tiling and never an inference from balanced colours.',
  },
  (rng, seed) => {
    const [w, h] = BOARDS[seed % BOARDS.length]
    const cells = w * h
    const rowOf = (i: number) => Math.floor(i / w) + 1
    const colOf = (i: number) => (i % w) + 1
    const isDark = (i: number) => (rowOf(i) + colOf(i)) % 2 === 0

    const first = (seed * 7) % cells
    const wantSame = seed % 2 === 0
    let second = -1
    for (let step = 1; step < cells; step++) {
      const cand = (first + step + (seed % 5)) % cells
      if (cand === first) continue
      if ((isDark(cand) === isDark(first)) === wantSame) {
        second = cand
        break
      }
    }
    const gone = new Set<number>([first, second])
    const blocked = (i: number) => gone.has(i)

    let dark = 0
    let light = 0
    for (let i = 0; i < cells; i++) {
      if (blocked(i)) continue
      if (isDark(i)) dark++
      else light++
    }
    const balanced = dark === light
    const tiles = balanced && canTile(w, h, blocked)

    const keyNoColour = 'No — one colour has two squares too many'
    const keyCover = 'Yes — the colours match and a cover fits'
    const keyStuck = 'No — the colours match but nothing fits'
    const verdict = !balanced ? keyNoColour : tiles ? keyCover : keyStuck
    const coverOptions = [keyNoColour, keyCover, keyStuck].filter((o) => o !== verdict)

    const square = (i: number) => `row ${rowOf(i)}, column ${colOf(i)}`

    const balancePool: Decoy[] = [
      ['The cover is then guaranteed to exist', 'balanced colours are necessary, not sufficient — the check only fails to say no', 'inference'],
      ['A cover exists whenever the board is square', 'the shape of the outline decides nothing on its own', 'concept'],
      ['It proves the two removed squares touch', 'colour counts say nothing about where the holes sit', 'inference'],
      ['The board can then be cut into equal halves', 'a colour count is not a statement about cutting the board up', 'concept'],
      ['The number of dominoes needed would be odd', 'the number of dominoes is just the cell count halved', 'slip'],
    ]

    const parts: ItemPart[] = [
      {
        prompt: 'How many DARK squares are left on the board?',
        answer: numeric(dark),
        hints: [
          'You do not have to list them. Start from how many dark squares a full board has.',
          `A ${w} by ${h} board has ${cells} squares, half of each colour: ${cells / 2} dark and ${cells / 2} light.`,
          `Now subtract the removed squares that were dark. ${square(first)} is ${isDark(first) ? 'dark' : 'light'} and ${square(second)} is ${isDark(second) ? 'dark' : 'light'}.`,
        ],
        explanation:
          `A full ${w} by ${h} board splits evenly: ${cells / 2} dark and ${cells / 2} light. ` +
          `The removed squares are ${isDark(first) ? 'dark' : 'light'} and ${isDark(second) ? 'dark' : 'light'}, ` +
          `which leaves **${dark} dark** against ${light} light. Counting by subtraction beats counting square by square, ` +
          `and it is the step that makes the colouring argument quick enough to be worth doing.`,
      },
      {
        prompt: 'Can the squares that remain be covered exactly by dominoes, with none left over and none overlapping?',
        answer: mcq(rng, verdict, [
          ...coverOptions,
          'Yes — any even number of squares works out',
          'No — the two removed squares were too close',
        ]),
        hints: [
          'A domino always sits on two squares that share an edge. What colours are those two squares?',
          'One dark and one light, every time. So a full cover needs the two colours in equal numbers.',
          `Here the counts are ${dark} dark against ${light} light, so the colouring ${balanced ? 'does not rule a cover out' : 'rules a cover out at once'}.`,
        ],
        explanation:
          `Every domino covers one dark and one light square, so a cover of ${dark + light} squares needs the two ` +
          `colours in equal numbers. Here it is ${dark} against ${light}. ` +
          (balanced
            ? `They balance, which means the colouring cannot rule a cover out — and a cover ${tiles ? 'does exist, found by searching all placements' : 'still does not exist, found by searching all placements'}.`
            : `They do not balance, so no arrangement of dominoes can work — you have ruled out every attempt at once without trying a single one.`),
      },
      {
        prompt: 'Suppose the two colour counts had come out EQUAL. What would that on its own have told you?',
        answer: mcq(rng, 'Nothing yet — it only fails to rule it out', rotate(seed, balancePool, 4).map((d) => d[0])),
        hints: [
          'Ask which direction the argument runs: from "a cover exists" to "colours balance", or the other way?',
          'A cover forces balance. Balance does not force a cover.',
          'Think of a board cut into two separate pieces of three squares each — balanced, and hopeless.',
        ],
        explanation:
          `Balanced colours are **necessary** but not **sufficient**. The argument runs one way only: if a cover ` +
          `exists then the colours must balance, so unequal colours kill the cover. Equal colours leave you exactly ` +
          `where you started. That is what every invariant does — it rules attempts out and never promises success, ` +
          `which is why this item checked the cover by searching rather than by counting colours.`,
      },
    ]

    return {
      title: 'Two squares gone',
      prompt:
        `A board has **${h} rows** and **${w} columns**. Colour it like a chessboard: a square is **dark** when its ` +
        `row number plus its column number is an even number, and light otherwise.\n\n` +
        `Two squares are cut out: **${square(first)}** and **${square(second)}**.\n\n` +
        `A domino covers exactly two squares that share an edge.`,
      parts,
      hints: [
        'Colour the board before you try to place anything.',
        'Ask what ONE domino always does to the two colour counts.',
        'One dark and one light, always — so compare the two counts of what is left.',
      ],
      explanation:
        `The colouring is the invariant: one domino always eats one dark and one light square, so any full cover ` +
        `needs the colours in equal numbers. Counting is far faster than placing, and it settles a whole class of ` +
        `attempts in one line. The limit is just as important: balance never proves a cover exists, so this item ` +
        `searched for one rather than assuming. The same colouring move appears in the polyomino assemblies in ` +
        `this bucket, where a stranded pocket has the same flavour.`,
    }
  },
)

/**
 * Which "all one type" states the token machine can reach, by exhaustive
 * search over every (a, b, c) with the total fixed.
 *
 * A press takes two tokens of different types and returns two of the third,
 * so each count moves by −1, −1, +2. The mod-3 argument is the lesson; this
 * function is the authority.
 */
export function machineTargets(a0: number, b0: number, c0: number): [boolean, boolean, boolean] {
  const total = a0 + b0 + c0
  const key = (a: number, b: number) => a * (total + 1) + b
  const seen = new Set<number>([key(a0, b0)])
  const stack: [number, number, number][] = [[a0, b0, c0]]
  const hit: [boolean, boolean, boolean] = [false, false, false]
  while (stack.length) {
    const [a, b, c] = stack.pop()!
    if (a === total) hit[0] = true
    if (b === total) hit[1] = true
    if (c === total) hit[2] = true
    const moves: [number, number, number][] = []
    if (a >= 1 && b >= 1) moves.push([a - 1, b - 1, c + 2])
    if (a >= 1 && c >= 1) moves.push([a - 1, b + 2, c - 1])
    if (b >= 1 && c >= 1) moves.push([a + 2, b - 1, c - 1])
    for (const m of moves) {
      const k = key(m[0], m[1])
      if (seen.has(k)) continue
      seen.add(k)
      stack.push(m)
    }
  }
  return hit
}

const TOKENS = ['circles', 'squares', 'triangles'] as const

const tokenMachine = tpl(
  {
    id: 'zi-token-mod3',
    name: 'The swapping machine',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: 24,
    minutes: 5,
    kind: 'multi',
    provenance:
      'Original — reachable end states are enumerated over the whole state space (machineTargets); the mod-3 invariant is taught in the explanation, never used as the key.',
  },
  (rng, seed) => {
    const counts: [number, number, number] = [
      3 + (seed % 5),
      4 + ((seed * 3) % 7),
      5 + ((seed * 5) % 9),
    ]
    const total = counts[0] + counts[1] + counts[2]
    const hit = machineTargets(counts[0], counts[1], counts[2])
    const ask = seed % 3
    const canDoAsked = hit[ask]
    const reachableCount = hit.filter(Boolean).length

    const gapPool: Decoy[] = [
      ['It always moves by exactly 1', 'that is what happens to a single count, not to the difference between two', 'slip'],
      ['It moves by 1 or by 2', 'both counts drop together in one case, so the difference can hold still', 'concept'],
      ['It can move by any amount at all', 'only three presses exist, and each does one fixed thing to the difference', 'concept'],
      ['It always moves by exactly 3', 'the circles-and-squares press leaves the difference completely alone', 'misread'],
      ['It halves, then rounds down', 'nothing here divides — every press adds and subtracts whole tokens', 'concept'],
    ]
    const gap = mcqNoted(rng, 'It stays put or moves by 3', rotate(seed, gapPool, 4))

    const parts: ItemPart[] = [
      {
        prompt:
          `Look at (number of circles) minus (number of squares). Right now that is ${counts[0]} − ${counts[1]} = ` +
          `${counts[0] - counts[1]}. After ONE press, what can have happened to it?`,
        answer: gap.answer,
        hints: [
          'There are only three presses to check. Work out all three.',
          'Circles with squares: both drop by one, so their difference does not move at all.',
          'Circles with triangles: circles drop 1 and squares gain 2, a move of 3. The third press moves it 3 the other way.',
        ],
        explanation:
          `Three presses, three effects. Circles with squares: both fall by one, so the difference is unchanged. ` +
          `Circles with triangles: circles −1 and squares +2, so the difference falls by 3. Squares with triangles: ` +
          `the mirror image, up by 3. So the difference only ever moves in steps of 3 — its remainder when divided ` +
          `by 3 is locked in from the start.`,
      },
      {
        prompt: `Can the machine be run until ALL ${total} tokens are ${TOKENS[ask]}?`,
        answer: mcq(rng, canDoAsked ? 'Yes — some order of presses does it' : 'No — the starting counts rule it out', [
          canDoAsked ? 'No — the starting counts rule it out' : 'Yes — some order of presses does it',
          'Yes, and every order of presses works',
          'No, because the total is not a multiple of 3',
        ]),
        hints: [
          `To finish with everything ${TOKENS[ask]}, the other two counts must both reach zero together.`,
          'Two counts reach zero together only if their difference is already 0 — so their difference must be a multiple of 3.',
          `Here the other two counts are ${counts[(ask + 1) % 3]} and ${counts[(ask + 2) % 3]}, a difference of ` +
            `${Math.abs(counts[(ask + 1) % 3] - counts[(ask + 2) % 3])}, which is ${Math.abs(counts[(ask + 1) % 3] - counts[(ask + 2) % 3]) % 3 === 0 ? 'a multiple of 3' : 'not a multiple of 3'}.`,
        ],
        explanation:
          `Ending with everything ${TOKENS[ask]} means the other two counts hit zero at the same moment, so their ` +
          `difference must be 0. That difference only moves in steps of 3, so it can only reach 0 if it starts as a ` +
          `multiple of 3. It starts at ${Math.abs(counts[(ask + 1) % 3] - counts[(ask + 2) % 3])}, ` +
          `which ${Math.abs(counts[(ask + 1) % 3] - counts[(ask + 2) % 3]) % 3 === 0 ? 'is' : 'is not'} — so the answer is ` +
          `**${canDoAsked ? 'yes' : 'no'}**. The total is untouched by every press, so it settles nothing.`,
      },
      {
        prompt: 'How many of the three token types could the whole pile end up as?',
        answer: numeric(reachableCount),
        hints: [
          'Run the same test for each of the three targets, not just the one you were asked about.',
          'Each target needs the OTHER two counts to differ by a multiple of 3.',
          `The three counts are ${counts[0]}, ${counts[1]} and ${counts[2]}; compare each pair in turn.`,
        ],
        explanation:
          `Check all three pairs. ` +
          `Circles and squares differ by ${Math.abs(counts[0] - counts[1])}, circles and triangles by ` +
          `${Math.abs(counts[0] - counts[2])}, squares and triangles by ${Math.abs(counts[1] - counts[2])}. ` +
          `Each pair that differs by a multiple of 3 unlocks one target, giving **${reachableCount}**. ` +
          `Answers of 0, 1 and 3 are all possible — 2 never is, because if two pairs match on remainders the third must too.`,
      },
    ]

    return {
      title: 'The swapping machine',
      prompt:
        `A machine holds **${counts[0]} circles**, **${counts[1]} squares** and **${counts[2]} triangles**.\n\n` +
        `Press the button and it takes two tokens of DIFFERENT types out and puts two tokens of the THIRD type in. ` +
        `(Feed it a circle and a square, and out come two triangles.) The total never changes.`,
      parts,
      distractorNotes: gap.distractorNotes,
      distractorTags: gap.distractorTags,
      hints: [
        'Do not chase orders of presses. Find the thing a press cannot change.',
        'Look at the DIFFERENCE between two of the counts and check what each of the three presses does to it.',
        'Every press leaves that difference alone or moves it by 3, so its remainder mod 3 is fixed forever.',
      ],
      explanation:
        `The counts themselves jump around, but the difference between any two of them only ever moves in steps of ` +
        `3. That remainder is fixed the moment the machine is loaded. Emptying two of the three types means their ` +
        `difference reaches 0, which is only possible when it starts as a multiple of 3 — so the starting counts ` +
        `decide the whole question before a single press. Finding the quantity the moves preserve is the fastest ` +
        `route through this kind of puzzle, and the only one that gives a proof rather than a failed search.`,
    }
  },
)

/** Every square a single-step diagonal mover can reach, by breadth-first search. */
export function diagonalReach(rows: number, cols: number, r0: number, c0: number): Set<number> {
  const key = (r: number, c: number) => r * 16 + c
  const seen = new Set<number>([key(r0, c0)])
  const stack: [number, number][] = [[r0, c0]]
  const steps: [number, number][] = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  while (stack.length) {
    const [r, c] = stack.pop()!
    for (const [dr, dc] of steps) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 1 || nr > rows || nc < 1 || nc > cols) continue
      if (seen.has(key(nr, nc))) continue
      seen.add(key(nr, nc))
      stack.push([nr, nc])
    }
  }
  return seen
}

const diagonalCounter = tpl(
  {
    id: 'zi-diagonal-reach',
    name: 'The diagonal counter',
    skillIds: ['z-invariant'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 24,
    minutes: 3,
    kind: 'multi',
    provenance:
      'Original — reachable squares come from a breadth-first search of the real move graph (diagonalReach); the parity argument is the explanation, not the key.',
  },
  (rng, seed) => {
    const rows = 5 + (seed % 2)
    const cols = 6 + (Math.floor(seed / 2) % 2)
    const r0 = 1 + (Math.floor(seed / 4) % rows)
    const c0 = 1 + ((seed * 5 + 1) % cols)
    const reach = diagonalReach(rows, cols, r0, c0)
    const key = (r: number, c: number) => r * 16 + c

    const all: [number, number][] = []
    for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) all.push([r, c])
    const offset = (seed * 11) % all.length
    const ordered = all.map((_, i) => all[(i + offset) % all.length])

    const good = ordered.find(([r, c]) => reach.has(key(r, c)) && !(r === r0 && c === c0))!
    const bad = ordered.filter(([r, c]) => !reach.has(key(r, c))).slice(0, 3)
    const label = ([r, c]: [number, number]) => `row ${r}, column ${c}`

    const invariantPool: Decoy[] = [
      ['Whether the row number is even', 'the row changes by one on every move, so its parity flips each time', 'concept'],
      ['How far the square is from a corner', 'distance changes constantly — it is not preserved by anything', 'concept'],
      ['Whether the column number is odd', 'the column also changes by one every move', 'concept'],
      ['The colour of the square in the corner', 'a fact about the board, not about the counter', 'misread'],
      ['The number of moves made so far', 'that is a count of the journey, not a property of the square', 'misread'],
    ]
    const invariant = mcqNoted(rng, 'Whether row + column is even', rotate(seed, invariantPool, 4))

    const parts: ItemPart[] = [
      {
        prompt: 'Which of these is the same for EVERY square the counter can ever stand on?',
        answer: invariant.answer,
        hints: [
          'One diagonal step changes the row by 1 and the column by 1, in some combination of directions.',
          'Add the two changes together: +1+1 = 2, +1−1 = 0, −1+1 = 0, −1−1 = −2.',
          'So row + column always moves by an even amount, and its odd/even status never changes.',
        ],
        explanation:
          `A diagonal step changes the row by ±1 and the column by ±1, so row + column changes by +2, 0 or −2 — ` +
          `always an even amount. Its odd/even status is therefore fixed for the whole journey. Row alone and ` +
          `column alone each flip parity every move, so neither is preserved.`,
      },
      {
        prompt: 'Exactly one of these squares can be reached from the start. Which one?',
        answer: mcq(rng, label(good), bad.map(label)),
        hints: [
          `The start is row ${r0}, column ${c0}, so row + column = ${r0 + c0}, which is ${(r0 + c0) % 2 === 0 ? 'even' : 'odd'}.`,
          'Test each square by adding its row and column and checking the odd/even status.',
          `Only ${label(good)} matches: ${good[0]} + ${good[1]} = ${good[0] + good[1]}.`,
        ],
        explanation:
          `Start: ${r0} + ${c0} = ${r0 + c0}, which is ${(r0 + c0) % 2 === 0 ? 'even' : 'odd'}. Only **${label(good)}** ` +
          `has a matching total (${good[0]} + ${good[1]} = ${good[0] + good[1]}), and a search of the whole board ` +
          `confirms every square with a matching total really is reachable on a board this size. ` +
          `One addition per square replaces hunting for routes.`,
      },
    ]

    return {
      title: 'The diagonal counter',
      prompt:
        `A counter sits on a grid of **${rows} rows** and **${cols} columns**, at **row ${r0}, column ${c0}**.\n\n` +
        `It may move one step diagonally in any of the four directions, as often as you like, and it must stay ` +
        `on the grid.`,
      parts,
      distractorNotes: invariant.distractorNotes,
      distractorTags: invariant.distractorTags,
      hints: [
        'Do not trace routes. Ask what one move cannot change.',
        'Track row + column across a single diagonal step.',
        'That total moves by 2, 0 or −2, so its odd/even status is fixed and it decides every question here.',
      ],
      explanation:
        `Row + column changes by an even amount on every diagonal step, so its odd/even status is an invariant. ` +
        `That single fact splits the whole board into two groups the counter can never cross between, which is ` +
        `far quicker than searching for routes. This is the same argument as the chessboard colouring in the ` +
        `domino puzzles: a bishop never leaves its colour for exactly this reason.`,
    }
  },
)

// ==================================================================== SEARCH

/** Fewest yes/no questions that GUARANTEE the answer among n possibilities. */
export function binaryQuestions(n: number): number {
  let q = 0
  let span = 1
  while (span < n) {
    span *= 2
    q++
  }
  return q
}

const halvingQuestions = tpl(
  {
    id: 'zs-halving',
    name: 'The best first question',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 20,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const n = 20 + 4 * seed
    const half = n / 2
    const worst = (k: number) => Math.max(k, n - k)
    const candidates = [half, n / 4, (3 * n) / 4, n - 3]
    // The key is COMPUTED: the split whose worse branch is smallest.
    let best = candidates[0]
    for (const k of candidates) if (worst(k) < worst(best)) best = k
    const question = (k: number) => `Is it bigger than ${k}?`

    const firstPool: Decoy[] = [
      [question(n / 4), 'a "no" leaves only a quarter, but a "yes" leaves three quarters — you are judged on the bad branch', 'strategy'],
      [question((3 * n) / 4), 'the mirror image of the same mistake: the bad branch still holds three quarters', 'strategy'],
      [question(n - 3), 'almost always a "no", which barely narrows anything — a likely answer is not an informative one', 'strategy'],
      [question(n / 4 + 1), 'still lopsided; shifting a bad split by one does not fix what is wrong with it', 'strategy'],
    ]
    const first = mcqNoted(rng, question(best), rotate(seed, firstPool, 3))

    const parts: ItemPart[] = [
      {
        prompt: 'Which first question guarantees the most, whatever the answer turns out to be?',
        answer: first.answer,
        hints: [
          'For each question, work out how many numbers survive a "yes" and how many survive a "no".',
          'You are graded on the WORSE of those two, because the answer is not yours to choose.',
          `Splitting at ${best} leaves ${worst(best)} either way; every other option leaves more on one side.`,
        ],
        explanation:
          `Asking "bigger than ${best}?" leaves ${best} numbers on a "no" and ${n - best} on a "yes" — ` +
          `**${worst(best)}** in the worst case. Splitting at ${n / 4} leaves ${worst(n / 4)} on the bad branch, and ` +
          `at ${n - 3} it leaves ${worst(n - 3)}. A question you can almost predict tells you almost nothing; the ` +
          `informative one is the one you genuinely cannot call.`,
      },
      {
        prompt: `How many questions do you need to be CERTAIN of the number, in the worst case?`,
        answer: numeric(binaryQuestions(n)),
        hints: [
          'Each answer is yes or no, so one question can split the possibilities into at most two groups.',
          `After q questions you can tell apart at most 2 to the power q different numbers, and you need ${n}.`,
          `Doubling from 1: 2, 4, 8, 16, … — count how many doublings it takes to reach ${n} or more.`,
        ],
        explanation:
          `Each question has two answers, so q questions can distinguish at most 2^q possibilities. ` +
          `You need 2^q ≥ ${n}, which first happens at q = **${binaryQuestions(n)}**. Halving every time actually ` +
          `achieves it, so that number is both the floor and the ceiling. Notice the shape of the argument: count ` +
          `how much a single answer can possibly tell you, and you get a limit that no cleverness beats.`,
      },
    ]

    return {
      title: 'The best first question',
      prompt:
        `I have picked a whole number from **1 to ${n}** and I will answer every question honestly.\n\n` +
        `You may only ask questions of the form: **Is it bigger than k?**`,
      parts,
      distractorNotes: first.distractorNotes,
      distractorTags: first.distractorTags,
      hints: [
        'Judge a question by its WORST outcome, not its luckiest one.',
        'Count how many numbers survive each of the two answers, then take the bigger count.',
        'The best question is the one where you cannot guess the answer — that is what makes it informative.',
      ],
      explanation:
        `A question is worth what it guarantees, not what it might get lucky with. Splitting the range down the ` +
        `middle leaves the same number of candidates whichever way the answer falls, so the worst case is as small ` +
        `as it can be — and repeating that gives ${binaryQuestions(n)} questions for ${n} numbers. Lopsided ` +
        `questions have a great best case and a terrible worst case, and you do not control which one you get.`,
    }
  },
)

/**
 * Exact worst-case weighings to find one heavy item among n, by DP.
 *
 * f(1) = 0; f(m) = 1 + min over pan sizes a of f(max(a, m − 2a)), because a
 * balance has three outcomes and the adversary picks the biggest surviving
 * group. Nothing here quotes ⌈log₃ n⌉ — it falls out.
 */
export function weighingsNeeded(n: number): number {
  const f = new Array<number>(Math.max(2, n + 1)).fill(0)
  for (let m = 2; m <= n; m++) {
    let best = Infinity
    for (let a = 1; a <= Math.floor(m / 2); a++) best = Math.min(best, f[Math.max(a, m - 2 * a)])
    f[m] = 1 + best
  }
  return f[n]
}

/** The pan size that leaves the smallest group still in play. */
export function bestPan(n: number): number {
  let best = 1
  for (let a = 2; a <= Math.floor(n / 2); a++) {
    if (Math.max(a, n - 2 * a) < Math.max(best, n - 2 * best)) best = a
  }
  return best
}

const balanceWeighings = tpl(
  {
    id: 'zs-weighings',
    name: 'One heavy jar',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 22,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — the weighing count comes from a dynamic program over group sizes (weighingsNeeded), so the answer is searched for rather than quoted from a log formula.',
  },
  (_rng, seed) => {
    const n = 9 + 3 * seed
    const third = n / 3
    const need = weighingsNeeded(n)
    const pan = bestPan(n)
    const left = Math.max(pan, n - 2 * pan)

    const parts: ItemPart[] = [
      {
        prompt: `How many jars go on EACH side of the balance for the best possible first weighing?`,
        answer: numeric(pan),
        hints: [
          'A balance has three possible results, not two: left heavier, right heavier, or level.',
          'So the first weighing splits the jars into three groups — the two pans and the ones set aside.',
          `To make the worst of those three as small as possible, make them equal: ${third} each.`,
        ],
        explanation:
          `A balance answers with three outcomes, so a weighing sorts the jars into three groups: left pan, right ` +
          `pan, and set aside. Whichever group the heavy jar is in, that is what you carry forward — so you want ` +
          `the biggest of the three to be as small as possible, and equal thirds do that. With ${pan} on each side, ` +
          `${n - 2 * pan} sit out and you are always left with ${left} candidates. Putting ${pan + 1} a side leaves ` +
          `${Math.max(pan + 1, n - 2 * (pan + 1))} in the worst case, which is worse.`,
      },
      {
        prompt: 'How many weighings do you need to be CERTAIN which jar is heavy, in the worst case?',
        answer: numeric(need),
        hints: [
          'Each weighing gives one of three results, so it can split the candidates into at most three groups.',
          `After w weighings you can tell apart at most 3 to the power w jars, and you have ${n}.`,
          `Tripling from 1: 3, 9, 27, 81, … — count the triplings needed to reach ${n} or more.`,
        ],
        explanation:
          `Each weighing has three outcomes, so w weighings can distinguish at most 3^w jars; you need 3^w ≥ ${n}, ` +
          `which first holds at w = **${need}**. Splitting into equal thirds actually reaches that, so ${need} is ` +
          `both the least you could hope for and the most you will ever need. The habit worth keeping: count the ` +
          `information one test can carry BEFORE you invent a procedure, and you learn what to aim at.`,
      },
    ]

    return {
      title: 'One heavy jar',
      prompt:
        `You have **${n} sealed jars**. All weigh the same except one, which is slightly heavier. ` +
        `You have a balance scale: put any jars on each side and it tells you which side is heavier, ` +
        `or that the two sides match.\n\n` +
        `You want a plan that always finds the heavy jar, however unlucky you are.`,
      parts,
      hints: [
        'Count how many different results one weighing can give. It is not two.',
        'Three results means the jars split into three groups, and you carry forward the group the heavy jar is in.',
        'Equal thirds make the worst of those three groups as small as it can be — repeat to the end.',
      ],
      explanation:
        `The whole family turns on a balance having THREE outcomes, not two. That makes a weighing worth up to ` +
        `three-way information, so equal thirds are the right split and ${need} weighings suffice for ${n} jars. ` +
        `A learner who splits in half is quietly throwing away a third of every test. Measuring what one test can ` +
        `possibly reveal, before designing the plan, is the move that generalises across this bucket.`,
    }
  },
)

/** Settings a two-sample plan can cover in k tests: 1 + 2 + … + k, built up by DP. */
export function twoSampleTests(n: number): number {
  let k = 0
  let cover = 0
  while (cover < n) {
    k++
    cover += k
  }
  return k
}

/** Worst-case tests when the first sample climbs in fixed jumps of s, then the second walks up. */
export function fixedStepWorst(n: number, s: number): number {
  let worst = 0
  for (let t = 1; t <= n + 1; t++) {
    let tests = 0
    let safe = 0
    let probe = s
    let broke = 0
    while (probe <= n) {
      tests++
      if (probe >= t) {
        broke = probe
        break
      }
      safe = probe
      probe += s
    }
    const top = broke ? broke - 1 : n
    for (let v = safe + 1; v <= top; v++) {
      tests++
      if (v >= t) break
    }
    if (tests > worst) worst = tests
  }
  return worst
}

const twoClips = tpl(
  {
    id: 'zs-two-samples',
    name: 'Two clips, one threshold',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: 20,
    minutes: 5,
    kind: 'multi',
    transfer: true,
    provenance:
      'Original — both counts are computed: the optimum from the two-sample coverage recurrence, the fixed-step figure by simulating every possible threshold.',
  },
  (rng, seed) => {
    const n = 25 + 5 * seed
    const step = 5 + (seed % 4) * 5
    const need = twoSampleTests(n)
    const stepWorst = fixedStepWorst(n, step)

    const whyPool: Decoy[] = [
      ['Because the middle setting is unlikely to break it', 'likelihood is irrelevant — you are planning against the worst case, not the average', 'strategy'],
      ['Because halving needs three or more samples', 'halving is fine with more samples; with two it is the walk afterwards that costs', 'concept'],
      ['Because the first probe should always be low', 'too low wastes tests when the clip survives, which is the other half of the trade', 'strategy'],
      ['Because a broken clip cannot be tested again at all', 'true but not the reason — the cost is the one-by-one walk it forces', 'misread'],
    ]
    const why = mcqNoted(rng, 'Because a break leaves a one-by-one walk', rotate(seed, whyPool, 3))

    const parts: ItemPart[] = [
      {
        prompt: 'What is the smallest number of tests that is GUARANTEED to find the exact threshold?',
        answer: numeric(need),
        hints: [
          'If the first clip breaks at setting v, the second clip has to walk upward one setting at a time.',
          'So each later probe must be a smaller jump than the one before — the first jump is the biggest.',
          `Jumps of k, then k−1, then k−2 … cover k + (k−1) + … + 1 settings. Find the smallest k covering ${n}.`,
        ],
        explanation:
          `Suppose your plan takes k tests. Probe first at setting k. If it breaks you must walk settings 1 to k−1 ` +
          `one at a time, which uses your remaining k−1 tests exactly. If it survives, you have k−1 tests left, so ` +
          `the next jump can only be k−1 — and so on. The settings covered are k + (k−1) + … + 1, and the smallest ` +
          `k with that total reaching ${n} is **${need}**. Every step of the plan is forced by what a break costs.`,
      },
      {
        prompt: `Someone instead climbs in fixed jumps of ${step}, then walks up one at a time from the last safe setting. How many tests does that need in the WORST case?`,
        answer: numeric(stepWorst),
        hints: [
          `Count the jumps first: probing ${step}, ${2 * step}, ${3 * step}, … up to ${n}.`,
          `Then add the walk, which is up to ${step - 1} more settings inside the block where it broke.`,
          'The worst case is whichever threshold makes those two costs add up highest — check the very top too.',
        ],
        explanation:
          `Fixed jumps of ${step} need up to ${Math.ceil(n / step)} probes to find the block, then up to ${step - 1} ` +
          `steps to walk it, giving **${stepWorst}** in the worst case against ${need} for the shrinking plan. ` +
          `Fixed jumps are fine on average and bad at the extremes, because the cost of the early probes and the ` +
          `cost of the walk are never balanced against each other.`,
      },
      {
        prompt: `Why does the best plan open at setting ${need} rather than halfway up, at about ${Math.floor(n / 2)}?`,
        answer: why.answer,
        hints: [
          'Ask what you are left holding if the very first test destroys a clip.',
          'One clip left means no more jumping: you must test every setting from the last safe one upward.',
          `Opening at ${Math.floor(n / 2)} would leave a walk of about ${Math.floor(n / 2) - 1} settings.`,
        ],
        explanation:
          `Halving only works when a failed probe still leaves you able to halve again. Here a break spends a clip, ` +
          `and the survivor can only be walked upward one setting at a time — so the first jump sets the size of ` +
          `the walk you might be forced into. Opening halfway leaves a walk of about ${Math.floor(n / 2) - 1} ` +
          `settings. The first probe has to be small enough that the walk it risks is affordable.`,
      },
    ]

    return {
      title: 'Two clips, one threshold',
      prompt:
        `A workshop is testing a new clip. There are **${n} weight settings**, numbered 1 to ${n}. A clip either ` +
        `survives a setting or is destroyed by it, and if it survives a setting it survives every lower one. ` +
        `The threshold is the lowest setting that destroys a clip.\n\n` +
        `You have exactly **two clips** and you must work out the threshold exactly. A destroyed clip is gone.`,
      parts,
      distractorNotes: why.distractorNotes,
      distractorTags: why.distractorTags,
      hints: [
        'Halving is not automatically right — it depends on what a failed test costs you.',
        'Here a failed test costs a clip, and one clip can only be walked upward one setting at a time.',
        'So the first jump must be small enough that the walk it might force still fits in your remaining tests.',
      ],
      explanation:
        `The best plan makes every branch cost the same: probe at ${need}, and whether the clip breaks (walk ` +
        `${need - 1} settings) or survives (jump ${need - 1} more, then ${need - 2}, …) the total is ${need}. ` +
        `That is why the jumps shrink. Compare it with fixed jumps of ${step}, which needs ${stepWorst}. ` +
        `The lesson is about the cost of a failed test: halving is the right move only when failing is cheap, and ` +
        `when it is expensive the first probe must be tuned to what failure forces you into.`,
    }
  },
)

/** Every unordered triple from the pool summing to the target. */
export function triplesSummingTo(pool: number[], target: number): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      for (let k = j + 1; k < pool.length; k++) {
        if (pool[i] + pool[j] + pool[k] === target) out.push([pool[i], pool[j], pool[k]])
      }
    }
  }
  return out
}

const pruneBranch = tpl(
  {
    id: 'zs-prune-branch',
    name: 'Kill the branch early',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 20,
    minutes: 4,
    kind: 'multi',
  },
  (rng, _seed) => {
    // Two-digit values only, so every option string is the same length.
    const build = (): { pool: number[]; target: number; anchor: number; dead: number; live: number[] } | null => {
      const pool: number[] = []
      while (pool.length < 8) {
        const v = rint(rng, 11, 48)
        if (!pool.includes(v)) pool.push(v)
      }
      pool.sort((a, b) => a - b)
      const seeds = triplesSummingTo(pool, pool[0] + pool[3] + pool[6])
      if (!seeds.length) return null
      const target = pool[0] + pool[3] + pool[6]
      for (const anchor of shuffle(rng, pool)) {
        if (!seeds.some((t) => t.includes(anchor))) continue
        const rest = pool.filter((v) => v !== anchor)
        const live = rest.filter((b) => rest.some((c) => c !== b && anchor + b + c === target))
        const dead = rest.filter((b) => !live.includes(b))
        if (live.length >= 3 && dead.length >= 1) {
          return { pool, target, anchor, dead: shuffle(rng, dead)[0], live: shuffle(rng, live).slice(0, 3) }
        }
      }
      return null
    }

    let found: ReturnType<typeof build> = null
    for (let attempt = 0; attempt < 200 && !found; attempt++) found = build()
    if (!found) {
      const pool = [12, 14, 16, 18, 20, 22, 24, 26]
      const target = 54
      const rest = pool.filter((v) => v !== 12)
      const live = rest.filter((b) => rest.some((c) => c !== b && 12 + b + c === target))
      const dead = rest.filter((b) => !live.includes(b))
      found = { pool, target, anchor: 12, dead: dead[0], live: live.slice(0, 3) }
    }
    const { pool, target, anchor, dead, live } = found
    const solutions = triplesSummingTo(pool, target)

    const branch = mcqNoted(
      rng,
      String(dead),
      live.map<Decoy>((b) => [
        String(b),
        `${anchor} + ${b} leaves ${target - anchor - b}, which IS in the list — this branch is still alive`,
        'strategy',
      ]),
    )

    const parts: ItemPart[] = [
      {
        prompt:
          `You have fixed **${anchor}** as your first number. Which of these can be ruled out as the second number ` +
          `straight away, without checking any third number?`,
        answer: branch.answer,
        hints: [
          'You do not need to test third numbers one by one. Subtract instead.',
          `Once you pick ${anchor} and a second number b, the third is forced: it must be ${target} − ${anchor} − b.`,
          'So the branch dies the moment that forced value is not on the list.',
        ],
        explanation:
          `Fixing two numbers forces the third: it has to be ${target} − ${anchor} − b. For **${dead}** that comes ` +
          `to ${target - anchor - dead}, which is not in the list, so the whole branch is dead before you look at a ` +
          `single third number. The others all leave a value that IS on the list. This is what pruning means: ` +
          `compute what the rest of the branch would need, and if it is impossible, delete the branch.`,
      },
      {
        prompt: `How many different sets of three numbers from the list add up to ${target}?`,
        answer: numeric(solutions.length),
        hints: [
          'Go in order. Fix the smallest number of the set first, then the middle one.',
          'For each pair you fix, the third is forced — so you never have to try third numbers at all.',
          'Working smallest-first stops you counting the same set twice in a different order.',
        ],
        explanation:
          `Working smallest-first and letting the third number be forced gives **${solutions.length}**: ` +
          `${solutions.map(([a, b, c]) => `${a} + ${b} + ${c}`).join('; ')}. Fixing the smallest first means each ` +
          `set is met exactly once, so ordering the search does two jobs at once — it prunes, and it stops you ` +
          `double-counting.`,
      },
    ]

    return {
      title: 'Kill the branch early',
      prompt:
        `From this list, choose **three different numbers** that add up to **${target}**:\n\n` +
        `**${pool.join(', ')}**`,
      parts,
      distractorNotes: branch.distractorNotes,
      distractorTags: branch.distractorTags,
      hints: [
        'Do not test every third number. Work out what it would have to be.',
        'Two chosen numbers force the third exactly, by subtraction.',
        'If that forced value is not on the list, the branch is dead and everything below it can be skipped.',
      ],
      explanation:
        `A search gets fast when a single check kills many possibilities at once. Here, fixing two numbers forces ` +
        `the third by subtraction, so one subtraction settles a whole branch instead of a run of trials. Ordering ` +
        `the search smallest-first also stops duplicates appearing. Both moves are the same idea: arrange the work ` +
        `so that each step you take rules out as much as possible.`,
    }
  },
)

// -------------------------------------------------- which filter first

/** Every 4-digit code over the digits 1-5, built once. */
const CODES: number[][] = (() => {
  const out: number[][] = []
  for (let a = 1; a <= 5; a++)
    for (let b = 1; b <= 5; b++)
      for (let c = 1; c <= 5; c++)
        for (let d = 1; d <= 5; d++) out.push([a, b, c, d])
  return out
})()

interface Clue {
  text: string
  ok: (code: number[]) => boolean
}

function sumClue(s: number): Clue {
  return { text: `The four digits add up to ${s}.`, ok: (c) => c[0] + c[1] + c[2] + c[3] === s }
}

const FIXED_CLUES: Clue[] = [
  { text: 'No digit is used more than once.', ok: (c) => new Set(c).size === 4 },
  { text: 'The first digit beats the last one.', ok: (c) => c[0] > c[3] },
  { text: 'Exactly two of the digits are odd.', ok: (c) => c.filter((d) => d % 2 === 1).length === 2 },
  { text: 'The code reads the same backwards.', ok: (c) => c[0] === c[3] && c[1] === c[2] },
  { text: 'The digits never fall, left to right.', ok: (c) => c[0] <= c[1] && c[1] <= c[2] && c[2] <= c[3] },
  { text: 'No two neighbouring digits match.', ok: (c) => c[0] !== c[1] && c[1] !== c[2] && c[2] !== c[3] },
  { text: 'The second digit is one above the first.', ok: (c) => c[1] === c[0] + 1 },
  { text: 'Exactly one digit is a 5 or a 4.', ok: (c) => c.filter((d) => d >= 4).length === 1 },
]

const filterFirst = tpl(
  {
    id: 'zs-filter-order',
    name: 'Which clue first?',
    skillIds: ['z-search'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 18,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — survivor counts are measured by filtering all 625 codes, and the trio is resampled until the most restrictive clue is unique.',
  },
  (rng, _seed) => {
    const build = (): { clues: Clue[]; counts: number[]; both: number } | null => {
      const s = rint(rng, 6, 19)
      const others = shuffle(rng, FIXED_CLUES).slice(0, 3)
      const clues = shuffle(rng, [sumClue(s), ...others])
      const counts = clues.map((cl) => CODES.filter((c) => cl.ok(c)).length)
      const min = Math.min(...counts)
      if (counts.filter((v) => v === min).length !== 1) return null
      if (min === 0) return null
      const both = CODES.filter((c) => clues.every((cl) => cl.ok(c))).length
      if (both < 1 || both > 10) return null
      return { clues, counts, both }
    }

    let found: ReturnType<typeof build> = null
    for (let attempt = 0; attempt < 400 && !found; attempt++) found = build()
    if (!found) {
      const clues = [sumClue(8), FIXED_CLUES[3], FIXED_CLUES[1], FIXED_CLUES[2]]
      const counts = clues.map((cl) => CODES.filter((c) => cl.ok(c)).length)
      found = { clues, counts, both: CODES.filter((c) => clues.every((cl) => cl.ok(c))).length }
    }
    const { clues, counts, both } = found
    const tightest = counts.indexOf(Math.min(...counts))

    const parts: ItemPart[] = [
      {
        prompt:
          'Applied on its own, one of these clues leaves fewer codes standing than any of the others. ' +
          'Type its number (1, 2, 3 or 4).',
        answer: numeric(tightest + 1),
        hints: [
          'Do not check clues in the order they are written. Estimate how many codes each one keeps.',
          'A clue that forces two digits to equal two others is far tighter than one that only compares two digits.',
          `Rough sizes here: ${clues.map((_cl, i) => `clue ${i + 1} keeps ${counts[i]}`).join(', ')}.`,
        ],
        explanation:
          `Clue ${tightest + 1} ("${clues[tightest].text}") keeps only ${counts[tightest]} of the ${CODES.length} codes; ` +
          `the others keep ${counts.filter((_, i) => i !== tightest).join(', ')}. Applying it first means every later ` +
          `clue is checked against a much smaller pile. Order matters enormously in search even though the final ` +
          `answer does not depend on it — the same reason a database applies its most selective filter first.`,
      },
      {
        prompt: 'How many codes satisfy ALL FOUR clues at once?',
        answer: numeric(both),
        hints: [
          `Start from the tightest clue (clue ${tightest + 1}) and write down only those codes.`,
          'Then run each remaining clue over that short list and cross out as you go.',
          'You should never need to look at a code that failed an earlier clue.',
        ],
        explanation:
          `Starting from clue ${tightest + 1}'s ${counts[tightest]} survivors and filtering with the rest leaves ` +
          `**${both}**. Starting from the loosest clue instead would have you examining hundreds of codes to reach ` +
          `the same answer. The result is order-independent; the WORK is not.`,
      },
    ]

    return {
      title: 'Which clue first?',
      prompt:
        `A code has **four digits**, each from **1 to 5**, and digits may repeat — ${CODES.length} codes in all. ` +
        `Four clues are true of the code:\n\n` +
        clues.map((cl, i) => `${i + 1}. ${cl.text}`).join('\n'),
      parts,
      hints: [
        'Before checking anything, ask which clue throws away the most codes.',
        'A clue that pins several digits at once is tighter than one that only compares a pair.',
        'Apply the tightest clue first, then filter the short list that survives.',
      ],
      explanation:
        `Every clue must hold in the end, so the order you apply them cannot change the answer — but it changes the ` +
        `work by a factor of ten or more. Applying the most restrictive clue first means every later check runs over ` +
        `a short list. That is the whole of "order the possibilities so that checking one kills many", and it is ` +
        `the same instinct behind starting a logic grid with the clue that names a single pairing outright.`,
    }
  },
)

// =================================================================== EXTREMAL

const COLOURS = ['red', 'blue', 'green', 'yellow', 'purple'] as const

const drawerGuarantee = tpl(
  {
    id: 'ze-drawer-guarantee',
    name: 'Reaching in blind',
    skillIds: ['z-extremal'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 24,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const nc = 3 + (seed % 3)
    const counts = Array.from({ length: nc }, (_, i) => 4 + ((seed * (2 * i + 3)) % 10))
    const total = counts.reduce((a, b) => a + b, 0)
    const goal = Math.floor(seed / 3) % 3
    const target = seed % nc

    // Each answer is the worst case the drawer can force, plus one.
    const unlucky =
      goal === 0
        ? counts.reduce((a, c) => a + Math.min(1, c), 0)
        : goal === 1
          ? counts.reduce((a, c) => a + Math.min(2, c), 0)
          : total - counts[target]
    const need = unlucky + 1
    const ask =
      goal === 0
        ? 'two counters of the same colour'
        : goal === 1
          ? 'three counters of the same colour'
          : `at least one ${COLOURS[target]} counter`

    const worstPool: Decoy[] = [
      ['Assume the counters come out in a random order', 'a guarantee cannot rest on luck; random is not the worst case', 'concept'],
      ['Assume the counters come out in the order they went in', 'you cannot see inside, so no order is promised to you either way', 'misread'],
      ['Assume the rarest colour always comes out first', 'the unhelpful colours are not the rare ones — check which ones delay you', 'strategy'],
      ['Assume every colour appears before any colour repeats', 'true for the first goal only, and it is a special case of the real rule', 'strategy'],
    ]
    const worst = mcqNoted(rng, 'Assume the least helpful counters come out first', rotate(seed, worstPool, 3))

    const parts: ItemPart[] = [
      {
        prompt: `How many counters must you take out to be CERTAIN of having ${ask}?`,
        answer: numeric(need),
        hints: [
          'Imagine the unluckiest possible run: what is the longest you could go without succeeding?',
          goal === 2
            ? `Every counter that is not ${COLOURS[target]} delays you, and there are ${total - counts[target]} of those.`
            : goal === 1
              ? 'You could hold two of every colour and still not have three of any one.'
              : 'You could hold one of every colour and still have no pair.',
          `That unluckiest run reaches ${unlucky} counters, and the very next one has to finish the job.`,
        ],
        explanation:
          `The longest unlucky run gives you ${unlucky} counters ` +
          (goal === 2
            ? `— every one of the ${total - counts[target]} counters that is not ${COLOURS[target]}. `
            : goal === 1
              ? `— two of each colour, since ${counts.map((c) => Math.min(2, c)).join(' + ')} = ${unlucky}. `
              : `— one of each colour, since there are ${nc} colours. `) +
          `The next counter cannot extend it, so **${need}** is guaranteed. Taking ${unlucky} is not enough: that ` +
          `exact unlucky run is genuinely possible, which is what makes ${need} the smallest safe answer.`,
      },
      {
        prompt: 'What is the right way to think about a question like this?',
        answer: worst.answer,
        hints: [
          'A guarantee has to survive the worst case, so imagine an opponent handing you counters on purpose.',
          'They would hand over everything that does not help you, for as long as they can.',
          'Count that run, then add one.',
        ],
        explanation:
          `Picture someone choosing which counter you get, trying to delay you as long as possible. They hand over ` +
          `every counter that does not finish the job — that run is the extreme case, and one more counter after it ` +
          `must succeed. Any argument based on likely orders answers a different question, because "certain" means ` +
          `certain against the worst arrangement, not the usual one.`,
      },
    ]

    return {
      title: 'Reaching in blind',
      prompt:
        `A drawer holds counters in ${nc} colours, all mixed together:\n\n` +
        counts.map((c, i) => `- ${c} ${COLOURS[i]}`).join('\n') +
        `\n\nYou reach in without looking and take counters out one at a time. You cannot see what you are taking.`,
      parts,
      distractorNotes: worst.distractorNotes,
      distractorTags: worst.distractorTags,
      hints: [
        '"Certain" means it must work even on the unluckiest possible run.',
        'Build that unlucky run on purpose: keep taking counters that do NOT finish the job.',
        'Count how long that run can last, then add one.',
      ],
      explanation:
        `Certainty is decided at the extreme, not on average. Build the longest run that still fails, count it, and ` +
        `add one — that is both an upper bound (the next counter must work) and a lower bound (the run itself really ` +
        `can happen), which is why the answer is exact rather than an estimate. The same move settles the "some ` +
        `shelf must hold" family from the other direction.`,
    }
  },
)

// -------------------------------------------------- forced position

const QUEUE_NAMES = ['Rhea', 'Tobi', 'Ines', 'Mila', 'Odin', 'Suri', 'Kaya', 'Nils', 'Bram', 'Zora'] as const

export type QueueClue =
  | { kind: 'before'; a: number; b: number }
  | { kind: 'adjacent'; a: number; b: number }
  | { kind: 'notAt'; a: number; slot: number }

export function clueHolds(order: number[], clue: QueueClue): boolean {
  const pos = new Array<number>(order.length)
  order.forEach((who, i) => (pos[who] = i))
  if (clue.kind === 'before') return pos[clue.a] < pos[clue.b]
  if (clue.kind === 'adjacent') return pos[clue.b] === pos[clue.a] + 1
  return pos[clue.a] !== clue.slot
}

export function permutations(n: number): number[][] {
  const out: number[][] = []
  const cur: number[] = []
  const used = new Array<boolean>(n).fill(false)
  const rec = () => {
    if (cur.length === n) {
      out.push([...cur])
      return
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      used[i] = true
      cur.push(i)
      rec()
      cur.pop()
      used[i] = false
    }
  }
  rec()
  return out
}

const ALL_ORDERS_5 = permutations(5)

const forcedPosition = tpl(
  {
    id: 'ze-forced-end',
    name: 'Who is stuck at the end',
    skillIds: ['z-extremal'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 20,
    minutes: 5,
    kind: 'multi',
    provenance:
      'Original — clue sets are generated against a hidden order and then pruned; the forced position and the count of valid orders are found by enumerating all 120 arrangements.',
  },
  (rng, seed) => {
    const names = shuffle(rng, [...QUEUE_NAMES]).slice(0, 5)
    const askEnd = seed % 2 === 0

    const clueText = (c: QueueClue): string =>
      c.kind === 'before'
        ? `${names[c.a]} is somewhere ahead of ${names[c.b]}.`
        : c.kind === 'adjacent'
          ? `${names[c.a]} stands directly ahead of ${names[c.b]}.`
          : `${names[c.a]} is not in position ${c.slot + 1}.`

    const build = (): { clues: QueueClue[]; valid: number[][]; who: number } | null => {
      const hidden = shuffle(rng, [0, 1, 2, 3, 4])
      const pool: QueueClue[] = []
      for (let a = 0; a < 5; a++) {
        for (let b = 0; b < 5; b++) {
          if (a === b) continue
          pool.push({ kind: 'before', a, b })
          pool.push({ kind: 'adjacent', a, b })
        }
        for (let slot = 0; slot < 5; slot++) pool.push({ kind: 'notAt', a, slot })
      }
      const truthy = shuffle(
        rng,
        pool.filter((c) => clueHolds(hidden, c)),
      )
      let valid = ALL_ORDERS_5
      const chosen: QueueClue[] = []
      for (const c of truthy) {
        const next = valid.filter((o) => clueHolds(o, c))
        if (next.length === valid.length) continue
        chosen.push(c)
        valid = next
        if (valid.length <= 6) break
      }
      if (valid.length < 2 || chosen.length < 3) return null
      // Prune any clue the puzzle no longer needs.
      for (let i = chosen.length - 1; i >= 0; i--) {
        const without = chosen.filter((_, j) => j !== i)
        if (without.length < 3) continue
        const still = ALL_ORDERS_5.filter((o) => without.every((c) => clueHolds(o, c)))
        if (still.length === valid.length) chosen.splice(i, 1)
      }
      const slot = askEnd ? 4 : 0
      const set = new Set(valid.map((o) => o[slot]))
      if (set.size !== 1) return null
      return { clues: chosen, valid, who: valid[0][slot] }
    }

    let found: ReturnType<typeof build> = null
    for (let attempt = 0; attempt < 80 && !found; attempt++) found = build()
    if (!found) {
      // Guaranteed fallback: everyone is ahead of one person, so that person is pinned.
      const pinned = 4
      const clues: QueueClue[] = [0, 1, 2, 3].map((a) => ({ kind: 'before', a, b: pinned }) as QueueClue)
      const valid = ALL_ORDERS_5.filter((o) => clues.every((c) => clueHolds(o, c)))
      found = { clues, valid, who: valid[0][4] }
    }
    const { clues, valid, who } = found
    const place = askEnd ? 'at the very back' : 'at the very front'

    const parts: ItemPart[] = [
      {
        prompt: `Who must be ${place} of the queue?`,
        answer: mcq(
          rng,
          names[who],
          names.filter((_, i) => i !== who),
        ),
        hints: [
          'Do not try to solve the whole queue. Ask only about the one position you were asked about.',
          askEnd
            ? 'Anyone who has someone standing behind them cannot be at the back — cross them off.'
            : 'Anyone who has someone standing ahead of them cannot be at the front — cross them off.',
          'Whoever survives that sweep is forced into the position, and nothing else needs solving.',
        ],
        explanation:
          `**${names[who]}.** ` +
          (askEnd
            ? `Every clue that puts someone ahead of another person eliminates the first from the back of the queue. `
            : `Every clue that puts someone behind another person eliminates them from the front of the queue. `) +
          `Sweeping the clues that way leaves exactly one candidate, so the extreme position is settled without ` +
          `working out anybody else's place — and once it is fixed, the rest of the queue is much more constrained.`,
      },
      {
        prompt: 'How many different queues satisfy every clue?',
        answer: numeric(valid.length),
        hints: [
          'Start from the position you just pinned down — it is the one place you already know.',
          'Work outward from there, applying the clue that mentions the fewest free people next.',
          'Count the arrangements that survive, and do not forget that two clues can leave a genuine choice open.',
        ],
        explanation:
          `Exactly **${valid.length}** queues satisfy all ${clues.length} clues. Fixing the forced position first ` +
          `shrinks the count enormously — from 120 arrangements to 24 before any other clue is even read. That is ` +
          `the payoff of the extremal move: the thing that is forced is also the thing that constrains the most.`,
      },
    ]

    return {
      title: 'Who is stuck at the end',
      prompt:
        `Five people — **${names.join(', ')}** — stand in a single queue, positions 1 (front) to 5 (back). ` +
        `All of these are true:\n\n` +
        clues.map((c) => `- ${clueText(c)}`).join('\n'),
      parts,
      hints: [
        'Do not build the queue from the front. Go straight for the position that is most constrained.',
        'A person with someone behind them cannot be last; a person with someone ahead cannot be first.',
        'One sweep of the clues usually leaves a single survivor for an end position.',
      ],
      explanation:
        `The two ends are the most constrained places in any ordering, because every "ahead of" clue rules someone ` +
        `out of one of them. Settling an end first turns a five-way puzzle into a four-way one and often cascades ` +
        `from there. Reaching for the extreme element first is the same habit that makes corner cells the right ` +
        `opening move in the assembly puzzles in this bucket.`,
    }
  },
)

/** Shortest possible finishing time, by exhaustive assignment with symmetry pruning. */
export function minMakespan(jobs: number[], machines: number): number {
  const sorted = [...jobs].sort((a, b) => b - a)
  const loads = new Array<number>(machines).fill(0)
  let best = sorted.reduce((a, b) => a + b, 0)
  const rec = (i: number) => {
    if (i === sorted.length) {
      best = Math.min(best, Math.max(...loads))
      return
    }
    const seen = new Set<number>()
    for (let m = 0; m < machines; m++) {
      if (seen.has(loads[m])) continue
      seen.add(loads[m])
      if (loads[m] + sorted[i] >= best) continue
      loads[m] += sorted[i]
      rec(i + 1)
      loads[m] -= sorted[i]
    }
  }
  rec(0)
  return best
}

const benchSchedule = tpl(
  {
    id: 'ze-longest-task',
    name: 'The longest task rules',
    skillIds: ['z-extremal'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: 20,
    minutes: 5,
    kind: 'multi',
    transfer: true,
    provenance:
      'Original — the shortest finishing time is found by exhaustive assignment (minMakespan) with symmetry pruning, so the bound is never assumed to be reachable.',
  },
  (rng, seed) => {
    const machines = 2 + (seed % 2)
    const jobCount = 5 + (Math.floor(seed / 2) % 2)
    const wantGap = seed % 3 === 0

    let jobs: number[] = []
    let optimum = 0
    let bound = 0
    for (let attempt = 0; attempt < 80; attempt++) {
      jobs = Array.from({ length: jobCount }, () => rint(rng, 3, 17))
      const total = jobs.reduce((a, b) => a + b, 0)
      bound = Math.max(Math.max(...jobs), ceilDiv(total, machines))
      optimum = minMakespan(jobs, machines)
      if (wantGap === optimum > bound) break
    }
    const total = jobs.reduce((a, b) => a + b, 0)
    const longest = Math.max(...jobs)
    const spread = ceilDiv(total, machines)

    const parts: ItemPart[] = [
      {
        prompt:
          'Before trying any arrangement at all: what is the shortest finishing time you can already rule out ' +
          'going below?',
        answer: numeric(bound),
        hints: [
          'Two separate facts force a floor. Find both, then take whichever is larger.',
          `One task alone runs for ${longest} minutes and cannot be split, so nothing finishes before ${longest}.`,
          `And ${total} minutes of work across ${machines} benches means some bench carries at least ${spread}.`,
        ],
        explanation:
          `Two floors. The longest single task takes ${longest} minutes and cannot be cut up, so no schedule beats ` +
          `${longest}. And ${total} minutes shared over ${machines} benches means some bench carries at least ` +
          `${spread}. The real floor is the larger, **${bound}**. Both come from an extreme: the biggest single ` +
          `item, and the busiest bench.`,
      },
      {
        prompt: 'Now find the real answer: what is the shortest finishing time any arrangement achieves?',
        answer: numeric(optimum),
        hints: [
          'Place the longest task first and build the rest around it — it has the fewest ways to fit.',
          `Aim at ${bound} and see whether the remaining tasks can be packed to reach it.`,
          optimum === bound
            ? 'They can here, so the floor is achieved exactly.'
            : `They cannot here, so push the target up one minute at a time until an arrangement exists.`,
        ],
        explanation:
          `The best achievable finish is **${optimum}** minutes. ` +
          (optimum === bound
            ? `The floor is reached exactly, which is the usual case: place the longest task first and the rest packs around it.`
            : `That is ${optimum - bound} more than the floor of ${bound} — the leftover tasks simply cannot be split to fill the benches evenly. ` +
              `A bound tells you where to stop looking downward; it never promises the value is reachable, and treating it as the answer is the standard mistake here.`),
      },
    ]

    return {
      title: 'The longest task rules',
      prompt:
        `**${jobCount} tasks** must be shared between **${machines} identical workbenches**. Each task runs on one ` +
        `bench from start to finish and cannot be split; the benches all work at the same time, and everything ` +
        `starts at once.\n\n` +
        `Task lengths in minutes: **${jobs.join(', ')}**.`,
      parts,
      hints: [
        'Look for what is forced before you try to arrange anything.',
        'The single longest task fixes a floor on its own, and so does the total shared across the benches.',
        'Take the larger of the two floors, then see whether an arrangement actually reaches it.',
      ],
      explanation:
        `Two extremes give the floor: no schedule can beat the longest single task (${longest}), and none can beat ` +
        `the total spread evenly (${spread}). The larger, ${bound}, is where the search starts — and the best ` +
        `arrangement here finishes in ${optimum}. Working out what is forced before searching is what turns a ` +
        `guessing game into a short check, and it also tells you when to stop: once you hit the floor, you are done.`,
    }
  },
)

// =================================================================== SEQUENCES

export type Terms = number[]

const diffs = (t: Terms): number[] => t.slice(1).map((v, i) => v - t[i])
const allEqual = (xs: number[]): boolean => xs.length > 0 && xs.every((v) => v === xs[0])

export function fitsArithmetic(t: Terms): boolean {
  return t.length >= 3 && allEqual(diffs(t))
}
export function fitsGeometric(t: Terms): boolean {
  if (t.length < 3 || t.some((v) => v === 0) || t[1] === t[0]) return false
  for (let i = 1; i < t.length - 1; i++) {
    if (t[i + 1] * t[i - 1] !== t[i] * t[i]) return false
  }
  return true
}
export function fitsQuadratic(t: Terms): boolean {
  if (t.length < 4) return false
  const second = diffs(diffs(t))
  return allEqual(second) && second[0] !== 0
}
export function fitsAlternating(t: Terms): boolean {
  if (t.length < 5 || fitsArithmetic(t)) return false
  const odd = t.filter((_, i) => i % 2 === 0)
  const even = t.filter((_, i) => i % 2 === 1)
  return odd.length >= 3 && even.length >= 3 && allEqual(diffs(odd)) && allEqual(diffs(even))
}

const RULE_MENU =
  'Exactly one of these four rules fits every number shown:\n\n' +
  '- add the same amount each time\n' +
  '- multiply by the same amount each time\n' +
  '- add an amount that itself grows by a fixed step\n' +
  '- alternate two rules, one for the 1st, 3rd, 5th … and one for the 2nd, 4th, 6th …'

const nextTerm = tpl(
  {
    id: 'zq-next-term',
    name: 'What comes next',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 1,
    variants: 24,
    minutes: 3,
    provenance:
      'Original — the generator checks all four candidate rule families against the shown terms and only ships a sequence when exactly one fits, so "the next number" is genuinely determined.',
  },
  (rng, seed) => {
    const kind = seed % 4
    let terms: Terms = []
    for (let attempt = 0; attempt < 200; attempt++) {
      const t: Terms = []
      if (kind === 0) {
        const a = rint(rng, 2, 12)
        const d = rint(rng, 2, 9)
        for (let n = 0; n < 7; n++) t.push(a + d * n)
      } else if (kind === 1) {
        const r = rint(rng, 2, 3)
        const a = r === 3 ? rint(rng, 1, 3) : rint(rng, 2, 6)
        let v = a
        for (let n = 0; n < 7; n++) {
          t.push(v)
          v *= r
        }
      } else if (kind === 2) {
        let v = rint(rng, 1, 10)
        let gap = rint(rng, 1, 8)
        const step = rint(rng, 1, 5)
        for (let n = 0; n < 7; n++) {
          t.push(v)
          v += gap
          gap += step
        }
      } else {
        const o1 = rint(rng, 2, 12)
        const e1 = rint(rng, 3, 15)
        const dOdd = rint(rng, 2, 8)
        const dEven = rint(rng, 2, 8)
        for (let n = 0; n < 7; n++) {
          t.push(n % 2 === 0 ? o1 + dOdd * (n / 2) : e1 + dEven * ((n - 1) / 2))
        }
      }
      const shown = t.slice(0, 6)
      const fits = [fitsArithmetic(shown), fitsGeometric(shown), fitsQuadratic(shown), fitsAlternating(shown)]
      if (fits.filter(Boolean).length === 1 && fits[kind]) {
        terms = t
        break
      }
    }
    if (!terms.length) {
      terms = [4, 9, 14, 19, 24, 29, 34]
    }
    const shown = terms.slice(0, 6)
    const answer = terms[6]

    return {
      title: 'What comes next',
      prompt:
        `${RULE_MENU}\n\n**${shown.join(', ')}, …**\n\n` +
        `What is the next number?`,
      answer: numeric(answer),
      hints: [
        'Write the gaps between neighbouring numbers underneath them. Most rules show up there first.',
        'Constant gaps mean the first rule. Gaps that grow by a fixed step mean the third.',
        'If the gaps swing up and down, look at every other number instead — that is the fourth rule.',
      ],
      explanation:
        `**${answer}.** The gaps are ${diffs(shown).join(', ')}, which settles which of the four rules is running. ` +
        `The menu matters more than it looks: without it, more than one rule always fits any finite run of numbers, ` +
        `so "the next number" would not have a single right answer. Naming the family of rules in advance is what ` +
        `makes the question honest — and it is exactly what you have to do for yourself when nobody supplies a menu.`,
    }
  },
)

// -------------------------------------------------- rule survives the check?

interface Proposal {
  text: string
  terms: Terms
}

const ruleCheck = tpl(
  {
    id: 'zq-check-the-rule',
    name: 'Does the rule survive?',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 2,
    variants: 20,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — the first mismatch between the true sequence and the proposed rule is found by comparing computed term lists, never asserted.',
  },
  (rng, seed) => {
    const a = 3 + (seed % 7)
    const d = 2 + (seed % 6)
    const shape = seed % 4

    const truth: Terms = []
    for (let n = 0; n < 6; n++) truth.push(a + d * n)

    let proposal: Proposal
    if (shape === 3) {
      // A different DESCRIPTION of the same sequence: it survives every check.
      const c = a - d
      proposal = {
        text: c >= 0
          ? `Multiply the position number by ${d}, then add ${c}.`
          : `Multiply the position number by ${d}, then take away ${-c}.`,
        terms: truth.map((_, i) => d * (i + 1) + c),
      }
    } else {
      // Rule changes gear once the value reaches a threshold, placed to break at 4, 5 or 6.
      const breakAt = 4 + shape
      const limit = truth[breakAt - 2]
      const d2 = d + 1 + (seed % 3)
      const t: Terms = [a]
      for (let n = 1; n < 6; n++) t.push(t[n - 1] + (t[n - 1] < limit ? d : d2))
      proposal = {
        text: `Add ${d} each time while the number is below ${limit}; from then on add ${d2} each time.`,
        terms: t,
      }
    }

    let firstBreak = 0
    for (let i = 0; i < 6; i++) {
      if (truth[i] !== proposal.terms[i]) {
        firstBreak = i + 1
        break
      }
    }
    const verdict = firstBreak === 0 ? 'It matches every number shown' : `It goes wrong at the ${firstBreak}th number`
    const options = [4, 5, 6]
      .filter((p) => p !== firstBreak)
      .map((p) => `It goes wrong at the ${p}th number`)
    if (firstBreak !== 0) options.push('It matches every number shown')

    const parts: ItemPart[] = [
      {
        prompt: 'Test the proposed rule against every number shown. Where does it first disagree?',
        answer: mcq(rng, verdict, options),
        hints: [
          'The proposal was built to match the first few numbers, so checking those proves nothing.',
          'Work the proposed rule forward yourself and write its numbers under the real ones.',
          `The proposal gives ${proposal.terms.join(', ')}.`,
        ],
        explanation:
          `The proposal produces ${proposal.terms.join(', ')} against the real ${truth.join(', ')}, so ` +
          (firstBreak === 0
            ? `it matches everywhere — this is a genuine restatement of the same rule, not a rival to it. `
            : `it first disagrees at the ${firstBreak}th number. `) +
          `The early terms could never have settled it: they are the terms the proposal was fitted to.`,
      },
      {
        prompt: 'What number does the PROPOSED rule give at position 6?',
        answer: numeric(proposal.terms[5]),
        hints: [
          'Run the proposed rule from the start, one step at a time — do not read off the real sequence.',
          `Position 1 is ${proposal.terms[0]}, and each step follows the proposal exactly.`,
          `Its numbers are ${proposal.terms.slice(0, 5).join(', ')}, then one more step.`,
        ],
        explanation:
          `Following the proposal all the way gives **${proposal.terms[5]}** at position 6, against ${truth[5]} in ` +
          `the real sequence. Writing out the rival prediction is what makes a check possible at all — a rule you ` +
          `have not turned into a number cannot be tested.`,
      },
    ]

    return {
      title: 'Does the rule survive?',
      prompt:
        `A sequence begins:\n\n**${truth.join(', ')}, …**\n\n` +
        `Someone looked at the first three numbers and proposed this rule:\n\n` +
        `**${proposal.text}**`,
      parts,
      hints: [
        'A rule that fits the numbers used to invent it has passed no test at all.',
        'Generate the proposal\'s own numbers and lay them beside the real ones.',
        'The first position where they differ is the check that actually carried information.',
      ],
      explanation:
        `The proposal was built from the first three numbers, so agreeing with those three is guaranteed and worth ` +
        `nothing. The only informative comparisons are at positions the rule did not see. ` +
        (firstBreak === 0
          ? `Here it survives them, which is real evidence — though still not proof, since a later term could break it.`
          : `Here it fails at position ${firstBreak}, and one disagreement is enough to kill it outright.`) +
        ` Fit is cheap; survival on unseen cases is what counts.`,
    }
  },
)

// -------------------------------------------------- twin rules

interface TwinPair {
  a: { text: string; terms: Terms }
  b: { text: string; terms: Terms }
}

function twinPair(seed: number, rng: Rng): TwinPair {
  const shape = seed % 4
  const build = (n: number, f: (i: number) => number): Terms => Array.from({ length: n }, (_, i) => f(i))
  if (shape === 0) {
    const a = rint(rng, 2, 9)
    return {
      a: { text: 'Double the number before it', terms: build(7, (i) => a * 2 ** i) },
      b: {
        text: `Add ${a}, then ${2 * a}, then ${3 * a}, and so on`,
        terms: build(7, (i) => a + (a * i * (i + 1)) / 2),
      },
    }
  }
  if (shape === 1) {
    const a = rint(rng, 2, 9)
    const fib: Terms = [a, 2 * a]
    while (fib.length < 7) fib.push(fib[fib.length - 1] + fib[fib.length - 2])
    return {
      a: { text: 'Add the same amount each time', terms: build(7, (i) => a * (i + 1)) },
      b: { text: 'Add the two numbers before it', terms: fib },
    }
  }
  if (shape === 2) {
    const a = rint(rng, 1, 4)
    return {
      a: { text: 'Triple the number before it', terms: build(7, (i) => a * 3 ** i) },
      b: {
        text: `The gaps grow by ${4 * a}, starting at ${2 * a}`,
        terms: build(7, (i) => a + 2 * a * i + 2 * a * i * (i - 1)),
      },
    }
  }
  const start = rint(rng, 3, 12)
  const g = rint(rng, 2, 6)
  return {
    a: {
      text: `Add ${g}, then ${2 * g}, then ${3 * g}, and so on`,
      terms: build(7, (i) => start + (g * i * (i + 1)) / 2),
    },
    b: { text: 'Each gap is double the one before', terms: build(7, (i) => start + g * (2 ** i - 1)) },
  }
}

const twinRules = tpl(
  {
    id: 'zq-twin-rules',
    name: 'Two rules, one sequence',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 24,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — every offered rule is evaluated against the shown terms and the item only ships when exactly one of them reproduces all six.',
  },
  (rng, seed) => {
    const pair = twinPair(seed, rng)
    const trueRule = seed % 2 === 0 ? pair.a : pair.b
    const twin = seed % 2 === 0 ? pair.b : pair.a
    const shown = trueRule.terms.slice(0, 6)
    const matches = (t: Terms) => shown.every((v, i) => v === t[i])

    const longDecoys: { text: string; terms: Terms }[] = [
      {
        text: 'Square the position number, then add the first term',
        terms: shown.map((_, i) => (i + 1) * (i + 1) + shown[0]),
      },
      {
        text: 'Multiply by 3, then take away the position number',
        terms: (() => {
          const t = [shown[0]]
          for (let i = 1; i < 6; i++) t.push(t[i - 1] * 3 - (i + 1))
          return t
        })(),
      },
      {
        text: 'Add the position number, then double what you get',
        terms: (() => {
          const t = [shown[0]]
          for (let i = 1; i < 6; i++) t.push((t[i - 1] + i + 1) * 2)
          return t
        })(),
      },
    ]
    const usable = longDecoys.filter((d) => !matches(d.terms))
    const picked = rotate(seed, usable.length >= 2 ? usable : longDecoys.slice(0, 2), 2)

    const rule = mcqNoted(rng, trueRule.text, [
      [twin.text, 'this one agrees with the first three numbers exactly, and then quietly parts company', 'inference'],
      ...picked.map<Decoy>((d) => [d.text, 'this one does not even reproduce the early numbers — check the second term', 'slip']),
    ])

    const parts: ItemPart[] = [
      {
        prompt: 'Which rule produces EVERY number shown?',
        answer: rule.answer,
        hints: [
          'Two of these agree on the first three numbers, so testing those three cannot separate them.',
          'Run each candidate forward to the 4th number and compare there instead.',
          `The 4th number is ${shown[3]}; only one rule produces it.`,
        ],
        explanation:
          `**${trueRule.text}.** The tempting rival, "${twin.text}", gives ` +
          `${twin.terms.slice(0, 6).join(', ')} — identical for three terms and then different. ` +
          `Terms 1 to 3 could never have chosen between them, which is why checking beyond the terms you used ` +
          `is not a formality.`,
      },
      {
        prompt: 'What is the next number in the sequence?',
        answer: numeric(trueRule.terms[6]),
        hints: [
          'Use the rule you just identified, not the pattern you first suspected.',
          `The sixth number is ${shown[5]}; apply the rule once more.`,
          `Following "${trueRule.text}" from ${shown[5]} gives the answer.`,
        ],
        explanation:
          `Continuing "${trueRule.text}" gives **${trueRule.terms[6]}**. The rival rule would have given ` +
          `${twin.terms[6]} instead — a large difference that grew out of a three-term agreement, which is how ` +
          `an unchecked rule turns into a badly wrong prediction.`,
      },
    ]

    return {
      title: 'Two rules, one sequence',
      prompt: `A sequence begins:\n\n**${shown.join(', ')}, …**`,
      parts,
      distractorNotes: rule.distractorNotes,
      distractorTags: rule.distractorTags,
      hints: [
        'Do not stop at the first rule that explains the opening numbers.',
        'Two of the options agree for the first three terms, so those terms decide nothing.',
        'Test each candidate at the 4th number, where they part company.',
      ],
      explanation:
        `Two of these rules agree for three terms and then diverge. Anyone who spots a rule from the first three ` +
        `numbers and stops there has a 50-50 guess dressed up as an answer. The fix is mechanical: turn each ` +
        `candidate into numbers and compare on the terms you did NOT use to find it. Sequences are the cleanest ` +
        `place to practise that, because you can see exactly where two rules split.`,
    }
  },
)

// -------------------------------------------------- formula and nth term

const nthTerm = tpl(
  {
    id: 'zq-nth-term',
    name: 'Jump to the 20th term',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 3,
    variants: 24,
    minutes: 4,
    kind: 'multi',
    provenance:
      'Original — each candidate formula is evaluated against every shown term and the item only ships when exactly one reproduces all of them.',
  },
  (rng, seed) => {
    const quadratic = seed % 2 === 1
    const p = rint(rng, 3, 8)
    const q = rint(rng, 12, 28)
    const far = 18 + (seed % 8)
    const value = (n: number) => (quadratic ? n * n + p * n + q : p * n + q)
    const shown = Array.from({ length: 5 }, (_, i) => value(i + 1))

    const key = quadratic ? `n² + ${p}n + ${q}` : `${p}n + ${q}`
    const decoys = quadratic
      ? [
          { text: `n² + ${p + 1}n + ${q}`, f: (n: number) => n * n + (p + 1) * n + q },
          { text: `n² + ${p}n + ${q + 1}`, f: (n: number) => n * n + p * n + q + 1 },
          { text: `n² − ${p}n + ${q}`, f: (n: number) => n * n - p * n + q },
          { text: `2n² + ${p}n + ${q}`, f: (n: number) => 2 * n * n + p * n + q },
        ]
      : [
          { text: `${p + 1}n + ${q}`, f: (n: number) => (p + 1) * n + q },
          { text: `${p}n + ${q + 1}`, f: (n: number) => p * n + q + 1 },
          { text: `${p}n − ${q}`, f: (n: number) => p * n - q },
          { text: `${p}n² + ${q}`, f: (n: number) => p * n * n + q },
        ]
    const wrong = decoys.filter((d) => !shown.every((v, i) => v === d.f(i + 1)))

    const formula = mcqNoted(
      rng,
      key,
      rotate(seed, wrong, Math.min(4, wrong.length)).map<Decoy>((d) => [
        d.text,
        `check it at n = 1: this gives ${d.f(1)} where the sequence starts at ${shown[0]}`,
        'slip',
      ]),
    )

    const parts: ItemPart[] = [
      {
        prompt: 'Which formula gives every term shown, with n being the position number?',
        answer: formula.answer,
        hints: [
          'Test each formula at n = 1 first. Most candidates die immediately.',
          'Then test any survivor at n = 2 as well — one term is never enough to confirm a formula.',
          `The 1st term is ${shown[0]} and the 2nd is ${shown[1]}.`,
        ],
        explanation:
          `**${key}.** Substituting n = 1 gives ${value(1)} and n = 2 gives ${value(2)}, matching the sequence, and ` +
          `it keeps matching through n = 5. Testing at a single position is not enough: several of these formulas ` +
          `agree somewhere, and only one agrees everywhere.`,
      },
      {
        prompt: `What is the ${far}th term?`,
        answer: numeric(value(far)),
        hints: [
          'You do not need to write out every term in between.',
          `Put n = ${far} straight into the formula you just chose.`,
          quadratic ? `Work out ${far} × ${far} first, then the rest.` : `Work out ${p} × ${far} first, then add ${q}.`,
        ],
        explanation:
          `Substituting n = ${far} gives **${value(far)}**. This is what a closed formula buys you: a position-based ` +
          `rule reaches any term in one step, while a step-by-step rule has to walk there. Both describe the same ` +
          `sequence, so it is worth being able to move between them.`,
      },
    ]

    return {
      title: 'Jump to the 20th term',
      prompt:
        `The first five terms of a sequence are:\n\n**${shown.join(', ')}**\n\n` +
        `They are the 1st, 2nd, 3rd, 4th and 5th terms in order.`,
      parts,
      distractorNotes: formula.distractorNotes,
      distractorTags: formula.distractorTags,
      hints: [
        'Test the formulas rather than deriving one — substitution is faster and harder to get wrong.',
        'Start at n = 1, which kills most of the options in one line.',
        'Confirm any survivor at a second position before you trust it.',
      ],
      explanation:
        `A formula in the position number reaches any term directly, so the ${far}th costs the same as the 2nd. ` +
        `Finding it by testing candidates is deliberate: substitution is quick, mechanical, and it forces you to ` +
        `check more than one position — which is the habit that separates a rule that fits from a rule that holds.`,
    }
  },
)

// -------------------------------------------------- what would separate them

const separatingTest = tpl(
  {
    id: 'zq-separate',
    name: 'What would tell them apart',
    skillIds: ['z-sequence'],
    bucket: 'puzzle',
    difficulty: 4,
    variants: 20,
    minutes: 5,
    kind: 'multi',
    transfer: true,
    provenance:
      'Original — both rules are generated as full term lists and the separating position is found by comparing them, so the shown terms are exactly the ones on which the two rules agree.',
  },
  (rng, seed) => {
    const a = 3 + (seed % 7)
    const d = 2 + (seed % 6)
    const target = 4 + (seed % 5)
    const doubles = Math.floor(seed / 5) % 2 === 0
    const d2 = d + 1 + (seed % 3)

    const termsA: Terms = Array.from({ length: 10 }, (_, i) => a + d * i)
    const limit = termsA[target - 2]
    const termsB: Terms = [a]
    for (let n = 1; n < 10; n++) {
      const prev = termsB[n - 1]
      termsB.push(prev < limit ? prev + d : doubles ? prev * 2 : prev + d2)
    }
    const ruleBText = doubles
      ? `Add ${d} each time while the number is below ${limit}; from then on double it.`
      : `Add ${d} each time while the number is below ${limit}; from then on add ${d2}.`

    let split = 10
    for (let i = 0; i < 10; i++) {
      if (termsA[i] !== termsB[i]) {
        split = i + 1
        break
      }
    }
    const shown = termsA.slice(0, split - 1)

    const settlePool: Decoy[] = [
      ['Rule A is now proved to be the right one', 'surviving a test is not proof — a later term could still break it', 'inference'],
      ['Both rules are still in play', 'they gave different predictions there, so one of them is definitely gone', 'concept'],
      ['Nothing has been settled by that check', 'a check where the rules disagree is exactly the check that settles something', 'concept'],
      ['The sequence must follow some third rule instead', 'nothing here points at a third rule; one of the two was ruled out, not both', 'inference'],
    ]
    const settle = mcqNoted(rng, 'Rule B is out; Rule A has survived', rotate(seed, settlePool, 3))

    const parts: ItemPart[] = [
      {
        prompt: 'At which position do the two rules first give DIFFERENT numbers?',
        answer: numeric(split),
        hints: [
          'Write out what each rule gives, position by position, past the numbers you were shown.',
          `Rule B behaves exactly like Rule A until the value reaches ${limit}.`,
          `Rule A reaches ${limit} at position ${target - 1}, so the very next step is where they part.`,
        ],
        explanation:
          `Rule B copies Rule A while the value stays below ${limit}. Rule A hits ${limit} at position ${target - 1}, ` +
          `so position **${split}** is the first place they can differ — and they do: ${termsA[split - 1]} against ` +
          `${termsB[split - 1]}. Finding that position is the whole job; everything before it is wasted effort.`,
      },
      {
        prompt: `What number does Rule A give at position ${split}?`,
        answer: numeric(termsA[split - 1]),
        hints: [
          'Rule A never changes gear — it adds the same amount all the way through.',
          `The ${split - 1}th term is ${termsA[split - 2]}.`,
          `Add ${d} once more.`,
        ],
        explanation:
          `Rule A gives **${termsA[split - 1]}** and Rule B gives ${termsB[split - 1]}. Writing both predictions ` +
          `down BEFORE looking is what makes the check worth anything: a prediction made afterwards can always be ` +
          `bent to fit whatever turned up.`,
      },
      {
        prompt:
          `You look up that term and it turns out to be exactly ${termsA[split - 1]}, the number Rule A predicted. ` +
          `What has that settled?`,
        answer: settle.answer,
        hints: [
          'Ask what each rule predicted, then which prediction the observation contradicts.',
          'Rule B predicted a different number, so Rule B is finished.',
          'Rule A agreed with the observation — but agreeing is not the same as being proved.',
        ],
        explanation:
          `Rule B predicted ${termsB[split - 1]} and the term is ${termsA[split - 1]}, so Rule B is dead. Rule A ` +
          `survived, which is genuine evidence and not proof: some third rule could match everything so far and ` +
          `break later. A test can eliminate cleanly and can only ever support, never confirm — which is why you ` +
          `keep testing where rules disagree rather than where they agree.`,
      },
    ]

    return {
      title: 'What would tell them apart',
      prompt:
        `Two rules have been suggested for the same sequence. The numbers known so far are:\n\n` +
        `**${shown.join(', ')}, …**\n\n` +
        `**Rule A:** Add ${d} each time.\n\n` +
        `**Rule B:** ${ruleBText}\n\n` +
        `Both rules produce exactly the numbers above.`,
      parts,
      distractorNotes: settle.distractorNotes,
      distractorTags: settle.distractorTags,
      hints: [
        'Checking a term the two rules agree on tells you nothing, however many you check.',
        'Work both rules forward until their predictions come apart.',
        'The first position where they disagree is the only observation worth paying for.',
      ],
      explanation:
        `Both rules fit everything seen so far, so more of the same data is worthless — the useful observation is ` +
        `the first one where they disagree, at position ${split}. Then the result eliminates one of them outright. ` +
        `Notice what it does NOT do: the survivor is supported, not proved, because some untested rule could still ` +
        `match everything so far. Looking for the case that would separate two explanations, rather than the case ` +
        `that would confirm your favourite, is the move worth taking out of this bucket.`,
    }
  },
)

// ===================================================================== export

export const SEARCH_TEMPLATES: ItemTemplate[] = [
  // z-invariant
  jarParity,
  dominoColouring,
  tokenMachine,
  diagonalCounter,
  // z-search
  halvingQuestions,
  balanceWeighings,
  twoClips,
  pruneBranch,
  filterFirst,
  // z-extremal
  drawerGuarantee,
  forcedPosition,
  benchSchedule,
  // z-sequence
  nextTerm,
  ruleCheck,
  twinRules,
  nthTerm,
  separatingTest,
]
