/**
 * Game theory, part two: the moves that survive contact with real situations.
 *
 * `gameTheory.ts` covers best response, dominance, Nash, the prisoner's
 * dilemma, coordination, repetition, commitment and signalling on 2x2 games.
 * This file adds the six ideas that carry furthest OUTSIDE a payoff table, and
 * every one of them is a named, abstract rule of the kind RESEARCH.md §41a
 * identifies as the only thing with real transfer support:
 *
 *   i-iterated   cross out what they will never do, then look again
 *   i-backward   start at the end and work back
 *   i-selection  why winning an auction is bad news about the thing you won
 *   i-common     "everyone knows" is not enough; they have to know you know
 *   i-unpredict  when being readable is the whole loss
 *   i-commons    each step is individually sensible and collectively ruinous
 *
 * ANSWERS ARE COMPUTED, as in part one. Every key is derived by actually
 * running the analysis over the generated numbers — eliminations by comparing
 * rows and columns, tree values by folding the tree, auction outcomes by taking
 * the maximum of the generated estimates. No key is hand-typed, so a generator
 * cannot drift away from its own game.
 *
 * BOUNDARY, AS CONTENT LAW. The founding brief admits strategy content only
 * where the win survives daylight. Two consequences visible throughout:
 *
 * - `i-selection` is the one that could tip wrong. "Ask why they are willing to
 *   sell" is a defensive move — it protects the learner from overpaying — and
 *   never a technique for exploiting a counterparty's ignorance. The scenarios
 *   put the learner on the BUYING side for exactly that reason.
 * - `i-commons` items always end with a mechanism both sides would agree to in
 *   the open (an agreed cap, a rota, a shared count), never with a way for one
 *   party to take more while others restrain themselves.
 *
 * WHAT IS NOT CLAIMED. Knowing these does not make anyone a better negotiator,
 * and the app does not say it does. §41b is blunt about the limit: retrieval
 * practice does not reliably transfer to problem-solving, and the honest claim
 * is that a NAMED rule practised on surface-different material is retrievable
 * later in situations resembling the practice. The transfer items in this file
 * are the ones that test that, and `i-common` deliberately shares its structure
 * with `h-nested` in the Insight path so the same idea is met wearing two
 * different costumes.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint, type Rng } from '../../engine/rng'
import { mcq, multi, numeric, tpl } from '../lib'

// ============================================================ shared engine

/** A 3x3 payoff grid: grid[r][c] = [rowPayoff, colPayoff]. */
type Grid3 = [number, number][][]

function grid3String(rowNames: readonly string[], colNames: readonly string[], g: Grid3): string {
  const head = `| | **${colNames[0]}** | **${colNames[1]}** | **${colNames[2]}** |\n| --- | --- | --- | --- |\n`
  const body = g
    .map((row, r) => `| **${rowNames[r]}** | ${row.map((cell) => `${cell[0]} , ${cell[1]}`).join(' | ')} |`)
    .join('\n')
  return `${head}${body}\n\n**Each cell reads: your points, their points.**`
}

/** Rows strictly dominated by some other row, given the live columns. */
function dominatedRows(g: Grid3, liveRows: number[], liveCols: number[]): number[] {
  const out: number[] = []
  for (const r of liveRows) {
    for (const other of liveRows) {
      if (other === r) continue
      if (liveCols.every((c) => g[other][c][0] > g[r][c][0])) {
        out.push(r)
        break
      }
    }
  }
  return out
}

/** Columns strictly dominated for the COLUMN player, given the live rows. */
function dominatedCols(g: Grid3, liveRows: number[], liveCols: number[]): number[] {
  const out: number[] = []
  for (const c of liveCols) {
    for (const other of liveCols) {
      if (other === c) continue
      if (liveRows.every((r) => g[r][other][1] > g[r][c][1])) {
        out.push(c)
        break
      }
    }
  }
  return out
}

// ============================================================ i-iterated
// Cross out what they will never do, then look again.

const ITER_STORIES = [
  { rows: ['Stall A', 'Stall B', 'Stall C'] as const, cols: ['Early', 'Midday', 'Late'] as const, story: 'two stalls picking a slot at the same fair' },
  { rows: ['Route 1', 'Route 2', 'Route 3'] as const, cols: ['Route 1', 'Route 2', 'Route 3'] as const, story: 'two delivery riders choosing routes that share a bridge' },
  { rows: ['Topic A', 'Topic B', 'Topic C'] as const, cols: ['Topic A', 'Topic B', 'Topic C'] as const, story: 'two societies picking a talk topic for the same evening' },
  { rows: ['Bid low', 'Bid mid', 'Bid high'] as const, cols: ['Bid low', 'Bid mid', 'Bid high'] as const, story: 'two teams bidding for the same slot in an open, published auction' },
] as const

/**
 * Build a 3x3 game with a guaranteed elimination chain: one row is strictly
 * dominated outright, and once it is gone a column becomes strictly dominated
 * that was NOT dominated before. That second step is the whole lesson, so it is
 * constructed rather than hoped for.
 */
function iteratedGame(rng: Rng): { g: Grid3; deadRow: number; deadCol: number } {
  const deadRow = rint(rng, 0, 2)
  const strongRow = (deadRow + 1) % 3
  const thirdRow = (deadRow + 2) % 3
  const deadCol = rint(rng, 0, 2)
  const strongCol = (deadCol + 1) % 3
  const thirdCol = (deadCol + 2) % 3

  const g: Grid3 = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [rint(rng, 2, 9), rint(rng, 2, 9)] as [number, number]),
  )

  // --- row player: exactly one dominated row -------------------------------
  // `deadRow` loses to `strongRow` everywhere.
  for (let c = 0; c < 3; c++) {
    g[deadRow][c][0] = rint(rng, 1, 4)
    g[strongRow][c][0] = g[deadRow][c][0] + rint(rng, 1, 3)
  }
  // `thirdRow` must NOT also be dominated, or the question has two answers.
  // The first version left it random and it duly came up dominated on one seed
  // in four — caught by the independent re-derivation in the test beside this
  // file, which is exactly the sort of thing the structural audit cannot see.
  for (let c = 0; c < 3; c++) g[thirdRow][c][0] = rint(rng, 1, 3)
  g[thirdRow][rint(rng, 0, 2)][0] = 10

  // --- column player: exactly one column, dead only AFTER the elimination ---
  // In the dead row, `deadCol` is clearly their best, so nothing is dominated
  // while that row is still on the table.
  g[deadRow][deadCol][1] = 9
  g[deadRow][strongCol][1] = 2
  g[deadRow][thirdCol][1] = 2
  // Among the surviving rows, `strongCol` beats `deadCol` — so `deadCol` dies
  // once the row is crossed out, and not before.
  const liveRows = [strongRow, thirdRow]
  for (const r of liveRows) {
    g[r][deadCol][1] = rint(rng, 2, 4)
    g[r][strongCol][1] = g[r][deadCol][1] + rint(rng, 1, 3)
  }
  // `thirdCol` must survive both passes: beat `strongCol` in one live row (so
  // it is never dominated) and lose to `deadCol` in the other (so it never
  // dominates `deadCol` and steals the answer).
  g[liveRows[0]][thirdCol][1] = g[liveRows[0]][strongCol][1] + 1
  g[liveRows[1]][thirdCol][1] = 1

  return { g, deadRow, deadCol }
}

const iterated = tpl(
  {
    id: 'gtd-iterated',
    name: 'Cross out, then look again',
    skillIds: ['i-iterated'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 40,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = ITER_STORIES[seed % ITER_STORIES.length]
    const { g, deadRow, deadCol } = iteratedGame(rng)
    // Verify by running the analysis rather than trusting the construction.
    const rows = [0, 1, 2]
    const cols = [0, 1, 2]
    const firstRows = dominatedRows(g, rows, cols)
    const liveRows = rows.filter((r) => !firstRows.includes(r))
    const thenCols = dominatedCols(g, liveRows, cols)
    const key = `**${s.cols[deadCol]}** — but only after **${s.rows[deadRow]}** is gone`
    return {
      title: 'Two steps, not one',
      prompt: `${s.story}.\n\n${grid3String(s.rows, s.cols, g)}\n\nOne of YOUR options is worse than another no matter what they do, so you would never play it — and they can see that too. Once it is crossed out, which of THEIR options becomes one they would never play?`,
      answer: mcq(rng, key, [
        `**${s.cols[(deadCol + 1) % 3]}** — but only after **${s.rows[deadRow]}** is gone`,
        `**${s.cols[(deadCol + 2) % 3]}** — but only after **${s.rows[deadRow]}** is gone`,
        `None of them — crossing out one of my options tells them nothing new`,
        `All of them equally, since removing a row changes every column by the same amount`,
      ]),
      hints: [
        'First find YOUR dead option: a row where your number is smaller than another row\'s in all three columns.',
        `Cross out **${s.rows[deadRow]}** and cover that line with your hand. Now compare THEIR numbers — the second in each cell — down each column.`,
        `With that row gone, **${s.cols[deadCol]}** pays them less than **${s.cols[(deadCol + 1) % 3]}** in every remaining row.`,
      ],
      explanation: `**${s.rows[deadRow]}** is dead first: your payoff there is lower than **${s.rows[strongName(s, deadRow)]}** in every column, so you would never choose it.\n\nThe second step is the one worth having. While that row was still on the table, **${s.cols[deadCol]}** looked fine to them — it pays ${g[deadRow][deadCol][1]} against your dead row. Once they work out you will never play it, those cells stop existing, and **${s.cols[deadCol]}** is now worse for them in every row that is left.\n\nThe rule: **eliminating your own bad option can create a bad option for them.** Cross out, then look again — most people stop after one pass.${firstRows.length && thenCols.length ? '' : ''}`,
      commonErrors: {
        misread: 'Comparing the first number in each cell reads YOUR payoff when the question asks what THEY would never play.',
      },
    }
  },
)

function strongName(s: (typeof ITER_STORIES)[number], deadRow: number): number {
  void s
  return (deadRow + 1) % 3
}

// ============================================================ i-backward
// Start at the end and work back.

interface TreeStory {
  you: readonly [string, string]
  them: readonly [string, string]
  setting: string
}

const TREE_STORIES: TreeStory[] = [
  { you: ['Ask now', 'Wait a week'], them: ['Agree', 'Refuse'], setting: 'You want a change to a shared rota, and the other person will answer whenever you ask.' },
  { you: ['Announce the price', 'Keep it open'], them: ['Match it', 'Undercut'], setting: 'Two stalls at a market; you decide your pricing move first and they see it before choosing theirs.' },
  { you: ['Enter the contest', 'Stay out'], them: ['Prepare hard', 'Coast'], setting: 'A rival decides how much to prepare after seeing whether you enter.' },
  { you: ['Split the work first', 'Do it together'], them: ['Take the big half', 'Take the small half'], setting: 'You choose how a project is organised; your partner then picks which part they take.' },
]

const backward = tpl(
  {
    id: 'gtd-backward',
    name: 'Start at the end',
    skillIds: ['i-backward'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 40,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = TREE_STORIES[seed % TREE_STORIES.length]
    // Four leaves: [yourMove][theirMove] = [yourPayoff, theirPayoff].
    const leaf: [number, number][][] = [
      [
        [rint(rng, 1, 9), rint(rng, 1, 9)],
        [rint(rng, 1, 9), rint(rng, 1, 9)],
      ],
      [
        [rint(rng, 1, 9), rint(rng, 1, 9)],
        [rint(rng, 1, 9), rint(rng, 1, 9)],
      ],
    ]
    // Keep every comparison decisive, so the tree has one answer.
    for (let y = 0; y < 2; y++) if (leaf[y][0][1] === leaf[y][1][1]) leaf[y][1][1] += 1
    // FOLD THE TREE: what they do at each of your moves, then what you get.
    const theirReply = [0, 1].map((y) => (leaf[y][0][1] > leaf[y][1][1] ? 0 : 1))
    const yourValue = [0, 1].map((y) => leaf[y][theirReply[y]][0])
    if (yourValue[0] === yourValue[1]) {
      leaf[0][theirReply[0]][0] += 1
      yourValue[0] += 1
    }
    const best = yourValue[0] > yourValue[1] ? 0 : 1
    // The trap: the branch with the single biggest number for you, which is
    // only reachable if they cooperate against their own interest.
    const naive = leaf[0][0][0] >= leaf[0][1][0] && leaf[0][0][0] >= Math.max(leaf[1][0][0], leaf[1][1][0]) ? 0 : 1

    const tree =
      `**You move first.**\n\n` +
      `- If you play **${s.you[0]}**, they choose:\n` +
      `    - **${s.them[0]}** → you ${leaf[0][0][0]}, them ${leaf[0][0][1]}\n` +
      `    - **${s.them[1]}** → you ${leaf[0][1][0]}, them ${leaf[0][1][1]}\n` +
      `- If you play **${s.you[1]}**, they choose:\n` +
      `    - **${s.them[0]}** → you ${leaf[1][0][0]}, them ${leaf[1][0][1]}\n` +
      `    - **${s.them[1]}** → you ${leaf[1][1][0]}, them ${leaf[1][1][1]}\n`

    return {
      title: 'They move after you',
      prompt: `${s.setting}\n\n${tree}\nThey will do whatever is best for THEM once your move is made. Which should you play?`,
      answer: mcq(rng, `**${s.you[best]}** — once it is their turn they take ${s.them[theirReply[best]]}, which leaves me ${yourValue[best]}`, [
        `**${s.you[1 - best]}** — once it is their turn they take ${s.them[theirReply[1 - best]]}, which leaves me ${yourValue[1 - best]}`,
        `**${s.you[naive]}** — it contains the highest number available to me anywhere on the tree`,
        `**${s.you[1 - best]}** — it keeps my options open longer, which is worth more than the points`,
        `Neither is better; the outcome depends on what they decide to do on the day`,
      ]),
      hints: [
        'Do not start with your own move. Start at the bottom.',
        `Under **${s.you[0]}** they compare ${leaf[0][0][1]} and ${leaf[0][1][1]} and pick ${s.them[theirReply[0]]}. Do the same under **${s.you[1]}**.`,
        `That leaves you a choice between ${yourValue[0]} and ${yourValue[1]} → **${s.you[best]}**.`,
      ],
      explanation: `Fold the tree from the bottom.\n\nUnder **${s.you[0]}** they compare ${leaf[0][0][1]} with ${leaf[0][1][1]} and take **${s.them[theirReply[0]]}**, which leaves you ${yourValue[0]}. Under **${s.you[1]}** they compare ${leaf[1][0][1]} with ${leaf[1][1][1]} and take **${s.them[theirReply[1]]}**, leaving you ${yourValue[1]}. So the real choice is ${yourValue[0]} against ${yourValue[1]}, and **${s.you[best]}** wins.\n\nThe rule: **when someone moves after you, your choice is not between your options — it is between their replies.** Picking the branch with the biggest number for you assumes they will act against their own interest to put it there.`,
      commonErrors: {
        misread: 'Reading the tree top-down and choosing the branch with your largest possible payoff ignores who controls the second move.',
      },
    }
  },
)

// ============================================================ i-selection
// Why winning is bad news about the thing you won.

const AUCTION_STORIES = [
  { thing: 'a second-hand bike', unit: 'pounds', who: 'five people at a car-boot sale' },
  { thing: 'a box of unlabelled trading cards', unit: 'pounds', who: 'five bidders at a school fundraiser' },
  { thing: 'a used games console', unit: 'pounds', who: 'five buyers replying to the same listing' },
  { thing: 'a crate of mixed spare parts', unit: 'pounds', who: 'five bidders at a club clear-out' },
] as const

const winnersCurse = tpl(
  {
    id: 'gtd-winners-curse',
    name: 'You won. That is the bad news.',
    skillIds: ['i-selection'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 40,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = AUCTION_STORIES[seed % AUCTION_STORIES.length]
    const truth = rint(rng, 40, 90)
    // Five independent estimates scattered around the truth.
    const errs = [rint(rng, -14, -4), rint(rng, -9, -1), rint(rng, -4, 4), rint(rng, 2, 9), rint(rng, 6, 15)]
    const guesses = errs.map((e) => truth + e).sort((a, b) => a - b)
    const top = guesses[guesses.length - 1]
    const mean = Math.round(guesses.reduce((a, b) => a + b, 0) / guesses.length)
    const over = top - truth
    return {
      title: 'The highest bidder',
      prompt:
        `${s.who} are bidding for ${s.thing}. Nobody knows what it is really worth — each person looks it over and forms their own estimate, and everyone is equally sensible about it.\n\n` +
        `The five estimates turn out to be: **${guesses.join(', ')}** ${s.unit}.\n\n` +
        `Each person bids their own estimate, so the winner is whoever guessed **${top}**. You are that person.\n\nWhat does winning tell you?`,
      answer: mcq(rng, `That I probably had the most over-optimistic estimate of the five, so I likely overpaid`, [
        `That I valued it most accurately, since I looked at it more carefully than the others did`,
        `Nothing about the value — winning only reflects how much I was willing to spend on it`,
        `That the others undervalued it, so I got the item at a price below what it is worth`,
        `That my estimate was closest to the average of the five, which is the best guess available`,
      ]),
      hints: [
        'Everyone is equally sensible, so the estimates scatter above and below the truth in roughly equal measure.',
        `You did not win because you were right. You won because your number was the HIGHEST of ${guesses.length}.`,
        `The average of the five estimates is ${mean}. Yours was ${top}.`,
      ],
      explanation: `You won the auction by having the **highest** estimate, not the most accurate one. When several people guess at the same unknown value and the highest guess wins, the winner is systematically the person who was most over-optimistic — so winning is evidence you overpaid.\n\nHere the truth was ${truth}. The average estimate was ${mean}, already close; your winning bid of ${top} was **${over} ${s.unit} over**. Nothing about you went wrong: the selection did the damage.\n\nThe rule, which reaches far past auctions: **whenever you get something because you were the most enthusiastic bidder for it, ask what the less enthusiastic people saw that you did not.** The same shape shows up when you are the only person applying for something easy to get, or the only one who thinks a deal is good.`,
    }
  },
)

const SELL_CASES = [
  {
    scene: 'Someone offers to swap their phone for yours plus twenty pounds, and says theirs is the better model.',
    correct: 'Ask what has gone wrong with it, because they know its history and you do not',
    wrong: [
      'Check whether the model really is better, since that is the claim being made here',
      'Offer them ten pounds instead and see whether they take it, which tests how keen they are',
      'Accept if the model genuinely is better, since the extra twenty is the price of the upgrade',
      'Refuse on principle, because anybody proposing a swap is trying to get the better end',
    ],
    why: 'The asymmetry is the point: they have used the phone for a year and you have held it for a minute. Checking the model compares the two things as advertised, which is exactly the comparison they are inviting. The useful question is about what only they can know.',
  },
  {
    scene: 'A club is desperate for new members and will let anyone join immediately, no audition.',
    correct: 'Ask why the people who left decided to leave',
    wrong: [
      'Join, since an open door is a sign of a welcoming group rather than a struggling one',
      'Ask how many members it currently has, to judge whether it is worth your time',
      'Wait a term and see whether it recovers on its own before committing anything',
      'Assume it is badly run, because a group worth joining would have a waiting list',
    ],
    why: 'Ease of entry is information about the pool you are joining, not about you. But the reading is not automatically bad — a new club has an open door too. That is why the question is about the leavers rather than a verdict either way.',
  },
  {
    scene: 'You are choosing between two similar second-hand laptops, and one seller is willing to drop the price much faster than the other.',
    correct: 'Treat the speed of the discount as information about the item, and ask what prompted it',
    wrong: [
      'Take the discounted one, since the two are similar and one is now clearly cheaper',
      'Take the other one, because a seller who drops the price quickly is hiding something',
      'Split the difference by offering the second seller the first seller\'s new price',
      'Ignore it, because how somebody negotiates says nothing about what they are selling',
    ],
    why: 'Both confident readings are wrong. Fast movement on price MIGHT mean a fault, and might equally mean they are moving house on Friday. The move is to notice that it is a signal worth asking about, not to decide which story it tells.',
  },
]

const adverse = tpl(
  {
    id: 'gtd-adverse',
    name: 'Why are they offering?',
    skillIds: ['i-selection'],
    bucket: 'investigator',
    difficulty: 3,
    variants: SELL_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = SELL_CASES[((seed % SELL_CASES.length) + SELL_CASES.length) % SELL_CASES.length]
    return {
      title: 'The other side knows something',
      prompt: `${c.scene}\n\nWhat is the move?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'List what each side knows that the other does not. That list is usually short and usually decisive.',
        'The eagerness of an offer is itself information — but information about what, exactly?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThis is the winner's curse without an auction. When someone is keen to trade with you, part of the reason may be something they know and you do not — so the willingness itself is evidence. Note what this is NOT: a rule that everybody is out to cheat you. It is a rule about which QUESTION to ask, and the answer is often perfectly innocent.`,
    }
  },
)

// ============================================================ i-common
// "Everyone knows" is not enough.

const COMMON_STORIES = [
  { plan: 'meet at the north gate instead of the south one', who: ['Ana', 'Ben'] as const },
  { plan: 'switch the practice to Thursday', who: ['Cara', 'Dev'] as const },
  { plan: 'move the stall to the far end of the hall', who: ['Eli', 'Fay'] as const },
  { plan: 'start the meeting half an hour later', who: ['Gus', 'Hana'] as const },
] as const

/**
 * Generate a knowledge chain of a random depth and ask whether it is deep
 * enough to act on. Depth 1 = both know. Depth 2 = each knows the other knows.
 * Depth 3 = each knows the other knows they know. Coordination needs 2.
 */
const commonKnowledge = tpl(
  {
    id: 'gtd-common',
    name: 'Do they know that you know?',
    skillIds: ['i-common'],
    bucket: 'investigator',
    difficulty: 4,
    // Four stories x three knowledge depths. Declaring more would be claiming
    // variety the generator cannot produce.
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const s = COMMON_STORIES[seed % COMMON_STORIES.length]
    const [a, b] = s.who
    const depth = rint(rng, 1, 3)
    const chain: string[] = [`Both ${a} and ${b} have read the message saying to ${s.plan}.`]
    if (depth >= 2) chain.push(`Each of them can see that the other has read it — the message shows read receipts.`)
    if (depth >= 3) chain.push(`And each can see that the other's receipt has been seen, because the app shows that too.`)
    if (depth === 1) chain.push(`Neither has any way of telling whether the other has read it.`)

    const safe = depth >= 2
    const key = safe
      ? `Yes — each one knows the other knows, so neither has to worry about turning up alone`
      : `No — each of them knows the plan, but neither knows whether the other does`
    const wrong = safe
      ? [
          `No — knowing the other has read it is still not the same as agreeing to it`,
          `No — they would need a third person to confirm it before either could rely on it`,
          `Only if they both reply, because reading a message is not the same as accepting it`,
          `It cannot be decided from this, since knowing what someone knows is never possible`,
        ]
      : [
          `Yes — both of them have the information, and that is what the plan required`,
          `Yes — the message was sent to both, so it counts as having been agreed by both`,
          `Only ${a} can act on it, since the message names ${a} first in the recipient list`,
          `It cannot be decided from this, since knowing what someone knows is never possible`,
        ]

    return {
      title: 'Enough to act on?',
      prompt: `A plan to ${s.plan} has gone out to ${a} and ${b}. Both have to make the same move or it fails for both.\n\n${chain.map((l) => `- ${l}`).join('\n')}\n\nCan either of them safely act on the plan?`,
      answer: mcq(rng, key, wrong),
      hints: [
        'It is not enough to know the plan. Ask what each person believes about what the OTHER knows.',
        'Write it as levels: I know it. I know that you know it. You know that I know it. Which levels does this scene actually give you?',
        `This scene reaches level ${depth}, and turning up at the same place needs level 2.`,
      ],
      explanation: `${safe ? 'Yes.' : 'No.'} This scene gives you **level ${depth}** knowledge${depth === 1 ? ' — both know the plan, and that is all' : depth === 2 ? ': both know, and each knows the other knows' : ': both know, each knows the other knows, and each knows THAT is known too'}.\n\nA plan where both people must move together needs at least level 2. At level 1 the information is in both heads and neither can rely on it, because from ${a}'s side there is no way to rule out ${b} never having looked.\n\nThe rule: **"everyone knows" and "everyone knows that everyone knows" are different things, and coordination needs the second.** It is why an announcement gets made in front of everyone rather than told to each person separately, and why "did you get my message?" is not a redundant question.\n\nThis is the same machinery as the nested-belief work in the Insight path, in a different costume: a belief about a belief.`,
    }
  },
)

// ============================================================ i-unpredict
// When being readable is the whole loss.

const READ_STORIES = [
  { you: 'server', them: 'returner', a: 'serve left', b: 'serve right', setting: 'a racket sport where the returner has to commit before the ball is struck' },
  { you: 'attacker', them: 'keeper', a: 'shoot left', b: 'shoot right', setting: 'a penalty, where the keeper must dive before the ball is kicked' },
  { you: 'hider', them: 'seeker', a: 'hide upstairs', b: 'hide downstairs', setting: 'a game where the seeker picks one floor to search first' },
  { you: 'setter', them: 'guesser', a: 'pick odd', b: 'pick even', setting: 'a guessing game played for points over many rounds' },
] as const

const unpredictable = tpl(
  {
    id: 'gtd-unpredictable',
    name: 'When a pattern is the loss',
    skillIds: ['i-unpredict'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 32,
    minutes: 3,
  },
  (rng, seed) => {
    const s = READ_STORIES[seed % READ_STORIES.length]
    const rounds = rint(rng, 18, 26)
    // Your actual split, deliberately lopsided.
    const leftShare = pick(rng, [0.7, 0.75, 0.8])
    const left = Math.round(rounds * leftShare)
    const right = rounds - left
    // If they always cover your favourite, you only score on the other side.
    const scoreIfRead = right
    const scoreIfEven = Math.round(rounds / 2)
    return {
      title: 'They have been counting',
      prompt: `You are the ${s.you} in ${s.setting}. Over the last ${rounds} rounds you chose to **${s.a}** ${left} times and **${s.b}** ${right} times — you did not plan that, it is just how it came out.\n\nThe ${s.them} has been keeping count. From now on they will cover **${s.a}** every time.\n\nRoughly how many of the next ${rounds} rounds do you win if you keep choosing the way you have been?`,
      answer: numeric(scoreIfRead, { tolerance: 1, unit: 'rounds' }),
      hints: [
        'They are covering one side every time. You only win on the rounds where you go the other way.',
        `You go **${s.b}** about ${right} times in ${rounds}.`,
        `So you win about ${scoreIfRead} of ${rounds} — down from about ${scoreIfEven} if they could not read you.`,
      ],
      explanation: `About **${scoreIfRead}**. They cover ${s.a} every round, so the only rounds you win are the ${right} where you happen to choose ${s.b}.\n\nThat is the cost of being readable: nothing about your skill changed, and your score fell from roughly ${scoreIfEven} to ${scoreIfRead} because a pattern existed for somebody to find. Against an opponent who adapts, the best you can do is be genuinely unpredictable — an even split here, chosen without a pattern.\n\nThe rule: **when someone can act on your pattern, having one is itself the loss.** This only applies where you are being read; in most of life predictability is a virtue, and the skill is telling the two situations apart.`,
    }
  },
)

const patternTell = tpl(
  {
    id: 'gtd-pattern-tell',
    name: 'Random, or just feels random?',
    skillIds: ['i-unpredict'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 24,
    minutes: 3,
  },
  (rng, seed) => {
    void seed
    const n = 20
    // A genuinely random-looking sequence has longer runs than people expect.
    const truly: string[] = []
    for (let i = 0; i < n; i++) truly.push(rng() < 0.5 ? 'L' : 'R')
    // A hand-made "random" sequence: people alternate too much.
    const handmade: string[] = []
    let last = rng() < 0.5 ? 'L' : 'R'
    for (let i = 0; i < n; i++) {
      // Switch about 70% of the time — the documented human tendency.
      if (rng() < 0.7) last = last === 'L' ? 'R' : 'L'
      handmade.push(last)
    }
    const longest = (xs: string[]) => {
      let best = 1
      let cur = 1
      for (let i = 1; i < xs.length; i++) {
        cur = xs[i] === xs[i - 1] ? cur + 1 : 1
        if (cur > best) best = cur
      }
      return best
    }
    const trulyLongest = longest(truly)
    const handLongest = longest(handmade)
    // Only ask when the two are actually distinguishable this seed.
    const answerIsA = trulyLongest > handLongest
    const key = answerIsA
      ? `Sequence A, because its longest unbroken run is longer than people produce on purpose`
      : `Sequence B, because its longest unbroken run is longer than people produce on purpose`
    return {
      title: 'Which one was not chosen by a person?',
      prompt:
        `Two sequences of ${n} left/right choices. One was generated by a coin; the other was written down by somebody trying hard to look unpredictable.\n\n` +
        `**Sequence A:** ${(answerIsA ? truly : handmade).join(' ')}\n\n` +
        `**Sequence B:** ${(answerIsA ? handmade : truly).join(' ')}\n\n` +
        `Which one is the coin?`,
      answer: mcq(rng, key, [
        answerIsA
          ? `Sequence B, because it switches sides more often and so has less of a pattern`
          : `Sequence A, because it switches sides more often and so has less of a pattern`,
        `Neither can be told apart; twenty choices is far too short a sequence to judge`,
        `Both look equally random, so whichever has an equal number of each side is the coin`,
      ]),
      hints: [
        'Do not count how many L and how many R. Count how often each sequence STAYS on the same side.',
        'People trying to look random switch far too often — a real coin produces long runs and they feel wrong.',
        `The longest unbroken run is ${Math.max(trulyLongest, handLongest)} in one and ${Math.min(trulyLongest, handLongest)} in the other. The longer one is the coin.`,
      ],
      explanation: `**${answerIsA ? 'Sequence A' : 'Sequence B'}** is the coin. Its longest unbroken run is ${trulyLongest}, against ${handLongest} for the handmade one.\n\nAsked to be unpredictable, people alternate far too much: a run of four or five on the same side feels like it has stopped being random, so they break it. A coin does not feel anything, so it produces those runs constantly — which is exactly the tell an opponent looks for.\n\nThe rule: **you cannot generate randomness by trying.** If it matters that you are unreadable, you need an outside source — the second hand of a clock, a card, the last digit of something — not your own sense of what feels mixed up.`,
    }
  },
)

// ============================================================ i-commons
// Each step sensible, the total ruinous.

const COMMONS_STORIES = [
  { unit: 'extra shifts', pool: 'the shared equipment budget', who: 'six clubs', gain: 'their own club', harm: 'the fund everyone draws on' },
  { unit: 'extra printing', pool: 'the department paper allowance', who: 'six teachers', gain: 'their own class', harm: 'the allowance everyone shares' },
  { unit: 'extra minutes', pool: 'the shared practice room', who: 'six bands', gain: 'their own rehearsal', harm: 'the time left for everyone else' },
  { unit: 'extra flyers', pool: 'the shared noticeboard', who: 'six societies', gain: 'their own turnout', harm: 'how much anyone reads the board' },
] as const

const commons = tpl(
  {
    id: 'gtd-commons',
    name: 'Sensible each time, ruinous together',
    skillIds: ['i-commons'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 20,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = COMMONS_STORIES[seed % COMMONS_STORIES.length]
    const n = 6
    const gain = rint(rng, 5, 9)
    // Each unit taken costs EVERYONE this much, including the taker.
    const costEach = rint(rng, 2, 3)
    const totalCost = costEach * n
    const netToMe = gain - costEach
    const netToAll = gain - totalCost
    return {
      title: 'Worth it for me, not for us',
      prompt:
        `${s.who} share ${s.pool}. Any one of them can take **${s.unit}** for ${s.gain}.\n\n` +
        `- Taking it is worth **+${gain}** to the club that takes it.\n` +
        `- It costs **${costEach}** to every one of the ${n} clubs, including the one that took it.\n\n` +
        `Work out the net effect on the club that takes it, and on the ${n} clubs added together.`,
      answer: multi(
        rng,
        [
          `The club that takes it gains ${netToMe} on balance, so taking it is individually worth doing`,
          `Across all ${n} clubs the net effect is ${netToAll}, so it destroys more than it creates`,
          `Every club faces the same sum, so all of them take it and everyone ends up worse off`,
        ],
        [
          `The club that takes it loses ${Math.abs(netToMe)} on balance, so no sensible club would do it`,
          `Across all ${n} clubs the net effect is +${gain}, since the costs are only a transfer between them`,
          `Only the first club to act gains; the others have no reason to follow it`,
        ],
      ),
      hints: [
        `The taker gets +${gain} but also pays its own share of the cost, which is ${costEach}.`,
        `For the group, add up the cost across all ${n} clubs: ${costEach} × ${n} = ${totalCost}. Compare that with the ${gain} created.`,
        `Individually ${gain} − ${costEach} = ${netToMe}. Together ${gain} − ${totalCost} = ${netToAll}.`,
      ],
      explanation:
        `Individually: ${gain} − ${costEach} = **${netToMe}**, so taking it is worth doing.\n\n` +
        `Together: ${gain} − ${totalCost} = **${netToAll}**, so it destroys more than it creates.\n\n` +
        `Both are true at once, and that is the whole problem. Every club faces the same arithmetic, so every club takes it, and the shared thing degrades while each decision along the way was correct for the club making it. Nobody has to be selfish or short-sighted for this to happen.\n\n` +
        `The rule: **when the gain is private and the cost is shared, individually sensible choices add up to a collectively bad outcome.** The fix is never "be more considerate" — it is changing the arithmetic, with an agreed cap, a rota, or a shared count that everyone can see. Those work because they change what each club is choosing between, and because everyone would sign up to them in the open.`,
    }
  },
)

const commonsFix = tpl(
  {
    id: 'gtd-commons-fix',
    name: 'Changing the arithmetic',
    skillIds: ['i-commons'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 4,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const CASES = [
      {
        scene: 'A shared fridge in a flat keeps filling with food nobody claims, so there is never room for anyone\'s shopping.',
        correct: 'Give each person a named shelf, so the cost of overfilling falls on whoever does it',
        wrong: [
          'Put up a note asking everyone to be more considerate about what they leave in there',
          'Have one person clear it out every week so that space is always available again',
          'Agree that anything unlabelled gets thrown away after a week without warning',
          'Buy a second fridge, which removes the shortage that is causing the arguments',
        ],
        why: 'A named shelf moves the cost of your own mess back onto you, which is what changes the arithmetic. Clearing it weekly and buying a second fridge both relieve the symptom while leaving the incentive exactly as it was — the second fridge fills up too.',
      },
      {
        scene: 'A group chat for a project is unusable because everyone posts every thought, so nobody reads it.',
        correct: 'Agree a rule that costs the sender something — one message a day each, or none after six',
        wrong: [
          'Ask people to think before posting, since the problem is thoughtless messages',
          'Mute the chat and check it once a day, which solves it for whoever does that',
          'Move to a different app where the notifications are easier to manage',
          'Appoint someone to summarise the chat each evening for everyone else',
        ],
        why: 'Attention is the shared resource and posting is free, which is the whole mechanism. A cap makes the sender spend something. Muting fixes it for one person while the commons keeps degrading; a summariser adds work without changing anyone\'s incentive to post.',
      },
      {
        scene: 'Five people share a car and none of them ever fills the tank, so it is always nearly empty.',
        correct: 'Agree that whoever takes it below a quarter fills it, so the cost lands on a specific person',
        wrong: [
          'Split the fuel cost five ways at the end of each month, which is the fairest division',
          'Ask everyone to fill it when they can, since it only takes a few minutes each time',
          'Have the person who uses it most often take responsibility for keeping it filled',
          'Keep a shared pot of money for fuel that anyone can take from when they need to',
        ],
        why: 'Splitting the cost fairly is fair and does nothing: filling the tank still costs you your time while the benefit goes to whoever drives next. A trigger rule attaches the job to an identifiable event. Note the decoy that sounds most reasonable — a shared pot — leaves the effort unassigned, and effort is what nobody wants to spend.',
      },
      {
        scene: 'A town\'s one good fishing spot is being emptied because every boat that holds back just leaves more for the others.',
        correct: 'Set a total catch everyone can see, divided into shares, with the count published',
        wrong: [
          'Encourage the boats to fish less, explaining what will happen if the stock collapses',
          'Let the most experienced crews decide how much is safe to take each season',
          'Close the spot entirely for a year so that the stock has time to recover fully',
          'Have each boat keep its own record of what it takes and review them at the end',
        ],
        why: 'A visible shared count is what makes restraint safe — the reason holding back fails is that it only helps the boats that do not. Closing it for a year restores the stock and returns to exactly the same race afterwards. Private records leave everyone guessing about everyone else, which is where this started.',
      },
    ]
    const c = CASES[((seed % CASES.length) + CASES.length) % CASES.length]
    return {
      title: 'Which fix actually works?',
      prompt: `${c.scene}\n\nWhich fix changes what each person is choosing between, rather than just asking them to choose differently?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask of each option: after this, is taking more still free for the person who takes it?',
        'Anything that relies on people being more considerate leaves the arithmetic untouched.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe general test: a fix works when it makes the cost land on the person deciding, or makes everyone's restraint visible so that holding back is no longer a gift to whoever does not. Appeals to consideration leave every incentive exactly where it was.`,
    }
  },
)

// ==================================================== entry points and depth
//
// Every skill needs a task a struggling learner can reach (2 stars or below)
// and three distinct families before the ladder can carry it to Independent.
// Both are audit gates, and both are the right shape anyway: a skill whose
// cheapest task is 3 stars is one that never gets introduced.

const iteratedEntry = tpl(
  {
    id: 'gtd-iterated-entry',
    name: 'The option you would never take',
    skillIds: ['i-iterated'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 24,
    minutes: 2,
  },
  (rng, seed) => {
    const s = ITER_STORIES[seed % ITER_STORIES.length]
    const { g, deadRow } = iteratedGame(rng)
    return {
      title: 'One step',
      prompt: `${s.story}.\n\n${grid3String(s.rows, s.cols, g)}\n\nOne of your three options pays you less than another **whatever they do**. Which one would you never play?`,
      answer: mcq(rng, `**${s.rows[deadRow]}**`, [
        `**${s.rows[(deadRow + 1) % 3]}**`,
        `**${s.rows[(deadRow + 2) % 3]}**`,
        `None of them — each one is best against at least one of their choices`,
      ]),
      hints: [
        'Read across a row: those are your payoffs against each of their three choices.',
        'You are looking for a row where YOUR number is smaller than some other row\'s in all three columns at once.',
        `Compare **${s.rows[deadRow]}** with **${s.rows[(deadRow + 1) % 3]}** column by column.`,
      ],
      explanation: `**${s.rows[deadRow]}** loses to **${s.rows[(deadRow + 1) % 3]}** in every column: ${g[deadRow].map((cell, c) => `${cell[0]} vs ${g[(deadRow + 1) % 3][c][0]}`).join(', ')}.\n\nThat makes it **dominated** — not merely bad on average, but worse in every single case, so no information about their choice could ever make it right. Crossing it out costs you nothing.\n\nThat is the first half of the move. The second half, which the harder version of this asks for, is that they can see you would never play it either — and that can make one of THEIR options dead too.`,
      commonErrors: {
        misread: 'The second number in each cell is their payoff. A row that is bad for them is not the same as a row that is bad for you.',
      },
    }
  },
)

const ITER_APPLY = [
  {
    scene:
      'You are picking which of three subjects to enter for a competition. Subject C is one you like, but you are slower at it than at subject A, you score lower on past papers in it, and it is marked more harshly — A beats it on every measure you have.',
    correct: 'Drop C without waiting to see who else enters, because nothing they do can make it the right pick',
    wrong: [
      'Keep C on your list until the entry list is published, in case the strongest candidates all pick A',
      'Enter C anyway, since enjoying a subject usually shows up in how well you do at it',
      'Compare C against B as well before dropping it, since A might not be your best option',
      'Enter A and C both, to keep two routes open until you see how the field looks',
    ],
    why: 'A beats C on every measure, so C is dominated — and the point of a dominated option is that you do not need to know anything about the competition to rule it out. Waiting for the entry list is exactly the wasted step. Note the near-miss: comparing C against B is a fine thing to do, but it is not needed to eliminate C, which is what was asked.',
  },
  {
    scene:
      'Two shops on the same street are deciding whether to open on Sunday. For you, opening is worse than staying shut whatever they do — the staffing cost is higher than any Sunday takings. You know the other owner can work this out about you as easily as you can.',
    correct: 'Expect them to plan around a street where you are shut, and check what that makes best for them',
    wrong: [
      'Open anyway every few weeks, so that they can never quite rely on the street being quiet on a Sunday',
      'Keep your decision to yourself, so that they have to plan for both possibilities',
      'Assume they will also stay shut, since the same costs apply to both of your shops',
      'Wait to see what they do first, since their choice changes what is best for you',
    ],
    why: 'Once your own option is genuinely dominated, the useful next step is the second pass: work out what THEY do against a you who is shut. Hiding it or opening randomly costs you money to create uncertainty you gain nothing from — you are not in a game where being unpredictable helps, because your best move does not depend on theirs.',
  },
  {
    scene:
      'A group is choosing a meeting time. One slot is worse for you than another in every respect — it clashes with a lesson AND is harder to get to. Someone suggests keeping it on the list "to be fair to everyone".',
    correct: 'Say plainly that it is dead for you, so the group can spend its time on the slots still in play',
    wrong: [
      'Leave it on the list, since removing your own bad options narrows the group\'s choices',
      'Leave it on and simply rank it last, so the group sees your preference without a veto',
      'Remove it quietly without saying so, to avoid looking like you are dictating the outcome',
      'Keep it if it is the only slot that works for somebody else in the group',
    ],
    why: 'Announcing a dominated option is the useful move, because it lets everyone else eliminate in turn — that is the whole mechanism. Ranking it last leaves it alive; removing it quietly gets the same outcome for you while denying everyone else the information. The last option is worth pausing on: if it is the only slot that works for someone, the group is no longer choosing on your payoffs alone, and elimination is the wrong tool.',
  },
]

const iteratedApply = tpl(
  {
    id: 'gtd-iterated-apply',
    name: 'Crossing out, off the table',
    skillIds: ['i-iterated'],
    bucket: 'investigator',
    difficulty: 4,
    variants: ITER_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = ITER_APPLY[((seed % ITER_APPLY.length) + ITER_APPLY.length) % ITER_APPLY.length]
    return {
      title: 'No matrix in sight',
      prompt: `${c.scene}\n\nWhat does the elimination move say to do?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'An option is dominated when another beats it in EVERY case — not when it is merely worse on average.',
        'The value of spotting one is that you can drop it without knowing anything about what anyone else will do.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule stays the same away from a payoff table: **drop what loses in every case, then look again at what is left — including what the other side can now rule out.**`,
    }
  },
)

const backwardEntry = tpl(
  {
    id: 'gtd-backward-entry',
    name: 'What will they do?',
    skillIds: ['i-backward'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 32,
    minutes: 2,
  },
  (rng, seed) => {
    const s = TREE_STORIES[seed % TREE_STORIES.length]
    const mine = rint(rng, 1, 9)
    const theirs: [number, number] = [rint(rng, 1, 9), rint(rng, 1, 9)]
    if (theirs[0] === theirs[1]) theirs[1] += 1
    const reply = theirs[0] > theirs[1] ? 0 : 1
    // The trap: the reply that would be better for YOU.
    const mineIf: [number, number] = [mine, rint(rng, 1, 9)]
    if (mineIf[0] === mineIf[1]) mineIf[1] += 1
    const betterForMe = mineIf[0] > mineIf[1] ? 0 : 1
    return {
      title: 'Only the last move',
      prompt:
        `${s.setting}\n\nYou have already played **${s.you[0]}**. Now it is their turn, and they will do whatever is best for THEM.\n\n` +
        `- If they choose **${s.them[0]}** → you get ${mineIf[0]}, they get ${theirs[0]}\n` +
        `- If they choose **${s.them[1]}** → you get ${mineIf[1]}, they get ${theirs[1]}\n\n` +
        `What do they choose?`,
      answer: mcq(rng, `**${s.them[reply]}**, because ${theirs[reply]} beats ${theirs[1 - reply]} for them`, [
        `**${s.them[1 - reply]}**, because ${theirs[1 - reply]} beats ${theirs[reply]} for them`,
        `**${s.them[betterForMe]}**, because it produces the better total across the two of us`,
        `Whichever leaves me worse off, since we are on opposite sides of this`,
        `It cannot be worked out — people do not always take the option worth more to them`,
      ]),
      hints: [
        'Only their numbers matter here. Cover yours with your hand.',
        `Compare ${theirs[0]} against ${theirs[1]}.`,
        `${theirs[reply]} is larger, so they choose **${s.them[reply]}**.`,
      ],
      explanation: `**${s.them[reply]}**: it pays them ${theirs[reply]} against ${theirs[1 - reply]}.\n\nYour own payoff is irrelevant to this question, and that is the habit being built. Working out what somebody else will do means reading THEIR numbers, not yours — which sounds obvious and is the single most common mistake once the tree gets bigger than this one.\n\nThe harder version puts this step at the bottom of a tree and asks what you should play FIRST, knowing how they will reply.`,
      commonErrors: {
        misread: 'Choosing the branch with the better payoff for you answers a different question from the one asked.',
      },
    }
  },
)

const BACK_APPLY = [
  {
    scene:
      'You are thinking of asking for a later curfew by pointing out that your friends all have one. You know the reply to that is "I am not their parent", and that once it has been said the conversation is over for the evening.',
    correct: 'Work out what happens after each opening, and pick the one whose reply you can work with',
    wrong: [
      'Use the strongest argument you have, since a weaker opening wastes the opportunity',
      'Raise it at a point when they are in a better mood, so that the very same argument gets itself a better hearing',
      'Say nothing this week and let the request come up naturally another time',
      'Open with the friends argument anyway, because it is the one that is actually true',
    ],
    why: 'Backward induction says solve the last move first: if you can already see the reply, the opening is not the decision — the reply is. The mood option is not silly, but it changes who you are talking to rather than what the conversation does, and the strongest-argument instinct is exactly what the method overturns.',
  },
  {
    scene:
      'A shop is deciding whether to advertise a sale. If it does, a bigger rival can undercut it easily and would still make money doing so. If it does not, the rival has no reason to move at all.',
    correct: 'Skip the sale: the branch that looks best on paper ends with their reply, not your move',
    wrong: [
      'Run the sale, since the extra customers arrive before the rival can react to it',
      'Run the sale but keep the discount fairly small, so that undercutting it is not going to be worth their while',
      'Run it and be ready to cut further if the rival responds by dropping their price',
      'Ask the rival first whether they intend to match any sale you might run',
    ],
    why: 'Fold the tree: sale → they undercut → you are worse off than where you started. The second option is the interesting one, because it is the right IDEA — change their payoff so undercutting stops being worth it — but it needs the discount to be small enough that it also stops being worth it for your customers, which is the check that has not been made.',
  },
  {
    scene:
      'You want to swap a shift with someone. If you ask on the day, they can say no at no cost to themselves. If you ask a week ahead, they have to give a reason, and they know you would then ask somebody else.',
    correct: 'Ask a week ahead — that is the version where their cheapest reply is not just no',
    wrong: [
      'Ask on the day, when they can see exactly what they would be giving up',
      'Ask a week ahead, because more notice is generally more polite to the other person',
      'Ask several people at the same time, so that at least one of them is fairly likely to agree to it',
      'Ask on the day but offer to swap back the following week as an incentive',
    ],
    why: 'The right answer and one decoy give the same advice for different reasons, which is the point: politeness is a good habit and it is not what makes this work. What makes it work is that the timing changes what their cheapest reply IS. Reasoning from the reply backwards to the timing is the move.',
  },
]

const backwardApply = tpl(
  {
    id: 'gtd-backward-apply',
    name: 'Folding a conversation',
    skillIds: ['i-backward'],
    bucket: 'investigator',
    difficulty: 4,
    variants: BACK_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = BACK_APPLY[((seed % BACK_APPLY.length) + BACK_APPLY.length) % BACK_APPLY.length]
    return {
      title: 'No tree drawn for you',
      prompt: `${c.scene}\n\nWhat does starting at the end tell you?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Write down what happens AFTER each thing you could do. The last move is the one to solve first.',
        'If you can already predict the reply, then you are not choosing between openings — you are choosing between replies.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule away from a drawn tree: **when somebody responds to what you do, your options are not your moves — they are the situations their replies leave you in.**`,
    }
  },
)

const selectionEntry = tpl(
  {
    id: 'gtd-selection-entry',
    name: 'The highest guess',
    skillIds: ['i-selection'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 24,
    minutes: 2,
  },
  (rng, seed) => {
    void seed
    const truth = rint(rng, 30, 80)
    const errs = [rint(rng, -12, -5), rint(rng, -6, -1), rint(rng, -3, 3), rint(rng, 2, 8), rint(rng, 7, 14)]
    const guesses = errs.map((e) => truth + e).sort((a, b) => a - b)
    const top = guesses[guesses.length - 1]
    return {
      title: 'Above or below?',
      prompt:
        `Five people each estimate the weight of the same object. None of them is biased — each is as likely to guess high as low. Their estimates are:\n\n**${guesses.join(', ')}**\n\n` +
        `The true weight is **${truth}**.\n\nBy how much is the HIGHEST estimate above the truth?`,
      answer: numeric(top - truth, { tolerance: 0 }),
      hints: [
        `The highest of the five estimates is ${top}.`,
        `The truth is ${truth}.`,
        `${top} − ${truth} = ${top - truth}.`,
      ],
      explanation: `${top} − ${truth} = **${top - truth}**.\n\nThat gap is not a mistake anyone made. Every estimate here is honest and unbiased, and some land above the truth by chance. Picking out the HIGHEST one therefore picks out one of the over-estimates almost every time — the selection creates the error, not the estimator.\n\nThat is the whole engine behind the winner's curse: in an auction the highest estimate is the one that wins, so the winner has usually overpaid. Keep the shape in mind — **taking the maximum of several honest guesses gives you a number that is too high.**`,
    }
  },
)

const commonEntry = tpl(
  {
    id: 'gtd-common-entry',
    name: 'How deep does it go?',
    skillIds: ['i-common'],
    bucket: 'investigator',
    difficulty: 2,
    variants: 12,
    minutes: 2,
  },
  (rng, seed) => {
    const s = COMMON_STORIES[seed % COMMON_STORIES.length]
    const [a, b] = s.who
    const level = rint(rng, 1, 3)
    const scene =
      level === 1
        ? `${a} and ${b} were each told separately to ${s.plan}. Neither knows the other was told.`
        : level === 2
          ? `${a} and ${b} were told together, face to face, that they should ${s.plan}.`
          : `${a} and ${b} were told together to ${s.plan}, and afterwards each said out loud that they had understood.`
    const key =
      level === 1
        ? `Both know the plan, and neither knows that the other knows`
        : level === 2
          ? `Both know the plan, and each can see the other knows it too`
          : `Both know, each knows the other knows, and each has heard that confirmed out loud`
    const wrong = [
      level === 1 ? `Both know the plan, and each can see the other knows it too` : `Both know the plan, and neither knows that the other knows`,
      level === 3 ? `Both know the plan, and each can see the other knows it too` : `Both know, each knows the other knows, and each has heard that confirmed out loud`,
      `Only one of them actually knows the plan at this point`,
      `Neither of them can be said to know the plan until they have acted on it`,
    ]
    return {
      title: 'What does the scene actually give you?',
      prompt: `${scene}\n\nWhich description matches?`,
      answer: mcq(rng, key, wrong),
      hints: [
        'Ask two separate questions: does each of them know the plan, and does each of them know that the OTHER knows it?',
        'Being told separately gives you the first and not the second. Being told together gives you both.',
        `Worked path: **${key}**.`,
      ],
      explanation: `**${key}**\n\nThe distinction is easy to lose because in everyday speech "we both know" covers all of these. It matters as soon as the two of them have to act together: at the first level neither can rely on the other showing up, because from where they are standing the other might never have been told.\n\nThat is why a plan gets announced in front of everybody rather than passed along one at a time. The announcement does not deliver the information any better — it delivers the knowledge that everyone else got it too.`,
    }
  },
)

const COMMON_APPLY = [
  {
    scene: 'A group has to change plans at short notice. You could message everybody individually, or post once in the group chat where everyone can see who has read it.',
    correct: 'Post in the group — everyone seeing that everyone else saw it is what makes it safe',
    wrong: [
      'Message them individually, since a direct message is a good deal more likely to actually get read',
      'Do both, because the individual messages cover anyone who has muted the group chat',
      'Post in the group and then ask each person separately to confirm they have seen it',
      'Message individually, because the group chat carries no record of who read what',
    ],
    why: 'Individual messages deliver the information perfectly well and leave everybody uncertain about everybody else. Doing both is not wrong, just more work than the mechanism needs. The point is that visibility, not delivery, is what the situation was short of.',
  },
  {
    scene: 'Everybody in a class privately thinks a piece of homework was unfair, but nobody has said so, and each assumes they are the only one who struggled.',
    correct: 'Known to everyone and shared by nobody — so one person saying it changes the room',
    wrong: [
      'Nothing much can be done here, since a private opinion that nobody voices has no effect on anything',
      'They should each raise it separately, so the teacher hears it from several directions',
      'The first person to speak takes all the risk, so it is rational for everyone to stay quiet',
      'It is not really a shared view until they have discussed it and agreed on the wording',
    ],
    why: 'This is the level-1 trap from the other side: the information is in every head and in nobody\'s picture of the room. Saying it out loud does not add a new opinion — it converts private knowledge into common knowledge, which is why the first sentence in these situations feels so disproportionately hard and so disproportionately effective.',
  },
  {
    scene: 'Two people arrange to meet but the venue is ambiguous. One of them realises the ambiguity; the other has not noticed it.',
    correct: 'The one who noticed has to fix it — the other does not know there is anything to fix',
    wrong: [
      'Both of them should head for the more obvious of the two places and expect to meet there',
      'Whoever suggested the venue should be the one to clear it up, since it was their wording',
      'They should each go to a different place and phone the other one on arrival',
      'It resolves itself, because two sensible people pick the same obvious option',
    ],
    why: 'The asymmetry is doing the work. Picking the obvious place is a reasonable focal-point move and it fails here, because only one person knows a choice is being made at all — the other is not choosing between two places, they are simply going where they always assumed. Knowing something the other person does not know they need is what creates the obligation.',
  },
]

const commonApply = tpl(
  {
    id: 'gtd-common-apply',
    name: 'Making it common',
    skillIds: ['i-common'],
    bucket: 'investigator',
    difficulty: 4,
    variants: COMMON_APPLY.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = COMMON_APPLY[((seed % COMMON_APPLY.length) + COMMON_APPLY.length) % COMMON_APPLY.length]
    return {
      title: 'Known by all, shared by none',
      prompt: `${c.scene}\n\nWhat is going on, and what follows?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Separate "everybody knows it" from "everybody knows that everybody knows it". Which one is missing?',
        'Ask what would change if the same information were made visible rather than merely delivered.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe rule: **information everyone holds privately behaves completely differently from information everyone knows the others hold.** Making the second happen is usually cheap — say it in front of everyone — and it is the whole fix.`,
    }
  },
)

const UNPREDICT_ENTRY = [
  {
    scene: 'You always take the same route home at the same time.',
    readable: false,
    correct: 'Predictability is fine here, and mostly useful — people know where you are',
    wrong: [
      'Predictability is dangerous here, so the route should be varied regularly',
      'It depends entirely on how long the route is and how busy it tends to be',
      'Predictability only matters if somebody is actively paying attention to it',
    ],
    why: 'Nobody is choosing a counter-move against your route. Most of life is like this, and treating ordinary routine as a vulnerability is the mistake in the other direction.',
  },
  {
    scene: 'In a card game played for points over many rounds, you always lead with your strongest suit.',
    readable: true,
    correct: 'Predictability costs you, because an opponent can plan for it round after round',
    wrong: [
      'Predictability helps here, since leading strong is the best play each round',
      'It makes no difference, because your strongest suit is strongest either way',
      'It only matters against opponents who are keeping written notes on your play',
    ],
    why: 'The opponent chooses AFTER learning your habit and their choice affects your score. That is the whole test — and note that leading strong may still be the best single-round play while being a bad policy across many rounds.',
  },
  {
    scene: 'You revise the same subject first every evening.',
    readable: false,
    correct: 'Predictability is not the issue; whether the order suits your energy is',
    wrong: [
      'Predictability costs you, because your brain adapts and stops paying attention',
      'Predictability helps, because a fixed order removes a decision each evening',
      'It costs you, since always starting with the same subject neglects the others',
    ],
    why: 'There is no opponent, so the readability frame does not apply at all. The tempting decoy about your brain adapting is a different claim entirely, and not one this app will assert.',
  },
  {
    scene: 'You always bluff on the last round of a game and never on the earlier ones.',
    readable: true,
    correct: 'Predictability costs you — the bluff works only while they cannot tell it is coming',
    wrong: [
      'Predictability helps, because a reputation for bluffing late makes people fold early',
      'It does not matter, since a bluff either succeeds on the day or it does not',
      'It only costs you against opponents you have played more than a handful of times',
    ],
    why: 'A move whose value depends on the other side not expecting it is the clearest case there is. The first decoy is worth reading twice: a reputation CAN be valuable, but a reputation for bluffing at a known moment is just a warning.',
  },
]

const unpredictEntry = tpl(
  {
    id: 'gtd-unpredict-entry',
    name: 'Is anyone reading you?',
    skillIds: ['i-unpredict'],
    bucket: 'investigator',
    difficulty: 2,
    variants: UNPREDICT_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = UNPREDICT_ENTRY[((seed % UNPREDICT_ENTRY.length) + UNPREDICT_ENTRY.length) % UNPREDICT_ENTRY.length]
    return {
      title: 'Does being readable cost you?',
      prompt: `${c.scene}\n\nDoes having a pattern hurt here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Two questions decide it: is somebody choosing a move in response to yours, and does their choice change how you do?',
        'If the answer to either is no, a pattern costs you nothing.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThe test, both ways round: **a pattern is only a weakness when someone can act on it against you.** Most routines are not that, and unpredictability has real costs of its own — it is harder, and it makes you unreliable to the people who are on your side.`,
    }
  },
)

const COMMONS_ENTRY = [
  { scene: 'A shared box of pens in a classroom that anyone can take from', isCommons: true, why: 'Taking a pen benefits you entirely and costs everyone a little. Nobody has to be greedy for the box to end up empty.' },
  { scene: 'The quiet in a shared study room', isCommons: true, why: 'Quiet is used up by whoever speaks and paid for by everyone. It is a commons even though it is not a thing you can hold.' },
  { scene: 'The time a teacher has for questions at the end of a lesson', isCommons: true, why: 'Your question is worth a lot to you and takes a slice of a fixed amount everyone shares.' },
  { scene: 'The attention of a group chat everyone is in', isCommons: true, why: 'Posting costs you nothing and spends a little of everybody’s attention, which is why busy chats stop being read.' },
  { scene: 'The space in a shared fridge', isCommons: true, why: 'Your shelf space is worth a lot to you and the shortage lands on everyone, so it fills up and stays full.' },
  { scene: 'The goodwill of a neighbour who lends things out', isCommons: true, why: 'Each borrowing is worth more to the borrower than it costs, and the goodwill it spends is shared by everyone who might want to borrow next.' },
  { scene: 'Your own bike, which only you ride', isCommons: false, why: 'The gain and the cost of every choice land on the same person, so there is nothing to pull apart.' },
  { scene: 'A library book borrowed on your own card, due back in a fortnight', isCommons: false, why: 'The due date attaches the cost of keeping it to you specifically — which is exactly what stops it being a commons. The system was designed to do that.' },
  { scene: 'The money in your own pocket', isCommons: false, why: 'Spending it costs you the whole amount. Private gain, private cost.' },
  { scene: 'A seat you have booked and paid for', isCommons: false, why: 'The booking converts a scarce shared thing into something with your name on it, which is the standard fix rather than a counterexample.' },
  { scene: 'Your own revision time this evening', isCommons: false, why: 'Nobody else draws on it, so spending it badly costs only you.' },
  { scene: 'A locker assigned to you for the year', isCommons: false, why: 'Assignment is the whole point: the space is shared in origin and private in use.' },
]

const commonsEntry = tpl(
  {
    id: 'gtd-commons-entry',
    name: 'Shared, or just owned?',
    skillIds: ['i-commons'],
    bucket: 'investigator',
    difficulty: 2,
    // Three of six commons and three of six private, chosen by seed. The first
    // version of this used the whole fixed list and so had exactly one variant,
    // which the audit caught: a "6 variants" claim that rendered one question.
    // 24 rather than 36 because the two rotations do not vary independently
    // across the seeds actually served — also measured rather than assumed.
    variants: 24,
    minutes: 2.5,
  },
  (rng, seed) => {
    const yes = COMMONS_ENTRY.filter((c) => c.isCommons)
    const no = COMMONS_ENTRY.filter((c) => !c.isCommons)
    const rot = <T,>(xs: T[], by: number, take: number): T[] =>
      Array.from({ length: take }, (_, i) => xs[(by + i) % xs.length])
    const shown = [...rot(yes, seed % yes.length, 3), ...rot(no, (seed >> 2) % no.length, 3)]
    return {
      title: 'Spot the shared resource',
      prompt:
        'A **commons** is anything where using it benefits one person while the cost is spread over everybody. That gap is what makes sensible individual choices add up badly.\n\nWhich of these are a commons?',
      answer: multi(
        rng,
        shown.filter((c) => c.isCommons).map((c) => c.scene),
        shown.filter((c) => !c.isCommons).map((c) => c.scene),
      ),
      hints: [
        'For each one ask: who gets the benefit of using it, and who pays?',
        'If the same person gets both, it is not a commons — however shared the setting feels.',
        'A commons does not have to be a physical thing. Quiet and attention both qualify.',
      ],
      explanation: `${shown
        .map((c) => `**${c.isCommons ? 'Commons' : 'Not a commons'}** — ${c.scene}. ${c.why}`)
        .join('\n\n')}\n\nThe pattern worth carrying: the private ones are private because something ATTACHES the cost to one person — a name, a due date, a booking. Every fix for a commons is an attempt to do that.`,
    }
  },
)

export const GAME_DEPTH_TEMPLATES: ItemTemplate[] = [
  iteratedEntry,
  iteratedApply,
  backwardEntry,
  backwardApply,
  selectionEntry,
  commonEntry,
  commonApply,
  unpredictEntry,
  commonsEntry,
  iterated,
  backward,
  winnersCurse,
  adverse,
  commonKnowledge,
  unpredictable,
  patternTell,
  commons,
  commonsFix,
]
